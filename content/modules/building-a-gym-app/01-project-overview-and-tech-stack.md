---
title: "Project Overview & Tech Stack"
slug: "01-project-overview-and-tech-stack"
date: "2026-04-22"
description: "What we're building, why we chose each technology, and how the pieces fit together before we write a single line of code"
tags: ["react", "vite", "supabase", "typescript", "fullstack", "gym-app"]
featured: true
draft: false
---

By the end of this series you will have a fully working gym tracker that real users can sign in to and use. Not a toy demo — a complete product with authentication, a filterable exercise library, a weekly planner, and a daily log for tracking sets, reps, and weights.

This first post is not about code. It is about making deliberate choices before you write any. Every architecture decision made early either saves you hours later or costs you days. Let's make the right ones.

## What We're Building

The app has three core features:

**Exercise Library** — A searchable, filterable catalogue of exercises. Each exercise belongs to a category: Push, Pull, Legs, Core, or Cardio. Users browse the built-in library and can add their own custom exercises. This is the foundation everything else sits on.

**Weekly Planner** — Users assign exercises to days of the week. Monday might be Push day: bench press, overhead press, dips. Thursday is Legs: squats, Romanian deadlifts, leg press. The planner is reusable — set it once, follow it every week.

**Daily Workout Logger** — When a user opens today's workout, they see the exercises scheduled for that day. They log each set as they go: weight and reps, one row at a time. At the end they mark the session complete.

These three features cover the full training lifecycle: discover → plan → execute → review.

## The Tech Stack

### Vite + React

We are using [Vite](https://vitejs.dev) to scaffold and run the app, not Create React App (which is no longer maintained) and not Next.js. Vite has near-instant dev server startup, fast Hot Module Replacement, and produces optimized production bundles.

React handles the UI. This app is entirely client-rendered — the user logs in, data loads from Supabase, and the UI updates reactively. There is no server-side rendering involved, so a plain SPA is the simplest and most appropriate choice.

### TypeScript

Every table in Supabase can generate TypeScript types. Every query result is typed. When you rename a column in the database and regenerate types, every broken reference in your code lights up as a compile error before you deploy. For a database-heavy app like this, TypeScript pays for itself on day one.

### React Router v6

Client-side routing between the exercise library, planner, logger, and profile pages. React Router v6 also gives us a clean pattern for protected routes — a wrapper component that checks the auth session and redirects unauthenticated users to the login page.

### Supabase

Supabase gives you four things in one project, without writing a backend:

**Postgres database** — A real, fully-featured Postgres instance. You write real SQL, you get joins, foreign keys, and constraints. When your data model gets complicated, you will not be fighting the database.

**Row Level Security (RLS)** — Policies written in SQL that live inside the database itself. A user can only read their own workout logs. This is not enforced in your application code; it is enforced at the database layer. Even a bug in your front-end code cannot expose another user's data.

**Authentication** — Email/password signup, magic links, OAuth providers (Google, GitHub), and session management — all built in. The Supabase client handles token refresh automatically.

**Realtime** — Supabase can push database changes to the client over a WebSocket. We will use this in the workout logger so that if you open the app on your phone and your laptop at the same time, both stay in sync.

The trade-off: you are coupled to Supabase. If you need to self-host or migrate later, it takes work. For a product at this stage, that is the right trade-off. Validate the idea fast, optimize infrastructure later.

### Tailwind CSS

Utility-first CSS. Fast to write, easy to customize, and no context-switching between CSS files and component files.

## Project Structure

```
gym-app/
├── src/
│   ├── components/
│   │   ├── exercises/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseFilter.tsx
│   │   │   └── AddExerciseModal.tsx
│   │   ├── planner/
│   │   │   ├── WeekGrid.tsx
│   │   │   └── DayColumn.tsx
│   │   ├── logger/
│   │   │   ├── SetRow.tsx
│   │   │   └── LogExercise.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── ExercisesPage.tsx    ← Exercise library
│   │   ├── PlannerPage.tsx      ← Weekly planner
│   │   ├── LoggerPage.tsx       ← Today's workout
│   │   └── ProgressPage.tsx     ← History & stats
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client
│   │   └── types.ts             ← Generated DB types
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useExercises.ts
│   │   └── useWorkoutLog.ts
│   ├── App.tsx                  ← Routes + layout
│   └── main.tsx
├── .env
└── index.html
```

Pages contain the data-fetching logic and compose smaller components. Components are purely presentational — they receive props and render UI. Hooks encapsulate Supabase queries so the same data-fetching logic can be reused across multiple pages.

## What You Need to Follow Along

- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account
- Basic familiarity with React and TypeScript — you should know what a component, a prop, and a hook are

In the next post we will create the Supabase project, design the complete database schema, and write the Row Level Security policies that keep every user's data private.
