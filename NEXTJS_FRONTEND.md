# Next.js + React Frontend Guide

## Overview

This guide covers building a Progressive Web App (PWA) frontend for Cleanbuz using Next.js 14+ with the App Router, React, TypeScript, and Tailwind CSS.

## Project Initialization

### Create Next.js Project

```bash
npx create-next-app@latest cleanbuz-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd cleanbuz-app
```

### Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @tanstack/react-query
npm install date-fns clsx tailwind-merge
npm install lucide-react

# PWA support
npm install next-pwa
npm install -D @types/node

# Form handling
npm install react-hook-form zod @hookform/resolvers

# Additional UI
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-toast
```

## Project Structure

```
cleanbuz-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── verify-otp/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── twilio/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── PhoneLogin.tsx
│   │   └── EmailLogin.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskForm.tsx
│   │   └── TaskFilters.tsx
│   ├── bookings/
│   │   ├── BookingCard.tsx
│   │   └── BookingCalendar.tsx
│   ├── calendar/
│   │   └── Calendar.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTasks.ts
│   ├── useBookings.ts
│   └── useRealtimeUpdates.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── utils.ts
│   └── validators.ts
├── types/
│   ├── database.ts
│   └── index.ts
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   ├── manifest.json
│   └── sw.js
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Configuration

### next.config.js with PWA

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-project-ref.supabase.co'],
  },
}

module.exports = withPWA(nextConfig)
```

### PWA Manifest (public/manifest.json)

```json
{
  "name": "Cleanbuz - Task Management",
  "short_name": "Cleanbuz",
  "description": "Property management and task tracking app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Root Layout (app/layout.tsx)

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cleanbuz - Task Management',
  description: 'Property management and task tracking app',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cleanbuz',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Providers Component

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
```

## Core Components

### Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar className="hidden lg:block" />
        <main className="flex-1 p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <MobileNav className="lg:hidden" />
    </div>
  )
}
```

### Header Component

```typescript
// components/layout/Header.tsx
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Bell, Menu } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-blue-600">Cleanbuz</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
```

### Sidebar Component

```typescript
// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Home,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Bookings', href: '/bookings', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside className={cn('w-64 bg-white border-r border-gray-200', className)}>
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

### Task List Component

```typescript
// components/tasks/TaskList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from './TaskCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useTasksRealtime } from '@/hooks/useTasksRealtime'

export function TaskList() {
  const { user } = useAuth()
  const supabase = createClient()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          property:properties(id, name),
          booking:bookings(id, guest_name)
        `)
        .eq('assigned_to', user?.id)
        .not('status', 'in', '("completed","cancelled")')
        .order('due_date', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Subscribe to realtime updates
  useTasksRealtime(user?.id || '')

  if (isLoading) {
    return <div>Loading tasks...</div>
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tasks assigned</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

### Task Card Component

```typescript
// components/tasks/TaskCard.tsx
'use client'

import { formatDistanceToNow } from 'date-fns'
import { Clock, MapPin, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string
    status: string
    priority: string
    due_date: string
    property: { name: string }
    booking?: { guest_name: string }
  }
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export function TaskCard({ task }: TaskCardProps) {
  const dueDate = new Date(task.due_date)
  const isOverdue = dueDate < new Date()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-medium',
            priorityColors[task.priority as keyof typeof priorityColors]
          )}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      )}

      <div className="flex flex-col gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{task.property.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span
            className={cn(isOverdue && 'text-red-600 font-medium')}
          >
            {isOverdue ? 'Overdue' : 'Due'}{' '}
            {formatDistanceToNow(dueDate, { addSuffix: true })}
          </span>
        </div>

        {task.booking && (
          <div className="text-xs">
            Guest: {task.booking.guest_name}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
          Start Task
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
```

### Task Form Component

```typescript
// components/tasks/TaskForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  property_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string(),
  assigned_to: z.string().uuid(),
})

type TaskFormData = z.infer<typeof taskSchema>

export function TaskForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  })

  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onSuccess?.()
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => createTask.mutate(data))}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          {...register('title')}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select {...register('priority')} className="w-full px-3 py-2 border rounded-md">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <input
          {...register('due_date')}
          type="datetime-local"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <button
        type="submit"
        disabled={createTask.isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {createTask.isPending ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  )
}
```

## Custom Hooks

### useTasks Hook

```typescript
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useTasks(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const tasks = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, property:properties(*), booking:bookings(*)')
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<any>
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    },
  })

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    },
  })

  return {
    tasks: tasks.data || [],
    isLoading: tasks.isLoading,
    error: tasks.error,
    updateTask,
    completeTask,
  }
}
```

## Offline Support

### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'cleanbuz-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/tasks',
  '/bookings',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => caches.match('/offline'))
  )
})
```

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image'

export function PropertyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className="rounded-lg"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    />
  )
}
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic'

const Calendar = dynamic(() => import('@/components/calendar/Calendar'), {
  loading: () => <p>Loading calendar...</p>,
  ssr: false,
})
```

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { TaskCard } from '@/components/tasks/TaskCard'

describe('TaskCard', () => {
  it('renders task information', () => {
    const task = {
      id: '1',
      title: 'Clean apartment',
      status: 'pending',
      priority: 'high',
      due_date: new Date().toISOString(),
      property: { name: 'Property 1' },
    }

    render(<TaskCard task={task} />)
    
    expect(screen.getByText('Clean apartment')).toBeInTheDocument()
    expect(screen.getByText('Property 1')).toBeInTheDocument()
  })
})
```

## Deployment

See VERCEL_DEPLOYMENT.md for detailed deployment instructions.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
