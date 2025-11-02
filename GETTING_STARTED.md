# Getting Started Guide

## Overview

This comprehensive guide will walk you through building the Cleanbuz task management application from scratch, integrating all components for a production-ready system.

## Prerequisites

- Node.js 18+ and npm/yarn
- Git installed
- GitHub account
- Supabase account (free tier available)
- Mobile Message account (with trial credits)
- Vercel account (free tier available)
- Basic knowledge of TypeScript, React, and SQL

## Quick Start (5 Minutes)

```bash
# 1. Create Next.js app
npx create-next-app@latest cleanbuz-app --typescript --tailwind --app

# 2. Install dependencies
cd cleanbuz-app
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @tanstack/react-query mobilemessage date-fns

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# Visit http://localhost:3000
```

## Step-by-Step Setup

### Phase 1: Project Initialization

#### 1. Create Next.js Application

```bash
npx create-next-app@latest cleanbuz-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd cleanbuz-app
```

#### 2. Install Core Dependencies

```bash
# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# React Query for data fetching
npm install @tanstack/react-query

# Form handling
npm install react-hook-form zod @hookform/resolvers

# Utilities
npm install date-fns clsx tailwind-merge lucide-react

# SMS notifications (Mobile Message uses REST API via axios)
npm install axios

# iCal parsing
npm install node-ical

# PWA support
npm install next-pwa
```

#### 3. Project Structure

```bash
mkdir -p src/{components,lib,hooks,types}
mkdir -p src/components/{auth,tasks,bookings,calendar,layout,ui}
mkdir -p src/lib/{supabase,mobilemessage,utils}
```

### Phase 2: Supabase Setup

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - Name: cleanbuz-production
   - Database Password: (generate strong password)
   - Region: (closest to users)
4. Wait for project to initialize (~2 minutes)

#### 2. Install Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF
```

#### 3. Set Up Database Schema

Create `supabase/migrations/20240101000000_initial_schema.sql`:

```sql
-- Copy content from DATABASE_SCHEMA.md
-- Or create tables manually via Supabase dashboard
```

Apply migration:
```bash
supabase db push
```

#### 4. Configure Authentication

In Supabase Dashboard → Authentication → Providers:

**Enable Phone (SMS):**
1. Toggle "Phone" to enabled
2. Select provider: Mobile Message
3. Enter Mobile Message credentials:
   - Account SID
   - Auth Token
   - Phone Number

**Enable Email:**
- Already enabled by default
- Customize email templates if needed

**Enable OAuth (optional):**
1. Enable Google provider
2. Add Client ID and Secret from Google Cloud Console
3. Add redirect URLs

### Phase 3: Configure Environment

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Mobile Message
MOBILE_MESSAGE_API_KEY=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MOBILE_MESSAGE_ACCOUNT_ID=your-auth-token
MOBILE_MESSAGE_SENDER_ID=+1234567890

# Optional: OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Add to `.gitignore`:
```
.env*.local
.env.production
```

### Phase 4: Build Core Features

#### 1. Supabase Client Setup

Create `src/lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () =>
  createServerComponentClient({ cookies })
```

#### 2. Authentication Components

Create `src/components/auth/AuthProvider.tsx`:

```typescript
// Copy from AUTHENTICATION.md
```

Create `src/components/auth/PhoneLogin.tsx`:

```typescript
// Copy from AUTHENTICATION.md
```

#### 3. Middleware for Auth

Create `middleware.ts`:

```typescript
// Copy from AUTHENTICATION.md
```

#### 4. Task Components

Create `src/components/tasks/TaskList.tsx`:
```typescript
// Copy from NEXTJS_FRONTEND.md
```

Create `src/components/tasks/TaskCard.tsx`:
```typescript
// Copy from NEXTJS_FRONTEND.md
```

#### 5. Layout Components

Create `src/components/layout/Header.tsx`:
```typescript
// Copy from NEXTJS_FRONTEND.md
```

Create `src/components/layout/Sidebar.tsx`:
```typescript
// Copy from NEXTJS_FRONTEND.md
```

### Phase 5: Implement Edge Functions

#### 1. Initialize Edge Functions

```bash
# Create Edge Functions directory
mkdir -p supabase/functions

# Create functions
supabase functions new sync-ical-bookings
supabase functions new send-daily-digest
supabase functions new generate-tasks
```

#### 2. Implement Sync Function

Create `supabase/functions/sync-ical-bookings/index.ts`:

```typescript
// Copy from ICAL_INTEGRATION.md
```

#### 3. Deploy Edge Functions

```bash
# Set secrets
supabase secrets set MOBILE_MESSAGE_API_KEY=your-sid
supabase secrets set MOBILE_MESSAGE_ACCOUNT_ID=your-token
supabase secrets set MOBILE_MESSAGE_SENDER_ID=your-number

# Deploy functions
supabase functions deploy sync-ical-bookings
supabase functions deploy send-daily-digest
supabase functions deploy generate-tasks
```

#### 4. Schedule Functions

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'sync-ical-feeds',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/sync-ical-bookings',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  ) AS request_id;
  $$
);
```

### Phase 6: Set Up Realtime

#### 1. Enable Realtime for Tables

In Supabase Dashboard → Database → Replication:
- Enable for `tasks`
- Enable for `bookings`
- Enable for `notifications`

#### 2. Implement Realtime Hooks

Create `src/hooks/useTasksRealtime.ts`:

