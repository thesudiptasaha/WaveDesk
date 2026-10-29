# WaveDesk — Database Schema Reference (Supabase / PostgreSQL)

This document provides a single source of truth for the Supabase database schema used by WaveDesk (formerly `newsroom-ops` / `newswave-app`; the GitHub repo is now `WaveDesk`).

## Tables Overview

WaveDesk operates around 5 primary tables in Supabase (PostgreSQL):
1. `organizations` (Tenancy / B2B SaaS boundary)
2. `team_members` (User profiles, roles, and granular permissions)
3. `channels` (Broadcast / YouTube channels)
4. `contents` (Central rundown items and video pipeline states)
5. `notifications` (Realtime alert notifications for team members)

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
* **Access (8 booleans, not null, default false; always true in effect for owner/manager through perm_of):**
  * `can_write_edit_scripts` - Write, edit and save scripts; submit for approval.
  * `can_approve_scripts` - Approve or send back submitted scripts.
  * `can_edit_content_details` - Title, thumbnail text, platforms, captions, hashtags, camera operator, writer.
  * `can_change_channel` - Change the channel of a content.
  * `can_reschedule_content` - Change scheduled date and publish time.
  * `can_assign_video_editor` - Assign or change the video editor.
  * `can_assign_presenter` - Change the presenter.
  * `can_review_videos` - Approve edited videos or send them back for changes.
* **Roles (21 booleans, default false; they only decide who appears in each credit list - they are NOT permissions):** `role_concept_creator`, `role_research_script_writer`, `role_production_manager`, `role_producer`, `role_presenter`, `role_set_designer`, `role_camera_operator`, `role_teleprompter_operator`, `role_light_designer`, `role_sound_recordist`, `role_data_wrangler`, `role_makeup_artist`, `role_voice_over_artist`, `role_video_editor`, `role_motion_graphics_designer`, `role_graphic_designer`, `role_colorist`, `role_audio_mixer`, `role_publisher`, `role_live_video_switcher`, `role_live_audio_mixer`. Each role matches one credit column of the same name without the `role_` prefix in `contents` (for example `role_presenter` matches `presenter_name`, `role_research_script_writer` matches `writer`). Owners and Managers appear in every list. Only Owner and Managers can change these (the guard trigger blocks a member from changing their own).
* **Four new crew roles added on 29 Oct 2026** (record: `sql/2026-10-29_new_crew_roles.sql`): Production Manager, Set Designer, Makeup Artist, Data Wrangler added. `team_members` columns `role_production_manager`, `role_set_designer`, `role_makeup_artist`, `role_data_wrangler` (boolean, default false); `contents` columns `production_manager`, `set_designer`, `makeup_artist`, `data_wrangler` (text, optional). `lib/core.js` `ROLE_LIST` is the single source for all 21 roles with `drawerGroup` (`idea`, `crew`, `post`, `publish`, `live`). `guard_team_members`, `cascade_member_rename`, and `notify_content_insert` / `notify_content_update` triggers updated to include the new columns.
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
* `content_type` (`text`) — One of: `'EXPLAINER'`, `'LIVE'`, `'RECORDED LIVE'`, `'SOT'`, `'PACKAGE'`, `'SHOW'`, `'STORY'`.
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
* `scheduled_publish_time` (`timestamptz`, nullable) — Target publish date and time.
* `went_live_at` (`timestamptz`, nullable) — Real time the content went live (reports and Rundown Export use this; falls back to `published_at` for old rows).
* `writer` (`text`) — Assigned Research & Script author.
* `presenter_name` (`text`) — Assigned on-camera presenter.
* `camera_operator` (`text`) - Assigned Camera Operator (was `camera_person`).
* `video_editor` (`text`) — Assigned video editor.
* `producer` (`text`) — Assigned producer.
* `concept_creator` (`text`) - Concept Creator, the story idea originator (was `idea_by`).
* Other credit columns (`text`, optional, each holds a team member's full name): `production_manager`, `set_designer`, `makeup_artist`, `data_wrangler`, `light_designer`, `sound_recordist`, `teleprompter_operator`, `voice_over_artist`, `motion_graphics_designer` (was `vfx`), `graphic_designer`, `colorist`, `audio_mixer`, `live_video_switcher` (was `video_switcher`), `live_audio_mixer` (was `live_audio`), `publisher` (was `uploader`; the person doing the publishing work), `published_by` (was `publisher`; the person who actually pressed Publish, set by the Publish step and protected by `guard_contents_update` together with `published_at`). A rename of a team member updates all 22 credit columns through `cascade_member_rename`. Records: `sql/2026-10-25_teleprompter_operator.sql`, `sql/2026-10-29_new_crew_roles.sql`.
* `script` (`text`) — Script body (supports HTML tags `p, br, strong, u, mark` from TipTap rich editor).
* `thumbnail_text` (`text`) — On-screen graphic/thumbnail text.
* `platforms` (`jsonb` / array) — Target publication channels (`youtube`, `facebook`, `instagram`, `tiktok`, `web`).
* `reference_files` (`jsonb`, default `'[]'`) — Array of reference document links/metadata.
* `history` (`jsonb`, default `'[]'`) — Audit log of assignments, status transitions, and timestamps.
* `revisions` (`jsonb`) — Previous script versions.
* `created_at` (`timestamptz`)
* `updated_at` (`timestamptz`)

---

### 5. `notifications`
Realtime notifications sent to team members.
* `id` (`bigint`, PRIMARY KEY, generated always as identity)
* `organization_id` (`uuid`, FK to `organizations.id`)
* `member_id` (`uuid` or `text`) — Target team member ID.
* `content_id` (`text`) — Content ID or UID triggering the alert.
* `message` (`text`) — Notification message text. Generated by `notify_content_insert` and `notify_content_update` triggers (`sql/2026-10-29_notify_connected_only.sql`). Status changes notify members credited across any of the 17 credit columns (writer, presenter, video editor, camera operator, concept creator, producer, publisher, motion graphics designer, graphic designer, voice over artist, colorist, light designer, sound recordist, teleprompter operator, audio mixer, live video switcher, live audio mixer), plus Owner/Manager for Script Submitted, Video Review and Ready to Publish, plus members with `can_approve_scripts` for Script Submitted and `can_review_videos` for Video Review (actor excluded). Assignment notices ("You were assigned as <role>") notify newly credited members on insert and update. Station notices (`notices` table) go to all members. Audio alert is a two-note chime with browser sound toggle (`wd-sound-enabled`), test button, and auto-resuming AudioContext.
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

## Storage Buckets
* `avatars` (Public bucket) — Stores user profile photos.
* `documents` (Public bucket, reference files & briefs) — Configured via `sql/2026-10-11_storage_documents_rls.sql` with authenticated insert/update/delete and public select for browser previews.
