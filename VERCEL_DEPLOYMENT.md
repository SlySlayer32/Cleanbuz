# Vercel Deployment Guide

## Overview

This guide covers deploying the Cleanbuz Next.js application to Vercel with optimal configuration for performance, scalability, and reliability.

## Prerequisites

- Vercel account (free tier available)
- GitHub repository with Next.js application
- Supabase project configured
- Mobile Message account configured

## Initial Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

## Deployment via Git Integration (Recommended)

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository containing your Next.js app

### 2. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Build & Development Settings:**
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

**Root Directory:** (leave as `.` unless app is in subdirectory)

### 3. Environment Variables

Add the following environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Mobile Message
MOBILE_MESSAGE_API_KEY=your-api-key-here
MOBILE_MESSAGE_ACCOUNT_ID=your-account-id
MOBILE_MESSAGE_SENDER_ID=YourBusiness

# OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Security Note:** Never commit secrets to Git. Always use Vercel's environment variables.

### 4. Deploy

Click "Deploy" - Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your Next.js application
4. Deploy to production URL

## Deployment via CLI

### Quick Deploy

```bash
# Navigate to your project
cd cleanbuz-app

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### With Configuration

```bash
# Link project to Vercel
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add MOBILE_MESSAGE_API_KEY production
vercel env add MOBILE_MESSAGE_ACCOUNT_ID production
vercel env add MOBILE_MESSAGE_SENDER_ID production

# Deploy to production
vercel --prod
```

## Custom Domain Configuration

### 1. Add Custom Domain

```bash
vercel domains add yourdomain.com
```

Or via dashboard:
1. Go to Project Settings → Domains
2. Add your domain
3. Choose domain type (apex, www, or subdomain)

### 2. Configure DNS

Add DNS records as shown in Vercel:

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions and renews SSL certificates via Let's Encrypt.

## Performance Optimization

### 1. next.config.js Optimization

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ['your-project-ref.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Generate standalone output for smaller deployments
  output: 'standalone',

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: 'https://your-project-ref.supabase.co/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. Vercel Configuration (vercel.json)

```json
{
  "version": 2,
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "github": {
    "silent": true
  },
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### 3. Edge Configuration

```typescript
// app/api/example/route.ts
export const runtime = 'edge'
export const preferredRegion = ['iad1', 'sfo1']

export async function GET(request: Request) {
  // Your API logic
}
```

## Environment-Specific Deployments

### Preview Deployments

Every git push to a branch creates a preview deployment:
- Unique URL for each branch
- Test changes before merging
- Share with team for review

### Production Deployments

Deployments to `main` branch go to production:
- Automatic deployments on merge
- Roll back capability
- Zero-downtime deployments

### Multiple Environments

Set up separate projects for staging:

```bash
# Create staging project
vercel --scope your-team

# Link to staging environment
vercel link --yes
```

## Monitoring and Analytics

### 1. Vercel Analytics

Enable in Project Settings → Analytics:
- Real User Monitoring (RUM)
- Core Web Vitals
- Page views and performance metrics

### 2. Performance Metrics

Monitor via Vercel Dashboard:
- Build time
- Function execution time
- Edge network performance
- Bandwidth usage

### 3. Error Tracking

Integrate Sentry or similar:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

## Continuous Integration/Deployment

### GitHub Actions Integration

Vercel integrates automatically with GitHub:
- Builds on every push
- Comments on PRs with preview URLs
- Auto-deploy on merge to main

### Custom CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Database Migrations

### Run Migrations on Deploy

Create a script to run before build:

```json
// package.json
{
  "scripts": {
    "prebuild": "npm run migrate",
    "migrate": "supabase db push",
    "build": "next build"
  }
}
```

## Rollback Strategy

### Instant Rollback

Via Vercel Dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

Via CLI:
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel alias set <deployment-url> production
```

## Security Best Practices

### 1. Environment Variables

- Use Vercel's encrypted environment variables
- Different values for preview/production
- Never expose service role keys in client code

### 2. Security Headers

Already configured in next.config.js headers section

### 3. API Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verify authentication
  const token = request.cookies.get('auth-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/protected/:path*'],
}
```

## Troubleshooting

### Build Failures

**Check build logs:**
```bash
vercel logs <deployment-url>
```

**Common issues:**
- Missing environment variables
- TypeScript errors
- Dependency conflicts

**Solutions:**
```bash
# Clear cache and rebuild
vercel build --force

# Check environment variables
vercel env ls
```

### Performance Issues

**Check:**
- Bundle size: `npm run build` output
- Image optimization settings
- API response times

**Tools:**
- Vercel Analytics
- Lighthouse CI
- Bundle analyzer

### Deployment Limits

**Free Tier:**
- 100 GB bandwidth/month
- 100 hours build time/month
- Unlimited deployments

**Pro Tier:**
- 1 TB bandwidth/month
- 400 hours build time/month
- Advanced features

## Cost Optimization

### 1. Optimize Bundle Size

```bash
# Analyze bundle
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

### 2. Reduce Function Executions

- Cache responses when possible
- Use static generation for pages
- Implement efficient database queries

### 3. Optimize Images

- Use Next.js Image component
- Compress images before upload
- Use appropriate formats (WebP, AVIF)

## Production Checklist

- [ ] Environment variables configured
- [ ] Custom domain set up
- [ ] SSL certificate active
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Security headers in place
- [ ] Performance monitoring active
- [ ] Database migrations automated
- [ ] Backup strategy implemented
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Team access configured

## Advanced Features

### Edge Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // A/B testing
  const bucket = Math.random() < 0.5 ? 'a' : 'b'
  const response = NextResponse.next()
  response.cookies.set('bucket', bucket)
  
  return response
}
```

### ISR (Incremental Static Regeneration)

```typescript
// app/tasks/[id]/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

export default async function TaskPage({ params }: { params: { id: string } }) {
  const task = await getTask(params.id)
  return <TaskDetails task={task} />
}
```

### Edge Functions

```typescript
// app/api/edge/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: 'Hello from Edge' }), {
    headers: { 'content-type': 'application/json' },
  })
}
```

## Monitoring Commands

```bash
# View recent deployments
vercel ls

# View logs for deployment
vercel logs <deployment-url>

# View project info
vercel inspect <deployment-url>

# Check domain status
vercel domains ls

# View environment variables
vercel env ls
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Analytics](https://vercel.com/analytics)
