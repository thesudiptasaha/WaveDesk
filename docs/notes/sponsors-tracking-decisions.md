# Sponsor / advertiser tracking: decisions (2026-11-01)

Goal: know which contents carry which advertiser's ad, so shoot and edit people can add it in time. Own channels only. A sponsor is a company that pays to advertise on our channels.

## Update 15 Nov 2026
- **Who may change ads:** Owner, Managers and people with the new "Manage Sponsors" tick (`can_manage_sponsors`). Producers no longer have this right automatically (the 5 active Producers were back-filled with the tick in the database so nothing broke for them).
- **Location:** The Sponsors section moved from under the script to the drawer's LEFT column, directly under the content details (`ContentDetailsFields`). It is now visible on every tab (and sits inside the "Details" fold on mobile/small screens). Responsive compact layout with 44px touch targets below `lg`.
- **Badge glow rule:** The violet megaphone badge ("Sponsored · N") gets a soft slow violet glow animation (`sponsor-glow`) ONLY while at least one ad has status `agreed` (still to be added). If every ad is `added` or `aired`, the badge is static (same look, no animation). Under `prefers-reduced-motion: reduce`, it stays static with a ring. Matching light theme styles are supported.
- **Database record:** `sql/2026-11-14_manage_sponsors.sql`.

## Decided with the owner
- A content can carry several ads. Types are mixed:
  - spoken or on-screen mention
  - intro/outro ad clip or logo card
  - caption/description mention or link
  - extras: DOG logo (corner logo), L-shape pop-up, and similar
- Per ad we store: advertiser, type (incl. DOG / L-shape etc.), what to do (instruction), file/folder note, state (agreed / added / aired), and later contract dates.
- A separate Advertisers list (name, phone, logo). A content picks from it, so no retyping. Only Manager/Owner manage the list; inactive advertisers cannot be picked for new ads.
- Who can set ads on a content: Manager, Owner, Producer. Everyone who can see the content can see the ad info. Status changes: only those three for now (editor/publisher ticks later via a database function).
- Money amounts and contract terms: visible only to Manager and Owner (phase 2).
- Rundown badge: violet megaphone icon + first advertiser name + "+N" (no emoji).
- **Back-fill rule:** ads can be added to contents of ANY status, including Published.

## Status (2026-11-01)
- Phase 1 DONE and pushed: N128 (ba00d0c) advertisers list + tables (sql/2026-11-01_advertisers.sql); N129 (c6b0f51) Sponsors section + rundown badge.
- Phase 2 (later): contract dates, money (Manager/Owner only), notifications, editor/publisher status ticks.

## Later change requested by the owner (2026-11-01)
- Move the Sponsors section out from under the script: put it in the Editorial tab's LEFT column (Content details), below the Platforms list. Later the owner will change/rearrange the ad types himself. Do after the external crew work.
