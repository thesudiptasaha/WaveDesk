# WaveDesk — Database Schema Reference (Supabase / PostgreSQL)

This document provides a single source of truth for the Supabase database schema used by WaveDesk (formerly `newsroom-ops` / `newswave-app`; the GitHub repo is now `WaveDesk`).

## Tables Overview

WaveDesk operates around 5 primary tables in Supabase (PostgreSQL):
1. `organizations` (Tenancy / B2B SaaS boundary)
2. `team_members` (User profiles, roles, and granular permissions)
3. `channels` (Broadcast / YouTube channels)
4. `contents` (Central rundown items and video pipeline states)
5. `notifications` (Realtime alert notifications for team members)
6. `notices` (Global station notice board)
7. `notice_uid_counters` (Daily atomic counters for notice UIDs)
8. `advertisers` (Commercial sponsors and advertisers)
9. `content_ads` (Sponsorship placements on contents)
10. `bookings` (External crew invites and bookings)

---

### 1. `organizations`
Primary entity representing a newsroom/media organization.
* `id` (`uuid`, PRIMARY KEY) — Unique organization ID.
* `name` (`text`) — Organization name (e.g., 'The Wave 24').
* `owner_id` (`text`) — ID of the primary organization owner.
* `created_at` (`timestamptz`) — Timestamp of creation.

---

### 2. `team_members`
Staff members belonging to an organization.
* `id` (`uuid`, PRIMARY KEY) — Internal member ID.
* `organization_id` (`uuid`, FK to `organizations.id`) — Tenant identifier.
* `auth_user_id` (`uuid`, nullable) — Linked Supabase `auth.users` ID.
* `full_name` (`text`) — Full name of the team member.
* `email` (`text`) — Login and contact email.
* `designation` (`text`) — Title (e.g., "Senior Producer", "Video Editor").
* `role` (`text`) — Role tier: `'owner'`, `'manager'`, or `'general'`.
* `active` (`boolean`, default `true`) — Active staff status.
* `avatar_url` (`text`) — Public URL to avatar image in Supabase `avatars` storage bucket.
* **Access (12 booleans, not null, default false; always true in effect for owner/manager through perm_of):**
  * `can_write_edit_scripts` - Write, edit and save scripts; submit for approval.
  * `can_approve_scripts` - Approve or send back submitted scripts.
  * `can_edit_content_details` - Title, thumbnail text, platforms, captions, hashtags, camera operator, writer.
  * `can_change_channel` - Change the channel of a content.
  * `can_reschedule_content` - Change scheduled date and publish time (in `guard_contents_update`, a member with `role_publisher` may change `scheduled_publish_time` of a content whose publisher is his own full name, besides everyone with `can_reschedule_content`).
  * `can_manage_sponsors` - Add sponsors to contents and set their type and status (added 14 Nov 2026, record: `sql/2026-11-14_manage_sponsors.sql`).
  * `can_assign_video_editor` - Assign or change the video editor.
  * `can_assign_presenter` - Change the presenter.
  * `can_review_videos` - Approve edited videos or send them back for changes.
  * `can_request_photo_cards` - Open and submit a Photo Card request, and edit details until approved (added 16 Nov 2026, record: `sql/2026-11-16_photocard_database.sql`).
  * `can_approve_photo_cards` - Approve a finished Photo Card or send it back for correction (added 16 Nov 2026, record: `sql/2026-11-16_photocard_database.sql`).
  * `can_manage_photo_templates` - Create, edit, and manage channel templates for Photo Cards (added 16 Nov 2026, record: `sql/2026-11-16_photocard_database.sql`).