```typescript
// Copy from REALTIME_UPDATES.md
```

### Phase 7: Integrate Mobile Message SMS

#### 1. Set Up Mobile Message Client

Create `src/lib/mobilemessage/client.ts`:

```typescript
// Copy from MOBILE_MESSAGE_SMS.md
```

#### 2. Create Notification Service

Create `src/lib/notifications/sms-service.ts`:

```typescript
// Copy from MOBILE_MESSAGE_SMS.md
```

#### 3. Create Message Templates

Create `src/lib/notifications/templates.ts`:

```typescript
// Copy from MOBILE_MESSAGE_SMS.md
```

### Phase 8: PWA Configuration

#### 1. Install PWA Plugin

```bash
npm install next-pwa
```

#### 2. Configure next.config.js

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // Your Next.js config
})
```

#### 3. Create Manifest

Create `public/manifest.json`:

```json
{
  "name": "Cleanbuz",
  "short_name": "Cleanbuz",
  "description": "Task Management for Property Managers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Phase 9: Testing

#### 1. Set Up Testing Framework

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

#### 2. Create Test Files

```typescript
// __tests__/components/TaskCard.test.tsx
import { render, screen } from '@testing-library/react'
import { TaskCard } from '@/components/tasks/TaskCard'

describe('TaskCard', () => {
  it('renders task information correctly', () => {
    const task = {
      id: '1',
      title: 'Clean kitchen',
      status: 'pending',
      priority: 'high',
      due_date: new Date().toISOString(),
      property: { name: 'Property 1' },
    }

    render(<TaskCard task={task} />)
    expect(screen.getByText('Clean kitchen')).toBeInTheDocument()
  })
})
```

#### 3. Run Tests

```bash
npm test
```

### Phase 10: Deploy to Production

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/cleanbuz-app.git
git push -u origin main
```

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or use Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables
4. Deploy

#### 3. Configure Custom Domain

```bash
vercel domains add yourdomain.com
```

Follow DNS instructions to point domain to Vercel.

## Verification Checklist

### Authentication
- [ ] Users can sign up with email
- [ ] Users can sign up with phone (OTP)
- [ ] OAuth login works (if configured)
- [ ] Session persists across page refreshes
- [ ] Logout works correctly

### Tasks
- [ ] Users can view their assigned tasks
- [ ] Users can create new tasks
- [ ] Users can update task status
- [ ] Users can complete tasks
- [ ] Tasks appear in real-time

### Bookings
- [ ] iCal feed can be added
- [ ] Bookings sync automatically
- [ ] New bookings generate tasks
- [ ] Booking changes update tasks

### Notifications
- [ ] SMS notifications are sent
- [ ] Daily digest works
- [ ] Task reminders work
- [ ] Users can configure preferences

### Performance
- [ ] Page load time < 2 seconds
- [ ] Images are optimized
- [ ] PWA installs on mobile
- [ ] Offline functionality works

## Common Issues and Solutions

### Issue: Supabase connection fails

**Solution:**
```typescript
// Verify environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### Issue: Authentication redirects not working

**Solution:**
Check `middleware.ts` configuration and ensure redirect URLs are correct in Supabase settings.

### Issue: SMS not sending

**Solution:**
1. Verify Mobile Message credentials
2. Check phone number format (E.164)
3. Ensure sufficient Mobile Message balance
4. Check Mobile Message console for error logs

### Issue: iCal sync failing

**Solution:**
1. Verify iCal URL is accessible
2. Check Edge Function logs: `supabase functions logs sync-ical-bookings`
3. Ensure database has correct permissions

## Next Steps

1. **Add Features:**
   - Task templates
   - Team management
   - Reports and analytics
   - Mobile app (React Native)

2. **Optimize Performance:**
   - Implement caching strategy
   - Add Redis for session storage
   - Optimize database queries

3. **Enhance Security:**
   - Enable MFA
   - Implement audit logging
   - Add rate limiting

4. **Monitor and Maintain:**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Regular database backups

## Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Mobile Message Docs](https://www.mobilemessage.com.au/docs)
- [Vercel Docs](https://vercel.com/docs)

### Support
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Discord](https://nextjs.org/discord)
- [Mobile Message Support](https://www.mobilemessage.com.au/support)

### Learning Resources
- [Supabase YouTube](https://www.youtube.com/c/supabase)
- [Next.js Learn](https://nextjs.org/learn)
- [React Query Docs](https://tanstack.com/query/latest)

## Troubleshooting

If you encounter any issues:

1. Check all environment variables are set correctly
2. Verify Supabase project is active
3. Check browser console for errors
4. Review server logs: `npm run dev` output
5. Check Edge Function logs in Supabase Dashboard

For additional help, refer to specific documentation files:
- `ARCHITECTURE.md` - System overview
- `DATABASE_SCHEMA.md` - Database structure
- `SUPABASE_SETUP.md` - Supabase configuration
- `AUTHENTICATION.md` - Auth implementation
- `MOBILE_MESSAGE_SMS.md` - SMS integration
- `ICAL_INTEGRATION.md` - Booking sync
- `VERCEL_DEPLOYMENT.md` - Deployment guide
- `SECURITY_BEST_PRACTICES.md` - Security measures

## Support

For issues or questions:
1. Check documentation in this repository
2. Search GitHub issues
3. Create new issue with detailed description
4. Include error messages and logs

Happy coding! 🚀
