# Branch Management Setup Instructions

This document provides step-by-step instructions for repository administrators to complete the branch management setup.

## ✅ What's Already Done (Automated)

The following has been implemented and is ready to use:

1. **Comprehensive Documentation**
   - ✅ Branch Management Strategy (`.github/BRANCH_MANAGEMENT.md`)
   - ✅ Branch Protection Rules Guide (`.github/branch-protection-rules.md`)
   - ✅ Quick Reference Guide (`.github/QUICK_REFERENCE.md`)
   - ✅ Workflow Documentation (`.github/workflows/README.md`)

2. **Automated Workflows**
   - ✅ Branch cleanup after PR merge
   - ✅ Weekly stale branch reporting
   - ✅ Dependabot auto-merge for safe updates
   - ✅ Workflow run cleanup

3. **Enhanced Configurations**
   - ✅ Improved Dependabot grouping and scheduling
   - ✅ TypeScript configuration fix
   - ✅ Updated development documentation

## 🔧 Required Manual Configuration (30 minutes)

These steps require repository admin access and must be completed in GitHub settings.

### Step 1: Enable Branch Protection for Main (10 min)

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings/branches**

2. Click **"Add rule"** or edit existing rule

3. Branch name pattern: `main`

4. Enable the following settings:

   **Require a pull request before merging:**
   - ✅ Require a pull request before merging
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed

   **Require status checks to pass before merging:**
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   
   Select these status checks (they'll appear after first CI run):
   - ✅ Lint and Type Check
   - ✅ Run Tests
   - ✅ Build Application
   - ✅ Security Scan

   **Other protections:**
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history (recommended)
   - ✅ Do not allow bypassing the above settings (keep checked)
   - ✅ Do not allow force pushes (keep checked)
   - ✅ Do not allow deletions (keep checked)

5. Click **"Create"** or **"Save changes"**

**Note:** Status checks won't appear in the list until they've run at least once. You can add them after the next push triggers CI.

### Step 2: Configure Automatic Branch Deletion (2 min)

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings**

2. Scroll to **"Pull Requests"** section

3. Enable:
   - ✅ **Automatically delete head branches**

4. Click **"Save"**

This ensures branches are deleted immediately after PR merge.

### Step 3: Configure GitHub Actions Permissions (5 min)

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings/actions**

2. Under **"Workflow permissions"**, select:
   - ⚙️ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

3. Click **"Save"**

This allows workflows to auto-merge Dependabot PRs and delete branches.

### Step 4: Enable Dependabot (5 min)

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings/security_analysis**

2. Enable all of these:
   - ✅ **Dependency graph**
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**
   - ✅ **Dependabot version updates** (should already be enabled)

3. Dependabot is already configured via `.github/dependabot.yml`

### Step 5: Add Required Repository Secrets (5 min)

For CI/CD workflows to function fully, add these secrets:

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings/secrets/actions**

2. Add the following secrets (if not already present):

   **Supabase:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for migrations)

   **Vercel (for deployment):**
   - `VERCEL_TOKEN` - Vercel authentication token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

   **Snyk (for security scanning - optional):**
   - `SNYK_TOKEN` - Snyk authentication token

**How to get these:**
- Supabase: https://app.supabase.com/project/_/settings/api
- Vercel: https://vercel.com/account/tokens
- Snyk: https://app.snyk.io/account (free tier available)

### Step 6: Verify Setup (3 min)