* **Roles (22 booleans in DB, default false; they only decide who appears in each credit list - they are NOT permissions):** `role_concept_creator`, `role_research_script_writer`, `role_production_manager`, `role_producer`, `role_presenter`, `role_set_designer`, `role_camera_operator`, `role_teleprompter_operator`, `role_light_designer`, `role_sound_recordist`, `role_data_wrangler`, `role_makeup_artist`, `role_voice_over_artist`, `role_video_editor`, `role_motion_graphics_designer`, `role_graphic_designer`, `role_colorist`, `role_audio_mixer`, `role_publisher`, `role_live_video_switcher`, `role_live_audio_mixer`, `role_multimedia_journalist` (22nd role added in DB on 14 Nov 2026, record: `sql/2026-11-14_uncut_photocard_groundwork.sql`). Each role matches one credit column of the same name without the `role_` prefix in `contents` (for example `role_presenter` matches `presenter_name`, `role_research_script_writer` matches `writer`). Owners and Managers appear in a role's list only when they hold that role's tick. Only Owner and Managers can change these (the guard trigger blocks a member from changing their own).
* **External people added on 1 Nov 2026** (record: `sql/2026-11-01_external_members.sql`):
  * `member_type` (`text`, default `'staff'`, CHECK `member_type in ('staff','external')`) and `external_note` (`text`, nullable).
  * `email` column altered to drop NOT NULL constraint (external rows have null email).
  * Constraint `team_members_external_rules`: external rows require `auth_user_id is null`, `email is null`, `role = 'general'`, `nickname is not null`, phone in international format like +8801XXXXXXXXX (matching `^\+[1-9][0-9]{7,14}$`), and all `can_*` flags false (including `can_manage_sponsors`, `can_request_photo_cards`, `can_approve_photo_cards`, `can_manage_photo_templates`).
  * Unique index `team_members_name_unique` on `(organization_id, lower(btrim(full_name)))` prevents duplicate names across the team.
  * Function `can_manage_externals()` returns true for active Owner, Manager, or members with `role_producer` or `role_production_manager`.
  * Policy `team_members_insert_external` allows authenticated insertion of external general members if `can_manage_externals()` is true.
  * Trigger `guard_team_members` allows users where `can_manage_externals()` is true to edit external rows, ensures external members never receive a login or access permissions, and prevents changing `member_type`.
* **Four new crew roles added on 29 Oct 2026** (record: `sql/2026-10-29_new_crew_roles.sql`): Production Manager, Set Designer, Makeup Artist, Data Wrangler added. `team_members` columns `role_production_manager`, `role_set_designer`, `role_makeup_artist`, `role_data_wrangler` (boolean, default false); `contents` columns `production_manager`, `set_designer`, `makeup_artist`, `data_wrangler` (text, optional). `lib/core.js` `ROLE_LIST` is the single source for all 22 roles (role_multimedia_journalist / contents.multimedia_journalist added 14 Nov 2026, record: `sql/2026-11-14_uncut_photocard_groundwork.sql`) with `drawerGroup` (`idea`, `crew`, `post`, `publish`, `live`). `guard_team_members`, `cascade_member_rename`, and `notify_content_insert` / `notify_content_update` triggers updated to include the new columns.
* **Renamed on 22 Oct 2026** (record: `sql/2026-10-22_roles_access_rename.sql`): can_edit_script -> can_write_edit_scripts, can_approve_script -> can_approve_scripts, can_edit_metadata -> can_edit_content_details, can_reschedule -> can_reschedule_content, can_assign_editor -> can_assign_video_editor, can_change_presenter -> can_assign_presenter, can_review_video -> can_review_videos, can_write -> role_research_script_writer, can_idea -> role_concept_creator, can_produce -> role_producer, can_present -> role_presenter, can_camera -> role_camera_operator, can_light -> role_light_designer, can_sound_record -> role_sound_recordist, can_edit_video -> role_video_editor, can_vfx -> role_motion_graphics_designer, can_color -> role_colorist, can_audio_mix -> role_audio_mixer, can_video_switch -> role_live_video_switcher, can_live_audio -> role_live_audio_mixer, can_publish -> role_publisher. New: role_graphic_designer, role_voice_over_artist.
* **Teleprompter Operator added on 25 Oct 2026** (record: `sql/2026-10-25_teleprompter_operator.sql`): `role_teleprompter_operator` (boolean, default false) added to `team_members`; `teleprompter_operator` (text, optional) added to `contents`. Both `guard_team_members` and `cascade_member_rename` now include the new field.
* `created_at` (`timestamptz`)
* `employee_id`, `phone`, `whatsapp` (`text`, nullable) - Optional contact details shown in the Team Directory. `employee_id` can be changed only by the Owner and Managers (the guard trigger blocks a member from changing their own); `phone` and `whatsapp` the member can change themselves. Record: `sql/2026-10-21_team_contact_fields.sql`.
* `nickname` (`text`, nullable) - One English word (letters only, 1 to 20 characters), unique per organization ignoring case (unique index `team_members_nickname_unique`, check `team_members_nickname_one_word`). Shown in chips, dropdown labels and the header; stored values elsewhere stay the full name. Record: `sql/2026-10-22_team_nickname.sql`.

