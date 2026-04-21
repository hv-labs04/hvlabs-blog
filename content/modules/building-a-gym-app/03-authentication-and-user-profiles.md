---
title: "Authentication & User Profiles"
slug: "03-authentication-and-user-profiles"
date: "2026-04-22"
description: "Build signup, login, and protected routes using Supabase Auth and React Router — with automatic profile creation on first sign-in"
tags: ["supabase", "auth", "react-router", "react", "gym-app"]
featured: false
draft: false
---

Authentication has two distinct jobs. The first is identity: who is this person, are their credentials valid, and what is their session token? The second is authorization: given a valid session, what is this person allowed to see and do?

Supabase handles identity completely. RLS handles authorization at the database level. Our job is to wire the session into React and guard pages that require a logged-in user.

## The Auth Context

We want every component in the app to know whether a user is logged in, and if so, who they are. The right tool for this is React Context.

Create `src/hooks/useAuth.ts`:

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContext {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContext>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}
```

Create `src/components/AuthProvider.tsx`:

```typescript
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

Two things happening here:

1. `getSession()` — on mount, checks localStorage for an existing session. If the user was logged in before, they stay logged in without needing to enter their password again.

2. `onAuthStateChange` — subscribes to session changes. When the user logs in, logs out, or the token refreshes, `session` updates automatically and every component re-renders with the new state.

Wrap your app with `AuthProvider` in `src/main.tsx`:

```typescript
import { AuthProvider } from './components/AuthProvider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
```

## Protected Routes

Create a `ProtectedRoute` component that redirects unauthenticated users to the login page:

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

The `loading` check is important. On first render, `getSession()` is asynchronous — there is a brief moment where `session` is `null` even if the user is logged in. Without the loading guard, authenticated users would flash to the login page every time they reload.

Wire up the routes in `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { PlannerPage } from './pages/PlannerPage'
import { LoggerPage } from './pages/LoggerPage'
import { ProgressPage } from './pages/ProgressPage'
import { Layout } from './components/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/exercises" replace />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="log" element={<LoggerPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

The `ProtectedRoute` wraps the `Layout` route, which means every nested route — exercises, planner, log, progress — is protected by a single auth check. Add a new page later and it is automatically protected.

## The Login Page

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Sign in</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-500">
          No account? <Link to="/signup" className="text-indigo-600">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

## The Signup Page with Profile Creation

Signup has one extra step: after Supabase creates the auth user, we create a matching row in our `profiles` table.

```typescript
// src/pages/SignupPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Something went wrong')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
            minLength={6}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

## The Layout with Navigation

The `Layout` component renders the persistent navigation sidebar and an `<Outlet>` where the active page renders:

```typescript
// src/components/Layout.tsx
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/exercises', label: 'Exercises' },
  { to: '/planner', label: 'Weekly Plan' },
  { to: '/log', label: 'Today\'s Log' },
  { to: '/progress', label: 'Progress' },
]

export function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-xl font-bold mb-8">GymTracker</h1>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600' : 'hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-700 pt-4">
          <p className="text-xs text-gray-400 mb-2 truncate">{user?.email}</p>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  )
}
```

At this point you have a working app skeleton. You can sign up, sign in, navigate between pages (which are empty for now), and sign out. The session persists across browser reloads.

In the next post we build the exercise library — the filterable catalogue at the heart of the app.
