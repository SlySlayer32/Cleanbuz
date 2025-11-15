# iCal Integration for Airbnb Bookings

## Overview

This guide covers integrating iCal feeds from Airbnb (and other booking platforms like VRBO, Booking.com) to automatically sync bookings into the Cleanbuz application.

## What is iCal?

iCal (iCalendar) is a standard format (RFC 5545) for exchanging calendar information. Airbnb and most booking platforms provide iCal feed URLs that contain booking data in a standardized format.

**Key Features:**

- Standard format across platforms
- Read-only feed URLs
- Automatic updates
- Event-based structure
- Timezone support

## Getting iCal Feed URLs

### Airbnb

1. Log in to your Airbnb host account
2. Go to Calendar
3. Select the listing
4. Click "Availability settings"
5. Scroll to "Export calendar"
6. Copy the "Export calendar" URL (starts with `https://www.airbnb.com/calendar/ical/`)

**Important:** Each listing has its own unique iCal URL.

### VRBO

1. Log in to VRBO owner account
2. Go to Calendar
3. Select property
4. Click "Export" or "iCal"
5. Copy the iCal feed URL

### Booking.com

1. Log in to Booking.com extranet
2. Go to Calendar & Pricing
3. Look for "iCal export"
4. Copy the feed URL

## iCal Format Structure

### Basic iCal Structure

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Airbnb Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Airbnb Calendar
X-WR-TIMEZONE:UTC

BEGIN:VEVENT
UID:booking-123@airbnb.com
DTSTART;VALUE=DATE:20240101
DTEND;VALUE=DATE:20240105
SUMMARY:Reserved (Airbnb)
DESCRIPTION:Booking for John Doe
STATUS:CONFIRMED
LOCATION:Property Address
END:VEVENT

END:VCALENDAR
```

### Key Fields

- **UID**: Unique identifier for the booking
- **DTSTART**: Check-in date
- **DTEND**: Check-out date
- **SUMMARY**: Booking title (often includes guest name)
- **DESCRIPTION**: Additional details
- **STATUS**: Booking status (CONFIRMED, TENTATIVE, CANCELLED)

## Implementation

### iCal Parser Library

```bash
npm install node-ical
```

### Parse iCal Feed

```typescript
// lib/ical/parser.ts
import * as ical from 'node-ical';

export interface ParsedBooking {
  uid: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  location?: string;
  raw?: any;
}

export async function parseICalFeed(feedUrl: string): Promise<ParsedBooking[]> {
  try {
    const events = await ical.async.fromURL(feedUrl);
    const bookings: ParsedBooking[] = [];

    for (const [uid, event] of Object.entries(events)) {
      // Only process VEVENT type (actual events)
      if (event.type !== 'VEVENT') continue;

      // Skip if no dates
      if (!event.start || !event.end) continue;

      // Extract guest name from summary if available
      // Format: "Reserved - Guest Name" or "Blocked" or "Not available"
      const summary = event.summary || 'Reserved';

      bookings.push({
        uid,
        summary,
        description: event.description || '',
        startDate: new Date(event.start),
        endDate: new Date(event.end),
        status: event.status || 'CONFIRMED',
        location: event.location || '',
        raw: event,
      });
    }

    return bookings;
  } catch (error) {
    console.error('Failed to parse iCal feed:', error);
    throw new Error(`iCal parsing failed: ${error.message}`);
  }
}

export function extractGuestName(summary: string): string | null {
  // Try to extract guest name from summary
  // Common formats:
  // "Reserved - John Doe"
  // "Reserved (John Doe)"
  // "Airbnb - John D."

  const patterns = [/Reserved - (.+)/, /Reserved \((.+)\)/, /Airbnb - (.+)/, /VRBO - (.+)/];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}
```

### Sync Service

```typescript
// lib/ical/sync-service.ts
import { createClient } from '@/lib/supabase/server';
import { parseICalFeed, extractGuestName } from './parser';

