// End-to-end test of Load from CrawlerForge in the built page. Needs Playwright (see README).
// Usage: node tests/crawlerforge-test.js "path/to/a COPY of the fillable character sheet"
// Links the sheet through a stand-in file handle, loads tests/fixtures/crawlerforge-crawler.json (a made-up crawler)
// and tests/fixtures/crawlerforge-pack.json, opens their Loot Boxes, saves to tests/out/crawlerforge-saved.pdf
// and checks the fields.
// The PDF you point at is never written.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const engine = fs.readFileSync(path.join(__dirname, "..", "src", "pdf-engine.js"), "utf8");
const PDF = new Function(engine + "\nreturn PDF;")();
const FIX = path.join(__dirname, "fixtures");

let fails = 0;
function check(label, ok, got){ if(!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + label + (ok ? "" : " (got " + JSON.stringify(got) + ")")); }

async function link(p, bytes){
  await p.evaluate(async b64 => {
    let data = Uint8Array.from(atob(b64), c => c.charCodeAt(0)), mod = 1;
    window.__saved = null;
    const handle = {
      kind: "file", name: "sheet.pdf",
      queryPermission: async () => "granted", requestPermission: async () => "granted",
      getFile: async () => ({ name: "sheet.pdf", lastModified: mod, arrayBuffer: async () => data.slice().buffer }),
      createWritable: async () => { const parts = []; return { write: async b => parts.push(new Uint8Array(b)), close: async () => { data = parts[0]; mod++; window.__saved = data; } }; }
    };
    await window.__cheat.linkWithHandle(handle);
  }, Buffer.from(bytes).toString("base64"));
}

