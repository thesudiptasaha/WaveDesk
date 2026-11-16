# Photocard idea (2026-11-01)

## Update 16 Nov 2026 — Photo Card step 2 (N152)

- **New Content form**:
  - Selecting `PHOTO CARD` swaps people/script sections for template fields, source, caption, instructions for designer, and target platforms (default Facebook).
  - Choosing channel + template loads the template's ordered fields: `short` (single line), `long` (textarea), `image` (URL with "Open ↗" link), `date`. Respects `f.max_length`.
  - Slug auto-fills from the first `short` text field until manually edited; fallback: `<template name> #<number>`.
  - Breaking toggle (`is_emergency`): hides the publish time input, shows "Set when it is published", and saves the scheduled publish time as current timestamp.
  - Two buttons:
    - "Save as draft": requires only channel, template, and slug.
    - "Submit to design": validates `photoCardMissing` (channel, template, required template fields, source, publish time unless Breaking); creates Draft and immediately advances to Requested.
- **Drawer tabs**:
  - Left column: hides Title, Thumbnail text, Archive shelf ID; shows Breaking notice "Set when it is published" for emergency cards not yet published.
  - Editorial tab: read-only requester and timestamp, template line with sample link, Breaking toggle, template fields, Source (required, with open link), Caption (character counter and copy button), Instructions for designer. Editable before approval by Request Photo Cards tick holders or Managers.
  - Production tab: read-only Graphic Designer tile with "Not taken yet", Card folder input, Production notes, and workflow history (Requested, Taken, Made, Approved, Corrections, "Not approved" review skipped badge).
  - Publish tab: Publisher card, real upload time, read-only platform chips, published link row per platform, Caption, Hashtags, and Linked content (`linked_content_uid`).
  - One caption for all platforms for now (per-platform captions will require a DB column update since publishers cannot edit `card_fields`).
  - Images are links (http/https) for now.

## Update 16 Nov 2026 — decisions (replaces the earlier phase A/B plan for the first version)

- **Type & Rundown**: Type PHOTO CARD, same `contents` table and content-ID system. The main rundown later gets a switch Videos | Photo Cards | All (default Videos); emergency (breaking) cards are pinned to the top of their channel in every view and flash until Published; a Photo Cards view gives designers "my work", the waiting list and a channel filter. Channel = page.
- **Pipeline**: `Draft` → `Requested` → `Designing` → `In Review` → `Approved` (= status "Ready to Publish") → `Scheduled` (optional) → `Published`.
  - *Draft*: the writer picks channel and template and fills the template fields; "Submit to Design" is blocked until all required fields are filled; the form has two buttons, "Save as draft" and "Submit to design".
  - *Requested*: waiting list for designers.
  - *Designing*: a Graphic Designer presses "I'm taking it" (first come; a Manager can change it); their name goes to `graphic_designer`.
  - *In Review*: designer presses "Made".
  - *Approved*: approved by the requesting writer, or Manager/Owner/holders of "Approve Photo Cards"; the card's own designer cannot approve it (Managers can).
  - *Correction*: the reviewer must write a reason, the card goes back to Designing with the same designer, and corrections are counted.
  - *Emergency*: emergency cards skip the review (Made goes straight to Approved) and carry a red "Not approved" mark.
  - *Publish*: Approved shows both "Mark as Scheduled" and "Publish"; Scheduled shows one-click "Confirm Published" (same as videos). Publish permissions follow the video rule: Publisher-role tick holders and Managers; when the Publisher field is empty the person who presses Publish is filled in automatically.
