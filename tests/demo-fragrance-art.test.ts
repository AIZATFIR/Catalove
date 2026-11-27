import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const preset = readFileSync(join(root, "src/lib/data/universal-presets.ts"), "utf8");
const migration = readFileSync(join(root, "supabase/migrations/202611270001_unbranded_demo_fragrance.sql"), "utf8");
const imagePaths = [
  "/demo-assets/fragrance-sample.svg",
  "/demo-assets/fragrance-detail.svg",
];

for (const imagePath of imagePaths) {
  const assetPath = join(root, "public", imagePath.slice(1));
  assert.equal(existsSync(assetPath), true, `${imagePath} must be included in the app build`);
  assert.match(preset, new RegExp(imagePath.replaceAll("/", "\\/")));
  assert.match(migration, new RegExp(imagePath.replaceAll("/", "\\/")));
  assert.doesNotMatch(readFileSync(assetPath, "utf8"), /chanel|coco noir|dior/i);
}

assert.match(migration, /store\.slug = 'catalove'/);
assert.match(migration, /product\.slug = 'sample-03-fragrance'/);
assert.match(migration, /images\.unsplash\.com\/photo-1594035910387-fea47794261f/);
assert.match(migration, /images\.unsplash\.com\/photo-1523293182086-7651a899d37f/);

console.log("✅ Showcase fragrance uses original unbranded art in code and its data migration");
