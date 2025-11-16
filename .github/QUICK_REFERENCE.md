# Branch Management Quick Reference

Quick reference guide for common branch management tasks in the Cleanbuz project.

## Quick Links

- 📚 [Full Branch Management Guide](./BRANCH_MANAGEMENT.md)
- 🔒 [Branch Protection Setup](./branch-protection-rules.md)
- 🤖 [Workflow Documentation](./workflows/README.md)

## Common Commands

### Creating a New Branch

```bash
# Start a new feature
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Start a bugfix
git checkout -b bugfix/issue-description

# Start a hotfix
git checkout -b hotfix/critical-fix
```

### Committing Changes

```bash
# Stage and commit with conventional commit message
git add .
git commit -m "feat(auth): add phone OTP authentication"

# Common prefixes: feat, fix, docs, style, refactor, test, chore
```

### Before Creating PR

```bash
# Run all quality checks
npm run lint
npm run type-check
npm run format:check
npm run build

# If format check fails, auto-fix:
npm run format
```

### Updating Your Branch

```bash
# Merge latest main into your branch
git checkout main
git pull origin main
git checkout your-branch
git merge main

# Or rebase (cleaner history)
git rebase main
```

### Deleting Branches

```bash
# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Clean up deleted remote branches
git fetch --prune
```

## Conventional Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or updating tests
- `chore` - Maintenance (dependencies, configs, etc.)
- `perf` - Performance improvement
- `ci` - CI/CD changes

### Examples
```bash
git commit -m "feat(tasks): add task filtering by status"
git commit -m "fix(auth): resolve redirect loop after login"
git commit -m "docs(readme): update installation instructions"
git commit -m "chore(deps): update React to v19.2.0"
git commit -m "refactor(api): simplify error handling"
```

## Branch Naming

### Format
```
<type>/<description>
```

### Examples
```bash
feature/user-authentication
feature/add-booking-calendar
bugfix/auth-redirect-loop
bugfix/date-formatting-issue
hotfix/security-vulnerability
refactor/api-error-handling
docs/update-setup-guide
chore/update-dependencies
```

### Guidelines
- Use lowercase letters
- Separate words with hyphens
- Be descriptive but concise
- Include issue number optionally: `feature/123-user-profile`

## Pull Request Checklist

Before creating a PR, ensure:

- [ ] Code follows project style
- [ ] All tests pass (when implemented)
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Code is formatted: `npm run format`
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] Documentation updated if needed
- [ ] No console.logs or debug code
- [ ] Environment variables not exposed

## PR Review Process

1. **Create PR** using the template
2. **Link issues** (e.g., "Closes #123")
3. **Add reviewers** (at least 1 required)
4. **Wait for CI** - all checks must pass
5. **Address feedback** if requested
6. **Merge** - branch auto-deletes

### Merge Methods
- **Squash and merge** (preferred) - Clean history
- **Rebase and merge** - Linear history with all commits
- **Merge commit** - Preserves full history (rarely used)

## Dependabot PRs

### Auto-Merged (with passing CI)
- ✅ Patch updates (1.2.3 → 1.2.4)
- ✅ Minor updates (1.2.3 → 1.3.0) for most packages
- ✅ Dev dependencies
- ✅ GitHub Actions updates

### Requires Review
- ⚠️ Major updates (1.x.x → 2.x.x)
- ⚠️ React, Next.js updates
- ⚠️ Supabase client updates
- ⚠️ Breaking changes

### Handling Dependabot PRs
1. Check CI status
2. Review changelog for breaking changes
3. If safe, approve or wait for auto-merge
4. If unsure, test locally:
   ```bash
   gh pr checkout PR_NUMBER
   npm install
   npm run build
   npm test
   ```

## Stale Branches

Branches are considered stale if:
- No commits for 30+ days
- No open pull requests
- Not protected (main/develop)

### Weekly Report
- Automated issue created every Sunday
- Lists all stale branches
- Suggests cleanup actions

### Cleanup Process
1. Review weekly stale branch issue
2. Verify branches are no longer needed
3. Delete manually or wait for auto-delete (60+ days)
4. Close the issue when done

## Troubleshooting

### "Branch is out of date"
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
git push origin your-branch
```

### "CI checks failed"
```bash
# Run checks locally
npm run lint
npm run type-check
npm run build

# Fix errors and push
git add .
git commit -m "fix: resolve linting errors"
git push
```

### "Merge conflicts"
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
# Resolve conflicts in editor
git add .
git commit -m "merge: resolve conflicts with main"
git push
```

### "Accidentally committed to main"
```bash
# Create branch with changes
git branch feature/my-changes

# Reset main to origin
git reset --hard origin/main

# Switch to new branch
git checkout feature/my-changes
```

## Getting Help

### Resources
- [Branch Management Guide](./BRANCH_MANAGEMENT.md) - Complete documentation
- [Branch Protection Rules](./branch-protection-rules.md) - GitHub setup
- [Workflow README](./workflows/README.md) - CI/CD documentation
- [Development Guide](../docs/DEVELOPMENT.md) - Development workflow

### Common Questions

**Q: How long should my branch live?**
A: Keep branches short-lived (< 2 weeks). Merge early and often.

**Q: Should I rebase or merge?**
A: Both are acceptable. Rebase for cleaner history, merge for safety.

**Q: Can I commit directly to main?**
A: No. All changes require a pull request with review.

**Q: What if CI is taking too long?**
A: CI should complete in 3-5 minutes. If stuck, check workflow logs.

**Q: Do I need to delete branches manually?**
A: No. Branches are auto-deleted after PR merge. Very old branches (60+ days) are auto-deleted weekly.

**Q: How do I handle Dependabot PRs?**
A: Most are auto-merged. Review ones flagged with "requires-review" label.

**Q: What if I break something?**
A: Don't panic! CI prevents broken code from reaching main. Fix and push again.

## Best Practices Summary

### Do ✅
- ✅ Branch from main
- ✅ Commit frequently
- ✅ Use conventional commits
- ✅ Run checks before pushing
- ✅ Keep PRs small and focused
- ✅ Request reviews early
- ✅ Merge regularly
- ✅ Delete merged branches

### Don't ❌
- ❌ Commit directly to main
- ❌ Force push to shared branches
- ❌ Ignore CI failures
- ❌ Merge without review
- ❌ Leave branches around
- ❌ Mix unrelated changes
- ❌ Commit secrets
- ❌ Skip quality checks

## Keyboard Shortcuts

### GitHub Web
- `t` - File finder
- `l` - Jump to line
- `w` - Switch branch
- `gc` - Create commit
- `.` - Open in github.dev

### GitHub CLI
```bash
# View PRs
gh pr list

# Create PR
gh pr create

# Checkout PR
gh pr checkout NUMBER

# View PR status
gh pr status

# Merge PR
gh pr merge NUMBER --squash
```

---

**Need Help?** Contact the team or open an issue.

**Last Updated:** November 2025
