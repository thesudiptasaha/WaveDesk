# WaveDesk — Content Type Decisions (10–12 Nov 2026)

## A. Decisions (owner, 10–12 Nov 2026)

### STORY = PACKAGE
The final name is Package. STORY is not and was never an official content type (it has a colour entry in `CONTENT_TYPE_COLORS` but is absent from `CONTENT_TYPES`). Plan:
- Remove STORY from the bulk-create dropdown (`components/ui/Modals.js`) if it appears there.
- Remove any mention of STORY from `docs/schema-reference.md`.
- Run a read-only query on the live database to count rows where `content_type = 'STORY'`, then convert them to PACKAGE.
- Note: `lib/core.js` `sanitizeRow` already treats any `content_type` not in `CONTENT_TYPES` as PACKAGE (the fallback default), so STORY rows already behave as PACKAGE in the app today.

### New content type: "Uncut"
Footage shot by a reporter — place/time/person — brought in, graphics added, cut, branded and uploaded. The reporter's title is **Multimedia Journalist**, a new role (the **22nd**):
- New credit field on `contents` (column name to be decided when the SQL is written).
- New `role_multimedia_journalist` tick in Team & Access, following the same pattern as the other 21 role ticks in `ROLE_LIST` (lib/core.js is the single source).
- The role appears in the same kind of assignee list as the other roles (Presenter-style: `eligibleMembers` filtered by the tick).
- `bookings.role_field` has a check list of credit columns; this column must be added when external invites for a Multimedia Journalist are wanted.
- The reporter edits the piece himself, or an assigned Video Editor does.

**Pipeline:**
`Draft` (desk fills what / where / when / who) → `Footage received` → `Assign Editor` → `Editing` → `Video Review` → `Ready to Publish` → `Scheduled` → `Published`

No `Script Submitted`, `Ready for Shoot`, or `Shooting`. Script tab hidden in the drawer.

**Still to confirm with the owner:** a small notes field for place / time / person (working name: "Scene notes").

### New content type: "Photo Card"
A short card (image with text overlay) created in the browser from a channel template and posted to social platforms.

**Form fields:**
- Card text (the main overlay copy)
- Caption (for the post body)
- Publish date and time ("Publish Date" in the submission form)
- Emergency (yes / no): must be uploaded right now
- Channel
- **Date shown on the card** — a separate field from the publish date
- Source
- Linked content (another content's ID, optional)
- Template (dropdown of that channel's available templates)

**Permission:** Only people with a new permission (working name: "Make Photo Cards", key `can_make_photo_cards`) can create or fill a Photo Card.

**Pipeline:** `Draft` → `Ready to Publish` → `Scheduled` → `Published`. No script, no shoot, no editing.

**Emergency behaviour:** When emergency = yes, the rundown row is pinned to the top of its channel and flashes until it reaches Published — the same behaviour as the "Did it go out?" pinned rows.

**Two phases:**
- **Phase A:** type, form, pipeline steps, permission, emergency pinning. No image generation yet.
- **Phase B:** card generated in the browser from the channel's SVG/PNG template (needs the designer's template files and font files). The 1 Nov decisions in `docs/notes/photocard-notes.md` still apply: the uploaded image and the finished card are not stored on the server; a small log row only (content ID, who, when, which template); each template carries a designer credit; a faint content-ID mark in one corner.

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
1. **Read-only SQL query** of the live database: check the `content_type` constraint, the trigger functions that use `content_type` (especially `guard_contents_update` and `contents_post_production_rules`), and the row count per type. The owner runs the query and pastes the result.
2. **Content type table in app code** — replace the scattered per-type conditionals (`afterScript`, `HIDE_BY_TYPE`, `stepProgress` branches) with a single data structure per type (pipeline steps, whether a script is needed, which credits are shown, colour, hint). **No behaviour change.** This makes adding new types mechanical.
3. **Uncut + Multimedia Journalist role + database changes** (SQL for the new column, role tick, pipeline guard).
4. **Photo Card phase A** (type, form, steps, permission, emergency behaviour).
5. **Photo Card phase B** (browser-side card generation) — when the designer's templates and font files arrive.

Each step is its own task, one at a time.
