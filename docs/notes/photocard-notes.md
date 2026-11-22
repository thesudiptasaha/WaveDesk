# Photocard idea (2026-11-01)

## Real-time & Rundown Loading Rules (19 Nov 2026, N159)

- **Open cards and Published cards loading rules**:
  - `fetchRows` in `app/page.js` loads:
    1. Contents within `scheduled_publish_time` in `[from, to)`.
    2. Contents whose shorts are due in range (`overlaps('short_days', days)`).
    3. Parked/Bin items (`status = 'On Hold'`, null `scheduled_publish_time`, or missing channel/slug).
    4. Open Photo Cards (`content_type = 'PHOTO CARD'` with `status IN ('Draft','Requested','Designing','In Review','Ready to Publish','Scheduled')`) across any date, ensuring open cards carry over seamlessly.
    5. Published Photo Cards by real publish time (`went_live_at` in `[from, to)` or fallback `published_at` in `[from, to)` when `went_live_at IS NULL`).
- **`rowBelongsInView(row, rStart, rEnd)` helper in `lib/core.js`**:
  - Used during incremental realtime merges to determine whether an incoming/updated row belongs in the client's current rundown state without full reload:
    - Parked/Bin items (`On Hold`, null publish time, missing channel/slug) always belong.
    - Open Photo Cards (`isOpenCard(row)`) belong if `openCardInRange(row, rStart, rEnd)` is true.
    - Published Photo Cards belong if their real publish time (`went_live_at || published_at`) falls within `[rStart, rEnd)`.
    - Normal contents belong if their `scheduled_publish_time` or `short_days` overlap `[rStart, rEnd)`.
- **`updated_at` synchronization**:
  - `contents.updated_at` is updated automatically on every insert and update in PostgreSQL via trigger `zz_contents_touch_updated_at`.
  - Realtime state updates compare incoming `updated_at` against local `updated_at` to prevent stale overwrites, while `catchUp` queries rows modified since the last recorded server `updated_at`.

## Template tracking (19 Nov 2026)

- **The owner's workflow**:
  - A graphic designer sends a PSD file.
  - The owner renames it, restructures and organizes the layers, and then hands the organized template file to the editors.
