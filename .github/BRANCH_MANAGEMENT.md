# Branch Management Strategy

## Overview

This document outlines the branch management strategy for the Cleanbuz project to maintain a clean, organized repository structure and prevent branch accumulation.

## Branch Naming Convention

### Standard Branch Prefixes

- **`main`** - Production-ready code, protected branch
- **`develop`** - Development integration branch (optional, currently not used)
- **`feature/`** - New features (e.g., `feature/task-templates`, `feature/sms-notifications`)
- **`bugfix/`** - Bug fixes (e.g., `bugfix/auth-redirect`, `bugfix/date-formatting`)
- **`hotfix/`** - Urgent production fixes (e.g., `hotfix/security-patch`)
- **`dependabot/`** - Automated dependency updates (managed by Dependabot)
- **`copilot/`** - GitHub Copilot agent branches (managed by Copilot)
- **`refactor/`** - Code refactoring (e.g., `refactor/api-structure`)
- **`docs/`** - Documentation updates (e.g., `docs/api-reference`)
- **`chore/`** - Maintenance tasks (e.g., `chore/update-ci`)

### Branch Naming Guidelines

1. **Use lowercase and hyphens**: `feature/user-authentication` (not `Feature/User_Authentication`)
2. **Be descriptive**: `feature/add-booking-calendar` is better than `feature/calendar`
3. **Keep it concise**: Aim for 2-4 words maximum
4. **Include issue number** (optional): `feature/123-user-profile`

## Branch Lifecycle

### Creating Branches

1. **Always create feature branches from `main`**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Keep branches focused**: One feature or fix per branch

3. **Regular updates**: Rebase or merge from main regularly to avoid conflicts
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-feature-name
   git merge main
   ```

### Working on Branches

1. **Commit frequently** with clear, descriptive messages
2. **Push regularly** to backup work and enable collaboration
3. **Keep commits atomic**: Each commit should represent one logical change
4. **Write meaningful commit messages**: Follow conventional commits format

### Conventional Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat(auth): add phone OTP authentication
fix(tasks): resolve date parsing issue in task list
docs(readme): update installation instructions
chore(deps): update React to v19.2.0
```

### Merging Branches

1. **Create Pull Request** when feature is complete
2. **Wait for CI checks** to pass (lint, type-check, tests, build)
3. **Request code review** from at least one team member
4. **Address review feedback** if any
5. **Merge using "Squash and merge"** for cleaner history (preferred)
6. **Delete branch after merge** (automated via GitHub settings or workflow)

### Deleting Branches

**Automatic Deletion:**
- Configure GitHub to automatically delete branches after PR merge
- Automated cleanup workflow runs weekly to identify stale branches

**Manual Deletion:**
```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Prune deleted remote branches locally
git fetch --prune
```

## Dependabot Configuration

### Automated Dependency Updates

Dependabot is configured to:
- **Run weekly** on Mondays at 9:00 AM
- **Group updates** by type (GitHub Actions, npm production, npm dev)
- **Limit open PRs** to prevent overwhelming the team
- **Auto-merge** patch and minor updates with passing CI (coming soon)

### Handling Dependabot PRs

**Auto-merge eligible (with passing CI):**
- Patch updates (1.2.3 → 1.2.4)
- Minor updates (1.2.3 → 1.3.0) for non-critical packages
- Updates in grouped PRs (dev-dependencies, GitHub Actions)

**Manual review required:**
- Major version updates (1.2.3 → 2.0.0)
- Security updates (always review impact)
- React, Next.js, Supabase core packages
- Breaking changes noted in changelog

**Review process:**
1. Check CI status - all checks must pass
2. Review changelog for breaking changes
3. Test locally if significant changes
4. Approve and merge, or request changes

## Pull Request Workflow

### Creating a Pull Request

1. **Use the PR template** (`.github/pull_request_template.md`)
2. **Provide clear description** of changes
3. **Link related issues** using "Closes #123" or "Fixes #456"
4. **Add screenshots** for UI changes
5. **Request reviewers** (at least one required for main branch)

### PR Review Checklist

**Code Quality:**
- [ ] Follows project coding standards
- [ ] TypeScript types properly defined
- [ ] No console.logs or debug code
- [ ] Error handling implemented
- [ ] Code is well-documented where needed

**Testing:**
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (when implemented)

**Security:**
- [ ] No secrets or credentials committed
- [ ] Input validation implemented
- [ ] RLS policies maintained (for database changes)
- [ ] Authentication/authorization checked

