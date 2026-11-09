# Script print decisions (9 Nov 2026)

Owner decisions regarding the script print layout and printing behavior across the application.

## 1. Core Goal
- **Paper saving:** Eliminate Page 2 completely. Content flows naturally across as many A4 pages as needed.
- Never waste an entire paper sheet for just a few trailing lines or metadata tables.

## 2. Header Layout (First Page Only)
- **Line 1:** Left = `{slug_name} · {content_uid}` (bold-ish serif text); Right = Channel logo (`public/logos/the-wave.svg` via `utils/channelLogo.js`, height ~8.5mm, right-aligned). If the channel has no logo SVG, show the channel name as small text in that spot instead.
- **Double Rule:** The top line has a `border-bottom: 3px double #111111` with `padding-bottom: 6pt` and `margin-bottom: 14pt` (part of the design, matching the classic masthead styling).
- **Logo Loading & Aspect Ratio:** The print dialog must wait for the channel logo image to be loaded and decoded before opening (`waitForPrintImages`). The `<img>` specifies `aspect-ratio: 287.82 / 77.17` and `min-width: 31.7mm` as a fallback because the SVG only defines a `viewBox` without intrinsic `width`/`height` attributes.
- **Fonts:** All header elements (`.script-print-slug-uid`, `.script-print-channel-text`, `.script-print-by`, `.script-print-by-label`, `.script-print-by-val`) use the same serif font as the script body: `'Noto Serif Bengali', Georgia, serif`.
- **Line 2:** Big title (`.script-print-title`, serif font, 22pt bold).
- **Line 3:** Left = Writer display name (`getPersonDisplay`, nickname if present, label "লেখক"); Right = Script saved date (`formatScriptSavedAt`, label "তারিখ", right-aligned to right margin). Preserves the thin border rule lines of the "by" row.
- **Pages 2+:** No header at all; only the body text continues flowing.
- **Removed from output:** Old masthead row, ID item from the by-line (ID lives in header line 1 and footer), and the entire Page 2 block (Details table, staff list, activity log, revisions & notes, platform list, scheduled time).

## 3. Footer (Every Page)
- **Position & Redesign (9 Nov 2026):** Placed in the bottom page margin via CSS `@page` margin boxes (`@bottom-left` and `@bottom-right`), leaving `@bottom-center` unused so it takes zero body text space.
- **Left (`@bottom-left`):** Content ID only, e.g. `{content_uid}` (no label, no names; omitted if content_uid is empty).
- **Right (`@bottom-right`):** Page counter, e.g. `পাতা ` counter(page, bengali) "/" counter(pages, bengali) (e.g. `পাতা ১/৩`).
- **No Names:** The earlier idea of including writer, presenter, and producer in the footer was dropped on 9 Nov to keep the footer clean, tiny, and unobtrusive.
- **Styling & Font:** 7pt, grey (`#666666`), `'Noto Serif Bengali', Georgia, serif`, vertical-align middle, `white-space: nowrap`.
- **Dynamic CSS String Escaping:** Generated in a `<style>` block rendered inside `#script-print-root` during printing. Escapes backslashes, double quotes, control characters, and newlines.

## 4. Public Booking Page Print (`/b/<token>`)
- Shared implementation via `ScriptPrintDocument` in `mode="public"`.
- Portaled directly to `document.body` with ID `script-print-root`, ensuring the global print rule (`body > *:not(#script-print-root) { display: none !important; }`) does not cause blank prints.
- Waits for images via `waitForPrintImages` before calling `window.print()`.
- **Content:** Content ID and script body only. No header, no title, no writer, no channel logo/name, and no slug name.
- **Footer:** Same redesigned footer as editorial print: left ID (`@bottom-left`), right page counter (`@bottom-right`).

## 5. Automatic Line-Spacing Fit (N143/N143b — Built 9 Nov 2026)
- **Exact Rule:** Never waste a paper sheet for a few lines. Tighten line spacing ONLY if doing so saves at least one whole printed page.
- **Range & Step:** Line-height tightens from `2.0` down to at most `1.6` in steps of `0.1` (`1.9`, `1.8`, `1.7`, `1.6`). The algorithm measures at 2.0 and 1.6; if 1.6 yields fewer pages, it tests descending steps to pick the *highest* line-height achieving that smaller page count. If no whole page can be saved, it stays at `2.0`.
- **Untouched Elements:** Font size (`11.5pt`), paragraph gap (`10pt`), and all header sizes remain strictly unchanged.
- **Usable Page Height:** A4 content height is 261mm (297mm minus 18mm top and bottom margins). To prevent fractional rounding overflow from creating an accidental trailing page, usable height is treated as 99% of 261mm (`258.39mm`).
- **Single Source of Truth:** Typography CSS variables (`--sp-font-size: 11.5pt;`, `--sp-line-height: 2;`, `--sp-para-gap: 10pt;`) and base styles are defined on `#script-print-root, .script-measure-root` in `app/layout.js`. Header styling is shared so offscreen measurement and print layout match identically.
- **Stable Print Lifecycle:** Both `ScriptPrintSheet` (editorial) and `app/b/[token]/page.js` (public booking) store row/team/booking data in `useRef` instances so live Realtime refreshes during print dialog cannot clear the `afterprint` listener or get stuck in printing state.
- **Shared API (`utils/printFit.js`):**
  - `measurePrint({ html, mode = 'full', row, team, lineHeight = 2, script })`: mounts an offscreen `.script-measure-root` at 178mm width, waits for `document.fonts.ready` and animation frames, returns `{ pages, bodyHeightMm, headerHeightMm, lastPageFill }`.
  - `pickPrintLineHeight({ html, mode = 'full', row, team, script })`: evaluates default and tightened counts and returns `{ lineHeight, pages, pagesAtDefault, tightened, lastPageFill }`.

## 6. Page-End Marker in Script Editor (N144 — Owner Decisions 9 Nov 2026)
- **Visual Marker:** A dashed "পাতা ১ শেষ" style separator line in the script editor indicating where each printed page ends.
- **Placement:** Placed strictly at the nearest gap between paragraphs (never breaks inside a paragraph).
- **Page Information Line:** A small indicator line under the editor, e.g. "ছাপলে ২ পাতা · শেষ পাতা ৩০% ভরা".
- **Last-Page Warning:** A red warning when the last page has only a few lines ("ছোট করলে কাগজ বাঁচবে").
- **Tighten Note:** Displays a note when printing will automatically tighten the line spacing to save a page.
- **Visibility:** Visible to everyone who has permission to view the script editor.
- **Implementation:** Reuses `measurePrint` from `utils/printFit.js`.

## 7. Browser Compatibility
- Footer page numbers and `@page` margin boxes (`@bottom-left`, `@bottom-right`) require **Chrome** or **Microsoft Edge**.
- In Firefox and Safari, the `@page` margin boxes are ignored and no footer is displayed (accepted limitation).
