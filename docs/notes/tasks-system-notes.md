# Tasks system - discussion notes (started 2026-10-30)

Status: DISCUSSION ONLY. Nothing built. This comes BEFORE the Production Hub (see production-hub-vision.md and production-hub-architecture.md), because the hub's checklists and assignments are tasks.

## Decisions
- 2026-10-30: every person sees only THEIR OWN tasks. Managers, Owner, Producers and Production Managers also see everyone's tasks.
- 2026-10-30: the manager side is a control centre. The complicated "journey / flow chart" view was rejected as too hard to read. Keep it simple.
- 2026-10-30: ONE shared common calendar used by everybody, from the camera operator to the producer.
- 2026-10-30: three kinds of task lists: each person's own task list; a separate team task list; and a way to see everything together in one table when wanted.
- 2026-10-30: outsourced users also get a home page where they see their own tasks (this moves "outsourced-crew login" from "later" into the tasks/hub plan).
- 2026-10-30: TEAM TASK = a task given to a group (for example the camera team or the editing team). Anyone in the group can take it ("I took it"); once taken it moves into that person's own list.
- 2026-10-30: a task can also be assigned to MORE THAN ONE person when needed.
- 2026-10-30: when a task has several people, the creator chooses "everyone must finish" (default) or "one person finishing is enough". In "everyone" mode each person ticks his own part and the task is Done when all have ticked.
- 2026-10-30: the shared calendar shows shoots, live events and field trips for everybody, plus each person's OWN task deadlines (own highlighted; managers can filter to see others). Content PUBLISH times stay in the Rundown and are NOT on the calendar.
- 2026-10-30: FRIDAY = production and editing are closed, but contents are still PUBLISHED on Friday (prepared in advance). Automatic deadlines skip Friday for production work (example: something that publishes Friday morning must finish editing on Thursday).
- 2026-10-30: other holidays (Eid, government holidays) are added to the calendar by a Manager.
- 2026-10-30: standard lead times for an explainer: editing + approval together 3 hours (approval takes 1 hour and sits INSIDE the 3 hours); file transfer 10 minutes per explainer. So: shoot must be finished at least about 3 h 10 min before the publish time (on working days). These numbers must be editable by a Manager, not hard-coded.

## Proposed (not yet approved)
- "My Tasks" for every person, due soon first, works on phone.
- A task can be linked to a content, to a shoot, or to nothing.
- Who can give tasks: Producer, Production Manager, Manager, Owner to anyone; everybody else only to themselves (reporters included, for their own field work).
- Status: Open -> In progress -> Done (maybe Blocked). The giver is notified when it is Done. The assignee is notified when assigned.
- Needs to support (for the hub): fixed or relative deadlines, checklist templates per shoot type, "I collected it" tick, comments.
- Deadlines: the system PROPOSES them automatically, counting backwards from the content's publish time using the standard lead times; checklist items use "N days/hours before the shoot". The producer can always override. If a plan cannot fit before the publish time, show a warning.
- Working calendar: weekly closed day (Friday) for production, holidays set by a Manager (per-person leave later). Automatic deadlines count only open time.

## Security notes for outsourced users
- An outsourced user must see ONLY his own tasks and the shoots he is called to, never contents, scripts or other people's tasks. This needs strict database rules (RLS) and a separate limited account type. Discuss in the security session before building.

## Open questions
- Lead times for shorts and for live content (different numbers?). Explainer numbers are set.
