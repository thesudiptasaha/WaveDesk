# docs/design: WaveDesk mockups (copied 8 Nov 2026)

Source files of the Claude Design canvas "WaveDesk Drawer redesign" (20 boards `*.dc.html` + `canvas.json` with titles, sizes and positions). Sample names in the boards are placeholders, not real people.

These are design-canvas sources. They need the canvas runtime (`./support.js` is referenced but not included), so opening a file directly in a browser may not render it. A Claude account can read them and, if wanted, republish them as a new Design artifact. They show intent; the built app (code) is the truth.

Status (8 Nov 2026):
- Built: drawer layouts and tabs (DrawerStaffPC, EditorialPC, ProductionPC, PublishPC, DrawerLaptop*, Drawer*5Tabs), rundown laptop rows (RundownLaptop), script paper (ScriptPaper*), A4 print (ScriptPrintA4), big content ID and Drop of published content (DrawerHeaderDrop), "Did it go out?" answer window (PublishAnswer).
- Changed: RundownTicker proposed a red overdue band plus a scrolling notification ticker. The shipped version is pinned rows at the top of each channel with a flashing pill (N135); the ticker is not built.
- Not built yet: RundownHoldDrop (no Parking zone, Hold glow, grey Dropped; Parking zone and Bin still exist), ProductionCalendar (shoot schedule idea; not listed in canvas.json order).
