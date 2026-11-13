// Test of Check for updates in the built page. Needs Playwright (see README); no sheet needed.
// Usage: node tests/update-test.js
// GitHub is never contacted: every request to api.github.com is answered here with a made-up release.
// The file picker is replaced by a stand-in file, so Update this file never touches the disk.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

let fails = 0;
function check(label, ok, got){ if(!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + label + (ok ? "" : " (got " + JSON.stringify(got) + ")")); }

const REPO = "rtwarren/DCCTTRPG_Crawler_Companion";
const json = body => route => route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
const text = body => route => route.fulfill({ status: 200, contentType: "application/vnd.github.raw", headers: { "Access-Control-Allow-Origin": "*" }, body });
const status = n => route => route.fulfill({ status: n, headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" });

(async () => {
  const dist = path.resolve(__dirname, "..", "dist");
  const built = fs.readdirSync(dist).find(f => /^Crawler_Companion_v[\d.]+\.html$/.test(f));
  if (!built) { console.error("No built page in dist/. Run python build.py first."); process.exit(1); }
  const version = /_v([\d.]+)\.html$/.exec(built)[1];
  const own = fs.readFileSync(path.join(dist, built), "utf8");
  const asVersion = v => own.replace('id="upd" data-version="' + version + '"', 'id="upd" data-version="' + v + '"');
  const url = "https://github.com/" + REPO + "/releases/download/v9.9.9/Crawler_Companion_v9.9.9.html";
  const newer = { tag_name: "v9.9.9", body: "- **Shiny thing.** It works.\n- Second change.\n\nNot a bullet.", assets: [{ name: "Crawler_Companion_v9.9.9.html", browser_download_url: url }] };
  const browser = await chromium.launch();

  // one page with GitHub answered by `answer` (releases) and `pageAnswer` (the new page at its tag)
  async function open(initScript){
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const s = { p, errors: [], calls: [], downloads: 0, answer: null, pageAnswer: null };
    p.on("pageerror", e => s.errors.push(e.message));
    p.on("download", () => s.downloads++);
    if (initScript) await initScript(p);
    await p.route("https://api.github.com/**", route => {
      const u = route.request().url(); s.calls.push(u);
      return (u.includes("/contents/") ? s.pageAnswer : s.answer)(route);
    });
    await p.goto("file://" + path.join(dist, built));
    s.press = async () => {
      await p.click("#upd-check");
      await p.waitForFunction(() => !document.getElementById("upd-check").disabled);
      return (await p.textContent("#upd-out")).trim();
    };
    return s;
  }

  /* ---- Chrome or Edge with the page opened as a file: Update this file ---- */
  const writes = [];
  const a = await open(async p => {
    await p.exposeFunction("__wrote", (name, body) => { writes.push({ name, body }); });
    // a stand-in for the file picker; window.__pick says which file the user picks and what they answer
    await p.addInitScript(() => {
      window.__pickCalls = 0;
      window.showOpenFilePicker = async () => {
        window.__pickCalls++;
        const k = window.__pick || {};
        if (k.cancel) throw new DOMException("The user aborted a request.", "AbortError");
        return [{
          kind: "file", name: k.name,
          queryPermission: async () => k.perm || "granted",
          requestPermission: async () => k.perm || "granted",
          getFile: async () => new File([k.content], k.name, { type: "text/html" }),
          createWritable: async () => {
            let buf = "";
            return { write: async d => { buf += typeof d === "string" ? d : await new Blob([d]).text(); }, close: async () => { k.content = buf; await window.__wrote(k.name, buf); } };
          }
        }];
      };
    });
  });
  const p = a.p;
  const pick = k => p.evaluate(k => { window.__pick = k; }, k);

  check("the footer shows this version", (await p.textContent("#upd p")).includes("Crawler Companion " + version), await p.textContent("#upd p"));
  check("nothing is sent to GitHub until the button is pressed", a.calls.length === 0, a.calls);

  a.answer = json(newer);
  a.pageAnswer = text(asVersion("9.9.9"));
  let t = await a.press();
  check("a newer release is announced", /Version 9\.9\.9 is out\. You have /.test(t), t);
  check("it asks the right address", a.calls[0] === "https://api.github.com/repos/" + REPO + "/releases/latest", a.calls[0]);
  check("it reads the new page from the release's tag", a.calls[1] === "https://api.github.com/repos/" + REPO + "/contents/dist/Crawler_Companion_v9.9.9.html?ref=v9.9.9", a.calls[1]);
  check("its notes are listed as plain text", (await p.$$eval("#upd-out li", l => l.map(x => x.textContent))).join("|") === "Shiny thing. It works.|Second change.", await p.$$eval("#upd-out li", l => l.map(x => x.textContent)));
  check("it offers Update this file, not a download", !!(await p.$("#upd-self")) && !(await p.$("#upd-out a.btn")), t);
  check("it names the file it will write", t.includes("over " + built), t);
  check("no file is asked for until Update this file is pressed", (await p.evaluate(() => window.__pickCalls)) === 0, "");

  async function update(){
    await p.click("#upd-self");
    await p.waitForFunction(() => !document.getElementById("upd-self").disabled);
    return (await p.textContent("#upd-out p.sub")).trim();
  }
  await pick({ name: "Some_Other_File.html", content: own });
  t = await update();
  check("a file with another name is refused", t.includes("That’s Some_Other_File.html. Pick " + built) && !writes.length, t);

  await pick({ name: built, content: asVersion("1.0.0") });
  t = await update();
  check("a file that isn't this version is refused", t.includes("isn’t the one you have open") && !writes.length, t);

  await pick({ name: built, cancel: true });
  t = await update();
  check("a cancelled pick changes nothing", t.startsWith("Nothing changed.") && !writes.length, t);

  await pick({ name: built, content: own, perm: "denied" });
  t = await update();
  check("a refused permission changes nothing", t.includes("didn’t allow changes") && !writes.length, t);

  await pick({ name: built, content: own });
  await Promise.all([p.waitForEvent("load"), p.click("#upd-self")]);
  check("it writes the new page over the open file", writes.length === 1 && writes[0].name === built && writes[0].body === asVersion("9.9.9"), writes.map(w => [w.name, w.body.length]));
  check("then it reloads the page", (await p.textContent("#upd p")).includes("Crawler Companion"), "");

  // a new page that doesn't carry the announced version is never offered
  a.pageAnswer = text(asVersion("9.9.8"));
  t = await a.press();
  check("a new page of the wrong version isn't offered", !(await p.$("#upd-self")) && (await p.getAttribute("#upd-out a.btn", "href")) === url && /couldn.t be fetched/.test(t), t);
  a.pageAnswer = text("<!doctype html><p>not the page</p>");
  t = await a.press();
  check("something that isn't the page isn't offered", !(await p.$("#upd-self")) && !!(await p.$("#upd-out a.btn")), t);
  a.pageAnswer = status(404);
  t = await a.press();
  check("a page missing from the tag falls back to the download", !(await p.$("#upd-self")) && !!(await p.$("#upd-out a.btn")), t);
  a.answer = json({ tag_name: "v9.9.9; rm", body: "", assets: [] });
  const before = a.calls.length;
  await a.press();
  check("an odd tag isn't used to read a page", !a.calls.slice(before).some(u => u.includes("/contents/")), a.calls.slice(before));

  check("no page errors", !a.errors.length, a.errors);
  check("nothing was downloaded", !a.downloads, a.downloads);

  /* ---- a browser that can't write files (Firefox, Safari): the download link ---- */
  const b = await open(p => p.addInitScript(() => { window.showOpenFilePicker = undefined; }));
  const q = b.p;
  b.answer = json(newer);
  t = await b.press();
  check("without file writing, a newer release is announced", /Version 9\.9\.9 is out\. You have /.test(t), t);
  check("without file writing, the new page isn't fetched", b.calls.length === 1, b.calls);
  check("the download is a plain link to the file on GitHub", (await q.getAttribute("#upd-out a.btn", "href")) === url && (await q.textContent("#upd-out a.btn")) === "Download 9.9.9" && !(await q.$("#upd-self")), await q.getAttribute("#upd-out a.btn", "href"));

  // the same version
  b.answer = json({ tag_name: "v" + version, body: "", assets: [] });
  t = await b.press();
  check("the same version says you're up to date", t === "You have the newest version (" + version + ").", t);

  // an older release (a dev build ahead of GitHub)
  b.answer = json({ tag_name: "v0.0.1", body: "", assets: [] });
  t = await b.press();
  check("an older release isn't offered", /newest version/.test(t), t);

  // a release without the file
  b.answer = json({ tag_name: "v9.9.9", body: "", assets: [{ name: "notes.txt", browser_download_url: "https://github.com/x/notes.txt" }] });
  t = await b.press();
  check("a release without the file points to the releases page", /isn.t attached yet/.test(t) && (await q.getAttribute("#upd-out a", "href")) === "https://github.com/" + REPO + "/releases", t);

  // a file somewhere other than github.com is never linked
  b.answer = json({ tag_name: "v9.9.9", body: "", assets: [{ name: "Crawler_Companion_v9.9.9.html", browser_download_url: "https://example.com/Crawler_Companion_v9.9.9.html" }] });
  t = await b.press();
  check("a download outside github.com isn't linked", !(await q.$("#upd-out a.btn")), t);

  // no releases, rate limits and no network
  b.answer = status(404);
  check("no releases yet is said plainly", (await b.press()) === "There are no releases on GitHub yet.", "");
  b.answer = status(403);
  check("a rate limit says to wait", /limiting checks/.test(await b.press()), "");
  b.answer = route => route.abort("internetdisconnected");
  t = await b.press();
  check("no network says so and links the releases page", /Couldn.t reach GitHub/.test(t) && !!(await q.$("#upd-out a")), t);

  check("no page errors without file writing", !b.errors.length, b.errors);
  check("nothing was downloaded without file writing", !b.downloads, b.downloads);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed.");
  process.exit(fails ? 1 : 0);
})();