export class ICalSyncService {
  private supabase = createClient();

  async syncFeed(feedId: string): Promise<{
    success: boolean;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      // Get feed configuration
      const { data: feed, error: feedError } = await this.supabase
        .from('ical_feeds')
        .select('*')
        .eq('id', feedId)
        .single();

      if (feedError || !feed) {
        throw new Error('Feed not found');
      }

      // Parse iCal feed
      const parsedBookings = await parseICalFeed(feed.feed_url);

      let created = 0;
      let updated = 0;

      for (const booking of parsedBookings) {
        // Skip blocked/unavailable dates without guest
        if (
          booking.summary.toLowerCase().includes('blocked') ||
          booking.summary.toLowerCase().includes('not available')
        ) {
          continue;
        }

        // Extract guest name
        const guestName = extractGuestName(booking.summary) || 'Guest';

        // Prepare booking data
        const bookingData = {
          property_id: feed.property_id,
          ical_feed_id: feed.id,
          external_id: booking.uid,
          guest_name: guestName,
          check_in: booking.startDate.toISOString().split('T')[0],
          check_out: booking.endDate.toISOString().split('T')[0],
          booking_status: this.mapStatus(booking.status),
          booking_source: feed.platform,
          raw_ical_data: JSON.stringify(booking.raw),
          synced_at: new Date().toISOString(),
        };

        // Upsert booking (insert or update if exists)
        const { data: existingBooking } = await this.supabase
          .from('bookings')
          .select('id, check_in, check_out, booking_status')
          .eq('property_id', feed.property_id)
          .eq('external_id', booking.uid)
          .single();

        if (existingBooking) {
          // Check if anything changed
          const hasChanges =
            existingBooking.check_in !== bookingData.check_in ||
            existingBooking.check_out !== bookingData.check_out ||
            existingBooking.booking_status !== bookingData.booking_status;

          if (hasChanges) {
            await this.supabase.from('bookings').update(bookingData).eq('id', existingBooking.id);

            updated++;

            // Trigger notification about change
            await this.notifyBookingChange(existingBooking.id, 'updated');
          }
        } else {
          // Create new booking
          const { data: newBooking, error: insertError } = await this.supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();

          if (!insertError && newBooking) {
            created++;

            // Generate tasks for new booking
            await this.generateTasksForBooking(newBooking.id);

            // Send notification
            await this.notifyBookingChange(newBooking.id, 'created');
          }
        }
      }

      // Update feed sync status
      await this.supabase
        .from('ical_feeds')
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: 'success',
          sync_stats: {
            total_syncs: (feed.sync_stats?.total_syncs || 0) + 1,
            successful_syncs: (feed.sync_stats?.successful_syncs || 0) + 1,
            bookings_created: (feed.sync_stats?.bookings_created || 0) + created,
            bookings_updated: (feed.sync_stats?.bookings_updated || 0) + updated,
          },
        })
        .eq('id', feedId);

      return { success: true, created, updated };
    } catch (error) {
      console.error('Sync failed:', error);

      // Update feed with error
      await this.supabase
        .from('ical_feeds')
        .update({
          last_sync_status: 'error',
          last_sync_error: error.message,
        })
        .eq('id', feedId);

      return {
        success: false,
        created: 0,
        updated: 0,
        error: error.message,
      };
    }
  }

  private mapStatus(icalStatus: string): string {
    const statusMap: Record<string, string> = {
      CONFIRMED: 'confirmed',
      TENTATIVE: 'pending',
      CANCELLED: 'cancelled',
    };
    return statusMap[icalStatus] || 'confirmed';
  }

  private async generateTasksForBooking(bookingId: string): Promise<void> {
    // Get booking details
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    // Get applicable task templates
    const { data: templates } = await this.supabase
      .from('task_templates')
      .select('*')
      .or(`property_id.eq.${booking.property_id},property_id.is.null`)
      .eq('is_active', true)
      .in('trigger_event', ['check_in', 'check_out']);

    if (!templates) return;

    // Generate tasks from templates
    for (const template of templates) {
      const dueDate = new Date(
        template.trigger_event === 'check_in' ? booking.check_in : booking.check_out
      );

      // Apply offset (hours before/after)
      dueDate.setHours(dueDate.getHours() + template.trigger_offset_hours);

      await this.supabase.from('tasks').insert({
        property_id: booking.property_id,
        booking_id: bookingId,
        template_id: template.id,
        title: template.name,
        description: template.description,
        category: template.category,
        priority: template.priority,
        estimated_duration_minutes: template.estimated_duration_minutes,
        due_date: dueDate.toISOString(),
        checklist_items: template.checklist_items,
        status: 'pending',
      });
    }
  }

  private async notifyBookingChange(
    bookingId: string,
    changeType: 'created' | 'updated'
  ): Promise<void> {
    // Implementation depends on notification system
    // Could trigger Edge Function to send notifications
  }
}

