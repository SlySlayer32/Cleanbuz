# Supabase Setup Guide

## Overview

This guide walks through setting up Supabase for the Cleanbuz task management application, including database configuration, authentication, Edge Functions, and Realtime subscriptions.

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available)
- Supabase CLI installed globally

```bash
npm install -g supabase
```

## Initial Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
5. Fill in project details:
   - **Name**: cleanbuz-production (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users (e.g., us-east-1)
   - **Pricing Plan**: Start with Free tier, upgrade to Pro for production

### 2. Initialize Local Supabase Project

```bash
# Navigate to your project directory
cd /path/to/cleanbuz

# Initialize Supabase
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Pull remote schema (if any)
supabase db pull
```

### 3. Configure Environment Variables

Create a `.env.local` file in your Next.js project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Mobile Message Configuration (for SMS notifications)
MOBILE_MESSAGE_API_KEY=your-mobile-message-api-key
MOBILE_MESSAGE_ACCOUNT_ID=your-mobile-message-account-id
MOBILE_MESSAGE_SENDER_ID=YourBusiness

# Optional: Third-party OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Find your Supabase credentials:**
- Go to Project Settings → API
- Copy the Project URL and anon/public key
- Copy the service_role key (keep this secret!)

## Database Configuration

### 1. Apply Schema Migrations

Create migration files in `supabase/migrations/`:

```bash
# Create a new migration
supabase migration new initial_schema

# Edit the migration file
# Copy content from DATABASE_SCHEMA.md into the migration file

# Apply migrations locally
supabase db reset

# Push to remote database
supabase db push
```

**Example migration file** (`supabase/migrations/20240101000000_initial_schema.sql`):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (copy from DATABASE_SCHEMA.md)
-- Start with profiles table
CREATE TABLE public.profiles (
  -- ... (see DATABASE_SCHEMA.md)
);

-- Continue with remaining tables...
```

### 2. Set Up Row Level Security (RLS)

RLS policies are included in the migration but verify they're enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS for a table if not enabled
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

### 3. Create Database Functions

```bash
# Create function migration
supabase migration new database_functions

# Add functions from DATABASE_SCHEMA.md
```

### 4. Seed Initial Data (Optional)

Create `supabase/seed.sql`:

```sql
-- Insert default task templates
INSERT INTO public.task_templates (name, description, category, trigger_event, trigger_offset_hours, checklist_items)
VALUES
  (
    'Standard Checkout Cleaning',
    'Complete cleaning after guest checkout',
    'cleaning',
    'check_out',
    2,
    '[
      {"text": "Strip and remake beds", "completed": false},
      {"text": "Clean and sanitize bathrooms", "completed": false},
      {"text": "Vacuum all floors", "completed": false},
      {"text": "Dust all surfaces", "completed": false},
      {"text": "Clean kitchen and appliances", "completed": false},
      {"text": "Take out trash and replace bags", "completed": false},
      {"text": "Restock supplies", "completed": false},
      {"text": "Check and report any damages", "completed": false}
    ]'::jsonb
  ),
  (
    'Pre-Check-in Inspection',
    'Final inspection before guest arrival',
    'inspection',
    'check_in',
    -4,
    '[
      {"text": "Verify cleanliness", "completed": false},
      {"text": "Check all appliances working", "completed": false},
      {"text": "Verify WiFi credentials posted", "completed": false},
      {"text": "Check heating/cooling", "completed": false},
      {"text": "Ensure welcome package is ready", "completed": false}
    ]'::jsonb
  ),
  (
    'Weekly Deep Clean',
    'Weekly deep cleaning maintenance',
    'cleaning',
    'weekly',
    0,
    '[
      {"text": "Clean windows inside and out", "completed": false},
      {"text": "Deep clean carpets", "completed": false},
      {"text": "Clean behind appliances", "completed": false},
      {"text": "Wash curtains and linens", "completed": false},
      {"text": "Sanitize high-touch surfaces", "completed": false}
    ]'::jsonb
  );
```

Run seed:
```bash
supabase db reset --seed
```

## Authentication Configuration

### 1. Enable Authentication Providers

Navigate to Authentication → Providers in Supabase Dashboard:

#### Phone (SMS) Authentication

1. Enable Phone provider
2. Choose SMS provider:
   - **Mobile Message** (recommended)
   - Messagebird
   - Vonage

3. Configure Mobile Message:
   ```
   Account SID: Your Mobile Message Account SID
   Auth Token: Your Mobile Message Auth Token
   Phone Number: Your Mobile Message phone number (e.g., +1234567890)
   ```

4. Test phone authentication:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOtp({
     phone: '+1234567890',
   })
   ```

