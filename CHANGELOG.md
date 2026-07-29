# Memoria 开发日志

> 一个关于"想法变成现实"的小故事
> 
> **2026 年 4 月 25 日，从早到晚的一天**

---

## v2.3.9-beta.3（2026-07-29 · 复用移动端原生输入卡片）

### 修复

- iOS 快捷指令不再打开桌面式速记弹窗，改为进入 Memoria 后直接展开现有 FAB 输入卡片
- 移动端命令面板的「快速记录」同样复用 FAB 输入卡片，统一键盘、安全区和发送按钮体验
- 桌面端继续保留原快速记录弹窗与快捷键提示
- 撤回在 Obsidian iOS WebView 中未生效的 `visualViewport` 弹窗补丁

---

## v2.3.9-beta.2（2026-07-29 · iOS 键盘适配修复）

### 修复

- 快速记录弹窗跟随 iOS `visualViewport` 动态调整位置和高度，避免输入法遮挡发送按钮
- 弹窗关闭或插件卸载时清理视口监听器，避免重复打开后残留监听
- 将中文快捷指令说明中的「询问输入」纠正为苹果实际操作名「请求输入」

---

## v2.3.9-beta.1（2026-07-29 · iOS 快捷指令测试版）

本测试版新增外部文字快速记录入口，仅通过 GitHub Prerelease 分发，暂不提交 Obsidian 商店。

### 新增

- 新增 `obsidian://memoria-capture` 协议，可由 iOS 快捷指令直接写入文字闪念
- URI 未携带文字时打开现有快速记录弹窗
- 设置页可复制绑定当前仓库的 URI 模板
- README 补充中英文 iOS 快捷指令配置步骤与冷启动限制

### 测试范围

- 首版仅支持文字，复用 Memoria 原有 Markdown 写入流程
- 待验证中文、Emoji、换行、分享菜单、多仓库与 iOS 冷启动表现

---

## v2.3.8（2026-07-29 · 启动主页与移动端稳定性）

本版本新增可选的启动主页，并集中修复日历历史月份、iOS 图片选择和移动端图片预览问题。

### 新增

- 设置页新增「启动时打开 Memoria」开关；Obsidian 恢复工作区后自动打开或切换到 Memoria，不关闭已有标签页

### 修复

- 修复在历史月份点击有笔记日期后，日历可能跳回当前月份的问题
- 修复 iOS 首次插入图片成功、稍后再次拍照或选图可能无响应的问题
- 调整移动端图片灯箱关闭按钮的安全区位置，避免被系统状态栏遮挡
- 修复宠物孵化时小鸭帽饰变体无法正确生成的问题
- 修复长笔记折叠逻辑中的元素类型不匹配

### 工程

- 新增完整 TypeScript 类型检查，并纳入正式发版流程
- 更新存在安全公告的开发工具传递依赖锁定版本；插件运行时依赖仍为零漏洞

---

## v2.3.7（2026-07-08 · 回顾筛选与界面细节打磨）

本版本为「回顾」页增加临时筛选能力，并继续打磨桌面/移动端与中英文界面的视觉一致性。

### 新增

- 回顾页新增年份、标签、类型和关键词筛选，可在筛选池中换一批旧笔记
- PC 端侧栏支持收起，发送按钮改为更轻量的箭头图标

### 优化

- 回顾筛选栏改为更贴合 Memoria 卡片风格的背景、圆角和胶囊控件
- 修复回顾关键词输入框中文输入法被刷新打断的问题
- 统一回顾下拉框箭头与间距，并补充移动端换行布局
- 优化英文界面下宠物状态条、hover 顶栏和状态名显示，避免文字与进度条重叠

### 修复

- 修复行内代码字体在部分主题下显示不一致的问题

---
## v2.3.6（2026-06-30 · README 英文说明同步）

本版本补齐 GitHub 发布仓库中的 README 同步，确保 Obsidian 社区插件目录能直接读取到英文说明。

### 修复

- 将英文优先的双语 `README.md` 同步到发布仓库
- 发布流程补充 README / README.en 自动同步，避免后续版本遗漏文档更新

---

## v2.3.5（2026-06-30 · 商店巡检警告清理）

本版本继续处理 Obsidian 社区插件后台的自动巡检提示，重点降低误报和补齐英文商店说明。

### 修复

- README 改为英文优先的双语入口，满足插件目录的英文说明要求
- 将原生 `confirm()` 替换为插件内确认浮层，避免浏览器弹窗影响焦点
- 清理事件回调中的异步 Promise 返回，补齐错误处理
- 调整剪贴板和 Markdown 缓存类型处理，减少 unsafe 相关 lint 提示
- 避免在情绪关键词检测中使用控制字符正则

---

## v2.3.4（2026-06-30 · 商店合规、主题兼容与发布流程修复）

本版本集中修复 Obsidian 自动巡检发现的兼容性与代码规范问题，并重新整理主题样式覆盖。

### 修复

- 将最低 Obsidian 版本调整为 `1.7.2`，与实际使用的 `workspace.revealLeaf()` API 保持一致
- 补齐异步 API 的等待与错误处理，修复潜在的静默 Promise 失败
- 将固定内联样式迁移为 CSS class / `setCssStyles()`，设置页标题改用官方 `Setting` API
- 移除高开销的 `:has()`、重复颜色和不必要的兼容属性
- 大幅减少 `!important`，仅保留主题自身使用强制按钮样式时不可替代的少量覆盖
- 恢复输入框展开动画、发送按钮激活状态、搜索框圆角及统一按钮视觉
- 修复移动端侧栏按钮在桌面端误显示的问题
- 使用 Node 内置 `node:module` 替代已弃用的 `builtin-modules`

### 工程

- 接入 `eslint-plugin-obsidianmd`，发布前检查达到 0 error
- 统一 `manifest.json`、`package.json`、`versions.json` 为 `2.3.4`
- `2.3.4` 最低版本记录为 Obsidian `1.7.2`

---

## v2.3.3（2026-06-11 晚 · FAB 输入框改 fixed 贴底，根治键盘遮挡/抖动/✕ 消失）

v2.3.2 用 JS `scrollIntoView` 试图把长内容输入框滚回键盘上方，真机测试暴露了三个新问题：
1. 重开长草稿时仍被键盘遮挡（滚动时机在 iOS 上不可控）
2. 输入时界面**抖动频闪**（input 每次打字都 smooth 滚动，动画互相打断）
3. 右上角 **✕ 关闭按钮消失**（滚动把卡片顶部连同 ✕ 推出视口）

印证了"iOS 键盘 + scrollIntoView 是无底洞"。这次**换根本性方案**，彻底抛弃 scrollIntoView。

### 方案：FAB 展开态输入卡片改为 `position: fixed` 贴屏幕底部

- 卡片固定吸附在屏幕底部（`bottom: 0`）。iOS 键盘弹起时 Obsidian WebView 会收缩 layout viewport，`bottom: 0` 自动落在键盘正上方 —— 跟「常驻底部输入框」一直好用同理，不依赖任何 JS 滚动
- 卡片总高用 `max-height: 60vh` 限制；textarea 内部 `max-height: 38vh + overflow-y: auto`，**长内容在 textarea 内部滚动**，不再撑高整张卡片
- 卡片用 flex 纵向布局，工具栏/发送按钮行 `flex-shrink: 0` 固定在卡片底部，永远跟着卡片可见
- ✕ 按钮 absolute 定位在固定卡片内，**永远可见、不被滚走**

### 三个问题如何被根治

| 问题 | 旧方案（scrollIntoView） | 新方案（fixed 贴底） |
|---|---|---|
| 长内容被键盘遮 | 滚动时机不可控，仍被遮 | 卡片 fixed 贴底，永远在键盘上方 ✅ |
| 输入时抖动频闪 | input 每次 smooth 滚动互相打断 | 完全无页面滚动，零抖动 ✅ |
| ✕ 按钮消失 | 滚动把卡片顶部推出视口 | ✕ 在固定卡片内，永远可见 ✅ |

### 文件变更

- `manifest.json` `package.json` `versions.json` — 2.3.2 → 2.3.3
- `src/view.ts` — 删除 `scrollInputIntoView()` 及 focus/input/expand 三处调用；expandFabInput 改为 textarea 内部 `scrollTop` 滚到底（光标可见）
- `styles.css` — FAB 展开态输入卡片 `position: fixed` 贴底 + textarea `max-height: 38vh` 内部滚动 + 工具栏 `flex-shrink: 0`

---

## v2.3.2（2026-06-11 晚 · 修复移动端长内容输入框被键盘遮挡）

**现象**（移动端 FAB 模式）：按 ➕ 展开输入短内容时，输入框准确贴在键盘上方；但内容越输越长、或关闭后再次展开长草稿时，输入框底部（含发送按钮、正在输入的最后一行）会被键盘窗口遮住。

**根因**：v2.0.10 的"聚焦后滚动到键盘上方"逻辑只在 textarea `focus` 那一下触发一次。之后内容变长时 `autoResizeInput` 把 textarea 撑高，但**没有重新滚动**，底部就被键盘顶出视口；关闭再开时长草稿一上来就很高，单次 focus 滚动也压不住。

**修复**：抽出统一的 `scrollInputIntoView()` 方法，在三处复用——
- `focus`（延迟 300ms 等键盘动画结束）
- `input`（每次输入后延迟 0 立即跟手）
- `expandFabInput`（展开长草稿时光标移末尾后滚动）

滚动目标从"整个 card（block:end）"改为 **`.memoria-submit-wrap`（底部按钮行）+ block:nearest** —— card 过高时 block:end 会把顶部推到键盘后，而只要保证底部按钮行可见，光标所在的最后一行自然也在其上方可见；block:nearest 让已可见时不滚动、不抖动。

### 文件变更

- `manifest.json` `package.json` `versions.json` — 2.3.1 → 2.3.2
- `src/view.ts` — 新增 `scrollInputIntoView()`，focus / input / expandFabInput 三处复用

---

## v2.3.1（2026-06-11 晚 · 修复有内容时点 ✕ 收不起输入框）

**现象**：移动端 FAB 模式下，输入框有内容时点右上角 ✕「收起输入框」没反应；无内容时正常。

**根因**：✕ 按钮的点击处理调用 `collapseFabInput()`（漏传 `force=true`），落进了"草稿保护"分支——有内容时只 blur 键盘、卡片保持展开并 `return`，所以"点了没反应"。这是 v2.2.0 引入 FAB 时实现与注释不一致的疏漏（注释写着 ✕ 应 force 收起，但实际没传）。

**修复**：✕ 按钮改为 `collapseFabInput(true)` 强制收起。✕ 是用户主动收起的明确意图，应无条件收。草稿在输入时已实时 `saveDraft`，下次点 FAB 展开会 `loadDraft` 自动恢复，强制收起不会丢内容。

### 文件变更

- `manifest.json` `package.json` `versions.json` — 版本号 2.3.0 → 2.3.1
- `src/view.ts` — ✕ 按钮点击改传 `force=true` + 更新 `collapseFabInput` 注释

---

## v2.3.0（2026-06-11 · 移动端 FAB / 关闭按钮微调 + 侧栏年份开关）

紧接 v2.2.0 的 FAB 功能，根据移动端真机反馈做 3 处调整。

### 📱 1. FAB ➕ 按钮上移，避开 Obsidian 移动端底部工具栏

**现象**：手机端 FAB 默认位置太低，被 Obsidian 自身的移动端底部工具栏（navbar）遮住大半。

**修复**：`bottom` 从 `calc(20px + safe-area)` 抬高到 `calc(72px + safe-area)`，让 FAB 完整浮在工具栏上方。`env(safe-area-inset-bottom)` 继续叠加避开 iOS home indicator。

### 📱 2. 收起输入框的 ❌ 按钮放大

**现象**：输入卡片右上角的「收起输入框」✕ 按钮太小（针尖大小），几乎看不见。

**修复**：
- 容器 `28×28 → 36×36`，图标 `16×16 → 20×20`，`stroke-width: 2.4` 加粗
- 加常驻淡背景圆底（`--background-modifier-hover`），图标颜色从 `text-muted → text-normal` 提高对比
- `:active` 按下时变主题色高亮，反馈更明确

### 🗂️ 3. 侧栏「年份」列表增加显示/隐藏开关

**背景**：笔记跨度长（8 年甚至更多）的用户，右侧年份列表会很长造成视觉干扰。希望像「标签树」一样能在设置里关掉。

**实现**：
- `types.ts` 加 `showSidebarYears: boolean`，默认 `true`（沿用老行为，不影响现有用户）
- `settings.ts` 加 toggle 设置项（跟 `showSidebarTags` 同一套机制，切换后只 `notifyChange` 重渲染，不重读文件）
- `view.ts` 年份渲染包一层 `if (this.settings.showSidebarYears)`
- 中英文 i18n 文案

### 文件变更

- `manifest.json` `package.json` `versions.json` — 版本号 2.2.0 → 2.3.0
- `src/types.ts` — 加 `showSidebarYears` 字段 + 默认值
- `src/i18n.ts` — 年份开关中英文文案
- `src/settings.ts` — 年份显示 toggle
- `src/view.ts` — 年份渲染加开关判断
- `styles.css` — FAB `bottom` 上移 + close 按钮放大

---

## v2.2.0（2026-06-10 晚 · 移动端 FAB 浮动输入入口）

紧接 v2.1.3 的修复发版，加一个一直在心里盘算但没动手的功能。

### 背景

用户反馈：手机上输入框常驻底部占了**大块屏幕空间**（约 1/3），笔记列表只剩 2/3 可视，体验憋屈。希望对齐 flomo / Memos 移动端：默认隐藏输入框，**右下角浮动一个 ➕ 按钮**，点击才弹出输入框。

### 实现思路

#### 决策

1. **桌面端不做** —— 桌面屏幕大、键盘鼠标流畅，常驻输入框是更高效的选择
2. **默认开启 FAB** 但提供设置项允许切回常驻模式（兼容老用户习惯）
3. **写到一半离开不丢内容** —— 有内容时收起按钮触发后只 blur，不收卡片，避免误触
4. **位置右下角** —— 符合移动端右手大拇指习惯
5. **从底部滑上来** —— 跟桌面输入卡片底部位置语义一致

#### 实现

整体走 **CSS 主导 + 极少 JS 切 class** 的策略，零运行时 if/else：

| 层 | 控制项 |
|---|---|
| 媒体查询 `@media (hover: none) and (pointer: coarse)` | 桌面端永远 `display: none`，零运行时成本 |
| root class `.memoria-input-fab-mode` | settings.mobileInputStyle === "fab" 时挂 |
| root class `.is-fab-expanded` | FAB 点击后挂、发送/关闭按钮触发后摘 |

三层布尔组合的真值表：

| 设备 | mobileInputStyle | is-fab-expanded | FAB 显示 | 输入卡片显示 |
|---|---|---|---|---|
| 桌面 | * | * | ❌ | ✅ |
| 触屏 | always-visible | * | ❌ | ✅ |
| 触屏 | fab | false | ✅ | ❌ |
| 触屏 | fab | true | ❌（淡出） | ✅（滑上来） |

#### 关键细节

- **FAB 颜色跟主题走**：`background: var(--interactive-accent)`，紫色主题就是紫色 ➕，白色主题就是浅色 ➕，不需要单独配色
- **iOS home indicator 避让**：`bottom: calc(20px + env(safe-area-inset-bottom, 0px))`
- **按下反馈**：`:active` 时缩到 0.92 + 阴影变小，模拟物理按压
- **动画用 max-height + opacity**：避开 display 切换不能 transition 的限制；展开 0.25s、收起 0.22s
- **草稿保护**：写到一半点空白处只 blur 键盘，卡片保持展开（用户能看到自己写到哪了）；只有发送成功 / 主动点 ✕ / 退出编辑模式无草稿时才真正收回 FAB
- **编辑模式自动展开**：移动端 FAB 模式下，点某条卡片"编辑"时输入框是隐藏的，`enterEditMode` 自动触发展开 → focus

### 文件变更

- `src/types.ts` — 加 `mobileInputStyle: "fab" | "always-visible"`，默认 `"fab"`
- `src/i18n.ts` — 中英文文案（设置项 + 按钮 aria-label）
- `src/settings.ts` — dropdown 选择器 + 切换后立即 notifyChange 让 view 重渲染
- `src/view.ts` —
  - 加 `fabEl` 字段
  - `buildLayout` 末尾调 `buildFab()` 创建按钮 + close-btn + 初始 syncFabMode
  - 新方法 `syncFabMode / expandFabInput / collapseFabInput`
  - `renderAll` 头部调 syncFabMode（响应设置变更）
  - `submitMemo` 成功后在 fab 模式下自动收起
  - `enterEditMode` 在 fab 模式下自动展开
  - `exitEditMode` 在 fab 模式下无草稿时收回
- `styles.css` — 加 ~140 行 FAB 样式（包在 `@media (hover: none) and (pointer: coarse)` 内）

### 已知不实现的

- ❌ 长按 FAB 显示快捷菜单（截图 / 录音 / 拍照）—— Memoria 不做大而全
- ❌ 打字过程中拖动 FAB 改位置 —— 增加复杂度，价值不高
- ❌ 桌面端 FAB —— 桌面键鼠流畅，常驻更高效

---

## v2.1.3（2026-06-10 晚 · 折叠/全文/平板适配的 4 处 UI 修复）

时隔近一个月再发版。用户在使用过程中累积了 4 个细小但碍眼的 UI 问题，今晚一并修复。

### 🐛 1. 任务列表折叠时复选框方框被切

用户截图反馈"折叠的笔记里 task list 每一行的复选框 □ 都缺了左边一竖，看起来像 `]`"。

排查发现这其实是两个**独立**的子问题叠在一起：

#### 1a. 整列复选框左侧方框被 overflow 裁掉（主问题）

**根因**（v2.0.5 的延伸 bug）：
- Obsidian 默认主题 / 多数主题给 task-list 复选框加**负 margin-left**，让方框稍微"伸出 li 左边界"作为视觉装饰
- `.is-collapsed` 加了 `overflow: hidden`（截断超长内容必须），把负 margin 区域里的方框左竖**切掉了**
- 表现：折叠卡片里**每一行**的复选框都缺左竖

v2.0.5 已经在 `.is-compact` 模式下修过同一个 bug（给 ul 加 `padding-left` 把复选框挤回 li 内部）。这次把同样的策略复用到 `.is-collapsed`：

```css
.memoria-card-body.is-collapsed ul.contains-task-list {
  padding-left: 1.8em;
}
.memoria-card-body.is-collapsed ul.contains-task-list li.task-list-item input[type="checkbox"] {
  margin-left: 0;
}
```

#### 1b. 最后一行被截到一半，残影从 fade 渐隐处露出

**根因**：
- 折叠时 `max-height = lineH × N`，按"普通段落行高"算
- 任务列表 `<li>` 实际高度 ≈ lineH + 4-6px（含 padding/checkbox）
- 截断卡到某行**中间**，最后那行的下半部从 max-height 露出
- 旧 fade 渐变（透明 0% → 不透明 90%）让残影**渐隐却没遮住**

**修复**：
- fade 高度 40 → 64（够盖住一整个 `<li>` 高度）
- 渐变 stop 改为 `transparent 0% → transparent 30% → bg 60% → bg 100%`
- 上半 30% 透明保留"最后一行的清晰可读"，下半 60%+ 纯背景色完全遮住"半行残影"

### 🐛 2. 长文不带标签时「全文 v」按钮位置错乱

**现象**：
- 带标签的折叠卡片：「全文 v」贴卡片右下 ✅
- **不带标签**的折叠卡片：「全文 v」漂在卡片中部偏左 ❌

**根因**（v1.3.6 的 placeBtn 优先级缺陷）：
- 旧策略 host 优先级：`tagRow` → **`imgGrid`** → `body`
- 不带标签时 host 落到 imgGrid，而 `.memoria-img-grid` 自身有 `max-width: 380px`（单图 `260px`）
- 按钮即便 `grid-column: 1 / -1` + `justify-self: end`，也只能贴 imgGrid 的右边
- imgGrid 右边距离卡片右边还有 ~600px → 按钮看起来浮在卡片"中间偏左"

**修复**：
- 把 imgGrid 从 host 候选剔除：`tagRow ? tagRow : card`
- 新增 CSS 规则 `.memoria-card > .memoria-collapse-toggle` 用 block 级 `margin-left: auto` 贴卡片右边缘
- 删除已不需要的 `.memoria-img-grid > .memoria-collapse-toggle` 和 `.memoria-card-body > .memoria-collapse-toggle` 规则
- 现在不论有没有图、有没有标签、有没有折叠，按钮永远视觉对齐到卡片右下角

### 📱 3. 平板（iPad）输入框第一个中文字被裁

**现象**：用户用 iPad 默认主题、关掉除 Memoria 外所有插件，输入框第一行第一个字"测""此"等中文字左侧被裁掉 1-2px，看起来像"则"。

**根因**：
- v1.4.14 / v1.4.16 已经修过这个 iOS WebView 字渲染 quirk —— 给 textarea 加 `padding-left: 4px / padding-top: 2px / -webkit-appearance: none` 安全区
- 但**那段修复包在 `@media (max-width: 680px)` 里**，只对手机生效
- iPad 横屏 1180px / 纵屏 820px 都超过 680，走桌面通用规则（`padding: 0 !important`）→ 同样的字渲染问题再次出现

**修复**：
- 新增一段 `@media (hover: none) and (pointer: coarse)`（W3C 规范定义的"主输入是触屏"判定）
- 复制最关键的字渲染 padding 安全区，覆盖所有触屏设备（iPhone + iPad + Android）
- 桌面端无论窗口多窄都是 `hover: hover, pointer: fine`，完全不受影响
- 不复制 `min-height: 56px / font-size: 15px` —— 那是手机紧凑布局，iPad 大屏不需要

### 📱 4. 平板纵屏发布时间编辑框遮住发送按钮

**现象**：iPad 纵屏编辑卡片时，发布时间的 datetime-local 输入框把发送按钮挤出可视区。横屏正常。

**根因**：
- v2.0.8 的 datetime 换行布局（datetime 在第一行 / 取消+发送在第二行）阈值是 `@media (max-width: 680px)`
- iPad 纵屏 CSS 视口约 810-834px，**超过 680** → 走桌面单行布局
- iOS 的 `datetime-local` 控件在窄屏上特别宽，"datetime + 取消 + 发送"三件套一行塞不下 → 发送被挤出

**修复**：阈值 `680px → 900px`：
- iPad 纵屏（~820px）走换行布局，发送按钮稳定可见 ✅
- iPad 横屏（~1180px）继续走桌面单行布局 ✅
- 桌面继续单行 ✅
- 手机继续换行（值更小，仍在范围内）✅

### 不修复的相关问题

用户提到的两个平板小问题已全部覆盖。与上次 v2.0.9~2.0.11 的 iOS form control 折腾经验一致 —— **这次没有去硬刚 datetime-local 自身的尺寸/对齐，仍然让它按 iOS 默认行为贴右换行**，只是把生效范围从手机扩到平板纵屏。务实路线，零 quirk，跨平台一致。

### 文件变更

- `manifest.json` `package.json` `versions.json` — 版本号 2.1.2 → 2.1.3
- `src/view.ts` — 改 `placeBtn` 优先级，imgGrid 不再作为 host
- `styles.css` —
  - 折叠 fade 遮罩高度+渐变 stop 调整（修复 1）
  - 删旧的 `.memoria-card-body > .memoria-collapse-toggle` / `.memoria-img-grid > .memoria-collapse-toggle` 规则
  - 新增 `.memoria-card > .memoria-collapse-toggle` 规则（修复 2）
  - datetime 换行 media 阈值 680 → 900（修复 4）
  - 新增 `@media (hover: none) and (pointer: coarse)` 触屏 textarea 字渲染保护（修复 3）

---

## v2.1.2（2026-05-13 凌晨 · 修复从 Obsidian 主编辑器粘贴时双链/标签丢失）

用户反馈：从 Obsidian 主编辑器复制 `[[笔记名]]` 或 `#标签` 粘到 Memoria，结果**双链变成了 `[笔记名](url)` 普通 markdown 链接、标签变成超链接文本**。

### 根因

v2.0.0 引入过一个"剪贴板富文本 → Markdown"转换：看到 HTML 里有 `<a>` / `<strong>` / `<ul>` 等语义标签就走转换，保留网页的排版结构。

但 Obsidian 复制时剪贴板同时放了两份数据：
- `text/plain`: `[[笔记名]]`（正确的 markdown 语法）
- `text/html`: `<a class="internal-link" href="...">笔记名</a>`（渲染后的 HTML）

我们一看见 `<a>` 就走了 HTML 转换路径 → 变成 `[笔记名](url)`，双链语义丢失。

### 修复

前置加一个 `looksLikeMarkdown(plainData)` 检测 —— 如果 plain text 已经**明显是 markdown**（含 `[[...]]` / `` ``` `` / 行首 `#` / `**...**` / `==...==` 等），直接走浏览器默认粘贴路径，不做任何 HTML 转换。

### 场景验证

| 来源 | 内容 | v2.1.1 表现 | v2.1.2 表现 |
|---|---|---|---|
| Obsidian 复制 `[[笔记]]` | 双链 | ❌ 变成 `[笔记](url)` | ✅ 保持 `[[笔记]]` |
| Obsidian 复制 `#文艺/金句` | 标签 | ❌ 变成 `[#文艺/金句](...)` | ✅ 保持 `#文艺/金句` |
| Obsidian 复制 `` ```code``` `` | 代码块 | 可能被转换 | ✅ 保持原样 |
| 微信公众号 / 网页富文本 | 加粗/链接混排 | ✅ 转 markdown | ✅ 转 markdown（未受影响） |

