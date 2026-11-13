  /* ===================== Skills, Gear, Pet and Notes (sheet pages 2 to 6) ===================== */
  /* Everything here lives in D. With a sheet linked, D comes from the PDF and changes save back into
     its fields. Without one, D is kept in this browser. Things the sheet has no box for are written
     into nearby boxes with a fixed wording the page reads back (see README). Only three small
     extras stay in this browser: the grind-to-level hour count, a pet's unplaced Stat points, and
     the notes of an item while it's equipped. */

  /* ---------- sheet field names ---------- */
  var SLOTS = [["head","Head",92],["torso","Torso",93],["arms","Arms",94],["hands","Hands/Holding",95],["legs","Legs",96],["feet","Feet",97],["acc","Accessories",91]];
  /* what an item is worn as. Gloves, one-handed and two-handed items all go in the sheet's Hands/Holding box */
  var SLOTWORD = {head:"Head", torso:"Torso", arms:"Arms", gloves:"Gloves", hand:"One-handed", twohand:"Two-handed", legs:"Legs", feet:"Feet", acc:"Accessory"};
  var EQUIPTO = [["head","Head"],["torso","Torso"],["arms","Arms"],["gloves","Gloves"],["hand","One hand"],["twohand","Both hands"],["legs","Legs"],["feet","Feet"],["acc","Accessory"]];
  function sheetSlot(type){ return type === "gloves" || type === "hand" || type === "twohand" ? "hands" : type; }
  var ACC_MAX = 10, INV_ROWS = 20, SK_ROWS = 20;
  function seq(a, b, step){ var o = []; for(var i = a; i <= b; i += (step || 1)) o.push(i); return o; }
  function invF(k){ return {name: tf(223 + 3 * k), qty: tf(224 + 3 * k), notes: tf(225 + 3 * k)}; }
  function skF(k){ var b = 103 + 6 * k; return {name: tf(b), rank: tf(b + 1), stat: tf(b + 2), type: tf(b + 3), notes: tf(b + 4), box: "Check Box " + (k + 1)}; }
  var HOTF = seq(81, 90).map(tf);
  function boxes(list){ return list.map(function(n){ return "Check Box " + n; }); }
  var PETF = {vals: seq(3064, 3073).map(tf), boxes: boxes(seq(800, 809)),
    str: tf(3074), int: tf(3076), con: tf(3078), dex: tf(3080), cha: tf(3082),
    level: tf(3075), dr: tf(3077), evade: tf(3079), move: tf(3081), size: tf(3083), atk1: tf(3084), atk2: tf(3085), special: tf(3086)};
  var PETKEYS = ["str","int","con","dex","cha","level","dr","evade","move","size","atk1","atk2","special"];
  var MNTF = {vals: [3087,3088,3089,3091,3092,3093,3094,3095,3096,3097].map(tf), boxes: boxes([900,902,903,904,905,906,907,908,909,910]),
    size: tf(3098), move: tf(3099), occ: tf(30100), dr: tf(30101), acc: tf(30102)};
  var MNTKEYS = ["size","move","occ","dr","acc"];
  var TXT = [
    ["notes", "Notes", [tf(102)]], ["trauma", "Past Trauma", [tf(99)]], ["loose", "Loose Ends", [tf(100)]], ["regrets", "Regrets", [tf(101)]], ["pop", "Popularity", [tf(98)]],
    ["kills", "Important things I’ve killed", [30103,30104,30105,30106,30107,30108,30109,301010,301011,301012,301013,301014,301015].map(tf)],
    ["clubs", "Clubs, societies and guilds", seq(301016, 301021).map(tf)],
    ["deity", "Deity", [tf(301035)]],
    ["tier", "Personal space tier", [tf(301022)]], ["psize", "Personal space size", [tf(301023)]], ["amen", "Personal space amenities", [tf(301024)]],
    ["prows", "Personal space", seq(301025, 301034).map(tf)],
    ["racial", "Racial abilities", seq(301036, 301078, 2).map(tf)], ["klass", "Class abilities", seq(301037, 301079, 2).map(tf)],
    ["sp1", "Sponsor 1", [tf(301080)]], ["sp2", "Sponsor 2", [tf(301081)]], ["sp3", "Sponsor 3", [tf(301082)]]
  ];
  var TXTBY = {}; TXT.forEach(function(t){ TXTBY[t[0]] = t; });

  /* ---------- data ---------- */
  function blankPet(){ var p = {vals: [], lost: []}; PETKEYS.forEach(function(k){ p[k] = ""; }); for(var i = 0; i < 10; i++){ p.vals.push(""); p.lost.push(false); } return p; }
  function blankMount(){ var p = {vals: [], lost: []}; MNTKEYS.forEach(function(k){ p[k] = ""; }); for(var i = 0; i < 10; i++){ p.vals.push(""); p.lost.push(false); } return p; }
  function emptyData(){
    var d = {skills: [], attacks: [], gear: {}, inv: [], hot: [], pet: blankPet(), mount: blankMount(), text: {}};
    SLOTS.forEach(function(s){ d.gear[s[0]] = ""; });
    for(var k = 0; k < INV_ROWS; k++) d.inv.push({name: "", qty: "", notes: ""});
    for(var h = 0; h < 10; h++) d.hot.push("");
    TXT.forEach(function(t){ d.text[t[0]] = t[2].length === 1 ? "" : t[2].map(function(){ return ""; }); });
    return d;
  }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function normData(d){
    var e = emptyData(); if(!d || typeof d !== "object") return e;
    e.skills = Array.isArray(d.skills) ? d.skills.filter(function(s){ return s && s.name; }) : [];
    e.attacks = Array.isArray(d.attacks) ? d.attacks : [];
    SLOTS.forEach(function(s){ if(d.gear && typeof d.gear[s[0]] === "string") e.gear[s[0]] = d.gear[s[0]]; });
    if(Array.isArray(d.inv)) d.inv.slice(0, INV_ROWS).forEach(function(r, k){ if(r) e.inv[k] = {name: String(r.name || ""), qty: String(r.qty || ""), notes: String(r.notes || "")}; });
    if(Array.isArray(d.hot)) d.hot.slice(0, 10).forEach(function(t, k){ e.hot[k] = String(t || ""); });
    ["pet","mount"].forEach(function(w){ if(d[w]) Object.keys(e[w]).forEach(function(k){ if(d[w][k] != null) e[w][k] = d[w][k]; }); });
    TXT.forEach(function(t){ var v = d.text ? d.text[t[0]] : null; if(v == null) return; e.text[t[0]] = t[2].length === 1 ? String(v) : t[2].map(function(_, i){ return String(v[i] || ""); }); });
    return e;
  }
  var DKEY = "dcc-cheat-data";
  var D = (function(){ try{ return normData(JSON.parse(store(DKEY) || "null")); }catch(e){ return emptyData(); } })();
  function saveData(){ store(DKEY, JSON.stringify(D)); }
  var modAt = null;   /* Stat Mods when the sheet was read; skill Mod text is only rewritten after they change */

  /* extras the sheet has no box for, kept per crawler in this browser */
  var XKEY = "dcc-cheat-extra", XALL = {};
  try{ XALL = JSON.parse(store(XKEY) || "{}") || {}; }catch(e){ XALL = {}; }
  function X(){
    var m = SH.model, k = m && (m.crawler || m.name) ? "c:" + (m.crawler || m.name) : "local";
    if(!XALL[k]) XALL[k] = {};
    var x = XALL[k]; ["inotes", "boxes"].forEach(function(f){ if(!x[f] || typeof x[f] !== "object") x[f] = {}; });
    ["potStat", "potSkill"].forEach(function(f){ if(typeof x[f] !== "number") x[f] = 0; });
    if(typeof x.grind !== "number") x.grind = 0;
    if(typeof x.petPts !== "number") x.petPts = 0;
    return x;
  }
  function xSave(){ store(XKEY, JSON.stringify(XALL)); }

  /* read every tools field from the linked PDF */
  function readTools(){
    function s(n){ var v = fv(n); return v == null || v === true || v === false ? "" : String(v); }
    function b(n){ return fv(n) === true; }
    var d = emptyData();
    for(var k = 0; k < SK_ROWS; k++){
      var f = skF(k); if(!s(f.name).trim()) continue;
      d.skills.push({row: k, name: s(f.name), rank: s(f.rank), stat: s(f.stat), type: s(f.type), notes: s(f.notes), mark: b(f.box)});
    }
    FN.attacks.forEach(function(a, i){
      if(!s(tf(a[0])).trim()) return;
      d.attacks.push({row: i, name: s(tf(a[0])), rank: s(tf(a[1])), stat: s(tf(a[2])), dice: s(tf(a[3])), dstat: s(tf(a[4]))});
    });
    SLOTS.forEach(function(sl){ d.gear[sl[0]] = s(tf(sl[2])); });
    for(var r = 0; r < INV_ROWS; r++){ var g = invF(r); d.inv[r] = {name: s(g.name), qty: s(g.qty), notes: s(g.notes)}; }
    d.hot = HOTF.map(s);
    PETKEYS.forEach(function(k){ d.pet[k] = s(PETF[k]); }); d.pet.vals = PETF.vals.map(s); d.pet.lost = PETF.boxes.map(b);
    MNTKEYS.forEach(function(k){ d.mount[k] = s(MNTF[k]); }); d.mount.vals = MNTF.vals.map(s); d.mount.lost = MNTF.boxes.map(b);
    TXT.forEach(function(t){ d.text[t[0]] = t[2].length === 1 ? s(t[2][0]) : t[2].map(s); });
    return d;
  }
  function useSheetData(d){ D = normData(d); modAt = Object.assign({}, crawler().mod); saveData(); }

  /* ---------- skill helpers ---------- */
  function skRank(s){ var r = parseInt(s.rank, 10); return isNaN(r) ? 0 : r; }
  function skStat(s){ return statKey(s.stat); }
  function isPassive(s){ return /passive/i.test(s.type || ""); }
  /* a Skill's notes on the sheet can end with tags the page reads back: "Grind 2 h", "Adv +1" (end-of-floor
     advancement bonus) and "Max 20" (can go past Rank 15). The rulebook suggests keeping grind hours there. */
  var TAG_RE = {
    grind: /[;,]?\s*\bGrind(?:ing)?:?\s*(\d+)\s*h(?:ours?)?\b\.?/i,
    adv: /[;,]?\s*\bAdv(?:ancement)?(?:\s+bonus)?:?\s*\+\s*(\d+)\b\.?/i,
    max: /[;,]?\s*\bMax(?:imum)?\s*(?:Rank\s*)?20\b\.?/i
  };
  function tagsOf(notes){
    var t = String(notes || ""), m1 = TAG_RE.grind.exec(t), m2 = TAG_RE.adv.exec(t);
    return {grind: m1 ? +m1[1] : 0, adv: m2 ? +m2[1] : 0, max: TAG_RE.max.test(t)};
  }
  function stripTags(notes){ var t = String(notes || ""); Object.keys(TAG_RE).forEach(function(k){ t = t.replace(TAG_RE[k], ""); }); return t.replace(/[;,\s]+$/, "").trim(); }
  function withTags(base, tg){
    var parts = [];
    if(tg.grind > 0) parts.push("Grind " + tg.grind + " h");
    if(tg.adv > 0) parts.push("Adv +" + tg.adv);
    if(tg.max) parts.push("Max 20");
    base = stripTags(base);
    return parts.length ? (base ? base.replace(/[.;,\s]+$/, "") + "; " : "") + parts.join("; ") : base;
  }
  function grindOf(notes){ return tagsOf(notes).grind; }
  function stripGrind(notes){ return stripTags(notes); }
  function withGrind(notes, h){ var tg = tagsOf(notes); tg.grind = h; return withTags(notes, tg); }
  function sameNotes(a, b){ function n(x){ return stripTags(x).replace(/[.;,\s]+$/, ""); } return n(a) === n(b); }
  function isModText(t){ return /^\s*(str|int|con|dex|cha)[a-z]*\s*[+\-−]\s*\d+\s*$/i.test(t || ""); }
  function modText(k, c){ return SN[k] + " " + sgn(c.mod[k]).replace("−", "-"); }
  function regenMod(t, c){
    if(!isModText(t) || !modAt) return t;
    var k = statKey(t); return modAt[k] === c.mod[k] ? t : modText(k, c);
  }
  function skMax(name){ var s = findSkill(name); return s && tagsOf(s.notes).max ? 20 : 15; }
  function skAdvBonus(name){ var s = findSkill(name); return s ? tagsOf(s.notes).adv : 0; }
  function findSkill(name){ var k = String(name || "").trim().toLowerCase(); return D.skills.filter(function(s){ return s.name.trim().toLowerCase() === k; })[0] || null; }
  function setRank(s, r){
    s.rank = String(r);
    D.attacks.forEach(function(a){ if(a.name.trim().toLowerCase() === s.name.trim().toLowerCase()) a.rank = String(r); });
  }
  function sortSkills(){ D.skills.sort(function(a, b){ return a.row - b.row; }); }

  /* ---------- gear helpers ---------- */
  var STATWORD = {str:"str|strength", int:"int|intelligence", con:"con|constitution", dex:"dex|dexterity", cha:"cha|charisma"};
  function blankFx(){ return {str:0, int:0, con:0, dex:0, cha:0, dr:0, evade:0, skills:{}}; }
  function nOf(s){ return parseInt(String(s).replace(/\s+/g, "").replace("−", "-"), 10); }
  function parseFx(text){
    var fx = blankFx(), toks = String(text || "").split(/\s*,\s*/).filter(function(t){ return t.trim(); });
    if(!toks.length) return null;
    for(var i = 0; i < toks.length; i++){
      var t = toks[i].trim(), m, hit = false;
      if((m = /^([+\-−]\s*\d+)\s*all(?:\s+stats)?$/i.exec(t))){ var na = nOf(m[1]); STATS.forEach(function(k){ fx[k] += na; }); continue; }
      for(var k in STATWORD){
        m = new RegExp("^([+\\-−]\\s*\\d+)\\s*(?:" + STATWORD[k] + ")$", "i").exec(t);
        if(m){ fx[k] += nOf(m[1]); hit = true; break; }
      }
      if(hit) continue;
      if((m = /^DR\s*\+?\s*(\d+)$/i.exec(t)) || (m = /^\+?\s*(\d+)\s*DR$/i.exec(t))){ fx.dr += +m[1]; continue; }
      if((m = /^Evade\s*([+\-−]\s*\d+)$/i.exec(t)) || (m = /^([+\-−]\s*\d+)\s*Evade$/i.exec(t))){ fx.evade += nOf(m[1]); continue; }
      if((m = /^([+\-−]\s*\d+)\s+([A-Za-z][\w'’ .\-]{1,38})$/.exec(t))){ var nm = m[2].trim(); fx.skills[nm] = (fx.skills[nm] || 0) + nOf(m[1]); continue; }
      return null;
    }
    return fx;
  }
  /* the bonus every Stat shares, written once as "All Stats" */
  function allOf(fx){
    var v = STATS.map(function(k){ return fx[k] || 0; }), lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
    return lo > 0 ? lo : hi < 0 ? hi : 0;
  }
  function fxText(fx){
    if(!fx) return "";
    var parts = [], all = allOf(fx);
    if(all) parts.push(sgn(all).replace("−", "-") + " All Stats");
    STATS.forEach(function(k){ if(fx[k] - all) parts.push(sgn(fx[k] - all).replace("−", "-") + " " + SN[k]); });
    if(fx.dr) parts.push("DR " + fx.dr);
    if(fx.evade) parts.push("Evade " + sgn(fx.evade).replace("−", "-"));
    Object.keys(fx.skills || {}).forEach(function(n){ if(fx.skills[n]) parts.push(sgn(fx.skills[n]).replace("−", "-") + " " + n); });
    return parts.join(", ");
  }
  function parseGear(text){
    var t = String(text || "").trim(), m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(t), fx = m ? parseFx(m[2]) : null;
    return fx ? {name: m[1].trim(), fx: fx} : {name: t, fx: blankFx()};
  }
  function gearText(it){ var f = fxText(it.fx); return it.name.trim() + (f ? " (" + f + ")" : ""); }
  function splitSlot(slot, text){ return String(text || "").split(slot === "acc" ? /\r?\n|\s*;\s*/ : /\s*;\s*|\r?\n/).map(function(x){ return x.trim(); }).filter(Boolean); }
  function joinSlot(slot, list){ return list.join(slot === "acc" ? "\n" : "; "); }
  function slotList(slot){ return slot === "hands" || slot === "acc" ? splitSlot(slot, D.gear[slot]) : (D.gear[slot].trim() ? [D.gear[slot].trim()] : []); }
  function setSlotList(slot, list){ D.gear[slot] = slot === "hands" || slot === "acc" ? joinSlot(slot, list) : (list[0] || ""); }
  /* Hands/Holding entries say where they're held: "Gloves: ...", "Main: ...", "Off: ...", "Both: ..." (two-handed) */
  var HPOS = {gloves: "Gloves", main: "Main", off: "Off", both: "Both"};
  function slotItems(slot){
    if(slot !== "hands") return slotList(slot).map(function(t){ return {pos: "", text: t}; });
    var out = [], taken = {};
    slotList("hands").forEach(function(t){ var m = /^(gloves|main|off|both)\s*:\s*(.*)$/i.exec(t); var e = {pos: m ? m[1].toLowerCase() : "", text: m ? m[2].trim() : t}; out.push(e); if(e.pos) taken[e.pos] = 1; });
    out.forEach(function(e){
      if(e.pos) return;
      var nm = parseGear(e.text).name;
      e.pos = /glove|gauntlet|mitt/i.test(nm) && !taken.gloves ? "gloves" : !taken.main && !taken.both ? "main" : !taken.off && !taken.both ? "off" : "extra";
      taken[e.pos] = 1;
    });
    return out;
  }
  function setSlotItems(slot, items){
    if(slot !== "hands"){ setSlotList(slot, items.map(function(e){ return e.text; })); return; }
    var order = {gloves: 0, both: 1, main: 1, off: 2, extra: 3};
    items = items.slice().sort(function(a, b){ return order[a.pos] - order[b.pos]; });
    D.gear.hands = items.map(function(e){ return (HPOS[e.pos] ? HPOS[e.pos] + ": " : "") + e.text; }).join("; ");
  }
  function typeAt(slot, pos){ return slot !== "hands" ? slot : pos === "gloves" ? "gloves" : pos === "both" ? "twohand" : "hand"; }
  function equipped(){
    var out = [];
    SLOTS.forEach(function(s){ slotItems(s[0]).forEach(function(e, i){ out.push({slot: s[0], idx: i, text: e.text, it: parseGear(e.text)}); }); });
    return out;
  }
  function gearTotals(){
    var t = blankFx(), src = {};
    equipped().forEach(function(e){
      var fx = e.it.fx;
      ["str","int","con","dex","cha","dr","evade"].forEach(function(k){ if(fx[k]){ t[k] += fx[k]; (src[k] = src[k] || []).push(e.it.name + " " + sgn(fx[k])); } });
      Object.keys(fx.skills).forEach(function(n){ var key = n.toLowerCase(); t.skills[key] = (t.skills[key] || 0) + fx.skills[n]; (src["s:" + key] = src["s:" + key] || []).push(e.it.name + " " + sgn(fx.skills[n])); });
    });
    t.src = src;
    return t;
  }
  function gearSkillBonus(name){
    var t = gearTotals(), key = String(name || "").trim().toLowerCase();
    return t.skills[key] ? {n: t.skills[key], from: (t.src["s:" + key] || []).join(", ")} : null;
  }
  /* gear changes move Enhanced stats, Armor and Evade Buffs by the difference, so other buffs stay put */
  function applyGearDelta(before, after){
    var moved = [];
    STATS.forEach(function(k){
      var d = after[k] - before[k]; if(!d) return;
      var e = $("cr-" + k); e.value = Math.max(1, (parseInt(e.value, 10) || 1) + d); moved.push(SN[k] + " " + sgn(d));
    });
    if(after.dr !== before.dr){ var a = $("cr-arm"); a.value = Math.max(0, (parseInt(a.value, 10) || 0) + after.dr - before.dr); moved.push("Armor " + sgn(after.dr - before.dr)); }
    if(after.evade !== before.evade){ var v = $("cr-evb"); v.value = (parseInt(v.value, 10) || 0) + after.evade - before.evade; moved.push("Evade Buffs " + sgn(after.evade - before.evade)); }
    if(moved.length){ saveCrawler(); calcRefresh(); }
    return moved;
  }
  function gearChange(fn){
    var before = gearTotals(), msg = fn();
    var moved = applyGearDelta(before, gearTotals());
    changed();
    gearLog((msg || "Gear updated.") + (moved.length ? " " + moved.join(", ") + "." : ""));
  }

  /* inventory notes can start with "Head: +2 Int, DR 1." and "Use: full Mana." so an item keeps what it does */
  var USEWORD = {heal: "heal", mana: "mana", fullhp: "full Health", fullmana: "full Mana"};
  function parseUse(t){
    var m;
    if(/^full\s+(health|hb|hp)$/i.test(t)) return {kind: "fullhp", n: 0};
    if(/^full\s+mana$/i.test(t)) return {kind: "fullmana", n: 0};
    if((m = /^heal\s+(\d+)(?:\s+(?:health\s+)?slots?)?$/i.exec(t))) return {kind: "heal", n: +m[1]};
    if((m = /^(?:restore\s+)?(\d+)\s+mana$/i.exec(t))) return {kind: "mana", n: +m[1]};
    return null;
  }
  function useText(u){ return u.kind === "heal" ? "heal " + plural(u.n, "slot") : u.kind === "mana" ? u.n + " Mana" : USEWORD[u.kind]; }
  function parseItem(row){
    var notes = String(row.notes || ""), out = {name: String(row.name || "").trim(), qty: row.qty, slot: "", fx: blankFx(), use: null, notes: ""};
    var segs = notes.split(/\.\s+|\.$/), i = 0;
    for(; i < segs.length; i++){
      var sgm = segs[i].trim(), m;
      if(!sgm){ continue; }
      if(!out.slot && (m = /^(head|torso|arms|gloves|one[- ]handed|two[- ]handed|hands?|holding|legs|feet|accessory|accessories)(?:\s*:\s*(.+))?$/i.exec(sgm))){
        var fx = m[2] ? parseFx(m[2]) : blankFx(); if(!fx) break;
        var w = m[1].toLowerCase();
        out.slot = /^two/.test(w) ? "twohand" : /^(one|hand|holding)/.test(w) ? "hand" : w.indexOf("access") === 0 ? "acc" : w; out.fx = fx; continue;
      }
      if(!out.use && (m = /^use:\s*(.+)$/i.exec(sgm))){ var u = parseUse(m[1].trim()); if(!u) break; out.use = u; continue; }
      break;
    }
    out.notes = segs.slice(i).join(". ").replace(/\s+\.$/, "").trim();
    if(out.notes && /\.$/.test(notes.trim()) && !/\.$/.test(out.notes)) out.notes += ".";
    return out;
  }
  function itemNotes(it){
    var parts = [];
    if(it.slot){ var f = fxText(it.fx); parts.push(SLOTWORD[it.slot] + (f ? ": " + f : "")); }
    if(it.use) parts.push("Use: " + useText(it.use));
    var head = parts.join(". ");
    return head ? head + "." + (it.notes ? " " + it.notes : "") : (it.notes || "");
  }
  function qtyOf(r){ var q = parseInt(r.qty, 10); return isNaN(q) ? (r.name.trim() ? 1 : 0) : q; }
  function findRow(re){ for(var k = 0; k < INV_ROWS; k++) if(re.test(D.inv[k].name.trim())) return k; return -1; }
  function freeRow(){ for(var k = 0; k < INV_ROWS; k++) if(!D.inv[k].name.trim()) return k; return -1; }
  function invCount(){ return D.inv.filter(function(r){ return r.name.trim(); }).length; }

  /* ---------- the change hub ---------- */
  function changed(){ saveData(); fillSources(); renderTools(); dmRefresh(); sheetChanged(); }

  /* ---------- small DOM helper ---------- */
  function el(tag, attrs, kids){
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k){
      var v = attrs[k]; if(v == null || v === false) return;
      if(k === "text") e.textContent = v; else if(k === "cls") e.className = v; else if(k === "html") e.innerHTML = v;
      else if(k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else if(k === "value") e.value = v; else if(k === "checked") e.checked = !!v; else if(k === "disabled") e.disabled = !!v;
      else e.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function(c){ if(c == null || c === false) return; e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); });
    return e;
  }
  function chipsOf(list){ return list.length ? el("span", {cls: "chips"}, list) : null; }
  function chip(t, cls, eq){ var c = el("span", {cls: "chip" + (cls ? " " + cls : ""), text: t}); if(eq){ c.setAttribute("data-eq", eq); c.tabIndex = 0; } return c; }
  function logTo(id, head, detail, eq){
    var ol = $(id), b = span(head, eq || null); b.className = "h";
    var li = el("li", {}, [b, detail ? " " + detail : ""]); ol.insertBefore(li, ol.firstChild);
    while(ol.children.length > 10) ol.removeChild(ol.lastChild);
  }
  function gearLog(t){ $("gear-log").textContent = t; }
  function petLog(t){ $("pet-log").textContent = t; }

  /* ============================== SKILLS ============================== */
  var skEdit = null;   /* {row} being edited, or {row: -1} for a new Skill */
  function renderSkills(){
    var c = crawler(), tb = $("sk-rows"); tb.innerHTML = "";
    sortSkills();
    var ticked = 0;
    D.skills.forEach(function(s, i){
      var r = skRank(s), k = skStat(s), mod = k ? c.mod[k] : 0, gb = gearSkillBonus(s.name), g = grindOf(s.notes), pas = isPassive(s);
      if(s.mark) ticked++;
      var tot = r + mod + (gb ? gb.n : 0);
      var eq = "Rank " + r + (k ? "\n+ " + SN[k] + " Mod " + mod : "") + (gb ? "\n+ " + gb.n + " from gear (" + gb.from + ")" : "") + "\n= d20 " + sgn(tot);
      var tick = el("input", {type: "checkbox", checked: s.mark, "aria-label": "Tick " + s.name + " for advancement",
        onchange: function(){ s.mark = this.checked; changed(); }});
      var row = el("tr", {cls: s.mark ? "on" : ""}, [
        el("td", {cls: "tk"}, [tick]),
        el("td", {cls: "nm"}, [el("b", {text: s.name.trim()}), skAdvBonus(s.name) ? el("span", {cls: "chips"}, [chip("Adv +" + skAdvBonus(s.name), "fx", "Adds " + skAdvBonus(s.name) + " to this Skill’s end-of-floor advancement checks")]) : null,
          el("small", {text: [s.type, stripTags(s.notes)].filter(Boolean).join(". ")})]),
        el("td", {cls: "n", "data-label": "Rank"}, [el("span", {cls: "rk", text: String(r)}), " ", el("small", {text: "of " + skMax(s.name)})]),
        el("td", {cls: "n", "data-label": "Roll"}, [pas ? el("small", {text: "Passive"}) : span("d20 " + sgn(tot), eq)]),
        el("td", {cls: "n", "data-label": "Grind"}, [pas ? el("small", {text: "n/a"}) : span(g + " of " + r + " h", "Grinding hours " + g + " of " + r + "\nAt " + r + " hours this Skill rolls an advancement check")]),
        el("td", {cls: "act"}, [
          pas ? null : el("button", {type: "button", cls: "btn small", text: "Roll", onclick: function(){ openCheck({skill: s.name}); }}),
          el("button", {type: "button", cls: "btn small", text: "Edit", onclick: function(){ skEdit = {row: s.row}; renderSkillEdit(); }})
        ])
      ]);
      tb.appendChild(row);
    });
    if(!D.skills.length) tb.appendChild(el("tr", {}, [el("td", {colspan: "6", cls: "emptyrow", text: SH.doc ? "No Skills on your sheet yet." : "No Skills yet. Link your sheet, or add them here."})]));
    $("sk-sum").textContent = plural(D.skills.length, "Skill") + " of " + SK_ROWS + " rows" + (ticked ? ", " + ticked + " ticked for advancement." : ". None ticked yet.");
    $("sk-add").disabled = D.skills.length >= SK_ROWS;
    /* Advantage picker for the Human end-of-floor perk */
    var sel = $("sk-advsel"), keep = sel.value; sel.innerHTML = "";
    sel.appendChild(el("option", {value: "", text: "No"}));
    D.skills.forEach(function(s){ if(s.mark && skRank(s) <= 9) sel.appendChild(el("option", {value: s.name, text: s.name.trim() + " (Rank " + skRank(s) + ")"})); });
    sel.value = Array.prototype.some.call(sel.options, function(o){ return o.value === keep; }) ? keep : "";
    /* Floors 1 and 2: learn one Skill you tried untrained at the end of each 2-hour session */
    var zero = D.skills.filter(function(s){ return s.mark && !skRank(s) && !isPassive(s); }), ls = $("sk-learn"), lk = ls.value;
    $("sk-learn-l").classList.toggle("hide", !(floor <= 2 && zero.length));
    ls.innerHTML = "";
    if(zero.length > 1) ls.appendChild(el("option", {value: "", text: "Pick one"}));
    zero.forEach(function(s){ ls.appendChild(el("option", {value: s.name, text: s.name.trim()})); });
    if(Array.prototype.some.call(ls.options, function(o){ return o.value === lk; })) ls.value = lk;
    renderGrind();
    renderSkillEdit();
  }
  function renderSkillEdit(){
    var box = $("sk-edit");
    if(!skEdit){ box.classList.add("hide"); return; }
    var s = skEdit.row >= 0 ? D.skills.filter(function(x){ return x.row === skEdit.row; })[0] : null;
    if(skEdit.row >= 0 && !s){ skEdit = null; box.classList.add("hide"); return; }
    box.classList.remove("hide");
    $("se-title").textContent = s ? "Edit " + s.name.trim() : "Add a Skill";
    if(!skEdit.filled){
      $("se-name").value = s ? s.name.trim() : ""; $("se-rank").value = s ? skRank(s) : 1;
      $("se-stat").value = s ? (skStat(s) || "none") : "int"; $("se-type").value = s ? s.type : "Unopposed";
      $("se-notes").value = s ? stripGrind(s.notes) : ""; $("se-grind").value = s ? grindOf(s.notes) : 0;
      $("se-adv").value = s ? skAdvBonus(s.name) : 0; $("se-max").checked = s ? skMax(s.name) === 20 : false;
      skEdit.filled = true;
    }
    $("se-del").classList.toggle("hide", !s);
  }
  $("sk-add").addEventListener("click", function(){ skEdit = {row: -1}; renderSkillEdit(); $("se-name").focus(); });
  $("se-cancel").addEventListener("click", function(){ skEdit = null; renderSkillEdit(); });
  $("se-save").addEventListener("click", function(){
    var name = $("se-name").value.trim(); if(!name){ $("se-msg").textContent = "Give the Skill a name."; return; }
    var dup = findSkill(name), s = skEdit.row >= 0 ? D.skills.filter(function(x){ return x.row === skEdit.row; })[0] : null;
    if(dup && dup !== s){ $("se-msg").textContent = "You already have a Skill called " + dup.name.trim() + "."; return; }
    if(!s){
      var used = D.skills.map(function(x){ return x.row; }), row = -1;
      for(var k = 0; k < SK_ROWS; k++) if(used.indexOf(k) < 0){ row = k; break; }
      if(row < 0){ $("se-msg").textContent = "All " + SK_ROWS + " Skill rows on the sheet are full."; return; }
      s = {row: row, name: "", rank: "", stat: "", type: "", notes: "", mark: false}; D.skills.push(s);
    }
    var k2 = $("se-stat").value, c = crawler();
    s.name = name; s.type = $("se-type").value.trim();
    var nr = Math.max(0, Math.min(20, num("se-rank", 0))); if(String(nr) !== s.rank) setRank(s, nr);
    if(k2 === "none"){ if(statKey(s.stat) || !s.stat) s.stat = "None"; }
    else if(statKey(s.stat) !== k2 || !isModText(s.stat)) s.stat = modText(k2, c);
    var tg = {grind: Math.max(0, num("se-grind", 0)), adv: Math.max(0, num("se-adv", 0)), max: $("se-max").checked};
    var oldBase = stripTags(s.notes), newBase = $("se-notes").value.trim();
    /* keep the sheet's wording if the note text wasn't touched */
    var tg0 = tagsOf(s.notes);
    if(newBase !== oldBase || tg0.grind !== tg.grind || tg0.adv !== tg.adv || tg0.max !== tg.max) s.notes = withTags(newBase, tg);
    $("se-msg").textContent = ""; skEdit = null; changed();
  });
  $("se-del").addEventListener("click", function(){
    var s = D.skills.filter(function(x){ return x.row === skEdit.row; })[0]; if(!s) return;
    if(!window.confirm("Remove " + s.name.trim() + " from your Skills?")) return;
    D.skills.splice(D.skills.indexOf(s), 1); skEdit = null; changed();
  });
  /* ticking from a roll in the Check tab */
  function tickSkill(name){
    var s = findSkill(name); if(!s || s.mark || isPassive(s)) return;
    s.mark = true; changed();
  }
  function advRoll(s, opts){
    var r0 = skRank(s), cap = skMax(s.name), bonus = opts.floor ? skAdvBonus(s.name) : 0, adv = opts.adv === s.name;
    var a = rnd(20), b = adv ? rnd(20) : null, kept = adv ? Math.max(a, b) : a, tot = kept + bonus;
    var up = r0 < cap && tot >= r0;
    if(up) setRank(s, r0 + 1);
    if(!opts.keepMark) s.mark = false;
    var eq = (adv ? "2d20 with Advantage rolled " + a + " and " + b + ", kept " + kept : "1d20 rolled " + a) + (bonus ? "\n+ " + bonus + " advancement bonus = " + tot : "") +
      "\nagainst Rank " + r0 + "\n" + (r0 >= cap ? "already at the Rank " + cap + " cap" : up ? tot + " is " + r0 + " or more: gain 1 Rank, now " + (r0 + 1) : tot + " is under " + r0 + ": no change") + (opts.keepMark ? "" : "\nTick cleared");
    logTo("sk-log", up ? s.name.trim() + " +1 Rank" : s.name.trim() + " no change", opts.why, eq);
    return up;
  }
  function runChecks(all){
    var did = 0, ups = 0, adv = all ? $("sk-advsel").value : "", zero = [];
    D.skills.forEach(function(s){
      if(!s.mark) return;
      if(!skRank(s)){ zero.push(s); return; }
      if(!all && skRank(s) >= 5) return;
      did++; if(advRoll(s, {floor: all, adv: adv, why: all ? "end-of-floor check" : "2-hour check"})) ups++;
    });
    if(zero.length){
      if(floor <= 2){
        var pick = $("sk-learn").value, got = zero.filter(function(s){ return s.name === pick; })[0] || (zero.length === 1 ? zero[0] : null);
        if(!got){ logTo("sk-log", "Pick one to learn", "You tried " + zero.map(function(s){ return s.name.trim(); }).join(", ") + " untrained. Choose which one you learn, then roll again."); if(did) changed(); else renderSkills(); return; }
        setRank(got, 1); zero.forEach(function(s){ s.mark = false; }); did++;
        logTo("sk-log", got.name.trim() + " learned", "Rank 1 from trying it untrained", "Floors 1 and 2: at the end of each 2-hour session you gain 1 Rank in one Skill you tried untrained.\nThe rest of the list is wiped.");
      } else {
        zero.forEach(function(s){ s.mark = false; }); did++;
        logTo("sk-log", "Untrained ticks cleared", "From Floor 3, trying a Skill untrained doesn’t teach it.");
      }
    }
    if(!did){ logTo("sk-log", "Nothing to roll", all ? "No Skills are ticked." : "No ticked Skills at Rank 4 or lower. Rank 5 and up roll at the end of the floor."); return; }
    changed();
  }
  $("sk-2h").addEventListener("click", function(){ runChecks(false); });
  $("sk-floor").addEventListener("click", function(){ runChecks(true); });

  /* grinding */
  function renderGrind(){
    var list = $("gr-list"), keep = {};
    list.querySelectorAll("input[data-sk]").forEach(function(i){ keep[i.getAttribute("data-sk")] = i.value; });
    list.innerHTML = "";
    var any = false;
    D.skills.forEach(function(s){
      if(isPassive(s)) return; any = true;
      var r = skRank(s), g = grindOf(s.notes), need = Math.max(1, r - g);
      var inp = el("input", {type: "number", min: "0", max: String(need), value: keep[s.name] || "", inputmode: "numeric", "data-sk": s.name, "aria-label": "Grind hours for " + s.name.trim(), oninput: grindLeft});
      list.appendChild(el("label", {}, [el("span", {text: s.name.trim()}), el("small", {text: g ? g + " of " + r + " h" : "needs " + plural(Math.max(1, r), "hour")}), inp]));
    });
    if(!any) list.appendChild(el("p", {cls: "sub", text: "Add a Skill that isn’t Passive to grind it."}));
    var x = X(), lvl = crawler().lvl;
    $("gr-lvl").textContent = "Grinding toward your next level: " + x.grind + " of " + lvl + " hours. Grinding as many hours as your Level gives you a Level.";
    grindLeft();
  }
  function grindHours(){
    var h = Math.max(0, num("gr-h", 0)), map = h >= 5 ? (parseInt($("gr-map").value, 10) || 0) : 0;
    return {declared: h, map: map, max: h + map};
  }
  function grindLeft(){
    var gh = grindHours(), used = 0;
    $("gr-list").querySelectorAll("input[data-sk]").forEach(function(i){ used += Math.max(0, parseInt(i.value, 10) || 0); });
    var extra = Math.max(0, gh.declared - 5);
    $("gr-left").textContent = used + " of " + plural(gh.max, "hour") + " placed" + (gh.map ? " (with " + gh.map + " from the map)" : "") + "." +
      (extra ? " Hours past 5 each need an Unopposed Endurance check; a fail wastes the hour and gives Fatigued." : "");
    $("gr-go").disabled = !used || used > gh.max;
  }
  $("gr-h").addEventListener("input", grindLeft); $("gr-map").addEventListener("change", grindLeft);
  $("gr-go").addEventListener("click", function(){
    var gh = grindHours(), c = crawler(), F = floor, wasted = 0, fat = 0;
    var end = findSkill("Endurance"), er = end ? skRank(end) : 0;
    for(var hr = 6; hr <= gh.declared; hr++){
      var a = rnd(20), bonus = er + c.mod.con, tgt = 10 + 2 * F, ok = a !== 1 && (a === 20 || a + bonus >= tgt);
      logTo("sk-log", ok ? "Hour " + hr + " counted" : "Hour " + hr + " wasted", "Endurance check" + (ok ? "" : ", Fatigued"),
        "1d20 rolled " + a + "\n+ Endurance Rank " + er + (er ? "" : " (untrained)") + "\n+ Con Mod " + c.mod.con + "\n= " + (a + bonus) + " against " + tgt + " (10 + 2 × Floor " + F + ")");
      if(!ok){ wasted++; fat++; }
    }
    if(fat){ $("ck-fat").value = num("ck-fat", 0) + fat; ckRefresh(); }
    var credit = gh.declared - wasted + gh.map, plan = [];
    $("gr-list").querySelectorAll("input[data-sk]").forEach(function(i){ var n = Math.max(0, parseInt(i.value, 10) || 0); if(n) plan.push([i.getAttribute("data-sk"), n]); });
    var left = credit;
    plan.forEach(function(p){
      var s = findSkill(p[0]); if(!s) return;
      var n = Math.min(p[1], left); left -= n; if(!n) return;
      var r = skRank(s), g = grindOf(s.notes) + n;
      if(g >= Math.max(1, r)){
        s.notes = withGrind(s.notes, 0);
        advRoll(s, {floor: false, adv: "", keepMark: true, why: "grind check after " + plural(g, "hour")});
      } else s.notes = withGrind(s.notes, g);
    });
    if(left < credit && plan.reduce(function(t, p){ return t + p[1]; }, 0) > credit) logTo("sk-log", "Short on hours", "Wasted hours meant some Skills got fewer hours than you planned.");
    var x = X(); x.grind += credit;
    if(x.grind >= c.lvl){
      x.grind = 0; $("cr-lvl").value = c.lvl + 1; saveCrawler(); calcRefresh();
      logTo("sk-log", "Level " + (c.lvl + 1), "from grinding", "Your grind hours reached your Level " + c.lvl + ", so you gain a Level.\nThe grind counter starts again at 0.\nIn a party, the lowest-Level crawler gains 1d2 Levels instead.");
    }
    xSave();
    $("gr-list").querySelectorAll("input[data-sk]").forEach(function(i){ i.value = ""; });
    changed();
  });

  /* try a Skill you don't have: Disadvantage, no Rank. On Floors 1 and 2 it goes on the sheet at Rank 0 so you can learn it */
  $("st-go").addEventListener("click", function(){
    var name = $("st-name").value.trim().replace(/[;]/g, ""), k = $("st-stat").value, c = crawler(), msg = $("st-msg");
    if(!name){ msg.textContent = "Name the Skill you want to try."; return; }
    var s = findSkill(name);
    if(s && skRank(s) > 0){ msg.textContent = "You already have " + s.name.trim() + " at Rank " + skRank(s) + "."; openCheck({skill: s.name}); return; }
    if(s && isPassive(s)){ msg.textContent = "Passive Skills can’t be tried untrained."; return; }
    if(!s && floor <= 2){
      var used = D.skills.map(function(x){ return x.row; }), row = -1;
      for(var r = 0; r < SK_ROWS; r++) if(used.indexOf(r) < 0){ row = r; break; }
      if(row < 0){ msg.textContent = "All " + SK_ROWS + " Skill rows on the sheet are full, so it can’t be noted for learning."; openCheck({skill: name, stat: k}); return; }
      s = {row: row, name: name, rank: "0", stat: modText(k, c), type: "Unopposed", notes: "", mark: false}; D.skills.push(s); changed();
      msg.textContent = name + " is on your sheet at Rank 0. Roll it in the Check tab to tick it.";
    } else msg.textContent = floor <= 2 ? "" : "Trying it won’t teach it from Floor 3, so it isn’t added to your sheet.";
    $("st-name").value = "";
    openCheck({skill: s ? s.name : name, stat: k});
  });

  /* open the Check tab with a Skill picked */
  function openCheck(o){
    selectTool("check"); $("ck-other").value = 0;
    if(o.skill){
      var idx = -1; D.skills.forEach(function(s, i){ if(s.name.trim().toLowerCase() === o.skill.trim().toLowerCase()) idx = i; });
      if(idx >= 0){ $("ck-src").value = "s:" + idx; $("ck-src").dispatchEvent(new Event("change")); }
      else {
        $("ck-src").value = ""; ck.src = null;
        document.querySelector('#tp-check .seg button[data-kind="skill"]').click();
        if(o.stat) $("ck-stat").value = o.stat; $("ck-rank").value = 0; $("ck-untr").checked = true;
      }
    }
    if(o.target != null){ $("ck-tgt").value = o.target; ck.tgtSrc = "manual"; }
    $("ck-d1").value = ""; $("ck-d2").value = ""; ck.fav = false;
    ckRefresh();
    if(o.note) $("ck-odds").insertAdjacentText("beforeend", " " + o.note);
    var top = $("tp-check").getBoundingClientRect().top + window.scrollY - navH() - 12; if(window.scrollY > top) window.scrollTo(0, top);
  }

  /* ============================== GEAR ============================== */
  var itEdit = null;   /* {kind: "inv", row} | {kind: "slot", slot, idx} | {kind: "new"} */
  function fxChips(fx, slot, use){
    var out = [];
    if(slot) out.push(chip(SLOTWORD[slot], "wear"));
    var all = allOf(fx); if(all) out.push(chip(sgn(all) + " All Stats", "fx"));
    STATS.forEach(function(k){ if(fx[k] - all) out.push(chip(sgn(fx[k] - all) + " " + SN[k], "fx")); });
    if(fx.dr) out.push(chip("DR " + fx.dr, "fx"));
    if(fx.evade) out.push(chip("Evade " + sgn(fx.evade), "fx"));
    Object.keys(fx.skills).forEach(function(n){ out.push(chip(sgn(fx.skills[n]) + " " + n, "fx")); });
    if(use) out.push(chip("Use: " + useText(use), "use"));
    return out;
  }
  function itemRow(slot, e, i, label){
    var it = parseGear(e.text);
    return el("li", {}, [label ? el("small", {cls: "pos", text: label}) : null, el("span", {cls: "inm", text: it.name}), chipsOf(fxChips(it.fx)),
      el("span", {cls: "act"}, [
        el("button", {type: "button", cls: "btn small", text: "Unequip", onclick: function(){ unequip(slot, i); }}),
        el("button", {type: "button", cls: "btn small", text: "Edit", onclick: function(){ itEdit = {kind: "slot", slot: slot, idx: i}; renderItemEdit(); }})
      ])]);
  }
  function renderGear(){
    var c = crawler(), t = gearTotals(), wrap = $("gear-slots"); wrap.innerHTML = "";
    SLOTS.forEach(function(s){
      var items = slotItems(s[0]), body;
      if(s[0] === "hands"){
        /* gloves, main hand and off hand, the way the book splits Hands/Holding */
        var at = function(pos){ for(var i = 0; i < items.length; i++) if(items[i].pos === pos) return i; return -1; };
        var both = at("both"), rows = [];
        [["gloves", "Gloves"], ["main", "Main hand"], ["off", "Off hand"]].forEach(function(p){
          var i = p[0] !== "gloves" && both >= 0 ? both : at(p[0]);
          if(p[0] === "off" && both >= 0){ rows.push(el("li", {cls: "held"}, [el("small", {cls: "pos", text: p[1]}), el("span", {cls: "sub", text: "Held with both hands"})])); return; }
          rows.push(i >= 0 ? itemRow("hands", items[i], i, p[0] === "main" && both >= 0 ? "Both hands" : p[1]) : el("li", {cls: "held"}, [el("small", {cls: "pos", text: p[1]}), el("span", {cls: "sub", text: "Empty"})]));
        });
        items.forEach(function(e, i){ if(e.pos === "extra") rows.push(itemRow("hands", e, i, "Extra")); });
        body = el("ul", {cls: "hands"}, rows);
      } else body = items.length ? el("ul", {}, items.map(function(e, i){ return itemRow(s[0], e, i, ""); })) : el("p", {cls: "sub", text: "Empty"});
      wrap.appendChild(el("div", {cls: "slot" + (items.length ? "" : " vacant")}, [
        el("h5", {}, [s[1], s[0] === "acc" ? el("small", {text: " " + items.length + " of " + ACC_MAX}) : null]), body
      ]));
    });
    /* totals and mismatch hints */
    var sum = $("gear-sum"); sum.innerHTML = "";
    var parts = [];
    STATS.forEach(function(k){ if(t[k]) parts.push(span(sgn(t[k]) + " " + SN[k], (t.src[k] || []).join("\n"))); });
    if(t.dr) parts.push(span("DR " + t.dr, (t.src.dr || []).join("\n")));
    if(t.evade) parts.push(span("Evade " + sgn(t.evade), (t.src.evade || []).join("\n")));
    Object.keys(t.skills).forEach(function(k){ parts.push(span(sgn(t.skills[k]) + " " + k.replace(/\b\w/g, function(ch){ return ch.toUpperCase(); }), (t.src["s:" + k] || []).join("\n"))); });
    var p = el("p", {cls: "out"}); fill(p, parts.length ? ["Your gear gives "].concat(parts.reduce(function(a, x, i){ if(i) a.push(", "); a.push(x); return a; }, []), ["."]) : ["Nothing you’re wearing gives a bonus yet."]);
    sum.appendChild(p);
    var fixes = [];
    STATS.forEach(function(k){ var want = c.base[k] + t[k]; if(c.score[k] < want) fixes.push([SFULL[k] + " is " + c.score[k] + ", but Unenhanced " + c.base[k] + " + " + t[k] + " from gear is " + want + ".", function(){ $("cr-" + k).value = want; }]); });
    if(c.arm < t.dr) fixes.push(["Armor DR is " + c.arm + ", but your gear gives DR " + t.dr + ".", function(){ $("cr-arm").value = t.dr; }]);
    if(fixes.length){
      var ul = el("ul", {cls: "fixes"});
      fixes.forEach(function(f){ ul.appendChild(el("li", {}, [f[0] + " ", el("button", {type: "button", cls: "btn small", text: "Fix it", onclick: function(){ f[1](); saveCrawler(); calcRefresh(); changed(); }})])); });
      sum.appendChild(ul);
    }
    renderInv(); renderHot(); renderItemEdit();
  }
  /* inventory kinds for the filter, worked out from the item itself */
  var CATS = [["all", "All"], ["weapons", "Weapons"], ["wear", "Wearables"], ["acc", "Accessories"], ["use", "Consumables"], ["scrolls", "Scrolls"], ["boxes", "Loot Boxes"], ["other", "Other"]];
  var invCat = "all";
  function catOf(it){
    if(isBoxNotes(it.notes)) return "boxes";
    if(/^(scroll|spellbook|tome)\b/i.test(it.name)) return "scrolls";
    if(it.use) return "use";
    if(it.slot === "hand" || it.slot === "twohand") return "weapons";
    if(it.slot === "acc") return "acc";
    if(it.slot) return "wear";
    return /potion|elixir|tonic|food|ration|bandage/i.test(it.name) ? "use" : "other";
  }
  function renderInv(){
    var tb = $("inv-rows"); tb.innerHTML = "";
    var gk = findRow(/^gold$/i), jk = findRow(/^misc\.?\s*junk$/i);
    if(document.activeElement !== $("inv-gold")) $("inv-gold").value = gk >= 0 ? qtyOf(D.inv[gk]) : 0;
    if(document.activeElement !== $("inv-junk")) $("inv-junk").value = jk >= 0 ? qtyOf(D.inv[jk]) : 0;
    var q = ($("inv-q").value || "").trim().toLowerCase(), rows = [], counts = {};
    CATS.forEach(function(c2){ counts[c2[0]] = 0; });
    D.inv.forEach(function(r, k){
      if(!r.name.trim() || k === gk || k === jk) return;
      var it = parseItem(r), ct = catOf(it); counts.all++; counts[ct]++;
      if(invCat !== "all" && ct !== invCat) return;
      if(q && (it.name + " " + it.notes + " " + fxText(it.fx)).toLowerCase().indexOf(q) < 0) return;
      rows.push({k: k, r: r, it: it});
    });
    var so = $("inv-sort").value;
    if(so === "az") rows.sort(function(a, b){ return a.it.name.localeCompare(b.it.name); });
    if(so === "qty") rows.sort(function(a, b){ return qtyOf(b.r) - qtyOf(a.r) || a.it.name.localeCompare(b.it.name); });
    /* the filter buttons are made once and updated in place, so a click isn't lost to a redraw */
    var cats = $("inv-cats");
    CATS.forEach(function(c2){
      var b = cats.querySelector('[data-cat="' + c2[0] + '"]');
      if(!b){ b = el("button", {type: "button", "data-cat": c2[0], onclick: function(){ invCat = c2[0]; renderInv(); }}); cats.appendChild(b); }
      b.textContent = c2[1] + " " + counts[c2[0]]; b.setAttribute("aria-pressed", String(invCat === c2[0]));
      b.hidden = c2[0] !== "all" && !counts[c2[0]] && invCat !== c2[0];
    });
    rows.forEach(function(o){
      var k = o.k, r = o.r, it = o.it, bx = isBoxNotes(it.notes) ? boxOf(r) : null;
      if(bx){
        tb.appendChild(el("tr", {cls: "boxrow"}, [
          el("td", {cls: "nm"}, [el("b", {text: it.name}), chipsOf([chip("Loot Box", "box"), bx.tier ? chip(cap(bx.tier), "box") : null, bx.random ? chip("Random", "box") : null].filter(Boolean)), el("small", {text: boxSummary(bx)})]),
          el("td", {cls: "n qty", "data-label": "Qty"}, [el("span", {text: String(qtyOf(r))})]),
          el("td", {cls: "act"}, [
            el("button", {type: "button", cls: "btn small", text: "Open", onclick: function(){ openBox(k); }}),
            el("button", {type: "button", cls: "btn small", text: "Edit", onclick: function(){ itEdit = {kind: "inv", row: k}; renderItemEdit(); }})
          ])
        ]));
        return;
      }
      var wear = it.slot ? null : el("select", {cls: "small", "aria-label": "Equip " + it.name + " to", onchange: function(){ if(this.value) equip(k, this.value); }},
        [el("option", {value: "", text: "Equip to…"})].concat(EQUIPTO.map(function(x){ return el("option", {value: x[0], text: x[1]}); })));
      tb.appendChild(el("tr", {}, [
        el("td", {cls: "nm"}, [el("b", {text: it.name}), chipsOf(fxChips(it.fx, it.slot, it.use)), it.notes ? el("small", {text: it.notes}) : null]),
        el("td", {cls: "n qty", "data-label": "Qty"}, [
          el("button", {type: "button", cls: "btn small step", text: "−", "aria-label": "One fewer " + it.name, onclick: function(){ stepQty(k, -1); }}),
          el("span", {text: String(qtyOf(r))}),
          el("button", {type: "button", cls: "btn small step", text: "+", "aria-label": "One more " + it.name, onclick: function(){ stepQty(k, 1); }})
        ]),
        el("td", {cls: "act"}, [
          it.slot ? el("button", {type: "button", cls: "btn small", text: "Equip", onclick: function(){ equip(k, it.slot); }}) : wear,
          it.use ? el("button", {type: "button", cls: "btn small", text: "Use", onclick: function(){ useItem(k); }}) : null,
          el("button", {type: "button", cls: "btn small", text: "Edit", onclick: function(){ itEdit = {kind: "inv", row: k}; renderItemEdit(); }})
        ])
      ]));
    });
    if(!rows.length) tb.appendChild(el("tr", {}, [el("td", {colspan: "3", cls: "emptyrow", text: counts.all ? "Nothing matches." : "Nothing else in your Inventory."})]));
    $("inv-count").textContent = invCount() + " of " + INV_ROWS + " rows used";
    $("it-add").disabled = invCount() >= INV_ROWS;
  }
  $("inv-q").addEventListener("input", renderInv);
  $("inv-sort").addEventListener("change", renderInv);
  function stepQty(k, d){
    var r = D.inv[k], q = qtyOf(r) + d;
    if(q <= 0 && !window.confirm("Remove " + r.name.trim() + " from your Inventory?")) return;
    setQty(k, q); gearLog(q <= 0 ? "Removed " + r.name.trim() + "." : r.name.trim() + ": " + q + "."); changed();
  }
  function renderHot(){
    var g = $("hot-grid");
    if(!g.children.length){
      for(var i = 0; i < 10; i++) (function(i){
        g.appendChild(el("label", {}, [el("span", {text: String(i + 1)}), el("textarea", {rows: "2", "data-hot": String(i), "aria-label": "Hotlist box " + (i + 1),
          oninput: function(){ D.hot[i] = this.value; saveData(); sheetChanged(); }})]));
      })(i);
    }
    g.querySelectorAll("textarea").forEach(function(t){ if(document.activeElement !== t) t.value = D.hot[+t.getAttribute("data-hot")] || ""; });
  }
  function setQty(k, q){ if(q <= 0) D.inv[k] = {name: "", qty: "", notes: ""}; else D.inv[k].qty = String(q); }
  function equip(k, type){
    var r = D.inv[k], it = parseItem(r), slot = sheetSlot(type), items = slotItems(slot), out = [], pos = "";
    if(slot === "acc"){
      var kind = /\bbelt\b/i.test(it.name) ? "belt" : /\bcape\b/i.test(it.name) ? "cape" : "";
      if(kind && items.some(function(e){ return new RegExp("\\b" + kind + "\\b", "i").test(parseGear(e.text).name); })){ gearLog("You can only wear one " + kind + "."); renderInv(); return; }
      if(items.length >= ACC_MAX){ gearLog("Your Accessories slot is full (" + ACC_MAX + "). Unequip something first."); renderInv(); return; }
    } else if(slot === "hands"){
      var has = function(p){ return items.some(function(e){ return e.pos === p; }); };
      if(type === "gloves"){ pos = "gloves"; out = items.filter(function(e){ return e.pos === "gloves"; }); }
      else if(type === "twohand"){ pos = "both"; out = items.filter(function(e){ return e.pos !== "gloves"; }); }
      else if(has("both")){ pos = "main"; out = items.filter(function(e){ return e.pos === "both"; }); }
      else if(!has("main")) pos = "main";
      else if(!has("off")) pos = "off";
      else { pos = "main"; out = items.filter(function(e){ return e.pos === "main"; }); }
    } else out = items.slice();
    var room = INV_ROWS - invCount() + (qtyOf(r) <= 1 ? 1 : 0);
    if(out.length > room){ gearLog("Your Inventory is full, so there’s nowhere to put what you’d take off. Make room first."); renderInv(); return; }
    gearChange(function(){
      if(it.notes || it.use){ var x = X(); x.inotes[it.name.toLowerCase()] = {notes: it.notes, use: it.use}; xSave(); }
      var keep = items.filter(function(e){ return out.indexOf(e) < 0; });
      keep.push({pos: pos, text: gearText({name: it.name, fx: it.fx})}); setSlotItems(slot, keep);
      setQty(k, qtyOf(r) - 1);
      var msg = "Equipped " + it.name + " (" + (slot === "hands" ? ({gloves: "Gloves", main: "main hand", off: "off hand", both: "both hands"})[pos] : SLOTWORD[type]) + ").";
      out.forEach(function(e){ toInv(e.text, typeAt(slot, e.pos)); msg += " " + parseGear(e.text).name + " went back to your Inventory."; });
      return msg;
    });
  }
  function toInv(text, type){
    var it = parseGear(text), x = X(), cached = x.inotes[it.name.toLowerCase()] || {};
    var notes = itemNotes({slot: type, fx: it.fx, use: cached.use || null, notes: cached.notes || ""});
    for(var k = 0; k < INV_ROWS; k++) if(D.inv[k].name.trim().toLowerCase() === it.name.toLowerCase() && D.inv[k].notes === notes){ D.inv[k].qty = String(qtyOf(D.inv[k]) + 1); return true; }
    var f = freeRow(); if(f < 0) return false;
    D.inv[f] = {name: it.name, qty: "1", notes: notes}; return true;
  }
  function unequip(slot, i){
    var items = slotItems(slot), e = items[i]; if(!e) return;
    if(freeRow() < 0){ gearLog("Your Inventory is full (" + INV_ROWS + " rows). Make room first."); return; }
    gearChange(function(){ items.splice(i, 1); setSlotItems(slot, items); toInv(e.text, typeAt(slot, e.pos)); return "Unequipped " + parseGear(e.text).name + "."; });
  }
  function useItem(k){
    var r = D.inv[k], it = parseItem(r), c = crawler(), u = it.use, res = "";
    if(!u) return;
    if(u.kind === "heal"){ var s0 = hm.slots; hm.slots = Math.min(10, hm.slots + u.n); res = "healed " + plural(hm.slots - s0, "slot"); }
    if(u.kind === "fullhp"){ res = "Health " + hm.slots + " to 10 slots"; hm.slots = 10; }
    if(u.kind === "mana"){ var m0 = hm.mana; hm.mana = Math.min(c.mana, hm.mana + u.n); res = "+" + (hm.mana - m0) + " Mana"; }
    if(u.kind === "fullmana"){ res = "Mana " + hm.mana + " to " + c.mana; hm.mana = c.mana; }
    setQty(k, qtyOf(r) - 1);
    hmRender();
    gearLog("Used " + it.name + ": " + res + "." + (/potion/i.test(it.name) ? " In combat that costs an Action, and a second potion within a round of the first gives Potion Sickness." : ""));
    changed();
  }
  /* a plain number sets the count; +50 adds and -20 spends */
  function countInput(id, re, name){
    var inp = $(id);
    inp.addEventListener("change", function(){
      var k = findRow(re), cur = k >= 0 ? qtyOf(D.inv[k]) : 0, m = /^\s*([+\-−])?\s*(\d+)\s*$/.exec(inp.value);
      if(!m){ gearLog("Type a number, or +50 to add and -20 to spend."); inp.value = cur; return; }
      var n = m[1] ? cur + (m[1] === "+" ? 1 : -1) * +m[2] : +m[2];
      if(n < 0){ gearLog("You only have " + cur + " " + name + "."); inp.value = cur; return; }
      inp.value = n; setCount(re, name, n); gearLog(name + " " + cur + " to " + n + ".");
    });
    inp.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); inp.blur(); } });
  }
  countInput("inv-gold", /^gold$/i, "Gold");
  countInput("inv-junk", /^misc\.?\s*junk$/i, "Misc. Junk");
  function setCount(re, name, n){
    var k = findRow(re);
    if(k < 0){ if(!n) return; k = freeRow(); if(k < 0){ gearLog("Your Inventory is full."); return; } D.inv[k] = {name: name, qty: "0", notes: ""}; }
    D.inv[k].qty = String(n); changed();
  }
  $("inv-sell").addEventListener("click", function(){
    var jk = findRow(/^misc\.?\s*junk$/i), n = jk >= 0 ? qtyOf(D.inv[jk]) : 0; if(!n){ gearLog("No Misc. Junk to sell."); return; }
    var gk = findRow(/^gold$/i), g = gk >= 0 ? qtyOf(D.inv[gk]) : 0;
    D.inv[jk].qty = "0"; setCount(/^gold$/i, "Gold", g + n); gearLog("Sold " + n + " Misc. Junk for " + n + " gold.");
  });
  var GOLDDICE = {1: null, 2: [1, 6], 3: [2, 4], 4: [2, 6], 5: [2, 8]};
  $("inv-loot").addEventListener("click", function(){
    var n = Math.max(1, num("inv-bodies", 1)), gd = GOLDDICE[floor], gr = gd ? rollN(gd[0], gd[1]) : [], jr = rnd(6);
    var gold = gd ? total(gr) * n : 0, junk = jr * n;
    var gk = findRow(/^gold$/i), jk = findRow(/^misc\.?\s*junk$/i);
    var g0 = gk >= 0 ? qtyOf(D.inv[gk]) : 0, j0 = jk >= 0 ? qtyOf(D.inv[jk]) : 0;
    if(gold) setCount(/^gold$/i, "Gold", g0 + gold);
    setCount(/^misc\.?\s*junk$/i, "Misc. Junk", j0 + junk);
    gearLog("Looted " + n + (n === 1 ? " body" : " bodies") + ": " + (gd ? gold + " gold (" + gd[0] + "d" + gd[1] + " rolled " + gr.join(", ") + ", × " + n + ")" : "no gold on Floor 1") + " and " + junk + " Misc. Junk (1d6 rolled " + jr + ", × " + n + ").");
  });

  /* item editor */
  function renderItemEdit(){
    var box = $("it-edit");
    if(!itEdit){ box.classList.add("hide"); return; }
    box.classList.remove("hide");
    if(itEdit.filled) return;
    var src = null, inv = itEdit.kind !== "slot";
    if(itEdit.kind === "inv") src = parseItem(D.inv[itEdit.row]);
    if(itEdit.kind === "slot"){ var se = slotItems(itEdit.slot)[itEdit.idx] || {pos: "", text: ""}, g = parseGear(se.text), x = X().inotes[g.name.toLowerCase()] || {}; src = {name: g.name, qty: "1", slot: typeAt(itEdit.slot, se.pos), fx: g.fx, use: x.use || null, notes: x.notes || ""}; }
    if(!src) src = {name: "", qty: "1", slot: "", fx: blankFx(), use: null, notes: ""};
    $("ie-title").textContent = itEdit.kind === "new" ? "Add an item" : itEdit.kind === "slot" ? "Edit " + src.name + " (equipped)" : "Edit " + src.name;
    $("ie-name").value = src.name; $("ie-qty").value = inv ? (src.qty || "1") : "1"; $("ie-qty-l").classList.toggle("hide", !inv);
    $("ie-slot").value = src.slot || ""; $("ie-slot").disabled = !inv;
    var all = allOf(src.fx); $("ie-all").value = all;
    STATS.forEach(function(k){ $("ie-" + k).value = (src.fx[k] || 0) - all; });
    $("ie-dr").value = src.fx.dr || 0; $("ie-ev").value = src.fx.evade || 0;
    $("ie-sk").value = Object.keys(src.fx.skills).map(function(n){ return sgn(src.fx.skills[n]).replace("−", "-") + " " + n; }).join(", ");
    $("ie-use").value = src.use ? src.use.kind : ""; $("ie-usen").value = src.use && src.use.n ? src.use.n : 2;
    $("ie-notes").value = src.notes || "";
    $("ie-del").classList.toggle("hide", itEdit.kind === "new");
    $("ie-msg").textContent = ""; useVis();
    itEdit.filled = true;
  }
  function useVis(){ var u = $("ie-use").value; $("ie-usen-l").classList.toggle("hide", u !== "heal" && u !== "mana"); }
  $("ie-use").addEventListener("change", useVis);
  $("it-add").addEventListener("click", function(){ itEdit = {kind: "new"}; renderItemEdit(); $("ie-name").focus(); });
  $("ie-cancel").addEventListener("click", function(){ itEdit = null; renderItemEdit(); });
  $("ie-save").addEventListener("click", function(){
    var name = $("ie-name").value.trim().replace(/[();]/g, ""); if(!name){ $("ie-msg").textContent = "Give the item a name."; return; }
    var fx = blankFx();
    STATS.forEach(function(k){ fx[k] = num("ie-" + k, 0) + num("ie-all", 0); }); fx.dr = Math.max(0, num("ie-dr", 0)); fx.evade = num("ie-ev", 0);
    var skt = $("ie-sk").value.trim();
    if(skt){ var p = parseFx(skt); if(!p || STATS.some(function(k){ return p[k]; }) || p.dr || p.evade){ /* Stats belong in their own boxes */ $("ie-msg").textContent = "Write Skill bonuses like +2 Investigation, +1 Dodge."; return; } fx.skills = p.skills; }
    var uk = $("ie-use").value, use = uk ? {kind: uk, n: uk === "heal" || uk === "mana" ? Math.max(1, num("ie-usen", 1)) : 0} : null;
    var notes = $("ie-notes").value.trim().replace(/\s*\n\s*/g, " ");
    if(itEdit.kind !== "slot" && !$("ie-slot").value && fxText(fx)){ $("ie-msg").textContent = "Pick the Gear Slot it goes in, so its bonuses can apply when you wear it."; return; }
    if(itEdit.kind === "slot"){
      var e = itEdit;
      gearChange(function(){
        var list = slotItems(e.slot), old = parseGear(list[e.idx].text);
        list[e.idx].text = gearText({name: name, fx: fx}); setSlotItems(e.slot, list);
        var x = X(); delete x.inotes[old.name.toLowerCase()]; if(notes || use) x.inotes[name.toLowerCase()] = {notes: notes, use: use}; xSave();
        return "Updated " + name + ".";
      });
    } else {
      var row = itEdit.kind === "inv" ? itEdit.row : freeRow();
      if(row < 0){ $("ie-msg").textContent = "Your Inventory is full (" + INV_ROWS + " rows)."; return; }
      var q = Math.max(1, num("ie-qty", 1));
      D.inv[row] = {name: name, qty: String(q), notes: itemNotes({slot: $("ie-slot").value, fx: fx, use: use, notes: notes})};
      gearLog((itEdit.kind === "new" ? "Added " : "Updated ") + name + "."); changed();
    }
    itEdit = null; renderItemEdit();
  });
  $("ie-del").addEventListener("click", function(){
    var e = itEdit; if(!e) return;
    if(e.kind === "inv"){ var nm = D.inv[e.row].name; if(!window.confirm("Delete " + nm + " from your Inventory?")) return; D.inv[e.row] = {name: "", qty: "", notes: ""}; gearLog("Deleted " + nm + "."); changed(); }
    if(e.kind === "slot"){ var list = slotItems(e.slot), nm2 = parseGear(list[e.idx].text).name; if(!window.confirm("Throw away " + nm2 + "? It won’t go back to your Inventory.")) return; gearChange(function(){ list.splice(e.idx, 1); setSlotItems(e.slot, list); return "Threw away " + nm2 + "."; }); }
    itEdit = null; renderItemEdit();
  });

  /* ============================== Loot Boxes ============================== */
  /* A Loot Box waits in an Inventory row until it's opened. Its notes on the sheet say what it holds, like
     "Loot Box: Silver, Silver Earth. Holds: Skill Potion +3 (your pick); 1d10x100 Gold. A souvenir of ...".
     The full box (item bonuses and all) is also kept in this browser, keyed by its name and notes. */
  var TIERS = ["bronze", "silver", "gold", "platinum", "legendary", "celestial"];
  var TIERGOLD = {bronze: "1d10", silver: "1d10x100", gold: "1d6x1000", platinum: "2d6x1000", legendary: "1d10x10000", celestial: null};
  var TIERCOUNT = {bronze: [1, 2, 0], silver: [1, 2, 1], gold: [1, 2, 1], platinum: [1, 2, 1], legendary: [2, 2, 1], celestial: [2, 2, 1]};
  var DICE_RE = /^(\d+)d(\d+)(?:x(\d+))?$/i;
  function cap(t){ t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); }
  function isBoxNotes(n){ return /^\s*Loot Box\b/i.test(n || ""); }
  function amtOf(a){ if(typeof a === "number" && a >= 0) return String(Math.trunc(a)); a = String(a == null ? "" : a).trim(); return /^\d+$/.test(a) || DICE_RE.test(a) ? a.toLowerCase() : ""; }
  function plainName(t){ return String(t || "").replace(/[();\[\]]/g, "").replace(/\s+/g, " ").trim(); }
  /* a CrawlerForge box: from a crawler file its items come with their definitions, from a pack they point at the pack's items */
  function cfBox(b, pool){
    b = b && typeof b === "object" ? b : {};
    var tier = TIERS.indexOf(String(b.tier || "").toLowerCase()) >= 0 ? String(b.tier).toLowerCase() : "";
    var bx = {name: plainName(b.name) || (tier ? cap(tier) + " " : "") + "Loot Box", tier: tier, type: plainName(b.type), desc: cfNotes(b.description || ""), random: !!b.rolled, counts: null, contents: []};
    (Array.isArray(b.contents) ? b.contents : []).forEach(function(c){
      if(!c || typeof c !== "object") return;
      var q = Math.max(1, parseInt(c.quantity, 10) || 1), a;
      switch(c.kind){
        case "item":
          var def = c.definition || (pool || []).filter(function(x){ return x && x.id === c.itemId; })[0];
          if(def){ var ci = cfItem(def); bx.contents.push({kind: "item", qty: q, item: {name: plainName(ci.name) || "Item", slot: ci.slot, fx: ci.fx, use: ci.use, notes: ci.notes}}); }
          else bx.contents.push({kind: "text", text: "An item the pack no longer holds."});
          break;
        case "gold": case "junk": a = amtOf(c.amount); if(a && a !== "0") bx.contents.push({kind: c.kind, amount: a}); break;
        case "skillPotion": bx.contents.push({kind: "skillPotion", ranks: Math.max(1, parseInt(c.ranks, 10) || 1), skill: typeof c.skill === "string" ? plainName(c.skill) : ""}); break;
        case "statPotion": bx.contents.push({kind: "statPotion", amount: Math.max(1, parseInt(c.amount, 10) || 1), stat: STATS.indexOf(c.stat) >= 0 ? c.stat : ""}); break;
        case "skill": if(c.name) bx.contents.push({kind: "skill", name: plainName(c.name), rank: Math.max(1, parseInt(c.rank, 10) || 1)}); break;
        case "text": if(c.text) bx.contents.push({kind: "text", text: String(c.text).replace(/\s*\n\s*/g, " ").trim()}); break;
      }
    });
    if(bx.random){
      var d = TIERCOUNT[tier] || [1, 2, 1], k = b.counts && typeof b.counts === "object" ? b.counts : null;
      bx.counts = {items: k ? +k.items || 0 : d[0], consumables: k ? +k.consumables || 0 : d[1], potions: tier === "bronze" ? 0 : k ? +k.potions || 0 : d[2], gold: !!TIERGOLD[tier] && (k ? !!k.gold : true)};
    }
    return bx;
  }
  function entryText(c){
    switch(c.kind){
      case "item":
        var it = c.item, det = [it.slot ? SLOTWORD[it.slot] : "", fxText(it.fx), it.use ? "Use " + useText(it.use) : ""].filter(Boolean);
        return it.name + (c.qty > 1 ? " x" + c.qty : "") + (det.length ? " [" + det.join(", ") + "]" : "");
      case "gold": return c.amount + " Gold";
      case "junk": return c.amount + " Junk";
      case "skillPotion": return "Skill Potion +" + c.ranks + " " + (c.skill || "(your pick)");
      case "statPotion": return "Stat Potion +" + c.amount + " " + (c.stat ? SN[c.stat] : "(your pick)");
      case "skill": return "Skill " + c.name + " at Rank " + c.rank;
    }
    return "";
  }
  function randomEntries(bx){
    var n = bx.counts, out = [];
    if(n.items) out.push(plural(n.items, "item")); if(n.consumables) out.push(plural(n.consumables, "consumable")); if(n.potions) out.push(plural(n.potions, "potion"));
    if(n.gold && TIERGOLD[bx.tier]) out.push(TIERGOLD[bx.tier] + " Gold");
    return out;
  }
  function boxNotes(bx){
    var head = ["Loot Box: " + (bx.tier ? cap(bx.tier) : "Box")].concat(bx.type ? [bx.type] : [], bx.random ? ["random"] : []).join(", ");
    var ent = bx.random ? randomEntries(bx) : bx.contents.map(entryText).filter(Boolean);
    var txt = bx.contents.filter(function(c){ return c.kind === "text"; }).map(function(c){ return c.text; });
    return (head + "." + (ent.length ? " Holds: " + ent.join("; ") + "." : "") + (txt.length ? " " + txt.join(" ") : "") + (bx.desc ? " " + bx.desc : "")).replace(/\s*\n\s*/g, " ");
  }
  function boxSummary(bx){
    var ent = bx.random ? randomEntries(bx) : bx.contents.map(entryText).filter(Boolean);
    return (ent.length ? "Holds " + ent.join("; ") + "." : "Nothing listed inside.") + (bx.desc ? " " + bx.desc : "");
  }
  function boxKey(name, notes){ return (String(name || "").trim() + "|" + String(notes || "").trim()).toLowerCase(); }
  function boxStore(name, notes, bx){ X().boxes[boxKey(name, notes)] = bx; xSave(); }
  /* the sheet wording read back, for a box this browser hasn't seen (another browser, or typed by hand) */
  function parseBoxNotes(name, notes){
    var m = /^\s*Loot Box(?::\s*([^.]*))?\.(?:\s+Holds:\s*(.*?)\.(?=\s|$))?\s*(.*)$/i.exec(String(notes || ""));
    if(!m) return null;
    var head = (m[1] || "").split(/\s*,\s*/).filter(Boolean), bx = {name: plainName(name), tier: "", type: "", desc: (m[3] || "").trim(), random: false, counts: null, contents: []}, type = [];
    head.forEach(function(h){ var lo = h.toLowerCase(); if(!bx.tier && TIERS.indexOf(lo) >= 0) bx.tier = lo; else if(lo === "random") bx.random = true; else if(lo !== "box") type.push(h); });
    bx.type = type.join(", ");
    if(bx.random) bx.counts = {items: 0, consumables: 0, potions: 0, gold: false};
    (m[2] || "").split(/\s*;\s*/).forEach(function(t){
      t = t.trim(); var g; if(!t) return;
      if(bx.random){
        if((g = /^(\d+)\s+items?$/i.exec(t))) bx.counts.items = +g[1];
        else if((g = /^(\d+)\s+consumables?$/i.exec(t))) bx.counts.consumables = +g[1];
        else if((g = /^(\d+)\s+potions?$/i.exec(t))) bx.counts.potions = +g[1];
        else if(/\bGold$/i.test(t)) bx.counts.gold = !!TIERGOLD[bx.tier];
        return;
      }
      if((g = /^(\d+(?:d\d+(?:x\d+)?)?)\s+Gold$/i.exec(t))) bx.contents.push({kind: "gold", amount: g[1].toLowerCase()});
      else if((g = /^(\d+(?:d\d+(?:x\d+)?)?)\s+(?:Misc\.?\s*)?Junk$/i.exec(t))) bx.contents.push({kind: "junk", amount: g[1].toLowerCase()});
      else if((g = /^Skill Potion\s*\+\s*(\d+)(?:\s+(.+))?$/i.exec(t))) bx.contents.push({kind: "skillPotion", ranks: +g[1], skill: g[2] && !/your pick/i.test(g[2]) ? g[2].trim() : ""});
      else if((g = /^Stat Potion\s*\+\s*(\d+)(?:\s+(.+))?$/i.exec(t))) bx.contents.push({kind: "statPotion", amount: +g[1], stat: g[2] && !/your pick/i.test(g[2]) ? statKey(g[2]) || "" : ""});
      else if((g = /^Skill\s+(.+?)\s+at\s+Rank\s+(\d+)$/i.exec(t))) bx.contents.push({kind: "skill", name: g[1].trim(), rank: +g[2]});
      else {
        g = /^(.+?)(?:\s+x(\d+))?(?:\s*\[([^\]]*)\])?$/i.exec(t);
        var it = {name: plainName(g[1]), slot: "", fx: blankFx(), use: null, notes: ""}, rest = [];
        (g[3] || "").split(/\s*,\s*/).forEach(function(d){
          var w = d.toLowerCase(), sl = Object.keys(SLOTWORD).filter(function(k){ return SLOTWORD[k].toLowerCase() === w; })[0], u;
          if(sl && !it.slot) it.slot = sl; else if(/^use\s+/i.test(d) && (u = parseUse(d.replace(/^use\s+/i, "")))) it.use = u; else if(d) rest.push(d);
        });
        var fx = rest.length ? parseFx(rest.join(", ")) : null; if(fx) it.fx = fx;
        bx.contents.push({kind: "item", qty: g[2] ? +g[2] : 1, item: it});
      }
    });
    return bx;
  }
  function boxOf(row){
    if(!row || !isBoxNotes(row.notes)) return null;
    return X().boxes[boxKey(row.name, row.notes)] || parseBoxNotes(row.name, row.notes);
  }
  function rollAmount(a){
    var m = DICE_RE.exec(String(a || ""));
    if(!m) return {n: parseInt(a, 10) || 0, text: ""};
    var r = rollN(+m[1], +m[2]), mult = m[3] ? +m[3] : 1;
    return {n: total(r) * mult, text: a + " rolled " + r.join(", ") + (mult > 1 ? ", x " + mult : "")};
  }

  var bxOpen = null;   /* {row, name, bx} of the box being opened */
  function openBox(k){ var r = D.inv[k], bx = boxOf(r); if(!bx) return; bxOpen = {row: k, name: r.name.trim(), bx: bx}; itEdit = null; renderItemEdit(); renderBox(); $("bx-box").scrollIntoView({block: "nearest"}); }
  function renderBox(){
    var box = $("bx-box");
    if(!bxOpen){ box.classList.add("hide"); return; }
    box.classList.remove("hide");
    var bx = bxOpen.bx, list = $("bx-list"), x = X(); list.innerHTML = "";
    $("bx-title").textContent = "Open " + bxOpen.name;
    $("bx-desc").textContent = [cap(bx.tier), bx.type, bx.random ? "random box" : ""].filter(Boolean).join(", ") + (bx.desc ? ". " + bx.desc : "");
    var dl = $("bx-skills"); dl.innerHTML = ""; D.skills.forEach(function(s){ dl.appendChild(el("option", {value: s.name.trim()})); });
    var nStat = 0, nSkill = 0;
    bx.contents.forEach(function(c, i){
      if(c.kind === "text"){ list.appendChild(el("li", {}, [el("small", {cls: "nt", text: c.text})])); return; }
      var pick = null;
      if(c.kind === "skillPotion"){ nSkill++; if(!c.skill) pick = el("input", {type: "text", list: "bx-skills", "data-bx": String(i), placeholder: "Which Skill", "aria-label": "Skill for the potion", autocomplete: "off"}); }
      if(c.kind === "statPotion"){ nStat++; if(!c.stat) pick = el("select", {"data-bx": String(i), "aria-label": "Stat for the potion"}, STATS.map(function(k){ return el("option", {value: k, text: SFULL[k]}); })); }
      var sub = c.kind === "item" ? chipsOf(fxChips(c.item.fx, c.item.slot, c.item.use)) : null;
      list.appendChild(el("li", {}, [el("b", {text: entryText(c).replace(/\s*\[.*\]$/, "").replace(/\s*\(your pick\)$/, "")}), sub, pick]));
    });
    if(bx.random){
      var n = bx.counts, rest = randomEntries({counts: {items: n.items, consumables: n.consumables, potions: n.potions, gold: false}, tier: bx.tier});
      if(n.gold && TIERGOLD[bx.tier]) list.appendChild(el("li", {}, [el("b", {text: TIERGOLD[bx.tier] + " Gold"})]));
      list.appendChild(el("li", {}, [el("small", {cls: "nt", text: (rest.length ? "Your GM rolls " + rest.join(", ") + " (Core p. 219), or open it in CrawlerForge. Add them here with Add an item." : "Your GM decides what else is inside.")})]));
    }
    var warn = [];
    if(nStat && x.potStat + nStat > 2) warn.push("That makes " + (x.potStat + nStat) + " Stat potions; a crawler can only ever drink two (Core p. 226).");
    if(nSkill && x.potSkill + nSkill > 2) warn.push("That makes " + (x.potSkill + nSkill) + " Skill potions; a crawler can only ever drink two (Core p. 226).");
    $("bx-warn").textContent = warn.join(" ");
  }
  $("bx-cancel").addEventListener("click", function(){ bxOpen = null; renderBox(); });
  $("bx-go").addEventListener("click", function(){
    if(!bxOpen) return;
    var k = bxOpen.row, r = D.inv[k], bx = bxOpen.bx, x = X();
    if(!r || r.name.trim() !== bxOpen.name){ bxOpen = null; renderBox(); gearLog("That box isn’t in your Inventory any more."); return; }
    /* choices first */
    var picks = {}, bad = "";
    $("bx-list").querySelectorAll("[data-bx]").forEach(function(e){ var v = e.value.trim(); if(!v) bad = "Pick a Skill for the Skill potion."; picks[e.getAttribute("data-bx")] = v; });
    if(bad){ $("bx-warn").textContent = bad; return; }
    /* try it on a copy of the Inventory, so a full Inventory changes nothing */
    var inv = clone(D.inv);
    function addRow(name, qty, notes){
      for(var i = 0; i < INV_ROWS; i++) if(inv[i].name.trim().toLowerCase() === name.toLowerCase() && inv[i].notes === notes){ inv[i].qty = String(qtyOf(inv[i]) + qty); return true; }
      for(var j = 0; j < INV_ROWS; j++) if(!inv[j].name.trim()){ inv[j] = {name: name, qty: String(qty), notes: notes}; return true; }
      return false;
    }
    function addCount(re, name, n){
      for(var i = 0; i < INV_ROWS; i++) if(re.test(inv[i].name.trim())){ inv[i].qty = String(qtyOf(inv[i]) + n); return true; }
      return addRow(name, n, "");
    }
    var left = qtyOf(r) - 1; if(left <= 0) inv[k] = {name: "", qty: "", notes: ""}; else inv[k].qty = String(left);
    var got = [], full = [], newSkills = 0;
    bx.contents.forEach(function(c){ if(c.kind === "skill" ? !findSkill(c.name) : c.kind === "skillPotion" && c.skill && !findSkill(c.skill)) newSkills++; });
    bx.contents.forEach(function(c, i){ if(c.kind === "skillPotion" && !c.skill && !findSkill(picks[String(i)])) newSkills++; });
    if(D.skills.length + newSkills > SK_ROWS){ $("bx-warn").textContent = "Your sheet has no free Skill rows for the new Skill. Make room in the Skills tab first."; return; }
    bx.contents.forEach(function(c){
      if(c.kind === "item"){ var nt = itemNotes({slot: c.item.slot, fx: c.item.fx, use: c.item.use, notes: c.item.notes}); if(addRow(c.item.name, c.qty, nt)) got.push(c.item.name + (c.qty > 1 ? " x" + c.qty : "")); else full.push(c.item.name); }
    });
    var gold = bx.contents.filter(function(c){ return c.kind === "gold"; }).map(function(c){ return c.amount; });
    if(bx.random && bx.counts.gold && TIERGOLD[bx.tier]) gold.push(TIERGOLD[bx.tier]);
    gold.forEach(function(a){ var g = rollAmount(a); if(!g.n) return; if(addCount(/^gold$/i, "Gold", g.n)) got.push(g.n + " Gold" + (g.text ? " (" + g.text + ")" : "")); else full.push("Gold"); });
    bx.contents.forEach(function(c){ if(c.kind !== "junk") return; var g = rollAmount(c.amount); if(!g.n) return; if(addCount(/^misc\.?\s*junk$/i, "Misc. Junk", g.n)) got.push(g.n + " Misc. Junk" + (g.text ? " (" + g.text + ")" : "")); else full.push("Misc. Junk"); });
    if(full.length){ $("bx-warn").textContent = "Your Inventory has no room for " + full.join(", ") + ". Make room first."; return; }
    /* it fits: open it */
    D.inv = inv;
    bx.contents.forEach(function(c, i){
      var s, r0, r1, nm;
      if(c.kind === "statPotion"){
        var sk = c.stat || picks[String(i)], u = $("cu-" + sk), e = $("cr-" + sk);
        u.value = (parseInt(u.value, 10) || 1) + c.amount; e.value = (parseInt(e.value, 10) || 1) + c.amount;
        x.potStat++; got.push("Stat potion: " + SFULL[sk] + " " + sgn(c.amount));
      }
      if(c.kind === "skillPotion"){
        nm = c.skill || picks[String(i)]; s = findSkill(nm); x.potSkill++;
        if(s){ r0 = skRank(s); r1 = Math.min(skMax(s.name), r0 + c.ranks); setRank(s, r1); got.push("Skill potion: " + s.name.trim() + " Rank " + r0 + " to " + r1 + (r1 < r0 + c.ranks ? " (its top Rank)" : "")); }
        else { s = newSkill(nm, Math.min(15, c.ranks)); got.push("Skill potion: new Skill " + nm + " at Rank " + s.rank + " (set its Stat in the Skills tab)"); }
      }
      if(c.kind === "skill"){
        s = findSkill(c.name);
        if(!s){ s = newSkill(c.name, Math.min(20, c.rank)); got.push("new Skill " + c.name + " at Rank " + s.rank + " (set its Stat in the Skills tab)"); }
        else if(skRank(s) >= c.rank) got.push(s.name.trim() + " is already Rank " + skRank(s) + ", so the box’s Rank " + c.rank + " changes nothing");
        else { r0 = skRank(s); setRank(s, c.rank); got.push(s.name.trim() + " Rank " + r0 + " to " + c.rank); }
      }
      if(c.kind === "text") got.push(c.text.replace(/[.\s]+$/, ""));
    });
    xSave(); saveCrawler();
    var nm2 = bxOpen.name; bxOpen = null; renderBox();
    var gm = bx.random ? randomEntries({counts: {items: bx.counts.items, consumables: bx.counts.consumables, potions: bx.counts.potions, gold: false}, tier: bx.tier}) : [];
    gearLog("Opened " + nm2 + (got.length ? ": " + got.join("; ") + "." : bx.random ? "." : ": it was empty.") + (gm.length ? " Your GM rolls the rest: " + gm.join(", ") + "." : ""));
    calcRefresh(); changed();
  });
  function newSkill(name, rank){
    var used = D.skills.map(function(s){ return s.row; }), row = 0;
    while(used.indexOf(row) >= 0) row++;
    var s = {row: row, name: name, rank: String(rank), stat: "", type: "", notes: "", mark: false}; D.skills.push(s); sortSkills(); return s;
  }

  /* ============================== CrawlerForge files ============================== */
  /* A CrawlerForge crawler file is {kind: "crawler", events: [...]}: the crawler as a log of events, undo included
     as "event.retracted". Replaying the Inventory events gives what it's wearing and carrying. An Export everything
     backup holds several such logs plus your Forge; a pack holds item definitions. Nothing here is run as code. */
  var CF_SLOT = {head: "head", torso: "torso", arms: "arms", gloves: "gloves", hand: "hand", twoHanded: "twohand", legs: "legs", feet: "feet", accessory: "acc"};
  /* events that change things on the sheet but aren't replayed here; the preview names them */
  var CF_LATER = {"race.selected": "your Race", "class.selected": "your Class", "grinding.logged": "grinding", "patron.trained": "patron training",
    "buff.added": "Buffs", "debuff.added": "Debuffs", "companion.added": "pets and mounts", "deity.chosen": "your deity", "sponsor.signed": "sponsors"};
  function cfSlot(it){ var sl = it.slot; if(sl === "hands") return /glove|gauntlet|mitt/i.test(it.name || "") ? "gloves" : "hand"; return CF_SLOT[sl] || ""; }
  function cfSkill(ref){ return ref && typeof ref === "object" ? String(ref.name || ref.label || "").trim() : typeof ref === "string" ? ref.trim() : ""; }
  function sg(n){ return sgn(n).replace("−", "-"); }   /* sheet text keeps a plain minus */
  function cfWord(t){ return String(t || "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase(); }
  function cfDescribe(e){
    var n = typeof e.amount === "number" ? e.amount : 0, sk = cfSkill(e.skill);
    switch(e.type){
      case "move": return "Move " + sg(e.feet || 0) + " ft" + (e.mode ? " " + e.mode : "");
      case "step": return "Step " + sg(e.feet || 0) + " ft";
      case "statPercent": return sg(e.percent || 0) + "% " + (SN[e.stat] || e.stat || "Stat") + " (work it out and write the number on your sheet, Core p. 220)";
      case "damageBonus": return sg(n) + " damage" + (e.plusFloor ? " + Floor" : "") + (sk ? " with " + sk : "");
      case "damageResponse": return ({resistance: "Resistance", immunity: "Immunity", vulnerability: "Vulnerability"})[e.response] + " to " + e.damageType;
      case "advancementBonus": return (e.bonus === "advantage" ? "Advantage on advancement checks" : "+1 to advancement checks") + (sk ? " for " + sk : "");
      case "rankCap20": return (sk || "A Skill") + " can reach Rank 20";
      case "inherentSpell": return "Casts " + (sk || "a Spell") + " at Rank " + e.rank + " for no Mana" + (e.cooldown && e.cooldown.hours ? ", every " + e.cooldown.hours + " h" : "");
      case "buff": return "Buff: " + e.name;
      case "healthSlotBonus": return "+" + e.amount + " Health slot value";
      case "manaCost": return "Mana cost " + sg(n) + (e.scope ? " (" + e.scope + ")" : "");
      case "rollMode": return e.mode + " on " + cfWord(e.scope) + (sk ? " (" + sk + ")" : "");
      case "debuffImmunity": return "Immune to " + e.debuff;
      case "size": return "Size " + e.value;
      case "weaponDamage": return "+" + e.amount + " " + (e.types || []).join("/") + " damage";
      case "consume": return "";
      default: return cfWord(e.type);
    }
  }
  function cfEffects(list, sign, fx, extra, out){
    (Array.isArray(list) ? list : []).forEach(function(e){
      if(!e || typeof e !== "object") return;
      var a = typeof e.amount === "number" ? e.amount : 0; if(sign < 0) a = -Math.abs(a);
      switch(e.type){
        case "stat":
          if(e.percent){ extra.push(sg(sign < 0 ? -e.percent : e.percent) + "% " + (e.allStats ? "All Stats" : SN[e.stat] || e.stat)); break; }
          if(e.allStats) STATS.forEach(function(k){ fx[k] += a; }); else if(STATS.indexOf(e.stat) >= 0) fx[e.stat] += a;
          break;
        case "skill": var nm = cfSkill(e.skill).replace(/[(),;]/g, ""); if(nm){ var r = sign < 0 ? -Math.abs(e.ranks || 0) : (e.ranks || 0); fx.skills[nm] = (fx.skills[nm] || 0) + r; } break;
        case "dr": fx.dr += a; if(e.plusFloor) extra.push("DR + Floor"); break;
        case "evade": fx.evade += a; break;
        case "consume":
          if(!out.use){
            if(e.heal === "full") out.use = {kind: "fullhp", n: 0}; else if(e.heal) out.use = {kind: "heal", n: +e.heal};
            else if(e.mana === "full") out.use = {kind: "fullmana", n: 0}; else if(e.mana) out.use = {kind: "mana", n: +e.mana};
          }
          if(e.heal && e.mana) extra.push(e.mana === "full" ? "Also full Mana" : "Also " + e.mana + " Mana");
          if(e.mends) extra.push("Mends " + (e.mends === "all" ? "all Injuries" : e.mends + " Injuries"));
          if(e.cures) extra.push("Cures " + e.cures.join(", "));
          if(e.cast) extra.push("Casts " + e.cast.spell + " at Rank " + e.cast.rank);
          if(e.stat) extra.push("+" + e.stat.bonus + " " + (SN[e.stat.stat] || e.stat.stat) + " when drunk");
          break;
        default: var d = cfDescribe(e); if(d) extra.push(d);
      }
    });
  }
  function cfNotes(t){
    t = String(t || "").replace(/\r/g, "").split(/\n\s*\n/)[0];
    /* a bulleted list reads as one line: "+2 DR; Anti-Piercing Buff" */
    var lines = t.split(/\n/).map(function(l){ return l.trim(); }).filter(Boolean), bul = lines.some(function(l){ return /^[-*•]\s+/.test(l); });
    t = lines.map(function(l){ return l.replace(/^[-*•]\s+/, ""); }).join(bul ? "; " : " ");
    t = t.replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, "$1").replace(/\*\*|__|[*_`]|^#+\s*/g, "").replace(/\s*\n\s*/g, " ").replace(/^"(.*)"$/, "$1").trim();
    return t.length > 140 ? t.slice(0, 137).replace(/\s+\S*$/, "") + "…" : t;
  }
  /* one CrawlerForge item, as this page keeps it */
  function cfItem(it){
    var fx = blankFx(), extra = [], out = {use: null};
    cfEffects(it.effects, 1, fx, extra, out);
    cfEffects(it.detriments, -1, fx, extra, out);
    (Array.isArray(it.enchantments) ? it.enchantments : []).forEach(function(en){ if(en) cfEffects(en.effects, 1, fx, extra, out); });
    if(fx.dr < 0){ extra.push("DR " + fx.dr); fx.dr = 0; }
    var notes = cfNotes(String(it.notes || "").trim() ? it.notes : it.description || it.flavor || "");
    if(extra.length) notes = extra.join("; ") + "." + (notes ? " " + notes : "");
    if(it.broken) notes = "Broken." + (notes ? " " + notes : "");
    var q = parseInt(it.quantity, 10);
    return {name: String(it.name || "Item").replace(/[();]/g, "").trim() || "Item", qty: isNaN(q) ? 1 : q, slot: cfSlot(it), fx: fx, use: out.use, notes: notes.replace(/\s*\n\s*/g, " "), equipped: !!it.equipped};
  }
  function cfReplay(events){
    var gone = {}, st = {name: "", items: [], boxes: [], gold: 0, junk: 0, hot: null}, skipped = {};
    /* the crawler itself, kept the way CrawlerForge keeps it: Level, Floor, Unenhanced Stats, AI Favor, the Evade
       adjustment, current Mana, Health slots lost, Skills with their advancement ticks, untrained tries on Floors 1
       and 2, Popularity and the story boxes. "later" counts events this page doesn't replay that touch the sheet. */
    var cr = {made: false, level: 1, floor: 1, un: {str: 0, int: 0, con: 0, dex: 0, cha: 0}, fav: 0, evAdj: 0, mana: 0, lost: 0,
      sk: {}, untrained: [], removed: {}, pop: null, story: {}, cams: {}, later: {}};
    function low(n){ return String(n || "").trim().toLowerCase(); }
    function skGet(n){ return cr.sk[low(n)] || null; }
    function skPut(n, r, def){ var k = low(n); cr.sk[k] = {name: String(n).trim(), rank: rk(r), marked: false, def: def && typeof def === "object" ? def : null}; delete cr.removed[k]; return cr.sk[k]; }
    function rk(r){ return Math.max(0, Math.min(20, Math.trunc(+r || 0))); }
    /* a Skill takes an advancement tick from use when it has a Rank and its definition advances by use (Core p. 169) */
    function canMark(s){ if(!s || s.rank < 1) return false; if(!s.def) return true; var a = s.def.advancement || {}; return !!a.byUse && !(a.untilRank !== undefined && s.rank >= a.untilRank); }
    function maxMana(){ var n = cr.un.int; st.items.forEach(function(it){ if(it.equipped && !it.broken) n += cfItem(it).fx.int; }); return Math.max(0, n); }
    function setMana(v){ cr.mana = Math.max(0, Math.min(Math.trunc(+v || 0), maxMana())); }
    function setFloorTo(f){ cr.floor = Math.max(1, Math.min(18, Math.trunc(+f || 1))); cr.untrained = []; if(cr.pop === null && cr.floor >= 2) cr.pop = 0; }
    function addPop(n){ cr.pop = (cr.pop || 0) + (+n || 0); }
    /* advancement checks: a d20 that meets the Rank adds 1, up to Rank 15; every eligible tick is cleared after */
    function advance(rolls, ok){
      var due = Object.keys(cr.sk).map(function(k){ return cr.sk[k]; }).filter(ok), done = {};
      (Array.isArray(rolls) ? rolls : []).forEach(function(r){
        var s = r && skGet(r.skill); if(!s || done[s.name] || due.indexOf(s) < 0) return;
        done[s.name] = 1;
        var v = Math.trunc(+r.roll); if(!(v >= 1 && v <= 20)) return;
        if(typeof r.secondRoll === "number" && r.secondRoll >= 1 && r.secondRoll <= 20) v = Math.max(v, r.secondRoll);
        if(s.rank < 15 && v >= s.rank) s.rank += 1;
      });
      due.forEach(function(s){ s.marked = false; });
    }
    /* a roll can bring Popularity or AI Favor from the cameras; a reroll that replaces it takes that back */
    function camera(id, rec){
      if(!rec || typeof rec !== "object") return;
      var old = rec.supersedes !== undefined ? cr.cams[rec.supersedes] : null;
      if(old){ if(old.pop) addPop(-old.pop); cr.fav = Math.max(0, cr.fav - old.fav); delete cr.cams[rec.supersedes]; }
      var o = rec.cameras && rec.cameras.outcome; if(!o) return;
      var got = {pop: 0, fav: 0};
      if(o.kind === "popularity" && +o.amount){ addPop(o.amount); got.pop = +o.amount; }
      if(o.kind === "aiFavor"){ var b = cr.fav; cr.fav = Math.max(0, b + (+o.amount || 0)); got.fav = cr.fav - b; }
      cr.cams[id] = got;
    }
    function reroll(d20){ if(d20 && d20.rerolled && cr.fav > 0) cr.fav -= 1; }
    function getBox(id, b){ if(b && id && !st.boxes.some(function(y){ return y.id === id; })) st.boxes.push({id: id, box: clone(b)}); }
    events.forEach(function(e){ if(e && e.type === "event.retracted" && e.payload) gone[e.payload.eventId] = 1; });
    function find(id){ for(var i = 0; i < st.items.length; i++) if(st.items[i].id === id) return st.items[i]; return null; }
    function key(x){ return String(x.name || "").trim().toLowerCase() + "|" + (x.slot || ""); }
    function merge(x){ for(var i = 0; i < st.items.length; i++) if(!st.items[i].equipped && key(st.items[i]) === key(x)) return st.items[i]; return null; }
    /* equipping takes off whatever already uses that slot, the way CrawlerForge does */
    function clearFor(it){
      if(!it.slot || it.slot === "accessory") return;
      if(it.slot === "hand" || it.slot === "twoHanded" || it.slot === "hands"){
        var held = st.items.filter(function(x){ return x !== it && x.equipped && (x.slot === "hand" || x.slot === "twoHanded" || x.slot === "hands"); });
        var used = held.reduce(function(n, x){ return n + (x.slot === "twoHanded" ? 2 : 1); }, 0) + (it.slot === "twoHanded" ? 2 : 1);
        if(used <= 2) return;
        held.forEach(function(x){ if(x.slot === "twoHanded" || it.slot === "twoHanded") x.equipped = false; });
        held = held.filter(function(x){ return x.equipped; });
        if(held.length >= 2) held[0].equipped = false;
      } else st.items.forEach(function(x){ if(x !== it && x.equipped && x.slot === it.slot) x.equipped = false; });
    }
    events.forEach(function(e){
      if(!e || typeof e.type !== "string" || gone[e.id] || e.type === "event.retracted") return;
      var p = e.payload && typeof e.payload === "object" ? e.payload : {}, x;
      switch(e.type){
        case "crawler.created":
          st.name = String(p.name || st.name || "");
          cr.made = true; cr.level = Math.max(1, Math.min(250, Math.trunc(+p.level || 1))); cr.floor = Math.max(1, Math.min(18, Math.trunc(+p.floor || 1)));
          STATS.forEach(function(k){ cr.un[k] = Math.trunc(+(p.unenhanced || {})[k] || 0); });
          cr.fav = Math.max(0, Math.trunc(+p.aiFavor || 0));
          cr.pop = p.popularity !== undefined ? +p.popularity || 0 : cr.floor >= 2 ? 0 : null;
          ["pastTrauma", "looseEnds", "regrets"].forEach(function(f){ if(typeof p[f] === "string") cr.story[f] = p[f]; });
          (Array.isArray(p.skills) ? p.skills : []).forEach(function(s){ if(s && s.name) skPut(s.name, s.rank, s.definition); });
          cr.mana = maxMana();
          break;
        case "skill.added": if(p.name && !skGet(p.name)) skPut(p.name, p.rank, p.definition); break;
        case "skill.rankSet": x = skGet(p.skill); if(x) x.rank = rk(p.rank); break;
        case "skill.removed": x = skGet(p.skill); if(x){ delete cr.sk[low(x.name)]; cr.removed[low(x.name)] = x.name; } break;
        case "skill.definitionReplaced": x = skGet(p.skill); if(x && p.definition && typeof p.definition === "object") x.def = p.definition; break;
        case "skill.checkAttempted":
          var rl = p.roll && typeof p.roll === "object" ? p.roll : null;
          if(rl){ reroll(rl.d20); camera(e.id, rl); }
          if(typeof p.manaSpent === "number" && p.manaSpent > 0) cr.mana = Math.max(0, cr.mana - p.manaSpent);
          if(p.cast && +p.cast.health > 0) cr.lost = Math.max(0, cr.lost - p.cast.health);
          if(p.fromItemId !== undefined || p.fromGrant !== undefined) break;
          x = skGet(p.skill);
          if(!x && rl && rl.attack) break;
          if(!x || x.rank === 0){
            /* tried untrained: on Floors 1 and 2 it can be learned at the end of the play period */
            var tn = x ? x.name : String(p.skill || "").trim();
            if(cr.floor <= 2 && tn && !(x && x.def && x.def.passive) && !cr.untrained.some(function(u){ return low(u) === low(tn); })) cr.untrained.push(tn);
            break;
          }
          if(p.damageEffect && p.damageEffect.mark){ if(p.damageEffect.mark !== "none"){ var de = p.damageEffect.mark === "attack" ? x : skGet(p.damageEffect.name); if(canMark(de)) de.marked = true; } break; }
          if(canMark(x)) x.marked = true;
          break;
        case "skill.damageEffectMarked": x = skGet(p.mark === "attack" ? p.attackSkill : p.damageEffect); if(canMark(x)) x.marked = true; break;
        case "playPeriod.ended":
          advance(p.advancementRolls, function(s){ return s.marked && s.rank <= 4; });
          cr.level = Math.min(250, cr.level + 1);
          if(p.tutorialSkillGained && p.tutorialSkillGained.name){
            var tg = String(p.tutorialSkillGained.name).trim();
            if(cr.floor <= 2 && cr.untrained.some(function(u){ return low(u) === low(tg); })){
              x = skGet(tg);
              if(x){ x.rank = Math.max(x.rank, 1); if(!x.def && p.tutorialSkillGained.definition) x.def = p.tutorialSkillGained.definition; }
              else skPut(tg, 1, p.tutorialSkillGained.definition);
            }
          }
          (Array.isArray(p.popularity) ? p.popularity : []).forEach(function(q){ if(q) addPop(q.amount); });
          cr.untrained = [];
          break;
        case "floor.ended":
          advance(p.advancementRolls, function(s){ return s.marked; });
          setFloorTo(p.newFloor);
          (Array.isArray(p.popularity) ? p.popularity : []).forEach(function(q){ if(q) addPop(q.amount); });
          break;
        case "floor.set": setFloorTo(p.floor); break;
        case "levels.gained": if(+p.count > 0) cr.level = Math.min(250, cr.level + Math.trunc(+p.count)); break;
        case "level.corrected": if(Math.trunc(+p.to) >= 1) cr.level = Math.min(250, Math.trunc(+p.to)); break;
        case "statPoints.assigned": STATS.forEach(function(k){ if(+p[k] > 0) cr.un[k] += Math.trunc(+p[k]); }); break;
        case "stats.corrected": STATS.forEach(function(k){ var to = p[k] && Math.trunc(+p[k].to); if(to >= 1) cr.un[k] = to; }); break;
        case "health.changed": cr.lost = Math.max(0, Math.min(10, Math.trunc(+p.slotsLost || 0))); break;
        case "mana.changed": setMana(p.current); break;
        case "rest.taken":
          var mx = maxMana(), cm = Math.min(cr.mana, mx);
          if(p.kind === "short"){ cr.lost -= Math.min(cr.lost, 5); cr.mana = Math.min(mx, cm + Math.floor(mx / 2)); }
          else if(p.kind === "long" || p.kind === "fullDay"){ cr.lost = 0; cr.mana = mx; }
          else if(p.kind === "hours"){ var hr = Math.max(0, Math.trunc(+p.hours || 0)); cr.lost -= Math.min(cr.lost, hr); cr.mana = Math.min(mx, cm + 5 * hr); }
          break;
        case "aiFavor.changed": cr.fav = Math.max(0, Math.trunc(+p.value || 0)); break;
        case "aiFavor.gained": cr.fav = Math.max(0, cr.fav + Math.trunc(+p.amount || 0)); break;
        case "evade.adjusted": cr.evAdj = Math.trunc(+p.amount || 0); break;
        case "roll.made":
          if(p.kind === "evade" || p.kind === "statCheck"){ reroll(p.d20); if(!(p.kind === "evade" && p.companion)) camera(e.id, p); }
          if(p.kind === "damage" && !p.noDamage && +p.healthSpent > 0) cr.lost = Math.min(10, cr.lost + Math.trunc(+p.healthSpent));
          break;
        case "biography.changed": ["pastTrauma", "looseEnds", "regrets"].forEach(function(f){ if(typeof p[f] === "string") cr.story[f] = p[f]; }); break;
        case "popularity.gained": addPop(p.amount); break;
        case "popularity.changed": cr.pop = +p.value || 0; break;
        case "item.added": if(find(p.id)) break; x = clone(p); if(x.broken) x.equipped = false; st.items.push(x); if(x.equipped) clearFor(x); break;
        case "item.updated": x = find(p.id); if(!x) break; var was = x.equipped; Object.assign(x, clone(p.patch || {})); if(x.broken) x.equipped = false; if(x.equipped && !was) clearFor(x); break;
        case "item.removed": st.items = st.items.filter(function(y){ return y.id !== p.id; }); break;
        case "item.equipped": x = find(p.id); if(!x || x.broken) break; if(p.replaces){ var r = find(p.replaces); if(r) r.equipped = false; } x.equipped = true; clearFor(x); break;
        case "item.unequipped": x = find(p.id); if(x) x.equipped = false; break;
        case "item.used":
          x = find(p.itemId); if(!x || !(x.quantity > 0)) break;
          x.quantity -= 1;
          if(p.throw){ var th = skGet(p.throw.skill); if(canMark(th)) th.marked = true; break; }
          if(p.cast){ if(+p.cast.health > 0) cr.lost = Math.max(0, cr.lost - p.cast.health); break; }
          /* what drinking it does, worked out the way CrawlerForge does: heal and Mana stop at full */
          var ce = (Array.isArray(x.effects) ? x.effects : []).filter(function(f){ return f && f.type === "consume"; })[0];
          if(!ce || ce.pet) break;
          if(ce.heal !== undefined) cr.lost -= ce.heal === "full" ? cr.lost : Math.min(cr.lost, Math.max(0, +ce.heal || 0));
          if(ce.mana !== undefined){ var mm = maxMana(), cur = Math.min(cr.mana, mm); cr.mana = ce.mana === "full" ? mm : Math.min(mm, cur + Math.max(0, +ce.mana || 0)); }
          if(ce.stat && STATS.indexOf(ce.stat.stat) >= 0) cr.un[ce.stat.stat] += Math.trunc(+ce.stat.bonus || 0);
          if(ce.skill && ce.skill.name){ var ps = skGet(ce.skill.name), pr = Math.trunc(+ce.skill.ranks || +ce.skill.rank || 1); if(ps) ps.rank = rk(ps.rank + pr); else skPut(ce.skill.name, pr, null); }
          break;
        case "item.given": x = find(p.id); if(!x) break; if((p.quantity || 1) >= x.quantity) st.items.splice(st.items.indexOf(x), 1); else { x.quantity -= p.quantity; x.equipped = false; } break;
        case "item.received": if(!p.item) break; x = merge(p.item); if(x) x.quantity += p.item.quantity || 1; else { x = clone(p.item); x.id = p.offerRowId || x.id; x.equipped = false; st.items.push(x); } break;
        case "item.repaired": x = find(p.itemId); if(x) delete x.broken; break;
        case "junk.spentForItem": st.junk = Math.max(0, st.junk - 1); if(p.item && !find(p.item.id)) st.items.push(clone(p.item)); break;
        case "shop.traded":
          st.gold = Math.max(0, st.gold + Math.trunc(p.goldDelta || 0));
          if(p.added && !find(p.added.id)){ x = merge(p.added); if(x) x.quantity += p.added.quantity || 1; else { x = clone(p.added); x.equipped = false; st.items.push(x); } }
          if(p.addedTo){ x = find(p.addedTo.id); if(x) x.quantity += p.addedTo.quantity || 1; }
          if(p.removed){ x = find(p.removed.id); if(x){ if((p.removed.quantity || 1) >= x.quantity) st.items.splice(st.items.indexOf(x), 1); else { x.quantity -= p.removed.quantity; x.equipped = false; } } }
          break;
        case "lootBox.received": getBox(p.instanceId, p.box); break;
        case "achievement.awarded": if(p.box) getBox(p.box.instanceId, p.box.box); break;
        case "lootBox.opened":
          st.boxes = st.boxes.filter(function(y){ return y.id !== p.instanceId; });
          (Array.isArray(p.outcome) ? p.outcome : []).forEach(function(o, i){
            if(!o) return;
            if(o.kind === "item" && o.definition){ x = clone(o.definition); x.id = e.id + ":" + i; x.quantity = o.quantity || 1; x.equipped = false; st.items.push(x); }
            else if(o.kind === "gold") st.gold += +o.amount || 0;
            else if(o.kind === "junk") st.junk += +o.amount || 0;
            else if(o.kind === "statPotion" && STATS.indexOf(o.stat) >= 0) cr.un[o.stat] += Math.trunc(+o.amount || 0);
            else if(o.kind === "skillPotion" && o.skill){ x = skGet(o.skill); if(x) x.rank = rk(x.rank + (+o.ranks || 0)); else skPut(o.skill, o.ranks, null); }
            else if(o.kind === "skill" && o.name){ x = skGet(o.name); if(!x) skPut((o.definition && o.definition.name) || o.name, o.rank, o.definition); else if(x.rank < +o.rank){ x.rank = rk(o.rank); if(o.definition && !x.def) x.def = o.definition; } }
          });
          if(p.tithe && p.tithe.amount) st.gold = Math.max(0, st.gold - (+p.tithe.amount || 0));
          break;
        case "gold.changed": st.gold = Math.max(0, Math.trunc(+p.gold || 0)); break;
        case "junk.changed": st.junk = Math.max(0, Math.trunc(+p.junk || 0)); if(p.gold !== undefined) st.gold = Math.max(0, Math.trunc(+p.gold || 0)); break;
        case "hotlist.set": st.hot = (Array.isArray(p.entries) ? p.entries : []).slice(0, 10).map(String); break;
        default:
          if(/^(craft|alchemy|weapon)\./.test(e.type) || e.type === "item.enchantmentRemoved") skipped[e.type] = (skipped[e.type] || 0) + 1;
          else if(CF_LATER[e.type]) cr.later[e.type] = (cr.later[e.type] || 0) + 1;
      }
    });
    st.items = st.items.filter(function(y){ return y && (y.quantity == null || y.quantity > 0); });
    return {st: st, skipped: skipped, cr: cr};
  }
  /* what kind of file it is */
  function arr(a){ return Array.isArray(a) ? a : []; }
  function cfRead(j){
    if(j && j.kind === "crawler" && Array.isArray(j.events)) return {kind: "crawlers", logs: [j.events], when: j.exportedAt};
    if(j && Array.isArray(j.crawlers)){
      /* Export everything: each crawler is a crawler file (older copies held bare event lists), plus the Forge */
      var fg = j.forge && typeof j.forge === "object" ? (j.forge.doc && typeof j.forge.doc === "object" ? j.forge.doc : j.forge) : null;
      return {kind: "crawlers", when: j.exportedAt, logs: j.crawlers.map(function(c){ return Array.isArray(c) ? c : c && Array.isArray(c.events) ? c.events : null; }).filter(Boolean),
        forge: fg && (arr(fg.items).length || arr(fg.lootBoxes).length) ? {name: "your Forge", items: arr(fg.items), boxes: arr(fg.lootBoxes)} : null};
    }
    if(j && (Array.isArray(j.items) || Array.isArray(j.lootBoxes))) return {kind: "pack", name: j.name || "", items: arr(j.items), boxes: arr(j.lootBoxes)};
    if(Array.isArray(j) && j.length && j[0] && typeof j[0].type === "string" && j[0].crawlerId) return {kind: "crawlers", logs: [j]};
    if(Array.isArray(j) && j.length && j.every(function(x){ return x && typeof x.name === "string"; })) return {kind: "pack", name: "", items: j.filter(function(x){ return !("tier" in x); }), boxes: j.filter(function(x){ return "tier" in x; })};
    if(j && typeof j.name === "string" && "tier" in j && "contents" in j) return {kind: "pack", name: "", items: [], boxes: [j]};
    if(j && typeof j.name === "string" && ("slot" in j || "effects" in j)) return {kind: "pack", name: "", items: [j], boxes: []};
    return null;
  }
  var CF = null;   /* the file being previewed */
  $("cf-load").addEventListener("click", function(){ $("cf-msg").textContent = ""; $("cf-file").click(); });
  $("cf-file").addEventListener("change", async function(){
    var f = this.files && this.files[0]; this.value = ""; if(!f) return;
    var j; try{ j = JSON.parse(await f.text()); }catch(e){ $("cf-msg").textContent = f.name + " isn’t a JSON file this page can read."; return; }
    var r = cfRead(j);
    if(!r || (r.kind === "crawlers" && !r.logs.length && !r.forge) || (r.kind === "pack" && !r.items.length && !r.boxes.length)){ $("cf-msg").textContent = f.name + " doesn’t look like a CrawlerForge crawler, backup or pack."; return; }
    CF = r; CF.file = f.name;
    function packView(src){ return {name: src.name, items: src.items.map(cfItem), boxes: src.boxes.map(function(b){ return cfBox(b, src.items); })}; }
    if(r.kind === "crawlers"){
      CF.runs = r.logs.map(function(log){ var rp = cfReplay(log); rp.items = rp.st.items.map(cfItem); rp.boxes = rp.st.boxes.map(function(b){ return cfBox(b.box, []); }); return rp; });
      if(r.forge) CF.forgeP = packView(r.forge);
    } else CF.pk = packView(r);
    var who = $("cf-who"); who.innerHTML = "";
    if(r.kind === "crawlers"){
      var seen = {}, mine = String((SH.model && SH.model.crawler) || "").trim().toLowerCase(), pick = -1;
      CF.runs.forEach(function(rp, i){
        var nm = rp.st.name || "Crawler " + (i + 1), k = nm.toLowerCase(); seen[k] = (seen[k] || 0) + 1;
        who.appendChild(el("option", {value: String(i), text: nm + (seen[k] > 1 ? " (" + seen[k] + ")" : "")}));
        if(pick < 0 && mine && k === mine) pick = i;
      });
      if(CF.forgeP) who.appendChild(el("option", {value: "forge", text: "Your Forge: " + [CF.forgeP.items.length ? plural(CF.forgeP.items.length, "item") : "", CF.forgeP.boxes.length ? plural(CF.forgeP.boxes.length, "Loot Box", "Loot Boxes") : ""].filter(Boolean).join(" and ")}));
      who.value = CF.runs.length ? String(Math.max(0, pick)) : "forge";
    }
    $("cf-who-l").classList.toggle("hide", !(r.kind === "crawlers" && CF.runs.length + (CF.forgeP ? 1 : 0) > 1));
    renderCF();
  });
  $("cf-who").addEventListener("change", renderCF);
  ["cf-gear", "cf-money", "cf-hot", "cf-clear", "cf-core", "cf-skills"].forEach(function(id){ $(id).addEventListener("change", renderCF); });
  $("cf-cancel").addEventListener("click", function(){ CF = null; renderCF(); });
  function cfRow(ci, pick){
    var label = [ci.qty !== 1 ? "Qty " + ci.qty : "", ci.equipped && ci.slot ? "worn" : ""].filter(Boolean).join(", ");
    return el("li", {}, [pick ? el("input", {type: "checkbox", checked: true, "data-cf": pick, "aria-label": "Add " + ci.name}) : null,
      el("b", {text: ci.name}), label ? el("small", {text: " " + label}) : null, chipsOf(fxChips(ci.fx, ci.slot, ci.use)), ci.notes ? el("small", {cls: "nt", text: ci.notes}) : null]);
  }
  function cfBoxRow(bx, pick){
    return el("li", {}, [pick ? el("input", {type: "checkbox", checked: true, "data-cf": pick, "aria-label": "Add " + bx.name}) : null,
      el("b", {text: bx.name}), chipsOf([chip("Loot Box", "box"), bx.tier ? chip(cap(bx.tier), "box") : null, bx.random ? chip("Random", "box") : null].filter(Boolean)), el("small", {cls: "nt", text: boxSummary(bx)})]);
  }
  /* a pack, or the Forge picked from a backup */
  function cfPack(){ return !CF ? null : CF.kind === "pack" ? CF.pk : CF.forgeP && $("cf-who").value === "forge" ? CF.forgeP : null; }
  function renderCF(){
    var box = $("cf-box");
    if(!CF){ box.classList.add("hide"); return; }
    box.classList.remove("hide");
    var list = $("cf-list"); list.innerHTML = "";
    $("cf-chg").innerHTML = ""; $("cf-chg").classList.add("hide");
    var pk = cfPack();
    $("cf-opts").classList.toggle("hide", !!pk);
    if(pk){
      var what = [pk.items.length ? plural(pk.items.length, "item") : "", pk.boxes.length ? plural(pk.boxes.length, "Loot Box", "Loot Boxes") : ""].filter(Boolean).join(" and ");
      $("cf-title").textContent = (pk.boxes.length && !pk.items.length ? "Loot Boxes" : pk.boxes.length ? "Items and Loot Boxes" : "Items") + " from " + (pk.name || CF.name || CF.file);
      $("cf-sum").textContent = what + ". Tick the ones to add to your Inventory.";
      pk.items.forEach(function(ci, i){ list.appendChild(cfRow(ci, "i" + i)); });
      pk.boxes.forEach(function(bx, i){ list.appendChild(cfBoxRow(bx, "b" + i)); });
      $("cf-go").textContent = "Add to Inventory"; $("cf-go").disabled = false;
      var free = INV_ROWS - invCount(), n = pk.items.length + pk.boxes.length, rnd = pk.boxes.filter(function(b){ return b.random; }).length;
      $("cf-warn").textContent = (n > free ? "Your Inventory has room for " + plural(free, "more item") + ". " : "") +
        (rnd ? "CrawlerForge rolls what’s in a random box when it hands one out. Opened here, a random box gives its Gold, and your GM rolls the rest." : "");
      return;
    }
    var rp = CF.runs[+$("cf-who").value || 0], items = rp.items, worn = items.filter(function(c){ return c.equipped && c.slot; });
    $("cf-title").textContent = (rp.st.name || "Your crawler") + " from CrawlerForge";
    $("cf-sum").textContent = plural(worn.length, "item") + " worn, " + plural(items.length - worn.length, "item") + " carried, " + (rp.boxes.length ? plural(rp.boxes.length, "unopened Loot Box", "unopened Loot Boxes") + ", " : "") + rp.st.gold + " Gold, " + rp.st.junk + " Misc. Junk" +
      (rp.st.hot ? ", Hotlist of " + rp.st.hot.length : "") + (CF.when ? ". Exported " + new Date(CF.when).toLocaleDateString() : "") + ".";
    items.forEach(function(ci){ list.appendChild(cfRow(ci, "")); });
    rp.boxes.forEach(function(bx){ list.appendChild(cfBoxRow(bx, "")); });
    var plan = cfPlan(items, rp.boxes), warn = [];
    var kept = SLOTS.filter(function(sl){ return !plan.slots[sl[0]].length && D.gear[sl[0]].trim(); });
    $("cf-clear-l").classList.toggle("hide", !$("cf-gear").checked || !kept.length);
    if($("cf-gear").checked && kept.length && !$("cf-clear").checked) warn.push("CrawlerForge has nothing worn in " + kept.map(function(sl){ return sl[1]; }).join(", ") + ", so those keep what’s on your sheet.");
    if($("cf-gear").checked && plan.over.length) warn.push("Only " + INV_ROWS + " Inventory rows fit on your sheet, so these won’t come across: " + plan.over.map(function(c){ return c.name; }).join(", ") + ".");
    var sk = Object.keys(rp.skipped);
    if(sk.length) warn.push("This page doesn’t replay crafting (" + sk.map(cfWord).join(", ") + "), so check items you crafted or enchanted.");
    var doCore = $("cf-core").checked, doSkills = $("cf-skills").checked, chg = $("cf-chg"), cr = rp.cr;
    if(cr.made && (doCore || doSkills)){
      var lines = cfSyncLines(rp, plan, doCore, doSkills);
      (lines.length ? lines : ["Level, Stats" + (doSkills ? " and Skills" : "") + " already match your sheet."]).forEach(function(t){ chg.appendChild(el("li", {text: t})); });
      var later = Object.keys(cr.later).map(function(k){ return CF_LATER[k]; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
      if(later.length) warn.push("This page doesn’t bring across " + listWords(later) + " yet, so check " + (later.length > 1 ? "them" : "it") + " on your sheet.");
      if(doCore && cr.floor > 5) warn.push("CrawlerForge has you on Floor " + cr.floor + ", and this page stops at Floor 5, so change the Floor on your sheet by hand.");
      var spo = doSkills ? cfSkillPlan(cr) : null;
      if(spo && spo.over.length) warn.push("Only " + SK_ROWS + " Skill rows fit on your sheet, so these won’t come across: " + spo.over.map(function(c){ return c.name; }).join(", ") + ".");
    }
    chg.classList.toggle("hide", !chg.children.length);
    $("cf-core-l").classList.toggle("hide", !cr.made); $("cf-skills-l").classList.toggle("hide", !cr.made);
    $("cf-warn").textContent = warn.join(" ");
    $("cf-go").textContent = "Load it";
    $("cf-go").disabled = !$("cf-gear").checked && !$("cf-money").checked && !$("cf-hot").checked && !(cr.made && (doCore || doSkills));
  }
  function listWords(a){ return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }

  /* ---------- the rest of the crawler: Level, Floor, Stats, Health, Mana, AI Favor, Evade, Popularity and Skills ---------- */
  var CF_STORY = [["pastTrauma", "trauma", "Past Trauma"], ["looseEnds", "loose", "Loose Ends"], ["regrets", "regrets", "Regrets"]];
  /* a CrawlerForge Skill finds its sheet row by name; a sheet name that starts it counts too ("Unarmed" for "Unarmed Combat") */
  function cfMatch(name, pool){
    var lo = String(name || "").trim().toLowerCase(), hit = pool.filter(function(s){ return s.name.trim().toLowerCase() === lo; });
    if(hit.length) return hit[0];
    hit = pool.filter(function(s){ var a = s.name.trim().toLowerCase(); return a && (lo.indexOf(a + " ") === 0 || a.indexOf(lo + " ") === 0); });
    return hit.length === 1 ? hit[0] : null;
  }
  /* which sheet rows change: re-ranked and re-ticked (set), new (add), removed in CrawlerForge (drop), and rows
     CrawlerForge doesn't list, like the Heal Spell every crawler has (keep) */
  function cfSkillPlan(cr){
    var pool = D.skills.slice(), set = [], add = [], drop = [];
    var list = Object.keys(cr.sk).map(function(k){ return cr.sk[k]; });
    if(cr.floor <= 2) cr.untrained.forEach(function(n){ if(!cr.sk[n.trim().toLowerCase()]) list.push({name: n, rank: 0, marked: true, def: null}); });
    list.forEach(function(c){ var s = cfMatch(c.name, pool); if(s){ pool.splice(pool.indexOf(s), 1); set.push({s: s, c: c}); } else add.push(c); });
    Object.keys(cr.removed).forEach(function(k){ var s = cfMatch(cr.removed[k], pool); if(s){ pool.splice(pool.indexOf(s), 1); drop.push(s); } });
    var room = Math.max(0, SK_ROWS - (D.skills.length - drop.length));
    return {set: set, add: add.slice(0, room), over: add.slice(room), drop: drop, keep: pool};
  }
  /* a new row's Stat, "rolled against" and notes, from the CrawlerForge Skill */
  function cfSkillFields(c){
    var d = c.def || {}, k = STATS.indexOf(d.stat) >= 0 ? d.stat : d.category === "spell" ? "int" : "";
    var type = d.passive ? "Passive" + (d.interrupt ? ", Interrupt" : "") : d.attack || d.category === "attack" ? "Evade" : d.checkType === "opposed" ? "Opposed" : d.checkType === "unopposed" ? "Unopposed" : "";
    var t = d.description ? cfNotes(d.description) : "";
    if(t.length > 90){ var m = /^(.{20,120}?[.!?])\s/.exec(t + " "); t = m ? m[1] : t.slice(0, 87).replace(/\s+\S*$/, "") + "…"; }
    return {stat: k ? modText(k, crawler()) : c.def ? "None" : "", type: type, notes: t};
  }
  /* Evade Buffs after loading: the gear's Evade plus CrawlerForge's Evade adjustment */
  function cfGearAfter(plan, key){
    if(!$("cf-gear").checked) return gearTotals()[key];
    var n = 0; SLOTS.forEach(function(sl){ plan.slots[sl[0]].forEach(function(e){ n += e.ci.fx[key] || 0; }); }); return n;
  }
  /* what loading changes, for the preview */
  function cfSyncLines(rp, plan, doCore, doSkills){
    var cr = rp.cr, c = crawler(), L = [];
    if(doCore){
      if(cr.level !== c.lvl) L.push("Level " + c.lvl + " to " + cr.level);
      if(cr.floor !== floor && cr.floor <= 5) L.push("Floor " + floor + " to " + cr.floor);
      STATS.forEach(function(k){ if(cr.un[k] !== c.base[k]) L.push(SFULL[k] + " (Unenhanced) " + c.base[k] + " to " + cr.un[k] + ", and Enhanced by the same"); });
      if(cr.fav !== c.fav) L.push("AI Favor " + c.fav + " to " + cr.fav);
      var ev = cfGearAfter(plan, "evade") + cr.evAdj, evNow = c.evb + (cfGearAfter(plan, "evade") - gearTotals().evade);
      if(ev !== evNow) L.push("Evade Buffs " + evNow + " to " + ev);
      if(10 - cr.lost !== hm.slots) L.push("Health Bar " + hm.slots + " to " + (10 - cr.lost) + " slots");
      var intAfter = c.score.int + (cr.un.int - c.base.int) + (cfGearAfter(plan, "int") - gearTotals().int), m0 = hm.mana == null ? c.mana : hm.mana, m1 = Math.max(0, Math.min(intAfter, cr.mana));
      if(m0 !== m1) L.push("Mana " + m0 + " to " + m1);
      if(cr.pop !== null && String(cr.pop) !== String(D.text.pop || "").trim()) L.push("Popularity " + (String(D.text.pop || "").trim() || "blank") + " to " + cr.pop);
      CF_STORY.forEach(function(f){ var v = cr.story[f[0]]; if(typeof v === "string" && v.trim() && v.trim() !== String(D.text[f[1]] || "").trim()) L.push(f[2] + " changed"); });
    }
    if(doSkills){
      var sp = cfSkillPlan(cr);
      sp.set.forEach(function(o){
        var nm = o.s.name.trim() + (o.s.name.trim().toLowerCase() !== o.c.name.toLowerCase() ? " (" + o.c.name + " in CrawlerForge)" : ""), r0 = skRank(o.s);
        if(r0 !== o.c.rank) L.push(nm + " Rank " + r0 + " to " + o.c.rank);
        if(!!o.s.mark !== !!o.c.marked) L.push(nm + (o.c.marked ? " ticked for advancement" : " tick cleared"));
      });
      if(sp.add.length) L.push("Adds " + sp.add.map(function(c){ return c.name + " (Rank " + c.rank + (c.marked ? ", ticked" : "") + ")"; }).join(", "));
      if(sp.drop.length) L.push("Removes " + sp.drop.map(function(s){ return s.name.trim(); }).join(", ") + ", which you removed in CrawlerForge");
      var untick = sp.keep.filter(function(s){ return !skRank(s) && s.mark; });
      if(untick.length) L.push("Clears the untrained tick on " + untick.map(function(s){ return s.name.trim(); }).join(", "));
      var kept = sp.keep.filter(function(s){ return untick.indexOf(s) < 0; });
      if(kept.length) L.push("Keeps " + kept.map(function(s){ return s.name.trim(); }).join(", ") + ", which CrawlerForge doesn’t list");
    }
    return L;
  }
  /* load the crawler's numbers and Skills into the page; Save to sheet writes them to the PDF */
  function cfApply(rp, doCore, doSkills){
    var cr = rp.cr;
    if(!cr.made) return;
    if(doCore){
      if(cr.floor <= 5 && cr.floor !== floor) setFloor(cr.floor, false);
      $("cr-lvl").value = cr.level;
      STATS.forEach(function(k){
        var u = $("cu-" + k), e = $("cr-" + k), was = parseInt(u.value, 10);
        if(was === cr.un[k]) return;
        e.value = Math.max(1, (isNaN(was) ? cr.un[k] : (parseInt(e.value, 10) || was) + cr.un[k] - was));
        u.value = cr.un[k];
      });
      syncPrev();
      $("cr-fav").value = cr.fav;
      $("cr-evb").value = gearTotals().evade + cr.evAdj;
      hm.slots = Math.max(0, Math.min(10, 10 - cr.lost));
      saveCrawler();
      hm.mana = Math.max(0, Math.min(crawler().mana, cr.mana));
      if(cr.pop !== null) D.text.pop = String(cr.pop);
      CF_STORY.forEach(function(f){ var v = cr.story[f[0]]; if(typeof v === "string" && v.trim()) D.text[f[1]] = v.trim(); });
    }
    if(doSkills){
      var sp = cfSkillPlan(cr);
      sp.drop.forEach(function(s){ D.skills.splice(D.skills.indexOf(s), 1); });
      sp.set.forEach(function(o){ if(skRank(o.s) !== o.c.rank) setRank(o.s, o.c.rank); o.s.mark = !!o.c.marked; });
      sp.keep.forEach(function(s){ if(!skRank(s) && s.mark) s.mark = false; });
      sp.add.forEach(function(c){ var s = newSkill(c.name, c.rank), f = cfSkillFields(c); s.stat = f.stat; s.type = f.type; s.notes = f.notes; s.mark = !!c.marked; });
    }
    saveCrawler(); calcRefresh(); changed();
  }
  /* where each item goes: worn items into their Gear Slots, the rest into Inventory rows */
  function cfPlan(items, boxes){
    var slots = {head: [], torso: [], arms: [], hands: [], legs: [], feet: [], acc: []}, inv = [], over = [];
    items.forEach(function(ci){
      var left = ci.qty;
      if(ci.equipped && ci.slot){
        var sh = sheetSlot(ci.slot), e = {pos: "", text: gearText({name: ci.name, fx: ci.fx}), ci: ci}, ok = false;
        if(sh === "hands"){
          var h = slots.hands, has = function(p){ return h.some(function(x){ return x.pos === p; }); };
          e.pos = ci.slot === "gloves" ? (has("gloves") ? "" : "gloves") : ci.slot === "twohand" ? (has("both") || has("main") || has("off") ? "" : "both") : has("both") ? "" : !has("main") ? "main" : !has("off") ? "off" : "";
          if(e.pos){ h.push(e); ok = true; }
        } else if(sh === "acc"){ if(slots.acc.length < ACC_MAX){ slots.acc.push(e); ok = true; } }
        else if(slots[sh] && !slots[sh].length){ slots[sh].push(e); ok = true; }
        if(ok) left -= 1;
      }
      if(left > 0) inv.push({ci: ci, qty: left});
    });
    var rows = INV_ROWS - 2;   /* Gold and Misc. Junk keep a row each */
    var merged = [];
    inv.forEach(function(o){
      var own = o.ci.notes;
      if(!own){ var k = findRow(new RegExp("^" + o.ci.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i")); if(k >= 0) own = parseItem(D.inv[k]).notes; }
      var notes = itemNotes({slot: o.ci.slot, fx: o.ci.fx, use: o.ci.use, notes: own});
      var m = merged.filter(function(x){ return x.name.toLowerCase() === o.ci.name.toLowerCase() && x.notes === notes; })[0];
      if(m) m.qty += o.qty; else if(merged.length < rows) merged.push({name: o.ci.name, qty: o.qty, notes: notes}); else over.push(o.ci);
    });
    (boxes || []).forEach(function(bx){
      var notes = boxNotes(bx), m = merged.filter(function(x){ return x.name.toLowerCase() === bx.name.toLowerCase() && x.notes === notes; })[0];
      if(m) m.qty += 1; else if(merged.length < rows) merged.push({name: bx.name, qty: 1, notes: notes, bx: bx}); else over.push(bx);
    });
    return {slots: slots, inv: merged, over: over};
  }
  $("cf-go").addEventListener("click", function(){
    if(!CF) return;
    var pk = cfPack();
    if(pk){
      var added = 0, full = [];
      $("cf-list").querySelectorAll("input[data-cf]:checked").forEach(function(inp){
        var id = inp.getAttribute("data-cf"), ci = id[0] === "i" ? pk.items[+id.slice(1)] : null, bx = id[0] === "b" ? pk.boxes[+id.slice(1)] : null;
        var name = ci ? ci.name : bx.name, qty = ci ? Math.max(1, ci.qty) : 1, notes = ci ? itemNotes({slot: ci.slot, fx: ci.fx, use: ci.use, notes: ci.notes}) : boxNotes(bx);
        if(bx) boxStore(name, notes, bx);
        for(var k = 0; k < INV_ROWS; k++) if(D.inv[k].name.trim().toLowerCase() === name.toLowerCase() && D.inv[k].notes === notes){ D.inv[k].qty = String(qtyOf(D.inv[k]) + qty); added++; return; }
        var f = freeRow(); if(f < 0){ full.push(name); return; }
        D.inv[f] = {name: name, qty: String(qty), notes: notes}; added++;
      });
      gearLog("Added " + plural(added, "item") + " from " + (pk.name || CF.name || CF.file) + "." + (full.length ? " No room for " + full.join(", ") + "." : ""));
      CF = null; renderCF(); changed(); return;
    }
    var rp = CF.runs[+$("cf-who").value || 0], plan = cfPlan(rp.items, rp.boxes), doGear = $("cf-gear").checked, doMoney = $("cf-money").checked, doHot = $("cf-hot").checked, doClear = $("cf-clear").checked;
    var doCore = rp.cr.made && $("cf-core").checked, doSkills = rp.cr.made && $("cf-skills").checked;
    var who = rp.st.name || "your crawler";
    var what = [doGear ? "gear and Inventory" : "", doMoney ? "Gold and Junk" : "", doHot && rp.st.hot ? "Hotlist" : "", doCore ? "Level and Stats" : "", doSkills ? "Skills" : ""].filter(Boolean);
    var msg = "Loaded " + what.join(", ") + " from " + who + "’s CrawlerForge file.";
    if(!doGear && !doMoney && !doHot){ cfApply(rp, doCore, doSkills); gearLog(msg); CF = null; renderCF(); return; }
    gearChange(function(){
      var gk = findRow(/^gold$/i), jk = findRow(/^misc\.?\s*junk$/i), keep = {};
      if(gk >= 0) keep.gold = D.inv[gk]; if(jk >= 0) keep.junk = D.inv[jk];
      if(doGear){
        SLOTS.forEach(function(sl){ if(plan.slots[sl[0]].length || doClear) setSlotItems(sl[0], plan.slots[sl[0]].map(function(e){ return {pos: e.pos, text: e.text}; })); });
        var x = X(); SLOTS.forEach(function(sl){ plan.slots[sl[0]].forEach(function(e){ if(e.ci.notes || e.ci.use) x.inotes[e.ci.name.toLowerCase()] = {notes: e.ci.notes, use: e.ci.use}; }); }); xSave();
        for(var k = 0; k < INV_ROWS; k++) D.inv[k] = {name: "", qty: "", notes: ""};
        var row = 0;
        [keep.gold, keep.junk].forEach(function(r){ if(r) D.inv[row++] = r; });
        plan.inv.forEach(function(o){ if(row < INV_ROWS){ D.inv[row++] = {name: o.name, qty: String(o.qty), notes: o.notes}; if(o.bx) boxStore(o.name, o.notes, o.bx); } });
      }
      if(doMoney){ setCountQuiet(/^gold$/i, "Gold", rp.st.gold); setCountQuiet(/^misc\.?\s*junk$/i, "Misc. Junk", rp.st.junk); }
      if(doHot && rp.st.hot){
        var old = D.hot.slice();
        for(var h = 0; h < 10; h++){
          var nm = String(rp.st.hot[h] || "").trim(), lo = nm.toLowerCase();
          D.hot[h] = nm ? old.filter(function(o){ var t = o.trim().toLowerCase(); return t === lo || t.indexOf(lo + ":") === 0 || t.indexOf(lo + " (") === 0; })[0] || nm : "";
        }
      }
      return msg;
    });
    /* after the gear, so Evade Buffs and Max Mana count what CrawlerForge has you wearing */
    if(doCore || doSkills) cfApply(rp, doCore, doSkills);
    CF = null; renderCF(); renderHot();
  });
  function setCountQuiet(re, name, n){
    var k = findRow(re);
    if(k < 0){ if(!n) return; k = freeRow(); if(k < 0) return; D.inv[k] = {name: name, qty: "0", notes: ""}; }
    D.inv[k].qty = String(n);
  }

  /* ============================== PET ============================== */
  function pInt(v, d){ var n = parseInt(String(v || "").replace("−", "-"), 10); return isNaN(n) ? d : n; }
  function hasPet(){ var p = D.pet; return PETKEYS.some(function(k){ return String(p[k] || "").trim(); }); }
  function hasMount(){ var m = D.mount; return MNTKEYS.some(function(k){ return String(m[k] || "").trim(); }); }
  function petMods(){ var o = {}; STATS.forEach(function(k){ o[k] = modOf(Math.max(1, pInt(D.pet[k], 1))); }); return o; }
  /* the sheet has no boxes for a pet's name, attitude or role, so they go at the start of its Special box: "Jane, Bonded, Utility." */
  var PETHEAD = /^\s*(?:([^,.;]{1,40}?),\s*)?(Hostile|Calm|Friendly|Bonded)(?:,\s*(Tank|Aggressive|Utility))?\.(?:\s+|$)/i;
  function capW(w){ return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""; }
  function petHead(text){
    var t = String(text === undefined ? (D.pet.special || "") : (text || "")), m = PETHEAD.exec(t);
    return m ? {name: (m[1] || "").trim(), att: capW(m[2]), role: capW(m[3] || ""), rest: t.slice(m[0].length).trim()} : {name: "", att: "", role: "", rest: t.trim()};
  }
  function setPetHead(h){
    var att = h.att || (h.name || h.role ? "Bonded" : ""), head = att ? (h.name ? h.name + ", " : "") + att + (h.role ? ", " + h.role : "") + "." : "";
    D.pet.special = head + (head && h.rest ? " " : "") + (h.rest || "");
  }
  function barCount(b){ var n = 0; b.vals.forEach(function(v){ if(String(v).trim()) n++; }); return n; }
  function barLeft(b){ var n = barCount(b), l = 0; for(var i = 0; i < n; i++) if(!b.lost[i]) l++; return l; }
  function setBar(b, count, val){
    count = Math.max(0, Math.min(10, count));
    var full = barLeft(b) === barCount(b), left = full ? count : Math.min(barLeft(b), count);
    for(var i = 0; i < 10; i++){ b.vals[i] = i < count ? String(val) : ""; b.lost[i] = i < count ? i >= left : false; }
  }
  function setLeft(b, left){ var n = barCount(b); left = Math.max(0, Math.min(n, left)); for(var i = 0; i < 10; i++) b.lost[i] = i < n ? i >= left : false; }
  function petSlots(){ return Math.min(10, Math.max(1, pInt(D.pet.size, 3) + pInt(D.pet.level, 1) - 1)); }
  function drawBar(id, b){
    var bar = $(id), n = barCount(b), left = barLeft(b); bar.innerHTML = "";
    for(var i = 0; i < 10; i++){
      var cell = el("div", {text: i < n ? b.vals[i] : ""});
      if(i >= n) cell.className = "none"; else if(i >= left) cell.className = "gone"; else cell.style.background = "var(" + HB[Math.round(i * 9 / Math.max(1, n - 1))] + ")";
      bar.appendChild(cell);
    }
  }
  function renderPet(){
    var on = hasPet(), x = X();
    $("pet-none").classList.toggle("hide", on); $("pet-on").classList.toggle("hide", !on);
    if(on){
      var p = D.pet, m = petMods(), xp = petHead();
      ["name","att","role"].forEach(function(k){ var e = $("pt-" + k); if(document.activeElement !== e) e.value = xp[k] || (k === "att" ? "Bonded" : ""); });
      PETKEYS.forEach(function(k){ var e = $("pt-" + k); if(e && document.activeElement !== e) e.value = k === "special" ? xp.rest : p[k]; });
      STATS.forEach(function(k){ $("pm-" + k).textContent = sgn(m[k]); });
      var n = barCount(p), left = barLeft(p);
      drawBar("pt-bar", p);
      var slotV = pInt(p.vals[0], m.con);
      $("pt-hbtxt").textContent = n ? left + " of " + n + " slots, " + slotV + " each (" + left * slotV + " Health)." + (n && !left ? " Your pet is dead: pet-class Mobs and Earth-born pets die at 0%." : "") : "No Health Bar slots set.";
      if(document.activeElement !== $("pt-slots")) $("pt-slots").value = n || petSlots();
      $("pt-pts").textContent = x.petPts ? x.petPts + " Stat points to place (any Stat but Intelligence)." : "";
      $("pt-pts-done").classList.toggle("hide", !x.petPts);
      var role = xp.role || "", F = floor;
      $("pt-roleinfo").textContent = role === "Tank" ? "Tank: DR equal to the Floor (" + F + ") and one Special Ability." : role === "Aggressive" ? "Aggressive: Back Claw and Bite at Rank " + F + ", +" + F + " damage on Animal Attacks, no Special Abilities." : role === "Utility" ? "Utility: two Special Abilities." : "";
      $("pt-rank").textContent = "Pet attacks and abilities roll at Rank " + F + " (your Floor). Extra base damage die from Floor 5.";
    }
    var mon = hasMount();
    $("mt-none").classList.toggle("hide", mon); $("mt-on").classList.toggle("hide", !mon);
    if(mon){
      MNTKEYS.forEach(function(k){ var e = $("mt-" + k); if(document.activeElement !== e) e.value = D.mount[k]; });
      drawBar("mt-bar", D.mount);
      var mn = barCount(D.mount);
      $("mt-hbtxt").textContent = mn ? barLeft(D.mount) + " of " + mn + " slots." : "No Health Bar slots set. A mount has as many as its Size.";
    }
  }
  $("pet-new").addEventListener("click", function(){
    var p = D.pet; p.str = "2"; p.int = "1"; p.con = "2"; p.dex = "2"; p.cha = "1"; p.level = "1"; p.dr = "0"; p.evade = "+1"; p.size = "3"; p.move = "23"; p.special = "";
    p.atk1 = "Slice: d20+F+Str, 1d4+Str Slashing"; p.atk2 = "";
    setPetHead({name: $("pn-name").value.replace(/[,.;]/g, "").trim(), att: $("pn-att").value, role: "", rest: ""}); $("pn-name").value = "";
    setBar(p, petSlots(), modOf(2)); setLeft(p, petSlots());
    petLog("Added a Level 1 pet with the book’s starting stats (p. 231). Change Size and the rest to match your animal."); changed();
  });
  PETKEYS.forEach(function(k){
    var e = $("pt-" + k); if(!e) return;
    e.addEventListener("input", function(){
      if(k === "special"){ var h = petHead(); h.rest = e.value.trim(); setPetHead(h); } else D.pet[k] = e.value;
      if(k === "size" || k === "level" || k === "con"){ var m = petMods(); setBar(D.pet, k === "con" ? barCount(D.pet) || petSlots() : petSlots(), m.con); }
      saveData(); renderPet(); renderStrip(); sheetChanged();
    });
  });
  ["name","att","role"].forEach(function(k){
    $("pt-" + k).addEventListener(k === "name" ? "input" : "change", function(){
      var h = petHead(); h[k] = k === "name" ? this.value.replace(/[,.;]/g, "").trim() : this.value;
      if(!h.att) h.att = $("pt-att").value;
      setPetHead(h); saveData(); renderPet(); renderStrip(); sheetChanged();
    });
  });
  $("pt-slots").addEventListener("change", function(){ setBar(D.pet, num("pt-slots", petSlots()), petMods().con); changed(); });
  $("pt-hit").addEventListener("click", function(){
    var p = D.pet, d = Math.max(0, num("pt-dmg", 0)), dr = Math.max(0, pInt(p.dr, 0)), slot = Math.max(1, pInt(p.vals[0], petMods().con));
    if(!d){ petLog("Enter the damage first."); return; }
    var after = Math.max(0, d - dr), lost = Math.min(barLeft(p), Math.floor(after / slot));
    setLeft(p, barLeft(p) - lost);
    petLog(d + " damage − DR " + dr + " = " + after + ", ÷ " + slot + " per slot: lost " + plural(lost, "slot") + "." + (!barLeft(p) ? " Your pet is dead." : ""));
    $("pt-dmg").value = ""; changed();
  });
  $("pt-heal").addEventListener("click", function(){ var p = D.pet, n = Math.max(1, num("pt-healn", 1)), b = barLeft(p); setLeft(p, b + n); petLog("Healed " + plural(barLeft(p) - b, "slot") + "."); changed(); });
  $("pt-full").addEventListener("click", function(){ setLeft(D.pet, barCount(D.pet)); petLog("Back to full Health."); changed(); });
  function petAttack(which){
    var t = String(D.pet[which] || "").trim(); if(!t){ petLog("That attack box is empty."); return; }
    var F = floor, m = petMods(), stat = /\bdex/i.test(t) ? "dex" : /\bint/i.test(t) && !/\bstr/i.test(t) ? "int" : "str";
    var dm = /(\d+)d(\d+)/i.exec(t.replace(/d20/ig, "")), name = t.split(":")[0].trim() || "Attack";
    var a = rnd(20), hit = a + F + m[stat];
    var ups = F >= 15 ? 3 : F >= 10 ? 2 : F >= 5 ? 1 : 0, aggr = petHead().role === "Aggressive" ? F : 0;
    var dn = dm ? +dm[1] + ups : 0, dx = dm ? +dm[2] : 0, dr = dm ? rollN(dn, dx) : [], dmg = dm ? total(dr) + m[stat] + aggr : 0;
    var out = $("pt-atkout");
    fill(out, [name + ": ", span("to hit " + hit, "d20 rolled " + a + (a === 20 ? " (natural 20)" : a === 1 ? " (natural 1)" : "") + "\n+ Rank " + F + " (the Floor)\n+ " + SN[stat] + " Mod " + m[stat] + "\n= " + hit + "\nCompare with the Mob’s Evade"),
      dm ? ", " : "", dm ? span(dmg + " damage", dn + "d" + dx + " rolled " + dr.join(", ") + (ups ? " (" + ups + " extra base die from the Floor " + F + " upgrade)" : "") + "\n+ " + SN[stat] + " Mod " + m[stat] + (aggr ? "\n+ " + aggr + " for an Aggressive pet" : "") + "\n= " + dmg) : "",
      ". A pet attacks once per round."]);
  }
  $("pt-a1").addEventListener("click", function(){ petAttack("atk1"); });
  $("pt-a2").addEventListener("click", function(){ petAttack("atk2"); });
  function petTarget(){ return 10 + floor + petMods().int; }
  $("pt-cmd").addEventListener("click", function(){
    openCheck({skill: "Animal Handling", stat: "cha", target: petTarget(),
      note: "Pet command: Success, it fights the whole combat (2 Actions, only Evade, Move or Attack, one attack a round). Amazing Success or better, use its Actions freely. Fail, it stays out; try again. Major Fail or worse, it runs and hides."});
  });
  $("pt-bond").addEventListener("click", function(){
    var att = petHead().att || "Bonded", need = att === "Hostile" ? "Amazing Success or better to make it Calm" : att === "Calm" ? "Success or better to make it Friendly" : att === "Friendly" ? "Amazing Success or better to make it Bonded" : "It’s already Bonded";
    openCheck({skill: "Animal Handling", stat: "cha", target: petTarget(), note: "Attitude (20 minutes of contact): " + need + ". Major Fail: no retry for a week. Critical Fail: it turns Hostile and attacks."});
  });
  $("pt-lvl").addEventListener("click", function(){
    var p = D.pet, l = pInt(p.level, 1), gain = l < 15 ? 2 : 1, x = X();
    p.level = String(l + gain); x.petPts += 3 * gain; xSave();
    var m = petMods(), n = Math.min(10, barCount(p) + gain), left = barLeft(p) + gain;
    setBar(p, n, m.con); setLeft(p, left);
    petLog("Your pet went from Level " + l + " to " + (l + gain) + (gain === 2 ? " (pets level twice as fast until 15)" : "") + ": +" + plural(gain, "Health Bar slot") + " (max 10) and " + 3 * gain + " Stat points.");
    changed();
  });
  $("pt-pts-done").addEventListener("click", function(){ X().petPts = 0; xSave(); renderPet(); });
  $("pet-clear").addEventListener("click", function(){
    if(!window.confirm("Clear the pet box on your sheet?")) return;
    D.pet = blankPet(); X().petPts = 0; xSave(); petLog("Pet box cleared."); changed();
  });
  /* mount */
  $("mt-new").addEventListener("click", function(){ var mt = D.mount; mt.size = "5"; mt.move = "30"; mt.dr = "0"; mt.occ = "1"; setBar(mt, 5, 1); setLeft(mt, 5); changed(); });
  MNTKEYS.forEach(function(k){ $("mt-" + k).addEventListener("input", function(){ D.mount[k] = this.value; if(k === "size"){ setBar(D.mount, pInt(this.value, 0), D.mount.vals[0] || 1); } saveData(); renderPet(); sheetChanged(); }); });
  $("mt-hit").addEventListener("click", function(){
    var mt = D.mount, d = Math.max(0, num("mt-dmg", 0)), dr = Math.max(0, pInt(mt.dr, 0)), slot = Math.max(1, pInt(mt.vals[0], 1));
    var lost = Math.min(barLeft(mt), Math.floor(Math.max(0, d - dr) / slot)); setLeft(mt, barLeft(mt) - lost); $("mt-dmg").value = ""; changed();
  });
  $("mt-heal").addEventListener("click", function(){ setLeft(D.mount, barLeft(D.mount) + Math.max(1, num("mt-healn", 1))); changed(); });
  $("mt-clear").addEventListener("click", function(){ if(!window.confirm("Clear the mount box on your sheet?")) return; D.mount = blankMount(); changed(); });

  /* ============================== NOTES ============================== */
  function renderNotes(){
    document.querySelectorAll("[data-tx]").forEach(function(e){
      if(document.activeElement === e) return;
      var k = e.getAttribute("data-tx"), v = D.text[k];
      if(Array.isArray(v)){ var lines = v.slice(0); while(lines.length && !String(lines[lines.length - 1]).trim()) lines.pop(); e.value = lines.join("\n"); }
      else e.value = v || "";
    });
  }
  document.querySelectorAll("[data-tx]").forEach(function(e){
    e.addEventListener("input", function(){
      var k = e.getAttribute("data-tx"), t = TXTBY[k], warn = $("tx-warn-" + k);
      if(t[2].length === 1) D.text[k] = e.value;
      else {
        var lines = e.value.split(/\r?\n/), cap = t[2].length;
        D.text[k] = t[2].map(function(_, i){ return (lines[i] || "").trim(); });
        if(warn) warn.textContent = lines.filter(function(l){ return l.trim(); }).length > cap ? "Only " + cap + " fit on your sheet. Lines past " + cap + " won’t be saved." : "";
      }
      saveData(); sheetChanged();
    });
  });

  /* ============================== shared ============================== */
  function renderTools(){ renderSkills(); renderGear(); renderPet(); renderNotes(); renderStrip(); }

  /* sheet fields for everything above, for saving and for the change list */
  function toolFields(){
    var w = {}, c = crawler();
    var byRow = {}; D.skills.forEach(function(s){ byRow[s.row] = s; });
    for(var k = 0; k < SK_ROWS; k++){
      var f = skF(k), s = byRow[k];
      w[f.name] = s ? s.name : ""; w[f.rank] = s ? s.rank : ""; w[f.stat] = s ? regenMod(s.stat, c) : ""; w[f.type] = s ? s.type : ""; w[f.notes] = s ? s.notes : ""; w[f.box] = s ? !!s.mark : false;
    }
    D.attacks.forEach(function(a){ var r = FN.attacks[a.row]; if(!r) return; w[tf(r[1])] = a.rank; w[tf(r[2])] = regenMod(a.stat, c); w[tf(r[4])] = regenMod(a.dstat, c); });
    SLOTS.forEach(function(s){ w[tf(s[2])] = D.gear[s[0]]; });
    for(var r = 0; r < INV_ROWS; r++){ var g = invF(r), it = D.inv[r]; w[g.name] = it.name; w[g.qty] = it.qty; w[g.notes] = it.notes; }
    HOTF.forEach(function(n, i){ w[n] = D.hot[i] || ""; });
    PETKEYS.forEach(function(k2){ w[PETF[k2]] = D.pet[k2] || ""; });
    PETF.vals.forEach(function(n, i){ w[n] = D.pet.vals[i] || ""; }); PETF.boxes.forEach(function(n, i){ w[n] = !!D.pet.lost[i]; });
    MNTKEYS.forEach(function(k2){ w[MNTF[k2]] = D.mount[k2] || ""; });
    MNTF.vals.forEach(function(n, i){ w[n] = D.mount.vals[i] || ""; }); MNTF.boxes.forEach(function(n, i){ w[n] = !!D.mount.lost[i]; });
    TXT.forEach(function(t){ var v = D.text[t[0]]; t[2].forEach(function(n, i){ w[n] = Array.isArray(v) ? (v[i] || "") : (i === 0 ? (v || "") : ""); }); });
    return w;
  }
  function toolDiff(a, b, w, L){
    if(!a || !b) return;
    var ch = {}, n = 0;
    Object.keys(b).forEach(function(f){ if(a[f] !== b[f] && !(a[f] == null && (b[f] === "" || b[f] === false))){ ch[f] = 1; w[f] = b[f]; n++; } });
    if(!n) return;
    function any(fs){ return fs.some(function(f){ return ch[f]; }); }
    function sv(m, f){ return String(m[f] == null ? "" : m[f]).trim(); }
    var modLine = false;
    for(var k = 0; k < SK_ROWS; k++){
      var f = skF(k); if(!any([f.name, f.rank, f.stat, f.type, f.notes, f.box])) continue;
      var an = sv(a, f.name), bn = sv(b, f.name), nm = bn || an;
      if(!an && bn){ L("Added Skill " + bn + " (Rank " + (sv(b, f.rank) || 0) + ")"); continue; }
      if(an && !bn){ L("Removed Skill " + an); continue; }
      if(ch[f.name]) L("Skill " + an + " renamed to " + bn);
      if(ch[f.rank]) L(nm + " Rank " + (sv(a, f.rank) || 0) + " to " + (sv(b, f.rank) || 0));
      if(ch[f.box]) L(nm + (b[f.box] ? " ticked for advancement" : " tick cleared"));
      if(ch[f.notes]){
        var t0 = tagsOf(a[f.notes]), t1 = tagsOf(b[f.notes]);
        if(t0.grind !== t1.grind) L(nm + " grinding hours " + t0.grind + " to " + t1.grind);
        if(t0.adv !== t1.adv) L(nm + " end-of-floor bonus " + sgn(t0.adv) + " to " + sgn(t1.adv));
        if(t0.max !== t1.max) L(nm + (t1.max ? " can reach Rank 20" : " capped at Rank 15 again"));
        if(!sameNotes(a[f.notes], b[f.notes])) L(nm + " notes changed");
      }
      if(ch[f.type]) L(nm + " type " + (sv(a, f.type) || "blank") + " to " + (sv(b, f.type) || "blank"));
      if(ch[f.stat]){ if(isModText(a[f.stat]) && isModText(b[f.stat]) && statKey(a[f.stat]) === statKey(b[f.stat])) modLine = true; else L(nm + " Stat " + (sv(a, f.stat) || "blank") + " to " + (sv(b, f.stat) || "blank")); }
    }
    FN.attacks.forEach(function(r, i){
      var at = D.attacks.filter(function(x){ return x.row === i; })[0], an2 = at ? at.name.trim() : "Attack " + (i + 1);
      if(ch[tf(r[1])]) L(an2 + " attack Rank " + sv(a, tf(r[1])) + " to " + sv(b, tf(r[1])));
      if(ch[tf(r[2])] || ch[tf(r[4])]) modLine = true;
    });
    if(modLine) L("Skill and attack Mods updated to match your Stats");
    SLOTS.forEach(function(s){ var f2 = tf(s[2]); if(ch[f2]) L(s[1] + ": " + (sv(a, f2).replace(/\s*\n\s*/g, "; ") || "empty") + " to " + (sv(b, f2).replace(/\s*\n\s*/g, "; ") || "empty")); });
    for(var r = 0; r < INV_ROWS; r++){
      var g = invF(r); if(!any([g.name, g.qty, g.notes])) continue;
      var a1 = sv(a, g.name), b1 = sv(b, g.name), q0 = sv(a, g.qty) || "1", q1 = sv(b, g.qty) || "1";
      if(!a1 && b1) L("Inventory: added " + b1 + (q1 !== "1" ? " × " + q1 : ""));
      else if(a1 && !b1) L("Inventory: removed " + a1);
      else if(a1 !== b1) L("Inventory: " + a1 + " to " + b1);
      else { if(q0 !== q1) L("Inventory: " + b1 + " " + q0 + " to " + q1); if(ch[g.notes]) L("Inventory: " + b1 + " notes changed"); }
    }
    HOTF.forEach(function(f3, i){ if(ch[f3]) L("Hotlist box " + (i + 1) + ": " + (sv(b, f3).replace(/\s*\n\s*/g, " ") || "empty")); });
    function bar(m, F){ var nn = 0, left = 0; F.vals.forEach(function(v, i){ if(sv(m, v)){ nn++; if(!m[F.boxes[i]]) left++; } }); return {n: nn, left: left}; }
    function filled(m, F, keys){ return keys.some(function(k6){ return sv(m, F[k6]); }); }
    var PSN = {str: "Str", int: "Int", con: "Con", dex: "Dex", cha: "Cha", level: "Level", dr: "DR", evade: "Evade", move: "Move", size: "Size"};
    var hadPet = filled(a, PETF, PETKEYS), hasP = filled(b, PETF, PETKEYS);
    if(!hadPet && hasP){ var pb = bar(b, PETF); L("Pet added: Level " + (sv(b, PETF.level) || 1) + ", Size " + (sv(b, PETF.size) || "?") + ", " + pb.left + " of " + pb.n + " Health Bar slots"); }
    else if(hadPet && !hasP) L("Pet box cleared");
    else if(any(PETKEYS.map(function(k7){ return PETF[k7]; }).concat(PETF.vals, PETF.boxes))){
      Object.keys(PSN).forEach(function(k3){ var f4 = PETF[k3]; if(ch[f4]) L("Pet " + PSN[k3] + " " + (sv(a, f4) || "blank") + " to " + (sv(b, f4) || "blank")); });
      ["atk1","atk2"].forEach(function(k4, i){ if(ch[PETF[k4]]) L("Pet attack " + (i + 1) + ": " + (sv(b, PETF[k4]) || "empty")); });
      if(ch[PETF.special]){
        var h0 = petHead(sv(a, PETF.special)), h1 = petHead(sv(b, PETF.special));
        if(h0.name !== h1.name) L(h1.name ? (h0.name ? "Pet renamed " + h0.name + " to " + h1.name : "Pet named " + h1.name) : "Pet name cleared");
        if(h0.att !== h1.att) L("Pet attitude " + (h0.att || "not set") + " to " + (h1.att || "not set"));
        if(h0.role !== h1.role) L("Pet role " + (h0.role || "not chosen") + " to " + (h1.role || "not chosen"));
        if(h0.rest !== h1.rest) L("Pet special abilities changed");
      }
      if(any(PETF.vals.concat(PETF.boxes))){ var p0 = bar(a, PETF), p1 = bar(b, PETF); L("Pet Health Bar " + p0.left + " of " + p0.n + " to " + p1.left + " of " + p1.n + " slots"); }
    }
    var hadM = filled(a, MNTF, MNTKEYS), hasM = filled(b, MNTF, MNTKEYS);
    if(!hadM && hasM) L("Mount added: Size " + (sv(b, MNTF.size) || "?"));
    else if(hadM && !hasM) L("Mount box cleared");
    else {
      MNTKEYS.forEach(function(k5){ if(ch[MNTF[k5]]) L("Mount " + ({size: "Size", move: "Move", occ: "Occupants", dr: "DR", acc: "accessories"})[k5] + " changed"); });
      if(any(MNTF.vals.concat(MNTF.boxes))){ var m0 = bar(a, MNTF), m1 = bar(b, MNTF); L("Mount Health Bar " + m0.left + " of " + m0.n + " to " + m1.left + " of " + m1.n + " slots"); }
    }
    TXT.forEach(function(t){ if(any(t[2])) L(t[1] + (t[0] === "pop" ? " " + (sv(a, t[2][0]) || "0") + " to " + (sv(b, t[2][0]) || "0") : " changed")); });
  }
