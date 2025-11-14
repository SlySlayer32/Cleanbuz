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

### Branch Management

The project follows a structured branch management strategy to maintain code quality and organization. Feature branches should be created from `main` using descriptive names (e.g., `feature/your-feature-name`), and all changes should be merged via pull requests after code review.

#### Creating a Branch

1. Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

2. Use appropriate branch prefixes:
   - `feature/` - New features
   - `bugfix/` - Bug fixes
   - `hotfix/` - Urgent production fixes
   - `refactor/` - Code refactoring
   - `docs/` - Documentation updates
   - `chore/` - Maintenance tasks

#### Working on Your Branch

1. Make your changes following the code style

2. Commit frequently with clear, descriptive messages:

```bash
git add .
git commit -m "feat(auth): add phone OTP authentication"
```

3. Follow conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Formatting changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance

4. Run quality checks before pushing:

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
```

5. Push your branch regularly:

```bash
git push origin feature/your-feature-name
```

#### Creating a Pull Request

1. Push your branch to GitHub
2. Open a Pull Request to `main`
3. Fill out the PR template completely
4. Link related issues (e.g., "Closes #123")
5. Request reviewers
6. Wait for CI checks to pass
7. Address review feedback if any
8. Merge when approved (branch will be auto-deleted)

#### Keeping Your Branch Updated

Regularly merge or rebase from main to avoid conflicts:

```bash
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main
# Or use rebase for cleaner history:
# git rebase main
```

### Automated Workflows

The project uses several automated workflows:

- **CI/CD Pipeline** - Runs on every push and PR
  - Linting and type checking
  - Running tests
  - Building the application
  - Security scanning

- **Branch Cleanup** - Runs weekly
  - Identifies stale branches (30+ days)
  - Creates cleanup reports
  - Auto-deletes very old branches (60+ days)

- **Dependabot Auto-Merge** - Handles dependency updates
  - Auto-merges patch/minor updates with passing CI
  - Flags major updates for manual review
  - Groups related dependencies

See [.github/workflows/](../.github/workflows/) for workflow configurations.

## Environment Variables

See `.env.example` for required environment variables:

- **Supabase**: Project URL, anon key, service role key
- **Mobile Message**: API key, account ID, sender ID
- **OAuth (optional)**: Google, Apple credentials

## Next Steps

Follow the [TECHNICAL_BUILD_PLAN.md](./TECHNICAL_BUILD_PLAN.md) to implement features in order:

1. **Phase 1**: Project Setup & Infrastructure ✅ (Completed)
2. **Phase 2**: Authentication System
3. **Phase 3**: Core Backend Features
4. **Phase 4**: Third-Party Integrations
5. **Phase 5**: Frontend Development
6. **Phase 6**: Real-time Features
7. **Phase 7**: Progressive Web App
8. **Phase 8**: Testing & QA
9. **Phase 9**: Deployment & DevOps

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
