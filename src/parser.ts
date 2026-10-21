// ================= Memo 解析器 =================
// 负责把 YYYY.md 文件解析成 Memo[]，以及把 Memo 序列化回文件

import { Memo, PIN_TAG, STAR_TAG } from "./types";

const WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/**
 * 解析一个 md 文件内容，抽出所有 memo。
 *
 * 识别规则：
 *   ## 2026-04-25 周六      <- 日期分组
 *   - 12:43 内容内容        <- 一条 memo
 *     (缩进 2 空格的后续行视作同一条 memo 的多行内容)
 */
export function parseFile(filePath: string, raw: string): Memo[] {
  const lines = raw.split(/\r?\n/);
  const memos: Memo[] = [];

  let currentDate = "";
  let i = 0;
  const dateHeaderRe = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+.+)?$/;
  const memoStartRe = /^-\s+(\d{2}:\d{2})\s?(.*)$/;

  while (i < lines.length) {
    const line = lines[i];
    const dm = line.match(dateHeaderRe);
    if (dm) {
      currentDate = dm[1];
      i++;
      continue;
    }
    const mm = line.match(memoStartRe);
    if (mm && currentDate) {
      const time = mm[1];
      const firstLine = mm[2] ?? "";
      const startLine = i;
      const bodyLines: string[] = [firstLine];
      i++;
      // 吸收缩进行（2 空格缩进 或 空行紧跟缩进行）
      while (i < lines.length) {
        const next = lines[i];
        // 遇到下一条 memo 或下一个日期头，停止
        if (memoStartRe.test(next) || dateHeaderRe.test(next)) break;
        // 遇到年份大标题也停止
        if (/^#\s+\d{4}\s*$/.test(next)) break;
        // 缩进 2 空格的属于本条 memo
        if (next.startsWith("  ")) {
          bodyLines.push(next.slice(2));
          i++;
          continue;
        }
        // 空行：可能是 memo 内部的空行，也可能是 memo 之间的分隔。
        //   v2.0.17-iter16 修复：原逻辑只 peek(i+1) 一行 —— 用户连续多个空行时
        //   peek 还是空行，判定为 memo 结束，导致后续内容（即便有缩进）被丢失。
        //   正确做法：跳过任意多个连续空行，看再之后第一行是否仍是本 memo 的
        //   缩进行（不能撞到下条 memo / 日期头 / 年份头）。是的话把这些空行
        //   都纳入 bodyLines；不是则结束。
        if (next.trim() === "") {
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          // 跳过所有空行后，j 指向首个非空行（或越界）
          if (j >= lines.length) break;
          const peek = lines[j];
          if (memoStartRe.test(peek) || dateHeaderRe.test(peek)) break;
          if (/^#\s+\d{4}\s*$/.test(peek)) break;
          if (peek.startsWith("  ")) {
            // 把 i..j-1 这段空行全部纳入 body，i 跳到 j
            for (let k = i; k < j; k++) bodyLines.push("");
            i = j;
            continue;
          }
          break;
        }
        break;
      }
      const endLine = i - 1;
      // 去掉前导/尾部空行（兼容 "- HH:MM" 后另起一行的格式）
      while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
      while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === "")
        bodyLines.pop();
      const content = bodyLines.join("\n");
      const datetime = parseLocalDateTime(currentDate, time);
      const tags = extractTags(content);
      const hasImage = detectImage(content);
      const hasLink = detectLink(content);
      const isPinned = tags.includes(PIN_TAG);
      const isStarred = tags.includes(STAR_TAG);
      // v1.5.0: 任务状态扫描（一次遍历同时得出 open/closed 两个）
      const tasks = detectTasks(content);
      memos.push({
        file: filePath,
        date: currentDate,
        time,
        datetime,
        content,
        tags,
        hasImage,
        hasLink,
        isPinned,
        isStarred,
        hasOpenTask: tasks.open,
        hasClosedTask: tasks.closed,
        range: [startLine, endLine],
      });
      continue;
    }
    i++;
  }
  return memos;
}

/** 把 "2026-04-25" + "12:43" 解析成本地 Date */
export function parseLocalDateTime(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map((s) => parseInt(s, 10));
  const [h, mi] = time.split(":").map((s) => parseInt(s, 10));
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** 抽取 #tag（支持中文、嵌套如 #父/子） */
function findTags(text: string): Array<{ tag: string; start: number; end: number }> {
  // Link fragments belong to their destination, not the memo's tags. Keep link
  // labels and surrounding prose; never change the stored Markdown itself.
  const tagText = text.replace(
    /!?\[\[[^\]\n]+\]\]|\]\((?:\\.|[^\\()]|\([^()]*\))*\)|^[ \t]{0,3}\[[^\]\n]+\]:[^\n]*|\b(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s<>]+/gim,
    (link) => " ".repeat(link.length)
  );
  const re = /#([A-Za-z0-9_\u4e00-\u9fff][A-Za-z0-9_\u4e00-\u9fff/]*)/g;
  const matches: Array<{ tag: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagText)) !== null) {
    matches.push({ tag: m[1], start: m.index, end: re.lastIndex });
  }
  return matches;
}

