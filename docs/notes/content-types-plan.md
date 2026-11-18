# WaveDesk — Content Type Decisions (10–12 Nov 2026)

## A. Decisions (owner, 10–12 Nov 2026)

### STORY = PACKAGE
The final name is Package. STORY is not and was never an official content type (it had a colour entry in `CONTENT_TYPE_COLORS` but was absent from `CONTENT_TYPES`).
- STORY cleanup in the app is done (bulk-create dropdown updated in N147 to use `CONTENT_TYPES`).
- The database check constraint `contents_content_type_valid` never allowed STORY, and the live query (12 Nov) found 0 rows with `content_type = 'STORY'`.
- Mention of STORY removed from `docs/schema-reference.md`.
- Unknown content types now behave as PACKAGE everywhere (sanitiser in `lib/core.js` and `typeConfig(type)` table fallback).

### New content type: "Uncut"
Footage shot by a reporter — place/time/person — brought in, graphics added, cut, branded and uploaded. The reporter's title is **Multimedia Journalist**, a new role (the **22nd**):
- New credit field on `contents` (column name: `multimedia_journalist`).
- New `role_multimedia_journalist` tick in Team & Access, following the same pattern as the other 21 role ticks in `ROLE_LIST` (lib/core.js is the single source).
- The role appears in the same kind of assignee list as the other roles (Presenter-style: `eligibleMembers` filtered by the tick).
- `bookings.role_field` has a check list of credit columns; includes `multimedia_journalist` for external invites.
- The reporter edits the piece himself, or an assigned Video Editor does.

#### Uncut, final decisions 14-15 Nov
- **Pipeline:** `Draft` → `Assign Editor` → `Editing` → `Video Review` → `Ready to Publish` → `Scheduled` → `Published` (no `Script Submitted`, no `Ready for Shoot` / `Shooting`).
- **Drawer tabs:** Script tab is hidden. The Production tab stays and is visible from `Draft` with hand-entered shoot times, camera operator, crew, notes, Files delivered/received.
- **Visible credits:** Multimedia Journalist, Camera Operator, Video Editor, Motion Graphics Designer, Graphic Designer, Colorist, Sound Recordist, Publisher (others hidden when empty).
- **Placement:** Multimedia Journalist credit sits in the Editorial card (`drawerGroup` idea).
- **Permissions:** On an Uncut the Multimedia Journalist can edit shoot times by hand, add/remove crew names and tick Files delivered. The reporter can also assign himself as Video Editor (`Draft` → `Assign Editor` and `Assign Editor` → `Editing`).
- **No "Footage note" field:** Shoot place goes into the new dedicated `shoot_location` column instead.
- **Database groundwork:** Completed live on 14 Nov 2026; record in `sql/2026-11-14_uncut_photocard_groundwork.sql`.

### shoot_location field (done in N150)
A separate text column (`shoot_location` on `contents`) for **ALL** content types (database column created via `sql/2026-11-14_uncut_photocard_groundwork.sql`).
- Shown in the Production tab Shoot card next to shoot times (N150).
- Autocomplete / suggestions from loaded contents; case-insensitive deduplication preserves earlier spelling. Searchable in rundown and parking search, included in Excel export. Dedicated archive search screen comes later.
- **Purpose:** Find raw footage in the archive by location and date.

### New content type: "Photo Card"
A short card (image with text overlay) requested by writers from a channel template, crafted by a Graphic Designer, and published to social platforms.
Full decisions updated 16 Nov 2026: see `docs/notes/photocard-notes.md` ("Update 16 Nov 2026 — decisions").

