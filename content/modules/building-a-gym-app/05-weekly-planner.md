---
title: "Weekly Planner"
slug: "05-weekly-planner"
date: "2026-04-22"
description: "Build the weekly planner — a 7-column grid where users assign exercises to days and build a repeating training schedule"
tags: ["react", "supabase", "drag-and-drop", "gym-app"]
featured: false
draft: false
---

The weekly planner is where a user's training program lives. They assign exercises to days, and that assignment repeats every week. Monday is always Push, Thursday is always Legs. The planner does not change week to week — only the daily log records what actually happened.

This is the most stateful page in the app. Each day column is interactive: add exercises, remove them, and reorder them. Let's build it.

## The Planner Hook

The planner needs to read and write `weekly_plan_exercises`. Create `src/hooks/usePlan.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/types'

type DayOfWeek = Database['public']['Enums']['day_of_week']
type PlanExercise = Database['public']['Tables']['weekly_plan_exercises']['Row'] & {
  exercises: Database['public']['Tables']['exercises']['Row']
}

const DAYS: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
]

export function usePlan() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Record<DayOfWeek, PlanExercise[]>>(
    Object.fromEntries(DAYS.map(d => [d, []])) as Record<DayOfWeek, PlanExercise[]>
  )
  const [loading, setLoading] = useState(true)

  const fetchPlan = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('weekly_plan_exercises')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('sort_order')

    if (data) {
      const grouped = Object.fromEntries(DAYS.map(d => [d, []])) as Record<DayOfWeek, PlanExercise[]>
      for (const row of data) {
        grouped[row.day as DayOfWeek].push(row as PlanExercise)
      }
      setPlan(grouped)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const addExercise = async (exerciseId: string, day: DayOfWeek) => {
    if (!user) return
    const dayExercises = plan[day]
    const sortOrder = dayExercises.length

    await supabase.from('weekly_plan_exercises').insert({
      user_id: user.id,
      exercise_id: exerciseId,
      day,
      sort_order: sortOrder,
    })

    fetchPlan()
  }

  const removeExercise = async (planExerciseId: string) => {
    await supabase
      .from('weekly_plan_exercises')
      .delete()
      .eq('id', planExerciseId)

    fetchPlan()
  }

  return { plan, loading, addExercise, removeExercise, DAYS }
}
```

The key query here is `select('*, exercises(*)')`. The `exercises(*)` part is a Supabase foreign key join — because `weekly_plan_exercises.exercise_id` references `exercises.id`, Supabase knows how to join them and returns the full exercise object nested inside each plan row. No second query needed.

We initialize `plan` as an object with all seven days as empty arrays. After fetching, we group the flat array of database rows by their `day` field. This structure — `{ Monday: [...], Tuesday: [...] }` — maps directly onto the 7-column grid UI.

## The Day Column Component

Each column shows the exercises planned for that day and provides controls to add or remove them.

