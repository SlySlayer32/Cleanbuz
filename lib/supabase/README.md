# Supabase Client Setup

This directory contains the Supabase client utilities for the Cleanbuz application, following Next.js 14+ App Router best practices with the `@supabase/ssr` package.

## Files Overview

### `client.ts`
Browser client for use in Client Components (with `'use client'` directive).

**Usage:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ClientComponent() {
  const [user, setUser] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])
  
  return <div>{user?.email}</div>
}
```

### `server.ts`
Server client for use in Server Components, Server Actions, and Route Handlers.

**Usage in Server Component:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return <div>{user?.email}</div>
}
```

**Usage in API Route:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

### `middleware.ts`
Middleware client for refreshing user sessions in Next.js middleware.

**Usage:**
Already configured in `/middleware.ts` at the root of the project. This automatically refreshes user sessions on every request.

### `utils.ts`
Helper functions for common Supabase operations.

**Available functions:**
- `getCurrentUser(supabase)` - Get the current authenticated user
- `getUserProfile(supabase, userId)` - Get user profile from profiles table
- `hasRole(supabase, userId, role)` - Check if user has a specific role
- `isAdmin(supabase, userId)` - Check if user is admin
- `formatSupabaseError(error)` - Format Supabase errors for display
- `checkSupabaseConfig()` - Verify environment variables are configured

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserProfile, isAdmin } from '@/lib/supabase/utils'

export default async function Page() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)
  
  if (!user) {
    return <div>Please log in</div>
  }
  
  const profile = await getUserProfile(supabase, user.id)
  const isUserAdmin = await isAdmin(supabase, user.id)
  
  return (
    <div>
      <h1>Welcome {profile?.full_name}</h1>
      {isUserAdmin && <p>You are an admin</p>}
    </div>
  )
}
```

### `index.ts`
Central export point for all Supabase utilities.

**Usage:**
```typescript
import {
  createBrowserClient,
  createServerClient,
  getCurrentUser,
  getUserProfile,
  isAdmin,
  formatSupabaseError,
  checkSupabaseConfig
} from '@/lib/supabase'
```

## Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these values from your Supabase project dashboard:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

## Next Steps

1. **Create a Supabase project** at https://supabase.com if you haven't already
2. **Update `.env.local`** with your actual Supabase credentials
3. **Run database migrations** to create the required tables (see `supabase/migrations/`)
4. **Test the connection** by creating a simple component that fetches data

## Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Always use Row Level Security (RLS) policies on your Supabase tables
- The middleware automatically refreshes user sessions for security

## TypeScript Support

The `Database` type in `types/database.ts` provides full TypeScript support for all Supabase operations. Update this type whenever you change your database schema:

```bash
# Generate types from local Supabase
supabase gen types typescript --local > types/database.ts

# Or from remote project
supabase gen types typescript --project-id <project-ref> > types/database.ts
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [@supabase/ssr Package](https://github.com/supabase/auth-helpers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
