/**
 * Supabase Usage Examples
 * 
 * This file contains example code snippets demonstrating how to use
 * the Supabase clients in different contexts. These are not meant to
 * be imported, but rather serve as reference documentation.
 */

// ============================================================================
// EXAMPLE 1: Using Browser Client in a Client Component
// ============================================================================

/*
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function UserProfileComponent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [supabase])
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Welcome {user.email}</div>
}
*/

// ============================================================================
// EXAMPLE 2: Using Server Client in a Server Component
// ============================================================================

/*
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserProfile } from '@/lib/supabase/utils'

export default async function ProfilePage() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  
  if (!user) {
    return <div>Please log in</div>
  }
  
  const profile = await getUserProfile(supabase, user.id)
  
  if (!profile) {
    return <div>Profile not found</div>
  }
  
  return (
    <div>
      <h1>{profile.full_name}</h1>
      <p>{profile.email}</p>
      <p>Role: {profile.role}</p>
      <p>Timezone: {profile.timezone}</p>
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 3: Using Server Client in an API Route
// ============================================================================

/*
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('properties')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
*/

// ============================================================================
// EXAMPLE 4: Using Utility Functions
// ============================================================================

/*
import { createClient } from '@/lib/supabase/server'
import {
  getCurrentUser,
  getUserProfile,
  isAdmin,
  hasRole,
  formatSupabaseError
} from '@/lib/supabase/utils'

export default async function AdminPage() {
  const supabase = await createClient()
  
  try {
    // Get current user
    const user = await getCurrentUser(supabase)
    if (!user) {
      return <div>Access denied</div>
    }
    
    // Check if user is admin
    const userIsAdmin = await isAdmin(supabase, user.id)
    if (!userIsAdmin) {
      return <div>You must be an admin to access this page</div>
    }
    
    // Get user profile
    const profile = await getUserProfile(supabase, user.id)
    
    // Check specific role
    const isManager = await hasRole(supabase, user.id, 'manager')
    
    return (
      <div>
        <h1>Admin Dashboard</h1>
        <p>Welcome {profile?.full_name}</p>
        {isManager && <p>You are also a manager</p>}
      </div>
    )
  } catch (error) {
    const errorMessage = formatSupabaseError(error)
    return <div>Error: {errorMessage}</div>
  }
}
*/

// ============================================================================
// EXAMPLE 5: Real-time Subscriptions
// ============================================================================

/*
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function TasksListComponent() {
  const [tasks, setTasks] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    // Initial fetch
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setTasks(data)
    }
    
    fetchTasks()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Change received!', payload)
          
          if (payload.eventType === 'INSERT') {
            setTasks((current) => [payload.new, ...current])
          } else if (payload.eventType === 'UPDATE') {
            setTasks((current) =>
              current.map((task) =>
                task.id === payload.new.id ? payload.new : task
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((current) =>
              current.filter((task) => task.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])
  
  return (
    <div>
      <h2>Tasks ({tasks.length})</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  )
}
*/

// ============================================================================
// EXAMPLE 6: Authentication - Sign In with OTP
// ============================================================================

/*
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function PhoneLoginComponent() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    
    setLoading(false)
  }
  
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    })
    
    if (error) {
      setError(error.message)
    } else {
      // Success - user is now logged in
      window.location.href = '/dashboard'
    }
    
    setLoading(false)
  }
  
  if (step === 'phone') {
    return (
      <form onSubmit={sendOtp}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+61 400 000 000"
          required
        />
        <button type="submit" disabled={loading}>
          Send OTP
        </button>
        {error && <p>{error}</p>}
      </form>
    )
  }
  
  return (
    <form onSubmit={verifyOtp}>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit" disabled={loading}>
        Verify OTP
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}
*/

// ============================================================================
// EXAMPLE 7: Configuration Check
// ============================================================================

/*
import { checkSupabaseConfig } from '@/lib/supabase/utils'

export function ConfigCheck() {
  const { isConfigured, missingVars } = checkSupabaseConfig()
  
  if (!isConfigured) {
    return (
      <div>
        <h2>Supabase Configuration Required</h2>
        <p>Please configure the following environment variables:</p>
        <ul>
          {missingVars.map((varName) => (
            <li key={varName}>{varName}</li>
          ))}
        </ul>
      </div>
    )
  }
  
  return <div>Supabase is configured correctly ✓</div>
}
*/

export {};
