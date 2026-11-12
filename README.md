# Crawler Companion

Source for `Crawler_Companion_v<version>.html`, the rules reference, calculator and character manager for the Dungeon Crawler Carl Roleplaying Game. It was called Crawler Cheat Sheet before version 1.4.0. The finished page is one self-contained HTML file that works offline. The readable source is in `src/`, and the built page is in `dist/`.

## Folder layout

| Path | What it is |
| --- | --- |
| `src/index.html` | Page markup: hero, section tabs, every rules section, the Crawler panel and the footer with Check for updates. Has the placeholders `/*__STYLES__*/`, `/*__SCRIPT__*/` and `__VERSION__`. |
| `src/styles.css` | All styling, including light and dark themes, phone layout and print layout. Headings use the system font Bahnschrift (built into Windows), with Arial Narrow as the fallback. |
| `src/main.js` | Everything interactive: floor picker, tabs, search, hover equations, the calculators, linking the character sheet, and Check for updates. `/*__PDFENGINE__*/` is where `pdf-engine.js` goes, and `/*__TOOLS__*/` is where `tools.js` goes. |
| `src/tools.js` | The Skills, Gear, Pet and Notes tabs: reading those parts of the sheet, the change list for them, and saving them back. |
| `src/pdf-engine.js` | A small PDF reader and writer with no libraries. Reads form fields and saves changes as an incremental update. |
| `build.py` | Combines the pieces into one HTML file. |
| `dist/Crawler_Companion_v1.6.0.html` | The built page, named with its version. This is the file to open or share. |
| `CHANGELOG.md` | What changed in each version. |
| `guides/Crawler_Companion_Player_Guide.pdf` | The Player Guide: every Crawler tab, Load from CrawlerForge and Loot Boxes. Attached to every release. |
| `guides/Crawler_Companion_GM_Loot_Box_Guide.pdf` | The GM Guide: making Loot Boxes in CrawlerForge and getting them to players. Attached to every release. |
| `tests/test-pdf-engine.js` | Round-trip test for the PDF engine (Node 18+, no packages). |
| `tests/browser-test.js` | End-to-end test of the built page in Chromium (needs Playwright). |
| `tests/tools-test.js` | End-to-end test of the Skills, Gear, Pet and Notes tabs (needs Playwright). |
| `tests/crawlerforge-test.js` | End-to-end test of Load from CrawlerForge (needs Playwright). |
| `tests/drive-test.js` | End-to-end test of Open from Google Drive, with Google faked (needs Playwright). |
| `tests/fixtures/` | Made-up CrawlerForge crawler files and a pack for that test. |
| `tests/update-test.js` | Test of Check for updates, with GitHub's answers made up (needs Playwright). |
| `.github/workflows/release.yml` | Publishes a GitHub Release with the built page and the guides attached whenever a new version reaches `main` or a version tag is pushed, puts the page on GitHub Pages, and replaces the guides on the newest release when they change. |

## Building

```
python build.py
```

This writes `dist/Crawler_Companion_v<version>.html`, taking the version from the first `## 1.2.3` heading in `CHANGELOG.md` and stamping it wherever `index.html` says `__VERSION__`. It removes the previous version's file from `dist/` (git keeps it in the history). Pass a path to write somewhere else: `python build.py test.html`. It needs Python 3.8 or newer and no extra packages.

Edit the files in `src/`, then run the build again. Don't edit the built HTML by hand; the next build overwrites it.

## Where things live in the code

