import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/parser.ts"], bundle: true, write: false,
  platform: "node", format: "cjs",
});
const module = {exports: {}};
vm.runInNewContext(bundle.outputFiles[0].text, {module, exports: module.exports});
const {parseFile, renderMemo} = module.exports;
const quote = "> [!quote] 2026-10-21 09:00\n> Original text";
const cases = [
  ["ordinary quote", quote + "\n\nFollow-up text"],
  ["multiple blank lines", quote + "\n\n\n\nFollow-up text"],
  ["long quote", quote + "\n" + Array(24).fill("> Original line").join("\n") + "\n\nFollow-up text"],
  ["list and code", quote + "\n\n- Follow-up item\n- [ ] Task\n\n```text\nCode\n```\n\nFollow-up text"],
  ["nested quote", "> [!quote] Second quote\n> > Earlier text\n> More context\n\nFollow-up text"],
];

for (const [name, content] of cases) {
  test(`quote follow-up survives serialization: ${name}`, () => {
    const raw = "## 2026-10-21 Wednesday\n\n" + renderMemo("10:00", content) +
      "\n\n" + renderMemo("11:00", "Separate note");
    const parsed = parseFile("Memoria/2026.md", raw);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].content, content);
    assert.equal(parsed[1].content, "Separate note");
  });
}

test("legacy inline timestamp retains quote follow-up after consecutive blank lines", () => {
  const content = quote + "\n\n\n\nFollow-up text";
  const [first, ...rest] = content.split("\n");
  const raw = "## 2026-10-21 Wednesday\n- 10:00 " + first + "\n" +
    rest.map(line => line ? "  " + line : "").join("\n");
  assert.equal(parseFile("Memoria/2026.md", raw)[0].content, content);
});
