// ================= Memoria 主视图 =================

import {
  ItemView,
  Menu,
  Notice,
  WorkspaceLeaf,
  MarkdownRenderer,
  Component,
  setIcon,
  TFile,
  Platform,
  debounce,
} from "obsidian";
import { Memo, MemoriaSettings, RESERVED_TAGS, VIEW_TYPE_MEMORIA, VIEW_TYPE_MEMORIA_STATS, VIEW_TYPE_MEMORIA_YEAR } from "./types";
import { MemoStore } from "./store";
import { TagSuggest } from "./tag-suggest";
import { extractImages, renderImageGrid, openLightbox } from "./image-grid";
import { renderCalendar } from "./calendar";
import { parseSearchQuery, matchesQuery, SearchQuery, EMPTY_QUERY } from "./search";
import { pickSmartReview } from "./smart-review";
import { detectMood, moodClass } from "./mood";
import { t } from "./i18n";
import { shouldConvertHtmlToMd, htmlToMarkdown, looksLikeMarkdown } from "./html-to-md";
import { exportMemos, ExportFormat } from "./export";
import { hatch, HatchedBuddy } from "./buddy/hatch";
import { renderBuddy, renderEgg } from "./buddy/render";
import { pickQuip } from "./buddy/quips";
import {
  replaceTextareaRange,
  setTextareaValue,
  WrapHandler,
} from "./textarea-utils";

interface Filter {
  tag: string | null;
  year: string | null;
  /** 指定日期筛选（yyyy-MM-dd） */
  date: string | null;
  keyword: string;
  /** 预设视图 */
  preset:
    | "all"
    | "today"
    | "week"
    | "random"
    | "on-this-day"
    | "no-tag"
    | "with-image"
    | "with-link"
    | "pinned"
    | "starred"
    | "todo";
  randomSeed?: number;
}

type ReviewTypeFilter = "all" | "starred" | "pinned" | "with-image" | "todo";

interface ReviewFilters {
  tag: string;
  year: string;
  type: ReviewTypeFilter;
  keyword: string;
}

export class MemoriaView extends ItemView {
  private workspaceLeafEl: HTMLElement | null = null;
  private filter: Filter = {
    tag: null,
    year: null,
    date: null,
    keyword: "",
    preset: "all",
  };
  private reviewFilters: ReviewFilters = {
    tag: "",
    year: "",
    type: "all",
    keyword: "",
  };
  private unsubscribe: (() => void) | null = null;
  private inputEl!: HTMLTextAreaElement;
  /** Keep the native image picker alive while iOS hands control to Photos/Camera. */
  private imagePickerEl: HTMLInputElement | null = null;
  private listEl!: HTMLElement;
  private sidebarEl!: HTMLElement;
  private searchEl!: HTMLInputElement;
  private childComponent = new Component();
  /** v1.1.14: 改为按 settings.pageSize 初始化，不再硬编码 50 */
  private pageLimit: number;
  private tagsExpanded = false;
  private tagSuggest: TagSuggest | null = null;
  /** 侧栏顶部视图：热力图 / 月历 / 宠物（v2.1.0 新增 buddy）
   *  v2.0.20: 初始值从 settings.defaultOverviewMode 读（老用户默认 heatmap 不变）
   *  在 constructor 里设置实际初值，这里只给类型 */
  private overviewMode: "heatmap" | "calendar" | "buddy" = "heatmap";
  private calendarDisplay: { year: number; month: number } | null = null;
  /** v2.0.20: 当前会话中用户是否手动切换过 overviewMode
   *  - false：跟随 settings.defaultOverviewMode（用户在设置页改默认值时立即生效）
   *  - true：锁定为用户当前选择（改设置默认值不影响当前会话） */
  private overviewModeOverridden = false;

  /** v2.1.0-iter6: 宠物气泡文案的会话级缓存
   *  用户反馈：每次点视图切换都刷新气泡会引发"刷屏心理"（忍不住一直点）。
   *  改为只在真正有意义的时机才换一句：
   *    1. view 首次打开（onOpen 时 cache 清空，下次 renderBuddy 重算）
   *    2. 用户新增了一条笔记（store.onChange 里检测到 memos.length 增加）
   *  其他渲染（切换视图、筛选、刷新 UI）都复用 cache，不重算。
   *  null = 需要重算；字符串 = 直接用（即便是空串）*/
  private buddyQuipCache: string | null = null;
  /** 用于检测笔记数是否增加（增加才换气泡，删除不换） */
  private buddyLastMemoCount = -1;

  /** v2.1.0-iter8: 选中包裹快捷键处理器（** == * ~~ `）*/
  private wrapHandler = new WrapHandler();

  /** v2.1.0-iter10: "刚孵化"标记 —— 仅在下一次 renderBuddy 时给卡片加
   *  .is-just-hatched class 播放破壳动画，播完立即清除，
   *  后续切视图不再重播（避免"伪更新"打扰） */
  private buddyJustHatched = false;
  /** 当前是否处于编辑某条 memo 的模式 */
  private editingMemo: Memo | null = null;
  private editBannerEl: HTMLElement | null = null;
  /** v1.6.0: 编辑模式下的 datetime-local input（新建模式隐藏） */
  private editDateTimeEl: HTMLInputElement | null = null;
  /** v2.2.0: 移动端 FAB 浮动按钮 —— 仅在 settings.mobileInputStyle === "fab"
   *  且当前是触屏设备时才显示；点击后给 root 加 `.is-fab-expanded` 让输入卡片
   *  滑出。可视性完全由 CSS 控制（@media + class 组合），这里只持引用方便
   *  访问按钮自身。 */
  private fabEl: HTMLButtonElement | null = null;
  /** v2.0.0: 当前搜索的结构化查询，给 renderMemoCard 高亮用 */
  private currentQuery: SearchQuery = EMPTY_QUERY;
  /** v2.0.0: Vim 选中的卡片索引（-1 = 无选中）*/
  private vimSelectedIdx = -1;
  /** v1.4.1: 今日已提示过"满级达成"的日期（yyyy-MM-dd），避免每次刷新都弹 Notice */
  private dailyGoalNoticedDate: string | null = null;
  /** v1.4.11: MarkdownRenderer HTML 缓存。key = textForMd（剥标签/图片后的文本）。
   *    列表刷新（切筛选、toggle 置顶/收藏、滚动加载更多）时，内容未变的卡片直接复用 HTML，
   *    不再走 MarkdownRenderer.render（异步 + 昂贵）。实测 50 卡重渲染 ~200ms → ~20ms。
   *    LRU 上限 500 条，超出后丢最老的。
   *
   *  v1.4.15: 缓存值从 innerHTML 字符串改为 DocumentFragment（克隆自 body）。
   *    原因：
   *      1. Obsidian 社区插件审核明确不鼓励 innerHTML 写入（XSS 疑虑，即便来源是
   *         MarkdownRenderer 受信输出）
   *      2. DocumentFragment + cloneNode(true) 性能与 innerHTML 几乎一致，但 API 语义更好
   *      3. 不会破坏 DOM 上的事件监听（虽然这里是 clone，事件本来就不会复制，
   *         行为与 innerHTML 一致） */
  private mdCache = new Map<string, DocumentFragment>();
  private static MD_CACHE_MAX = 500;

  constructor(
    leaf: WorkspaceLeaf,
    private store: MemoStore,
    private settings: MemoriaSettings,
    /** v2.0.0: 持有 plugin 引用，用于在设置变化时 saveSettings */
    private plugin: { saveSettings(): Promise<void> }
  ) {
    super(leaf);
    // v1.1.14: pageLimit 初值从设置读取（之前硬编码 50，导致设置页的 pageSize 滑块完全无效）
    this.pageLimit = Math.max(10, this.settings.pageSize || 50);
    // v2.0.20: 侧栏默认视图也从设置读
    this.overviewMode = this.settings.defaultOverviewMode || "heatmap";
  }

  /** v1.1.14: 统一走 settings.pageSize，设置即改即生效 */
  private getInitialPageLimit(): number {
    return Math.max(10, this.settings.pageSize || 50);
  }

  getViewType(): string {
    return VIEW_TYPE_MEMORIA;
  }
  getDisplayText(): string {
    return "Memoria";
  }
  getIcon(): string {
    return "feather";
  }

  async onOpen(): Promise<void> {
    this.workspaceLeafEl = this.contentEl.closest(".workspace-leaf");
    this.workspaceLeafEl?.addClass("memoria-workspace-leaf");
    this.contentEl.addClass("memoria-root");
    this.buildLayout();
    this.unsubscribe = this.store.onChange(() => this.renderAll());

    // v2.0.14: Obsidian 内置命令「在新标签页中打开光标处链接」默认占用 Ctrl+Enter。
    //   v2.0.17: 发送快捷键改为 sendHotkey 可配置，两种模式互斥：
    //   - 默认 sendHotkey="ctrl-enter"：仅 Ctrl/Cmd+Enter 发送（对齐 flomo）
    //   - 可选 sendHotkey="enter"：仅纯 Enter 发送（Shift+Enter 换行）
    //   在 contentEl 的 capture 阶段监听，比主要竞争对手更早：
    this.registerDomEvent(
      this.contentEl,
      "keydown",
      (evt) => {
        const active = activeDocument.activeElement;
        const insideView =
          active instanceof HTMLElement && this.contentEl.contains(active);
        if (!insideView) return;
        if (this.shouldSendOnKeydown(evt)) {
          evt.preventDefault();
          evt.stopPropagation();
          evt.stopImmediatePropagation();
          void this.submitMemo();
        }
      },
      true // capture 阶段
    );

    try {
      await this.store.reloadAll();
    } catch (err) {
      console.error("[Memoria] reloadAll failed:", err);
    }
    // v1.1.7: 恢复上次未发送的草稿
    const draft = this.loadDraft();
    if (draft) this.inputEl.value = draft;
    // v1.1.8: 初次渲染后按实际内容算一次高度
    this.autoResizeInput();
    // v2.0.17: 有草稿的话让输入卡片保持展开态
    this.syncInputCardContentState();
    this.renderAll();
  }

  async onClose(): Promise<void> {
    this.workspaceLeafEl?.removeClass("memoria-workspace-leaf");
    this.workspaceLeafEl = null;
    this.disposeImagePicker();
    if (this.unsubscribe) this.unsubscribe();
    if (this.tagSuggest) {
      this.tagSuggest.destroy();
      this.tagSuggest = null;
    }
    this.childComponent.unload();
  }

  // ====================== 布局 ======================

  private buildLayout(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("memoria-container");

    const shell = root.createDiv({ cls: "memoria-shell" });
    this.sidebarEl = shell.createDiv({ cls: "memoria-sidebar" });
    // 移动端蒙版
    const overlay = shell.createDiv({ cls: "memoria-sidebar-overlay" });
    overlay.addEventListener("click", () => this.toggleSidebar(false));
    const main = shell.createDiv({ cls: "memoria-main" });

    // 顶部 bar
    const topBar = main.createDiv({ cls: "memoria-topbar" });
    const titleWrap = topBar.createDiv({ cls: "memoria-topbar-title" });
    const logoEl = titleWrap.createSpan({ cls: "memoria-logo" });
    setIcon(logoEl, "feather");
    titleWrap.createSpan({ cls: "memoria-brand", text: "Memoria" });

    const searchWrap = topBar.createDiv({ cls: "memoria-search-wrap" });
    const searchIcon = searchWrap.createDiv({ cls: "memoria-search-icon" });
    setIcon(searchIcon, "search");
    this.searchEl = searchWrap.createEl("input", {
      cls: "memoria-search",
      attr: {
        // v1.1.15: placeholder 回归简洁，去掉 v1.1.11 加的"支持 #标签 关键词"提示
        //   功能还在，但 UI 上保持干净；感兴趣的用户会在 README / 设置页看到说明
        // v2.0.1: 走 i18n
        placeholder: t("search.placeholder"),
        type: "text",
      },
    });
    // v2.0.7: 搜索输入 debounce 180ms
    //   大 vault (10k+ memos) 下每按一个键都 matchesQuery + renderList 会卡
    //   debounce 到用户停顿 180ms 再触发，既不影响手感也避免中间态刷 N 次
    const doSearch = debounce(() => {
      this.filter.keyword = this.searchEl.value.trim();
      this.pageLimit = this.getInitialPageLimit();
      this.renderList();
    }, 180);
    this.searchEl.addEventListener("input", doSearch);
    // v1.1.19: 删除"刷新"按钮 —— 文件变化监听（vault.on modify/create/delete/rename）
    //   已经会实时更新数据，手动刷新几乎没有实际用途，反而占位。
    //   如果某天真需要，可以走命令面板"Memoria: 刷新"（保留 reloadAll 能力）。

    // v1.4.5: 顶部工具区（独立于搜索框），右侧放「数据报告」「年度全景」
    //   之前把数据报告按钮塞在 search-wrap 里，会让人误以为和搜索是同一组功能，
    //   现在改成独立的 topbar-tools 区域，语义上"左内容右工具"，也方便未来扩展。
    const tools = topBar.createDiv({ cls: "memoria-topbar-tools" });

    // v2.0.0: 密度切换按钮 —— 紧凑 / 宽松两档切换
    //   紧凑模式每张卡片只显示前几行，适合"找某条"的高密度浏览
    //   宽松模式是默认，适合阅读沉浸
    const densityBtn = tools.createEl("button", {
      cls: "memoria-icon-btn",
      attr: { "aria-label": t("density.toggle") },
    });
    const updateDensityIcon = () => {
      densityBtn.empty();
      setIcon(
        densityBtn,
        this.settings.density === "compact" ? "list" : "rows-3"
      );
    };
    updateDensityIcon();
    densityBtn.addEventListener("click", () => {
      void (async () => {
      this.settings.density =
        this.settings.density === "compact" ? "cozy" : "compact";
      await this.plugin.saveSettings();
      updateDensityIcon();
      // 切密度需要重渲染所有卡片（紧凑模式会截短正文）
      this.mdCache.clear();
      this.renderList();
      })().catch((err) => {
        console.error("[Memoria] Failed to toggle density:", err);
      });
    });

    // v2.0.0: 导出按钮 —— 点击弹 Menu 选格式
    const exportBtn = tools.createEl("button", {
      cls: "memoria-icon-btn",
      attr: { "aria-label": t("card.exportTooltip") },
    });
    setIcon(exportBtn, "download");
    exportBtn.addEventListener("click", (evt) => {
      const menu = new Menu();
      menu.addItem((item) =>
        item
          .setTitle(t("card.exportMd"))
          .setIcon("file-text")
          .onClick(() => this.doExport("md"))
      );
      menu.addItem((item) =>
        item
          .setTitle(t("card.exportHtml"))
          .setIcon("globe")
          .onClick(() => this.doExport("html"))
      );
      menu.addItem((item) =>
        item
          .setTitle(t("card.exportJson"))
          .setIcon("braces")
          .onClick(() => this.doExport("json"))
      );
      menu.showAtMouseEvent(evt);
    });

    const yearBtn = tools.createEl("button", {
      cls: "memoria-icon-btn",
      attr: { "aria-label": t("toolbar.yearPanorama") },
    });
    setIcon(yearBtn, "calendar-days");
    yearBtn.addEventListener("click", () => {
      void (async () => {
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
      })().catch((err) => {
        console.error("[Memoria] Failed to open year panorama:", err);
      });
    });

    const statsBtn = tools.createEl("button", {
      cls: "memoria-icon-btn",
      attr: { "aria-label": t("toolbar.statsReport") },
    });
    setIcon(statsBtn, "bar-chart-3");
    statsBtn.addEventListener("click", () => {
      void (async () => {
      // 在新标签页打开数据报告视图
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
      })().catch((err) => {
        console.error("[Memoria] Failed to open stats view:", err);
      });
    });

    // 侧栏切换按钮：桌面端收起侧栏，移动端打开抽屉
    const toggleBtn = topBar.createEl("button", {
      cls: "memoria-icon-btn memoria-sidebar-toggle",
      attr: {
        "aria-label": t("toolbar.toggleSidebar"),
        title: t("toolbar.toggleSidebar"),
      },
    });
    const syncSidebarToggleIcon = () => {
      toggleBtn.empty();
      if (this.isMobileSidebarLayout()) {
        setIcon(toggleBtn, "menu");
      } else {
        setIcon(
          toggleBtn,
          this.contentEl.hasClass("memoria-sidebar-collapsed")
            ? "panel-left-open"
            : "panel-left-close"
        );
      }
    };
    syncSidebarToggleIcon();
    toggleBtn.addEventListener("click", () => {
      if (this.isMobileSidebarLayout()) {
        this.toggleSidebar(!this.contentEl.hasClass("memoria-sidebar-open"));
      } else {
        this.toggleDesktopSidebar(
          !this.contentEl.hasClass("memoria-sidebar-collapsed")
        );
      }
      syncSidebarToggleIcon();
    });
    this.registerDomEvent(window, "resize", syncSidebarToggleIcon);

    // 输入卡片
    this.buildInputCard(main);

    // 列表
    this.listEl = main.createDiv({ cls: "memoria-list" });
    this.listEl.addEventListener("scroll", () => {
      if (
        this.listEl.scrollTop + this.listEl.clientHeight >=
        this.listEl.scrollHeight - 200
      ) {
        const visible = this.getFilteredMemos();
        if (this.pageLimit < visible.length) {
          const prevLimit = this.pageLimit;
          this.pageLimit += this.getInitialPageLimit();
          // v2.0.3: 增量追加，避免 renderList 全清重建导致的滚动闪烁
          this.appendMoreMemos(visible, prevLimit, this.pageLimit);
        }
      }
    });

    // v2.0.0: Vim 快捷键（settings.enableVimKeys 开关）
    //   绑在 contentEl 上，只在视图聚焦时响应；输入框/textarea 有 focus 时不拦截
    this.registerDomEvent(this.contentEl, "keydown", (e) => {
      if (!this.settings.enableVimKeys) return;
      const target = e.target as HTMLElement;
      // 在输入控件聚焦时不拦截（正常打字）
      if (
        target.instanceOf(HTMLInputElement) ||
        target.instanceOf(HTMLTextAreaElement) ||
        target.isContentEditable
      ) {
        return;
      }
      this.handleVimKey(e);
    });

    // v2.2.0: 移动端 FAB 浮动入口按钮
    //   挂在 contentEl 末尾（不是 main），避免被 main 的 flex / overflow 影响。
    //   可见性由 CSS 控制：仅 (hover: none) and (pointer: coarse) + .memoria-input-fab-mode
    //   时才显示。桌面端永远 display: none，零运行时成本。
    this.buildFab();
  }

