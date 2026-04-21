---
title: "Daily Workout Logger"
slug: "06-daily-workout-logger"
date: "2026-04-22"
description: "Build the daily workout logger — load today's planned exercises and let users log every set with weight and reps in real time"
tags: ["react", "supabase", "realtime", "gym-app"]
featured: false
draft: false
---

The logger is the page users open every time they train. It shows today's planned exercises and lets them log sets — weight and reps — as they complete them. It needs to feel fast and responsive. Nobody wants to wait for a spinner between sets.

In this post we build the complete logger: loading today's plan, adding sets, deleting mistakes, and showing a completion summary.

## The Logger Hook

The logger needs data from two tables:
1. `weekly_plan_exercises` — what exercises are planned for today
2. `workout_logs` — what sets the user has already logged today

Create `src/hooks/useWorkoutLog.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/types'

type DayOfWeek = Database['public']['Enums']['day_of_week']
type Exercise = Database['public']['Tables']['exercises']['Row']
type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']

interface LoggedSet {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
}

interface PlannedExercise {
  plan_id: string
  exercise: Exercise
  sets: LoggedSet[]
}

function getTodayDayName(): DayOfWeek {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function useWorkoutLog() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<PlannedExercise[]>([])
  const [loading, setLoading] = useState(true)
  const today = getTodayDate()

  const fetchLog = useCallback(async () => {
    if (!user) return
    const day = getTodayDayName()

    const [planResult, logsResult] = await Promise.all([
      supabase
        .from('weekly_plan_exercises')
        .select('id, sort_order, exercises(*)')
        .eq('user_id', user.id)
        .eq('day', day)
        .order('sort_order'),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('set_number'),
    ])

    if (planResult.data) {
      const logsByExercise = (logsResult.data ?? []).reduce((acc, log) => {
        if (!acc[log.exercise_id]) acc[log.exercise_id] = []
        acc[log.exercise_id].push(log)
        return acc
      }, {} as Record<string, WorkoutLog[]>)

      setExercises(
        planResult.data.map(pe => ({
          plan_id: pe.id,
          exercise: pe.exercises as Exercise,
          sets: (logsByExercise[pe.exercises.id] ?? []).map(log => ({
            id: log.id,
            set_number: log.set_number,
            reps: log.reps,
            weight_kg: log.weight_kg ? Number(log.weight_kg) : null,
          })),
        }))
      )
    }
    setLoading(false)
  }, [user, today])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  const addSet = async (exerciseId: string, reps: number, weightKg: number | null) => {
    if (!user) return
    const exercise = exercises.find(e => e.exercise.id === exerciseId)
    const nextSetNumber = (exercise?.sets.length ?? 0) + 1

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        logged_date: today,
        set_number: nextSetNumber,
        reps,
        weight_kg: weightKg,
      })
      .select()
      .single()

    if (!error && data) {
      setExercises(prev =>
        prev.map(e =>
          e.exercise.id === exerciseId
            ? {
                ...e,
                sets: [
                  ...e.sets,
                  { id: data.id, set_number: nextSetNumber, reps, weight_kg: weightKg },
                ],
              }
            : e
        )
      )
    }
  }

  const removeSet = async (setId: string, exerciseId: string) => {
    await supabase.from('workout_logs').delete().eq('id', setId)
    setExercises(prev =>
      prev.map(e =>
        e.exercise.id === exerciseId
          ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
          : e
      )
    )
  }

  return { exercises, loading, addSet, removeSet }
}
```

`Promise.all` fires both queries at the same time — the plan and today's existing logs load in parallel instead of one after the other. For a page that opens constantly, this latency saving adds up.

`addSet` updates local state immediately after the Supabase insert succeeds. The UI does not wait for a full refetch — the new set appears instantly. This is the right pattern for a gym logger where the user is logging sets rapidly between rest periods.

## The Set Row Component

Each set is displayed as a row: set number, reps, weight, and a delete button.

```typescript
// src/components/logger/SetRow.tsx
interface Props {
  setNumber: number
  reps: number | null
  weightKg: number | null
  onDelete: () => void
}

export function SetRow({ setNumber, reps, weightKg, onDelete }: Props) {
  return (
    <div className="group flex items-center gap-4 py-1.5 text-sm">
      <span className="w-6 text-center text-gray-400 font-mono text-xs">{setNumber}</span>
      <span className="w-20 text-gray-700 font-medium">
        {weightKg != null ? `${weightKg} kg` : '—'}
      </span>
      <span className="w-16 text-gray-700">
        {reps != null ? `${reps} reps` : '—'}
      </span>
      <button
        onClick={onDelete}
        className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-xs transition-all"
      >
        ✕
      </button>
    </div>
  )
}
```

