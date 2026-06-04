<div align="center">

<img src="public/nova-logo-n.png" width="96" alt="NovaBoard AI logo" />

## NovaBoard AI

Cursor for Hardware.

This repository contains a marketing landing page and private Alpha waitlist flow for NovaBoard AI. It is intended as a lightweight, responsive site to capture Alpha waitlist applications and store them in Firestore.

</div>

## Overview

NovaBoard AI is an AI-powered hardware development workspace for electronics engineers, makers, students, and embedded developers. The landing page positions the product around designing circuits, generating firmware, selecting components, creating BOMs and wiring diagrams, and building complete hardware projects with natural language.

## Key Features

- Animated hero and responsive layout
- Private Alpha waitlist form with direct Firestore writes
- Alpha waitlist duplicate protection
- Optional Resend integration for confirmation emails
- Hardware-focused copy for circuits, ESP32 firmware, Arduino code, BOMs, wiring diagrams, and project documentation

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
RESEND_FROM_EMAIL=NovaBoard AI <onboarding@yourdomain.com>
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
If `FIREBASE_SERVICE_ACCOUNT` is not provided, the signup API cannot write waitlist entries with Firebase Admin credentials.
`NEXT_PUBLIC_SITE_URL` is used to build absolute Open Graph and Twitter preview URLs so the NovaBoard AI logo appears when the site link is shared.

## API

The signup UI posts to `POST /api/signup`, which writes directly to the `alpha_users` collection with this document shape:

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

## Project Structure

- `pages/` — Next.js pages and API routes
- `src/` — React components and client code
- `public/` — Static assets, logos, and preview images

## License

Private — all rights reserved.
