# Database Schema

## Overview

This document describes the PostgreSQL database schema for Cleanbuz, optimized for Supabase with Row Level Security (RLS) policies.

## Schema Design Principles

- **Normalized structure** to reduce data redundancy
- **Indexed columns** for query performance
- **UUID primary keys** for distributed systems
- **Timestamps** for audit trails
- **Soft deletes** for data recovery
- **RLS policies** for multi-tenant security

## Tables

### users (Extended from Supabase Auth)

Profile information extending the built-in `auth.users` table.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "sms": true,
    "push": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }'::jsonb,
  role TEXT DEFAULT 'cleaner' CHECK (role IN ('admin', 'manager', 'cleaner', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### properties

Properties managed by the system.

```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  property_type TEXT DEFAULT 'apartment' CHECK (
    property_type IN ('apartment', 'house', 'condo', 'villa', 'studio')
  ),
  bedrooms INTEGER DEFAULT 1,
  bathrooms DECIMAL(3,1) DEFAULT 1.0,
  square_feet INTEGER,
  amenities JSONB DEFAULT '[]'::jsonb,
  cleaning_instructions TEXT,
  access_instructions TEXT,
  photo_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_active ON public.properties(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_city ON public.properties(city);

-- RLS Policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own properties"
  ON public.properties FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can manage their own properties"
  ON public.properties FOR ALL
  USING (owner_id = auth.uid());
```

### ical_feeds

Configuration for Airbnb iCal feed URLs.

```sql
CREATE TABLE public.ical_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  feed_name TEXT NOT NULL,
  platform TEXT DEFAULT 'airbnb' CHECK (
    platform IN ('airbnb', 'vrbo', 'booking', 'other')
  ),
  sync_frequency_minutes INTEGER DEFAULT 30 CHECK (sync_frequency_minutes >= 15),
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending' CHECK (
    last_sync_status IN ('pending', 'success', 'error')
  ),
  last_sync_error TEXT,
  sync_stats JSONB DEFAULT '{
    "total_syncs": 0,
    "successful_syncs": 0,
    "failed_syncs": 0,
    "bookings_created": 0,
    "bookings_updated": 0
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_ical_feeds_property ON public.ical_feeds(property_id);
CREATE INDEX idx_ical_feeds_active ON public.ical_feeds(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_ical_feeds_next_sync ON public.ical_feeds(last_synced_at, is_active);

-- RLS Policies
ALTER TABLE public.ical_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage feeds for their properties"
  ON public.ical_feeds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = ical_feeds.property_id
        AND owner_id = auth.uid()
    )
  );
```

### bookings

Synchronized booking information from Airbnb and other platforms.

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  ical_feed_id UUID REFERENCES public.ical_feeds(id) ON DELETE SET NULL,
  external_id TEXT, -- UID from iCal
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  guests_count INTEGER DEFAULT 1,
  booking_status TEXT DEFAULT 'confirmed' CHECK (
    booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  booking_source TEXT DEFAULT 'airbnb',
  booking_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  special_requests TEXT,
  notes TEXT,
  raw_ical_data TEXT, -- Store original iCal event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT check_dates CHECK (check_out > check_in),
  CONSTRAINT unique_external_booking UNIQUE (property_id, external_id)
);

-- Indexes
CREATE INDEX idx_bookings_property ON public.bookings(property_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_check_in ON public.bookings(check_in) WHERE booking_status = 'confirmed';
CREATE INDEX idx_bookings_external_id ON public.bookings(external_id);

-- RLS Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bookings for their properties"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = bookings.property_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cleaner')
    )
  );

CREATE POLICY "Users can manage bookings for their properties"
  ON public.bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = bookings.property_id
        AND owner_id = auth.uid()
    )
  );
```

### task_templates

Reusable task templates for automated task generation.

```sql
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'cleaning' CHECK (
    category IN ('cleaning', 'maintenance', 'inspection', 'restocking', 'laundry', 'other')
  ),
  estimated_duration_minutes INTEGER DEFAULT 60,
  checklist_items JSONB DEFAULT '[]'::jsonb, -- Array of checklist items
  priority TEXT DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  trigger_event TEXT CHECK (
    trigger_event IN ('check_out', 'check_in', 'daily', 'weekly', 'monthly', 'custom')
  ),
  trigger_offset_hours INTEGER DEFAULT 0, -- Hours before/after trigger event
  assigned_role TEXT DEFAULT 'cleaner' CHECK (
    assigned_role IN ('cleaner', 'manager', 'maintenance', 'any')
  ),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_task_templates_property ON public.task_templates(property_id);
