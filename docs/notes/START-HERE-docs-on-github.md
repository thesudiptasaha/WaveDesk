# WaveDesk — মূল ডকুমেন্ট কোথায় ও কাজের ধরন (হালনাগাদ: ৯ নভেম্বর ২০২৬)

**মূল ডকুমেন্ট GitHub রিপোর `docs/` ফোল্ডারে** (github.com/thesudiptasaha/wavedesk, ব্রাঞ্চ main; রিপো Public)। ডকুমেন্ট একাধিক জায়গায় রাখা হবে না; বিরোধ হলে GitHub-ই সঠিক। পরিকল্পনার নোট (সিদ্ধান্ত ও ধারণা) `docs/notes/`-এ। শেষ যাচাই-করা কমিট: **7cfcc58** (N145)। লাইভ: https://wavedesk-manager.vercel.app

## কোন কাজের জন্য কোন ফাইল
| বিষয় | ফাইল |
|---|---|
| অগ্রগতির লগ, কমিট তালিকা | `docs/progress-log.md` |
| বাকি কাজ | `docs/open-tasks.md` |
| AI-এর নিয়ম | `docs/RULES.md`, `docs/django-ready-rules.md` |
| Antigravity কাজ ও প্রম্পট | `docs/antigravity-tasks.md`, `docs/antigravity-prompts.md` |
| ডেটাবেস কাঠামো | `docs/schema-reference.md`, `docs/schema-snapshot.md` |
| SQL (সব বদল ও রেকর্ড) | `sql/*.sql` (লাইভ চালানো ফাইলের প্রথম লাইন `-- already run live on <তারিখ>`) |
| রাতের অটো ব্যাকআপ | `.github/workflows/db-backup.yml` (Secrets: `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE`) |
| ব্লুপ্রিন্ট | `docs/blueprint-index.md` থেকে (`blueprint-en.md`, `blueprint-bn.md`) |
| ফাইল/সার্ভার পরিকল্পনা, ব্যবসা, Django রূপান্তর | `docs/file-management-plan.md`, `docs/business-and-operations.md`, `docs/architecture-django-transition.md` |
| পরিকল্পনা ও সিদ্ধান্তের নোট | `docs/notes/` |
| Mockups (Claude Design canvas sources) | `docs/design/` |
| Continue with a new Claude account | `docs/notes/HANDOVER.md` |

## প্রজেক্ট
Next.js 16.4.2 (App Router) + React 19 + Supabase (RLS, ট্রিগার, Realtime) + Vercel। Vercel প্রজেক্ট `wavedesk`, Supabase প্রজেক্ট `wavedesk`, GitHub `thesudiptasaha/wavedesk`। প্যাকেজ বদল শুধু মালিকের অনুমতিতে, আলাদা কমিটে।

## পদ, রোল ও অ্যাক্সেস
- **Authority:** Owner / Manager / General। **Access:** ৮টা অনুমতি (`can_write_edit_scripts`, `can_approve_scripts`, `can_edit_content_details`, `can_change_channel`, `can_reschedule_content`, `can_assign_video_editor`, `can_assign_presenter`, `can_review_videos`)।
- **Roles:** ২১টা `role_…` টিক; অনুমতি নয়, শুধু ঠিক করে কে কোন ক্রেডিট তালিকায় আসবেন। `lib/core.js` `ROLE_LIST` একক উৎস। **Owner ও Manager কোনো রোল-তালিকায় আসেন শুধু ওই রোলের টিক থাকলে** (৭ নভেম্বর থেকে; ৮ নভেম্বর ২১টি টিক ইতিহাস থেকে বসানো হয়েছে, `sql/2026-11-08_backfill_owner_manager_role_ticks.sql`)। নতুন Owner/Manager-এর টিক Team মডালে হাতে দিতে হবে।
- অ্যাপ এখনও **নাম** (full_name) দিয়ে ক্রেডিট ধরে। "সবকিছু আইডি দিয়ে" পরের প্রজেক্ট; নতুন টেবিল শুরু থেকেই আইডি দিয়ে।
- `contents`: `published_by` = কে Publish চেপেছেন, `publisher` = প্রকাশের কাজ যিনি করেন, `published_at` = বোতাম চাপার সময়, `went_live_at` = আসল লাইভের সময়।

## পাইপলাইন ও স্ট্যাটাস
Draft → Script Submitted → Ready for Shoot → Shooting → Assign Editor → Editing → Video Review → Ready to Publish → Scheduled (ঐচ্ছিক) → Published; এছাড়া On Hold, Dropped, Re-Shoot। LIVE: স্ক্রিপ্ট অনুমোদন → Published। PACKAGE: স্ক্রিপ্ট + কাঁচা ফুটেজ → Assign Editor (শুট নেই)। প্রকাশিত কনটেন্ট Drop হলে "Published, later removed"।

