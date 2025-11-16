# Branch Protection Rules Configuration

## Overview

This document provides step-by-step instructions for configuring branch protection rules in GitHub to enforce code quality, security, and collaboration standards for the Cleanbuz repository.

## Prerequisites

- Repository admin access required
- GitHub Pro, Team, or Enterprise account (for some features)
- CI/CD workflows configured (`.github/workflows/ci.yml`)

## Main Branch Protection

### Accessing Branch Protection Settings

1. Navigate to repository: `https://github.com/SlySlayer32/Cleanbuz`
2. Click **Settings** → **Branches** (left sidebar)
3. Under "Branch protection rules", click **Add rule** or edit existing rule
4. Enter branch name pattern: `main`

### Required Settings

#### 1. Require Pull Request Reviews Before Merging

**Configuration:**
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: Set to **1** (minimum)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (optional, requires CODEOWNERS file)
- ⬜ **Restrict who can dismiss pull request reviews** (optional, for large teams)
- ⬜ **Allow specified actors to bypass required pull requests** (not recommended)

**Why?**
- Ensures code review before merging
- Catches bugs and security issues early
- Promotes knowledge sharing
- Maintains code quality standards

#### 2. Require Status Checks to Pass Before Merging

**Configuration:**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required Status Checks** (select all that apply):
- ✅ `Lint and Type Check` - Ensures code quality
- ✅ `Run Tests` - Verifies functionality
- ✅ `Build Application` - Confirms app builds successfully
- ✅ `Security Scan` - Checks for vulnerabilities

**Why?**
- Prevents broken code from reaching main
- Ensures all CI checks pass
- Maintains build stability
- Reduces conflicts

**Note:** Status checks must have run at least once for them to appear in the selection list. Push a commit to trigger CI workflows if they don't appear.

#### 3. Require Conversation Resolution Before Merging

**Configuration:**
- ✅ **Require conversation resolution before merging**

**Why?**
- Ensures all review comments are addressed
- Prevents accidental merges with unresolved issues

#### 4. Require Signed Commits

**Configuration:**
- ⬜ **Require signed commits** (optional, recommended for security-critical projects)

**Why?**
- Verifies commit author identity
- Prevents commit spoofing
- Enhances security audit trail

**To enable:**
1. Set up GPG key for each team member
2. Configure Git to sign commits: `git config --global commit.gpgsign true`
3. Enable this protection rule

#### 5. Require Linear History

**Configuration:**
- ✅ **Require linear history** (recommended)

**Why?**
- Enforces clean commit history
- Requires squash or rebase merging
- Makes history easier to understand
- Simplifies rollbacks

#### 6. Include Administrators

**Configuration:**
- ⬜ **Include administrators** (recommended for consistency)

**Why?**
- Ensures even admins follow the process
- Maintains code quality standards for all
- Sets good example for team

**When to disable:**
- Emergency hotfixes requiring immediate deployment
- Repository maintenance tasks

#### 7. Restrict Who Can Push to Matching Branches

**Configuration:**
- ✅ **Restrict pushes that create matching branches** (optional)
- **Allowed actors**: Empty (no direct pushes)

**Why?**
- Prevents direct pushes to main
- Forces all changes through PR process
- Maintains audit trail

#### 8. Do Not Allow Force Pushes

**Configuration:**
- ✅ **Do not allow force pushes** (enabled by default, keep enabled)

**Why?**
- Prevents history rewriting
- Protects against accidental data loss
- Maintains commit integrity

#### 9. Do Not Allow Deletions

**Configuration:**
- ✅ **Do not allow deletions** (enabled by default, keep enabled)

**Why?**
- Prevents accidental branch deletion
- Protects production code

### Summary Configuration for Main Branch

```yaml
Branch: main

Protection Rules:
  ✅ Require pull request with 1 approval
  ✅ Dismiss stale approvals on new commits
  ✅ Require status checks to pass:
      - Lint and Type Check
      - Run Tests
      - Build Application
      - Security Scan
  ✅ Require branches to be up to date
  ✅ Require conversation resolution
  ✅ Require linear history
  ✅ Restrict pushes (no direct commits)
  ✅ Do not allow force pushes
  ✅ Do not allow deletions
  ⬜ Include administrators (recommended)
  ⬜ Require signed commits (optional)
```

## Dependabot Auto-Merge Configuration

### Prerequisites

1. Branch protection rules configured (above)
2. Dependabot enabled in repository
3. GitHub Actions workflow for auto-merge

### Enabling Dependabot Auto-Merge

**Option 1: Using GitHub CLI**
```bash
# Enable auto-merge for specific PR
gh pr merge PR_NUMBER --auto --squash

# Or configure in Dependabot settings
```

**Option 2: Using GitHub Actions Workflow**

Create `.github/workflows/dependabot-auto-merge.yml`:

```yaml
name: Dependabot Auto-Merge
on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
      
      - name: Enable auto-merge for patch and minor updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch' || steps.metadata.outputs.update-type == 'version-update:semver-minor'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Option 3: Using Dependabot Configuration**

In `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

Then use GitHub's auto-merge feature:
1. Go to Dependabot PR
2. Click **Enable auto-merge** button
3. Select **Squash and merge**
4. PR will merge automatically when CI passes

### Auto-Merge Criteria

