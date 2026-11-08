# "Did it go out?" publish question - decisions (1 Nov 2026)

First discussed 29 Oct 2026 (see ideas-2026-10-29.md, item 6 and the "publish question" decision). Not built yet. Owner said: do it later (after the external crew invite work).

## FINAL (owner, 1 Nov 2026, 22:23): go back to the 29 Oct design. NO blocking screen.
- When the publish time has passed, the content row shows a "Did it go out?" button and the status pill flashes (red-blue) for the assigned Publisher until the question is answered.
- Answer options and the required reason: as listed in ideas-2026-10-29.md.
- Contents with an unanswered question stay pinned at the top of the rundown every day, so nothing from a previous day is lost.
- Only the assigned Publisher (contents.publisher) gets the flashing pill. Managers and the Owner do not.
- It applies to "Scheduled" and also to "Ready to Publish" contents whose publish time has passed.
- (The idea of a full blocking screen that stops the Publisher from doing anything else was discussed earlier the same evening and dropped.)

## Technical notes
- No time-based job exists today. Notifications are created only by triggers when a row changes. This feature can work purely in the app by comparing the current time with scheduled_publish_time, so pg_cron is not needed.
- Open question for the build discussion: if the Publisher is absent (sick, leave), a Manager or Owner could answer on the Publisher's behalf, recorded in the audit log.

## Decisions 7 Nov 2026 (owner) - ready to build; no SQL / prompt yet until the owner says so
- When it starts: 10 minutes after scheduled_publish_time, for status Scheduled and Ready to Publish. Before that the row is normal.
- Three answers for the Publisher (Drop and Delete stay with Managers/Owner):
  1. "Yes, it went out": time pre-filled with the scheduled time; works like the existing Publish window; content becomes Published.
  2. "No, new time": new date-time (future) + reason. The Publisher may do this WITHOUT can_reschedule_content, but only while the time has passed, only to a future time, reason required, logged. Needs a small exception in the database rule.
  3. "No, a Manager must decide": reason required. The Publisher's pill stops flashing. All Managers and Owner get one notification with the reason. The content stays pinned at the top with the label "Waiting for Manager" until a Manager decides (Publish, new time, Drop or Delete); then label and pin go away. Needs new columns (help requested at / by / note) and a database rule that clears them when status or time changes.
- Who can answer: the assigned Publisher, and also Managers/Owner (they see the same button but their pill does NOT flash; their answer is logged under their own name). If no Publisher is assigned, Managers/Owner are the only answerers.
- Everything is written to the Activity log.
- Pinned at the top of the rundown every day, whatever the publish day, until answered.