- **The three names**:
  1. `source_package`: name of the incoming package zip/folder, e.g. `RONY_202611` (representing one designer's month package).
  2. `source_file_name`: original filename from the designer (e.g. `Template_01.psd`). This may repeat across different source packages.
  3. `current_file_name`: the owner's own unique naming system carrying channel code, channel name, card type, source package name, and card name. Must be globally unique across the whole organization (enforced by DB index `photo_card_templates_current_file_name_uq`).
- **Metadata and tracking**:
  - `designed_by`: the template graphic designer's name.
  - `archive_location`: folder or storage location where the master template file is archived.
  - `version_no` and history: database trigger `photo_card_template_track_trg` increments `version_no` whenever package/source/current file name changes, requires a `last_change_note` when any file information changes, and records a structured row into `photo_card_template_history`.
- **Permissions**:
  - Only users with the "Graphic Template Management" tick (database column `can_manage_photo_templates`, label to be renamed in N159) plus Owner/Managers can create, update, or delete templates.

## Template tracking in the app (21 Nov 2026, N160)

- **The 5 required fields**:
  - In the template editor (`PhotoTemplatesModal`), 5 required fields are tracked under Name / Sample link: Source package name (`source_package`), Source file name (`source_file_name`), Current file name (`current_file_name`), Designed by (`designed_by`), and Archive location (`archive_location` with "Open ↗" link when http/https).
- **Change note rule**:
  - Editing requires a "What changed? *" note if source package, source file name, current file name, or designed by is modified (optional when creating a new template). Archive location can be updated without a note and without a version bump.
- **Version rule and list details**:
  - Version (`v{version_no}`) bumps (+1) automatically only when package, source file, or current file name changes.
  - Templates list shows version badge, current file name, package, designer, archive location, and update timestamp. Old templates display a "Details missing" tag until filled.
- **History view**:
  - Users with template management permission can click "History" on any template row to view past actions (`Created`, `Updated`, `Deleted`), who changed it, timestamp, change note, and readable `from → to` diffs from `photo_card_template_history`.
- **Files not stored**:
  - PSD files are not stored in the database or app; file names and archive links/paths only.

## Card drawer layout (N161, 21 Nov 2026)

- **Drawer tabs for Photo Cards**:
  - The tabs for Photo Cards are strictly: **Editorial**, **Publish**, **QC & Audit**, and **Credits**.
  - The Production tab is hidden for cards; it will return in a future milestone as the **Design** tab once the in-app editor and canvas exist.
- **Where key fields live**:
  - **Published at**: in the left Details panel (shows "Set when it is published" before publishing, and real publish time once published; "Real upload time" strip removed from Publish tab).
  - **Card folder**: in the Publish tab right above "Linked content" (editable by Graphic Designer, Publisher, and Managers; has an "Open ↗" link when http/https).
  - **Caption & Hashtags**: in the Publish tab in a compact layout (3 rows caption, 2 rows hashtags) with a top-right "Copy caption + hashtags" button that copies both with a blank line separator.
  - **Credits**: in the dedicated card Credits tab with five read-only stamped rows (Requested by, Designed by, Approved by, Published by, and Template by) and a copyable credit line.
- **Drawer/tab decisions for cards**:
  - The Production tab will be hidden for cards until the in-app canvas exists.
  - When the in-app editor is added, the tab will be named "Design" featuring the canvas on top, the template name displayed prominently above it with the template designer's name beside it, console buttons below, and the layer panel on the right.
  - Designers will be allowed to modify only editable layers (text, photo slot); locked layers (such as logo, brand frame) are fixed by the template.
  - Photos will be uploaded by the designer, not linked from outside URLs.
- **The owner's folder advice**:
  - Shared drive directory structure: `Templates/<channel code>/<card type>/<current file name>` and `_Source/<package>.zip` (kept read-only).
  - Use instant filename search tools for quick lookups.
  - Use clean ASCII names (letters, digits, underscores, hyphens) to prevent cross-platform encoding issues.

## Card content ID (N162, 22 Nov 2026)

- **Dedicated prefix**: Photo Cards get their own human-readable content ID of the form `WAVECARD-YYYYMMDD_XXXX` (e.g. `WAVECARD-20261122_0001`).
- **Separate counter**: Based on the creation day in Asia/Dhaka. Uses an independent daily counter starting at 0001 across all channels under key `card:<org>` in `content_uid_counters` (separate from the video counter `WAVECON-` under key `<org>`).
- **Database enforcement**: Database trigger `assign_content_uid()` picks `WAVECARD-` for `PHOTO CARD` and `WAVECON-` for videos. The update guard `guard_contents_update` protects both `WAVECON-` and `WAVECARD-` IDs as immutable once set.
- **Demo mode**: Mirrored in demo mode via `makeContentUid(iso, n, type)`.

## Editor decisions (21-22 Nov 2026)

- **Phased plan**:
  - **E1 (Foundation & Data Model)**: Template layer schema (JSON layout of locked and editable layers), storage bucket preparation, and database plumbing.
  - **E2 (Canvas & Design Tab)**: In-app interactive canvas using Konva.js rendered on the revived "Design" tab of the card drawer.
  - **E3 (Export Engine)**: Client-side rendering and export producing ONE high-quality JPEG (sRGB, 72 PPI) embedded with full EXIF/XMP/IPTC metadata; download filename equals content ID (`<content_uid>.jpg`, e.g. `WAVECARD-20261122_0001.jpg`).
  - **E4 (Preview & 7-Day Storage Cleanup)**: Card preview in approval workflow; uploaded source photos compressed to ~2000px on the longest side and automatically deleted 7 days after card is Published or Dropped.
- **Canvas architecture & permissions**:
  - Built with Konva.
  - Master template layers (background, frames, brand logos, default text positions) are uploaded and managed exclusively by Owner/Manager and holders of the "Graphic Template Management" tick.
  - In daily work, graphic designers can only edit designated unlocked layers: editable text blocks and photo slots.
  - Typography: Noto Serif Bengali only at launch to ensure crisp, predictable typography without font-load discrepancies.
- **Export & Metadata**:
  - Output is strictly a single JPEG image, sRGB, 72 PPI, with full copyright, channel, credit, and story metadata injected into EXIF/XMP/IPTC headers.
  - Export filename matches the content ID without extraneous suffixes.
- **Honest limits**:
  - Facebook and social networks strip EXIF/IPTC metadata on upload, so embedded metadata primarily protects the downloaded archive copy.
  - Invisible digital watermarks do not reliably survive social media recompression; internal provenance is proven by the immutable database record.

## Update 19 Nov 2026 — Request form without date/time, open cards pinned & real publish time (N157)

- **Request form without date/time**:
  - The Photo Card request form (`NewContentModal`) has no date/time input field (`Publish date & time` input removed for cards; non-cards retain it).
  - `scheduled_publish_time` is set to the creation moment (`new Date().toISOString()`) for both "Save as draft" and "Submit to design".
  - The app never changes `scheduled_publish_time` of a card after creation.
  - In `components/ui/Drawer.js`, the "Scheduled publish" field for cards is displayed read-only ("Set when it is published" for open cards, or formatted stamp if Published).
  - `photoCardMissing` in `lib/core.js` no longer requires publish time.
- **Rundown rule for open cards**:
  - Open cards (`Draft`, `Requested`, `Designing`, `In Review`, `Ready to Publish`, `Scheduled`) are carried over and pinned at the top of their channel in the "Photo Cards" and "All" views on every day from the request day through today.
  - They never appear in the "Videos" view, and are not carried over into future-only date ranges.
  - Pinned open cards are sorted by creation time (`scheduled_publish_time || created_at`), and display creation time with the date flag.
  - Each pinned open card displays an `OpenTag` pill badge: "Open" (< 1 day) or "Open · Nd" (`cardOpenDays(row, nowMs)`, counting the number of full days from `created_at` with fallback `scheduled_publish_time`).
- **Effective time rule**:
  - The real publish time of a card is `went_live_at` (fallback `published_at`).
  - `cardEffectiveTime(row)`: for a Published card returns `went_live_at || published_at`; for all other statuses returns `scheduled_publish_time`.
  - Date filtering (`visible`) and time display (`rowTimeIn`) use `cardEffectiveTime(r)`.
- **Planned next tasks**:
  - N159: Templates page (new fields, note on change, version and history view, access tick label renamed "Graphic Template Management").
  - N160: Card drawer tidy (Production tab hidden for cards, no Production notes/History, Real upload time strip removed and the side panel field labelled "Published at", Card folder moved to the Publish tab, compact caption + hashtags with a "Copy caption + hashtags" button, Credits tab with Requested by / Designed by / Approved by / Published by / Template by).
  - N161: Real-time auto-refresh for all users (URGENT; owner may move it earlier).
  - Later: report page (Owner/Manager full; designers see their own row through profile My Work; Excel download), card preview for approval (kept 7 days after Published/Dropped; scheduled deletion through Storage API), in-app card editor (Konva; fonts and PNG layers uploaded by Owner/Manager; phone console; JPEG sRGB 72 PPI with full metadata; file name = content ID with -001, -002 counter).

## Rules to keep card data ready for the future in-app editor

1. **Card text only in `card_fields`**: all template-rendered text and dynamic values must reside inside `contents.card_fields`, keyed strictly by template field keys.
2. **Other metadata facts stay where they are**: `title`, `caption`, `hashtags`, `content ID` (`uid`), `channel`, `graphic_designer`, `requested_by`, `card_source`, `template_id` remain in their existing columns on the `contents` table.
3. **Time logic only through `lib/core.js` helpers**: components must strictly consume `isOpenCard`, `cardOpenDays`, `cardEffectiveTime`, and `openCardInRange`; do not implement custom time calculations in UI components.
4. **No ad-hoc columns**: do not add random ad-hoc columns to the `contents` table for card rendering or editor state.
5. **Separate editor tables**: the future in-app editor will have its own dedicated tables (`fonts`, `layers`, `designs`, `exports`) provisioned as a one-time SQL migration.

## Update 18 Nov 2026 — Removal of Breaking & Desk Ready to publish (N156)

- **Removal of Breaking / Emergency**:
  - The "Breaking" concept for Photo Cards has been cancelled completely and removed from app UI and code. Urgency is decided by people outside the app.
  - Review always stays: the Photo Card flow is strictly:
    `Draft -> Requested -> Designing -> In Review -> Ready to Publish -> (optional Scheduled) -> Published` (+ Manager-only `On Hold` / `Dropped`).
  - **Database note:** The database columns `is_emergency` and `review_skipped` still exist in the database schema (`contents` table), but the app no longer uses them (does not read them, does not send them).
  - "Did it go out?" publish check is turned off for all Photo Cards (`publishCheckState` returns `null` for all photo cards).
- **Photo Card Desk sections (final)**:
  1. **Waiting for a designer**: all open `Requested` cards across channels. Shown to Graphic Designers and Managers. Sorted oldest waiting first. Action: "I'm taking it" (`take_card`).
  2. **My work**: `Designing` cards assigned to current user (`graphic_designer === actor.full_name`). Shows red correction note when `correction_count > 0`. Actions: "Made, send for review" (`made_card`) and "Give back" (`give_back_card`).
  3. **Waiting for my review**: `In Review` cards where current user can approve (`approve_card` action is enabled; designer's own card excluded, managers see all). Actions: "Approve" (`approve_card`) and "Request correction" (`correct_card`).
  4. **Ready to publish**: open cards in `Ready to Publish` or `Scheduled`. Shown to users with publishing permission (`role_publisher` or Manager). Actions: Schedule, Publish (opens `PublishTimeModal`), Cancel Schedule.
  5. **My requests & drafts**: open cards where `requested_by === actor.full_name` or `isCardCreatedBy(row, actor.full_name)` (detects user's drafts via audit log). Action: "Submit to Design" (`submit_card`) for Draft cards.
  6. **All cards directory**: searchable, filterable card directory at the bottom with Channel dropdown, Status dropdown (default "Open cards"), and text search.
- **Planned next tasks**:
  - N157: Photo Card request form without date/time (time is set when it is published) + open cards (Requested..Scheduled) carried over and pinned at the top of their channel in the Photo Cards and All views from the request day until published; obey channel/status/search filters; grey "Open" tag.
  - N158: Real-time auto-refresh for all users (URGENT).
  - Later: report page (Owner/Manager full; designers see their own row through profile My Work; Excel download), card preview for approval (kept 7 days after Published/Dropped; scheduled deletion through Storage API), in-app card editor (Konva; fonts and PNG layers uploaded by Owner/Manager; phone console; JPEG sRGB 72 PPI with full metadata; file name = content ID with -001, -002 counter).

## Update 17 Nov 2026 — Photo Card step 5: Photo Card Desk (N155 / N155b)

- **Menu item (`canSeePhotoCardDesk`)**:
  - Accessible to Owner/Managers, or members with any of: `can_request_photo_cards`, `can_approve_photo_cards`, `role_graphic_designer`, `role_publisher`.
  - Displayed under "Manage" in the main menu for managers and eligible team members.
- **Dedicated Desk page (`PhotoCardDeskModal`)**:
  - Full-screen modal with summary count chips and "+ New Photo Card" button (opens `NewContentModal` with `initialType = 'PHOTO CARD'`).
  - Curated sections (2-column desktop grid, phone stacked; sorted oldest waiting first):
    1. **Waiting for a designer**: all open `Requested` cards across channels. Shown to Graphic Designers and Managers. Action: "I'm taking it" (`take_card`).
    2. **My work**: `Designing` cards assigned to current user (`graphic_designer === actor.full_name`). Shows red correction note when `correction_count > 0`. Actions: "Made, send for review" (`made_card`) and "Give back" (`give_back_card`).
    3. **Waiting for my review**: `In Review` cards where current user can approve (`approve_card` action is enabled; designer's own card excluded, managers see all). Actions: "Approve" (`approve_card`) and "Request correction" (`correct_card`).
    4. **Ready to publish**: cards in `Ready to Publish` or `Scheduled` (visible to publishers and managers).
    5. **My requests & drafts**: open cards where `requested_by === actor.full_name` or `isCardCreatedBy(row, actor.full_name)` (detects user's drafts via audit log). Action: "Submit to Design" (`submit_card`) for Draft cards.
- **All cards directory**:
  - Channel filter, Status filter (default "Open cards", with full status options), and text search.
  - Sorted newest first. 100 cards at a time with "Show more" button.
- **Layering & Escape**:
  - Desk at `z-[45]`. Clicking a card opens `Drawer` (`z-50`) on top while keeping Desk mounted. Dialogs and `NewContentModal` open at `z-[60]`.
  - `Escape` key closes topmost first: dialogs → Drawer → NewContentModal → Desk.
- **Audit log helper (`isCardCreatedBy`)**:
  - Checks `row.audit_log` for `{ kind: 'status', to: 'Draft', note: 'Created', actor: name }` so draft cards appear in "My requests & drafts" before `requested_by` is stamped.

## Update 17 Nov 2026 — Photo Card step 4 (N154)

- **Rundown switch**:
  - Segmented control pills in filter bar next to channel dropdown: "Videos", "Photo Cards", and "All".
  - Default view is `videos` (`!typeIsCard`), keeping standard video rundown identical to before.
  - User choice is saved in `localStorage` key `wavedesk.cardView.<actor id>` (loaded once actor is known).
  - Filters rundown rows (`visible`), Parking Zone (`parked`), and pinned rows (`pinnedRows`).
  - Bin, Excel export, KPI modals, and My Work are unaffected.

## Update 17 Nov 2026 — Photo Card step 3 (N153)

- **Step buttons by status**:
  | Status | Button ID | Label | Next Status | Tone | Allowed Users | Notes |
  | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
  | Draft | `submit_card` | Submit to Design | Requested | primary | `can_request_photo_cards` tick | Blocked if required fields/source/publish time/template missing |
  | Requested | `take_card` | I'm taking it | Designing | primary | Graphic Designer role or Manager | Stamps `graphic_designer` and `designer_taken_at` |
  | Requested | `withdraw_card` | Withdraw | Draft | ghost | Requester or Manager | Returns to Draft |
  | Designing | `made_card` | Made, send for review | In Review | primary | Assigned Graphic Designer or Manager | Regular cards; review always required; stamps `made_at` |
  | Designing | `give_back_card` | Give back | Requested | ghost | Assigned Graphic Designer or Manager | Clears designer and `designer_taken_at` |
  | In Review | `approve_card` | Approve | Ready to Publish | primary | Requester, `can_approve_photo_cards`, or Manager | Designer cannot approve own card unless Manager; stamps `approved_by/at` |
  | In Review | `correct_card` | Request correction | Designing | ghost | Requester, `can_approve_photo_cards`, or Manager | Designer cannot request correction unless Manager; requires reason; increments `correction_count` and saves `correction_note` |
  | Ready to Publish | `schedule` | Mark as Scheduled | Scheduled | primary | Publisher role or Manager | Unassigned publisher is auto-stamped on action |
  | Ready to Publish | `publish` | Publish | Published | ghost | Publisher role or Manager | Opens Publish dialog; auto-stamps publisher |
  | Scheduled | `publish` | Confirm Published | Published | primary | Publisher role or Manager | Opens Publish dialog |
  | Scheduled | `unschedule` | Cancel Schedule | Ready to Publish | ghost | Publisher role or Manager | Reverts schedule |
  | Published | `drop` | Drop | Dropped | danger | Managers only | Requires reason |
  | On Hold | `resume` | Resume | previous status / Draft | primary | Managers only | |
  | Dropped | `restore` | Restore | Published / Draft | primary | Managers only | Restores to Published if was published |
  | Any active | `hold` / `drop` | Hold / Drop | On Hold / Dropped | ghost / danger | Managers only | Requires reason |

- **Publish dialog for cards**:
  - Reuses `PublishTimeModal` with real upload time (defaulting to now or scheduled time).
  - Shows one optional link input per target platform (`row.target_platforms`, using platform labels).
  - On confirm, non-empty trimmed links are merged into existing published links (saving both `published_links` jsonb and `live_video_url` JSON string).

## Update 16 Nov 2026 — Photo Card step 2 (N152)

- **New Content form**:
  - Selecting `PHOTO CARD` swaps people/script sections for template fields, source, caption, instructions for designer, and target platforms (default Facebook).
  - Choosing channel + template loads the template's ordered fields: `short` (single line), `long` (textarea), `image` (URL with "Open ↗" link), `date`. Respects `f.max_length`.
  - Slug auto-fills from the first `short` text field until manually edited; fallback: `<template name> #<number>`.
  - Two buttons:
    - "Save as draft": requires only channel, template, and slug.
    - "Submit to design": validates `photoCardMissing` (channel, template, required template fields, source); creates Draft and immediately advances to Requested.
- **Drawer tabs**:
  - Left column: hides Title, Thumbnail text, Archive shelf ID.
  - Editorial tab: read-only requester and timestamp, template line with sample link, template fields, Source (required, with open link), Caption (character counter and copy button), Instructions for designer. Editable before approval by Request Photo Cards tick holders or Managers.
  - Production tab: read-only Graphic Designer tile with "Not taken yet", Card folder input, Production notes, and workflow history (Requested, Taken, Made, Approved, Corrections).
  - Publish tab: Publisher card, real upload time, read-only platform chips, published link row per platform, Caption, Hashtags, and Linked content (`linked_content_uid`).
  - One caption for all platforms for now (per-platform captions will require a DB column update since publishers cannot edit `card_fields`).
  - Images are links (http/https) for now.

## Update 16 Nov 2026 — decisions (replaces the earlier phase A/B plan for the first version)

- **Type & Rundown**: Type PHOTO CARD, same `contents` table and content-ID system. The main rundown has a switch Videos | Photo Cards | All (default Videos); a Photo Cards view gives designers "my work", the waiting list and a channel filter. Channel = page.
- **Pipeline**: `Draft` → `Requested` → `Designing` → `In Review` → `Approved` (= status "Ready to Publish") → `Scheduled` (optional) → `Published`.
  - *Draft*: the writer picks channel and template and fills the template fields; "Submit to Design" is blocked until all required fields are filled; the form has two buttons, "Save as draft" and "Submit to design".
  - *Requested*: waiting list for designers.
  - *Designing*: a Graphic Designer presses "I'm taking it" (first come; a Manager can change it); their name goes to `graphic_designer`.
  - *In Review*: designer presses "Made".
  - *Approved*: approved by the requesting writer, or Manager/Owner/holders of "Approve Photo Cards"; the card's own designer cannot approve it (Managers can).
  - *Correction*: the reviewer must write a reason, the card goes back to Designing with the same designer, and corrections are counted.
  - *Review always stays*: there is no Breaking / skip review concept; review is mandatory for all photo cards.
  - *Publish*: Approved shows both "Mark as Scheduled" and "Publish"; Scheduled shows one-click "Confirm Published" (same as videos). Publish permissions follow the video rule: Publisher-role tick holders and Managers; when the Publisher field is empty the person who presses Publish is filled in automatically.
- **New ticks**: Request Photo Cards (`can_request_photo_cards`), Approve Photo Cards (`can_approve_photo_cards`), Manage Photo Card Templates (`can_manage_photo_templates`). Designer = existing Graphic Designer role (`role_graphic_designer`).
- **Templates**: per channel; number, name, optional sample picture link, list of fields. Field types: short text, long text, image link, date; required or not; optional max length for text. Example templates: (Topic Text, Main News Text, Photo) and (Comment, Person, Person's Identity, Date). "Date shown on the card" is simply a date field of a template. The card stores the values under each field's stable key (`contents.card_fields`). Images are LINKS for now (http/https; an "Open" button); later, with an own server, the same field gets file upload. The slug of a card is filled automatically from the first short-text field of the template (Topic Text), which the writer can change; if the template has no short-text field the slug is `<template name> #<number>`.
- **Drawer Tabs**:
  - Left column (always visible): channel, publish time, template number, platforms, sponsors.
  - *Editorial*: holds card information (template fields), one caption, source and instructions for the designer.
  - *Production*: holds designer's name, the folder where the finished card is (files stay on the shared drive, not in the app) and designer's notes.
  - *Publish*: holds publisher, platforms, upload time, caption (shown from Editorial and changeable per platform), hashtags, link to another content (link or content ID), and platform requirements.
  - *QC & Audit* and *Credits* as before. No Post-production tab. Platforms: the same list as normal contents.
- **Tracking & Reports**: the database stamps names and times at every step (`requested_by`/`at`, designer and `designer_taken_at`, `made_at`, `approved_by`/`at`, `correction_count`, publisher, publish time); all included in the Excel export. A Photo Card report page comes later (per day/period per channel, per designer cards made and corrections, per writer requests, average time from request to publish).
- **Order of work**:
  1. Database (done 16 Nov, record `sql/2026-11-16_photocard_database.sql`).
  2. N151 ticks and the Photo Card Templates page (menu item, list, editor).
  3. N152 PHOTO CARD type in the app, new-card form, drawer tabs, steps and buttons, status names Requested/Designing/In Review in `STATUS_META`.
  4. Rundown switch, designer's "my work".
  5. Photo Card Desk page.
  6. Removal of Breaking, publish check off for photo cards.
  7. Open cards carried over and pinned in rundown.
  8. Real-time auto-refresh.

## Update 14 Nov 2026
The workflow is now:
- Writers submit a request (channel, template, publish time, card texts, source of the information, notes).
- Designers (role Graphic Designer) see it, make the card outside the app, then mark "made" and "published" in the app.
- Tracking wanted: who gave the text and when, who designed, when uploaded/published, which page got which cards through the day, how many cards each designer made.
- In-browser generation becomes a later optional phase.
- The type name `PHOTO CARD` is already allowed in the database (`sql/2026-11-14_uncut_photocard_groundwork.sql`).
- Discussion of steps, permissions and reports still to be held before building.

## Update 12 Nov 2026
Photo Card is now a decided content type. Full decisions recorded in `docs/notes/content-types-plan.md` (section A). Key additions since 1 Nov:
- Form fields include: card text, caption, publish date/time, channel, **date shown on the card** (separate from publish date), source, linked content (another content's ID), template (dropdown per channel).
- New permission required to create/fill a Photo Card (working name: "Make Photo Cards", key `can_make_photo_cards`).
- Pipeline: `Draft` → `Requested` → `Designing` → `In Review` → `Ready to Publish` → `Scheduled` → `Published`. No script, shoot or editing. Review is mandatory.
- Two phases: Phase A = type, form, steps, permission. Phase B = browser-side card generation from channel templates (after templates and font files arrive).
- The decisions below (1 Nov) still apply for phase B.

---

# Photocard idea (2026-11-01), parked: do later

Goal: writers upload text + image, a photocard is generated in the browser from an SVG/PNG template, downloaded and posted to Facebook. Nothing stored on the server except a small record.

## Decided
- New content type PHOTOCARD (DB check constraint on content_type needs a SQL change).
- Generated in the browser; the uploaded image and the finished card are NOT stored.
- Log (small DB row): content ID, who made it, when, which template.
- Templates: SVG/PNG per channel (7 channels), several designs. Each template has a designer name, shown in the card details as credit and kept in the log.
- Purpose of the corner mark: internal bookkeeping (is it original, who made it, when). Not anti-theft.

## Facts to remember
- Facebook recompresses images and strips metadata. So metadata in the file only survives in the downloaded copy. A truly invisible pixel watermark does not survive compression.
- Plan: a very faint small content-ID text (or tiny QR) in one corner so someone can read the ID and look it up; the database record is the real proof.
- Bengali text needs the designer's font file; text must auto-shrink to fit, with a warning past the limit.

## Open
- Which parts vary per template (title, body, photo, date, quote name); sizes (1:1, 4:5); who can make; whether a card goes through workflow steps; photo credit line.
- Order: after content-ID box, link-field removal, sponsors, external crew.
