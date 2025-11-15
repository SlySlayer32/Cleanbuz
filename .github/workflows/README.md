# GitHub Actions Workflows

This directory contains automated workflows for continuous integration, deployment, and repository maintenance.

## Active Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Lint and Type Check**: Ensures code quality with ESLint and TypeScript
- **Run Tests**: Executes test suite (when implemented)
- **Build Application**: Verifies Next.js builds successfully
- **Security Scan**: Checks for vulnerabilities with npm audit and Snyk
- **Deploy to Vercel**: Deploys to production on main branch pushes

**Status Checks Required:** Yes (for branch protection)

**Configuration:**
- Node.js version: 20
- Uses npm cache for faster builds
- Uploads build artifacts for debugging
- Sends test coverage to Codecov

---

### 2. Branch Cleanup (`branch-cleanup.yml`)

**Triggers:**
- Weekly schedule: Sundays at 00:00 UTC
- Manual trigger: via workflow_dispatch
- Automatic: When pull requests are closed

**Jobs:**

#### Delete Merged Branch
- Automatically deletes branch after PR is merged
- Skips protected branches (main, develop, master)
- Runs immediately when PR closes

#### Identify Stale Branches
- Finds branches with no activity for 30+ days
- Excludes branches with open PRs
- Creates/updates GitHub issue with cleanup report
- Lists branch name, last commit date, and author

#### Auto-Delete Stale Branches (Optional)
- Only deletes branches older than 60 days
- Requires `AUTO_DELETE_STALE_BRANCHES=true` repository variable
- Additional protection checks before deletion
- Logs all deletion actions

#### Cleanup Workflow Runs
- Removes completed workflow runs older than 90 days
- Keeps recent history for debugging
- Frees up repository storage

#### Branch Statistics
- Generates weekly report of branch health
- Counts branches by type (feature, dependabot, copilot)
- Warns if branch count exceeds 20
- Tracks open PR count

**Manual Configuration:**
```bash
# Enable auto-delete for very old branches (optional)
gh variable set AUTO_DELETE_STALE_BRANCHES --body "true"
```

---

### 3. Dependabot Auto-Merge (`dependabot-auto-merge.yml`)

**Triggers:**
- Pull requests opened by Dependabot
- PR updates (synchronize, reopened)

**Auto-Merge Criteria:**

✅ **Safe for Auto-Merge** (with passing CI):
- Patch updates (1.2.3 → 1.2.4)
- Minor updates (1.2.3 → 1.3.0) for non-critical packages
- Dev dependency updates (@types/*, eslint, prettier)
- GitHub Actions updates

⚠️ **Requires Manual Review**:
- Major version updates (1.x.x → 2.x.x)
- React, Next.js, or Supabase updates
- Any updates failing CI checks

**Workflow Steps:**
1. Fetches Dependabot metadata
2. Waits for CI checks to complete (max 10 minutes)
3. Determines if update is safe for auto-merge
4. Approves PR if criteria met
5. Enables auto-merge with squash
6. Adds appropriate labels and comments

**Labels Added:**
- `auto-merge-enabled` - For approved auto-merges
- `requires-review` - For updates needing manual review

---

### 4. Supabase Migrations (`supabase-migrations.yml`)

**Triggers:**
- Push to `main` branch affecting Supabase files

**Purpose:**
- Validates and applies Supabase database migrations
- Ensures database schema stays in sync with code
- Prevents breaking changes to production database

---

## Workflow Permissions

All workflows use minimal required permissions:

```yaml
permissions:
  contents: write        # Push/delete branches, commit changes
  pull-requests: write   # Approve PRs, add labels, comments
  issues: write          # Create cleanup reports
```

## Monitoring Workflows

### View Workflow Runs
```bash
gh workflow list
gh workflow view ci.yml
gh run list --workflow=ci.yml
```

### Manually Trigger Workflows
```bash
# Trigger branch cleanup
gh workflow run branch-cleanup.yml

# View run status
gh run watch
```

### Debug Failed Workflows
```bash
# View logs
gh run view RUN_ID --log

# Re-run failed jobs
gh run rerun RUN_ID --failed
```

## Best Practices

### For CI/CD Pipeline
- ✅ All checks must pass before merging
- ✅ Fix linting errors immediately
- ✅ Don't skip CI checks
- ✅ Review security scan results

### For Branch Cleanup
- ✅ Review stale branch reports weekly
- ✅ Close inactive PRs promptly
- ✅ Delete feature branches after merging
- ✅ Keep branch count under 20

### For Dependabot Auto-Merge
- ✅ Trust the automation for patch/minor updates
- ✅ Review major updates carefully
- ✅ Check changelogs for breaking changes
- ✅ Monitor production after auto-merges

## Troubleshooting

### Workflow Not Running

**Problem:** Workflow doesn't trigger on expected events

**Solutions:**
1. Check workflow syntax: `gh workflow view workflow-name.yml`
2. Verify permissions in Settings → Actions
3. Check if Actions are enabled for the repository
4. Review workflow run history for errors

### CI Checks Failing

**Problem:** Pull request blocked by failing CI checks

**Solutions:**
1. Run checks locally: `npm run lint && npm run type-check && npm run build`
2. View detailed logs in GitHub Actions tab
3. Fix errors and push again
4. Check for conflicting dependencies

### Auto-Merge Not Working

**Problem:** Dependabot PR not auto-merging despite passing checks

**Solutions:**
1. Verify PR is from `dependabot[bot]`
2. Check if update type qualifies for auto-merge
3. Ensure all CI checks passed
4. Review workflow run logs for errors
5. Manually approve and merge if needed

### Stale Branch Report Not Created

**Problem:** Weekly cleanup workflow doesn't create issues

**Solutions:**
1. Check if workflow ran: `gh run list --workflow=branch-cleanup.yml`
2. Verify no stale branches exist (30+ days)
3. Check workflow permissions (needs `issues: write`)
4. Review workflow logs for errors

### Too Many Notification Emails

**Problem:** Receiving excessive workflow notification emails

**Solutions:**
1. Configure notification settings: Settings → Notifications
2. Adjust per-workflow notifications
3. Use GitHub mobile app for quieter notifications
4. Unsubscribe from individual workflow runs

## Maintenance

### Monthly Review
- [ ] Review workflow run success rates
- [ ] Check average CI run duration (target < 5 minutes)
- [ ] Verify auto-merge working correctly
- [ ] Confirm branch cleanup preventing accumulation

### Quarterly Updates
- [ ] Update GitHub Actions versions
- [ ] Review and optimize workflow efficiency
- [ ] Gather team feedback on pain points
- [ ] Update documentation with lessons learned

### Annual Audit
- [ ] Assess overall workflow effectiveness
- [ ] Consider new automation opportunities
- [ ] Review security best practices
- [ ] Update to latest CI/CD patterns

## Adding New Workflows

When adding new workflows:

1. **Create workflow file** in this directory
2. **Follow naming convention**: `kebab-case.yml`
3. **Add documentation** to this README
4. **Test thoroughly** with `workflow_dispatch` trigger
5. **Start with minimal permissions** and expand as needed
6. **Add error handling** and logging
7. **Consider notification impact** on team

**Template:**
```yaml
---
name: Workflow Name

on:
  # Triggers
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  job-name:
    name: Job Display Name
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      # Add steps
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Branch Management Guide](../.github/BRANCH_MANAGEMENT.md)
- [Branch Protection Rules](../.github/branch-protection-rules.md)

---

**Last Updated:** November 2025  
**Maintained By:** Repository Team  
**Questions?** Open an issue or check documentation
