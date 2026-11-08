# WaveDesk — Teleprompter in the menu (discussion, 8 Nov 2026; nothing built)

**Problem:** the teleprompter runs only from a content's script (Editorial tab, "Play Script"). For test scripts, audition scripts or office practice there is no way to run text without a content; a fake content would clutter the rundown.

**Decision (owner):** add "Teleprompter" to the menu. **Timing: later.**

**Proposal (approval pending):**
- Step A: menu button opens a window; paste or type text, press Play; the existing player in `components/ui/Teleprompter.js` runs it (Space, up/down, +/-, M, R, Esc). Nothing is saved, no database change; optionally remember the last text in that browser. One code prompt.
- Step B (later, only if needed): a saved list of practice scripts (named, shared by several people). New table (ID-based), SQL first, permissions and a list page.

**Open question:** who may use it: every member, or only Teleprompter Operators, Presenters, Managers and the Owner? (Asked, no answer yet.)

**Related, already in open-tasks:** clicker support (Page Down / Right Arrow = start/stop, Page Up / Left Arrow = back a few lines, B or . = black screen), rich text display in the teleprompter, better live script update.
