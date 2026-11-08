# External crew invite (steps 2 and 3) - decisions, 1 Nov 2026

Status: step 1 (external people records) is pushed (commit 4374195) and tested by the owner. Steps 2 and 3 are built together, automated from the start (no manual "mark confirmed" stage), so nothing is done twice. SQL is run by the owner tomorrow (2 Nov 2026), not on 1 Nov.

## Decisions
- Only external people can be invited this way (staff have logins and get in-app notifications).
- Who can invite: Owner, Manager, Producer, Production Manager (same group that can add externals).
- Message language: Bangla, editable in the form before sending. Opens the sender's own WhatsApp (wa.me link) with the text prefilled; the sender presses Send.
- Form fields: date, time, place, note.
- Each invite gets a secret link (`/b/<token>`), no login for the invitee. The page shows only that booking: content, role, date/time/place, who invited, contact. Two buttons: "can come" / "cannot".
- The answer updates the credit tile status automatically (realtime) and notifies the person who invited.
- "Cannot" -> notification to the inviter and a red mark on the tile; a new person can be assigned from there.
- Link valid until 23:59 of the booking date (Asia/Dhaka). Inviter can revoke or renew earlier.
- Inviting the same person again for the same content: old invite stays in history, a new invite with new date/time is created ("Invite again").
- Status chain on the tile: not invited -> message sent -> confirmed / declined.

## Build order
1. SQL (owner runs in Supabase): bookings table (IDs, not names, for the person), token, SECURITY DEFINER functions for the public page (read booking by token, answer by token, no service-role key), RLS for managers/producers.
2. Prompt A: Invite button + form + WhatsApp message + status badge + realtime + notification.
3. Prompt B: public `/b/<token>` page.
New tables use IDs from day one (see people-by-id-plan.md).

## After this
PersonPicker (hide Owner/Manager from dropdowns unless role ticked, search with photo cards), Post-production tab + green ticks, then the later list in roadmap.

## Decisions 8 Nov 2026
- **Answer changes:** Invitee can change the answer until the link expires (inviter is notified every time).
- **Public page visibility:** The public page shows no content name (slug/title hidden for confidentiality); only role, date/time/place, channel, the inviter's note, and the inviter's name and phone.
- **Script access & Print:** For Presenter and Voice Over Artist bookings (`presenter_name`, `voice_over_artist`), the page also displays the content's script (plain, scrollable, newest version) and a Print button. The printed view displays only the content ID (WAVECON-...) and the script. Other roles see only the note.
- **Initial status:** Status "sent" is set automatically when the link is created.
- **Token security:** The secret code is stored only as a sha256 hash and returned once at creation; it is never stored in plain text.
- **Expiry:** The link works until 23:59 Asia/Dhaka of the booking date.
- **Assignment requirement:** The person must already be credited in that role on the content before an invite can be created.
- **Status:** DB part done (`sql/2026-11-08_bookings.sql`), app part (Prompt A: Invite button/form, WhatsApp message, tile status) and public page (Prompt B: `/b/<token>`) remain.
