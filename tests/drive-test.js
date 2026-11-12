// End-to-end test of Open from Google Drive in the built page. Needs Playwright (see README).
// Usage: node tests/drive-test.js "path/to/a COPY of the fillable character sheet"
// Google's sign-in, its file picker and the Drive API are all faked here, so nothing reaches Google.
// The page is served from a made-up https address with test IDs filled into GDRIVE.
// The PDF you point at is never written.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const engine = fs.readFileSync(path.join(__dirname, "..", "src", "pdf-engine.js"), "utf8");
const PDF = new Function(engine + "\nreturn PDF;")();

let fails = 0;
function check(label, ok, got){ if(!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + label + (ok ? "" : " (got " + JSON.stringify(got) + ")")); }

const ORIGIN = "https://companion.test/";
const BLANK = 'var GDRIVE = {clientId: "", apiKey: "", appId: ""};';
const TESTCFG = 'var GDRIVE = {clientId: "test-client.apps.googleusercontent.com", apiKey: "test-key", appId: "123456"};';

// stand-ins for Google's scripts
const GSI = `window.google = window.google || {};
google.accounts = {oauth2: {initTokenClient: function(cfg){ window.__gsi = cfg; return {requestAccessToken: function(o){
  window.__tokens = (window.__tokens || 0) + 1; var n = window.__tokens;
  setTimeout(function(){ if(window.__denyToken) cfg.error_callback({type: "popup_closed"}); else cfg.callback({access_token: "tok" + n, expires_in: 3600}); }, 10);
}}; }}};`;
const API = `window.gapi = {load: function(name, o){ window.__gapiLoaded = name; setTimeout(o.callback, 0); }};
window.google = window.google || {};
(function(){
  function chain(){ var o = {}; ["setMimeTypes","setMode","addView","setOAuthToken","setDeveloperKey","setAppId","setTitle"].forEach(function(m){ o[m] = function(){ o["_" + m] = Array.prototype.slice.call(arguments); return o; }; }); return o; }
  google.picker = {ViewId: {DOCS: "docs"}, DocsViewMode: {LIST: "list"}, Action: {PICKED: "picked", CANCEL: "cancel"},
    DocsView: function(){ return chain(); }, DocsUploadView: function(){ var u = chain(); u._upload = true; return u; },
    PickerBuilder: function(){ var b = chain(), views = []; b.addView = function(v){ views.push(v); return b; }; b.setCallback = function(cb){ b._cb = cb; return b; };
      b.build = function(){ window.__picker = {token: b._setOAuthToken[0], key: b._setDeveloperKey[0], app: b._setAppId[0], views: views.length, upload: views.some(function(v){ return v._upload; })};
        return {setVisible: function(){ window.__pickerShown = (window.__pickerShown || 0) + 1; setTimeout(function(){ b._cb(window.__pickResult || {action: "picked", docs: [{id: "file1", name: "Sheet.pdf"}]}); }, 10); }}; };
      return b; }};
})();`;