---

## v2.1.1（2026-05-11 凌晨 · 宠物孵化改为真随机）

发完 v2.1.0 一小时内用户反馈：手机上孵化的宠物和电脑上的**外观一模一样**。

排查后发现这不是 bug，是 v2.1.0 的设计选择 —— 种子 = `hash(vaultName + chosenName)`，用户两个设备 vault 名相同 + 起了同样的名字，hash 出来当然同款。

### 为什么这次改了

我之前列出的"为什么决定论好"的三个理由，重新审视后只剩一个真正成立：

| 理由 | 实际成立吗？ |
|---|---|
| ① 数据丢了能找回原宠物 | 🤷 极少触发，且用户接受"重新开始" |
| ② 跨设备同步看到同一只 | ❌ **要靠 data.json 同步，不是靠确定性算法**（用户只同步 md 时根本不生效）|
| ③ 防止"刷宠物" | ✅ 但已经有"外观锁定不能重置"挡着了 |

代价是"两个用户起同名字得到一样的宠物"，违反"独一无二"直觉 —— 用户的反馈印证了这一点。

### 改动

```ts
// 之前：
const seed = stringHash(`${vaultName}::${chosenName.trim()}`);

// 现在：
const seed = ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
```

时间戳 XOR 32-bit 随机数 —— 每只宠物都是独一无二的，世界上没有第二只跟你的吉吉外观一样。

### 影响范围

- **已存在的宠物不受影响**（孵化时种子已固化在 settings 里）
- **未来新孵化**：每次都是真随机，跨设备起同名也会得到不同宠物
- **"外观锁死、不能重置"哲学保留**：你的吉吉永远是吉吉

---

## v2.1.0（2026-05-11 凌晨 · 大版本：宠物模块 + Markdown 包裹 + Ctrl+Z 救火）

时隔半个月的大版本。两个大改动 + 两个真实 issue 的回应：

- 🐾 **侧栏新增"宠物"** —— Memoria 的小伙伴
- ✏️ **Markdown 选中包裹快捷键** —— 选中按 `**` 加粗、`==` 高亮、`*` `~~` `` ` `` 一应俱全
- 🐛 **Ctrl+Z 撤销失效**修复 —— 标签选择器、列表按钮等场景

老用户升级零感知，主路径完全不变。

### 🐾 新增：宠物模块（侧栏第三个视图）

侧栏顶部新增"宠物"视图。一只用 ASCII 字符画的小动物，由你给它起的名字 hash 出来 —— 物种、稀有度、帽子、眼睛、是否 shiny 都是命中注定的。

**它会做什么**：
- **5 维属性条**反映你的笔记习惯（结构化程度、平均字数、活跃度波动、标签/双链使用、情绪表达）
- **气泡碎碎念**根据情境随机说话（周末 / 深夜 / 久未打开 / 今天笔记主导情绪等 90+ 句候选）
- **三阶段成长**：幼年 / 少年 / 成年，按陪伴天数 OR 笔记总数任意一个达标即升阶；升阶只是"气场"在变（头顶 ✦ ✦ / 底部 ┈┈┈），物种本身不变

**设计哲学**（灵感来自 Claude Code Buddy，但更克制）：
- **命中注定**：外观由名字 hash 锁定，不能换、不能重抽
- **不打扰**：顶栏（稀有度/阶段/天数）默认隐藏，hover 才显示
- **不焦虑**：5 维只是"行为镜像"，不是经验条，没有"必须满级"
- **要陪伴**：名字可改（取错了不致命），双击名字 rename

不喜欢宠物完全不用孵化（不点蛋上的"孵化"按钮），不影响主功能。

移动端用 `@media (hover: none)` 检测触屏自动适配，顶栏改为常显。

### ✏️ 新增：Markdown 选中包裹快捷键

来自 GitHub issue 反馈：在 Memoria 输入框里选中文字按 `**`，期望是变成 `**粗体**`，结果是把文字直接替换掉了 —— 普通 textarea 的原生行为。

现在支持：
- 选中 + `*` → `*hello*`（斜体）
- `*hello*|` 后再按 `*` → `**hello**`（升级粗体）
- 选中 + `==` → `==hello==`（高亮）
- 选中 + `~~` → `~~hello~~`（删除线）
- 选中 + `` ` `` → `` `hello` ``（行内代码）

未选中时这些键都是普通输入（`1=2` 不被误处理）。IME 中文输入态、Ctrl/Cmd/Alt 修饰键组合都不拦截。

### 🐛 修复：Ctrl+Z 撤销栈失效（同一 issue 的另一半）

同一个 issue 用户提到"输入框里 Ctrl+Z 不工作"。代码里有 11 处用 `el.value = newText` 直接赋值 —— **会清空浏览器的 undo stack**。最典型场景：输入 `#` 触发标签下拉，选中标签 → tag-suggest 用 `el.value = ...` 替换 → 用户按 Ctrl+Z **整段历史都没了**。

封装 `replaceTextareaRange()` 工具函数，优先用 `document.execCommand('insertText')` —— 这个 API 虽然 deprecated 但走"模拟键盘输入"路径，**进 undo stack**。`setRangeText()` 反倒不进，这是 Obsidian/Electron 实测才发现的。

覆盖范围：标签选择器、工具栏的列表/待办/引用按钮、卡片"引用为新笔记"、新加的 Markdown 包裹快捷键。

### 🐛 修复：宠物"陪你 N 天"算错

刚加的功能就发现 off-by-one bug：用 `floor((now - hatchedAt) / 86400000)` 算的是"整数 24 小时数"，不是"日历天数"。

| 场景 | 之前 | 修复后 |
|---|---|---|
| 上午 10:00 孵化，次日 9:00 看 | 显示 0 天 ❌ | 显示 1 天 ✅ |
| 跨夏令时 23h/25h | 可能差 1 天 ❌ | 准确 ✅ |

改为"按本地时区把日期归零到 00:00:00 后再相减"，`Math.round` 容忍 DST。

### 🧹 性能：`Math.min(...arr)` / `Math.max(...arr)` 改 reduce

1300+ 条笔记数据集触发的隐患：用 spread 把 1k+ 参数传给 `Math.min/max` 在某些 JS 引擎里会踩到栈溢出（V8 默认上限 65535 但实际更早就有性能拐点）。

stats.ts 和 quips.ts 各一处，改成 reduce 一行。功能不变，长期数据集也安全。

### 已知非 bug 的设计选择

- **宠物外观一旦孵化锁死，没有"重置/重抽"功能** —— "命中注定"哲学，可换 = 它只是个皮肤
- **5 维属性是行为镜像，不是经验条** —— 没有"满级"概念，写得多自然涨
- **移动端无双击重命名 / 无 hover 浮出** —— 触屏物理限制，重命名是低频操作可接受

---

## v2.0.20（2026-05-09 深夜 · 新功能 + code review 清扫）

两件事一次发：一个是用户提出的新 feature（侧栏默认视图可配），一个是我自己对着代码树过 code review 发现的一圈小问题。

### ✨ 新增：设置「侧栏默认视图」

之前侧栏顶部默认是"热力图"，想看月历的用户每次打开 Memoria 都要点一次切换按钮。加个设置项解决：

**设置 → Memoria → 侧栏默认视图**（新）
- 🔥 热力图（默认，沿用老行为）
- 📅 月历

**交互细节**：临时切换（点切换按钮）**只在当前会话生效**，不回写设置。想清楚以下 3 种典型场景都要符合直觉：

- 用户设置了默认"月历"，想临时看下热力图 → 点切换 → 看完 → 下次打开还是月历 ✓
- 用户在已打开的 Memoria 里改设置默认值 → 视图立即跟随变化 ✓
- 用户先手动切到了月历，然后去设置页把默认改成热力图 → 当前已切到月历的视图**保持月历不变**（尊重用户的当前选择），直到下次重开 view ✓

实现上用了一个 `overviewModeOverridden` flag：`false`（默认）→ 跟随 `settings.defaultOverviewMode`；用户点切换按钮一次后变 `true` → 当前会话锁定不再跟随设置。

---

### 🐛 修复：智能回顾的情感配对可能算错（`smart-review.ts`）

v2.0.0 引入 7 种 mood 后，`dominantMood` 的 `count` 对象只初始化了 5 个 key（漏了 `inspired` / `fear` / `tired`）。当 `detectMood` 返回这三种之一时：

- `count[mood]++` 把 `undefined` 变成 `NaN`
- 后续 `sort((a, b) => b[1] - a[1])` 对 NaN 的行为不定
- 结果：智能回顾在这三种主导情绪下的"情感配对加分"可能没加到位

**为啥 TS 没报错**：`tsconfig.json` 没开 `"strict": true`，`Record<Mood, number>` 缺 key 编译不拦。这次先补全 8 个 mood key，`strict` 改造留到下一次。

### 🐛 修复：设置页顶部多了一个冗余 `<h2>` 标题

`settings.ts` 第一行 `containerEl.createEl("h2", { text: t("settings.title") })`——插件名本身已经是 Obsidian 设置页的标题，再加 h2 是商店审核明确不鼓励的做法。v1.4.15 清理商店合规时漏了这处，这次删掉。

### 🐛 修复：搜索高亮对含 HTML 特殊字符的关键词失效（`search.ts#highlightTerms`）

原逻辑是先 `escapeHtml(text)`（`<` → `&lt;`）再用**未 escape 的 term** 构造正则。用户搜 `<script>` 之类的关键词永远匹配不到（目标文本里已经是 `&lt;script&gt;`）。现在对 term 也先 escapeHtml 后再 escapeRegExp，保证同域匹配。

注：`view.ts` 的另一套 DOM 文本节点高亮路径（卡片内的搜索命中染色）没这个问题，所以 UI 观感上感知不到，但 API 导出路径会更一致。

### 🐛 修复：导出同一分钟内连点两次会抛 "File exists"（`export.ts`）

`memoria-export-20260509-0130.md` 文件名精度到分钟，同一分钟第二次点"导出为 md"必抛错。现在文件名加 4 位随机后缀 `memoria-export-20260509-0130-a3f2.md`，同一分钟连点多次也互不冲突。

### 🐛 修复：确认对话框的 mouseup listener 可能残留（`view.ts`）

和 `main.ts` quickCapture 的 v1.4.11 修复思路一致——如果用户 mousedown 后把鼠标拖出浏览器窗口松开，mouseup 永远触发不了，listener 就挂在 document 上回不来。之前 delete 对话框（`confirm()`）有同款问题，这次补上 `pendingMouseUp` slot + close 时统一清理。

虽然实际影响非常小（close 后 backdrop 已 remove，listener 里的 `ev.target === backdrop` 永远 false，不会错关），但仍算一处泄漏，顺手补了。

### 🌍 i18n 补齐：英文用户看到的中文角落

之前 i18n 架构已经覆盖了 90% 的界面，但有几处"不常被英文用户看到"的地方漏翻了，这次一起补：

| 位置 | 原 | 修复后 |
|---|---|---|
| 长笔记折叠按钮 | "全文" / "收起" | `card.collapseFull` / `card.collapseFold` |
| 侧栏月历星期头 | `["日","一","二",...]` 硬编码数组 | `calendar.weekday.0-6`（含英文 `S M T W T F S`） |
| 侧栏月历 aria-label | "上个月" / "下个月" | `calendar.prevMonth` / `calendar.nextMonth` |
| 侧栏月历标题 | `${year}年${m+1}月` | `calendar.monthTitle`（英文 `m/year`） |
| 侧栏月历 hover | `${key}  ${count} 条` | `calendar.dayCount` |
| 图片 lightbox aria-label | "关闭" / "上一张" / "下一张" | `lightbox.close` / `prev` / `next` |
| 年度热力图按钮 | `${year} 年` | `stats.yearBtn` |
| 年度热力图 hover | `${key}  未来` / `${key}  N 条` | `stats.heatmap.future` / `stats.heatmap.dayCount` |
| 月度柱图 hover | `${mo.key}: ${n} 条` | `stats.monthlyBarRange` |
| 标签云 tooltip | `${c} 条` | 复用 `list.totalCount` |
| 年度全景 day hover | `${key}  ${t("list.totalCount")}` | `year.dayHover` |
| 导出文件 filter 描述 | `"今天"/"本周"/"${year} 年"/"全部笔记"` | 走 i18n（`export.desc.all` + 现有 sidebar key） |

导出文件的 filter 描述影响最大——之前英文用户导出的 md/html/json 里 filter 字段永远是中文，这次修掉。

### 🛡️ 防御性：`t()` 翻译函数对 `$&` / `$1` 的保护

`i18n.ts` 的 `t()` 用 `text.replace(regex, String(v))` 做参数替换。如果 `v` 恰好含 `$&` / `$1` 等 replace 的回溯引用，会被当作引用输出乱码。当前所有调用点都传数字/标签名，没风险；但 `t("notice.saveFailed", { msg: err.message })` 这种用法已经存在，某天 err.message 里含 `$` 就会中招。

改用 `replace(re, () => String(v))` 函数形式的 replacer，从根上避免回溯引用被解释。

### 🧹 小优化

- `stats.ts` 年度热力图 weeks 计算改用 `floor(…+0.5)`，跨 DST（欧美夏令时）时更稳（国内没 DST，视觉上感知不到）

### 已知未修（优先级更低，留给下次）

- `tsconfig.json` 没开 `strict: true`。这次的 `dominantMood` 漏 key 就是这个留下的口子。开 strict 会一次性暴露一批问题，改动面大，下一版单独处理
- `image-grid.ts` 的 `openLightbox` 挂到 `document.body` 且 keydown listener 不走插件 `this.register()`。场景：用户打开 lightbox 后立刻禁用 Memoria，keydown listener 残留。影响微乎其微，涉及改接口签名，暂搁置

---

## v2.0.18（2026-05-09 凌晨 · 收尾打磨）

接着 v2.0.17 发版后用户反馈的几个细节问题，做一轮收尾打磨。三个看似无关的小修，根因恰好串起了"渲染 / 解析 / 视觉"三条不同维度。

### 🐛 修复：发送笔记后输入框不收回收起态

v2.0.17-iter14 已经在 `submitMemo` 末尾调过 `inputEl.blur()` 并重排了执行顺序（先 blur 后 autoResize），原以为修好了。但用户实测仍然不收回，DevTools 诊断显示：is-focused class 已正确移除，但 textarea 的 inline `height` 卡死在 98px。

进一步分析后发现根因不在 focus 状态，而在 `autoResizeInput()` 自身的 scrollHeight 测量逻辑：

不同用户的字体 / `line-height` / `padding` 组合下，**空 textarea 在 `height:auto` 状态下的 scrollHeight 不一定等于 lineHeight × 1**——实测某些字体环境下空内容会算出 96px，再加 2px 误差吸收 = 98px。

而 `autoResizeInput` 的判定逻辑是：
- `contentHeight ≤ expandedMin (96)` → 清空 inline height（让 CSS 接管）
- 反之 → 设 inline height = scrollHeight

`98 > 96` 落入 else 分支，inline height 被锁成 98px。即便后续 CSS min-height 已经回到 40，inline height 优先级更高，textarea 死死卡在 98px。

**修复（iter15）**：value 为空时直接清 inline height 提前 return，不进入 scrollHeight 测量分支。空内容的高度 100% 由 CSS min-height 决定，不再受字体环境干扰。

```ts
// src/view.ts: autoResizeInput
if (el.value.length === 0) {
  el.style.height = "";
  // ... 恢复 transition
  return;
}
// 非空才走原有的 scrollHeight 测量分支
```

### 🐛 修复：多行 memo 中间连续空行导致内容被截断

用户输入：
```
这是一个测试1
[多个空行]
这是一个测试2
```

发送后再打开，只剩"这是一个测试1"，下面全部丢失。

排查发现写入端没问题——`renderMemo` 把 memo 正文每行缩进 2 空格、空行保留为空字符串，markdown 文件结构完全正确。

bug 在 **parser 读回时**。`parseFile` 处理"缩进续行 + 空行"的逻辑只往后 peek **一行**：

```ts
// 老代码（有 bug）
if (next.trim() === "") {
  const peek = lines[i + 1];
  if (peek?.startsWith("  ")) { ... continue; }
  break;  // 其余情况一律结束
}
```

用户连续敲了多个空行 → peek(i+1) 还是空行（不以"  "开头）→ 判定 memo 结束，break！后续即便有缩进的"这是一个测试2"也被当作"文件其他内容"忽略掉。

**修复（iter16）**：改为跳过任意多个连续空行，看再之后第一行是否仍是本 memo 的缩进续行（且没撞到下一条 memo / 日期头 / 年份头）：

```ts
if (next.trim() === "") {
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === "") j++;
  // 边界检测略
  if (lines[j]?.startsWith("  ")) {
    for (let k = i; k < j; k++) bodyLines.push("");
    i = j;
    continue;
  }
  break;
}
```

值得欣慰的是：**md 文件本身没被破坏**，只是 parser 没读完整。修复后用户原来"看似丢失"的 memo 重新加载就完整恢复了，零数据损失。

### ✨ 右侧顶部标题 emoji 补全

用户反馈：右侧顶部的当前筛选状态横幅，部分 preset 自带 emoji（📌 置顶 / ⭐ 收藏 / 🕰️ 往年的今天 / 🎲 随机 5 条），其他 preset 却光秃秃的（今天 / 本周 / 待办 / 无标签 / 有图片 / 有链接），视觉风格不统一。

补齐：

| 项 | 改后 |
|---|---|
| 今天 | ☀️ 今天 |
| 本周 | 🗓️ 本周 |
| 待办 | ✅ 待办 |
| 无标签 | 🏷️ 无标签 |
| 有图片 | 🖼️ 有图片 |
| 有链接 | 🔗 有链接 |

设计取舍：emoji 只在 `view.ts:describeFilter()` 拼标题时手动加，**不写进 i18n 文案**。原因：
- 侧栏继续维持 lucide 线条图标 + 纯文字的极简风（侧栏导航需要密集列表里的视觉冷静）
- 右侧顶部的"当前筛选状态"才是醒目焦点位，emoji 在这里点睛最合适
- i18n key 不被污染，未来其他场景引用 `sidebar.today` 等 key 时不会突然多出一个 emoji 跑去其他地方

`today` 选 ☀️ 而不是 📅，是为了避开下面 `this.filter.date` 已经用了 📅 的情况（用户同时按某天筛选时不会出现「📅 今天 · 📅 2026-05-09」这种重复）。

### 开发复盘

- v2.0.17 上线后又发现的三个问题，刚好分布在三条不同代码路径上：渲染（autoResizeInput）/ 解析（parseFile）/ 视觉（describeFilter），互不耦合，所以可以在同一版本里安全合并修复
- 第一个 bug 让我反思了 v2.0.17 的"调换 blur/autoResize 顺序"修复——那个修复**对一部分用户管用**（CSS min-height 主导的场景），但对 scrollHeight 本身就 ≥ 96 的字体环境无效。真正的兜底应该是"空内容直接早 return"，不依赖任何 CSS 状态——这次才是真的修干净了
- parser 那个 peek 一行的逻辑写于很早期版本，只 cover 了"行尾留个空行 + 接续缩进"的常见情况；用户连敲多空行的真实使用模式才是边界 case，需要扫描穿透。提醒：peek 类逻辑都要问一句"如果 peek 拿到的也是同样的特殊符号怎么办？"

---

## v2.0.17（2026-05-08 深夜 · 接着 v2.0.16）

### ⌨️ 默认回到 Ctrl+Enter 发送 + 真相提示

v2.0.16 发版后继续排查 Ctrl+Enter 失效问题，通过更精确的 `window` capture 诊断（Enter / Ctrl+Enter / Ctrl+Shift+Enter 三键对照），锁定了真正的凶手：

> **Obsidian 内置命令「在新标签页中打开光标处链接」默认占用了 Ctrl+Enter**

但这个坑点的戏剧性在于：**Obsidian 的快捷键页面按键盘图标搜 Ctrl+Enter 根本搜不到它**（Obsidian 的 bug，对这种"需要光标在链接上才生效"的命令在按键搜索里被过滤掉了）。必须手动滑到列表对应位置才能看到。

铁证诊断数据：
- `Ctrl+Enter` → window-capture 阶段就 `defaultPrevented=TRUE`，`document` 根本收不到（被 Electron/Obsidian 主程序命令层在 JS 监听器之前吞掉）
- `Enter` → 三层都能正常到达
- `Ctrl+Shift+Enter` → 三层都能正常到达（该组合键未被任何 Obsidian 命令占用）

由此证明：**和第三方插件无关**，是 Obsidian 主程序本身的默认绑定；解绑后 Ctrl+Enter 立刻恢复。

#### 本次调整

1. **默认值改回 `ctrl-enter`**（对齐 flomo 实际体验，多数用户期望）
2. **两种模式完全互斥**（修掉 v2.0.16 遗留的 bug）：
   - v2.0.16 里 `enter` 模式下 `Ctrl+Enter` 也会发送（"老肌肉记忆兼容"的初衷），但这导致用户设置成 `Enter` 模式后 `Ctrl+Enter` 依然能发送，设置形同虚设
   - v2.0.17 改为严格互斥：`enter` 模式**仅**纯 Enter 发送，`ctrl-enter` 模式**仅** Ctrl/Cmd+Enter 发送；main.ts 的 QuickCapture 弹窗同步修正
3. **设置项描述重写**：明确告诉用户如果 Ctrl+Enter 无效，请到 Obsidian 设置 → 快捷键 列表中找到「在新标签页中打开光标处链接」并点 × 解除绑定（并特别说明按键搜索搜不到、需要手动滑动查找）
4. 删除了旧文案中对 flomo / Smart Composer 等其他产品名的提及，保持描述中性客观

#### 开发复盘

- v2.0.14：想修 Ctrl+Enter，手一抖写了 `this.scope.register(...)` 把整个视图搞白屏了
- v2.0.15：紧急救火
- v2.0.16：根据当时不完整的诊断数据误判为"插件冲突 + 无解"，草率把默认改成了 Enter
- v2.0.17：拿到完整诊断，锁定是 Obsidian 自带命令占用，解绑即恢复，默认值改回更符合直觉的 Ctrl+Enter

**教训**：在 JS 监听器全部 `defaultPrevented=true` 时，不要急于归咎于"运行时拦截无法修复"，应该先把 Obsidian 自身的 Hotkeys 列表**从头滑到底**查一遍（不要只信搜索框）。

### ✨ 输入卡片渐进式披露动画（对齐 flomo 网页端）

参考 flomo 网页端的"默认收起、聚焦展开"交互，改造输入卡片：

**默认（收起态）**：
- textarea 收矮到 40px（约 1 行 + 余量，仍能看清 placeholder「此刻，你在想什么？」）
- 工具栏整体 opacity 0.55（图标变灰，存在感低）
- 发送按钮 opacity 0.7 + saturate 0.7（淡色低饱和）
- 顶部分隔线也轻微淡化

**触发展开**（任一条件满足即展开）：
- 🎯 **点击输入框**（焦点进入）—— 桌面/移动端通用主入口
- `has-content` —— 已经有内容（草稿/工具栏插入的标签等）→ 强制展开，避免用户切去看笔记时草稿区域意外塌下去
- `is-editing` —— 进入编辑某条 memo 模式
- `dragging` —— 正在拖图片进来

**不用 hover 触发的设计决策**：鼠标在笔记列表 ↔ 工具栏间穿梭经常路过输入框，hover 会带来大量视觉噪音；点击 = 明确写作意图，两者不应同等对待。这也让桌面/移动端体验完全一致（移动端本来就没 hover 概念）。

**动画**：0.7s `cubic-bezier(0.4, 0, 0.2, 1)`（Material Design 标准缓动），兼顾"看得出动画"和"不拖沓"。

**收益**：阅读区垂直空间多出约 30px，长列表浏览体验更连贯。

#### 实现踩坑全记录（这个动画总共调了 13 轮才落定）

1. **iter1 (CSS-only)**：`:hover` / `:focus-within` 直接驱动 `min-height` transition。理论很美，**实际 CSS 完全没生效** —— styles.css 里第 505 行的旧规则 `transition: height 0.08s ease` 写在新规则之后，CSS 后写覆盖前写，新的 transition 被压死了。诊断脚本读 `getComputedStyle().transition` 才看到真相。

2. **iter2 (height vs min-height)**：删掉旧规则后 transition 终于挂上 `min-height`，但视觉**仍无变化**。原因：JS 的 `autoResizeInput()` 用 inline `style.height = "47px"` 压住了 CSS min-height（inline 优先级 > stylesheet）。改造方案：**JS 只在内容超过展开态最小值时才设 inline height，其余情况清空让 CSS min-height 接管**。

3. **iter3 (textarea rows quirk)**：min-height 终于驱动渲染高度变化，但展开依然像"突然弹起"。原因：textarea 默认 `rows=2`，浏览器对 textarea 的渲染高度 = `max(min-height, rows×lh, content)`，rows=2 ≈ 44.79px > min-height 起点 40px，导致动画前段视觉无变化。把 textarea 的 `rows` 改为 `1` 让 min-height 全程主导。

4. **iter4 (打字时不卡顿)**：`min-height` 和 `height` 都挂慢 transition 后，连续打字时每多一行就要等很久才长高，体验灾难。解决：JS 在 `autoResizeInput()` 设 inline height 前临时加 `.memoria-no-transition` class，下一帧通过 `requestAnimationFrame` 移除。

5. **iter5 (Chromium :hover bug)**：动画时长终于走对了（rAF 监测到完整曲线），但**真实鼠标 hover 触发时只跑 ~30% 路程就跳到终点**（数据：`hover=true h=65.6 → +17ms h=96.0`）。原因：**Chromium 对 textarea 在 `:hover` 伪类驱动下的 transition 有严重 bug**，会跳过大部分动画路程。改用 JS 加 class（`.is-hovering`/`.is-focused`）替代 `:hover`/`:focus-within` 伪类。

