// End-to-end test of the Skills, Gear, Pet and Notes tabs in the built page. Needs Playwright (see README).
// Usage: node tests/tools-test.js "path/to/a COPY of the fillable character sheet"
// Links the sheet through a stand-in file handle, uses each tab, saves to tests/out/tools-saved.pdf,
// reopens that file with the PDF engine and checks the fields, then relinks it and expects no pending changes.
// The PDF you point at is never written.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const engine = fs.readFileSync(path.join(__dirname, "..", "src", "pdf-engine.js"), "utf8");
const PDF = new Function(engine + "\nreturn PDF;")();

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
  const built = fs.readdirSync(dist).find(f => /^Crawler_Cheat_Sheet_v[\d.]+\.html$/.test(f));
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

  // Gear: a worn item moves Enhanced Int and Armor; taking it off moves them back
  await p.click("#tt-gear");
  const int0 = await num("#cr-int"), arm0 = await num("#cr-arm");
  await p.click("#it-add");
  await p.fill("#ie-name", "Test Helmet"); await p.selectOption("#ie-slot", "head");
  await p.fill("#ie-int", "2"); await p.fill("#ie-dr", "1"); await p.fill("#ie-sk", "+2 Perception");
  await p.click("#ie-save");
  await p.click('#inv-rows tr:has-text("Test Helmet") button:has-text("Equip")');
  check("equipping +2 Int raises Enhanced Int", await num("#cr-int") === int0 + 2, await num("#cr-int"));
  check("equipping DR 1 raises Armor", await num("#cr-arm") === arm0 + 1, await num("#cr-arm"));
  await p.click('#gear-slots .slot:has-text("Test Helmet") button:has-text("Unequip")');
  check("unequipping puts Int back", await num("#cr-int") === int0, await num("#cr-int"));
  await p.click('#inv-rows tr:has-text("Test Helmet") button:has-text("Equip")');
  await p.fill("#inv-gold", "12"); await p.dispatchEvent("#inv-gold", "change");
  await p.fill('#hot-grid textarea[data-hot="9"]', "Test hotlist entry");

  // Hands: one-handed items fill main then off hand; a two-handed item takes both and sends them back
  const str0 = await num("#cr-str");
  async function addItem(name, slot, fields){
    await p.click("#it-add"); await p.fill("#ie-name", name); await p.selectOption("#ie-slot", slot);
    for (const [id, val] of Object.entries(fields)) await p.fill(id, val);
    await p.click("#ie-save");
    await p.click('#inv-rows tr:has-text("' + name + '") button:has-text("Equip")');
  }
  await addItem("Test Sword", "hand", { "#ie-str": "1" });
  await addItem("Test Buckler", "hand", { "#ie-ev": "1" });
  check("two one-handed items go to main and off hand", (await p.evaluate(() => window.__cheat.data().gear.hands)) === "Main: Test Sword (+1 Str); Off: Test Buckler (Evade +1)", await p.evaluate(() => window.__cheat.data().gear.hands));
  await addItem("Test Greatsword", "twohand", { "#ie-str": "2" });
  check("a two-handed item takes both hands", (await p.evaluate(() => window.__cheat.data().gear.hands)) === "Both: Test Greatsword (+2 Str)", await p.evaluate(() => window.__cheat.data().gear.hands));
  check("Str counts only the greatsword", await num("#cr-str") === str0 + 2, await num("#cr-str"));
  check("the sword and buckler went back to the Inventory", (await p.$$eval("#inv-rows tr", r => r.map(x => x.innerText).join("|"))).includes("Test Buckler"), "");
  // All Stats
  const int1 = await num("#cr-int");
  await addItem("Test Ring", "acc", { "#ie-all": "1", "#ie-int": "1" });
  check("All Stats is written once", /Test Ring \(\+1 All Stats, \+1 Int\)/.test(await p.evaluate(() => window.__cheat.data().gear.acc)), await p.evaluate(() => window.__cheat.data().gear.acc));
  check("All Stats +1 and Int +1 raise Int by 2", await num("#cr-int") === int1 + 2, await num("#cr-int"));
  // Gold takes +5 and -2
  await p.fill("#inv-gold", "+5"); await p.press("#inv-gold", "Enter");
  await p.fill("#inv-gold", "-2"); await p.press("#inv-gold", "Enter");
  check("Gold 12, +5, -2 makes 15", (await p.inputValue("#inv-gold")) === "15", await p.inputValue("#inv-gold"));
  // filter and quantity buttons
  await p.click('#inv-cats button:has-text("Weapons")');
  const shown = await p.$$eval("#inv-rows tr b", b => b.map(x => x.textContent));
  check("the Weapons filter shows only weapons", shown.length >= 2 && shown.every(n => /Sword|Buckler/.test(n)), shown);
  await p.click('#inv-cats button:has-text("All")');
  await p.click('#inv-rows tr:has-text("Test Sword") button[aria-label^="One more"]');
  check("the + button adds one", (await p.$eval('#inv-rows tr:has-text("Test Sword") td.qty span', e => e.textContent)) === "2", "");

  // Skills: add one, tick it, run the 2-hour check
  await p.click("#tt-skills");
  await p.click("#sk-add");
  await p.fill("#se-name", "Test Spell"); await p.fill("#se-rank", "3"); await p.selectOption("#se-stat", "int");
  await p.fill("#se-type", "Evade"); await p.fill("#se-adv", "1");
  await p.click("#se-save");
  await p.click('#sk-rows tr:has-text("Test Spell") input[type=checkbox]');
  await p.click("#sk-2h");
  const rk = await p.$eval('#sk-rows tr:has-text("Test Spell") .rk', e => +e.textContent);
  check("2-hour check leaves the Rank at 3 or 4", rk === 3 || rk === 4, rk);
  check("2-hour check clears the tick", !(await p.$eval('#sk-rows tr:has-text("Test Spell") input[type=checkbox]', e => e.checked)), true);

  // Untrained: on Floor 1 a Skill you try goes on the sheet at Rank 0, and the 2-hour check teaches it
  await p.evaluate(() => document.querySelector('.stairs button[data-floor="1"]').click());
  await p.click("#tt-skills");
  await p.fill("#st-name", "Test Climbing"); await p.click("#st-go");
  await p.click("#ck-roll");
  await p.click("#tt-skills");
  check("the untried Skill is on the sheet at Rank 0 and ticked", await p.$eval('#sk-rows tr:has-text("Test Climbing")', r => r.querySelector(".rk").textContent === "0" && r.querySelector("input").checked), false);
  await p.click("#sk-2h");
  check("the 2-hour check teaches it at Rank 1", (await p.$eval('#sk-rows tr:has-text("Test Climbing") .rk', e => e.textContent)) === "1", "");

  // Check tab: Other bonus is for one roll and doesn't follow you to another kind of roll or Skill
  await p.click("#tt-check");
  await p.click('#tp-check .seg button[data-kind="attack"]');
  await p.fill("#ck-other", "3");
  await p.click('#tp-check .seg button[data-kind="stat"]');
  check("Other bonus clears when the kind of roll changes", (await p.inputValue("#ck-other")) === "0", await p.inputValue("#ck-other"));
  await p.fill("#ck-other", "2");
  await p.selectOption("#ck-src", "s:0");
  check("Other bonus clears when you pick a Skill", (await p.inputValue("#ck-other")) === "0", await p.inputValue("#ck-other"));

  // Pet
  await p.click("#tt-pet");
  if (await p.isVisible("#pet-new")) await p.click("#pet-new");
  await p.fill("#pt-name", "Testpet"); await p.selectOption("#pt-role", "Utility");
  await p.fill("#pt-special", "Heightened Senses");
  await p.fill("#pt-dmg", "1"); await p.click("#pt-hit");

  // Notes
  await p.click("#tt-notes");
  await p.fill("#nt-notes", "Test note line 1\nTest note line 2");

  const changes = await p.$$eval("#sb-changes li", l => l.map(x => x.textContent));
  check("the change list shows the edits", changes.length >= 8, changes);
  await p.click("#sb-save");
  await p.waitForFunction(() => window.__saved);
  const saved = Buffer.from(await p.evaluate(() => { let s = ""; window.__saved.forEach(b => s += String.fromCharCode(b)); return btoa(s); }), "base64");
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "out", "tools-saved.pdf"), saved);

  const doc = await PDF.open(new Uint8Array(saved)), f = doc.fieldMap, v = n => f[n] ? f[n].value : "(missing)";
  check("Head slot saved with its bonuses", v("Text Field 92") === "Test Helmet (+2 Int, DR 1, +2 Perception)", v("Text Field 92"));
  check("Enhanced Int saved (helmet +2, ring +2)", +v("Text Field 34") === int0 + 4, v("Text Field 34"));
  check("Armor saved", +v("Text Field 29") === arm0 + 1, v("Text Field 29"));
  let gold = null, spell = null;
  for (let k = 0; k < 20; k++) if (/^gold$/i.test(v("Text Field " + (223 + 3 * k)))) gold = v("Text Field " + (224 + 3 * k));
  for (let k = 0; k < 20; k++) if (v("Text Field " + (103 + 6 * k)) === "Test Spell") spell = v("Text Field " + (107 + 6 * k));
  check("Gold saved", gold === "15", gold);
  check("Hands/Holding saved", v("Text Field 95") === "Both: Test Greatsword (+2 Str)", v("Text Field 95"));
  check("Skill saved with its Adv tag", /Adv \+1/.test(spell || ""), spell);
  check("Hotlist box 10 saved", v("Text Field 90") === "Test hotlist entry", v("Text Field 90"));
  check("pet name, attitude and role saved in Special", /^Testpet, Bonded, Utility\. Heightened Senses$/.test(v("Text Field 3086")), v("Text Field 3086"));
  check("notes saved", v("Text Field 102") === "Test note line 1\nTest note line 2", v("Text Field 102"));

  await link(p, saved);
  check("relinking the saved sheet shows no pending changes", (await p.textContent("#sb-count")) === "No unsaved changes", await p.textContent("#sb-count"));
  await p.click("#tt-pet");
  check("pet name comes back from the sheet", (await p.inputValue("#pt-name")) === "Testpet", await p.inputValue("#pt-name"));

  check("no page errors", !errors.length, errors);
  check("no downloads", !downloads, downloads);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed. Saved tests/out/tools-saved.pdf.");
  process.exit(fails ? 1 : 0);
})();
