# Cleanbuz - AI-Readable Repository Instructions

## Project Overview

Cleanbuz is a full-stack task management application designed for property managers with seamless integration to Airbnb bookings via iCal feeds. The system automatically generates cleaning and maintenance tasks based on booking schedules and sends personalized SMS notifications to team members.

**Key Purpose**: Enable property managers to efficiently manage tasks, synchronize bookings from multiple platforms (Airbnb, VRBO, Booking.com), and coordinate team members through automated notifications.

**Target Users**: Property managers, cleaning teams, maintenance staff
**Deployment**: Production-ready architecture with 99.9%+ uptime target

## Technology Stack

### Frontend
- **Next.js 14+** with App Router (React framework)
- **TypeScript** (strict mode enabled)
- **Tailwind CSS** for styling
- **React Query (@tanstack/react-query)** for data fetching and caching
- **PWA** (Progressive Web App) with next-pwa
- **Deployment**: Vercel

### Backend
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (Phone OTP, Email/Password, OAuth)
  - Edge Functions (Deno runtime)
  - Realtime subscriptions (WebSocket)
  - Storage for file uploads

### External Services
- **Mobile Message SMS API** for notifications
- **iCal/RFC 5545** for calendar feed parsing (Airbnb, VRBO, Booking.com)

### Key Dependencies
```json
{
  "@supabase/supabase-js": "latest",
  "@supabase/auth-helpers-nextjs": "latest",
  "@tanstack/react-query": "latest",
  "react-hook-form": "latest",
  "zod": "latest",
  "date-fns": "latest",
  "axios": "latest",
  "node-ical": "latest",
  "next-pwa": "latest",
  "lucide-react": "latest"
}
```

## Project Structure

```
/
├── src/
│   ├── app/                    # Next.js 14 App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── tasks/             # Task management components
│   │   ├── bookings/          # Booking display components
│   │   ├── calendar/          # Calendar views
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── supabase/          # Supabase client utilities
│   │   ├── mobilemessage/     # SMS service integration
│   │   └── utils/             # Helper functions
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge Functions (Deno)
│   └── config.toml            # Supabase configuration
├── public/                    # Static assets
└── .github/                   # GitHub configuration
```

## Coding Guidelines & Best Practices

### General Rules
1. **Always use TypeScript** with strict mode enabled
2. **Follow functional programming** paradigms where possible
3. **Write self-documenting code** with clear variable and function names
4. **Keep functions small and focused** (single responsibility principle)
5. **Use async/await** instead of promise chains

### React/Next.js Specific
1. **Use React Server Components** by default (Next.js 14 App Router)
2. **Add 'use client'** directive only when necessary (hooks, browser APIs, event handlers)
3. **Use React hooks** for state management (useState, useEffect, useContext)
4. **Implement error boundaries** for graceful error handling
5. **Use Suspense** for loading states with React Query
6. **Follow Next.js 14 App Router conventions**:
   - Place page files in app directory with page.tsx naming
   - Use layout.tsx for nested layouts
   - Use loading.tsx for loading states
   - Use error.tsx for error handling

### TypeScript Guidelines
1. **Define all types explicitly** - avoid 'any' type
2. **Use interfaces** for object shapes
3. **Use type aliases** for unions and complex types
4. **Create separate type files** in types/ directory
5. **Use strict null checks** and proper error handling

