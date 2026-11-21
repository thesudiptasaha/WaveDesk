# WaveDesk — পরিকল্পনা ও কাজের তালিকা (হালনাগাদ: ২১ নভেম্বর ২০২৬)

শেষ যাচাই-করা কমিট: d3aad53 (N160); N161 committed (not pushed); পরবর্তী কাজ মালিকের সাথে আলোচনা করে ঠিক করা হবে (প্রার্থী: Report page, card preview for approval, in-app card editor, sample folder structure for the 7 channels, Next.js security upgrade, notifications for cards)। বিস্তারিত অগ্রগতি রিপোর `docs/progress-log.md`, বাকি কাজ `docs/open-tasks.md`, নম্বর-কমিট মিল `task-number-tracker.md`। এখানে শুধু দিক ও ক্রম।

## ২৭ অক্টোবরের পর যা হয়ে গেছে
- ড্রয়ার: বড় আইডি + Copy ID, Details প্যানেল (উচ্চতা অনুযায়ী), ৬ ট্যাব (Editorial, Production, Post-production, Publish, QC & Audit, Credits), StepBar-এ সবুজ গ্লো (ধাপ পেরোলে)।
- A4 স্ক্রিপ্ট প্রিন্ট পুনর্গঠন, ফিক্স, অটো লাইন-স্পেসিং ফিট ও এডিটরে পাতা-শেষের দাগ (N142, N145, N143 ও N144; ২য় পেজ বাদ, ১ম পেজে লোগো হেডার ও ডাবল রুল, প্রতি পেজে মার্জিন ফুটার — বাঁয়ে আইডি ডানে পাতা, পাবলিক বুকিং পেজের ব্ল্যাঙ্ক প্রিন্ট ফিক্স, পাতা বাঁচাতে লাইন স্পেসিং ২.০ থেকে ১.৬ অটো ফিট utils/printFit.js, ড্রয়ার এডিটরে পাতা-শেষের দাগ ও সামারি লাইন; টেস্ট বাকি); প্রকাশিত কনটেন্ট Drop ("Published, later removed"); নতুন কনটেন্ট আইডি `WAVECON-YYYYMMDD_XXXX`।
- ২১ রোল (`ROLE_LIST` একক উৎস); সংযুক্তদের নোটিফিকেশন; Production crew/Shoot নিয়ম ও Shoot কার্ড; Publisher পাহারা; Files delivered; Post-production Received/Problem/Problem fixed; এডিটিং ক্রু ডিফল্ট ফিল।
- বিজ্ঞাপনদাতা তালিকা, Sponsors সেকশন, রানডাউনে ব্যাজ; লগইনহীন বহিরাগত সদস্যের রেকর্ড ও ম্যানেজমেন্ট উইন্ডো।
- PersonPicker; Owner/Manager তালিকায় আসেন শুধু রোল টিক থাকলে (৮ নভেম্বর ২১টি টিক বসিয়ে ঠিক করা হয়েছে)।
- "Did it go out?" সম্পূর্ণ: ডাটাবেস নিয়ম, ড্রয়ারের banner, Manager সিদ্ধান্ত, Publisher-এর রিশিডিউল অধিকার, রানডাউনে প্রতি চ্যানেলে পিন করা সারি, শুধু নিয়োজিত Publisher-এর জন্য ঝলকানো পিল।

## মালিকের ঠিক করা ক্রম (২ নভেম্বর) ও অবস্থা
1. PersonPicker + Post-production ট্যাব: ✅ সম্পন্ন।
2. "Did it go out?": ✅ সম্পন্ন।
3. বাইরের ক্রু আমন্ত্রণ (WhatsApp লিংক, গোপন-লিংকে উত্তর পাতা): ✅ সম্পূর্ণ ফিচার তৈরি সম্পন্ন (SQL, ড্রয়ার ইনভাইট ও /b/<token> পাবলিক পেজ N141, মালিকের এন্ড-টু-এন্ড টেস্টের অপেক্ষায়)। বিস্তারিত `external-crew-invite-decisions.md`।
4. Telegram বট WaveBot: ⏳ (BotFather টোকেন লাগবে)। `telegram-bot-plan.md`।

