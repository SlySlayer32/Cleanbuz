# Realtime Updates with Supabase

## Overview

This guide covers implementing real-time features using Supabase Realtime for the Cleanbuz application, enabling instant synchronization of tasks, bookings, and notifications across all connected clients.

## Supabase Realtime Architecture

### How It Works

Supabase Realtime uses PostgreSQL's replication functionality to broadcast database changes via WebSocket connections. Changes are detected through Write-Ahead Logging (WAL) and published to subscribed channels.

**Key Features:**

- Database change events (INSERT, UPDATE, DELETE)
- Broadcast messages (custom events)
- Presence tracking (who's online)
- Low latency (~100ms)
- Automatic reconnection
- Authorization via RLS policies

## Setup and Configuration

### 1. Enable Realtime for Tables

In Supabase Dashboard:

1. Navigate to Database → Replication
2. Enable replication for tables:
   - `tasks`
   - `bookings`
   - `notifications`
   - `team_members`

Or via SQL:

```sql
-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Check enabled tables
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### 2. Configure Row Level Security

Realtime respects RLS policies, so ensure they're configured:

```sql
-- Users only receive realtime updates for their own data
CREATE POLICY "Users receive updates for their tasks"
  ON public.tasks FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id AND owner_id = auth.uid()
    )
  );
```

## Implementation Patterns

### 1. Basic Table Subscription

Subscribe to all changes on a table:

```typescript
// lib/realtime/useRealtimeTasks.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeTasks(userId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Create channel
    const tasksChannel = supabase
      .channel('tasks-all-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
        },
        payload => {
          console.log('Task change:', payload);
          handleTaskChange(payload);
        }
      )
      .subscribe();

    setChannel(tasksChannel);

    // Cleanup
    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [userId, supabase]);

  const handleTaskChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        console.log('New task created:', newRecord);
        // Update local state, show notification, etc.
        break;
      case 'UPDATE':
        console.log('Task updated:', newRecord);
        break;
      case 'DELETE':
        console.log('Task deleted:', oldRecord);
        break;
    }
  };

  return { channel };
}
```

### 2. Filtered Subscriptions

Subscribe to specific rows using filters:

```typescript
// Listen only to tasks assigned to current user
const channel = supabase
  .channel('my-tasks')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `assigned_to=eq.${userId}`,
    },
    payload => {
      console.log('My task changed:', payload);
    }
  )
  .subscribe();
```

**Available filter operators:**

- `eq` - equals
- `neq` - not equals
- `lt` - less than
- `lte` - less than or equal
- `gt` - greater than
- `gte` - greater than or equal
- `in` - in list

### 3. Event-Specific Subscriptions

Subscribe to specific events:

```typescript
// Listen only to INSERT events
const insertChannel = supabase
  .channel('task-inserts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'tasks',
    },
    payload => {
      showNotification(`New task: ${payload.new.title}`);
    }
  )
  .subscribe();

// Listen only to UPDATE events
const updateChannel = supabase
  .channel('task-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tasks',
    },
    payload => {
      if (payload.old.status !== payload.new.status) {
        console.log(`Task status changed: ${payload.old.status} → ${payload.new.status}`);
      }
    }
  )
  .subscribe();
```

### 4. Multiple Table Subscriptions

Subscribe to multiple tables on one channel:

```typescript
const channel = supabase
  .channel('dashboard-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
    },
    payload => handleTaskChange(payload)
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookings',
    },
    payload => handleBookingChange(payload)
  )
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
    },
    payload => handleNewNotification(payload)
  )
  .subscribe();