**Key highlights (16 Nov 2026):**
- **Pipeline:** `Draft` → `Requested` → `Designing` → `In Review` → `Approved` (= status "Ready to Publish") → `Scheduled` (optional) → `Published`.
- **Permissions:** Three new ticks in `team_members`: Request Photo Cards (`can_request_photo_cards`), Approve Photo Cards (`can_approve_photo_cards`), Manage Photo Card Templates (`can_manage_photo_templates`). Graphic Designer remains the existing role tick.
- **Templates:** Stored in `photo_card_templates` per channel (unique channel + number). Each template defines custom fields (short, long, image link, date) with stable keys (`contents.card_fields`).
- **Review:** Review is mandatory for all photo cards (`Draft` → `Requested` → `Designing` → `In Review` → `Approved` (= "Ready to Publish") → `Scheduled` (optional) → `Published`); there is no Breaking concept; urgency is decided by people outside the app.
- **History (12 Nov):** Earlier draft planned a simple 4-step pipeline and two phases (Phase A manual / Phase B in-browser generation); replaced on 16 Nov by the designer workflow above. Browser-side rendering remains a future optional enhancement.

### General note
Every content type's full pipeline and credit list will be revised as part of this work.

---

## B. What the code and database do today (facts found 10–12 Nov)

- **Types in the app:** `EXPLAINER`, `LIVE`, `RECORDED LIVE`, `SOT`, `PACKAGE`, `SHOW` — the array `CONTENT_TYPES` in `lib/core.js`. Colours in `CONTENT_TYPE_COLORS` (STORY has a colour entry but is not in `CONTENT_TYPES`). Descriptions in `CONTENT_TYPE_HINT`.

- **Pipeline difference per type** is controlled by `afterScript(type)` in `lib/core.js`:
  - `LIVE` → `Published` (script approval is the final step)
  - `PACKAGE` → `Assign Editor` (no shoot)
  - all others → `Ready for Shoot`
  
  **The same rule is enforced by a database trigger** (`guard_contents_update` in `sql/2026-10-22_roles_access_rename.sql`, a `CASE` on `old.content_type`). Any new pipeline therefore requires both the app code **and** the database trigger to be updated together.

- **Tab visibility per type** (`lib/core.js`, `stepProgress`):
  - Production tab lights up: not for PACKAGE or LIVE unless `shoot_finished_at` is set, or the status is past shooting.
  - Post-production tab lights up: not for LIVE.

- **Credit hiding per type** (`HIDE_BY_TYPE` in `components/ui/Drawer.js`):
  - PACKAGE hides: `camera_operator`, `teleprompter_operator`, `light_designer`, `sound_recordist`, `set_designer`, `makeup_artist`, `data_wrangler`, `production_manager` (fields remain visible if someone is already assigned).
  - LIVE hides: `video_editor`.
  - The Live group (`live_video_switcher`, `live_audio_mixer`) is shown only for LIVE or when someone is assigned in those slots.

- **Post-production trigger** (`sql/2026-11-07_post_production.sql`) also branches on `content_type is distinct from 'LIVE'` for the editing-crew auto-fill rule.

---

## C. Order of work (decided)

