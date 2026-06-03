<div align="center">

<img src="public/nova-logo-n.png" width="96" alt="Nova AI logo" />

## Nova AI

This repository contains a marketing landing page and private signup flow for Nova AI. It is intended as a lightweight, responsive site to capture private alpha signups and deliver confirmation emails.

</div>

## Overview

A small, focused landing page built with Next.js. The project includes a signup endpoint that validates and records submissions and attempts to send confirmation messages when configured.

## Key Features

- Animated hero and responsive layout
- Private signup form with serverless API endpoint
- Optional Firestore storage for signups
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

Create a `.env.local` file with the values needed for email and optional server-side Firestore writes:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Your Name <onboarding@yourdomain.com>
FIREBASE_SERVICE_ACCOUNT={"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}

# Optional public Firebase config (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

If `FIREBASE_SERVICE_ACCOUNT` is not provided the app will attempt client-side Firestore writes (subject to your Firestore rules).

## API

POST `/api/signup`

Request body (JSON):

```json
{
  "name": "Full Name",
  "phone": "+1 555 0100",
  "email": "user@example.com"
}
```

Response contains a message and flags indicating whether the submission was saved and whether an email was sent.

## Project structure

- `pages/` — Next.js pages and API routes
- `src/` — React components and client code
- `public/` — Static assets (logo and images)

## License

Private — all rights reserved.

---

If you'd like a different tone or more detail (for example a developer quickstart or deployment steps), tell me what to include and I will update the file.