## পরে, বিনা ক্রমে (মালিকের সিদ্ধান্ত অনুযায়ী)
- **ডক (ওপরের মাঝের বার) ও হোম পেজ:** ডক কোথায় (ওপরে/নিচে/পাশে) সিদ্ধান্ত বাকি। Claude-এর প্রস্তাব: PC-তে ওপরে (মাঝখানে, পাতলা, হেডারের মেনুর জায়গা নেবে), ফোনে নিচে (বুড়ো আঙুলের নাগালে, ৫টা আইকন); অনুমোদন বাকি। `dock-ui-plan.md`, `home-and-print-notes-2026-11-02.md`।
- **টেলিপ্রম্পটার মেনু:** মেনুতে আলাদা "Teleprompter" (লেখা পেস্ট করে চালানো, টেস্ট/অডিশন/প্র্যাকটিস)। মালিক: পরে। `teleprompter-menu-notes.md`।
- **স্ক্রিপ্ট প্রিন্ট ও এডিটর সম্পন্ন:** N142, N145, N143, N144 সম্পন্ন (টেস্ট বাকি); Credits-এর প্রিন্ট/PDF (বিস্তারিত ক্রেডিট) পরে।
- **সামনের বড় কাজ (ক্রম অনুযায়ী, `docs/notes/content-types-plan.md` section C):** (1) Read-only SQL query (✅ সম্পন্ন, ১২ নভেম্বর); (2) Content type table in app (`CONTENT_TYPE_CONFIG`, ✅ সম্পন্ন, ১৪ নভেম্বর, N147); (3) Database groundwork for Uncut, Photo Card & Sponsors (✅ সম্পন্ন, ১৪ নভেম্বর SQL রেকর্ড); (4) Manage Sponsors tick + Sponsors section in drawer left column (✅ সম্পন্ন ও টেস্ট পাস, ১৫ নভেম্বর, N148/N148b); (5) Uncut app side (✅ সম্পন্ন ও টেস্ট পাস, ১৫–১৬ নভেম্বর, N149/N149b/N149b2); (6) shoot_location field (✅ সম্পন্ন ও টেস্ট পাস, ১৬ নভেম্বর, N150); (7) Photo Card database (✅ সম্পন্ন, ১৬ নভেম্বর); (8) Photo Card step 1: 3 ticks & Photo Card Templates page (✅ সম্পন্ন, ১৬ নভেম্বর, N151); (9) Photo Card step 2: PHOTO CARD type, 2-button form & drawer tabs (✅ সম্পন্ন, ১৬ নভেম্বর, N152 / N152b / N152b2); (10) Photo Card step 3: step buttons (✅ সম্পন্ন, ১৭ নভেম্বর, N153 / N153b); (11) Photo Card step 4: rundown switch (✅ সম্পন্ন, ১৭ নভেম্বর, N154); (12) Photo Card Desk page (✅ সম্পন্ন, ১৭ নভেম্বর, N155 / N155b); (13) Removal of Breaking, Desk Ready to publish & publish check off for photo cards (✅ সম্পন্ন, ১৮ নভেম্বর, N156); (14) Photo Card request form without date/time + open cards pinned (✅ সম্পন্ন, ১৯ নভেম্বর, N157); (15) Photo Card template tracking SQL (✅ সম্পন্ন, ১৯ নভেম্বর, N158); (16) REAL-TIME AUTO-REFRESH for all users (✅ সম্পন্ন, ১৯ নভেম্বর, N159: একটি স্থিতিশীল চ্যানেল, ব্যাচড রিফেচ, ৩০ সেকেন্ড ক্যাচ-আপ, টাইপিং প্রটেকশন, স্ক্রিপ্ট কনফ্লিক্ট চেকিং, contents.updated_at, content_ads in realtime); (17) Templates page (✅ সম্পন্ন, ২১ নভেম্বর, N160); (18) card drawer tidy (✅ সম্পন্ন, ২১ নভেম্বর, N161: Production tab hidden, Card folder in Publish tab, Published at label, compact caption + combined copy, card Credits tab)। পরবর্তী কাজ: মালিকের সাথে সিদ্ধান্ত (Report page, card preview for approval, in-app card editor, 7 channels folder structure, Next.js security upgrade, notifications for cards)।
- Sponsors ধাপ ২; ফাইল-লিংক ফিল্ড সরানো।
- End-credit অ্যানিমেটেড ক্লিপ; চ্যানেল লোগো; ফটোকার্ড।
- "সবকিছু আইডি দিয়ে" প্রজেক্ট (নাম এখন, আইডি পরে; নতুন টেবিল সবসময় আইডি দিয়ে)।
- নিরাপত্তার বাকি: `notice_uid_counters` SELECT policy `true`, `team_members` UPDATE policy ট্রিগারের উপর নির্ভর, storage policy, SECURITY DEFINER grant, Supabase confirm-email, ২-ধাপ লগইন, ব্যাকআপ রিস্টোর পরীক্ষা।
- AI ফিচার: মালিককে জিজ্ঞাসা করে কোন কাজগুলো আগে।
- স্থগিত (মালিক পরে ভাববেন): Bulk schedule পুনর্ভাবনা।

