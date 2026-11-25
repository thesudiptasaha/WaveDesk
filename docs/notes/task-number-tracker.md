# WaveDesk — কাজের নম্বর ট্র্যাকার (হালনাগাদ: ২২ নভেম্বর ২০২৬)

**পরবর্তী ব্যবহারযোগ্য নম্বর: N166** (N165 ব্যবহৃত: Home Today's work panel, phase 2: automatic content work)। শেষ যাচাই-করা কমিট: 630aec2 (N164, verified on GitHub 22 Nov 2026, tested OK by the owner 24 Nov 2026)। N164 pushed (630aec2, tested OK 24 Nov 2026); N165 built, not committed. কাজ এখন একটাই কথোপকথনে চলে (আগের A/B দ্বৈততা শেষ)।

## নিয়ম
1. নতুন প্রম্পটের নম্বর = সর্বশেষ নম্বর + ১। নতুন কাজের আগে `git pull` + `git log -5 --oneline`।
2. একই কাজের অতিরিক্ত ধাপ অক্ষর দিয়ে: `N135` = কোড প্রম্পট (কমিট/পুশ নয়), `N135b` = অকমিট কোডের উপর ছোট সংশোধন, `N135c` = ডক্স + কমিট (পুশ নয়), `N135d` = শুধু পুশ। অক্ষর-ধাপে ডিফ ফাইলের নাম `n135b.diff`।
3. Antigravity (উইন্ডোজ) প্রম্পট চালায়; প্রম্পট OS-নিরপেক্ষ। ডিফ সেভ হয় বর্তমান ব্যবহারকারীর Desktop-এ `nXXX.diff` নামে, পথ জানায়।
4. কোড-প্রম্পটে কমিট/পুশ নেই; `npm run build` ও `npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js` পুরো আউটপুট ও exit code সহ। ডিফ পড়ে রিভিউ (ESLint সব ভুল ধরে না)।
5. ডক্স+কমিট আলাদা প্রম্পট (SQL লাইভ চালানো হলে রেকর্ড ফাইল, প্রথম লাইন `-- already run live on <তারিখ>`); পুশ আলাদা প্রম্পট (git status পরিষ্কার + ahead by 1, কমিট বার্তা দেখানো, push, `git log -1 --oneline`)।
6. কমিট বার্তায় কোনো trailer লাইন নেই (Co-Authored-By, Claude-Session, "Generated with" কিছুই না)।
7. পুশের পর GitHub থেকে `git pull` করে `git log --stat` মিলিয়ে যাচাই।
8. ডক্স সম্পাদনায় Edit টুল (JS `String.replace` নয়, `$` চিহ্নের ঝুঁকি)।
9. SQL: ব্যবহারকারী Supabase SQL Editor-এ চালায়। লাইভ ফাংশনের লাইন CRLF, তাই প্যাচ একটি লাইনে মেলানো, ঠিক ১টা না মিললে exception। ব্যবহারকারী "হ্যাঁ" না বলা পর্যন্ত SQL বা প্রম্পট নয়; আগে আলোচনা, একটা একটা করে।
10. স্ক্রিন সাইজ: ১৩৬৬x৭৬৮, ১৯২০x১০৮০, অ্যান্ড্রয়েড, ম্যাকবুক এয়ার, আইফোন।

## নম্বর → কমিট (যাচাই-করা; কোড + ওই কাজের ডক্স একই কমিটে)
| প্রম্পট | কী | কমিট |
|---|---|---|
| N81–N103 | (আগের তালিকা: Scheduled ধাপ থেকে Presenter নিয়ম পর্যন্ত; শেষ: N102/N103 = f9371c7) | …f9371c7 |
| N104 | ড্রপডাউন পাঠযোগ্য (ডার্ক/লাইট), শেয়ার্ড SelectBox | 8872382 |
| N106 | স্ক্রিপ্ট ছাপা-কাগজ লুক, `script_saved_at` ট্রিগার | a33a0b6 |
| N108 | Production ট্যাবে গোল ছবির টাইল, Presenter Production Crew-এ | 871085e |
| N110 | রানডাউন PC লিস্ট কম্প্যাক্ট, ছবির টাইল | 12ae46a |
| N112 | ড্রয়ার কম্প্যাক্ট হেডার/ফুটার, লাল গোল ক্লোজ | 4676cef |
| N114 | ড্রয়ার হেডারে বড় আইডি + Copy ID | 4a23258 |
| N115 | Details প্যানেল: লম্বা স্ক্রিনে স্বাভাবিক, খাটোতে কম্প্যাক্ট | ff9e712 |
| N116 | প্রকাশিত কনটেন্ট Drop ("Published, later removed") | 32a4131 |
| N117 | A4 স্ক্রিপ্ট প্রিন্ট | c1b1ec5 |
| N118 | নতুন কনটেন্ট আইডি `WAVECON-YYYYMMDD_XXXX` | 5cf3eba |
| N119 | সংযুক্তদের নোটিফিকেশন, জোরালো সাউন্ড + সুইচ | 35f92a1 |
| N121 | চার নতুন ক্রু রোল, `ROLE_LIST` একক উৎস (২১ রোল) | 6638f83 |
| N122 | ড্রয়ারে ৫ ট্যাব, Credits ট্যাব | 23201b4 |
| N123 | Production crew/Shoot নিয়ম, Shoot কার্ড, DB ট্রিগার | d3b840b |
| N124 | Publisher পাহারা, শেয়ার্ড Publisher টাইল | e2c0069 |
| N125 | Files delivered কার্ড, Production notes | de0d2e5 |
| N126 | রানডাউনে কপিযোগ্য আইডি বক্স | b0c4c27 |
| N127 | আইডি বক্স বড়, টাইপ বক্সের ডানে | 9d4b6e8 |
| N128 | বিজ্ঞাপনদাতা তালিকা + টেবিল | ba00d0c |
| N129 | Editorial-এ Sponsors সেকশন, রানডাউনে ব্যাজ | c6b0f51 |
| N130 | লগইনহীন বহিরাগত সদস্য (ম্যানেজমেন্ট উইন্ডো, লেবেল, ডিরেক্টরি, রিপোর্ট) | 4374195 |
| N131 | PersonPicker (খোঁজা যায় এমন নাম বাছাই, ছবিসহ); Owner/Manager শুধু রোল টিক থাকলে তালিকায় | d19b7d5 |
| N132 | ড্রয়ার StepBar + সবুজ গ্লো + Post-production ট্যাব | 8d6b5a0 |
| N133 | Files received/Problem/Problem fixed, ডিফল্ট এডিটিং ক্রু ফিল | 7549b1d |
| N134 | "Did it go out?" ভিত্তি: উত্তরের উইন্ডো, banner, Manager সিদ্ধান্ত, Publisher রিশিডিউল অধিকার | ef8050b |
| N135 (b, c, d) | রানডাউনে প্রতি চ্যানেলে পিন করা সারি + Publisher-এর ঝলকানো পিল | 606d0e0 |
| N136 | ডাটা সংশোধনের রেকর্ড: Owner/Manager-এর ২১ রোল টিক (SQL লাইভ চালানো) | 516a286 |
| N137 | planning notes added to the repo (docs/notes) | 09d708e |
| N138 | design mockups + HANDOVER note | 4948718 |
| N139 | external crew invite: bookings SQL record + docs | 24baef6 |
| N140 (b, c, d) | external crew invite app part (Invite button, WhatsApp message, status badge) | 5493d46 |
| N141 (c, d) | public booking page /b/<token> (confirm or decline, script and print for presenters) | 0af7608 |
| N142 (c, d) | new script print layout (no page 2, logo header, footer) and booking page print fix | 8ddc24b |
| N143 (b, c, d) | print page measuring + automatic line-spacing fit to save paper | a9c58f7 |
| N144 (c, d) | page-end markers and page summary in the script editor | 65c9415 |
| N145 (c, d) | script print fixes (double rule, logo wait, serif font, left ID right page counter) | 7cfcc58 |
| N146 (d) | record content type decisions (Uncut, Photo Card, STORY = PACKAGE) and order of work | 98a7f63 |
| N147 (N147, N147c, N147d) | one content type table (CONTENT_TYPE_CONFIG) so pipeline and credit rules live in one place | 82c0d85 |
| N148 (b, c, d) | Manage Sponsors tick and Sponsors section in drawer left column (+ DB groundwork records) | 63268bc |
| N149 (b, b2, c, d) | Uncut content type and Multimedia Journalist role in the app | b3cd1b3 |
| N150 (c, d) | Shoot location field in the Production tab (suggestions from earlier entries, searchable, in the Excel export) | 7d62abb |
| N151 (c, d) | Photo Card ground work: three new ticks and the Photo Card Templates page (+ DB record for Photo Card tables and rules) | 42b7c58 |
| N152 (b, b2, c, d) | Photo Card step 2: PHOTO CARD type, new-card form (two buttons Save as draft / Submit to design, template fields, source, caption, designer instructions), card drawer tabs (Editorial, Production, Publish), Excel columns | ad37d13 |
| N153 (b, c, d) | Photo Card step 3: step buttons for cards (I'm taking it, Withdraw, Made send for review, Give back, Approve, Request correction with reason, Mark as Scheduled, Publish dialog with optional per-platform links, Confirm Published, Cancel Schedule) | 28d8427 |
| N154 (c, d) | Photo Card step 4: rundown switch Videos | Photo Cards | All (choice remembered per user in the browser) | dcc37a5 |
| N155 (b, c, d) | Photo Card Desk page: menu page for Owner/Managers and people with request/approve/design/publish power; sections Waiting for a designer, My work, Waiting for my review, My requests & drafts, All cards; inline buttons; '+ New Photo Card' | 2d864a1 |
| N156 (c) | Removed Breaking from the app, Photo Card Desk 'Ready to publish' section, publish check off for all photo cards | 8b56892 |
| N157 (c) | Photo Card request form without date/time (time = creation moment), real publish time shown from went_live_at, open cards (Draft..Scheduled) carried over and pinned at the top of their channel from the request day through today in Photo Cards and All views, grey 'Open · Nd' tag | 811239b |
| N158 (c) | Photo Card template tracking SQL recorded (new template columns source_package, source_file_name, current_file_name, designed_by, archive_location, version_no, updated_by, updated_at, last_change_note; unique current file name per organization; history table photo_card_template_history written by a trigger) | 2b51497 |
| N159 (c, d) | Real-time auto-refresh for all users (stable channel, batched row refetch, catch-up, typing protection, script conflict check, contents.updated_at, content_ads in publication) | 5535f3e (verified on GitHub 21 Nov 2026) |
| N160 (c, d) | Templates page: required file-tracking fields (source package, source file, current file, designed by, archive location), change note, version badge, History view, access tick label renamed 'Graphic Template Management' | d3aad53 (verified on GitHub 21 Nov 2026, tested OK by the owner) |
| N161 (c, d) | Photo Card drawer tidy: Production tab hidden for cards, Card folder moved to Publish tab, 'Real upload time' strip removed (side field 'Published at'), compact caption + hashtags with 'Copy caption + hashtags', new card Credits tab (Requested/Designed/Approved/Published/Template by) | 4d5f342 (verified on GitHub 22 Nov 2026, tested OK by the owner) |
| N162 (c, d) | Photo Card own content ID WAVECARD-YYYYMMDD_0001 (SQL run live 22 Nov 2026, recorded), demo-mode ID prefix for cards | 8281f4b (pushed) |
| N163 | Update Next.js 16.4.2 -> 16.4.6 (Nov 2026 security release); dependency bump only; build passes first run; committed | 6a312c2 (pushed, verified on GitHub 22 Nov 2026, tested OK by the owner) |
| N164 | Home 'Today's work' panel, phase 1: own tasks, repeating tasks (daily / weekly / monthly), ticks; new tables personal_tasks + personal_task_done (owner-only RLS), RPC cleanup_my_task_history; SQL run live 22 Nov 2026, recorded in sql/2026-11-22_personal_tasks.sql; panel in a right column next to the Rundown at >= 1536px, collapsible bar above it on smaller screens | 630aec2 (pushed, verified on GitHub 22 Nov 2026, tested OK by the owner 24 Nov 2026) |
| N165 | Home 'Today's work' panel, phase 2: automatic content work ("From contents"); tests: `node --experimental-default-type=module tests/n165-content-work.mjs` | built, not committed |

পরিকল্পিত ক্রম:
- N166 = in-app card editor E1 (on hold; the owner returns to it after other work)
- Later = Today's work phase 3 (give tasks to others, team tasks, notifications / Telegram reminders, calendar), report page, sample folder structure for the 7 channels, notifications for cards, E2 canvas, E3 export, E4 preview + 7-day cleanup

নোট: প্রগতি লগে N120 নেই। N105, N107, N109, N111, N113 ইত্যাদি বিজোড় নম্বর পুরনো পদ্ধতির ডক্স-প্রম্পট ছিল; এখন ডক্স একই কমিটে বা অক্ষর-ধাপে।

## পরীক্ষা: ব্যবহারকারীর ভাষ্য
N132–N135 পরীক্ষা পাস ("everything okay", ৮ নভেম্বর)। N136-এর পর রোল তালিকায় Owner/Manager ফিরেছে (ব্যবহারকারী নিশ্চিত)।

## খোলা সংশোধন-তালিকা
- Bulk schedule দিয়ে নতুন কনটেন্ট বানালে (INSERT) এডিটিং ক্রুর ডিফল্ট ফিল হয় না। ব্যবহারকারী: "পরে ভেবে করব"।
- On Hold কনটেন্টে `shoot_finished_at` না থাকলে Production ট্যাবের সবুজ গ্লো থাকে না (ছোট ফাঁক)।
- নতুন Owner/Manager তৈরির পর তার রোল টিক Team মডালে হাতে দিতে হবে।
