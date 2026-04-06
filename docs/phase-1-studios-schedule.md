# Phase 1: Studios & Schedule

## Goal

Admin can create studios, rooms, class types, and schedule recurring or one-time classes. Clients can browse available slots filtered by studio, date, and class type.

## Dependencies

Phase 0 complete.

## Database Tables

```sql
-- Migration: 002_create_studios.js
CREATE TABLE studios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  description TEXT,
  timezone    VARCHAR(50) NOT NULL DEFAULT 'UTC',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migration: 003_create_rooms.js
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migration: 004_create_class_types.js
CREATE TABLE class_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  max_participants  INTEGER NOT NULL DEFAULT 10,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migration: 005_create_schedule_slots.js
CREATE TABLE schedule_slots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  class_type_id     UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  trainer_name      VARCHAR(255),
  is_recurring      BOOLEAN NOT NULL DEFAULT false,
  day_of_week       SMALLINT,              -- 0=Sunday..6=Saturday (recurring)
  specific_date     DATE,                   -- one-time slots
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,          -- computed from class_type.duration_minutes
  max_participants  INTEGER,               -- override from class_type if needed
  status            VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' | 'cancelled'
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_type CHECK (
    (is_recurring = true AND day_of_week IS NOT NULL AND specific_date IS NULL)
    OR
    (is_recurring = false AND specific_date IS NOT NULL AND day_of_week IS NULL)
  )
);

CREATE INDEX idx_schedule_slots_studio ON schedule_slots(studio_id);
CREATE INDEX idx_schedule_slots_date ON schedule_slots(specific_date);
CREATE INDEX idx_schedule_slots_day ON schedule_slots(day_of_week);
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/studios` | Create studio | Admin |
| GET | `/api/studios` | List all studios | Public |
| GET | `/api/studios/:id` | Get studio details | Public |
| PUT | `/api/studios/:id` | Update studio | Admin |
| DELETE | `/api/studios/:id` | Delete studio | Admin |
| POST | `/api/studios/:studioId/rooms` | Create room | Admin |
| GET | `/api/studios/:studioId/rooms` | List rooms | Public |
| PUT | `/api/studios/:studioId/rooms/:id` | Update room | Admin |
| DELETE | `/api/studios/:studioId/rooms/:id` | Delete room | Admin |
| POST | `/api/studios/:studioId/class-types` | Create class type | Admin |
| GET | `/api/studios/:studioId/class-types` | List class types | Public |
| PUT | `/api/studios/:studioId/class-types/:id` | Update class type | Admin |
| DELETE | `/api/studios/:studioId/class-types/:id` | Delete class type | Admin |
| POST | `/api/studios/:studioId/schedule` | Create schedule slot | Admin |
| GET | `/api/studios/:studioId/schedule` | List schedule (filters: date, day_of_week, class_type_id) | Public |
| GET | `/api/studios/:studioId/schedule/:id` | Get slot detail | Public |
| PUT | `/api/studios/:studioId/schedule/:id` | Update slot | Admin |
| DELETE | `/api/studios/:studioId/schedule/:id` | Cancel/delete slot | Admin |
| GET | `/api/studios/:studioId/schedule/available` | Available slots with remaining capacity | Public |

## Key Implementation Details

### Route Organization

Each domain gets its own router factory following the workflow pattern:

```
src/app/api/studios/index.js              -- studioRouter(ctx)
src/app/api/studios/rooms/index.js        -- roomRouter(ctx)
src/app/api/studios/class-types/index.js  -- classTypeRouter(ctx)
src/app/api/studios/schedule/index.js     -- scheduleRouter(ctx)
```

### Available Slots Query

This is the first query requiring JOINs. For a given date, find:

1. One-time slots where `specific_date = :date`.
2. Recurring slots where `day_of_week = :dayOfWeek`.
3. LEFT JOIN with bookings to calculate `booked_count`.
4. Return slots where `booked_count < max_participants`.

### Studio Scoping

Every query includes `WHERE studio_id = :studioId`. Create a `withStudioScope(studioId, conditions)` helper.

### end_time Computation

When creating a schedule slot, compute `end_time = start_time + class_type.duration_minutes`. Store explicitly for efficient range queries.

### Conflict Detection

When creating a schedule slot, check for overlapping slots in the same room: same day/date, overlapping time ranges (`a.start_time < b.end_time AND b.start_time < a.end_time`). Return 409 Conflict if found.