6. **iter6 (瞬移进入跳变)**：换成 class 后慢速进入完美，但**鼠标快速跳入**输入框时仍瞬时跳变。原因：浏览器在一帧内同时完成"光标到达 + 事件派发 + class 添加 + 高度重排"，被合成成同一帧。先尝试用 `requestAnimationFrame` 推迟一帧。

7. **iter7 (鼠标驻留检测)**：`mouseenter` 不立刻加 class，启动 150ms `setTimeout`；如果 150ms 内 `mouseleave` 触发就清掉计时器。技术上慢速/瞬移进入都丝滑了。

8. **iter8 (代码质量收尾)**：临时注释合并、过时数值更新、`is-hovering` 计时器在 `onClose()` 里清理避免内存泄漏。

9. **iter9 (产品决策反转)**：⭐ 用户提出**"鼠标滑过默认不展开，只有点击聚焦时才展开"** 更合理。复盘后发现这才是真正合理的体验：
   - 鼠标在笔记列表 ↔ 工具栏间穿梭经常路过输入框，hover 触发会带来视觉噪音
   - 点击 = 明确的写作意图；hover = 只是路过，两者不应同等对待
   - 桌面/移动端体验完全一致（移动端本来就没有 hover 概念）

   把 mouseenter/mouseleave 监听全部删除、`inputHoverDelayTimer` 字段移除、CSS 选择器从 `:not(.is-hovering):not(.is-focused)` 简化成 `:not(.is-focused)`。代码反而更干净了。

10. **iter10 (focus 路径瞬时跳变)**：移除 hover 后发现 focus 触发的展开还是瞬时跳变，并非平滑动画。尝试 inline `min-height` 锁起点 + reflow + rAF 切 class 的双步策略 —— **但仍是瞬变**。

11. **iter11 (双 rAF)**：升级方案，单 rAF 不够就用双 rAF，确保 reflow 完全 commit 之后才切 class —— **依然瞬变**！

12. **iter12 (真凶大白：主题 CSS 覆盖)**：⭐⭐⭐ 用更详细的诊断脚本读 `getComputedStyle().transitionProperty`，发现 textarea 当前的 transition **居然是 `box-shadow, border 0.15s`** 而不是我们写的 `min-height, height 1.1s`！

    **真凶**：Obsidian 主题用 `body.theme-light textarea` 这种链式选择器（权重 0,0,1,1）覆盖了我的 `.memoria-input { transition: ... }`（权重 0,0,1,0）。`min-height` 根本不在 textarea 的 transition-property 列表里 → 被当成"无动画属性"瞬时跳变。

    解法：**给 transition 加 `!important`** 强制压过主题。一行代码解决前 11 轮迭代的所有"瞬变"症状。同时把 iter10/11 的双 rAF + reflow 全部回退（根本就不需要，是误判）。

13. **iter13 (动画时长定型)**：试过 0.22s / 0.55s / 0.85s / 1.1s 多档之后，最终落在 **0.7s** —— 看得出动画但不拖沓的甜蜜点。

**关键经验**：
- 浏览器 transition 行为有大量隐藏陷阱：CSS 规则覆盖、伪类驱动 bug、inline style 优先级、textarea rendered height 算法等等。**遇到"动画明明写对了但视觉就是不对"时，第一时间用 DevTools 量 `getComputedStyle().transitionProperty` 和 `transitionDuration`**——本次真凶是主题用 `textarea` type 选择器的 transition 覆盖了 plugin CSS，但前 11 轮迭代都没看 transition 实际生效值，全在猜测路径上做无用功。
- 写插件时给所有"必须生效"的 transition / 关键属性加 `!important` 是务实选择 —— **第三方主题对 form 控件类元素的覆盖是常态而非例外**。
- 工程实现做得对 ≠ 产品决策做得对。技术上把 hover 触发的所有边缘情况都修干净了，但用户的一句"鼠标滑过默认不展开是不是更合理"直接让前 8 轮迭代里的一半工作变成沉默成本。**所有"hover 还是 click 触发"这类交互决策应该在写代码前先想清楚**。







---

## v2.0.16（2026-05-08 深夜）

### ⌨️ 发送快捷键默认改为 Enter（对齐 flomo/Memos）

#### 背景
用户反馈 Ctrl+Enter 发送失效。通过开发者工具 capture 阶段诊断拿到铁证：

```
[STAGE] window-capture | isComposing=false | defaultPrevented=TRUE | cancelBubble=TRUE
```

事件到我们最顶层 window-capture 监听器时，**`defaultPrevented` 和 `cancelBubble` 已经是 true** —— 说明某个优先级比我们更高的监听器（Obsidian 内部命令 "Open link under cursor in new tab" 或其他插件的 document-level capture）已经吞掉了 Ctrl+Enter。而 Ctrl+Shift+Enter 因为 Shift 键组合未被任何对手注册，能一路通畅到达我们的处理器。

由于是**运行时被外部抢走**，任何 CSS/代码层的修复都无法保证在所有环境下稳定生效。

#### 方案：默认改用 Enter 发送 + 可配置

**新默认行为**：
- `Enter` → 发送（IME 组合态下忽略，避免干扰中文输入法确认候选词）
- `Shift+Enter` → 换行
- `Ctrl/Cmd+Enter` → 兼容（对默认肌肉记忆友好，能不能触发取决于环境）

**新增设置项**「发送快捷键」：
- `Enter 发送（Shift+Enter 换行）` ⭐ 推荐，对齐 flomo/Memos/Bear
- `Ctrl/Cmd+Enter 发送（Enter 换行）` 老用户习惯模式

默认值为 `enter`。

#### 其他兼容处理
- `shouldSendOnKeydown()` 统一判断发送逻辑，带 IME 保护（纯 Enter 发送时遇 `isComposing === true` 不响应）
- 列表智能续行（- / 1. / - [ ]）**只在 ctrl-enter 模式下启用**，因为默认模式 Enter 已经用于发送
- QuickCapture 弹窗同步支持两种模式

---

## v2.0.15（2026-05-08 傍晚 · 紧急修复）

### 🚨 修复 v2.0.14 导致的整个视图白屏

v2.0.14 用了 `this.scope.register(...)` 想注册 Scope 级快捷键，但 **ItemView 根本没有 `scope` 属性**（那是 Modal / App 独有的）。结果 `onOpen` 抛 TypeError、整个 Memoria 视图一片空白。**我的锅，对不起！**

#### 正确的解法
放弃 Scope API，改用 DOM capture 阶段监听：

```ts
this.registerDomEvent(this.contentEl, "keydown", handler, true /* capture */);
```

在 contentEl 上用 **capture 阶段**监听比 bubble 阶段早触发，也比 document 级的 Obsidian hotkey 监听早执行。拦到 Ctrl/Cmd+Enter 后 `stopImmediatePropagation()` 阻止事件继续传播，就能抢在 Obsidian 全局 hotkey（打开链接）之前响应。

同样的三层保护：焦点在视图内 + 非 IME 组合态 + event 三连阻止（prevent + stop + stopImmediate）。

---

## v2.0.14（2026-05-08 傍晚）

### 🐛 修复 Ctrl/Cmd+Enter 发送快捷键失效

用户反馈：桌面端在输入框打完内容按 `Ctrl+Enter` 发送没反应。

#### 根因
Obsidian 默认把 `Ctrl/Cmd+Enter` 绑给全局命令「**在新标签页打开光标下的链接**」（Open link under cursor in new tab）。Obsidian 的全局 hotkey 通过 Scope API 注册，**优先级高于 DOM 层的 addEventListener**。当用户在 textarea 里输入内容里含有链接，按 Ctrl+Enter 时，Obsidian 的全局 hotkey 抢先触发，我们挂在 textarea 上的 keydown 根本没机会响应。

#### 修复
改用 Obsidian 自家的 Scope API 注册快捷键：
```ts
this.scope.register(["Mod"], "Enter", ...)
```
Scope 注册的快捷键在视图聚焦时**优先级高于全局 hotkey**，彻底解决被抢的问题。

同时做了 3 个小保护：
- 只有焦点在 Memoria 视图内才响应（避免在瀑布流滚动时误触）
- IME 组合态不响应（中文输入法 Enter 是确认候选）
- 原有 DOM keydown 逻辑加 `stopImmediatePropagation` 作为双保险

---

## v2.0.13（2026-05-07 下午）

### 🚨 严重 BUG 修复：全选 + 列表/标签按钮会清空内容

用户反馈：在编辑框有文字的情况下**全选**再点「无序列表 / 有序列表 / 任务列表 / 插入标签」按钮，**全部内容直接消失且无法找回**。

#### 根因
`insertAtCursor()` 用 `slice(0, start) + text + slice(end)` 写入内容。当用户全选时 `start=0, end=length`，结果 = `"" + "- " + "" = "- "` —— 用户原文被替换成只有前缀的 2 个字符。

历史上没人发现是因为大多数用户点列表按钮时不会先全选。但这是**数据丢失**类问题，必须修。

#### 修复（行为对齐 flomo / Typora / VSCode）
- **插标签 `#` 按钮**：选区变成 `# + 选中文本`（`#` 加在选区前，保留原文）
- **无序/任务列表**：选区按行拆开，每行加 `- ` / `- [ ] ` 前缀（多行选区→多个列表项）
- **有序列表**：选区按行拆开，每行加递增序号 `1. ` `2. ` `3. ` ...
- 同时同步更新草稿（之前按钮触发的修改没存草稿）

### ✨ 新功能：标签筛选时新建笔记自动带标签

用户反馈对齐 flomo / Thino 的体验缺失：在 `#工作` 视图下记录的新笔记应该默认带 `#工作`。

#### 实现
- 仅当**侧栏点了某个标签**作筛选时（`filter.tag` 不为空）触发
- 提交保存时检查：用户已经手打了相同标签或子标签 → 不重复加；否则在内容末尾换行加 `#标签名`
- **placeholder 提前提示**：筛选 `#工作` 时输入框 placeholder 自动变为「此刻，你在想什么？（会自动加 #工作）」让用户预知行为
- 不影响预设视图（今天/置顶/收藏 等）和编辑已有 memo
- 中英文双语支持

---

## v2.0.12（2026-05-07 下午）

### ↩️ 回退到 v2.0.8 的简单布局

v2.0.9 ~ 2.0.11 三版尝试让移动端 datetime 与下方工具列左对齐（视觉上更工整），但 iOS Safari 对 `input[type="datetime-local"]` 有 3 个联合 quirk（`-webkit-appearance` + flex `min-width: auto` + 默认 margin），即便都规避后真机表现仍不稳定。

**改回 v2.0.8 的简单方案**：移动端编辑时 datetime 在 submit-wrap 内换行到上方一行（按内容宽度自然贴右），按钮独占第二行右对齐。视觉上虽然不与左侧工具列左对齐，但**稳定、跨平台一致、零 quirk**。一个日期左对齐折腾 4 个版本性价比太低，回归实用主义。

```
[# 图 列表 ☑ 表格]              [datetime]
                              [取消] [发送]
```

### ✅ 保留的功能
- v2.0.10 给 textarea 加的 `focus` 监听（移动端键盘弹出时把按钮 scrollIntoView）继续生效，按钮永远可见
- 桌面端布局完全不受影响

---

## v2.0.11（2026-05-07 下午）

### 🐛 iOS datetime-local 的真正根治

v2.0.10 设了 `display: block + width: 100%` 但 iOS 真机测还是居中一小条 + 上下有空白。

#### 真正的元凶（这次是 3 个联合锁死）

1. **iOS Safari 的 `-webkit-appearance`**：iOS 对 `<input type="datetime-local">` 默认带原生外观样式，会**无视 CSS 的 width**按内容宽度 shrink-wrap。必须 `-webkit-appearance: none` 才能让 width 生效。
2. **Flex 子项的 `min-width: auto`**：flex 布局里子元素默认 `min-width: auto`（＝内容宽度），这是"怎么设 width: 100% 都撑不开"的**真正根本原因**。必须显式 `min-width: 0` 才能让 flex-basis / width 真正生效。
3. **iOS form 控件默认 margin**：datetime-local 自带 2-3px 外边距，造成截图里明显的上下空白。必须 `margin: 0`。

三个一起加才能让 datetime 真·铺满整行 + 无多余空白。

#### 附加调整
- toolbar 和 submit-wrap 的 `row-gap` 从 8px 降到 6px，视觉更紧凑
- 明确 `text-align: left`，iOS 某些场景下 datetime value 会居中显示

---

## v2.0.10（2026-05-07 下午）

### 🐛 v2.0.9 移动端真机两个回归 bug

用户 iOS 真机测完截图反馈，v2.0.9 出现两个问题：

#### 1. datetime 没左对齐，反而看起来居中偏右

根因：iOS Safari 对 `<input type="datetime-local">` 有特殊处理，**会忽略 `flex-basis: 100%` 按内容宽度渲染**（一条窄窄的只有"2026年5月7日 00:42"那么宽）。这是老生常谈的 iOS form 控件 quirk。

修复：强制 `display: block + width: 100% + box-sizing: border-box`，让它彻底脱离 flex 布局按块级元素铺满整行。左缘立刻与下方工具列对齐。

#### 2. iOS 键盘弹出时遮挡「取消/发送」按钮

根因：iOS Safari 聚焦 textarea 弹出键盘后，默认只保证聚焦元素自己可见，不会滚动它下方的兄弟元素进入视口，所以 submit-wrap 被键盘盖住。

修复：给 `inputEl` 加 `focus` 监听，移动端下延迟 300ms（等 iOS 键盘弹出动画结束）把 `.memoria-input-card` 底部 `scrollIntoView({ block: "end" })`。这样键盘弹出后，按钮正好贴在键盘上方露出可见。桌面端不生效。

---

## v2.0.9（2026-05-07 下午）

### 🎨 移动端编辑模式 datetime 与底栏工具列左对齐

v2.0.8 修完"datetime 遮挡按钮"后视觉新问题：datetime 因为 `.memoria-submit-wrap` 被父级 `justify-content: space-between` 推到最右，即便 `flex-basis: 100%` 也只在 submit-wrap 内部铺满（很窄一条贴右），和下方左对齐的"插入标签/图片/表格"工具列错位。

**最终布局**：
```
┌─────────────────────────────────────┐
│ [标签] [图片] [列表] [表格]           │  ← 工具列，左对齐
│ [datetime-input 全宽左对齐]          │  ← datetime 和工具列左缘对齐
│                         [取消] [发送]  │  ← 按钮右对齐
└─────────────────────────────────────┘
```

**实现**：利用已有的 `.memoria-input-card.is-editing` 类作选择器前缀（避开 `:has()` 兼容老 WebView）。编辑模式下让 `.memoria-input-toolbar` 允许 wrap，`.memoria-submit-wrap` 用 `width: 100%` 独占第二行，内部再 wrap 让 datetime 独占第一子行（左对齐是 flex-basis 100% 的天然效果），「取消/发送」独占第二子行右对齐。桌面端完全不受影响。

---

## v2.0.8（2026-05-07 中午）

### 🐛 修复移动端编辑时日期选择器遮挡取消/发送按钮

用户反馈：手机端编辑已有笔记进入编辑模式后，datetime-local 输入框（显示 `2026-05-07 12:54`）会把右侧的「取消」「发送」按钮挤出视口或遮挡，导致完全点不到按钮，只能退出重开。

#### 根因
输入卡片底栏的 DOM 结构：
```
.memoria-input-toolbar (flex, space-between)
├── .memoria-input-tools (左侧 5-6 个工具图标)
└── .memoria-submit-wrap (右侧：[datetime-input] [取消] [发送])
```
桌面端屏幕宽，右侧 3 个元素一行能放下。但手机端（< 680px）左右两组元素加起来超过屏宽：
- datetime-local 原生控件至少需要 130-150px 显示「YYYY-MM-DD HH:MM」
- 再加两个按钮共约 120px
- 加上左侧工具栏 ≈ 200px
- 总宽度超过常见手机屏（375-428px）

浏览器 flex 默认不换行，submit-wrap 会溢出撑大父容器，于是按钮被挤到屏幕外。

#### 修复
在 `@media (max-width: 680px)` 下给 `.memoria-submit-wrap` 加 `flex-wrap: wrap`，编辑模式下 `.memoria-edit-datetime` 用 `flex-basis: 100% + order: -1` 强制独占一行并置顶。效果：

**桌面端**（不变）：
```
[datetime] [取消] [发送]
```

**移动端（编辑模式）**：
```
[datetime           全宽         ]
                      [取消] [发送]
```

同时把移动端的 datetime-input 行内 padding 从 4px 加到 8px、字号从 12 加到 14，保证触控点按友好。

---

## v2.0.7（2026-05-06 傍晚）

### 🔍 全量代码审查 + 5 处高价值修复

用户要求整体过一遍代码做发版前体检。启动 code-explorer 对全部 17 个 .ts 源文件扫描了 7 类问题（IME/资源泄漏/空值/i18n/性能/边界/类型），报告显示代码整体质量较高（`any` 零滥用、事件清理到位、缓存策略合理），挑出 **5 个高价值问题**一并修复：

#### 1. 两处 IME 兼容性孪生漏网之鱼（和 v2.0.6 同构）
- **`tag-suggest.ts`** 的标签联想面板 keydown：中文输入法打 `#xxx` 时按 Enter 上屏拼音会被联想面板的"选中候选"抢走
- **`main.ts` quickCapture** 的弹窗 textarea：中文输入法下的 Enter / Esc 可能被抢
- 修复：两处都加上 `if (e.isComposing || e.keyCode === 229) return;`

#### 2. main.ts 的 Ribbon / 命令 / Notice / confirm 走 i18n
之前英文用户点开命令面板会看到"打开 Memoria 面板""快速记录（弹窗）""正在规范化…"这些中文。这次把以下全部走 i18n：
- 5 个 Command name
- Ribbon 图标 tooltip
- 规范化命令的 confirm 文案 + 3 个 Notice
- QuickCapture 弹窗的标题 / placeholder / 取消 / 发送按钮 / Notice

新增 i18n 字典条目 17 条（双语）。

#### 3. store.ts 的 throw Error 走 i18n
3 处核心异常文案（文件变更未找到 / 原笔记文件不存在 / 内容不能为空）走 i18n。这些错误会通过 Notice 冒泡到用户，之前英文用户会看到中文报错。

#### 4. export.ts 的"没有可导出的笔记"走 i18n
利旧 `notice.exportEmpty` 键，修掉最后一个硬编码中文。

#### 5. 搜索输入加 180ms debounce
view.ts 第 181 行搜索框 input 事件之前每按一键都触发 `matchesQuery + renderList`，大 vault (10k+ memos) 下能感知到输入延迟。用 Obsidian 内置的 `debounce` 包一层，180ms 停顿后才真正搜索。

### 📋 审查结论
本次审查发现的其他 Low/Medium 级问题（如个别 `as HTMLElement` 类型强转、stats.ts 有若干字面量中文在诗意文案池里——用户已决定英文模式显示占位不强翻译）都是经过评估的刻意设计，不构成问题。代码整体质量较高，`any` 零滥用，事件清理到位，缓存策略合理。

---

## v2.0.6（2026-05-06 深夜）

### 🐛 修复中文输入法下待办行输入英文变两行的 bug

用户反馈（Issue）：在 `- [ ] ` 待办行用**中文输入法**输入英文（例如 "Mem"、"TDS"），如果不按空格选词而是直接按回车上屏，会出现：
- 第一行的 "Mem" 中间莫名多出空格（拼音分隔符被错误保留）
- 紧接着第二行也自动出现了一个 "Mem"

一开始还以为是输入法问题，仔细研究才发现是**我们插件的锅**。

#### 根因（W3C composition event 经典坑）

v1.1.9 做的"列表智能续行"功能在 Enter keydown 里判断当前行是列表就自动插入新前缀，但**没检查 IME 组合态**。

在中文输入法下，用户敲 "Mem" 后按 Enter 有两个语义叠加：
1. IME 要"确认候选词/原文上屏"
2. 用户可能还想"真正换行"

浏览器会发出 `keydown` 事件，此时 `e.isComposing === true`（或老浏览器 `e.keyCode === 229`）。我们的代码没判断这个状态就调用了 `handleListContinuation()`，于是：
- 插件抢在 IME 之前插入了一个新的 `- [ ] ` 前缀 + 换行
- 接着 IME 把 "Mem" 上屏，但上屏位置因为我们的插入已经错位
- 最终出现"一行变两行"的诡异现象

#### 修复

按 W3C 标准，所有 `keydown` 业务逻辑在 IME 组合态期间都应该 return：

```ts
if (e.isComposing || e.keyCode === 229) return;
```

一行代码，根治这类所有 IME 相关的输入错乱问题。

感谢反馈 issue 的用户细致观察 👏

---

## v2.0.5（2026-05-06 傍晚）

### 🐛 用户细节反馈三连修

#### 1. HTML 导出支持完整 markdown 渲染
之前 `renderInlineMd` 只处理 `**bold** / *italic* / \`code\` / [link](url)`，遇到 `- [ ]` 待办、`- ` 无序列表、`1. ` 有序列表、`#` 标题、`>` 引用、```` ``` ```` 代码块、`---` 分割线、`~~删除线~~` 全都按纯文本塞进 `<p>`，看起来就是普通文字——用户笔记里有待办但导出 HTML 后失去样式。

这一版重写成**行级分块 + 行内内联**的两层解析器：
- **待办**：`- [x] xxx` → `<ul class="task-list">` + `<input type="checkbox" disabled>`，支持勾选态自动打钩 + 删除线
- **列表**：无序/有序连续合并为一个 `<ul>` / `<ol>`
- **标题**：`# ~ ######` → `<h1> ~ <h6>`
- **引用**：连续 `> ` 合并为一个 `<blockquote>`
- **代码块**：``` ``` 包裹 → `<pre><code>`，内容自动转义
- **分割线**：`---` / `***` / `___`
- **删除线**：`~~xxx~~` → `<del>`
- HTML 模板新增对应 CSS，待办复选框用暖棕 accent-color 匹配主视觉

#### 2. Export as JSON 不再开空白 tab
v2.0.4 只给 HTML 导出关了 `openFile`（因为 Obsidian 不渲染 HTML），JSON 也是同样问题——用户反馈 JSON 导出后也弹出空白 tab。

规则改简单：**只有 md 会在新 tab 打开预览**，html/json 都只发 Notice 告知路径，避免「打开了又什么都看不到」的困惑。

#### 3. 紧密视图密度下待办复选框被卡片左边咬掉一半
Obsidian 默认的 task-list-item-checkbox 有个负 margin-left（让复选框溢出到 `<li>` 左侧对齐父容器），但紧密模式 `.memoria-card-body` 设了 `overflow: hidden` 做高度限制 + 渐隐遮罩——**负 margin 的那一半复选框就被裁掉了**。

修法：紧密模式下给 `ul.contains-task-list` 补 `padding-left: 1.8em`，把复选框整体向右挤出裁剪区。只影响紧密模式，舒适/宽松模式下不动。

---

## v2.0.4（2026-05-06 下午）

### 🌐 i18n 三个扩展视图也国际化了

之前 i18n 只覆盖主视图。用户反馈切英文后**数据报告、年度全景、导出 HTML**这三个扩展页面依然全中文，造成"界面割裂感"。这一版补齐：

#### 📊 数据报告（stats.ts）
- **页面标题**：`Memoria 数据报告` → `Memoria Stats`
- **空状态**：`还没有笔记，赶紧去写一条吧` → `No memos yet, write your first one`
- **统计卡**：`条笔记 / 字 / 活跃天 / 总跨度` → `memos / words / active days / days total`
- **分区标题**：`🔥 全年活跃度 / 📅 月度分布 / ☁️ 标签云 / 🏷️ 最常用标签 Top 10 / ⏰ 一天中你什么时候写得最多 / 🌟 有趣的发现` 全部英文化
- **年份导航**：`上一年 / 下一年` aria-label；`2026 年` → `2026`
- **图例**：`少 / 多` → `less / more`
- **月度副标题**：`2026 年共 N 条` → `2026 · N memos`
- **柱图 tooltip**：时间段和月份的 hover 提示
- **峰值描述**：`📝 你最喜欢在 HH:00 写笔记，至今累计 N 条（P%）` → `📝 You write most at HH:00 (N memos, P%)`
- **"有趣的发现"池**：英文模式下显示一行友好提示**"Insights text is only available in Chinese for now"**，等专业翻译再做。中文模式保留原有诗意文案池不变（"话痨日""Memoria 有点想你"等）

#### 📅 年度全景（year-panorama.ts）
- **页面标题**：`Memoria · 年度全景` → `Memoria · Year panorama`
- **星期头**：`日 一 二 三 四 五 六` → `S M T W T F S`
- **今年按钮**：`今年` → `This year`
- **上/下一年** aria-label 走 i18n
- **底部统计**：`2026 年共 N 条笔记 · 活跃 M 天` → `2026 · N memos total · M active days`

#### 📤 导出 HTML 页面
- **副标题**：`2026年5月6日 周三 15:00 导出` → `Exported Wed, 5/6/2026 15:00`
- **页脚**：`由 Memoria · Obsidian Plugin 导出` → `Exported by Memoria · Obsidian Plugin`
- **日期分组右侧统计**：`N 条` → `N memos`
- **统计条 label**：memos / days / tags 走 i18n
- **HTML lang 属性**：根据 UI 语言设 `zh-CN` 或 `en-US`（辅助屏幕阅读器）
- **md 导出**：标题和摘要走 i18n

### 🐛 修复：导出 HTML 后打开一个空白标签页