#### Email Authentication

1. Enable Email provider (enabled by default)
2. Configure SMTP (optional, for custom emails):
   - Go to Project Settings → Auth → SMTP Settings
   - Configure custom SMTP or use Supabase's built-in email service

3. Customize email templates:
   - Authentication → Email Templates
   - Customize: Confirmation, Invite, Magic Link, Password Reset

#### OAuth Providers (Google, Apple, etc.)

1. Enable OAuth providers you want to support
2. For Google OAuth:
   - Create project at [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

### 2. Configure Auth Settings

Go to Authentication → Settings:

```
Site URL: https://yourdomain.com (or http://localhost:3000 for dev)
Redirect URLs: 
  - https://yourdomain.com/**
  - http://localhost:3000/**
  
JWT Expiry: 3600 seconds (1 hour)
Refresh Token Rotation: Enabled
Reuse Interval: 10 seconds

Security:
- CAPTCHA Protection: Enabled (for sign-ups)
- Rate Limiting: Enabled
- Enable email confirmations: Yes (for email auth)
- Enable phone confirmations: Yes (for phone auth)
```

### 3. Implement Authentication in Next.js

Install Supabase client:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

Create Supabase client (`lib/supabase/client.ts`):

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const supabaseClient = createClientComponentClient()

// For server-side operations with service role
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Edge Functions Setup

### 1. Initialize Edge Functions

```bash
# Create Edge Functions directory structure
supabase functions new sync-ical-bookings
supabase functions new generate-tasks
supabase functions new send-daily-digest
supabase functions new process-booking-change
```

### 2. Example Edge Function: sync-ical-bookings

Create `supabase/functions/sync-ical-bookings/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as ical from 'https://esm.sh/node-ical@0.16.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get all active iCal feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('ical_feeds')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
    
    if (feedsError) throw feedsError
    
    const results = []
    
    for (const feed of feeds || []) {
      try {
        // Fetch iCal feed
        const response = await fetch(feed.feed_url)
        const icalData = await response.text()
        
        // Parse iCal
        const events = await ical.async.parseICS(icalData)
        
        let created = 0
        let updated = 0
        
        for (const [uid, event] of Object.entries(events)) {
          if (event.type !== 'VEVENT') continue
          
          const bookingData = {
            property_id: feed.property_id,
            ical_feed_id: feed.id,
            external_id: uid,
            guest_name: event.summary || 'Guest',
            check_in: new Date(event.start).toISOString().split('T')[0],
            check_out: new Date(event.end).toISOString().split('T')[0],
            booking_status: 'confirmed',
            booking_source: feed.platform,
            raw_ical_data: JSON.stringify(event),
            synced_at: new Date().toISOString(),
          }
          
          // Upsert booking
          const { error: upsertError } = await supabase
            .from('bookings')
            .upsert(bookingData, {
              onConflict: 'property_id,external_id',
              ignoreDuplicates: false,
            })
          
          if (!upsertError) {
            // Check if it was created or updated
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('external_id', uid)
            
            if (count === 1) created++
            else updated++
          }
        }
        
        // Update feed sync status
        await supabase
          .from('ical_feeds')
          .update({
            last_synced_at: new Date().toISOString(),
            last_sync_status: 'success',
            sync_stats: {
              ...feed.sync_stats,
              total_syncs: (feed.sync_stats?.total_syncs || 0) + 1,
              successful_syncs: (feed.sync_stats?.successful_syncs || 0) + 1,
              bookings_created: (feed.sync_stats?.bookings_created || 0) + created,
              bookings_updated: (feed.sync_stats?.bookings_updated || 0) + updated,
            },
          })
          .eq('id', feed.id)
        
        results.push({
          feed_id: feed.id,
          feed_name: feed.feed_name,
          status: 'success',
          bookings_created: created,
          bookings_updated: updated,
        })
        
      } catch (error) {
        // Update feed with error
        await supabase
          .from('ical_feeds')
          .update({
            last_sync_status: 'error',
            last_sync_error: error.message,
            sync_stats: {
              ...feed.sync_stats,
              total_syncs: (feed.sync_stats?.total_syncs || 0) + 1,
              failed_syncs: (feed.sync_stats?.failed_syncs || 0) + 1,
            },
          })
          .eq('id', feed.id)
        
        results.push({
          feed_id: feed.id,
          feed_name: feed.feed_name,
          status: 'error',
          error: error.message,
        })
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 3. Deploy Edge Functions

```bash
# Deploy a single function
supabase functions deploy sync-ical-bookings

# Deploy all functions
supabase functions deploy

# Set secrets for functions
supabase secrets set MOBILE_MESSAGE_API_KEY=your-api-key
supabase secrets set MOBILE_MESSAGE_ACCOUNT_ID=your-account-id
supabase secrets set MOBILE_MESSAGE_SENDER_ID=YourBusiness
```

### 4. Schedule Edge Functions (Cron Jobs)

Use Supabase's pg_cron extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule iCal sync every 30 minutes
SELECT cron.schedule(
  'sync-ical-feeds',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/sync-ical-bookings',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule daily digest at 8 AM
SELECT cron.schedule(
  'send-daily-digest',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/send-daily-digest',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule a job
SELECT cron.unschedule('job-name');
```

## Realtime Configuration

### 1. Enable Realtime

Navigate to Database → Replication in Supabase Dashboard:

1. Enable Realtime for tables:
   - `tasks`
   - `bookings`
   - `notifications`

2. Set publication filters if needed (e.g., only certain columns)

### 2. Subscribe to Realtime Updates in Next.js

```typescript
import { useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'

export function useRealtimeTasks(userId: string) {
  useEffect(() => {
    // Subscribe to task changes
    const channel = supabaseClient
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        (payload) => {
          console.log('Task change received:', payload)
          // Update UI state
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [userId])
}
```

### 3. Broadcast Custom Events

```typescript
// Broadcast presence (who's online)
const channel = supabaseClient.channel('room:123')

// Track presence
await channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: userId, online_at: new Date() })
  }
})

// Listen to presence
channel.on('presence', { event: 'sync' }, () => {
  const presenceState = channel.presenceState()
  console.log('Online users:', presenceState)
})
```

## Storage Configuration

### 1. Create Storage Buckets

Navigate to Storage in Supabase Dashboard:

1. Create buckets:
   - `task-attachments` (for task photos)
   - `property-photos` (for property images)
   - `profile-avatars` (for user avatars)

2. Set bucket policies:

```sql
-- Allow authenticated users to upload to task-attachments
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Allow users to view task attachments
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

-- Similar policies for other buckets
```

### 2. Upload Files from Next.js

```typescript
import { supabaseClient } from '@/lib/supabase/client'

async function uploadTaskAttachment(file: File, taskId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${taskId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabaseClient.storage
    .from('task-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from('task-attachments')
    .getPublicUrl(fileName)
  
  return urlData.publicUrl
}
```

## Testing

### 1. Test Authentication

```bash
# Test phone OTP
curl -X POST 'https://your-project-ref.supabase.co/auth/v1/otp' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Verify OTP
curl -X POST 'https://your-project-ref.supabase.co/auth/v1/verify' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "token": "123456", "type": "sms"}'
```

### 2. Test Edge Functions Locally

```bash
# Serve function locally
supabase functions serve sync-ical-bookings

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/sync-ical-bookings' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Test Realtime

Use the Supabase Realtime Inspector in the dashboard to monitor real-time events.

## Production Checklist

- [ ] Upgrade to Supabase Pro plan for production workload
- [ ] Configure custom domain
- [ ] Set up database backups (automatic with Pro)
- [ ] Enable SSL/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review and optimize RLS policies
- [ ] Test disaster recovery procedures
- [ ] Document all API keys and secrets
- [ ] Set up staging environment

## Monitoring and Logs

### View Edge Function Logs

```bash
# Stream logs for a function
supabase functions logs sync-ical-bookings --tail

# View logs in dashboard
# Navigate to Edge Functions → Your Function → Logs
```

### Database Logs

- Navigate to Database → Logs in dashboard
- View query performance
- Monitor slow queries

### Analytics

- Navigate to Analytics in dashboard
- Monitor API usage
- Track authentication events
- View realtime connections

## Troubleshooting

### Common Issues

1. **RLS preventing access**
   - Check RLS policies are correctly configured
   - Verify user authentication
   - Test with service role key temporarily

2. **Edge Function timeout**
   - Optimize function logic
   - Use async operations
   - Consider breaking into smaller functions

3. **Realtime not updating**
   - Verify table replication is enabled
   - Check channel subscription
   - Review RLS policies on table

4. **Authentication issues**
   - Verify environment variables
   - Check redirect URLs configuration
   - Review email/SMS provider settings

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