- **Floor-aware numbers.** In `index.html`, a yellow number is a `span.lv`. It has `data-f` (a formula using `F`, like `10+2*F`), `data-d` (dice plus floor, like `1d6`), or `data-lk` (a lookup, like `timer` or `gold`). `setFloor()` in `main.js` fills them in and writes their hover equations. Formulas must have the form `A+B*F` (either part optional); they are parsed, never run as code.
- **Floor-only rules.** Any element with `data-floors="1-2"` or `data-floors="3-5"` is dimmed when the chosen floor is outside that range.
- **Hover equations.** Any element with a `data-eq` attribute shows a tooltip with that text (new lines allowed). The `span(text, eq)` helper in `main.js` makes these.
- **Tabs.** Each rules section is a `section.band`. The links in `nav.hbnav` act as tabs, and `showTab()` shows one band at a time. Print shows every band except Crawler.
- **Crawler tabs.** Your crawler, Check, Damage, Health & Mana and Dice each have a block in `main.js`. Skills, Gear, Pet and Notes are in `tools.js`, which keeps everything in one object, `D`. `calcRefresh()` redraws them all.
- **Loot Boxes.** A box is an Inventory row whose notes start with `Loot Box`. `boxNotes()` writes the wording and `parseBoxNotes()` reads it back; `boxOf()` prefers the full box kept in this browser. Opening one (`bx-go`) tries it on a copy of the Inventory first, so a full Inventory changes nothing. Then it adds the items, rolls the Gold and Junk, drinks the potions (a Stat potion raises Unenhanced and Enhanced together; a Skill potion stops at Rank 15, or 20 with `Max 20`) and adds a Skill the box teaches.
- **Gear and Stats.** Equipping or removing an item works out the gear bonus before and after, and moves Enhanced Stats, Armor and Evade Buffs by the difference (`applyGearDelta()`). Bonuses from Race, Class, potions or Spells that you typed in stay where they are.
- **CrawlerForge files.** The CrawlerForge section of `tools.js` reads three kinds of JSON file. It never runs anything from them.
  - A crawler file (`crawler-<name>-<date>.json`, `{kind: "crawler", events}`) is a log of events. `cfReplay()` plays the Inventory, Gold, Junk, shop, Loot Box and Hotlist events in order and skips any that were undone (`event.retracted`). Boxes come from `lootBox.received` and `achievement.awarded`; `lootBox.opened` removes the box, adds what came out and takes off a deity's tithe. Crafting, alchemy and enchanting aren't replayed; the preview says so when the file has them.
  - The same replay keeps the crawler itself in `cr`, following CrawlerForge's own rules: Level (`crawler.created`, `levels.gained`, `level.corrected`, and 1 per `playPeriod.ended`), Floor, Unenhanced Stats (`stats.corrected`, `statPoints.assigned`, Stat potions), AI Favor (including camera rewards and rerolls), the Evade adjustment, current Mana and Health slots lost (`mana.changed`, `health.changed`, potions, rests and spells), Popularity, Past Trauma, Loose Ends and Regrets. Skills follow `skill.added`, `skill.rankSet`, `skill.removed` and Skill potions. `skill.checkAttempted` ticks a Skill for advancement when its definition advances by use, or notes an untrained try on Floors 1 and 2. `playPeriod.ended` rolls the ticked Skills at Rank 4 or lower (a d20 that meets the Rank adds 1, up to 15), adds the Level and teaches the Skill learned untrained; `floor.ended` rolls every ticked Skill. Events it doesn't replay but that touch the sheet (Race, Class, grinding, Buffs, Debuffs, pets, deity, sponsors) are counted in `cr.later` and named in the preview.
  - `cfSyncLines()` lists what loading changes, and `cfApply()` loads it after the gear, so Max Mana and Evade Buffs count what CrawlerForge has you wearing. Unenhanced Stats move Enhanced by the same amount, as typing them does. Evade Buffs become the gear's Evade plus CrawlerForge's Evade adjustment. `cfSkillPlan()` matches each CrawlerForge Skill to a sheet row by name, or by a sheet name that starts it ("Unarmed" for "Unarmed Combat"), and keeps the sheet's name and notes. A Skill removed in CrawlerForge is removed from the sheet; a sheet Skill CrawlerForge doesn't list, like the Heal Spell, stays. A new Skill takes the first free row, with its Stat Mod, what it rolls against (`Unopposed`, `Evade` for attacks, `Passive`) and a short note from its description.
  - An Export everything backup (`{kind: "everything", crawlers, forge}`) holds a crawler file for each crawler, plus your Forge. The preview lets you pick a crawler, starting with the one named like the sheet's crawler, or the Forge.
  - A pack (`{items, lootBoxes}`) and the Forge hold item and Loot Box definitions. You tick the ones to add to your Inventory. A pack's box points at the pack's own items by id.
  - `cfItem()` turns an item's effects into the page's bonuses: stats (All Stats too), Skill ranks, DR and Evade. Drawbacks count as minus. Potions with heal or Mana become a Use. Other effects, such as Move or damage, go into the notes as words.
  - `cfPlan()` puts worn items in their Gear Slots and everything else in Inventory rows. Loading runs inside `gearChange()`, so Enhanced Stats, Armor and Evade Buffs move by the difference, like equipping by hand.
  - `cfBox()` turns a Loot Box into the page's box: its tier, type and contents (items, Gold and Junk as a number or dice like `1d10x100`, Skill and Stat potions, a Skill at a Rank, and text). A random box (`rolled`) has no contents of its own: CrawlerForge rolls them when it hands the box out, so a box in a crawler file is never random. A random box from a pack keeps its tier's counts (Bronze 1 item and 2 consumables; Silver to Platinum add 1 potion; Legendary and Celestial 2 items), and opening it here rolls only its Gold.
  - Gear Slots CrawlerForge leaves empty keep what's on the sheet unless you tick the option to empty them. An item CrawlerForge has no notes for keeps the sheet's notes for an item of the same name. A Hotlist entry keeps the sheet's wording when that starts with the same name, like `Soul Collector: 4 Mana, 50 ft`.