根因：HTML 文件 Obsidian 默认**不渲染**，`openFile()` 会创建一个空白 tab 让用户困惑。

修复：`doExport` 按格式区分后续行为：
- **md / json** → 导出后自动在新 tab 打开（Obsidian 能读）
- **html** → 只发 Notice 告知保存路径（用户自行在浏览器打开 `Memoria/exports/*.html`）

### 🐛 修复：热力图 hover 有两个弹窗重叠

根因：格子同时设了**原生 `title` 属性**和**自定义 tooltip**，浏览器的原生 tooltip 和自定义 tooltip 会**同时显示**——一个细长白条在上、一个富 tooltip 在下，视觉重叠。

修复：
- **有笔记的格子**：去掉原生 `title`，只用自定义 tooltip（展示首 2 条预览）
- **空格子**：依然保留 `title`，只显示"日期  0 memos"（便宜又安静）
- tooltip 里的 "N 条" 也走 i18n

### 📦 体积
main.js 144.7 → 149.8 KB（+5 KB，stats / year-panorama 的字典 + 新文案）。

---

## v2.0.3（2026-05-06 下午）

### 🌐 i18n 剩余盲区全部扫清

用户反馈 v2.0.2 切英文仍有几处残留中文。这一版**把主视图所有面向用户的字符串都走 i18n**：

#### 输入卡片
- **"发送" → "Send"**（原 hardcode `setText("发送")`）
- **"取消" → "Cancel"**（原 hardcode）
- 编辑时间 tooltip **"修改这条笔记的时间" → "Change this memo's date & time"**
- 删除对话框按钮 **"取消" + "确认删除" → "Cancel" + "Confirm delete"**

#### 笔记列表
- 日期分组标签 **"2026-01-02 周五" → "2026-01-02 Fri"**（英文界面下）
- **"今天 / 昨天" → "Today / Yesterday"**
- 置顶分组标题 **"置顶  共 N 条" → "Pinned (N)"**
- 底部 **"共 N 条" → "N memos"**
- 筛选描述里的 preset 名 **"今天 / 本周 / 🎲 随机 5 条 / 🕰️ 往年的今天 / 📌 置顶 / ⭐ 收藏"** 等全部走 i18n
- 滚动加载提示 **"↓ 滚动加载更多（还有 N 条）" → "↓ Scroll for more (N remaining)"**

#### 每日打卡进度
- **"目标 {goal} 条，当前已完成 {done} 条" → "Goal {goal}, done {done}"**
- 超额时 **"（超额 {extra}）" → "(+{extra} over)"**

#### 回顾视图的 meta 按钮
- **" 换一批" → " Shuffle"**
- **" 回到往年今天" → " Back to on-this-day"**
- 空状态提示 **"往年的今天还没有记录" → "Nothing from past years on this day"**
- 空状态跳转按钮 **" 随机 5 条" → " Random 5"**

#### 卡片视觉标记
- 置顶图标 aria-label **"已置顶" → "Pinned"**
- 收藏图标 aria-label **"已收藏" → "Starred"**

### 🗂 关于"md 文件里的『周五』"的产品决策

用户问切英文后新建笔记是否要把 md 文件也改成 `Fri`。**最终决定：不改 md，只改视图显示**。

理由：
- md 文件是**数据主权的承诺**——停用插件后你的笔记应该能被任何文本编辑器完整阅读
- 历史笔记已有几千条 `周五` 格式，切语言就改格式会导致 vault 里混用两种格式
- 视图层翻译是"显示"，文件层写入是"存储"，两者脱耦才健康

实现：
- `view.ts` 渲染日期分组时走 `t("weekday.N")` —— 跟 UI 语言
- `store.ts` / `parser.ts` 依然调用 `fmtWeekday()` 用中文 "周X" 写入 md —— **保持稳定**

这样切中英文，你的 md 文件一行不变；显示层即时跟随语言。

### ✅ 滚动加载不丝滑问题修复

#### 症状
滚动到列表底部触发分页加载时，视野内的卡片会"跳一下"——原本已经滚过去的笔记像是被重新渲染了一次。

#### 根因
`renderList()` 是"全清空重建"：`listEl.empty()` → 从头渲染所有已加载的 memo。即使只是加载多 50 条，也会把已有的 200 条也销毁一次再建，浏览器一次性重排大量 DOM，肉眼就能看到"闪一下"。

#### 修复：新增 `appendMoreMemos()` 增量追加
- **只渲染新切片** `memos[prevLimit..newLimit]`，已有卡片保持不动
- **智能合并到已有日期分组**：如果新切片的第一天 === 列表末尾 day-group 的日期，就把新 memo 追加到那个 group 里，而不是新建一个（避免出现两个相同日期的分组头）
- 给每个 `memoria-day-group` 加 `dataset.date` 标记，方便反查
- 老的 "load-more" 提示先移除再重建

结果：**滚动加载时视野完全稳定**，只有新卡片在底部淡入（浏览器原生行为），不会再看到"已滚过的笔记又出现"的闪烁。

### ℹ️ 情感色彩与 UI 语言的关系（补文档）

用户问「切成英文后，情感色彩是不是就不识别中文了？」

答案：**不会**。词库**始终同时包含中英文关键词**，与 UI 语言无关：
- 英文用户写 "So happy today!" → 命中 happy
- 中文用户写「今天好开心」→ 命中 happy
- 混用笔记 → 按命中最多的那类决定

这是刻意设计：情感识别不应受 UI 语言限制，用户爱用什么语言写就写什么。已在 `mood.ts` 顶部注释里明确写明这个设计决策。

### 📦 体积
main.js 从 141.8 KB → 144.7 KB（+3 KB，字典扩充 + 增量追加方法）。

---

## v2.0.2（2026-05-06 下午）

### 🌐 i18n 覆盖全面扫清 + 设置页即时切换

v2.0.1 虽然把主视图、卡片菜单等都走了 `t()`，但仍有不少硬编码中文遗漏。这一版**一次性扫干净**。

#### 新覆盖的区域
1. **热力图上方统计条**：笔记 / 标签 / 天数 → memos / tags / days
2. **侧栏「视图」section 标题**
3. **侧栏「标签」section 标题（折叠组）**
4. **工具栏所有图标 tooltip**：年度全景图、数据报告、切换侧栏、切换为月历/热力图、插入标签/图片/列表/任务/表格、引用、更多操作
5. **设置页完全国际化**：所有 name / desc / dropdown 选项全部走 i18n（笔记文件夹、图片附件、侧栏标签树、清空输入框、每次加载条数、回收站、导出图片主题、长笔记折叠、每日目标、关于、GitHub 仓库、版本号）
6. **设置页标题**：原「v2.0.0 新功能」改为更通用的「功能开关」/「Feature toggles」

#### 设置页即时切换
切换语言下拉后，**设置页立即重绘**，不需要关闭重新打开设置才看到英文。实现方式：`onChange` 回调里调用 `this.display()` 重渲染整个设置容器。

### 🎨 情感色彩新增第 7 维度：鼓励 (inspired)

响应用户反馈"加油、鼓励这类励志词没有触发情感色彩"。

新增 **inspired** 维度（鼓励/励志/加油）：
- **色条**：橙色 `#e89a5c`（介于 happy 的金黄和 angry 的红褐之间，语义上「温暖向上但比开心更"使劲"」）
- **关键词 ~40 个**：加油、冲、冲冲冲、奥利给、燃起来了、打鸡血、动力、坚持、努力、不放弃、突破、自信、勇敢、鼓励、鼓舞、勇气、相信自己、你可以的、拼了、干了、撑住、振作、振奋、斗志、力量、希望、前进、向前、成长、挑战、inspired、motivated、encourage、brave、courage、"go for it"、"you got this"、"keep going"、"never give up"、"let's go"、hustle、grit、hope

现在覆盖 **7 种情感维度**：开心 / 感动 / **鼓励** / 低落 / 烦躁 / 害怕 / 疲惫。

### ℹ️ 关于「人类的悲欢并不相通」这种没触发的问题

这是**关键词词典**方案的根本局限。隐喻、引用、间接描述（如"悲欢""相通""吵闹"单独出现）不会被词典命中。要完美识别需要 LLM 级别语义理解，那会引入：
- 隐私问题（笔记内容发给外部 API）
- 成本问题（API 调用费用）
- 延迟问题（每条笔记渲染前都要等 LLM）

Memoria 坚持**关键词方案**——是在"有用"和"克制/隐私/零依赖"之间的平衡。在 `mood.ts` 顶部注释里把这个局限性写清楚了，不会让用户以为是 bug。

### 📦 体积
main.js 从 132.4 KB → 141.8 KB（+9 KB，主要是扩充后的 i18n 字典 + inspired 关键词）。

---

## v2.0.1（2026-05-06 下午）

### 🌐 修复：语言切换不生效

#### 症状
v2.0.0 虽然搭好了 i18n 基础设施，但绝大多数 UI 字符串仍然硬编码为中文——切换 `settings.language` 到英文、改 Obsidian 语言都没反应，显示的始终是中文。

#### 修复
把以下地方的硬编码中文全部走 `t()`：
- **侧栏视图名**：全部笔记 / 置顶 / 收藏 / 今天 / 本周 / 待办 / 回顾 / 无标签 / 有图片 / 有链接 / 检索式 / 年份
- **输入框 placeholder**：新建模式 + 编辑模式
- **搜索框 placeholder**
- **Notice 通知**：已记下 / 已更新 / 已删除 / 已复制 / 已引用 / 置顶取消 / 收藏取消 / 各种错误消息
- **空状态**：没有笔记 / 没有待办 / 引导文案
- **卡片右键菜单**：编辑 / 打开原文 / 复制原文 / 保存图片 / 删除
- **工具栏按钮**：导出下拉菜单（Markdown / HTML / JSON）+ 提示
- **删除确认对话框**：「确定删除这条笔记吗？」

切换步骤：**设置 → v2.0.0 新功能 → 语言 → 简体中文 / English**。修改后需要**重新打开 Memoria 视图**才能看到效果（重渲染而已，不用重启 Obsidian）。

### 🎨 情感色彩新增 2 个维度（6 维度）

用户反馈"恐怖（害怕）、难过（伤心、哭泣）"维度覆盖不够。这一版：

#### 新增：害怕 (fear)
- **色条**：暗紫色 `#6e5a8f`
- **关键词**：害怕、恐惧、恐怖、吓人、吓死、惊吓、不安、担忧、担心、忐忑、焦虑、紧张、惊慌、心慌、毛骨悚然、afraid、scared、fear、anxious、panic 等 30+

#### 新增：疲惫 (tired)
- **色条**：浅灰棕 `#a89684`
- **关键词**：累、太累、疲惫、疲倦、精疲力尽、困、想睡、没劲、无力、倦怠、憔悴、tired、exhausted、sleepy、burnout 等 20+

#### 增强：低落 (sad)
原有 sad 维度补了近 20 个常见词：**哭了**、**哭泣**、**流泪**、**泪水**、**眼泪**、**悲伤**、**悲痛**、**哀伤**、**心酸**、**痛苦**、**难受**、**委屈**、**失望**、**绝望**、**心疼**、crying、tears、grief 等。

现在情感色彩可视化覆盖 **6 种维度**：开心 / 感动 / 低落 / 烦躁 / **害怕** / **疲惫** + 中性不染色。

### ✨ HTML 导出完全重写（设计层面大升级）

v2.0.0 的 HTML 导出只是"能看"，这一版提升到"看着舒服，愿意分享"。

#### 新设计要点
- **优雅配色系统**：使用 CSS 变量 + 深浅自适应，暖棕色主调（`#c08a5a` 强调色），纸感背景（`#fbfaf7`），配合玻璃态白卡片
- **品牌标识**：顶部 `• MEMORIA` 字样，深色模式下呼吸感的强调色
- **标题层次**：34px 细体大标题 + 导出时间副标题 + 48px 强调色短线分隔
- **统计条**：顶部展示 **memos / days / tags** 三个数字，一目了然
- **日期分组**：每组带日期 + 周几 + 条数计数，清晰的时间线感
- **卡片设计**：圆角 10px + 微阴影 + hover 浮起 + 可读性极强的 15px 正文
- **内联 Markdown 渲染**：支持 `**粗体**` / `*斜体*` / `` `代码` `` / `[链接](url)`，不再是纯白纸
- **标签胶囊**：暖棕色背景 + 暖棕色文字，与整体配色呼应，不再是冷感蓝色
- **打印友好**：`@media print` 样式，打印时自动去阴影、避免卡片被切断
- **移动端响应式**：`<560px` 自动收缩边距和字号
- **无外部 CDN**：完全自包含单文件，邮件附件可直接预览

#### 视觉效果对比
| 维度 | v2.0.0 | v2.0.1 |
|---|---|---|
| 配色 | 冷灰蓝（`#3a6a9e` 标签） | 暖棕系（`#c08a5a` 强调 + 纸感背景） |
| 排版 | 平铺无层次 | 统计条 + 日期卡 + 卡片微阴影 |
| 字体 | 基础 sans | 优雅细体标题 + 等宽时间 + tabular-nums |
| 暗色模式 | 只翻反色 | 独立调色（不是简单反色） |
| md 渲染 | 无，纯文本 | 粗体/斜体/链接/行内代码 |
| 页脚 | 一行小字 | 品牌链接 + 优雅分隔线 |

导出的 HTML **可以直接发给朋友当分享页**，或者打印装订成册，不会再让人觉得"这是个数据 dump"。

### 📦 体积
main.js 从 124.1 KB → 132.4 KB（+8 KB，HTML 模板大头）。

---

## v2.0.0（2026-05-06 下午）

### 🎉 一次性大版本：9 个方向一起做完

这一版把"想做很久"的事一次性全做了。不是为了里程碑，而是这 9 件事彼此有互补——搜索升级遇到 1440+ 条笔记才痛，紧凑视图恰好承接高密度浏览；情感色彩和智能回顾配合才完整；i18n 是为这些新功能铺的英文底子。

### 🔍 搜索能力升级（P0）
- **命中高亮**：搜索关键词在卡片正文里黄色底色标出
- **时间范围过滤**：`after:2024-01-01` / `before:2024-12-31` / `date:2024-05`
- **排除语法**：`-关键词` 排除含某词的笔记，`-#标签` 排除某个标签
- **保留原有体验**：`#tag 关键词` 空格分隔的老语法继续可用

### ⌨️ Vim 快捷键（P0，默认关）
在设置里打开后，视图获焦时支持：
- `j` / `k` → 下一条 / 上一条卡片（自动滚入视口）
- `gg` / `G` → 跳到首条 / 末条（gg 需 1 秒内连按）
- `Enter` → 进入选中卡片的编辑模式
- `/` → 聚焦搜索框
- `i` → 聚焦输入框写新笔记
- `Esc` → 清除选中

默认关闭，避免干扰鼠标党。

### 📐 紧凑视图模式（P1）
顶部工具栏新增密度切换按钮：
- **宽松模式**（默认）：完整阅读体验
- **紧凑模式**：每张卡片限制 6em 高度，底部渐变虚化，图片缩到 80px，一屏可见笔记数翻 3-4 倍，适合"找某条"场景

### 🔮 智能回顾（P1，默认开）
"随机 5 条"按钮升级为加权算法：
- 越久没翻过的笔记优先出现（间隔重复）
- 和今天标签呼应的加分（主题回响）
- 置顶/收藏的笔记略微降权（因为你平时已经在看）
- 关掉 `enableSmartReview` 就回退到原有伪随机

### 📤 导出功能（P1）
顶部工具栏新增导出按钮：
- **Markdown 格式**：标准 md 文件，兼容其他笔记工具
- **HTML 格式**：带样式的网页版，可直接分享给朋友
- **JSON 格式**：结构化数据，便于二次处理

导出范围跟随当前筛选（全部/标签/日期/搜索结果）。导出文件保存到 `Memoria/exports/` 目录。

### 🌐 i18n 多语言（P2）
- 抽出所有 UI 字符串到 `src/i18n.ts`
- 支持 zh-CN / en-US 两种语言
- 默认 auto：跟随 Obsidian 的 `moment.locale()`
- 可在设置里手动覆盖

### 🔥 热力图 hover 增强（bonus）
侧栏 14 周热力图的格子：
- **hover**：弹出自定义浮层，显示那天的笔记数 + 首 2 条预览（时间 + 50 字摘要）
- **click**：直接跳到那天的笔记列表
- 格子 hover 有轻微放大动画

### 📋 Markdown 粘贴格式保留（bonus）
从 Word / Notion / 浏览器复制带格式的富文本粘贴进来时：
- 自动识别 HTML 剪贴板（含有 `<strong>` / `<a>` / `<ul>` 等语义标签）
- 转换成等价 Markdown 插入（加粗/斜体/链接/列表/标题）
- 无 HTML 时走默认纯文本粘贴（零侵入）

### 🎨 情感色彩可视化（bonus，默认关）
基于关键词词典（约 80 个）识别笔记情绪，在卡片左边显示 3px 色条：
- 🟡 金黄 = 开心（"开心""太棒""哈哈"等）
- 🌸 粉色 = 感动（"感谢""温暖""眼泪"等）
- 🔵 蓝灰 = 低落（"难过""累""emo"等）
- 🟤 红褐 = 烦躁（"烦""讨厌""糟糕"等）

会有误判（关键词判定的局限），所以**默认关闭**，喜欢的可以在设置里打开。

### 🏗️ 架构变化
- 新增 5 个模块：`i18n.ts` / `mood.ts` / `search.ts` / `smart-review.ts` / `html-to-md.ts` / `export.ts`
- 构造器扩展：`MemoriaView` 现在接收 plugin 引用（用于 saveSettings）
- 新增 settings 字段：`density` / `enableVimKeys` / `enableMoodColoring` / `enableSmartReview` / `language`

### ⚠️ 无破坏性变更
所有旧行为都保留（搜索旧语法、随机按钮的回退、密度默认宽松、Vim 默认关、情感默认关）。升级后不改一行配置也能照常用。

### 📦 体积
main.js 从 96.7 KB → 124.1 KB（+27 KB）。这是 5 个新模块 + 导出 + i18n 字典的合理代价。

### 致谢
感谢用户在 v1.6.1 后反馈"易用性越来越好了"的肯定——正是这种反馈支撑着这些大改动能一次性做完。

---

## v1.6.1（2026-05-06 中午）

### 🐛 修复：改时间到已有笔记的日期时，新笔记会错位

#### 症状
v1.6.0 用 datetime 编辑器把一条笔记改到某个日期后，如果那天已经有别的笔记，新笔记会被**追加到那天的末尾**而不是按时间升序插入正确位置。结果 md 文件里出现 `23:05` 在 `16:56` 前面这种违反 Memoria"同日内时间升序"规范的情况。

例如用户把一条原本 2026-05-04 的笔记改到 2026-01-28 16:56，但 2026-01-28 当天已有 23:05 的笔记，改完后文件变成：
```markdown
## 2026-01-28 周三

- 23:05
  ...

- 16:56   ← 应该在 23:05 之前！
  ...
```

#### 原因
`insertMemoIntoYear` 在"已存在日期块"的分支里直接 `insertAt = trimTrailingBlank(...)` 追加到日期块末尾。这个行为对 `addMemo` 是对的（新笔记的时间总是当天最晚），但 v1.6.0 新加的 `editMemoDateTime` 允许改到任意过去时刻，旧逻辑会导致顺序错乱。

#### 修复
`insertMemoIntoYear` 在已存在日期块分支改为按时间升序找位置：
- 扫 dateLine+1 到下一个 `#`/`##` 之间所有 `- HH:MM` 行
- 找到第一个 `HH:MM > 新时间` 的位置，插到它之前
- 如果都 ≤ 新时间，保持原行为追加到末尾

**对 addMemo 零影响**（新笔记时间还是当天最晚，走"追加末尾"分支），只修复 editMemoDateTime 的错位问题。

#### 感谢
感谢用户第一时间发现并报告 🌱

---

## v1.6.0（2026-05-06 上午）

### 🕰️ 新功能：编辑笔记时可以同时修改时间（年/月/日/时/分）

> 进入编辑模式后，输入框右下角多了一个时间选择器，可以把这条笔记的时间改到任意时刻——同年同日、跨日期、跨年份都支持。文件里的时间线位置会自动调整。

#### 用法
1. 双击卡片（移动端长按）进入编辑模式
2. 输入框右下角"取消"按钮旁边出现一个 datetime 输入框，预填了原时间
3. 改时间（PC 端是日历+时间选择，iOS 是滚轮选择器，Android 是 material picker）
4. 点"发送"保存——内容和时间一起更新
5. 没改时间的话，行为和以前完全一样（走原路径，性能零损失）

#### 实现细节
- 新增 `MemoStore.editMemoDateTime(memo, newDateTime, newContent?)` 方法
- 内部策略：「在源位置删除原 memo 块 + 在新时间位置插入新内容」，复用现有的 `insertMemoIntoYear` 逻辑
- **跨年自动建文件**：从 2026 改到 2025 时，如果 `2025.md` 不存在会自动创建
- **孤儿日期清理**：旧位置删完如果该日期下没别的 memo 了，自动清掉 `## 2026-04-25 周六` 标题
- **空年份文件保留**：删空的 `2026.md` 不主动删掉（只剩 `# 2026` 头），避免下次写 2026 笔记又要重建
- **不写入回收站**：这是搬移不是删除，不污染 `_trash.md`
- **不做时间冲突检查**：同分钟多条 memo 是合法状态（用户连发速记常见），自然合并到同一日期块下
- **精确定位**：复用 v1.4.11 的"原 range + content fallback + range 距离 tie-breaker"算法，避免同时间同内容多条时写错位

#### UI 设计
- 用原生 `<input type="datetime-local">`：跨平台体验最好且零依赖
- 新建模式下隐藏，只在编辑模式显示
- 视觉风格与"取消"按钮一致（低调灰边框，hover 加深）

---

## v1.5.1（2026-05-06 凌晨）

### 🏪 配合 Obsidian 商店规范

这一版没有功能变化，专门为提交 Obsidian 官方社区插件商店做两项合规调整：

1. **manifest.json 的 `description` 改为英文**  
   原：`浮墨式碎片笔记瀑布流，数据永远是纯 Markdown，自由属于你。`  
   新：`Waterfall-style memo plugin for flomo-like fleeting thoughts, stored as plain Markdown.`  
   原因：Obsidian 商店 CI 会校验 `community-plugins.json` 里的描述和 `manifest.json` 里必须**完全一致**。我们在 community-plugins.json 用了英文，manifest.json 也同步为英文。

2. **tag 去掉 `v` 前缀**  
   从此之后所有 git tag 和 Release 都是纯版本号 `1.5.1` / `1.5.2` / ... 而不是 `v1.5.1`。Obsidian 商店 CI 要求 `tag_name` 与 `manifest.json` 里的 `version` 完全一致（不允许前缀）。  
   `publish.ps1` 脚本已同步更新。

---

## v1.5.0（2026-05-06 凌晨）

### ✅ 新功能：「待办」视图

> 新增侧栏「待办」入口，一键筛出所有含未完成 `- [ ]` 的笔记。

#### 功能说明
- **入口位置**：侧栏视图导航，「本周」下方，「回顾」上方
- **图标**：`check-square`（勾选框）
- **计数徽章**：侧栏右侧显示含未完成 task 的 **memo 数量**（不是 task 条数）
- **筛选规则**：只展示至少含一条 `- [ ]` 的 memo；memo 里 `- [x]` 已完成的不影响筛选
- **自动消失**：勾完笔记里所有 task，这条 memo 就从待办视图消失——得益于 v1.4.x 的"勾选自动回写 md"，整个闭环无需任何手动刷新
- **空状态**：所有待办清完后显示 🎉 + "没有未完成的待办"，是个温柔的鼓励

#### 设计哲学
Memoria 的定位是「速记」，不打算做状态机/任务管理器。所以这个"待办视图"**不是新增一种"待办类笔记"**，而只是对同一数据的另一种观看视角——任何笔记都可以带 `- [ ]`，想法和待办本就是混着来的。

#### 实现细节
- `parser.ts` 增加 `detectTasks(text)` 一次扫描同时识别 open/closed，不为这个功能再跑一遍正则
- `Memo` 类型加 `hasOpenTask` / `hasClosedTask` 两个字段（后者为未来的"已完成待办视图"保留）
- 识别规则：行首（允许前置空白）+ `-` / `*` / `+` 列表符号 + `[ ]` 或 `[x]` + 空格
- 待办计数合并到侧栏已有的主循环中，不增加任何额外遍历

#### 感谢
感谢第一位给我提需求的小伙伴（见 Issue #1）提出"一键筛选待办"的想法——这个功能和 Memoria 的哲学非常契合，做起来也很自然。❤️

---

## v1.4.17（2026-05-06 凌晨）

### 🔗 修复：`[[双链]]` 和 `#标签` 点击没反应

#### 症状
在 memo 里写 `[[某笔记]]`，正文里能渲染成可点击的蓝色下划线链接，但点上去**没有任何反应**——既不跳转，也不打开新 tab。`#标签` 同样点了无效。

#### 原因
`MarkdownRenderer.render()` 只负责把 markdown 转成静态 DOM（`<a class="internal-link" data-href="...">`），**不会自动绑点击事件**——OB 原生 editor/preview 是靠 MarkdownView 内部的事件委托机制做的。自定义 ItemView 里用 MarkdownRenderer 必须自己补这个逻辑。之前这段代码一直缺，所以所有渲染出来的链接都是"死"的。

#### 修复
新增 `bindInternalLinks(body, memo)` 方法，在每张卡片的正文容器上挂一个**事件委托**，捕获：

