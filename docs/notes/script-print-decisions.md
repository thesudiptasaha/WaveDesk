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

## 5. Planned Next Steps
- **N143 (decided, not built):** Auto-tighten line spacing to save a page. If tightening the line spacing from `2` down to at most `1.6` (keeping font size unchanged at 11.5pt) saves a whole sheet of paper, apply it automatically; otherwise keep `2`. Measuring logic will live in a shared utility.
- **N144 (decided in principle, not designed):** Visual page-end separator in the script editor showing where each printed page breaks, so the writer can see in real-time how much fits onto one page. Uses the measuring code from N143. Requested by the owner; to be designed together before building.

## 6. Browser Compatibility
- Footer page numbers and `@page` margin boxes (`@bottom-left`, `@bottom-right`) require **Chrome** or **Microsoft Edge**.
- In Firefox and Safari, the `@page` margin boxes are ignored and no footer is displayed (accepted limitation).