## How the character sheet link works

- **Linking.** In Chrome and Edge the page uses the File System Access API, so it can save straight into the PDF. The file handle is kept in IndexedDB so you can reconnect next visit. Other browsers open the file read-only: the change list shows what to update by hand, and saving it needs Chrome or Edge, or the sheet opened from Google Drive instead.
- **Google Drive.** In the online copy, Open from Google Drive signs in with Google (Google Identity Services) and opens Google's file picker, which also has an Upload tab for a PDF on the computer. The page asks only for the `drive.file` permission, so it can read and change the files picked or uploaded with it and nothing else in Drive. It downloads the PDF through the Drive API, saves with a media upload to the same file, and keeps the file's id in localStorage (`dcc-cheat-drive`) for Reconnect. Before saving it checks the file's version: if the sheet was saved somewhere else, it reopens that copy and writes on top. While the tab is showing, it checks the version every 20 seconds, the way the local file is watched. A sign-in lasts about an hour, and a new one needs a click because Google's window can't open by itself, so automatic saving waits and says so. Google's scripts load only on the first press. Drive doesn't work from a copy opened as a file on the computer, because Google signs in only from a web address registered for the project; the button there points to the online copy. The page remembers one sheet at a time, from Drive or from the computer.
- **Saving.** `pdf-engine.js` never rewrites the original bytes. Each save appends changed field objects, new appearance streams and a new cross-reference section to the end of the file, the same way Acrobat saves. Removing those appended bytes gets you the previous version.
- **Stats.** Each stat has an Unenhanced and an Enhanced value, matching the sheet. Changing Unenhanced moves Enhanced by the same amount, so gear and buff bonuses stay put; changing Enhanced alone only changes Enhanced. Both are saved.
- **Re-saved PDFs.** If a PDF program re-saves the sheet with compressed object streams, the engine decompresses them. It tolerates the bad checksums and stray bytes some programs leave behind, which strict browser decompression would otherwise reject with "Failed to fetch".
- **Edits made elsewhere.** The page checks the file every few seconds. If you changed it in your PDF reader, it reloads those numbers. Before every save it re-reads the file, so edits made elsewhere are kept.
- **Unsaved changes.** The list shows the difference between the numbers when you linked (or last saved) and now. Only fields that changed are written.
- **Without a sheet.** Everything still works, and it's kept in this browser instead (`dcc-cheat-crawler`, `dcc-cheat-hb` and `dcc-cheat-data` in local storage; the keys keep the old name so nothing is lost after the rename). Linking a sheet replaces it with what the sheet holds.

### Wording the page reads back

The sheet has no boxes for some things the tabs track, so they're written into nearby boxes with a fixed wording. You can type the same wording in your PDF reader and the page will pick it up.

| What | Where | Wording |
| --- | --- | --- |
| Bonuses of a worn item | Its Gear Slot box | `Enchanted Toque (+2 Int, DR 1, +2 Perception)`. A bonus every Stat gets is written once, like `+1 All Stats`. Accessories are separated by new lines. |
| Where an item in Hands/Holding is held | Start of each entry, separated by `; ` | `Gloves: Leather Gloves; Main: Sword (+1 Str); Off: Buckler (Evade +1)`, or `Both: Greatsword (+2 Str)` for a two-handed item. Entries without a prefix fill gloves (if the name says glove or gauntlet), then the main hand, then the off hand. |
| Gear Slot, bonuses and use of an item in your Inventory | Start of its notes | `Head: +2 Int, DR 1. Use: full Mana. Your own notes.` The slot word is Head, Torso, Arms, Gloves, One-handed, Two-handed, Legs, Feet or Accessory. Use can be `heal 3 slots`, `4 Mana`, `full Health` or `full Mana`. |
| Grinding hours, end-of-floor advancement bonus, Rank 20 allowed | End of the Skill's notes | `Your own notes; Grind 2 h; Adv +1; Max 20` |
| An unopened Loot Box | Its Inventory notes | `Loot Box: Silver, Adventurer. Holds: 400 Gold; Armguards [Arms, DR 2]; Mana Potion x3 [Use full Mana]; Skill Potion +1 (your pick). Description.` Entries are separated by `; `. Gold and Junk can be dice, like `1d10x100 Gold` or `1d6 Junk`. Potions name a Skill or Stat, or say `(your pick)`. `Skill Lockpicking at Rank 3` teaches a Skill. A random box says `random` after its type and lists its counts, like `Holds: 1 item; 2 consumables; 1 potion; 1d10x100 Gold.` |
| Pet name, attitude and role | Start of the pet's Special box | `Jane, Bonded, Utility. Your own notes.` Attitude is Hostile, Calm, Friendly or Bonded; role is Tank, Aggressive or Utility. |

