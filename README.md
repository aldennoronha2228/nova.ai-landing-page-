# ⚡ Nova AI Landing Page

<div align="center">

### Premium beta landing page for Nova AI

An AI-native hardware workspace landing page with cinematic motion, beta signup capture, confirmation email delivery, and duplicate application protection.

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=24&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&width=700&lines=AI+Workspace+for+Hardware+Engineers;Design.+Simulate.+Build.;Private+Beta+Signup+Flow;Built+with+Next.js+%2B+Framer+Motion" />

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=16&duration=2200&pause=900&color=4F8BFF&center=true&vCenter=true&width=700&lines=Animated+Hero+Pipeline;Scroll+Driven+Product+Story;Responsive+Landing+Experience" />

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=14&duration=1800&pause=800&color=22D3EE&center=true&vCenter=true&width=700&lines=Firestore+Signup+Memory;Resend+Email+Confirmation;Vercel+Ready+Deployment" />

</div>

---

## ✨ Features

* ⚡ Premium animated hero section
* 🧠 AI hardware workflow storytelling
* 🔌 Circuit, embedded, and simulation-focused product sections
* 🎛️ Scroll-driven glow, parallax, and reveal effects
* 📱 Fully responsive mobile navigation
* 📝 Private beta signup form
* 📬 Confirmation emails with Resend
* 🧾 Duplicate beta application detection
* 🔥 Firebase Firestore signup storage
* 🚀 Vercel-ready Next.js deployment

---

## 🧠 Product Focus

```txt
AI Circuit Generation
Component Selection
Embedded Software Assistance
Live Arduino Simulation
Edge AI Deployment
Private Beta Access
```

---

## ⚙️ Tech Stack

* Next.js 14
* React 18
* TypeScript
* Framer Motion
* Firebase + Firebase Admin
* Resend
* CSS Modules / Global CSS
* Vercel

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aldennoronha2228/nova.ai-landing-page-.git
cd nova.ai-landing-page-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## 🔑 Environment Setup

Create a `.env.local` file and configure:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Nova AI <onboarding@yourdomain.com>
FIREBASE_SERVICE_ACCOUNT={"project_id":"your-project-id","client_email":"firebase-adminsdk@example.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}
```

Optional public Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_public_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 🌐 API Configuration

Beta signup endpoint:

```txt
POST /api/signup
```

Example Request:

```json
{
  "name": "Alex Carter",
  "phone": "+1 555 0100",
  "email": "alex@example.com"
}
```

Duplicate Response:

```json
{
  "message": "You have already applied for the Nova AI beta version.",
  "saved": true,
  "duplicate": true
}
```

---

## 📂 Project Structure

```bash
pages/
pages/api/
src/
src/assets/
public/
.github/
```

---

## 🎨 UI Inspiration

* Apple-style product storytelling
* Premium AI SaaS launch pages
* Hardware engineering workspaces
* Cinematic scroll experiences

---

## ⚡ Performance Focused

This landing page is designed to be:

* Fast
* Responsive
* Polished
* Conversion-focused
* Easy to deploy
* Lightweight for a visual marketing page

No unnecessary dashboard complexity.

---

## 🛠️ Roadmap

* [ ] Add beta waitlist admin dashboard
* [ ] Add analytics for signup conversion
* [ ] Add richer product screenshots
* [ ] Add interactive hardware demo preview
* [ ] Add email sequence automation
* [ ] Add launch countdown section

---

## 📜 License

Private - all rights reserved.

---

<div align="center">

### Built for the future of hardware engineering ⚡

</div>