CREATE INDEX idx_task_templates_category ON public.task_templates(category);
CREATE INDEX idx_task_templates_active ON public.task_templates(is_active) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates for their properties"
  ON public.task_templates FOR SELECT
  USING (
    property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = task_templates.property_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can manage templates for their properties"
  ON public.task_templates FOR ALL
  USING (
    property_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = task_templates.property_id
        AND owner_id = auth.uid()
    )
  );
```

### tasks

Individual task instances generated from templates or created manually.

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'cleaning' CHECK (
    category IN ('cleaning', 'maintenance', 'inspection', 'restocking', 'laundry', 'other')
  ),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')
  ),
  priority TEXT DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_duration_minutes INTEGER DEFAULT 60,
  actual_duration_minutes INTEGER,
  due_date TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist_items JSONB DEFAULT '[]'::jsonb, -- [{"text": "...", "completed": false}]
  attachments TEXT[], -- URLs to photos/files
  notes TEXT,
  location_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tasks_property ON public.tasks(property_id);
CREATE INDEX idx_tasks_booking ON public.tasks(booking_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- RLS Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their properties or assigned to them"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id
        AND owner_id = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update tasks assigned to them"
  ON public.tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Property owners and managers can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = tasks.property_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
```

### notifications

Log of all notifications sent to users.

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN ('sms', 'email', 'push', 'in_app')
  ),
  channel TEXT NOT NULL, -- e.g., 'mobilemessage', 'sendgrid', 'fcm'
  recipient TEXT NOT NULL, -- phone number or email
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')
  ),
  external_id TEXT, -- Mobile Message message SID, etc.
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_task ON public.notifications(task_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
```

### team_members

Association between properties and team members (cleaners, managers).

```sql
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'cleaner' CHECK (
    role IN ('manager', 'cleaner', 'maintenance')
  ),
  is_active BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_property_user UNIQUE (property_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_property ON public.team_members(property_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_active ON public.team_members(is_active);

-- RLS Policies
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members for their properties"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = team_members.property_id
        AND owner_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Property owners can manage team members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = team_members.property_id
        AND owner_id = auth.uid()
    )
  );
```

## Functions and Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ical_feeds_updated_at
  BEFORE UPDATE ON public.ical_feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Sample Data Queries

### Get upcoming tasks for a user
```sql
SELECT t.*, p.name as property_name, b.guest_name
FROM tasks t
JOIN properties p ON t.property_id = p.id
LEFT JOIN bookings b ON t.booking_id = b.id
WHERE t.assigned_to = 'user-uuid'
  AND t.status NOT IN ('completed', 'cancelled')
  AND t.deleted_at IS NULL
ORDER BY t.due_date ASC;
```

### Get bookings needing task generation
```sql
SELECT b.*, p.name as property_name
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE b.check_in >= CURRENT_DATE
  AND b.booking_status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.booking_id = b.id
      AND t.deleted_at IS NULL
  );
```

### Get daily task digest for user
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE due_date::date = CURRENT_DATE) as due_today_count
FROM tasks
WHERE assigned_to = 'user-uuid'
  AND status NOT IN ('completed', 'cancelled')
  AND deleted_at IS NULL;
```

## Migration Strategy

1. Create tables in order (respecting foreign keys)
2. Set up RLS policies
3. Create functions and triggers
4. Insert default task templates
5. Test with sample data
6. Deploy to production with zero downtime

## Performance Optimization

- **Partitioning**: Consider partitioning `bookings` and `tasks` by date for large datasets
- **Indexes**: Add additional indexes based on query patterns
- **Materialized Views**: Create for complex reporting queries
- **Archive Strategy**: Move old completed tasks to archive tables

## Backup & Maintenance

- Daily automated backups via Supabase
- Weekly full database export
- Monthly data cleanup of old notifications
- Quarterly review of unused indexes