A few things stay in the browser only: hours ground toward your next Level, a pet's Stat points not yet placed, your own notes on an item while you're wearing it (they go back into its Inventory notes when you take it off), the full contents of a Loot Box (the sheet wording is the fallback), and how many Stat and Skill potions you've drunk (a crawler only gets two of each, Core p. 226).

### Field map for `Carl_Character_Sheet_Fillable.pdf`

These are the field names the page reads and writes. They're set in the `FN` object in `main.js` and at the top of `tools.js`.

| Sheet item | Field name |
| --- | --- |
| Name, Race, Class, Level, Floor, Crawler Number | `Name`, `Race`, `class`, `level`, `Floor`, `crawler number` |
| Strength Enhanced / Unenhanced / Mod | `Text Field 21` / `22` / `23` |
| Intelligence | `Text Field 34` / `35` / `36` |
| Constitution | `Text Field 43` / `44` / `45` |
| Dexterity | `Text Field 46` / `47` / `48` |
| Charisma | `Text Field 49` / `50` / `51` |
| Evade: Dex Mod, Buffs, Total | `Text Field 24`, `25`, `26` |
| DR: Armor, Buffs, Total | `Text Field 29`, `30`, `31` |
| AI Favor | `Text Field 32` |
| Max Mana, Current Mana | `Text Field 38`, `Text Field 37` |
| Debuffs, External Buffs 1 to 3 | `Text Field 39`, `40`, `41`, `42` |
| Health Bar slot values, 10% to 100% | `10`, `20`, … `100` |
| Health Bar damage boxes, 10% to 100% | `Check Box6 2`, `Check Box6 1`, `Check Box6 1 1` … `Check Box6 1 8` |
| Attacks, rows 1 to 5 (name, rank, to-hit stat, dice, damage stat) | `55, 551, 52, 53, 54` / `61, 57, 59, 58, 60` / `67, 63, 65, 64, 66` / `73, 69, 71, 70, 72` / `79, 75, 77, 76, 78` |
| Skills, row k from 0 to 19 (name, rank, stat, rolled against, notes, advancement box) | `Text Field 103+6k`, `104+6k`, `105+6k`, `106+6k`, `107+6k`, `Check Box k+1` |
| Hotlist boxes 1 to 10 | `Text Field 81` to `90` |
| Gear Slots: Head, Torso, Arms, Hands/Holding, Legs, Feet, Accessories | `Text Field 92`, `93`, `94`, `95`, `96`, `97`, `91` |
| Popularity, Past Trauma, Loose Ends, Regrets, Notes | `Text Field 98`, `99`, `100`, `101`, `102` |
| Inventory, row k from 0 to 19 (item, quantity, notes) | `Text Field 223+3k`, `224+3k`, `225+3k` |
| Pet Health Bar slot values and damage boxes, 10% to 100% | `Text Field 3064` to `3073`, `Check Box 800` to `809` |
| Pet Str, Int, Con, Dex, Cha | `Text Field 3074`, `3076`, `3078`, `3080`, `3082` |
| Pet Level, DR, Evade, Move, Size | `Text Field 3075`, `3077`, `3079`, `3081`, `3083` |
| Pet Attack, Attack, Special | `Text Field 3084`, `3085`, `3086` |
| Mount Health Bar slot values and damage boxes | `Text Field 3087` to `3089`, `3091` to `3097`; `Check Box 900`, `902` to `910` |
| Mount Size, Move, Occupants, DR, Accessories | `Text Field 3098`, `3099`, `30100`, `30101`, `30102` |
| Important Things I've Killed, 13 rows | `Text Field 30103` to `30109`, then `301010` to `301015` |
| Clubs, Societies, Guilds, 6 rows | `Text Field 301016` to `301021` |
| Personal Space: Tier, Size, Amenities, then 10 rows | `Text Field 301022`, `301023`, `301024`, `301025` to `301034` |
| Deity | `Text Field 301035` |
| Racial Abilities, Class Abilities, 22 rows each | `Text Field 301036` to `301078` (even), `301037` to `301079` (odd) |
| Sponsors 1 to 3 | `Text Field 301080`, `301081`, `301082` |

