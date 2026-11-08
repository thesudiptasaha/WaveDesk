# Dock / page-bar UI idea (owner, 2 Nov 2026) - discussion, nothing built

Owner wants the app to feel like a Linux desktop dock, MacBook dock or DaVinci Resolve's page bar: pages as buttons, step by step, same experience on phone and PC.

## Decided
- Two levels, same visual language:
  1. Content drawer: step bar (Editorial, Production, Post-production, Publish, QC & Audit, Credits) stays at the TOP of the drawer. EVERY passed step shows a green tick AND a bright green glow. Current step = bright outline, future steps = dim.
  2. App-level dock: a thin, flat bar at the TOP, CENTERED (changed on 2 Nov 02:19: first it was bottom, owner moved it to the top middle because there would be too many buttons at the bottom).
- The dock replaces the header menus: Manage menu and everything else leaves the header and lives in the dock. (Owner allows this; the earlier "do not touch header and filters" rule is lifted for this task only.)
- Keep the number of buttons SMALL. Buttons depend on the person's access/role (an editor sees few, the Owner sees more). Per-user customization is a possible later step.
- Mockups later (owner: "make the design later").

## Owner's grouping idea
- One button for all REPORTS.
- One button for user access, directory and similar people things.
- Own tasks live on the HOME page, right of the rundown (see home-and-print-notes-2026-11-02.md), so a separate "My Desk" button may not be needed.

## Claude's proposal (to be confirmed)
Home (rundown + my panel) - everyone; People (Directory for all; Team & Access for Manager/Owner; External people for Producer, Production Manager, Manager, Owner); Reports - Manager/Owner; Setup (Channels, Platforms, Advertisers, backup) - Manager/Owner; Me (profile, theme, sound, Telegram, sign out). Later additions: Shoots (production hub), Notices/chat if they do not fit on Home.
Each button opens a page with sub-tabs; existing Manage-menu modals are reused step by step.

## Build notes
- Thin bar for 1366x768 laptops; on phone the same top bar; unread dot on the icon.
- Order: PersonPicker -> tabs + green ticks (make the step bar ONE component) -> glow -> dock -> home layout.
