#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const [sourcePath, targetPath, toleranceArg = "2"] = process.argv.slice(2);

if (!sourcePath || !targetPath) {
  console.error("Usage: compare-layouts.mjs <source.json> <target.json> [tolerancePx]");
  process.exit(2);
}

const tolerance = Number(toleranceArg);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const source = await readJson(sourcePath);
const target = await readJson(targetPath);

const getItems = (data) => data.sections || data.nodes || data.frames || [];
const keyOf = (item, index) => item.name || item.heading || item.className || item.id || `item-${index}`;
const rectOf = (item) => item.rect || item.frame || item;
const sourceItems = getItems(source);
const targetItems = getItems(target);
const targetByKey = new Map(targetItems.map((item, index) => [keyOf(item, index), item]));
const diffs = [];

sourceItems.forEach((item, index) => {
  const key = keyOf(item, index);
  const match = targetByKey.get(key);
  if (!match) {
    diffs.push({ key, issue: "missing-in-target" });
    return;
  }
  const a = rectOf(item);
  const b = rectOf(match);
  ["x", "y", "width", "height"].forEach((field) => {
    if (typeof a[field] !== "number" || typeof b[field] !== "number") return;
    const delta = Math.round((b[field] - a[field]) * 100) / 100;
    if (Math.abs(delta) > tolerance) {
      diffs.push({ key, field, source: a[field], target: b[field], delta });
    }
  });
});

console.log(JSON.stringify({
  source: sourcePath,
  target: targetPath,
  tolerance,
  sourceCount: sourceItems.length,
  targetCount: targetItems.length,
  diffCount: diffs.length,
  diffs
}, null, 2));

process.exit(diffs.length ? 1 : 0);