This sheet stores every field twice: once on the page and once in the form's field list. The engine updates both. When they disagree, it reads the copy that's shown on the page.

## Setting up Google Drive

Open from Google Drive needs a Google Cloud project for the page. Its three IDs go in `GDRIVE` at the top of the Google Drive section of `main.js`. They aren't secrets: they ship in the page, and the restrictions below keep them working only for the online copy. With them blank, the Drive buttons stay hidden. To set it up, once:

1. In the Google Cloud console (<https://console.cloud.google.com/>), create a project, for example "Crawler Companion".
2. In APIs & Services, Library, turn on the **Google Drive API** and the **Google Picker API**.
3. In Google Auth Platform (the OAuth consent screen), fill in the app name and your email. Under Audience, choose External and publish the app, so anyone at the table can sign in. `drive.file` isn't a sensitive permission, so publishing doesn't need a review from Google. While the app is in Testing, only the test users you list can sign in.
4. Under Data Access, add the scope `https://www.googleapis.com/auth/drive.file`.
5. Under Clients, create an OAuth client of type Web application. Add `https://rtwarren.github.io` as an Authorized JavaScript origin. Copy its **Client ID**.
6. In APIs & Services, Credentials, create an **API key**. Restrict it to websites `https://rtwarren.github.io/*` and to the Google Picker API.
7. Copy the **project number** from the project's dashboard. It's the App ID.
8. Put them in `GDRIVE` as `clientId`, `apiKey` and `appId`, build, and release.

## Testing

```
node tests/test-pdf-engine.js "C:\path\to\a copy of Carl_Character_Sheet_Fillable.pdf"
```

This reads the sheet, saves a few changes to `tests/out/roundtrip.pdf`, reopens it and checks them. The PDF you point at is never written.

```
npm install playwright
npx playwright install chromium
node tests/browser-test.js "C:\path\to\a copy of Carl_Character_Sheet_Fillable.pdf"
```

This loads the built page, opens the sheet read-only and checks that saving is off, then links it through a stand-in file handle, rolls a check, takes some damage, saves through the handle to `tests/out/saved.pdf`, and reports any page errors or downloads.

```
node tests/tools-test.js "C:\path\to\a copy of Carl_Character_Sheet_Fillable.pdf"
```

This links the sheet, equips an item with bonuses and checks the Stats move and move back, adds a Skill and runs an advancement check, adds a pet, writes a note, saves to `tests/out/tools-saved.pdf`, reopens that file and checks the fields, then relinks it and expects no pending changes.

```
node tests/crawlerforge-test.js "C:\path\to\a copy of Carl_Character_Sheet_Fillable.pdf"
```

This links the sheet and loads `tests/fixtures/crawlerforge-crawler.json`, a made-up crawler. It checks the Gear Slots, Inventory, Gold (after a tithe), Junk, Hotlist and unopened Loot Boxes, and that Stats move by the gear bonus. It checks that undone items and opened boxes are left out, and that loading twice doesn't count bonuses twice. It opens the boxes and checks the items, rolled Gold, Junk, potions and the Skill a box teaches, and opens a box typed on the sheet by hand. Then it adds items and boxes from `tests/fixtures/crawlerforge-pack.json`, opens a random box, checks the potion limit warning, reads an Export everything backup with a Forge, saves to `tests/out/crawlerforge-saved.pdf` and checks the fields. Last, it relinks a fresh copy, loads `tests/fixtures/crawlerforge-sync.json` and checks the whole-crawler sync: Level from play periods (an undone one doesn't count), Floor, a corrected Stat, Health, Mana, AI Favor, Evade Buffs, Popularity and story boxes, Skill Ranks and ticks, a short sheet name, new and removed Skills, an untrained try, and that loading again changes nothing. It saves that to `tests/out/crawlerforge-sync-saved.pdf` and checks the fields.

```
node tests/drive-test.js "C:\path\to\a copy of Carl_Character_Sheet_Fillable.pdf"
```

