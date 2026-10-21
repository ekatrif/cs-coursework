const { mkdirSync, readFileSync, readdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const sourceDir = path.join(__dirname, "..", "examples");
const outputDir = path.join(__dirname, "..", "dist", "examples");

mkdirSync(outputDir, { recursive: true });

for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

  const source = readFileSync(path.join(sourceDir, entry.name), "utf8");

  const output = source.replaceAll('require("../dist/src")', 'require("../src")');

  writeFileSync(path.join(outputDir, entry.name), output);
}
