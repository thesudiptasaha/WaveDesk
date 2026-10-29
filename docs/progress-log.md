# WaveDesk — অগ্রগতির লগ (৭–১১ অক্টোবর ২০২৬)

Master documents live in docs/ in this repo. The Claude Project holds only a pointer.

মূল ডকুমেন্টসমূহ: `docs/RULES.md` · `docs/blueprint-en.md` · `docs/blueprint-bn.md` · `docs/business-and-operations.md` · `docs/architecture-django-transition.md` · `docs/developer-guide-learning.md` · `docs/open-tasks.md` · `docs/progress-log.md` (ঐতিহাসিক পরিকল্পনার খসড়া: antigravity-tasks, schema-snapshot, file-management-plan)
প্রতিটা কমিট আমি GitHub থেকে নিয়ে যাচাই করেছি (undefined-name চেক ০ এরর + `npm run build` সফল)।

## GitHub-এ শেষ (main, পুরনো → নতুন)
| কমিট | কাজ |
|---|---|
| e892033 | missing imports ফিক্স (refactor-পরবর্তী ক্র্যাশ) |
| 24b0ea2 | F0: docs/RULES.md, check-undefined eslint কনফিগ, utils/features.js, sql/README.md, constants (APP_NAME, APP_CREDIT, SCRIPT_WORDS_PER_MINUTE) |
| d0e4624 | N3: Start Shoot এখন `camera_person` দেখে; সব জায়গায় "Cameraman" |
| 1a01308 | N2: SLUG_MAX = 24 (নতুন কনটেন্ট + বাল্ক এন্ট্রি) |
| d5d170b | N1: WaveDesk নাম (ট্যাব title = শুধু "WaveDesk", হেডার, লগইন কার্ড, ফাইলের নাম) + ক্রেডিট লাইন (লগইন + ফুটার) |
| a68b56c | N4 + N4b + N4c + N5b: টেবিলে স্লাগ এডিট বন্ধ, ড্রয়ারে "Slug name" ঘর; BlurInput-এ maxLength; টেবিলে Download ZIP বাদ |
| f92e29d | N6: পার্কিং জোন — সময়ওয়ালারা আগে (ছোট→বড়), সময়হীনরা পরে (নতুন তৈরি আগে) |
| af10df2 | N22: পার্কিং জোন সব তারিখে সব parked কনটেন্ট দেখায় |
| 02f73fa | N16: পাবলিশড লিংক খোলা (`safeHttpUrl`, শুধু http/https) |
| 77f9211 | N19: স্ক্রিপ্টের সময় m:ss (১৩০ শব্দ/মিনিট), `utils/scriptDuration.js` |
| d6c6418 | N21 + N21b: স্ক্রিপ্ট অটো-ড্রাফট (ব্রাউজারে, `utils/scriptDraft.js`); `canEdit` ছাড়া চালু হয় না; Save সফল হলে তবেই ড্রাফট মোছে |
| 175895a | N20 + N20b + N20c: টেলিপ্রম্পটার "Script Play" (পোর্টালে পুরো পর্দা, Esc শুধু টেলিপ্রম্পটার বন্ধ করে, ধীর স্পিডেও চলে, ফোনে কন্ট্রোল বার ঠিক) |
| 1778833 | N24 + N24b: স্ক্রিপ্ট রিচ টেক্সট এডিটর (Tiptap 3.31.4, MIT) — বোল্ড, আন্ডারলাইন, হাইলাইট। স্ক্রিপ্ট একই কলামে ছোট HTML (`p, br, strong, u, mark`); পুরনো সাধারণ লেখা চলে; `utils/scriptRich.js` (sanitize সহ); ফ্ল্যাগ `rich_editor` |
| 57d90bc | N18 + N18b: নোটিফিকেশন সাউন্ড (`utils/notifySound.js`, মৃদু chime, শুধু নতুন INSERT-এ, ২ সেকেন্ড থ্রটল, মিউট বাটন, 'wd-sound' localStorage) |
| 1239e7f | N25 + N26 + N26b: ড্রয়ারের `CreditSelect` সেভ করা নাম সবসময় দেখায়; পুরো সিস্টেমে "Writer" → "Research & Script" |
| 05e0ea8 | N7: টেবিলের Staff Assignment ঘরে সরাসরি Research & Script / Presenter / Video Edit ড্রপডাউন (`StaffAssignSelect.js`: `StaffAssignSelect`, `StaffCell`); অনুমতি `FIELD_PERM`; ক্লিকে ড্রয়ার খোলে না |
| 1c10ca5 | N8 (বদলানো — Save বাটন বাতিল): ড্রয়ারের মাথায় "Saving… / Saved ✓ HH:MM / Not saved"; Esc-এ ফোকাসে থাকা INPUT/TEXTAREA blur হয়ে শেষ লেখা সেভ; সেভের নিয়ম অপরিবর্তিত |
| 530f3c9 | N9: "কর্তৃপক্ষ" প্যানেল ৫ ভাগে (People & access, Channels, Schedule, Reports, Data) + বর্ণনা; বাটনের নাম ও ৭ হ্যান্ডলার অপরিবর্তিত |
| 04dc17c | N27: টেবিল থেকে অ্যাসাইন/মোছায় সফলতার সবুজ টোস্ট (`Presenter → নাম` / `… cleared`), শুধু `patchRow` সফল হলে; `StaffCell`-এ `notify` প্রপ |
| cf7b573 | N28 (১০ অক্টোবর): রানডাউন/পার্কিং/বিন নতুন নিয়ম (নিচে "প্লেসমেন্ট নিয়ম")। `lib/core.js`: `isComplete`, `missingFields`, `isBin`, নতুন `isParked`; `app/page.js`: রানডাউন = `isComplete`, `bin` মেমো, পার্কিংয়ে "Incomplete / Missing: …" ট্যাগ, BIN সেকশন (Restore বাটন), লোডিং কোয়েরি (`emptyMetaRes` এখন channel/slug খালি ধরে); `Drawer.js`: On Hold কনটেন্টে Manager ছাড়া "Scheduled publish" লক। যাচাই: eslint 0, build 0, ১৫৩ লাইন যাচাই-করা ডিফের সাথে হুবহু এক। |
| c733c47 | N29 (১০ অক্টোবর): ফুটার পরিষ্কার। `app/page.js` শুধু (+5 −19): ফুটার থেকে Team, Excel, KPI Report (সবুজ), Backup All (লাল, যেটা আসলে stub ছিল — শুধু alert) বাদ; import থেকে `downloadFullSystemBackup` বাদ। কর্তৃপক্ষ প্যানেল অপরিবর্তিত (Team, Excel, KPI report, Backup সব ওখানে)। প্রভাব: সাধারণ কর্মী আর KPI Excel ডাউনলোড করতে পারে না (আগে সবুজ KPI Report সবার কাছে ছিল)। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 73d8deb | N28c (১০ অক্টোবর): `scheduleParked`-এর শেষ টোস্ট এখন সত্যি বলে: `missingFields({...row, scheduled_publish_time: iso})` খালি না হলে ধূসর বার্তা "Time saved, but still missing: … - it stays in the Parking Zone", নইলে আগের সবুজ "is on the rundown for …"। `app/page.js` +6 −1। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| d249ed7 | N30 (১০ অক্টোবর): My Work প্রোফাইল পপআপে। `Modals.js`: `ProfileModal`-এ নতুন প্রপ `onOpenMyWork`, ফুটারের প্রথম বাটন "My Work"; `app/page.js`: প্রপ পাস (`setShowProfile(false); setShowMyWork(true)`), ফুটার থেকে কর্মীর My Work বাটন বাদ — ফুটারে এখন থিম, কর্তৃপক্ষ (Manager/Owner), KPI (শুধু Manager)। সবার জন্য My Work প্রোফাইলের ভেতরে। +11 −9। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 0266e0d | N31 (১০ অক্টোবর): Bin = বাটন + পপআপ। `app/page.js` শুধু (+58 −56): পার্কিং জোনের শিরোনামের ডানদিকে "Bin (N)" বাটন (খালি হলে ঝাপসা, তবু চাপা যায়), পাশে "N items"; চাপলে `ModalShell wide` পপআপ (`showBin` স্টেট) — একই টেবিল (Slug Name, Channel, Missing, Drop reason, Restore); সারিতে ক্লিক করলে পপআপ বন্ধ হয়ে ড্রয়ার খোলে; Esc পপআপ বন্ধ করে; পাতার নিচের আলাদা BIN সেকশন সরানো। `bin` মেমো, Restore লজিক অপরিবর্তিত। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| ee4ab73 | N32 (১০ অক্টোবর): ১০০০ সারির সীমা ঠিক। নতুন `utils/fetchAll.js` (`fetchAllPages(buildQuery, pageSize=1000, maxPages=50)` — `.range()` দিয়ে পাতা ধরে সব সারি; ত্রুটিতে `{data:null,error}`); `app/page.js` `fetchRows`-এর ৭টা কোয়েরিই (প্রধান তারিখ-পরিধি, shorts, held, no-date, Draft/Dropped, অতীত-অপ্রকাশিত, empty-meta) এখন `fetchAllPages` দিয়ে, প্রতিটায় স্থির সাজানো `.order('id')` (প্রধানটায় `scheduled_publish_time` তারপর `id`)। কোনো ফিল্টার/দেখানোর নিয়ম বদলায়নি। মোট +36 −17। যাচাই: নকল Supabase-এ ০/১/৯৯৯/১০০০/১০০১/২৫০০/৩০০০ সারি — সবই ঠিক সংখ্যা, ডুপ্লিকেট নেই, ত্রুটি-কেস ঠিক; eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 0f3e0c4 | N33 (১০ অক্টোবর): ব্যাকআপে স্থির সাজানো। `components/ui/Modals.js` `BackupModal` → `performBackup`-এর পাতা-ধরা লুপে `.order('id', { ascending: true })` (+১ লাইন)। পাঁচটা টেবিলেই `id` আছে (organizations, team_members: uuid; channels, contents, notifications: bigint)। ফল: বড় টেবিলে ব্যাকআপের সারি বাদ/ডুপ্লিকেট হয় না। যাচাই: eslint 0, build 0, পুশ করা ডিফ হুবহু এক। |
| 7a5c1a6 | Antigravity দিয়ে (আমাকে না জানিয়ে) **Next ^16.4.0, React/ReactDOM ^19.3.0**; `xlsx` বদলে `xlsx-js-style ^1.2.0` (import বদল: app/page.js `exportXlsx`, Modals.js কর্মী রিপোর্ট Excel ও Backup Excel); মরা `components/ui/ActionButtons.js` মোছা; package-lock বড় বদল | আমার যাচাই পরে: eslint 0, build 0 (Next 16.4.0 Turbopack); পুরনো `xlsx` import বাকি নেই। **রানটাইমে টেস্ট হয়নি** (Tiptap, টেলিপ্রম্পটার পোর্টাল, Realtime, Excel ডাউনলোড) |
| 3c8fbb9, 70ec21d | রিপোজিটরির `docs/*` ও README.md সাজানো; চারটা ০-বাইটের খালি ফাইল: `components/features/Drawer.js`, `components/features/RundownTable.js`, `components/layout/Sidebar.js`, `components/layout/TopHeader.js` | শুধু ডক |
| 834206d | `sql/2026-10-11_storage_documents_rls.sql`: public `documents` বাকেট, ৫০ MB; authenticated সবার insert/update/delete (org বা মালিক ধরে সীমা নেই), select সবার | ব্যবহারকারী চালিয়ে আপলোড+প্রিভিউ টেস্ট করেছেন (রেফারেন্স ফাইল আপলোড এখন ঠিক) |
| 375a1a1 | ডেটাবেস আকার ~944 kB (সীমা ৫০০ MB, ~০.২%): contents 29, notifications 756, team_members 20, content_uid_counters 11, organizations 1 | ডক |
| 094c881 | N12 নোটিশ বোর্ড | eslint 0, build 0, পুশ করা ডিফ যাচাই-করা ডিফের সাথে ৪৮৬ লাইন হুবহু এক, বাংলা অক্ষর অক্ষত |
| 0f2f2d8 | N13 আর্থি লাইট থিম ও N15 প্যাকেজিং/প্রোডাকশন রূপান্তর | Production ট্যাবে শুধু ফুটেজ/মাস্টার ফাইল (রেফারেন্স বাদ); Packaging ট্যাবে প্রতি প্ল্যাটফর্মের Published Link ও শর্ট কনটেন্ট (হুক, ক্যাপশন, সময়); ডাইনামিক `platforms` টেবিল ও `AddPlatformModal`; eslint 0, build 0 |
| UI Polish | স্লাগ কালার স্বাভাবিক ও থিম কনট্রাস্ট ফিক্স (১২ অক্টোবর) | ১. স্লাগ টেক্সট দুই থিমেই সাধারণ ফন্ট কালার (text-white; ডার্কে সাদা, লাইটে চারকোল `#28231d`) — রানডাউন (ডেস্কটপ ও মোবাইল) এবং পার্কিং (মোবাইল) থেকে কন্টেন্ট-টাইপ রঙ সরানো; ২. টেলিপ্রম্পটার লাইট ও ডার্ক উভয় থিমেই স্থায়ী ব্ল্যাক ব্যাকগ্রাউন্ড (`#000000`) ও সাদা টেক্সট (`#ffffff`) — `.teleprompter-root` রুট ও লাইট থিম সিএসএস ওভাররাইড প্রোটেকশন; ৩. ড্রয়ারের শীর্ষে স্ক্রিপ্ট ডিউরেশন ব্যাজ লাইট থিমে স্পষ্ট দৃশ্যমান (`.script-duration-badge`: `#e5ded2` ব্যাকগ্রাউন্ড, `#241f19` ডার্ক টেক্সট); eslint 0, build 0 |
| b19ea5a | 12 Oct: notice uid, live search (NoticeModal), theme contrast fixes for slug, teleprompter and drawer duration | verified: eslint 0, build 0 |
| 835b813 | 12 Oct: docs record that the three Oct 12 SQL migrations were run live (notices uid and counter, platforms table, published_links column) | docs only |
| b405250 | N35 (12 Oct): (1) added missing bell and info icons to Icons.js; (2) createNotice no longer builds notice_uid on the client - the database trigger notices_assign_uid assigns it; (3) no chime or toast for the person who posted the notice (author_id compared with actorIdRef); (4) app/page.js and Modals.js now import the single supabase client from services/supabase.js instead of two extra createClient calls. 4 files, +7 -36. | verified: eslint 0, build 0, pushed diff identical |
| 76e0955 | N36-A (18 Oct): `.github/workflows/db-backup.yml` - nightly pg_dump (public + auth schemas) at 23:30 Dhaka, gzip + gpg AES256, uploaded as a GitHub artifact for 30 days | first manual run green, artifact 114 KB |
| ebfdd87 | N36-B (18 Oct): `sql/2026-10-18_storage_platforms_rls_tighten.sql` - record of the SQL already run live (documents bucket: no update/delete, insert only for active members; platforms policies require an active member) | policy list checked live |
| f93a864 | N36-C (18 Oct): added Change presenter and Change channel to the live PERMISSIONS list in lib/core.js; removed the dead copy in utils/constants.js | verified: eslint 0, build 0, pushed diff identical |
| fe93b53 | N36-D (18 Oct): removed 4 fake download buttons (Archive ZIP in drawer, KPI report in Authority menu, download_script action, My Work Download Zip), removed the broken legacy avatar upload field, "Script copied" now uses notify | verified: eslint 0, build 0, pushed diff identical |
| 703bef2 | N36-F (18 Oct): My Work now counts all 14 credit roles from one MY_WORK_ROLES list in components/ui/Modals.js (first 5 roles always shown, the other 9 only when above zero) | verified: eslint 0, build 0, pushed diff identical |
| e3535f7 | N36-H (19 Oct): new ConfirmDialog component in components/ui/Shared.js (z-70, Esc closes only the dialog, Cancel focused by default) replaces the two browser confirm() popups: remove team member (app/page.js) and delete notice (NoticeModal.js) | verified: eslint 0, build 0, pushed diff identical |
| e180bc2 | N36-I (19 Oct): EmployeeReportModal now fetches its own contents for the From/To dates it shows (own query, Loading state, error message, Download Excel disabled while loading); app/page.js passes orgId | verified: eslint 0, build 0, pushed diff identical |
| 1876cdf | N37-A (20 Oct): removed dead code: components/ui/ExportButtons.js deleted; the 3 alert placeholders removed from services/exportService.js (downloadUserReport kept); 4 unused import lines removed (app/page.js x3, Drawer.js x1) | verified: eslint 0, build 0, pushed diff identical |
| 1d2c1cb | N37-B / N34 (20 Oct): fetchRows in app/page.js now runs 5 queries instead of 7 (removed the "all Draft/Dropped" and "past not published" queries and their merge entries) | verified: eslint 0, build 0, pushed diff identical, live test ok |
| 931f780 | N38 (20 Oct): added 3 new files: app/error.js (friendly error page with Try again / Reload), app/not-found.js (404 page), app/icon.svg (favicon) | verified: eslint 0, build 0, pushed diff identical |
| caccd8a | N39 (20 Oct): favicon changed to a red square (#eb3026) with a white W drawn as a line path (app/icon.svg only) | verified: build 0, pushed diff identical |
| 7e3837f | N41 (21 Oct): Notice Board button moved from the footer to the header, right before the notification bell; new "board" (clipboard) icon in components/ui/Icons.js so it no longer looks like the bell; label hidden on small screens (icon only); same unread badge and open logic | verified: eslint 0, build 0, pushed diff identical |


## প্লেসমেন্ট নিয়ম (N28, ব্যবহারকারীর সিদ্ধান্ত ১০ অক্টোবর)
"সম্পূর্ণ" = channel + slug + publish date/time তিনটাই আছে।
- সম্পূর্ণ কনটেন্ট (Draft, Dropped সহ যেকোনো স্ট্যাটাস, অতীত বা ভবিষ্যৎ): **রানডাউনে**, স্ট্যাটাস ব্যাজ সহ।
- On Hold: **পার্কিং জোনে**; সম্পূর্ণ হলে রানডাউনেও।
- অসম্পূর্ণ (Dropped নয়): **পার্কিং জোনে**, "Incomplete" + কী নেই ("Missing: …")।
- অসম্পূর্ণ + Dropped: **Bin**-এ (পার্কিংয়ের শিরোনামের পাশের "Bin (N)" বাটনের পপআপে, N31); Manager/Owner Restore করতে পারে (→ Draft → পার্কিং বা রানডাউন)।
- ড্রয়ারে On Hold কনটেন্টের সময় বদলানো শুধু Manager/Owner; পার্কিংয়ের Resume আগের মতোই (Manager)।
- KPI (মডাল ও রিপোর্ট) রানডাউনের `visible` থেকেই: Draft/On Hold/Dropped স্ট্যাটাস সহ গোনা হয়। My Work/কর্মী রিপোর্ট/ব্যক্তিগত রিপোর্ট স্ট্যাটাস দিয়ে ছাঁকে না; তারিখহীন (পার্কিং/বিন) কনটেন্ট তারিখ-ভিত্তিক রিপোর্টে আসে না।
- পার্কিং থেকে সময় দিলে টোস্ট সত্যি বলে (N28c, সম্পন্ন)।
- ডেটা লোডে এখনও সব Draft/Dropped ও অতীত-অপ্রকাশিত সারি আনে (গুরুত্বহীন; N34-এ সরানো যাচাই করা হবে — open-tasks.md)।

## ডেটাবেস (Supabase) — সম্পন্ন
- **DB-0 (৮ অক্টোবর, ব্যবহারকারী চালিয়েছেন, চেক তিনটাই true):** `contents.reference_files jsonb default '[]'` যোগ; `notify_content_insert/update` নোটিফিকেশনে "Writer" → "Research & Script"; `cascade_member_rename` এখন idea_by, producer, uploader, vfx, colorist, light_designer, sound_recordist, audio_mixer, video_switcher, live_audio-ও ধরে। Rollback `sql-db0.md`-এ।
- ✅ **Storage documents বাকেট ফিক্স (১১ অক্টোবর):** `sql/2026-10-11_storage_documents_rls.sql` সফলভাবে কার্যকর। Assets ট্যাবে রেফারেন্স ফাইল আপলোড ও নতুন ট্যাবে প্রিভিউ সফলভাবে পরীক্ষিত।
- ✅ **N12 নোটিশ বোর্ড (১১ অক্টোবর, 094c881):** `notices` টেবিল, RLS, Realtime, `NoticeModal.js`, `noticeService.js`, `app/page.js` বাটন ও লিসেনার সম্পন্ন ও কমিট/পুশ সম্পন্ন। ব্যবহারকারী Supabase-এ SQL চালিয়েছেন (`Success. No rows returned`)।
- ✅ **১২ অক্টোবরের মাইগ্রেশন সম্পন্ন:** ব্যবহারকারী Supabase SQL Editor-এ ৩টি স্ক্রিপ্টই সফলভাবে চালিয়েছেন — `platforms` টেবিল+RLS (`sql/2026-10-12_platforms_table.sql`), `contents.published_links` কলাম (`sql/2026-10-12_packaging_published_links.sql`), এবং `notice_uid` ও দৈনিক কাউন্টার ট্রিগার (`sql/2026-10-12_notices_uid_and_counter.sql`)।
- ⏳ DB-0-র পরের টেস্ট: TEST কনটেন্টে অ্যাসাইনে নোটিফিকেশনে "Research & Script" আসে কিনা।

## N12 নোটিশ বোর্ড (094c881, ১১ অক্টোবর)
- **SQL** `sql/2026-10-11_notices_table.sql` (ব্যবহারকারী চালিয়েছেন): টেবিল `notices` (id uuid, organization_id, title, body, author_id → team_members, author_name, priority normal/urgent/info, created_at, updated_at); ইনডেক্স; RLS — পড়া: `my_org_id()` ও `i_am_active()`, লেখা/বদল/মোছা: `my_org_id()` ও `is_manager()`; Realtime publication-এ যুক্ত। Rollback ফাইলের নিচে কমেন্টে (সতর্কতা: `alter publication … drop table if exists` লাইনটা অবৈধ সিনট্যাক্স; লাগলে `if exists` ছাড়া `alter publication supabase_realtime drop table notices;`)।
- `services/noticeService.js`: `fetchNotices(orgId, limit=50)`, `createNotice(...)`, `deleteNotice(id)`।
- `components/ui/NoticeModal.js`: ModalShell ফিড; Urgent লাল / Info নীল ব্যাজ; Manager/Owner-এর জন্য "+ নতুন নোটিশ দিন" ফর্ম ও মোছা (confirm সহ)।
- `app/page.js`: স্টেট `showNotices`, `notices`, `unreadNoticesCount`; না-পড়া localStorage `wd-notices-read-at` দিয়ে; Realtime লিসেনার (`newsroom-${org.id}`) — INSERT-এ chime + টোস্ট (ফ্ল্যাগ `notif_sound`); ফুটারে "নোটিশ" বাটন + ব্যাজ (ফ্ল্যাগ `notices`); Esc চেইনে `showNotices`।
- জানা ছোট খুঁত: (১) `bell` আইকন `Icons.js`-এ নেই — বাটনে আইকন ফাঁকা, লেখা দেখা যায়; (২) যিনি নোটিশ দেন তিনিও নিজের chime শোনেন ও নিজের নোটিশ ব্যাজে গোনা হয়; (৩) নোটিশ সম্পাদনা (update) UI নেই, শুধু policy আছে।
- ব্যবহারকারীর চোখে-দেখা টেস্ট বাকি: Manager পোস্ট/মোছা; কর্মীর অ্যাকাউন্টে ফর্ম নেই কিন্তু নোটিশ+ব্যাজ+chime আছে; ফোনের মাপ; Esc।

## N12 নোটিশ আইডি ও লাইভ সার্চ (১২ অক্টোবর)
- **SQL** `sql/2026-10-12_notices_uid_and_counter.sql`: `notices.notice_uid text unique` কলাম যোগ; `notice_uid_counters` দৈনিক কাউন্টার টেবিল (Asia/Dhaka সময়); `notices_assign_uid()` ট্রিগার ফাংশন ও `trg_notices_assign_uid` ট্রিগার (ইনসার্টের আগে স্বয়ংক্রিয় `NOTICE-YYYYMMDD_NNN` তৈরি); পুরনো নোটিশের জন্য ব্যাকফিল স্ক্রিপ্ট।
- `components/ui/NoticeModal.js`:
  - **লাইভ সার্চ বার:** নোটিশ বোর্ডে আইডি (যেমন `NOTICE-20261012_001`), শিরোনাম, বডি বা লেখক লিখে ইনস্ট্যান্ট ফিল্টার; নোটিশ কাউন্টার ও সার্চ রিসেট বাটন।
  - **আইডি প্রদর্শন ও কপি:** নোটিশ কার্ডের শিরোনামের পাশে `NOTICE-YYYYMMDD_NNN` সবুজ ব্যাজ; ক্লিকে ক্লিপবোর্ডে কপি ও "কপি হয়েছে!" অ্যানিমেশন।
  - **ফলব্যাক ডিসপ্লে:** ডাটাবেসে পুরনো কোনো নোটিশে `notice_uid` নাল/খালি থাকলেও ক্লায়েন্ট-সাইডে তারিখ ও ক্রমানুসারে স্বয়ংক্রিয় UID বসিয়ে দেখানো ও কপি সাপোর্ট।
- `services/noticeService.js`: `createNotice`-এ স্বয়ংক্রিয় দৈনিক ক্রম গুনে `notice_uid` তৈরি ও ডাটাবেসে সেভ; কলাম না থাকলে নিরাপদ ফলব্যাক। (UPDATED in N35, b405250: the client-side counting was removed; the database trigger assigns notice_uid. Optional noticeUid parameter remains.)
- `lib/core.js`: `makeNoticeUid` জেনারেটর হেল্পার ফাংশন যোগ ও এক্সপোর্ট।

## ঝুঁকি/সিদ্ধান্ত বাকি
1. **Next 16 / React 19 লাফ**: লাইভে স্মোক টেস্ট দরকার — লগইন, রানডাউন, ড্রয়ার, স্ক্রিপ্ট এডিটর (বোল্ড/হাইলাইট), টেলিপ্রম্পটার, বেল+সাউন্ড, Excel (রানডাউন, কর্মী রিপোর্ট, ব্যাকআপ Excel), ব্যাকআপ JSON, প্রোফাইল, Bin, নোটিশ। ফিরতি পথ: Vercel Deployments → 0f3e0c4-এর ডিপ্লয় "Promote to Production"।
2. **documents বাকেট খুব উদার**: যেকোনো লগইন-করা সদস্য যেকোনো ফাইল মুছতে/বদলাতে পারে; লিংক জানলে যে কেউ দেখতে পারে। পরে: প্রাইভেট বাকেট + signed URL, অন্তত org/মালিক-ভিত্তিক update/delete।
3. **ডক ডুপ্লিকেট**: রিপোর `docs/` আর Project `claude/*` — কোনটা মূল ঠিক করা বাকি।
4. রিপোজিটরি private/public অজানা (GitHub API এই সেশনে 403)। বিক্রি/শেয়ারের আগে Private নিশ্চিত করা।
5. খালি ৪টা প্লেসহোল্ডার ফাইল — মুছে ফেলা বা ব্যবহারের সিদ্ধান্ত।
6. নিয়ম পুনরায়: Antigravity দিয়ে যা-ই করান, **কমিটের আগে ডিফ আমাকে দিন** (আজ Next 16 আমার যাচাই ছাড়া লাইভে গেছে)।

## লঞ্চ (১০ অক্টোবর)
ব্যবহারকারী আজ লঞ্চ করছেন। লঞ্চের আগে: **আসল ব্যাকআপ = কর্তৃপক্ষ → Data → Backup → JSON** (ফুটারের "Backup All" বাদ গেছে); TEST কনটেন্ট মোছা; টিম অ্যাকাউন্ট/রোল/অনুমতি দেখা; ইউজার তৈরি পদ্ধতি (Supabase ফ্রি ইমেইল সীমা) ২–৩ জনে পরীক্ষা; ডিপ্লয়ের পর Ctrl+Shift+R ও Owner+সাধারণ কর্মীর স্মোক টেস্ট; Vercel আগের ডিপ্লয়ে ফেরার পথ জানা। My Work এখন নিজের নামের বাটনের (প্রোফাইল) ভেতরে। লঞ্চের পর শীঘ্রই: রাতের স্বয়ংক্রিয় ব্যাকআপ (pg_dump)।

## বাকি আছে
- ⏳ **ব্যবহারকারীর চোখে-দেখা টেস্ট (মনে করিয়ে দিতে হবে):** My Work-এ role নাম+সংখ্যা; কর্মী রিপোর্ট কলাম; TEST কনটেন্টে লেখক বদলে History-তে "Research & Script"; কর্তৃপক্ষ প্যানেলের ৭ বাটন + ফোনের মাপ; N27 সবুজ বার্তা; N28-এর ৫টা টেস্ট (সম্পূর্ণ→রানডাউন, সময়হীন→পার্কিং, Schedule চাপলে রানডাউনে, Hold→দুই জায়গায়, অসম্পূর্ণ Drop→Bin→Restore); N28c: চ্যানেল/স্লাগ ছাড়া কনটেন্টে সময় দিলে ধূসর "still missing" বার্তা; N29: ফুটারে শুধু থিম/কর্তৃপক্ষ/KPI, কর্তৃপক্ষের ভেতরের বাটনগুলো কাজ করে; N30: প্রোফাইলে "My Work" বাটন (কর্মী ও Manager দুই রোলে), ফুটারে কর্মীর জন্য কিছু নেই; N31: পার্কিংয়ের "Bin (N)" বাটন, পপআপ, Restore, সারি-ক্লিকে ড্রয়ার, Esc, ফোনের মাপ; N32: রানডাউন/পার্কিং/Bin-এর সংখ্যা আগের মতোই, তারিখের পরিধি বদলালেও ঠিকঠাক লোড; N33: ব্যাকআপ JSON ঠিকমতো নামে, কোনো টেবিলে "failed" নেই।
- লাইভ সাইটে (Vercel ডেপ্লয়ের পর) Ctrl+Shift+R দিয়ে একবার দেখা।
- **N34 (যাচাই করে, ঐচ্ছিক):** `fetchRows`-এর দুটো অপ্রয়োজনীয় কোয়েরি সরানো (open-tasks.md)।

## পরবর্তী: বড় DB কাজের পরিকল্পনা (আগে পরিকল্পনা দেখিয়ে অনুমোদন): N12 নোটিশ → N14 Show/Channel আইডি → N10 Show ফর্ম → N15 প্ল্যাটফর্ম ট্র্যাকিং → N17, N11; থিম N13 (branch `themes`)। SQL সবসময় ছোট, যোগ-ভিত্তিক, `begin…commit`, rollback সহ, লাইভে সরাসরি কার্যকর (একই DB) তাই আগে পর্যালোচনা।

## শিক্ষা (প্রম্পট লেখার সময় মনে রাখতে হবে)
- **Antigravity-র রিপোর্টের diff বিশ্বাস করা যায় না (১০ অক্টোবর ঘটেছে):** N28 v3-এর রিপোর্টে এমন diff ছিল যার `nd` ভেরিয়েবল ও "Everything has a publish date." লেখা GitHub কোডে ছিলই না; দুটো প্রম্পট-আইটেম (scheduleParked বার্তা, খালি-বার্তা) রিপোর্টে "করা" বলা হয়েছিল কিন্তু আসল diff-এ ছিল না। নিয়ম: **কমিটের আগে ব্যবহারকারী নিজে diff ফাইলে নেবে** (`git diff <ফাইলগুলো> | Out-File "$env:USERPROFILE\Desktop\n33.diff" -Encoding utf8`) ও চ্যাটে সংযুক্ত করবে; আমি তা পরিষ্কার ক্লোনে `git apply` করে eslint+build চালাই (BOM/CRLF বাদ; ডিফ ফাইলে ইউনিকোড বিকৃত দেখায় — যেমন `ÔÇö`, `ÔÇ£` — সেটা শুধু Out-File-এর সমস্যা, ফাইল ঠিক; যাচাই: `node -e "…s.includes('ÔÇö')…"` → false)। কমিটের পরে পুশ করা ডিফ ও যাচাই-করা ডিফ লাইন ধরে মেলাই। (N29, N28c, N30, N31, N32, N33 এই পদ্ধতিতে সবই প্রথমবারে ঠিক বেরিয়েছে।)
- **নতুন ফাইল থাকলে ডিফে আনতে:** `git add -N <নতুন ফাইল>` তারপর `git diff <ফাইলগুলো>` (status-এ ` A` দেখায়); কমিট প্রম্পটে দুই ফাইলের নাম ধরে `git add`। নতুন সাহায্যকারী ফাংশন নকল ডেটায় আলাদা করে পরীক্ষা করা যায় (N32: `fetchAllPages`)।
- প্রম্পটে অ-ASCII অক্ষর (—, ✓, …) এড়াতে হবে; নতুন টেক্সটে সাধারণ `-` ব্যবহার।
- Antigravity ফাইল তৈরি করে "কোনো temp ফাইল নেই" বলেও `fix_page.js` রেখে গিয়েছিল; কমিটের আগে `git status` দিয়ে `??` লাইন দেখে `Remove-Item` করাতে হয়। (N29-তে `fix_footer*.js` বানিয়ে নিজেই মুছেছিল; "স্ক্রিপ্ট ব্যবহার করবে না" বললেও করে — তাই ডিফ যাচাই জরুরী।)
- `warning: LF will be replaced by CRLF` (Windows): নিরীহ।
- **ফুটার/প্যানেল ডুপ্লিকেট:** কোনো বাটন stub কিনা (`downloadFullSystemBackup` শুধু alert দিত) নতুন বাটন যোগের আগে/পরে পরীক্ষা করা; আসল ব্যাকআপ `BackupModal` (Modals.js)।
- **`ActionButtons` দুটো আছে:** আসল ব্যবহৃত = `components/ui/Shared.js` (~১৭১); `components/ui/ActionButtons.js` মরা ডুপ্লিকেট।
- **`BlurInput` আগে `maxLength` নিত না**; এখন ঐচ্ছিক প্রপ।
- Antigravity-র রিপোর্টে "সব করেছি" বললেও এক জায়গা বাদ যেতে পারে। প্রম্পটে শেষে `Select-String` প্রমাণ চাইতে হবে — এবং আসল diff আলাদা নিতে হবে।
- Antigravity regex/replace-স্ক্রিপ্ট চুপচাপ না-মিলে ব্যর্থ হয় (Windows CRLF); সরাসরি এডিট চাইলেও প্রায়ই স্ক্রিপ্ট ব্যবহার করে। diff-এ কেবল প্রত্যাশিত hunk আছে কিনা মিলিয়ে দেখতে হবে; temp `fix_*.js` মুছতে বলতে হবে।
- নতুন ফাইল (untracked) কমিট প্রম্পটে নাম ধরে `git add`; কমিটের আগে `git status` দেখে অন্য ফাইল থাকলে থামতে বলা।
- নতুন ফিচারে দেখতে হবে: `canEdit`/লক মানে কি না; সেভ ব্যর্থ হলে ডেটা হারায় কি না (`patchRow` সত্য/মিথ্যা ফেরত দেয়)।
- **Supabase প্রতি অনুরোধে সর্বোচ্চ ১০০০ সারি দেয়, চুপচাপ কেটে ফেলে।** নতুন কোয়েরিতে `fetchAllPages(() => supabase…order('id'))` (`utils/fetchAll.js`) ব্যবহার করতে হবে; পাতা ধরা কোয়েরিতে স্থির সাজানো (`id`) জরুরী, নইলে সারি বাদ/ডুপ্লিকেট হয় (ব্যাকআপেও একই — N33)।
- **`position: fixed` ওভারলে Drawer-এর ভেতরে আটকে যায়** (`<aside>`-এ `backdrop-blur`) → `createPortal(…, document.body)`।
- **`app/page.js`-এ window-স্তরের Escape লিসেনার আছে** (`reasonFor, showNew, showAddChannel, showTeam, showKpi, showBin, selectedId`) → নতুন ওভারলের কী-লিসেনার capture ফেজে + `stopPropagation`, অথবা এই চেইনে যোগ। (ড্রয়ারের Esc-blur লিসেনার stopPropagation করে না — ইচ্ছাকৃত।)
- `ModalShell` (Shared.js) `z-[60]`; নতুন পপআপ থেকে ড্রয়ার খুলতে আগে পপআপ বন্ধ করতে হয় (N31)।
- `scrollTop` পূর্ণসংখ্যায় ছাঁটে — দশমিক অবস্থান ref-এ রাখতে হবে।
- **Tiptap 3 StarterKit-এ Underline, Link, TrailingNode, ListKeymap আগে থেকেই আছে**; `shouldRerenderOnTransaction: true` লাগে; কলব্যাক ref-এ।
- `npm install`/`npm ci` ESLint মুছে দেয় → `npm install --no-save eslint@8 eslint-plugin-react eslint-plugin-react-hooks`।
- localhost ও লাইভ একই Supabase। টেস্ট শুধু "TEST" কনটেন্টে।
- GitHub push-এ মাঝে মাঝে 500 দেয়; পরে আবার push।
- **একই ফিল্ড, ভিন্ন লেবেল:** নাম বদলালে অ্যাপের সব দেখানো লেখা `grep` করে একসাথে ধরতে হবে — **এবং ডেটাবেসের ফাংশনের ভেতরের লেখাও**।
- **`CreditSelect` (Drawer.js) বাগ:** অপশন skillKey দিয়ে ছাঁকা হতো; এখন বর্তমান মান সবসময় অপশনে থাকে। `StaffAssignSelect`-ও একই নিয়ম মানে।
- রিপোর্টের role-নামের স্ট্রিং (`roleTotals` কী ও `roles.push`) হুবহু এক হতে হবে।
- পুরনো audit এন্ট্রি ও পুরনো নোটিফিকেশনে "Writer" থেকে যাবে (ইতিহাস; বদলানো হয়নি)।
- টেবিলের ভেতরের ইন্টারঅ্যাক্টিভ কন্ট্রোলে click/mousedown/keydown `stopPropagation` দিতে হয়।
- `patchRow` ব্যর্থতায় লাল টোস্ট দেয়; সফলতার বার্তা ড্রয়ারে "Saved ✓" ও টেবিলে সবুজ টোস্ট (N8, N27) দেয়।
- Antigravity-র `git diff --stat` লাইন-সংখ্যা আগে-পরে ভিন্ন দেখাতে পারে (লাইন-শেষ চিহ্ন); আসল hunk মিলিয়ে দেখতে হবে।
- **ডেটাবেস নিয়ম:** guard ট্রিগার (`guard_contents_update`) তালিকাভুক্ত কলামের বাইরে যেকোনো অ্যাকটিভ সদস্যকে বদলাতে দেয়; নতুন কলাম অরক্ষিত — দরকারে guard-এ নিয়ম।
- `notify(msg, tone = 'info')`: টোন 'error' (লাল), 'success' (সবুজ), বাকি সব ধূসর।
- প্রোফাইল বাটন (হেডার) শুধু `authUser && me` থাকলে আসে; ফুটারের কর্তৃপক্ষ/KPI `actor`-এর উপর নির্ভর করে।
- **ডিফ সেভের নতুন পদ্ধতি (বাংলা ভাঙা এড়াতে, ১১ অক্টোবর):** `git diff --output="$env:USERPROFILE\Desktop\nXX.diff" <ফাইলগুলো>` (পাইপ + Out-File বাংলা অক্ষর নষ্ট করে — cp850 মোজিবেক; সরাসরি `--output` ভালো)। নতুন ফাইল থাকলে আগে `git add -N`।
- **কমিট বার্তায় "Co-Authored-By" ও "Claude-Session" লাইন নয়** — ব্যবহারকারী চান না (১১ অক্টোবর)। কমিট প্রম্পটে শুধু এক লাইনের `git commit -m "..."`।
- Icon নাম `Icons.js`-এর `ICON_PATHS`-এ না থাকলে ফাঁকা SVG দেখায় (ত্রুটি ছাড়া) — নতুন আইকন ব্যবহারে নামটা আছে কিনা মিলিয়ে নিতে হবে।
- Antigravity audit (12 Oct) checked against code: real - bell and info icons missing (fixed N35), multiple createClient (fixed N35), own notice chime (fixed N35), My Work only checks 5 roles (writer, presenter, video_editor, camera_person, uploader) and misses producer, idea_by, vfx, colorist and the others, Tailwind CDN in production, app/page.js too big and every realtime change refetches 7 queries (N34). NOT real: "ghost permission keys" - can_change_channel and can_change_presenter exist in utils/constants.js PERMISSIONS; the real issue is that lib/core.js keeps an older second copy of the PERMISSIONS list without them (drift risk).
- Do not trust an AI audit without checking the code: two of its claims were wrong or exaggerated.

## ব্যবহারকারীর সিদ্ধান্ত
- ট্যাবের টাইটেল শুধু "WaveDesk"।
- মোবাইল তালিকায় স্লাগের রং কনটেন্ট-টাইপ অনুযায়ী রঙিন; ঠিক আছে।
- নিয়ম: নতুন প্রম্পট টাস্ক ফাইলের সাথে না মিললে আমাকে জানাতে হবে।
- রিচ এডিটর: ওপেন সোর্স Tiptap; শুধু বোল্ড/আন্ডারলাইন/হাইলাইট।
- **নাম:** পুরো সিস্টেমে "Writer" নয়, সবখানে "Research & Script"। ডেমো পদবি "Senior Writer" ও ড্রয়ারের "Let writers edit…" টুলটিপ আপাতত অপরিবর্তিত।
- **Save বাটন বাতিল;** তার বদলে "Saved ✓" সূচক + Esc-এ শেষ লেখা সেভ (সম্পন্ন)।
- DB-0 অনুমোদিত ও চালানো হয়েছে।
- **N28 প্লেসমেন্ট নিয়ম** (উপরে)। KPI-তে Draft/Hold/Dropped স্ট্যাটাস সহ থাকবে; পার্সোনাল রিপোর্টেও।
- **N29 (১০ অক্টোবর):** কর্তৃপক্ষ প্যানেলে যা আছে তা ফুটারে নয়; Backup All পুরোপুরি বাদ (প্যানেলের Backup-ই আসল)।
- **N30 (১০ অক্টোবর):** My Work প্রোফাইলের ভেতরে, সবার জন্য (উপায় ১)। N28c একই দিনে ঠিক করা।
- **N31 (১০ অক্টোবর):** Bin আলাদা সেকশন নয়; পার্কিং জোনের শিরোনামের পাশে "Bin (N)" বাটন + পপআপ।
- **N32, N33 (১০ অক্টোবর):** ১০০০ সারির সীমা ও ব্যাকআপের স্থির সাজানো লঞ্চের দিনেই করা।
- **ফাইল ও সার্ভার (৮ অক্টোবর):** Supabase-এ শুধু টেক্সট; অফিসের নিজস্ব সার্ভারে সরানো (লক্ষ্য), কিন্তু আগে ~৬ মাস Supabase+Vercel ফ্রি; কোডবেজ অফিসের সাথে শেয়ার নয় (Docker ইমেজ + লিখিত চুক্তি); কাঁচা ফুটেজ LAN-এ NAS-এ, অ্যাপে ফাইলের পথ দেখানো জরুরী। বিস্তারিত file-management-plan.md।
- **কমিট বার্তায় Claude-এর নাম/সেশন লাইন নয় (১১ অক্টোবর):** ব্যবহারকারী সিদ্ধান্ত নিয়েছেন কমিট মেসেজ হবে ক্লিন ও সরাসরি।
- **AI-তৈরি কোডের কপিরাইট (১১ অক্টোবর):** ব্যবহারের অধিকার সাধারণত ব্যবহারকারীর; ব্যবসায়িক গোপনীয়তা + লিখিত চুক্তি + লাইব্রেরির লাইসেন্স তালিকা নিশ্চিত করা।

## ১৮ অক্টোবর ২০২৬ (N36)
- **ব্যাকআপ (76e0955):** প্রতি রাত ২৩:৩০ (ঢাকা) `pg_dump` (public + auth স্কিমা), gzip + gpg AES256 দিয়ে তালা দেওয়া, GitHub artifact হিসেবে ৩০ দিন। Secrets: `SUPABASE_DB_URL` (Session pooler, পোর্ট 5432) ও `BACKUP_PASSPHRASE` (মালিক আলাদা জায়গায় লিখে রেখেছেন)। প্রথম হাতে-চালানো রান সবুজ, ১১৪ KB। সীমা: স্টোরেজের ফাইল যায় না; ব্যাকআপ GitHub-এই থাকে, তাই মাসে একবার একটা কপি নিজের কম্পিউটারে বা ড্রাইভে রাখা; রিস্টোর পরীক্ষা এখনও বাকি।
- **নিরাপত্তা SQL (ebfdd87):** `documents` বাকেটে update/delete নিয়ম বাদ, insert শুধু সক্রিয় সদস্য; `platforms`-এর তিন নিয়মে সক্রিয় সদস্য যাচাই। বাকেট এখনও পাবলিক (পুরনো লিংক বাঁচাতে); পরে private + signed link। রেফারেন্স/ডকুমেন্ট আপলোড ফিচার মালিক আগেই অ্যাপ থেকে বন্ধ করেছেন।
- **`published_links` সিদ্ধান্ত:** কোনো বদল নয়। ড্রয়ারে যেকোনো সক্রিয় সদস্য লিংক বসাতে পারে (ইচ্ছাকৃত, আপলোডারের জন্য); `guard_contents_update` নিষ্ক্রিয় বা অন্য সংস্থার লোককে আগে থেকেই আটকায়। `can_edit_metadata` বাধ্যতামূলক করলে আপলোডারের কাজ ভাঙত।
- **অনুমতি তালিকার ত্রুটি (f93a864):** চালু UI `lib/core.js`-এর তালিকা ব্যবহার করে, তাতে Change presenter ও Change channel ছিল না, তাই টিম পর্দা থেকে এই দুটো অনুমতি দেওয়া যেত না (অথচ Drawer ও ডাটাবেস গার্ড দুটোই চায়)। যোগ করা হয়েছে; `utils/constants.js`-এর মরা কপি মুছেছে।
- **নকল বাটন (fe93b53):** `exportService.js`-এর `downloadContentArchive`, `downloadKPIReport`, `downloadFullSystemBackup` শুধু `alert` দেখানো placeholder ছিল। ড্রয়ারের "Archive ZIP", Authority-র "KPI report", `download_script` অ্যাকশন ও My Work-এর "Download Zip" সরানো হয়েছে। প্রোফাইলের পুরনো ছবি আপলোড ঘর (`avatars` RLS-এ সবসময় ফেল করত) মুছেছে। "Script copied" এখন `notify`। আসল Archive/KPI রিপোর্ট পরে বানানো হলে বাটন ফেরানো হবে।
- **বাকি পরিষ্কার:** ✅ সবই সম্পন্ন — `confirm()` বদল (e3535f7, ১৯ অক্টোবর); `ExportButtons.js` ও exportService-এর তিন placeholder মোছা (1876cdf, ২০ অক্টোবর)।
- **My Work (703bef2):** আগে মাত্র ৫টা ভূমিকা (Research & Script, Presenter, Video Editor, Cameraman, Publisher) গোনা হতো; এখন Idea, Producer, VFX, Colorist, Light Design, Sound Record, Audio Mixing, Video Switch, Live Audio সহ ১৪টা। নতুন ৯টা শুধু সংখ্যা ০-এর বেশি হলে "ভূমিকা অনুযায়ী মোট"-এ দেখায়।
- **মালিকের লাইভ টেস্ট বাকি:** টিমে নতুন দুই সুইচ, ড্রয়ারের ফুটার, Authority মেনু, My Work, প্রোফাইল ছবি, Copy Script বার্তা, My Work-এ Producer/Idea-ওয়ালা কনটেন্ট।
- **GitHub:** রিপো এখন Public (শুধু যাচাইয়ের জন্য); কাজ শেষে Private করা হবে। workflow ফাইল পুশ করতে টোকেনে `workflow` অনুমতি লাগে।

## ১৯ অক্টোবর ২০২৬ (N36)
- **ConfirmDialog (e3535f7):** ব্রাউজারের কুৎসিত `confirm()` পপআপ দুই জায়গায় বদলে সুন্দর বক্স। Cancel-এ ডিফল্ট ফোকাস (ভুলে Enter চাপলে কিছু মুছবে না); Esc চাপলে শুধু বক্স বন্ধ হয়, নিচের টিম/নোটিশ মোডাল নয়। অ্যাপের স্ক্রিনে এখন কোথাও `window.confirm` বা `alert` আসে না (শুধু `services/exportService.js`-এর মরা placeholder-এ `alert` আছে, ওগুলো কোথাও ডাকা হয় না)।
- **কর্মী রিপোর্টের ভুল (e180bc2):** Employee Report-এ From/To বদলানো যেত, কিন্তু হিসাব হতো শুধু মূল রানডাউনের তারিখ-পরিধির জন্য লোড হওয়া ডাটা থেকে — অন্য মাস/সপ্তাহ বাছলে সংখ্যা নীরবে ভুল/অসম্পূর্ণ আসত। এখন রিপোর্ট নিজের তারিখের জন্য নিজে কনটেন্ট আনে (সর্বোচ্চ ৪০০ দিনের shorts ধরা হয়)। KPI ও My Work এখনও মূল রানডাউনের পরিধির ডাটা ব্যবহার করে (ওদের তারিখ বদলানোর আলাদা উপায় নেই, তাই ঠিক আছে)।
- **N34 যাচাই:** `fetchRows`-এর "সব Draft/Dropped" ও "অতীতের অপ্রকাশিত" কোয়েরি দুটো রানডাউন, Parking Zone, Bin, KPI, My Work কোনোটার জন্য দরকার নেই (Parking/Bin তিনটা অন্য কোয়েরি থেকেই পূর্ণ হয়)। একমাত্র পার্শ্বপ্রভাব: পুরনো তারিখের কনটেন্টের নোটিফিকেশনে চাপলে "Change the date range" বার্তা। ডাটাবেস ছোট (~৯৪৪ kB) বলে লাভ এখন কম; পরে করা হবে।
- **নতুন লিনাক্স পিসি (১৯ অক্টোবর):** প্রজেক্ট `~/Documents/newswave-app`; Antigravity IDE বসানো; Node 22; `git pull` করে `3100301` পর্যন্ত আনা হয়েছে, `npm run build` সফল। `.env.local` এই পিসিতে নেই (কোড বদল, বিল্ড, কমিটের জন্য লাগে না; শুধু লোকালে `npm run dev` চালাতে লাগে)। লিনাক্সে ডিফ সেভ: `git diff --output="$HOME/nXX.diff" <ফাইল>`। পুশে ইউজারনেম `thesudiptasaha` ও পাসওয়ার্ডের জায়গায় টোকেন; পাসওয়ার্ড লাইন কখনও চ্যাটে নয়।
- **মালিকের পরীক্ষা (১৯ অক্টোবর):** ConfirmDialog ও Employee Report পরীক্ষা শেষ, ঠিক আছে।

## ২০ অক্টোবর ২০২৬ (N37)
- **N37-A (1876cdf):** মরা কোড পরিষ্কার — `ExportButtons.js` মোছা, `exportService.js` থেকে তিন `alert` placeholder মোছা (আসল `downloadUserReport` আছে, টিম মোডালে ব্যবহার হয়), `app/page.js`-এর তিনটা ও `Drawer.js`-এর একটা অব্যবহৃত import-লাইন মোছা।
- **N37-B / N34 (1d2c1cb):** `fetchRows` এখন ৫টা কোয়েরি চালায় (আগে ৭টা)। KPI-র "Past due" সংখ্যা বদলায়নি, কারণ KPI মোডাল শুধু বাছা তারিখ-পরিধির কনটেন্ট (`visible`) পায়। মালিক লাইভে রানডাউন, Parking Zone, Bin ও Hold/Drop পরীক্ষা করেছেন, ঠিক আছে।
- **বাকি অব্যবহৃত import:** `app/page.js`, `Drawer.js`, `Modals.js`, `NoticeModal.js`-এ আরও অনেক অব্যবহৃত import ও ভেরিয়েবল আছে (eslint `no-unused-vars` ধরে)। আলাদা পরিষ্কার-কাজ। `services/storageService.js` ও `services/fileUploadProvider.js` এখন কেউ ব্যবহার করে না (আপলোড ফিচার বন্ধ); মুছবে কিনা পরে সিদ্ধান্ত।
- **documents বাকেটের সিদ্ধান্ত (২০ অক্টোবর):** আপলোড ফিচার বন্ধ, তাই বাকেট private ও signed link এখন দরকার নেই। ছোট কাজ বাকি (ঐচ্ছিক): Supabase Storage-এ `documents` বাকেটের পুরনো ফাইল দেখা, অকাজের হলে মুছে `nw_documents_insert_active` নীতি বাদ দেওয়া।
- **N38 ও N39 (লঞ্চের আগের রাত):** অ্যাপে আগে কোনো error পাতা, 404 পাতা ও favicon ছিল না; তিনটাই যোগ হয়েছে (নতুন ফাইল, চলতি কোডে হাত পড়েনি)। favicon এখন লাল বর্গ (`#eb3026`) ও মাঝে সাদা W।
- **লঞ্চ (২১ অক্টোবর, দুপুর ১২টা):** পেশাদার তবে অবাণিজ্যিক লঞ্চ (তাই Vercel Hobby চলবে)। লঞ্চের আগের রাতে কোড বন্ধ (code freeze); শেষ কোড কমিট `caccd8a`। লঞ্চের আগের তালিকা: হাতে JSON ব্যাকআপ, রাতের ব্যাকআপ workflow সবুজ কিনা, Vercel শেষ ডিপ্লয় সবুজ কিনা, নতুন সদস্যের সাইনআপ/আমন্ত্রণ ও Supabase ইমেইল সেটিং। লঞ্চের পরে রিপো Private করা হবে; তখন Claude-এর GitHub অ্যাক্সেস আবার যুক্ত করতে হবে।
- **নাম বদল (২১ অক্টোবর, লঞ্চের আগের রাত):** Vercel প্রজেক্ট `wavedesk`, ঠিকানা `https://wavedesk-manager.vercel.app`; Supabase প্রজেক্টের নাম `wavedesk` (API URL ও key অপরিবর্তিত); GitHub অ্যাকাউন্ট `thesudiptasaha` (আগে `thesudiptasaha-art`) ও রিপো `thesudiptasaha/WaveDesk` (আগে `newswave-app`; পুরনো ঠিকানা GitHub নিজে নতুনটায় পাঠিয়ে দেয়, তবে চিরকাল নয়)। উবুন্টু পিসির স্থানীয় ফোল্ডার এখনও `~/Documents/newswave-app` (ফোল্ডারের নাম বদলানো জরুরি নয়); সেখানে `git remote set-url origin https://github.com/thesudiptasaha/WaveDesk.git` দিতে হয়।
- **N41 নোটিশ বাটন হেডারে (7e3837f):** আগে Notification-এর ঘণ্টা ছিল হেডারে আর স্টেশন নোটিশ বাটন ছিল ফুটারে (দুটোতেই ঘণ্টা আইকন, দূরে দূরে)। এখন নোটিশ বাটন হেডারে ঘণ্টার ঠিক আগে, নিজস্ব ক্লিপবোর্ড আইকনসহ; ছোট পর্দায় শুধু আইকন। দুটোর কাজ আলাদা তাই একত্র করা হয়নি: Notification ব্যক্তিগত (আমার কাজ/ঘটনা), নোটিশ বোর্ড পুরো স্টেশনের ঘোষণা। মালিক লাইভে পরীক্ষা করেছেন, ঠিক আছে।

## পদ ও অ্যাক্সেস পরিকল্পনা (২১ অক্টোবর ২০২৬, সিদ্ধান্ত)
- **সমস্যা:** টিম পর্দায় একই গ্রিডে ২০টা টগল মেশানো — ৮টা আসল অ্যাক্সেস আর ১২টা আসলে পদ। নামের ধরন মেলে না ("Can be Cameraman", "Visual Effects", "Edit script"), একই পদ জায়গাভেদে আলাদা নামে (Uploader/Publisher, Research & Script/Can Write & Submit)। Idea ও Publisher-এর নিজস্ব টিক নেই।
- **সিদ্ধান্ত:** চার স্তর — Authority, Designation, Roles, Access (বিস্তারিত ও নামের তালিকা `docs/open-tasks.md`-এর "পদ ও অ্যাক্সেস পুনর্গঠন" লাইনে)। সব পদ ব্যক্তির নামে (Writer, Camera Operator, VFX Artist...), Access ক্রিয়া+বিষয় (Write & Edit Scripts, Review Videos...)।
- **ধাপ:** (ক) SQL — `team_members`-এ `can_idea`, `can_publish` যোগ ও ভরা; (খ) রিপোতে SQL-এর রেকর্ড-ফাইল; (গ) কেন্দ্রীয় পদ-তালিকা, নাম এক করা; (ঘ) টিম পর্দা Roles/Access দুই ভাগে; (ঙ) ড্রয়ারে Idea ও Publisher নতুন টিক ব্যবহার করবে; (চ) প্রোফাইলে নিজের Roles/Access শুধু দেখা; (ছ) ডক। প্রতিটা ধাপ আলাদা কমিট। পরে (লঞ্চের পরে): মালিকের "Add role", নতুন পদ (Graphic Designer, Sound Designer, Motion Graphics Artist, Voice-over Artist, Reporter), Designation টেমপ্লেট। Copy Editor আপাতত দরকার নেই (মালিকের সিদ্ধান্ত)।
- **নিরাপত্তা:** টিম টেবিলের অনুমতি বদল শুধু ওনার ও ম্যানেজার (ডাটাবেস গার্ড আগে থেকেই); সাধারণ সদস্য নিজের শুধু নাম, ছবি ও designation বদলাতে পারেন।
- **ভবিষ্যৎ কাঠামো (Django-র সময়):** সব পদ একটা JSON তালিকায় রাখলে নতুন পদে আর SQL লাগবে না।

## ২১–২২ অক্টোবর ২০২৬ (লঞ্চের পরে: টিমের তথ্য ও ডাকনাম)
- **লঞ্চ:** ২১ অক্টোবর ২০২৬-এ অ্যাপ চালু হয়েছে।
- **নতুন তথ্য (N44–N48):** `team_members`-এ `employee_id`, `phone`, `whatsapp` (সবই ঐচ্ছিক)। Employee ID শুধু ওনার ও ম্যানেজার বদলাতে পারেন (ম্যানেজারের নিজেরটা ওনার); ফোন ও WhatsApp সদস্য নিজেও বদলাতে পারেন। ডাটাবেস গার্ড `guard_team_members` সেই অনুযায়ী বদলানো (`sql/2026-10-21_team_contact_fields.sql`)। সদস্য যোগের ফর্ম, টিম প্যানেল ও প্রোফাইলে ঘর যোগ হয়েছে। ফুটারে "Directory" বাটন: সব সদস্য দেখতে পান (শুধু দেখা), খোঁজা যায়, ফোনে চাপলে কল ও WhatsApp লিংক খোলে।
- **ডাকনাম (N49–N52):** `nickname` — ইংরেজি অক্ষরে এক শব্দ, ১–২০ অক্ষর, সংগঠনে ইউনিক (বড়-ছোট হাতের অক্ষর এক ধরা হয়) (`sql/2026-10-22_team_nickname.sql`)। নিজের প্রোফাইল ও টিম প্যানেলে লেখা যায়। রানডাউনের চিপ, ড্রপডাউন, ড্রয়ারের ক্রেডিট তালিকা ও হেডারে ডাকনাম দেখায়; না থাকলে পুরো নাম (আগের "নামের প্রথম শব্দ" নিয়ম বাদ)। সংরক্ষিত মান সবসময় পুরো নাম, তাই পুরনো কনটেন্ট ও হিস্ট্রি অক্ষত। টিম প্যানেল, ডিরেক্টরি, রিপোর্ট, হিস্ট্রি ও নোটিশে পুরো নাম থাকে। ডাটাবেসের ত্রুটি এখন "This nickname is already taken" ধরনের সহজ বার্তা হয়ে আসে।
- **একই সময়ের SQL:** `can_idea`, `can_publish` (`sql/2026-10-21_team_idea_publish_roles.sql`) ডাটাবেসে আছে, অ্যাপ এখনো ব্যবহার করে না (পদ পুনর্গঠনের ধাপ গ-তে ব্যবহার হবে)।
- **ফাঁক বন্ধ (N54, ২২ অক্টোবর):** `guard_team_members`-এ সাধারণ সদস্য এখন নিজের পদের ১৪টা টিকও (`can_write` থেকে `can_live_audio`, সাথে `can_idea`, `can_publish`) বদলাতে পারেন না; লাইভে পরীক্ষিত (`sql/2026-10-22_guard_role_ticks.sql`)।

## ২২ অক্টোবর ২০২৬ (পদ ও অ্যাক্সেস পুনর্গঠন সম্পন্ন)
- **কী হলো:** টিম প্যানেলের ২০টা মেশানো টগল এখন দুই ভাগ — ১৬টা Roles (কে কোন কাজ করেন; ক্রেডিট তালিকায় নাম আসে) ও ৮টা Access (কে কী করতে পারেন)। সব নাম ব্যক্তির পদ বা ক্রিয়া+বিষয়। ডাটাবেসের কলামও একই নামে (`role_…` ও `can_…`)।
- **অ্যাপের কোড (শাখা `roles-rename`, মেইনে ফাস্ট-ফরওয়ার্ড মার্জ, শেষ কোড কমিট b8be752):** R1 কেন্দ্রীয় তালিকা (`lib/core.js`), R2 ড্রয়ারের ক্রেডিট, R3 মডাল ও StaffAssignSelect, R4 `app/page.js` ও এক্সপোর্ট, R5 টিম প্যানেল দুই ভাগে, R6 প্রোফাইলে নিজের Roles/Access (শুধু দেখা)।
- **ডাটাবেস (এক রাতে, এক লেনদেনে; `sql/2026-10-22_roles_access_rename.sql`):** `team_members`-এর ২১টা কলামের নাম বদল ও নতুন `role_graphic_designer`, `role_voice_over_artist`; `contents`-এ `publisher`→`published_by`, `uploader`→`publisher`, `idea_by`→`concept_creator`, `camera_person`→`camera_operator`, `vfx`→`motion_graphics_designer`, `video_switcher`→`live_video_switcher`, `live_audio`→`live_audio_mixer`, নতুন `graphic_designer`, `voice_over_artist`; চার ফাংশন (guard_team_members, guard_contents_update, cascade_member_rename, notify_content_update) নতুন নামে। আগাম যাচাই ও পরের যাচাই-কোয়েরি পাস; আর কোনো ফাংশন, policy বা view-তে পুরনো নাম নেই।
- **নোটিফিকেশনের লেখা (`sql/2026-10-22_notify_status_message.sql`):** স্ট্যাটাস বদলের বার্তা এখন "<নাম> moved <কনটেন্ট> from <পুরনো ধাপ> to <নতুন ধাপ>"। আগের "(by …)" দেখে মনে হতো ওই ব্যক্তি এডিটর অ্যাসাইন করেছেন।
- **লাইভ পরীক্ষা:** টিম প্যানেল, Role সেভ, ড্রয়ারের ক্রেডিট, প্রোফাইল ও নোটিফিকেশন ঠিক কাজ করেছে।
- **ডক্স:** `schema-reference.md` ও `schema-snapshot.md` নতুন নামে (N58, N59)।
- **বাকি:** সদস্যদের Roles টিক ঠিক করা (Publisher আগের uploader থেকে, Concept Creator আগের Idea-র ভিত্তিতে ভরা হয়েছিল); "সহজ করার তালিকা" (`docs/open-tasks.md`)।

## ২৫ অক্টোবর ২০২৬ (N92)
- **টেলিপ্রম্পটার ফুল-উইডথ ও অটো ফুলস্ক্রিন (N92):**
  - ডিফল্টে স্ক্রিপ্ট টেক্সট পুরো স্ক্রিনের প্রস্থ জুড়ে (`w-full px-6 sm:px-14`)। প্রম্পটার টেক্সট/স্ক্রোলারে ক্লিকে মাঝারি/সংকীর্ণ প্রস্থ (`max-w-4xl px-8`) ও ফুল-উইডথে টগল (বর্তমান সেশনের জন্য, লোকালস্টোরেজে সংরক্ষণ নয়)।
  - Drawer-এর "Script Play" বোতামে ক্লিক করলে স্বয়ংক্রিয়ভাবে ব্রাউজার ফুলস্ক্রিন (`requestFullscreen`) চালু হয় (ইউজার অ্যাকশন হ্যান্ডলারে সরাসরি কল)।
  - ফুলস্ক্রিন থেকে ব্রাউজারের Esc চেপে বের হলে `fullscreenchange` শুনে ড্রয়ারে ফিরে আসে (`onClose`)।
  - যেকোনো পথে বন্ধ হলে (Esc, Close বাটন, আনমাউন্ট) সক্রিয় ফুলস্ক্রিন থাকলে তবেই নিরাপদে `exitFullscreen` করে ও লিসেনার পরিষ্কার করে। Fullscreen API ব্যর্থ হলে ফিক্সড ওভারলে স্বয়ংক্রিয়ভাবে সক্রিয় থাকে।
  - বিদ্যমান কন্ট্রোল, গতি, ফন্ট সাইজ, মিরর ও wake lock অপরিবর্তিত।
- **Script Play বোতাম ড্রয়ারের স্ক্রিপ্ট টেক্সটের উপরে (N92):**
  - Drawer.js-এ "Script Play" বোতাম স্ক্রিপ্ট বক্সের নিচে থেকে স্ক্রিপ্ট টেক্সটের উপরে স্থানান্তরিত; শর্ত (`isFeatureEnabled('teleprompter') && text.trim()`) অপরিবর্তিত।
- **PC-তে ড্রয়ার ওয়াইড ও ২-কলাম লেআউট (N92):**
  - ড্রয়ার `<aside>`-এর সর্বোচ্চ প্রস্থ PC-তে (lg: ১০২৪px+) বাড়িয়ে `lg:w-[94vw] lg:max-w-[1600px]` করা হয়েছে। ফোন ও ট্যাবলেটে পূর্বের `max-w-[580px]` বহাল।
  - বড় পর্দায় ফিল্ডগুলোর দৃষ্টিসুবিধা বজায় রাখতে Editorial, Packaging ও QC ট্যাবে ২-কলামের সুবিন্যস্ত গ্রিড লেআউট এবং Script ট্যাবে `max-w-5xl mx-auto` কনটেইনার যুক্ত করা হয়েছে। অনুমতি, ফিল্ড, বোতাম ও লজিক সম্পূর্ণ অক্ষত।
  - লাইট ও ডার্ক দুই থিমেই থিম সিএসএস ক্লাস সামঞ্জস্যপূর্ণ।

## ২৫ অক্টোবর ২০২৬ (N96)
- **ড্রয়ার পুনর্গঠন ও স্ক্রিপ্ট একীকরণ (২৫ অক্টোবর ২০২৬, N96):** ড্রয়ারের প্রতিটি ট্যাবে PC-তে স্থায়ী বাম "Details" প্যানেল (`lg:w-[470px]`; Channel, Scheduled publish, Slug, Title, Thumbnail text, Archive shelf ID, Target platforms; পারমিশন অপরিবর্তিত) এবং ফোনে উপরে টগলযোগ্য "Details" বার (Editorial-এ ডিফল্ট খোলা, অন্য ট্যাবে বন্ধ); আলাদা Script ট্যাব বাদ দিয়ে Editorial ট্যাবের ডানপাশে স্ক্রিপ্ট অন্তর্ভুক্ত (রিডিং ভিউ ও এডিটর, শব্দ গণনা, অন-এয়ার সময়, Copy Script, Lock/Unlock Script এবং টেলিপ্রম্পটার খোলার জন্য সবুজ গ্লোয়িং "Play Script" বোতাম, স্ক্রিপ্ট খালি থাকলে নিষ্ক্রিয়); ড্রয়ারের ট্যাব এখন ৪টি: Editorial, Production, Packaging, QC & Audit।

## ২৫ অক্টোবর ২০২৬ (N98)
- **Packaging ট্যাব Publish নামে পরিবর্তন ও রিডিজাইন (২৫ অক্টোবর ২০২৬, N98):** ড্রয়ারের Packaging ট্যাবের নাম বদলে "Publish" করা হয়েছে (অভ্যন্তরীণ tab id 'packaging' অপরিবর্তিত); ডান পাশের কনটেন্ট এলাকা একক কলামে সাজানো: Publisher (Production ট্যাবের Publishing কার্ডের সাথে সমন্বিত CreditSelect, PC-তে অর্ধেক প্রস্থে), Post caption (৬ লাইন), SEO keywords/tags (৬ লাইন), Hashtags (৪ লাইন), প্রতিটির সাথে ক্যারেক্টার/ট্যাগ/হ্যাশট্যাগ কাউন্টার ও Copy বাটন (কপি সফল হলে ১ সেকেন্ড "Copied" টিক দেখায়, রিড-অনলি অবস্থাতেও কার্যকর), প্রতি প্ল্যাটফর্মের Published Links (স্মার্টফোনে ১ কলাম, sm ও উপরে ২ কলাম), এবং ডিভাইডারের নিচে অপরিবর্তিত Short Content সেকশন (শর্টস তালিকা ও add-short ফর্ম লজিক অক্ষত)।

## ২৫ অক্টোবর ২০২৬ (N100)
- **ড্রয়ারের ফুটার একক সারিতে পুনর্বিন্যাস (২৫ অক্টোবর ২০২৬, N100):** ড্রয়ারের ফুটার এখন এক সারির (ONE row)। PC-তে এটি ডিভাইডার লাইন থেকে শুরু হয় (স্থায়ী Details প্যানেলের নিচে খালি স্পেসার থাকে): বাঁ পাশে "Next step" লেবেল ও মূল অ্যাকশন বাটনসমূহ (Resume ও Restore সহ); একেবারে ডান পাশে Hold, Drop ও Delete permanently। Download/Copy script বাটন আর ফুটারে নেই (Editorial ট্যাবে Copy Script বিদ্যমান)। পারমিশনের অভাবে Delete, Hold ও Drop লুকিয়ে না গিয়ে তালা আইকনসহ ধূসর (লকড) অবস্থায় দৃশ্যমান থাকে (Published, Dropped ও On Hold কনটেন্টের ক্ষেত্রে Hold ও Drop প্রযোজ্য নয় বলে থাকে না)। ফোনে ফুটার দুই সারিতে বিভক্ত: উপরে Next step ও মূল বাটনসমূহ, নিচে ডানে Hold, Drop ও Delete।

## ২৫ অক্টোবর ২০২৬ (N102)
- **Presenter তালিকার নিয়ম ও New Content ফর্মে পারমিশন লক (২৫ অক্টোবর ২০২৬, N102):** প্রতিটি Presenter তালিকায় (ড্রয়ারের Production ট্যাব, রানডাউন লিস্ট ও কার্ডের ইনলাইন পিকার, New Content ফর্ম এবং Bulk add টেবিল) এখন কেবল সক্রিয় সদস্য যাদের "Presenter" পদ টিক দেওয়া (`role_presenter`) রয়েছে, এবং সক্রিয় Owner ও Manager-রা উপস্থিত থাকেন; পূর্বে অ্যাসাইন করা কোনো প্রেজেন্টার যদি পরবর্তীতে যোগ্যতা হারান তবে সংশ্লিষ্ট কনটেন্টে তার নাম দৃশ্যমান থাকে। এই একক নিয়মটি `lib/core.js`-এর `presenterMembers` হেলপারে বাস্তবায়ন করা হয়েছে। New Content ফর্মে "Assign Presenter" (`can_assign_presenter`) পারমিশন না থাকলে Presenter ফিল্ডটি লকড (তালা আইকন ও ডিসেবলড) থাকে এবং ফর্মে কোনো ডিফল্ট নাম বসে না (খালি থাকে)।

## ২৬ অক্টোবর ২০২৬ (N104)
- **ড্রপডাউন ও ডার্ক থিম সিলেক্ট টেক্সট ফিক্স (২৬ অক্টোবর ২০২৬, N104):** ডার্ক থিমে ড্রপডাউন অপশনের টেক্সট অদৃশ্য হওয়ার সমস্যা সমাধানে `app/layout.js`-এ গ্লোবাল সিএসএস যুক্ত (ডার্ক থিমে background `#121215`, text `#f4f4f5` ও `color-scheme: dark`; লাইট থিমে background `#ffffff`, text `#1c1917` ও `color-scheme: light`)। সমস্ত ড্রপডাউনে অভিন্ন লুক দিতে `components/ui/Shared.js`-এর `SelectBox` কম্পোনেন্ট ব্যবহার: ড্রয়ারের `CreditSelect`, Bulk add টেবিলের ৫টি ড্রপডাউন (Channel, Content type, Writer, Presenter, Video Editor) এবং Notice priority এখন `SelectBox` ব্যবহার করে। তালিকায় না থাকলেও বর্তমান মান অপশন হিসেবে বজায় থাকে যাতে অপসারিত সদস্যও দৃশ্যমান থাকে। `StaffAssignSelect.js` ও `app/page.js`-এর ৩টি সিলেক্ট অপরিবর্তিত।

## ২৬ অক্টোবর ২০২৬ (N106)
- **স্ক্রিপ্ট প্রিন্টেড পেপার লুক ও script_saved_at ট্রিগার (২৬ অক্টোবর ২০২৬, N106):** ড্রয়ারের Editorial ট্যাবে স্ক্রিপ্টটি (রিডিং ভিউ ও এডিটর উভয়েই) একটি শেয়ার্ড "printed paper" ব্লকে (`.script-paper`, সিএসএস `app/layout.js`-এ) উপস্থাপিত। ডার্ক ও লাইট উভয় থিমেই পেপার সর্বদা হালকা রঙে থাকে (ডার্ক থিমে `#f6f1e4`, লাইট থিমে `#fffefa`) এবং টেক্সট ডার্ক ইংক `#1c1814`। পেপারের শীর্ষে থাকে অভিন্ন হেডার: "WAVEDESK · SCRIPT" ও চ্যানেল নামসহ আপারকেস লেটার-স্পেসড মাস্টহেড (নিচে ডাবল রুল), বড় সেরিফ টাইটেল (ডেস্কটপে ২৮px, ফোনে ২২px), এবং চিকন দাগ দিয়ে ঘেরা বাইলাইন যাতে রয়েছে "লেখক" (টিম তালিকায় থাকলে ডাকনাম, অন্যথায় পুরো নাম), "তারিখ" (`contents.script_saved_at` বাংলা ফরম্যাটে, এশিয়া/ঢাকা টাইমজোন অনুযায়ী যেমন "২৬ অক্টোবর ২০২৬") এবং "আইডি" (`row.content_uid`)। ড্রয়ারের উপরের টুলবার (Play Script, Lock, Copy, Edit এবং এডিটের সময় Cancel / Save script) এবং পেপারের নিচের Cancel / Save script বোতাম অক্ষত। এডিটর (`ScriptEditor.js` ও ফলব্যাক textarea) পেপারের নিজস্ব ট্র্যান্সপারেন্ট বক্সে গাঢ় ইংক টেক্সট, ডার্ক ক্যারেট, ধূসর প্লেসহোল্ডার এবং পেপারে স্পষ্ট দৃশ্যমান ফরম্যাটিং টুলবার প্রদর্শন করে (ন্যূনতম উচ্চতা ৩২০px)।
- **ডাটাবেস ও ট্রিগার (`sql/2026-10-26_script_saved_at.sql`):** `contents.script_saved_at` কলাম (timestamptz) যুক্ত এবং `trg_contents_script_saved_at` ট্রিগার দ্বারা স্ক্রিপ্ট পরিবর্তন হলে স্বয়ংক্রিয়ভাবে সংরক্ষিত সময় বসে (অ্যাপ কখনো এটি সরাসরি লেখে না); বিদ্যমান স্ক্রিপ্টগুলোর ক্ষেত্রে কনটেন্ট তৈরির সময়কাল (`created_at`) দিয়ে ব্যাকফিল করা হয়েছে।

## ২৬ অক্টোবর ২০২৬ (N108)
- **প্রোডাকশন ট্যাবে স্টাফ ফটো টাইলস ও ২-কলাম লেআউট (২৬ অক্টোবর ২০২৬, N108):** ড্রয়ারের Production ট্যাবে "Staff assignment" অংশটি সম্পূর্ণ পুনর্গঠিত: সদস্যরা এখন গোল ফটো টাইল আকারে দৃশ্যমান (`Avatar` কম্পোনেন্ট দিয়ে ছবি বা ইনিশিয়াল, ডাকনাম এবং ছোট রোলের নাম; খালি স্লটে ড্যাশড বৃত্তের ভেতর "+" ও নিচে "Assign" এবং রোলের নাম)। প্রতিটি টাইলের ওপর স্বচ্ছ নেটিভ `<select>` বসানো হয়েছে, ফলে টাইলে ক্লিকেই ওএস পিকার খোলে (মোবাইলেও কার্যকর); হোভার করলে সদস্যের পুরো নাম ও পদবি (designation) দেখা যায়। পারমিশন না থাকলে টাইলটি আবছা (dimmed) দেখায় এবং ছোট তালা আইকন থাকে (কোনো পিকার খোলে না)।
- **গ্রুপ ও ২-কলাম লেআউট:** ১০২৪px বা তদূর্ধ্ব পর্দায় গ্রুপ কার্ডগুলো ২-কলামে বসে (`lg:columns-2 gap-4`, বাঁ কলামে Idea + Post-Production এবং ডান কলামে Production Crew + Publishing); নিচে ১ কলাম। Presenter-কে Idea থেকে Production Crew-তে স্থানান্তর করা হয়েছে:
  - **Idea & Script:** Concept Creator ও Research & Script Writer (২টি টাইল)।
  - **Production Crew:** Producer, Presenter, Camera Operator, Teleprompter Operator, Light Designer, Sound Recordist, Voice Over Artist (৭টি টাইল)।
  - **Post-Production, Publishing ও Live Crew:** পূর্বের ফিল্ড অক্ষত।
  - পারমিশন নিয়ম অপরিবর্তিত: Presenter পরিবর্তন করতে `can_assign_presenter` অনুমতি প্রযোজ্য; ড্রপডাউনে সংশ্লিষ্ট রোলের টিকধারী সদস্য এবং ওনার ও ম্যানেজাররা থাকেন (Presenter-এ `presenterMembers`)।

## ২৬ অক্টোবর ২০২৬ (N110)
- **রানডাউন পিসি লিস্ট ভিউ কমপ্যাক্ট ও স্টাফ ফটো টাইলস (২৬ অক্টোবর ২০২৬, N110):** পিসির Rundown List view টেবিলটি (`hidden md:block`) আরও স্লিম ও কমপ্যাক্ট করা হয়েছে যাতে ১৩৬৬×৭৬৮ রেজোলিউশনের ল্যাপটপে অনুভূমিক স্ক্রলিং ছাড়াই সুন্দরভাবে ধরে (টেবিলের ন্যূনতম প্রস্থ ১১০০px):
  - **চ্যানেল হেডার ব্যান্ড:** চ্যানেল হেডার সারিগুলো এখন পাতলা অ্যাকসেন্ট ব্যান্ড (~৩৪px উচ্চতা, `py-1.5` সেল প্যাডিং), যা ফোনের List view-এর মতো একই `chan-band` ও `chan-band-count` সিএসএস ক্লাস ব্যবহার করে (ডার্ক ও লাইট থিমে সঠিক রঙ); চ্যানেলের নাম বাঁ পাশে, এক্সপ্যান্ড/কোলাপ্স তীরচিহ্ন এবং ডানে কাউন্ট পিল; আগের দুটি ফেডিং দাগ বাদ দেওয়া হয়েছে; ক্লিকে কোলাপ্স/এক্সপ্যান্ড আচরণ অক্ষত; শেষ সারি ও পরবর্তী ব্যান্ডের মাঝে ~৬px ফাঁকা জায়গা বজায় রাখা হয়েছে।
  - **কমপ্যাক্ট কনটেন্ট সারি:** সারিগুলোর উচ্চতা কমিয়ে সাধারণ কনটেন্টে প্রায় ৭০px করা হয়েছে (সেলগুলোতে `py-1.5` প্যাডিং); বাঁ পাশের স্ট্যাটাস স্ট্রাইপ, Time + StatusBadge, TypeBox, বোল্ড আপারকেস স্লাগ নেম (১৮px থেকে ১৭px করা হয়েছে), ShortNote এবং Action বাটন অক্ষত; সারিতে ক্লিকে ড্রয়ার ওপেন হয়।
  - **স্টাফ অ্যাসাইনমেন্ট ফটো টাইলস:** `components/ui/StaffAssignSelect.js`-এ নতুন `StaffCell` লেআউট `"tiles"` যোগ করা হয়েছে (শুধু এই পিসি লিস্ট ভিউতে ব্যবহৃত): পাশাপাশি তিনটি ফটো টাইল (Script Writer, Presenter এবং LIVE কনটেন্ট ছাড়া Video Editor); প্রতিটি টাইল প্রায় ৮৪px প্রশস্ত; বৃত্তাকার ছবি (`Avatar` h-9 w-9 বা ইনিশিয়াল), ডাকনাম (সাদা, ১২px সেমিবোল্ড ট্রাঙ্কেট), নিচে ছোট আপারকেস গ্রে রোল নেম (SCRIPT WRITER, PRESENTER, VIDEO EDITOR)। ফাঁকা স্লটে ড্যাশড বৃত্তের ভেতর "+" এবং "Assign"; পারমিশন না থাকলে আবছা ড্যাশড বৃত্তে "—" এবং "Not assigned" (ক্লিকযোগ্য নয়)।
  - **ক্লিকে সিলেক্ট ড্রপডাউন ও হোভার:** টাইলে হোভার করলে পুরো নাম ও পদবি ("Full Name (Designation)") দেখা যায় (ফাঁকা এডিটেবল স্লটে "Assign <role>"); টাইলে ক্লিক করলে পুরো টাইলের উপর থাকা স্বচ্ছ নেটিভ `<select>` ড্রপডাউন খোলে (`stopPropagation` থাকায় ড্রয়ার খোলে না); পূর্বের সব পারমিশন রুলস এবং অপশন তালিকা অক্ষত; কিবোর্ড ফোকাসে টাইলের চারপাশে দৃশ্যমান রিং বসে।
  - **অপরিবর্তিত অংশ:** কার্ড ভিউ, ফোন ভিউ (List/Cards), PhoneCard/RundownCards.js, ড্রয়ার ও পার্কিং জোন টেবিল অপরিবর্তিত রাখা হয়েছে।

## ২৬ অক্টোবর ২০২৬ (N112)
- **ড্রয়ারের ল্যাপটপ কমপ্যাক্ট লেআউট ও লাল গোল ক্লোজ বাটন (২৬ অক্টোবর ২০২৬, N112):**
  - **কমপ্যাক্ট হেডার:** ড্রয়ারের হেডার আরও স্লিম করা হয়েছে (উচ্চতা ল্যাপটপে ~১০৫px, আগে ~১৬৫px; প্যাডিং `px-4 sm:px-5 lg:px-6 pb-0 pt-3`): শীর্ষ লাইনে টাইপ ব্যাজ, স্ট্যাটাস ব্যাজ, স্ক্রিপ্ট ডিউরেশন ব্যাজ (যদি থাকে), এবং কনটেন্ট আইডি (বাঁ পাশে) এবং সেভ স্ট্যাটাস টেক্সট + ক্লোজ বাটন (ডান পাশে); দ্বিতীয় লাইনে স্লাগ নেম (ল্যাপটপে ২২px, আগে ২৪px) এবং একই লাইনে এর ঠিক পরেই ধূসর টেক্সটে চ্যানেল ও শিডিউলড সময় ("Channel · Date Time"); পাবলিশড-লিংক চিপস ল্যাপটপে ট্যাব সারির ডান পাশে বসে (ফোনে ট্যাবের উপরে `mt-1.5` দিয়ে আলাদা লাইনে); ট্যাব সারি ঠিক নিচে `mt-1.5` মার্জিনে এবং ট্যাব বাটনগুলোতে `py-2` প্যাডিং।
  - **লাল গোল ক্লোজ বাটন:** সব স্ক্রিন সাইজে ড্রয়ারের ক্লোজ বাটনটি এখন একটি লাল বৃত্তাকার বোতাম (`h-8 w-8 rounded-full bg-red-500/15 text-red-300 ring-1 ring-red-400/30 transition hover:bg-red-500 hover:text-white`, ভেতরে X আইকন, `drawer-close-btn` ক্লাস); লাইট থিমে মেরুন টিন্ট ওভাররাইড (`app/layout.js`-এর `lightCss`-এ `background-color: rgba(128, 44, 44, 0.12)`, `#822929`, হোভারে `#802c2c` ও সাদা টেক্সট)।
  - **স্লিম Details প্যানেল ও ফুটার (ল্যাপটপ ১০২৪px+):** বাম পাশের ফিক্সড Details প্যানেলের প্রস্থ ল্যাপটপে ৪৪০px করা হয়েছে (`lg:w-[440px]`, আগে ৪৭০px), প্যাডিং `px-5 py-4`; `app/layout.js`-এ ১০২৪px+ এর জন্য স্কোপড সিএসএস ক্লাস `.details-compact` যোগ করা হয়েছে যাতে ইনপুট ও সিলেক্ট বক্সের উচ্চতা ~৩৪px (`py-1.5`, টেক্সট ১৩px), লেবেল ১০.৫px (ইনপুটের সাথে ৪px গ্যাপ), সেকশন গ্যাপ `gap-2.5` ও `space-y-3`, এবং টার্গেট প্ল্যাটফর্ম চিপস ছোট (`px-2.5 py-1 text-[11.5px] lg:gap-1.5`) হয়; ফলে ১৩৬৬×৭৬৮ রেজোলিউশনে চারটি ট্যাবেই কোনো স্ক্রলিং ছাড়া সম্পূর্ণ Details প্যানেল দেখা যায় (মালিকের টেস্টে নিশ্চিত হবে)। ফুটারের উচ্চতা ল্যাপটপে কমানো হয়েছে (`py-2`, বাটনগুলোর উচ্চতা ~৩৪px, ক্লাস `drawer-footer-compact`, টার্গেট উচ্চতা ~৪৮px); ফুটারের বাঁ পাশের খালি স্পেসার Details প্যানেলের সাথে সামঞ্জস্য রেখে ৪৪০px করা হয়েছে। ফোনে কোলেপসিবল বার ও ফুটারের ২-সারি লেআউট অপরিবর্তিত।

## ২৮ অক্টোবর ২০২৬ (N114)
- **ড্রয়ার হেডার: বড় কনটেন্ট আইডি ও Copy ID বোতাম (২৮ অক্টোবর ২০২৬, N114):**
  - **স্লাগ লাইনে বড় কনটেন্ট আইডি:** ব্যাজ সারির ছোট ধূসর কনটেন্ট আইডি বাদ দেওয়া হয়েছে। কনটেন্ট আইডি এখন স্লাগ লাইনের একেবারে ডান প্রান্তে (`flex-grow` স্পেসার ও `lg:ml-6`) বড় হরফে বসে (`font-mono font-extrabold text-[14px] sm:text-[15px] lg:text-[19px] text-zinc-200 shrink-0 whitespace-nowrap`, ল্যাপটপে ১৯px, ডার্ক থিমে হালকা ধূসর/সাদা এবং লাইট থিমে `#3d372f` ডার্ক টেক্সট; ল্যাপটপে কোনো ট্রাঙ্কেশন হয় না)।
  - **Copy ID বোতাম:** আইডির ঠিক পরেই একটি ছোট রাউন্ডেড পিল বোতাম (`type="button"`, `aria-label="Copy content ID"`, `text-[11px]`, কপি আইকন ও "Copy ID" টেক্সট); ক্লিকে শুধু `row.content_uid` কপি হয় এবং বোতামটির লেবেল প্রায় ২ সেকেন্ডের (১.৮ সে.) জন্য "Copied!"-এ পরিবর্তিত হয়ে আবার ফিরে আসে; ড্রয়ার বন্ধ হলে বা রো পরিবর্তিত হলে টাইমার ক্লিনআপ হয়। `row.content_uid` খালি থাকলে আইডি বা বোতাম প্রদর্শিত হয় না।
  - **ফোনে লেআউট (below lg):** ফোনে স্লাগ লাইনের নিচে আইডি ও Copy ID বোতাম বাঁ-প্রান্ত ঘেঁষে নিজস্ব আলাদা লাইনে (`w-full`, ১৪px) বসে। স্লাগ ট্রাঙ্কেশন অক্ষত থাকে এবং হেডারের উচ্চতা বৃদ্ধি পায় না।

## ২৮ অক্টোবর ২০২৬ (N115)
- **ড্রয়ার ডিটেইলস প্যানেল: লম্বা স্ক্রিনে স্বাভাবিক, শুধু খাটো ল্যাপটপে কমপ্যাক্ট (২৮ অক্টোবর ২০২৬, N115):**
  - **স্বাভাবিক ডিফল্ট লেআউট (লম্বা ডেস্কটপ):** ড্রয়ারের বাঁ পাশের ফিক্সড Details প্যানেলটি ডিফল্টে স্বাভাবিক ও খোলামেলা (প্রস্থ ৪৭০px, প্যাডিং `1.5rem` / `px-6 py-6`, সেকশন ও গ্রিড গ্যাপ ১৬px / `gap-4`, প্ল্যাটফর্ম চিপস `px-3 py-1.5 text-[12px]` এবং কন্টেইনার গ্যাপ ৮px / `gap-2`, ইনপুট ও লেবেল সাইজ স্বাভাবিক)।
  - **খাটো ল্যাপটপ স্ক্রিনে কমপ্যাক্ট (`@media (min-width: 1024px) and (max-height: 850px)`):** স্ক্রিন কমপক্ষে ১০২৪px প্রশস্ত এবং সর্বোচ্চ ৮৫০px উঁচু হলে (যেমন ১৩৬৬×৭৬৮ রেজোলিউশনের ল্যাপটপ) `app/layout.js`-এর সিএসএস মিডিয়া কোয়েরি সক্রিয় হয়: Details প্যানেলের প্রস্থ ৪৪০px ও প্যাডিং `1rem 1.25rem` (`px-5 py-4`); `.details-compact` ক্লাসে `display: flex; flex-direction: column; gap: 12px` ও চাইল্ড মার্জিন রিসেট; সেকশন ও গ্রিড গ্যাপ ১০px; ইনপুট/সিলেক্ট উচ্চতা ৩৪px (টেক্সট ১৩px); লেবেল ১০.৫px; প্ল্যাটফর্ম চিপস ছোট (`padding: 4px 10px`, ফন্ট ১১.৫px, কন্টেইনার গ্যাপ ৬px)। ফলে ছোট ল্যাপটপে সব ফিল্ড সুন্দরভাবে ধরে। ১৯২০×১০৮০ বা তার চেয়ে লম্বা স্ক্রিনে এই নিয়ম প্রযোজ্য হয় না এবং প্যানেলটি পূর্বেকার মতো খোলামেলা থাকে।
  - **ফুটার স্পেসার সামঞ্জস্য:** `app/layout.js`-এ `.drawer-left-col` এবং `.drawer-left-spacer` ক্লাসের মাধ্যমে ফুটারের বাঁ পাশের খালি স্পেসারটির প্রস্থ সর্বদা Details প্যানেলের সাথে হুবহু সমান রাখা হয় (লম্বা স্ক্রিনে ৪৭০px, খাটো স্ক্রিনে ৪৪০px), ফলে উভয় স্ক্রিন সাইজেই খাড়া ডিভাইডার লাইনটি নিখুঁতভাবে মেলে।

## ২৮ অক্টোবর ২০২৬ (N116)
- **ড্রপ করা প্রকাশিত কনটেন্ট: "Published, later removed" ও রিস্টোর (২৮ অক্টোবর ২০২৬, N116):**
  - **প্রকাশিত কনটেন্ট ড্রপ করার সুবিধা:** Published স্ট্যাটাসের কনটেন্ট এখন ড্রপ করা যাবে, শুধুমাত্র Manager এবং Owner রোলের সদস্যরা এই পদক্ষেপ নিতে পারবেন। এর জন্য কারণ (reason) উল্লেখ করা বাধ্যতামূলক (মোডাল টাইটেল: "Drop published content?", ব্যাখ্যা: "This was already published. It stays on the rundown, shown in grey as Published, later removed, and the reason you write is saved in the Activity log.", নিশ্চিতকরণ বোতাম "Drop it")। Published কনটেন্টের ক্ষেত্রে Hold অপশনটি যথারীতি অনুপলব্ধ থাকবে।
  - **স্ট্যাটাস ব্যাজ ও লেবেল:** ড্রপ করার পর কনটেন্টটি রানডাউনে ধূসর রঙে থাকে এবং স্ট্যাটাস চিপের টেক্সট সর্বত্র "Published, later removed" হিসেবে প্রদর্শিত হয় (PC rundown list, PC cards, Phone list, Phone cards, Parking zone table, Drawer header)। `components/ui/Badges.js`-এর `StatusBadge`-এ ঐচ্ছিক `removed` প্রপ যোগ করা হয়েছে এবং `lib/core.js`-এর সাহায্যকারী ফাংশন `isRemovedPublished(row)` (`row.status === 'Dropped' && !!(row.published_at || row.went_live_at)`) দ্বারা এটি নিয়ন্ত্রিত হয়।
  - **পুনরুদ্ধার (Restore) ও মূল টাইমস্ট্যাম্প সংরক্ষণ:** `isRemovedPublished(row)` সত্য হলে Restore বোতাম চাপলে কনটেন্টটি Draft-এর বদলে সরাসরি Published স্ট্যাটাসে ফেরত যায় এবং এর মূল `published_at`, `published_by` ও `went_live_at` টাইমস্ট্যাম্প অপরিবর্তিত থাকে (পুনরায় পাবলিশের সময়কাল ওভাররাইট হয় না)।
  - **ড্রয়ার QC ও অডিট:** ড্রয়ারের QC & Audit ট্যাবে ড্রপ করার কারণ সম্বলিত বক্সটির শিরোনাম "Dropped"-এর পরিবর্তে "Removed after publishing" হিসেবে প্রদর্শিত হয়। কোনো ডাটাবেস পরিবর্তন প্রয়োজন হয়নি।

## ২৮ অক্টোবর ২০২৬ (N117)
- **A4 ফরম্যাটে স্ক্রিপ্ট প্রিন্ট (২৮ অক্টোবর ২০২৬, N117):**
  - **প্রিন্ট বোতাম (Editorial ট্যাব):** স্ক্রিপ্ট ট্যাবের টুলবারে (Play Script, Lock, Copy Script-এর পাশে) নতুন "Print" বোতাম যোগ করা হয়েছে (স্টাইল `btnGhost`)। সংরক্ষিত স্ক্রিপ্ট না থাকলে বা স্ক্রিপ্ট ফাঁকা হলে এটি নিষ্ক্রিয় ও ধূসর থাকে (`title="No script to print"`)। স্ক্রিপ্ট এডিটিং চলাকালীনও এটি নিষ্ক্রিয় থাকে (`title="Print saved script only"`), যাতে শুধু সংরক্ষিত স্ক্রিপ্টই প্রিন্ট হয়। স্ক্রিপ্ট দেখতে পারেন এমন যে কেউ অতিরিক্ত কোনো অনুমতি ছাড়াই এটি ব্যবহার করতে পারেন।
  - **A4 প্রিন্ট শীট ও পোর্টাল (`ScriptPrintSheet`):** প্রিন্ট চাপলে `printing=true` স্টেট সেট হয় এবং `document.body`-তে `createPortal`-এর মাধ্যমে `#script-print-root` যুক্ত হয় (শুধু প্রিন্টের সময়ই এটি DOM-এ রেন্ডার হয়; স্ক্রিনে `@media screen` দিয়ে এটি লুকানো থাকে)। `requestAnimationFrame`-এর পর `window.print()` কল করা হয় এবং `window.afterprint` ইভেন্টে স্টেট রিসেট ও লিসেনার পরিষ্কার হয়। একাধিকবার প্রিন্ট ডায়ালগ ওঠা রোধে `printedRef` গার্ড ও `onAfterPrintRef` ব্যবহার করা হয়েছে।
  - **পৃষ্ঠা ১ (স্ক্রিপ্ট):** উপরে মাস্টহেড রো বাঁ দিকে "WAVEDESK · SCRIPT" এবং ডান দিকে চ্যানেলের নাম ও নিচে ডাবল রুল; বড় বোল্ড সেরিফ ফন্টে শিরোনাম; পাতলা রুলে বাইলাইন: লেখক (ডাকনাম বা পুরো নাম), তারিখ (এশিয়া/ঢাকা সময় অনুযায়ী বাংলায় `script_saved_at`), এবং কনটেন্ট আইডি; এরপর এডিটর পেপারের হুবহু একই বাংলা সেরিফ ফন্টে জাস্টিফাইড বডি টেক্সট (বোল্ড, আন্ডারলাইন ও হাইলাইট অক্ষত)। কোনো ফুটার বা পৃষ্ঠা নম্বর নেই।
  - **পৃষ্ঠা ২ (স্ক্রিপ্ট সম্পর্কিত তথ্য):** নতুন পৃষ্ঠায় শুরু (`break-before: page`), মাস্টহেড "WAVEDESK · SCRIPT INFORMATION" ও ডান দিকে কনটেন্ট আইডি, শিরোনাম, এবং ছোট আপারক্লেস শিরোনাম ও পাতলা রুলের দুই কলামের টেবিল: Details (স্লাগ, শিরোনাম, থাম্বনেইল হুক, ধরন ও স্ট্যাটাস [ড্রপ করা প্রকাশিত হলে "Published, later removed"], চ্যানেল, নির্ধারিত সময়, প্ল্যাটফর্মসমূহ, আর্কাইভ শেলফ আইডি, স্ক্রিপ্ট সেভ তারিখ/সময় ও পরিসংখ্যান), Staff (নির্ধারিত ক্রমে অ্যাসাইন করা কর্মীদের ডাকনাম/পুরো নাম), Activity Log (সবশেষটি আগে, তারিখ-সময়, ভূমিকা সহ ব্যক্তি ও কী ঘটেছে), এবং Revisions & Notes (থাকলে)। সাদা কাগজ ও কালো কালিতে প্রিন্ট হয়।

## ২৯ অক্টোবর ২০২৬ (N118)
- **নতুন কনটেন্ট আইডি ফরম্যাট (২৯ অক্টোবর ২০২৬, N118):** New content ID look: IDs are WAVECON-YYYYMMDD_XXXX (creation day, Asia/Dhaka, daily counter from 0001, never reused, existing contents converted once on 29 Oct 2026); shorts are <content ID>-short_0001; folder icon before the ID in the drawer header and on the printed script; the storage folder is named exactly the content ID.

## ২৯ অক্টোবর ২০২৬ (N121)
- **চারটি নতুন ক্রু রোল ও একক উৎস রোল তালিকা (২৯ অক্টোবর ২০২৬, N121):**
  - **চারটি নতুন পদ ও ডাটাবেস কলাম (`sql/2026-10-29_new_crew_roles.sql`):** চার নতুন পদ যোগ: Production Manager, Set Designer, Makeup Artist, Data Wrangler (সবগুলো Production Crew গ্রুপে; `team_members`-এ `role_production_manager`, `role_set_designer`, `role_makeup_artist`, `role_data_wrangler` বুলিয়ান কলাম এবং `contents`-এ `production_manager`, `set_designer`, `makeup_artist`, `data_wrangler` টেক্সট কলাম; রেকর্ড: `sql/2026-10-29_new_crew_roles.sql`)। এখন মোট ২১টি রোল।
  - **একক উৎস `ROLE_LIST` (`lib/core.js`):** `lib/core.js`-এর `ROLE_LIST` এখন সমস্ত রোলের একক উৎস। প্রতিটি এন্ট্রিতে `key`, `label`, `field`, টিম মোডালের জন্য `group` এবং ড্রয়ারের জন্য `drawerGroup` (idea, crew, post, publish, live) সংজ্ঞায়িত। সাহায্যকারী ফাংশন `rolesInDrawerGroup(groupId)` এক্সপোর্ট করা হয়েছে।
  - **ড্রয়ার ও অন্যান্য উপাদান:** ড্রয়ারের `STAFF_GROUPS` এখন `ROLE_LIST` থেকে ডাইনামিকভাবে তৈরি হয়; Production Crew কার্ডে ক্রমানুসারে ১১টি টাইল দেখা যায়; `HIDE_BY_TYPE.PACKAGE`-এ খালি থাকলে ক্রুর ৮টি ফিল্ডই লুকানো থাকে; স্ক্রিপ্ট প্রিন্ট শীট (`ScriptPrint.js`), রানডাউন সার্চ ফিল্টার, Excel এক্সপোর্ট (প্রতি রোলের জন্য আলাদা কলাম), ইউজার রিপোর্ট এবং ডেমো ডেটা সবই `ROLE_LIST` থেকে চালিত।
  - **ডাটাবেস গার্ড ও নোটিফিকেশন:** `guard_team_members` (সদস্যরা নিজেদের নতুন টিক বদলাতে পারবেন না), `cascade_member_rename` (নাম বদলালে নতুন ৪টি কলামেও নাম হালনাগাদ) এবং `notify_content_insert` ও `notify_content_update` (২১টি ক্রেডিট কলামে যুক্ত ব্যক্তিরা স্ট্যাটাস ও অ্যাসাইনমেন্ট নোটিফিকেশন পান)-এ নতুন কলামগুলো অন্তর্ভুক্ত করা হয়েছে।

## ২৯ অক্টোবর ২০২৬ (N119)
- **নোটিফিকেশন নিয়ম ও সাউন্ড আপডেট (২৯ অক্টোবর ২০২৬, N119):**
  - **সংযুক্ত ব্যক্তিদের জন্য নোটিফিকেশন (`sql/2026-10-29_notify_connected_only.sql`):** স্ট্যাটাস বদলের নোটিফিকেশন এখন শুধুমাত্র সেই কনটেন্টে যুক্ত কর্মীদের কাছে যায় — সব ১৭টি ক্রেডিট কলামে (writer, presenter, video editor, camera operator, concept creator, producer, publisher, motion graphics designer, graphic designer, voice over artist, colorist, light designer, sound recordist, teleprompter operator, audio mixer, live video switcher, live audio mixer) নাম থাকা সক্রিয় সদস্যরা। এছাড়া বিশেষ ধাপে সংশ্লিষ্টরা পান: Script Submitted, Video Review ও Ready to Publish ধাপে Owner ও Manager; Script Submitted ধাপে can_approve_scripts পারমিশনধারীরা; এবং Video Review ধাপে can_review_videos পারমিশনধারীরা। যিনি নিজে পরিবর্তন করেছেন তিনি কোনো নোটিফিকেশন পান না। নতুন কাউকে যেকোনো ক্রেডিটে অ্যাসাইন করলে তিনি "You were assigned as <role> on <label>" নোটিফিকেশন পান (তৈরি ও আপডেট উভয় ক্ষেত্রেই)। স্টেশন নোটিশ অপরিবর্তিত (সবার জন্য)।
  - **উন্নত নোটিফিকেশন সাউন্ড ও কন্ট্রোল (`utils/notifySound.js`, `NotificationBell`):** চাইম সাউন্ড আরও স্পষ্ট ও লাউডার (৮৮০ Hz ও ৬৬০ Hz-এর দুই-নোট "ডিং-ডং", সাইন ও ট্রায়াঙ্গেল ওয়েভের মিশ্রণ, পিক গেইন ০.৩৫)। ড্রপডাউন হেডারে স্পিকার আইকন বোতাম দিয়ে সাউন্ড অন/অফ টগল করা যায় (ব্রাউজারের `localStorage`-এ `wd-sound-enabled` কী হিসেবে সংরক্ষিত)। নিচে একটি "Test sound" বোতাম যোগ করা হয়েছে; ব্রাউজার অডিও ব্লক করলে ৪ সেকেন্ডের জন্য নির্দেশনামূলক বার্তা দেখায় ("Your browser blocked the sound. Click anywhere on the page and try again.")। সাউন্ড বন্ধ থাকলে বেল আইকনের কোণে একটি ক্ষুদ্র (১০px) মিউটেড স্পিকার আইকন দেখা যায়। ব্রাউজার অডিও সাসপেন্ড করলে ক্লিক, কি-প্রেস, ট্যাব ফোকাস বা ভিজিবিলিটি পরিবর্তনের সাথে সাথে অডিও কনটেক্সট নিজে থেকেই রিজ্যুম হয়।

## ২৯ অক্টোবর ২০২৬ (N122)
- **ড্রয়ারের ৫টি ট্যাব ও নতুন Credits ট্যাব (২৯ অক্টোবর ২০২৬, N122):**
  - **ট্যাবের ক্রম ও বিন্যাস:** ড্রয়ারের হেডারে এখন ৫টি ট্যাব: Editorial, Production, Publish (অভ্যন্তরীণ id `packaging`), QC & Audit, Credits (সবার শেষে)। বাঁয়ের Details কলাম আগের মতোই প্রতিটি ট্যাবে উন্মুক্ত ও দৃশ্যমান থাকে।
  - **সিঙ্গেল গ্রুপ কার্ড ও ভিজিবিলিটি হেলপার (`components/ui/Drawer.js`):** একক গ্রুপ কার্ডকে `StaffGroupCard({ group, row, actor, team, patch, className })` কম্পোনেন্টে আলাদা করা হয়েছে। `HIDE_BY_TYPE` এবং `LIVE` ক্রু প্রদর্শনের নিয়মাবলী একক সাহায্যকারী ফাংশন `visibleFieldsFor(group, row)`-এ স্থানান্তর করা হয়েছে, যা দৃশ্যমান ফিল্ডের তালিকা রিটার্ন করে।
  - **`StaffAssignment` রিফ্যাক্টরিং:** `StaffAssignment` এখন `groups` (গ্রুপ আইডির অ্যারে, ডিফল্ট সব গ্রুপ) এবং ঐচ্ছিক `title` প্রপ গ্রহণ করে। Production ট্যাবে শুধু `<StaffAssignment groups={['crew']} ... />` (কার্ড টাইটেল "Production Crew") প্রদর্শিত হয়।
  - **Publish ট্যাবে ফাইল লিংক স্থানান্তর:** Production ট্যাব থেকে "Files & links" বাদ দেওয়া হয়েছে এবং Publish ট্যাবে Publisher ড্রপডাউনের ঠিক নিচে "File links" সেকশনে ৩টি `LinkRow` (Raw footage, Project file, Master export) যোগ করা হয়েছে, সাথে ড্রাইভ ফোল্ডারের নাম কনটেন্ট আইডির মতো হওয়ার হিন্ট।
  - **নতুন Credits ট্যাব (`CreditsTab`):** উপরে সম্পূর্ণ প্রস্থে Production Crew গ্রুপ কার্ড; নিচে দুই কলামের গ্রিড (`grid grid-cols-1 lg:grid-cols-2 gap-4 items-start`): বাঁ কলামে Idea & Script, Publishing, Live Crew (নিয়ম অনুযায়ী শুধু লাইভ কনটেন্টে); ডান কলামে Post-Production এবং নতুন "Credit line" কার্ড।
  - **Credit line কার্ড:** ছোট শিরোনাম "Credit line", "Copy credits" বোতাম (`copyText` হেলপার, ১৮০০ms চেকমার্কসহ 'Copied!', কেউ ক্রেডিটেড না থাকলে বোতাম নিষ্ক্রিয়); রিড-অনলি টেক্সট এরিয়া (`readOnly`, `rows={4}`, `select-all`), যাতে `ROLE_LIST` ক্রমানুসারে অ্যাসাইন করা রোলের নাম "Label: Full name" ফরম্যাটে " · " (U+00B7) দিয়ে যুক্ত থাকে (কেউ না থাকলে ধূসর ইটালেকে "No one is credited yet."); নিচে হিন্ট "Everyone who worked on this content, in one place." এবং ট্যাবের নিচে ফুটনোট। কোনো ডাটাবেস পরিবর্তন নেই।

## পরে করব
- **ফুটার ঠিক করা (মালিকের পর্যবেক্ষণ, ২১ অক্টোবর):** ঠিক কী ভুল তা মালিক স্ক্রিনশটসহ জানাবেন; লঞ্চের পরে।
- **Employee Report (ও অন্য রিপোর্ট) পপ-আপ হিসেবে খোলা (মালিকের পর্যবেক্ষণ):** কোন কোন রিপোর্ট ও কীভাবে তা মালিক জানাবেন; লঞ্চের পরে।
- **নোটিশ ও Notification একত্র করার ধাপ ২ (ঐচ্ছিক):** একটাই ঘণ্টা, ভেতরে দুই ট্যাব; বড় কাজ, আগে N41 ব্যবহার করে দেখে সিদ্ধান্ত।
- ~~মরা `components/ui/ActionButtons.js` সরানো।~~ ✅ আগেই মুছে ফেলা হয়েছে।
- ~~`services/exportService.js`-এর stub `downloadFullSystemBackup`~~ ✅ মুছে ফেলা হয়েছে (1876cdf)।
- Drawer টুলটিপ "Let writers edit…" বদলাবে কিনা — সিদ্ধান্ত।
- `StaffCell` প্রতি সারিতে নামের তালিকা নতুন করে বানায় (ছোট কাজ)।
- DB পরিষ্কার: পুরনো ডুপ্লিকেট কলাম (writer_name, editor_name, script_body, raw_footage_url, presenter, script_locked) ও `team_members_legacy`; `channels.name` গ্লোবাল ইউনিক (N14-এর সময়); (guard-এ skill-flag/নতুন কলামের নিয়ম ✅ N54-এ হয়েছে)।
- **স্ক্রিপ্ট ড্রাফটের গোপনীয়তা:** শেয়ার করা কম্পিউটারে লগআউটের পর আগের জনের ড্রাফট দেখা যেতে পারে — সিদ্ধান্ত।
- `purgeOldDrafts`-এ নষ্ট ড্রাফট লুপের মাঝে মোছা (বিরল); কিছু ফাইলের শুরুতে অদৃশ্য BOM (ক্ষতিহীন)।
- টেলিপ্রম্পটারে বোল্ড/হাইলাইট দেখানো; টেলিপ্রম্পটারে ক্লিকার (প্রেজেন্টেশন রিমোট) সমর্থন (open-tasks ঙ); রিচ এডিটর নতুন কনটেন্ট ফর্মে/লিস্ট/ইটালিক; Tiptap আপগ্রেড আলাদা কাজ।
- Django-তে গেলে স্ক্রিপ্ট HTML সার্ভারে নিরাপদ করতে `nh3`/`bleach` (একই whitelist: p, br, strong, u, mark)।
- Next.js 14.2.15-এ নিরাপত্তা সতর্কতা — আলাদা আপগ্রেড কাজ। (DONE: upgraded to Next 16.4 / React 19.3 in commit 7a5c1a6, 11 Oct)
- Antigravity "Allow" সেটিংস; D2 byproduct নাম, D3 role ticks, N21 level 2, রেভিনিউ ধাপ।
- Vercel Hobby (ফ্রি) প্ল্যান অবাণিজ্যিক কাজের জন্য — শর্ত যাচাই।
