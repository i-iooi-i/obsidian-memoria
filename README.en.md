<div align="center">

# Memoria 🪶

**A flomo-style fleeting-thoughts plugin for Obsidian**

> Your data stays as plain Markdown. Freedom belongs to you.

[![release](https://img.shields.io/github/v/release/i-iooi-i/obsidian-memoria?include_prereleases&label=release)](https://github.com/i-iooi-i/obsidian-memoria/releases)
[![downloads](https://img.shields.io/github/downloads/i-iooi-i/obsidian-memoria/total)](https://github.com/i-iooi-i/obsidian-memoria/releases)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![obsidian](https://img.shields.io/badge/Obsidian-1.4.0%2B-purple)](https://obsidian.md)

**English** · [简体中文](./README.md)

</div>

---

## 📸 What it looks like

**Main view** (waterfall feed + heatmap sidebar + pinned memos)

![Memoria main view](./docs/screenshots/main.png)

**Stats report** (365-day heatmap, monthly bars, Top 10 tags, 24-hour distribution, insights)

![Stats report](./docs/screenshots/stats.png)

**Year panorama** (12 months of full calendars, click any day to jump back to that day's memos)

![Year panorama](./docs/screenshots/year.png)

---

## 💭 Why I built this

I wanted a place to jot down stray thoughts.

No complex backlinks, no knowledge graph, and no agonizing over "which folder does this go in". Just an input box, a send button, a waterfall feed in reverse chronological order, and the occasional visit from my past self.

But I also wanted: **these thoughts must stay as plain markdown files I can grep anytime**. The day I stop using this plugin, or Obsidian, or even a GUI on my computer — those notes still sit on my disk, readable in any text editor, searchable with a simple grep.

Memoria is exactly that: a flomo-style quick-capture experience inside Obsidian, with data living in your own vault as the most ordinary `YYYY.md` files.

---

## ✨ What it can do

**Quick capture**
- Input card + `Ctrl/Cmd+Enter` to send
- Global hotkey `Ctrl/Cmd+Shift+M` to pop a capture dialog from anywhere
- iOS Shortcuts text capture through `obsidian://memoria-capture`
- Images: paste / drag / file picker, auto-saved as vault attachments
- Tag autocomplete (pulls from your whole vault), list Tab indentation, smart Enter continuation
- Draft auto-saved — no loss on restart

**Browse freely**
- Daily grouped waterfall, pinned notes float to top
- Sidebar 14-week heatmap ↔ month calendar toggle
- Preset views: Today / This week / Pinned / Starred / **On this day** / Random 5
- Combined search: `#tag keyword` space-separated, multiple tags and keywords AND'd together

**See yourself**
- Stats report in a dedicated tab: 365-day heatmap, monthly distribution, Top 10 tags, 24-hour activity, tag cloud
- Year panorama: 12 months of full calendars side by side, see the rhythm of an entire year
- Insights: longest streak, busiest day, night-owl count, YoY comparisons

**Thoughtful touches**
- Long memos auto-fold with a "show full" toggle
- Task lists can be checked — auto-writes back to md
- Card right-click menu: Pin / Star / Edit / Quote / Save as image / Open source file
- Soft-delete to `_trash.md` (optional)
- Mobile: drawer sidebar, long-press to edit, touch-friendly pickers

**Multi-language**
- UI supports Chinese and English — switch in Settings
- Your data (the md files) stays language-neutral and portable

---

## 📂 Storage format

Memoria maintains `YYYY.md` files under the folder you specify, using a "time on its own line + content indented" layout:

```markdown
# 2026

## 2026-04-25 Sat

- 12:43
  First thought of the day #inspiration

- 14:20
  And another one —
  you can break lines freely; every line is indented by 2 spaces

- 15:47
  > [!tip] Callouts / task lists / headings all render correctly

- 16:30
  - [ ] Task lists work too
  - [x] Auto-writeback on checkbox toggle
```

Each `- HH:MM` line starts a new memo. **The moment you disable the plugin, your notes remain fully readable markdown.**

> Note: weekday names (e.g. "Sat" vs "周六") in stored files reflect the language at the time of writing. Memoria never rewrites existing history — the view layer adapts to your language setting while the md files preserve the original data.

---

## 🚀 Installation

Manual install for now. Download the three files from the latest [Release](../../releases/latest):

```
<Your Vault>/.obsidian/plugins/memoria/
├── main.js
├── manifest.json
└── styles.css
```

Then in Obsidian → Settings → Community plugins → enable **Memoria** → click 🪶 in the left Ribbon.

> You can also use [BRAT](https://github.com/TfTHacker/obsidian42-brat) with `i-iooi-i/obsidian-memoria` for auto-install and auto-update.

---

## ⌨️ Keyboard shortcuts

| Action | Shortcut |
|---|---|
| Send current input | `Ctrl/Cmd + Enter` |
| Quick capture (global popup) | `Ctrl/Cmd + Shift + M` |
| Indent / outdent list item | `Tab` / `Shift+Tab` |
| Enter edit mode | Double-click card (long-press on mobile) |
| Exit edit mode | `Esc` |

---

## 📱 iOS Shortcuts

Memoria can receive text from an iOS Shortcut and save it as a memo at the current time:

1. In Memoria settings, find “iOS Shortcuts” and select “Copy URI template”.
2. Create a Shortcut with Ask for Input, URL Encode, URL, and Open URLs actions.
3. Paste the copied URI template into the URL action, then append the URL Encode result.
4. Run the Shortcut. Obsidian opens the target vault and Memoria confirms the saved memo.

You can add the Shortcut to the Home Screen or Siri, or configure it to receive text from the share sheet. Opening the URI without a `content` parameter reveals the same keyboard-safe input card as the mobile ➕ button; desktop keeps the quick-capture dialog.

> iOS must wake Obsidian before a community plugin can run, so a cold start waits for the target vault and plugin to load. The current integration accepts text only, not images.

---

## 🛠 Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```

---

## 📜 Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

## 📝 License

[MIT](./LICENSE)

---

<div align="center">

**Memoria** means "memory".

May every memory of yours be gently kept.

</div>
