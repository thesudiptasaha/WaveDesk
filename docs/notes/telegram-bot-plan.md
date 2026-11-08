# Telegram bot notifications (WaveBot) - plan agreed 2 Nov 2026

Status: plan only. Nothing built, no SQL, no prompts yet. Order: after the external crew invite, then decide.

## Why Telegram
- Automatic sending is free on Telegram (Bot API). On WhatsApp the automatic sending (Business API) is paid, so the external crew invite uses a free wa.me click-to-chat link and the sender presses Send.
- Only some staff use Telegram, so the in-app notification stays the base. Telegram is an optional extra for those who connect it.

## Design
1. Base = the existing notifications table. Every new notification row is forwarded to Telegram if the member linked Telegram and that category is switched on. One forwarding point, no per-event wiring.
2. Linking: profile button "Connect Telegram" opens the bot with a one-time, short-lived token (t.me/WaveBot?start=<token>); pressing Start links the Telegram user id to the team member (by id). Disconnect button too.
3. Personal messages: each member chooses categories (work assigned to me, approval needed, publish time reached, Notice, files delivered, ...) and his own quiet hours (set by himself, per person).
4. Groups: Owner and Managers only. Add the bot to a group, get a code from an app page "Telegram groups", send it in the group to link. On that page: which group receives what (for example, a channel group gets that channel's published contents and Notices), switch on/off, unlink.
5. Message content: short headline, content name, link to the app. Never script text or sensitive details (Telegram messages are not end-to-end encrypted).
6. Security: the bot token is taken by the owner from BotFather and put directly into the server's secret settings (never in code or chat). Sending runs in a Supabase Edge Function (free tier). Link codes are one-time.

## Message types chosen (owner: "as suggested")
- work assigned to me; approval needed (script, video)
- publish time reached / the "Did it go out?" question still unanswered (see publish-question-decisions.md)
- external crew answered "can come / cannot" (to the person who invited)
- content put On Hold or Dropped (to the credited people)
- script or video sent back for changes (to writer / editor)
- shoot time changed (to the crew)
- urgent Notice (to everyone), normal Notice (per preference)
- daily summary at night: what went out, what is pending. Goes to the Owner AND the Managers.

## Names and settings
- Bot name: WaveBot.
- Quiet hours are set by each member himself.

## Open points for the build discussion
- Telegram can be slow or blocked in Bangladesh at times (not verified); the app never depends on it.
- Group rate limit is small (about 20 messages a minute per group): batch or skip repetitive messages.
- New tables use IDs from day one (see people-by-id-plan.md).