## The Log Exercise Component

Each exercise card shows logged sets and a form to add a new one.

```typescript
// src/components/logger/LogExercise.tsx
import { useState } from 'react'
import { SetRow } from './SetRow'

interface Set {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
}

interface Props {
  exerciseId: string
  exerciseName: string
  category: string
  sets: Set[]
  onAddSet: (exerciseId: string, reps: number, weightKg: number | null) => Promise<void>
  onRemoveSet: (setId: string, exerciseId: string) => void
}

const categoryColors: Record<string, string> = {
  Push: 'text-orange-600 bg-orange-50',
  Pull: 'text-blue-600 bg-blue-50',
  Legs: 'text-green-600 bg-green-50',
  Core: 'text-yellow-600 bg-yellow-50',
  Cardio: 'text-red-600 bg-red-50',
}

export function LogExercise({ exerciseId, exerciseName, category, sets, onAddSet, onRemoveSet }: Props) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const parsedReps = parseInt(reps)
    if (isNaN(parsedReps) || parsedReps <= 0) return

    const parsedWeight = weight ? parseFloat(weight) : null
    setAdding(true)
    await onAddSet(exerciseId, parsedReps, parsedWeight)
    setReps('')
    setWeight('')
    setAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 flex-1">{exerciseName}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[category] ?? 'bg-gray-100 text-gray-600'}`}>
          {category}
        </span>
      </div>

      {sets.length > 0 && (
        <div className="mb-3 border-b pb-3">
          <div className="flex gap-4 text-xs text-gray-400 mb-1 pl-7">
            <span className="w-20">Weight</span>
            <span className="w-16">Reps</span>
          </div>
          {sets.map(set => (
            <SetRow
              key={set.id}
              setNumber={set.set_number}
              reps={set.reps}
              weightKg={set.weight_kg}
              onDelete={() => onRemoveSet(set.id, exerciseId)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="w-6 text-center text-gray-300 font-mono text-xs">{sets.length + 1}</span>
        <input
          type="number"
          placeholder="kg"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="0"
          step="0.5"
        />
        <input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={e => setReps(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="1"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !reps}
          className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-sm font-medium disabled:opacity-40"
        >
          {adding ? '...' : `Log Set ${sets.length + 1}`}
        </button>
      </div>
    </div>
  )
}
```

The `Enter` key on either input field fires `handleAdd`. When you are mid-workout with sweaty hands, tabbing between fields and hitting Enter is faster than reaching for a button.

Weight is optional — bodyweight exercises like pull-ups do not have a weight. Setting `parsedWeight = null` for an empty weight field handles this gracefully.

## The Logger Page

```typescript
// src/pages/LoggerPage.tsx
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { LogExercise } from '../components/logger/LogExercise'

export function LoggerPage() {
  const { exercises, loading, addSet, removeSet } = useWorkoutLog()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0)

  if (loading) {
    return <div className="text-center text-gray-400 py-16">Loading today&apos;s workout...</div>
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-2">Rest Day</p>
        <p className="text-gray-400 text-sm">No exercises planned for today.</p>
        <p className="text-gray-400 text-sm mt-1">
          Go to the <a href="/planner" className="text-indigo-600 underline">Weekly Plan</a> to add some.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Workout</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
        {totalSets > 0 && (
          <p className="text-indigo-600 text-sm font-medium mt-1">
            {totalSets} set{totalSets !== 1 ? 's' : ''} logged
          </p>
        )}
      </div>

      <div className="space-y-4">
        {exercises.map(({ plan_id, exercise, sets }) => (
          <LogExercise
            key={plan_id}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            category={exercise.category}
            sets={sets}
            onAddSet={addSet}
            onRemoveSet={removeSet}
          />
        ))}
      </div>
    </div>
  )
}
```

The "Rest Day" state is important. If today has no planned exercises, the page should say so clearly rather than showing an empty list with no explanation. The link back to the planner helps new users understand the connection between features.

## Prefilling the Last Session's Weight

A small quality-of-life improvement: pre-fill the weight input with the last recorded weight for that exercise. This is how real gym apps work — you do not retype 100 kg every Monday.

Add this to the hook and pass it down to `LogExercise`:

```typescript
const getLastWeight = useCallback(async (exerciseId: string): Promise<number | null> => {
  if (!user) return null
  const { data } = await supabase
    .from('workout_logs')
    .select('weight_kg')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .not('weight_kg', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.weight_kg ? Number(data.weight_kg) : null
}, [user])
```

Call this when the user focuses the weight input for the first time on a set. The query fetches just one row — the most recent non-null weight for that exercise — from the entire history.

In the final post we build the progress dashboard: a view of workout history, total sets per week, and personal records.