export const icalSyncService = new ICalSyncService();
```

### Edge Function: Scheduled Sync

```typescript
// supabase/functions/sync-ical-bookings/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as ical from 'https://esm.sh/node-ical@0.16.1';

serve(async req => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active feeds that need syncing
    const now = new Date();
    const { data: feeds } = await supabase
      .from('ical_feeds')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null);

    const results = [];

    for (const feed of feeds || []) {
      // Check if it's time to sync based on frequency
      const lastSync = feed.last_synced_at ? new Date(feed.last_synced_at) : new Date(0);
      const minutesSinceSync = (now.getTime() - lastSync.getTime()) / 60000;

      if (minutesSinceSync < feed.sync_frequency_minutes) {
        continue; // Skip, not time yet
      }

      try {
        // Fetch and parse iCal feed
        const response = await fetch(feed.feed_url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icalData = await response.text();
        const events = await ical.async.parseICS(icalData);

        let created = 0;
        let updated = 0;

        for (const [uid, event] of Object.entries(events)) {
          if (event.type !== 'VEVENT') continue;
          if (!event.start || !event.end) continue;

          // Skip blocked dates
          const summary = event.summary || '';
          if (
            summary.toLowerCase().includes('blocked') ||
            summary.toLowerCase().includes('not available')
          ) {
            continue;
          }

          // Extract guest name
          const guestName = extractGuestName(summary) || 'Guest';

          const bookingData = {
            property_id: feed.property_id,
            ical_feed_id: feed.id,
            external_id: uid,
            guest_name: guestName,
            check_in: formatDate(event.start),
            check_out: formatDate(event.end),
            booking_status: 'confirmed',
            booking_source: feed.platform,
            raw_ical_data: JSON.stringify(event),
            synced_at: now.toISOString(),
          };

          // Check if booking exists
          const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', feed.property_id)
            .eq('external_id', uid)
            .single();

          if (existing) {
            await supabase.from('bookings').update(bookingData).eq('id', existing.id);
            updated++;
          } else {
            await supabase.from('bookings').insert(bookingData);
            created++;
          }
        }

        // Update feed status
        await supabase
          .from('ical_feeds')
          .update({
            last_synced_at: now.toISOString(),
            last_sync_status: 'success',
            sync_stats: {
              ...feed.sync_stats,
              total_syncs: (feed.sync_stats?.total_syncs || 0) + 1,
              successful_syncs: (feed.sync_stats?.successful_syncs || 0) + 1,
              bookings_created: (feed.sync_stats?.bookings_created || 0) + created,
              bookings_updated: (feed.sync_stats?.bookings_updated || 0) + updated,
            },
          })
          .eq('id', feed.id);

        results.push({
          feed_id: feed.id,
          status: 'success',
          created,
          updated,
        });
      } catch (error) {
        await supabase
          .from('ical_feeds')
          .update({
            last_sync_status: 'error',
            last_sync_error: error.message,
          })
          .eq('id', feed.id);

        results.push({
          feed_id: feed.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function extractGuestName(summary: string): string | null {
  const patterns = [/Reserved - (.+)/, /Reserved \((.+)\)/, /Airbnb - (.+)/, /VRBO - (.+)/];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return null;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

## Frontend Integration

### Add iCal Feed Form

```typescript
// components/bookings/AddICalFeed.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function AddICalFeed({ propertyId }: { propertyId: string }) {
  const [feedUrl, setFeedUrl] = useState('')
  const [feedName, setFeedName] = useState('')
  const [platform, setPlatform] = useState('airbnb')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('ical_feeds').insert({
        property_id: propertyId,
        feed_url: feedUrl,
        feed_name: feedName,
        platform,
        sync_frequency_minutes: 30,
      })

      if (error) throw error

      // Trigger immediate sync
      await fetch('/api/sync-ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })

      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setFeedUrl('')
      setFeedName('')
      alert('iCal feed added successfully!')
    } catch (error) {
      console.error('Failed to add feed:', error)
      alert('Failed to add iCal feed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Feed Name</label>
        <input
          type="text"
          value={feedName}
          onChange={(e) => setFeedName(e.target.value)}
          placeholder="e.g., Airbnb - Main Listing"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="airbnb">Airbnb</option>
          <option value="vrbo">VRBO</option>
          <option value="booking">Booking.com</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">iCal Feed URL</label>
        <input
          type="url"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          placeholder="https://www.airbnb.com/calendar/ical/..."
          required
          className="w-full px-3 py-2 border rounded-md"
        />
        <p className="text-sm text-gray-500 mt-1">
          Get this URL from your Airbnb calendar export settings
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Feed'}
      </button>
    </form>
  )
}
```

## Best Practices

### 1. Sync Frequency

- **Recommended**: Every 30-60 minutes
- **Minimum**: Every 15 minutes (to avoid rate limits)
- **Maximum**: Every 24 hours (for stale data prevention)

### 2. Error Handling

```typescript
async function syncWithRetry(feedId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await icalSyncService.syncFeed(feedId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}
```

### 3. Validation

```typescript
function validateICalUrl(url: string): boolean {
  // Check if URL is from supported platform
  const validDomains = ['airbnb.com', 'vrbo.com', 'booking.com', 'homeaway.com'];

  try {
    const urlObj = new URL(url);
    return validDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}
```

### 4. Deduplication

```typescript
// Use external_id + property_id as unique constraint
// in database schema to prevent duplicates
CONSTRAINT unique_external_booking UNIQUE (property_id, external_id)
```

## Troubleshooting

### Common Issues

1. **Feed not syncing**
   - Verify URL is correct and accessible
   - Check if feed requires authentication
   - Ensure sync frequency is reasonable

2. **Missing bookings**
   - Check if blocked dates are being filtered correctly
   - Verify date format parsing
   - Check timezone handling

3. **Duplicate bookings**
   - Ensure unique constraint on external_id + property_id
   - Check if same feed added multiple times

4. **Stale data**
   - Reduce sync frequency
   - Check last_synced_at timestamp
   - Verify Edge Function cron job is running

## Monitoring

### Sync Statistics Dashboard

```typescript
const { data: syncStats } = await supabase
  .from('ical_feeds')
  .select('sync_stats, last_synced_at, last_sync_status')
  .eq('property_id', propertyId);

// Display:
// - Total syncs
// - Success rate
// - Last sync time
// - Bookings created/updated
```

## Resources

- [RFC 5545 - iCalendar Specification](https://tools.ietf.org/html/rfc5545)
- [Airbnb iCal Help](https://www.airbnb.com/help/article/99)
- [node-ical Documentation](https://www.npmjs.com/package/node-ical)