## মূল ফিচারের সিদ্ধান্ত (সংক্ষেপে; বিস্তারিত blueprint ও progress-log-এ)
- **ড্রয়ার:** ৬ ট্যাব, StepBar (`components/ui/StepBar.js`), ধাপ পেরোলে সবুজ গ্লো (`stepProgress` in `lib/core.js`)। স্টাফ অ্যাসাইন Production ট্যাবে (ক্রু), Post-production ট্যাবে এডিটিং ক্রু ও Files received/Problem।
- **Production নিয়ম:** ক্রু বদলাতে পারেন Manager/Owner, Producer, Production Manager; রোল-টিকধারী শুধু খালি ঘরে নিজেকে বসাতে/সরাতে পারেন; Publisher একইভাবে সুরক্ষিত। Shoot সময়, Files delivered (একবার; Undo শুধু Manager/Owner কারণসহ), Problem → Problem fixed।
- **"Did it go out?":** Scheduled/Ready to Publish কনটেন্টের নির্ধারিত সময়ের ১০ মিনিট পরে প্রশ্ন সক্রিয়। নিয়োজিত Publisher (বা Manager) উত্তর দেন: গিয়েছে / নতুন সময় / Manager-এর সাহায্য (নোট বাধ্যতামূলক)। রানডাউনে প্রতি চ্যানেলের সবার ওপরে পিন করা সারি (তারিখ/সার্চ/স্ট্যাটাস ফিল্টার উপেক্ষা, চ্যানেল ফিল্টার মানে); শুধু নিয়োজিত Publisher-এর পিল লাল-নীল ঝলকায়। Publisher হিসেবে নির্ধারিত সময় বদলাতে পারেন যিনি `role_publisher` টিকধারী ও নিজের কনটেন্টে।
- **নোটিফিকেশন:** শুধু সংযুক্তদের (ক্রেডিটেড + কিছু ধাপে Owner/Manager, অনুমোদনকারী, ভিডিও রিভিউয়ার); নোটিশ সবার কাছে; যিনি বদলান তিনি পান না।
- **রানডাউন:** ফোনে List/Cards, PC-তে List (চ্যানেল ব্যান্ড, ভাঁজ) ও Card; আইডি বক্স; বিজ্ঞাপনদাতা ব্যাজ।
- **নতুন কনটেন্ট ফর্ম:** PC-তে বড় দুই-কলাম প্যানেল; Writer ও Concept Creator-এ লগইন করা সদস্য বসে (শুধু সেই রোলের টিক থাকলে)।
- **টেলিপ্রম্পটার:** কনটেন্টের স্ক্রিপ্ট থেকে চলে (Play Script); পূর্ণ প্রস্থ, ফুলস্ক্রিন। কনটেন্ট ছাড়া চালানোর মেনু পরে (`teleprompter-menu-notes.md`)।
- **ভাষা:** অ্যাপের সব দৃশ্যমান লেখা ইংরেজি। স্লাগ শুধু ইংরেজি A-Z, 0-9, স্পেস, হাইফেন, বড় হাতের, সর্বোচ্চ ২৪ (বাংলা বাদ)।
- **থিম:** Light/Dark; লাইটে জলপাই সবুজ বাটন, মেরুন বিপদের বাটন। হেডার/ফিল্টার নকশা বদল শুধু মালিকের সম্মতিতে (ডক-কাজে অনুমতি আছে)।

## কাজের ধরন (Claude + Antigravity)
- মালিক বাংলা/ইংরেজি/বাংলিশে বলেন; Claude সহজ বাংলায় বোঝায়, আলোচনা করে ঠিক করে, তারপর **ইংরেজি প্রম্পট** লেখে। মালিক "হ্যাঁ" না বলা পর্যন্ত SQL বা প্রম্পট নয়; একটা একটা করে।
- Antigravity (উইন্ডোজের এজেন্ট) প্রম্পট চালায়; Claude কখনও পুশ করে না। কোড-প্রম্পটে কমিট/পুশ নেই, ডিফ (`nXXX.diff`, Desktop-এ), build ও ESLint পুরো আউটপুটসহ; Claude ডিফ পড়ে রিভিউ করে। ডক্স+কমিট আলাদা, পুশ আলাদা; পুশের পর Claude রিপো `git pull` করে যাচাই করে।
- কমিট বার্তায় কোনো trailer লাইন নেই।
- SQL মালিক Supabase SQL Editor-এ চালান (লাইভ ফাংশনের লাইন CRLF, প্যাচ এক লাইনে); লাইভ চালালে রিপোতে রেকর্ড ফাইল।
- UI নকশা: আগে টেক্সট/ছবির মকআপ দেখিয়ে পছন্দ নেওয়া।
- রিপো Public: কোনো key, পাসওয়ার্ড, সার্ভারের ঠিকানা, আসল কনটেন্ট, গোপন নোট (বিজনেস প্ল্যান, নিরাপত্তা রিভিউ) রিপোতে নয়।
- নম্বর ও কমিটের মিল: `docs/notes/task-number-tracker.md`। পরের নম্বর **N146** (N144 সংরক্ষিত)।

## এখন বাকি
`docs/notes/roadmap.md` দেখুন। সংক্ষেপে: বাইরের ক্রু আমন্ত্রণ ফিচার সম্পন্ন (পাবলিক পেজসহ) → স্ক্রিপ্ট প্রিন্ট পুনর্গঠন, ফিক্স ও অটো লাইন-স্পেসিং ফিট সম্পন্ন (N142, N145, N143; টেস্ট বাকি) → স্ক্রিপ্ট এডিটরে পাতা-ভাঙার দাগ (N144) → Telegram বট → ডক ও হোম পেজ (ডকের জায়গা অনুমোদন বাকি) → Credits PDF → নিরাপত্তার বাকি → বাকি পরের তালিকা। ব্যবহারকারীর স্থগিত: Bulk schedule পুনর্ভাবনা। ব্যাকআপ রিস্টোর পরীক্ষা মালিকের পরে করার কাজ।
