# Sponsor / advertiser tracking: decisions (2026-11-01)

Goal: know which contents carry which advertiser's ad, so shoot and edit people can add it in time. Own channels only. A sponsor is a company that pays to advertise on our channels.

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
