# Script print decisions (9 Nov 2026)

Owner decisions regarding the script print layout and printing behavior across the application.

## 1. Core Goal
- **Paper saving:** Eliminate Page 2 completely. Content flows naturally across as many A4 pages as needed.
- Never waste an entire paper sheet for just a few trailing lines or metadata tables.

## 2. Header Layout (First Page Only)
- **Line 1:** Left = `{slug_name} · {content_uid}` (small, bold-ish text); Right = Channel logo (`public/logos/the-wave.svg` via `utils/channelLogo.js`, height ~8.5mm, right-aligned). If the channel has no logo SVG, show the channel name as small text in that spot instead.
- **Line 2:** Big title (`.script-print-title`, same serif font and sizing as before).
- **Line 3:** Left = Writer display name (`getPersonDisplay`, nickname if present, label "লেখক"); Right = Script saved date (`formatScriptSavedAt`, label "তারিখ", right-aligned to right margin). Preserves the thin border rule lines of the "by" row.
- **Pages 2+:** No header at all; only the body text continues flowing.
- **Removed from output:** Old masthead row, ID item from the by-line (ID is now in header line 1 and footer), and the entire Page 2 block (Details table, staff list, activity log, revisions & notes, platform list, scheduled time).

## 3. Footer (Every Page)
- **Position:** Placed in the bottom page margin via CSS `@page { @bottom-center { ... } }` margin box so it consumes zero body text space.
- **Styling:** Tiny (7pt), grey (`#666666`), sans-serif (`Inter`), centered in one line, `white-space: nowrap`.
- **Content:** Joined by `" · "`, skipping empty fields:
  `"আইডি {content_uid} · লেখক {writer display} · প্রেজেন্টার {presenter display} · প্রডিউসার {producer display} · পাতা {n}/{total}"`
  Names use member nicknames if available.
- **Dynamic CSS String Escaping:** Generated in a `<style>` block rendered inside `#script-print-root` during printing. Escapes backslashes, double quotes, control characters, and newlines.
- **Page Counters:** CSS counters with Bengali digits: `counter(page, bengali) "/" counter(pages, bengali)`.

## 4. Public Booking Page Print (`/b/<token>`)
- Shared implementation via `ScriptPrintDocument` in `mode="public"`.
- Portaled directly to `document.body` with ID `script-print-root`, ensuring the global print rule (`body > *:not(#script-print-root) { display: none !important; }`) does not cause blank prints.
- **Content:** Content ID and script body only. No header, no title, no writer, no channel logo/name, and no slug name.
- **Footer:** Reduced to `"আইডি {content_uid} · পাতা {n}/{total}"`.

## 5. Planned Next Steps
- **N143 (decided, not built):** Auto-tighten line spacing to save a page. If tightening the line spacing from `2` down to at most `1.6` (keeping font size unchanged at 11.5pt) saves a whole sheet of paper, apply it automatically; otherwise keep `2`. Measuring logic will live in a shared utility.
- **N144 (decided in principle, not designed):** Visual page-end separator in the script editor showing where each printed page breaks, so the writer can see in real-time how much fits onto one page. Uses the measuring code from N143. To be discussed with the owner before building.

## 6. Browser Compatibility
- Footer page numbers and `@bottom-center` margin boxes require **Chrome** or **Microsoft Edge**.
- In Firefox and Safari, the `@page` margin boxes are ignored and no footer is displayed (accepted limitation).
