# Mobile Message SMS Integration Guide

## Overview

This guide covers integrating Mobile Message SMS (www.mobilemessage.com.au) for sending personalized daily notifications, task reminders, and booking alerts in the Cleanbuz application.

## Mobile Message Setup

### 1. Create Mobile Message Account

1. Sign up at [www.mobilemessage.com.au](https://www.mobilemessage.com.au)
2. Verify your email and phone number
3. Complete account setup
4. Access your account dashboard

### 2. Get API Credentials

Navigate to Account Settings or API Section:
- **API Key**: Found in your account dashboard or API settings
- **Account ID**: Your unique account identifier
- **Sender ID**: Your approved sender name/number

### 3. Configure Sender ID

1. Go to Settings → Sender IDs
2. Register your business name or dedicated number
3. Wait for approval (typically 24-48 hours)
4. Use approved sender ID in all messages

### 4. Configure Environment Variables

Add to `.env.local`:

```env
MOBILE_MESSAGE_API_KEY=your_api_key_here
MOBILE_MESSAGE_ACCOUNT_ID=your_account_id
MOBILE_MESSAGE_SENDER_ID=YourBusiness
MOBILE_MESSAGE_API_URL=https://api.mobilemessage.com.au/v1
```

## Installation

```bash
npm install axios
# or
npm install node-fetch
```

## Basic Implementation

### Create Mobile Message Client

Create `lib/mobilemessage/client.ts`:

```typescript
import axios from 'axios'

const apiKey = process.env.MOBILE_MESSAGE_API_KEY!
const accountId = process.env.MOBILE_MESSAGE_ACCOUNT_ID!
const senderId = process.env.MOBILE_MESSAGE_SENDER_ID!
const apiUrl = process.env.MOBILE_MESSAGE_API_URL || 'https://api.mobilemessage.com.au/v1'

// Validate required environment variables
if (!apiKey || !accountId || !senderId) {
  throw new Error('Missing required Mobile Message environment variables')
}

export const mobileMessageClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
})

export const MOBILE_MESSAGE_CONFIG = {
  apiKey,
  accountId,
  senderId,
  apiUrl,
} as const

// Helper function to format phone numbers for Australian numbers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Australian numbers
  if (cleaned.startsWith('61')) {
    // Already has country code
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    // Australian number with leading 0
    return `+61${cleaned.substring(1)}`
  } else if (cleaned.length === 9) {
    // Australian number without leading 0
    return `+61${cleaned}`
  }
  
  // For international numbers, assume they include country code
  return `+${cleaned}`
}
```

### Send Basic SMS

```typescript
import { mobileMessageClient, MOBILE_MESSAGE_CONFIG, formatPhoneNumber } from '@/lib/mobilemessage/client'

export async function sendSMS(to: string, message: string) {
  try {
    const result = await mobileMessageClient.post('/messages', {
      to: formatPhoneNumber(to),
      from: MOBILE_MESSAGE_CONFIG.senderId,
      message: message,
      accountId: MOBILE_MESSAGE_CONFIG.accountId,
    })

    console.log('SMS sent:', result.data.messageId)
    return {
      success: true,
      messageId: result.data.messageId,
      status: result.data.status,
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
import { mobileMessageClient, MOBILE_MESSAGE_CONFIG, formatPhoneNumber } from '@/lib/mobilemessage/client'
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

      // Send SMS via Mobile Message
      const result = await mobileMessageClient.post('/messages', {
        to: formatPhoneNumber(profile.phone),
        from: MOBILE_MESSAGE_CONFIG.senderId,
        message: personalizedMessage,
        accountId: MOBILE_MESSAGE_CONFIG.accountId,
      })

      // Log notification to database
      await this.logNotification({
        user_id: notification.userId,
        task_id: notification.taskId,
        booking_id: notification.bookingId,
        type: 'sms',
        channel: 'mobilemessage',
        recipient: profile.phone,
        message: personalizedMessage,
        status: 'sent',
        external_id: result.data.messageId,
        metadata: {
          notification_type: notification.type,
        },
        sent_at: new Date().toISOString(),
      })

      console.log(`SMS sent to ${profile.phone}:`, result.data.messageId)
    } catch (error) {
      console.error('Failed to send SMS notification:', error)

      // Log failed notification
      await this.logNotification({
        user_id: notification.userId,
        task_id: notification.taskId,
        booking_id: notification.bookingId,
        type: 'sms',
        channel: 'mobilemessage',
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

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mobileMessageApiKey = Deno.env.get('MOBILE_MESSAGE_API_KEY')!
const mobileMessageAccountId = Deno.env.get('MOBILE_MESSAGE_ACCOUNT_ID')!
const mobileMessageSenderId = Deno.env.get('MOBILE_MESSAGE_SENDER_ID')!
const mobileMessageApiUrl = Deno.env.get('MOBILE_MESSAGE_API_URL') || 'https://api.mobilemessage.com.au/v1'

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

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

      // Send SMS via Mobile Message
      try {
        const response = await fetch(`${mobileMessageApiUrl}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mobileMessageApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.phone,
            from: mobileMessageSenderId,
            message: message,
            accountId: mobileMessageAccountId,
          }),
        })

        const result = await response.json()

        // Log notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'sms',
          channel: 'mobilemessage',
          recipient: user.phone,
          message,
          status: 'sent',
          external_id: result.messageId,
          sent_at: new Date().toISOString(),
        })

        results.push({
          userId: user.id,
          status: 'sent',
          messageId: result.messageId,
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

Create `app/api/webhooks/mobilemessage/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messageId = body.messageId
    const status = body.status
    
    // Verify webhook authenticity (implement signature verification if available)
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.MOBILE_MESSAGE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update notification status in database
    const supabase = createClient()
    const updates: any = { status: status }

    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    } else if (status === 'failed' || status === 'undelivered') {
      updates.error_message = body.errorMessage || 'Delivery failed'
    }

    await supabase
      .from('notifications')
      .update(updates)
      .eq('external_id', messageId)

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

Configure webhook URL in Mobile Message Dashboard:
- Go to Settings → Webhooks or API Configuration
- Set Delivery Callback URL to:
  `https://yourapp.com/api/webhooks/mobilemessage`
- Include your API key in webhook headers for security

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
  currency: string = 'AUD'
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
// SMS is typically charged per segment (160 chars for GSM, 70 for Unicode)
export function optimizeSMSLength(message: string, maxLength: number = 160): string {
  if (message.length <= maxLength) return message
  
  // Truncate and add ellipsis
  return message.substring(0, maxLength - 3) + '...'
}
```

## Testing

### Mock Mobile Message Client

```typescript
// lib/mobilemessage/client.test.ts
import { jest } from '@jest/globals'

export const mockMobileMessageClient = {
  post: jest.fn().mockResolvedValue({
    data: {
      messageId: 'MM_mock_message_id',
      status: 'sent',
    },
  }),
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
    
    expect(mockMobileMessageClient.post).toHaveBeenCalled()
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

1. **Bulk messaging**: Use batch endpoints if available
2. **Optimize message length**: Keep under 160 characters when possible
3. **Group notifications**: Batch similar messages
4. **Time zone awareness**: Send at optimal times
5. **Delivery reports**: Track failed messages to avoid retries
6. **Australian focus**: Benefit from local pricing for Australian numbers

## Troubleshooting

### Common Issues

1. **Messages not delivered**
   - Verify phone number format (Australian: +61...)
   - Check Mobile Message account balance/credits
   - Verify sender ID is approved
   - Ensure number is not on DND list

2. **High costs**
   - Review message length and character count
   - Check for duplicate sends
   - Optimize notification frequency
   - Use Australian sender IDs for better rates

3. **Rate limit errors**
   - Implement exponential backoff
   - Spread sends over time
   - Check account sending limits

4. **API authentication errors**
   - Verify API key is correct and active
   - Check API key permissions
   - Ensure proper header formatting

## Resources

- [Mobile Message Documentation](https://www.mobilemessage.com.au/docs)
- [Mobile Message API Reference](https://www.mobilemessage.com.au/api)
- [Australian SMS Best Practices](https://www.mobilemessage.com.au/best-practices)
- [Pricing Information](https://www.mobilemessage.com.au/pricing)
