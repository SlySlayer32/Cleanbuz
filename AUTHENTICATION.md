# Authentication Implementation Guide

## Overview

This guide covers implementing a robust authentication system using Supabase Auth with phone OTP, email/password, and OAuth providers for the Cleanbuz application.

## Authentication Architecture

### Supported Methods

1. **Phone OTP (Primary)** - Quick, passwordless authentication via SMS
2. **Email/Password** - Traditional authentication method
3. **OAuth Providers** - Google, Apple, GitHub (extensible)
4. **Magic Link** - Passwordless email authentication

### Security Features

- JWT-based authentication with automatic refresh
- Row Level Security (RLS) at database level
- Multi-factor authentication (MFA) support
- Session management with secure cookies
- CAPTCHA protection for sign-ups
- Rate limiting on authentication endpoints

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 2. Configure Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client component usage
export const createClient = () => createClientComponentClient()

// Server component usage
export const createServerClient = () => 
  createServerComponentClient({ cookies })

// Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string
          avatar_url: string | null
          role: 'admin' | 'manager' | 'cleaner' | 'guest'
          // ... other fields
        }
        Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Insert>
      }
      // ... other tables
    }
  }
}
```

### 3. Middleware for Auth Protection

Create `middleware.ts` in project root:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect routes
  const protectedPaths = ['/dashboard', '/tasks', '/bookings', '/settings']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Phone OTP Authentication

### Implementation Flow

1. User enters phone number
2. Send OTP via SMS (Twilio)
3. User enters OTP code
4. Verify OTP and create session
5. Create/update user profile

### Login Component

Create `components/auth/PhoneLogin.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PhoneLogin() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate phone format (E.164)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      })

      if (error) throw error

      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (error) throw error

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Include country code (e.g., +1 for US)
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Code'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div>
        <label htmlFor="otp" className="block text-sm font-medium">
          Verification Code
        </label>
        <input
          id="otp"
          type="text"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-digit code sent to {phone}
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>

      <button
        type="button"
        onClick={() => setStep('phone')}
        className="w-full text-sm text-blue-600 hover:text-blue-700"
      >
        Use different phone number
      </button>
    </form>
  )
}
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// lib/rate-limit.ts
import { createClient } from '@/lib/supabase/client'

const rateLimits = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<{ allowed: boolean; resetAt: number }> {
  const now = Date.now()
  const record = rateLimits.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, resetAt: now + windowMs }
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, resetAt: record.resetAt }
}
```

## Email/Password Authentication

### Sign Up Component

Create `components/auth/EmailSignup.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EmailSignup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Password validation
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.session) {
        // User signed up and logged in
        router.push('/dashboard')
      } else {
        // Email confirmation required
        setError('Please check your email to confirm your account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          At least 8 characters
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### Login Component

Create `components/auth/EmailLogin.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmailLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>

      <div className="text-sm text-center">
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
          Forgot password?
        </Link>
      </div>
    </form>
  )
}
```

## OAuth Authentication

### Google OAuth Setup

1. Configure in Supabase Dashboard (see SUPABASE_SETUP.md)
2. Implement OAuth login:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function OAuthButtons() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Error logging in with Google:', error.message)
    }
  }

  const handleAppleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error logging in with Apple:', error.message)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          {/* Google logo SVG */}
        </svg>
        Continue with Google
      </button>

      <button
        onClick={handleAppleLogin}
        className="w-full flex items-center justify-center gap-3 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-900"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {/* Apple logo SVG */}
        </svg>
        Continue with Apple
      </button>
    </div>
  )
}
```

### OAuth Callback Handler

Create `app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard or original destination
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

## Session Management

### Auth Context Provider

Create `components/auth/AuthProvider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Protected Page Example

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

## Password Reset Flow

### Request Reset

```typescript
const handlePasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}
```

### Reset Password Page

Create `app/auth/reset-password/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={8}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

## Security Best Practices

### 1. Secure Token Storage

- Tokens stored in httpOnly cookies (handled by auth helpers)
- Never expose service role key in client code
- Rotate API keys regularly

### 2. Input Validation

```typescript
import { z } from 'zod'

const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone format')
const emailSchema = z.string().email('Invalid email')
const passwordSchema = z.string().min(8).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  'Password must contain uppercase, lowercase, and number'
)
```

### 3. CAPTCHA Integration

```typescript
import { createClient } from '@/lib/supabase/client'

const handleSignUpWithCaptcha = async (email: string, password: string, captchaToken: string) => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken,
    },
  })
}
```

### 4. Session Timeout

Configure in Supabase Dashboard:
- JWT expiry: 3600 seconds (1 hour)
- Refresh token rotation: Enabled
- Reuse interval: 10 seconds

## Testing Authentication

### Unit Tests

```typescript
import { createClient } from '@/lib/supabase/client'

describe('Authentication', () => {
  it('should sign up with email', async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    })
    
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
  })

  it('should sign in with phone OTP', async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+1234567890',
    })
    
    expect(error).toBeNull()
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('phone authentication flow', async ({ page }) => {
  await page.goto('/login')
  
  // Enter phone number
  await page.fill('input[type="tel"]', '+1234567890')
  await page.click('button:has-text("Send Code")')
  
  // Enter OTP
  await expect(page.locator('input[placeholder*="code"]')).toBeVisible()
  await page.fill('input[placeholder*="code"]', '123456')
  await page.click('button:has-text("Verify")')
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
})
```

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check Twilio configuration
   - Verify phone number format (E.164)
   - Check rate limits

2. **OAuth redirect not working**
   - Verify redirect URLs in Supabase settings
   - Check OAuth provider configuration
   - Ensure callback route exists

3. **Session not persisting**
   - Check cookie settings
   - Verify middleware configuration
   - Ensure auth helpers properly configured

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Phone Auth Best Practices](https://supabase.com/docs/guides/auth/phone-login)
- [OAuth Providers Setup](https://supabase.com/docs/guides/auth/social-login)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