```

## React Integration

### Custom Hook for Task Updates

```typescript
// hooks/useTasksRealtime.ts
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function useTasksRealtime(userId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        payload => {
          // Invalidate React Query cache to refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', userId] });

          // Or update cache directly for optimistic updates
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['tasks', userId], (old: any) => {
              return old ? [...old, payload.new] : [payload.new];
            });
          }

          if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['tasks', userId], (old: any) => {
              return old?.map((task: any) => (task.id === payload.new.id ? payload.new : task));
            });
          }

          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['tasks', userId], (old: any) => {
              return old?.filter((task: any) => task.id !== payload.old.id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, supabase]);
}
```

### Component Usage

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useTasksRealtime } from '@/hooks/useTasksRealtime'
import { useQuery } from '@tanstack/react-query'

export default function TaskList() {
  const { user } = useAuth()
  const userId = user?.id || ''

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data
    },
  })

  // Subscribe to realtime updates
  useTasksRealtime(userId)

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {tasks?.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

## Broadcast Messages

Send custom events between clients without database changes:

### Sending Broadcasts

```typescript
const channel = supabase.channel('task-collaboration');

// Send a broadcast message
await channel.send({
  type: 'broadcast',
  event: 'task-viewed',
  payload: {
    taskId: 'task-123',
    userId: 'user-456',
    timestamp: new Date().toISOString(),
  },
});
```

### Receiving Broadcasts

```typescript
const channel = supabase
  .channel('task-collaboration')
  .on('broadcast', { event: 'task-viewed' }, payload => {
    console.log('Someone viewed task:', payload);
    // Show indicator that another user is viewing
  })
  .on('broadcast', { event: 'task-editing' }, payload => {
    console.log('Someone is editing task:', payload);
    // Show "User X is editing" indicator
  })
  .subscribe();
```

### Use Case: Collaborative Task Editing

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CollaborativeTaskEditor({ taskId }: { taskId: string }) {
  const [editingUsers, setEditingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`task-${taskId}`)
      .on('broadcast', { event: 'editing-start' }, (payload) => {
        setEditingUsers((prev) => [...prev, payload.userId])
      })
      .on('broadcast', { event: 'editing-end' }, (payload) => {
        setEditingUsers((prev) => prev.filter((id) => id !== payload.userId))
      })
      .subscribe()

    return () => {
      // Notify others that we stopped editing
      channel.send({
        type: 'broadcast',
        event: 'editing-end',
        payload: { userId: 'current-user-id' },
      })
      supabase.removeChannel(channel)
    }
  }, [taskId, supabase])

  const handleFocus = () => {
    const channel = supabase.channel(`task-${taskId}`)
    channel.send({
      type: 'broadcast',
      event: 'editing-start',
      payload: { userId: 'current-user-id' },
    })
  }

  return (
    <div>
      {editingUsers.length > 0 && (
        <div className="text-sm text-gray-600">
          {editingUsers.length} user(s) editing this task
        </div>
      )}
      <textarea onFocus={handleFocus} />
    </div>
  )
}
```

## Presence Tracking

Track who's online and their status:

### Implementation

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(roomId: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users = Object.values(presenceState).flat();
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Users joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences);
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            onlineAt: new Date().toISOString(),
            status: 'active',
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, supabase]);

  return { onlineUsers };
}
```

### Usage: Show Online Team Members

```typescript
'use client'

import { usePresence } from '@/hooks/usePresence'
import { useAuth } from '@/components/auth/AuthProvider'