### Component Structure
```typescript
// Component template structure
'use client' // Only if needed

import { /* dependencies */ } from 'package'

// Type definitions at top
interface ComponentProps {
  // props
}

// Main component
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Event handlers
  const handleAction = () => {
    // logic
  }
  
  // Early returns
  if (!data) return <Loading />
  
  // Main render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Styling
1. **Use Tailwind CSS** utility classes for all styling
2. **Use clsx or cn()** helper for conditional classes
3. **Follow mobile-first** responsive design
4. **Use consistent spacing** (rem units via Tailwind)
5. **Implement dark mode** support where applicable

### Database & Supabase
1. **Always use Row Level Security (RLS)** policies on all tables
2. **Use prepared statements** to prevent SQL injection
3. **Implement proper indexes** for frequently queried fields
4. **Use foreign keys** for referential integrity
5. **Create database migrations** for all schema changes
6. **Use Supabase Edge Functions** for server-side business logic
7. **Leverage Realtime subscriptions** for live updates

### Authentication
1. **Implement phone OTP** as primary authentication method
2. **Support email/password** as fallback
3. **Add OAuth providers** (Google, Apple) for convenience
4. **Use JWT tokens** for session management
5. **Implement proper session refresh** logic
6. **Add rate limiting** on authentication endpoints

### API Routes & Edge Functions
1. **Validate all inputs** using Zod schemas
2. **Return consistent error formats**:
```typescript
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```
3. **Use proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500)
4. **Implement request logging** for debugging
5. **Add CORS headers** for cross-origin requests

### Security Requirements
1. **Never commit secrets** to repository
2. **Use environment variables** for all credentials
3. **Implement input validation** on all user inputs
4. **Sanitize data** before database operations
5. **Use HTTPS only** for all connections
6. **Implement rate limiting** on all public endpoints
7. **Add CSRF protection** where applicable
8. **Enable security headers** (CSP, HSTS, X-Frame-Options)

### Error Handling
1. **Always handle errors gracefully**
2. **Provide meaningful error messages** to users
3. **Log errors** with context for debugging
4. **Use try-catch blocks** in async operations
5. **Implement fallback UI** for error states

### Testing Strategy
1. **Write unit tests** for utility functions
2. **Write integration tests** for API routes
3. **Write E2E tests** for critical user flows
4. **Test error scenarios** explicitly
5. **Maintain >80% code coverage** for business logic

### Performance Guidelines
1. **Implement code splitting** and lazy loading
2. **Optimize images** (use Next.js Image component)
3. **Use React Query caching** effectively
4. **Implement pagination** for large data sets
5. **Add database indexes** for frequently queried fields
6. **Use Vercel Edge Functions** for low latency
7. **Implement service worker caching** for PWA

### Naming Conventions
1. **Components**: PascalCase (UserProfile.tsx)
2. **Functions**: camelCase (getUserProfile)
3. **Constants**: UPPER_SNAKE_CASE (API_BASE_URL)
4. **Files**: kebab-case for directories (user-profile/)
5. **Database tables**: snake_case (user_profiles)
6. **API routes**: kebab-case (/api/user-profile)

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

### Supabase Commands
```bash
# Initialize Supabase locally
supabase init

# Link to remote project
supabase link --project-ref <project-id>

# Pull remote schema
supabase db pull

# Push local migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy <function-name>

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### Deployment
```bash
# Deploy to Vercel
vercel --prod

# Preview deployment
vercel
```

## Environment Variables

Required environment variables (never commit these):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Mobile Message SMS
MOBILE_MESSAGE_API_KEY=your-api-key
MOBILE_MESSAGE_ACCOUNT_ID=your-account-id
MOBILE_MESSAGE_SENDER_ID=YourBusiness

# Optional: OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Schema Overview

Key tables (always use RLS policies):
- **profiles**: User accounts and preferences
- **properties**: Property information
- **ical_feeds**: iCal feed configurations for booking sync
- **bookings**: Synchronized booking data from Airbnb/VRBO
- **tasks**: Task assignments and tracking
- **task_templates**: Reusable task templates
- **task_checklist_items**: Checklist items for tasks
- **notifications**: Notification logs and delivery status
- **team_members**: Property team assignments

See DATABASE_SCHEMA.md for complete schema with RLS policies.

## Key Features Implementation

### 1. Booking Synchronization
- Automatic iCal feed polling (every 30 minutes via Edge Function)
- Support multiple platforms (Airbnb, VRBO, Booking.com)
- Extract guest information from iCal data
- Prevent duplicates using unique constraints
- Detect changes and send notifications

### 2. Task Management
- Template-based task generation from bookings
- Support checklists with completion tracking
- Priority levels: Low, Medium, High, Urgent
- Status tracking: Pending, In Progress, Completed
- Time tracking and photo attachments
- Team member assignments with notifications

