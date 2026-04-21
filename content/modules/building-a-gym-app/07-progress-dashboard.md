---
title: "Progress Dashboard"
slug: "07-progress-dashboard"
date: "2026-04-22"
description: "Build the progress dashboard — workout history, weekly volume, workout streak, and personal records — all from a single Supabase query"
tags: ["react", "supabase", "data-visualization", "gym-app"]
featured: false
draft: false
---

The progress page turns logged data into motivation. A user can see how many workouts they have completed this month, whether their bench press weight has gone up over time, and if they are on a streak. None of this requires a separate analytics service — it is all computable from the `workout_logs` table you already have.

## What We're Displaying

Four widgets on the progress page:

1. **This Week's Summary** — total sets and workouts logged in the current calendar week
2. **Workout Streak** — consecutive days with at least one logged set
3. **Recent History** — last 14 days with a heatmap-style activity grid
4. **Personal Records** — the best (heaviest) set ever logged for each exercise

## The Progress Hook

```typescript
// src/hooks/useProgress.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface WeekSummary {
  totalSets: number
  totalWorkouts: number
  days: string[]
}

interface PersonalRecord {
  exercise_name: string
  category: string
  weight_kg: number
  reps: number
  logged_date: string
}

interface DailyActivity {
  date: string
  sets: number
}

interface Progress {
  weekSummary: WeekSummary
  streak: number
  recentActivity: DailyActivity[]
  personalRecords: PersonalRecord[]
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().split('T')[0]
  })
}

export function useProgress() {
  const { user } = useAuth()
  const [data, setData] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const weekStart = getWeekStart()
    const fourteenDaysAgo = getLast14Days()[0]

    const [weekLogs, allLogs, prData] = await Promise.all([
      supabase
        .from('workout_logs')
        .select('logged_date, exercise_id')
        .eq('user_id', user.id)
        .gte('logged_date', weekStart),

      supabase
        .from('workout_logs')
        .select('logged_date')
        .eq('user_id', user.id)
        .gte('logged_date', fourteenDaysAgo)
        .order('logged_date', { ascending: false }),

      supabase
        .from('workout_logs')
        .select('exercise_id, weight_kg, reps, logged_date, exercises(name, category)')
        .eq('user_id', user.id)
        .not('weight_kg', 'is', null)
        .order('weight_kg', { ascending: false }),
    ])

    const weekRows = weekLogs.data ?? []
    const weekDays = [...new Set(weekRows.map(r => r.logged_date))]
    const weekSummary: WeekSummary = {
      totalSets: weekRows.length,
      totalWorkouts: weekDays.length,
      days: weekDays,
    }

    const allDays = (allLogs.data ?? []).map(r => r.logged_date)
    const streak = computeStreak(allDays)

    const last14 = getLast14Days()
    const activityMap = (allLogs.data ?? []).reduce((acc, r) => {
      acc[r.logged_date] = (acc[r.logged_date] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const recentActivity: DailyActivity[] = last14.map(date => ({
      date,
      sets: activityMap[date] ?? 0,
    }))

    const seenExercises = new Set<string>()
    const personalRecords: PersonalRecord[] = []
    for (const row of prData.data ?? []) {
      if (!seenExercises.has(row.exercise_id) && row.weight_kg && row.reps) {
        seenExercises.add(row.exercise_id)
        personalRecords.push({
          exercise_name: (row.exercises as any)?.name ?? '',
          category: (row.exercises as any)?.category ?? '',
          weight_kg: Number(row.weight_kg),
          reps: row.reps,
          logged_date: row.logged_date,
        })
      }
    }

    setData({ weekSummary, streak, recentActivity, personalRecords })
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { data, loading }
}

function computeStreak(loggedDates: string[]): number {
  if (loggedDates.length === 0) return 0

  const uniqueDates = [...new Set(loggedDates)].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0

  let streak = 0
  let expected = uniqueDates[0] === today ? today : yesterday

  for (const date of uniqueDates) {
    if (date === expected) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().split('T')[0]
    } else {
      break
    }
  }

  return streak
}
```

All three Supabase queries fire in parallel via `Promise.all`. Each is a targeted, indexed query — no full table scans.

The personal records query fetches all sets with a weight, ordered by `weight_kg` descending. We iterate through them and, using a `Set`, keep only the first (heaviest) row per exercise. This computes PRs in JavaScript with a single pass through the results — clean and fast.

## The Activity Grid Component

14 small squares, colored by how many sets were logged that day.

