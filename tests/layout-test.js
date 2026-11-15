// Test of the page layout: the Rules drawer, rule links, Buffs and Debuffs tags, Recent rolls,
// Find a Skill and the tabs. Needs Playwright (see README); no sheet needed.
// Usage: node tests/layout-test.js
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

let fails = 0;
function check(label, ok, got){ if(!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + label + (ok ? "" : " (got " + JSON.stringify(got) + ")")); }

(async () => {
  const dist = path.resolve(__dirname, "..", "dist");
  const built = fs.readdirSync(dist).find(f => /^Crawler_Companion_v[\d.]+\.html$/.test(f));
  if (!built) { console.error("No built page in dist/. Run python build.py first."); process.exit(1); }
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  p.on("pageerror", e => errors.push(e.message));
  await p.goto("file://" + path.join(dist, built));
  const visible = sel => p.$eval(sel, e => !!(e.offsetWidth || e.offsetHeight) && getComputedStyle(e).visibility !== "hidden");
  const text = sel => p.$eval(sel, e => e.textContent.trim());

  // the Rules drawer
  check("the Rules drawer starts closed", !(await visible("#rules")), "");
  await p.click("#rules-open");
  await p.waitForTimeout(300);
  check("Rules opens the drawer", await visible("#rules"), "");
  check("the page behind is inert while it's open", await p.$eval("#app", e => e.hasAttribute("inert")), "");
  check("it shows one rule section", (await p.$$eval("#rules .band:not(.tab-off)", b => b.length)) === 1, "");
  await p.click('#rules .hbnav a[href="#debuffs"]');
  check("its nav switches section", (await p.$$eval("#rules .band:not(.tab-off)", b => b.map(x => x.id))).join() === "debuffs", "");
  await p.fill("#q", "prone");
  check("searching shows matching sections", (await p.$$eval("#rules .band:not(.hide-s)", b => b.length)) >= 1, "");
  await p.keyboard.press("Escape");
  check("Escape clears the search first", (await p.inputValue("#q")) === "" && await visible("#rules"), "");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  check("a second Escape closes the drawer", !(await visible("#rules")), "");
  check("the page is usable again", !(await p.$eval("#app", e => e.hasAttribute("inert"))), "");

  // a rule link opens the drawer at that rule
  await p.click('a.rule[href="#r-grinding"]');
  await p.waitForTimeout(400);
  check("a rule link opens the drawer", await visible("#rules"), "");
  check("at the right section", (await p.$$eval("#rules .band:not(.tab-off)", b => b.map(x => x.id))).join() === "growth", "");
  const top = await p.$eval("#r-grinding", e => e.getBoundingClientRect().top - document.getElementById("rules-body").getBoundingClientRect().top);
  check("scrolled to the rule", top >= -2 && top < 60, top);
  await p.click("#rules-close");
  await p.waitForTimeout(300);

  // floor
  await p.click('.stairs button[data-floor="3"]');
  check("the floor targets follow the floor", (await p.$$eval(".targets .lv", l => l.map(x => x.textContent))).slice(0, 2).join() === "16,13", "");
  check("so do the drawer's numbers", (await text("#rules .print-floor .lv")) === "3", "");

  // Buffs and Debuffs
  check("no Debuffs to start with", (await p.$$eval("#db-tags .dtag", t => t.length)) === 0, "");
  await p.selectOption("#db-add", "minor");
  await p.selectOption("#db-add", "fat");
  await p.selectOption("#db-add", "fat");
  check("added Debuffs show as tags", (await p.$$eval("#db-tags .dtag", t => t.map(x => x.textContent.trim()))).join("|") === "Minor Injury|Fatigued 2", await p.$$eval("#db-tags .dtag", t => t.map(x => x.textContent.trim())));
  check("the Check tool counts them", /Minor Injury −2, Fatigued 2 −2/.test(await text("#ck-pen")), await text("#ck-pen"));
  await p.click('#db-tags .dtag:last-child .x');
  check("removing Fatigued takes off one stack", (await p.inputValue("#ck-fat")) === "1", await p.inputValue("#ck-fat"));
  await p.click('[data-rest="long"]');
  check("a long rest clears Fatigued", (await p.inputValue("#ck-fat")) === "0" && (await p.$$eval("#db-tags .dtag", t => t.length)) === 1, await p.inputValue("#ck-fat"));

  // Recent rolls
  check("Recent rolls starts empty", (await p.$$eval("#dt-hist li", l => l.length)) === 0, "");
  await p.click("#ck-roll");
  check("a Check goes in Recent rolls", (await p.$$eval("#dt-hist li", l => l.length)) === 1 && /Skill Check: /.test(await text("#dt-hist li")), await text("#dt-hist li"));
  await p.click("#tt-damage");
  await p.click("#dm-roll");
  check("a damage roll goes in too", /damage/.test(await text("#dt-hist li")), await text("#dt-hist li"));
  await p.click("#tt-dice");
  await p.click('#tp-dice [data-roll="d20"]');
  check("and dice from the Dice tab", (await p.$$eval("#dt-hist li", l => l.length)) === 3, "");
  await p.click("#tt-check");
  await p.fill("#ck-d1", "");
  await p.fill("#ck-d1", "15");
  await p.press("#ck-d1", "Tab");
  check("a d20 typed in from real dice goes in once", (await p.$$eval("#dt-hist li", l => l.length)) === 4, await p.$$eval("#dt-hist li", l => l.length));

  // tabs: the crawler's tabs and the roll tools are separate
  await p.click("#tt-gear");
  check("Gear & Inventory opens", await visible("#tp-gear") && !(await visible("#tp-skills")), "");
  check("the roll tools stay as they were", await visible("#tp-check"), "");

  // Find a Skill
  await p.click("#tt-skills");
  await p.click("#sk-add"); await p.fill("#se-name", "Lockpicking"); await p.fill("#se-rank", "3"); await p.click("#se-save");
  await p.click("#sk-add"); await p.fill("#se-name", "Dodge"); await p.fill("#se-rank", "4"); await p.click("#se-save");
  await p.fill("#sk-q", "dod");
  check("Find a Skill hides the others", (await p.$$eval("#sk-rows tr:not(.hide) td.nm b", b => b.map(x => x.textContent))).join() === "Dodge", await p.$$eval("#sk-rows tr:not(.hide) td.nm b", b => b.map(x => x.textContent)));
  await p.fill("#sk-q", "");
  await p.click("#sk-f-tick");
  check("Ticked shows none when none are ticked", (await p.$$eval("#sk-rows tr:not(.hide)", r => r.length)) === 0 && await visible("#sk-none"), "");
  await p.click("#sk-f-all");
  check("All shows them again", (await p.$$eval("#sk-rows tr:not(.hide)", r => r.length)) === 2, "");

  // More menu
  await p.click("#more summary");
  check("More opens its menu", await p.$eval("#more", d => d.open), "");
  await p.click("#tt-pet");
  check("clicking elsewhere closes it", !(await p.$eval("#more", d => d.open)), "");

  // a link to a rule in the address opens the drawer there
  await p.goto("about:blank");
  await p.goto("file://" + path.join(dist, built) + "#round");
  await p.waitForTimeout(300);
  check("#round in the address opens the drawer at Combat round", await visible("#rules") && (await p.$$eval("#rules .band:not(.tab-off)", b => b.map(x => x.id))).join() === "round", "");

  // phone width: one column
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto("file://" + path.join(dist, built));
  const wide = await p.evaluate(() => document.documentElement.scrollWidth);
  check("no sideways scrolling at phone width", wide <= 390, wide);

  check("no page errors", !errors.length, errors);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed.");
  process.exit(fails ? 1 : 0);
})();
