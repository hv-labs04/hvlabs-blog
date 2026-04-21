---
title: "Exercise Library with Filtering"
slug: "04-exercise-library-with-filtering"
date: "2026-04-22"
description: "Build the searchable, filterable exercise library — the foundation every other feature in the app depends on"
tags: ["react", "supabase", "hooks", "filtering", "gym-app"]
featured: false
draft: false
---

The exercise library is the most-used page in the app. Every time someone adds an exercise to their weekly plan or starts logging, they come here first. It needs to load fast, filter instantly, and let users add their own exercises without friction.

In this post we build the complete exercise library: loading from Supabase, filtering by category, searching by name, and adding custom exercises.

## The Exercise Hook

Data fetching belongs in a hook, not a page component. This keeps the page component focused on rendering and makes the fetching logic reusable if another page ever needs exercises.

Create `src/hooks/useExercises.ts`:

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type Category = Database['public']['Enums']['exercise_category']

interface UseExercisesOptions {
  category?: Category | null
  search?: string
}

export function useExercises({ category, search }: UseExercisesOptions = {}) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('exercises').select('*').order('name')

    if (category) {
      query = query.eq('category', category)
    }

    if (search && search.trim().length > 0) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setExercises(data ?? [])
    }
    setLoading(false)
  }, [category, search])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  return { exercises, loading, error, refetch: fetchExercises }
}
```

A few things worth noting:

The query chains `.eq('category', category)` and `.ilike('name', ...)` conditionally. The Supabase client builder is lazy — these methods just accumulate conditions; nothing runs until you `await` the result. This lets you build queries dynamically without string concatenation.

`ilike` is case-insensitive LIKE. A user typing "bench" will match "Bench Press". We use `%${search}%` so it matches anywhere in the name, not just the start.

The `useCallback` on `fetchExercises` with `[category, search]` as dependencies means the effect only re-runs when the filter actually changes — not on every render.

## The Category Filter Component

The filter is a row of pill buttons, one per category plus an "All" option.

```typescript
// src/components/exercises/ExerciseFilter.tsx
type Category = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio'

const CATEGORIES: Category[] = ['Push', 'Pull', 'Legs', 'Core', 'Cardio']

const categoryColors: Record<Category, string> = {
  Push: 'bg-orange-100 text-orange-700 border-orange-200',
  Pull: 'bg-blue-100 text-blue-700 border-blue-200',
  Legs: 'bg-green-100 text-green-700 border-green-200',
  Core: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Cardio: 'bg-red-100 text-red-700 border-red-200',
}

interface Props {
  selected: Category | null
  onChange: (category: Category | null) => void
}

export function ExerciseFilter({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          selected === null
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        All
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(selected === cat ? null : cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selected === cat
              ? categoryColors[cat] + ' ring-2 ring-offset-1 ring-current'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
```

Each category gets a consistent color. Clicking a selected category deselects it (toggle behavior). The active state uses a ring for clear visual feedback.

## The Exercise Card Component

```typescript
// src/components/exercises/ExerciseCard.tsx
import type { Database } from '../../lib/types'

type Exercise = Database['public']['Tables']['exercises']['Row']

const categoryColors = {
  Push: 'bg-orange-100 text-orange-700',
  Pull: 'bg-blue-100 text-blue-700',
  Legs: 'bg-green-100 text-green-700',
  Core: 'bg-yellow-100 text-yellow-700',
  Cardio: 'bg-red-100 text-red-700',
}

interface Props {
  exercise: Exercise
  onAddToPlan?: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, onAddToPlan }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{exercise.name}</h3>
          {!exercise.is_default && (
            <span className="text-xs text-gray-400 shrink-0">Custom</span>
          )}
        </div>
        {exercise.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{exercise.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[exercise.category]}`}>
          {exercise.category}
        </span>
        {onAddToPlan && (
          <button
            onClick={() => onAddToPlan(exercise)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            + Plan
          </button>
        )}
      </div>
    </div>
  )
}
```

## The Add Exercise Modal

Users need a way to add custom exercises. A modal keeps them on the exercises page rather than navigating away.

```typescript
// src/components/exercises/AddExerciseModal.tsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Category = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio'
const CATEGORIES: Category[] = ['Push', 'Pull', 'Legs', 'Core', 'Cardio']

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function AddExerciseModal({ onClose, onCreated }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('Push')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('exercises').insert({
      name: name.trim(),
      category,
      description: description.trim() || null,
      created_by: user.id,
      is_default: false,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onCreated()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Add Custom Exercise</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

## The Exercises Page

Now compose everything together in the page:

```typescript
// src/pages/ExercisesPage.tsx
import { useState } from 'react'
import { useExercises } from '../hooks/useExercises'
import { ExerciseFilter } from '../components/exercises/ExerciseFilter'
import { ExerciseCard } from '../components/exercises/ExerciseCard'
import { AddExerciseModal } from '../components/exercises/AddExerciseModal'

type Category = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio'

export function ExercisesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { exercises, loading, refetch } = useExercises({
    category: selectedCategory,
    search,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Exercise
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <ExerciseFilter selected={selectedCategory} onChange={setSelectedCategory} />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading exercises...</div>
      ) : exercises.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          {search || selectedCategory ? 'No exercises match your filter.' : 'No exercises yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map(exercise => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}

      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onCreated={refetch}
        />
      )}
    </div>
  )
}
```

## How the Filtering Works End-to-End

When the user clicks "Legs":
1. `selectedCategory` state updates to `'Legs'`
2. `useExercises` receives the new `category` prop
3. `useCallback` detects the dependency changed, creating a new `fetchExercises` function
4. `useEffect` detects the new function reference and re-runs, firing the Supabase query
5. The query hits Postgres with `WHERE category = 'Legs'` and only Supabase's RLS filter applies on top
6. The result returns and `exercises` state updates, re-rendering the list

Filtering is handled server-side in Postgres, not client-side in JavaScript. This means even a library with thousands of exercises stays fast — the browser never downloads rows it does not need.

In the next post we build the weekly planner: assigning exercises from this library to specific days of the week.