**Documentation:**
- [ ] README updated if needed
- [ ] API documentation updated if needed
- [ ] Code comments added for complex logic

### Merge Strategies

**Squash and Merge (Recommended):**
- Combines all commits into one
- Keeps main branch history clean
- Use for feature branches with many small commits

**Rebase and Merge:**
- Applies commits individually on top of main
- Keeps commit history linear
- Use for well-organized commits

**Merge Commit:**
- Preserves all commits and merge history
- Use rarely, only for significant integrations

## Branch Protection Rules

### Main Branch Protection

The `main` branch is protected with the following rules:

1. **Require pull request before merging**
   - At least 1 approval required
   - Dismiss stale approvals on new commits

2. **Require status checks to pass**
   - Lint and Type Check
   - Run Tests
   - Build Application
   - Security Scan

3. **Require branches to be up to date**
   - Ensures no conflicts with main

4. **No force pushes**
   - Prevents history rewriting on main

5. **No deletions**
   - Main branch cannot be deleted

6. **Require linear history** (optional)
   - Enforces rebase or squash merging

See [branch-protection-rules.md](./branch-protection-rules.md) for GitHub configuration details.

## Branch Cleanup Schedule

### Automated Cleanup (Weekly)

Every Sunday at 00:00 UTC, the branch cleanup workflow runs:

1. **Identifies stale branches**:
   - No commits in 30+ days
   - No open PRs
   - Not protected (main)

2. **Creates GitHub issue** listing stale branches for review

3. **Suggests branches for deletion** with context

### Manual Cleanup (Monthly)

Repository maintainers should:

1. **Review branch list** in GitHub
2. **Check for merged PRs** with undeleted branches
3. **Delete personal/test branches** that are no longer needed
4. **Update this document** if processes change

### Preventing Branch Accumulation

1. **Enable auto-delete** in GitHub repo settings
2. **Delete branch immediately** after PR merge
3. **Close stale PRs** (no activity for 60+ days)
4. **Regular audits** using the branch cleanup workflow

## Copilot Branch Management

### GitHub Copilot Branches

Copilot automatically creates branches with format: `copilot/<random-name>`

**Workflow:**
1. Copilot creates branch and opens PR
2. Review Copilot's changes thoroughly
3. Test changes locally
4. Merge if acceptable, request revisions if not
5. Branch is auto-deleted after merge

**Guidelines:**
- Always review Copilot PRs before merging
- Run CI checks (lint, type-check, build)
- Test changes manually when appropriate
- Provide clear feedback if requesting changes

## Best Practices

### Do's ✅

- ✅ Create branches from up-to-date main
- ✅ Keep branches short-lived (< 2 weeks)
- ✅ Push commits regularly
- ✅ Write descriptive commit messages
- ✅ Delete branches after merging
- ✅ Rebase/merge from main regularly
- ✅ Request reviews early for feedback
- ✅ Keep PRs focused and small

### Don'ts ❌

- ❌ Commit directly to main
- ❌ Force push to shared branches
- ❌ Create long-lived feature branches
- ❌ Merge without CI passing
- ❌ Merge without code review
- ❌ Leave merged branches around
- ❌ Create branches with unclear names
- ❌ Mix unrelated changes in one PR

## Troubleshooting

### My branch is behind main

```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
# Resolve conflicts if any
git push origin your-branch
```

### I need to undo a commit

```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes (careful!)
git reset --hard HEAD~1
```

### I accidentally committed to main

```bash
# Create branch with current changes
git branch feature/my-changes

# Reset main to origin
git reset --hard origin/main

# Switch to new branch
git checkout feature/my-changes
```

### Branch cleanup workflow isn't running

1. Check GitHub Actions permissions
2. Verify workflow file syntax
3. Check if workflow is enabled in repo settings
4. Review workflow run logs for errors

## Monitoring and Metrics

Track these metrics to maintain repository health:

- **Open PR age**: Target < 7 days
- **Number of open branches**: Target < 10
- **Stale branches** (30+ days): Target = 0
- **Failed CI runs**: Investigate and fix quickly
- **Time to merge**: Target < 48 hours for small PRs

## Updates to This Document

This branch management strategy should be reviewed and updated:

- **Quarterly**: Review effectiveness and update practices
- **When adding new workflows**: Document integration
- **When team grows**: Adjust review requirements
- **When problems arise**: Update guidelines to prevent recurrence

---

**Last Updated**: November 2025  
**Owner**: Repository Maintainers  
**Questions?** Open an issue or contact repository admin
