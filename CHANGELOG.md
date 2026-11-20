# Change log

Versions of the Crawler Companion (called Crawler Cheat Sheet before 1.4.0), built as `dist/Crawler_Companion_v<version>.html`. Each one is tagged in git (for example `v1.4.0`), and from 1.4.0 each tag is published as a GitHub Release with the page attached. The build reads the version from the first heading below.

## 1.5.5 (2026-11-19)

- Fixed: the Dying countdown is rounds equal to your Constitution, not your Con Mod (Core p. 94). The worked-out numbers, the Health card and the rules say so now.
- House rule: Meditation now rounds its share of max Mana up, not down.

## 1.5.4 (2026-11-16)

- **House rule: Mana recovery.** A calm hour now gives back 20% of your max Mana, rounded down, at least 5. Short and long rests are unchanged (50% and all).
- **Combat Recovery.** In the Mana card: at Clean Up in a round you didn't cast a Spell, press it to get back half the floor number in Mana, rounded up.
- **Meditate.** In the Mana card: rolls an Int Check against 10 + Floor (or takes the d20 you type) and gives back 20% of max Mana on a natural 20, 10% on a Success, 5% on a Failure and none on a natural 1. Debuffs count against the roll, and it goes in Recent rolls.
- The house rule is in the Rules drawer under Magic & gear, and Healing and rest points to it.

## 1.5.3 (2026-11-15)

- **New layout: your crawler first.** The top bar holds your crawler's name and Level, the floor, your linked sheet with Save, the Rules button and a More menu. The floor's target numbers sit under it. Health, Mana, Evade, DR, AI Favor, Buffs and Debuffs, resting and your Stats are on the left. Skills, Gear & Inventory, Pet and Notes are in the middle. Check, Damage, Dice and Recent rolls are on the right. On a narrow screen the columns stack.
- **Rules drawer.** The cheat sheet opens in a drawer over the page, with search and the ten rule sections. Rule links next to the tools open it at that rule. Print the cheat sheet from the More menu.
- **Buffs and Debuffs.** Minor Injury, Major Injury, Sore as Shit and Fatigued are tags you add and remove, and the Check tool takes them off every roll. A long rest clears Fatigued. Other Debuffs and External Buffs written on your sheet show as tags too.
- **Recent rolls.** Checks, damage and dice rolls are listed, newest first.
- **Skills.** Find a Skill, show only the ticked ones, and see which Skills are in your Hotlist.
- The Health & Mana tab is now the Health and Mana card on the left. Load from CrawlerForge, dark mode and Check for updates are in the More menu.

## 1.5.2 (2026-11-12)

- **Check for updates updates the file you have open.** Opened as a file in Chrome or Edge, the page now offers Update this file, which writes the new version over this file and reloads it, instead of downloading a second copy. The first time, pick this file when asked and allow the change; the page remembers it after that. Nothing is written unless the file you pick is the one you have open and the new page is the version GitHub announced. With unsaved sheet changes it doesn't reload, so you can save them first. Firefox, Safari and copies not opened as a file still get the Download button.
- The release workflow checks that the page committed in `dist/` matches the build, since Update this file reads it from the repo.

## 1.5.1 (2026-11-12)

- **Rank upgrades in the Damage tab.** Picking an attack from your sheet now adds the extra base damage dice its Skill's notes give for the Rank it has reached, written like "Rank 5: +1d4". Rank 5 upgrades count on every Floor, and Rank 10 and 15 upgrades from Floor 3, as the book says. A Critical Hit doubles them with the rest of the base dice, and the note under the formula says which upgrade is included.

## 1.5.0 (2026-11-12)

- **Load from CrawlerForge syncs the whole crawler.** A crawler file now brings across your Level, Floor, Unenhanced Stats, Health, Mana, AI Favor, Evade adjustment, Popularity and the Past Trauma, Loose Ends and Regrets boxes, as well as your gear, Inventory, Gold, Junk and Hotlist. It replays your Skills too: Ranks you set, Skills you added or removed, advancement ticks, the end-of-play-period checks and the Level they give, and Skills learned from untrained tries on Floors 1 and 2. A Skill finds its row by name, and a shorter name on your sheet counts ("Unarmed" for "Unarmed Combat"). Skills on your sheet that CrawlerForge doesn't list, like the Heal Spell, stay put.
- The preview lists what loading changes before you press Load it, and two new options let you leave out the Stats or the Skills.
- The preview names what isn't brought across yet (Race, Class, grinding, Buffs, Debuffs, pets, deity, sponsors) when the file has any.
- Changing Unenhanced Stats this way moves Enhanced by the same amount, so bonuses from gear and Buffs stay put.

## 1.4.0 (2026-11-09)

- **New name: Crawler Companion.** It's a rules reference and a character manager now, so the file is `Crawler_Companion_v<version>.html` and the GitHub repo is `rtwarren/DCCTTRPG_Crawler_Companion`. Your saved settings and linked sheet carry over.
- **Check for updates.** The footer shows your version. Press Check for updates to see whether GitHub has a newer one and what changed, then download it with one click. Nothing is sent to GitHub until you press it.
- Pushing a version tag now publishes a GitHub Release with the built page attached, which is where the update button looks.

