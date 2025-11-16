# Security and Scalability Best Practices

## Overview

This document outlines security measures and scalability strategies for the Cleanbuz application to ensure reliability, data protection, and performance at scale.

## Security Best Practices

### 1. Authentication & Authorization

#### Multi-Factor Authentication (MFA)

```typescript
// Enable MFA for user accounts
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Mobile App',
});

// Verify MFA challenge
await supabase.auth.mfa.challengeAndVerify({
  factorId: data.id,
  code: '123456',
});
```

#### Row Level Security (RLS)

**Always enable RLS on all tables:**

```sql
-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their assigned tasks
CREATE POLICY "Users can view their assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id
        AND owner_id = auth.uid()
    )
  );

-- Policy for users to update their assigned tasks
CREATE POLICY "Users can update their assigned tasks"
  ON public.tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id
        AND owner_id = auth.uid()
    )
  );
```

#### JWT Token Security

```typescript
// Server-side token validation
import { createServerClient } from '@/lib/supabase/server';

export async function verifyToken(request: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}
```

### 2. API Security

#### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return { limit, reset, remaining };
}
```

**Apply to API routes:**

```typescript
// app/api/tasks/route.ts
import { checkRateLimit } from '@/lib/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';

  try {
    await checkRateLimit(ip);
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': '10',
        },
      }
    );
  }

  // Process request
}
```

#### Input Validation

```typescript
import { z } from 'zod';

// Define schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  property_id: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().datetime(),
});

// Validate input
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }
  }
}
```

#### CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 3. Data Protection

#### Encryption at Rest

Supabase provides encryption at rest by default. For additional sensitive data:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

#### Sensitive Data Masking

```typescript
export function maskPhone(phone: string): string {
  // +1234567890 → +1234***890
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1***$3');
}

export function maskEmail(email: string): string {
  // user@example.com → u***r@example.com
  const [local, domain] = email.split('@');
  const masked = local[0] + '***' + local[local.length - 1];
  return `${masked}@${domain}`;
}
```

#### Secure File Uploads

```typescript
// Validate file type and size
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 5MB)' };
  }

  return { valid: true };
}

// Scan for malware (using ClamAV or similar)
export async function scanFile(fileBuffer: Buffer): Promise<boolean> {
  // Integration with virus scanning service
  // Return true if clean, false if infected
}
```

### 4. Secret Management

#### Environment Variables

```bash
# .env.local (never commit to git)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MOBILE_MESSAGE_ACCOUNT_ID=abc123...
ENCRYPTION_KEY=hex_string_32_bytes