(async () => {
  const sheet = process.argv[2];
  if (!sheet) { console.error("Give the path to a copy of the fillable sheet."); process.exit(1); }
  const dist = path.resolve(__dirname, "..", "dist");
  const built = fs.readdirSync(dist).find(f => /^Crawler_Companion_v[\d.]+\.html$/.test(f));
  if (!built) { console.error("No built page in dist/. Run python build.py first."); process.exit(1); }
  const html = fs.readFileSync(path.join(dist, built), "utf8");
  if (!html.includes(BLANK)) { console.error("The built page's GDRIVE line isn't the blank one this test expects."); process.exit(1); }
  let serve = html.replace(BLANK, TESTCFG);

  // the fake Drive: one file, its bytes and version number
  const drive = { bytes: fs.readFileSync(sheet), version: 1, revoked: new Set(), auth: [], uploads: 0 };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const errors = [], googleCalls = [];
  let downloads = 0;
  await ctx.route(ORIGIN + "**", r => r.fulfill({ status: 200, contentType: "text/html", body: serve }));
  await ctx.route("https://accounts.google.com/**", r => { googleCalls.push(r.request().url()); r.fulfill({ status: 200, contentType: "text/javascript", body: GSI }); });
  await ctx.route("https://apis.google.com/**", r => { googleCalls.push(r.request().url()); r.fulfill({ status: 200, contentType: "text/javascript", body: API }); });
  await ctx.route("https://www.googleapis.com/**", async r => {
    const req = r.request(), u = new URL(req.url()), tok = (req.headers()["authorization"] || "").replace(/^Bearer /, "");
    drive.auth.push(tok);
    if (!/^tok\d+$/.test(tok) || drive.revoked.has(tok)) return r.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { message: "Invalid Credentials" } }) });
    const id = decodeURIComponent(u.pathname.split("/").pop());
    if (id !== "file1") return r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { message: "File not found" } }) });
    if (req.method() === "PATCH" && u.pathname.startsWith("/upload/drive/v3/files/")) {
      drive.bytes = req.postDataBuffer(); drive.version++; drive.uploads++;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id, version: String(drive.version) }) });
    }
    if (u.searchParams.get("alt") === "media") return r.fulfill({ status: 200, contentType: "application/pdf", body: drive.bytes });
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id, name: "Sheet.pdf", version: String(drive.version), capabilities: { canEdit: true } }) });
  });
  const p = await ctx.newPage();
  p.on("pageerror", e => errors.push(e.message));
  p.on("download", () => downloads++);
  p.on("dialog", d => d.accept());
  const val = id => p.inputValue(id);
  async function driveField(name){ const d = await PDF.open(new Uint8Array(drive.bytes)); return d.fieldMap[name] ? d.fieldMap[name].value : "(missing)"; }
  async function outsideSave(writes){ const d = await PDF.open(new Uint8Array(drive.bytes)); drive.bytes = Buffer.from(d.save(writes)); drive.version++; }

  // with GDRIVE blank, there's no Drive button and nothing loads from Google
  serve = html;
  await p.goto(ORIGIN);
  check("no Drive button when GDRIVE is blank", !(await p.isVisible("#sb-drive")), "");
  serve = html.replace(BLANK, TESTCFG);
  await p.evaluate(() => { try{ localStorage.setItem("dcc-cheat-autosave", "0"); }catch(e){} });
  await p.goto(ORIGIN);
  check("the Drive button shows when GDRIVE is filled in", await p.isVisible("#sb-drive"), "");
  check("nothing loads from Google before the button is pressed", googleCalls.length === 0, googleCalls);

  // open: sign in, pick, load
  await p.click("#sb-drive");
  await p.waitForFunction(() => /Google Drive/.test(document.getElementById("sb-file-name").textContent));
  check("the sheet opened from Drive", (await p.textContent("#sb-file-name")) === "Sheet.pdf (Google Drive)", await p.textContent("#sb-file-name"));
  const pk = await p.evaluate(() => window.__picker);
  check("the picker gets the token, API key and App ID, and offers an Upload tab", pk.token === "tok1" && pk.key === "test-key" && pk.app === "123456" && pk.upload, pk);
  check("sign-in asks for drive.file only", (await p.evaluate(() => window.__gsi.scope)) === "https://www.googleapis.com/auth/drive.file", await p.evaluate(() => window.__gsi.scope));
  check("Drive requests carry the token", drive.auth.length >= 2 && drive.auth.every(t => t === "tok1"), drive.auth);
  check("the Drive sheet is remembered", (await p.evaluate(() => localStorage.getItem("dcc-cheat-drive"))) === JSON.stringify({ id: "file1", name: "Sheet.pdf" }), await p.evaluate(() => localStorage.getItem("dcc-cheat-drive")));
  check("Save is ready and autosave is offered", (await p.textContent("#sb-save")) === "Save to sheet" && await p.isVisible("#sb-auto-l"), await p.textContent("#sb-save"));

  // save a change back to Drive
  await p.fill("#cr-fav", "3");
  await p.click("#sb-save");
  await p.waitForFunction(() => /Saved to Sheet\.pdf in Google Drive/.test(document.getElementById("sb-status").textContent));
  check("the save went up to Drive", drive.uploads === 1 && await driveField("Text Field 32") === "3", [drive.uploads, await driveField("Text Field 32")]);
  check("no unsaved changes after saving", (await p.textContent("#sb-count")) === "No unsaved changes", await p.textContent("#sb-count"));

  // someone saves from another device: the page loads it
  await outsideSave({ "Text Field 32": "9" });
  await p.evaluate(() => window.__cheat.watchDrive());
  await p.waitForFunction(() => document.getElementById("cr-fav").value === "9");
  check("a save from another device loads in", /changed in Google Drive\. Loaded/.test(await p.textContent("#sb-status")), await p.textContent("#sb-status"));

  // ...or, with changes waiting here, both are kept
  await p.fill("#cr-fav", "4");
  await outsideSave({ "level": "7" });
  await p.evaluate(() => window.__cheat.watchDrive());
  check("with unsaved changes, the page says both will be kept", /yours are added on top/.test(await p.textContent("#sb-status")), await p.textContent("#sb-status"));
  // the sign-in ran out in Google's eyes: the Save click signs in again and finishes
  drive.revoked.add("tok1");
  await p.click("#sb-save");
  await p.waitForFunction(() => /Saved to/.test(document.getElementById("sb-status").textContent));
  check("a run-out sign-in is renewed on Save", (await p.evaluate(() => window.__tokens)) === 2 && drive.auth[drive.auth.length - 1] === "tok2", [await p.evaluate(() => window.__tokens), drive.auth.slice(-3)]);
  check("the other device's change and this one are both saved", await driveField("level") === "7" && await driveField("Text Field 32") === "4", [await driveField("level"), await driveField("Text Field 32")]);

  // autosave doesn't open Google's window by itself
  await p.check("#sb-auto");
  await p.evaluate(() => { window.__cheat.GD.expires = 0; });
  const before = drive.uploads;
  await p.fill("#cr-fav", "5");
  await p.waitForTimeout(1600);
  check("autosave with a run-out sign-in waits for a click", drive.uploads === before && (await p.evaluate(() => window.__tokens)) === 2 && /Press Save to sheet to sign in again/.test(await p.textContent("#sb-status")), [drive.uploads, await p.textContent("#sb-status")]);
  await p.uncheck("#sb-auto");

  // next visit: reconnect without the picker
  await p.goto(ORIGIN);
  check("next visit offers to reconnect to the Drive sheet", await p.isVisible("#sb-drelink") && (await p.textContent("#sb-drelink")) === "Reconnect to Sheet.pdf in Google Drive", await p.textContent("#sb-drelink"));
  await p.click("#sb-drelink");
  await p.waitForFunction(() => /Google Drive/.test(document.getElementById("sb-file-name").textContent));
  check("reconnecting opens the sheet without the picker", (await p.evaluate(() => window.__pickerShown || 0)) === 0 && (await val("#cr-fav")) === "4", [await p.evaluate(() => window.__pickerShown), await val("#cr-fav")]);
  await p.click("#sb-reload");
  await p.waitForFunction(() => /Reloaded from Google Drive/.test(document.getElementById("sb-status").textContent));
  check("Reload reads it from Drive again", true, "");

  // a file this page lost access to
  await p.click("#sb-unlink");
  check("Unlink forgets the Drive sheet", (await p.evaluate(() => localStorage.getItem("dcc-cheat-drive"))) === null && !(await p.isVisible("#sb-drelink")), "");
  await p.evaluate(() => { window.__pickResult = {action: "picked", docs: [{id: "gone", name: "Old.pdf"}]}; });
  await p.click("#sb-drive");
  await p.waitForFunction(() => document.getElementById("sb-msg").textContent !== "");
  check("a file Drive can't find says so", /can.t find the sheet/.test(await p.textContent("#sb-msg")), await p.textContent("#sb-msg"));
  // cancelling the picker changes nothing
  await p.evaluate(() => { window.__pickResult = {action: "cancel"}; document.getElementById("sb-msg").textContent = ""; });
  await p.click("#sb-drive");
  await p.waitForTimeout(300);
  check("cancelling the picker leaves nothing linked", !(await p.isVisible("#sb-on")) && (await p.textContent("#sb-msg")) === "", "");

  // from a file on the computer, Drive points to the online copy and loads nothing from Google
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  const local = path.join(__dirname, "out", "drive-local.html");
  fs.writeFileSync(local, html.replace(BLANK, TESTCFG));
  const calls0 = googleCalls.length;
  const q = await ctx.newPage();
  q.on("pageerror", e => errors.push(e.message));
  await q.goto("file://" + local);
  await q.click("#sb-drive");
  check("from a local file, the Drive button points to the online copy", /online copy at https:\/\/rtwarren\.github\.io\/DCCTTRPG_Crawler_Companion\//.test(await q.textContent("#sb-msg")) && googleCalls.length === calls0, await q.textContent("#sb-msg"));

  check("no page errors", !errors.length, errors);
  check("no downloads", !downloads, downloads);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed.");
  process.exit(fails ? 1 : 0);
})();
