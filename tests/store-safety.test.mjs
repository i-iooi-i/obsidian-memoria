import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/store.ts"], bundle: true, write: false,
  platform: "node", format: "cjs", external: ["obsidian"],
});
class TFile {
  constructor(path, content) {
    this.path = path;
    this.name = path.split("/").at(-1);
    this.extension = "md";
    this.content = content;
  }
}
async function fixture() {
  const files = new Map();
  const writes = [];
  const vault = {
    getMarkdownFiles: () => [...files.values()],
    getAbstractFileByPath: path => files.get(path),
    read: async file => file.content,
    createFolder: async () => {},
    create: async (path, content) => {
      const file = new TFile(path, content);
      files.set(path, file);
      writes.push(path);
      return file;
    },
    modify: async (file, content) => { file.content = content; writes.push(file.path); },
  };
  const module = {exports: {}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports,
    require: () => ({TFile, normalizePath: p => p}),
  });
  const store = new module.exports.MemoStore({vault}, {folder:"Memoria",useTrash:false});
  await store.addMemo("first", new Date(2026,9,21,10,0));
  await store.addMemo("second", new Date(2026,9,21,10,0));
  const stale = store.getAll().find(m => m.content === "second");
  return {store, stale, files, writes, vault, file: files.get("Memoria/2026.md")};
}

test("CRUD preserves adjacent same-minute notes and link fragments", async () => {
  const f = await fixture();
  const content = "[fish](https://example.com/#rd) #work/sub";
  await f.store.editMemo(f.stale, content);
  let edited = f.store.getAll().find(m => m.content === content);
  assert.deepEqual([...edited.tags], ["work/sub"]);
  await f.store.togglePinned(edited);
  edited = f.store.getAll().find(m => m.isPinned);
  assert.ok(edited.content.includes("https://example.com/#rd"));
  await f.store.togglePinned(edited);
  edited = f.store.getAll().find(m => m.content === content);
  await f.store.deleteMemo(edited);
  assert.deepEqual(f.store.getAll().map(m => m.content).join(), "first");
});

for (const action of ["edit", "delete", "move"]) {
  test(`${action} relocates a stale range after another same-minute note is inserted`, async () => {
    const f = await fixture();
    const marker = "- 10:00\n  second";
    f.file.content = f.file.content.replace(marker, "- 10:00\n  inserted\n\n" + marker);
    if (action === "edit") await f.store.editMemo(f.stale, "edited");
    if (action === "delete") await f.store.deleteMemo(f.stale);
    if (action === "move") await f.store.editMemoDateTime(f.stale, new Date(2026,9,20,9,0));
    assert.ok(f.store.getAll().some(m => m.content === "inserted"));
    assert.ok(f.store.getAll().some(m => m.content === "first"));
    if (action === "edit") assert.ok(f.store.getAll().some(m => m.content === "edited"));
    if (action === "delete") assert.ok(!f.store.getAll().some(m => m.content === "second"));
    if (action === "move") {
      const moved = f.store.getAll().filter(m => m.content === "second");
      assert.equal(moved.length, 1);
      assert.equal(moved[0].date, "2026-10-20");
    }
  });

  test(`${action} refuses a note whose content was externally changed`, async () => {
    const f = await fixture();
    f.file.content = f.file.content.replace("  second", "  externally changed\n  extra line");
    const before = f.file.content;
    const writes = f.writes.length;
    const operation = action === "edit" ? () => f.store.editMemo(f.stale, "edited")
      : action === "delete" ? () => f.store.deleteMemo(f.stale)
      : () => f.store.editMemoDateTime(f.stale, new Date(2026,9,20,9,0));
    await assert.rejects(operation);
    assert.equal(f.file.content, before);
    assert.equal(f.writes.length, writes);
  });
}

test("failed cross-year destination write leaves the original note untouched", async () => {
  const f = await fixture();
  const before = f.file.content;
  f.vault.create = async () => {throw new Error("destination unavailable");};
  await assert.rejects(() => f.store.editMemoDateTime(f.stale, new Date(2025,9,21,10,0)));
  assert.equal(f.file.content, before);
});

test("same-year date changes write the yearly file only once", async () => {
  const f = await fixture();
  f.writes.length = 0;
  await f.store.editMemoDateTime(f.stale, new Date(2026,9,20,9,0));
  assert.deepEqual(f.writes, ["Memoria/2026.md"]);
});

test("cross-year moves preserve both years' neighboring notes", async () => {
  const f = await fixture();
  await f.store.addMemo("target neighbor", new Date(2025,9,21,8,0));
  await f.store.editMemoDateTime(f.stale, new Date(2025,9,21,9,0));
  await f.store.reloadAll();
  assert.equal(f.store.getAll().length, 3);
  assert.equal(f.store.getAll().find(m => m.content === "second").file, "Memoria/2025.md");
  assert.ok(f.store.getAll().some(m => m.content === "first"));
  assert.ok(f.store.getAll().some(m => m.content === "target neighbor"));
});

test("source cleanup failure keeps a recoverable copy in both years", async () => {
  const f = await fixture();
  const before = f.file.content;
  f.vault.modify = async () => {throw new Error("source unavailable");};
  await assert.rejects(() => f.store.editMemoDateTime(f.stale, new Date(2025,9,21,9,0)));
  assert.equal(f.file.content, before);
  assert.ok(f.files.get("Memoria/2025.md").content.includes("second"));
});

test("identical same-minute notes use the closest matching current range", async () => {
  const f = await fixture();
  await f.store.addMemo("second", new Date(2026,9,21,10,0));
  const duplicate = f.store.getAll().filter(m => m.content === "second").sort((a,b) => a.range[0]-b.range[0]);
  await f.store.editMemo(duplicate[1], "edited duplicate");
  const notes = f.store.getAll().sort((a,b) => a.range[0]-b.range[0]);
  assert.equal(notes.map(m => m.content).join("|"), "first|second|edited duplicate");
});

test("soft delete backs up the intended note and leaves other notes intact", async () => {
  const f = await fixture();
  f.store.settings.useTrash = true;
  await f.store.deleteMemo(f.stale);
  assert.ok(f.files.get("Memoria/_trash.md").content.includes("second"));
  assert.equal(f.store.getAll().map(m => m.content).join(), "first");
});
