# End-credit animated clip: decisions (2026-11-01)

Goal: from the Credits tab, one click generates a transparent animated end-credit clip the editor places over the end of the video. Same data as the printable credits (do print/PDF credits first, then this).

## Decided
- Editors use Adobe Premiere Pro. Format must be open/common, light on resources, readable by all pro software.
- Output: transparent PNG sequence in a ZIP (import in Premiere as "Image Sequence"). Made in the browser, no server. Optional single still-card PNG.
- 1920x1080 (16:9), 25 fps; downloadable in several aspect ratios (16:9 first; 9:16, 1:1, 4:5 follow).
- Look: one slideshow-style card with all credited names arranged cleanly; animation 2-4 seconds (about 50-100 frames); it starts while the video is still playing near the end. Only the credits that matter (importance and legal need), not every field.
- English names/titles for now (Bengali later; fonts needed then).
- Available when content is in Editing or later. Who can generate: the video editor, Manager, Owner.
- Template: owner supplies the visual layout.

## Open
- Which roles appear, their order, and which legal credits are mandatory.
- Template format (Figma frames per ratio + font names/files + colors is easiest for me to follow).
- If a single-file video (WebM alpha or ProRes 4444) is ever needed: server-side render, later.