---

### 3. `channels`
Channels managed by the newsroom.
* `id` (`bigint`, PRIMARY KEY, generated always as identity)
* `organization_id` (`uuid`, FK to `organizations.id`, nullable for global defaults)
* `name` (`text`) — Channel name (e.g., 'The Wave 24', 'The Wave World', 'The Wave Money', 'The Wave Sports', 'The Wave Faith', 'The Wave Life', 'The Wave Glam').
* `created_at` (`timestamptz`)

---

### 4. `contents`
Central table holding all daily video rundown items.
* `id` (`bigint`, PRIMARY KEY, generated always as identity)
* `organization_id` (`uuid`, FK to `organizations.id`)
* `content_uid` (`text`) — Human-readable identifier (e.g., `WAVECON-20261029_0002`). Formatted as `WAVECON-YYYYMMDD_XXXX`, assigned on insert based on content creation day in Asia/Dhaka. Daily counter restarts at 0001 (`content_uid_counters: org_key, day, last_n`). IDs are never reused and immutable once set (`guard_contents_update` checks `WAVECON-` prefix). Shorts are identified as `<content ID>-short_0001` and so on, numbered inside their main content. The folder on the storage drive is named exactly the content ID (no slug), with shorts as subfolders. Converted from legacy `CON-` format on 29 Oct 2026 via `sql/2026-10-29_wavecon_content_id.sql`.
* `slug_name` (`text`) — Unique slug title (max 24 characters, normalized).
* `title` (`text`) — Full story title/headline.
* `content_type` (`text`) — One of: `'EXPLAINER'`, `'LIVE'`, `'RECORDED LIVE'`, `'SOT'`, `'PACKAGE'`, `'SHOW'`, `'UNCUT'`, `'PHOTO CARD'` (check constraint `contents_content_type_valid`, updated 14 Nov 2026 via `sql/2026-11-14_uncut_photocard_groundwork.sql`).
* `channel` (`text`) — Channel name assignment.
* `status` (`text`) — Pipeline status, strictly one of:
  * `'Draft'`
  * `'Script Submitted'`
  * `'Ready for Shoot'`
  * `'Shooting'`
  * `'Assign Editor'`
  * `'Editing'`
  * `'Video Review'`
  * `'Ready to Publish'`
  * `'Scheduled'`
  * `'Published'`
  * `'On Hold'`
  * `'Dropped'`
  * `'Re-Shoot'`
  * *(Photo Card pipeline uses: Draft, Requested, Designing, In Review, Ready to Publish [= Approved], Scheduled, Published, plus On Hold, Dropped; record: `sql/2026-11-16_photocard_database.sql`)*
