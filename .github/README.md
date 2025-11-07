# GitHub Configuration Directory

This directory contains configuration files for GitHub features and GitHub Copilot AI assistance.

## Files Overview

### AI Instructions
- **`copilot-instructions.md`**: Comprehensive AI-readable instructions for GitHub Copilot
  - Project overview and tech stack
  - Coding guidelines and best practices
  - Architecture patterns and common solutions
  - Security requirements
  - Testing strategies
  - Reference to all documentation files

### Workflow Files (`workflows/`)
Automated CI/CD pipelines for the project:

- **`ci.yml`**: Main CI/CD pipeline
  - Linting and type checking
  - Running tests with coverage
  - Building application
  - Security scanning
  - Deployment to Vercel

- **`supabase-migrations.yml`**: Database migration workflow
  - Deploys Supabase database migrations
  - Generates TypeScript types
  - Verifies migration success

### Dependency Management
- **`dependabot.yml`**: Automated dependency updates
  - Weekly npm package updates
  - GitHub Actions version updates
  - Grouped updates for related packages
  - Security vulnerability patches

### Templates
- **`pull_request_template.md`**: Standard PR template with comprehensive checklist
- **`ISSUE_TEMPLATE/bug_report.md`**: Structured bug report template
- **`ISSUE_TEMPLATE/feature_request.md`**: Feature request template with use cases

## Using GitHub Copilot with This Repository

### For Non-Technical Users
GitHub Copilot and other AI coding assistants will automatically read the `copilot-instructions.md` file to understand:
- What technology stack to use
- How to write code that matches project standards
- Where to find detailed documentation
- What patterns and practices to follow

### Key Benefits
1. **Consistency**: AI generates code that matches existing patterns
2. **Quality**: Follows security and best practices automatically
3. **Documentation**: References comprehensive docs in repository
4. **Standards**: Adheres to TypeScript, React, and Next.js conventions

### How It Works
When you ask Copilot to generate code:
1. It reads `copilot-instructions.md` for project context
2. It follows the coding guidelines specified
3. It uses the documented patterns and solutions
4. It references the detailed documentation files for implementation details

### Example Prompts for Copilot

**Creating a Component:**
```
Create a new task card component that displays task name, status, 
priority, and assigned team member. Follow the project patterns.
```

**Adding an API Route:**
```
Create an API route to fetch all tasks for a property with proper 
authentication, validation, and error handling.
```

**Database Operations:**
```
Create a function to fetch bookings from Supabase with RLS policies, 
include error handling and TypeScript types.
```

**Implementing a Feature:**
```
Implement the phone OTP authentication flow using Mobile Message SMS 
as documented in AUTHENTICATION.md
```

## Workflow Secrets Required

To enable the workflows, configure these secrets in GitHub Settings:

### Vercel Deployment
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Supabase
- `SUPABASE_ACCESS_TOKEN`: Supabase access token
- `SUPABASE_PROJECT_REF`: Your Supabase project reference ID
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase anonymous key

### Optional Security Scanning
- `SNYK_TOKEN`: Snyk security scanning token

### Setting Up Secrets
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value
4. Workflows will automatically use these secrets

## Continuous Integration

### What Gets Checked
Every pull request is automatically:
1. **Linted** - Code style and formatting checked
2. **Type-checked** - TypeScript types validated
3. **Tested** - Unit and integration tests run
4. **Built** - Application build verified
5. **Scanned** - Security vulnerabilities detected

### Status Checks
All checks must pass before merging to main branch:
- ✅ Lint and Type Check
- ✅ Tests Pass
- ✅ Build Successful
- ✅ Security Scan

## Automated Deployments

### Main Branch
- Automatic deployment to production on merge to `main`
- Runs full test suite before deployment
- Deploys to Vercel with production configuration

### Pull Requests
- Creates preview deployment for each PR
- Allows testing changes before merge
- Automatic cleanup when PR is closed

## Dependency Updates

Dependabot automatically:
- Checks for updates weekly (Mondays at 9:00 AM)
- Creates PRs for security updates immediately
- Groups related package updates together
- Limits open PRs to avoid noise

### Review Process
1. Dependabot creates PR with changes
2. CI/CD runs automatically
3. Review changelog and breaking changes
4. Merge if all checks pass

## Best Practices

### For AI-Generated Code
1. Always review AI-generated code before committing
2. Ensure tests are included
3. Verify security considerations
4. Check against project standards
5. Test thoroughly in development environment

### For Pull Requests
1. Fill out the PR template completely
2. Ensure all checklist items are addressed
3. Add screenshots for UI changes
4. Link related issues
5. Request reviews from team members

### For Issues
1. Use appropriate template (bug/feature)
2. Provide complete information
3. Search for existing issues first
4. Include reproduction steps for bugs
5. Explain use cases for features

## Documentation References

All comprehensive documentation is in the repository root:
- `GETTING_STARTED.md` - Setup guide
- `ARCHITECTURE.md` - System architecture
- `DATABASE_SCHEMA.md` - Database schema
- `AUTHENTICATION.md` - Auth implementation
- `NEXTJS_FRONTEND.md` - Frontend guide
- And more...

## Support

For questions about:
- **GitHub Copilot**: See `copilot-instructions.md`
- **Workflows**: Check workflow files in `workflows/`
- **Project setup**: See root `GETTING_STARTED.md`
- **Technical details**: See relevant documentation in root

---

**Note**: This directory is specifically designed to help AI coding assistants understand and work with this repository effectively. All instructions are written to be 100% AI-readable and actionable without human intervention.
