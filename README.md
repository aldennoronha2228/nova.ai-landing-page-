# NovaBoard AI Landing Page

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-blue)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Private-red)](#license)

## Overview

**NovaBoard AI** is an AI‑powered hardware development workspace that helps engineers, makers, and students design circuits, generate firmware, create BOMs, and prototype complete hardware projects—all through natural‑language prompts. This repository hosts the **marketing landing page** and the **private Alpha waitlist flow** for NovaBoard AI.

The site showcases the product’s value proposition, captures early‑access sign‑ups, and stores them in Firebase Firestore. It also provides a sleek, responsive UI for both public users and the admin dashboard.

---

## Live Demo

Visit the live deployment at: https://nova-board.vercel.app (or your custom domain).

---

## Key Features

- **Animated hero section** with smooth Framer Motion transitions.
- **Responsive design** – looks great on any screen size.
- **Alpha waitlist** – a simple form that writes directly to Firestore.
- **Duplicate‑submission protection** and optional **Resend** email confirmation.
- **Dark‑mode ready admin UI** (`src/admin/`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14** (React, TypeScript) |
| Styling | Vanilla CSS with design tokens (no Tailwind) |
| Animations | **Framer Motion** |
| Backend | **Firebase** (Firestore, optional Admin SDK) |
| Email | **Resend** (optional) |
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
├─ api/                    # Serverless API routes (e.g., /api/signup)
├─ pages/                  # Next.js pages
│   ├─ admin/              # Admin UI (dashboard, login, etc.)
│   └─ _app.tsx            # Global app wrapper & meta tags
├─ public/                 # Static assets (logos, OG images)
├─ src/                    # Core React components & CSS
│   ├─ admin/              # Admin UI components & styles
│   └─ index.css           # Global design tokens & utilities
├─ .env.example            # Example environment variables
├─ README.md               # This file
└─ package.json            # Project metadata & scripts
```

See the dedicated `PROJECT_STRUCTURE.md` for a deeper dive.

---

## Environment Variables

Create a `.env.local` file based on `.env.example`. Required variables include:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=NovaBoard AI <onboarding@yourdomain.com>
FIREBASE_SERVICE_ACCOUNT={"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"}

# Public Firebase config for client‑side Firestore writes
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_SITE_URL=...
```

If `FIREBASE_SERVICE_ACCOUNT` is omitted, the signup API cannot write waitlist entries with admin credentials.

---

## API

The signup UI posts to `POST /api/signup`, which writes a document to the `alpha_users` collection:

```json
{
  "email": "user@example.com",
  "fullName": "Full Name",
  "student": "yes",
  "identity": "Student",
  "useCase": "Describe the hardware project or firmware workflow",
  "signupDate": "server timestamp",
  "source": "website",
  "status": "pending",
  "phase": "alpha"
}
```

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
