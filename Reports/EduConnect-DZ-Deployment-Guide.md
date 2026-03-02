# ILMI — Complete Deployment & Hosting Guide

> This document covers everything you need to know to host, deploy, and maintain ILMI in production — including the web admin panel, Django backend, Flutter mobile app, and all associated costs. No prior DevOps experience required.

---

## Table of Contents

1. [What You Are Hosting](#1-what-you-are-hosting)
2. [The Big Picture — Infrastructure Overview](#2-the-big-picture--infrastructure-overview)
3. [AWS Services — What Each One Does](#3-aws-services--what-each-one-does)
4. [Step-by-Step Setup Order](#4-step-by-step-setup-order)
5. [Frontend Deployment — React Admin Panel](#5-frontend-deployment--react-admin-panel)
6. [Backend Deployment — Django API](#6-backend-deployment--django-api)
7. [Database — PostgreSQL on RDS](#7-database--postgresql-on-rds)
8. [Redis — ElastiCache](#8-redis--elasticache)
9. [HTTPS & Domain Setup](#9-https--domain-setup)
10. [Mobile App — Flutter](#10-mobile-app--flutter)
11. [Mobile Distribution — Getting the App to Users](#11-mobile-distribution--getting-the-app-to-users)
12. [Push Notifications — Firebase FCM](#12-push-notifications--firebase-fcm)
13. [Security — Protecting Your Super Admin & Data](#13-security--protecting-your-super-admin--data)
14. [Backups & Disaster Recovery](#14-backups--disaster-recovery)
15. [Deployment Workflow — How to Push Updates](#15-deployment-workflow--how-to-push-updates)
16. [Complete Cost Breakdown](#16-complete-cost-breakdown)
17. [Quick Start Priority Checklist](#17-quick-start-priority-checklist)

---

## 1. What You Are Hosting

ILMI consists of three separate things that all need to be deployed:

**Backend — Django API**
This is your application's brain. It handles all business logic, authentication, user management, school management, and data. Everything communicates through this.

**Frontend — React + Vite Admin Panel**
This is the web dashboard that Super Admins and School Admins use to manage schools, users, teachers, and students. It runs in the browser.

**Mobile App — Flutter**
This is the app that parents, students, and teachers use on their phones. It does NOT need its own server — it simply calls the same Django backend that the web panel uses.

**Database — PostgreSQL**
This is where all your data lives: schools, users, grades, attendance, everything. This is the most critical thing to protect and back up.

---

## 2. The Big Picture — Infrastructure Overview

```
Users (Web Browser)
        │
        ▼
  CloudFront CDN  ──────────────►  S3 Bucket
  (fast delivery)                 (React frontend files)

        │
        ▼
  Application Load Balancer
        │
        ▼
  EC2 Instance  (your Django backend server)
        │
        ├──────────────────────────────────►  RDS PostgreSQL
        │                                     (your database)
        │
        └──────────────────────────────────►  ElastiCache Redis
                                              (rate limiting / cache)


Flutter App (on user's phone)
        │
        │   HTTPS API calls (same backend)
        ▼
  EC2 Instance  (Django backend)
        │
        ▼
  RDS PostgreSQL
```

**Key insight:** One backend serves everything. Your web admin panel and Flutter mobile app both call the exact same Django API endpoints. You do not need separate servers for mobile.

---

## 3. AWS Services — What Each One Does

### EC2 (Elastic Compute Cloud)
A virtual machine (server) in the cloud. This is where your Django application actually runs. Think of it as a computer that never turns off, connected to the internet 24/7. You choose the size (CPU, RAM) based on how much traffic you expect.

Recommended starting size: **t3.small** (2 vCPU, 2GB RAM)

### RDS (Relational Database Service)
A managed PostgreSQL database. AWS handles all the hard parts — backups, software updates, security patches, and failover. You should never run your database on the same server as your application. If your EC2 crashes, your data in RDS is completely safe.

Recommended starting size: **db.t3.micro** (2 vCPU, 1GB RAM)

### S3 (Simple Storage Service)
A file storage service. Your React frontend is just a collection of HTML, CSS, and JavaScript files after you build it. S3 stores and serves these files. It's extremely cheap and highly reliable.

### CloudFront (CDN — Content Delivery Network)
CloudFront sits in front of S3 and delivers your frontend files from servers physically close to your users. This makes your web panel load faster for users in Algeria and everywhere else. It also handles HTTPS for your frontend.

### ElastiCache (Managed Redis)
Redis is an in-memory data store used for caching and rate limiting. Your app uses it to enforce the PIN login lockout (5 failed attempts = 30-minute lockout). ElastiCache is the managed AWS version of Redis.

Recommended starting size: **cache.t3.micro**

### Route 53
AWS's DNS service. It connects your domain name (e.g., ilmi.dz) to your EC2 server's IP address. When someone types your domain, Route 53 tells their browser where to go.

---

## 4. Step-by-Step Setup Order

Always set things up in this order. The database must exist before the backend, and the backend must exist before the frontend.

1. Create your AWS account and set a billing alert
2. Create Security Groups (firewalls)
3. Launch and configure RDS (database)
4. Launch and configure ElastiCache (Redis)
5. Launch EC2 and deploy Django backend
6. Configure your domain and HTTPS
7. Deploy React frontend to S3 + CloudFront
8. Build and distribute the Flutter mobile app

---

## 5. Frontend Deployment — React Admin Panel

Your React app is just static files (HTML, CSS, JS) after you run the build command. You do not need a running server to serve these files. S3 handles it for free.

**How it works:**
- You build your React project locally on your computer
- This creates a folder of static files (usually called `/dist`)
- You upload those files to an S3 bucket
- You create a CloudFront distribution pointing to that bucket
- Users visit your domain, CloudFront delivers the files instantly from a server near them

**Important setting:** In your React app, you must set the API URL environment variable to point to your production Django server (e.g., `https://api.your-domain.com/api/v1`) instead of localhost.

**Every time you update the frontend:**
- Run the build command again
- Upload the new files to S3 (replacing old ones)
- Invalidate the CloudFront cache so users get the new version immediately

---

## 6. Backend Deployment — Django API

Your Django backend runs on an EC2 instance. In production, you never use Django's built-in development server (`manage.py runserver`). Instead you use two tools:

**Gunicorn** — A production-grade application server that actually runs your Django code. It handles multiple requests simultaneously using multiple worker processes.

**Nginx** — A high-performance web server that sits in front of Gunicorn. It handles HTTPS, serves static files, forwards requests to Gunicorn, and provides an additional layer of security.

**The request flow:**
```
Internet → Nginx (port 443) → Gunicorn (port 8000) → Django → Response
```

**Important configurations for production:**
- Set `DEBUG = False` in Django settings
- Set `ALLOWED_HOSTS` to your actual domain name
- Store all secrets (database password, secret key) in environment variables — never in code
- Run database migrations after deploying
- Collect static files so Django admin works correctly
- Configure Gunicorn as a system service so it restarts automatically if the server reboots

**Server specifications to start:**
- OS: Ubuntu 22.04 LTS
- Instance type: t3.small
- Storage: 20GB SSD

---

## 7. Database — PostgreSQL on RDS

### Why RDS and Not a Database on EC2?

If you run PostgreSQL on your EC2 instance and that instance crashes, has a disk failure, or needs to be restarted — your database goes down with it and you could lose data. RDS is a completely separate, managed service that:

- Takes automatic daily backups with point-in-time recovery
- Handles failover automatically if something goes wrong
- Runs database software updates and security patches for you
- Is physically separate from your application server

### Security — Critical

Your database must NEVER be accessible from the public internet. The only thing that should be able to connect to RDS is your EC2 instance. You enforce this through Security Groups:

- Create a security group for RDS that only allows connections on port 5432
- Set the source of that rule to be the EC2 security group — not a public IP range
- This means even if someone knows your RDS endpoint and password, they cannot connect from outside AWS

### Connection Settings

Your Django settings file needs to be updated to use your RDS endpoint address as the database host, with the database name, username, and password you set when creating the RDS instance. These credentials must be stored as environment variables, never hardcoded in your source code.

---

## 8. Redis — ElastiCache

Your application uses Redis for:
- Rate limiting PIN login attempts (5 failed attempts → 30-minute lockout per phone number)
- Django's caching framework

ElastiCache provides managed Redis. Like RDS, it should only be accessible from your EC2 instance, not from the public internet.

**Cost-saving option for early stage:** Instead of paying for ElastiCache (~$12/month), you can install Redis directly on your EC2 instance. This is slightly less reliable and scalable but works fine when starting out. Migrate to ElastiCache when you have more users and revenue.

---

## 9. HTTPS & Domain Setup

### Domain Name

You need a domain name for your application (e.g., `ilmi.dz` or `ilmi.dz`).

**Recommended registrar: Namecheap**
- Transparent pricing with no dramatic price increases at renewal
- Easy DNS management
- Good customer support

**Domain suggestions:**
- `ilmi.dz` — broadly recognized
- `ilmi.dz` — Algerian country-code domain, more local trust but harder to register (requires Algerian business paperwork)

**DNS Setup:**
After buying your domain, point it to your EC2 server's IP address by creating an A record in your DNS settings. You can manage DNS either through Namecheap's control panel or through AWS Route 53.

### SSL Certificate (HTTPS) — Free

Never run a production application on plain HTTP. Browsers warn users about HTTP sites and JWT tokens can be intercepted.

Use **Let's Encrypt** with **Certbot** — it is completely free and certificates auto-renew every 90 days. Certbot integrates directly with Nginx and configures HTTPS automatically.

### Subdomain Strategy (Recommended)

Use subdomains to separate your services clearly:
- `app.your-domain.com` → React admin panel (CloudFront → S3)
- `api.your-domain.com` → Django backend (EC2)
- `your-domain.com` → Marketing/landing page

---

## 10. Mobile App — Flutter

### No New Server Required

The Flutter mobile app does not need its own server. It communicates with the exact same Django backend that your web admin panel uses. The only difference is the client — instead of a browser running React, it's a phone running Flutter.

### Production Configuration

Before building a release version of the app, you must update the API base URL from `localhost` to your production domain. The app should also handle three environments separately:
- **Development** — points to localhost for testing
- **Staging** — points to a staging server for QA
- **Production** — points to your live server

### Token Security

Your backend uses JWT tokens for authentication. On mobile, tokens must be stored securely using the device's secure storage (Keychain on iOS, Keystore on Android), not in regular shared preferences storage which can be read by other apps on rooted devices.

### Token Refresh

The Flutter app needs an interceptor (similar to the Axios interceptor in your web app) that automatically:
1. Attaches the JWT access token to every API request
2. Detects 401 Unauthorized responses
3. Automatically refreshes the token using the refresh token
4. Retries the failed request with the new token
5. If refresh also fails, logs the user out and redirects to the login screen

### Role-Based Navigation

Your backend returns the user's role in the login response. The Flutter app should use this role to navigate the user to the correct home screen — parents see the parent dashboard, students see the student dashboard, teachers see the teacher dashboard, and admins are directed to the web panel.

---

## 11. Mobile Distribution — Getting the App to Users

You have three options for distributing the Flutter app to users.

---

### Option A — Direct APK Distribution (Recommended to Start)

Skip the app stores entirely. Build the APK file and host it on your own server (S3). Share a download link with schools.

**How it works:**
- You build a release APK file from Flutter
- Upload it to your S3 bucket
- Create a simple download page on your website
- Share the link with school administrators
- Users download and install it directly

**For users:** They need to enable "Install from unknown sources" in their Android settings. This is a one-time setting and is very common in Algeria.

**Pros:**
- Completely free
- Instant updates (just upload new APK)
- Full control with no review process
- No Google account required for users

**Cons:**
- Users don't get automatic updates
- Requires "unknown sources" setting
- Slightly less polished trust signal compared to Play Store

---

### Option B — Google Play Store

The most professional Android distribution method.

**Registration:** One-time fee of **$25 USD** — pay once, publish unlimited apps forever, no annual renewal.

**Process:**
1. Go to play.google.com/console and create a developer account
2. Pay the $25 registration fee
3. Create your app listing with name, description, screenshots, and privacy policy
4. Build an AAB file (Android App Bundle) — required by Google Play, not APK
5. Sign your app with a keystore file (see critical warning below)
6. Upload to Play Console and submit for review
7. Google reviews it (typically 1–3 business days for first submission)
8. Users install from Play Store and receive automatic updates

**Critical warning about the keystore file:**
When you sign your app, you generate a keystore file. This file is the cryptographic proof that you are the legitimate publisher of the app. If you lose this file, you can NEVER update your app on the Play Store — Google will not accept updates signed with a different key. You would have to unpublish the app and start over, losing all your reviews and install count. Back up this file in multiple safe locations (external drive, encrypted cloud storage, etc.).

---

### Option C — Apple App Store (iOS)

**Registration:** **$99 USD per year** — you must renew annually. If you don't pay, your app is removed from the App Store.

**Requirements:**
- A Mac computer with Xcode installed — there is no way to build iOS apps on Windows or Linux
- An Apple Developer account
- Apple's review process is stricter and slower than Google's (1–7 days)

**Recommendation for ILMI:** Skip iOS initially. The vast majority of Algerian users are on Android. Start with direct APK or Play Store, generate revenue, then invest in iOS development and the $99/year fee.

---

### In-App Update Checker

Regardless of distribution method, build a version check into the app. On every app launch, the app calls an endpoint on your Django backend to check if a newer version is available. If yes, it shows a dialog prompting the user to update. You can also set `force_update: true` for critical security updates to prevent users from continuing with an old version.

---

## 12. Push Notifications — Firebase FCM

Parents need notifications when grades are posted. Students need homework reminders. Teachers need schedule updates. You need push notifications.

**Firebase Cloud Messaging (FCM)** is the solution — it is completely free for any volume of notifications.

**How it works:**
1. When a user installs the app and logs in, Flutter registers the device with Firebase and gets a unique device token
2. Flutter sends this token to your Django backend, which saves it on the user's record
3. When an event happens (grade added, attendance marked), your Django backend sends a notification request to Firebase's servers with the device token and message content
4. Firebase delivers the notification to the user's phone, even if the app is closed

**Architecture:**
```
Django Backend
      │  sends HTTP request with device token + message
      ▼
Firebase Cloud Messaging (Google's free servers)
      │
      ▼
User's Phone (notification appears)
```

**Setup steps:**
1. Create a free Firebase project at firebase.google.com
2. Add your Android and iOS apps to the Firebase project
3. Download the configuration files and add them to your Flutter project
4. Add the `firebase_messaging` and `firebase_core` Flutter packages
5. Add your Firebase Server Key to your Django environment variables
6. Add a `device_token` field to your User model in Django
7. When users log in on mobile, save their device token to the backend
8. Call the FCM API from Django whenever you need to send a notification

---

## 13. Security — Protecting Your Super Admin & Data

This section directly addresses the concern: "What if someone gets into the super admin account and deletes everything?"

---

### Layer 1 — Change Default Credentials Immediately

Your project documentation lists the default superadmin credentials publicly. These must be changed before you deploy to production. Anyone who has access to your documentation — including this file — knows the defaults.

Use a strong password: minimum 16 characters, mixed case, numbers, and symbols. Store it in a password manager.

---

### Layer 2 — Restrict Django Admin Panel by IP

Your Django admin panel at `/admin/` should not be accessible to the general public. Configure Nginx to only allow access from your specific IP address (your home or office internet connection). Anyone else who tries to access `/admin/` gets a 403 Forbidden response, regardless of whether they have valid credentials.

---

### Layer 3 — Two-Factor Authentication for Super Admin

Require a TOTP (Time-Based One-Time Password) code for superadmin login. This means even if someone knows the phone number and password, they also need the 6-digit code from your Google Authenticator or Authy app.

The `django-otp` library makes this straightforward to implement.

---

### Layer 4 — AWS IAM — Never Use Your Root Account

When you create an AWS account, that initial login is your "root" account. It has unlimited power including the ability to permanently delete your entire AWS account with no recovery.

**Best practices:**
- Enable MFA (Multi-Factor Authentication) on your root account immediately
- Create an IAM user for your daily work with only the specific permissions you need
- Never use root credentials for regular operations
- Store your root account credentials somewhere extremely safe and rarely access them

---

### Layer 5 — AWS CloudTrail

Enable AWS CloudTrail. It logs every single action performed in your AWS account — who did what, when, from which IP address. If something is deleted, you will know exactly what happened, when, and from where.

---

### Layer 6 — Security Groups as Firewall

Your Security Group configuration is your first line of defense:

**For your EC2 instance:**
- Port 22 (SSH): Allow only from YOUR IP address — not from 0.0.0.0/0 (entire internet)
- Port 80 (HTTP): Allow from anywhere
- Port 443 (HTTPS): Allow from anywhere
- All other ports: Deny

**For your RDS database:**
- Port 5432 (PostgreSQL): Allow ONLY from the EC2 security group
- This means even if someone has your database password, they cannot connect from outside AWS

**The #1 beginner mistake:** Opening port 5432 to 0.0.0.0/0 (the entire internet). This exposes your database to brute force attacks from anywhere in the world. Never do this.

---

### Layer 7 — Soft Deletes (Already Implemented)

Your codebase already deactivates users instead of permanently deleting them. Make sure this same pattern is applied to schools and all other critical data models. A soft-deleted record can always be restored. A hard-deleted record is gone forever.

---

### Layer 8 — Environment Variables for Secrets

Never put passwords, API keys, or secret keys directly in your code or in Git. Use environment variables on the server.

Things that must be environment variables, never in code:
- Django SECRET_KEY
- Database password
- Firebase Server Key
- Any API keys

---

## 14. Backups & Disaster Recovery

This is the most important operational topic. If the worst happens and data is deleted, backups are your only recovery option.

### Automatic RDS Backups

Enable automated backups in your RDS settings:
- Set retention period to 7 days minimum (AWS free tier gives you 7 days)
- AWS automatically takes a daily snapshot of your entire database
- You can restore to any specific point in time within the retention window
- This protects against accidental deletion, corruption, and attacks

**How to restore:** In the AWS console, go to RDS → your database → Restore to point in time. Select the timestamp you want to restore to. AWS creates a new RDS instance with your data from that exact moment.

### Manual Backups Before Risky Operations

Before any major change — a big deployment, a data migration, a schema change — manually dump your database and store the backup in S3. This gives you an instantly accessible backup that doesn't depend on RDS's restore process.

### Backup Retention Strategy

Keep your backups in a separate S3 bucket from your application files. Set a lifecycle policy on that bucket to automatically delete backups older than 30 days to control storage costs.

### What You Can Recover From

With proper backups in place, you can recover from:
- Accidental deletion of data
- A compromised superadmin account that deleted schools/users
- A failed deployment that corrupted data
- Hardware failure of your EC2 instance
- An attacker who got access to your system

The only thing you cannot recover from is not having backups.

---

## 15. Deployment Workflow — How to Push Updates

### Backend Updates (Django)

Every time you push new Django code to production, the steps are:

1. SSH into your EC2 instance
2. Pull the latest code from your Git repository
3. Install any new Python dependencies
4. Run database migrations (for any model changes)
5. Collect static files
6. Restart the Gunicorn service

The whole process takes about 2–3 minutes. During the Gunicorn restart, your API is briefly unavailable (a few seconds). For zero-downtime deployments, you would need a load balancer with multiple EC2 instances, but this is not necessary when starting out.

### Frontend Updates (React)

Every time you update the React admin panel:

1. Run the build command locally on your computer
2. Sync the built files to your S3 bucket (this replaces old files)
3. Create a CloudFront cache invalidation so users immediately see the new version instead of the cached old version

The whole process takes 2–5 minutes and requires no server restart.

### Mobile App Updates

This is the most complex update process because you cannot force users to update immediately (unless you implement forced update logic).

**For direct APK distribution:**
- Build a new release APK
- Upload it to S3, replacing the old file
- Update the version number in your Django version endpoint
- Users will see an update prompt next time they open the app (if you implemented the version checker)
- Users who ignore the prompt continue using the old version until they manually update

**For Google Play Store:**
- Build a new AAB (Android App Bundle)
- Upload to Play Console
- Submit for review (takes a few hours to 1 day for updates, faster than first submission)
- Google rolls out the update to users, most get it within 24–72 hours with auto-update enabled
- You can use staged rollouts — release to 10% of users first, check for crashes, then roll out to 100%

**For forced updates:** If you release a critical security fix, set `force_update: true` in your Django version endpoint. Your Flutter app checks this on launch and prevents the user from using the app until they update.

---

## 16. Complete Cost Breakdown

### App Store Fees

| Store | Fee | Frequency | Notes |
|-------|-----|-----------|-------|
| Google Play Store | $25 | One-time, forever | Pay once, publish unlimited apps, no annual renewal |
| Apple App Store | $99 | Every year | Must renew or app is removed from the store |

**Algeria recommendation:** Start with Android only. Skip the $99/year Apple fee until you have paying customers who need iOS.

---

### Domain Name

| Registrar | First Year | Annual Renewal | Recommendation |
|-----------|-----------|----------------|----------------|
| Namecheap | ~$6–8 | ~$13–15 | ✅ Best choice — transparent pricing |
| GoDaddy | ~$0.01 (promo) | ~$22 | ❌ Cheap first year, expensive renewal |

**Budget:** ~$13–15 per year ongoing for a .com domain.

---

### AWS Monthly Costs

| Service | Instance Type | Monthly Cost | Purpose |
|---------|--------------|-------------|---------|
| EC2 | t3.small | $15.18 | Runs Django backend |
| RDS | db.t3.micro | $21.90 | PostgreSQL database |
| ElastiCache | cache.t3.micro | $12.41 | Redis for rate limiting |
| S3 + CloudFront | — | ~$2.00 | React frontend + APK hosting |
| Route 53 | — | ~$0.50 | Domain DNS |
| **Total** | | **~$52/month** | |

**AWS Free Tier (First 12 months):** AWS gives you 750 hours/month of t3.micro EC2 and ElastiCache instances free for your first year. This saves approximately $25/month, reducing your first-year AWS cost.

**Cost reduction options:**
- Run Redis on your EC2 instead of ElastiCache — saves $12.41/month when starting out
- Use Reserved Instances (commit to 1 year) — saves 30–40% on EC2 and RDS costs
- Downgrade to t3.micro for EC2 if traffic is low — saves ~$8/month but less performance headroom

---

### Other Services

| Service | Cost | Notes |
|---------|------|-------|
| Firebase Cloud Messaging | Free | Push notifications, any volume |
| Let's Encrypt SSL | Free | HTTPS certificate, auto-renews every 90 days |
| GitHub (code repository) | Free | For storing your code and deploying |

---

### Total Annual Cost Summary

| Item | Annual Cost |
|------|------------|
| AWS Hosting | $624/year ($52 × 12) |
| Domain Name | $13/year |
| Google Play Store | $25 one-time |
| Apple App Store | $99/year (optional) |
| Firebase FCM | $0 |
| SSL Certificate | $0 |

---

### Your Bottom Line

| Scenario | Year 1 | Year 2 Onwards |
|----------|--------|----------------|
| Android only, no iOS | $662 | $637/year |
| Android + iOS | $761 | $736/year |
| Year 1 with AWS Free Tier savings | ~$370 | $637/year |
| Optimized (Redis on EC2, no iOS) | ~$280 | ~$487/year |

**Monthly ongoing cost:** approximately **$53–62/month** at standard pricing, or as low as **$40/month** with Redis on EC2 and no iOS.

---

## 17. Quick Start Priority Checklist

Use this checklist to go from zero to live. Do these in order.

### Before You Deploy

- [ ] Change the default superadmin credentials (phone `0550000000` / password `admin123456`) — do this FIRST
- [ ] Move all secrets (database password, Django secret key) to environment variables
- [ ] Set `DEBUG = False` in Django settings
- [ ] Update `ALLOWED_HOSTS` with your real domain name
- [ ] Update the Flutter app's API URL to point to your production domain
- [ ] Add keystore credentials file to `.gitignore` — never commit this to Git

### AWS Setup

- [ ] Create AWS account
- [ ] Set a billing alert at $70/month (gives you buffer above expected ~$52)
- [ ] Enable MFA on your AWS root account
- [ ] Create an IAM user for daily work (don't use root)
- [ ] Create Security Groups (EC2 firewall and RDS firewall)
- [ ] Launch RDS PostgreSQL instance
- [ ] Launch ElastiCache Redis instance (or plan to run Redis on EC2)
- [ ] Launch EC2 instance (Ubuntu 22.04, t3.small)

### Backend Setup

- [ ] SSH into EC2 and install Python, Nginx, and dependencies
- [ ] Clone your repository onto the server
- [ ] Configure environment variables on the server
- [ ] Run database migrations
- [ ] Set up Gunicorn as a system service (auto-restarts on reboot)
- [ ] Configure Nginx as reverse proxy
- [ ] Test that the API responds correctly

### Domain & HTTPS

- [ ] Buy domain on Namecheap
- [ ] Point DNS to EC2 IP address
- [ ] Install Certbot and get free SSL certificate
- [ ] Verify HTTPS works on your domain
- [ ] Restrict `/admin/` endpoint to your IP address only

### Frontend Setup

- [ ] Build React project
- [ ] Create S3 bucket
- [ ] Upload built files to S3
- [ ] Create CloudFront distribution
- [ ] Point your domain's subdomain (e.g., `app.your-domain.com`) to CloudFront
- [ ] Test that the admin panel loads and can log in

### Database Backups

- [ ] Enable RDS automated backups (7-day retention minimum)
- [ ] Create a separate S3 bucket for manual backups
- [ ] Test a manual backup and verify it works
- [ ] Test a restore from backup (do this at least once before going live)

### Mobile App

- [ ] Generate keystore file for Android app signing
- [ ] Back up keystore file in multiple safe locations
- [ ] Build release APK
- [ ] Upload APK to S3 for direct download
- [ ] Add in-app version checker
- [ ] Set up Firebase project for push notifications
- [ ] Add device token storage to Django User model
- [ ] Test push notifications end-to-end
- [ ] (Optional) Register Google Play developer account ($25)
- [ ] (Optional) Submit app to Google Play

### Security Hardening

- [ ] Enable AWS CloudTrail
- [ ] Enable MFA on superadmin account in your own app
- [ ] Review all Security Group rules — ensure port 5432 is not public
- [ ] Confirm `DEBUG = False` in production
- [ ] Confirm no hardcoded passwords anywhere in the codebase
- [ ] Set up monitoring/alerts (AWS CloudWatch) for server errors

---

## Summary

ILMI requires three deployed components: the Django backend on EC2, the React frontend on S3/CloudFront, and the Flutter mobile app distributed directly or through Google Play. The Flutter app talks to the same backend as the web panel — no separate server needed.

Your ongoing infrastructure cost will be approximately **$52/month on AWS** plus **$13/year** for a domain name. The Google Play Store is a one-time $25 fee. Apple App Store is optional and costs $99/year.

The most important operational priorities are: **change default credentials before going live**, **enable database backups**, and **restrict your database to only be accessible from your application server**. These three steps protect you against the most common and most damaging failure scenarios.

---

*Document prepared for ILMI — Internal deployment reference.*
*Last updated: February 2026*
