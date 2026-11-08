# Rundown visibility: people see only their own work (idea from the owner, 2026-10-30; discussion only)

Request: on the Rundown, Managers, the Owner and permitted people see everything; others (video editor, camera operator, ...) see only the contents they work on.

## Answer: yes, possible, but it must be enforced in the DATABASE (RLS on contents), not only hidden in the screen
Hiding in the screen is cosmetic: anyone can read the data with the public key. So this belongs to the security session and changes the contents table policy.

## Decisions
- 2026-10-31: the main Rundown is NOT open to everybody. Only Managers, the Owner and permitted people open it. Everybody else lands on a personal dashboard ("My dashboard") and sees only their own work.
- 2026-10-31: "Open for pick-up" is APPROVED: people can see and take contents that are waiting for their role with that slot empty (for example the camera operator for Start Shoot, the editor for Assign Editor).

## Planned sections of the personal dashboard
1. Today: my shoots and my tasks (from the shared calendar and the tasks system).
2. My contents: contents where my full name is in any of the 21 credit slots (a multi-hat person sees every content where he appears in any role).
3. Open for pick-up: contents waiting for MY role with that slot empty.
4. Waiting for my approval (only for holders of can_approve_scripts / can_review_videos).
The same dashboard is the home page for outsourced users (limited to their own tasks and shoots).
A new permission is needed for "may open the full Rundown" (name to decide, for example can_view_rundown); Owner and Managers always have it.

## Still to decide
1. Who may open the full Rundown besides Owner and Managers (permission; Producer / Production Manager by role or by tick?).
2. Things that must follow the same rule: notifications (they carry titles), search, Excel export, reports, shorts, print, activity log, realtime updates. The shared calendar shows only shoot time and place (no script) so it stays open to everyone.
3. Names are stored as text (full names). Renaming is handled by a trigger today; a member id would be safer later.
4. Screens that count things (needs-action flags, stats) show smaller numbers for limited users; the production hub's conflict checks must use a separate non-sensitive shoots table, not contents.

## Trade-off
Pros: leak protection (important for political stories), less noise. Cons: people lose awareness of what others do; hand-overs are harder.

## Status
Not scheduled. To be discussed after the database security review. Likely built together with the personal dashboard / tasks home page.
