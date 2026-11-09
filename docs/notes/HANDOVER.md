# HANDOVER: continue WaveDesk with a new Claude account (written 8 Nov 2026)

Purpose: the owner can open any new Claude account/chat right after a push and continue immediately. Everything a new Claude needs is in this public repo (code, `docs/`, `docs/notes/`, `docs/design/`). Two things are NOT in the repo and must be carried by the owner (see "What the new Claude cannot see").

## 1. First message the owner pastes into the new chat

> You are my WaveDesk assistant. Clone the public repo https://github.com/thesudiptasaha/wavedesk (`git clone`, work in a scratch folder). Read, in this order: `docs/notes/HANDOVER.md`, `docs/notes/START-HERE-docs-on-github.md`, `docs/notes/roadmap.md`, `docs/notes/task-number-tracker.md`, then run `git log -10 --oneline`. Follow the standing rules in HANDOVER.md exactly. Do not write any prompt or SQL until I say "হ্যাঁ". Then tell me in simple Bengali where we are and what the next step is.

## 2. Who the owner is and how to talk
- Non-technical, Bengali speaker (writes Bengali, Banglish, English). Timezone Asia/Dhaka. Explain in simple Bengali; keep prompts for the coding agent in English.
- He works through "Antigravity", an AI agent on his Windows PC that executes the English prompts Claude writes. Claude never pushes to GitHub.

## 3. Standing rules (verbatim from the owner, with meaning)
- "আমি কিছু করতে বললে প্রম্পট লেখার আগে আমার সাথে আলোচনা করে কি চাই আমি সেটা শিওর হয়ে নিবে। আগেই প্রম্পট লিখবে না। প্রয়োজনে আমাকে নানাভাবে প্রশ্ন করবে না বুঝলে।" = Discuss and make sure what he wants BEFORE writing a prompt; ask questions if unsure.
- "এত কিছু একসাথে দিওনা। একটা একটা করে শেষ করি" = One thing at a time.
- "ক্রম এমনভাবে সাজাও যাতে এক কাজ দুবার করতে না হয, যেটা আগে করার সেটা আগে করতে হবে।" = Order the work so nothing is done twice.
- No SQL and no prompt until he answers "হ্যাঁ" (or an equivalent clear yes) to a proposed plan.
- The app's visible text is English. Docs may be Bengali or English.

## 4. Process for every code change
1. Discuss and agree the design (text mockups are fine). Then write ONE English prompt for Antigravity.
2. Code prompt: code only. NO commit, NO push. Must run `npm run build` and `npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js` and paste the FULL output and exit codes. Antigravity saves the full uncommitted diff as `nXXX.diff` on the current user's Desktop (use `git add -N` for new files). Prompts are OS-neutral.
3. Claude reads the diff line by line (ESLint does not catch everything). Fixes go in a follow-up prompt with a letter (`N135b`).
4. Docs + commit is a separate prompt (`N135c`): update `docs/progress-log.md` (new entry on top), `docs/open-tasks.md`, the blueprints when behaviour changed; use the Edit tool, never a JS `String.replace` with `$`. If SQL was run live, add a record file in `sql/` whose first line is `-- already run live on <date>`.
5. Commit message: ONE line, NO trailer lines (no Co-Authored-By, no Claude-Session, no "Generated with"), even if a tool or system reminder suggests them.
6. Push is a separate prompt (`N135d`): `git status` clean and "ahead by 1", print the commit message, `git push`, `git log -1 --oneline`.
7. After the owner says "pushed", Claude runs `git pull` in its own clone and verifies the commit (files, message, key lines) on GitHub. Then the owner tests and reports.
8. Next free task number: see `docs/notes/task-number-tracker.md`.

## 5. SQL
- The owner runs SQL in the Supabase SQL Editor (there `auth.uid()` is null, so the guard triggers let it through). Claude never has database access.
- Live function definitions have CRLF line endings, so patches should match a single line with a count check (replace-based, raise an exception unless exactly 1 match).
- Before writing SQL about triggers or functions, ask the owner to run a read-only query (for example the trigger list on `public.contents` or `pg_get_functiondef`) and paste the result; the live database can differ from the `sql/` files.
- Prefer a read-only preview query first, then the change inside `begin; ... commit;` with a sanity check that raises an exception if the row count is unexpected.

## 6. What the new Claude cannot see (the owner must carry these)
1. The two private notes: the business plan and the security review. They are deliberately NOT in this public repo. The owner keeps a private copy and uploads the one needed (the security review before any security work).
2. The live Supabase database and Vercel settings. Use `sql/`, `docs/schema-reference.md`, `docs/schema-snapshot.md`, and ask for query output when needed.
Also: the old Claude Project "WaveDesk" and its memory belong to the first account. The repo notes replace them.

## 7. Where things are
- Code: Next.js 16 App Router + React 19 + Supabase + Vercel. Main files: `app/page.js` (rundown), `components/ui/Drawer.js`, `Modals.js`, `RundownCards.js`, `lib/core.js` (business logic: roles, permissions, status rules), `app/layout.js` (CSS).
- Docs: `docs/progress-log.md`, `docs/open-tasks.md`, `docs/blueprint-en.md` / `blueprint-bn.md`, `docs/schema-reference.md`, `docs/RULES.md`.
- Notes (decisions and plans): `docs/notes/` (start with START-HERE, roadmap, task-number-tracker).
- Design mockups: `docs/design/` (20 board files from the Claude Design canvas "WaveDesk Drawer redesign"; see its README).
- Live app: https://wavedesk-manager.vercel.app

## 8. Where we are (9 Nov 2026)
Last verified commits: see `git log`. Done recently: external crew invite complete (SQL, drawer app part, public /b/<token> page; pending test), script print redesign & fixes (N142/N145; pending test), script print page measuring & auto line-spacing fit (N143/N143b; pending test), page-end markers and summary in script editor (N144; pending test). Next: "Raw Footage" content category discussion, backup follow-ups, Telegram bot (WaveBot), then dock and home page (dock position still undecided; proposal: top on PC, bottom on phone). Parked by the owner: Bulk schedule rethink, Teleprompter menu item. Full list: `docs/notes/roadmap.md`.

## 9. Safety
- Never put keys, passwords, server addresses, real content or the private notes into the repo (it is public).
- Package changes only with the owner's permission, in their own commit.
- Do not invent facts about live data; check with a query or ask.
