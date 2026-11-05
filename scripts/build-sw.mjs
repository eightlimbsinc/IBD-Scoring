// Writes out/sw.js with the list of every built file to precache. Runs after `next build`.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(OUT);

const hash = createHash("sha256");
const urls = [];
for (const f of files.sort()) {
  const rel = "/" + relative(OUT, f).split(sep).join("/");
  if (rel === "/sw.js" || rel.endsWith(".map") || rel === "/404.html" || rel.startsWith("/_not-found")) continue;
  hash.update(rel).update(readFileSync(f));
  // pages are requested as "/path/", not "/path/index.html"
  urls.push(rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel);
}

const version = "ibd-shell-" + hash.digest("hex").slice(0, 12);
const sw = readFileSync("scripts/sw-template.js", "utf8")
  .replace("__VERSION__", version)
  .replace("__PRECACHE__", JSON.stringify(urls, null, 0));
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`sw.js: ${version}, ${urls.length} files precached`);
