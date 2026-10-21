import { App, Platform, Workspace, WorkspaceLeaf } from "obsidian";
import { MemoriaSettings, VIEW_TYPE_MEMORIA } from "./types";

// Multiple entry points can run together while a view is still opening.
const pendingOpens = new WeakMap<Workspace, Promise<WorkspaceLeaf>>();

export function createMainLeaf(app: App): WorkspaceLeaf {
  // A sidebar may be active after the last main tab was closed.
  const workspace = app.workspace;
  let hasMainLeaf = false;
  workspace.iterateRootLeaves(() => { hasMainLeaf = true; });
  return hasMainLeaf ? workspace.getLeaf("tab") : workspace.createLeafInParent(workspace.rootSplit, 0);
}

export async function openMemoriaView(
  app: App,
  settings: MemoriaSettings
): Promise<WorkspaceLeaf> {
  const workspace = app.workspace;
  let opening = pendingOpens.get(workspace);
  if (!opening) {
    opening = (async () => {
      const existing = workspace.getLeavesOfType(VIEW_TYPE_MEMORIA)[0];
      if (existing) return existing;
      let leaf: WorkspaceLeaf | null = null;
      if (!Platform.isMobile) {
        if (settings.openLocation === "left") leaf = workspace.getLeftLeaf(false);
        if (settings.openLocation === "right") leaf = workspace.getRightLeaf(false);
      }
      leaf ??= createMainLeaf(app);
      await leaf.setViewState({ type: VIEW_TYPE_MEMORIA, active: true });
      return leaf;
    })();
    pendingOpens.set(workspace, opening);
  }
  try {
    const leaf = await opening;
    await workspace.revealLeaf(leaf);
    return leaf;
  } finally {
    if (pendingOpens.get(workspace) === opening) pendingOpens.delete(workspace);
  }
}