0. **These notes** (N146 — docs only, no code or SQL change).
1. ✅ **DONE (12 Nov): Read-only SQL query** of the live database: checked the `content_type` constraint (`contents_content_type_valid` allows only the six types), the trigger functions that use `content_type` (`guard_contents_update` and `contents_post_production_rules`), and row count per type (EXPLAINER 170, PACKAGE 49, LIVE 10, SOT 3, SHOW 1, RECORDED LIVE 1, no STORY).
2. ✅ **DONE (14 Nov, N147): Content type table in app code (`CONTENT_TYPE_CONFIG` in `lib/core.js`)** — replaced the scattered per-type conditionals (`afterScript`, `HIDE_BY_TYPE`, `stepProgress` branches, video editor checks) with a single table keyed by content type (`EXPLAINER`, `LIVE`, `RECORDED LIVE`, `SOT`, `PACKAGE`, `SHOW`). Field list: `hint`, `color` ({ bg, text, tagText }), `afterScript`, `skipsShoot`, `hasPostStage`, `usesVideoEditor`, `hiddenCredits`, `showsLiveCredits`. Derived `CONTENT_TYPES`, `CONTENT_TYPE_HINT`, and `CONTENT_TYPE_COLORS`. Helper `typeConfig(type)` falls back to `PACKAGE` for unknown types. No behaviour change. Bulk-create dropdown uses `CONTENT_TYPES` (all six types in standard order, STORY removed). Unused duplicate in `utils/constants.js` deleted.
3. ✅ **DONE (14 Nov): Database groundwork** — `sql/2026-11-14_uncut_photocard_groundwork.sql` (UNCUT and PHOTO CARD allowed; `role_multimedia_journalist`, `multimedia_journalist`, `shoot_location` columns; Uncut workflow rules) and `sql/2026-11-14_manage_sponsors.sql` (`can_manage_sponsors` tick and policies).
4. ✅ **DONE (15 Nov, N148/N148b): Manage Sponsors tick + Sponsors section in drawer left column** — `can_manage_sponsors` permission in app code, Sponsors moved to drawer left column under ContentDetailsFields with glowing badge, responsive layout and 44px touch targets.
5. ✅ **DONE (15 Nov, N149/N149b/N149b2): Uncut app side** — UNCUT type in `CONTENT_TYPE_CONFIG` (hasScript: false, afterDraft: 'Assign Editor'), 22nd role Multimedia Journalist in `ROLE_LIST`, drawer without Editorial tab opening on Production, Footage Ready action, reporter production-admin powers, self-assign as Video Editor, creation payload filtering.
6. ✅ **DONE (16 Nov, N150): shoot_location field** — free-text Location input in Production tab Shoot card for all content types with datalist suggestions, case-insensitive match, searchable, and in Excel export. Later: dedicated search screen over the archive.
7. **Photo Card workflow**:
   - ✅ **DONE (16 Nov): Database groundwork** — `sql/2026-11-16_photocard_database.sql` (3 ticks on `team_members`, `photo_card_templates` table with RLS, 16 new columns on `contents`, full rules in `guard_contents_insert`, `guard_contents_update`, `guard_team_members`, `notify_content_update`).
   - ✅ **DONE (16 Nov, N151): Three ticks & Photo Card Templates page** — `can_request_photo_cards`, `can_approve_photo_cards`, `can_manage_photo_templates`, menu item in Manage section, list view & template editor with dynamic fields.
   - ✅ **DONE (16 Nov, N152 / N152b / N152b2): Step 2 — PHOTO CARD type, request form & drawer tabs** — `PHOTO CARD` in `CONTENT_TYPE_CONFIG`, 2-button form (Save as draft / Submit to design), template fields, drawer tabs (Editorial, Production, Publish, QC, Credits), search & Excel export.
   - ✅ **DONE (17 Nov, N153 / N153b): Step 3 — pipeline step buttons & Publish dialog** — action buttons for cards (I'm taking it, Withdraw, Made send for review, Give back, Approve, Request correction with reason, Mark as Scheduled, Publish dialog with optional per-platform links, Confirm Published, Cancel Schedule); getPublishedLinks unified into lib/core.js.
   - ✅ **DONE (17 Nov, N154): Step 4 — rundown switch** — rundown switch Videos | Photo Cards | All (choice remembered per user in localStorage).
   - ✅ **DONE (17 Nov, N155 / N155b): Step 5 — Photo Card Desk page** — menu page for the photo card team (`PhotoCardDeskModal`): Waiting for a designer, My work, Waiting for my review, Ready to publish, My requests & drafts, and All cards directory; inline action buttons; "+ New Photo Card" (`initialType = 'PHOTO CARD'`); `isCardCreatedBy` audit log draft matching.
   - ✅ **DONE (18 Nov, N156): Step 6 — Removal of Breaking, Desk Ready to publish & publish check off for photo cards** — removed Breaking from app UI and code; review always required; publish check turned off for cards; added "Ready to publish" section to Photo Card Desk.
   - **Next:** N157 (Photo Card request form without date/time + open cards carried over and pinned at top of channel), N158 (real-time auto-refresh for all users, URGENT).

Each step is its own task, one at a time.