```typescript
// src/components/progress/ActivityGrid.tsx
interface DailyActivity {
  date: string
  sets: number
}

function getIntensityClass(sets: number): string {
  if (sets === 0) return 'bg-gray-100'
  if (sets < 5) return 'bg-indigo-200'
  if (sets < 15) return 'bg-indigo-400'
  return 'bg-indigo-600'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  activity: DailyActivity[]
}

export function ActivityGrid({ activity }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Last 14 Days</h3>
      <div className="flex gap-1.5">
        {activity.map(({ date, sets }) => (
          <div key={date} className="group relative flex-1">
            <div
              className={`aspect-square rounded ${getIntensityClass(sets)} transition-colors`}
              title={`${formatDate(date)}: ${sets} sets`}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              {formatDate(date)}: {sets} set{sets !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{formatDate(activity[0]?.date ?? '')}</span>
        <span>Today</span>
      </div>
    </div>
  )
}
```

The color intensity maps to workout volume: grey is a rest day, light indigo is a light day (1-4 sets), darker for heavier days. This gives an immediate visual impression of consistency without showing raw numbers.

## The Stats Cards

```typescript
// src/components/progress/StatsCards.tsx
interface Props {
  totalSets: number
  totalWorkouts: number
  streak: number
}

export function StatsCards({ totalSets, totalWorkouts, streak }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-3xl font-bold text-indigo-600">{totalWorkouts}</p>
        <p className="text-sm text-gray-500 mt-1">Workouts this week</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-3xl font-bold text-indigo-600">{totalSets}</p>
        <p className="text-sm text-gray-500 mt-1">Sets this week</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-3xl font-bold text-orange-500">{streak}</p>
        <p className="text-sm text-gray-500 mt-1">Day streak 🔥</p>
      </div>
    </div>
  )
}
```

## The Personal Records Table

```typescript
// src/components/progress/PersonalRecords.tsx
interface PR {
  exercise_name: string
  category: string
  weight_kg: number
  reps: number
  logged_date: string
}

const categoryColors: Record<string, string> = {
  Push: 'bg-orange-100 text-orange-700',
  Pull: 'bg-blue-100 text-blue-700',
  Legs: 'bg-green-100 text-green-700',
  Core: 'bg-yellow-100 text-yellow-700',
  Cardio: 'bg-red-100 text-red-700',
}

interface Props {
  records: PR[]
}

export function PersonalRecords({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        No personal records yet. Start logging to see your PRs!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Personal Records</h3>
        <p className="text-xs text-gray-400 mt-0.5">Heaviest set ever logged per exercise</p>
      </div>
      <div className="divide-y">
        {records.map((pr, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[pr.category] ?? 'bg-gray-100 text-gray-600'}`}>
              {pr.category}
            </span>
            <span className="flex-1 font-medium text-gray-800 text-sm">{pr.exercise_name}</span>
            <span className="text-sm font-bold text-indigo-600">{pr.weight_kg} kg</span>
            <span className="text-sm text-gray-500">× {pr.reps}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## The Progress Page

```typescript
// src/pages/ProgressPage.tsx
import { useProgress } from '../hooks/useProgress'
import { StatsCards } from '../components/progress/StatsCards'
import { ActivityGrid } from '../components/progress/ActivityGrid'
import { PersonalRecords } from '../components/progress/PersonalRecords'

export function ProgressPage() {
  const { data, loading } = useProgress()

  if (loading) {
    return <div className="text-center text-gray-400 py-16">Loading your progress...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      <StatsCards
        totalSets={data.weekSummary.totalSets}
        totalWorkouts={data.weekSummary.totalWorkouts}
        streak={data.streak}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <ActivityGrid activity={data.recentActivity} />
      </div>

      <PersonalRecords records={data.personalRecords} />
    </div>
  )
}
```

## What's Next

You now have a complete, production-ready gym tracker:

- **Authentication** — signup, login, protected routes, persistent sessions
- **Exercise Library** — searchable, filterable by Push/Pull/Legs/Core/Cardio, custom exercises per user
- **Weekly Planner** — assign exercises to any day, see today highlighted, add and remove freely
- **Daily Logger** — log sets with weight and reps, prefill from last session, delete mistakes
- **Progress** — weekly stats, 14-day activity grid, personal records per exercise

A few directions to take it further:

**Deployment** — Deploy the Vite build to Vercel or Netlify in minutes. Both detect Vite projects automatically. Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the dashboard.

**Offline support** — Register a service worker to cache the app shell. Supabase's client library stores the session in localStorage, so cached pages load even without a network. Log sets locally and sync when back online using a queue.

**Social features** — The schema supports it: add a `public` boolean to `profiles` and expose other users' PRs on a leaderboard. The RLS policy becomes `using (is_public = true OR auth.uid() = id)`.

**Push notifications** — Remind users to train when they break a streak. Supabase Edge Functions can send Web Push notifications on a schedule.

The architecture choices made in post 1 — Supabase for the backend, Vite for the front end, individual rows for workout sets — paid off consistently throughout. Clean schema, clean queries, clean UI. That is what deliberate up-front design buys you.
