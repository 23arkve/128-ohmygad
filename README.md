# OhMyGAD!

> **Gender and Development (GAD) Events Management System**  
> Developed for the _Kasarian Gender Studies Program Office, University of the Philippines Baguio._

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

---

## Overview

**OhMyGAD!** is a centralized web platform designed to streamline Gender and Development (GAD) operations at the University of the Philippines Baguio. It manages GAD event publishing, student/faculty registration, real-time attendance monitoring, GSO/ASHO completion tracking, post-event feedback surveys, demographic analytics, and official GAD guidelines.

The system enforces **Role-Based Access Control (RBAC)** across four distinct user roles: **Admin**, **Staff**, **Faculty**, and **Student**.

---

## Features

### Admin Workspace

- **Analytics Dashboard**: Real-time stats on user demographics (sex at birth, gender identity, college distribution), event attendance trends, and survey completion rates.
- **Event Management**: Create, edit, publish, and delete GAD events with custom banner uploads, registration windows, and capacity limits.
- **Attendance Tracking**: View registered vs. attended participants and mark attendance in real-time.
- **Survey Management**: Create dynamic post-event feedback surveys, view response analytics, and track response rates.
- **User Management**: Manage account profiles, assign roles, reset onboarding flags, and edit session completion records.
- **Guideline Publishing**: Publish and edit GAD rules & guidelines using a rich-text Tiptap editor.
- **CSV Data Export**: Export overall and per-event participant rosters and feedback data to CSV files.

### Staff Workspace

- **Analytics Dashboard**: Real-time stats on user demographics (sex at birth, gender identity, college distribution), event attendance trends, and survey completion rates.
- **Operational Monitoring**: View event timelines, search active rosters, and access daily event statistics.
- **Event Operations**: Create/edit events, inspect event details, and mark attendee attendance.
- **Survey Operations**: Create and monitor post-event surveys linked to active events.

### Student & Faculty Workspace

- **Personalized Dashboard**: View registered events categorized into **Today**, **Upcoming**, and **Past**.
- **Orientation Progress Tracker**: Visual progress indicators for mandatory **GSO** (Gender Sensitivity Orientation) and **ASHO** (Anti-Sexual Harassment Orientation) requirements.
- **Event Discovery & Registration**: Search, filter, and register for upcoming GAD events.
- **Post-Event Feedback**: Complete pending surveys linked to attended events.
- **Onboarding Flow**: Specialized onboarding process to user information.

---

## Tech Stack

| Domain               | Technology                                                                                                                        |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**        | [Next.js 15](https://nextjs.org/) (App Router, Server Components & Actions)                                                       |
| **Language**         | [TypeScript](https://www.typescriptlang.org/)                                                                                     |
| **Backend & DB**     | [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row-Level Security, Storage)                                        |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://framer.com/motion)         |
| **Rich Text Editor** | [Tiptap Editor](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/starter-kit`)                                                     |
| **Iconography**      | [Lucide React](https://lucide.dev/)                                                                                               |
| **Quality & Git**    | [Husky](https://typicode.github.io/husky/), [Commitlint](https://commitlint.js.org/) (Conventional Commits)                       |
| **Deployment & CI**  | [Vercel](https://vercel.com/), GitHub Actions with [`release-please-action`](https://github.com/googleapis/release-please-action) |

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Supabase Account**: Active Supabase project with database & auth configured.

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-org/128-ohmygad.git
    cd 128-ohmygad
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure Environment Variables:**  
   Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
    ```

4. **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Releases & CI/CD

This repository uses **Google Release Please** and **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.) to automate releases, version bumping, and changelog generation.

- **Workflow:** Defined in [`.github/workflows/release-please.yml`](.github/workflows/release-please.yml).
- When commits are merged into `main`, Release Please automatically generates a Release PR with updated [`CHANGELOG.md`](CHANGELOG.md) and bumped version in [`package.json`](package.json).
- Merging the Release PR automatically publishes a new GitHub Release tag (e.g. `v1.1.0`).

---

## Documentation

Detailed user guides and technical architecture documents are available in the [`docs/`](docs/) directory:

- **User Manuals**:
    - [Student & Faculty User Manual](docs/manual/OhMyGAD!%20Student%20and%20Faculty%20Manual.pdf)
    - [Staff User Manual](docs/manual/OhMyGAD!%20Staff%20Manual.pdf)
    - [Admin User Manual](docs/manual/OhMyGAD!%20Admin%20Manual.pdf)
- **System Architecture**:
    - [System Architecture Document (SAD)](docs/system-arch/OhMyGAD!%20SAD.pdf)

---

## Authors & Credits

Developed by **128 Sheeps** in partial fulfillment of the requirements for the course **CMSC 128 (Introduction to Software Engineering)** at the **University of the Philippines Baguio.**

- **Shaun Julius Abiva**
- **Duncan Red Benedict De Guzman**
- **Jessica Bea Novesteras**
- **Arielle Mae Solis**

_Special thanks to the Kasarian Gender Studies Program Office, UP Baguio :D_