export function TeamPresence({ propertyId }: { propertyId: string }) {
  const { user } = useAuth()
  const { onlineUsers } = usePresence(`property-${propertyId}`, user?.id || '')

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Team online:</span>
      <div className="flex -space-x-2">
        {onlineUsers.map((user) => (
          <div
            key={user.userId}
            className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"
            title={user.userId}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full absolute bottom-0 right-0" />
          </div>
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {onlineUsers.length} online
      </span>
    </div>
  )
}
```

## Advanced Patterns

### Optimistic Updates

Update UI immediately before server confirms:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateTask() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: any) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: any) =>
        old?.map((task: any) => (task.id === taskId ? { ...task, ...updates } : task))
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### Connection Status Monitoring

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('status-check')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (status === 'CLOSED') {
          setStatus('disconnected')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return { status }
}

// Usage in UI
export function ConnectionStatus() {
  const { status } = useRealtimeStatus()

  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Connected' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected' },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-600">{config.text}</span>
    </div>
  )
}
```

### Debounced Updates

Prevent excessive realtime updates:

```typescript
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

export function useDebouncedRealtime(callback: Function, delay: number = 500) {
  const debouncedCallback = useRef(debounce(callback, delay)).current;

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

// Usage
const handleTaskUpdate = useDebouncedRealtime(payload => {
  // This will only run once per 500ms at most
  updateTaskInUI(payload.new);
}, 500);
```

## Performance Optimization

### 1. Channel Pooling

Reuse channels instead of creating many:

```typescript
class RealtimeChannelManager {
  private channels = new Map<string, any>();
  private supabase = createClient();

  getChannel(name: string) {
    if (this.channels.has(name)) {
      return this.channels.get(name);
    }

    const channel = this.supabase.channel(name);
    this.channels.set(name, channel);
    return channel;
  }

  removeChannel(name: string) {
    const channel = this.channels.get(name);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(name);
    }
  }
}

export const channelManager = new RealtimeChannelManager();
```

### 2. Selective Updates

Only update what changed:

```typescript
const handleTaskUpdate = (payload: any) => {
  const { old: oldTask, new: newTask } = payload;

  // Only update if specific fields changed
  if (oldTask.status !== newTask.status) {
    updateStatusUI(newTask.status);
  }

  if (oldTask.assigned_to !== newTask.assigned_to) {
    updateAssigneeUI(newTask.assigned_to);
  }

  // Skip unnecessary UI updates
};
```

### 3. Batched Updates

Batch multiple updates:

```typescript
import { useEffect, useRef, useState } from 'react';

export function useBatchedRealtime(batchInterval: number = 1000) {
  const [updates, setUpdates] = useState<any[]>([]);
  const batchRef = useRef<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (batchRef.current.length > 0) {
        setUpdates([...batchRef.current]);
        batchRef.current = [];
      }
    }, batchInterval);

    return () => clearInterval(interval);
  }, [batchInterval]);

  const addUpdate = (update: any) => {
    batchRef.current.push(update);
  };

  return { updates, addUpdate };
}
```

## Error Handling

```typescript
const channel = supabase
  .channel('tasks-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
    try {
      handleTaskChange(payload);
    } catch (error) {
      console.error('Error handling realtime update:', error);
      // Report to error tracking service
      Sentry.captureException(error);
    }
  })
  .subscribe((status, error) => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to realtime updates');
    }
    if (error) {
      console.error('Subscription error:', error);
      // Attempt reconnection
      setTimeout(() => {
        channel.subscribe();
      }, 5000);
    }
  });
```

## Testing Realtime Features

### Mock Realtime Events

```typescript
import { createClient } from '@supabase/supabase-js';

describe('Realtime Tasks', () => {
  it('should update UI on task creation', async () => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const { data } = await supabase
      .from('tasks')
      .insert({ title: 'Test Task', assigned_to: 'user-id' })
      .select();

    // Wait for realtime update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Assert UI updated
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Clean Up Subscriptions**: Always unsubscribe in useEffect cleanup
2. **Use Filters**: Reduce unnecessary updates with appropriate filters
3. **Handle Reconnection**: Implement retry logic for failed connections
4. **Batch Updates**: Group rapid changes to prevent UI thrashing
5. **Monitor Performance**: Track realtime event volume and latency
6. **Respect RLS**: Ensure RLS policies prevent unauthorized access
7. **Test Edge Cases**: Handle offline scenarios and race conditions

## Troubleshooting

### Common Issues

1. **Not receiving updates**
   - Verify table has replication enabled
   - Check RLS policies allow SELECT
   - Ensure proper channel subscription

2. **Duplicate events**
   - Multiple subscriptions to same channel
   - Check useEffect dependencies

3. **High latency**
   - Too many subscriptions
   - Large payload sizes
   - Network issues

4. **Memory leaks**
   - Not cleaning up channels
   - Not unsubscribing on unmount

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Realtime API Reference](https://supabase.com/docs/reference/javascript/subscribe)
- [Postgres CDC](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Broadcast Messages](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence](https://supabase.com/docs/guides/realtime/presence)
