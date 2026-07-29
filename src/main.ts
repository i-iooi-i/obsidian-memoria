// ================= Memoria 插件入口 =================

import {
  ObsidianProtocolData,
  Platform,
  Plugin,
  TFile,
  WorkspaceLeaf,
  Notice,
} from "obsidian";
import {
  DEFAULT_SETTINGS,
  MemoriaSettings,
  VIEW_TYPE_MEMORIA,
  VIEW_TYPE_MEMORIA_STATS,
  VIEW_TYPE_MEMORIA_YEAR,
} from "./types";
import { MemoStore } from "./store";
import { renderMemo } from "./parser";
import { MemoriaView } from "./view";
import { MemoriaSettingTab } from "./settings";
import { StatsView } from "./stats";
import { YearPanoramaView } from "./year-panorama";
import { initLocale, t } from "./i18n";

export default class MemoriaPlugin extends Plugin {
  settings!: MemoriaSettings;
  store!: MemoStore;

  async onload(): Promise<void> {
    await this.loadSettings();

    // v2.0.0: 初始化多语言（根据 settings.language）
    initLocale(this.settings.language);

    this.store = new MemoStore(this.app, this.settings);

    // 注册视图
    this.registerView(
      VIEW_TYPE_MEMORIA,
      (leaf: WorkspaceLeaf) => new MemoriaView(leaf, this.store, this.settings, this)
    );
    this.registerView(
      VIEW_TYPE_MEMORIA_STATS,
      (leaf: WorkspaceLeaf) => new StatsView(leaf, this.store)
    );
    this.registerView(
      VIEW_TYPE_MEMORIA_YEAR,
      (leaf: WorkspaceLeaf) => new YearPanoramaView(leaf, this.store)
    );

    // Ribbon 按钮
    this.addRibbonIcon("feather", t("ribbon.openMemoria"), () => {
      void this.activateView();
    });

    // 命令
    this.addCommand({
      id: "open-memoria",
      name: t("command.openMemoria"),
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "open-memoria-stats",
      name: t("command.openStats"),
      callback: () => {
        void this.activateStatsView();
      },
    });

    this.addCommand({
      id: "open-memoria-year",
      name: t("command.openYear"),
      callback: () => {
        void this.activateYearView();
      },
    });

    this.addCommand({
      id: "memoria-quick-capture",
      name: t("command.quickCapture"),
      callback: () => {
        void this.quickCapture();
      },
    });

    this.addCommand({
      id: "memoria-normalize-all",
      name: t("command.normalizeAll"),
      callback: () => {
        void this.normalizeAll();
      },
    });

    // iOS Shortcuts / external apps:
    //   obsidian://memoria-capture?vault=<vault>&content=<encoded text>
    // Obsidian decodes query values before invoking the handler.
    this.registerObsidianProtocolHandler(
      "memoria-capture",
      (params: ObsidianProtocolData) => {
        void this.handleProtocolCapture(params);
      }
    );

    // 文件变化监听
    this.registerEvent(
      this.app.vault.on("modify", (f) => {
        if (f instanceof TFile && this.store.isInFolder(f)) {
          void this.store.reloadFile(f);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (f) => {
        if (f instanceof TFile) this.store.removeFile(f.path);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (f) => {
        if (f instanceof TFile && this.store.isInFolder(f)) {
          void this.store.reloadFile(f);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (f, old) => {
        this.store.removeFile(old);
        if (f instanceof TFile && this.store.isInFolder(f)) {
          void this.store.reloadFile(f);
        }
      })
    );

    this.addSettingTab(new MemoriaSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.openOnStartup) return;
      void this.activateView().catch((err: unknown) => {
        console.error("[Memoria] Failed to open on startup:", err);
      });
    });
  }

  onunload(): void {
    // 由 Obsidian 自动清理视图
  }

  async loadSettings(): Promise<void> {
    const loaded: unknown = await this.loadData();
    const persisted =
      typeof loaded === "object" && loaded !== null
        ? (loaded as Partial<MemoriaSettings>)
        : {};
    this.settings = { ...DEFAULT_SETTINGS, ...persisted };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // v2.0.0: language 可能被改，重新同步 i18n 状态
    initLocale(this.settings.language);
  }

  getCaptureUriTemplate(): string {
    const vault = encodeURIComponent(this.app.vault.getName());
    return `obsidian://memoria-capture?vault=${vault}&content=`;
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MEMORIA);
    if (existing.length) {
      await this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: VIEW_TYPE_MEMORIA,
      active: true,
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  private async activateCaptureView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MEMORIA);
    const leaf = existing[0] ?? this.app.workspace.getLeaf("tab");

    if (!existing.length) {
      await leaf.setViewState({
        type: VIEW_TYPE_MEMORIA,
        active: true,
      });
    }

    await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof MemoriaView) {
      leaf.view.openCaptureInput();
    }
  }

  async activateStatsView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_MEMORIA_STATS
    );
    if (existing.length) {
      await this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: VIEW_TYPE_MEMORIA_STATS,
      active: true,
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  async activateYearView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_MEMORIA_YEAR
    );
    if (existing.length) {
      await this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: VIEW_TYPE_MEMORIA_YEAR,
      active: true,
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  /**
   * 规范化所有 memo：用最新的 renderMemo 把每条笔记重写一遍，
   * 修复历史上把 callout / task list / heading 等块级语法
   * 直接拼到 "- HH:MM" 行末尾导致 md 渲染错误的问题。
   */
  private async normalizeAll(): Promise<void> {
    if (!(await this.confirmAsync(t("notice.normalizeConfirm")))) {
      return;
    }
    new Notice(t("notice.normalizing"));
    try {
      // 先 reload 一次，拿到最新的 memos
      await this.store.reloadAll();
      const memos = this.store.getAll();
      // 按文件分组，按行号倒序处理（避免 splice 后行号失效）
      const byFile = new Map<string, typeof memos>();
      for (const m of memos) {
        const arr = byFile.get(m.file) ?? [];
        arr.push(m);
        byFile.set(m.file, arr);
      }
      let count = 0;
      for (const [filePath, list] of byFile) {
        // 按 range[0] 倒序，从后往前重写（保证已处理区间的行号不影响未处理的）
        list.sort((a, b) => b.range[0] - a.range[0]);
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) continue;
        const raw = await this.app.vault.read(file);
        // v1.1.14: 提出 split/join 到循环外，之前每条 memo 都 split+join 一次，
        //   对 1000+ 条笔记的 vault 从"毫秒级"放大到"秒级"。
        const lines = raw.split(/\r?\n/);
        for (const m of list) {
          const [s, e] = m.range;
          const rendered = renderMemo(m.time, m.content).split("\n");
          lines.splice(s, e - s + 1, ...rendered);
          count++;
        }
        await this.app.vault.modify(file, lines.join("\n"));
      }
      await this.store.reloadAll();
      new Notice(t("notice.normalized", { n: count }));
    } catch (e) {
      console.error(e);
      new Notice(t("notice.normalizeFailed", { msg: (e as Error).message }));
    }
  }

