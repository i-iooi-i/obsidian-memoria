// ================= 侧栏月历视图 =================
// 与热力图在同一位置通过切换按钮来回切换

import { setIcon } from "obsidian";
import { Memo } from "./types";
import { t } from "./i18n";

// v2.0.19: 星期表改从 i18n 动态取（英文 S M T W T F S / 中文 日一二三四五六）
function getWeekdays(): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => t(`calendar.weekday.${i}`));
}

export interface CalendarOptions {
  /** 当前激活的日期（yyyy-MM-dd），用来高亮 */
  activeDate?: string | null;
  /** 点击某天的回调 */
  onPickDate: (date: string) => void;
  /** 当前显示月份变化时通知外层，避免父级重渲染后回到本月 */
  onMonthChange?: (year: number, month: number) => void;
}

/**
 * 渲染月历到 parent 容器
 * 返回一个对象，包含 setMonth 方法用于外部调整月份
 */
export function renderCalendar(
  parent: HTMLElement,
  memos: Memo[],
  options: CalendarOptions,
  initYear?: number,
  initMonth?: number // 0-based
): { element: HTMLElement; setMonth: (y: number, m: number) => void } {
  const today = new Date();
  let year = initYear ?? today.getFullYear();
  let month = initMonth ?? today.getMonth();
  let activeDate = options.activeDate ?? null;

  const container = parent.createDiv({ cls: "memoria-calendar" });

  // 每日笔记数
  const dayMap = new Map<string, number>();
  for (const m of memos) {
    dayMap.set(m.date, (dayMap.get(m.date) ?? 0) + 1);
  }
  const render = (): void => {
    container.empty();

    // 月份头
    const head = container.createDiv({ cls: "memoria-cal-head" });
    const prevBtn = head.createEl("button", {
      cls: "memoria-cal-nav",
      attr: { "aria-label": t("calendar.prevMonth") },
    });
    setIcon(prevBtn, "chevron-left");
    const title = head.createDiv({
      cls: "memoria-cal-title",
      text: t("calendar.monthTitle", { year, m: month + 1 }),
    });
    title.addEventListener("click", () => {
      year = today.getFullYear();
      month = today.getMonth();
      options.onMonthChange?.(year, month);
      render();
    });
    const nextBtn = head.createEl("button", {
      cls: "memoria-cal-nav",
      attr: { "aria-label": t("calendar.nextMonth") },
    });
    setIcon(nextBtn, "chevron-right");
    prevBtn.addEventListener("click", () => {
      if (month === 0) {
        month = 11;
        year--;
      } else month--;
      options.onMonthChange?.(year, month);
      render();
    });
    nextBtn.addEventListener("click", () => {
      if (month === 11) {
        month = 0;
        year++;
      } else month++;
      options.onMonthChange?.(year, month);
      render();
    });

    // 星期头
    const weekHead = container.createDiv({ cls: "memoria-cal-week-head" });
    for (const w of getWeekdays()) {
      weekHead.createDiv({ cls: "memoria-cal-wday", text: w });
    }

    // 日期网格
    const grid = container.createDiv({ cls: "memoria-cal-grid" });
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = firstDayOfMonth.getDay(); // 0=周日

    // 前置空格
    for (let i = 0; i < startDow; i++) {
      grid.createDiv({ cls: "memoria-cal-cell empty" });
    }

    const todayStr = fmtDate(today);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = fmtDate(d);
      const count = dayMap.get(key) ?? 0;
      const cell = grid.createDiv({
        cls:
          "memoria-cal-cell" +
          (count > 0 ? " has-memo" : "") +
          (key === todayStr ? " is-today" : "") +
          (key === activeDate ? " is-active" : ""),
      });
      cell.setAttr("title", count > 0 ? t("calendar.dayCount", { date: key, n: count }) : key);
      cell.createDiv({ cls: "memoria-cal-num", text: String(day) });
      // 活跃度指示点
      if (count > 0) {
        const dot = cell.createDiv({ cls: "memoria-cal-dot" });
        const level =
          count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
        dot.addClass(`level-${level}`);
      }
      if (count > 0 || key === todayStr) {
        cell.addEventListener("click", () => {
          activeDate = activeDate === key ? null : key;
          options.onPickDate(key);
          render();
        });
      }
    }
  };

  render();

  return {
    element: container,
    setMonth: (y: number, m: number) => {
      year = y;
      month = m;
      render();
    },
  };
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
