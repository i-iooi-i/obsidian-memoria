import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/view.ts"], bundle: true, write: false,
  platform: "node", format: "cjs", external: ["obsidian"],
});

function cardFixture(mobile) {
  const module = {exports: {}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports,
    require: () => ({ItemView: class {}, Platform: {isMobile: mobile}}),
  });
  const listeners = new Map();
  let edits = 0;
  const memo = {};
  const stop = new Error("The rest of the card rendering is outside this gesture test");
  const card = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    createDiv() { throw stop; },
  };
  const view = {
    settings: {enableMoodColoring: false},
    enterEditMode(value) { assert.equal(value, memo); edits++; },
  };
  assert.throws(() => module.exports.MemoriaView.prototype.renderMemoCard.call(
    view, {createDiv: () => card}, memo
  ), error => error === stop);
  return {listeners, get edits() {return edits;}};
}

test("desktop double-click still edits ordinary card text", () => {
  const f = cardFixture(false);
  f.listeners.get("dblclick")({target: {closest: () => null}});
  assert.equal(f.edits, 1);
  assert.equal(f.listeners.has("pointerdown"), false);
  assert.equal(f.listeners.has("mousedown"), false);
});

test("interactive card descendants do not trigger double-click editing", () => {
  for (const selector of ["a", "button", "input", "textarea", "select", "img", ".memoria-img-cell", ".memoria-tag-pill"]) {
    const f = cardFixture(false);
    f.listeners.get("dblclick")({target: {closest: selectors => {
      assert.ok(selectors.split(", ").includes(selector));
      return {};
    }}});
    assert.equal(f.edits, 0, selector);
  }
});

test("mobile leaves long-press and double-tap selection to the system", () => {
  const f = cardFixture(true);
  f.listeners.get("dblclick")({target: {closest: () => null}});
  assert.equal(f.edits, 0);
  for (const name of ["pointerdown", "touchstart", "contextmenu", "selectstart"]) {
    assert.equal(f.listeners.has(name), false, name);
  }
});

test("active tag is appended when its only occurrence is a URL fragment", () => {
  const module = {exports: {}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require: () => ({ItemView: class {}}),
  });
  const append = text => module.exports.MemoriaView.prototype.appendActiveTagIfMissing.call(
    {filter: {tag: "rd"}}, text
  );
  const link = "[fish](https://mp.weixin.qq.com/s/example#rd)";
  assert.equal(append(link), link + "\n#rd");
  assert.equal(append(link + " #rd"), link + " #rd");
  assert.equal(append(link + " #rd/child"), link + " #rd/child");
});

test("card rendering keeps URL fragments out of its tag pills", () => {
  const module = {exports: {}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require: () => ({ItemView: class {}}),
  });
  const strip = text => module.exports.MemoriaView.prototype.stripTags.call({}, text);
  const link = "[fish](https://mp.weixin.qq.com/s/example#rd)";
  assert.equal(strip(link).text, link);
  assert.equal(strip(link).tags.length, 0);
  assert.equal(strip(link + " #rd").text, link);
  assert.deepEqual([...strip(link + " #rd").tags], ["rd"]);
});
