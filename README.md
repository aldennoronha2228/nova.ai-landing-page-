# <img src="./public/nova-logo-n.png" alt="Logo" width="40" align="center"/> NovaBoard AI — WireUp Landing Page

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-blue)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Private-red)](#license)

## Overview

**WireUp by NovaBoard AI** is an AI‑powered hardware development workspace that helps engineers, makers, and students design circuits, generate firmware, create BOMs, and prototype complete hardware projects — all through natural‑language prompts. This repository hosts the **marketing landing page** and the **private Alpha waitlist flow** for WireUp.

The site showcases the product's value proposition, captures early‑access sign‑ups, and stores them in Firebase Firestore. It also provides a sleek, responsive UI for both public users and the admin dashboard.

---

## Live Site

**[novaboard.dev](https://novaboard.dev)**

---

## Key Features

- **Animated hero section** with smooth Framer Motion transitions.
- **Responsive design** – looks great on any screen size.
- **Alpha waitlist** – application form that writes directly to Firestore.
- **Duplicate‑submission protection** and **Resend** email confirmation for applicants.
- **Admin notification emails** on every new alpha application.
- **Dark‑mode admin dashboard** (`src/admin/`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14** (React, TypeScript) |
| Styling | Vanilla CSS with design tokens (no Tailwind) |
| Animations | **Framer Motion** |
| Backend | **Firebase** (Firestore, Admin SDK) |
| Email | **Resend** |
| Media Uploads | **Cloudinary** |
| CI/CD | Vercel (auto‑deploy on push) |

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/aldennoronha2228/nova.ai-landing-page-.git
cd nova.ai-landing-page-

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and Resend credentials

# 4. Run the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev`   | Starts the Next.js development server with hot‑reloading. |
| `build` | Compiles the app for production (`next build`). |
| `start` | Runs the compiled app (`next start`). |
| `lint`  | Runs ESLint to check code quality. |

---

## Project Structure

```
.
├─ .github/                # GitHub Actions, issue templates
├─ pages/                  # Next.js pages & API routes
│   ├─ admin/              # Admin UI pages (dashboard, login, etc.)
│   ├─ api/                # Serverless API endpoints
│   └─ _app.tsx            # Global app wrapper & meta tags
├─ public/                 # Static assets (logos, OG images)
├─ src/                    # Core React components & CSS
│   ├─ admin/              # Admin UI components & styles
│   ├─ server/             # Server-side helpers (Firebase, email, auth)
│   └─ index.css           # Global design tokens & utilities
├─ .env.example            # Example environment variables
├─ README.md               # This file
└─ package.json            # Project metadata & scripts
```

---

## Environment Variables

Create a `.env.local` file based on `.env.example`. Required variables:

```env
# Email (Resend) — use a verified domain sender for production
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=WireUp <hello@novaboard.dev>

# Admin notification email (fallback recipient for new alpha applications)
ADMIN_NOTIFICATION_EMAIL=novaboardai@gmail.com

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}

# Public Firebase config (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Site URL
NEXT_PUBLIC_SITE_URL=https://novaboard.dev

# Cloudinary (media uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Admin login
ADMIN_EMAILS=your@email.com
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_session_secret
```

> **Important:** For applicant welcome emails to deliver to real users, `RESEND_FROM_EMAIL` must use a verified domain in Resend (not `onboarding@resend.dev`). Verify `novaboard.dev` at [resend.com/domains](https://resend.com/domains) and set the sender to `WireUp <hello@novaboard.dev>`.

---

## Email Flow

When a user submits the Alpha application:

1. **Applicant** receives a welcome email — _"You're on the WireUp Alpha waitlist 🎉"_
2. **Admin** (`novaboardai@gmail.com` + any emails in Firestore `admin_emails` collection) receives a notification with full applicant details.

---

## Social

- Instagram: [@wireups.dev](https://www.instagram.com/wireups.dev)
- YouTube: [@novaboard-s9b](https://youtube.com/@novaboard-s9b)

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch.
3. Ensure the app builds (`npm run build`).
4. Submit a pull request.

---

## License

**Private – all rights reserved**. The code is proprietary and not open‑source.
