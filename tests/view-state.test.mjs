import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({entryPoints:["src/view.ts"],bundle:true,write:false,
  platform:"node",format:"cjs",external:["obsidian"]});
function prototype(mobile = false) {
  const module = {exports:{}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module,exports:module.exports,
    require:() => ({ItemView:class {},Notice:class {},Platform:{isMobile:mobile}}),
  });
  return module.exports.MemoriaView.prototype;
}

test("menu write failures show a notice without reporting success", async () => {
  const callbacks = new Map(), notices = [], errors = [];
  class Menu {
    addItem(callback) {
      let icon;
      const item = {setTitle(){return item;},setIcon(value){icon=value;return item;},
        onClick(fn){callbacks.set(icon,fn);return item;}};
      callback(item);
    }
    addSeparator() {}
    showAtMouseEvent() {}
  }
  const module = {exports:{}};
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module,exports:module.exports,console:{error:(...args)=>errors.push(args)},
    require:() => ({ItemView:class {},Menu,Notice:class {constructor(message){notices.push(message);}}}),
  });
  const view = Object.create(module.exports.MemoriaView.prototype);
  const reject = async () => {throw new Error("fixture conflict");};
  view.store = {togglePinned:reject,toggleStarred:reject,deleteMemo:reject};
  view.confirmAsync = async () => true;
  view.showMemoMenu({},{});
  for (const icon of ["pin","star","trash"]) await callbacks.get(icon)();
  assert.equal(notices.length,3);
  assert.equal(errors.length,3);
  assert.ok(notices.every(message=>message.includes("fixture conflict")));
});

test("saving an edit restores the existing new-note draft without clearing it", async () => {
  const memo = {date:"2026-10-21",time:"10:00"};
  let saved = null;
  const view = {
    inputEl:{value:"edited text",blur:() => assert.fail("Must not blur the restored draft")},
    editingMemo:memo,editDateTimeEl:{value:"2026-10-21T10:00"},
    settings:{clearAfterSave:true,mobileInputStyle:"fab"},
    store:{editMemo:async (m,text) => {assert.equal(m,memo);saved=text;}},
    exitEditMode(){this.editingMemo=null;this.inputEl.value="unsent draft";},
    clearDraft:() => assert.fail("Must preserve saved draft"),
    autoResizeInput(){},syncInputCardContentState(){},
  };
  await prototype().submitMemo.call(view);
  assert.equal(saved,"edited text");
  assert.equal(view.inputEl.value,"unsent draft");
});

for (const [name,mobile,width,windowWidth,narrow] of [
  ["desktop side pane",false,360,1400,true],
  ["desktop main area",false,1200,1400,false],
  ["phone",true,390,390,true],
  ["tablet split pane",true,500,1100,false],
]) {
  test(`sidebar mode matches its CSS breakpoint: ${name}`, () => {
    const classes = new Set();
    const root = {
      clientWidth:width,ownerDocument:{defaultView:{innerWidth:windowWidth}},
      removeClass:cls => classes.delete(cls),
      toggleClass:(cls,on) => on ? classes.add(cls) : classes.delete(cls),
    };
    const view = {contentEl:root,narrowSidebarLayout:false,settings:{sidebarCollapsed:true},
      syncFabMode(){},syncSidebarControls(){}};
    prototype(mobile).syncSidebarLayout.call(view);
    assert.equal(view.narrowSidebarLayout,narrow);
    assert.equal(classes.has("memoria-narrow-panel"),narrow && !mobile);
  });
}