```typescript
// src/components/planner/DayColumn.tsx
import type { Database } from '../../lib/types'

type DayOfWeek = Database['public']['Enums']['day_of_week']
type PlanExercise = Database['public']['Tables']['weekly_plan_exercises']['Row'] & {
  exercises: Database['public']['Tables']['exercises']['Row']
}

const categoryDots: Record<string, string> = {
  Push: 'bg-orange-400',
  Pull: 'bg-blue-400',
  Legs: 'bg-green-400',
  Core: 'bg-yellow-400',
  Cardio: 'bg-red-400',
}

interface Props {
  day: DayOfWeek
  exercises: PlanExercise[]
  onAdd: () => void
  onRemove: (id: string) => void
}

export function DayColumn({ day, exercises, onAdd, onRemove }: Props) {
  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day

  return (
    <div className={`flex flex-col rounded-xl border p-3 min-h-48 ${isToday ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
          {day.slice(0, 3)}
          {isToday && <span className="ml-1 text-xs font-normal">Today</span>}
        </span>
        <button
          onClick={onAdd}
          className="text-gray-400 hover:text-indigo-600 transition-colors text-lg leading-none"
          title={`Add exercise to ${day}`}
        >
          +
        </button>
      </div>

      <div className="flex-1 space-y-1.5">
        {exercises.length === 0 ? (
          <p className="text-xs text-gray-300 text-center pt-4">Rest day</p>
        ) : (
          exercises.map(pe => (
            <div
              key={pe.id}
              className="group flex items-center gap-2 text-sm text-gray-700 py-1 px-2 rounded-lg hover:bg-gray-50"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${categoryDots[pe.exercises.category]}`} />
              <span className="flex-1 truncate">{pe.exercises.name}</span>
              <button
                onClick={() => onRemove(pe.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

Days that have no exercises show "Rest day" in light grey — a friendly indicator rather than an empty void. Today's column is highlighted in indigo so users immediately know which day they are on. The remove button is hidden by default and appears on hover — a clean pattern that reduces visual noise without hiding functionality.

## The Add Exercise Picker

When a user clicks `+` on a day, a picker opens to browse and select exercises from the library.

```typescript
// src/components/planner/ExercisePicker.tsx
import { useState } from 'react'
import { useExercises } from '../../hooks/useExercises'
import type { Database } from '../../lib/types'

type DayOfWeek = Database['public']['Enums']['day_of_week']
type Category = Database['public']['Enums']['exercise_category']

interface Props {
  day: DayOfWeek
  onSelect: (exerciseId: string, day: DayOfWeek) => void
  onClose: () => void
}

const CATEGORIES: Category[] = ['Push', 'Pull', 'Legs', 'Core', 'Cardio']

export function ExercisePicker({ day, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const { exercises, loading } = useExercises({ category, search })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Add to {day}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${!category ? 'bg-gray-900 text-white' : 'border-gray-200 text-gray-600'}`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
          ) : exercises.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No exercises found</p>
          ) : (
            exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex.id, day); onClose() }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 flex items-center gap-3"
              >
                <span className="flex-1 text-sm font-medium text-gray-800">{ex.name}</span>
                <span className="text-xs text-gray-400">{ex.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

This picker reuses the `useExercises` hook from the exercise library page. The same filtering logic, the same data, a different presentation. This is why data fetching belongs in hooks — it composes.

## The Planner Page

```typescript
// src/pages/PlannerPage.tsx
import { useState } from 'react'
import { usePlan } from '../hooks/usePlan'
import { DayColumn } from '../components/planner/DayColumn'
import { ExercisePicker } from '../components/planner/ExercisePicker'
import type { Database } from '../lib/types'

type DayOfWeek = Database['public']['Enums']['day_of_week']

export function PlannerPage() {
  const { plan, loading, addExercise, removeExercise, DAYS } = usePlan()
  const [pickerDay, setPickerDay] = useState<DayOfWeek | null>(null)

  if (loading) {
    return <div className="text-center text-gray-400 py-16">Loading your plan...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Assign exercises to days. Your plan repeats every week.
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => (
          <DayColumn
            key={day}
            day={day}
            exercises={plan[day]}
            onAdd={() => setPickerDay(day)}
            onRemove={removeExercise}
          />
        ))}
      </div>

      {pickerDay && (
        <ExercisePicker
          day={pickerDay}
          onSelect={addExercise}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
```

## What a Completed Plan Looks Like

After a few minutes of setup, the planner grid might look like this:

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| Bench Press | Back Squat | Rest | Overhead Press | Romanian DL | Pull-Up | Rest |
| Overhead Press | Leg Press | | Dips | Leg Curl | Barbell Row | |
| Dips | Lunges | | Push-Up | | Lat Pulldown | |

Monday/Wednesday/Friday is a classic Push/Pull/Legs split. The planner makes this visual and effortless to set up.

In the next post we build the daily logger — the page that turns this plan into an interactive workout session where users log every set.