**Safe for auto-merge:**
- ✅ Patch updates (1.2.3 → 1.2.4)
- ✅ Minor updates (1.2.3 → 1.3.0) for dev dependencies
- ✅ GitHub Actions updates (actions/checkout@v4 → v5)
- ✅ All CI checks passing
- ✅ No merge conflicts

**Requires manual review:**
- ⚠️ Major updates (1.x.x → 2.x.x)
- ⚠️ Security updates (review impact)
- ⚠️ React, Next.js core framework updates
- ⚠️ Supabase client updates
- ⚠️ Breaking changes in changelog

### Monitoring Auto-Merge

**Weekly Review:**
1. Check merged Dependabot PRs
2. Verify no issues introduced
3. Monitor production for errors
4. Adjust auto-merge rules if needed

**Metrics to Track:**
- Number of auto-merged PRs per week
- Failed auto-merge attempts
- Time saved on dependency management
- Issues caused by auto-merged updates

## Additional Protection Rules (Optional)

### Develop Branch (If Used)

If using a `develop` branch for integration:

```yaml
Branch: develop

Protection Rules:
  ✅ Require pull request with 1 approval
  ✅ Require status checks to pass
  ✅ Require branches to be up to date
  ⬜ Require linear history (optional)
  ✅ Do not allow force pushes
  ⬜ Include administrators (optional)
```

### Release Branches

For release branches (`release/*`):

```yaml
Branch Pattern: release/*

Protection Rules:
  ✅ Require pull request with 2 approvals (stricter)
  ✅ Require status checks to pass
  ✅ Require conversation resolution
  ✅ Require signed commits (recommended)
  ✅ Do not allow force pushes
  ✅ Do not allow deletions
  ✅ Include administrators
```

### Hotfix Branches

For hotfix branches (`hotfix/*`):

```yaml
Branch Pattern: hotfix/*

Protection Rules:
  ⬜ Less strict rules for emergency fixes
  ✅ Require status checks to pass (minimum)
  ⬜ Require 1 approval (can be bypassed in emergency)
```

## Repository Settings

### Additional Settings to Configure

**Settings → General → Pull Requests**
- ✅ **Automatically delete head branches** - Cleans up after merge
- ✅ **Allow squash merging** - Preferred merge method
- ✅ **Allow rebase merging** - Alternative for clean history
- ⬜ **Allow merge commits** - Disable if requiring linear history

**Settings → Security → Code Security and Analysis**
- ✅ **Dependency graph** - Track dependencies
- ✅ **Dependabot alerts** - Security vulnerability notifications
- ✅ **Dependabot security updates** - Auto-fix vulnerabilities
- ✅ **Dependabot version updates** - Keep dependencies current
- ✅ **Secret scanning** - Prevent credential leaks

**Settings → Actions → General**
- ✅ **Allow all actions and reusable workflows**
- ✅ **Read and write permissions** for GITHUB_TOKEN
- ✅ **Allow GitHub Actions to create and approve pull requests**

## Verification Checklist

After configuring branch protection:

- [ ] Create test branch and PR to verify rules
- [ ] Confirm CI checks are required
- [ ] Test that direct push to main is blocked
- [ ] Verify PR approval requirement
- [ ] Test auto-merge with Dependabot PR
- [ ] Confirm branch auto-deletion after merge
- [ ] Document any custom configurations

## Troubleshooting

### Status Checks Not Appearing

**Problem:** Required status checks don't appear in the selection list.

**Solution:**
1. Push a commit to trigger CI workflows
2. Wait for workflows to complete
3. Refresh branch protection settings page
4. Status checks should now appear

### Can't Merge PR Despite Passing Checks

**Problem:** All checks pass but merge button is disabled.

**Possible causes:**
- Branch not up to date with main (rebase or merge main)
- Review approval missing
- Conversation threads not resolved
- Administrator protection enabled

### Dependabot Auto-Merge Not Working

**Problem:** Auto-merge doesn't trigger for Dependabot PRs.

**Solution:**
1. Verify GitHub Actions workflow exists
2. Check workflow has correct permissions
3. Confirm Dependabot PRs are labeled correctly
4. Review workflow run logs for errors
5. Manually enable auto-merge if needed

### Too Strict for Small Team

**Problem:** Protection rules slow down development for small team.

**Solution:**
- Reduce required approvals to 1
- Don't include administrators in protection
- Allow self-review for non-critical changes
- Use auto-merge more aggressively
- Create hotfix bypass process

## Maintenance

**Quarterly Review:**
- Review protection rules effectiveness
- Adjust based on team size and workflow
- Update required status checks as CI evolves
- Gather team feedback on pain points

**When Team Grows:**
- Increase required approvals (1 → 2)
- Add Code Owners for specific areas
- Restrict merge permissions more strictly
- Add more granular protection rules

**When Problems Arise:**
- Document issues and solutions
- Update protection rules to prevent recurrence
- Train team on proper workflow
- Automate manual processes

## Resources

- [GitHub Docs: Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Docs: Dependabot](https://docs.github.com/en/code-security/dependabot)
- [GitHub Docs: Auto-merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
- [Branch Management Guide](.github/BRANCH_MANAGEMENT.md)

---

**Last Updated**: November 2025  
**Owner**: Repository Administrators  
**Questions?** Contact repository admin or open an issue