- `a.internal-link` → 调 `app.workspace.openLinkText(href, memo.file, newLeaf?)`
  - 普通单击：当前 tab 打开目标笔记
  - `Ctrl/Cmd+click` 或中键：新 tab 打开
- `a.tag` → 调 OB 原生 global-search 按 `tag:#xxx` 搜索（等价于侧栏搜索面板）
- `a.external-link` → 放行给 OB 的外链处理（尊重用户的"外链行为"偏好）

事件委托只在卡片创建时挂一次，所有当前/未来的链接都会走这个处理，零性能开销。

#### 对 MarkdownRenderer 缓存的影响
v1.4.11 引入的 DocumentFragment 缓存依然有效，因为事件绑在 `body`（缓存外层）而不是链接本身上，缓存命中时 clone 出的新 DOM 依然会走到委托处理。

---

## v1.4.16（2026-05-06 凌晨）

### 📱 手机端输入框首行顶部笔画被"咬掉"（续）

#### 症状
v1.4.14 修复了手机端输入框文字"左侧笔画被咬掉"的问题（`padding-left: 0 → 4px`），但实际使用发现**顶部区域依然会丢 1-2px**，尤其中文字右上部的点画（"测""试""此"等）。下方区域已经 OK。

#### 根因
PC 端 `.memoria-input` 在 styles.css:426 有一句 `padding: 0 !important;` —— 这是简写形式，会**同时覆盖四边** padding。v1.4.14 给移动端 `@media` 只补了 `padding-left: 4px` 和 `padding-right: 4px`，**垂直方向（top/bottom）仍然继承 0**。

iOS WebView 对中文字首行顶部的反锯齿渲染需要 1-2px 的 overshoot 空间，否则"测"字右上的"刀点"、"试"字右上的"弋"点会被 textarea 的 content box 上边缘裁掉，视觉上像文字被"剪了一刀"。

#### 修复
移动端 `.memoria-input` 补上：
```css
padding-top: 2px !important;
padding-bottom: 2px !important;
```
2px 的垂直安全区足够让 iOS WebView 的反锯齿完整呈现；line-height:1.6 已经提供行间缓冲，所以不需要更大。纯 CSS，~2 行。

---

## v1.4.15（2026-05-06 凌晨）

### 🏪 为提交 Obsidian 官方插件商店做准备

#### 代码合规
- **移除 `innerHTML` 写入**：v1.4.11 引入的 MarkdownRenderer 缓存把渲染结果存为 HTML 字符串，命中时 `body.innerHTML = cached`。Obsidian 社区插件审核对 `innerHTML` 写入有 XSS 风险提示（即便来源是受信的 MarkdownRenderer 输出）。改为 `DocumentFragment + cloneNode(true)` 缓存：命中时直接 clone 出 DOM 子树 append 进 body，零 innerHTML，性能与原方案一致。
- 代码库完整扫描：0 `eval` / 0 `new Function` / 0 `document.write` / 0 外部 CDN / 0 `XMLHttpRequest`。完全符合商店审核规范。

#### manifest.json 补齐
- 加上 `fundingUrl` 字段（指向 GitHub 仓库，审核员看到会觉得"这是正式项目"）。

---

## v1.4.14（2026-05-05 晚上）

### 📱 手机端输入框文字左边笔画被"咬掉"

#### 症状
Obsidian Mobile 上打开 Memoria，在顶部输入框连打几行"测试"，文字的左侧竖笔明显缺失了 1-2px，看起来像文字被左边裁了一刀。

#### 原因
v1.1.18 给移动端 `.memoria-input` 加了 `padding-left: 0 !important` 作为"双保险"，初衷是防止某些 OB 主题偷偷给 textarea 注入 padding 挤掉 placeholder 首字符。但一刀切置 0 过度干预：textarea 文字紧贴自己的左内边界，在 iOS WebView + 某些中文字体组合下，中文字（"测""此"等）的首列笔画会被 1-2px 的反锯齿 / 子像素抗锯齿"咬掉"，视觉上像被剪了半边。

#### 修复
`padding-left: 0 !important` → `padding-left: 4px !important`，另加 `padding-right: 4px !important` 保持对称。4px 的安全区既能防主题注入大 padding（主题塞进来的也会被 4px 盖掉），又保证字形完整呈现。

纯移动端 CSS，PC 端不受影响。

---

## v1.4.13（2026-05-05 中午）

### 🔢 侧栏「今天」「本周」补上条数显示

#### 症状
左侧视图导航里，"全部笔记 / 置顶 / 收藏 / 回顾"这些入口右侧都有数字徽章，但「今天」「本周」却一直是空的，明明今天就写了好几条笔记也看不到。

#### 原因
原实现的侧栏统计主循环里没给这两个 preset 统计条数，presets 数组里也没传 `count` 字段，`renderNavItem` 里 `if (count !== undefined)` 就把徽章跳过了。

#### 修复
在侧栏已有的主循环里顺手加两个计数器：
- `todayCount` — `m.date === todayStr`
- `weekCount` — `m.datetime.getTime() >= weekMondayTs`（周一 00:00 起）

本周的 Monday 定义与"筛选"里完全一致（`(getDay() + 6) % 7`），保证侧栏数字和点进去的列表条数能对得上。

#### 顺手
侧栏 7 个视图入口现在全部显示条数，视觉节奏统一，一眼就能看到活跃度。

---

## v1.4.12（2026-05-05 中午）

### 🐛 修复：有"全文"折叠按钮的卡片，标签胶囊被撑高

#### 症状
超过折叠行数阈值的长笔记，在折叠态下卡片底部会同时出现「#标签 胶囊」和「全文 ∨」按钮。此时标签胶囊明显比"没有全文按钮的卡片"上的胶囊更高（被拉伸成细长椭圆）。

#### 原因
v1.3.6 起，"全文"按钮在长笔记下会被 `appendChild` 到 `.memoria-card-tags` 容器末尾一起做水平对齐。这个容器之前只设了 `display: flex; flex-wrap: wrap;`，没设 `align-items`——默认值 `stretch` 会把所有子项拉伸到容器最高行（= 按钮的高度）。胶囊有 `border-radius: 999px`，一被纵向拉伸就从胶囊变成细椭圆，视觉上格外突兀。

#### 修复
`.memoria-card-tags` 加一行 `align-items: center`。胶囊保持自然高度并居中对齐，按钮也居中，两者互不影响。纯 CSS，~1 行。

---

## v1.4.11（2026-05-05 凌晨）

### ⚡ 性能 & Bug 大扫除

系统性 code review 后一次性修掉 3 个真 bug + 4 处性能瓶颈 + 1 个移动端体验缺陷。

#### 🔴 Bug 修复

1. **`reloadLocks` 的 Promise 链内存泄漏**（v1.1.15 引入）
   之前用 `prev.then(run)` 串行化同文件 reload，连续调用 N 次会产生 N 条互相引用的 Promise 链，全部无法 GC。改为 `{ running, pending }` flag 策略 —— 同一文件任何时刻最多跑 2 次（正在跑 + 最多 1 次待跑），中间所有重复请求合并。

2. **`editMemo` 同分钟同内容多条时写错位**
   例如用户连点两次"发送"发了两条一样的笔记，编辑第二条时 `fresh.find(三项全等)` 只会命中第一条，导致编辑写到了错的那条上。改为取所有候选中 `range[0]` 最接近原位置的那条。

3. **`quickCapture` 的 `mouseup` 全局 listener 泄漏**
   mousedown 后把鼠标拖出浏览器窗口松手时，mouseup 事件收不到，listener 永久挂在 document 上。现在 mousedown 前先清理上一个挂着的。

#### ⚡ 性能优化

1. **`reloadAll` 并行读文件**
   原实现串行 `for await` 读 YYYY.md，1440+ 条笔记 + 5 个年份文件要 200-400ms。改用 `Promise.all` 并行，实测压到 50-80ms。

2. **设置页误调 `reloadAll`**
   `showSidebarTags` / `collapseLineLimit` / `dailyGoal` 三个开关都只影响 UI 渲染，不改底层 memos 数据，原来每次切都全量重读所有 md 文件。改为只调 `store.notifyChange()` 触发视图重绘。

3. **MarkdownRenderer HTML 缓存（LRU 500 条）**
   列表每次刷新（切筛选 / toggle 置顶 / 滚动加载）都要对 50 张卡片重新调 `MarkdownRenderer.render`（异步 + 昂贵）。现在按"规范化后的 md 文本"做 key 缓存渲染结果，内容没变的卡片直接 `innerHTML = cached`。实测列表刷新 ~200ms → ~20ms。

4. **`TagSuggest.collectAllTags` 每次按键全扫 vault**
   vault 有 3000+ md 时打字会卡。加 30 秒 TTL 缓存，同时订阅 `metadataCache.on("changed")` 失效，保证新标签下次打字就能看到。

#### 🤏 移动端长按编辑

之前只绑 `dblclick`，手机/iPad 上没法双击进编辑，等于在 Obsidian Mobile 上只能通过 ⋯ 菜单→编辑。现在在 `Platform.isMobile` 下加长按 500ms 触发（正常点击 / 滑动超过 6px 不触发）。

#### 🧹 防御性小改

- `BlockKind` 类型补齐 h4/h5/h6/code/task 五个之前漏掉的分支
- 草稿写入 localStorage 加 512KB 上限，防御性防止粘大图爆仓

---

## v1.4.10（2026-05-05 凌晨）

### 🗓️ 数据报告「全年活跃度」：永远显示完整 12 个月

之前当年热力图只画到"今天"为止，右下大片空白，整页版式失衡，像"渲染到一半"的 bug 感。

#### 修复
把 `end` 从 `today` 改为当年 `12 月 31 日`——不管哪一年都渲染完整 12 个月骨架，未来的日子显示为 level-0 浅灰底（和没记录的日子一致）。

#### 顺手改进
未来日期的 hover 提示从"YYYY-MM-DD  0 条"改成"YYYY-MM-DD  未来"，语义更准，避免让用户以为"那天记了 0 条"。

---

## v1.4.9（2026-05-05 凌晨）

### 🎨 图标色阶统一：更柔和不突兀

之前顶部工具区的「年度全景」「数据报告」图标用的是 `--text-muted`，而打卡条的靶心/视图切换、侧栏「全年活跃度」旁边的切换按钮都是 `--text-faint`。

三组图标**两档色阶**，在深色主题下顶部那两个会稍显突兀。

#### 修复
全局 `.memoria-icon-btn` 基础色 `--text-muted → --text-faint`，hover 从 `--text-normal → --interactive-accent`。

效果：
1. 所有工具类图标同一个色阶，视觉统一
2. 平时更柔和，不抢内容的注意力
3. hover 时反馈更强（accent 色），明确告知"这里可点击"

---

## v1.4.8（2026-05-05 凌晨）

### 🎨 年度全景图：圆点颜色深浅 + 点击真正跳转到当天

#### 1. 圆点按笔记数分 4 档颜色

和侧栏热力图 / 数据报告的全年热力图一致：
- `level-1`（1 条）：accent 30% 浅淡
- `level-2`（2-3 条）：accent 55% 中等
- `level-3`（4-6 条）：accent 80% 深
- `level-4`（7+ 条）：accent 100% 最深

**实现细节**：用 `color-mix(in srgb, accent X%, background)` 而不是 `opacity`——opacity 会把圆点里的数字也变淡，多个圆点并排时数字几乎看不清。`color-mix` 只改背景色，保持文字清晰可读。

#### 2. 点击圆点真正跳到当天

之前点击圆点后 Memoria 主视图的搜索框会填进日期字符串 `YYYY-MM-DD`，但主视图的搜索逻辑只在 `memo.content` 里匹配关键词，对 `memo.date` 无效 → 筛不出任何笔记。

**改法**：MemoriaView 新增 public 方法 `focusOnDate(date)`，走和侧栏月历点日期同一条路径（设 `filter.date + preset=all + renderAll`）。年度全景图调用这个 API 精确跳转，效果和在侧栏点对应日期完全一致。

---

## v1.4.7（2026-05-05 凌晨）

### 🎨 年度全景图：真·出血边距 + 圆点瘦身

v1.4.6 虽然写了 `padding: 56px 72px`，但视觉上依然贴边——根因是 padding 放在内层 `.memoria-year-view`，外层 Obsidian `.view-content` 自身 padding/inset 会把空间吃掉。

#### 修复
- **出血边距上移到 `.view-content`**，和数据报告视图采用同一套模式，`!important` 覆盖宿主。桌面 `64px 80px 80px`，移动端 `32px 20px 56px`，窄屏各档分档降级。
- 内层 `.memoria-year-view` 自身 padding 归零（避免重复留白），只负责 `max-width: 1400px` + 居中。

### ⭕ 圆点瘦身到真正的"点阵"

之前 `aspect-ratio: 1` 让圆点宽度 = 列宽，宽屏时圆点会被撑到 30px+ 显得粗壮。

#### 改法
- 给 `.memoria-year-day` 加 `max-width: 20px; max-height: 20px`，锁死圆点尺寸上限
- `.memoria-year-grid-days` 加 `justify-items/align-items: center`，让圆点在格子里居中，周围自然留白
- 字号 11px → 10px，配合更小的圆
- hover 发光环从 `3.5px` 缩到 `3px`（配合 20px 圆点比例）
- 手机单列模式下圆点放大到 26px（触控区域合适）

---

## v1.4.6（2026-05-05 凌晨）

### 🎨 年度全景图：层次感重制

v1.4.5 首版一铺开，用户反馈"像一整块表格混在一起，月与月之间没有视觉边界，方块也太大太死板，元素全贴边"。这版三个问题一把修。

#### 1. 每个月"卡片化"

每个月不再是光秃秃的日期网格，现在有独立容器：
- 淡淡的次级底色 `var(--background-secondary)`
- 1px 边框 + 12px 圆角
- 18px 内 padding
- hover 时描边加深 + 轻微投影

月与月的 gap 从 24px 放大到 28px，呼吸感明显拉开。

#### 2. 日期圆形化

`border-radius: 4px` 的圆角方块 → `border-radius: 50%` 完整**圆形**。
- 字号从 12px 微缩到 11px（圆形视觉上偏大，字号配套收）
- hover 不再放大（会破坏网格对齐），改用外发光环
- 月外日期的 opacity 从 0.4 压到 0.28，让本月焦点更突出

#### 3. 印刷出血边距

外层 padding 从 `32px 40px` 放大到 `56px 72px 72px`（上/左右/下），模拟印刷品留白。
- 月英文缩写下方加一条 **1px 虚线** 分隔线，视觉节奏感立刻出来
- 年份大标题从 32px 提到 36px，和下方内容拉开层级
- 顶部与月网格的间距从 28px 拉到 40px

#### 4. 响应式同步调整

窄屏各档的 padding 也都跟着放大，不再贴边：
- `≤1200px`：4列→3列，padding `48/48px`
- `≤900px`：3列→2列，padding `36/32px`
- `≤560px`：2列→1列，padding `24/16px`

---

## v1.4.5（2026-05-05 凌晨）

### 🗓️ 新增：年度全景图视图

一张图看完一整年的记录足迹。

在顶部工具区点击 📅 日历图标，或命令面板搜「年度全景图」，即可打开。

#### 视觉风格
- 12 个月完整日历铺开（桌面 4×3 宽屏 / 平板 3×4 / 手机 2×6 或 1×12 自动降级）
- 每个月是**真实印刷日历的样式**——7 列，日一二三四五六表头，本月外的日期淡灰显示
- **有笔记的日期**：accent 色圆角方块 + 白色数字，hover 会略微放大
- **今天**：不管有没有笔记都叠加 accent 色描边，一眼能看到自己在哪
- 右上角年份切换：`< 今年 >`

#### 交互
- 点击任意有笔记的日期 → 跳回主 Memoria 视图，自动在搜索框填入该日期筛选
- 数据跟着主视图实时同步——在主视图新增/删除笔记，全景图立即刷新

#### 其他改动：topbar 工具区重构（方案 A）

之前「数据报告」按钮塞在搜索框容器内部，视觉上和搜索 icon 夹成一对，会让人误以为也是搜索相关功能。现在挪到独立的 `.memoria-topbar-tools` 工具区，和新增的「年度全景」并排，符合"左内容右工具"的惯例，也方便以后扩展更多入口。

---

## v1.4.4（2026-05-05 凌晨）

### 🔍 修复：输入框聚焦光晕被滚动的笔记卡盖住

移动端反馈的小 bug：点输入框后，外层会激活一圈 accent 色的高亮光晕（`box-shadow: 0 0 0 3px`）。但滚动瀑布流时，经过输入卡附近的笔记卡片会把这层光晕盖住，看起来像"被啃掉一块"。

根本原因是两个相邻兄弟元素（`.memoria-input-card` 和 `.memoria-list`）都没有独立的层叠上下文，默认按 DOM 顺序层叠，笔记卡片的不透明背景就会盖住向外扩散的 box-shadow。

#### 修复

给 `.memoria-input-card` 加 `position: relative; z-index: 2`，让它升到独立层叠上下文并**永远浮在笔记列表之上**。桌面/移动端一起生效。

纯 CSS 修复，无需重新编译 main.js。

---

## v1.4.3（2026-05-05 凌晨）

### 🗑️ 回收站容量上限（FIFO 滚动）

之前 `_trash.md` 没有任何上限，每次删除都是「全文件读→拼接→全文件写」。重度使用下（比如删到 1 万条）单个文件会膨胀到 20MB+，删除操作明显卡顿，云同步每次都要重传。

现在给回收站加了 **FIFO 滚动上限**：超出后自动丢弃最旧的条目，永远只保留最新的 N 条。

#### 改动点

- **新增设置项：回收站最大条数**
  - 可选：100 / 300（默认）/ 500 / 1000 / 3000 / 不限制
  - 下拉选择，设置页在「删除时保留到回收站」开关下方
- **实现**：每次 `appendToTrash` 追加新块后，扫描 `## 已删除 ...` 标题数，超过上限就把最前面几条整块删掉，文件头的说明块永远保留
- **默认 300 条**：对个人用户完全够用（就算一天删 10 条也能存 1 个月历史），同时保持 `_trash.md` 永远在几百 KB 以内

#### 顺带解答一下为什么不搞更大

写笔记本身是一个"少而精"的行为，碎片笔记尤其如此。如果真的需要"永久归档被删的内容"，更合理的做法是手动把 `_trash.md` 里的块剪贴出去存档，而不是让插件吞掉硬盘。

---

## v1.4.2（2026-05-05 凌晨）

### 🧹 打卡条 5 项精修 + 发送按钮颜色修复

一次真实使用反馈后的精修：

#### 1. 🎯 靶心图标换掉（不再像甜甜圈）
`target`（lucide 的三层同心圆）确实在小尺寸下看着像甜甜圈 🍩。换成 **`crosshair`**（十字准星）—— 辨识度更高，符合"目标"的语义。

#### 2. 🔧 修复双层 tooltip
之前所有 `attr: { "aria-label": "...", title: "..." }` 都会在 Obsidian 下出现两个气泡（Obsidian 原生 tooltip + 浏览器原生 tooltip）。

这次统一去掉 `title`，只保留 `aria-label`。Obsidian 内部会根据 aria-label 自动渲染一个气泡。

受影响的元素：进度条 / 靶心 / 视图切换按钮。

#### 3. 📝 Tooltip 文案优化
原来：「目标 5 条 · 在设置里可调整」
现在：「**目标 5 条，当前已完成 3 条**」

「在设置里可调整」其实废话（设置里本来就能调），删了。把实时的"当前已完成"数字直接展示，信息密度高。

超额时追加：「（超额 2）」。

#### 4. 🔗 进度条和靶心共用同一条 tooltip
hover 任一位置都显示相同的「目标 X 条，当前已完成 Y 条」，不再是两个不同的文案。一致性更好。

#### 5. 🎨 发送按钮用主题色（强制）
之前发送按钮 CSS 已经写了 `background: var(--interactive-accent)`，但某些 Obsidian 主题会在更高特异性下用白/灰底覆盖。

这次加了 `!important`：
```css
background: var(--interactive-accent) !important;
color: var(--text-on-accent) !important;
```
hover 也加了 `filter: brightness(1.05)` 兜底（某些主题可能没有 `--interactive-accent-hover`）。

现在不管什么主题，发送按钮都是主题色 + 白字。

---

## v1.4.1（2026-05-05 凌晨）

### 🎯 打卡进度条 v2：5 项完善

基于 v1.4.0 的用户反馈，一次性补齐：

#### 1. 🎉 首次达成目标弹 Notice
达到目标条数时弹一个 Obsidian 原生 Notice：「🎉 今日打卡完成！已记 X 条～」。

**防重复机制**：记录 `dailyGoalNoticedDate = yyyy-MM-dd`：
- 同一天再次渲染侧栏，不会再弹
- 跨天后（日期变更）自动重置
- 删笔记降到未达标，也不会"取消"已弹的 Notice（因为 Notice 是一次性的）

#### 2. 🎨 进度条颜色跟随主题
原来硬编码 `#4caf50`，换主题就可能丑。改用：
```css
background: var(--interactive-accent);
```
每个 Obsidian 主题都会定义这个变量，自动适配浅色/深色/用户自定义主题。

已完成态的发光颜色也跟着走：
```css
box-shadow: 0 0 6px color-mix(in srgb, var(--interactive-accent) 45%, transparent);
```

#### 3. ⊙ 进度条右侧加靶心图标
之前孤零零一条进度条太突兀了。加一个 lucide `target` 图标在右边：
- **不点击也不做事**，纯信息展示
- hover tooltip：`目标 5 条 · 在设置里可调整`
- 达成目标时图标变 accent 色（小小的鼓励感）

#### 4. 📅 把视图切换按钮从顶部统计条挪到进度条右侧
原来热力图/月历切换按钮在顶部"笔记 标签 天数"那行最右边，v1.4.1 挪到进度条右边，形成：

```
[═══ 进度条 ═══] ⊙ 📅
```

这样"进度+目标+视图切换"三件事聚在一起，和 Thino 的设计对齐。顶部统计条也变得更清爽（只显示三个数字）。

#### 5. 去掉热力图/月历下方的灰色分隔线
原来 `.memoria-overview { border-bottom: 1px solid ... }` 和 `.memoria-heatmap` 内部也有一条 `border-bottom`，两条灰线把"热力图"和"进度条"视觉上隔断了。v1.4.1 都删掉，让它们连成一个整体。

---

## v1.4.0（2026-05-05 凌晨）

### 🎯 每日打卡进度条

灵感来自 Thino 的左侧栏设计 —— 在热力图/月历下方加一条**细长绿色进度条**，用于显示"今日已记笔记数 / 每日目标"。

#### 功能

- **位置**：左侧栏热力图/月历**正下方**，宽度跟随侧栏
- **视觉**：细长 4px 进度条，中绿色 `#4caf50` 填充
- **逻辑**：`width = min(100%, 今日数 / 目标 × 100%)`
- **超额完成**：进度条变**渐变绿 + 细微发光**（`box-shadow 6px rgba(76,175,80,0.35)`），暗示"今天多写了 X 条，继续保持 ✨"
- **hover**：轻微灰底（`background-modifier-hover`）+ tooltip
  - 未完成：`今日 3 / 5 条`
  - 已超额：`今日已完成 7 条（目标 5）— 超额 2 条 ✨`
- **点击**：跳转到 `filter.preset = "today"` 视图（今天的所有笔记）
- **空时**：进度条宽度 0%，底色仍显示灰底轨道，提示"今天还没记"

#### 设置项

「每日目标笔记数」—— 和 `pageSize` 同款滑块 UI：
- 范围 1-30
- 步长 1
- 默认 **5 条**
- 说明："记录越简单越容易坚持，建议 3-7 条"
- 改完立即 reloadAll 生效

#### 对照 Thino 去掉的部分

参考 Thino 时有两个图标一起出现，我们**只保留进度条本身**：
- ❌ **靶心图标**（设置目标）—— 直接挪到插件设置页，不做弹窗
- ❌ **日历图标** —— Memoria 已有热力图/月历切换按钮，不重复

#### 实现细节

- `renderDailyGoal(parent, memos)` 独立方法，遍历一次 memos 统计今日数
- 挂在 `renderSidebar()` 里 `renderOverview` 之后，和侧栏渲染同步刷新
- 全靠 CSS 做视觉，JS 只设一个 `style.width = X%`

---

## v1.3.6（2026-05-05 凌晨）

### 🎯 折叠按钮彻底对齐「卡片最后一行」

#### 问题根源
v1.3.0 ~ v1.3.5 的折叠按钮都绑在 **body（文字容器）** 上。但卡片实际结构是：
```
body (文字)
  ↓
imgGrid (图片)
  ↓
tagRow (标签)
```

如果笔记有图片/标签，按钮贴着"文字最后一行"就会错位 —— 它在图片/标签之上，而**卡片最后一行视觉上是标签或图片**。所以展开/折叠按钮永远和"文字最后一行"对齐，而不是**用户期望的"卡片最后一行"**。

#### 正确的交互逻辑

用户一语道破：

> **不管最后一行是标签，是图像，还是文字，这个全文和收起都应该对齐最后一行来显示**

#### v1.3.6 实现

把按钮的挂载点从 body 改成**卡片的最后一个可见元素**（优先级）：
```
tagRow  优先（标签存在时挂在标签行末尾）
  ↓ (没标签)
imgGrid 其次（图片网格存在时挂在图片末尾）
  ↓ (没图片)
body    兜底（纯文字时挂在文字后）
```

对应 CSS 适配：
- **tagRow**（flex）：按钮 `margin-left: auto` 自动推到右侧，和标签同一行
- **imgGrid**（grid）：按钮 `grid-column: 1/-1; justify-self: end` 独占一行右对齐
- **body**（block）：
  - 展开态：`display: block; width: fit-content; margin-left: auto` 块级右对齐
  - 折叠态：`position: absolute; right:2 bottom:8` 嵌在渐变内

