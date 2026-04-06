# Phase 4: Client Management & Progress

## Goal

Admins manage client profiles, view visit history, assign subscription packages, and track flexibility progress. Clients view their own profile, visits, and subscription balance.

## Dependencies

Phase 2 complete (bookings for visit history).

## Database Tables

```sql
-- Migration: 010_create_client_profiles.js
CREATE TABLE client_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  studio_id   UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  first_name  VARCHAR(255),
  last_name   VARCHAR(255),
  phone       VARCHAR(50),
  birth_date  DATE,
  notes       TEXT,                    -- admin notes
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_studio UNIQUE(user_id, studio_id)
);

-- Migration: 011_create_subscriptions.js
CREATE TABLE subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,        -- e.g. "8-visit pack", "Monthly unlimited"
  type          VARCHAR(20) NOT NULL,         -- 'visits' | 'unlimited' | 'trial'
  total_visits  INTEGER,                       -- NULL for unlimited
  used_visits   INTEGER NOT NULL DEFAULT 0,
  starts_at     DATE NOT NULL,
  expires_at    DATE NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
                -- 'active' | 'expired' | 'exhausted' | 'revoked'
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id, studio_id);

-- Migration: 012_create_progress_records.js
CREATE TABLE progress_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_by   UUID NOT NULL REFERENCES users(id),   -- admin who recorded
  record_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  measurements  JSONB,      -- { "forward_fold_cm": 15, "splits_angle": 120, ... }
  notes         TEXT,
  photo_urls    JSONB,      -- array of URLs
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_progress_client ON progress_records(client_id, studio_id);
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/studios/:studioId/clients` | List client profiles | Admin |
| GET | `/api/studios/:studioId/clients/:clientId` | Client detail (profile + visits + subscription) | Admin |
| PUT | `/api/studios/:studioId/clients/:clientId` | Update client profile / notes | Admin |
| GET | `/api/profile` | Current user's profile | Client |
| PUT | `/api/profile` | Update own profile (name, phone, etc.) | Client |
| GET | `/api/studios/:studioId/clients/:clientId/visits` | Visit history | Admin / Client (own) |
| POST | `/api/studios/:studioId/subscriptions` | Create/assign subscription | Admin |
| GET | `/api/studios/:studioId/subscriptions` | List subscriptions (filter by client) | Admin |
| GET | `/api/studios/:studioId/subscriptions/:id` | Subscription detail | Admin / Client (own) |
| PUT | `/api/studios/:studioId/subscriptions/:id` | Update subscription (extend, revoke) | Admin |
| GET | `/api/subscriptions/my` | Current user's active subscriptions | Client |
| POST | `/api/studios/:studioId/progress` | Record progress measurement | Admin |
| GET | `/api/studios/:studioId/clients/:clientId/progress` | Progress history | Admin / Client (own) |
| GET | `/api/progress/my` | Own progress history | Client |

## Key Implementation Details

### Client Profile Auto-Creation

When a client first books at a studio, auto-create a `client_profiles` row with `user_id` + `studio_id`. UNIQUE constraint on `(user_id, studio_id)` ensures one profile per studio.

### Visit History

Not a separate table. Query: `SELECT * FROM bookings WHERE client_id = :id AND status = 'completed'` with JOINs to `schedule_slots` and `class_types` for class name, time, etc.

### Subscription Balance

- `visits` type: `remaining = total_visits - used_visits`
- `unlimited` type: valid while `expires_at >= CURRENT_DATE` and `status = 'active'`
- On `booking:completed` event: increment `used_visits` on active subscription. If `used_visits >= total_visits`, set `status = 'exhausted'`.
- Scheduled task: check for expired subscriptions daily, set `status = 'expired'`.

### Subscription Deduction

Listen to `booking:completed` event. Find client's active subscription for the studio. Deduct a visit. Keeps booking and subscription systems loosely coupled via event bus.

### Progress Tracking

`measurements` is JSONB — flexible schema. Typical stretching metrics: forward fold distance (cm), side split angle, front split angle, bridge height, etc. API accepts arbitrary key-value pairs. Photo URLs stored as JSONB array (actual file upload deferred or uses external storage).
