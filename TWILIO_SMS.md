# Twilio SMS Integration Guide

## Overview

This guide covers integrating Twilio SMS for sending personalized daily notifications, task reminders, and booking alerts in the Cleanbuz application.

## Twilio Setup

### 1. Create Twilio Account

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. Verify your email and phone number
3. Complete account setup

### 2. Get Credentials

Navigate to Console Dashboard:
- **Account SID**: Found on dashboard (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- **Auth Token**: Found on dashboard (click to reveal)
- **Phone Number**: Purchase a phone number or use trial number

### 3. Purchase Phone Number

1. Go to Phone Numbers → Buy a Number
2. Choose country and capabilities (SMS)
3. Search for available numbers
4. Purchase number (~$1-2/month)

### 4. Configure Environment Variables

Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (optional)
```

## Installation

```bash
npm install twilio
```

## Basic Implementation

### Create Twilio Client

Create `lib/twilio/client.ts`:

```typescript
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const phoneNumber = process.env.TWILIO_PHONE_NUMBER!

// Validate required environment variables
if (!accountSid || !authToken || !phoneNumber) {
  throw new Error('Missing required Twilio environment variables')
}

export const twilioClient = twilio(accountSid, authToken)

export const TWILIO_CONFIG = {
  phoneNumber,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
} as const

// Helper function to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Ensure E.164 format: +[country code][number]
  if (phone.startsWith('+')) return phone
  if (phone.startsWith('1')) return `+${phone}`
  return `+1${phone}` // Default to US
}
```

### Send Basic SMS

```typescript
import { twilioClient, TWILIO_CONFIG, formatPhoneNumber } from '@/lib/twilio/client'

export async function sendSMS(to: string, message: string) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_CONFIG.phoneNumber,
      to: formatPhoneNumber(to),
    })

    console.log('SMS sent:', result.sid)
    return {
      success: true,
      sid: result.sid,
      status: result.status,
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    throw error
  }
}
```

## Notification Service

### Core Notification Service

Create `lib/notifications/sms-service.ts`:

```typescript
import { twilioClient, TWILIO_CONFIG, formatPhoneNumber } from '@/lib/twilio/client'
import { createClient } from '@/lib/supabase/server'

export interface SMSNotification {
  userId: string
  taskId?: string
  bookingId?: string
  type: 'task_reminder' | 'daily_digest' | 'booking_alert' | 'urgent' | 'custom'
  message: string
}

export class SMSNotificationService {
  private supabase = createClient()

