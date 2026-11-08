# Everything by ID (2026-11-01) — decided: names now, IDs later as a planned project

Owner's principle: EVERYTHING in the app is identified by ID, not by name: people, channels, platforms, advertisers/ads, notices, tasks. Renaming anything must never break anything. Two people may share a name. Owner's decision (2026-11-01 20:35): it is a big job, do it LATER; for now work with names.

## Today (fact)
- contents credit/crew columns (writer, presenter_name, video_editor, camera_operator, producer, publisher, ... about 22) store the person's FULL NAME as text.
- contents.channel stores the channel NAME; platforms are matched by code/name text; DB rules and triggers match people by name (crew-slot rules, notifications, cascade_member_rename, guard triggers, app isSelf checks, StaffTile lookups).
- Already ID-based: advertisers and content_ads (content_ads.advertiser_id), notifications.member_id, team_members.id.
- Two people with the same full name are mixed up today (wrong person notified, one can take the other's slot).

## Plan
1. Now (external crew step 1): keep full_name UNIQUE (case-insensitive, trimmed), staff and external together; the form says "this name already exists, add a small difference" if needed.
2. All NEW tables use IDs from day one (tasks, bookings/invites, external confirmations). No new name-based links.
3. Later project "Everything by ID": add *_id columns next to each name column (people credit columns, contents.channel, platform links), back-fill by name, switch triggers, notifications, guards and the app to IDs, keep the text name as a printed snapshot for credits and old records, then drop name matching and the unique-name rule. Small steps with SQL checks. Best placed BEFORE or together with the tasks system.
