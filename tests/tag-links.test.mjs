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
const {extractTags, parseFile, renderMemo, stripMemoTags} = module.exports;
const url = "https://mp.weixin.qq.com/s/example999#rd";
const cases = [
  ["WeChat plain link", url, []],
  ["reported full-width label", `\u3010\u7f57\u975e\u9c7c\u3011(${url})`, []],
  ["Markdown link", `[fish](${url})`, []],
  ["autolink", `<${url}>`, []],
  ["image destination", `![fish](${url})`, []],
  ["relative fragment link", "[section](#section)", []],
  ["relative file link", "[section](notes.md#section)", []],
  ["link title and parentheses", '[fish](https://example.com/a(b)#rd "#title") #real', ["real"]],
  ["Wiki heading", "[[Note#heading|label]] ![[Note#heading]] #real", ["real"]],
  ["reference destination", "[fish][link]\n[link]: https://example.com/#rd \"#title\"\n#real", ["real"]],
  ["query fragment", "https://example.com/?next=#rd #real", ["real"]],
  ["uppercase and schemeless URLs", "HTTPS://example.com/#rd www.example.com/#rd #real", ["real"]],
  ["link label preserved", "[#label](#section) #real", ["label", "real"]],
  ["same name outside the URL", `${url} #rd #rd`, ["rd"]],
  ["Chinese and nested tags", `${url} #\u597d\u7269/\u5206\u4eab #work/sub #foo_bar`, ["\u597d\u7269/\u5206\u4eab", "work/sub", "foo_bar"]],
  ["ordinary memo unchanged", "#first\nText #second #first", ["first", "second"]],
];

for (const [name, content, tags] of cases) {
  test(`tag extraction: ${name}`, () => {
    assert.deepEqual([...extractTags(content)], tags);
    const raw = "## 2026-10-21 Wednesday\n" + renderMemo("10:00", content);
    const [memo] = parseFile("Memoria/2026.md", raw);
    assert.deepEqual([...memo.tags], tags);
    assert.equal(memo.content, content);
  });
}

test("card tag stripping preserves URL fragments even beside an identical real tag", () => {
  const link = `[fish](${url})`;
  const result = stripMemoTags(`${link} #rd #work/sub`);
  assert.equal(result.text, link);
  assert.deepEqual([...result.tags], ["rd", "work/sub"]);
  assert.equal(stripMemoTags(url).text, url);
});

test("reserved-tag removal never modifies a link destination", () => {
  const tag = "\u7f6e\u9876";
  const link = `[fish](https://example.com/#${tag})`;
  const result = stripMemoTags(`${link} #${tag} #ordinary`, new Set([tag]));
  assert.equal(result.text, link + " #ordinary");
});
