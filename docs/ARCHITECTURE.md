# Cleanbuz - Task Management App Architecture

## Overview

Cleanbuz is a full-stack task management application designed for property management, synchronized with Airbnb bookings via iCal. The system provides real-time task updates, automated notifications, and seamless booking integration.

## System Architecture

### Technology Stack

**Frontend:**

- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- PWA capabilities (next-pwa)
- Deployed on Vercel

**Backend:**

- Supabase (BaaS)
  - PostgreSQL Database
  - Edge Functions (Deno runtime)
  - Realtime subscriptions
  - Authentication
  - Storage for attachments

**External Services:**

- Mobile Message SMS API (notifications)
- Airbnb iCal feeds (booking sync)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js PWA (Vercel)                         │  │
│  │  - React Components                                  │  │
│  │  - Service Workers                                   │  │
│  │  - Offline Support                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │   Realtime   │  │   Storage    │     │
│  │  - Phone OTP │  │  - WebSocket │  │  - Files     │     │
│  │  - Email     │  │  - Pub/Sub   │  │  - Images    │     │
│  │  - OAuth     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                     │  │
│  │  - Bookings, Tasks, Users, Notifications            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Edge Functions (Deno)                     │  │
│  │  - iCal Sync, Notifications, Business Logic         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              │                            │
              │                            │
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  Airbnb iCal     │        │   Mobile Message SMS     │
    │  Booking Feeds   │        │   Notifications  │
    └──────────────────┘        └──────────────────┘
```

## Core Components

### 1. Frontend (Next.js PWA)

**Key Features:**

- Server-side rendering (SSR) for SEO
- Progressive Web App with offline support
- Responsive design for mobile and desktop
- Real-time UI updates via Supabase Realtime
- Optimistic UI updates for better UX

**Directory Structure:**

```
/app
  /(auth)
    /login
    /signup
    /verify-otp
  /(dashboard)
    /tasks
    /bookings
    /calendar
    /settings
  /api
    /webhooks
/components
  /ui
  /tasks
  /bookings
  /calendar
/lib
  /supabase
  /utils
/hooks
/types
/public
  /icons
  /manifest.json
```

### 2. Database Schema (PostgreSQL)

**Core Tables:**

- `users` - User accounts with profile information
- `bookings` - Airbnb bookings synced from iCal
- `tasks` - Task items with assignments and status
- `task_templates` - Reusable task templates
- `notifications` - SMS/push notification logs
- `properties` - Property information
- `ical_feeds` - iCal feed configurations

### 3. Supabase Edge Functions

**Functions:**

- `sync-ical-bookings` - Periodic iCal feed sync
- `generate-tasks` - Auto-generate tasks from bookings
- `send-daily-digest` - Daily notification scheduler
- `process-booking-change` - Handle booking updates
- `cleanup-expired-data` - Data maintenance

### 4. Authentication Flow

**Supported Methods:**

1. **Phone OTP** - Primary method for quick access
2. **Email/Password** - Traditional authentication
3. **OAuth Providers** - Google, Apple (optional)

**Security:**

- Row Level Security (RLS) policies
- JWT tokens with refresh rotation
- Multi-factor authentication support
- Session management

### 5. Real-time Updates

**Channels:**

- `tasks:*` - Task changes broadcast
- `bookings:*` - Booking updates
- `notifications:*` - New notifications

**Events:**

- Task created/updated/completed
- Booking added/modified
- Team member assignments

### 6. Notification System

**Mobile Message SMS Integration:**

- Daily task digests (morning)
- Urgent task alerts
- Booking reminders
- Team notifications

**Personalization:**

- User timezone handling
- Preference management
- Quiet hours support

### 7. iCal Sync Integration

**Process:**

1. Store iCal feed URLs in database
2. Schedule periodic sync (every 15-60 minutes)
3. Parse iCal format (RFC 5545)
4. Extract booking details
5. Create/update bookings in database
6. Trigger task generation
7. Send notifications for changes

## Data Flow

### Booking Sync Flow

```
Airbnb → iCal Feed → Edge Function → Parse → Database
                                              ↓
                                    Generate Tasks
                                              ↓
                                    Notify Users (Mobile Message)
```

### Task Management Flow

```
User Action → Next.js → Supabase API → Database
                                         ↓
                                  Realtime Broadcast
                                         ↓
                              Update All Connected Clients
```

## Security Considerations

### Authentication & Authorization

- Phone OTP with rate limiting
- Secure password hashing (bcrypt)
- OAuth token management
- RLS policies for data isolation

### Data Protection

- HTTPS/TLS encryption in transit
- Database encryption at rest
- API key rotation
- Input validation and sanitization

### API Security

- Rate limiting on Edge Functions
- CORS configuration
- Webhook signature verification
- DDoS protection

## Scalability Strategy

### Database

- Indexed queries for performance
- Connection pooling via Supabase
- Partitioning for large tables
- Read replicas for reporting

### Edge Functions

- Stateless function design
- Horizontal scaling via Deno Deploy
- Efficient cron job scheduling
- Queue-based processing for heavy tasks

### Frontend

- CDN delivery via Vercel
- Image optimization
- Code splitting and lazy loading
- Service worker caching

### Monitoring

- Error tracking (Sentry)
- Performance monitoring
- Database query analysis
- User analytics

## Reliability Measures

### High Availability

- Multi-region Supabase deployment
- Vercel edge network deployment
- Automatic failover
- Health check endpoints

### Data Integrity

- Database transactions
- Idempotent operations
- Retry mechanisms with exponential backoff
- Data validation at all layers

### Backup & Recovery

- Automated database backups
- Point-in-time recovery
- Disaster recovery plan
- Regular backup testing

## Performance Targets

- **Page Load Time:** < 2 seconds
- **Time to Interactive:** < 3 seconds
- **API Response Time:** < 200ms (p95)
- **Realtime Latency:** < 100ms
- **SMS Delivery:** < 5 seconds
- **iCal Sync:** Every 15-60 minutes

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies (`npm install`)
3. Set up Supabase project
4. Configure environment variables
5. Run development server (`npm run dev`)

### Testing

- Unit tests (Jest/Vitest)
- Integration tests (Playwright)
- E2E tests (Cypress)
- Load testing (k6)

### Deployment

- Git push to main branch
- Automatic Vercel deployment
- Database migrations via Supabase CLI
- Edge Functions deployment
- Environment variable management

## Cost Estimation

### Supabase (Pro Plan)

- ~$25/month base
- Additional for database size and bandwidth

### Vercel (Pro Plan)

- ~$20/month
- Additional for bandwidth and build time

### Mobile Message SMS

- ~$0.0075 per SMS
- Estimate: 100 users × 30 days × 2 SMS/day = ~$45/month

**Total Estimated Monthly Cost:** ~$100-150 for up to 100 users

## Next Steps

1. Set up Supabase project
2. Initialize Next.js application
3. Implement database schema
4. Develop authentication flows
5. Create Edge Functions
6. Build frontend components
7. Integrate Mobile Message SMS
8. Implement iCal sync
9. Add real-time features
10. Deploy to production
11. Monitor and optimize

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mobile Message SMS API](https://www.mobilemessage.com.au/docs)
- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
