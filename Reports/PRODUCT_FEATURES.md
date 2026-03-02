# ILMI — Complete Product Features Guide
### Every Feature, Every App, Every Role — Built for Algeria

> **Core philosophy:** Every feature must reduce work, not create it. If something feels harder than paper, it fails. This document defines exactly how every screen, every button, and every notification should work across all four apps — the Admin Panel, Teacher App, Parent App, and Student App.

---

## Table of Contents

1. [Design Philosophy — The Algeria Rule](#1-design-philosophy--the-algeria-rule)
2. [Admin Panel (Web)](#2-admin-panel-web)
3. [Teacher App (Flutter Mobile)](#3-teacher-app-flutter-mobile)
4. [Parent App (Flutter Mobile)](#4-parent-app-flutter-mobile)
5. [Student App (Flutter Mobile)](#5-student-app-flutter-mobile)
6. [WOW Features — Impressive But Simple to Build](#6-wow-features--impressive-but-simple-to-build)
7. [Feature Rollout Plan — What to Build First](#7-feature-rollout-plan--what-to-build-first)
8. [Recommendations — Features to Add](#8-recommendations--features-to-add)
9. [What NOT to Build](#9-what-not-to-build)

---

## 1. Design Philosophy — The Algeria Rule

Before building any feature, ask this one question:

> **"Is this faster than what the teacher/parent/admin already does today?"**

If yes → build it.
If no → simplify it or cut it.

### The Three Laws

**Law 1 — One screen, one purpose.**
Every screen does exactly one thing. The teacher does not navigate through 5 menus to mark attendance. One tap, one confirm.

**Law 2 — Default to done.**
Pre-fill everything possible. If 95% of students attend class, default is everyone present. Teacher only touches the 5% exception.

**Law 3 — The app does the work, not the user.**
Reports generate themselves. Notifications send themselves. Statistics calculate themselves. The user just does the human part — confirming, not filling.

### Role Complexity Rule

| Role | App Complexity | Why |
|------|---------------|-----|
| Teacher | minimal — few main actions | Teachers resist extra work most |
| Parent | Passive — mostly receives information | Parents just want to know |
| Student | Simple — view and confirm | Students need clarity, not complexity |
| Admin/Director | Full power — all analytics and controls | Admin is comfortable with screens, this is their job |

---

## 2. Admin Panel (Web)

The admin panel is used by the **school director, school admin, and section admins**. These are the people who chose to use ILMI. They expect a professional tool and they are comfortable with it.

---

### 2.1 Dashboard — The Command Center

**What it shows on first load:**

- Total students enrolled
- total teachers
- Unread parent messages or complaints
- Today's announcements
...

**How it works:**
All numbers are calculated automatically from the database. The admin never fills in the dashboard — they just read it. It updates in real time every 60 seconds without refreshing the page.

**Why this is important:**
A school director currently has to walk through 10 classrooms to know attendance. Now they open one page and see everything in 5 seconds. This is the moment they become addicted to the product.

---

### 2.2 School Setup

**First-time setup wizard:**
When a new school registers, a step-by-step wizard guides the admin through:

1. School name, address, logo upload
2. Academic year configuration (start date, end date, trimester system)
3. Add sections (Primary / Middle / High)
4. Add classes (6ème A, 6ème B, etc.)
5. Add subjects per section
6. Invite or create or modify teacher accounts (phone number + name, system sends them a login SMS or shows their initial password)
7. Import or create or modify students accounts (bulk CSV upload OR manual one by one)
8. 6. create or modify parents accounts (can be 2 parents for the same student , also a teacher can be a parent of a student also ) 


**The CSV import is critical.** Most schools have student lists in Excel. Admin uploads the file, system maps columns, imports 500 students in 10 seconds. This removes the biggest onboarding friction.

**CSV import format the system accepts:**
```
First Name | Last Name | Date of Birth | Parent Phone | Class
Ahmed      | Bouzid    | 2010-03-14    | 0551234567   | 6A
```

---

### 2.3 Student Management

**Student profile page contains:**
- Full name, photo (optional), date of birth
- Class assignment
- Parent contact information (one or two parents)
- All grades across all subjects
- Behavior notes from teachers
- NFC virtual card (contains the school logo , the enrolled year and the class and the student information...etc)

**Bulk actions (saves massive time):**
- Move an entire class to the next year in one click
- Send announcement to all parents of one class

---

### 2.4 Teacher Management

**Teacher profile:**
- Name, phone, subjects taught, classes assigned
- Attendance submission rate (did this teacher actually use the app this week?)
- Last login date

**The attendance submission rate is powerful.** If a teacher has not submitted attendance in 3 days, admin can see it immediately and follow up. This is accountability without confrontation.

---

### 2.5 Attendance Management

**What admin sees:**
- A grid: rows = classes, columns = days of the week
- Each cell shows: percentage of students present that day in that class
- Click any cell to see the full list

**Filters available:**
- By class
- By date range
- By subject (which teacher is responsible)
- Export to PDF or Excel with one click

**Monthly attendance report:**
Auto-generated PDF per class, per student, or for the whole school. Admin clicks "Generate Report" → downloads in 3 seconds. This replaces what used to take hours of manual work.

---

### 2.6 Grade Management

**How grades work:**
- Each subject has a grading structure defined by admin (exams, homework, participation — whatever the school uses)
- Teachers enter grades in their app or they can just upload a csv file (in a specefic format including all the students etc etc) and the grades will be field manually 
- Admin sees all grades in a table view and validate them (the admin also can enter grades -this saves a lot of work for teachers but the priority is for teacher insertion-)
- Automatic calculation of averages (the system does the math, not the teacher , the admin have to specify the policies of how the average is calculated)

**End-of-term report generation:**
Admin clicks "Generate End-of-Term Reports" → system creates one PDF per student containing all grades, averages, attendance summary, and teacher comments → admin downloads a ZIP file with all reports → prints them.

This replaces what currently takes an entire day of manual Excel work.


---

### 2.7 Announcements

**How to post an announcement:**
1. Click "New Announcement"
2. Write the message (Arabic keyboard supported)
3. Choose who receives it: everyone / all parents / all teachers / one class / one section / specefic people(just 2 students and their parents .. etc etc)
4. Choose channel: in-app notification / SMS (if SMS is configured) / both
5. Click send

**Scheduled announcements:**
Admin can write an announcement and schedule it to send at a specific date and time. Example: schedule the exam week reminder 3 days before exams.

**Pinned announcements:**
Important announcements can be pinned to the top of the parent app's notification feed so they never get buried.

**Time schedule:**
Admin can post time schedule for each class and they will automatically appear to students of this class and their parents 
Admin can also post time schedule for each teacher 
---
### 2.9 Chats
Admin can create a chat with anyone (another admin, parent, student , teacher) and send messages or upload files etc etc

---

### 3 Analytics (The Feature That Sells the Product)

**Chronic absenteeism tracker:**
Shows students who have missed more than a configurable threshold (default: 3 sessions in a month). Admin can send a warning notification to parents directly from this screen with one click.

**Class comparison:**
Which classes have the best attendance? Which have the most late arrivals? Shown as simple bar charts. No complex dashboards — just the 3 numbers that matter.

**Teacher engagement:**
Which teachers submit attendance on time? Which ones skip it? Admin can see this privately and follow up.

**These analytics are not AI. They are simple database queries displayed clearly.** They look impressive because no other tool the school currently uses provides them.

---

### 3.1 Fee Management 

Track which parents have paid school fees (yearly or monthly), which are late, and send automatic reminders and warnings. when a parent pays the admin will mark him as payed (make the tracking very easy), This alone is worth the monthly subscription to a school director.

---

## 3.2 Teacher App (Flutter Mobile)

The teacher app is the most critical to get right. Teachers are the most resistant users. If the app feels like extra work, they will abandon it after one week.

**The teacher app has :**
1. today's session 
2. My Classes
3. Announcements
4. My Profile
5. chats
6. schedule (the sessions of the week)
7. events (here the teacher can add homeworks or tasks to do for the students and parents just to remind their students and letting their parents track their children) 

Nothing else is on the home screen. No analytics, no complex settings, no reports. Those live in the admin panel.

---

### 3.1 Home Screen — Today's Sessions

When the teacher opens the app, they see only today's schedule:

```
Good morning, Mr. Bouzid 👋

TODAY — Monday 3 March

08:00  Mathematics  —  6ème A     [Mark Attendance]
10:00  Mathematics  —  5ème B     [Mark Attendance ✓ Done]
14:00  Mathematics  —  4ème C     [Mark Attendance]
```

Green checkmark = already done. Grey = not yet done. That is the entire home screen.

**Why this works:**
The teacher sees exactly what they need to do today No navigation required. One tap to start any session. 

---

### 3.2 Attendance — The Core Feature

**The flow:**

1. Teacher taps "Mark Attendance" next to their session
2. Screen opens with all students listed — **all toggled GREEN (present) by default**
3. Teacher only taps students who are **absent** — they turn RED
4. If a student arrived late, long-press their name → select "Late" → they turn YELLOW
5. Teacher taps "Confirm" — takes 5–15 seconds total if mostly present

**That is the entire attendance flow. 3 taps for a full class.**

**After confirming:**
- System automatically queues notifications for absent students' parents
- Notifications send after 10 minutes (to allow for mistakes to be corrected)
- Teacher sees a confirmation: "Attendance saved. 2 parents will be notified."

**Editing attendance:**
If teacher made a mistake, they can reopen attendance within 30 minutes and change it. After 30 minutes, only admin can edit.

**Undo button:**
Immediately after confirming, there is a 60-second undo option. This prevents panic from accidental confirmations.

---

### 3.3 Grades Entry
**The flow:**

1. Teacher taps a class from "My Classes"
2. Selects the assessment type (Exam 1 / Homework / Oral — configured by admin or the teacher)
3. Sees a list of all students with a number input next to each name
4. the teacher can upload a csv file which contains all the student grades in a specefic format "family name-first name-grade" and if their is some fields not filled or he want to modify or just wants to type the grades manually he can Types the grade (numeric keyboard appears automatically — no letters, no symbols)
5. System auto-saves every 3 seconds — no save button needed
6. When done, taps "Finalize" — grades become visible to parents and admin

**Grade entry keyboard:**
Large numeric keys, fraction support (14.5/20), grade out of 20 by default (standard Algerian system). If teacher grades out of a different total, they set it once at the top and system converts automatically.

**Voice input option (WOW feature — easy to build):**
Teacher can tap the microphone icon and say "Ahmed Bouzid 15, Fatima Benali 18, Mohamed Khelil 12" — the app parses the names and numbers and fills them automatically. Uses the phone's built-in speech recognition. No AI needed.

---

### 3.4 Quick Announcements

Teacher can send a message to a specific class's parents directly from the app. Example: "No class tomorrow, the exam is moved to Thursday." One text field, one send button. No email, no WhatsApp group, no phone calls.

---

### 3.5 Notes / Behavior Notes (Optional — Never Mandatory)

teacher can optionally add a short note about a student's behavior or participation. This is never required — it is there for teachers who want to use it. Parents can see these notes in their app.

Example note: "Mohamed was disruptive today. Please have a conversation with him about classroom respect."

This replaces the parent-teacher phone call for minor behavioral issues.

### 3.5 chats
teacher can chat with the administration to send messages or send files and chat with his students and he can create groups for his classes  
---




## 4. Parent App (Flutter Mobile)

The parent app is **passive**. Parents do not enter data. They receive information. The app is a window into their child's school life.

**Design rule:** Parent should be able to get the answer to "How is my child doing?" in under 10 seconds of opening the app.

---

### 4.1 Home Screen

When parent opens the app:

```
Your child: Ahmed Bouzid  📍 6ème A

Today:
✅ Present in all sessions

This week:
Grades: 16/20 in Math (Tuesday)
Announcements: 1 new

[View Details]  [All Notifications]
```

Big, clear, reassuring. If the child is present and has no issues, the parent sees green and feels calm. If there is something to know, it is shown immediately.

---

### 4.2 Attendance Feed

Parent can scroll through the last 30 days of attendance for their children :

```
Monday 3 March     ✅ All sessions present
Friday 28 Feb      ⚠️  Absent — Mathematics (10:00)
                       [Notification was sent at 10:12]
Thursday 27 Feb    ✅ All sessions present
Wednesday 26 Feb   🕐  Late — French (08:15) — arrived 12 min late
```

Tapping any day shows full detail. Parent can see exactly what happened and when they were notified.

---

### 4.3 Grades

**Grades section shows:**
- All subjects with current average
- Each individual grade with date and type (exam, homework, oral)
- Class average next to student's grade (so parent can understand if 12/20 is good or bad relative to the class)
- Trend arrow (improving, stable, declining based on last 3 grades)

**The trend arrow is powerful.** A parent sees their child's math grade went from 10 → 12 → 14 with an upward arrow. They feel informed. They feel the app is smart. It is just three data points.

---

### 4.4 Absence Justification

When a child is marked absent, parent receives a notification. Inside the notification, there is a button: **"Justify Absence."**

Parent taps it, writes a reason ("Doctor appointment"), optionally attaches a photo of a medical certificate, and submits. Teacher and admin can see the justification. The absence is marked "excused" in the system.

**This replaces the phone call to the school.** Parent saves time. School has a record. Everyone wins.

---

### 4.5 Announcements

All school announcements in chronological order. Pinned announcements appear at the top. Parent can read in French or Arabic depending on their app language preference.

---

### 4.6 Communication (Recommended — See Section 8)

Direct messaging between parent and teacher or parent and admin, managed through the app. No more personal phone numbers shared. No more WhatsApp groups. All communication is recorded in the system.

---

### 4.7 Multiple Children

If a parent has two or three children in the same school (or even different schools using ILMI), they switch between children profiles with one tap at the top of the screen. One app, one login, all children.

---

## 5. Student App (Flutter Mobile)

The student app is for **information and awareness**, not data entry. Students should feel the app helps them stay organized, not that it monitors them.

**Tone of the student app:** helpful, clear, slightly motivational.

---

### 5.1 Home Screen

```
Good morning, Ahmed 🎓

Today's schedule:
08:00  Mathematics
10:00  French Literature
14:00  Sciences

Your average this week: 14.2 / 20  ↑
```

Simple. Clean. Relevant.

---

### 5.2 Schedule View

Full weekly timetable. Student can see today, tomorrow, and the full week. Shows subject, room number (if admin configured it), and teacher name.

**Exam alerts:**
When admin marks an exam in the system, it appears in the student's schedule highlighted in orange. Student also receives a push notification 24 hours before the exam.

---

### 5.3 Grades

Student can see all their grades across all subjects, same as what the parent sees. Running averages, class rank (if admin chooses to show it), and subject-by-subject breakdown.

---

### 5.4 Attendance Summary

Student can see their own attendance record. This is motivational — students who see their own attendance percentage often try to improve it. Show it as a simple percentage and a calendar.

---

### 5.5 Homework & Assignments (Recommended — See Section 8)

Teacher posts homework from their app. Student sees it in their app with the due date. Simple list: subject, description, due date. Student can mark it as done (for personal tracking — this is not submitted to the teacher unless teacher enables submission).

---

### 5.6 Student ID Card (WOW Feature — Easy to Build)

Inside the student app, there is a **digital student ID card**:

```
┌─────────────────────────────┐
│  🏫 ECOLE IBN KHALDOUN     │
│                             │
│  [Photo]  Ahmed Bouzid      │
│           6ème A            │
│           ID: 20240892      │
│                             │
│  [QR CODE]                  │
└─────────────────────────────┘
```

The QR code contains the student's ID and can be scanned by the NFC/QR attendance system or by security at the school entrance.

**Why this is a WOW feature:** It costs zero to build. It is just a styled screen with a QR code generated from the student ID. But parents show it to each other. Students feel proud. Schools feel modern. It photographs well for marketing.

---

## 6. important Features — Impressive But Simple to Build

These are features that look and feel futuristic but require minimal technical complexity.

---

### 6.1 Live Classroom Dashboard 📊

**What it looks like to admin:**
A screen showing all classes in session right now. Each class shows: 28 present, 2 absent, 1 late — updating live.

**How it actually works:**
Every time a teacher submits attendance, the database updates. The admin dashboard re-fetches this data every 30 seconds (simple polling — not even WebSockets required). Numbers display in colored boxes.

**Complexity: Low.** Just a database query on a timer.

**WOW factor: High.** Looks like an airport control panel.

---

### 6.3 Parent Entry Alert 🔔

**What it looks like:**
The moment a student enters school and their attendance is marked for the first session of the day, parent immediately receives: *"Ahmed entered school at 07:54. Have a good day! 🎒"*

This only triggers once per day (first session of the day, not every session).

**Complexity: Very low.** A condition check: if this is the first attendance record of the day for this student → send notification.

**Why it works psychologically:** Parents feel connected to their child's day. Schools that offer this get talked about by parents to other parents. It is free word-of-mouth marketing.

---

### 6.4 Attendance Risk Alert 📉

**What it looks like:**
Admin and parent both receive an automatic alert when a student misses 3 sessions in the same month.

Admin sees: *"5 students in 6ème A have missed more than 3 sessions this month. [View List]"*

Parent receives: *"Ahmed has been absent 3 times this month. Regular attendance is important for academic success. [Contact School]"*

**How it works:**
A background job (Django management command run via cron, once daily) counts absences per student per month. If count >= threshold → create notification. That's it.

**Complexity: Low.** A COUNT query and a notification trigger.

**Looks like:** AI-powered monitoring system.

---

### 6.5 Dynamic QR Attendance (No Hardware Needed) 📱

**What it looks like:**
teacher opens session and chooses "QR Mode." A large QR code appears on their phone screen. Students open their student app and tap "Scan QR." The camera opens, they scan, they are marked present.

The QR code **refreshes every 30 seconds** so students cannot screenshot it and share it with absent classmates.

**How it works:**
QR code encodes: `session_id + teacher_id + timestamp_window`. Backend validates that the scan happened within the valid time window. If someone scans an old QR, it is rejected.

**Complexity: Medium.** QR generation, camera scanning in Flutter, and timestamp validation in Django. All well-documented libraries exist for this.

**WOW factor: Very high.** Students feel like they are in a Silicon Valley company. Teachers love not having to say names out loud.

---


### 6.7 Auto Report Generation 📄

**What it looks like:**
Admin clicks "Generate End-of-Term Reports." 30 seconds later, they download a ZIP file containing one professionally formatted PDF per student, with the school logo, all grades, averages, attendance summary, and teacher comments. and they can automatically send it to parent.

**How it works:**
Django generates PDFs using the `reportlab` or `weasyprint` library. Template is designed once. Data is filled from the database. ZIP is created and served for download.

**Complexity: Medium.** PDF generation and templating. No complex logic — just formatting.

**Time replaced:** What currently takes 2–3 days of manual work in Excel → 30 seconds.

---


### 6.9 Digital Student ID with QR Card 🪪

Already described in Section 5.6. Zero backend cost. Enormous perceived value.

---



## 7. Feature Rollout Plan — What to Build First

Do not build everything at once. Launch with the minimum that makes a school's daily life easier, then add features as you learn what users actually want.

---

### Phase 1 — Launch (Month 1–3)
**Goal: Get 5 schools using the product daily**

| Feature | App | Why First |
|---------|-----|-----------|
| Student/Teacher/Class setup | Admin Panel | Nothing works without this |
| CSV student import | Admin Panel | Removes the biggest onboarding barrier |
| Default-present attendance | Teacher App | The core daily habit — must be perfect |
| Automatic parent notification on absence | Backend | The main value proposition |
| Today's schedule view | Teacher App | Teacher's first screen every morning |
| Grade entry (numeric, auto-save) | Teacher App | Second most important teacher action |
| View child's attendance and grades | Parent App | Parent's reason to open the app |
| Push notifications | Parent App | The thing that makes parents check the app |
| Today's summary | Parent App | Home screen — reassuring if child is present |

---

### Phase 2 — Retention (Month 3–6)
**Goal: Make schools unable to imagine going back to paper**

| Feature | App | Why Now |
|---------|-----|---------|
| Monthly PDF report generation | Admin Panel | Saves hours of work — creates loyalty |
| Chronic absence alerts | Admin Panel + Parent | Proactive, impressive, automatic |
| Absence justification by parent | Parent App | Removes phone calls to school |
| Live classroom dashboard | Admin Panel | Director becomes addicted to this |
| Smart auto-late detection | Backend | Precision that impresses parents |
| Parent entry alert (first session) | Backend | Emotional feature — drives word of mouth |
| Multi-child support | Parent App | Important for families with multiple children |

---

### Phase 3 — WOW & Upsell (Month 6–12)
**Goal: Create features that justify higher pricing tiers**

| Feature | App | Plan Tier |
|---------|-----|-----------|
| Dynamic QR attendance | Teacher + Student | Pro |
| NFC contactless attendance | Teacher App | Enterprise |
| Voice grade entry | Teacher App | Pro |
| Digital student ID with QR | Student App | All plans (marketing feature) |
| Auto end-of-term report ZIP | Admin Panel | Pro |
| Attendance prediction score | Admin Panel | Pro |
| Geo-verified attendance | Backend | Pro |
| Fee tracking and payment reminders | Admin Panel | Pro |
| Parent-teacher messaging | Parent + Teacher | Pro |

---

## 8. Recommendations — Features to Add

These are features not currently described in your system but strongly recommended based on the Algerian school market.

---

### 8.1 Fee & Payment Tracking 💰

**The problem it solves:**
Every private school struggles with late tuition payments. Currently, the finance secretary has a notebook or Excel file and manually calls parents. This is a nightmare.

**What to build:**
- Admin sets payment schedule (October, January, March installments for example)
- Each student has a payment record
- Admin marks payments as received
- Parents who have not paid by the due date receive an automatic reminder notification
- Admin sees a dashboard: paid / unpaid / overdue
- One-click to send reminders to all unpaid parents

**Why school directors will love this:** It solves one of their most stressful monthly tasks. This feature alone can justify the subscription.

---

### 8.2 Parent-Teacher Direct Messaging 💬

**The problem it solves:**
Parents currently call teachers on personal numbers, join WhatsApp groups, or wait for parent-teacher meetings. Teachers lose privacy. Communication is unstructured.

**What to build:**
- Parent can start a conversation with any of their child's teachers
- Teacher responds in the app
- No personal phone numbers shared
- Admin can see all conversations (important for accountability)
- Teacher can set a "Do not disturb" schedule (messages received but no notification outside hours)

**Why this is strategic:** Once parents use messaging, they open the app every day. Daily active users = more loyalty = lower churn.

---

### 8.3 Homework & Assignment Board 📚

**The problem it solves:**
Students forget homework. Parents do not know what assignments exist. Teachers have to repeat instructions.

**What to build:**
- Teacher posts: Subject + Description + Due Date (30 seconds)
- Students see it in their app immediately
- Parents see it in their app too
- Student can tap "Done" to mark it complete (personal tracking only, not submitted)
- Teacher sees how many students viewed the homework

**Keep it simple:** No file uploads at first. Just text. Add file attachments in Phase 3.

---

### 8.4 School Calendar 📅

**The problem it solves:**
Parents never know when school holidays are, when exams start, when reports are distributed.

**What to build:**
- Admin creates calendar events (Exam Week, Holiday, Sports Day, Parent-Teacher Meeting)
- Events appear in all apps (parent, student, teacher)
- Automatic push notification sent 2 days before any event

This is trivially simple to build and extremely useful.

---

### 8.5 Class Behavior Score 🏆

**The problem it solves:**
Teachers have no efficient way to give positive or negative behavioral feedback. Directors have no view into which classes have discipline problems.

**What to build:**
- Teacher can tap a quick icon after a session: 😊 (good session) / 😐 (normal) / 😟 (difficult)
- Monthly admin view shows which classes consistently get difficult ratings
- Optional: teacher can add a short text note for serious behavior issues

**The key is making this one tap, never mandatory.**

---

### 8.6 SMS Fallback for Critical Notifications 📱

**The problem it solves:**
Some parents, especially older ones in Algeria, do not have smartphones or do not check apps. Push notifications are useless for them.

**What to build:**
- When a parent account has not opened the app in 14 days, critical notifications (absences, grade alerts) are also sent as SMS
- Use a local Algerian SMS gateway (Mobilis, Djezzy, Ooredoo all have APIs)
- This is a paid add-on — school pays per SMS sent

**Why important:** Guarantees that every parent receives critical information, not just tech-savvy parents.

---

### 8.7 Offline Mode for Teachers 📶

**The problem it solves:**
School internet can be unreliable in Algeria. If the app requires internet to submit attendance, teachers will abandon it the first time it fails.

**What to build:**
- Teacher marks attendance with no internet → data saved locally on phone
- When internet returns → data syncs automatically in background
- Teacher sees a small indicator: "3 sessions pending sync"

**This is a Pro feature that prevents churn more than any other feature.** One offline failure that loses data = teacher never uses the app again.

---

## 9. What NOT to Build

These are features that sound good but will harm adoption in the Algerian school market right now.

---

### ❌ Complex Grade Weighting Systems

Do not let teachers configure weights per assessment type, decimal precision, compensation rules, or custom formulas. This is too complex. Use the standard Algerian system: grade out of 20, average calculated simply. If schools want complex grading, let admin configure one coefficient per subject — no more.

---

### ❌ Video or Live Streaming

Online class streaming is out of scope. It is technically complex, expensive to host, requires good internet at school, and parents are not asking for it. Focus on the physical school experience, not virtual school.

---

### ❌ Student Social Features

No student-to-student messaging, no class forums, no social feed. This creates noise, safety concerns, and distraction. Students use the app to receive information, not to socialize.

---

### ❌ Complex Analytics Dashboards for Teachers

Teachers do not want charts and trend lines about their own performance. This feels like surveillance and creates resistance. Keep analytics in the admin panel only, visible to admin and directors.

---

### ❌ Mandatory Daily Logging

Never require teachers to fill something every single day. If a teacher has no sessions on Wednesday, the app shows nothing for Wednesday. Do not create empty fields or "please complete your log" messages. The app should be invisible on days when there is nothing to do.

---

### ❌ Full Payment Processing (at First)

Do not build in-app payment (parent pays tuition through the app). This requires bank integration, regulatory compliance, and significant trust-building. Stick to tracking who has paid in cash/bank transfer. Add payment processing only after you have 50+ schools and proven demand.

---

## Summary — The One-Sentence Rule for Every Feature

Every time you are about to build something, finish this sentence:

> **"This feature saves [who] from having to [painful thing they currently do]."**

If you cannot complete that sentence clearly, the feature is not ready to be built yet.

---

*ILMI — Product Specification Document*
*Internal Reference — Founding Team*
*Version 1.0 — February 2026*