### 3. Real-time Updates
- WebSocket subscriptions for live updates
- Instant task synchronization across devices
- Live booking updates
- Presence tracking (who's online)
- Optimistic UI updates for better UX

### 4. Notification System
- Daily task digests (morning delivery)
- Task reminders (2 hours before due time)
- Urgent task alerts (immediate)
- Booking change notifications
- Timezone-aware delivery
- Quiet hours support (no notifications 10pm-7am)

### 5. Authentication Flow
- Phone OTP via Mobile Message SMS (primary)
- Email/Password authentication (fallback)
- OAuth (Google, Apple) for convenience
- Session management with JWT
- Automatic token refresh
- Password reset flow

### 6. PWA Features
- Installable on mobile devices
- Offline functionality with service workers
- Push notifications support
- Home screen icon
- App-like experience
- Background sync when online

## Integration Guidelines

### Mobile Message SMS
- Use REST API via axios
- Always include sender ID
- Personalize messages with user names
- Respect quiet hours (10pm-7am)
- Log all sent messages in notifications table
- Handle delivery failures gracefully

### iCal Feed Processing
- Use node-ical library for parsing
- Poll feeds every 30 minutes via Edge Function
- Extract: check-in, check-out, guest name, booking ID
- Create tasks automatically from bookings
- Handle timezone conversions properly
- Validate iCal feed format before processing

### Supabase Realtime
- Subscribe to table changes for live updates
- Use broadcast for custom events
- Implement presence for online status
- Handle reconnection automatically
- Clean up subscriptions on unmount

## Documentation References

All comprehensive documentation is available in the repository:
- **GETTING_STARTED.md**: Complete setup guide from scratch
- **ARCHITECTURE.md**: System architecture and design decisions
- **DATABASE_SCHEMA.md**: Complete database schema with RLS policies
- **SUPABASE_SETUP.md**: Supabase project configuration
- **AUTHENTICATION.md**: Phone OTP, email, and OAuth implementation
- **REALTIME_UPDATES.md**: Real-time synchronization setup
- **ICAL_INTEGRATION.md**: Airbnb/VRBO booking sync via iCal
- **MOBILE_MESSAGE_SMS.md**: SMS notification implementation
- **NEXTJS_FRONTEND.md**: Next.js PWA development guide
- **VERCEL_DEPLOYMENT.md**: Production deployment guide
- **SECURITY_BEST_PRACTICES.md**: Security and scalability measures
- **TECHNICAL_BUILD_PLAN.md**: Detailed implementation roadmap

## Common Patterns & Solutions

### Supabase Client Pattern
```typescript
// Browser client
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server component
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### React Query Pattern
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks', propertyId],
  queryFn: () => fetchTasks(propertyId),
})

// Mutate data
const mutation = useMutation({
  mutationFn: (task) => createTask(task),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

### Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    
  if (error) throw error
  
  return data
} catch (error) {
  console.error('Error fetching tasks:', error)
  throw new Error('Failed to fetch tasks')
}
```

## AI Code Generation Preferences

When generating code:
1. **Prioritize readability** over cleverness
2. **Include error handling** in all async operations
3. **Add inline comments** for complex logic only
4. **Use TypeScript types** explicitly
5. **Follow existing patterns** in the codebase
6. **Implement proper validation** for user inputs
7. **Consider security implications** of all code
8. **Optimize for performance** without sacrificing clarity
9. **Test edge cases** in implementation
10. **Keep components small** and focused

## Troubleshooting Common Issues

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check Supabase project status in dashboard
- Ensure RLS policies allow operation
- Verify JWT token is valid and not expired

### Real-time Not Working
- Confirm Realtime is enabled in Supabase dashboard
- Check RLS policies allow SELECT on subscribed table
- Verify WebSocket connection in browser dev tools
- Ensure cleanup in useEffect return function

### SMS Not Sending
- Verify Mobile Message API credentials
- Check account balance and credit
- Ensure phone number is in E.164 format (+61...)
- Check quiet hours settings

### Build Failures
- Clear .next directory and rebuild
- Update all dependencies to compatible versions
- Check for TypeScript errors with npm run type-check
- Verify environment variables are set in Vercel

## Scalability Considerations

The architecture is designed to scale to 10,000+ users:
- **Database**: PostgreSQL with proper indexes and RLS
- **Edge Functions**: Deno runtime scales automatically
- **Frontend**: Static generation + CDN via Vercel
- **Real-time**: Supabase handles millions of connections
- **Storage**: Scalable object storage via Supabase
- **Caching**: React Query + Service Workers

## Cost Optimization

Target: ~$100/month for 100 active users
- Use Supabase free tier for development
- Optimize SMS usage (daily digests vs individual messages)
- Implement efficient polling for iCal feeds
- Use CDN caching for static assets
- Optimize database queries with proper indexes

## Version Control

- **Main branch**: Protected, production-ready code
- **Feature branches**: Use descriptive names (feature/task-templates)
- **Commit messages**: Use conventional commits (feat:, fix:, docs:)
- **Pull requests**: Required for all changes to main
- **Code review**: At least one approval before merge

## Support & Resources

For questions or issues:
1. Check relevant documentation file
2. Review troubleshooting sections
3. Check Supabase/Next.js official documentation
4. Create GitHub issue with reproduction steps

---

## GitHub Copilot Coding Agent Best Practices

### Working with Copilot on Issues

**Creating Well-Scoped Issues for Copilot:**
When creating issues for Copilot to work on, ensure they are:
- **Specific and Clear**: Provide exact details about what needs to be changed
- **Well-Bounded**: Focus on a single feature, bug fix, or improvement
- **File-Referenced**: Mention which files or directories should be modified
- **Acceptance Criteria**: Include clear success criteria or expected outcomes
- **Context-Rich**: Reference relevant documentation files in this repository

**Example of a Well-Scoped Issue:**
```markdown
Title: Add loading state to TaskCard component

Description:
Update the TaskCard component in src/components/tasks/TaskCard.tsx to:
- Add a loading skeleton when task data is being fetched
- Use the existing LoadingSpinner from src/components/ui/
- Maintain current TypeScript types
- Follow the component structure pattern

Acceptance Criteria:
- Loading state displays while data is fetching
- No TypeScript errors
- Consistent with existing UI patterns
- Works with React Query loading states

Files to modify:
- src/components/tasks/TaskCard.tsx
```

### Appropriate Tasks for Copilot

**✅ Good Tasks for Copilot:**
- Fixing bugs with clear reproduction steps
- Adding tests for existing functionality
- Updating documentation
- Creating new components based on existing patterns
- Refactoring isolated modules or functions
- Implementing well-defined API routes
- Adding TypeScript types and interfaces
- UI improvements with specific requirements
- Performance optimizations for specific functions
- Adding error handling to existing code

**❌ Tasks to Handle Manually:**
- Major architectural changes or redesigns
- Security-critical authentication/authorization logic
- Payment processing or financial transactions
- Cross-repository or multi-service coordination
- Complex business logic requiring deep domain knowledge
- Breaking changes affecting multiple systems
- Initial project setup or scaffold generation
- Critical production hotfixes requiring immediate deployment

### Reviewing Copilot's Pull Requests

**Review Checklist:**
1. **Code Quality**
   - Does it follow the project's coding standards?
   - Are TypeScript types properly defined?
   - Is error handling comprehensive?
   - Does it match existing patterns?

2. **Security**
   - Are inputs properly validated?
   - Are RLS policies maintained for database operations?
   - Are secrets or sensitive data properly handled?
   - Is authentication/authorization checked?

3. **Testing**
   - Are tests included or updated?
   - Do existing tests still pass?
   - Are edge cases considered?

4. **Documentation**
   - Are code comments added where necessary?
   - Is documentation updated if behavior changes?
   - Are API changes documented?

5. **Performance**
   - Are there any obvious performance issues?
   - Are database queries optimized?
   - Is unnecessary re-rendering avoided?

**Providing Feedback:**
Use `@copilot` mentions in PR comments to request changes or clarifications:
```markdown
@copilot Please add error handling for network failures in this function.

@copilot The TypeScript types here should use the Task interface from src/types/task.ts instead.

@copilot Can you add unit tests for this new utility function?
```

### Iterative Collaboration

**Working with Copilot Iteratively:**
1. **Start Simple**: Begin with clear, focused tasks
2. **Review Early**: Check Copilot's PRs quickly and provide feedback
3. **Iterate**: Request improvements or refinements through comments
4. **Merge When Ready**: Only merge after thorough validation
5. **Learn Patterns**: Observe what works well and refine future issue descriptions

**Communication Tips:**
- Be specific about what needs to change
- Reference exact file paths and line numbers when possible
- Point to existing patterns or examples in the codebase
- Explain the "why" behind requested changes
- Ask for clarification if Copilot's approach is unclear

### Security Considerations for AI-Generated Code

**Critical Security Areas (Require Extra Review):**
- Authentication and session management
- Authorization checks and RLS policies
- Input validation and sanitization
- Database queries (SQL injection prevention)
- API endpoint security
- Environment variable handling
- Password and credential management
- File upload and processing
- CORS and security headers
- Rate limiting implementation

**Always Manually Review:**
- Any code touching user authentication
- Database migration files
- Changes to RLS policies
- API routes handling sensitive data
- Payment or financial logic
- User permission checks
- Third-party API integrations with credentials

### Custom Agents (Advanced)

For specialized, recurring tasks, you can define custom agents in `.github/agents/` directory:

**Example Agent Structure:**
```markdown
# .github/agents/test-writer.md

## Agent Purpose
Specialized in writing comprehensive unit and integration tests.

## Instructions
When assigned test-writing tasks:
1. Use Jest for unit tests
2. Use React Testing Library for component tests
3. Follow existing test patterns in __tests__/ directories
4. Aim for >80% code coverage
5. Include edge cases and error scenarios
6. Mock external dependencies (Supabase, APIs)

## Expertise Areas
- React component testing
- API route testing
- Database query mocking
- Async function testing
```

### Repository-Specific Guidance

**For Non-Technical Founders:**
- Copilot works best with clear, specific requests
- Start with small, low-risk tasks to build confidence
- Always review and test changes before merging
- Use the issue templates in .github/ISSUE_TEMPLATE/
- Leverage the CI/CD workflows to catch issues early
- Don't hesitate to ask Copilot for clarifications or improvements

**Continuous Improvement:**
- Monitor which types of tasks Copilot handles well
- Refine issue descriptions based on outcomes
- Update these instructions with new patterns and learnings
- Maintain clear documentation for better AI context
- Keep the codebase consistent for better AI predictions

---

**Remember**: This is a production application handling real user data. Always prioritize security, reliability, and user experience in all code decisions. When in doubt, refer to the comprehensive documentation files in this repository.

**For Copilot Coding Agent**: Treat every task as an opportunity to deliver production-quality code. Follow all guidelines strictly, ask for clarification when requirements are ambiguous, and never compromise on security or data integrity.