(async () => {
  const sheet = process.argv[2];
  if (!sheet) { console.error("Give the path to a copy of the fillable sheet."); process.exit(1); }
  const dist = path.resolve(__dirname, "..", "dist");
  const built = fs.readdirSync(dist).find(f => /^Crawler_Companion_v[\d.]+\.html$/.test(f));
  if (!built) { console.error("No built page in dist/. Run python build.py first."); process.exit(1); }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  let downloads = 0;
  p.on("pageerror", e => errors.push(e.message));
  p.on("download", () => downloads++);
  p.on("dialog", d => d.accept());
  await p.goto("file://" + path.join(dist, built));
  await p.evaluate(() => { try{ localStorage.setItem("dcc-cheat-autosave", "0"); }catch(e){} });
  await p.reload();
  await link(p, fs.readFileSync(sheet));
  const num = async id => +(await p.inputValue(id));
  const data = () => p.evaluate(() => window.__cheat.data());
  // pick a file and wait until the preview shows it (the page reads the file asynchronously)
  async function pickFile(file){
    await p.evaluate(() => { document.getElementById("cf-title").textContent = ""; });
    await p.setInputFiles("#cf-file", file);
    await p.waitForFunction(() => document.getElementById("cf-title").textContent !== "");
  }

  await p.click("#tt-gear");
  const s0 = {}; for (const k of ["str", "int", "con", "dex", "cha", "arm", "evb"]) s0[k] = await num("#cr-" + k);
  const s0u = {}; for (const k of ["str", "int", "con", "dex", "cha"]) s0u[k] = await num("#cu-" + k);
  const lvl0 = await num("#cr-lvl");
  // the feet slot on the sheet, which CrawlerForge leaves empty; give it something if the sheet has nothing there
  if (!(await data()).gear.feet) await p.evaluate(() => { window.__cheat.data().gear.feet = "Sheet Boots"; });
  const feet0 = (await data()).gear.feet;

  // a file that isn't CrawlerForge is refused without changing anything
  await p.setInputFiles("#cf-file", { name: "other.json", mimeType: "application/json", buffer: Buffer.from('{"hello": 1}') });
  await p.waitForFunction(() => document.getElementById("cf-msg").textContent !== "");
  check("a JSON file that isn't CrawlerForge is refused", /doesn.t look like/.test(await p.textContent("#cf-msg")) && !(await p.isVisible("#cf-box")), await p.textContent("#cf-msg"));

  // the crawler file: preview first
  await pickFile(path.join(FIX, "crawlerforge-crawler.json"));
  check("the preview names the crawler", (await p.textContent("#cf-title")) === "Testcrawler from CrawlerForge", await p.textContent("#cf-title"));
  const sum = await p.textContent("#cf-sum");
  check("the summary counts worn and carried items, unopened boxes, Gold after a tithe, and Junk", /^4 items worn, 3 items carried, 2 unopened Loot Boxes, 175 Gold, 7 Misc\. Junk, Hotlist of 3/.test(sum), sum);
  const rows = await p.$$eval("#cf-list li", l => l.map(x => x.innerText));
  check("an undone item and an opened box are left out", rows.length === 9 && !rows.some(r => /Retracted|Opened Box/.test(r)), rows);
  const warn = await p.textContent("#cf-warn");
  check("the warning mentions crafting", /crafting/.test(warn), warn);
  check("the warning says which slots keep the sheet's gear", /nothing worn in [^.]*Feet[^.]*keep what/.test(warn) && !/nothing worn in [^.]*Head/.test(warn), warn);
  check("Stats and Skills are offered for a crawler file", await p.isVisible("#cf-core") && await p.isVisible("#cf-skills") && await p.isChecked("#cf-core") && await p.isChecked("#cf-skills"), "");
  // this part checks the gear on its own; the whole-crawler sync is checked at the end
  await p.uncheck("#cf-core"); await p.uncheck("#cf-skills");
  check("with Stats and Skills off, the preview lists no crawler changes", !(await p.isVisible("#cf-chg")), await p.$$eval("#cf-chg li", l => l.map(x => x.innerText)));

  await p.click("#cf-go");
  const d = await data();
  check("head slot loaded with its bonuses", d.gear.head === "Fixture Hood (+2 Int, DR 1)", d.gear.head);
  check("the dagger took the greatsword's place, gloves stay on", d.gear.hands === "Gloves: Fixture Gloves; Main: Fixture Dagger (+1 Sword Fighting)", d.gear.hands);
  check("the ring's All Stats and Evade are written", d.gear.acc === "Fixture Ring (+1 All Stats, Evade +1)", d.gear.acc);
  check("an undone item isn't on the feet, which keep the sheet's boots", d.gear.feet === feet0, d.gear.feet);
  const inv = d.inv.filter(r => r.name.trim());
  const row = n => inv.find(r => r.name === n) || {};
  check("Gold loaded, less the tithe", row("Gold").qty === "175", row("Gold"));
  check("Misc. Junk loaded", row("Misc. Junk").qty === "7", row("Misc. Junk"));
  check("the used potion counts 4, with its use", row("Fixture Mana Potion").qty === "4" && row("Fixture Mana Potion").notes === "Use: full Mana.", row("Fixture Mana Potion"));
  check("the unequipped greatsword went to the Inventory with its bonus", row("Fixture Greatsword").notes === "Two-handed: +2 Str.", row("Fixture Greatsword"));
  check("a loot box item came across with its description", row("Fixture Scroll").qty === "2" && row("Fixture Scroll").notes === "A scroll of testing.", row("Fixture Scroll"));
  check("an unopened box is an Inventory row that says what it holds", row("Fixture Silver Box").notes === "Loot Box: Silver, Fixture. Holds: Fixture Amulet [Accessory, +1 Cha]; 1d10x100 Gold; Skill Potion +2 (your pick); Stat Potion +1 Con. Smells of fixtures.", row("Fixture Silver Box"));
  check("an achievement's box came across", row("Fixture Bronze Box").notes === "Loot Box: Bronze, Fixture. Holds: 5 Junk; Skill Fixture Skill at Rank 2. A small test box.", row("Fixture Bronze Box"));
  check("Inventory holds only what CrawlerForge has", inv.length === 7, inv.map(r => r.name));
  check("Hotlist loaded", d.hot[0] === "Fixture Spell" && d.hot[2] === "Fixture Mana Potion" && d.hot[3] === "", d.hot);
  check("Enhanced Int moved by the hood and ring", await num("#cr-int") === s0.int + 3, await num("#cr-int"));
  check("Enhanced Str moved by the ring only", await num("#cr-str") === s0.str + 1, await num("#cr-str"));
  check("Armor moved by the hood", await num("#cr-arm") === s0.arm + 1, await num("#cr-arm"));
  check("Evade Buffs moved by the ring", await num("#cr-evb") === s0.evb + 1, await num("#cr-evb"));
  check("the gear message says what moved", /Loaded gear and Inventory, Gold and Junk, Hotlist from Testcrawler/.test(await p.textContent("#gear-log")), await p.textContent("#gear-log"));
  check("with Stats and Skills off, the Level and Unenhanced Stats stay", await num("#cu-int") === s0u.int && await num("#cr-lvl") === lvl0, [await num("#cu-int"), await num("#cr-lvl")]);

  // loading the same file again changes nothing more, and can empty the slots CrawlerForge leaves empty
  await pickFile(path.join(FIX, "crawlerforge-crawler.json"));
  await p.check("#cf-clear");
  await p.click("#cf-go");
  check("the empty-slots option empties the feet", (await data()).gear.feet === "", (await data()).gear.feet);
  check("loading again doesn't add the bonuses twice", await num("#cr-int") === s0.int + 3, await num("#cr-int"));
  check("loading again doesn't double the Inventory", (await data()).inv.filter(r => r.name.trim()).length === 7, "");

  // the gloves keep their CrawlerForge note when edited
  await p.click('#gear-slots li:has-text("Fixture Gloves") button:has-text("Edit")');
  check("a worn item keeps its CrawlerForge note", /Move \+5 ft/.test(await p.inputValue("#ie-notes")), await p.inputValue("#ie-notes"));
  await p.click("#ie-cancel");

  // open a box: its item, Gold, a Skill potion you pick and a Stat potion
  const qty = async n => { const r = (await data()).inv.find(x => x.name === n); return r ? +r.qty : 0; };
  const sk0 = (await data()).skills[0], skr0 = +sk0.rank || 0, skmax = /Max 20/.test(sk0.notes) ? 20 : 15;
  const con0 = await num("#cr-con"), conu0 = await num("#cu-con"), gold1 = await qty("Gold");
  await p.click('#inv-rows tr:has-text("Fixture Silver Box") button:has-text("Open")');
  check("opening shows what's inside", (await p.textContent("#bx-title")) === "Open Fixture Silver Box" && (await p.$$eval("#bx-list li", l => l.length)) === 5, await p.textContent("#bx-title"));
  await p.click("#bx-go");
  check("a Skill potion needs a Skill picked", /Pick a Skill/.test(await p.textContent("#bx-warn")), await p.textContent("#bx-warn"));
  await p.fill('#bx-list input[data-bx]', sk0.name.trim());
  await p.click("#bx-go");
  const g = await qty("Gold") - gold1;
  check("the box's 1d10x100 Gold was rolled and added", g >= 100 && g <= 1000 && g % 100 === 0, g);
  check("its item went into the Inventory with its bonus", ((await data()).inv.find(r => r.name === "Fixture Amulet") || {}).notes === "Accessory: +1 Cha.", "");
  check("the Skill potion raised the picked Skill", +((await data()).skills.find(x => x.name === sk0.name) || {}).rank === Math.min(skmax, skr0 + 2), (await data()).skills[0]);
  check("the Stat potion raised Unenhanced and Enhanced Con", await num("#cr-con") === con0 + 1 && await num("#cu-con") === conu0 + 1, [await num("#cu-con"), await num("#cr-con")]);
  check("the opened box left the Inventory", !(await qty("Fixture Silver Box")), "");
  check("the message lists what came out", /Opened Fixture Silver Box: .*Fixture Amulet.*Gold \(1d10x100 rolled \d+, x 100\).*Smells of fixtures/.test(await p.textContent("#gear-log")), await p.textContent("#gear-log"));

  // a box that teaches a Skill
  const junk1 = await qty("Misc. Junk");
  await p.click('#inv-rows tr:has-text("Fixture Bronze Box") button:has-text("Open")');
  await p.click("#bx-go");
  check("the box's Junk was added", await qty("Misc. Junk") === junk1 + 5, await qty("Misc. Junk"));
  check("the box's Skill is on the sheet at its Rank", ((await data()).skills.find(x => x.name === "Fixture Skill") || {}).rank === "2", "");

  // a box typed on the sheet by hand reads back from its wording
  await p.click("#it-add");
  await p.fill("#ie-name", "Typed Box"); await p.fill("#ie-notes", "Loot Box: Bronze. Holds: 12 Gold; Test Rope x2 [Use heal 1 slot].");
  await p.click("#ie-save");
  const gold2 = await qty("Gold");
  await p.click('#inv-rows tr:has-text("Typed Box") button:has-text("Open")');
  await p.click("#bx-go");
  check("a typed box gives its Gold", await qty("Gold") === gold2 + 12, await qty("Gold"));
  check("a typed box gives its items with their use", await qty("Test Rope") === 2 && ((await data()).inv.find(r => r.name === "Test Rope") || {}).notes === "Use: heal 1 slot.", "");

  // a pack: pick items and Loot Boxes to add
  await pickFile(path.join(FIX, "crawlerforge-pack.json"));
  check("a pack lists its items and Loot Boxes", (await p.$$eval("#cf-list li", l => l.length)) === 4 && (await p.textContent("#cf-go")) === "Add to Inventory", [await p.$$eval("#cf-list li", l => l.map(x => x.innerText)), await p.textContent("#cf-go"), await p.textContent("#cf-msg")]);
  check("the pack preview explains random boxes", /random box/.test(await p.textContent("#cf-warn")), await p.textContent("#cf-warn"));
  await p.uncheck('#cf-list li:has-text("Fixture Boots") input');
  await p.click("#cf-go");
  const inv2 = (await data()).inv.filter(r => r.name.trim());
  const ham = inv2.find(r => r.name === "Fixture Hammer") || {};
  check("the ticked pack item is in the Inventory with its drawback", ham.notes === "Two-handed: +3 Str, -1 Dex. Heavy.", ham);
  check("the unticked one isn't", !inv2.some(r => r.name === "Fixture Boots"), inv2.map(r => r.name));
  check("a pack box points at the pack's own items", (inv2.find(r => r.name === "Fixture Pack Box") || {}).notes === "Loot Box: Gold, Fixture. Holds: Fixture Boots [Feet, +1 Dex]; 100 Gold; Stat Potion +2 (your pick).", inv2.find(r => r.name === "Fixture Pack Box"));
  check("a random pack box says what gets rolled", (inv2.find(r => r.name === "Fixture Random Box") || {}).notes === "Loot Box: Platinum, Fixture, random. Holds: 1 item; 2 consumables; 1 potion; 2d6x1000 Gold.", inv2.find(r => r.name === "Fixture Random Box"));
  check("adding a pack item doesn't move stats", await num("#cr-str") === s0.str + 1, await num("#cr-str"));

  // a random box gives its tier's Gold and leaves the rest to the GM
  const gold3 = await qty("Gold");
  await p.click('#inv-rows tr:has-text("Fixture Random Box") button:has-text("Open")');
  await p.click("#bx-go");
  const g3 = await qty("Gold") - gold3;
  check("a random Platinum box rolls 2d6x1000 Gold", g3 >= 2000 && g3 <= 12000 && g3 % 1000 === 0, g3);
  check("and says the GM rolls the rest", /GM rolls the rest: 1 item, 2 consumables, 1 potion\./.test(await p.textContent("#gear-log")), await p.textContent("#gear-log"));

  // the second Stat potion is fine, a third gets the lifetime warning
  const str1 = await num("#cr-str");
  await p.click('#inv-rows tr:has-text("Fixture Pack Box") button:has-text("Open")');
  check("a second Stat potion gets no warning", (await p.textContent("#bx-warn")) === "", await p.textContent("#bx-warn"));
  await p.selectOption('#bx-list select[data-bx]', "str");
  await p.click("#bx-go");
  check("the picked Stat went up by 2", await num("#cr-str") === str1 + 2, await num("#cr-str"));
  await pickFile(path.join(FIX, "crawlerforge-pack.json"));
  for (const n of ["Fixture Boots", "Fixture Hammer", "Fixture Random Box"]) await p.uncheck('#cf-list li:has-text("' + n + '") input');
  await p.click("#cf-go");
  await p.click('#inv-rows tr:has-text("Fixture Pack Box") button:has-text("Open")');
  check("a third Stat potion warns about the lifetime limit", /3 Stat potions; a crawler can only ever drink two/.test(await p.textContent("#bx-warn")), await p.textContent("#bx-warn"));
  await p.click("#bx-cancel");

  // Export everything: crawlers and the Forge
  const crawlerFile = JSON.parse(fs.readFileSync(path.join(FIX, "crawlerforge-crawler.json"), "utf8")), packFile = JSON.parse(fs.readFileSync(path.join(FIX, "crawlerforge-pack.json"), "utf8"));
  const everything = { kind: "everything", schemaVersion: 1, exportedAt: "2026-11-02T10:00:00.000Z", crawlers: [crawlerFile], forge: { schemaVersion: 1, items: packFile.items, lootBoxes: packFile.lootBoxes } };
  await pickFile({ name: "crawlerforge-everything-20261102.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(everything)) });
  const opts = await p.$$eval("#cf-who option", o => o.map(x => x.textContent));
  check("a backup offers its crawler and its Forge", opts.length === 2 && opts[0] === "Testcrawler" && /^Your Forge: 2 items and 2 Loot Boxes$/.test(opts[1]), opts);
  await p.selectOption("#cf-who", "forge");
  check("picking the Forge shows its items and Loot Boxes", (await p.$$eval("#cf-list li", l => l.length)) === 4 && !(await p.isVisible("#cf-opts")), "");
  await p.click("#cf-cancel");

  // save and read the PDF back
  await p.click("#sb-save");
  await p.waitForFunction(() => window.__saved);
  const saved = Buffer.from(await p.evaluate(() => { let s = ""; window.__saved.forEach(b => s += String.fromCharCode(b)); return btoa(s); }), "base64");
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "out", "crawlerforge-saved.pdf"), saved);
  const doc = await PDF.open(new Uint8Array(saved)), f = doc.fieldMap, v = n => f[n] ? f[n].value : "(missing)";
  check("Head slot saved", v("Text Field 92") === "Fixture Hood (+2 Int, DR 1)", v("Text Field 92"));
  check("Hands/Holding saved", v("Text Field 95") === "Gloves: Fixture Gloves; Main: Fixture Dagger (+1 Sword Fighting)", v("Text Field 95"));
  check("Hotlist box 1 saved", v("Text Field 81") === "Fixture Spell", v("Text Field 81"));
  check("Enhanced Int saved", +v("Text Field 34") === s0.int + 3, v("Text Field 34"));
  let gold = null;
  for (let k = 0; k < 20; k++) if (/^gold$/i.test(v("Text Field " + (223 + 3 * k)))) gold = v("Text Field " + (224 + 3 * k));
  check("Gold saved", gold === String(await qty("Gold")), gold);
  let boxNotes = null;
  for (let k = 0; k < 20; k++) if (v("Text Field " + (223 + 3 * k)) === "Fixture Pack Box") boxNotes = v("Text Field " + (225 + 3 * k));
  check("an unopened box saved with its wording", /^Loot Box: Gold, Fixture\. Holds: /.test(boxNotes || ""), boxNotes);

  await link(p, saved);
  check("relinking the saved sheet shows no pending changes", (await p.textContent("#sb-count")) === "No unsaved changes", await p.textContent("#sb-count"));
  await p.click("#tt-gear");
  check("the saved box can still be opened", await p.isVisible('#inv-rows tr:has-text("Fixture Pack Box") button:has-text("Open")'), "");

  // ---------- the whole crawler: Level, Floor, Stats, Health, Mana, AI Favor, Evade, Popularity, story and Skills ----------
  await link(p, fs.readFileSync(sheet));
  await p.click("#tt-gear");
  // the sheet's Skills: a short name for a CrawlerForge Skill, one CrawlerForge removed, the Heal Spell it doesn't list,
  // and an untrained try CrawlerForge doesn't have
  await p.evaluate(() => {
    const D = window.__cheat.data();
    D.skills = [
      {row: 0, name: "Unarmed", rank: "3", stat: "Str +2", type: "Evade", notes: "My own note.", mark: false},
      {row: 1, name: "Perception", rank: "1", stat: "Int +3", type: "Unopposed", notes: "", mark: false},
      {row: 2, name: "Lockpicking", rank: "2", stat: "Dex +2", type: "Unopposed", notes: "", mark: false},
      {row: 3, name: "Heal", rank: "1", stat: "None", type: "Passive", notes: "Everyone has it.", mark: false},
      {row: 4, name: "Juggling", rank: "0", stat: "Dex +2", type: "Unopposed", notes: "", mark: true}
    ];
  });
  const u0 = {}, e0 = {};
  for (const k of ["str", "int", "con", "dex", "cha"]) { u0[k] = await num("#cu-" + k); e0[k] = await num("#cr-" + k); }
  await pickFile(path.join(FIX, "crawlerforge-sync.json"));
  await p.check("#cf-core"); await p.check("#cf-skills");
  const lines = await p.$$eval("#cf-chg li", l => l.map(x => x.innerText));
  const has = re => lines.some(t => re.test(t));
  check("the preview lists the Level from play periods and levels gained, not the undone play period", has(/^Level \d+ to 3$/), lines);
  check("the preview lists the Floor", has(/^Floor \d to 2$/), lines);
  check("the preview lists a corrected Unenhanced Stat", has(/^Dexterity \(Unenhanced\) \d+ to 4/), lines);
  check("the preview lists Health, Mana, AI Favor, Evade Buffs and Popularity", has(/^Health Bar \d+ to 9 slots$/) && has(/^Mana \d+ to 3$/) && has(/^AI Favor \d+ to 2$/) && has(/^Evade Buffs \d+ to 2$/) && has(/^Popularity .* to 2$/), lines);
  check("a shorter sheet name matches its CrawlerForge Skill", has(/^Unarmed \(Unarmed Combat in CrawlerForge\) Rank 3 to 4$/) && has(/^Unarmed \(Unarmed Combat in CrawlerForge\) ticked for advancement$/), lines);
  check("advancement from the play period", has(/^Perception Rank 1 to 2$/), lines);
  check("new Skills, with the one learned untrained and the untrained try still pending", has(/^Adds Detect Trap \(Rank 2\), Climbing \(Rank 1\), Catcher \(Rank 1\), Swimming \(Rank 0, ticked\)$/), lines);
  check("a Skill removed in CrawlerForge is removed", has(/^Removes Lockpicking/), lines);
  check("an untrained tick CrawlerForge doesn't have is cleared, and Heal is kept", has(/^Clears the untrained tick on Juggling$/) && has(/^Keeps Heal,/), lines);
  check("the warning names what isn't brought across", /Buffs/.test(await p.textContent("#cf-warn")), await p.textContent("#cf-warn"));
  await p.uncheck("#cf-skills");
  check("leaving out Skills drops them from the preview", !(await p.$$eval("#cf-chg li", l => l.map(x => x.innerText))).some(t => /Rank|Adds|Removes/.test(t)), "");
  await p.check("#cf-skills");
  await p.click("#cf-go");
  check("the message says Stats and Skills came across", /Level and Stats, Skills from Synccrawler/.test(await p.textContent("#gear-log")), await p.textContent("#gear-log"));
  check("Unenhanced Dex follows CrawlerForge and Enhanced moves by the same", await num("#cu-dex") === 4 && await num("#cr-dex") === e0.dex + 4 - u0.dex, [await num("#cu-dex"), await num("#cr-dex")]);
  check("Unenhanced Int follows CrawlerForge", await num("#cu-int") === 5 && await num("#cr-int") === e0.int + 5 - u0.int, [await num("#cu-int"), await num("#cr-int")]);
  check("Level, AI Favor and Evade Buffs", await num("#cr-lvl") === 3 && await num("#cr-fav") === 2 && await num("#cr-evb") === 2, [await num("#cr-lvl"), await num("#cr-fav"), await num("#cr-evb")]);
  const sk = (await data()).skills, sr = n => sk.find(s => s.name === n) || {};
  check("Skill Ranks and ticks", sr("Unarmed").rank === "4" && sr("Unarmed").mark && sr("Unarmed").notes === "My own note." && sr("Perception").rank === "2" && sr("Perception").mark, [sr("Unarmed"), sr("Perception")]);
  check("a new Skill gets its Stat, what it rolls against and a short note", sr("Detect Trap").rank === "2" && !sr("Detect Trap").mark && /^Int [+-]\d+$/.test(sr("Detect Trap").stat) && sr("Detect Trap").type === "Unopposed" && sr("Detect Trap").notes === "When you suspect a trap, this is the Skill you want. Make an Unopposed Skill Check.", sr("Detect Trap"));
  check("a Passive Interrupt Skill", sr("Catcher").type === "Passive, Interrupt" && sr("Catcher").stat === "None", sr("Catcher"));
  check("the untrained try waits at Rank 0, ticked", sr("Swimming").rank === "0" && sr("Swimming").mark, sr("Swimming"));
  check("Lockpicking is gone, Heal stays, Juggling's tick is cleared", !sk.some(s => s.name === "Lockpicking") && sr("Heal").rank === "1" && sr("Juggling").mark === false, sk.map(s => s.name));
  check("the freed row is reused", sr("Detect Trap").row === 2, sr("Detect Trap").row);
  // loading the same file again has nothing left to change
  await pickFile(path.join(FIX, "crawlerforge-sync.json"));
  const again = await p.$$eval("#cf-chg li", l => l.map(x => x.innerText));
  check("loading again changes nothing", !again.some(t => /Rank|Adds|Removes|Level|Floor|Mana|Health|Evade|AI Favor|Popularity|Unenhanced|ticked|tick/.test(t)), again);
  await p.click("#cf-cancel");
  await p.evaluate(() => { window.__saved = null; });
  await p.click("#sb-save");
  await p.waitForFunction(() => window.__saved !== null);
  const saved2 = Buffer.from(await p.evaluate(() => { let s = ""; window.__saved.forEach(b => s += String.fromCharCode(b)); return btoa(s); }), "base64");
  fs.writeFileSync(path.join(__dirname, "out", "crawlerforge-sync-saved.pdf"), saved2);
  const d2 = await PDF.open(new Uint8Array(saved2)), f2 = d2.fieldMap, v2 = n => f2[n] ? f2[n].value : "(missing)";
  check("Level and Floor saved", v2("level") === "3" && v2("Floor") === "2", [v2("level"), v2("Floor")]);
  check("Dex saved", v2("Text Field 47") === "4" && +v2("Text Field 46") === e0.dex + 4 - u0.dex, [v2("Text Field 47"), v2("Text Field 46")]);
  check("AI Favor, Evade Buffs and Current Mana saved", v2("Text Field 32") === "2" && v2("Text Field 25") === "2" && v2("Text Field 37") === "3", [v2("Text Field 32"), v2("Text Field 25"), v2("Text Field 37")]);
  check("one Health slot lost", v2("Check Box6 1 8") === true && v2("Check Box6 1 7") !== true, [v2("Check Box6 1 8"), v2("Check Box6 1 7")]);
  check("Popularity, Past Trauma and Regrets saved", v2("Text Field 98") === "2" && v2("Text Field 99") === "Fixture trauma" && v2("Text Field 101") === "Fixture regret", [v2("Text Field 98"), v2("Text Field 99"), v2("Text Field 101")]);
  const rowOf = n => { for (let k = 0; k < 20; k++) if (v2("Text Field " + (103 + 6 * k)) === n) return k; return -1; };
  const kU = rowOf("Unarmed"), kD = rowOf("Detect Trap"), kS = rowOf("Swimming");
  check("Skill rows saved", kU === 0 && v2("Text Field 104") === "4" && v2("Check Box 1") === true && kD === 2 && v2("Text Field " + (104 + 6 * kD)) === "2" && kS >= 0 && v2("Check Box " + (kS + 1)) === true && rowOf("Lockpicking") < 0, [kU, kD, kS]);
  check("Fixture Elixir came across with one left", (await data()).inv.some(r => r.name === "Fixture Elixir" && r.qty === "1"), (await data()).inv.filter(r => r.name));

  check("no page errors", !errors.length, errors);
  check("no downloads", !downloads, downloads);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed. Saved tests/out/crawlerforge-saved.pdf.");
  process.exit(fails ? 1 : 0);
})();