This serves the built page from a made-up https address with test IDs in `GDRIVE`, and fakes Google's sign-in, picker and Drive, so nothing reaches Google. It checks the Drive button is hidden while `GDRIVE` is blank and nothing loads from Google before it's pressed. Then it opens the sheet from Drive, checks the picker gets the token, API key, App ID and Upload tab and that sign-in asks for `drive.file` only, saves a change to Drive, loads a save made on another device, keeps both when there are unsaved changes, renews a sign-in that ran out when Save is clicked, and checks automatic saving waits for a click instead. It reconnects on the next visit without the picker, reloads, unlinks, handles a file Drive can't find and a cancelled picker, and checks the button points to the online copy from a file on the computer.

```
node tests/update-test.js
```

This checks Check for updates without contacting GitHub: every request is answered with a made-up release. It checks a newer release with notes and a download link, the same and an older version, a release without the file, a download link outside github.com (never shown), no releases, a rate limit and no network. It also checks nothing is sent to GitHub until the button is pressed.

## Sources

Rules are summarised from the Dungeon Crawler Carl RPG Core Rulebook (Royal Court Edition), Rules for Survival, and Crawlers & Customization. Page references are on the page itself.

## Antivirus false positives

Some antivirus tools flag HTML files that build files in the browser and download them, or that run code from strings. That's how "HTML smuggling" malware works, so the page avoids both:

- It never creates a download. It only writes into a sheet you linked yourself, through the browser's file permission prompt.
- Open from Google Drive loads Google's sign-in and picker scripts from accounts.google.com and apis.google.com, and only when pressed. It saves to Drive with an upload request, never a download.
- Check for updates only reads GitHub's list of releases. Its Download button is an ordinary link to the file on github.com, so the browser downloads it from GitHub like any other file.
- Floor formulas are parsed by a small pattern match instead of being run as code.
- No fonts or other files are embedded as encoded data.

Keep it that way when you edit `main.js`: no `new Blob` plus `createObjectURL` downloads, no `eval` or `new Function`, and no large base64 strings.

## Versions and updates

Each version is tagged in git (`v1.0.0`, `v1.1.0` and so on). `CHANGELOG.md` lists what changed. To release a version:

1. Make the change in `src/`.
2. Add the new version's section to the top of `CHANGELOG.md`. The build reads the version number from it.
3. Run `python build.py`.
4. Either merge it into `main` (a pull request is fine), or `git add -A`, `git commit -m "Short description (1.4.1)"`, `git tag -a v1.4.1 -m "Version 1.4.1"`, then `git push --follow-tags`.

Either way runs `.github/workflows/release.yml`. It reads the first version in `CHANGELOG.md`; a pushed tag has to match it. If that version has no release yet, it builds the page and publishes a GitHub Release named `Crawler Companion 1.4.1` with `Crawler_Companion_v1.4.1.html` and the two guides in `guides/` attached, and that version's CHANGELOG section as its notes. Coming from `main`, the release makes the `v1.4.1` tag itself. A version that's already released is skipped, so a merge and a tag for the same version don't clash. Tags must be annotated (`git tag -a`), or `--follow-tags` won't push them. If the workflow fails, its run on the repo's Actions tab says why; fix it and run the workflow again from the Actions tab, or delete a tag you pushed (`git tag -d v1.4.1`, `git push origin :refs/tags/v1.4.1`) and tag again.

Each new release is also published to GitHub Pages at <https://rtwarren.github.io/DCCTTRPG_Crawler_Companion/>, so the newest version opens from any device without a download. Pages has to be turned on once: on GitHub, open the repo's Settings, then Pages, and set Source to GitHub Actions. To publish the newest version to Pages again, open Actions, then Release, and press Run workflow.

To change a guide, edit it, export it as a letter-size PDF over the file in `guides/` (same name), commit and push to main. The workflow replaces that guide on the newest release, so it doesn't need a new version. The `.gitignore` keeps every other PDF out of the repo, since character sheets and rulebooks don't belong in it.

The page's footer shows its version. **Check for updates** asks `api.github.com/repos/rtwarren/DCCTTRPG_Crawler_Companion/releases/latest` for the newest release, and only when pressed. If it's newer, the page lists the release notes and a **Download** link to the attached file. In Chrome and Edge every local HTML file shares the same saved data, so the new file keeps the crawler, settings and the linked sheet (press Reconnect). If the repo is ever renamed or moved, change `REPO` in `main.js`.
