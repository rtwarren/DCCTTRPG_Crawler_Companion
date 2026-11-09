// Test of Check for updates in the built page. Needs Playwright (see README); no sheet needed.
// Usage: node tests/update-test.js
// GitHub is never contacted: every request to api.github.com is answered here with a made-up release.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

let fails = 0;
function check(label, ok, got){ if(!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + label + (ok ? "" : " (got " + JSON.stringify(got) + ")")); }

(async () => {
  const dist = path.resolve(__dirname, "..", "dist");
  const built = fs.readdirSync(dist).find(f => /^Crawler_Companion_v[\d.]+\.html$/.test(f));
  if (!built) { console.error("No built page in dist/. Run python build.py first."); process.exit(1); }
  const version = /_v([\d.]+)\.html$/.exec(built)[1];
  const browser = await chromium.launch();
  const p = await (await browser.newContext()).newPage();
  const errors = [], calls = [];
  let downloads = 0, answer = null;
  p.on("pageerror", e => errors.push(e.message));
  p.on("download", () => downloads++);
  await p.route("https://api.github.com/**", route => { calls.push(route.request().url()); return answer(route); });
  await p.goto("file://" + path.join(dist, built));

  check("the footer shows this version", (await p.textContent("#upd p")).includes("Crawler Companion " + version), await p.textContent("#upd p"));
  check("nothing is sent to GitHub until the button is pressed", calls.length === 0, calls);

  const json = body => route => route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) });
  async function press(){
    await p.click("#upd-check");
    await p.waitForFunction(() => !document.getElementById("upd-check").disabled);
    return (await p.textContent("#upd-out")).trim();
  }

  // a newer release with the page attached
  const url = "https://github.com/rtwarren/DCCTTRPG_Crawler_Companion/releases/download/v9.9.9/Crawler_Companion_v9.9.9.html";
  answer = json({ tag_name: "v9.9.9", body: "- **Shiny thing.** It works.\n- Second change.\n\nNot a bullet.", assets: [{ name: "Crawler_Companion_v9.9.9.html", browser_download_url: url }] });
  let t = await press();
  check("a newer release is announced", /Version 9\.9\.9 is out\. You have /.test(t), t);
  check("it asks the right address", calls.at(-1) === "https://api.github.com/repos/rtwarren/DCCTTRPG_Crawler_Companion/releases/latest", calls.at(-1));
  check("its notes are listed as plain text", (await p.$$eval("#upd-out li", l => l.map(x => x.textContent))).join("|") === "Shiny thing. It works.|Second change.", await p.$$eval("#upd-out li", l => l.map(x => x.textContent)));
  check("the download is a plain link to the file on GitHub", (await p.getAttribute("#upd-out a.btn", "href")) === url && (await p.textContent("#upd-out a.btn")) === "Download 9.9.9", await p.getAttribute("#upd-out a.btn", "href"));

  // the same version
  answer = json({ tag_name: "v" + version, body: "", assets: [] });
  t = await press();
  check("the same version says you're up to date", t === "You have the newest version (" + version + ").", t);

  // an older release (a dev build ahead of GitHub)
  answer = json({ tag_name: "v0.0.1", body: "", assets: [] });
  t = await press();
  check("an older release isn't offered", /newest version/.test(t), t);

  // a release without the file
  answer = json({ tag_name: "v9.9.9", body: "", assets: [{ name: "notes.txt", browser_download_url: "https://github.com/x/notes.txt" }] });
  t = await press();
  check("a release without the file points to the releases page", /isn.t attached yet/.test(t) && (await p.getAttribute("#upd-out a", "href")) === "https://github.com/rtwarren/DCCTTRPG_Crawler_Companion/releases", t);

  // a file somewhere other than github.com is never linked
  answer = json({ tag_name: "v9.9.9", body: "", assets: [{ name: "Crawler_Companion_v9.9.9.html", browser_download_url: "https://example.com/Crawler_Companion_v9.9.9.html" }] });
  t = await press();
  check("a download outside github.com isn't linked", !(await p.$("#upd-out a.btn")), t);

  // no releases, rate limits and no network
  answer = route => route.fulfill({ status: 404, headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" });
  check("no releases yet is said plainly", (await press()) === "There are no releases on GitHub yet.", "");
  answer = route => route.fulfill({ status: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" });
  check("a rate limit says to wait", /limiting checks/.test(await press()), "");
  answer = route => route.abort("internetdisconnected");
  t = await press();
  check("no network says so and links the releases page", /Couldn.t reach GitHub/.test(t) && !!(await p.$("#upd-out a")), t);

  check("no page errors", !errors.length, errors);
  check("nothing was downloaded", !downloads, downloads);
  await browser.close();
  console.log(fails ? fails + " failed." : "All passed.");
  process.exit(fails ? 1 : 0);
})();