  /** v2.2.0: 创建移动端 FAB 浮动按钮 + 关闭按钮，并初始化 root 模式 class。
   *  整体策略：
   *    - FAB 按钮挂在 contentEl 末尾（position: fixed 全局定位）
   *    - 输入卡片右上角加 close-btn（仅 fab 模式 + 已展开时可见）
   *    - 模式切换通过 root 上的 .memoria-input-fab-mode 类（CSS 控制可见性）
   *    - 展开/收起通过 root 上的 .is-fab-expanded 类
   *  CSS 全部用 (hover: none) and (pointer: coarse) 媒体查询包裹，桌面零影响。
   */
  private buildFab(): void {
    // FAB 按钮
    this.fabEl = this.contentEl.createEl("button", {
      cls: "memoria-fab",
      attr: { "aria-label": t("fab.aria") },
    });
    setIcon(this.fabEl, "plus");
    this.fabEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.expandFabInput();
    });

    // 输入卡片内的关闭按钮（fab 模式下才显示，CSS 控制可见性）
    const inputCard = this.inputEl?.closest(
      ".memoria-input-card"
    );
    if (inputCard) {
      const closeBtn = inputCard.createEl("button", {
        cls: "memoria-input-close",
        attr: { "aria-label": t("fab.close") },
      });
      setIcon(closeBtn, "x");
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // v2.3.1: 点 ✕ 是用户**主动**收起的明确意图，强制收起（force=true）。
        //   之前误用 collapseFabInput()（force=false），导致有内容时被"草稿保护"
        //   分支拦下只 blur 不收，表现为"有内容点 ✕ 没反应"。
        //   草稿在输入时已实时 saveDraft，下次点 FAB 展开会 loadDraft 自动恢复，
        //   所以强制收起不会丢内容。
        this.collapseFabInput(true);
      });
    }

    // 初次同步 root 模式 class
    this.syncFabMode();
    this.syncContentWidth();
  }

  /** v2.2.0: 根据 settings.mobileInputStyle 同步 root 上的 .memoria-input-fab-mode 类。
   *  CSS 媒体查询会在桌面端忽略所有 fab-mode 规则，所以这里不需要判断设备 —— 闭眼加就行。
   *  在 onOpen / renderAll / 设置变更后都调用一次，保证 class 跟 settings 一致。 */
  private syncFabMode(): void {
    const isFab = this.settings.mobileInputStyle === "fab";
    if (isFab) {
      this.contentEl.addClass("memoria-input-fab-mode");
    } else {
      this.contentEl.removeClass("memoria-input-fab-mode");
      // 切回常驻模式时，强制清掉展开 class，避免遗留状态
      this.contentEl.removeClass("is-fab-expanded");
    }
  }

  /** v2.2.0: 展开 FAB 触发的输入框（点击 ➕ 时调用）*/
  private expandFabInput(): void {
    this.contentEl.addClass("is-fab-expanded");
    // 等待 CSS 过渡帧再聚焦，让动画与键盘弹起更同步
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        this.inputEl?.focus();
        // v2.3.3: 展开长草稿时把光标移到末尾（接着上次写）。
        //   定位不再靠 JS scrollIntoView —— 改用 CSS 把 FAB 展开态的输入卡片
        //   position: fixed 贴屏幕底部 + textarea 内部滚动，从根上避免"卡片被
        //   键盘遮 / 滚动抖动 / ✕ 被滚出视口"三个问题（见 styles.css v2.3.3 注释）。
        if (this.inputEl) {
          const len = this.inputEl.value.length;
          this.inputEl.setSelectionRange(len, len);
          // textarea 内部滚到底部，让光标所在的最后一行可见
          this.inputEl.scrollTop = this.inputEl.scrollHeight;
        }
      });
    });
  }

  /** 桌面端共享阅读宽度；设置变更时只更新 CSS 变量，不重建界面。 */
  private syncContentWidth(): void {
    const widths = {
      focused: "760px",
      balanced: "980px",
      wide: "1200px",
    } as const;
    const width = widths[this.settings.contentWidth] ?? widths.balanced;
    this.contentEl.style.setProperty("--memoria-feed-max-width", width);
  }

  /** Open the same capture surface used by the mobile FAB.
   *  External URI entry points call this after revealing the Memoria leaf. */
  openCaptureInput(): void {
    this.syncFabMode();
    if (this.settings.mobileInputStyle === "fab") {
      this.expandFabInput();
      return;
    }

    window.requestAnimationFrame(() => {
      this.inputEl?.focus();
    });
  }

  /** v2.2.0: 收起 FAB 输入框。
   *  force=true（默认调用方：点 ✕ / 发送成功 / 退出编辑）→ 无条件收起卡片。
   *    草稿已实时 saveDraft，下次展开 loadDraft 自动恢复，不会丢内容。
   *  force=false → "草稿保护"：有内容时只 blur 键盘、卡片保持展开，无内容才收。
   *    供未来"失焦自动收起"等被动场景使用（当前主动收起一律 force=true）。
   *  v2.3.1: ✕ 按钮改为 force=true，修复"有内容点 ✕ 没反应"。 */
  private collapseFabInput(force = false): void {
    if (!force && this.inputEl?.value.trim()) {
      // 有内容 —— 至少先 blur 让键盘收起，但卡片保持展开（用户能继续看）
      this.inputEl.blur();
      return;
    }
    this.contentEl.removeClass("is-fab-expanded");
    this.inputEl?.blur();
  }

  private buildInputCard(parent: HTMLElement): void {
    const inputCard = parent.createDiv({ cls: "memoria-input-card" });

    this.inputEl = inputCard.createEl("textarea", {
      cls: "memoria-input",
      attr: {
        placeholder: t("input.placeholder"),
        // v2.0.17: rows=1 让 textarea 的"内容约束高度"降到 1 行（~22px），
        //   这样展开动画（40→96）全程由 min-height 主导 rendered height，
        //   视觉上从第一毫秒就开始丝滑升高，而不是前半段卡在 rows=2 的 ~44px。
        rows: "1",
      },
    });
    // v2.0.17: 渐进式披露（点击聚焦时展开）。
    //   设计决策：仅在用户**主动点击**输入框时展开，hover 不触发。
    //   理由：
    //   1. 鼠标在笔记列表和工具栏间穿梭经常路过输入框，hover 会带来大量视觉噪音
    //   2. 点击 = 明确的写作意图；hover = 只是路过，两者不应同等对待
    //   3. 桌面和移动端体验一致（移动端本来也没有 hover 概念）
    //
    //   不用 :focus-within 伪类：Chromium 对 textarea 在伪类驱动下的 transition
    //   有诡异行为（动画只跑 30% 路程就跳到终点），换成 JS class 触发能完整走完 0.7s。
    this.inputEl.addEventListener("focus", () => {
      inputCard.addClass("is-focused");
    });
    this.inputEl.addEventListener("blur", () => {
      inputCard.removeClass("is-focused");
    });
    // 标签联想
    this.tagSuggest = new TagSuggest(this.app, this.inputEl);
    this.inputEl.addEventListener("keydown", (e) => {
      // v2.0.16: 发送快捷键按 sendHotkey 配置决定，含 IME 保护。
      //   前面 contentEl 的 capture 监听已经响应过了；这里是 bubble 阶段兜底
      //   （某些环境 capture 阶段的事件可能已被上游 preventDefault）。
      if (this.shouldSendOnKeydown(e)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        void this.submitMemo();
        return;
      }
      // IME 组合态守卫（只保护下面的 Escape / Tab / 列表续行，不影响发送）
      if (e.isComposing || (e as KeyboardEvent & { keyCode?: number }).keyCode === 229) {
        return;
      }

      // v2.1.0-iter8: 选中文本 + 按 wrap 字符（** == * ~~ `）→ 包裹而不是替换
      //   响应来自 GitHub issue：用户期望 Obsidian 风格的"选中包裹"行为
      if (this.wrapHandler.handleKey(e, this.inputEl)) {
        e.preventDefault();
        return;
      }

      if (e.key === "Escape" && this.editingMemo) {
        e.preventDefault();
        this.exitEditMode();
      } else if (e.key === "Tab") {
        // v1.1.9: 列表行的 Tab / Shift+Tab 缩进（只在列表行触发，避免影响普通输入）
        if (this.handleListIndent(e.shiftKey)) {
          e.preventDefault();
        }
      } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // v1.1.9: 列表项 Enter 智能续行
        //   v2.0.16: 仅在 sendHotkey === "ctrl-enter" 模式下启用（因为默认模式下
        //   纯 Enter 已经用于"发送"，智能续行会和发送冲突）。
        if (this.settings.sendHotkey === "ctrl-enter") {
          if (this.handleListContinuation()) {
            e.preventDefault();
          }
        }
      }
    });
    // v1.1.7: 输入时保存草稿（非编辑模式才存，避免用编辑的内容覆盖草稿）
    // v1.1.8: 同时做高度自适应
    // v2.0.17: 同步输入卡片的 has-content 状态（用于"默认收起、有内容保持展开"动画）
    this.inputEl.addEventListener("input", () => {
      if (!this.editingMemo) this.saveDraft(this.inputEl.value);
      this.autoResizeInput();
      this.syncInputCardContentState();
      // v2.3.3: 移除上一版的 scrollIntoView（它在 iOS 上每次打字 smooth 滚动
      //   导致界面抖动频闪，还把 ✕ 按钮滚出视口）。FAB 展开态改用 fixed 贴底 +
      //   textarea 内部滚动后，内容变长不再需要滚整个页面，问题从根上消除。
    });
    // v2.3.3: 移除 v2.0.10 的 focus → scrollIntoView 逻辑。
    //   FAB 展开态现在用 position: fixed 贴屏幕底部 + textarea 内部滚动（见
    //   styles.css），输入卡片永远固定在键盘上方，不需要靠滚动页面来定位；
    //   常驻模式（always-visible）的 textarea 本身有 max-height 上限不会无限
    //   撑高，也不需要。彻底去掉 scrollIntoView，根除 iOS 上的抖动频闪问题。
    // 粘贴图片 + v2.0.0: 富文本 → Markdown 转换
    this.inputEl.addEventListener("paste", (e) => {
      void (async () => {
      const items = Array.from(e.clipboardData?.items ?? []);
      if (!items) return;
      // 1) 图片（最高优先级）
      for (const it of items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          e.preventDefault();
          const file = it.getAsFile();
          if (file) await this.handleImageFile(file);
          return;
        }
      }
      // v2.0.0: 2) 如果剪贴板同时有 HTML + plain text，且 HTML 不是简单 plain text 裹一层
      //   → 把 HTML 转成 Markdown 插入，保留加粗/斜体/链接/列表结构
      //   判断依据：HTML 里含有 <a> / <strong> / <em> / <ul> / <ol> / <h1-6> 等有语义的标签
      // v2.1.2: 前置检测 —— 如果 plain text 已经是 markdown 语法（含 [[]]、#标签、```代码块
      //   等），信任它、走默认粘贴路径。解决从 Obsidian 主编辑器复制 [[笔记]] 或 #标签
      //   时，HTML 版本被渲染成 <a class="internal-link"> 导致双链被转成 [text](url) 的 bug。
      const htmlData = e.clipboardData?.getData("text/html");
      const plainData = e.clipboardData?.getData("text/plain") ?? "";
      if (looksLikeMarkdown(plainData)) {
        // 走默认浏览器粘贴（plainData 已经是正确的 markdown）
        return;
      }
      if (htmlData && shouldConvertHtmlToMd(htmlData)) {
        e.preventDefault();
        const md = htmlToMarkdown(htmlData) || plainData;
        this.insertAtCursor(md);
        this.autoResizeInput();
      }
      // 否则走默认（浏览器自己处理纯文本粘贴）
      })().catch((err) => {
        console.error("[Memoria] Failed to handle paste:", err);
      });
    });
    // 拖拽图片
    this.inputEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.inputEl.addClass("dragging");
    });
    this.inputEl.addEventListener("dragleave", () => {
      this.inputEl.removeClass("dragging");
    });
    this.inputEl.addEventListener("drop", (e) => {
      void (async () => {
      e.preventDefault();
      this.inputEl.removeClass("dragging");
      const files = Array.from(e.dataTransfer?.files ?? []);
      for (const f of files) {
        if (f.type.startsWith("image/")) {
          await this.handleImageFile(f);
        }
      }
      })().catch((err) => {
        console.error("[Memoria] Failed to handle dropped image:", err);
      });
    });

    const inputToolbar = inputCard.createDiv({ cls: "memoria-input-toolbar" });
    const toolLeft = inputToolbar.createDiv({ cls: "memoria-input-tools" });

    const addTagBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertTag") },
    });
    setIcon(addTagBtn, "hash");
    addTagBtn.addEventListener("click", () => this.insertAtCursor("#"));

    const addImageBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertImage") },
    });
    setIcon(addImageBtn, "image");
    addImageBtn.addEventListener("click", () => this.pickImageFromDisk());

    // v1.1.7: 无序列表
    const ulBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertUL") },
    });
    setIcon(ulBtn, "list");
    ulBtn.addEventListener("click", () => this.insertListAtCursor("- "));

    // v1.1.7: 有序列表（v1.1.8 修复：序号自动 +1，而不是永远是 "1."）
    const olBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertOL") },
    });
    setIcon(olBtn, "list-ordered");
    olBtn.addEventListener("click", () => this.insertOrderedListAtCursor());

    // v1.1.7: 任务列表
    const taskBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertTask") },
    });
    setIcon(taskBtn, "square-check");
    taskBtn.addEventListener("click", () => this.insertListAtCursor("- [ ] "));

    const addTableBtn = toolLeft.createEl("button", {
      cls: "memoria-tool-btn",
      attr: { "aria-label": t("toolbar.insertTable") },
    });
    setIcon(addTableBtn, "table");
    addTableBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showTablePicker(addTableBtn);
    });

    // v1.2.1: 去掉 "Ctrl+Enter · 拖拽/粘贴图片" 提示，让输入区更清爽

    const submitWrap = inputToolbar.createDiv({ cls: "memoria-submit-wrap" });
    // v1.6.0: 编辑模式下可修改时间。新建模式默认隐藏，进入编辑模式时填值并显示。
    //   用原生 datetime-local，iOS 上是滚轮选择器，PC 上是日历 + 时间双控件，
    //   全平台体验一致且零依赖。
    const editDateTimeInput = submitWrap.createEl("input", {
      cls: "memoria-edit-datetime memoria-hidden",
      type: "datetime-local",
      attr: { step: "60", title: t("input.editTimeTitle") },
    });
    this.editDateTimeEl = editDateTimeInput;
    const cancelBtn = submitWrap.createEl("button", {
      cls: "memoria-cancel-btn memoria-hidden",
      text: t("input.cancel"),
    });
    cancelBtn.addEventListener("click", () => this.exitEditMode());
    // 存起来方便 updateEditBanner 切换可见性
    this.editBannerEl = cancelBtn;

    const submitBtn = submitWrap.createEl("button", {
      cls: "memoria-submit-btn",
      attr: {
        "aria-label": t("input.submit"),
        title: t("input.submit"),
      },
    });
    setIcon(submitBtn, "send-horizontal");
    submitBtn.addEventListener("click", () => {
      void this.submitMemo();
    });
  }

  /** 在光标处插入文本。
   *  v2.0.13: 修复 BUG —— 之前 `slice(0,start) + text + slice(end)` 会把选区
   *  替换掉，造成用户全选 + 点 # 等按钮时原文本全部消失。改为：有选区时把选区
   *  文本保留下来夹在 text 后面（即"在选中前插入"），无选区时按原行为。
   *  注意：列表按钮走 insertListAtCursor / insertOrderedListAtCursor 已有专用逻辑，
   *  不会调到这里的选区分支；这里主要保护 # / 链接 / 引用 / 表格 等其他工具按钮。 */
  private insertAtCursor(text: string): void {
    const el = this.inputEl;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start !== end) {
      // 有选区：把选中文本保留下来（插在 text 后面），不丢失用户内容
      // v2.1.0-iter8: 用 replaceTextareaRange 保留 undo stack（修 Ctrl+Z 失效）
      const selected = el.value.slice(start, end);
      replaceTextareaRange(el, start, end, text + selected);
    } else {
      replaceTextareaRange(el, start, end, text);
    }
    el.focus();
    // v1.1.8: 插入内容后也要重新算一次高度
    this.autoResizeInput();
    // v2.0.13: 同步保存草稿（之前只在主 input 监听器里保存，按钮触发的修改没保存到草稿）
    if (!this.editingMemo) this.saveDraft(el.value);
    // v2.0.17: 同步输入卡片展开/收起态
    this.syncInputCardContentState();
  }

  /**
   * v1.1.8: 让 textarea 高度跟随内容自适应
   * - 先 reset height = auto 让浏览器重算 scrollHeight
   * - 再 set height = scrollHeight
   * - CSS 上有 max-height: 40vh，超过会自动出现内部滚动条
   */
  private autoResizeInput(): void {
    const el = this.inputEl;
    if (!el) return;
    // v2.0.17: 给 height 设 inline 值时临时禁用 transition，避免 0.7s 慢动画拖住打字手感
    //   （CSS 里的 transition 覆盖 min-height + height 两者，下一帧恢复）。
    el.classList.add("memoria-no-transition");

    // v2.0.17-iter15: 空内容直接清 inline height，让 CSS min-height 接管。
    //   这一步必须放在 scrollHeight 测量之前 —— 否则会踩这个坑：
    //   不同用户的字体/lineHeight/padding 下，空 textarea 的 scrollHeight 可能
    //   > 96px（实测有用户是 98px）。原逻辑会判定"内容超展开态 min"
    //   把 inline height 锁成 98px，blur 后 CSS min-height 已经降到 40，
    //   但 inline height 优先级高，textarea 卡在 98px 不收回。
    //
    //   只要 value 为空，无论字体多大都肯定不需要撑高，直接清 inline 即可。
    if (el.value.length === 0) {
      el.setCssStyles({ height: "" });
      window.requestAnimationFrame(() => {
        el.classList.remove("memoria-no-transition");
      });
      return;
    }

    el.setCssStyles({ height: "auto" });
    // 加 2px 吸收边界误差，避免 scrollHeight 比实际需要略小导致行末被裁
    const contentHeight = el.scrollHeight + 2;
    // v2.0.17: 渐进式披露的收起/展开态由 CSS 的 min-height 负责过渡动画
    //   （纯 CSS 的 0.7s cubic-bezier，丝滑感）。这里 JS 只关心一件事：
    //   **输入内容是否多到需要超过默认高度撑高 textarea**。
    //
    //   - 内容高度 ≤ 展开态 min（空或 1-3 行）→ 不设 inline height，让 CSS min-height 决定视觉
    //   - 内容高度 > 展开态 min（≥ 4 行）→ 设 inline height = scrollHeight，让 textarea 撑高
    const expandedMin = Platform.isMobile ? 56 : 96;
    if (contentHeight <= expandedMin) {
      // 内容不够撑高，让 CSS min-height 掌控（收起时 40，展开时 96）
      el.setCssStyles({ height: "" });
    } else {
      // 内容超过展开态最小值，按 scrollHeight 撑高
      el.setCssStyles({ height: `${contentHeight}px` });
    }
    // 下一帧恢复 transition（hover/focus 切换时动画正常）
    window.requestAnimationFrame(() => {
      el.classList.remove("memoria-no-transition");
    });
  }

  /**
   * v2.0.17: 同步输入卡片的 has-content 状态。
   * 设计：输入卡片默认处于"收起态"（textarea 矮、工具栏图标变灰、发送按钮淡色），
   *   节省阅读区垂直空间。有以下任一情况时进入"展开态"：
   *   1. 鼠标 hover / 输入框聚焦（纯 CSS，见 :hover / :focus-within）
   *   2. 输入框已有内容（本方法通过加 .has-content class 控制）
   *   3. 编辑模式（复用已有的 .is-editing class）
   *   4. 拖拽图片中（复用已有的 .dragging class）
   *
   * 这样用户打到一半切去看笔记卡片（鼠标离开输入框）时，输入框不会意外塌下去把草稿挤走。
   */
  private syncInputCardContentState(): void {
    if (!this.inputEl) return;
    const card = this.inputEl.closest(".memoria-input-card");
    if (!card) return;
    const hasContent = this.inputEl.value.length > 0;
    card.toggleClass("has-content", hasContent);
  }



  /**
   * v1.1.7: 插入列表前缀（无序 `- ` / 任务 `- [ ] `）
   * - 如果光标在行首或文档开头 → 直接插入 `prefix`
   * - 否则先补一个换行 → 再插入 `prefix`
   * 这样连续点按钮可以快速生成多条
   *
   * v2.0.13: 修复 BUG —— 之前如果用户**选中了文本**再点列表按钮，selectionStart!==selectionEnd
   *   走 insertAtCursor 会把选区替换成只有前缀的字符串，**用户原文本全部丢失**！
   *   修复：检测到有选区时，把选中文本按行拆开，每行前面加列表前缀（多行时每一项都成为列表项），
   *   单行时直接 `prefix + 选中文本` 包起来变成一个列表项。和 flomo / Typora / VSCode 行为一致。
   */
  private insertListAtCursor(prefix: string): void {
    const el = this.inputEl;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start !== end) {
      // 有选区：把选中文本按行拆开，每行加前缀
      const selected = el.value.slice(start, end);
      const lines = selected.split("\n");
      const wrapped = lines.map((ln) => `${prefix}${ln}`).join("\n");
      // 如果选区不是从行首开始，需要在 wrapped 前面补一个换行让列表干净起始
      const before = el.value.slice(0, start);
      const atLineStart = start === 0 || before.endsWith("\n");
      const finalText = atLineStart ? wrapped : `\n${wrapped}`;
      // v2.1.0-iter8: 保留 undo stack
      replaceTextareaRange(el, start, end, finalText);
      el.focus();
      this.autoResizeInput();
      // v1.1.7: 草稿持久化
      if (!this.editingMemo) this.saveDraft(el.value);
      return;
    }
    // 无选区：原有行为
    const pos = start;
    const before = el.value.slice(0, pos);
    const atLineStart = pos === 0 || before.endsWith("\n");
    this.insertAtCursor(atLineStart ? prefix : `\n${prefix}`);
  }

  /**
   * v1.1.8: 插入有序列表前缀，自动计算序号
   * 规则：
   *   1. 向上扫描"光标所在行之前"的连续有序列表行（`N. ` 开头）
   *   2. 找到最近一个序号 → next = 该序号 + 1
   *   3. 找不到 / 不连续 → 从 1 开始
   *
   * 场景示例：
   *   a) 空输入框连点 3 次 → `1. \n2. \n3. `
   *   b) 已写 "第一段文字\n\n" 光标在末尾 → 插入 `1. `（不连续，从 1 开始）
   *   c) 已写 "5. abc\n" 光标在末尾 → 插入 `6. `
   *
   * v2.0.13: 同 insertListAtCursor，修复"选中文本被前缀替换"的 BUG。
   *   有选区时按行拆开，每行加递增序号（`1. ` `2. ` `3. ` ...），不再丢失原文本。
   */
  private insertOrderedListAtCursor(): void {
    const el = this.inputEl;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start !== end) {
      // 有选区：每行加递增序号
      const selected = el.value.slice(start, end);
      const lines = selected.split("\n");
      const wrapped = lines.map((ln, i) => `${i + 1}. ${ln}`).join("\n");
      const before = el.value.slice(0, start);
      const atLineStart = start === 0 || before.endsWith("\n");
      const finalText = atLineStart ? wrapped : `\n${wrapped}`;
      // v2.1.0-iter8: 保留 undo stack
      replaceTextareaRange(el, start, end, finalText);
      el.focus();
      this.autoResizeInput();
      if (!this.editingMemo) this.saveDraft(el.value);
      return;
    }
    // 无选区：原有行为
    const pos = start;
    const before = el.value.slice(0, pos);
    const atLineStart = pos === 0 || before.endsWith("\n");

    // 从光标位置向上找"紧邻的连续有序列表"
    // 方式：把 before 去掉末尾换行后按行分割，从末行往前看
    const trimmedBefore = atLineStart
      ? before.replace(/\n$/, "")
      : before;
    const lines = trimmedBefore.split("\n");
    const olRe = /^(\d+)\.\s/;
    let nextNum = 1;
    // 从末行往前扫描，找到第一个非空行
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i];
      if (ln.trim() === "") {
        // 空行 → 列表中断，从 1 开始
        break;
      }
      const m = ln.match(olRe);
      if (m) {
        nextNum = parseInt(m[1], 10) + 1;
        break;
      }
      // 非空且不是有序列表行 → 中断，从 1 开始
      break;
    }

    const prefix = `${nextNum}. `;
    this.insertAtCursor(atLineStart ? prefix : `\n${prefix}`);
  }

  /**
   * v1.1.9: 列表行 Tab / Shift+Tab 缩进
   * - 只在"当前行是列表行"（无序/有序/任务）时生效，普通文本不拦截 Tab
   * - 行首插入/删除 2 空格
   * 返回 true 表示已处理（外部应 preventDefault），false 则放行
   */
  private handleListIndent(shift: boolean): boolean {
    const el = this.inputEl;
    const pos = el.selectionStart ?? 0;
    const text = el.value;

    // 找当前行范围
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
    let lineEnd = text.indexOf("\n", pos);
    if (lineEnd === -1) lineEnd = text.length;
    const curLine = text.slice(lineStart, lineEnd);

    // 只处理列表行（允许任意数量的前导空格作为现有缩进）
    const listRe = /^(\s*)(?:[-*]\s+\[[ xX]\]\s|[-*]\s|\d+\.\s)/;
    if (!listRe.test(curLine)) return false;

    let newLine: string;
    let shift2: number; // 光标需要跟随移动的字符数
    if (shift) {
      // Shift+Tab：去掉行首 1-2 个空格
      if (curLine.startsWith("  ")) {
        newLine = curLine.slice(2);
        shift2 = -2;
      } else if (curLine.startsWith(" ")) {
        newLine = curLine.slice(1);
        shift2 = -1;
      } else {
        return true; // 已经最左，吃掉 Tab 但不动
      }
    } else {
      // Tab：行首加 2 空格
      newLine = "  " + curLine;
      shift2 = 2;
    }

    // v2.1.0-iter8: 替换整行，保留 undo stack
    replaceTextareaRange(el, lineStart, lineEnd, newLine);
    const newPos = Math.max(lineStart, pos + shift2);
    el.setSelectionRange(newPos, newPos);
    // 走一次 input 路径：存草稿 + autoResize
    if (!this.editingMemo) this.saveDraft(el.value);
    this.autoResizeInput();
    return true;
  }

  /**
   * v1.1.9: 列表项 Enter 智能续行
   * 规则：
   *   1. 当前行是 "<indent>- [ ] 内容" → 新行 "<indent>- [ ] "
   *   2. 当前行是 "<indent>- 内容" → 新行 "<indent>- "
   *   3. 当前行是 "<indent>N. 内容" → 新行 "<indent>(N+1). "
   *   4. 当前行是空列表项（只剩前缀）→ 清空当前行前缀 + 插入换行（退出列表）
   *   5. 光标不在行尾（在中间） → 不介入，走浏览器默认 Enter
   * 返回 true 表示已处理（外部应 preventDefault）
   */
  private handleListContinuation(): boolean {
    const el = this.inputEl;
    const pos = el.selectionStart ?? 0;
    // 选区（如果用户选中了一段 → 不介入）
    if (el.selectionStart !== el.selectionEnd) return false;

    const text = el.value;
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
    let lineEnd = text.indexOf("\n", pos);
    if (lineEnd === -1) lineEnd = text.length;
    const curLine = text.slice(lineStart, lineEnd);

    // 光标必须在行尾（否则 Enter 会被误用成"切行"）
    if (pos !== lineEnd) return false;

    // 各类列表行正则（捕获前缀供后续复用）
    // 注意：任务必须先匹配（它以 - 开头），否则会被无序吃掉
    const taskRe = /^(\s*)([-*]\s+)\[[ xX]\](\s+)(.*)$/;
    const ulRe = /^(\s*)([-*]\s+)(.*)$/;
    const olRe = /^(\s*)(\d+)(\.\s+)(.*)$/;

    let mTask = curLine.match(taskRe);
    if (mTask) {
      const [, indent, bullet, space, body] = mTask;
      if (body === "") {
        // 空任务项 → 退出列表
        this.replaceLineAndInsertNewline(lineStart, lineEnd);
      } else {
        const newPrefix = `\n${indent}${bullet}[ ]${space}`;
        this.insertAtCursor(newPrefix);
      }
      return true;
    }

    let mOl = curLine.match(olRe);
    if (mOl) {
      const [, indent, num, dot, body] = mOl;
      if (body === "") {
        this.replaceLineAndInsertNewline(lineStart, lineEnd);
      } else {
        const next = parseInt(num, 10) + 1;
        this.insertAtCursor(`\n${indent}${next}${dot}`);
      }
      return true;
    }

    let mUl = curLine.match(ulRe);
    if (mUl) {
      const [, indent, bullet, body] = mUl;
      if (body === "") {
        this.replaceLineAndInsertNewline(lineStart, lineEnd);
      } else {
        this.insertAtCursor(`\n${indent}${bullet}`);
      }
      return true;
    }

    // 当前行不是列表行 → 放行浏览器默认
    return false;
  }

  /** v1.1.9 辅助：把 [lineStart,lineEnd) 这一行清空并插入换行（用于"空列表项退出列表"）
   *  v2.1.0-iter8: 改用 replaceTextareaRange 保留 undo stack */
  private replaceLineAndInsertNewline(lineStart: number, lineEnd: number): void {
    const el = this.inputEl;
    // 把这一行替换为空，再在原位置插入一个换行
    replaceTextareaRange(el, lineStart, lineEnd, "\n");
    const newPos = lineStart + 1;
    el.setSelectionRange(newPos, newPos);
    if (!this.editingMemo) this.saveDraft(el.value);
    this.autoResizeInput();
  }

  /**
   * 点击"插入表格"按钮 -> 弹出 8×8 网格让用户选行列数
   *
   * 桌面端：参考 Word/Notion —— hover 高亮选区，点击确认插入
   * 手机端（v1.1.7）：手指没有 hover，改为"点哪格就插多大"的 tap-to-insert 模式。
   *   每格会显示小数字提示（如 "3×4"），点击即立即插入并关闭弹层。
   */
  private showTablePicker(anchor: HTMLElement): void {
    // 若已有弹层则关闭
    const existing = activeDocument.querySelector(".memoria-table-picker");
    if (existing) {
      existing.remove();
      return;
    }

    // v1.1.15: 尺寸精简
    //   - 桌面 8×8 → 6×6（真实笔记里 6 列以上的 md 表格几乎不存在，精简后一眼看全）
    //   - 手机 8×8 32px → 5×5 36px（更大的点击热区 + 5×5 在任何手机上都放得下，不再溢出屏幕）
    const isMobile = Platform.isMobile;
    const MAX = isMobile ? 5 : 6;
    const pop = activeDocument.body.createDiv({
      cls: "memoria-table-picker" + (isMobile ? " is-mobile" : ""),
    });

    // 标题 & 尺寸提示
    const label = pop.createDiv({
      cls: "memoria-table-picker-label",
      text: isMobile ? "点击格子直接插入" : "0 × 0",
    });

    const grid = pop.createDiv({ cls: "memoria-table-picker-grid" });
    const cells: HTMLElement[][] = [];
    for (let r = 0; r < MAX; r++) {
      cells[r] = [];
      for (let c = 0; c < MAX; c++) {
        const cell = grid.createDiv({ cls: "memoria-table-picker-cell" });
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        // 手机端：给每个格子显示 "R×C" 小数字，让用户明确知道点了会插几行几列
        if (isMobile) {
          cell.createSpan({
            cls: "memoria-table-picker-cell-text",
            text: `${r + 1}×${c + 1}`,
          });
        }
        cells[r][c] = cell;
      }
    }

    let selR = 0;
    let selC = 0;
    const updateHighlight = (r: number, c: number) => {
      selR = r;
      selC = c;
      for (let i = 0; i < MAX; i++) {
        for (let j = 0; j < MAX; j++) {
          cells[i][j].toggleClass("is-active", i <= r && j <= c);
        }
      }
      label.setText(`${r + 1} × ${c + 1}`);
    };

    // 桌面端：hover 预览 + click 确认
    if (!isMobile) {
      grid.addEventListener("mouseover", (e) => {
        const t = e.target as HTMLElement;
        if (!t.hasClass("memoria-table-picker-cell")) return;
        const r = parseInt(t.dataset.row ?? "0", 10);
        const c = parseInt(t.dataset.col ?? "0", 10);
        updateHighlight(r, c);
      });

      grid.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (!t.hasClass("memoria-table-picker-cell")) return;
        this.insertTable(selR + 1, selC + 1);
        pop.remove();
      });
    } else {
      // 手机端：单击即插，不需要 hover 预览
      grid.addEventListener("click", (e) => {
        let t = e.target as HTMLElement;
        // 允许点到格子里的 span
        if (!t.hasClass("memoria-table-picker-cell")) {
          t = t.closest(".memoria-table-picker-cell") as HTMLElement;
        }
        if (!t) return;
        const r = parseInt(t.dataset.row ?? "0", 10);
        const c = parseInt(t.dataset.col ?? "0", 10);
        this.insertTable(r + 1, c + 1);
        pop.remove();
      });
    }

    // v1.1.15: 定位策略
    //   - 桌面：贴在按钮下方（和之前一致），但加入视口右/下边界夹紧，
    //     避免窗口变窄时弹层被裁掉右半边
    //   - 手机：直接屏幕居中（原来贴按钮，按钮在工具栏中右部，弹层会溢出屏幕右边）
    //   都要等一帧再测量（让 grid 渲染完拿到真实尺寸）
    if (isMobile) {
      pop.setCssStyles({
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      });
    } else {
      const rect = anchor.getBoundingClientRect();
      // 先放到按钮下方
      pop.setCssStyles({
        left: `${Math.round(rect.left)}px`,
        top: `${Math.round(rect.bottom + 6)}px`,
      });
      // 下一帧根据实际尺寸夹紧（避免右侧溢出）
      window.requestAnimationFrame(() => {
        const pr = pop.getBoundingClientRect();
        const vw = activeDocument.documentElement.clientWidth;
        const vh = activeDocument.documentElement.clientHeight;
        if (pr.right > vw - 8) {
          pop.setCssStyles({ left: `${Math.max(8, vw - pr.width - 8)}px` });
        }
        if (pr.bottom > vh - 8) {
          // 下方放不下 → 翻到按钮上方
          pop.setCssStyles({ top: `${Math.max(8, rect.top - pr.height - 6)}px` });
        }
      });
    }

    // 点击弹层外关闭（v1.1.15: 同时监听 mousedown 和 touchstart，兼容手机）
    const closeOnOutside = (e: Event) => {
      const t = e.target as Node;
      if (!pop.contains(t) && t !== anchor) {
        pop.remove();
        activeDocument.removeEventListener("mousedown", closeOnOutside, true);
        activeDocument.removeEventListener("touchstart", closeOnOutside, true);
      }
    };
    // 延后一帧注册，避免和当前点击事件冲突
    window.setTimeout(() => {
      activeDocument.addEventListener("mousedown", closeOnOutside, true);
      activeDocument.addEventListener("touchstart", closeOnOutside, true);
    }, 0);
    // v1.1.15: 视图关闭时清理残留弹层（防止切视图后还挂在 body 上）
    this.register(() => {
      pop.remove();
      activeDocument.removeEventListener("mousedown", closeOnOutside, true);
      activeDocument.removeEventListener("touchstart", closeOnOutside, true);
    });
  }

  /** 在光标位置插入一个 rows × cols 的空 md 表格模板 */
  private insertTable(rows: number, cols: number): void {
    const header = "| " + Array(cols).fill("  ").join(" | ") + " |";
    const sep = "| " + Array(cols).fill("--").join(" | ") + " |";
    const body = Array(Math.max(0, rows - 1))
      .fill(null)
      .map(() => "| " + Array(cols).fill("  ").join(" | ") + " |");

    const lines = [header, sep, ...body];
    const el = this.inputEl;
    // 表格前后各补一个空行（方便 md 解析和用户继续编辑）
    let prefix = "";
    let suffix = "\n";
    const val = el.value;
    const start = el.selectionStart ?? val.length;
    const beforeChar = val.slice(0, start);
    // 如果前面不是开头且最后一个字符不是换行，补一个空行
    if (beforeChar.length > 0 && !beforeChar.endsWith("\n\n")) {
      prefix = beforeChar.endsWith("\n") ? "\n" : "\n\n";
    }
    const afterChar = val.slice(start);
    if (afterChar && !afterChar.startsWith("\n")) {
      suffix = "\n\n";
    }

    const text = prefix + lines.join("\n") + suffix;
    this.insertAtCursor(text);
  }

  /** 用浏览器 file picker 选图片 */
  private pickImageFromDisk(): void {
    // iOS may discard a detached, locally scoped file input while Photos/Camera is
    // open. Keep one attached to the active document and referenced by the view
    // until the picker returns.
    this.disposeImagePicker();

    const inp = activeDocument.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.multiple = true;
    inp.tabIndex = -1;
    inp.className = "memoria-image-picker";
    inp.setAttribute("aria-hidden", "true");

    inp.addEventListener("change", () => {
      const files = Array.from(inp.files ?? []);
      this.disposeImagePicker(inp);
      void this.importSelectedImages(files).catch((err: unknown) => {
        console.error("[Memoria] Failed to import selected image:", err);
      });
    }, { once: true });
    inp.addEventListener("cancel", () => {
      this.disposeImagePicker(inp);
    }, { once: true });

    activeDocument.body.appendChild(inp);
    this.imagePickerEl = inp;
    inp.value = "";
    inp.click();
  }

  private disposeImagePicker(inp: HTMLInputElement | null = this.imagePickerEl): void {
    if (!inp) return;
    if (this.imagePickerEl === inp) this.imagePickerEl = null;
    inp.remove();
  }

  private async importSelectedImages(files: File[]): Promise<void> {
    for (const file of files) {
      await this.handleImageFile(file);
    }
  }

  /** 把一张图片保存到附件目录，并把 ![[]] 引用插入输入框 */
  private async handleImageFile(file: File): Promise<void> {
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const buf = await file.arrayBuffer();
      const path = await this.store.saveImageAttachment(buf, ext);
      // 用 wikilink，简洁且 Obsidian 原生支持
      const fileName = path.split("/").pop() ?? path;
      const ref = `![[${fileName}]]`;
      // 如果输入框非空且最后一个字符不是换行，先补一个换行
      if (this.inputEl.value && !/\n$/.test(this.inputEl.value)) {
        this.insertAtCursor("\n" + ref + "\n");
      } else {
        this.insertAtCursor(ref + "\n");
      }
      new Notice(`图片已保存: ${fileName}`);
    } catch (e) {
      console.error(e);
      new Notice(t("notice.imageFailed", { msg: (e as Error).message }));
    }
  }

  /** v2.0.17: 根据设置的 sendHotkey 判断当前 keydown 是否应触发"发送"
   *  两种模式**完全互斥**：
   *  - "enter"      ：仅纯 Enter 触发发送；Shift+Enter 换行；Ctrl/Cmd+Enter 不触发（让浏览器默认换行）
   *  - "ctrl-enter" ：仅 Ctrl/Cmd+Enter 触发发送；纯 Enter 换行 / 列表续行
   *  IME 保护：仅在"纯 Enter 发送"时考虑（中文输入法确认候选词也是 Enter）；
   *            带 Ctrl/Cmd 修饰键时 IME 不会劫持，无需考虑
   */
  private shouldSendOnKeydown(e: KeyboardEvent): boolean {
    if (e.key !== "Enter") return false;
    const mode = this.settings.sendHotkey;
    const isMod = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    if (mode === "enter") {
      // enter 模式：只有**纯 Enter**算发送
      if (isMod || isShift) return false;
      // IME 组合态下 Enter 是"确认候选词"，不发送
      if (
        e.isComposing ||
        (e as KeyboardEvent & { keyCode?: number }).keyCode === 229
      ) {
        return false;
      }
      return true;
    }
    // mode === "ctrl-enter"：只有 Ctrl/Cmd+Enter 算发送（Shift 组合不算）
    if (isMod && !isShift) return true;
    return false;
  }


  private async submitMemo(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text) return;
    try {
      if (this.editingMemo) {
        // v1.6.0: 编辑模式可以同时改时间和内容。
        //   读取 datetime-local input：值是 "yyyy-MM-ddTHH:mm" 格式，
        //   按本地时区解析（new Date('yyyy-MM-ddTHH:mm') 在所有浏览器都按本地时区解析）。
        const dtStr = this.editDateTimeEl?.value ?? "";
        const origStr = `${this.editingMemo.date}T${this.editingMemo.time}`;
        const timeChanged = dtStr && dtStr !== origStr;

        if (timeChanged) {
          const newDate = new Date(dtStr);
          if (isNaN(newDate.getTime())) {
            new Notice(t("notice.invalidTime"));
            return;
          }
          await this.store.editMemoDateTime(this.editingMemo, newDate, text);
          new Notice(t("notice.updatedWithTime"));
        } else {
          // 时间没动，走原有路径只改内容
          await this.store.editMemo(this.editingMemo, text);
          new Notice(t("notice.updated"));
        }
        this.exitEditMode();
      } else {
        // v2.0.13: 当侧栏点了某个标签做筛选时，新建 memo 自动追加该标签
        //   （和 flomo / Thino 的行为一致 —— 在 #工作 视图下记录默认带 #工作）
        //   只对 filter.tag 生效，预设视图（today/pinned 等）不动。
        //   规则：
        //     1. 仅当 filter.tag 不为空时触发
        //     2. 用户已经在文本里手打了相同标签 → 不重复加
        //     3. 标签作为新行追加在末尾，不破坏用户原排版
        const finalText = this.appendActiveTagIfMissing(text);
        await this.store.addMemo(finalText);
        new Notice(t("notice.saved"));
      }
      // v1.1.14: 接入 settings.clearAfterSave（之前无条件清空，设置项形同虚设）
      //   编辑模式下 exitEditMode() 已经把 inputEl 恢复为草稿，此处不再强清；
      //   新建模式按用户设置决定。
      if (this.settings.clearAfterSave) {
        this.inputEl.value = "";
        this.clearDraft();
      }
      // v2.0.17-iter14: 发送完成后让 textarea 失焦，触发渐进式披露动画收起
      //   （对齐 flomo 体验：发完一条 = 一个完整动作的结束 = 视觉重置）。
      //   仅在「新建模式 + clearAfterSave 开启」时 blur ——
      //   - 编辑模式下 exitEditMode 自有焦点逻辑
      //   - 关闭 clearAfterSave 的用户希望保留文本继续编辑，不强制失焦
      //
      //   ⚠️ 顺序很关键：必须先 blur 后 autoResizeInput()。如果先 autoResize：
      //   此时 is-focused 还在 → CSS min-height=96px → 空 textarea 的 scrollHeight
      //   被算成约 98px > expandedMin 96 → autoResize 设 inline height=98px →
      //   后续 blur 移除 is-focused 让 CSS min-height 变 40，但 inline height=98px
      //   优先级更高，textarea 死死卡在 98px。
      if (!this.editingMemo && this.settings.clearAfterSave) {
        this.inputEl.blur();
      }
      // v1.1.8: 清空后高度回到 min；没清空也重算一次（autoResize 幂等）
      this.autoResizeInput();
      // v2.0.17: 清空后让输入卡片回到收起态
      this.syncInputCardContentState();
      // v2.2.0: 移动端 FAB 模式下，发送成功后自动收回到 FAB 入口
      //   - 仅 fab 模式 + 新建（不是编辑）+ 已开启清空 时收起
      //   - 不打扰编辑模式（编辑路径自有逻辑）
      if (
        !this.editingMemo &&
        this.settings.clearAfterSave &&
        this.settings.mobileInputStyle === "fab"
      ) {
        // 强制收起（force=true 跳过"有内容则不收"的保护，因为我们刚清完内容）
        this.collapseFabInput(true);
      }
    } catch (e) {
      console.error(e);
      new Notice(t("notice.saveFailed", { msg: (e as Error).message }));
    }
  }

  /** v2.0.13: 如果当前侧栏正按某标签筛选，把该标签自动追加到新 memo 末尾。
   *   - 用户已包含同名标签则不重复（按 tag 完整匹配 #foo / #foo/bar）
   *   - 多语言无关，纯文本匹配
   *   - 不修改"编辑已有 memo"路径，只对新建生效 */
  private appendActiveTagIfMissing(text: string): string {
    const activeTag = this.filter.tag;
    if (!activeTag) return text;
    // 提取文本里已经存在的标签
    // 简化版：用 #xxx 正则扫描（足够覆盖普通使用场景）
    const tagRe = /#([A-Za-z0-9_\u4e00-\u9fff/]+)/g;
    const existingTags = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(text)) !== null) {
      existingTags.add(m[1]);
    }
    // 已存在该标签或其子标签 → 不追加
    if (existingTags.has(activeTag)) return text;
    for (const ex of existingTags) {
      if (ex.startsWith(activeTag + "/")) return text;
    }
    // 追加到末尾，前面补换行让标签独占一行（视觉清爽）
    const sep = text.endsWith("\n") ? "" : "\n";
    return `${text}${sep}#${activeTag}`;
  }

  /** v1.1.7: 草稿持久化（localStorage）
   *  v1.1.14: key 带上 vault 名，避免在多 vault 之间切换时草稿串味。
   */
  private static DRAFT_KEY_PREFIX = "memoria:input-draft";
  private draftKey(): string {
    try {
      return `${MemoriaView.DRAFT_KEY_PREFIX}:${this.app.vault.getName()}`;
    } catch {
      return MemoriaView.DRAFT_KEY_PREFIX;
    }
  }
  private saveDraft(text: string): void {
    try {
      const key = this.draftKey();
      if (text.trim() === "") {
        window.localStorage.removeItem(key);
      } else {
        // v1.4.11: 草稿大小上限保险丝。
        //   localStorage 上限一般 5-10MB，如果有人不小心往输入框粘了一个 base64 大图片，
        //   过去会写进草稿，塞爆 localStorage 影响其他插件。
        //   正常粘贴图片走 handleImageFile 已经会转成附件，不会落到草稿里；
        //   这里只是防御性兜底。超过 512KB 直接跳过写入。
        if (text.length > 512 * 1024) return;
        window.localStorage.setItem(key, text);
      }
    } catch {
      /* localStorage 可能被禁用，忽略 */
    }
  }
  private loadDraft(): string {
    try {
      return window.localStorage.getItem(this.draftKey()) ?? "";
    } catch {
      return "";
    }
  }
  private clearDraft(): void {
    try {
      window.localStorage.removeItem(this.draftKey());
    } catch {
      /* ignore */
    }
  }

  private isMobileSidebarLayout(): boolean {
    return window.innerWidth <= 680;
  }

  /** 切换侧栏抽屉（移动端用） */
  private toggleSidebar(open: boolean): void {
    this.contentEl.toggleClass("memoria-sidebar-open", open);
  }

  /** 收起桌面侧栏，让主内容区获得完整宽度 */
  private toggleDesktopSidebar(collapsed: boolean): void {
    this.contentEl.toggleClass("memoria-sidebar-collapsed", collapsed);
    if (collapsed) this.toggleSidebar(false);
  }

  /** v2.0.0: 导出当前筛选结果到 vault 的 Memoria/exports/ 目录 */
  private async doExport(format: ExportFormat): Promise<void> {
    try {
      const memos = this.getFilteredMemos();
      if (memos.length === 0) {
        new Notice(t("notice.exportEmpty"));
        return;
      }
      const desc = this.describeCurrentFilter();
      const folder = `${this.settings.folder}/exports`;
      const path = await exportMemos(this.app, {
        format,
        memos,
        filterDesc: desc,
        exportFolder: folder,
      });
      // v2.0.5: 导出后行为按格式区分
      //   - md：Obsidian 原生能读，直接在新 tab 打开方便预览
      //   - html / json：Obsidian 不渲染 HTML / JSON，openFile 会创建空白 tab 让用户困惑
      //                  → 只发 Notice 告知路径，用户可在 vault 外用浏览器 / 编辑器打开
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile && format === "md") {
        await this.app.workspace.getLeaf("tab").openFile(file);
      }
    } catch (e) {
      console.error(e);
      new Notice(t("notice.exportFailed", { msg: (e as Error).message }));
    }
  }

  /** 用人类可读的方式描述当前筛选状态（给导出文件的 filter 字段用）
   *  v2.0.19: 走 i18n —— 之前 preset 映射和"X 年"/"全部笔记"都是硬编码中文，
   *    导致英文用户导出的 md/html/json 里 filter 字段总是中文。*/
  private describeCurrentFilter(): string {
    const parts: string[] = [];
    if (this.filter.preset && this.filter.preset !== "all") {
      const presetKeyMap: Record<string, string> = {
        today: "sidebar.today",
        week: "sidebar.week",
        "on-this-day": "list.presetOnThisDay",
        "no-tag": "sidebar.noTag",
        "with-image": "sidebar.withImage",
        "with-link": "sidebar.withLink",
        pinned: "sidebar.pinned",
        starred: "sidebar.starred",
        todo: "sidebar.todo",
        random: "sidebar.random",
      };
      const k = presetKeyMap[this.filter.preset];
      parts.push(k ? t(k) : this.filter.preset);
    }
    if (this.filter.tag) parts.push(`#${this.filter.tag}`);
    if (this.filter.year) parts.push(t("export.desc.year", { year: this.filter.year }));
    if (this.filter.date) parts.push(this.filter.date);
    if (this.filter.keyword) parts.push(`"${this.filter.keyword}"`);
    return parts.length === 0 ? t("export.desc.all") : parts.join(" · ");
  }

  /**
   * v2.0.0: Vim 快捷键处理。
   *
   * 快捷键表：
   *   j       → 下一条卡片
   *   k       → 上一条卡片
   *   g g     → 跳到第一条（需要在 1 秒内连按两次 g）
   *   G       → 跳到最后一条
   *   Enter   → 进入选中卡片的编辑模式
   *   /       → 聚焦搜索框
   *   Esc     → 清除选中
   *   i       → 聚焦输入框开写新笔记
   *
   * 选中态的视觉：给卡片加 .is-vim-selected class，CSS 会让它高亮 + 自动滚入视口
   */
  private gPressedAt = 0;
  private handleVimKey(e: KeyboardEvent): void {
    const key = e.key;
    // 收集所有卡片
    const cards = Array.from(
      this.listEl.querySelectorAll<HTMLElement>(".memoria-card")
    );
    if (cards.length === 0 && !["i", "/"].includes(key)) return;

    const updateSelected = (idx: number) => {
      this.vimSelectedIdx = Math.max(0, Math.min(cards.length - 1, idx));
      cards.forEach((c, i) => {
        c.toggleClass("is-vim-selected", i === this.vimSelectedIdx);
      });
      const target = cards[this.vimSelectedIdx];
      if (target) {
        target.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    switch (key) {
      case "j":
        e.preventDefault();
        updateSelected(
          this.vimSelectedIdx < 0 ? 0 : this.vimSelectedIdx + 1
        );
        break;
      case "k":
        e.preventDefault();
        updateSelected(
          this.vimSelectedIdx < 0 ? 0 : this.vimSelectedIdx - 1
        );
        break;
      case "G":
        e.preventDefault();
        updateSelected(cards.length - 1);
        break;
      case "g": {
        // gg = 跳到顶部（1 秒内连按两次）
        const now = Date.now();
        if (now - this.gPressedAt < 1000) {
          e.preventDefault();
          updateSelected(0);
          this.gPressedAt = 0;
        } else {
          this.gPressedAt = now;
        }
        break;
      }
      case "Enter":
        if (this.vimSelectedIdx >= 0) {
          e.preventDefault();
          const memos = this.getFilteredMemos().slice(0, this.pageLimit);
          const memo = memos[this.vimSelectedIdx];
          if (memo) this.enterEditMode(memo);
        }
        break;
      case "/":
        e.preventDefault();
        this.searchEl.focus();
        this.searchEl.select();
        break;
      case "i":
        e.preventDefault();
        this.inputEl.focus();
        break;
      case "Escape":
        if (this.vimSelectedIdx >= 0) {
          this.vimSelectedIdx = -1;
          cards.forEach((c) => c.removeClass("is-vim-selected"));
        }
        break;
    }
  }



  /** 进入编辑模式：把 memo 内容填入输入框
   *  v1.1.7: 进入前如果输入框有在打的草稿，先保存到 localStorage，退出编辑时恢复
   *  v1.6.0: 同步把 memo 的时间填入 datetime-local 输入框，允许编辑时一并修改
   */
  private enterEditMode(memo: Memo): void {
    // 进入编辑前，把当前未发送草稿存起来（如果有）
    if (this.inputEl.value.trim()) this.saveDraft(this.inputEl.value);
    this.editingMemo = memo;
    this.inputEl.value = memo.content;
    // v1.6.0: 把 memo 时间填进 datetime input（格式 yyyy-MM-ddTHH:mm，本地时区）
    if (this.editDateTimeEl) {
      this.editDateTimeEl.value = `${memo.date}T${memo.time}`;
    }
    // v2.2.0: 移动端 FAB 模式下，编辑某条卡片时输入框可能是隐藏的，先展开
    if (this.settings.mobileInputStyle === "fab") {
      this.contentEl.addClass("is-fab-expanded");
    }
    this.inputEl.focus();
    // 把光标移到末尾
    const len = this.inputEl.value.length;
    this.inputEl.setSelectionRange(len, len);
    this.updateEditBanner();
    // v1.1.8: 按 memo 内容重算高度
    this.autoResizeInput();
  }

  /** 退出编辑模式，恢复新建笔记状态
   *  v1.1.7: 恢复之前暂存的草稿
   *  v1.6.0: 清空 datetime input
   */
  private exitEditMode(): void {
    this.editingMemo = null;
    this.inputEl.value = this.loadDraft();
    if (this.editDateTimeEl) this.editDateTimeEl.value = "";
    this.updateEditBanner();
    // v1.1.8: 草稿长度不一，重算高度
    this.autoResizeInput();
    // v2.0.17: 恢复的草稿可能为空 → 收起态；非空 → 展开态
    this.syncInputCardContentState();
    // v2.2.0: 移动端 FAB 模式下，退出编辑且无草稿时收回 FAB 入口
    if (
      this.settings.mobileInputStyle === "fab" &&
      !this.inputEl.value.trim()
    ) {
      this.collapseFabInput(true);
    }
  }

  /** 刷新编辑模式的 UI 状态（取消按钮显隐 + 输入卡片的编辑态高亮）
   *  v1.6.0: 同步控制 datetime-local 输入框的显隐
   */
  private updateEditBanner(): void {
    if (!this.editBannerEl) return;
    const inputCard = this.inputEl.closest(".memoria-input-card");
    if (this.editingMemo) {
      this.editBannerEl.removeClass("memoria-hidden");
      this.editDateTimeEl?.removeClass("memoria-hidden");
      inputCard?.addClass("is-editing");
      this.inputEl.setAttr(
        "placeholder",
        t("input.editPlaceholder", {
          date: this.editingMemo.date,
          time: this.editingMemo.time,
        })
      );
    } else {
      this.editBannerEl.addClass("memoria-hidden");
      this.editDateTimeEl?.addClass("memoria-hidden");
      inputCard?.removeClass("is-editing");
      // v2.0.13: 如果当前按某个标签筛选，placeholder 提示用户保存时会自动加该标签
      if (this.filter.tag) {
        this.inputEl.setAttr(
          "placeholder",
          t("input.placeholderWithTag", { tag: this.filter.tag })
        );
      } else {
        this.inputEl.setAttr("placeholder", t("input.placeholder"));
      }
    }
  }

  // ====================== 渲染 ======================

  /**
   * v1.4.8: 外部视图（年度全景图等）调用：筛选到某一天的笔记并重绘。
   *   和侧栏月历点某天走同一条路径：清空其他筛选 → 设置 filter.date → 重渲染。
   */
  public focusOnDate(date: string): void {
    this.filter.date = date;
    this.calendarDisplay = {
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)) - 1,
    };
    this.filter.preset = "all";
    this.filter.year = null;
    this.filter.tag = null;
    this.filter.keyword = "";
    if (this.searchEl) this.searchEl.value = "";
    this.pageLimit = this.getInitialPageLimit();
    this.renderAll();
  }

  private renderAll(): void {
    // v2.2.0: 每次 renderAll 同步一次 root 的 fab-mode class，
    //   让用户在设置页切换 mobileInputStyle 后立即生效（store.notifyChange 会触发 renderAll）
    this.syncFabMode();
    this.syncContentWidth();
    this.renderSidebar();
    this.renderList();
  }

  private renderSidebar(): void {
    // v2.0.20: 如果用户本会话没手动切过 overviewMode，就跟随 settings 的默认值
    //   （这样用户在设置页改"侧栏默认视图"时即时生效；一旦手动点过切换按钮，
    //   锁定为用户的选择不再被设置覆盖 —— 直到下次重开 view）
    if (!this.overviewModeOverridden) {
      this.overviewMode = this.settings.defaultOverviewMode || "heatmap";
    }
    this.sidebarEl.empty();
    const memos = this.store.getAll();

    // 统计
    const tagSet = new Set<string>();
    const daySet = new Set<string>();
    let imageCount = 0;
    let linkCount = 0;
    let noTagCount = 0;
    let pinnedCount = 0;
    let starredCount = 0;
    // v1.1.7: 过去的今天（往年同月同日，不含今年）
    const todayStrForSidebar = fmtDateLocal(new Date());
    const todayMMDD = todayStrForSidebar.slice(5);
    let onThisDayCount = 0;
    // v1.4.13: 「今天」「本周」也在侧栏显示条数（之前没统计，显示成空白）。
    //   本周按 ISO 周定义：周一起至今（含今日）。把 monday 的时间戳预算好，
    //   避免在循环里每条 memo 都 new Date。
    let todayCount = 0;
    let weekCount = 0;
    // v1.5.0: 待办视图 —— 含至少一条未完成 task 的 memo 数
    let todoCount = 0;
    const weekMondayTs = (() => {
      const now = new Date();
      const monday = new Date(now);
      const dow = (now.getDay() + 6) % 7; // 周一 = 0
      monday.setDate(now.getDate() - dow);
      monday.setHours(0, 0, 0, 0);
      return monday.getTime();
    })();
    for (const m of memos) {
      for (const t of m.tags) if (!RESERVED_TAGS.has(t)) tagSet.add(t);
      daySet.add(m.date);
      if (m.hasImage) imageCount++;
      if (m.hasLink) linkCount++;
      if (m.isPinned) pinnedCount++;
      if (m.isStarred) starredCount++;
      if (m.hasOpenTask) todoCount++;
      if (m.date === todayStrForSidebar) todayCount++;
      if (m.datetime.getTime() >= weekMondayTs) weekCount++;
      if (m.date.slice(5) === todayMMDD && m.date !== todayStrForSidebar)
        onThisDayCount++;
      // 判定"无标签"时忽略保留标签
      const effectiveTags = m.tags.filter((t) => !RESERVED_TAGS.has(t));
      if (effectiveTags.length === 0) noTagCount++;
    }

    const stats = this.sidebarEl.createDiv({ cls: "memoria-stats" });
    this.renderStatItem(stats, memos.length.toString(), t("stats.memos"));
    this.renderStatItem(stats, tagSet.size.toString(), t("stats.tags"));
    this.renderStatItem(stats, daySet.size.toString(), t("stats.days"));
    // v1.4.1: 视图切换按钮移到进度条右侧，此处不再创建

    // 热力图 / 月历（可切换）
    this.renderOverview(this.sidebarEl, memos);

    // v1.4.0: 每日打卡进度条（热力图/日历下方）
    this.renderDailyGoal(this.sidebarEl, memos);

    // 视图区
    this.sidebarEl.createDiv({
      cls: "memoria-sidebar-section",
      text: t("sidebar.section.views"),
    });
    const presets: Array<{
      key: Filter["preset"];
      icon: string;
      text: string;
      count?: number;
    }> = [
      { key: "all", icon: "layout-grid", text: t("sidebar.all"), count: memos.length },
      { key: "pinned", icon: "pin", text: t("sidebar.pinned"), count: pinnedCount },
      { key: "starred", icon: "star", text: t("sidebar.starred"), count: starredCount },
      // v1.4.13: 加上条数显示，让侧栏所有视图入口右侧数字"对齐"，
      //   视觉节奏统一；也能一眼看到今天 / 本周的活跃度
      { key: "today", icon: "calendar", text: t("sidebar.today"), count: todayCount },
      { key: "week", icon: "calendar-days", text: t("sidebar.week"), count: weekCount },
      // v1.5.0: 待办视图 —— 筛出含未完成 `- [ ]` 的 memo。
      //   勾完所有 task 后这条自动从视图消失（借助 v1.4.x 的"勾选回写 md"闭环）
      { key: "todo", icon: "check-square", text: t("sidebar.todo"), count: todoCount },
      // v1.1.19: 合并每日回顾 + 随机回顾 → 统一"回顾"入口
      //   默认先看"往年的今天"，没有时 empty 状态里再引导去"随机 5 条"
      {
        key: "on-this-day",
        icon: "history",
        text: t("sidebar.review"),
        count: onThisDayCount,
      },
    ];
    for (const p of presets) {
      this.renderNavItem(p.key, p.icon, p.text, p.count);
    }

    // 检索式
    this.sidebarEl.createDiv({
      cls: "memoria-sidebar-section",
      text: t("sidebar.section.search"),
    });
    this.renderNavItem("no-tag", "tag", t("sidebar.noTag"), noTagCount);
    this.renderNavItem("with-image", "image", t("sidebar.withImage"), imageCount);
    this.renderNavItem("with-link", "link", t("sidebar.withLink"), linkCount);

    // 年份（v2.3.0: 可在设置里隐藏，跨度长的用户右侧列表太长会有视觉干扰）
    const yearCount = new Map<string, number>();
    for (const m of memos) {
      const y = m.date.substring(0, 4);
      yearCount.set(y, (yearCount.get(y) ?? 0) + 1);
    }
    if (this.settings.showSidebarYears && yearCount.size) {
      this.sidebarEl.createDiv({
        cls: "memoria-sidebar-section",
        text: t("sidebar.section.years"),
      });
      const years = [...yearCount.entries()].sort((a, b) =>
        a[0] < b[0] ? 1 : -1
      );
      for (const [y, c] of years) {
        const el = this.sidebarEl.createDiv({
          cls:
            "memoria-nav-item" +
            (this.filter.year === y ? " active" : ""),
        });
        const icon = el.createDiv({ cls: "memoria-nav-icon" });
        setIcon(icon, "calendar");
        el.createSpan({ cls: "memoria-nav-text", text: y });
        el.createSpan({ cls: "memoria-nav-count", text: String(c) });
        el.addEventListener("click", () => {
          this.filter.year = this.filter.year === y ? null : y;
          this.filter.preset = "all";
          this.pageLimit = this.getInitialPageLimit();
          this.renderAll();
        });
      }
    }

    // 标签（可选 + 折叠）
    if (this.settings.showSidebarTags) {
      const tagCount = new Map<string, number>();
      for (const m of memos)
        for (const t of m.tags) {
          if (RESERVED_TAGS.has(t)) continue;
          tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
        }

      if (tagCount.size) {
        const sectionHead = this.sidebarEl.createDiv({
          cls: "memoria-sidebar-section memoria-section-collapsible",
        });
        sectionHead.createSpan({
          cls: "memoria-section-arrow",
          text: this.tagsExpanded ? "▾" : "▸",
        });
        sectionHead.createSpan({ text: ` ${t("sidebar.section.tags")} (${tagCount.size})` });
        sectionHead.addEventListener("click", () => {
          this.tagsExpanded = !this.tagsExpanded;
          this.renderSidebar();
        });
        if (this.tagsExpanded) {
          const tree = this.buildTagTree(tagCount);
          this.renderTagTree(this.sidebarEl, tree, 0);
        }
      }
    }
  }

  private renderNavItem(
    key: Filter["preset"],
    icon: string,
    text: string,
    count?: number
  ): void {
    const isActive =
      this.filter.preset === key && !this.filter.tag && !this.filter.year;
    const el = this.sidebarEl.createDiv({
      cls: "memoria-nav-item" + (isActive ? " active" : ""),
    });
    const iconEl = el.createDiv({ cls: "memoria-nav-icon" });
    setIcon(iconEl, icon);
    el.createSpan({ cls: "memoria-nav-text", text });
    if (count !== undefined) {
      el.createSpan({ cls: "memoria-nav-count", text: String(count) });
    }
    el.addEventListener("click", () => {
      this.filter.preset = key;
      this.filter.tag = null;
      this.filter.year = null;
      this.filter.date = null;
      if (key === "random") this.filter.randomSeed = Date.now();
      this.pageLimit = this.getInitialPageLimit();
      this.renderAll();
    });
  }

  private renderStatItem(
    parent: HTMLElement,
    num: string,
    label: string
  ): void {
    const item = parent.createDiv({ cls: "memoria-stat" });
    item.createDiv({ cls: "memoria-stat-num", text: num });
    item.createDiv({ cls: "memoria-stat-label", text: label });
  }

  /** 热力图 / 月历 / 宠物视图容器（v2.1.0 三态切换，按钮在统计条上） */
  private renderOverview(parent: HTMLElement, memos: Memo[]): void {
    const wrap = parent.createDiv({ cls: "memoria-overview" });

    // 内容区
    const content = wrap.createDiv({ cls: "memoria-overview-content" });
    if (this.overviewMode === "heatmap") {
      this.renderHeatmap(content, memos);
    } else if (this.overviewMode === "calendar") {
      const activeCalendarMonth = this.filter.date
        ? {
            year: Number(this.filter.date.slice(0, 4)),
            month: Number(this.filter.date.slice(5, 7)) - 1,
          }
        : null;
      const shown =
        this.calendarDisplay ??
        activeCalendarMonth ?? {
          year: new Date().getFullYear(),
          month: new Date().getMonth(),
        };
      renderCalendar(content, memos, {
        activeDate: this.filter.date,
        onMonthChange: (year, month) => {
          this.calendarDisplay = { year, month };
        },
        onPickDate: (d) => {
          this.calendarDisplay = {
            year: Number(d.slice(0, 4)),
            month: Number(d.slice(5, 7)) - 1,
          };
          this.filter.date = this.filter.date === d ? null : d;
          this.filter.preset = "all";
          this.pageLimit = this.getInitialPageLimit();
          this.renderList();
        },
      }, shown.year, shown.month);
    } else {
      // v2.1.0: 宠物视图
      this.renderBuddyView(content, memos);
    }
  }

  /** v2.1.0: 渲染宠物视图（首次未孵化时显示蛋 + 起名输入框） */
  private renderBuddyView(parent: HTMLElement, memos: Memo[]): void {
    const data = this.settings.buddy;
    if (!data) {
      // 未孵化 → 显示蛋
      renderEgg(parent, (chosenName) => {
        void (async () => {
        const vaultName = this.app.vault.getName();
        const hatched = hatch(vaultName, chosenName);
        // 把 HatchedBuddy 持久化为 BuddyData
        this.settings.buddy = {
          species: hatched.species,
          rarity: hatched.rarity,
          eye: hatched.eye,
          hat: hatched.hat,
          shiny: hatched.shiny,
          name: hatched.name,
          hatchedAt: hatched.hatchedAt,
          seed: hatched.seed,
        };
        await this.plugin.saveSettings();
        // v2.1.0-iter10: 标记"刚孵化"——下一次 renderSidebar 时给宠物卡加
        //   .is-just-hatched class，触发"破壳而出"动画。后续再切视图就不会再播放。
        this.buddyJustHatched = true;
        this.renderSidebar();
        })().catch((err) => {
          console.error("[Memoria] Failed to hatch buddy:", err);
        });
      });
      return;
    }

    // 已孵化 → 渲染宠物
    const buddy: HatchedBuddy = {
      species: data.species as HatchedBuddy["species"],
      rarity: data.rarity as HatchedBuddy["rarity"],
      eye: data.eye as HatchedBuddy["eye"],
      hat: data.hat as HatchedBuddy["hat"],
      shiny: data.shiny,
      name: data.name,
      hatchedAt: data.hatchedAt,
      seed: data.seed,
    };
    // v2.1.0-iter6: 气泡文案只在"真正有意义的时机"重算 —— 见 buddyQuipCache 注释。
    //   触发重算条件：cache 为 null（首次打开 view）或笔记总数增加（用户新写了笔记）
    const memoCountIncreased =
      this.buddyLastMemoCount >= 0 && memos.length > this.buddyLastMemoCount;
    if (this.buddyQuipCache === null || memoCountIncreased) {
      this.buddyQuipCache = pickQuip(buddy, memos);
    }
    this.buddyLastMemoCount = memos.length;
    // v2.1.0-iter10: 注入重命名回调 + 刚孵化标记
    //   故意不提供"重置/重抽"功能 —— 宠物长啥样是命中注定的，这才是真正的陪伴感。
    //   名字可以改（取错了是真痛点），外观一旦孵化就锁死。
    const justHatched = this.buddyJustHatched;
    this.buddyJustHatched = false; // 标记"消费"掉，后续切视图不再播动画
    renderBuddy(parent, buddy, memos, this.buddyQuipCache, {
      onRename: () => {
        void this.openBuddyRename(buddy.name).catch((err) => {
          console.error("[Memoria] Failed to rename buddy:", err);
        });
      },
      justHatched,
    });
  }

  /** v2.1.0-iter10: 双击宠物名打开重命名弹窗 */
  private async openBuddyRename(currentName: string): Promise<void> {
    const newName = await this.promptAsync(t("buddy.rename.title"), currentName);
    if (newName === null) return; // 取消
    const trimmed = newName.trim();
    if (!trimmed || trimmed === currentName) return; // 空或没改
    if (!this.settings.buddy) return;
    this.settings.buddy.name = trimmed.slice(0, 20); // 同 maxlength
    await this.plugin.saveSettings();
    this.renderSidebar();
  }

  /** v2.1.0-iter10: 异步输入弹窗（基于 confirmAsync 改造）—— 比浏览器原生 prompt() 不劫持焦点 */
  private promptAsync(title: string, defaultValue: string): Promise<string | null> {
    return new Promise((resolve) => {
      const backdrop = activeDocument.body.createDiv({ cls: "memoria-modal-backdrop" });
      const box = backdrop.createDiv({ cls: "memoria-modal memoria-confirm" });
      box.createDiv({ cls: "memoria-modal-title", text: title });
      const input = box.createEl("input", {
        cls: "memoria-buddy-egg-input",
        attr: { type: "text", maxlength: "20", value: defaultValue },
      });
      const btns = box.createDiv({ cls: "memoria-modal-btns" });
      const cancel = btns.createEl("button", { text: t("buddy.rename.cancel") });
      const ok = btns.createEl("button", {
        text: t("buddy.rename.save"),
        cls: "mod-cta",
      });

      let settled = false;
      let pendingMouseUp: ((ev: MouseEvent) => void) | null = null;
      const cleanup = () => {
        if (pendingMouseUp) {
          activeDocument.removeEventListener("mouseup", pendingMouseUp, true);
          pendingMouseUp = null;
        }
      };
      this.register(() => {
        if (settled) return;
        settled = true;
        backdrop.remove();
        activeDocument.removeEventListener("keydown", onKey, true);
        cleanup();
        window.setTimeout(() => resolve(null), 0);
      });
      const close = (result: string | null) => {
        if (settled) return;
        settled = true;
        backdrop.remove();
        activeDocument.removeEventListener("keydown", onKey, true);
        cleanup();
        window.setTimeout(() => resolve(result), 0);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close(null);
        } else if (e.key === "Enter") {
          e.preventDefault();
          close(input.value);
        }
      };
      cancel.addEventListener("click", () => close(null));
      ok.addEventListener("click", () => close(input.value));
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target !== backdrop) return;
        cleanup();
        const up = (ev: MouseEvent) => {
          activeDocument.removeEventListener("mouseup", up, true);
          pendingMouseUp = null;
          if (ev.target === backdrop) close(null);
        };
        pendingMouseUp = up;
        activeDocument.addEventListener("mouseup", up, true);
      });
      activeDocument.addEventListener("keydown", onKey, true);
      // 自动聚焦 + 全选（方便直接覆盖）
      window.setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    });
  }

  /**
   * v1.4.0 → v1.4.1: 每日打卡进度条 + 右侧靶心 + 视图切换按钮
   *
   * 布局（参考 Thino）：
   *   [═══════ 进度条 ═══════]  ⊙  📅
   *   └── 点击跳"今天"  hover tooltip  切换热力图↔月历
   *
   * 达成目标首次 Notice："今日打卡完成 🎉"（同一天只弹一次）
   */
  private renderDailyGoal(parent: HTMLElement, memos: Memo[]): void {
    const goal = Math.max(1, this.settings.dailyGoal || 5);
    const todayStr = fmtDateLocal(new Date());
    let todayCount = 0;
    for (const m of memos) {
      if (m.date === todayStr) todayCount++;
    }
    const pct = Math.min(100, Math.round((todayCount / goal) * 100));
    const isDone = todayCount >= goal;

    // 首次达成目标 → 弹 Notice（当天只弹一次）
    if (isDone && this.dailyGoalNoticedDate !== todayStr) {
      this.dailyGoalNoticedDate = todayStr;
      // 延迟一点让 Notice 显示在侧栏渲染完成之后（避免和初始化的其他 Notice 挤在一起）
      window.setTimeout(() => {
        new Notice(t("notice.dailyGoalDone", { n: todayCount }));
      }, 200);
    }
    // 如果当天还没达成，但 noticedDate 是今天，不重置（可能是用户手动删了条笔记，不必再提醒）
    // 但如果 noticedDate 是昨天或更早，允许清空（新的一天重新来）
    if (this.dailyGoalNoticedDate && this.dailyGoalNoticedDate !== todayStr) {
      this.dailyGoalNoticedDate = null;
    }

    // v1.4.2: 进度条和靶心共用同一条 tooltip 文案
    const goalTooltip = isDone
      ? t("list.dailyGoalExceed", {
          goal,
          done: todayCount,
          extra: todayCount - goal,
        })
      : t("list.dailyGoalDone", { goal, done: todayCount });

    // 外层 row：进度条 + 右侧图标组
    const row = parent.createDiv({
      cls: `memoria-daily-goal-row${isDone ? " is-done" : ""}`,
    });

    // 进度条（可点击跳今天视图）
    const barWrap = row.createDiv({
      cls: "memoria-daily-goal",
      attr: {
        // v1.4.2: 只用 aria-label（Obsidian 会转成气泡），删掉 title 避免双层 tooltip
        "aria-label": goalTooltip,
      },
    });
    barWrap.addEventListener("click", () => {
      this.filter.preset = "today";
      this.filter.tag = null;
      this.filter.date = null;
      this.pageLimit = this.getInitialPageLimit();
      this.renderAll();
    });
    const bar = barWrap.createDiv({ cls: "memoria-daily-goal-bar" });
    const fill = bar.createDiv({ cls: "memoria-daily-goal-fill" });
    fill.style.width = `${pct}%`;

    // 右侧图标组
    const actions = row.createDiv({ cls: "memoria-daily-goal-actions" });

    // v1.4.2: 图标从 target（圆形甜甜圈）换成 crosshair（十字准星，辨识度更高且不像甜甜圈）
    const targetBtn = actions.createEl("button", {
      cls: "memoria-icon-btn memoria-daily-goal-target",
      attr: {
        "aria-label": goalTooltip,
      },
    });
    setIcon(targetBtn, "crosshair");
    targetBtn.addEventListener("click", (e) => e.preventDefault());

    // 视图切换（热力图 → 月历 → 宠物 → 热力图 ... 三态循环）
    // v2.1.0: 加入 buddy 第三态。按钮 icon 显示"下一个状态"的 icon，aria-label 描述将切到的目标
    const nextMode: "heatmap" | "calendar" | "buddy" =
      this.overviewMode === "heatmap"
        ? "calendar"
        : this.overviewMode === "calendar"
        ? "buddy"
        : "heatmap";
    const nextIcon =
      nextMode === "calendar"
        ? "calendar"
        : nextMode === "buddy"
        ? "paw-print"
        : "activity";
    const nextLabelKey =
      nextMode === "calendar"
        ? "toolbar.toCalendar"
        : nextMode === "buddy"
        ? "toolbar.toBuddy"
        : "toolbar.toHeatmap";

    const switchBtn = actions.createEl("button", {
      cls: "memoria-icon-btn memoria-daily-goal-switch",
      attr: {
        "aria-label": t(nextLabelKey),
      },
    });
    setIcon(switchBtn, nextIcon);
    switchBtn.addEventListener("click", () => {
      this.overviewMode = nextMode;
      // v2.0.20: 标记用户已手动切换过 → 当前会话锁定，不再跟随设置默认值
      this.overviewModeOverridden = true;
      this.renderSidebar();
    });
  }

  private renderHeatmap(parent: HTMLElement, memos: Memo[]): void {
    const weeks = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const curDow = today.getDay();
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() - curDow);
    const startSunday = new Date(endSunday);
    startSunday.setDate(endSunday.getDate() - (weeks - 1) * 7);

    const dayMap = new Map<string, number>();
    for (const m of memos) dayMap.set(m.date, (dayMap.get(m.date) ?? 0) + 1);

    const grid = parent.createDiv({ cls: "memoria-heatmap" });
    for (let w = 0; w < weeks; w++) {
      const col = grid.createDiv({ cls: "memoria-heatmap-col" });
      for (let d = 0; d < 7; d++) {
        const day = new Date(startSunday);
        day.setDate(startSunday.getDate() + w * 7 + d);
        const key = fmtDateLocal(day);
        const count = dayMap.get(key) ?? 0;
        const level =
          count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
        const cell = col.createDiv({
          cls: `memoria-heatmap-cell level-${level}`,
        });
        if (day > today) cell.addClass("future");
        // v2.0.0: 热力图 hover 增强 —— 显示那天的首条笔记预览
        // v2.0.4: 有笔记的格子不设原生 title（否则会和自定义 tooltip 重叠）；
        //   空格子用原生 title 只显示"日期 0 memos"，便宜又安静
        if (count > 0) {
          const dayMemos = memos.filter((m) => m.date === key);
          cell.addEventListener("mouseenter", () => {
            this.showHeatmapTooltip(cell, key, dayMemos);
          });
          cell.addEventListener("mouseleave", () => {
            this.hideHeatmapTooltip();
          });
          // 点击跳到那天
          cell.addEventListener("click", () => {
            this.calendarDisplay = {
              year: Number(key.slice(0, 4)),
              month: Number(key.slice(5, 7)) - 1,
            };
            this.filter.date = key;
            this.filter.preset = "all";
            this.renderList();
          });
          cell.addClass("memoria-clickable");
        } else {
          cell.setAttr(
            "title",
            `${key}  ${t("list.totalCount", { n: count })}`
          );
        }
      }
    }
  }

  /** v2.0.0: 热力图格子的 hover tooltip（含那天的笔记数 + 首条预览） */
  private heatmapTooltipEl: HTMLElement | null = null;
  private showHeatmapTooltip(
    anchor: HTMLElement,
    dateKey: string,
    memos: Memo[]
  ): void {
    this.hideHeatmapTooltip();
    const tip = activeDocument.body.createDiv({ cls: "memoria-heatmap-tooltip" });
    const head = tip.createDiv({ cls: "memoria-heatmap-tooltip-head" });
    head.createSpan({ text: dateKey });
    head.createSpan({
      cls: "memoria-heatmap-tooltip-count",
      text: t("list.totalCount", { n: memos.length }),
    });
    // 首条 + 最多 2 条预览
    const preview = memos.slice(0, 2);
    for (const m of preview) {
      const row = tip.createDiv({ cls: "memoria-heatmap-tooltip-row" });
      row.createSpan({ cls: "memoria-heatmap-tooltip-time", text: m.time });
      // 取前 50 字的纯内容（剥掉标签和图片语法）
      const imgTag = t("list.imageHolder");
      const snippet = m.content
        .replace(/!\[[^\]]*\]\([^)]+\)/g, imgTag)
        .replace(/!\[\[[^\]]+\]\]/g, imgTag)
        .replace(/#[^\s#]+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 50);
      row.createSpan({
        cls: "memoria-heatmap-tooltip-text",
        text: snippet || t("list.noText"),
      });
    }
    if (memos.length > 2) {
      tip.createDiv({
        cls: "memoria-heatmap-tooltip-more",
        text: t("list.heatmapMore", { n: memos.length - 2 }),
      });
    }

    // 定位：在格子右上方显示，视口边缘防溢出
    const rect = anchor.getBoundingClientRect();
    tip.setCssStyles({
      position: "fixed",
      left: Math.min(rect.right + 8, window.innerWidth - 280) + "px",
      top: Math.max(8, rect.top - 4) + "px",
      zIndex: "1000",
    });
    this.heatmapTooltipEl = tip;
  }
  private hideHeatmapTooltip(): void {
    if (this.heatmapTooltipEl) {
      this.heatmapTooltipEl.remove();
      this.heatmapTooltipEl = null;
    }
  }

  private buildTagTree(counts: Map<string, number>): TagNode {
    const root: TagNode = {
      name: "",
      full: "",
      count: 0,
      self: 0,
      children: new Map(),
    };
    for (const [tag, c] of counts) {
      const parts = tag.split("/");
      let node = root;
      let acc = "";
      for (const p of parts) {
        acc = acc ? `${acc}/${p}` : p;
        if (!node.children.has(p)) {
          node.children.set(p, {
            name: p,
            full: acc,
            count: 0,
            self: 0,
            children: new Map(),
          });
        }
        node = node.children.get(p)!;
      }
      node.self += c;
    }
    this.sumTag(root);
    return root;
  }

  private sumTag(node: TagNode): number {
    let total = node.self;
    for (const c of node.children.values()) total += this.sumTag(c);
    node.count = total;
    return total;
  }

  private renderTagTree(
    parent: HTMLElement,
    node: TagNode,
    depth: number
  ): void {
    const children = [...node.children.values()].sort(
      (a, b) => b.count - a.count
    );
    for (const c of children) {
      // Bug fix (v1.1.2): 之前子节点 renderTagTree 的 parent 传的是顶层 sidebarEl，
      //   导致深层标签（如 #A/B/C）全部挤在列表末尾，视觉嵌套关系错乱。
      //   现在给每个节点套一个 wrap，子节点渲染到 wrap 里紧跟父节点下方。
      const wrap = parent.createDiv({ cls: "memoria-tag-node" });
      const el = wrap.createDiv({
        cls:
          "memoria-nav-item memoria-tag-item" +
          (this.filter.tag === c.full ? " active" : ""),
      });
      el.style.paddingLeft = `${12 + depth * 14}px`;
      const icon = el.createDiv({ cls: "memoria-nav-icon" });
      icon.setText("#");
      el.createSpan({ cls: "memoria-nav-text", text: c.name });
      el.createSpan({ cls: "memoria-nav-count", text: String(c.count) });
      el.addEventListener("click", () => {
        this.filter.tag = this.filter.tag === c.full ? null : c.full;
        this.filter.preset = "all";
        this.pageLimit = this.getInitialPageLimit();
        this.renderAll();
      });
      if (c.children.size) this.renderTagTree(wrap, c, depth + 1);
    }
  }

  // ====================== 过滤逻辑 ======================


  private applyReviewFilters(memos: Memo[]): Memo[] {
    const rf = this.reviewFilters;
    let result = memos;

    if (rf.year) result = result.filter((m) => m.date.startsWith(rf.year));

    if (rf.tag) {
      result = result.filter((m) =>
        m.tags.some((tag) => tag === rf.tag || tag.startsWith(rf.tag + "/"))
      );
    }

    if (rf.type === "starred") result = result.filter((m) => m.isStarred);
    else if (rf.type === "pinned") result = result.filter((m) => m.isPinned);
    else if (rf.type === "with-image") result = result.filter((m) => m.hasImage);
    else if (rf.type === "todo") result = result.filter((m) => m.hasOpenTask);

    const keyword = rf.keyword.trim().toLocaleLowerCase();
    if (keyword) {
      result = result.filter((m) => {
        const contentHit = m.content.toLocaleLowerCase().includes(keyword);
        const tagHit = m.tags.some((tag) => tag.toLocaleLowerCase().includes(keyword));
        return contentHit || tagHit || m.date.includes(keyword);
      });
    }

    return result;
  }

  private getReviewFilterPoolCount(): number {
    return this.applyReviewFilters(this.getBaseFilteredMemos()).length;
  }

  private renderReviewToolbar(parent: HTMLElement): void {
    const bar = parent.createDiv({ cls: "memoria-review-toolbar" });

    const makeSelect = <T extends string>(
      label: string,
      value: T,
      options: Array<{ value: T; label: string }>,
      onChange: (value: T) => void
    ): void => {
      const wrap = bar.createDiv({ cls: "memoria-review-control" });
      const selectWrap = wrap.createDiv({ cls: "memoria-review-select-wrap" });
      const select = selectWrap.createEl("select", {
        cls: "memoria-review-select",
        attr: { "aria-label": label },
      });
      const chevron = selectWrap.createDiv({ cls: "memoria-review-select-icon" });
      setIcon(chevron, "chevron-down");
      for (const option of options) {
        select.createEl("option", {
          text: option.label,
          attr: { value: option.value },
        });
      }
      select.value = value;
      select.addEventListener("change", () => {
        onChange(select.value as T);
        this.filter.preset = "random";
        this.filter.randomSeed = Date.now();
        this.pageLimit = this.getInitialPageLimit();
        this.renderList();
      });
    };

    const memos = this.store.getAll();
    const years = Array.from(new Set(memos.map((m) => m.date.substring(0, 4))))
      .sort((a, b) => (a < b ? 1 : -1));
    const tags = Array.from(
      new Set(memos.flatMap((m) => m.tags.filter((tag) => !RESERVED_TAGS.has(tag))))
    ).sort((a, b) => a.localeCompare(b));

    makeSelect<string>(
      t("review.filter.year"),
      this.reviewFilters.year,
      [
        { value: "", label: t("review.filter.allYears") },
        ...years.map((year) => ({ value: year, label: year })),
      ],
      (value) => {
        this.reviewFilters.year = value;
      }
    );

    makeSelect<string>(
      t("review.filter.tag"),
      this.reviewFilters.tag,
      [
        { value: "", label: t("review.filter.allTags") },
        ...tags.map((tag) => ({ value: tag, label: `#${tag}` })),
      ],
      (value) => {
        this.reviewFilters.tag = value;
      }
    );

    makeSelect<ReviewTypeFilter>(
      t("review.filter.type"),
      this.reviewFilters.type,
      [
        { value: "all", label: t("review.type.all") },
        { value: "starred", label: t("review.type.starred") },
        { value: "pinned", label: t("review.type.pinned") },
        { value: "with-image", label: t("review.type.withImage") },
        { value: "todo", label: t("review.type.todo") },
      ],
      (value) => {
        this.reviewFilters.type = value;
      }
    );

    const keywordWrap = bar.createDiv({ cls: "memoria-review-control memoria-review-keyword" });
    const keywordBox = keywordWrap.createDiv({ cls: "memoria-review-search-wrap" });
    const keywordIcon = keywordBox.createDiv({ cls: "memoria-review-search-icon" });
    setIcon(keywordIcon, "search");
    const keywordInput = keywordBox.createEl("input", {
      cls: "memoria-review-input",
      attr: {
        type: "text",
        placeholder: t("review.keyword.placeholder"),
        "aria-label": t("review.filter.keyword"),
      },
    });
    keywordInput.value = this.reviewFilters.keyword;
    let isComposingKeyword = false;
    const applyKeywordNow = () => {
      const cursor = keywordInput.selectionStart ?? keywordInput.value.length;
      this.reviewFilters.keyword = keywordInput.value.trim();
      this.filter.preset = "random";
      this.filter.randomSeed = Date.now();
      this.pageLimit = this.getInitialPageLimit();
      this.renderList();
      const nextInput = this.listEl.querySelector<HTMLInputElement>(".memoria-review-input");
      nextInput?.focus();
      nextInput?.setSelectionRange(cursor, cursor);
    };
    const applyKeyword = debounce(() => {
      if (!isComposingKeyword) applyKeywordNow();
    }, 180);
    keywordInput.addEventListener("compositionstart", () => {
      isComposingKeyword = true;
    });
    keywordInput.addEventListener("compositionend", () => {
      isComposingKeyword = false;
      applyKeywordNow();
    });
    keywordInput.addEventListener("input", () => {
      if (!isComposingKeyword) applyKeyword();
    });

    const actions = bar.createDiv({ cls: "memoria-review-actions" });
    const rerollBtn = actions.createEl("button", { cls: "memoria-meta-btn" });
    setIcon(rerollBtn.createSpan(), "shuffle");
    rerollBtn.createSpan({ text: t("meta.reroll") });
    rerollBtn.addEventListener("click", () => {
      this.filter.preset = "random";
      this.filter.randomSeed = Date.now();
      this.renderList();
    });

    const resetBtn = actions.createEl("button", { cls: "memoria-meta-btn" });
    setIcon(resetBtn.createSpan(), "rotate-ccw");
    resetBtn.createSpan({ text: t("review.filter.reset") });
    resetBtn.addEventListener("click", () => {
      this.reviewFilters = { tag: "", year: "", type: "all", keyword: "" };
      this.filter.randomSeed = Date.now();
      this.renderList();
    });

    const backBtn = actions.createEl("button", { cls: "memoria-meta-btn" });
    setIcon(backBtn.createSpan(), "history");
    backBtn.createSpan({ text: t("meta.backToOnThisDay") });
    backBtn.addEventListener("click", () => {
      this.filter.preset = "on-this-day";
      this.renderList();
    });
  }

  private getBaseFilteredMemos(): Memo[] {
    const all = this.store.getAll();

    // v2.0.0: 新的高级搜索语法（兼容旧的"#tag 关键词"）
    //   - 关键词 AND：`量子 工作室`
    //   - 排除词：`-关键词`
    //   - 排除标签：`-#标签`
    //   - 日期：after:2024-01-01 / before:2024-12-31 / date:2024-05
    //   - 标签（前缀匹配）：#工作 能命中 #工作/PUBGM项目
    const query = parseSearchQuery(this.filter.keyword);
    this.currentQuery = query;

    let result = all.filter((memo) => {
      if (this.filter.year && !memo.date.startsWith(this.filter.year))
        return false;
      if (this.filter.date && memo.date !== this.filter.date) return false;

      // 侧栏"标签树"点击的 tag（单个）作为 AND 附加条件合并到 query
      if (this.filter.tag) {
        const hit = memo.tags.some(
          (mt) =>
            mt === this.filter.tag || mt.startsWith(this.filter.tag + "/")
        );
        if (!hit) return false;
      }

      // 高级查询匹配（零筛选条件时直接通过）
      if (
        !matchesQuery(memo.content, memo.tags, memo.date, query)
      ) {
        return false;
      }
      return true;
    });

    const todayStr = fmtDateLocal(new Date());
    if (this.filter.preset === "today") {
      result = result.filter((m) => m.date === todayStr);
    } else if (this.filter.preset === "week") {
      const now = new Date();
      const monday = new Date(now);
      const dow = (now.getDay() + 6) % 7;
      monday.setDate(now.getDate() - dow);
      monday.setHours(0, 0, 0, 0);
      result = result.filter((m) => m.datetime >= monday);
    } else if (this.filter.preset === "on-this-day") {
      // v1.1.7: 过去的今天 —— 往年同月同日（不含今年今天本身）
      const now = new Date();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const mmdd = `${mo}-${day}`;
      result = result.filter(
        (m) => m.date.slice(5) === mmdd && m.date !== todayStr
      );
    } else if (this.filter.preset === "no-tag") {
      result = result.filter(
        (m) => m.tags.filter((t) => !RESERVED_TAGS.has(t)).length === 0
      );
    } else if (this.filter.preset === "with-image") {
      result = result.filter((m) => m.hasImage);
    } else if (this.filter.preset === "with-link") {
      result = result.filter((m) => m.hasLink);
    } else if (this.filter.preset === "pinned") {
      result = result.filter((m) => m.isPinned);
    } else if (this.filter.preset === "starred") {
      result = result.filter((m) => m.isStarred);
    } else if (this.filter.preset === "todo") {
      result = result.filter((m) => m.hasOpenTask);
    }
    return result;
  }


  private getFilteredMemos(): Memo[] {
    let result = this.getBaseFilteredMemos();
    const todayStr = fmtDateLocal(new Date());
    if (this.filter.preset === "random" || this.filter.preset === "on-this-day") {
      result = this.applyReviewFilters(result);
      if (!result.length) return result;
      if (this.settings.enableSmartReview) {
        const todayMemos = this.store.getAll().filter((m) => m.date === todayStr);
        return pickSmartReview(result, {
          count: Math.min(5, result.length),
          todayStr,
          todayMemos,
        });
      }
      const seed = this.filter.randomSeed ?? 1;
      return seededSample(result, Math.min(5, result.length), seed);
    }
    return result;
  }
  private renderList(): void {
    this.listEl.empty();
    this.childComponent.unload();
    this.childComponent = new Component();
    this.childComponent.load();

    // v2.0.0: 根据 settings.density 切换紧凑/宽松 class
    this.listEl.toggleClass("is-compact", this.settings.density === "compact");

    // v2.0.13: filter.tag 变化时同步 placeholder 提示
    //   （在 renderList 这个统一入口里调，所有 filter 变更路径都能覆盖）
    this.updateEditBanner();

    const memos = this.getFilteredMemos();

    const meta = this.listEl.createDiv({ cls: "memoria-list-meta" });
    meta.createDiv({
      cls: "memoria-list-meta-left",
      text: this.describeFilter(memos.length),
    });

    // v1.1.19: 回顾页面的辅助按钮
    //   - "on-this-day" 且有结果：显示主副标题说明
    //   - "random" 模式：显示"换一批"
    //   - "on-this-day" 且 empty 时，在 empty state 里给"随机 5 条"跳转
    if (this.filter.preset === "random" || this.filter.preset === "on-this-day") {
      meta.createDiv({
        cls: "memoria-list-meta-right",
        text: t("review.poolCount", { n: this.getReviewFilterPoolCount() }),
      });
      this.renderReviewToolbar(this.listEl);
    }
    if (memos.length === 0) {
      const empty = this.listEl.createDiv({ cls: "memoria-empty" });
      // v1.1.19: 在"回顾-每日"模式下给随机 5 条的跳转，避免死页面
      if (this.filter.preset === "on-this-day") {
        empty.createDiv({ cls: "memoria-empty-emoji", text: "🕰️" });
        empty.createDiv({
          cls: "memoria-empty-text",
          text: t("empty.onThisDay"),
        });
        empty.createDiv({
          cls: "memoria-empty-sub",
          text: t("empty.onThisDaySub"),
        });
        const jumpBtn = empty.createEl("button", {
          cls: "memoria-empty-btn",
        });
        setIcon(jumpBtn.createSpan(), "shuffle");
        jumpBtn.createSpan({ text: t("empty.onThisDayBtn") });
        jumpBtn.addEventListener("click", () => {
          this.filter.preset = "random";
          this.filter.randomSeed = Date.now();
          this.renderList();
        });
        return;
      }
      // v1.5.0: "待办"视图的友好 empty state —— 所有待办都已勾完才是最棒的结局
      if (this.filter.preset === "todo") {
        empty.createDiv({ cls: "memoria-empty-emoji", text: "🎉" });
        empty.createDiv({
          cls: "memoria-empty-text",
          text: t("empty.todo"),
        });
        empty.createDiv({
          cls: "memoria-empty-sub",
          text: t("empty.todoSub"),
        });
        return;
      }
      empty.createDiv({ cls: "memoria-empty-emoji", text: "📭" });
      empty.createDiv({
        cls: "memoria-empty-text",
        text: t("empty.default"),
      });
      empty.createDiv({
        cls: "memoria-empty-sub",
        text: t("empty.defaultSub"),
      });
      return;
    }

    // 分离置顶笔记和其他笔记
    const visible = memos.slice(0, this.pageLimit);
    const pinnedMemos = visible.filter((m) => m.isPinned);
    const normalMemos = visible.filter((m) => !m.isPinned);

    // 1) 先渲染"置顶"分组（不分日期，所有置顶一起）
    if (pinnedMemos.length) {
      const pinGroup = this.listEl.createDiv({
        cls: "memoria-day-group memoria-pin-group",
      });
      const pinHead = pinGroup.createDiv({
        cls: "memoria-day-head memoria-pin-head",
      });
      const pinIcon = pinHead.createSpan({ cls: "memoria-pin-head-icon" });
      setIcon(pinIcon, "pin");
      pinHead.createSpan({ text: t("list.pinnedHead", { n: pinnedMemos.length }) });
      for (const m of pinnedMemos) this.renderMemoCard(pinGroup, m);
    }

    // 2) 普通笔记按天分组
    const groups = new Map<string, Memo[]>();
    for (const m of normalMemos) {
      const arr = groups.get(m.date) ?? [];
      arr.push(m);
      groups.set(m.date, arr);
    }

    // v1.1.14: 把 today / yesterday 字符串计算移到循环外（原来每个日期组都
    //   会 new Date() 两次 + fmtDateLocal() 一次，对 600+ 个日期组会产生 1200+ 次冗余对象构造）
    // v2.0.3: 视图层的周几标签走 i18n（md 文件里依然是中文「周五」不变）
    const todayStr = fmtDateLocal(new Date());
    const ydDate = new Date();
    ydDate.setDate(ydDate.getDate() - 1);
    const yesterdayStr = fmtDateLocal(ydDate);

    for (const [date, list] of groups) {
      const group = this.listEl.createDiv({ cls: "memoria-day-group" });
      // v2.0.3: 给分组标记日期 dataset，方便增量追加时识别"是否可合并到这个 group"
      group.dataset.date = date;
      const head = group.createDiv({ cls: "memoria-day-head" });
      const d = new Date(date + "T00:00:00");
      const wd = t(`weekday.${d.getDay()}`);
      let label = `${date}  ${wd}`;
      if (date === todayStr) label = `${t("date.today")}  ${wd}`;
      else if (date === yesterdayStr) label = `${t("date.yesterday")}  ${wd}`;
      head.setText(label);
      for (const m of list) this.renderMemoCard(group, m);
    }

    if (this.pageLimit < memos.length) {
      const more = this.listEl.createDiv({ cls: "memoria-load-more" });
      more.setText(t("list.loadMore", { n: memos.length - this.pageLimit }));
    }
  }

  /**
   * v2.0.3: 增量追加更多笔记，避免 renderList 全清重建带来的滚动闪烁。
   *
   * 问题背景：
   *   原实现滚动到底时调用 renderList() → listEl.empty() → 全部重建。
   *   用户看到视野内的卡片被销毁一瞬间再重新渲染，像"跳一下"。
   *
   * 新实现：
   *   1. 移除旧的 "load-more" 提示和 empty 占位（如果有）
   *   2. 从 memos[prevLimit..newLimit] 取切片，按日期分组追加到 listEl 末尾
   *   3. 如果新切片第一天的日期 === listEl 里最后一个 day-group 的日期 →
   *      **把那一天的剩余 memo 追加到已有 group**（不新建 day-head）
   *   4. 之后每个新日期都建新 day-group
   *   5. 最后加回 "load-more" 提示（如果还有更多）
   *
   * 限制：
   *   - 只用于"普通分组"的追加。置顶分组不参与分页（永远一次性渲染在顶）。
   *   - filter.preset === "random" 时禁用（随机列表不分页）。
   */
  private appendMoreMemos(
    allMemos: Memo[],
    prevLimit: number,
    newLimit: number
  ): void {
    // 移除旧的 load-more 提示和 empty
    const oldMore = this.listEl.querySelector(".memoria-load-more");
    oldMore?.remove();
    const oldEmpty = this.listEl.querySelector(".memoria-empty");
    oldEmpty?.remove();

    // 取新切片；只考虑"非置顶"部分（置顶已经一次性渲染在顶上）
    const slice = allMemos.slice(prevLimit, newLimit).filter((m) => !m.isPinned);
    if (slice.length === 0) return;

    // 按日期分组
    const groups = new Map<string, Memo[]>();
    for (const m of slice) {
      const arr = groups.get(m.date) ?? [];
      arr.push(m);
      groups.set(m.date, arr);
    }

    const todayStr = fmtDateLocal(new Date());
    const ydDate = new Date();
    ydDate.setDate(ydDate.getDate() - 1);
    const yesterdayStr = fmtDateLocal(ydDate);

    // 找到当前列表最后一个 day-group，取其日期（通过 data 属性反查不方便，
    // 我们靠"第一个新日期"是否等于最后一个已渲染 group 的日期）
    const allGroups = this.listEl.querySelectorAll<HTMLElement>(
      ".memoria-day-group:not(.memoria-pin-group)"
    );
    const lastGroup =
      allGroups.length > 0 ? allGroups[allGroups.length - 1] : null;
    const lastGroupDate = lastGroup?.dataset.date ?? null;

    let isFirstGroup = true;
    for (const [date, list] of groups) {
      // 如果第一个新日期 === 最后一个已渲染 group 的日期 → 合并进去
      if (isFirstGroup && lastGroup && date === lastGroupDate) {
        for (const m of list) this.renderMemoCard(lastGroup, m);
      } else {
        const group = this.listEl.createDiv({ cls: "memoria-day-group" });
        group.dataset.date = date;
        const head = group.createDiv({ cls: "memoria-day-head" });
        const d = new Date(date + "T00:00:00");
        const wd = t(`weekday.${d.getDay()}`);
        let label = `${date}  ${wd}`;
        if (date === todayStr) label = `${t("date.today")}  ${wd}`;
        else if (date === yesterdayStr) label = `${t("date.yesterday")}  ${wd}`;
        head.setText(label);
        for (const m of list) this.renderMemoCard(group, m);
      }
      isFirstGroup = false;
    }

    // 重新加 load-more 提示（如果还有）
    if (this.pageLimit < allMemos.length) {
      const more = this.listEl.createDiv({ cls: "memoria-load-more" });
      more.setText(t("list.loadMore", { n: allMemos.length - this.pageLimit }));
    }
  }

  private describeFilter(n: number): string {
    const parts: string[] = [];
    // v2.0.17-iter17: 给右侧顶部所有 preset 都补上 emoji 前缀（之前只有
    //   pinned / starred / on-this-day / random 4 项有 —— 它们是从
    //   list.preset* 的 i18n key 里自带带的）。其余 today / week / todo /
    //   noTag / withImage / withLink 直接读 sidebar.* 文案，是纯文字，看上去
    //   "光秃秃"。这里在拼标题时手动补 emoji，让头部视觉风格统一。
    //   故意不写到 i18n 文案里 —— 侧栏继续保持 lucide 图标 + 纯文字的极简风，
    //   emoji 只用在右侧"当前筛选状态"的醒目标题上。
    const presetMap: Record<string, string> = {
      today: `☀️ ${t("sidebar.today")}`,
      week: `🗓️ ${t("sidebar.week")}`,
      // v1.1.19: 两个"回顾"合并为一个入口，但内部仍有两种视图（每日/随机）
      random: t("list.presetRandom"),
      "on-this-day": t("list.presetOnThisDay"),
      "no-tag": `🏷️ ${t("sidebar.noTag")}`,
      "with-image": `🖼️ ${t("sidebar.withImage")}`,
      "with-link": `🔗 ${t("sidebar.withLink")}`,
      pinned: t("list.presetPinned"),
      starred: t("list.presetStarred"),
      todo: `✅ ${t("sidebar.todo")}`,
    };
    if (this.filter.preset !== "all") parts.push(presetMap[this.filter.preset]);
    if (this.filter.year) parts.push(this.filter.year);
    if (this.filter.date) parts.push(`📅 ${this.filter.date}`);
    if (this.filter.tag) parts.push(`#${this.filter.tag}`);
    if (this.filter.keyword) parts.push(`「${this.filter.keyword}」`);
    const prefix = parts.length ? parts.join(" · ") + " · " : "";
    return `${prefix}${t("list.totalCount", { n })}`;
  }

  private renderMemoCard(parent: HTMLElement, memo: Memo): void {
    // v2.0.0: 如果开了情感色彩，给卡片加 mood class（卡片左边色条由 CSS 处理）
    let moodCls = "";
    if (this.settings.enableMoodColoring) {
      const mood = detectMood(memo.content);
      if (mood !== "neutral") moodCls = " " + moodClass(mood);
    }
    const card = parent.createDiv({
      cls:
        "memoria-card" +
        (memo.isPinned ? " is-pinned" : "") +
        (memo.isStarred ? " is-starred" : "") +
        (this.editingMemo === memo ? " is-editing" : "") +
        moodCls,
    });
    // 双击卡片进入编辑模式
    card.addEventListener("dblclick", (e) => {
      // 避免双击图片/链接时误触
      const target = e.target as HTMLElement;
      if (target.closest(".memoria-img-cell")) return;
      if (target.tagName === "A") return;
      this.enterEditMode(memo);
    });

    // v1.4.11: 移动端没有 dblclick，改用长按 500ms 触发编辑。
    //   避开图片/链接/复选框/按钮（这些自己有手势语义）。
    //   正常点击/拖拽不会触发（pointermove 超过 6px 直接取消）。
    if (Platform.isMobile) {
      let pressTimer: number | null = null;
      let startX = 0;
      let startY = 0;
      const cancel = () => {
        if (pressTimer !== null) {
          window.clearTimeout(pressTimer);
          pressTimer = null;
        }
      };
      card.addEventListener("pointerdown", (e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(".memoria-img-cell") ||
          t.closest("a") ||
          t.closest("button") ||
          t.closest('input[type="checkbox"]')
        ) {
          return;
        }
        startX = e.clientX;
        startY = e.clientY;
        pressTimer = window.setTimeout(() => {
          pressTimer = null;
          this.enterEditMode(memo);
        }, 500);
      });
      card.addEventListener("pointermove", (e) => {
        if (pressTimer === null) return;
        if (
          Math.abs(e.clientX - startX) > 6 ||
          Math.abs(e.clientY - startY) > 6
        ) {
          cancel();
        }
      });
      card.addEventListener("pointerup", cancel);
      card.addEventListener("pointercancel", cancel);
      card.addEventListener("pointerleave", cancel);
    }

    const head = card.createDiv({ cls: "memoria-card-head" });
    const timeWrap = head.createDiv({ cls: "memoria-card-time-wrap" });
    if (memo.isPinned) {
      const pinIcon = timeWrap.createSpan({ cls: "memoria-card-pin" });
      setIcon(pinIcon, "pin");
      pinIcon.setAttr("aria-label", t("card.pinnedMark"));
    }
    if (memo.isStarred) {
      const starIcon = timeWrap.createSpan({ cls: "memoria-card-star" });
      setIcon(starIcon, "star");
      starIcon.setAttr("aria-label", t("card.starredMark"));
    }
    timeWrap.createSpan({
      cls: "memoria-card-time",
      text: `${memo.date} ${memo.time}`,
    });

    const actions = head.createDiv({ cls: "memoria-card-actions" });
    // v1.1.19: 引用 —— hover 时次级可见（原来藏在 ⋯ 菜单里第 4 项，发现率太低）
    const quoteBtn = actions.createEl("button", {
      cls: "memoria-icon-btn memoria-card-quote",
      attr: { "aria-label": t("toolbar.quote") },
    });
    setIcon(quoteBtn, "quote");
    quoteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.quoteMemo(memo);
    });

    const menuBtn = actions.createEl("button", {
      cls: "memoria-icon-btn",
      attr: { "aria-label": t("toolbar.more") },
    });
    setIcon(menuBtn, "more-horizontal");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showMemoMenu(e, memo);
    });

    // 1) 先把所有 #tag 剥离
    const { text: textNoTags, tags } = this.stripTags(memo.content);
    // 2) 再把所有图片引用剥离
    const { text: textForMd, images } = extractImages(
      this.app,
      textNoTags,
      memo.file
    );

    // v1.3.5: 移除字数徽章 —— 碎片笔记不应鼓励字数统计，且容易让用户有"内容太长"的心理压力。
    //   折叠功能已经提供了"笔记长度"的直观感知。参考 flomo / 微信朋友圈，它们都不显示字数。

    // 3) 渲染纯文本部分
    if (textForMd.trim()) {
      const body = card.createDiv({ cls: "memoria-card-body" });
      // 预处理：给块级语法前后补空行，让 MarkdownRenderer 能正确识别
      // 代码块/表格/callout/标题/分隔线 这些不补空行的话渲染会出错
      const normalizedMd = normalizeForRender(textForMd);
      // v1.4.11: HTML 缓存优先 —— 内容没变过的卡片直接复用 HTML 片段，
      //   避免 MarkdownRenderer.render 每次都走完整渲染管线。
      //   cache key 用 normalizedMd（规范化后的 md）而不是原 textForMd，
      //   这样不同但规范化后等价的内容也能命中。
      // v1.4.15: 缓存值从 innerHTML 字符串改为 DocumentFragment（DOM 克隆）。
      //   命中时 cloneNode(true) 再 appendChild，零 innerHTML 调用，
      //   对 Obsidian 社区插件审核更友好。
      const cacheKey = normalizedMd;
      const cached = this.mdCache.get(cacheKey);
      if (cached !== undefined) {
        body.appendChild(cached.cloneNode(true));
        // LRU：命中后重新插入 map 末尾
        this.mdCache.delete(cacheKey);
        this.mdCache.set(cacheKey, cached);
      } else {
        void MarkdownRenderer.render(
          this.app,
          normalizedMd,
          body,
          memo.file,
          this.childComponent
        ).then(() => {
          // render 是异步的，完成后把当前 body 里的所有子节点克隆一份存到缓存。
          // 用 DocumentFragment 承载（轻量，没有多余包装元素）。
          const frag = activeDocument.createDocumentFragment();
          for (const child of Array.from(body.childNodes)) {
            frag.appendChild(child.cloneNode(true));
          }
          this.mdCache.set(cacheKey, frag);
          if (this.mdCache.size > MemoriaView.MD_CACHE_MAX) {
            // 丢最老的一条（Map 保持插入顺序）
            const first = this.mdCache.keys().next();
            if (!first.done) this.mdCache.delete(first.value);
          }
        }).catch((err) => {
          console.error("[Memoria] Failed to render markdown:", err);
        });
      }
      // 给任务列表复选框接入点击 → 修改原 md
      this.bindTaskCheckboxes(body, memo, textForMd);
      // 给表格外层加可横向滚动容器，避免宽表格撑破卡片
      this.wrapWideTables(body);
      // v1.4.17: 给 [[双链]] 和外链接入点击跳转。
      //   MarkdownRenderer.render 只生成 <a class="internal-link"> 的 DOM，
      //   不自动绑点击事件——我们得用事件委托自己把点击转给 workspace.openLinkText。
      this.bindInternalLinks(body, memo);
      // v2.0.0: 搜索高亮 —— 遍历 body 里所有文本节点，把命中关键词包进 <mark>
      //   只在有搜索词时执行，无搜索词时零开销。
      //   放在 bindInternalLinks 后是因为我们不想高亮 <a> 内部（避免破坏链接）。
      if (this.currentQuery.includeTerms.length > 0) {
        this.highlightSearchTerms(body, this.currentQuery.includeTerms);
      }
    }

    // 4) 渲染图片网格
    if (images.length) {
      renderImageGrid(card, images, (idx) => openLightbox(images, idx));
    }

    // 5) 标签胶囊（过滤保留标签）
    const visibleTags = tags.filter((t) => !RESERVED_TAGS.has(t));
    if (visibleTags.length) {
      const tagRow = card.createDiv({ cls: "memoria-card-tags" });
      for (const t of visibleTags) {
        const pill = tagRow.createSpan({
          cls: "memoria-tag-pill",
          text: `#${t}`,
        });
        pill.addEventListener("click", () => {
          this.filter.tag = t;
          this.filter.preset = "all";
          this.pageLimit = this.getInitialPageLimit();
          this.renderAll();
        });
      }
    }

    // v1.3.0 → v1.3.6: 长笔记折叠
    //   改到最后调用 —— 这样按钮能放到 card 的最后一个元素（tagRow 或 imgGrid）里做水平对齐，
    //   不会因为"body 后面还有图片/标签"而错位。
    if (textForMd.trim()) {
      const body = card.querySelector<HTMLElement>(".memoria-card-body");
      if (body) this.applyCollapseIfNeeded(body, card);
    }
  }

  /**
   * 让 markdown 渲染产生的复选框可点击 —— 同步回写到 memo.content
   *
   * 注意：这里的 renderedText 是「已剥离标签、已剥离图片」的文本，
   * 它和 memo.content 的行号并不完全一致（因为剥离后的空行折叠会导致行错位）。
   * Bug fix (v1.1.2): 所以我们直接在 memo.content 原文里**精确定位第 N 条任务行**（第 N 个出现的 `- [ ]/[x]` 行），
   * 而不是用 indexOf(original) —— 后者遇到多条相同任务（比如两条 `- [ ] 读书`）只会改第一个。
   */
  private bindTaskCheckboxes(
    body: HTMLElement,
    memo: Memo,
    renderedText: string
  ): void {
    const boxes = body.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    if (!boxes.length) return;

    // 在 memo.content 原文里定位所有任务行（第 N 个任务 ↔ 第 N 个 checkbox）
    // v1.1.15: 过滤掉 code fence 内的 "- [ ]" —— 之前这些示例任务行会混进 taskLineNums，
    //   而 MarkdownRenderer 不会把它们渲染成可点 checkbox，两边数量虽然对得上（或不上）
    //   但语义错位：勾第 N 个 checkbox 实际改的是代码块里的示例行。
    const taskRe = /^(\s*[-*]\s+\[)( |x|X)(\]\s)/;
    const fenceRe = /^\s*(?:```|~~~)/;
    const contentLines = memo.content.split("\n");
    const taskLineNums: number[] = [];
    let inFence = false;
    contentLines.forEach((ln, idx) => {
      if (fenceRe.test(ln)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      if (taskRe.test(ln)) taskLineNums.push(idx);
    });

    if (boxes.length !== taskLineNums.length) {
      // 数量对不上（例如内容里包含 [ ] 但不是任务行），保守退出不绑定
      return;
    }

    boxes.forEach((box, i) => {
      box.disabled = false;
      box.addClass("memoria-clickable");
      box.addEventListener("click", (e) => {
        void (async () => {
        e.stopPropagation();
        const lineNum = taskLineNums[i];
        const lines = memo.content.split("\n");
        const original = lines[lineNum];
        const m = original.match(taskRe);
        if (!m) return;
        const checked = /[xX]/.test(m[2]);
        // 只替换这一行的 [ ] / [x]，不影响内容其他部分
        lines[lineNum] = original.replace(
          taskRe,
          checked ? "$1 $3" : "$1x$3"
        );
        const newContent = lines.join("\n");
        try {
          await this.store.editMemo(memo, newContent);
        } catch (err) {
          console.error("[Memoria] 任务勾选失败:", err);
          new Notice(t("notice.checkFailed", { msg: (err as Error).message }));
        }
        })();
      });
    });
  }

  /**
   * 给表格外层加一个可横向滚动的容器，避免宽表格撑破卡片布局。
   */
  private wrapWideTables(body: HTMLElement): void {
    const tables = body.querySelectorAll<HTMLTableElement>("table");
    tables.forEach((tb) => {
      const parent = tb.parentElement;
      if (!parent) return;
      if (parent.hasClass("memoria-table-wrap")) return;
      const wrap = createDiv({ cls: "memoria-table-wrap" });
      parent.insertBefore(wrap, tb);
      wrap.appendChild(tb);
    });
  }

  /**
   * v1.4.17: 给 Markdown 渲染出来的 [[双链]] 和 http(s):// 外链接入点击跳转。
   *
   * 背景：
   *   MarkdownRenderer.render() 只生成静态 DOM（`<a class="internal-link">`
   *   等），不会自动绑点击事件——OB 原生 editor / preview 是靠
   *   MarkdownView 内部的事件委托做的。自定义 ItemView 里用
   *   MarkdownRenderer.render 必须自己补点击处理，否则点 [[笔记名]] 毫无反应。
   *
   * 行为：
   *   - 单击：在当前 tab 打开对应笔记（mod-click 或 middle-click 新 tab）
   *   - 点 #标签：OB 原生 search 面板按 tag 搜索
   *   - 外链（http/https）：走 OB 的外链处理（尊重用户的"在浏览器打开"偏好）
   *
   * 用事件委托挂一次，所有当前/未来子节点的点击都走这里，性能零开销。
   */
  private bindInternalLinks(body: HTMLElement, memo: Memo): void {
    body.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // 1) [[双链]]：渲染为 <a class="internal-link" href="笔记名">
      const internal = target.closest<HTMLAnchorElement>("a.internal-link");
      if (internal) {
        e.preventDefault();
        e.stopPropagation();
        const href =
          internal.getAttribute("data-href") ||
          internal.getAttribute("href") ||
          "";
        if (!href) return;
        // 按住 Ctrl/Cmd 或中键 → 新 tab 打开；否则当前 tab
        const newLeaf =
          (e).ctrlKey ||
          (e).metaKey ||
          (e).button === 1;
        void this.app.workspace.openLinkText(href, memo.file, newLeaf);
        return;
      }

      // 2) #标签：渲染为 <a class="tag" href="#xxx">
      const tagLink = target.closest<HTMLAnchorElement>("a.tag");
      if (tagLink) {
        e.preventDefault();
        e.stopPropagation();
        const tag = (tagLink.getAttribute("href") || "").replace(/^#/, "");
        if (!tag) return;
        // 调用 OB 原生 global search 按标签搜索
        // 等价于用户点侧栏的"全局搜索"然后输入 "tag:#xxx"
        const search = (this.app as unknown as {
          internalPlugins?: {
            getPluginById: (id: string) => {
              instance?: {
                openGlobalSearch?: (q: string) => void;
              };
            } | null;
          };
        }).internalPlugins?.getPluginById("global-search");
        search?.instance?.openGlobalSearch?.(`tag:#${tag}`);
        return;
      }

      // 3) 外链 http(s)：交给浏览器 / OB 的外链处理（默认 anchor 行为已 OK）
      //    不 preventDefault，让 OB 自己处理；但阻止冒泡避免被卡片双击等吃掉
      const external = target.closest<HTMLAnchorElement>("a.external-link");
      if (external) {
        e.stopPropagation();
        return;
      }
    });
  }

  /**
   * v2.0.0: 搜索关键词高亮。
   *
   * 遍历 body 下所有**文本节点**（不碰 <a>、<code>、<pre> 内部），
   * 对每个节点做关键词替换 → 用 <mark class="memoria-search-hit"> wrap。
   *
   * 为什么不在 MarkdownRenderer 之前改 md 源文本？
   *   因为会破坏 markdown 语法（比如关键词如果是 "代码"，替换后变 "<mark>代码</mark>"
   *   会让本来应该被渲染成 **加粗** 的 markdown 不工作）。
   * 在渲染后的 DOM 上处理是最安全的方式。
   *
   * 性能：只在搜索有关键词时才调用，单条卡片 ~0.5-1ms。
   */
  private highlightSearchTerms(body: HTMLElement, terms: string[]): void {
    if (terms.length === 0) return;
    // 预编译正则（长的优先匹配，避免 "AI" 抢走 "AI工具" 的命中）
    const sorted = [...terms].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const re = new RegExp(`(${escaped.join("|")})`, "gi");

    // 不碰这些 tag 内部（避免破坏链接、代码块等）
    const SKIP_TAGS = new Set(["A", "CODE", "PRE", "MARK", "SCRIPT", "STYLE"]);

    const walk = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        if (!re.test(text)) return;
        re.lastIndex = 0;
        // 把命中位置切开，在命中处插入 <mark>
        const frag = activeDocument.createDocumentFragment();
        let lastIdx = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          if (m.index > lastIdx) {
            frag.appendChild(
              activeDocument.createTextNode(text.slice(lastIdx, m.index))
            );
          }
          const mark = activeDocument.createElement("mark");
          mark.className = "memoria-search-hit";
          mark.textContent = m[0];
          frag.appendChild(mark);
          lastIdx = m.index + m[0].length;
        }
        if (lastIdx < text.length) {
          frag.appendChild(activeDocument.createTextNode(text.slice(lastIdx)));
        }
        node.parentNode?.replaceChild(frag, node);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName)) return;
        // 克隆 childNodes 到数组，避免边遍历边改树
        const children = Array.from(node.childNodes);
        for (const ch of children) walk(ch);
      }
    };
    walk(body);
  }





  /**
   * v1.3.0 → v1.3.6: 长笔记折叠
   *
   * 思路演进：
   *   v1.3.0：按钮作为 body 的兄弟，全宽大横条
   *   v1.3.4：按钮 appendChild 到 body 内部，绝对定位到 body 右下角
   *   v1.3.6：按钮永远挂在**卡片最后一个元素**（tagRow / imgGrid / body）的末尾，
   *           通过 `margin-left: auto` 右对齐，和该元素的最后一行水平对齐。
   *           这样不论有没有图片/标签，按钮都在"卡片最后一行"的右边。
   */
  private applyCollapseIfNeeded(body: HTMLElement, card: HTMLElement): void {
    const lineLimit = this.settings.collapseLineLimit || 0;
    if (lineLimit <= 0) return;

    // 等两帧让 markdown / 代码块 / 表格 都 layout 完
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const style = window.getComputedStyle(body);
        let lineH = parseFloat(style.lineHeight);
        if (!isFinite(lineH) || lineH <= 0) {
          lineH = parseFloat(style.fontSize) * 1.5;
        }
        if (!isFinite(lineH) || lineH <= 0) lineH = 24;

        const full = body.scrollHeight;
        const thresholdPx = lineH * lineLimit;
        if (full <= thresholdPx + 12) return;

        // 触发折叠
        body.addClass("is-collapsed");
        body.style.setProperty("--memoria-collapse-max", `${thresholdPx}px`);

        // 创建按钮
        const btn = createEl("button", {
          cls: "memoria-collapse-toggle",
        });
        const label = btn.createSpan({
          cls: "memoria-collapse-label",
          text: t("card.collapseFull"),
        });
        const iconSpan = btn.createSpan({ cls: "memoria-collapse-icon" });
        setIcon(iconSpan, "chevron-down");

        // v1.3.6 定位策略：
        //   把按钮挂在 card 的**最后一个可见元素**里，作为其最后一个 inline 子元素
        //   margin-left: auto 让按钮在该行右侧
        //   这样按钮永远和"卡片最后一行"视觉对齐 —— 不管那一行是标签、图片还是文字
        // v2.1.3: imgGrid 不再作为 host 候选 —— imgGrid 自身有 max-width: 380px
        //   （单图甚至 260px），按钮挂进去 grid-column: 1/-1 + justify-self: end
        //   只能贴 imgGrid 的右边缘，离卡片右边缘有 ~600px 距离，看起来像"全文"
        //   按钮浮在卡片中部偏左。改为：无 tagRow 时直接挂 card（不是 body 也不
        //   是 imgGrid），让按钮跟卡片同宽，再用 block 级 margin-left: auto 贴右。
        const placeBtn = () => {
          const tagRow = card.querySelector(
            ".memoria-card-tags"
          );
          if (tagRow) {
            // 标签行：appendChild 让按钮成为标签的最后一个 flex 子元素
            // CSS .memoria-collapse-toggle { margin-left: auto } 推到行尾右对齐
            tagRow.appendChild(btn);
          } else {
            // 无标签时，直接挂卡片末尾（imgGrid 之后），跟卡片同宽 → block 级右对齐
            // CSS .memoria-card > .memoria-collapse-toggle 处理这种情况
            card.appendChild(btn);
          }
        };
        placeBtn();

        let expanded = false;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          expanded = !expanded;
          if (expanded) {
            body.removeClass("is-collapsed");
            setIcon(iconSpan, "chevron-up");
            label.setText(t("card.collapseFold"));
          } else {
            body.addClass("is-collapsed");
            setIcon(iconSpan, "chevron-down");
            label.setText(t("card.collapseFull"));
            card.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        });
      });
    });
  }

  private stripTags(content: string): { text: string; tags: string[] } {
    const tags: string[] = [];
    // v1.1.14: 带前导空白一起剥掉，避免 "一句话 #标签 继续" 剥完后留双空格，
    //   某些 markdown 解析器会把行尾双空格视作"硬换行"。
    const text = content.replace(
      /[ \t]*#([A-Za-z0-9_\u4e00-\u9fff][A-Za-z0-9_\u4e00-\u9fff/]*)/g,
      (_m, g1: string) => {
        if (!tags.includes(g1)) tags.push(g1);
        return "";
      }
    );
    return {
      text: text
        .split("\n")
        .map((l) => l.replace(/\s+$/, ""))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
      tags,
    };
  }

  private showMemoMenu(evt: MouseEvent, memo: Memo): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle(memo.isPinned ? t("card.unpin") : t("card.pin"))
        .setIcon(memo.isPinned ? "pin-off" : "pin")
        .onClick(async () => {
          await this.store.togglePinned(memo);
          new Notice(memo.isPinned ? t("notice.unpinned") : t("notice.pinned"));
        })
    );
    menu.addItem((item) =>
      item
        .setTitle(memo.isStarred ? t("card.unstar") : t("card.star"))
        .setIcon(memo.isStarred ? "star-off" : "star")
        .onClick(async () => {
          await this.store.toggleStarred(memo);
          new Notice(
            memo.isStarred ? t("notice.unstarred") : t("notice.starred")
          );
        })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle(t("card.edit"))
        .setIcon("pencil")
        .onClick(() => this.enterEditMode(memo))
    );
    // v1.2.1: 菜单里的"引用"已删除 —— 卡片右上角已有常驻"引用"按钮，避免重复
    menu.addItem((item) =>
      item
        .setTitle(t("card.openSource"))
        .setIcon("file-text")
        .onClick(() => this.openInFile(memo))
    );
    menu.addItem((item) =>
      item
        .setTitle(t("card.copySource"))
        .setIcon("copy")
        .onClick(async () => {
          await navigator.clipboard.writeText(memo.content);
          new Notice(t("notice.copied"));
        })
    );
    // v1.1.19: 保存为图片（轻量版 —— SVG foreignObject + canvas，零依赖 ~3KB）
    menu.addItem((item) =>
      item
        .setTitle(t("card.exportImage"))
        .setIcon("image-down")
        .onClick(async () => {
          try {
            await this.exportMemoAsPng(memo);
          } catch (err) {
            console.error("[Memoria] 导出图片失败:", err);
            new Notice(t("notice.exportFailed", { msg: (err as Error).message }));
          }
        })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle(t("card.delete"))
        .setIcon("trash")
        .onClick(async () => {
          // 使用自定义确认浮层（替代浏览器原生 confirm()）
          // 原因：原生 confirm() 是 modal blocking 弹窗，关闭后会把焦点还给
          //       activeDocument.body，导致输入框 textarea 需要再点击一次才能获得光标。
          const ok = await this.confirmAsync(t("notice.confirmDelete"));
          if (!ok) return;
          await this.store.deleteMemo(memo);
          // v1.1.9: 回收站提示（只在开启时）
          new Notice(
            this.settings.useTrash
              ? t("notice.deletedTrash")
              : t("notice.deleted")
          );
          // 保险：让 textarea 失焦再聚焦，避免 DOM 重建导致的焦点丢失
          this.restoreInputFocus();
        })
    );
    menu.showAtMouseEvent(evt);
  }

  /**
   * 自定义异步确认浮层（替代浏览器原生 confirm()，避免焦点劫持）。
   */
  private confirmAsync(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const backdrop = activeDocument.body.createDiv({
        cls: "memoria-modal-backdrop",
      });
      const box = backdrop.createDiv({ cls: "memoria-modal memoria-confirm" });
      box.createDiv({ cls: "memoria-modal-title", text: message });
      const btns = box.createDiv({ cls: "memoria-modal-btns" });
      const cancel = btns.createEl("button", { text: t("input.cancel") });
      const ok = btns.createEl("button", { text: t("notice.confirmDeleteOk"), cls: "mod-warning" });

      // v1.1.15: 视图关闭时自动清理 —— 之前弹窗出现后切视图 / 关插件，
      //   backdrop 会作为幽灵蒙版留在 DOM 上。
      // v2.0.19: 同时清理 mousedown 里挂出的 pending mouseup listener
      //   （场景同 main.ts quickCapture 的 v1.4.11 修复：用户 mousedown 后拖出窗口
      //   松开，mouseup 永远触发不了；原实现会导致这个 listener 永久残留在 activeDocument 上）
      let settled = false;
      let pendingMouseUp: ((ev: MouseEvent) => void) | null = null;
      const cleanupPendingMouseUp = () => {
        if (pendingMouseUp) {
          activeDocument.removeEventListener("mouseup", pendingMouseUp, true);
          pendingMouseUp = null;
        }
      };
      this.register(() => {
        if (settled) return;
        settled = true;
        backdrop.remove();
        activeDocument.removeEventListener("keydown", onKey, true);
        cleanupPendingMouseUp();
        window.setTimeout(() => resolve(false), 0);
      });

      const close = (result: boolean) => {
        if (settled) return;
        settled = true;
        backdrop.remove();
        activeDocument.removeEventListener("keydown", onKey, true);
        cleanupPendingMouseUp();
        // 延后一帧再 resolve，确保 DOM 卸载完成
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
      // v1.1.14: 参考 v1.1.10 quickCapture 的修复 —— 不用 click（会把"按钮内按下、
      //   背景上松开"的拖拽误判为点背景取消）。改为 mousedown 起点 + mouseup 终点
      //   都在 backdrop 自身才关闭。
      // v2.0.19: 新的 mousedown 覆盖前先清理上一个 pending mouseup（slot 模式），
      //   避免连击时累积 listener。
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target !== backdrop) return;
        cleanupPendingMouseUp();
        const up = (ev: MouseEvent) => {
          activeDocument.removeEventListener("mouseup", up, true);
          pendingMouseUp = null;
          if (ev.target === backdrop) close(false);
        };
        pendingMouseUp = up;
        activeDocument.addEventListener("mouseup", up, true);
      });
      activeDocument.addEventListener("keydown", onKey, true);
      // 默认聚焦「确认」按钮，方便键盘 Enter
      window.setTimeout(() => ok.focus(), 20);
    });
  }

  /**
   * 恢复输入框的"可点击输入"状态。
   *
   * 一些浏览器在大规模 DOM 重建后 textarea 的焦点状态会进入怪异模式，
   * 鼠标悬停不会触发光标显示，必须先点到外部再点回来才行。
   * 显式 blur + 微延时 focus 可以重置这个状态。
   */
  private restoreInputFocus(): void {
    if (!this.inputEl) return;
    try {
      this.inputEl.blur();
    } catch {
      // Best effort only; the element may already be detached.
    }
    window.setTimeout(() => {
      try {
        // 不强抢焦点，只是"激活"一次 textarea 让它后续能正常响应
        this.inputEl.setSelectionRange(
          this.inputEl.value.length,
          this.inputEl.value.length
        );
      } catch {
        // Best effort only; the view may close before this timer runs.
      }
    }, 20);
  }

  private async openInFile(memo: Memo): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    const file = this.app.vault.getAbstractFileByPath(memo.file);
    if (file instanceof TFile) {
      await leaf.openFile(file, { eState: { line: memo.range[0] } });
    }
  }

  /**
   * 引用某条笔记：把它以 > 引用块的形式填入顶部输入框，方便续写
   * 格式：
   *   > [!quote] 2026-04-20 12:12
   *   > 被引用的内容
   *
   *   （光标停在这里，等用户接着写）
   */
  private quoteMemo(memo: Memo): void {
    // 先退出编辑模式（如果有）
    if (this.editingMemo) this.exitEditMode();

    // 去掉保留标签（#置顶 #收藏），避免引用时带上
    const cleaned = memo.content
      .replace(/\s*#置顶(?![A-Za-z0-9_\u4e00-\u9fff/])/g, "")
      .replace(/\s*#收藏(?![A-Za-z0-9_\u4e00-\u9fff/])/g, "")
      .trim();

    // 每一行都加 > 前缀
    const quoted = cleaned
      .split("\n")
      .map((l) => (l.trim() === "" ? ">" : `> ${l}`))
      .join("\n");

    const block = `> [!quote] ${memo.date} ${memo.time}\n${quoted}\n\n`;

    // 如果输入框已有内容，追加；否则直接填入
    // v2.1.0-iter8: 用 setTextareaValue 保留 undo（用户能 Ctrl+Z 撤销引用插入）
    if (this.inputEl.value.trim()) {
      const trimmed = this.inputEl.value.replace(/\s+$/, "");
      setTextareaValue(this.inputEl, trimmed + "\n\n" + block);
    } else {
      setTextareaValue(this.inputEl, block);
    }
    this.inputEl.focus();
    // 光标移到末尾
    const pos = this.inputEl.value.length;
    this.inputEl.setSelectionRange(pos, pos);
    // v1.1.8: 引用块很可能多行，重算高度
    this.autoResizeInput();
    // v2.0.17: 引用一定使输入框有内容 → 保持展开态
    this.syncInputCardContentState();
    new Notice(t("notice.quoted"));
  }

  /**
   * v1.2.2 重写：保存 memo 为 PNG 图片（纯 SVG <text>，彻底根治 tainted canvas）
   * v1.2.3: 主题色板 + 粗虚线分割 + 羽毛笔 SVG 图标
   */
  private async exportMemoAsPng(memo: Memo): Promise<void> {
    const WIDTH = 640;
    const PAD_X = 48;
    const PAD_TOP = 56;
    const PAD_BOTTOM = 40;

    const isDark =
      activeDocument.body.hasClass("theme-dark") ||
      activeDocument.documentElement.hasClass("theme-dark");

    // ========== 主题色板（v1.2.3） ==========
    type Palette = {
      bg: string;
      fg: string;
      muted: string;
      accent1: string;
      accent2: string;
      tagBg: string;
      tagFg: string;
      border: string;
    };
    const palettes: Record<string, Palette> = {
      paper: {
        bg: "#fdfdfd",
        fg: "#1a1a1c",
        muted: "#8a8a8e",
        accent1: "#7c3aed",
        accent2: "#3b82f6",
        tagBg: "rgba(124,58,237,0.08)",
        tagFg: "#6d28d9",
        border: "#c8c8cc",
      },
      kraft: {
        bg: "#f5ebd8",
        fg: "#3d2f1e",
        muted: "#8a6f4a",
        accent1: "#b45309",
        accent2: "#d97706",
        tagBg: "rgba(180,83,9,0.12)",
        tagFg: "#92400e",
        border: "#c8a876",
      },
      mint: {
        bg: "#e8f5ec",
        fg: "#1a3a28",
        muted: "#5a8368",
        accent1: "#059669",
        accent2: "#10b981",
        tagBg: "rgba(5,150,105,0.12)",
        tagFg: "#047857",
        border: "#95c8a5",
      },
      peach: {
        bg: "#fde8e1",
        fg: "#3d1f18",
        muted: "#a77363",
        accent1: "#ea580c",
        accent2: "#f97316",
        tagBg: "rgba(234,88,12,0.12)",
        tagFg: "#c2410c",
        border: "#ecab93",
      },
      sky: {
        bg: "#e0f2fe",
        fg: "#0c2a3e",
        muted: "#5a7a95",
        accent1: "#0284c7",
        accent2: "#0ea5e9",
        tagBg: "rgba(2,132,199,0.12)",
        tagFg: "#0369a1",
        border: "#84bcd8",
      },
      lavender: {
        bg: "#eee7fa",
        fg: "#2a1a3e",
        muted: "#7a6a95",
        accent1: "#7c3aed",
        accent2: "#a78bfa",
        tagBg: "rgba(124,58,237,0.12)",
        tagFg: "#6d28d9",
        border: "#bba9de",
      },
      midnight: {
        bg: "#1a2238",
        fg: "#e8e8ea",
        muted: "#8a95b0",
        accent1: "#60a5fa",
        accent2: "#a78bfa",
        tagBg: "rgba(167,139,250,0.18)",
        tagFg: "#c4b5fd",
        border: "#3a4568",
      },
      charcoal: {
        bg: "#1a1b1e",
        fg: "#e8e8ea",
        muted: "#8a8a90",
        accent1: "#a78bfa",
        accent2: "#60a5fa",
        tagBg: "rgba(167,139,250,0.14)",
        tagFg: "#c4b5fd",
        border: "#3a3a40",
      },
    };

    // 解析当前使用的主题（auto / random / 具体id）
    let themeId = this.settings.exportTheme || "auto";
    if (themeId === "auto") {
      themeId = isDark ? "charcoal" : "paper";
    } else if (themeId === "random") {
      const keys = Object.keys(palettes);
      themeId = keys[Math.floor(Math.random() * keys.length)];
    }
    const P = palettes[themeId] || palettes.paper;
    const bg = P.bg;
    const fg = P.fg;
    const muted = P.muted;
    const accent1 = P.accent1;
    const accent2 = P.accent2;
    const tagBg = P.tagBg;
    const tagFg = P.tagFg;
    const borderClr = P.border;

    // ========== 文本准备 ==========
    const { text: contentText, tags } = this.stripTags(memo.content);
    const cleanText = contentText
      .replace(/!\[\[[^\]]+\]\]/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .trim();
    const effectiveTags = tags.filter((t) => !RESERVED_TAGS.has(t));

    // XML 转义
    const esc = (s: string): string =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    // ========== 正文按宽度换行 ==========
    const FONT_SIZE = 16;
    const LINE_HEIGHT = 28; // 1.75x
    const textWidth = WIDTH - PAD_X * 2;

    // 估算每个字符的宽度（px）：CJK 全角约 1em，ASCII 约 0.55em
    const charWidth = (ch: string, scale: number = 1): number => {
      const code = ch.charCodeAt(0);
      // CJK 统一汉字 + 日文假名 + 韩文 + 全角标点
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3400 && code <= 0x4dbf) ||
        (code >= 0x3040 && code <= 0x30ff) ||
        (code >= 0xac00 && code <= 0xd7af) ||
        (code >= 0xff00 && code <= 0xffef)
      ) {
        return FONT_SIZE * scale;
      }
      return FONT_SIZE * 0.55 * scale;
    };

    // ========== Markdown 渲染支持（v1.2.5） ==========
    // 块级类型
    // v1.4.11: 补全类型，之前少了 h4/h5/h6/code/task 五种，虽然因为 tsconfig 没开 strict
    //   不会编译报错，但 IDE/重构工具会看不出问题，未来埋坑。
    type BlockKind =
      | "para"
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "li"
      | "ol"
      | "task"
      | "quote"
      | "hr"
      | "code";
    // 行内 span（样式片段）
    type InlineSpan = {
      text: string;
      bold?: boolean;
      italic?: boolean;
      code?: boolean;
      strike?: boolean;
      link?: boolean;
    };
    // 块结构
    type Block = {
      kind: BlockKind;
      indent: number; // 内容区左侧偏移（相对 PAD_X）
      prefix?: { text: string; bold?: boolean }; // 列表项/引用的前缀符号
      checked?: boolean; // v1.2.6: 任务列表是否勾选
      codeLines?: string[]; // v1.2.6: 代码块内容（已按 \n 切分好）
      spans: InlineSpan[]; // 一行内可能多种样式混合
      fontSize: number;
      bold: boolean; // 整行默认粗体（如标题）
    };

    // 行内解析：把一段纯文本按 markdown 规则切成 InlineSpan[]
    // 支持：**bold**  *italic*  _italic_  `code`  ~~strike~~  [text](url)
    const parseInline = (src: string): InlineSpan[] => {
      const out: InlineSpan[] = [];
      let i = 0;
      const push = (text: string, style: Partial<InlineSpan> = {}) => {
        if (!text) return;
        out.push({ text, ...style });
      };
      while (i < src.length) {
        // 代码 `code`
        if (src[i] === "`") {
          const end = src.indexOf("`", i + 1);
          if (end > i) {
            push(src.slice(i + 1, end), { code: true });
            i = end + 1;
            continue;
          }
        }
        // 粗体 **bold**
        if (src[i] === "*" && src[i + 1] === "*") {
          const end = src.indexOf("**", i + 2);
          if (end > i) {
            const inner = src.slice(i + 2, end);
            // 粗体内部可以有斜体 / 代码吗？为简化 —— 再跑一次解析
            for (const s of parseInline(inner)) {
              push(s.text, { ...s, bold: true });
            }
            i = end + 2;
            continue;
          }
        }
        // 删除线 ~~strike~~
        if (src[i] === "~" && src[i + 1] === "~") {
          const end = src.indexOf("~~", i + 2);
          if (end > i) {
            push(src.slice(i + 2, end), { strike: true });
            i = end + 2;
            continue;
          }
        }
        // 斜体 *italic*  _italic_
        if ((src[i] === "*" || src[i] === "_") && src[i + 1] !== src[i]) {
          const marker = src[i];
          const end = src.indexOf(marker, i + 1);
          if (end > i && /\S/.test(src.slice(i + 1, end))) {
            push(src.slice(i + 1, end), { italic: true });
            i = end + 1;
            continue;
          }
        }
        // 链接 [text](url)
        if (src[i] === "[") {
          const close = src.indexOf("](", i);
          const rp = close > 0 ? src.indexOf(")", close + 2) : -1;
          if (close > i && rp > close) {
            push(src.slice(i + 1, close), { link: true });
            i = rp + 1;
            continue;
          }
        }
        // 普通字符：累积到下一个特殊符号
        let j = i;
        while (
          j < src.length &&
          src[j] !== "`" &&
          !(src[j] === "*") &&
          !(src[j] === "_" && j > 0 && /\s/.test(src[j - 1] || " ")) &&
          !(src[j] === "~" && src[j + 1] === "~") &&
          src[j] !== "["
        ) {
          j++;
        }
        if (j === i) j++; // 安全：至少推进一格
        push(src.slice(i, j));
        i = j;
      }
      return out;
    };

    // 块级识别：把整段文本切成 Block[]（每个 Block 是一个"逻辑行"，后面还会按宽度折成多个视觉行）
    const parseBlocks = (src: string): Block[] => {
      const blocks: Block[] = [];
      const lines = src.split("\n");
      let idx = 0;
      while (idx < lines.length) {
        const raw = lines[idx];

        // v1.2.6: 代码块 ``` ... ``` （整块吃掉）
        const fenceM = raw.match(/^\s*```(.*)$/);
        if (fenceM) {
          const codeLines: string[] = [];
          idx++; // 跳过开头 ```
          while (idx < lines.length && !/^\s*```/.test(lines[idx])) {
            codeLines.push(lines[idx]);
            idx++;
          }
          idx++; // 跳过结尾 ```
          blocks.push({
            kind: "code",
            indent: 0,
            codeLines,
            spans: [],
            fontSize: 14,
            bold: false,
          });
          continue;
        }

        // 保留空行作为段落分隔
        if (raw.trim() === "") {
          blocks.push({
            kind: "para",
            indent: 0,
            spans: [{ text: "" }],
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // 水平线 --- *** ___
        if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) {
          blocks.push({
            kind: "hr",
            indent: 0,
            spans: [],
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // 标题 # ~ ###### （v1.2.6: 扩展到 H1-H6）
        let m = raw.match(/^(#{1,6})\s+(.+)$/);
        if (m) {
          const level = m[1].length;
          // 逐级递减：H1 22 → H2 19 → H3 17 → H4 16 → H5 15 → H6 14
          const sizes = [0, 22, 19, 17, 16, 15, 14];
          const kindMap: Record<number, BlockKind> = {
            1: "h1",
            2: "h2",
            3: "h3",
            4: "h4",
            5: "h5",
            6: "h6",
          };
          blocks.push({
            kind: kindMap[level],
            indent: 0,
            spans: parseInline(m[2]),
            fontSize: sizes[level],
            bold: true,
          });
          idx++;
          continue;
        }
        // 引用 > text
        m = raw.match(/^>\s?(.*)$/);
        if (m) {
          blocks.push({
            kind: "quote",
            indent: 16,
            spans: parseInline(m[1]),
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // v1.2.6: 任务列表 - [ ] / - [x]（必须在无序列表识别前面，否则 - [ ] 会被当作普通 - 列表项）
        m = raw.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
        if (m) {
          blocks.push({
            kind: "task",
            indent: 24 + m[1].length * 8,
            checked: m[2].toLowerCase() === "x",
            spans: parseInline(m[3]),
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // 无序列表 - item / * item
        m = raw.match(/^(\s*)[-*]\s+(.+)$/);
        if (m) {
          blocks.push({
            kind: "li",
            indent: 18 + m[1].length * 8,
            prefix: { text: "•" },
            spans: parseInline(m[2]),
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // 有序列表 1. item
        m = raw.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (m) {
          blocks.push({
            kind: "ol",
            indent: 22 + m[1].length * 8,
            prefix: { text: m[2] + "." },
            spans: parseInline(m[3]),
            fontSize: FONT_SIZE,
            bold: false,
          });
          idx++;
          continue;
        }
        // 普通段落
        blocks.push({
          kind: "para",
          indent: 0,
          spans: parseInline(raw),
          fontSize: FONT_SIZE,
          bold: false,
        });
        idx++;
      }
      return blocks;
    };

    // 把一个 Block 按可用宽度拆成多个视觉行。
    // 输出是 Array<Array<InlineSpan>>，每个子数组就是一行要绘制的 span 序列
    const wrapBlock = (
      block: Block,
      maxW: number
    ): InlineSpan[][] => {
      const out: InlineSpan[][] = [];
      let line: InlineSpan[] = [];
      let w = 0;

      const spanWidth = (ch: string, span: InlineSpan): number => {
        const scale = (block.fontSize / FONT_SIZE) * (span.bold || block.bold ? 1.05 : 1);
        return charWidth(ch, scale);
      };

      // 把一个 span 里的字符逐个试着加到 line 里，超宽就换行
      const pushSpan = (span: InlineSpan) => {
        if (span.text === "") {
          if (line.length === 0) line.push({ text: "" });
          return;
        }
        let buf = "";
        for (const ch of span.text) {
          const cw = spanWidth(ch, span);
          if (w + cw > maxW && (line.length > 0 || buf.length > 0)) {
            // flush buf to line, then break line
            if (buf) {
              line.push({ ...span, text: buf });
              buf = "";
            }
            if (line.length === 0) line.push({ text: "" });
            out.push(line);
            line = [];
            w = 0;
          }
          buf += ch;
          w += cw;
        }
        if (buf) line.push({ ...span, text: buf });
      };

      for (const s of block.spans) pushSpan(s);
      if (line.length > 0 || out.length === 0) {
        if (line.length === 0) line.push({ text: "" });
        out.push(line);
      }
      return out;
    };

    // 解析整篇 + 铺开每个 block 的所有视觉行
    type VisualLine = {
      block: Block;
      spans: InlineSpan[];
      isFirstOfBlock: boolean;
    };
    const blocks = cleanText
      ? parseBlocks(cleanText)
      : [
          {
            kind: "para" as BlockKind,
            indent: 0,
            spans: [{ text: "" }],
            fontSize: FONT_SIZE,
            bold: false,
          },
        ];
    const visualLines: VisualLine[] = [];
    for (const blk of blocks) {
      if (blk.kind === "hr") {
        visualLines.push({ block: blk, spans: [], isFirstOfBlock: true });
        continue;
      }
      // v1.2.6: 代码块 —— 每个 codeLine 算一个视觉行，span 里放该行的原始文本
      if (blk.kind === "code") {
        const codeLines = blk.codeLines || [""];
        codeLines.forEach((ln, i) =>
          visualLines.push({
            block: blk,
            spans: [{ text: ln, code: true }],
            isFirstOfBlock: i === 0,
          })
        );
        continue;
      }
      const wrapped = wrapBlock(blk, textWidth - blk.indent);
      wrapped.forEach((ln, idx) =>
        visualLines.push({
          block: blk,
          spans: ln,
          isFirstOfBlock: idx === 0,
        })
      );
    }

    // ========== 标签胶囊布局（SVG 原生）==========
    // 每个胶囊：左右 padding 12, 文本 13px, 高 26, 间距 8, 自动换行
    const TAG_FONT = 13;
    const TAG_HEIGHT = 26;
    const TAG_PAD_X = 12;
    const TAG_GAP = 8;
    const tagLayout: Array<{ text: string; x: number; y: number; w: number }> =
      [];
    if (effectiveTags.length > 0) {
      let cx = 0;
      let cy = 0;
      for (const t of effectiveTags) {
        const label = "#" + t;
        // 标签文本宽度估算（稍宽一点给个 safety padding）
        let tw = 0;
        for (const ch of label) tw += charWidth(ch) * (TAG_FONT / FONT_SIZE);
        const boxW = tw + TAG_PAD_X * 2;
        if (cx + boxW > textWidth && cx > 0) {
          cx = 0;
          cy += TAG_HEIGHT + TAG_GAP;
        }
        tagLayout.push({ text: label, x: cx, y: cy, w: boxW });
        cx += boxW + TAG_GAP;
      }
    }
    const tagsBlockH =
      effectiveTags.length > 0
        ? (tagLayout[tagLayout.length - 1].y + TAG_HEIGHT)
        : 0;

    // ========== 计算总高度 ==========
    const quoteH = 32;           // 装饰引号占高
    const quoteGap = 8;
    // 每个视觉行的高度：hr 用 20；标题按 fontSize * 1.6；代码行 20；其他用 LINE_HEIGHT
    const visualLineHeight = (vl: VisualLine): number => {
      if (vl.block.kind === "hr") return 20;
      if (
        vl.block.kind === "h1" ||
        vl.block.kind === "h2" ||
        vl.block.kind === "h3" ||
        vl.block.kind === "h4" ||
        vl.block.kind === "h5" ||
        vl.block.kind === "h6"
      ) {
        return Math.round(vl.block.fontSize * 1.6);
      }
      if (vl.block.kind === "code") return 20; // 代码行紧凑
      return LINE_HEIGHT;
    };
    // 块之间的额外间距：标题/引用/列表/代码块首行前加一点呼吸
    const blockTopGap = (vl: VisualLine, prev: VisualLine | null): number => {
      if (!vl.isFirstOfBlock) return 0;
      if (!prev) return 0;
      if (vl.block.kind === "h1") return 14;
      if (vl.block.kind === "h2") return 12;
      if (vl.block.kind === "h3") return 10;
      if (vl.block.kind === "h4") return 8;
      if (vl.block.kind === "h5") return 6;
      if (vl.block.kind === "h6") return 6;
      if (vl.block.kind === "code") return 8; // v1.2.6
      if (vl.block.kind === "quote" && prev.block.kind !== "quote") return 4;
      const isListKind = (k: BlockKind) => k === "li" || k === "ol" || k === "task";
      if (isListKind(vl.block.kind) && !isListKind(prev.block.kind)) return 4;
      return 0;
    };

    let bodyH = 0;
    let prevVl: VisualLine | null = null;
    for (const vl of visualLines) {
      bodyH += blockTopGap(vl, prevVl) + visualLineHeight(vl);
      prevVl = vl;
    }
    bodyH = Math.max(bodyH, LINE_HEIGHT);

    const bodyToTagsGap = effectiveTags.length > 0 ? 24 : 0;
    const tagsToFooterGap = 32;
    const footerLineH = 1;
    const footerGap = 18;
    const footerH = 48; // 日期 + 时间两行
    const contentH =
      quoteH +
      quoteGap +
      bodyH +
      bodyToTagsGap +
      tagsBlockH +
      tagsToFooterGap +
      footerLineH +
      footerGap +
      footerH;
    const HEIGHT = PAD_TOP + contentH + PAD_BOTTOM;

    // ========== 构建 SVG ==========
    let y = PAD_TOP;

    // 顶部左上角 4px 渐变装饰条
    const topBarW = 48;
    const topBarH = 4;

    // 装饰引号位置
    const quoteX = PAD_X;
    const quoteY = y + 22; // 基线
    y += quoteH + quoteGap;

    // 正文位置：遍历 visualLines 生成带 markdown 样式的 SVG 片段
    const bodyStartY = y; // 正文区域顶部 y
    const codeFont = "'SF Mono','Consolas','Monaco',monospace";
    const quoteMarks: string[] = []; // 引用块左侧竖线（SVG 片段集合）

    let cy2 = bodyStartY; // 当前行顶部 y
    let prevVl2: VisualLine | null = null;
    const bodySvgParts: string[] = [];

    for (const vl of visualLines) {
      cy2 += blockTopGap(vl, prevVl2);

      if (vl.block.kind === "hr") {
        const midY = cy2 + 10;
        bodySvgParts.push(
          `<line x1="${PAD_X}" y1="${midY}" x2="${
            WIDTH - PAD_X
          }" y2="${midY}" stroke="${borderClr}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 3"/>`
        );
        cy2 += 20;
        prevVl2 = vl;
        continue;
      }

      // v1.2.6: 代码块 —— 每一行都铺灰底，文字用等宽字体；收尾会画一个整块的外描边圆角框
      if (vl.block.kind === "code") {
        const lineH = visualLineHeight(vl);
        const codeLine = vl.spans[0]?.text || "";
        // 整块灰底：每行画一个矩形（连起来看就是一整块）
        bodySvgParts.push(
          `<rect x="${PAD_X}" y="${cy2}" width="${
            WIDTH - PAD_X * 2
          }" height="${lineH}" fill="${tagBg}" ${
            vl.isFirstOfBlock ? `rx="0"` : ""
          }/>`
        );
        // 文字
        if (codeLine.length > 0) {
          // 代码行不做 markdown 解析，原样显示；超长则截断加省略
          const maxChars = Math.floor(
            (WIDTH - PAD_X * 2 - 20) / (14 * 0.6) // 14px 等宽字体 ASCII 约 0.6em
          );
          const displayed =
            codeLine.length > maxChars
              ? codeLine.slice(0, maxChars - 1) + "…"
              : codeLine;
          const baselineY = cy2 + 14;
          bodySvgParts.push(
            `<text x="${PAD_X + 10}" y="${baselineY}" font-family="${codeFont}" font-size="13" fill="${tagFg}" xml:space="preserve">${esc(
              displayed
            )}</text>`
          );
        }
        cy2 += lineH;
        prevVl2 = vl;
        continue;
      }

      const lineH = visualLineHeight(vl);
      const baselineY = cy2 + vl.block.fontSize + (lineH - vl.block.fontSize) / 2 - 4;
      const startX = PAD_X + vl.block.indent;

      // 引用块：左侧 3px 竖线
      if (vl.block.kind === "quote") {
        quoteMarks.push(
          `<rect x="${PAD_X}" y="${cy2}" width="3" height="${lineH}" rx="1.5" fill="${accent1}" opacity="0.5"/>`
        );
      }

      // 列表前缀（项目符号 / 序号），只在块的首行画
      let cursorX = startX;
      if (vl.isFirstOfBlock && vl.block.prefix) {
        const pfx = vl.block.prefix.text;
        const pfxColor = vl.block.kind === "ol" ? fg : accent1;
        bodySvgParts.push(
          `<text x="${PAD_X + 6}" y="${baselineY}" font-size="${
            vl.block.fontSize
          }" fill="${pfxColor}" font-weight="${
            vl.block.kind === "ol" ? 600 : 700
          }">${esc(pfx)}</text>`
        );
      }
      // v1.2.6: 任务列表 —— 画一个 SVG 方框（可选勾），代替普通项目符号
      if (vl.isFirstOfBlock && vl.block.kind === "task") {
        const checkedFill = vl.block.checked ? accent1 : "transparent";
        const checkboxY = cy2 + (lineH - 14) / 2;
        bodySvgParts.push(
          `<rect x="${PAD_X + 4}" y="${checkboxY}" width="14" height="14" rx="3" ry="3" fill="${checkedFill}" stroke="${
            vl.block.checked ? accent1 : muted
          }" stroke-width="1.5"/>`
        );
        if (vl.block.checked) {
          // 勾：SVG polyline
          bodySvgParts.push(
            `<polyline points="${PAD_X + 7.5},${checkboxY + 7.5} ${
              PAD_X + 10
            },${checkboxY + 10} ${PAD_X + 14.5},${
              checkboxY + 4.5
            }" fill="none" stroke="${bg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
          );
        }
      }

      // 同一行内多 span 逐个接 tspan：SVG 没有直接 "auto x 流式" 的概念，
      // 我们手动累计 x，用绝对 x 定位每个 tspan
      const tspans: string[] = [];
      let runX = cursorX;
      for (const sp of vl.spans) {
        if (!sp.text) continue;

        // 代码片段：先画一个圆角浅色底（比裸文字多一点左右 padding）
        if (sp.code) {
          let cw = 0;
          for (const ch of sp.text) cw += charWidth(ch, 0.95);
          const boxW = cw + 8;
          bodySvgParts.push(
            `<rect x="${runX - 2}" y="${cy2 + (lineH - vl.block.fontSize) / 2 - 2}" width="${boxW}" height="${
              vl.block.fontSize + 4
            }" rx="4" fill="${tagBg}"/>`
          );
          tspans.push(
            `<tspan x="${runX + 2}" y="${baselineY}" font-family="${codeFont}" fill="${tagFg}" font-size="${Math.round(
              vl.block.fontSize * 0.95
            )}">${esc(sp.text)}</tspan>`
          );
          runX += boxW;
          continue;
        }

        // 普通 span：根据样式组装属性
        const attrs: string[] = [];
        const isBold = sp.bold || vl.block.bold;
        if (isBold) attrs.push(`font-weight="700"`);
        if (sp.italic) attrs.push(`font-style="italic"`);
        // v1.2.6: 已勾选的 task 行，文字显示为删除线灰色
        const taskDone =
          vl.block.kind === "task" && vl.block.checked === true;
        if (sp.link) {
          attrs.push(`fill="${accent1}"`);
          attrs.push(`text-decoration="underline"`);
        } else if (sp.strike || taskDone) {
          attrs.push(`text-decoration="line-through"`);
          attrs.push(`fill="${muted}"`);
        }
        tspans.push(
          `<tspan x="${runX}" y="${baselineY}" ${attrs.join(
            " "
          )}>${esc(sp.text)}</tspan>`
        );
        // 累计 x 以供下一个 span 定位
        const scale = (vl.block.fontSize / FONT_SIZE) * (isBold ? 1.05 : 1);
        for (const ch of sp.text) runX += charWidth(ch, scale);
      }

      // 如果这一行完全空（仅段落分隔），也要占一行高度
      if (tspans.length === 0 && !vl.block.prefix) {
        // 不画任何 tspan，但 cy2 推进
      } else if (tspans.length > 0) {
        bodySvgParts.push(
          `<text font-size="${vl.block.fontSize}" fill="${fg}">${tspans.join(
            ""
          )}</text>`
        );
      }

      cy2 += lineH;
      prevVl2 = vl;
    }

    const textLines = bodySvgParts.join("\n  ") + "\n  " + quoteMarks.join("\n  ");
    y += bodyH;

    // 标签
    y += bodyToTagsGap;
    const tagsStartY = y;
    const tagsSvg = tagLayout
      .map(
        (t) =>
          `<g>
    <rect x="${PAD_X + t.x}" y="${tagsStartY + t.y}" width="${
            t.w
          }" height="${TAG_HEIGHT}" rx="13" ry="13" fill="${tagBg}"/>
    <text x="${PAD_X + t.x + t.w / 2}" y="${
            tagsStartY + t.y + TAG_HEIGHT / 2 + TAG_FONT * 0.35
          }" text-anchor="middle" font-size="${TAG_FONT}" fill="${tagFg}" font-weight="500">${esc(
            t.text
          )}</text>
  </g>`
      )
      .join("\n  ");
    y += tagsBlockH;

    // 分割线
    y += tagsToFooterGap;
    const lineY = y;
    y += footerLineH + footerGap;

    // 日期（大号）
    const dateStr = memo.date.replace(/-/g, ".");
    const dateY = y + 20;
    const timeY = dateY + 20;

    // SVG font-family 串：优先系统中文字体
    const fontFamily =
      "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei','微软雅黑',sans-serif";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${fontFamily}">
  <defs>
    <linearGradient id="topBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="100%" height="100%" fill="${bg}"/>

  <!-- 顶部左上角渐变装饰条 -->
  <rect x="${PAD_X}" y="0" width="${topBarW}" height="${topBarH}" fill="url(#topBar)"/>

  <!-- 装饰引号 -->
  <text x="${quoteX}" y="${quoteY}" font-size="54" font-family="Georgia,'Times New Roman',serif" fill="${accent1}" opacity="0.25" font-weight="700">&#8220;</text>

  <!-- 正文（v1.2.5: markdown 渲染，bodySvgParts 已经是完整的 text/rect/line 元素） -->
  ${textLines}

  ${tagsSvg ? `<!-- 标签胶囊 -->\n  ${tagsSvg}` : ""}

  <!-- 分割线（v1.2.5: 细一档的虚线，纸卡折痕感） -->
  <line x1="${PAD_X}" y1="${lineY}" x2="${WIDTH - PAD_X}" y2="${lineY}" stroke="${borderClr}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="5 4"/>

  <!-- 日期 -->
  <text x="${PAD_X}" y="${dateY}" font-size="18" fill="${fg}" font-weight="600" letter-spacing="1">${esc(
      dateStr
    )}</text>
  <text x="${PAD_X}" y="${timeY}" font-size="13" fill="${muted}">${esc(
      memo.time
    )}</text>

  <!-- 右下角：羽毛笔 SVG 图标 + MEMORIA 水印（v1.2.5: 更贴近 MEMORIA） -->
  <!-- MEMORIA 实测 12px 粗体+字距2，约 72px 宽；图标 17.5 + 间距 4 ≈ 94 -->
  <g transform="translate(${WIDTH - PAD_X - 94}, ${timeY - 16}) scale(1.3)" fill="${muted}" opacity="0.85">
    <!-- 羽毛笔：主杆 + 羽片 + 笔尖，纯 path，100% 跨平台 -->
    <path d="M13.5 0.5 C11 2.5, 8 5, 5.5 8 C3.5 10.5, 2 12.5, 1.2 14 L3 14.5 L13.5 4 Z M5 6.5 L3.5 9 L5.5 9.2 Z M8 3.5 L6.5 6 L8.5 6.2 Z M10.5 1.2 L9 3.6 L11 3.8 Z M1 14.2 L0 15.5 L1 15.5 Z"/>
  </g>
  <text x="${WIDTH - PAD_X}" y="${timeY}" font-size="12" fill="${muted}" text-anchor="end" letter-spacing="2" font-weight="600">MEMORIA</text>
</svg>`;

    const baseName = `memoria-${memo.date}-${memo.time.replace(":", "")}`;

    // 尝试 PNG（纯 SVG，这次不会 taint）
    try {
      const pngBlob = await this.svgToPngBlob(svg, WIDTH, HEIGHT, 2);
      this.downloadBlob(pngBlob, `${baseName}.png`);
      new Notice(`✓ 已保存 ${baseName}.png`);
      return;
    } catch (err) {
      console.warn("[Memoria] PNG 导出失败，降级为 SVG：", err);
    }

    // 万一仍然失败，降级保存 SVG
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    this.downloadBlob(svgBlob, `${baseName}.svg`);
    new Notice(`✓ 已保存 ${baseName}.svg（PNG 导出被拦截，已降级）`);
  }

  /** SVG 字符串 → PNG Blob（可能因 tainted canvas 抛错） */
  private async svgToPngBlob(
    svg: string,
    width: number,
    height: number,
    scale: number
  ): Promise<Blob> {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.width = width;
      img.height = height;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG 渲染失败"));
        img.src = url;
      });
      const canvas = activeDocument.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas 不可用");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("canvas.toBlob 返回 null（通常是 tainted canvas）"));
        }, "image/png");
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** 触发浏览器下载一个 Blob */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = activeDocument.createElement("a");
    a.href = url;
    a.download = filename;
    activeDocument.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

interface TagNode {
  name: string;
  full: string;
  count: number;
  self: number;
  children: Map<string, TagNode>;
}

function fmtDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 基于 seed 的确定性采样：从数组里不重复地抽 n 个元素。
 * 同样的 seed + 同样的输入 → 同样的输出，保证 renderList 反复调用结果一致。
 * 使用 mulberry32 伪随机 + Fisher–Yates 洗牌的前 n 项。
 */
function seededSample<T>(arr: T[], n: number, seed: number): T[] {
  if (n >= arr.length) return [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/**
 * 给 MarkdownRenderer 输入前做"块级语法"前后补空行规范化。
 *
 * 问题背景：Obsidian 的 MarkdownRenderer 对 CommonMark 严格遵循，
 * 某些块级语法（代码块围栏、表格、callout/blockquote、标题、分隔线）
 * 前后必须有空行，否则会被误识别为段落的一部分。
 *
 * 我们不修改 md 存储，只在渲染前做一份临时规范化，保证显示效果正确。
 */
function normalizeForRender(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inFence = false;

  const isTableLine = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isHeading = (s: string) => /^#{1,6}\s/.test(s);
  const isHr = (s: string) => /^\s*(?:---|\*\*\*|___)\s*$/.test(s);
  const isCallout = (s: string) => /^\s*>/.test(s);
  const isFence = (s: string) => /^\s*(?:```|~~~)/.test(s);

  const lastNonEmpty = () => {
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].trim() !== "") return out[i];
    }
    return "";
  };
  const pushBlank = () => {
    if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const prev = i > 0 ? lines[i - 1] : "";
    const next = i < lines.length - 1 ? lines[i + 1] : "";

    // 代码块围栏：开/关
    if (isFence(ln) && !inFence) {
      pushBlank();
      out.push(ln);
      inFence = true;
      continue;
    }
    if (inFence) {
      out.push(ln);
      if (isFence(ln)) {
        inFence = false;
        // 围栏结束后若下一行非空，补一个空行
        if (next.trim() !== "") out.push("");
      }
      continue;
    }

    // 标题
    if (isHeading(ln)) {
      pushBlank();
      out.push(ln);
      if (next.trim() !== "") out.push("");
      continue;
    }

    // 分隔线
    if (isHr(ln) && prev.trim() !== "" && !isHeading(lastNonEmpty())) {
      pushBlank();
      out.push(ln);
      if (next.trim() !== "") out.push("");
      continue;
    }

    // 表格起始：前一行非空且非表格行 → 补空行
    if (isTableLine(ln) && prev.trim() !== "" && !isTableLine(prev)) {
      pushBlank();
      out.push(ln);
      continue;
    }
    // 表格结束：当前是表格行但下一行非空也非表格 → 在结束后补空行
    if (isTableLine(ln)) {
      out.push(ln);
      if (next.trim() !== "" && !isTableLine(next)) out.push("");
      continue;
    }

    // callout / blockquote 前补空行（避免被上段吞掉）
    if (isCallout(ln) && prev.trim() !== "" && !isCallout(prev)) {
      pushBlank();
      out.push(ln);
      continue;
    }

    out.push(ln);
  }

  return out.join("\n");
}









