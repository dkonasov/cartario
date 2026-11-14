import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const baseDir = resolve(import.meta.dirname, "..", "dist");
await mkdir(resolve(baseDir, "__"));
await mkdir(resolve(baseDir, "__", "auth"));
await mkdir(resolve(baseDir, "__", "firebase"));

const fileList = [
  "__/auth/handler.html",
  "__/auth/handler.js",
  "__/auth/experiments.js",
  "__/auth/iframe.html",
  "__/auth/iframe.js",
  "__/auth/links.html",
  "__/auth/links.js",
  "__/firebase/init.json",
];

for (const file of fileList) {
  const res = await fetch(`https://cartario-d8414.firebaseapp.com/${file.replace(".html", "")}`);
  const content = await res.text();

  await writeFile(resolve(baseDir, file), content);
}
