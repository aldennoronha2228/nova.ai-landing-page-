<div align="center">

<img src="public/nova-logo-n.png" width="96" alt="Nova AI logo" />

## Nova AI

This repository contains a marketing landing page and private signup flow for Nova AI. It is intended as a lightweight, responsive site to capture private alpha signups and store them in Firestore.

</div>

## Overview

A small, focused landing page built with Next.js. The project includes a signup flow that validates submissions, writes them directly to Firestore, and attempts to send confirmation messages when configured.

## Key Features

- Animated hero and responsive layout
- Private alpha signup form with direct Firestore writes
- Alpha waitlist duplicate protection
- Optional Resend integration for confirmation emails

## Tech Stack

- Next.js
- React
- TypeScript
- Framer Motion
- Firebase (client + optional admin)

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/aldennoronha2228/nova.ai-landing-page-.git
cd nova.ai-landing-page-
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment

Create a `.env.local` file with the values needed for email and Firestore writes:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Your Name <onboarding@yourdomain.com>
FIREBASE_SERVICE_ACCOUNT={"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}

# Public Firebase config for client-side Firestore writes
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_SITE_URL=...
```
The active Firebase project is controlled by the `NEXT_PUBLIC_FIREBASE_*` values. In the current environment those values point at project `nova-ai-2c157`.
If `FIREBASE_SERVICE_ACCOUNT` is not provided the app will attempt client-side Firestore writes (subject to your Firestore rules).
`NEXT_PUBLIC_SITE_URL` is used to build absolute Open Graph and Twitter preview URLs so the Nova logo appears when the site link is shared.

## API

The signup UI writes directly to the `alpha_users` collection with this document shape:

```json
{
  "email": "user@example.com",
  "fullName": "Full Name",
  "company": "Company",
  "role": "Role",
  "signupDate": "server timestamp",
  "source": "website",
  "status": "pending",
  "phase": "alpha"
}
```

The API route at `POST /api/signup` mirrors the same schema and messages as a fallback path.

## Project structure

- `pages/` — Next.js pages and API routes
- `src/` — React components and client code
- `public/` — Static assets (logo and images)

## License

Private — all rights reserved.

---

If you'd like a different tone or more detail (for example a developer quickstart or deployment steps), tell me what to include and I will update the file.