* `scheduled_publish_time` (`timestamptz`, nullable) — Target publish date and time.
* `went_live_at` (`timestamptz`, nullable) — Real time the content went live (reports and Rundown Export use this; falls back to `published_at` for old rows).
* `writer` (`text`) — Assigned Research & Script author.
* `presenter_name` (`text`) — Assigned on-camera presenter.
* `multimedia_journalist` (`text`, nullable) - Assigned Multimedia Journalist (reporter who shoots uncut footage; added 14 Nov 2026 via `sql/2026-11-14_uncut_photocard_groundwork.sql`).
* `camera_operator` (`text`) - Assigned Camera Operator (was `camera_person`). Governed by contents_production_rules (sql/2026-10-29_production_rules.sql).
* `shoot_location` (`text`, nullable) - Shoot location / place of shooting for all content types, used to find raw footage in archive by location and date (added 14 Nov 2026 via `sql/2026-11-14_uncut_photocard_groundwork.sql`; shown in the Production tab Shoot card (N150), free text, up to 120 characters, searchable and included in the Excel export).
* `shoot_started_at` (`timestamptz`, nullable) - Timestamp when the shoot started. Populated automatically on Start Shoot. Editable manually only by Manager/Owner, Producer, Production Manager, or Camera Operator (also Multimedia Journalist on an UNCUT).
* `shoot_finished_at` (`timestamptz`, nullable) - Timestamp when the shoot finished. Populated automatically on Finish Shoot, cleared on Start Shoot. Editable manually only by Manager/Owner, Producer, Production Manager, or Camera Operator (also Multimedia Journalist on an UNCUT).
* `production_notes` (`text`, nullable) - On-set and shoot production notes.
* `files_delivered_at` (`timestamptz`, nullable) - Timestamp when raw footage and project files were delivered. Can be ticked once by Camera Operator, Data Wrangler, Producer, Production Manager, or Manager; notifies the assigned video editor. Undone only by Managers.
* `files_delivered_by` (`text`, nullable) - Full name of the team member who ticked Files delivered.
* `files_received_at` (`timestamptz`, nullable) - Timestamp when files were marked received by editing (set by the database rule; the app only sends the time / the note).
* `files_received_by` (`text`, nullable) - Full name of the team member who marked files received (set by the database rule; the app only sends the time / the note).
* `files_problem_at` (`timestamptz`, nullable) - Timestamp when a problem was reported with the files (set by the database rule; the app only sends the time / the note).
* `files_problem_by` (`text`, nullable) - Full name of the team member who reported the problem (set by the database rule; the app only sends the time / the note).
* `files_problem_note` (`text`, nullable) - Description of the reported problem with the files (set by the database rule; the app only sends the time / the note).
* `publish_help_at` (`timestamptz`, nullable) - Request for a Manager decision when a content did not go out; set by the database rule, cleared by the database when status or scheduled_publish_time changes.
* `publish_help_by` (`text`, nullable) - Full name of the team member who requested a Manager decision (set by the database rule).
* `publish_help_note` (`text`, nullable) - Note explaining why the content did not go out and what decision is needed (set by the database rule).
* `video_editor` (`text`) — Assigned video editor.
* `producer` (`text`) — Assigned producer.
* `concept_creator` (`text`) - Concept Creator, the story idea originator (was `idea_by`).
* Other credit columns (`text`, optional, each holds a team member's full name): `production_manager`, `set_designer`, `makeup_artist`, `data_wrangler`, `light_designer`, `sound_recordist`, `teleprompter_operator`, `voice_over_artist`, `motion_graphics_designer` (was `vfx`), `graphic_designer`, `colorist`, `audio_mixer`, `live_video_switcher` (was `video_switcher`), `live_audio_mixer` (was `live_audio`), `publisher` (was `uploader`; the person doing the publishing work; guarded by `contents_production_rules` under `sql/2026-10-31_publisher_rule.sql` so only Manager/Owner/Producer/Production Manager may change it, or role_publisher members may self-assign into an empty slot or remove themselves), `published_by` (was `publisher`; the person who actually pressed Publish, set by the Publish step and protected by `guard_contents_update` together with `published_at`). A rename of a team member updates all 22 credit columns through `cascade_member_rename`. Records: `sql/2026-10-25_teleprompter_operator.sql`, `sql/2026-10-29_new_crew_roles.sql`.
* `script` (`text`) — Script body (supports HTML tags `p, br, strong, u, mark` from TipTap rich editor).
* `thumbnail_text` (`text`) — On-screen graphic/thumbnail text.
* `platforms` (`jsonb` / array) — Target publication channels (`youtube`, `facebook`, `instagram`, `tiktok`, `web`).
* `reference_files` (`jsonb`, default `'[]'`) — Array of reference document links/metadata.
* `history` (`jsonb`, default `'[]'`) — Audit log of assignments, status transitions, and timestamps.
* `revisions` (`jsonb`) — Previous script versions.
* **Photo Card columns on `contents`** (added 16 Nov 2026, record: `sql/2026-11-16_photocard_database.sql`):
  * `template_id` (`bigint`, nullable, FK to `photo_card_templates.id` on delete restrict) — Selected photo card template.
  * `card_fields` (`jsonb`, not null, default `'{}'::jsonb`) — Field values for the card stored under each template field's stable key.
  * `is_emergency` (`boolean`, not null, default `false`) — Unused by the app (Breaking concept removed in N156; column retained in DB).
  * `card_source` (`text`, nullable) — Information source or credit for the photo card.
  * `designer_instructions` (`text`, nullable) — Special layout or design instructions for the Graphic Designer.
  * `card_folder` (`text`, nullable) — Shared drive folder path where the designer saved the finished card files.
  * `linked_content_uid` (`text`, nullable) — Content UID or link of related story/video content.
  * `requested_by` (`text`, nullable) — Full name of the writer who submitted the request (stamped by database).
  * `requested_at` (`timestamptz`, nullable) — Timestamp when the card was submitted to design.
  * `designer_taken_at` (`timestamptz`, nullable) — Timestamp when a Graphic Designer took the card ("I'm taking it").
  * `made_at` (`timestamptz`, nullable) — Timestamp when the designer marked the card "Made".
  * `approved_by` (`text`, nullable) — Full name of the reviewer who approved the card.
  * `approved_at` (`timestamptz`, nullable) — Timestamp when the card was approved.
  * `review_skipped` (`boolean`, not null, default `false`) — Unused by the app (review is always mandatory in N156; column retained in DB).
  * `correction_count` (`int`, not null, default `0`) — Number of times the card was sent back for corrections.
  * `correction_note` (`text`, nullable) — Note explaining what needs correction when sending back to Designing.
* **Trigger `contents_post_production`** (BEFORE UPDATE on `contents`, function `contents_post_production_rules`): Files received (Video Editor or Manager, only after Files delivered, once, Manager undoes), Files problem (Video Editor or Manager, note required, clears received, notifies the files-delivered person, the Producer and the Production Manager), Problem fixed (Production or Manager, notifies the Video Editor), a Manager undoing Files delivered clears received and problem, and the default fill: when a Video Editor is assigned or changed on a non-LIVE content, EMPTY `motion_graphics_designer`, `graphic_designer`, `colorist`, `audio_mixer` slots get the same name, slots holding the OLD editor's name move to the new editor, slots changed by hand in the same save are untouched. Not applied when contents are created (INSERT). Record: `sql/2026-11-07_post_production.sql`.
* **Trigger `contents_publish_check`** (BEFORE UPDATE on `contents`, function `contents_publish_check_rules`): request allowed only for the assigned Publisher or a Manager, only when status is Scheduled or Ready to Publish and 10 minutes have passed after scheduled_publish_time, note required, notifies Owner and Managers, writes an Activity-log entry, clears itself on a status or publish-time change. Record: `sql/2026-11-07_publish_check.sql`.
* `created_at` (`timestamptz`)
* `updated_at` (`timestamptz`, not null default `now()`) — Automatically touched on every insert and update via trigger `zz_contents_touch_updated_at` (function `touch_contents_updated_at()`). Trigger name starts with `zz_` so it fires last alphabetically; `script_saved_at` remains managed solely by `trg_contents_script_saved_at`. Indexed by `contents_org_updated_at_idx` on `(organization_id, updated_at)`. (Added 19 Nov 2026, record: `sql/2026-11-19_contents_updated_at.sql`).

---

### 5. `notifications`
Realtime notifications sent to team members.
* `id` (`bigint`, PRIMARY KEY, generated always as identity)
* `organization_id` (`uuid`, FK to `organizations.id`)
* `member_id` (`uuid` or `text`) — Target team member ID.
* `content_id` (`text`) — Content ID or UID triggering the alert.
* `message` (`text`) — Notification message text. Generated by `notify_content_insert` and `notify_content_update` triggers (`sql/2026-10-29_notify_connected_only.sql`). Status changes notify members credited across any of the 17 credit columns (writer, presenter, video editor, camera operator, concept creator, producer, publisher, motion graphics designer, graphic designer, voice over artist, colorist, light designer, sound recordist, teleprompter operator, audio mixer, live video switcher, live audio mixer), plus Owner/Manager for Script Submitted, Video Review and Ready to Publish, plus members with `can_approve_scripts` for Script Submitted and `can_review_videos` for Video Review (actor excluded). Assignment notices ("You were assigned as <role>") notify newly credited members on insert and update; `notify_content_update` skips the "assigned as" message for the four default-filled slots (`motion_graphics_designer`, `graphic_designer`, `colorist`, `audio_mixer`) by checking the transaction setting `nw.post_fill` (`sql/2026-11-07_post_production.sql`). Station notices (`notices` table) go to all members. Audio alert is a two-note chime with browser sound toggle (`wd-sound-enabled`), test button, and auto-resuming AudioContext.
* `read` (`boolean`, default `false`) — Read receipt flag.
* `created_at` (`timestamptz`)

---

### 6. `notices`
Global station notice board and editorial announcements.
* `id` (`uuid`, PRIMARY KEY, default `gen_random_uuid()`)
* `notice_uid` (`text`, UNIQUE) — Human-readable identifier (e.g., `NOTICE-20261012_001`), assigned via `notices_assign_uid` trigger or service fallback.
* `organization_id` (`uuid`, FK to `organizations.id` on delete cascade)
* `title` (`text`) — Announcement headline.
* `body` (`text`) — Detailed bulletin text.
* `author_id` (`uuid`, FK to `team_members.id` on delete set null)
* `author_name` (`text`) — Name of author/manager posting notice.
* `priority` (`text`, check in `'normal'`, `'urgent'`, `'info'`)
* `created_at` (`timestamptz`)
* `updated_at` (`timestamptz`)

---

### 7. `notice_uid_counters`
Daily atomic counter table behind `NOTICE-YYYYMMDD_NNN`.
* `day` (`text`, PRIMARY KEY) — Asia/Dhaka calendar date formatted as `YYYYMMDD`.
* `last_seq` (`integer`, default 0) — Last assigned sequence number for that date.

---

### 8. `advertisers`
Companies and commercial sponsors advertising across channels. Added on 1 Nov 2026 (record: `sql/2026-11-01_advertisers.sql`).
* `id` (`uuid`, PRIMARY KEY, default `gen_random_uuid()`)
* `organization_id` (`uuid`, FK to `organizations.id` on delete cascade)
* `name` (`text`, NOT NULL) — Advertiser / company name. Unique per organization ignoring case (`advertisers_org_name_uq`).
* `phone` (`text`, nullable) — Primary phone contact in international format.
* `logo_url` (`text`, nullable) — Link to company logo image.
* `note` (`text`, nullable) — Internal remarks and contract notes.
* `active` (`boolean`, default `true`, NOT NULL) — Active status; inactive advertisers cannot be chosen for new ads, while existing ads keep them.
* `created_at` (`timestamptz`, default `now()`)
* **RLS**: SELECT allowed for all active organization members (`i_am_active()`); INSERT, UPDATE, DELETE restricted to Managers and Owners (`is_manager()`).

---

### 9. `content_ads`
Advertisements and sponsorships placed on specific rundown contents. Added on 1 Nov 2026 (record: `sql/2026-11-01_advertisers.sql`).
* `id` (`uuid`, PRIMARY KEY, default `gen_random_uuid()`)
* `organization_id` (`uuid`, FK to `organizations.id` on delete cascade)
* `content_id` (`bigint`, FK to `contents.id` on delete cascade) — Linked rundown item.
* `advertiser_id` (`uuid`, FK to `advertisers.id` on delete restrict) — Linked advertiser.
* `ad_type` (`text`, NOT NULL) — Ad placement format; CHECK `ad_type in ('spoken','intro_clip','outro_clip','logo_dog','l_shape','caption','other')`.
* `instruction` (`text`, nullable) — Production and editorial guidance for the placement.
* `file_note` (`text`, nullable) — Storage or file reference notes.
* `status` (`text`, default `'agreed'`, NOT NULL) — Delivery state; CHECK `status in ('agreed','added','aired')`.
* `created_by` (`text`, nullable) — Name of actor who scheduled/created the ad.
* `created_at` (`timestamptz`, default `now()`)
* `updated_at` (`timestamptz`, default `now()`) — Maintained automatically by `content_ads_touch_trg` trigger.
* **RLS**: SELECT allowed for all active organization members; INSERT, UPDATE, DELETE allowed for Owners, Managers, and people with the `can_manage_sponsors` tick (`i_can_manage_sponsors()`). Function `i_can_manage_sponsors()` checks whether the active member is Owner/Manager or has `can_manage_sponsors` true (updated 14 Nov 2026 via `sql/2026-11-14_manage_sponsors.sql`; `i_am_producer()` is no longer used by `content_ads`).

---

### 10. `bookings`
External crew invites, bookings, and public answer links. Added on 8 Nov 2026 (record: `sql/2026-11-08_bookings.sql`).
* `id` (`uuid`, PRIMARY KEY, default `gen_random_uuid()`)
* `organization_id` (`uuid`, NOT NULL, FK to `organizations.id` on delete cascade)
* `content_id` (`bigint`, nullable, FK to `contents.id` on delete cascade)
* `member_id` (`uuid`, NOT NULL, FK to `team_members.id` on delete restrict)
* `role_field` (`text`, NOT NULL) — Role in credit fields (one of 22 roles including `multimedia_journalist`, matching `bookings_role_field_check`, updated 14 Nov 2026 via `sql/2026-11-14_uncut_photocard_groundwork.sql`).
* `starts_at` (`timestamptz`, NOT NULL) — Call time / booking start time.
* `place` (`text`, nullable, max 300 chars) — Location or studio.
* `note` (`text`, nullable, max 2000 chars) — Instructions or notes for the invitee.
* `token_hash` (`text`, NOT NULL, UNIQUE) — sha256 hash of the secret access token (the raw secret code is returned once upon creation and never stored).
* `expires_at` (`timestamptz`, NOT NULL) — Expiration timestamp (link works until 23:59 Asia/Dhaka of the booking date).
* `status` (`text`, NOT NULL, default `'sent'`) — CHECK `status in ('sent','confirmed','declined','revoked','superseded')`.
* `answered_at` (`timestamptz`, nullable) — Timestamp when the invite was answered.
* `invited_by` (`uuid`, NOT NULL, FK to `team_members.id` on delete restrict) — Member who sent the invite.
* `created_at` (`timestamptz`, NOT NULL, default `now()`)
* `updated_at` (`timestamptz`, NOT NULL, default `now()`)
* **RLS**: Signed-in organization members can only read (`SELECT using (organization_id = my_org_id())`). No direct writes from the app (only the database functions below write). Included in the `supabase_realtime` publication.
* **Database Functions:**
  * `create_booking(content_id, member_id, role_field, starts_at, place, note)` — Returns the secret code once, only for Owner/Managers/Producers/Production Managers (`can_manage_externals`) and only for an active external person who is already credited in that role on the content; older open invites of the same person+content+role become `'superseded'`.
  * `revoke_booking(booking_id)` — Revokes an open booking; only for Owner/Managers/Producers/Production Managers (`can_manage_externals`).
  * `get_booking_by_token(token)` — Public function (open to anon and authenticated); returns state (`'ok'`, `'invalid'`, `'revoked'`, `'replaced'`, `'expired'`) and, for ok, the booking details, with the script and `content_uid` only for `presenter_name` and `voice_over_artist`.
  * `answer_booking(token, 'confirmed'|'declined')` — Public function (open to anon and authenticated); can be changed until expiry; notifies the inviter.

Record: `sql/2026-11-08_bookings.sql`.

---

### 11. `photo_card_templates`
Templates used by writers to request photo cards per channel. Added on 16 Nov 2026 (record: `sql/2026-11-16_photocard_database.sql`), tracking fields & trigger added on 19 Nov 2026 (record: `sql/2026-11-19_photocard_template_tracking.sql`).
* `id` (`bigint`, PRIMARY KEY, generated by default as identity)
* `organization_id` (`uuid`, NOT NULL)
* `channel` (`text`, NOT NULL) — Channel the template belongs to.
* `number` (`int`, NOT NULL, CHECK `number > 0`) — Template number within the channel.
* `name` (`text`, NOT NULL) — Template name (e.g. Quote Card, Infographic).
* `fields` (`jsonb`, NOT NULL, default `'[]'::jsonb`, CHECK `jsonb_typeof(fields) = 'array'`) — List of template field definitions (`{ key, label, type, required, max_length }`).
* `sample_url` (`text`, nullable) — Optional link to a sample image of the template.
* `active` (`boolean`, NOT NULL, default `true`) — Inactive templates cannot be chosen for new cards.
* `created_at` (`timestamptz`, NOT NULL, default `now()`)
* `created_by` (`text`, nullable) — Full name of creator.
* `source_package` (`text`, nullable) — Source package zip/folder name (e.g. `RONY_202611`).
* `source_file_name` (`text`, nullable) — Designer's original file name (e.g. `Template_01.psd`).
* `current_file_name` (`text`, nullable) — Unique file name for the organized template in the owner's system.
* `designed_by` (`text`, nullable) — Name of the template graphic designer.
* `archive_location` (`text`, nullable) — Storage or folder path where master files are archived.
* `version_no` (`int`, NOT NULL, default `1`) — Template version, bumped automatically when file names change.
* `updated_by` (`text`, nullable) — Actor who last updated the template.
* `updated_at` (`timestamptz`, nullable) — Timestamp of last update.
* `last_change_note` (`text`, nullable) — Note explaining what changed in template file information (logged to history then cleared).
* **Unique constraint**: `unique (organization_id, channel, number)` (`photo_card_templates_organization_id_channel_number_key`).
* **Unique index**: `unique (organization_id, lower(btrim(current_file_name)))` (`photo_card_templates_current_file_name_uq`) where `current_file_name is not null and btrim(current_file_name) <> ''`.
* **Trigger `photo_card_template_track_trg`** (BEFORE INSERT OR UPDATE OR DELETE, function `photo_card_template_track()`): stamps who/when, bumps version on file name changes, requires a note when file information changes, and writes change record into `photo_card_template_history`.
* **RLS**: SELECT allowed for all active organization members (`organization_id = my_org_id() and i_am_active()`); INSERT, UPDATE, DELETE allowed for Owners, Managers, and members with the `can_manage_photo_templates` tick via `i_can_manage_photo_templates()`.

---

### 12. `photo_card_template_history`
History and audit log for photo card template modifications. Added on 19 Nov 2026 (record: `sql/2026-11-19_photocard_template_tracking.sql`).
* `id` (`bigint`, PRIMARY KEY, generated by default as identity)
* `organization_id` (`uuid`, NOT NULL)
* `template_id` (`bigint`, NOT NULL) — ID of the template that was created, updated, or deleted.
* `action` (`text`, NOT NULL, CHECK `action in ('created', 'updated', 'deleted')`)
* `version_no` (`int`, nullable) — Version of the template at the time of change.
* `changed_by` (`text`, nullable) — Full name of the user who made the change.
* `changed_at` (`timestamptz`, NOT NULL, default `now()`) — Timestamp of change.
* `note` (`text`, nullable) — Note explaining what changed.
* `template_channel` (`text`, nullable) — Channel name at the time of change.
* `template_number` (`int`, nullable) — Template number at the time of change.
* `template_name` (`text`, nullable) — Template name at the time of change.
* `changes` (`jsonb`, NOT NULL, default `'{}'::jsonb`) — Structured JSON diff of modified attributes.
* **Index**: `(organization_id, template_id, changed_at desc)` (`photo_card_template_history_tpl_idx`).
* **RLS**: SELECT allowed only for users with template management access (`organization_id = my_org_id() and i_can_manage_photo_templates()`). INSERT/UPDATE/DELETE revoked from all roles (written only by SECURITY DEFINER trigger).

---

## Storage Buckets
* `avatars` (Public bucket) — Stores user profile photos.
* `documents` (Public bucket, reference files & briefs) — Configured via `sql/2026-10-11_storage_documents_rls.sql` with authenticated insert/update/delete and public select for browser previews.

---

### 13. Realtime Publication (`supabase_realtime`)
The following public tables are published in the Supabase Realtime publication (`supabase_realtime`):
* `contents`
* `team_members`
* `notifications`
* `notices`
* `bookings`
* `content_ads` (added 19 Nov 2026, record: `sql/2026-11-19_realtime_content_ads.sql`)
