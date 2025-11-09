# Cleanbuz - Task Management App with Airbnb Integration

> **🤖 AI-Ready Development**: This project includes comprehensive AI-readable instructions for GitHub Copilot and other AI coding assistants. Perfect for non-technical founders! See [COPILOT_QUICK_START.md](COPILOT_QUICK_START.md) to get started with AI-driven development.

## Overview

Cleanbuz is a comprehensive full-stack task management application designed for property managers, with seamless integration to Airbnb bookings via iCal feeds. The system automatically generates cleaning and maintenance tasks based on booking schedules and sends personalized SMS notifications to team members.

## Key Features

- 🏠 **Property Management** - Manage multiple properties and team members
- 📅 **Airbnb Integration** - Automatic booking sync via iCal feeds from Airbnb, VRBO, Booking.com
- ✅ **Task Management** - Create, assign, and track tasks with real-time updates
- 📱 **SMS Notifications** - Daily digests and task reminders via Mobile Message
- 🔐 **Multi-Auth** - Phone OTP, Email/Password, and OAuth (Google, Apple)
- 🔄 **Real-time Updates** - Instant synchronization across all devices
- 📊 **PWA Support** - Works offline and installable on mobile devices
- 🚀 **Scalable Architecture** - Built for reliability and performance

## Tech Stack

### Frontend

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **PWA** - Progressive Web App capabilities

### Backend

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Phone, Email, OAuth)
  - Edge Functions (Deno runtime)
  - Realtime subscriptions
  - Storage for file uploads
- **Mobile Message** - SMS notifications
- **iCal/RFC 5545** - Calendar feed parsing

### Deployment

- **Vercel** - Frontend hosting and edge functions
- **Supabase Cloud** - Database and backend services

## Documentation

### 🚀 AI Development (NEW)
- **[COPILOT_QUICK_START.md](COPILOT_QUICK_START.md)** - Quick start guide for using GitHub Copilot and AI tools
- **[GITHUB_SETUP_SUMMARY.md](GITHUB_SETUP_SUMMARY.md)** - Complete guide to GitHub configuration and workflows
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI-readable instructions for Copilot (auto-loaded)

### Getting Started

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Complete setup guide from scratch

### Architecture & Design

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Complete database schema with RLS policies

### Backend Setup

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Supabase project configuration
- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Phone OTP, email, and OAuth implementation
- **[REALTIME_UPDATES.md](REALTIME_UPDATES.md)** - Real-time synchronization setup

### Integrations

- **[ICAL_INTEGRATION.md](ICAL_INTEGRATION.md)** - Airbnb/VRBO booking sync via iCal
- **[MOBILE_MESSAGE_SMS.md](MOBILE_MESSAGE_SMS.md)** - SMS notification implementation

### Frontend Development

- **[NEXTJS_FRONTEND.md](NEXTJS_FRONTEND.md)** - Next.js PWA development guide

### Deployment & Operations

- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY_BEST_PRACTICES.md](SECURITY_BEST_PRACTICES.md)** - Security and scalability measures

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/cleanbuz.git
cd cleanbuz

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# Visit http://localhost:3000
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mobile Message
MOBILE_MESSAGE_API_KEY=your-api-key-here
MOBILE_MESSAGE_ACCOUNT_ID=your-account-id
MOBILE_MESSAGE_SENDER_ID=YourBusiness

# Optional: OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Vercel)                     │
│  Next.js PWA • React • TypeScript • Tailwind CSS             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Platform                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Realtime   │  │   Storage    │      │
│  │  Phone, Email│  │  WebSocket   │  │   Files      │      │
│  │     OAuth    │  │   Pub/Sub    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌────────────────────────────────────────────────────┐     │
│  │           PostgreSQL Database                      │     │
│  │  Tasks • Bookings • Properties • Notifications     │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │           Edge Functions (Deno)                    │     │
│  │  iCal Sync • Task Generation • Notifications      │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
              │                            │
              │                            │
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  Airbnb iCal     │        │   Mobile Message SMS     │
    │  Booking Feeds   │        │   Notifications  │
    └──────────────────┘        └──────────────────┘
```

## Features in Detail

### 1. Booking Synchronization

- Automatic iCal feed polling (every 15-60 minutes)
- Support for multiple platforms (Airbnb, VRBO, Booking.com)
- Guest information extraction
- Duplicate prevention
- Change detection and notifications

### 2. Task Management

- Template-based task generation
- Checklist support
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Pending, In Progress, Completed)
- Time tracking
- Photo attachments
- Team assignments

### 3. Real-time Features

- Instant task updates across devices
- Live booking synchronization
- Presence tracking (who's online)
- Collaborative editing indicators

### 4. Notification System

- Daily task digests (morning)
- Task reminders (2 hours before due)
- Urgent task alerts
- Booking change notifications
- Quiet hours support
- Timezone-aware delivery

### 5. Authentication

- Phone OTP (primary method)
- Email/Password
- OAuth (Google, Apple)
- Multi-factor authentication support
- Session management
- Password reset flow

### 6. Progressive Web App

- Installable on mobile devices
- Offline functionality
- Push notifications
- Home screen icon
- App-like experience

## Development Workflow

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy Edge Functions
supabase functions deploy
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## Database Schema

Key tables:

- `profiles` - User accounts and preferences
- `properties` - Property information
- `ical_feeds` - iCal feed configurations
- `bookings` - Synchronized booking data
- `tasks` - Task assignments and tracking
- `task_templates` - Reusable task templates
- `notifications` - Notification logs
- `team_members` - Property team assignments

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete schema with RLS policies.

## Security Features

- Row Level Security (RLS) on all tables
- JWT-based authentication
- HTTPS/TLS encryption
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention
- XSS protection
- CSRF tokens
- Audit logging

## Performance Optimizations

- Database indexing for common queries
- Connection pooling
- Redis caching (optional)
- CDN for static assets
- Image optimization
- Code splitting and lazy loading
- Service worker caching
- Edge function optimization

## Cost Estimation (Monthly)

- **Supabase Pro**: $25 (includes database, auth, storage)
- **Vercel Pro**: $20 (includes hosting, edge functions)
- **Mobile Message SMS**: $45 (estimate for 100 users, 2 SMS/day)
- **Total**: ~$100-150/month for up to 100 active users

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Team chat integration
- [ ] Expense tracking
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Calendar view enhancements
- [ ] API for third-party integrations

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Support

- 📖 Documentation: See files in this repository
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/cleanbuz/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/cleanbuz/discussions)

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Next.js](https://nextjs.org) - React framework
- [Vercel](https://vercel.com) - Deployment platform
- [Mobile Message](https://www.mobilemessage.com.au) - SMS service
- [Tailwind CSS](https://tailwindcss.com) - Styling framework

---

Built with ❤️ for property managers and cleaning teams
