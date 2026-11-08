# Production Hub - the producer / production manager dashboard (vision, 2026-10-30)

Status: DISCUSSION ONLY. Nothing built. The earlier "Production page" calendar board (ProductionCalendar) was dropped on 2026-10-29; this hub replaces it.

## What the owner wants (his words, summarised)
- One screen where the Producer / Production Manager sees, at a glance and every day, all the work of the production team: plan, and assign.
- Split by: studio timing, PCR timing, crew availability, equipment availability.
- Shoots: one content = one shoot, but cluster shoots (many contents in one session) also happen.
- From here the owner assigns TASKS to crew, and coordinates pre-production with post-production.
- Opening it must answer: which shoots are pending and when; what checklist and preparation is open before each shoot; props management; is the equipment OK; so that no deadline is missed.

## Facts about the newsroom (2026-10-30)
- Today: 1 PCR, 1 studio. A second studio will be added in a few months. The design must handle N studios, but start small.
- Outdoor work exists: reporters go live from the field, or collect footage and bring it back. A shoot can happen in Studio, with the PCR, or in the Field.
- About 20 explainer shoots a day (at any time) on the green screen. So cluster / batch sessions are the normal case, not the exception.
- Shoot types: explainer (green screen), studio live, field live, package shoot, documentary shoot, voice recording, and more.
- Today one person holds many roles at once (for example Producer + Production Manager + online switcher; or Camera + Data Wrangler + Set Designer + audio + teleprompter + lights). As new people are hired each role goes to a dedicated person. Roles are many-per-person now and will split later.

## Equipment (many kinds, many pieces of each)
Video cameras, photo cameras, vlog cameras, microphones of several kinds, lights, stands, modifiers, mobile phones, laptops, memory cards, batteries, chargers, tablets, many kinds of cables, smart board, green screen, and more.
- Idea: two kinds. (a) Single tracked items (cameras, laptops, phones, tabs, smart board): booked one by one, with a name or serial. (b) Stock items counted in numbers (cards, batteries, chargers, cables).
- Idea: kits, for example "Green screen explainer kit", booked in one click.
- Need: know whether props and equipment were COLLECTED for a shoot (a tick with who and when).

## Preparation differs per shoot type (checklist templates)
- Live: before = title, thumbnail text and design, description, tags, ticker all collected; audio checked. During = tasks while live. After = tasks after it ends. One live video produces many short products, so a "cut the shorts" follow-up belongs to the live checklist.
- Package shoot: schedule who goes outdoors and when, and tell everyone; collect footage, store it in the proper place, hand it to the video editors (the Files delivered tick and editor notification already exist).
- Studio / explainer: studio and PCR time, crew, set, props, equipment, presenter.
- Outsourced presenters must be called (call and confirmation status). If there is no makeup artist, arrange one. Assign a person to bring and take back guests.

## Decisions so far
- The PCR is booked SEPARATELY from the studio. Studio and PCR are two independent lanes.
- A shoot can cover one content or a cluster of contents, so "Shoot" is its own record holding one or more contents.
- Order = tasks system first, then this hub, then equipment tracking.
- Conflicts and availability are checked per PERSON, not per role (one person in two places at once = conflict; one person with several roles in the same shoot = fine).
- 2026-10-30: reporters can put their own field jobs on the schedule, and those go DIRECTLY onto the list. No approval from the producer is needed.

## Building blocks (proposed, not yet approved)
1. Lanes: Studio 1 (Studio 2 later), PCR 1, Field (several shoots can run in parallel; crew and equipment still conflict). Crew and Equipment views. Props list.
2. A "Shoot" record = time slot, place (Studio / PCR / Field + location text), one or more contents, called crew, equipment, props, checklist, outsourced people with call status, transport tasks.
3. Batch session for green-screen explainers: ordered list of contents, a time box per content, status per content (shot / pending).
4. Day timeline (lanes by resource) as the main view; week view second.
5. Checklist templates per shoot type; each item has an owner and a deadline relative to the shoot and is a TASK.
6. Alerts: double-booked person / studio / PCR / equipment, unassigned crew, overdue checklist item, equipment or props not collected, content at risk of missing its publish time.
7. Pipeline strip: where each content is (script, shoot, files delivered, editing, review).
8. Workload per person (hours per day) with an overload warning.
9. Role coverage view: who covers which role today (for the hand-over when dedicated people are hired).
10. Access: Producer, Production Manager, Managers, Owner full; crew see their own tasks and shoots; reporters can add their own field jobs.

## What the TASKS system must support (so the hub can sit on it)
Owner, deadline (fixed or relative to a shoot), status, link to a content or a shoot, checklist templates per shoot type, notification to the assignee, an "I collected it" tick, comments.

## Dependencies / order
- Tasks system first, then the hub, then equipment tracking.
- Already done and reused: Content ID, Production Crew roles, shoot start/end columns (DB), files-delivered rules (DB).

## Open questions
- Who may see the hub (everyone read-only, or hidden from non-production people)?
- Does a live show need the studio and the PCR at the same time (assumed yes)?