## সিদ্ধান্ত নেওয়া কিন্তু এখনও বানানো হয়নি (পুরনো রোডম্যাপ থেকে)
- **রানডাউন পুনর্গঠন:** Hold = সারিজুড়ে হলুদ আভা; Drop = ধূসর; Parking zone ও Bin তুলে দেওয়া। কনটেন্টের চ্যানেল থাকলে তারিখ ছাড়াও নিজের চ্যানেল-সেকশনে থাকবে; চ্যানেল না থাকলে ওপরের আলাদা ব্যান্ডে। (কোডে Parking zone ও Bin এখনও আছে।)
- **টাস্ক সিস্টেম:** যে কেউ যে কাউকে দিতে পারবে; "আমার আজকের কাজ" (টাস্ক + আমার ক্রেডিটেড কনটেন্ট)। `tasks-system-notes.md`।
- **টার্গেট/KPI (অনেক পরে):** প্রতি ব্যক্তির দিন/সপ্তাহ/মাসের লক্ষ্য, অ্যাপ নিজে গুনবে।
- **শুটিং শিডিউল:** আলাদা পাতা; লোকেশন, শুরু/শেষ সময়, ক্রু কনটেন্টের Production Crew থেকে (একই জায়গা); একাধিক দিন = আলাদা সেশন; কনটেন্ট ছাড়া শুটও চলবে। `production-hub-vision.md`।
- **রানডাউনের কাস্টম ভিউ:** প্রতি ইউজার সর্বোচ্চ ৪টা পদ (ফোনে ২–৩) বাছবে; ডিফল্ট নিজের পদ থেকে; সব ভিউতে।
- **শো/সিরিজ:** `shows` টেবিল, season/episode, Bulk schedule জেনারেটর।
- সব স্ক্রিন সাইজে অপ্টিমাইজেশন (১৯২০ রানডাউন, ফোন, আইফোন, ম্যাকবুক এয়ার)।

## স্থায়ী নিয়ম
- মালিক চাইলে প্রম্পটের আগে আলোচনা; একটা একটা করে; ক্রম এমন যাতে কাজ দুবার না হয়।
- অ্যাপে দৃশ্যমান সব লেখা ইংরেজি; ডক্স বাংলা বা ইংরেজি।
- রিপো পাবলিক: গোপন নোট (বিজনেস প্ল্যান, নিরাপত্তা রিভিউ) রিপোতে যাবে না।
