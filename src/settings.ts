// ================= 设置页 =================

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type MemoriaPlugin from "./main";
import { t } from "./i18n";

export class MemoriaSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: MemoriaPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    // v2.0.19: 按 Obsidian 插件商店规范移除设置页顶部的 <h2>
    //   —— 插件名本身已经是标题，重复加 heading 是商店审核明确不鼓励的做法。
    //   （v1.4.15 合规清理时漏了这一处）

    new Setting(containerEl)
      .setName(t("settings.folder.name"))
      .setDesc(t("settings.folder.desc"))
      .addText((tx) =>
        tx
          .setPlaceholder("Memoria")
          .setValue(this.plugin.settings.folder)
          .onChange(async (v) => {
            this.plugin.settings.folder = v.trim() || "Memoria";
            await this.plugin.saveSettings();
            await this.plugin.store.reloadAll();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.attachFolder.name"))
      .setDesc(t("settings.attachFolder.desc"))
      .addText((tx) =>
        tx
          .setPlaceholder("Memoria/attachments")
          .setValue(this.plugin.settings.attachmentFolder)
          .onChange(async (v) => {
            this.plugin.settings.attachmentFolder =
              v.trim() || "Memoria/attachments";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.sidebarTags.name"))
      .setDesc(t("settings.sidebarTags.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.showSidebarTags).onChange(async (v) => {
          this.plugin.settings.showSidebarTags = v;
          await this.plugin.saveSettings();
          // v1.4.11: 这个设置只影响侧栏 UI，不改底层 memos 数据；
          //   原来调 reloadAll() 会串行重读所有 YYYY.md 文件，完全浪费。
          //   现在只 emit() 触发一次视图重渲染。
          this.plugin.store.notifyChange();
        })
      );

    // v2.3.0: 侧栏年份列表显示开关（跟标签树同一套机制，只重渲染不重读文件）
    new Setting(containerEl)
      .setName(t("settings.sidebarYears.name"))
      .setDesc(t("settings.sidebarYears.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.showSidebarYears).onChange(async (v) => {
          this.plugin.settings.showSidebarYears = v;
          await this.plugin.saveSettings();
          this.plugin.store.notifyChange();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.clearAfterSave.name"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.clearAfterSave).onChange(async (v) => {
          this.plugin.settings.clearAfterSave = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.pageSize.name"))
      .setDesc(t("settings.pageSize.desc"))
      .addSlider((s) =>
        s
          .setLimits(10, 200, 10)
          .setValue(this.plugin.settings.pageSize)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.pageSize = v;
            await this.plugin.saveSettings();
          })
      );

    // v1.1.9: 删除笔记时保留到回收站
    new Setting(containerEl)
      .setName(t("settings.useTrash.name"))
      .setDesc(t("settings.useTrash.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.useTrash).onChange(async (v) => {
          this.plugin.settings.useTrash = v;
          await this.plugin.saveSettings();
        })
      );

    // v1.4.3: 回收站最大条数（FIFO 滚动，超出后丢弃最旧的）
    new Setting(containerEl)
      .setName(t("settings.trashMax.name"))
      .setDesc(t("settings.trashMax.desc"))
      .addDropdown((d) =>
        d
          .addOptions({
            "100": t("settings.trash.100"),
            "300": t("settings.trash.300"),
            "500": t("settings.trash.500"),
            "1000": t("settings.trash.1000"),
            "3000": t("settings.trash.3000"),
            "0": t("settings.trash.0"),
          })
          .setValue(String(this.plugin.settings.trashMaxItems))
          .onChange(async (v) => {
            this.plugin.settings.trashMaxItems = parseInt(v, 10) || 0;
            await this.plugin.saveSettings();
          })
      );

    // v1.2.3: 导出图片的背景主题
    new Setting(containerEl)
      .setName(t("settings.exportTheme.name"))
      .setDesc(t("settings.exportTheme.desc"))
      .addDropdown((d) =>
        d
          .addOptions({
            auto: t("settings.exportTheme.auto"),
            random: t("settings.exportTheme.random"),
            paper: t("settings.exportTheme.paper"),
            kraft: t("settings.exportTheme.kraft"),
            mint: t("settings.exportTheme.mint"),
            peach: t("settings.exportTheme.peach"),
            sky: t("settings.exportTheme.sky"),
            lavender: t("settings.exportTheme.lavender"),
            midnight: t("settings.exportTheme.midnight"),
            charcoal: t("settings.exportTheme.charcoal"),
          })
          .setValue(this.plugin.settings.exportTheme)
          .onChange(async (v) => {
            this.plugin.settings.exportTheme = v;
            await this.plugin.saveSettings();
          })
      );

    // v1.3.0: 长笔记自动折叠
    new Setting(containerEl)
      .setName(t("settings.collapse.name"))
      .setDesc(t("settings.collapse.desc"))
      .addDropdown((d) =>
        d
          .addOptions({
            "0": t("settings.collapse.0"),
            "4": t("settings.collapse.4"),
            "6": t("settings.collapse.6"),
            "8": t("settings.collapse.8"),
            "12": t("settings.collapse.12"),
            "20": t("settings.collapse.20"),
          })
          .setValue(String(this.plugin.settings.collapseLineLimit))
          .onChange(async (v) => {
            this.plugin.settings.collapseLineLimit = parseInt(v, 10) || 0;
            await this.plugin.saveSettings();
            // v1.4.11: 仅 UI 设置，无需 reloadAll
            this.plugin.store.notifyChange();
          })
      );

    // v1.4.0: 每日目标笔记数
    new Setting(containerEl)
      .setName(t("settings.dailyGoal.name"))
      .setDesc(t("settings.dailyGoal.desc"))
      .addSlider((s) =>
        s
          .setLimits(1, 30, 1)
          .setValue(this.plugin.settings.dailyGoal)
          .setDynamicTooltip()
          .onChange(async (v) => {
            this.plugin.settings.dailyGoal = v;
            await this.plugin.saveSettings();
            // v1.4.11: 仅 UI 设置，无需 reloadAll
            this.plugin.store.notifyChange();
          })
      );

    // v2.0.20: 侧栏默认视图（热力图 / 月历 / 宠物）
    new Setting(containerEl)
      .setName(t("settings.defaultOverview.name"))
      .setDesc(t("settings.defaultOverview.desc"))
      .addDropdown((d) =>
        d
          .addOption("heatmap", t("settings.defaultOverview.heatmap"))
          .addOption("calendar", t("settings.defaultOverview.calendar"))
          .addOption("buddy", t("settings.defaultOverview.buddy"))
          .setValue(this.plugin.settings.defaultOverviewMode)
          .onChange(async (v) => {
            this.plugin.settings.defaultOverviewMode = v as
              | "heatmap"
              | "calendar"
              | "buddy";
            await this.plugin.saveSettings();
            // 仅 UI 设置，重渲染即可；已打开的 Memoria 视图也会立刻应用
            this.plugin.store.notifyChange();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.openOnStartup.name"))
      .setDesc(t("settings.openOnStartup.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.openOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.heading.newFeatures"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.density.name"))
      .setDesc(t("settings.density.desc"))
      .addDropdown((d) =>
        d
          .addOption("cozy", t("settings.density.cozy"))
          .addOption("compact", t("settings.density.compact"))
          .setValue(this.plugin.settings.density)
          .onChange(async (v) => {
            this.plugin.settings.density = v as "cozy" | "compact";
            await this.plugin.saveSettings();
            this.plugin.store.notifyChange();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.contentWidth.name"))
      .setDesc(t("settings.contentWidth.desc"))
      .addDropdown((d) =>
        d
          .addOption("focused", t("settings.contentWidth.focused"))
          .addOption("balanced", t("settings.contentWidth.balanced"))
          .addOption("wide", t("settings.contentWidth.wide"))
          .setValue(this.plugin.settings.contentWidth)
          .onChange(async (v) => {
            this.plugin.settings.contentWidth = v as
              | "focused"
              | "balanced"
              | "wide";
            await this.plugin.saveSettings();
            this.plugin.store.notifyChange();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.vim.name"))
      .setDesc(t("settings.vim.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.enableVimKeys).onChange(async (v) => {
          this.plugin.settings.enableVimKeys = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.mood.name"))
      .setDesc(t("settings.mood.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.enableMoodColoring).onChange(async (v) => {
          this.plugin.settings.enableMoodColoring = v;
          await this.plugin.saveSettings();
          this.plugin.store.notifyChange();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.smartReview.name"))
      .setDesc(t("settings.smartReview.desc"))
      .addToggle((tg) =>
        tg.setValue(this.plugin.settings.enableSmartReview).onChange(async (v) => {
          this.plugin.settings.enableSmartReview = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.language.name"))
      .setDesc(t("settings.language.desc"))
      .addDropdown((d) =>
        d
          .addOption("auto", t("settings.language.auto"))
          .addOption("zh-CN", t("settings.language.zh"))
          .addOption("en-US", t("settings.language.en"))
          .setValue(this.plugin.settings.language)
          .onChange(async (v) => {
            this.plugin.settings.language = v as "auto" | "zh-CN" | "en-US";
            await this.plugin.saveSettings();
            // v2.0.2: 立即重绘设置页，让 label/desc 即刻变成新语言
            this.display();
          })
      );

    // v2.0.16: 发送快捷键切换
    new Setting(containerEl)
      .setName(t("settings.sendHotkey.name"))
      .setDesc(t("settings.sendHotkey.desc"))
      .addDropdown((d) =>
        d
          .addOption("enter", t("settings.sendHotkey.enter"))
          .addOption("ctrl-enter", t("settings.sendHotkey.ctrlEnter"))
          .setValue(this.plugin.settings.sendHotkey)
          .onChange(async (v) => {
            this.plugin.settings.sendHotkey = v as "enter" | "ctrl-enter";
            await this.plugin.saveSettings();
          })
      );

    // v2.2.0: 移动端输入框入口模式（FAB / 常驻）
    new Setting(containerEl)
      .setName(t("settings.mobileInputStyle.name"))
      .setDesc(t("settings.mobileInputStyle.desc"))
      .addDropdown((d) =>
        d
          .addOption("fab", t("settings.mobileInputStyle.fab"))
          .addOption("always-visible", t("settings.mobileInputStyle.alwaysVisible"))
          .setValue(this.plugin.settings.mobileInputStyle)
          .onChange(async (v) => {
            this.plugin.settings.mobileInputStyle =
              v as "fab" | "always-visible";
            await this.plugin.saveSettings();
            // 立即重渲染所有 Memoria 视图，让 root class 跟着切换（不需要重启 OB）
            this.plugin.store.notifyChange();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.shortcut.heading"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.shortcut.name"))
      .setDesc(t("settings.shortcut.desc"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.shortcut.copy"))
          .onClick(() => {
            void navigator.clipboard
              .writeText(this.plugin.getCaptureUriTemplate())
              .then(() => {
                new Notice(t("settings.shortcut.copied"));
              })
              .catch((error: unknown) => {
                console.error("[Memoria] Failed to copy capture URI:", error);
                new Notice(t("settings.shortcut.copyFailed"));
              });
          })
      );

    new Setting(containerEl)
      .setName(t("settings.heading.about"))
      .setHeading();
    const p = containerEl.createEl("p", {
      cls: "setting-item-description",
    });
    p.appendText(t("settings.about.p1"));
    p.createEl("code", { text: "## yyyy-MM-dd" });
    p.appendText(" + ");
    p.createEl("code", { text: "- HH:MM" });
    p.appendText(t("settings.about.p2"));

    // GitHub 仓库链接
    new Setting(containerEl)
      .setName(t("settings.repo.name"))
      .setDesc(t("settings.repo.desc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("settings.repo.btn"))
          .setCta()
          .onClick(() => {
            window.open(
              "https://github.com/i-iooi-i/obsidian-memoria",
              "_blank"
            );
          })
      );

    const linkP = containerEl.createEl("p", {
      cls: "setting-item-description",
    });
    linkP.appendText("🔗 ");
    linkP.createEl("a", {
      text: "https://github.com/i-iooi-i/obsidian-memoria",
      href: "https://github.com/i-iooi-i/obsidian-memoria",
    });

    // 版本号显示
    const verP = containerEl.createEl("p", {
      cls: "setting-item-description",
    });
    verP.appendText(t("settings.version", { ver: this.plugin.manifest.version }));
  }
}