#### 统一两态

原来 v1.3.3-1.3.5 分了 `is-peek` / `is-expanded` 两套样式，现在**完全统一** —— 按钮位置由父容器决定，展开/折叠只是**换图标和文案**（`chevron-down`↔`chevron-up`，"全文"↔"收起"），位置不变。

这是一个"用户心智模型"和"技术实现"彻底对齐的版本：按钮永远在**卡片的最后一行右边**，不管那一行是什么。

---

## v1.3.5（2026-05-05 凌晨）

### ✂️ 两个体验修正

#### 1. 移除字数徽章（时间旁边的「X 字」）
v1.3.0 引入的"≥80 字时显示字数徽章"功能，今天被真实使用否决。原因：
- **违背碎片笔记定位**：flomo / 微信朋友圈 / Memos 都不显示字数，**不鼓励统计 = 不给用户"写多"的心理压力**
- **信息冗余**：折叠功能已经让用户直观感知"这条很长"，字数再提醒一次是重复
- **视觉干扰**：时间旁边多了一个 pill，打破了 head 区域的简洁

移除所有相关代码：
- `countWords()` 函数（20 行 CJK+ASCII 字数统计）
- `textWrap.createSpan("memoria-card-wordcount")` DOM 创建
- `.memoria-card-wordcount` CSS

bundle 减少约 300 字节。

#### 2. 修复「全文」按钮看起来在"文字下方"的视觉问题

v1.3.4 的折叠按钮 `bottom: 2px`，贴着 body 的最底边。但用户感知是"按钮在文字下方另起一行"—— 因为被折叠的最后一行文字可能在 body 的 210px 位置，按钮在 238px 位置，中间隔了近 30px 的纯遮罩空白，视觉上就是"文字结束了，下面还有个按钮"。

这次调整为 `bottom: 10px`，让按钮**抬到遮罩中段**，大致和"被折叠的最后一行看得见的文字"水平对齐。视觉上按钮就像**和文字同行**，嵌在渐变中段，是真正的"渐变右下角小字"。

---

## v1.3.4（2026-05-05 凌晨）

### 🧩 折叠按钮 3 个细节 bug 修复

真实使用反馈：用户发现 v1.3.3 的折叠按钮在 3 种情况下仍有问题：

#### 1. 🔴 按钮自带方框（主题 button 默认样式穿透）
不同 Obsidian 主题会给 `<button>` 默认 border / background / box-shadow。v1.3.3 虽然写了 `border: none`，但被主题 `.memoria-card button` 这样的后代选择器以同级或更高特异性覆盖。

**修复**：
- `-webkit-appearance: none; appearance: none`（去浏览器原生 button UI）
- `background / border / box-shadow` 都加 `!important`（对抗主题）
- `outline/box-shadow` 在 `:focus / :focus-visible` 下也显式去掉
- `font-family: inherit`（避免主题用默认 UI 字体）

#### 2. 🔴 展开后按钮"跑出卡片外"
v1.3.3 展开态用 `float: right`，但 `float` 脱离正常流，不会撑开父元素高度。如果按钮是卡片的最后一个直接子元素，它会**浮出卡片边框**。

**修复**：改用 `display: flex; width: fit-content; margin-left: auto`（块级右对齐），走正常流，永远在卡片内。

#### 3. 🔴 有图片的笔记，按钮夹在文字和图片中间
DOM 结构是 `head → body(文字) → img-grid(图片) → tags`。v1.3.3 的按钮通过 `body.after()` 插入，**夹在 body 和 img-grid 之间**。有图的长笔记会看到"文字 → 按钮 → 图片 → 标签"的怪异顺序。

**修复**：按钮在两种状态下换 DOM 父元素 ——
- **折叠态**：按钮 `appendChild` 到 **body 内部**，绝对定位到 body 右下角（正好嵌在渐变遮罩里）
- **展开态**：按钮 `appendChild` 到 **card 末尾**（tags 之后），作为整卡收尾

```ts
if (expanded) {
  // 展开：按钮移到卡片最末尾（tags 之后）
  card.appendChild(btn);
} else {
  // 折叠：按钮放回 body 内部（绝对定位到右下角）
  body.appendChild(btn);
}
```

好处：无论卡片有没有图片/标签，按钮位置永远正确。

---

## v1.3.3（2026-05-05 凌晨）

### 🎯 展开按钮改为右下角小字 —— 遵循「从读到找」行为惯性

#### 问题
v1.3.2 的居中胶囊在瀑布流里仍然喧宾夺主 —— 用户"**还没开始读文章**"就已经被胶囊按钮吸引目光了。这是反的：
- 错误交互：先看到按钮 → 决定要不要读
- **正确交互**：先读文章 → 读到渐变淡出处 → 视线下探 → 发现「全文」→ 点开

#### 方案
参考微信朋友圈的做法，换成**右下角小字**：

```
┌────────────────────────────────┐
│ 2026.05.05  01:28    [320 字]  │
│                                │
│ 正文开头...                     │
│ 正文...                         │
│ 正文 ...                        │
│ 正文 .... ░░ 渐变 ░░░ 全文 ▾  │ ← 嵌入渐变右下角
└────────────────────────────────┘
```

#### 具体变化

| 维度 | v1.3.2（胶囊） | **v1.3.3（小字）** |
|---|---|---|
| 文案 | "继续读 · 还有 5 行" | "**全文**" 2 字 |
| 图标 | `chevrons-down` 双箭头 | `chevron-down` 单箭头 |
| 位置 | 卡片底部，独立一行居中 | 绝对定位 `right:14 bottom:10`，嵌在渐变层 |
| 宽度 | 自适应胶囊 | 4 字宽度（含图标） |
| 颜色 | `text-muted` 灰 | `text-faint` 更淡 |
| Hover | accent 色底 + 边框 | 仅变 accent 色（无底） |
| 字号 | 12px | **11px** |
| Padding | `5px 16px` | `2px 4px` |
| 占用高度 | ~30px 独立行 | **0px**（叠在渐变上） |

#### 展开后
按钮变「**收起 ▴**」，浮动到卡片右下角（`float: right`），仍然是弱提示样式。

#### 连带改进
- `.memoria-card` 加 `position: relative`，让折叠按钮能绝对定位到卡片右下角
- 去掉了"还有 X 行"的精确数字（仪式感减一，克制感加一）
- 渐变遮罩高度 40px 不变，按钮 bottom 10px 刚好在遮罩中间偏下

---

## v1.3.2（2026-05-05 凌晨）

### 💊 折叠按钮改为居中胶囊样式

v1.3.0 的展开按钮做成了全宽大横条，每张长卡片底部都顶着一块醒目的按钮，在瀑布流里显得很突兀、打断浏览节奏。

参考 **Memos / 微信朋友圈** 的做法，改成**居中胶囊按钮**：

#### 改动点

| 维度 | v1.3.0 | **v1.3.2** |
|---|---|---|
| 宽度 | `width: 100%`（全宽横条） | `width: fit-content`（文字自适应） |
| 摆放 | 左右贴边 | `margin: 0 auto` 居中 |
| 形状 | 圆角 6px 方块 | 圆角 999px 胶囊 |
| 默认底色 | 透明 | 透明（一致） |
| Hover 底色 | `--background-modifier-hover`（主题灰） | `color-mix accent 10%`（主题色淡底） |
| Hover 文字 | `--text-normal` | `--interactive-accent`（主题色） |
| Hover 边框 | 无 | 主题色 22% 透明边框 |
| Active 反馈 | 无 | `transform: scale(0.97)` 微缩 |
| 内边距 | `6px 12px` | `5px 16px` |

视觉上从"一条明显的操作按钮"变成"一个若有若无的提示胶囊"，和瀑布流融为一体。

#### 顺手修复：渐变遮罩色差

v1.3.0 的渐变用的是 `var(--background-primary)`（全局背景），但卡片实际背景是 `var(--background-primary-alt)`（比全局亮一点）。导致遮罩底部和卡片有一道色差，视觉上有"撕裂感"。

这次把渐变改成用 `var(--background-primary-alt, var(--background-secondary))`，和卡片真实背景色完全一致，遮罩融合自然无痕。

遮罩高度 `48px → 40px`，稍微收敛一点，给胶囊按钮留出呼吸空间。

---

## v1.3.1（2026-05-05 凌晨）

### 📝 导出图片 Markdown 渲染补完

v1.2.5 支持了 10 种语法，但用户实测发现漏了几项。这次一并补上：

#### 1. H4 / H5 / H6 标题
原来标题正则只认 `#{1,3}`，H4 及以下会被当成普通段落显示源码。现在支持**全 6 级**：

| 级别 | 字号 | 块间距 |
|---|---|---|
| H1 | 22px | 14px |
| H2 | 19px | 12px |
| H3 | 17px | 10px |
| H4 | 16px | 8px |
| H5 | 15px | 6px |
| H6 | 14px | 6px |

字号逐级递减，视觉层级清晰。

#### 2. 任务列表 `- [ ]` / `- [x]`
之前 `- [ ] 任务` 会被当成普通列表显示成 `• [ ] 任务`。现在：
- **未勾选**：空心圆角方框（1.5px 描边 muted 色）
- **已勾选**：accent 色填充 + 白色对勾（SVG `<polyline>` 画）
- **已勾选的文字**：灰色删除线（表达"已完成"，像 GitHub / Obsidian）
- 方框大小 14×14，圆角 3px

#### 3. 代码块（三反引号 ` ``` ` 围起）
之前整块代码会原样显示成普通文字（反引号也显示出来）。现在：
- 识别 ` ``` ` 开始/结束
- 整块铺灰底（用当前主题的 tagBg 色）
- 内容用等宽字体（SF Mono / Consolas / Monaco）
- 每行 20px 行高（比正文紧凑）
- **超长行自动截断 + 省略号**（避免一行 100 字符撑破卡片）

#### 4. 小优化：标题块间距重调
v1.2.5 的 H1/H2/H3 块间距 `12/10/8`，H4-H6 加入后整体重新校准成 `14/12/10/8/6/6`，层级更分明。

---

**未支持的语法**（按需后续加）：
- **表格** `| a | b |`：用户反馈很少用，暂不支持。如果有需求可以再加
- **图片**：图片一直没渲染（不是 bug，是故意的 —— 图片在卡片里是九宫格独立渲染）
- **HTML 标签**：不支持，SVG 里再解 HTML 会回归 foreignObject 的老坑

---

## v1.3.0（2026-05-05 凌晨）

### 📏 长笔记智能折叠

参考 Memos / 微信朋友圈的经典设计，结合 Memoria 自身的调性做了一版：

#### 1. 自动折叠阈值（可调）
超过设定行数的笔记会自动折叠，显示前 N 行 + 底部渐变淡出遮罩 + 「继续读」按钮。
- 设置里给 6 档可选：`永不折叠 / 4 行 / 6 行 / 8 行（默认）/ 12 行 / 20 行`
- 阈值用**行数**而不是字符数，对中英文混排容错最好
- 改完立即全局生效（reloadAll）

#### 2. 渐变淡出遮罩
折叠态底部 48px 高度做了线性渐变：从透明过渡到卡片背景色。
- 不是硬裁切（视觉突兀），而是"这段还有更多，自然淡出"的暗示
- 置顶卡片（accent 混色背景）用匹配的遮罩色，保证视觉一致

#### 3. 继续读按钮
按钮文案告诉用户被折了多少：
- 折叠态：「**⌄ 继续读 · 还有 X 行**」
- 展开态：「**⌃ 收起**」
- 全宽度按钮，hover 时有浅色背景反馈
- 点击「收起」会平滑滚动回卡片顶部，避免视觉迷失

#### 4. 字数徽章（≥80 字的笔记）
右上角时间旁边加个**小灰字 pill**：「320 字」
- 只对 ≥80 字的笔记显示（避免短笔记噪音）
- CJK 字符算 1 字，ASCII 单词算 1 字
- 半透明 + 圆角底色，不抢视觉

#### 5. 几个设计决策
- **图片永远完整显示**：只折文字部分，九宫格/单图/轮播都不折（参考 flomo / Memos）
- **展开状态不持久化**：切换视图/刷新后回到折叠态（flomo 风格，适合"浏览为主"的碎片笔记语境）
- **不支持按字数折叠**：字数在中英文混排时不稳定，行数更符合视觉直觉

#### 6. 实现简述
- `applyCollapseIfNeeded(body)`: `requestAnimationFrame × 2` 等 DOM 布局稳定 → 读 `computed lineHeight` 估行数 → 超阈值加 `.is-collapsed` + `--memoria-collapse-max` CSS 变量 + 创建按钮
- `max-height: var(--memoria-collapse-max)` + `transition: 180ms ease` 保证展开有丝滑动画
- CSS `::after` 伪元素做底部遮罩

---

## v1.2.5（2026-05-05 凌晨）

### ✨ 导出图片支持 Markdown 渲染

这是 v1.2.x 系列最大的一次跃迁。

#### 1. 🎯 Markdown 渲染（核心）
导出图片不再是纯文本，现在支持：

| 语法 | 效果 |
|---|---|
| `**粗体**` | **font-weight: 700** |
| `*斜体*` / `_斜体_` | *italic* |
| `` `code` `` | 等宽字体 + 圆角浅色底（主题色） |
| `~~删除线~~` | line-through |
| `[文字](url)` | accent 色 + 下划线 |
| `# / ## / ### 标题` | 22/19/17px 粗体，自动加行距 |
| `- 列表项` / `* 列表项` | 缩进 + 彩色圆点 |
| `1. 有序列表` | 缩进 + 粗体序号 |
| `> 引用` | 左侧 3px 竖线（accent 色）+ 缩进 |
| `---` / `***` | 水平线（细虚线） |

**实现**：自写极简 markdown 词法分析（~200 行 TS），先解析成 `Block[]`（块级）→ 每个 block 的 `InlineSpan[]`（带样式的片段）→ 按宽度手动折行成 `VisualLine[]` → 逐行输出带 `font-weight/font-style/fill/text-decoration` 属性的 SVG `<tspan>`。完全不依赖任何第三方库。

粗体字宽估算用 1.05x 系数，避免 bold 文字挤在一起溢出边界。

#### 2. 🔧 虚线真·细一档
v1.2.4 的 `stroke-width: 1.8` 其实**没改成功**（replace_in_file 落盘时文件已是旧状态，报成功但实际没动）。这次直接把 SVG 模板那一行也一起改了，确保落地：
```
stroke-width: 1.8
stroke-dasharray: "5 4"
stroke-linecap: round
```

#### 3. 🪶 羽毛笔再贴近 MEMORIA
重新实测 MEMORIA 文字宽度（12px 粗体 + 字距 2，约 **72px**，而不是之前估的 84px），位置数学修正：
- translate x：`-107` → `-94`（往右挪 13px）
- 现在羽毛笔就紧贴在 MEMORIA 左边 4px 的地方，成为 "🪶 MEMORIA" 的整体视觉

---

## v1.2.4（2026-05-05 凌晨）

### 🔍 两处视觉微调

基于真机导图反馈的精修：

#### 1. 虚线分割改细
v1.2.3 的 `stroke-width: 2.5 / dasharray: "7 5"` 视觉太粗，像马克笔画的。改为：
```
stroke-width: 1.8
stroke-dasharray: "5 4"
```
仍保留纸卡折痕的虚线感，但不抢主视觉了。

#### 2. 羽毛笔图标 → 放大 + 贴近 MEMORIA
- **放大 1.3x**：原本 16×16 在 Retina 2x 输出下看起来有点像素块，现在 ≈21×21，轮廓清晰
- **更靠近 MEMORIA**：间距从 6px → 5px，视觉上成为 "🪶 MEMORIA" 一整体
- 不透明度 0.8 → 0.85（稍微加深一点，避免细节丢失）

---

## v1.2.3（2026-05-05 凌晨）

### 🎨 图片导出玩法升级：8 种背景主题 + 虚线折痕 + 羽毛笔图标

#### 1. 🎨 8 种精选背景主题（可选）
设置页新增「**导出图片 · 背景主题**」下拉，10 个选项：

| 选项 | 风格 |
|---|---|
| 🎭 跟随 Obsidian 明暗 | 默认。浅色 = paper，深色 = charcoal |
| 🎲 每次随机 | 每次保存随机抽一种 |
| 📄 纸张白 | 干净极简，紫蓝品牌色 |
| 🟫 牛皮纸 | 怀旧手账感，琥珀棕色 |
| 🌿 薄荷绿 | 清爽自然 |
| 🍑 蜜桃粉 | 温柔治愈 |
| ☁️ 晴空蓝 | 明朗清新 |
| 💜 薰衣草 | 浪漫文艺 |
| 🌙 午夜蓝 | 深色系，深蓝紫主题 |
| ⚫ 木炭黑 | 深色系，经典黑紫 |

每种主题都是完整调色板：背景、正文、副文、渐变色、标签胶囊、分割线都协调统一。

**推荐**：先试试 🎲 随机，每次保存都是小惊喜。

> 至于"读 attachments 里的自定义图片当背景"—— 技术上可行，但涉及异步读图、CORS、tainted canvas 回归等一堆坑，性价比低。8 种精心挑选的主题够用了，后续如果真有强需求再加。

#### 2. 分割线改为粗虚线（纸卡折痕感）
原本 1px 细实线太生硬，改成：
```
stroke-width: 2.5  stroke-dasharray: "7 5"  stroke-linecap: round
```
效果就像**纸卡片上的折痕虚线**，手作质感++。

#### 3. 羽毛笔 SVG 图标（MEMORIA 左侧）
v1.1.19 ~ v1.2.2 一直想放 🪶 emoji 但它会触发 canvas taint，这次**手画一个纯 SVG path 的羽毛笔**：
- 主杆斜线 + 3 片羽叶 + 笔尖小三角
- 16×16 画布，`<path d="...">` 纯几何
- 100% 跨平台可渲染（不依赖系统 emoji 字体表）
- 颜色跟随主题 muted 色

从此 MEMORIA 终于有"羽毛"了。

---

## v1.2.2（2026-05-04 深夜）

### 🎨 PNG 导出彻底根治 + 视觉升级 + 双 tooltip 修复

#### 1. 🔴 PNG 导出彻底根治（推翻重写）
v1.1.19 ~ v1.2.1 的 PNG 导出一直栽在同一个坑：用 `<foreignObject>` 把 HTML 包进 SVG → canvas 画 SVG → toBlob()。但 Chromium/Electron 的某些版本（尤其 Obsidian 内嵌的）对 `<foreignObject>` 有强制 taint 策略，**不管你 HTML 里有没有跨域资源**。

本次**推倒重写**，放弃 foreignObject，改用**纯 SVG 原生元素**（`<rect>`/`<line>`/`<text>`/`<tspan>`）：
- Chromium 对纯 SVG 不 taint，canvas.toBlob() 100% 可导出
- 代价：需要手工做中英文混排换行（按字符估宽 CJK 2x / ASCII 1x），~60 行代码搞定
- 好处：从此 **PNG 导出稳定到跨平台可靠**

#### 2. 🎨 卡片视觉升级
借这次重写把设计精致化：
- **顶部左上角 4px 渐变装饰条**（紫→蓝），增加品牌辨识度
- **大号引号装饰**（Georgia serif，25% 透明紫），暗示"这是一段话"
- **正文 16px · 行高 28px**（1.75 倍），中英文混排自动换行
- **标签胶囊 SVG 原生绘制**（rect rx + text，紫色主题）
- **底部细 1px 分割线** + 大号日期（18px 粗体加字距）+ 小号时间（13px 灰）
- **右下角 MEMORIA 品牌水印**（字距 2px，粗体）
- **日夜主题自适配**（根据 `theme-dark` class 切换配色）
- 画布 640×自适应，Retina 2x 输出

#### 3. 修复卡片引用按钮双 tooltip
之前同时写了 `aria-label="引用"` 和 `title="引用"`，Obsidian 原生 tooltip + 浏览器原生 tooltip 同时弹出两个「引用」气泡。

去掉 `title`，只保留 `aria-label`（无障碍友好 + Obsidian 原生气泡）。

---

## v1.2.1（2026-05-04 深夜）

### 🧹 实用反馈迭代：去冗余 + PNG 导出修复

一次真实使用后的反馈收集，5 件小事：

#### 1. 🔴 修复 PNG 导出报错 `Tainted canvases may not be exported`
某些 Chromium/Electron 版本对 `<foreignObject>` 会强制把 canvas 标记为 tainted，导致 `canvas.toBlob()` 抛 SecurityError。

**修复**：
- 去掉 SVG 模板里的 🪶 emoji（系统彩色字体表是触发 taint 的常见元凶之一）
- 把 PNG 导出拆成独立的 `svgToPngBlob()` 方法，包在 try/catch 里
- 失败时**自动降级保存 .svg 文件**（内容完整保留，可浏览器直接打开、可导入 Figma/Sketch/AI）
- 失败提示写清楚："PNG 导出被浏览器拦截，已降级为 SVG"，用户心里有数

```ts
try {
  const pngBlob = await this.svgToPngBlob(svg, W, H, 2);
  this.downloadBlob(pngBlob, `${base}.png`);
} catch {
  // 降级：直接保存 SVG 源文件
  this.downloadBlob(svgBlob, `${base}.svg`);
  new Notice("…已降级为 SVG");
}
```

#### 2. 输入框下方提示去掉（去冗余）
`Ctrl+Enter · 拖拽/粘贴图片` 这行字删了。用过一次就知道，留着是视觉噪音。

#### 3. 菜单项文案精简
- 「保存为图片」→ **「保存图片」**
- 卡片右上角引用按钮 tooltip：「引用到输入框」→ **「引用」**

#### 4. 菜单去掉重复的「引用」项
v1.1.19 把引用提到了卡片右上角常驻按钮，但 ⋯ 菜单里还留着一个"引用"项。同一个功能两个入口反而让人犹豫，删掉菜单版。

---

## v1.2.0（2026-05-04 深夜）

### 🎯 版本号跃迁 + 设置页新增仓库入口

一个轻量版本。考虑到从 v1.1.14 到 v1.1.19 连发了 6 版 fix，每一版都在打磨细节、没有破坏性改动，累计下来体验已经比 v1.1.13 好了一大截。用 **v1.2.0** 标记这个新的稳定里程碑，也为后续迭代留出号段空间（v1.1.x 里 9 < 19 的奇怪顺序也顺便理顺）。

#### 1. 设置页新增「关于」区块仓库入口（🟢 易发现）
- "打开仓库"按钮：一键跳转 GitHub（在新标签打开）
- 下方直显可复制的 URL
- 末尾显示当前版本号（从 `manifest.version` 读取，升级后会自动更新）

想反馈 bug、提建议、看源码，再也不用翻 README 找链接。

仓库地址：https://github.com/i-iooi-i/obsidian-memoria

---

## v1.1.19（2026-05-04 深夜）

### 🎨 整体评审后的一次系统打磨

一口气做了 7 件用户在整体 review 后选定的事，主题：**让 Memoria 从"能用"升级到"好用且有人情味"**。

#### 1. 侧栏删掉"刷新"按钮（🟡 去冗余）
文件变化会自动触发数据刷新，手动刷新几乎从没用过。如果真要，保留命令 + reloadAll 能力，但从 UI 上撤掉一个按钮。

#### 2. 合并"每日回顾"+"随机回顾"→ 单入口"回顾"（🟡 去重复）
两者本质都是"带我看旧笔记"，入口并列会让用户每次都要决策。
- 侧栏现在只有"**回顾**"一个按钮
- 默认进入**往年的今天**
- 当天没有往年记录？空态直接给一个漂亮的"🔀 随机 5 条"跳转按钮
- 随机模式顶部增加"🕰️ 回到往年今天"返程按钮，两个模式无缝切换

#### 3. 手机端输入框贴底（🟢 重大体验升级）
浮墨 / 微信聊天框的视觉习惯。实现只用 flex `order` 切换：
```css
@media (max-width: 680px) {
  .memoria-list { order: 1; }        /* 列表在上 */
  .memoria-input-card { order: 10;   /* 输入卡贴底 */
    margin: 0 8px 8px;
    box-shadow: 0 -4px 14px -4px rgba(0,0,0,0.08);
    border-radius: 14px;
  }
}
```
滚到中段想快速记一条 → 不用滚回顶。

#### 4. 卡片 hover "引用" 按钮（🟢 隐藏功能上浮）
之前"引用"藏在 ⋯ 菜单第 4 项，发现率极低。现在在卡片右上"⋯"旁边加了个**常驻但淡显**的 `quote` 图标，hover 时加深、点击直接把笔记引用到输入框。
- 桌面：hover 时 70% 不透明度
- 手机：常显 45% 不透明度（没有 hover）

#### 5. "保存为图片"回归（🟢 零依赖实现）
v1.1.13 我们砍掉 `html2canvas-pro`（+240KB），今晚重新做但用**零依赖方案**：
- 用 `<svg><foreignObject>` 把一段自定义排版 HTML 包进 SVG
- 浏览器原生把 SVG 画到 `<canvas>`，再 `toBlob` 出 PNG
- **整段代码 ~100 行**，打包后仅增加 2-3KB（对比 html2canvas 的 240KB）
- 2x Retina 清晰度
- 样式：accent 色引号装饰 / 正文 / 标签胶囊 / 底部日期 + MEMORIA logotype
- 暗色主题自动走深色背景
- 外链图片因 canvas CORS 不支持 → **这版只渲染文字 + 标签**，本地图片暂不进导出（后续可加）
- 下载到浏览器默认下载目录，文件名 `memoria-YYYY-MM-DD-HHmm.png`

