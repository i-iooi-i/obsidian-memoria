import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/workspace.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  external: ["obsidian"],
});

function fixture({ mobile = false, existing = false, unavailable = false, emptyMain = false } = {}) {
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: () => ({ Platform: { isMobile: mobile } }),
  });
  const created = [];
  const revealed = [];
  const leaves = existing ? [{ location: "manually-moved" }] : [];
  const create = (location) => {
    if (unavailable && location !== "main") return null;
    const leaf = {
      location,
      async setViewState(state) {
        assert.equal(state.type, "memoria-view");
        assert.equal(state.active, true);
        await Promise.resolve();
        leaves.push(leaf);
      },
    };
    created.push(leaf);
    return leaf;
  };
  const app = {
    workspace: {
      getLeavesOfType: () => leaves,
      rootSplit: {type:"root"},
      iterateRootLeaves: callback => {if (!emptyMain) callback({});},
      createLeafInParent: (root, index) => {
        assert.equal(emptyMain, true);
        assert.equal(root.type, "root");
        assert.equal(index, 0);
        return create("main");
      },
      getLeaf: (type) => { assert.equal(type, "tab"); return create("main"); },
      getLeftLeaf: (split) => { assert.equal(split, false); return create("left"); },
      getRightLeaf: (split) => { assert.equal(split, false); return create("right"); },
      revealLeaf: async (leaf) => { revealed.push(leaf); },
    },
  };
  return { app, created, revealed, open: module.exports.openMemoriaView };
}

for (const location of ["main", "left", "right"]) {
  test(`new desktop view opens in ${location}`, async () => {
    const f = fixture();
    const leaf = await f.open(f.app, { openLocation: location });
    assert.equal(leaf.location, location);
    assert.equal(f.created.length, 1);
    assert.equal(f.revealed[0], leaf);
  });
}

test("existing manually positioned view wins over the default", async () => {
  const f = fixture({ existing: true });
  assert.equal((await f.open(f.app, { openLocation: "right" })).location, "manually-moved");
  assert.equal(f.created.length, 0);
});

test("mobile ignores the desktop side preference", async () => {
  for (const location of ["left", "right"]) {
    const f = fixture({ mobile: true });
    assert.equal((await f.open(f.app, { openLocation: location })).location, "main");
  }
});

test("an unavailable side pane falls back to a main tab", async () => {
  const f = fixture({ unavailable: true });
  assert.equal((await f.open(f.app, { openLocation: "left" })).location, "main");
});

test("simultaneous entry points create a single view", async () => {
  const f = fixture();
  const [a, b] = await Promise.all([
    f.open(f.app, { openLocation: "left" }),
    f.open(f.app, { openLocation: "left" }),
  ]);
  assert.equal(a, b);
  assert.equal(f.created.length, 1);
});

test("failed opens do not lock out subsequent attempts", async () => {
  const f = fixture();
  const original = f.app.workspace.getRightLeaf;
  f.app.workspace.getRightLeaf = () => { throw new Error("fixture failure"); };
  await assert.rejects(f.open(f.app, { openLocation: "right" }), /fixture failure/);
  f.app.workspace.getRightLeaf = original;
  assert.equal((await f.open(f.app, { openLocation: "right" })).location, "right");
});

test("opening after the last main tab is closed creates a new main pane", async () => {
  const f = fixture({emptyMain:true});
  assert.equal((await f.open(f.app, {openLocation:"main"})).location, "main");
});