# Use different keys for different environments
DATABASE_URL_PRODUCTION=postgresql://...
DATABASE_URL_STAGING=postgresql://...
```

#### Secrets Rotation

```typescript
// Rotate API keys regularly
export async function rotateApiKey(userId: string) {
  const newKey = crypto.randomBytes(32).toString('hex');

  await supabase
    .from('api_keys')
    .update({
      key: newKey,
      rotated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return newKey;
}
```

### 5. SQL Injection Prevention

**Use parameterized queries:**

```typescript
// ✅ Good - Parameterized query
const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId); // Safe

// ❌ Bad - String interpolation
const { data, error } = await supabase.rpc('execute_sql', {
  query: `SELECT * FROM tasks WHERE id = '${taskId}'`, // Vulnerable!
});
```

### 6. XSS Prevention

```typescript
// Sanitize HTML input
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

// Use in components
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
```

### 7. CSRF Protection

```typescript
// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}
```

### 8. Audit Logging

```sql
-- Create audit log table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
```

```typescript
// Log actions
export async function logAudit(data: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: any;
  request: Request;
}) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await supabase.from('audit_logs').insert({
    user_id: data.userId,
    action: data.action,
    resource_type: data.resourceType,
    resource_id: data.resourceId,
    changes: data.changes,
    ip_address: ip,
    user_agent: userAgent,
  });
}
```

## Scalability Strategies

### 1. Database Optimization

#### Indexing

```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_assigned_to_status ON public.tasks(assigned_to, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_bookings_property_dates ON public.bookings(property_id, check_in, check_out);

CREATE INDEX idx_tasks_due_date ON public.tasks(due_date)
  WHERE status NOT IN ('completed', 'cancelled');

-- Partial index for active records
CREATE INDEX idx_properties_active ON public.properties(owner_id)
  WHERE is_active = true AND deleted_at IS NULL;
```

#### Query Optimization

```typescript
// ✅ Good - Fetch only needed columns
const { data } = await supabase
  .from('tasks')
  .select('id, title, status, due_date')
  .eq('assigned_to', userId);

// ❌ Bad - Fetch all columns
const { data } = await supabase.from('tasks').select('*').eq('assigned_to', userId);
```

#### Connection Pooling

Supabase handles connection pooling automatically, but for direct PostgreSQL connections:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Caching Strategy

#### Redis Caching

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.setex(key, ttl, data);

  return data;
}

// Usage
const tasks = await getCached(
  `tasks:${userId}`,
  () => fetchTasksFromDB(userId),
  300 // 5 minutes
);
```

#### React Query Caching

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 3. Load Balancing

Vercel automatically handles load balancing, but for custom setups:

```nginx
# nginx.conf
upstream app_servers {
    server app1.example.com weight=3;
    server app2.example.com weight=2;
    server app3.example.com weight=1;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. CDN Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.cloudfront.net'],
    loader: 'cloudinary', // or 'imgix', 'akamai'
    path: 'https://your-cdn.cloudfront.net/',
  },
};
```

### 5. Background Job Processing

```typescript
// Use queue for heavy tasks
import { Queue } from 'bullmq';

const taskQueue = new Queue('tasks', {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

// Add job to queue
await taskQueue.add('generate-tasks', {
  bookingId: 'booking-123',
});

// Process jobs in worker
const worker = new Worker('tasks', async job => {
  if (job.name === 'generate-tasks') {
    await generateTasksForBooking(job.data.bookingId);
  }
});
```

### 6. Database Partitioning

```sql
-- Partition tasks table by date
CREATE TABLE public.tasks_partitioned (
  id UUID NOT NULL,
  -- other columns
  due_date TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, due_date)
) PARTITION BY RANGE (due_date);

-- Create partitions
CREATE TABLE tasks_2024_q1 PARTITION OF tasks_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE tasks_2024_q2 PARTITION OF tasks_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

### 7. Horizontal Scaling

**Stateless Application Design:**

- Store session data in database/Redis, not memory
- Use shared storage for file uploads
- Design API endpoints to be idempotent

**Microservices Architecture:**

```
Frontend (Vercel) → API Gateway
                    ├─ Auth Service (Supabase)
                    ├─ Task Service (Edge Function)
                    ├─ Notification Service (Edge Function)
                    └─ Sync Service (Edge Function)
```

### 8. Monitoring and Alerting

```typescript
// Implement health check endpoint
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      supabase: await checkSupabase(),
      redis: await checkRedis(),
    },
  };

  const isHealthy = Object.values(health.checks).every(v => v === 'ok');

  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503,
  });
}

async function checkDatabase(): Promise<'ok' | 'error'> {
  try {
    await supabase.from('tasks').select('id').limit(1);
    return 'ok';
  } catch {
    return 'error';
  }
}
```

## Performance Monitoring

### 1. Application Performance Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function trackPerformance(metricName: string, value: number) {
  Sentry.metrics.gauge(metricName, value);
}

export function trackDatabaseQuery(query: string, duration: number) {
  if (duration > 1000) {
    Sentry.captureMessage(`Slow query: ${query}`, {
      level: 'warning',
      tags: { duration },
    });
  }
}
```

### 2. Database Query Analysis

```sql
-- Enable query logging
ALTER DATABASE your_db SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] MFA available for user accounts
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Secrets stored securely
- [ ] Audit logging implemented
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning
- [ ] Error messages don't leak sensitive info
- [ ] File upload validation and scanning
- [ ] SQL injection prevention verified
- [ ] XSS prevention implemented
- [ ] CSRF tokens on forms

## Scalability Checklist

- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Background job queue for heavy tasks
- [ ] Horizontal scaling capability
- [ ] Load testing completed
- [ ] Monitoring and alerting set up
- [ ] Auto-scaling configured
- [ ] Database backup strategy
- [ ] Disaster recovery plan
- [ ] Performance budgets defined

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Vercel Security](https://vercel.com/docs/security)