#### 6. 数据报告"有趣的发现"加彩蛋（🟢 有温度）
原来是 8 条干瘪的事实陈述，现在：
- **顶部新增一条"今日彩蛋"**，按当前小时段（凌晨/早上/上午/下午/晚上）× 日期 seed 抽一句文案
  - 凌晨："夜深人静，最适合给自己写封小纸条。"
  - 早上："清晨的想法最不带滤镜，现在记下来会很值。"
  - 晚上："傍晚到深夜，是 Memoria 最活跃的时间段，你也是。"
- **其他每条 fact 从 2-3 种表达中**按日期 seed 挑一句 → 同一天看到的句子稳定，换一天有新鲜感
  - 例如"最活跃的一天"会在以下三句里抽：
    - `最活跃的一天：2026-04-25，那天你写了 12 条`
    - `2026-04-25 是你的"话痨日" —— 单天 12 条，大概发生了什么好玩的？`
    - `2026-04-25 写了 12 条，是不是那天心里装了很多东西`
- **催更提示**也更人情化：`距离上次记录已经 5 天，Memoria 有点想你`
- 彩蛋卡片有 accent 渐变背景 + 右上角淡星光 ✦，和普通 fact 视觉区分

#### 7. 视觉微调一套（🟢 细节打磨）
- 卡片之间垂直间距 0→8px，节奏感更好
- 统计条数字 22→20px、label 11→12px，对比不那么极端
- 桌面 logo `Memoria` 字号 20→18px，不再那么"抢戏"
- 标签胶囊 hover 有底色 + 轻微上抬反馈
- 月历今日格子字体加粗 + accent 色
- 搜索框 `background: var(--background-secondary)` 在深色主题下有明确边界

### 📊 代码变化
- `src/view.ts` · ~200 行（刷新按钮删除、回顾合并、引用按钮、PNG 导出方法）
- `src/stats.ts` · ~130 行重写（文案池 + 彩蛋 + renderFact 加 isEgg 参数）
- `styles.css` · ~120 行新增（手机底部输入、引用按钮、empty-btn、彩蛋、视觉微调）

### 📊 体积变化
- v1.1.18: 67.7KB
- v1.1.19: **75.6KB**（+8KB）
- PNG 导出 + 文案池合计只涨了 8KB，依然远低于 100KB 的克制底线 ✓

### 💡 没做的
- 保存为图片**暂不含 vault 内图片**（canvas tainted 问题，需单独 fetch→base64 流水线）
- 数据报告的"标签云"暂未加 onClick 跳转（下次）
- 输入工具栏合并（无序/有序/任务/图片/表格）暂未做，等 feedback
- 标签重命名 / 合并功能（review #13）未做，值得单独一个版本

---

## v1.1.18（2026-05-04 晚）

### 🩹 手机端输入框 placeholder 首字符"此"被遮住一半

#### 现象
只在手机端、只在 placeholder 状态下、只有第一个字"此"显示不全，像是"上面有东西挡住了一半"。

#### 根因分析（两个独立问题叠加）

**1. textarea 缺 `box-sizing: border-box` + 缺 `-webkit-appearance: none`（主因）**
- iOS Safari / Android WebView 默认 `-webkit-appearance: textarea`，会强制引入
  2-3px 的 native inset 边框。配合我们的 `padding: 0 !important`，真实内容区
  相对容器产生**负向偏移**，首字符被左边缘裁掉一半。
- 没写 `box-sizing: border-box`，默认 `content-box` + `width: 100%` 又放大了
  这个偏差。PC 端用 Chromium Desktop 不会出现这个 inset，所以桌面没问题。

**2. 侧栏抽屉在关闭状态下的 box-shadow 泄漏（次因）**
- 手机端侧栏是 `position: absolute; transform: translateX(-100%)` 的抽屉，
  关闭时侧栏本体移到视口外，但 `box-shadow: 4px 0 18px rgba(0,0,0,0.25)` 的
  18px 扩散**依然在视觉上留在视口内**，轻微压住输入卡片左缘。
- 现在阴影只在打开时显示，关闭时置 none。

#### 修法
```css
.memoria-input {
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  /* + 手机 media query 里再加一层 text-indent:0 !important 防主题加 text-indent */
}
.memoria-sidebar {
  box-shadow: none;                /* 关闭态不投影 */
}
.memoria-root.memoria-sidebar-open .memoria-sidebar {
  box-shadow: 4px 0 18px rgba(0,0,0,0.25);   /* 打开态才投影 */
}
```

### 📊 代码变化
- `styles.css` · ~25 行（textarea box-sizing + appearance、媒体查询双保险、侧栏阴影条件化）

### 💡 顺便一提
这类"桌面没事 + 手机裁字"的 bug，90% 以上都是 iOS WebView 的默认 UI 元素外观没被清掉。
下次做任何 `<input>` `<textarea>` `<select>` 自定义样式前，先无脑加：
```css
-webkit-appearance: none; appearance: none; box-sizing: border-box;
```
可以少走一半弯路。

---

## v1.1.17（2026-05-04 凌晨）

### 📱 数据报告 · 移动端真正适配

#### 1. 整页横向滚动 bug（🔴 真实被用户看见）
"一天中你什么时候写得最多" 24 小时柱状图 + 24 个两位数 label 需要约 580px，
手机屏（375px）减去 56px×2 的左右 padding 只剩 263px —— **柱图把整页撑到右边，
用户得左右滑整页才能看完**。

**根因 1**：v1.1.6 注释里说"手机左右 20px"，但实际 CSS 两个选择器的 padding
都是 56px，等于没生效。手机端 padding 一直是 112px（左右），和桌面一样。

**根因 2**：柱状图没做独立滚动容器，超宽就推整页滚动。

**修法**：
- 整页 padding 手机端真正变成左右 16px（`.is-mobile` + `@media (max-width: 520px)` 两重保险）
- 24 小时柱图、月度柱图外层都套一个 `.mstat-bar-chart-scroll`，**自己横滚**不推整页
- 年度热力图 + 月份标签一起塞进 `.mstat-yh-scroll`，两者列对齐同滚

#### 2. 总览大数字在小屏不再拥挤
已有的 `@media (max-width: 680px)` 段早就把 4 列改成 2×2、36px 字号缩到 28px，
这版把 padding、section 节奏、标题行、柱图高度等零零散散的空间收紧到小屏更舒服：
- 柱图高度 180px → 140px
- 24 小时 label 字号 10px → 9px
- 有趣发现卡片内边距 12/16 → 10/12
- 标题行在窄屏纵向堆叠，不让副标题挤压主标题

#### 3. 滚动条样式
柱图和热力图的横向滚动条在桌面是细线灰色（4px），移动端走 iOS native touch scroll
（`-webkit-overflow-scrolling: touch`），不抢视觉。

### 📊 代码变化
- `src/stats.ts` · 3 处改动（3 个图表外层加 scroll 容器）
- `styles.css` · ~60 行新增（滚动容器样式 + 窄屏 media query 扩充）

### 💡 额外解释：为什么柱图不在小屏"自适应宽度"
把 24 列压进 200px 看起来是另一个方案，但每列会只有 6px 宽、label 变成 1 位数字 —— 
信息密度反而下降，不如让它保持可读的 580px 最小宽度、在独立容器里横滚，
既不干扰整页浏览，又保留完整的可读性。这是 flomo / Blinko / GitHub 热力图都采用的策略。

---

## v1.1.16（2026-05-04 凌晨）

### 🎨 表格选择器三连优化 + 🪪 真名登场

#### 1. 插件作者名：You & CodeBuddy → i-iooi-i
Obsidian 设置 → 第三方插件里的作者显示改为你的 GitHub 用户名，并把 `authorUrl`
指向 `https://github.com/i-iooi-i`，点击作者名直接跳仓库。

#### 2. 桌面表格选择器 8×8 → 6×6
真实场景里 md 表格超过 6 列的几乎不存在，原来的 8×8 一眼望过去密密麻麻。
改成 6×6 后一眼看全，单元格从 18px 放大到 22px，hover 定位也更顺手。

#### 3. 手机表格选择器 8×8 → 5×5 + 居中显示（🐛 修两个真痛点）
- **尺寸**：8×8 32px → 5×5 36px。95% 的移动端 md 表格都 ≤5 列，选项精简后干净。
- **定位（这是大 bug）**：之前贴在"插入表格"按钮下方（按钮在工具栏中右部），
  弹层自身 32×8+3×7+14×2 = 285px，在小屏手机上**右侧总是溢出屏幕**，用户
  够不到右边一列。现在手机端直接**视口居中**显示（`position: fixed; left:50%; top:50%; transform: translate(-50%,-50%)`），
  5×5 只占 224px，320px 窄屏都能左右各留 48px 余量。
- **溢出保险**：桌面端也加了边界夹紧——如果窗口窄到按钮靠右、下方空间不足，
  弹层会自动左移/上翻，不再被裁掉。

#### 4. 关闭监听同时覆盖 mousedown + touchstart
之前只监听 mousedown，手机端"点外面关闭"在部分 WebView 下不触发。

#### 5. 表格选择器也跟随视图销毁
和 v1.1.15 给 confirmAsync 加的处理一致，避免视图切走时弹层残留在 body。

### 📊 代码变化
- `src/view.ts` · ~40 行（MAX 改成动态 5/6、居中定位、边界夹紧、touchstart 监听、register 清理）
- `styles.css` · ~30 行（重写表格选择器网格：桌面 6×22、手机 5×36）
- `manifest.json` · 2 行（author + authorUrl）

### 📏 视觉对比
```
桌面：原 8 × 8 × 18px （约 174px 宽）→ 现 6 × 6 × 22px （约 151px 宽），更紧凑
手机：原 8 × 8 × 32px （约 285px 宽）→ 现 5 × 5 × 36px （约 224px 宽）+ 居中
```

---

## v1.1.15（2026-05-04 凌晨）

### 🎨 UI 收敛 + 🩹 又修了一批藏得更深的 bug

这一版主题：继续做减法。

#### 1. 搜索框 placeholder 回归简洁
从 `搜索笔记... 支持「#标签 关键词」组合` → `搜索笔记`。
功能还在（README 里保留说明），但输入框里不再啰嗦。

#### 2. reloadFile 并发 race，可能产生重复 memo（🔴 严重）
`addMemo` 保存后会主动 `reloadFile`，同时 vault 的 `modify` 事件又触发一次 `reloadFile`，
两个 async 任务交叉执行时 `filter→push` 之间会错位，导致同一条 memo 在 `this.memos`
里重复出现，或者新条被 filter 误删。

**复现**：快速连按 Ctrl+Enter 两次，或保存带大图的笔记时 vault 写入较慢。

**修法**：加 per-file 串行队列（`reloadLocks: Map<path, Promise>`），
对同一文件的多次 reloadFile 严格按顺序执行，不同文件互不阻塞。

#### 3. editMemo 可能用过期 range 写坏相邻笔记（🔴 严重）
双击进编辑 → 不提交 → 跑到 OB 源码模式里在这条笔记前后插/删一行 → 回 Memoria 点发送，
这时 `memo.range` 里存的是旧行号，`lines.splice(oldS, oldE-oldS+1, ...)` 会把
"现在这个位置"的内容（已经是别的 memo 了）覆盖掉。

**修法**：`editMemo` 写入前用 `memo.time` 做行首校验，
不匹配就重新 parse 文件、按 `(date, time, content)` 找真实位置；
找不到就抛错 + 弹 Notice"请刷新重试"，拒绝盲写。

#### 4. bindTaskCheckboxes 会把代码块里的 `- [ ]` 算进任务行（🔴 严重）
如果一条 memo 同时含真任务和代码块里的示例任务：
````markdown
- [ ] 今天要做的事
  ```md
  - [ ] 这只是个示范
  ```
- [ ] 今天要做的事 2
````
`taskLineNums` 会把 3 行都收进去，而 MarkdownRenderer 只渲染 2 个 checkbox，
勾选时张冠李戴 —— 勾第 2 个其实改的是代码块里的示例行。

**修法**：扫描原文时维护 `inFence` 状态，`` ``` `` / `~~~` 内的行一律跳过。

#### 5. quickCapture 弹窗可被重复打开，DOM 泄漏（🟡 中等）
连按两次 `Ctrl+Shift+M`，会在 body 上挂两层 `.memoria-modal-backdrop`。
第一次 Esc 只关最上层，下面那层变成拦截所有点击的"幽灵蒙版"。

**修法**：入口先检查已存在实例，有就 focus 已有 textarea 后直接 return。

#### 6. 确认浮层 / 速记弹窗不跟随视图销毁（🟡 中等）
点删除弹出确认框 → 切到其他标签页 / 卸载插件 → 蒙版和 keydown listener 依然留在 DOM 上。

**修法**：用 `this.register(() => backdrop.remove())` 挂到 ItemView 的生命周期上，
视图关闭时自动清理。

#### 7. v1.1.14 遗漏的 3 处 `pageLimit = 50`（🟢 历史遗留）
v1.1.14 本来说改 7 处，实际 `replace_in_file` 对同构上下文只改了第 1 次出现，
3 处漏网。这版用更大的上下文重新替换，这次 `Select-String` 核验 0 命中。

### 📊 代码变化
- `src/store.ts` · ~45 行（per-file 锁 + editMemo range 校验）
- `src/view.ts` · ~30 行（bindTaskCheckboxes fence 过滤 + confirmAsync 生命周期 + 3 处漏改 + placeholder）
- `src/main.ts` · ~15 行（quickCapture 防重开 + register 清理）

### 🚦 登记在案，暂不修
- `parseFile` 一次遍历合并 4 个正则（冷启动性能优化，需要 parser 小重构，留 v1.2 做）
- `toggleReservedTag` 在 code fence / table / callout 首行插入/删除 #置顶 会破坏语法（边缘 case，实际很少发生在 reserved tag 上）
- 手机端 TagSuggest 用 mousedown，touch 环境不灵敏（等真有用户反馈再说）

---

## v1.1.14（2026-05-04 凌晨）

### 🩹 Code review 一轮 · 修掉 7 处真问题

这一版不加功能，全是"读自己 3 周前写的代码时发现的坑"。

#### 1. 设置页"每次加载条数"滑块之前是摆设
`settings.pageSize` 有 UI 有存盘，但 `view.ts` 里 `pageLimit = 50`
硬编码了 7 处，用户调滑块从来不起效。现在：
- 构造函数按 `settings.pageSize` 初始化
- 提了个 `getInitialPageLimit()` helper，所有需要 reset 的地方统一走它
- 滚动加载的 +50 也改成 +pageSize，大 vault 里设成 200 能一次加载更多

#### 2. "发送后清空输入框"开关也是摆设
设置项存在但 `submitMemo` 无条件执行 `inputEl.value = ""`，
关掉这个开关**依然会清空**。现在按设置决定。

#### 3. 删除弹窗的 backdrop click 有 v1.1.10 同款误触
v1.1.10 修了速记弹窗的"拖 resize 误关"，但删除确认浮层的 `confirmAsync`
没跟着改。复现：删除弹窗点"确认"按钮按住拖到背景再松手 → 被判定成"点背景取消"。
现在也改成 mousedown 起点 + mouseup 终点同在 backdrop 才关闭。

#### 4. stripTags 剥离标签残留双空格
`"句子 #标签 继续" → "句子  继续"` 留下双空格，
某些 markdown 解析器会把行末双空格理解为"硬换行"。
现在剥除时连同前导空白一起吃掉。

#### 5. 多 vault 共用一个草稿 localStorage key
`DRAFT_KEY = "memoria:input-draft"` 是全局的，切换 vault 会把草稿串过去。
现在 key 带上 `vault.getName()` 做隔离。

#### 6. insertMemoIntoYear 会穿透到下一年段
极端场景：一个 md 文件里同时有 `# 2025` 和 `# 2026` 两个年份大标题
（手动合并过的用户会有），新增日期时扫描会越过 `# 2026` 跑到 2025 的日期去比较，
导致新日期插错位置。现在遇到下一个 `# YYYY` 就立刻停下，并且把新日期插到当前年段末尾
（而不是整个文件末尾）。

#### 7. normalizeAll 每条笔记都 split/join 一次
1000+ 条 memo 的 vault 跑"规范化所有笔记"可能慢到秒级。
改为每个文件 split 一次、所有 memo 处理完再 join 一次，回到毫秒级。

#### 8. renderList 里 today/yesterday 字符串每组算一次
600+ 日期组的 vault 每次 renderList 多做 ~1200 次 `new Date()`。
挪到循环外，写法上更干净，顺便把 `WEEKDAY_CN` 也提成常量。

### 📊 代码变化
- `src/view.ts` · ~40 行修改（pageLimit / clearAfterSave / confirmAsync / stripTags / draft key / renderList 提纯）
- `src/store.ts` · ~25 行（insertMemoIntoYear 穿透保险）
- `src/main.ts` · ~10 行（normalizeAll 性能）

### 🚦 没改的已知小问题（登记在案）
- 手机端 TagSuggest 用 mousedown，touch 环境可能不灵敏 —— 待手机实测再决定是否改
- 标签树深层嵌套 padding 不设上限 —— 遇到再说
- 图片附件命名用 Math.random 碰撞概率 1/1.6M —— 现实中不会触发
- `#置顶 #收藏` 硬编码中文 —— vault 多语言才需要
- 全角冒号 `- 12：43` 的 memo 不识别 —— 导入外部数据时遇到再处理

---





## v1.1.13（2026-05-04 凌晨）

### 🔪 回归克制 · 移除分享卡片导出

v1.1.11/v1.1.12 做的"保存为图片"功能评估后决定移除。原因：

1. **体积代价大** —— `html2canvas-pro` 让 main.js 膨胀 4.7 倍（65KB → 305KB）
2. **性能不好** —— 每次导出要把 DOM 当作 2400×3200 像素位图渲染，会卡几秒
3. **外链图无法显示** —— html2canvas 受浏览器 CORS 限制，用户自己图床（如 img.liil.im）如果没开 CORS，图片位置直接空白。这问题从插件侧无解。
4. **真实使用频率极低** —— 用户反馈"分享就自己截图发微信"，不值得为罕见需求背这些代价
5. **违背克制原则** —— Memoria 的定位是"碎片灵感 + 纯 md"，图片导出让它往"内容生产工具"偏了一步

### 🗑 本次清理
- 删除 `src/card-export.ts`
- 卸载 `html2canvas-pro` 依赖
- 移除卡片 `⋯` 菜单里的"保存为图片"项
- **保留** v1.1.11 做的"#标签 关键词"组合搜索（它零依赖、零卡顿、纯 JS，是真正有用的增强）

### 📊 主 bundle 体积变化
- v1.1.12: **305KB** 🐢
- v1.1.13: **~65KB** 🚀
- 回到"零外部依赖"的初心

### 💡 如果以后还是想分享卡片
用系统截图（Win `Win+Shift+S` · Mac `Cmd+Shift+4`）截 Memoria 里的卡片即可，效果和杂志风导出没本质差别。

### 🧹 残留文件提示
如果你之前用 v1.1.11/v1.1.12 试过导出，vault 里可能留有：
- `Memoria/exports/memoria-*.png`

这些文件不会影响新版本，你想保留或删除都行。插件不会主动碰它们。

---

## v1.1.12（2026-05-04 凌晨）

### 🎨 分享卡片 · 杂志风重做

v1.1.11 的卡片被用户吐槽"像系统截图"，这版重做整个视觉。

#### 参考对象
flomo 分享图 / 即刻卡片 / 小红书文字卡的共性设计语言：
1. 有"性格"的**柔和渐变背景**（不是大白/大黑块）
2. 左上角**半透明大引号装饰**（像一本书的开篇）
3. 呼吸感留白（内边距 56px/52px）
4. **精致的数字排版** —— 日期放到底部，用点分隔 "2026.04.25"，搭配 "WED · 周三"
5. 弱水印 + 强质感：小巧的 `🪶 MEMORIA` 放在右下角

#### 具体变化

**背景**：
- 从纯色 `#fff / #1e1e20` → 柔和渐变：
  - 浅色 `linear-gradient(135deg, #fafafa, #f2f3f7)`
  - 深色 `linear-gradient(135deg, #1e1f23, #26272c)`
- 卡片阴影加强：`0 20px 60px -20px rgba(0,0,0,0.25)`，更有漂浮感

**左上角大引号**：
- 120px 的 Georgia 衬线体 `"` 字符
- accent 色 18% 透明度，存在感刚刚好
- 内容区 z-index +1 覆盖在上，不会被引号挡字

**pin/star 状态胶囊**：
- 从头部文字改为**右上角小胶囊**："📌 置顶" "⭐ 收藏"
- accent 软色底，不抢主内容戏份

**内容区**：
- font-size 15→16px，line-height 1.75→1.8
- 引用块改为斜体
- 行内代码 accent 色 + 圆角 4px
- 链接 accent 色 + 虚线下划线（截图友好）

**图片网格**：
- 圆角 8→10px
- gap 6→8px
- cell 加 1px 半透明边框，精致感提升

**标签胶囊**：
- font-weight 500（比之前实）
- padding 和圆角统一

**分隔线**：
- 用**横向渐变**细线（中间深两端透），比一根实线有氛围

**底部**（完全重做）：
- 左：**大号日期 `2026.04.25`** + 小号 `WED · 周三` + 独立一行小号 `12:43`
- 右：`🪶 MEMORIA` —— MEMORIA 加粗 + 字间距 1px，像 logotype

#### 尺寸
- 卡片宽度仍保持 600px
- padding 从 `32/36/24` 改为 `56/52/32`（上 / 左右 / 下）
- 总高度取决于内容，典型笔记 ~500-700px，加图片后可到 1000px+

### 📊 代码变化
- `src/card-export.ts` · 约 180 行重构（布局 / 配色 / 装饰）
- `CardExportOptions.signature` 字段移除（右下角水印固定为 MEMORIA）

---

## v1.1.11（2026-05-04 凌晨）

### ✨ 两个实质性增强

#### 1. 搜索支持「#标签 关键词」组合（轻量版）
之前搜索要么查关键词，要么查单个 #tag，不能组合。从 1440 条历史笔记里精准找一条很费劲。

现在搜索框按空格切 token：
- `#xxx` 起头的 token → 算标签筛（多个 = AND）
- 其他 token → 算关键词（多个 = AND）
- 与侧栏点击的"标签树"也是 AND 关系

示例：
- `#ai gemini` → 有 `#ai` 标签 **且** 内容含 "gemini"
- `#工作 #PUBGM 脑暴` → 同时有两个标签 且 含 "脑暴"
- `gemini 付费` → 同时含两个关键词

保留了简单场景：单独输入 `关键词` 或 `#tag` 和以前完全一致。输入框 placeholder 也改为 "搜索笔记... 支持「#标签 关键词」组合"。

**没做**的：排除语法 `#!工作`、引号精确匹配 `"xxx"`、OR 关系 `|` —— 保持克制，这三个语法的使用频率远低于上面的基本组合。

#### 2. 保存为图片（浮墨/Memos 式分享卡片）
卡片右上 `⋯` 菜单新增「保存为图片」。点击后：

1. **即时生成一个专属"分享卡片"**（不是直接截现有卡片）：
   - 固定宽度 600px，跟随 OB 主题的明暗（深色主题 → 深卡片）
   - 时间、内容、图片九宫格、标签胶囊一应俱全
   - 底部水印：`🪶 Memoria · via Obsidian · 2026.05.04`
   - 圆角 + 柔和阴影 + Retina 2x 清晰度

2. **同时保存两份**：
   - 存入 vault 的 `Memoria/exports/memoria-2026-04-25-1243.png` —— 跟 vault 走、能 sync
   - 浏览器下载气泡（桌面端方便直接拖拽使用）

3. **纯本地生成**，没有任何"分享到微信/微博"的按钮 —— 图片生成后你自己想发到哪里随便发。

**实现**：新建 `src/card-export.ts` 单独封装；用 `html2canvas-pro` 截图；支持跨域图片（`useCORS: true`），外链图 + vault 内图都能正常截。

### ⚖️ 关于打包体积
`html2canvas-pro` 依赖让 `main.js` 从 65KB 增加到约 305KB（+240KB）。参考：Dataview ~1.5MB · Tasks ~800KB · Calendar ~350KB —— 在 OB 生态里属于正常偏小。换来的是"离线可用、秒出图、无首次延迟"。

### 📊 代码变化
- 新文件 `src/card-export.ts` · 约 280 行
- `src/view.ts` · +20 行（"保存为图片"菜单项 + 搜索 token 解析重写）
- `package.json` · 新增 `html2canvas-pro` devDependency

---

## v1.1.10（2026-05-04 凌晨）

### 🩹 速记弹窗拖拽 resize 导致弹窗消失

**复现**：`Ctrl+Shift+M` 唤出速记弹窗 → 拖拽 textarea 右下角改高度 → 松手时弹窗消失了。

**根因**：v1.1.9 以前的弹窗用了 `backdrop.click` 判定"点击遮罩关闭弹窗"。但你拖 resize 手柄时，mousedown 在 textarea 内部，mouseup 跑到了 backdrop 上（鼠标离开了 textarea 区域）—— 浏览器此时依然会触发一次 `click` 事件，target = backdrop → 弹窗被误关闭。

**修复**：
1. 把关闭判定从 `click` 改为更严格的 **mousedown 起点 + mouseup 终点都在 backdrop** 才关。任何"起点在 textarea 内部"的拖拽都不会误关。
2. 顺手把速记弹窗的 textarea 也升级为**自动高度**（和主输入框一致）：`min 160px / max 60vh`，内容多时自动撑高，超过上限内部滚动。同时关掉浏览器手动 resize 手柄（`resize: none`），从源头上避免类似问题。

