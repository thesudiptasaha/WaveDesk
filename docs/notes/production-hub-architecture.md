# Production Hub / Tasks - build principle: grow without rewriting (2026-10-30)

Owner's requirement: develop the Production page (and the tasks under it) in a way that NEW FEATURES CAN BE ADDED LATER without redoing earlier work.

## Principle: configuration lives in data, not in code
Things that will change or grow must be rows a Manager can edit, never hard-coded:
- Places / lanes: Studio 1, Studio 2 (later), PCR, Field. Adding a studio = adding a row.
- Shoot types and their checklist templates (explainer, studio live, field live, package, documentary, voice record, ...). New type = new template.
- Standard lead times (editing + approval 3 h, file transfer 10 min, ...), per content type.
- Working calendar: weekly closed day (Friday for production), holidays.
- Roles and crew groups (see the pending "editable labels / dynamic roles" discussion).
- Equipment kinds, single items vs counted stock, kits (later phase).

## Principle: small separate building blocks
Each block has one job and talks to the others through simple links (a task points to a content or a shoot; a shoot points to contents):
1. Tasks (own list, team list, all-in-one table, notifications).
2. Shared calendar.
3. Shoots (place, time, contents, crew).
4. Checklist templates (create tasks for a shoot with relative deadlines).
5. Working calendar and deadline calculator.
6. Alerts (conflicts, overdue, unassigned).
7. Equipment (later), props, outsourced people and call status (later).
Later features plug in as new blocks or new template rows.

## Principle: security by the database
Every new table gets its own strict row rules (RLS) from the first day, written down in sql/ files. Outsourced users get a limited account type that sees only their own tasks and shoots.

## Build order (agreed direction)
Tasks first -> shared calendar and shoots -> checklist templates and automatic deadlines -> alerts -> equipment tracking.
