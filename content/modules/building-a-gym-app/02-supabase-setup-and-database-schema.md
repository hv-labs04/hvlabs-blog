---
title: "Supabase Setup & Database Schema"
slug: "02-supabase-setup-and-database-schema"
date: "2026-04-22"
description: "Design the complete database schema, write the migrations, and lock down every table with Row Level Security policies"
tags: ["supabase", "postgresql", "database-design", "rls", "gym-app"]
featured: false
draft: false
---

The database schema is the most important decision in this project. Get it wrong and you will be fighting migrations and rewriting queries for the rest of the build. Get it right and every feature falls into place naturally.

In this post we will create the Supabase project, design four tables, and write Row Level Security policies that ensure users can only ever touch their own data.

## Creating the Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users.
3. Save your database password — you will need it for migrations.
4. Once ready, go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon` public key

Create a `.env` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **"But these keys are visible to users — isn't that a security problem?"**
>
> No, and this is intentional. Any variable prefixed with `VITE_` gets bundled into the JavaScript that ships to the browser. Anyone can open DevTools and read these values. Supabase is designed with this in mind.
>
> The `anon` key is **public by design** — it only identifies your project. On its own it cannot read or write any data. **Row Level Security is the actual lock.** Every query Supabase runs is automatically filtered by the authenticated user's ID at the database level. Even if someone copies your anon key and writes their own queries against your database, they can only ever see rows that belong to them.
>
> The `service_role` key is different — it bypasses RLS entirely and has full access to every row. It must **never** go in a `VITE_` variable or anywhere near the browser. If you ever need it (for admin scripts or server-side jobs), it belongs only in a backend environment variable that is never shipped to the client.
>
> This is the same trust model as Firebase's client config: the config is public, the security rules are the gate.

## Setting Up the Vite Project

Scaffold the project and install dependencies:

```bash
npm create vite@latest gym-app -- --template react-ts
cd gym-app
npm install
npm install @supabase/supabase-js react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Create the Supabase client in `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(url, key)
```

We pass `Database` as a generic so every query is fully typed. We will generate that type file after creating the schema.

## The Schema

We have four tables. Each one has a single responsibility.

### Table 1: `profiles`

Supabase Auth creates a row in `auth.users` when someone signs up. That table is managed by Supabase — you cannot add columns to it. The `profiles` table extends it with the data you own.

```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  created_at timestamptz default now()
);
```

The `id` column is a foreign key to `auth.users(id)`. The `on delete cascade` means if the auth user is deleted, their profile is deleted too — no orphaned rows.

### Table 2: `exercises`

The exercise catalogue. Every exercise in the app lives here.

```sql
create type exercise_category as enum (
  'Push', 'Pull', 'Legs', 'Core', 'Cardio'
);

create table exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category exercise_category not null,
  description text,
  is_default boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
```

Two types of exercises exist in this table:

- **Default exercises** (`is_default = true`, `created_by = null`) — the built-in library seeded by you. Every user sees these.
- **Custom exercises** (`is_default = false`, `created_by = user_id`) — exercises a specific user created. Only they can see them.

One table, two kinds of rows. The RLS policy enforces the visibility rule — there is no need for a separate "user_exercises" table.

The `category` column uses a Postgres enum. This is better than a plain `text` column because Postgres rejects any value not in the enum at write time — no need to validate this in your application code.

### Table 3: `weekly_plan_exercises`

This table answers: "what exercises does this user plan to do on which day of the week?"

```sql
create type day_of_week as enum (
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday'
);

create table weekly_plan_exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  day day_of_week not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique(user_id, exercise_id, day)
);
```

Each row says: "this user plans to do this exercise on this day." The `unique` constraint prevents the same exercise being added to the same day twice. The `sort_order` column lets users reorder exercises within a day.

Notice there is no `weekly_plans` parent table. A user has exactly one weekly plan — it is simply the set of rows with their `user_id`. Adding a parent table would introduce unnecessary complexity without adding value.

### Table 4: `workout_logs`

The daily workout log. Each row is one set of one exercise on one date.

```sql
create table workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  logged_date date not null default current_date,
  set_number integer not null,
  reps integer,
  weight_kg numeric(6, 2),
  notes text,
  created_at timestamptz default now()
);

create index workout_logs_user_date_idx on workout_logs(user_id, logged_date);
```

Each set is its own row. Three sets of bench press = three rows with `set_number = 1`, `2`, `3`.

Why store sets as individual rows instead of an array? Because rows are queryable. "What is the user's best set of bench press ever?" is a single `ORDER BY weight_kg DESC LIMIT 1`. With a JSON array you would need to unnest it first. Individual rows also make it trivial to delete or edit a specific set.

The index on `(user_id, logged_date)` covers the most common query: "give me all of this user's logs for today." Without it, Postgres scans the entire table on every page load.

## Row Level Security

RLS is what makes Supabase safe to query directly from the browser. Without it, anyone with your `anon` key could read every row in every table. With it, every query is automatically filtered by the authenticated user's ID — at the database level, not the application level.

Enable RLS on all four tables first:

```sql
alter table profiles enable row level security;
alter table exercises enable row level security;
alter table weekly_plan_exercises enable row level security;
alter table workout_logs enable row level security;
```

Now write the policies.

### Profiles

```sql
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
```

### Exercises

```sql
-- All users see the built-in exercise library
create policy "Default exercises are public"
  on exercises for select
  using (is_default = true);

-- Users see and manage only their own custom exercises
create policy "Users can manage own exercises"
  on exercises for all
  using (auth.uid() = created_by);
```

Supabase evaluates multiple policies with OR logic — a row is visible if it passes either policy. So a user sees: all default exercises + their own custom exercises. Exactly right.

### Weekly Plan and Workout Logs

```sql
create policy "Users own their weekly plan"
  on weekly_plan_exercises for all
  using (auth.uid() = user_id);

create policy "Users own their workout logs"
  on workout_logs for all
  using (auth.uid() = user_id);
```

## Seeding Default Exercises

Run this in the Supabase SQL editor to populate the exercise library:

```sql
insert into exercises (name, category, is_default) values
  ('Bench Press', 'Push', true),
  ('Overhead Press', 'Push', true),
  ('Push-Up', 'Push', true),
  ('Dumbbell Shoulder Press', 'Push', true),
  ('Dips', 'Push', true),
  ('Pull-Up', 'Pull', true),
  ('Barbell Row', 'Pull', true),
  ('Lat Pulldown', 'Pull', true),
  ('Seated Cable Row', 'Pull', true),
  ('Face Pull', 'Pull', true),
  ('Back Squat', 'Legs', true),
  ('Romanian Deadlift', 'Legs', true),
  ('Leg Press', 'Legs', true),
  ('Lunges', 'Legs', true),
  ('Leg Curl', 'Legs', true),
  ('Plank', 'Core', true),
  ('Hanging Leg Raise', 'Core', true),
  ('Cable Crunch', 'Core', true),
  ('Ab Wheel Rollout', 'Core', true),
  ('Running', 'Cardio', true),
  ('Cycling', 'Cardio', true),
  ('Jump Rope', 'Cardio', true);
```

## Generating TypeScript Types

Supabase generates TypeScript types directly from your live schema:

```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/types.ts
```

This creates a `Database` type that maps every table and column. When you query `supabase.from('exercises').select()`, TypeScript knows the exact shape of each returned row. This is the biggest ergonomic win in the whole stack.

In the next post we build the authentication flow — signup, login, session persistence, and the protected route wrapper that guards every page behind a login check.
