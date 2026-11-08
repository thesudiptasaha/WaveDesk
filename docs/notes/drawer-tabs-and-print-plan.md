# Drawer tabs, name picker, printing (2026-11-01, updated 2026-11-02) — decided

## Name picker (do first)
- Remove Owner and Manager from all staff dropdowns unless they hold that role's tick in Team. Already-assigned names stay visible.
- New shared PersonPicker: search by nickname or full name, rows with round photo + full name (+ nickname/designation), "(External)" label for outside crew, a "clear" option at the top of the list, mobile bottom sheet. Owner/Manager filtering is built inside it (do once). Owner approved this on 2 Nov.

## Tabs (6): Editorial, Production, Post-production (new), Publish, QC & Audit, Credits
- Production tab: shoot crew + shoot times + the Files delivered button (delivering is PRODUCTION's job; it stays here, decided 2 Nov). Voice Over Artist belongs to the PRODUCTION crew (owner, 2 Nov), so it is NOT part of the post-production default fill.
- Post-production tab: shows the delivery status (who, when), with two actions for the editing side:
  - "Received": who can press = the assigned Video Editor and Manager/Owner. Visible to everyone.
  - "Problem": a reason is required; notifies the person who ticked Files delivered, plus the Producer and Production Manager. When Production fixes it and presses Files delivered again, the problem mark clears.
  - Editing crew: video editor, motion graphics designer, graphic designer, colorist, audio mixer (check ROLE_LIST drawerGroup at build time: voice_over_artist must move to the production group if it is not there already).
  - End-credit clip / info download comes later (see end-credit-clip-decisions.md).
- Default fill of the post-production crew (decided 2 Nov):
  - Most contents have ONE person doing all post work. When a Video Editor is assigned (or puts his own name), every EMPTY post-production crew slot gets the same name by default.
  - Only empty slots are filled; names already there are never overwritten.
  - If the Video Editor is changed later, slots that still hold the OLD editor's name move to the new editor; slots set by hand to someone else stay.
  - Everything can be changed by hand afterwards.
  - Role ticks are not checked for the default fill (the person is assumed to do the job).
  - Only ONE notification goes to the editor ("assigned as Video Editor"), not one per slot.
  - NO default for Publisher (owner dropped it on 2 Nov), so no switch is needed either.
  - Best done as a database-side rule (single place, works from every entry path); needs SQL when built.
- Credits tab: printable credits for legal use.
- Green tick before a tab name, visual only, automatic from status: Editorial = script approved / entered production; Production = shoot finished; Post-production = Ready to Publish; Publish = Published. No tick on QC & Audit or Credits. Nobody ticks by hand. On Hold / Dropped: ticks of steps that were really completed stay, no new tick appears. Re-Shoot removes the Production tick.

## Printing
- Script print = script text only. Only the essential credits, small, at the end.
- The printed paper carries ONLY the few core names that hold the content's rights, ownership or intellectual identity - the names that keep everyone legally and financially secure and accurate in the future. Which roles count as "core" is to be settled in the print discussion.
- One name can be shown under several credits (merge a person who has many credits into one line instead of printing the name many times).
- Full credits / metadata: download from Credits (printable) or Post-production (credit clip/info).

## Order
Done AFTER: content-ID box, sponsors phase 1, external crew step 1. Name picker first, then tabs + ticks (tabs reshape the drawer). See work-order-2026-11-02.md. No prompt or SQL until the owner says so.

## Update 7 Nov 2026 (N132 pushed: commit 8d6b5a0)
Done: StepBar component, 6 tabs, automatic green glow (stepProgress in lib/core.js), Post-production tab shell (Editing crew + read-only "Files from Production"). Tested by owner: OK.

Decided for the next step (Post-production buttons + default fill), owner answers 7 Nov:
- "Received" is only a mark (who + when). It does NOT change the content status; the editor changes status himself as before.
- "Received / Problem" buttons appear only AFTER Production has ticked Files delivered. Before that the tab shows "Not delivered yet".
- Default fill of the editing crew does NOT apply to LIVE contents.
- Owner: the LIVE pipeline will become different later, so the LIVE rules here (no editing, no post-production glow) will change then.
Still no SQL/prompt until the owner says so.