  /**
   * Send SMS notification to a user
   */
  async sendNotification(notification: SMSNotification): Promise<void> {
    try {
      // Get user profile with phone and preferences
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('phone, full_name, timezone, notification_preferences')
        .eq('id', notification.userId)
        .single()

      if (profileError || !profile) {
        throw new Error('User profile not found')
      }

      // Check if SMS notifications are enabled
      const prefs = profile.notification_preferences as any
      if (!prefs?.sms) {
        console.log('SMS notifications disabled for user:', notification.userId)
        return
      }

      // Check quiet hours
      if (this.isQuietHours(profile.timezone, prefs)) {
        console.log('Skipping SMS during quiet hours')
        return
      }

      if (!profile.phone) {
        throw new Error('User phone number not found')
      }

      // Personalize message
      const personalizedMessage = this.personalizeMessage(
        notification.message,
        profile.full_name
      )

      // Send SMS
      const result = await twilioClient.messages.create({
        body: personalizedMessage,
        from: TWILIO_CONFIG.phoneNumber,
        to: formatPhoneNumber(profile.phone),
      })

      // Log notification to database
      await this.logNotification({
        user_id: notification.userId,
        task_id: notification.taskId,
        booking_id: notification.bookingId,
        type: 'sms',
        channel: 'twilio',
        recipient: profile.phone,
        message: personalizedMessage,
        status: 'sent',
        external_id: result.sid,
        metadata: {
          notification_type: notification.type,
          price: result.price,
          price_unit: result.priceUnit,
        },
        sent_at: new Date().toISOString(),
      })

      console.log(`SMS sent to ${profile.phone}:`, result.sid)
    } catch (error) {
      console.error('Failed to send SMS notification:', error)

      // Log failed notification
      await this.logNotification({
        user_id: notification.userId,
        task_id: notification.taskId,
        booking_id: notification.bookingId,
        type: 'sms',
        channel: 'twilio',
        recipient: '',
        message: notification.message,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }

  /**
   * Send SMS to multiple users (bulk)
   */
  async sendBulkNotifications(notifications: SMSNotification[]): Promise<void> {
    const results = await Promise.allSettled(
      notifications.map((notification) => this.sendNotification(notification))
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.error(`${failed.length} notifications failed to send`)
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(timezone: string, preferences: any): boolean {
    if (!preferences?.quiet_hours_start || !preferences?.quiet_hours_end) {
      return false
    }

    const now = new Date()
    const userTime = new Date(
      now.toLocaleString('en-US', { timeZone: timezone || 'UTC' })
    )
    const currentHour = userTime.getHours()

    const [startHour] = preferences.quiet_hours_start.split(':').map(Number)
    const [endHour] = preferences.quiet_hours_end.split(':').map(Number)

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour
    }

    return currentHour >= startHour && currentHour < endHour
  }

  /**
   * Personalize message with user's name
   */
  private personalizeMessage(message: string, fullName: string): string {
    const firstName = fullName.split(' ')[0]
    return message.replace('{{name}}', firstName)
  }

  /**
   * Log notification to database
   */
  private async logNotification(data: any): Promise<void> {
    try {
      await this.supabase.from('notifications').insert(data)
    } catch (error) {
      console.error('Failed to log notification:', error)
    }
  }
}

// Singleton instance
export const smsService = new SMSNotificationService()
```

## Notification Templates

Create `lib/notifications/templates.ts`:

```typescript
export const SMS_TEMPLATES = {
  dailyDigest: (data: {
    name: string
    pendingCount: number
    todayCount: number
    urgentCount: number
  }) => `
Good morning, ${data.name}! 📋

Today's tasks:
• ${data.todayCount} due today
• ${data.pendingCount} pending
${data.urgentCount > 0 ? `• ${data.urgentCount} URGENT ⚠️` : ''}

View tasks: [APP_URL]/tasks
`.trim(),

  taskReminder: (data: {
    name: string
    taskTitle: string
    dueTime: string
    propertyName: string
  }) => `
Hi ${data.name} 👋

Reminder: "${data.taskTitle}" is due at ${data.dueTime}

Property: ${data.propertyName}

Mark complete: [APP_URL]/tasks/[TASK_ID]
`.trim(),

  taskAssigned: (data: {
    name: string
    taskTitle: string
    dueDate: string
    propertyName: string
  }) => `
Hi ${data.name},

New task assigned: "${data.taskTitle}"

📍 ${data.propertyName}
📅 Due: ${data.dueDate}

View details: [APP_URL]/tasks/[TASK_ID]
`.trim(),

  urgentTask: (data: {
    name: string
    taskTitle: string
    reason: string
  }) => `
🚨 URGENT TASK 🚨

Hi ${data.name},

"${data.taskTitle}"

Reason: ${data.reason}

Please handle immediately!
[APP_URL]/tasks/[TASK_ID]
`.trim(),

  bookingAlert: (data: {
    name: string
    guestName: string
    checkIn: string
    propertyName: string
  }) => `
📅 New Booking Alert

Property: ${data.propertyName}
Guest: ${data.guestName}
Check-in: ${data.checkIn}

Tasks have been auto-generated.
View: [APP_URL]/bookings
`.trim(),

  taskCompleted: (data: {
    name: string
    taskTitle: string
    completedBy: string
  }) => `
✅ Task Completed

"${data.taskTitle}"

Completed by: ${data.completedBy}

View details: [APP_URL]/tasks
`.trim(),
}

// Helper to replace placeholders
export function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value)
  })
  return result
}
```

## Edge Function: Send Daily Digest

Create `supabase/functions/send-daily-digest/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import twilio from 'npm:twilio'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken)

    // Get all active users with SMS enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, phone, full_name, timezone, notification_preferences')
      .eq('role', 'cleaner')
      .not('phone', 'is', null)

    if (usersError) throw usersError

    const results = []

    for (const user of users || []) {
      const prefs = user.notification_preferences as any
      if (!prefs?.sms) continue

      // Check if it's morning in user's timezone (8 AM)
      const userTime = new Date().toLocaleString('en-US', {
        timeZone: user.timezone || 'UTC',
        hour: 'numeric',
        hour12: false,
      })
      const currentHour = parseInt(userTime)

      // Only send if it's 8 AM in user's timezone
      if (currentHour !== 8) continue

      // Get task counts
      const today = new Date().toISOString().split('T')[0]

      const { count: pendingCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'assigned'])

      const { count: todayCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('due_date', today)
        .lt('due_date', `${today}T23:59:59`)

      const { count: urgentCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('priority', 'urgent')
        .in('status', ['pending', 'assigned'])

      // Skip if no tasks
      if (!pendingCount && !todayCount && !urgentCount) continue

      // Compose message
      const firstName = user.full_name.split(' ')[0]
      const message = `Good morning, ${firstName}! 📋

Today's tasks:
• ${todayCount || 0} due today
• ${pendingCount || 0} pending
${urgentCount ? `• ${urgentCount} URGENT ⚠️` : ''}

View tasks: https://yourapp.com/tasks`

      // Send SMS
      try {
        const result = await twilioClient.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: user.phone,
        })

        // Log notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'sms',
          channel: 'twilio',
          recipient: user.phone,
          message,
          status: 'sent',
          external_id: result.sid,
          sent_at: new Date().toISOString(),
        })

        results.push({
          userId: user.id,
          status: 'sent',
          sid: result.sid,
        })
      } catch (error) {
        console.error(`Failed to send SMS to ${user.id}:`, error)
        results.push({
          userId: user.id,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.status === 'sent').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending daily digest:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Task Reminder System

Create `lib/notifications/task-reminders.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { smsService } from './sms-service'
import { SMS_TEMPLATES, renderTemplate } from './templates'

export async function sendTaskReminders() {
  const supabase = createClient()

  // Get tasks due in next 2 hours
  const twoHoursFromNow = new Date()
  twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:profiles!assigned_to(id, full_name, phone),
      property:properties(name)
    `)
    .in('status', ['pending', 'assigned'])
    .lte('due_date', twoHoursFromNow.toISOString())
    .gte('due_date', new Date().toISOString())

  if (error) {
    console.error('Error fetching tasks:', error)
    return
  }

  for (const task of tasks || []) {
    if (!task.assigned_user?.phone) continue

    const dueTime = new Date(task.due_date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    const message = SMS_TEMPLATES.taskReminder({
      name: task.assigned_user.full_name,
      taskTitle: task.title,
      dueTime,
      propertyName: task.property.name,
    })

    const finalMessage = renderTemplate(message, {
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com',
      TASK_ID: task.id,
    })

    await smsService.sendNotification({
      userId: task.assigned_to,
      taskId: task.id,
      type: 'task_reminder',
      message: finalMessage,
    })
  }
}
```

## Webhook Handler for Delivery Status

Create `app/api/webhooks/twilio/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string

    // Verify webhook authenticity
    const signature = req.headers.get('x-twilio-signature') || ''
    const url = req.url
    const params = Object.fromEntries(formData.entries())

    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      params
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Update notification status in database
    const supabase = createClient()
    const updates: any = { status: messageStatus }

    if (messageStatus === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      updates.error_message = formData.get('ErrorMessage') || 'Delivery failed'
    }

    await supabase
      .from('notifications')
      .update(updates)
      .eq('external_id', messageSid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Configure webhook URL in Twilio Console:
- Go to Phone Numbers → Manage → Active Numbers
- Select your number
- Under Messaging, set Status Callback URL to:
  `https://yourapp.com/api/webhooks/twilio`

## Best Practices

### 1. Rate Limiting

```typescript
// Prevent SMS spam
const rateLimiter = new Map<string, number[]>()

export function checkSMSRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimiter.get(userId) || []
  
  // Remove requests older than 1 hour
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < 3600000
  )
  
  // Max 10 SMS per hour per user
  if (recentRequests.length >= 10) {
    return false
  }
  
  recentRequests.push(now)
  rateLimiter.set(userId, recentRequests)
  return true
}
```

### 2. Cost Tracking

```typescript
export async function trackSMSCost(
  userId: string,
  cost: number,
  currency: string = 'USD'
) {
  const supabase = createClient()
  
  await supabase.from('sms_costs').insert({
    user_id: userId,
    cost,
    currency,
    timestamp: new Date().toISOString(),
  })
}
```

### 3. Opt-out Handling

```typescript
// Handle STOP messages
export async function handleOptOut(phone: string) {
  const supabase = createClient()
  
  await supabase
    .from('profiles')
    .update({
      notification_preferences: {
        sms: false,
        opted_out_at: new Date().toISOString(),
      },
    })
    .eq('phone', phone)
}
```

### 4. Message Length Optimization

```typescript
// SMS is charged per segment (160 chars)
export function optimizeSMSLength(message: string, maxLength: number = 160): string {
  if (message.length <= maxLength) return message
  
  // Truncate and add ellipsis
  return message.substring(0, maxLength - 3) + '...'
}
```

## Testing

### Mock Twilio Client

```typescript
// lib/twilio/client.test.ts
import { jest } from '@jest/globals'

export const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'SM_mock_message_id',
      status: 'sent',
      price: '-0.0075',
      priceUnit: 'USD',
    }),
  },
}
```

### Test Notification Service

```typescript
import { smsService } from '@/lib/notifications/sms-service'

describe('SMS Notification Service', () => {
  it('should send SMS notification', async () => {
    await smsService.sendNotification({
      userId: 'test-user-id',
      type: 'task_reminder',
      message: 'Test message',
    })
    
    expect(mockTwilioClient.messages.create).toHaveBeenCalled()
  })

  it('should respect quiet hours', async () => {
    // Test implementation
  })
})
```

## Monitoring and Analytics

### Track SMS Metrics

```sql
-- View SMS delivery rates
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(COUNT(*) FILTER (WHERE status = 'delivered')::numeric / COUNT(*) * 100, 2) as delivery_rate
FROM notifications
WHERE type = 'sms'
  AND sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

## Cost Optimization

1. **Use Messaging Services**: Lower cost for high volume
2. **Optimize message length**: Keep under 160 characters
3. **Batch notifications**: Group similar messages
4. **Time zone awareness**: Send at optimal times
5. **Delivery reports**: Track failed messages to avoid retries

## Troubleshooting

### Common Issues

1. **Messages not delivered**
   - Verify phone number format (E.164)
   - Check Twilio account balance
   - Verify number is not on DND list

2. **High costs**
   - Review message length and segments
   - Check for duplicate sends
   - Optimize notification frequency

3. **Rate limit errors**
   - Implement exponential backoff
   - Use messaging service SID
   - Spread sends over time

## Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Best Practices Guide](https://www.twilio.com/docs/sms/tutorials/best-practices)
- [Pricing Calculator](https://www.twilio.com/sms/pricing)
