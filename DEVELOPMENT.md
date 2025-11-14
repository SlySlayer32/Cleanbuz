# Cleanbuz Development Guide

## Quick Start

### Prerequisites

- Node.js 18+ (v20.19.5 recommended)
- npm 8+ (v10.8.2 recommended)

### Initial Setup

1. Clone the repository:

```bash
git clone https://github.com/SlySlayer32/Cleanbuz.git
cd Cleanbuz
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the production application
- `npm run start` - Start the production server

### Code Quality

- `npm run lint` - Run ESLint to check for code issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
Cleanbuz/
├── app/              # Next.js 14+ App Router pages
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and libraries
├── types/            # TypeScript type definitions
├── public/           # Static assets
└── [docs]/           # Technical documentation files
```

## Technology Stack

### Frontend

- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling

### Backend & Services

- **Supabase** - Backend-as-a-Service (Database, Auth, Storage, Edge Functions)
- **Mobile Message** - SMS notifications
- **iCal** - Booking feed parsing

### Data & State Management

- **@tanstack/react-query** - Server state management
- **react-hook-form** - Form handling
- **zod** - Schema validation

### Utilities

- **date-fns** - Date manipulation
- **lucide-react** - Icon library
- **axios** - HTTP client
- **clsx / tailwind-merge** - Conditional styling

### Code Quality

- **ESLint** - Linting
- **Prettier** - Code formatting

## Development Workflow

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the code style

3. Run linting and type checks:

```bash
npm run lint
npm run type-check
npm run format:check
```

4. Build to ensure no errors:

```bash
npm run build
```

5. Commit your changes with a clear message

6. Push and create a pull request

## Environment Variables

See `.env.example` for required environment variables:

- **Supabase**: Project URL, anon key, service role key
- **Mobile Message**: API key, account ID, sender ID
- **OAuth (optional)**: Google, Apple credentials

## Development Phases

Follow the [TECHNICAL_BUILD_PLAN.md](./TECHNICAL_BUILD_PLAN.md) to implement features in order:

### Phase Status

1. **Phase 1: Project Setup & Infrastructure** (50% Complete)
   - ✅ 1.1: Initial Project Configuration
   - ✅ 1.2: Supabase Project Setup
   - ⏳ 1.3: Database Schema Implementation (Next)
   - ⏳ 1.4: Row Level Security (RLS) Policies

2. **Phase 2: Authentication System** (Upcoming)
   - Phone OTP Authentication
   - Email/Password Authentication
   - OAuth Integration
   - Session Management

3. **Phase 3: Core Backend Features** (Planned)
4. **Phase 4: Third-Party Integrations** (Planned)
5. **Phase 5: Frontend Development** (Planned)
6. **Phase 6: Real-time Features** (Planned)
7. **Phase 7: Progressive Web App** (Planned)
8. **Phase 8: Testing & QA** (Planned)
9. **Phase 9: Deployment & DevOps** (Planned)

### Current Phase Details

**Active Phase:** 1.3 - Database Schema Implementation

**Next Steps:**
- Create Supabase project on supabase.com (if not exists)
- Link local project to remote: `supabase link --project-ref <ref>`
- Create initial migration file for all database tables
- Implement database schema with proper indexes
- Apply migrations and generate TypeScript types

See [STAGE_1_2_COMPLETION.md](./STAGE_1_2_COMPLETION.md) for Phase 1.2 completion details.

## Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Complete setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database design
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth implementation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration
- [TECHNICAL_BUILD_PLAN.md](./TECHNICAL_BUILD_PLAN.md) - Complete build roadmap

## Troubleshooting

### Build Fails with Google Fonts Error

The application uses system fonts by default. If you see Google Fonts errors, ensure the layout.tsx doesn't import fonts from `next/font/google`.

### ESLint Errors

Run `npm run lint` to see errors and fix them. Auto-fix many issues with appropriate ESLint plugins.

### TypeScript Errors

Run `npm run type-check` to see type errors. Make sure all types are properly defined in the `types/` directory.

## Support

For issues or questions:

1. Check the documentation files
2. Review the [TECHNICAL_BUILD_PLAN.md](./TECHNICAL_BUILD_PLAN.md)
3. Create an issue on GitHub