1. Create a test branch and PR:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/verify-setup
   echo "# Test" >> .github/TEST.md
   git add .
   git commit -m "test: verify branch protection"
   git push origin test/verify-setup
   ```

2. Create PR via GitHub web interface

3. Verify:
   - ✅ CI checks run automatically
   - ✅ Cannot merge without approval
   - ✅ Status checks appear as required
   - ✅ Branch is deleted after merge

4. Clean up test:
   ```bash
   git checkout main
   git pull origin main
   git branch -d test/verify-setup
   ```

## 📋 Optional Configuration

These are optional enhancements you can enable later.

### Option 1: Enable Auto-Delete for Very Old Branches

By default, stale branches (30+ days) are only reported, not deleted.

To enable auto-deletion of branches older than 60 days:

1. Navigate to: **https://github.com/SlySlayer32/Cleanbuz/settings/variables/actions**

2. Click **"New repository variable"**

3. Name: `AUTO_DELETE_STALE_BRANCHES`
   Value: `true`

4. Click **"Add variable"**

**Caution:** This will automatically delete branches with no activity for 60+ days.

### Option 2: Require Signed Commits

For enhanced security (recommended for production):

1. All team members set up GPG keys
2. Configure Git to sign commits:
   ```bash
   git config --global commit.gpgsign true
   git config --global user.signingkey YOUR_GPG_KEY_ID
   ```
3. Enable in branch protection: ✅ Require signed commits

### Option 3: Add CODEOWNERS File

To automatically request reviews from specific people:

1. Create `.github/CODEOWNERS`:
   ```
   # Default owner for everything
   * @SlySlayer32

   # Specific areas
   /docs/ @SlySlayer32
   /.github/ @SlySlayer32
   /supabase/ @SlySlayer32
   ```

2. Enable in branch protection: ✅ Require review from Code Owners

### Option 4: Set Up Branch Protection for Develop

If using a develop branch:

1. Follow Step 1 but use branch name: `develop`
2. Can have slightly less strict rules
3. Useful for team collaboration before merging to main

## 🎯 What Happens Now

Once setup is complete:

### Automatic Actions

**On Every Push/PR:**
- ✅ Linting and type checking
- ✅ Building the application
- ✅ Running tests (when implemented)
- ✅ Security scanning

**On PR Merge:**
- ✅ Branch automatically deleted
- ✅ Changes deployed to Vercel (if main branch)

**Every Monday at 9 AM (Sydney time):**
- ✅ Dependabot checks for updates
- ✅ Creates grouped PRs for dependencies
- ✅ Auto-merges safe updates (patch/minor)

**Every Sunday at Midnight (UTC):**
- ✅ Identifies stale branches
- ✅ Creates cleanup report issue
- ✅ Cleans up old workflow runs
- ✅ Reports branch statistics

**When Dependabot Opens PR:**
- ✅ Workflow analyzes update type
- ✅ Auto-approves safe updates
- ✅ Enables auto-merge if CI passes
- ✅ Flags risky updates for manual review

### Manual Actions Required

**Weekly (5 min):**
- 📋 Review stale branch cleanup issue
- 📋 Delete suggested branches if appropriate
- 📋 Close cleanup issue

**When Dependabot PR Needs Review:**
- 📋 Check changelog for breaking changes
- 📋 Test locally if major update
- 📋 Approve and merge when ready

**Before Merging Any PR:**
- 📋 Ensure all CI checks pass
- 📋 Review code changes
- 📋 Approve the PR
- 📋 Squash and merge (preferred)

## 🐛 Troubleshooting

### Status Checks Not Appearing in Branch Protection

**Problem:** Can't select required status checks

**Solution:**
1. Push a commit to trigger CI workflows
2. Wait for workflows to complete
3. Refresh branch protection settings page
4. Status checks should now appear in dropdown

### Dependabot Auto-Merge Not Working

**Problem:** PRs not auto-merging despite passing checks

**Solutions:**
1. Verify GitHub Actions has "Read and write permissions"
2. Check workflow run logs for errors
3. Ensure PR is from `dependabot[bot]`
4. Verify all CI checks passed
5. Manually approve and merge if needed

### Branch Not Deleting After Merge

**Problem:** Branches remaining after PR merge

**Solutions:**
1. Verify "Automatically delete head branches" is enabled
2. Check branch cleanup workflow ran successfully
3. Manually delete if needed: `git push origin --delete branch-name`

### CI Checks Taking Too Long

**Problem:** Workflows running for 10+ minutes

**Solutions:**
1. Check workflow run logs for stuck jobs
2. Verify npm dependencies are cached
3. Consider splitting workflows for faster feedback
4. Contact GitHub support if persistent

## 📚 Additional Resources

- [Branch Management Guide](./.github/BRANCH_MANAGEMENT.md) - Complete workflow documentation
- [Quick Reference](./.github/QUICK_REFERENCE.md) - Common commands and patterns
- [Workflow README](./.github/workflows/README.md) - CI/CD documentation
- [GitHub Docs: Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Docs: Dependabot](https://docs.github.com/en/code-security/dependabot)

## ✨ Benefits After Setup

**For the Team:**
- 🚀 Faster development with automated checks
- 🛡️ Protection against broken code reaching main
- 🧹 Cleaner repository with automatic cleanup
- 📦 Up-to-date dependencies automatically
- 📖 Clear process documentation

**For the Project:**
- ✅ Consistent code quality
- ✅ Better security (automated scanning)
- ✅ Reduced technical debt
- ✅ Easier onboarding for new developers
- ✅ Professional workflow practices

## 🎉 You're All Set!

Once these steps are complete, your repository will have:
- ✅ Professional branch management workflow
- ✅ Automated dependency updates
- ✅ Continuous integration and deployment
- ✅ Automatic branch cleanup
- ✅ Protection against common mistakes

**Questions?** Review the documentation or open an issue.

---

**Setup Completion Checklist:**
- [ ] Branch protection enabled for main
- [ ] Automatic branch deletion enabled
- [ ] GitHub Actions permissions configured
- [ ] Dependabot fully enabled
- [ ] Required secrets added
- [ ] Setup verified with test PR
- [ ] Team notified of new workflow
- [ ] Documentation reviewed

**Completed By:** _________________  
**Date:** _________________  
**Verified By:** _________________