- **New ticks**: Request Photo Cards (`can_request_photo_cards`), Approve Photo Cards (`can_approve_photo_cards`), Manage Photo Card Templates (`can_manage_photo_templates`). Designer = existing Graphic Designer role (`role_graphic_designer`).
- **Templates**: per channel; number, name, optional sample picture link, list of fields. Field types: short text, long text, image link, date; required or not; optional max length for text. Example templates: (Topic Text, Main News Text, Photo) and (Comment, Person, Person's Identity, Date). "Date shown on the card" is simply a date field of a template. The card stores the values under each field's stable key (`contents.card_fields`). Images are LINKS for now (http/https; an "Open" button); later, with an own server, the same field gets file upload. The slug of a card is filled automatically from the first short-text field of the template (Topic Text), which the writer can change; if the template has no short-text field the slug is `<template name> #<number>`.
- **Drawer Tabs**:
  - Left column (always visible): channel, publish time, breaking, template number, platforms, sponsors.
  - *Editorial*: holds card information (template fields), one caption, source and instructions for the designer.
  - *Production*: holds designer's name, the folder where the finished card is (files stay on the shared drive, not in the app) and designer's notes.
  - *Publish*: holds publisher, platforms, upload time, caption (shown from Editorial and changeable per platform), hashtags, link to another content (link or content ID), and platform requirements.
  - *QC & Audit* and *Credits* as before. No Post-production tab. Platforms: the same list as normal contents.
- **Tracking & Reports**: the database stamps names and times at every step (`requested_by`/`at`, designer and `designer_taken_at`, `made_at`, `approved_by`/`at`, `correction_count`, publisher, publish time, `review_skipped`); all included in the Excel export. A Photo Card report page comes later (per day/period per channel, per designer cards made and corrections, per writer requests, average time from request to publish).
- **Order of work**:
  1. Database (done 16 Nov, record `sql/2026-11-16_photocard_database.sql`).
  2. N151 ticks and the Photo Card Templates page (menu item, list, editor).
  3. N152 PHOTO CARD type in the app, new-card form, drawer tabs, steps and buttons, status names Requested/Designing/In Review in `STATUS_META`.
  4. Rundown switch, emergency pin, designer's "my work".
  5. Report page.

## Update 14 Nov 2026
The workflow is now:
- Writers submit a request (channel, template, publish time, breaking yes/no, card texts, source of the information, notes).
- Designers (role Graphic Designer) see it, make the card outside the app, then mark "made" and "published" in the app.
- Tracking wanted: who gave the text and when, who designed, when uploaded/published, which page got which cards through the day, how many cards each designer made.
- In-browser generation becomes a later optional phase.
- The type name `PHOTO CARD` is already allowed in the database (`sql/2026-11-14_uncut_photocard_groundwork.sql`).
- Discussion of steps, permissions and reports still to be held before building.

## Update 12 Nov 2026
Photo Card is now a decided content type. Full decisions recorded in `docs/notes/content-types-plan.md` (section A). Key additions since 1 Nov:
- Form fields now include: card text, caption, publish date/time (Publish Date in the form), emergency (yes/no), channel, **date shown on the card** (separate from publish date), source, linked content (another content's ID), template (dropdown per channel).
- New permission required to create/fill a Photo Card (working name: "Make Photo Cards", key `can_make_photo_cards`).
- Pipeline: `Draft` → `Ready to Publish` → `Scheduled` → `Published`. No script, shoot or editing.
- Emergency = yes: rundown row pinned to the top of its channel and flashes until Published (same as "Did it go out?" pinned rows).
- Two phases: Phase A = type, form, steps, permission, emergency behaviour (no image generation). Phase B = browser-side card generation from channel templates (after templates and font files arrive).
- The decisions below (1 Nov) still apply for phase B.

---

# Photocard idea (2026-11-01), parked: do later

Goal: writers upload text + image, a photocard is generated in the browser from an SVG/PNG template, downloaded and posted to Facebook. Nothing stored on the server except a small record.

## Decided
- New content type PHOTOCARD (DB check constraint on content_type needs a SQL change).
- Generated in the browser; the uploaded image and the finished card are NOT stored.
- Log (small DB row): content ID, who made it, when, which template.
- Templates: SVG/PNG per channel (7 channels), several designs. Each template has a designer name, shown in the card details as credit and kept in the log.
- Purpose of the corner mark: internal bookkeeping (is it original, who made it, when). Not anti-theft.

## Facts to remember
- Facebook recompresses images and strips metadata. So metadata in the file only survives in the downloaded copy. A truly invisible pixel watermark does not survive compression.
- Plan: a very faint small content-ID text (or tiny QR) in one corner so someone can read the ID and look it up; the database record is the real proof.
- Bengali text needs the designer's font file; text must auto-shrink to fit, with a warning past the limit.

## Open
- Which parts vary per template (title, body, photo, date, quote name); sizes (1:1, 4:5); who can make; whether a card goes through workflow steps; photo credit line.
- Order: after content-ID box, link-field removal, sponsors, external crew.