  private confirmAsync(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const backdrop = activeDocument.body.createDiv({
        cls: "memoria-modal-backdrop",
      });
      const box = backdrop.createDiv({ cls: "memoria-modal memoria-confirm" });
      box.createDiv({ cls: "memoria-modal-title", text: message });
      const btns = box.createDiv({ cls: "memoria-modal-btns" });
      const cancel = btns.createEl("button", { text: t("input.cancel") });
      const ok = btns.createEl("button", {
        text: t("notice.confirmContinue"),
        cls: "mod-warning",
      });

      let settled = false;
      const close = (result: boolean) => {
        if (settled) return;
        settled = true;
        backdrop.remove();
        activeDocument.removeEventListener("keydown", onKey, true);
        window.setTimeout(() => resolve(result), 0);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close(false);
        } else if (e.key === "Enter") {
          e.preventDefault();
          close(true);
        }
      };

      cancel.addEventListener("click", () => close(false));
      ok.addEventListener("click", () => close(true));
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target === backdrop) close(false);
      });
      activeDocument.addEventListener("keydown", onKey, true);
    });
  }

  private async quickCapture(): Promise<void> {
    // Mobile already has a keyboard-safe FAB input card. Reuse it instead of
    // opening the desktop modal, which iOS WebView can place behind the IME.
    if (Platform.isMobile) {
      await this.activateCaptureView();
      return;
    }

    // v1.1.15: 防重复打开 —— 连按两次 Ctrl+Shift+M 之前会挂两层 backdrop，
    //   第一次关只能关最上层，底下一层变成拦截所有点击的"幽灵蒙版"。
    const existing = activeDocument.querySelector(
      ".memoria-modal-backdrop"
    );
    if (existing) {
      const ta0 = existing.querySelector<HTMLTextAreaElement>("textarea");
      if (ta0) ta0.focus();
      return;
    }

    const backdrop = activeDocument.createElement("div");
    backdrop.addClass("memoria-modal-backdrop");
    const box = backdrop.createDiv({ cls: "memoria-modal" });
    box.createDiv({
      cls: "memoria-modal-title",
      text: t("quickCapture.title"),
    });
    const ta = box.createEl("textarea", {
      cls: "memoria-modal-textarea",
      attr: { placeholder: t("quickCapture.placeholder") },
    });
    const btnRow = box.createDiv({ cls: "memoria-modal-btns" });
    const cancel = btnRow.createEl("button", { text: t("quickCapture.cancel") });
    const save = btnRow.createEl("button", {
      text: t("quickCapture.send"),
      cls: "mod-cta",
    });
    activeDocument.body.appendChild(backdrop);

    // v1.1.15: 插件卸载 / 禁用时自动清理弹窗（避免残留蒙版和 listener）
    // v1.4.11: 同时清理 mousedown 里挂出的全局 mouseup listener（见下方 pendingMouseUp）
    let pendingMouseUp: ((ev: MouseEvent) => void) | null = null;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      if (pendingMouseUp) {
        activeDocument.removeEventListener("mouseup", pendingMouseUp, true);
        pendingMouseUp = null;
      }
      backdrop.remove();
    };
    this.register(() => {
      close();
    });
    window.setTimeout(() => ta.focus(), 20);

    // v1.1.10: textarea 高度自适应（和主输入框行为一致）
    const autoResize = () => {
      ta.setCssStyles({ height: "auto" });
      ta.setCssStyles({ height: `${ta.scrollHeight + 2}px` });
    };
    ta.addEventListener("input", autoResize);
    window.setTimeout(autoResize, 0);

    const submit = async () => {
      const text = ta.value.trim();
      if (!text) {
        close();
        return;
      }
      try {
        await this.store.addMemo(text);
        new Notice(t("notice.saved"));
        close();
      } catch (e) {
        new Notice(t("notice.saveFailed", { msg: (e as Error).message }));
      }
    };

    cancel.addEventListener("click", close);
    // v1.1.10 bug 修复: 原用 `click` 判定 target === backdrop 会把
    //   "在 textarea 右下角 resize 拖拽时松手到 backdrop 上" 误判为点击，
    //   导致速记弹窗无故消失。改为更严格的 mousedown 起点判定 —— 只有
    //   "按下时就在 backdrop 自身"（不是从 box / textarea 拖出来的）才关闭。
    // v1.4.11: 原实现每次 mousedown 都 activeDocument.addEventListener("mouseup",...)
    //   如果 mousedown 后用户把鼠标拖出浏览器窗口松手，mouseup 拿不到事件，
    //   这个 listener 就永久挂在 activeDocument 上。现在用 pendingMouseUp 作为 slot，
    //   新的 mousedown 覆盖前会先清理上一个。
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) {
        // 清掉可能遗留的上一个 mouseup
        if (pendingMouseUp) {
          activeDocument.removeEventListener("mouseup", pendingMouseUp, true);
        }
        const up = (ev: MouseEvent) => {
          activeDocument.removeEventListener("mouseup", up, true);
          pendingMouseUp = null;
          if (ev.target === backdrop) close();
        };
        pendingMouseUp = up;
        activeDocument.addEventListener("mouseup", up, true);
      }
    });
    ta.addEventListener("keydown", (e) => {
      // v2.0.17: 按用户设置的 sendHotkey 决定发送键，两种模式完全互斥
      //   - enter 模式：仅纯 Enter 发送（含 IME 保护）+ Shift+Enter 换行；Ctrl+Enter 不响应
      //   - ctrl-enter 模式：仅 Ctrl/Cmd+Enter 发送；纯 Enter 换行
      const mode = this.settings.sendHotkey;
      if (e.key === "Enter") {
        const isMod = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        if (mode === "enter" && !isMod && !isShift) {
          // 纯 Enter：IME 组合态下是"确认候选"，不发送
          if (!e.isComposing) {
            e.preventDefault();
            void submit();
            return;
          }
        } else if (mode === "ctrl-enter" && isMod && !isShift) {
          e.preventDefault();
          void submit();
          return;
        }
      }
      // 其他 IME 组合态按键直接放过
      if (e.isComposing) {
        return;
      }
      if (e.key === "Escape") {
        close();
      }
    });
    save.addEventListener("click", () => {
      void submit();
    });
  }

  private async handleProtocolCapture(
    params: ObsidianProtocolData
  ): Promise<void> {
    const content =
      typeof params.content === "string"
        ? params.content
        : typeof params.text === "string"
          ? params.text
          : "";

    if (!content.trim()) {
      await this.quickCapture();
      return;
    }

    try {
      await this.store.addMemo(content);
      new Notice(t("notice.protocolCaptureSaved"));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("error.unknown");
      console.error("[Memoria] URI capture failed:", error);
      new Notice(t("notice.protocolCaptureFailed", { msg: message }));
    }
  }
}