## 1.3.0 (2026-11-05)

- **Gear tab.** Your Gear Slots, Inventory, Gold, Misc. Junk and Hotlist, read from and saved to the sheet. Give an item bonuses (All Stats, single Stats, Armor DR, Evade, Skills) and equip it: your Enhanced Stats, Armor and Evade Buffs move by its bonus, and move back when you take it off. Slot limits follow the book: one item per slot, ten Accessories with one belt and one cape, and Hands/Holding split into Gloves, Main Hand and Off Hand, where a two-handed item takes both hands and sends what you were holding back to your Inventory. Search the Inventory, filter it by kind (weapons, wearables, accessories, consumables, scrolls), sort it, and change amounts with − and +. Type +50 or -20 into Gold or Junk to add or spend. Potions and other usable items can heal or restore Mana from the list. Loot bodies for Gold and Junk, and sell Junk at 1 gold each.
- **Load from CrawlerForge.** In the Gear tab, open a CrawlerForge crawler file (Export crawler), an Export everything backup, or a pack. A crawler or backup previews what it's wearing and carrying, then loads its gear, Inventory, Gold, Misc. Junk and Hotlist into your sheet. Enhanced Stats, Armor and Evade Buffs move by the gear bonus. Gear Slots CrawlerForge leaves empty keep what's on your sheet unless you ask to empty them. From a pack or your Forge, tick the items and Loot Boxes to add to your Inventory. Item effects become bonuses and uses where the sheet has them, and notes where it doesn't. Crafted and enchanted items aren't replayed yet, and the preview says when a file has them.
- **Loot Boxes.** A crawler's unopened boxes come across from CrawlerForge, along with the boxes in packs and the Forge. Each waits in your Inventory, with what it holds written in its notes, until you press Open. Opening puts its items in your Inventory, rolls its Gold and Junk, drinks its Skill and Stat potions (you pick the Skill or Stat when the box lets you), and teaches any Skill it holds. The page warns when you go past the two Stat and two Skill potions a crawler can ever drink. A random box from a pack rolls its Gold and leaves the rest to your GM. Opened boxes and deity tithes in a crawler file count toward your Gold.
- **Skills tab.** Every Skill on your sheet with its Rank, roll bonus (including gear) and tick box. Add, edit and remove Skills. Roll one straight into the Check tab, which ticks it. Run the 2-hour and end-of-floor advancement checks, with the Human Advantage pick and per-Skill bonuses. Log grinding hours: a Skill rolls its advancement check when its hours reach its Rank, hours past 5 roll Endurance, and grind hours count toward your next Level. Try a Skill you don't have: it rolls with Disadvantage, and on Floors 1 and 2 it goes on your sheet at Rank 0 so the 2-hour check can teach you one of the Skills you tried.
- **Pet tab.** The pet and mount boxes from page 5: stats, Mods, Health Bar, damage and healing, attack rolls at Rank = Floor, levelling twice as fast until 15, and the Animal Handling checks for commanding it and changing its attitude. Give it a name and starting attitude when you add it. Name, attitude and role save at the start of the Special box.
- **Notes tab.** Notes, Past Trauma, Loose Ends, Regrets, Popularity, kills, clubs, deity, personal space, racial and class abilities, and sponsors, all saved to the sheet.
- The Calculators section is now called Crawler.
- Picking a Skill in the Check tab sets the target from its "rolled against" column.
- Fixed: Other bonus in the Check tab carried over to the next roll. It now resets when you switch the kind of roll or pick another Skill or attack, and the Damage tab's Flat bonus resets when you pick another attack.
- Saved text now keeps curly quotes and dashes, and long notes wrap in the PDF's multi-line boxes.

## 1.2.0 (2026-10-31)

- Unenhanced stats now save. Each stat has an Unenhanced and an Enhanced box, matching the sheet. Raising Unenhanced moves Enhanced by the same amount, so gear and buff bonuses stay put.
- Hovering a stat's Mod shows the Unenhanced value and the bonus from gear and buffs.
- Linking a sheet that another PDF program re-saved no longer fails with "Failed to fetch". The page now tolerates the small errors some programs leave in compressed sections.

## 1.1.0 (2026-10-31)

- Windows Defender no longer flags the page. It used to build an updated PDF in the browser and download it, which looks like malware that smuggles files through web pages. The page now only saves into a sheet you linked.
- Saving needs Chrome or Edge. Firefox and Safari open the sheet read-only, and the change list shows what to update by hand.
- Floor formulas are parsed instead of being run as code.
- The heading font is no longer packed into the file. Windows uses its built-in Bahnschrift; other systems fall back to Arial Narrow.

## 1.0.0 (2026-10-31)

- First version: a one-file, offline player reference for the Dungeon Crawler Carl RPG.
- Ten rules sections in tabs, with floor-aware numbers and hover equations that show the maths and dice.
- Calculators for checks, damage, health and mana, and dice.
- Links the fillable character sheet PDF, tracks changes, and saves them back into the PDF.