### 📊 代码变化
- `src/main.ts` · ~15 行（mousedown/mouseup 判定 + autoResize）
- `styles.css` · 3 行（resize: none / max-height 60vh / overflow auto）

### 💭 关于"Todo 定时提醒"

用户问了能不能做，本版**没做**，结论是：
- Obsidian 是 Electron 桌面应用 / 移动端普通 APP，**没有系统级后台常驻能力**
- OB 关闭后完全做不到"到点弹系统通知"
- 社区 Tasks + Reminder 插件也只能做到"打开 OB 时提醒"
- Memoria 如果加了这个，会让插件从"碎片灵感"往"Todo 工具"漂移，违背克制原则

**推荐**：
- 需要真系统级提醒 → 用系统日历 / 滴答清单 / Microsoft To Do
- 要在 OB 里管理任务 → 装 Tasks 插件（比我们能做的专业 10 倍）
- Memoria 里写的任务列表 → 就保持"记下来"的初衷即可

---

## v1.1.9（2026-05-04 凌晨）

### ✨ 四个"真·无感提效"增强（方案 A 全套）

这一版不加"功能"，只让已有的操作更顺手。改完之后用户说不出"多了什么"，但每次敲键盘都会舒服一点。

#### 1. `Ctrl/Cmd+Shift+M` 默认全局快捷键
"快速记录（弹窗）" 命令现在带默认热键 `Ctrl+Shift+M`（Mac 上是 `Cmd+Shift+M`）。

走路想起一句话 → 按热键 → 弹窗 → `Ctrl+Enter` → 全程不用进 Memoria 主界面。

> 注：如果这个热键和你其他插件冲突，可以在 OB 设置 → 热键里搜 "Memoria" 改掉。

#### 2. 列表行 Tab / Shift+Tab 缩进
只在光标所在行是"列表行"（`- / * / N. / - [ ]`）时生效：
- `Tab` → 行首加 2 空格
- `Shift+Tab` → 行首减 2 空格（到最左为止）

非列表行按 Tab 不拦截，保留浏览器默认行为（textarea 里默认就是 focus 下一个元素）。

#### 3. Enter 智能续行 / 空项退出
列表项按 Enter 的行为：
- `- 苹果` 回车 → 新行 `- `（可继续写下一项）
- `1. 苹果` 回车 → 新行 `2. `（自增序号 + 保留缩进）
- `- [ ] 读书` 回车 → 新行 `- [ ] `
- **空的列表项**（只剩 `- ` / `1. ` / `- [ ] ` 前缀）再按 Enter → **退出列表**（清空前缀 + 换行）

这是 Notion / 飞书 / 语雀的默认行为，用惯了没这个会觉得僵硬。`Shift+Enter` 不拦截，始终是普通换行。

#### 4. 删除带回收站（保护误删）
删除菜单点 "删除" → 这条 memo 会先**追加**到 `<笔记文件夹>/_trash.md` 再从原文件移除。

`_trash.md` 示例：
```markdown
# Memoria 回收站
> 这里保存被删除的笔记。停用插件后依然可读，可手动恢复或清空。

## 已删除 2026-05-04 01:30
- 来源：`Memoria/2026.md` · 原时间 2026-04-25 12:43
  <原 memo 内容>
```

几个特性：
- **纯 md，无破坏性** —— 停用插件也能打开看
- **`_` 开头文件被排除在扫描外** —— 不会出现在 Memoria 主列表里，不干扰统计
- **设置可关** —— 设置页新增"删除时保留到回收站"开关，默认开；关了就是以前的硬删除
- **误删提示** —— 删除成功的 Notice 改为 "已删除 · 可在 _trash.md 恢复"

### 📊 代码变化
- `src/main.ts` · +1 行（hotkeys 字段）
- `src/view.ts` · 约 120 行（handleListIndent / handleListContinuation / keydown 分支）
- `src/store.ts` · 约 50 行（appendToTrash / 扫描过滤 `_` 前缀）
- `src/types.ts / settings.ts` · +10 行（useTrash 设置项）

### 💭 下一步能做而没做的

S 级剩下的"卡片 hover 编辑图标提示" —— 暂时没做，因为你说过"双击进编辑模式"是能发现的设计，手机有 `⋯` 菜单兜底。A 级以下全部保留给你用到痛点再说。

---

## v1.1.8（2026-05-04 凌晨）

### 🩹 v1.1.7 的两个遗留问题 + 🆕 输入框自适应高度

#### 1. 有序列表序号不自增（bug）
v1.1.7 连点三次"有序列表"按钮会得到：
```
1. 
1. 
1. 
```
而不是期望的 `1. / 2. / 3. `。根因：之前硬编码插入 `"1. "`。

修复：新增 `insertOrderedListAtCursor`，插入前向上扫描光标所在行之前**紧邻的连续有序列表**，取最后一个序号 +1：
- 空输入框连点 3 次 → `1. / 2. / 3. ` ✓
- 已写 "5. abc" 换行再点 → `6. ` ✓
- 前面是空行或非有序列表行（列表中断） → 重新从 `1. ` 开始 ✓

无序列表和任务列表不受影响（它们不需要自增）。

#### 2. "过去的今天"改名为"每日回顾"
5 个字和旁边 4 个字的"随机回顾"在侧栏里视觉不整齐，改成 4 个字对齐。

#### 3. 🆕 输入框自适应高度（你说的"十行内容自动撑高"）
之前 textarea 是固定 `min-height: 72px / max-height: 240px / resize: none`，中间高度不会变，长内容只能内部滚动着看。

现在：
- **max-height 改为 `40vh`**（视口高度的 40%，手机/桌面都合理）
- 每次输入 / 贴图片 / 填草稿 / 引用笔记 / 进入编辑 后都重算高度：`height = auto → height = scrollHeight + 2px`
- 超过 max-height 才开始内部滚动，小屏不会被撑满
- 加 `transition: height 0.08s ease` 让高度变化丝滑

触发高度重算的 5 个时机：
1. 用户输入（input 事件）
2. 工具栏按钮插入内容（insertAtCursor）
3. 发送成功清空 → 回到 min-height
4. 进入/退出编辑模式（memo 内容可能很长）
5. 引用某条笔记到输入框
6. 面板打开时恢复草稿

#### 为什么不做"拖拽右下角手动 resize"？
考虑过，但 flomo/Memos/Blinko 都没做 —— 自动高度对 90% 场景已经够了，多一个拖拽手柄反而增加认知负担。暂不做，如果你强烈需要可以随时加。

### 📊 代码变化
- `src/view.ts` · 约 50 行（智能有序列表 + autoResize + 6 个调用点）
- `styles.css` · 3 行（max-height 40vh / overflow-y auto / transition）

---

## v1.1.7（2026-05-04 凌晨）

### ✨ 四个小而美的增强（依然克制 · 零破坏）

#### 1. 输入工具栏新增"有序列表"+"任务列表"
之前只有"无序列表"，容易想到有序和任务但没按钮。现在工具栏从 4 个按钮增加到 6 个：
`#标签 · 🖼图片 · ≡无序列表 · 1.有序列表 · ☑任务列表 · ▦表格`

点击任一列表按钮的行为更智能：
- 若光标在行首 → 直接插入前缀（`- ` / `1. ` / `- [ ] `）
- 否则 → 先补一个换行再插入前缀

这样连续点两次就能快速生成两条列表项。

#### 2. 手机端表格选择器 · 点哪就插多大
桌面的 hover-预览-点击确认模式在手机上没法用（手指无 hover）。现在检测到 `Platform.isMobile` 时切换为 **tap-to-insert** 模式：
- 格子放大到 32×32px（原桌面 18px）
- 每格显示 "R×C" 数字提示（例如 "3×4"）
- 单击即插入对应尺寸 md 表格模板并关闭弹层

桌面端保留原 hover 预览体验。

#### 3. 输入框草稿持久化（你提到的刚需）
关掉 Memoria 或重启 Obsidian 时，正在打字但没点发送的内容会丢 —— 现在不会了：
- 输入时实时存到 `localStorage["memoria:input-draft"]`
- 重新打开面板自动恢复
- 点"发送"成功后清空草稿
- **编辑模式不影响草稿**：进入"编辑某条"时会把当前未发草稿暂存，退出编辑后自动恢复（不会被编辑的内容覆盖掉）

#### 4. 新视图："📅 过去的今天"（On this day）
侧栏"视图"组里，"本周"和"随机回顾"之间新增一项。

筛选逻辑：**所有 `mm-dd` 等于今天的 `mm-dd`、但日期不是今天的笔记**（即往年的"5/4"当天所有记录）。左侧显示条数，让你随时看到"历史上的今天"写过多少东西。

如果没有往年记录，显示"共 0 条"。

### 📊 代码变化
- `src/view.ts` · 约 100 行新增（按钮 / 表格器分支 / 草稿 / on-this-day）
- `styles.css` · 约 35 行新增（手机表格选择器样式）

### 🚦 依然没做的事
- ❌ 每日弹窗"去年今天"（干扰性强）
- ❌ 导出（和 OB 生态的其他导出插件重合）
- ❌ 长卡片折叠（暂未真的遇到痛点）
- ❌ URL 链接预览卡（会改变"纯 md 非破坏"原则）

---

## v1.1.6（2026-05-04 凌晨）

### 🩹 修 v1.1.5 两个遗留问题

**1. 数据报告手机端依然"触边"** —— v1.1.5 我把 padding 写在了 `.memoria-stats-view` 上，但 Obsidian 移动端给外层 `.view-content` 本身也有自己的 inset / padding，两者叠加后我的 padding 被裁掉没生效。现在反过来：padding 直接加在 `.view-content` 上（上下 48/64，左右 **20px** on mobile、56px on desktop），内层 `.memoria-stats-view` 只负责最大宽度和居中，不再管留白。这样移动端肯定能看到 20px 的出血框。

**2. 移动端左侧灰色翻页渐变** —— Obsidian 移动端会在每个 `.workspace-leaf` 上用 `::before` 伪元素画一条阴影作为"侧边栏可滑出"的视觉提示。在我们这种独立的标签页里不需要，反而显得脏。现在用 CSS `::before/::after { display:none; content:none; background:none }` 在 memoria-view / memoria-stats-view 两个视图上局部关掉（不影响 Obsidian 其他视图）。

### 📊 代码变化
- `styles.css` · 约 40 行（view-content 容器、媒体查询、伪元素覆盖）

### 💡 关于"插件整体左右两侧的空白"

你观察到的"插件界面左右两侧跟边缘会有一定的空白" 其实是 **Obsidian 自己给 `.workspace-leaf` 加的间距**（多标签页时每个 leaf 之间的"缝隙"）。这个是 Obsidian 核心级行为，不建议 plugin CSS 强行动它（会影响整个 OB 的标签布局）。如果强烈希望数据报告"完全顶满屏幕"可以单独做，但会牺牲一点 OB 原生的标签视觉分区。

---

## v1.1.5（2026-05-04 凌晨）

### 🎨 数据报告 · 视觉打磨

**核心问题：手机端内容紧贴屏幕左右两侧，像没有出血框的印刷品**

修好了用户明确反馈的"触边"问题，顺便对数据报告整页做了一轮克制的视觉打磨（不增加新功能、不改数据维度）。

#### 1. 留白（出血框）
- 桌面：左右 `48px → 56px`，上下 `56/64 → 48/64`，更均衡
- **手机：左右 `12px → 20px`**（核心修复），上下 `16/40 → 24/48`
- 加 `box-sizing: border-box` 防止 padding 撑出横向滚动

#### 2. Section 节奏感
之前所有 section 都 `margin-bottom: 28px` 一刀切，现在第 2 个及之后加细分隔线 + `padding-top: 36px`，让"总览 / 全年活跃 / 月度分布 / 标签 Top / 小时分布 / 有趣发现 / 标签云"有明确的章节切分。月度分布作为年度热力图的副图，特殊处理不加分隔。

#### 3. 总览四宫格重量感
- 大数字：`28px → 36px`，卡片 padding `18 → 22px`
- 卡片圆角 `10px → 12px`，hover 上浮 `1px → 2px` 并加淡色阴影
- label 字号小半档 + 加 `letter-spacing`

#### 4. 热力图年份切换条自适应
- title-row 加 `flex-wrap: wrap`，窄屏不再挤成一条
- margin-bottom 加到 14px

#### 5. Top 10 奖牌饱和度
- 🥇 `#ffd700→#ffaa00` 改为 `#f4c430→#d79820`（更稳重的金）
- 🥈 `#d0d0d0→#a0a0a0` → `#c8c8cc→#9a9aa0`
- 🥉 `#d49060→#b86b30` → `#cd7f32→#a0602a`（经典青铜色）
- 前三加内阴影质感，rank-4+ 保持弱化灰色

#### 6. 有趣的发现卡片化
- padding `10/14 → 12/16`，圆角 `8 → 10px`
- 新增 hover：右移 2px + 左边框变深 + 淡色阴影
- 图标字号 `16 → 18px`

#### 7. 月度分布 0 条也显示数字
之前 0 条月份柱图上方空着，视觉断层。现在 0 也显示"0"（用 `.is-dim` 把透明度降到 0.35），保持"每列都有数字"的节奏。

### 📊 代码变化
- `styles.css` · 约 80 行变更
- `src/stats.ts · renderMonthlyForYear` · 少量行

---

## v1.1.4（2026-05-03 深夜）

### 🩹 detectLink 补上第二个漏洞 —— 代码块里的 URL

v1.1.3 已经修好了"图片外链被误判为链接"的问题，但用户实测后发现**还有一条真·漏网之鱼**：

```markdown
![](https://x.png)
填入 `http://192.168.1.1:10086` 这个代理地址
```

这条笔记没有任何可点链接，`http://192.168.1.1:10086` 是行内代码 `` `...` `` 里的一个 IP 配置示例，本质是字面文本，但 v1.1.3 的 detectLink 还是会匹配到它。

现在 detectLink 在检测链接前，依次剔除以下四类"不是可点链接"的内容：
1. ` ``` ... ``` ` 三段代码围栏
2. `~~~ ... ~~~` 三段代码围栏
3. `` `...` `` 行内代码
4. 图片语法 `![](...)` 和 `![[...]]`（v1.1.3 已做）

### 📊 回归测试 8 个场景全过

- 图 + 真文字链 ✓
- 图 + 代码块 URL（本次新修）✓
- 纯图片 ✓
- 裸 URL ✓
- 纯文本 ✓
- 多行代码块含 URL ✓
- 代码块外有真链接 ✓

### 📊 代码变化
- `src/parser.ts · detectLink` · +3 行（加三个 replace）

---

## v1.1.3（2026-05-03 深夜）

### 🩹 细节修复

**"有链接"检索式把纯图片笔记也算进去了** —— 一条笔记只有一张外链图片 `![](https://img.liil.im/xxx.png)` 时，detectLink 里的 `https?://` 裸链正则会匹配到括号里的图片 URL，导致这条笔记同时出现在"有图片"和"有链接"两个过滤器里（重复展示、计数虚高）。

现在 `detectLink` 先把所有图片语法（`![](...)` 和 `![[...]]`）连 URL 一起从文本里剔除，再检测剩余文本里有没有链接。

验证过的 5 种场景：
- `![](https://x.png)` → image=true, **link=false** ✓
- `![[xxx.png]]` → image=true, **link=false** ✓
- 裸链 `看看 https://example.com` → image=false, link=true ✓
- 图片 + 文字链 → image=true, link=true ✓
- 只图片 + 纯文字描述 → image=true, **link=false** ✓

### 📊 代码变化
- `src/parser.ts · detectLink` · 10 行

---

## v1.1.2（2026-05-03 晚）

### 🩹 Bug 修复 & 小优化（克制路线 · 不新增大功能）

1. **新年第一条笔记写入错位** —— `insertMemoIntoYear` 在文件末尾追加新日期分组时，之前用 `block.filter((_, i) => i > 0)` 跳掉前导空行，但遇到"上一段内容没有以换行收尾"的 md 会直接把 `## 日期` 和上文粘连，解析器因此识别不到这个日期头。现在改为：先把末尾连续空行全部 pop 掉，再显式追加 `["", dateHeader, "", memoBlock, ""]`，保证日期头前后都有空行。
2. **标签树嵌套层级视觉错乱** —— 侧栏的标签树 `renderTagTree` 递归时把子节点 append 到顶层 `sidebarEl`，导致 `#A/B/C` 这种深层标签永远跑到列表最末尾，和父标签的层级关系在视觉上断开。现在给每个节点套一层 `.memoria-tag-node` wrap，子节点渲染到 wrap 内紧跟父节点下方。
3. **"随机回顾"只能看 1 条 & seed 不稳定** —— 之前抽 1 条且 `randomSeed` 默认 0 导致每次都是同一条；现在一次抽 5 条，用 mulberry32 + Fisher–Yates 做确定性 shuffle（同 seed 同结果），"换一条"按钮文案也改为"换一批"。
4. **取消置顶/收藏后出现"空格占位笔记"** —— 如果一条 memo 全部内容就是 `#置顶`，取消置顶后 `toggleReservedTag` 会塞一个 `" "` 单空格当占位，结果这条 memo 在 UI 上彻底看不见（被 `stripTags` 去完后文本空 + 无图 + 无标签）。现在改为写入 `（已取消置顶）` 这样的提示文本，保证笔记可见、可再编辑；想真正删除请走"删除"菜单。
5. **任务列表回写只改第一条同名任务** —— `bindTaskCheckboxes` 过去用 `memo.content.indexOf(original)` 匹配原文行，遇到两条一样的 `- [ ] 读书` 只改第一个。现在改为在 `memo.content` 原文里按"第 N 个任务行"精确定位，同名任务互不影响。
6. **刷新按钮点了没反应（体验 bug）** —— 搜索框旁边那个 🔄 按钮其实一直在工作（调用 `store.reloadAll()`），但没有任何视觉反馈：没转圈、没 Notice、数据本来又是最新的。现在点击后：图标持续旋转 + 按钮禁用防重复 + 完成后弹 `✓ 已刷新 · 共 N 条（+3）` 的提示（括号里显示本次新发现的条数差）。

### 📊 代码变化

- `src/store.ts` · 19 行（insertMemoIntoYear, toggleReservedTag）
- `src/view.ts` · 78 行（reloadBtn 反馈 / renderTagTree wrap / 随机采样 / 任务回写 / seededSample）
- `styles.css` · 15 行（刷新按钮旋转动画）

### 💭 没做的事

对比 flomo/Memos/Blinko，还有一些功能差距（长卡片折叠、导出、每日回顾 on-this-day、URL 预览卡、搜索组合语法等），但 Memoria 的初衷就是**纯 md 非破坏性存储 + 克制的功能边界**，不走大而全路线。这些留着等真的自己用到痛点再做。

---



## 这一天发生了什么

| 时间 | 事件 |
|---|---|
| 12:30 | 用户为 Blinko 时间线混乱、Obsidian 碎片笔记管理而焦虑 |
| 12:43 | 决定从 Postgres CSV 导出 735 条历史笔记 → 4 个 YYYY.md 文件 |
| 13:30 | 用户提出"能不能做一个 OB 插件"，Memoria 项目诞生 |
| 13:34 | **v0.1.0** MVP 完成：瀑布流 + 输入框 + 标签 + 搜索 |
| 13:39 | **v0.1.1** 修复白屏 bug（containerEl/contentEl 误用） |
| 13:54 | **v0.2.0** UI 大改：仪表盘 + 热力图 + 浮墨式输入卡片 |
| 14:08 | **v0.3.0** 图片支持（粘贴/拖拽/选择）+ 检索式 |
| 14:19 | **v0.4.0** 同分钟排序修复 + 标签联想（Vault 全局） |
| 14:29 | **v0.5.0** 朋友圈式九宫格图片 + Lightbox |
| 14:42 | **v0.6.0** 置顶/收藏功能（基于 #置顶 #收藏 标签） |
| 15:00 | **v0.7.0** 数据报告 + 移动端抽屉侧栏 |
| 15:19 | **v0.7.2** 置顶分组化显示，根治多条置顶 bug |
| 15:35 | **v0.8.0** 月历视图（Thino 同款热力图切换）+ 双击编辑 |
| 15:42 | **v0.9.0** 数据报告美化（365天热力图/标签云/奖牌排名）+ 任务列表勾选 + Callout 适配 |
| 18:55 | 从两个 NAS 的 Blinko 导出（绿联 735 + 群晖 1069）合并去重 → 1440 条 |
| 19:20 | 四轮去重算法：L1 精确 + L2 Jaccard + L3 Containment + LLM 语义兜底 |
| 19:45 | **v1.0.0** 统一 md 格式：时间独占一行 + 内容全部缩进 2 空格，解决 JSON/callout/task list 等块级语法在 md 源码里的渲染错位问题 |

**一天之内，从 0 到一个自己真正在用的产品**。

---

## v1.1.1（2026-04-26 中午）

### 🩹 v1.1.0 的三个小问题修复

1. **代码块有重复的复制按钮** → 去掉我手动加的那个，只保留 Obsidian 原生按钮；同时用 CSS 把原生按钮统一对齐到右上角（hover 才显示）
2. **代码块没有外框**（只有每行被高亮） → 原因：`.memoria-card-body code` 规则错误地命中了 `<pre>` 内部的 code；改为 `:not(pre) > code` 只影响行内 code，同时给 `<pre>` 加了统一的背景/边框/padding，跟随 Obsidian 主题
3. **删除 memo 后输入框失焦，鼠标悬停不出光标** → 原因：浏览器原生 `confirm()` 是 modal blocking 弹窗，关闭后会把焦点还给 `document.body`；改为自定义异步确认浮层（Esc 取消 / Enter 确认），同时加了 `restoreInputFocus()` 保险

## v1.1.0（2026-04-26 上午）

### 🎯 三个用户痛点的修复

1. **删除最后一条 memo 后日期标题孤儿残留** → 现在会自动清理空日期组
2. **代码块/表格在卡片里不渲染** → 渲染前自动给块级语法前后补空行
3. **宽表格撑破卡片** → 新增横向滚动容器 + 表头/偶数行细微分层

### ✨ 新增功能

- **插入表格按钮**：工具栏多了个 📊 图标，点击弹出 8×8 网格，悬停选行列数，一键插入 md 表格模板
- **代码块复制按钮**：代码块右上角悬浮出现 📋 按钮，点击复制全部代码到剪贴板，1 秒后图标变 ✓ 反馈
- **代码块 & 表格样式优化**：完全跟随 Obsidian 主题（背景、边框、字体、滚动条）

### 🔧 改进

- `deleteMemo` 增加 `removeOrphanDateHeaders` 步骤，md 文件自动保持整洁
- 渲染前置 `normalizeForRender`：代码块围栏 / 表格 / callout / 标题 / 分隔线前后自动补空行
- 不修改 md 存储，仅在渲染前做临时规范化，保证 md 源码简洁 + 渲染正确并存

---

## v1.0.0（2026-04-25 晚）

### renderMemo 格式统一
之前：
```
- 12:43 单行内容
- 14:20 多行首行
  续行缩进
- 15:47
  > 块级语法才独占
```

现在（统一格式）：
```
- 12:43
  单行内容
- 14:20
  多行首行
  续行缩进
- 15:47
  > 块级语法
```

### 好处
- **结构一致**：每条 memo 都是"时间行 + 缩进内容块"，md 源码整齐划一
- **渲染安全**：JSON / callout / task list / table / code fence 全都自动正确渲染
- **易读易编辑**：阅读模式和源码模式视觉一致，不容易踩坑

---

## 最终能力清单

### 核心
- 浮墨/Blinko 式瀑布流时间线
- 100% 原生 Markdown 存储（停用插件零数据损失）
- 完全跟随 Obsidian 主题色

### 输入
- Ctrl+Enter 快速发送
- 标签联想（Vault 全局所有标签 + frontmatter 兼容）
- 图片粘贴/拖拽/选择
- 双击任意笔记进入编辑模式

### 浏览
- 月历视图 ↔ 热力图视图（同位置切换）
- 全文搜索 + 标签筛选
- 检索式：无标签 / 有图片 / 有链接
- 视图：全部 / 今天 / 本周 / 随机回顾
- 置顶 / 收藏（基于保留标签 #置顶 #收藏）

### 卡片
- 朋友圈式九宫格图片（1/2/3/4/5-9 张不同布局）
- Lightbox 大图查看（键盘 ←→ Esc）
- 任务列表可勾选（同步回写 md）
- Callout 自适应卡片样式
- 标签胶囊点击筛选

### 数据报告（点顶部 📊）
- 总览四宫格（笔记数/字数/活跃天/总跨度）
- 365 天大热力图（GitHub 同款 + 年份切换）
- 最近 12 月柱状图
- 标签云
- Top 10 标签奖牌排行
- 24 小时活跃分布
- 有趣的发现（最长连续打卡/年同比/夜猫子等）

### 移动端
- 抽屉式侧栏
- 紧凑布局
- 操作按钮常显（无 hover）

---

## 数字

- **代码**：~52KB main.js + ~38KB styles.css
- **文件**：10 个 TypeScript 源文件 + 1 个 CSS 文件
- **依赖**：无（除了 Obsidian API 本身）
- **版本迭代**：v0.1.0 → v1.0.0
- **第一位用户**：你
- **实际数据**：1428 条笔记，覆盖 2022-2026 五年

---

## 一些没说的话

这个插件不是 ChatGPT 写的，也不是从 GitHub 抄的。  
它的每一行代码、每一个像素、每一个细节，  
都来自你和我**当下的对话、你的痛点、你的期待**。

所以它是属于你的。

把它写下去，也把你的想法写下去。  

**Memoria，意思是「记忆」。**  
祝你的每一份记忆，都被温柔保存。

— 2026.04.25