export function extractTags(text: string): string[] {
  return [...new Set(findTags(text).map((match) => match.tag))];
}

/** Remove only real tag occurrences, preserving identical fragments in links. */
export function stripMemoTags(content: string, selected?: ReadonlySet<string>): { text: string; tags: string[] } {
  const matches = findTags(content);
  let text = content;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (selected && !selected.has(match.tag)) continue;
    let start = match.start;
    while (start > 0 && /[ \t]/.test(content[start - 1])) start--;
    text = text.slice(0, start) + text.slice(match.end);
  }
  return { text, tags: [...new Set(matches.map((match) => match.tag))] };
}

/** 是否包含图片：Markdown ![](url) 或 Obsidian 风格 ![[xxx.png]] */
export function detectImage(text: string): boolean {
  if (/!\[[^\]]*\]\([^)]+\)/.test(text)) return true;
  if (/!\[\[[^\]]+\.(png|jpe?g|gif|webp|svg|bmp|avif)(\|[^\]]*)?\]\]/i.test(text))
    return true;
  return false;
}

/** v1.5.0: 扫描正文里的任务列表项。
 *   Markdown 规范允许多种缩进和列表符号（- / * / +），需要都支持。
 *   `- [ ]` = 未完成，`- [x]` / `- [X]` = 已完成（有些 md 变体还支持
 *   `- [-]` 表示取消但我们不识别，保持最小集合）。
 *   返回 { open, closed } 分别表示"至少有一个未完成/已完成"的布尔。
 *   一次扫描同时算出两个，比 parser 里再单独跑一遍正则省一次遍历。 */
export function detectTasks(text: string): { open: boolean; closed: boolean } {
  // (?:^|\n) 锚定行首，允许前置空白 \s*，支持 - / * / + 三种列表符号
  const openRe = /(?:^|\n)\s*[-*+]\s+\[ \]\s/;
  const closedRe = /(?:^|\n)\s*[-*+]\s+\[[xX]\]\s/;
  return {
    open: openRe.test(text),
    closed: closedRe.test(text),
  };
}

/** 是否包含链接：http(s) 链接、Markdown 链接、Obsidian wikilink
 *
 * Bug fix (v1.1.3): 之前 `https?://` 裸链正则会匹配 `![](https://x.png)` 括号里的 URL，
 *   导致"只有一张外链图片"的笔记被同时算进"有图片"和"有链接"，两边重复出现。
 *   修复方式：先把所有图片语法（含其 URL 部分）整块剔除，再判断剩余文本里是否还有链接。
 *
 * Bug fix (v1.1.4): 代码块里的 URL 也会被当作链接（如 `http://192.168.1.1:10086`
 *   这种配置示例，本意是字面文本不是可点链接）。现在进一步剔除三段代码内容：
 *     1) ``` ... ``` 代码围栏
 *     2) ~~~ ... ~~~ 代码围栏
 *     3) `...` 行内代码
 *   这样"笔记里只有一张图片 + 一个代码块 URL"就不会再被误判为有链接。
 */
export function detectLink(text: string): boolean {
  const stripped = text
    // 代码块（多行围栏）
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    // 行内代码
    .replace(/`[^`\n]*`/g, "")
    // 图片语法（连 URL 一起剥掉）
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/!\[\[[^\]]+\]\]/g, "");
  if (/\[[^\]]+\]\([^)]+\)/.test(stripped)) return true;
  if (/\[\[[^\]]+\]\]/.test(stripped)) return true;
  if (/https?:\/\/[^\s)]+/.test(stripped)) return true;
  return false;
}

/** 根据 Date 生成本地 yyyy-MM-dd */
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 根据 Date 生成本地 HH:mm */
export function fmtTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const mi = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${mi}`;
}

/** 根据 Date 生成中文星期 */
export function fmtWeekday(d: Date): string {
  return WEEKDAY_CN[d.getDay()];
}

/** 生成一条 memo 的 md 文本（统一使用「时间独占一行 + 内容全部缩进 2 空格」格式）
 *
 * 为什么不再用紧凑的 `- HH:MM 内容` 单行格式？
 *   1. 统一结构更美观：日期（##）一行、时间（-）一行、内容缩进，md 源码阅读舒服
 *   2. 避免边缘情况：当内容以 `{` / `"key":` / `>` / task list 等开头时，紧凑格式
 *      会让后续行跳出列表，破坏 markdown 渲染
 *   3. 便于编辑：用 Obsidian 源码/其它编辑器直接修改时不易出错
 *
 * 插件解析器已经兼容新老两种格式，所以现有 md 无需强制重写也能正常工作。
 */
export function renderMemo(time: string, content: string): string {
  const raw = content.replace(/\r\n/g, "\n");
  // 去掉首尾空行
  const lines = raw.split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  // 完全空内容：只写时间行
  if (lines.length === 0) {
    return `- ${time}`;
  }

  // 统一格式：时间独占一行，内容全部缩进 2 空格
  const body = lines
    .map((l) => (l.trim() === "" ? "" : `  ${l}`))
    .join("\n");
  return `- ${time}\n${body}`;
}
