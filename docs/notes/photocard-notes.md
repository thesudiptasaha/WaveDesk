# Photocard idea (2026-11-01)

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
