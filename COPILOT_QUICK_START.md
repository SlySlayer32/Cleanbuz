# Quick Start: Using AI with Cleanbuz

This guide helps you start using GitHub Copilot and other AI tools to build the Cleanbuz application.

## ✅ What's Already Set Up

All AI-readable instructions and GitHub configuration are now in place:
- ✅ Comprehensive coding guidelines
- ✅ Project structure documentation
- ✅ Technology stack details
- ✅ Best practices and patterns
- ✅ Security requirements
- ✅ CI/CD automation
- ✅ Issue and PR templates

## 🚀 How to Use GitHub Copilot

### 1. Enable GitHub Copilot
- Install GitHub Copilot extension in VS Code or your IDE
- Sign in with your GitHub account
- Copilot will automatically read `.github/copilot-instructions.md`

### 2. Ask Copilot to Generate Code

Simply describe what you want in plain English. Copilot will generate code following the project's standards.

#### Example Prompts:

**Create a Component:**
```
Create a TaskCard component that displays task name, status badge, 
priority indicator, and assigned team member with their avatar
```

**Add Authentication:**
```
Implement phone OTP login flow using Mobile Message SMS 
as documented in AUTHENTICATION.md
```

**Create API Route:**
```
Create an API route at /api/properties/[id]/tasks that fetches 
all tasks for a property with proper authentication and RLS
```

**Add Database Query:**
```
Create a function to fetch upcoming bookings from Supabase 
with error handling and TypeScript types
```

**Implement Feature:**
```
Implement the iCal feed synchronization feature to pull 
bookings from Airbnb as documented in ICAL_INTEGRATION.md
```

### 3. Review Generated Code

Always check:
- ✅ Does it solve the problem?
- ✅ Are types properly defined?
- ✅ Is error handling included?
- ✅ Are security practices followed?
- ✅ Does it match the project structure?

### 4. Test the Code

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Test
npm test

# Run locally
npm run dev
```

## 📋 Using Templates

### Creating Issues

Use the templates for consistency:

1. **Bug Report**: `.github/ISSUE_TEMPLATE/bug_report.md`
   - Structured format for reporting bugs
   - Include reproduction steps
   - Add environment details

2. **Feature Request**: `.github/ISSUE_TEMPLATE/feature_request.md`
   - Describe the feature and use case
   - Explain benefits and priority
   - Suggest implementation approach

### Creating Pull Requests

The PR template `.github/pull_request_template.md` includes:
- Description and type of change
- Testing checklist
- Code quality verification
- Security considerations
- Documentation updates

## 🤖 Automated Workflows

### What Runs Automatically

**On Every Push/PR:**
1. **Linting** - Code style check
2. **Type Check** - TypeScript validation
3. **Tests** - Unit and integration tests
4. **Build** - Next.js build verification
5. **Security Scan** - Vulnerability detection

**On Merge to Main:**
- Automatic deployment to Vercel production

**Weekly (Mondays):**
- Dependency updates via Dependabot

## 💡 Tips for AI-Driven Development

### Best Practices

1. **Be Specific**: The more detail in your prompt, the better the result
   ```
   ❌ "Create a button"
   ✅ "Create a primary button component with loading state, 
       disabled state, and onClick handler using Tailwind CSS"
   ```

2. **Reference Documentation**: Point Copilot to specific docs
   ```
   "Implement real-time task updates using Supabase Realtime 
   as documented in REALTIME_UPDATES.md"
   ```

3. **Ask for Tests**: Include testing in your prompts
   ```
   "Create a task service with unit tests for creating, 
   updating, and deleting tasks"
   ```

4. **Request Error Handling**: Make it explicit
   ```
   "Create a function to send SMS via Mobile Message with 
   proper error handling and retry logic"
   ```

5. **Specify Types**: Ask for TypeScript types
   ```
   "Create a Task interface with all required fields and 
   proper TypeScript types"
   ```

### Common Patterns

**Creating Components:**
```
"Create a [ComponentName] component that [does X] 
following the project component structure with 
TypeScript props interface and proper imports"
```

**API Routes:**
```
"Create an API route for [operation] that validates 
input with Zod, checks authentication, and returns 
proper error responses"
```

**Database Operations:**
```
"Create a Supabase query to [operation] with RLS policy 
check, error handling, and TypeScript types"
```

**Integrations:**
```
"Implement [integration] following the pattern in 
[DOCUMENTATION.md] with error handling and logging"
```

## 🎯 What Copilot Knows About Your Project

From `.github/copilot-instructions.md`, Copilot understands:

### Tech Stack
- Next.js 14+ with App Router
- TypeScript with strict mode
- Supabase for backend
- Tailwind CSS for styling
- React Query for data fetching

### Coding Standards
- Functional React components
- Server components by default
- Proper TypeScript types
- Error handling patterns
- Security best practices

### Project Structure
- `/src/app` - Next.js pages
- `/src/components` - React components
- `/src/lib` - Utilities and services
- `/supabase` - Database and Edge Functions

### Key Patterns
- Supabase client setup
- React Query usage
- Error handling
- Authentication flow
- Real-time subscriptions

## 📚 Documentation Reference

Copilot knows about these documentation files:

| File | Purpose |
|------|---------|
| `GETTING_STARTED.md` | Complete setup guide |
| `ARCHITECTURE.md` | System architecture |
| `DATABASE_SCHEMA.md` | Database schema and RLS |
| `AUTHENTICATION.md` | Auth implementation |
| `REALTIME_UPDATES.md` | Real-time features |
| `ICAL_INTEGRATION.md` | Booking synchronization |
| `MOBILE_MESSAGE_SMS.md` | SMS notifications |
| `NEXTJS_FRONTEND.md` | Frontend development |
| `VERCEL_DEPLOYMENT.md` | Deployment guide |
| `SECURITY_BEST_PRACTICES.md` | Security measures |

## 🔍 Next Steps

1. **Read the Instructions**: Review `.github/copilot-instructions.md`
2. **Set Up Environment**: Follow `GETTING_STARTED.md`
3. **Configure Secrets**: Add required secrets to GitHub
4. **Start Coding**: Use Copilot with the prompts above
5. **Create PRs**: Use the PR template for changes

## ❓ Need Help?

- **For Copilot Usage**: See `.github/README.md`
- **For Project Setup**: See `GETTING_STARTED.md`
- **For Technical Details**: See relevant documentation file
- **For Issues**: Use the bug report template

## 🎉 You're Ready!

Everything is configured for AI-driven development. Start by asking Copilot to:

1. "Set up the initial Next.js project structure as documented"
2. "Create the Supabase client configuration"
3. "Implement the authentication UI components"
4. "Create the task management features"

Remember: Copilot generates code following your project's standards automatically!

---

**Last Updated**: 2025-11-07  
**Instructions Version**: 1.0  
**For**: Non-technical founders using AI tools
