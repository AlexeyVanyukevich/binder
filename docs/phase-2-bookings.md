# Phase 2: Bookings

## Goal

Clients can book available slots and cancel bookings. The system enforces capacity limits and prevents double-booking. Admins can view all bookings and mark attendance.

## Dependencies

Phase 1 complete (schedule_slots must exist).

## Database Tables

```sql
-- Migration: 006_create_bookings.js
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  schedule_slot_id  UUID NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date      DATE NOT NULL,         -- actual date of the class occurrence
  status            VARCHAR(20) NOT NULL DEFAULT 'confirmed',
                    -- 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  booked_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cancelled_at      TIMESTAMP WITH TIME ZONE,
  CONSTRAINT uq_booking UNIQUE(schedule_slot_id, client_id, booking_date)
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_slot_date ON bookings(schedule_slot_id, booking_date);
CREATE INDEX idx_bookings_studio_date ON bookings(studio_id, booking_date);

-- Migration: 007_create_waitlist.js (table created, auto-promotion deferred)
CREATE TABLE waitlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  schedule_slot_id  UUID NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date      DATE NOT NULL,
  position          INTEGER NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_waitlist UNIQUE(schedule_slot_id, client_id, booking_date)
);
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/studios/:studioId/bookings` | Book a slot (`{ schedule_slot_id, booking_date }`) | Client |
| DELETE | `/api/studios/:studioId/bookings/:id` | Cancel booking | Client (own) / Admin |
| GET | `/api/studios/:studioId/bookings` | List bookings (filters: date, client_id, status) | Admin |
| GET | `/api/bookings/my` | Current user's bookings (filters: status, date range) | Client |
| GET | `/api/studios/:studioId/bookings/:id` | Get booking detail | Client (own) / Admin |
| POST | `/api/studios/:studioId/bookings/:id/complete` | Mark as completed | Admin |
| POST | `/api/studios/:studioId/bookings/:id/no-show` | Mark as no-show | Admin |

## Key Implementation Details

### Booking Flow (critical path)

1. Validate schedule slot exists and is active.
2. Determine `booking_date`: for one-time slots it is `specific_date`; for recurring slots the client must specify the date (validate it falls on the correct `day_of_week`).
3. Count existing confirmed bookings for this slot + date.
4. Compare against `max_participants` (slot override or class_type default).
5. UNIQUE constraint prevents same client booking same slot+date twice.
6. Insert booking in a transaction.
7. Emit `booking:confirmed` event on the event bus.

### Cancellation Flow

1. Verify booking belongs to requesting client (or requester is admin).
2. Set `status = 'cancelled'`, `cancelled_at = NOW()`.
3. Emit `booking:cancelled` event.
4. (Future: promote first waitlisted person.)

### Capacity Check Atomicity

The count + insert must be atomic. For MVP with low traffic, a transaction with a subquery-based insert is sufficient:

```sql
INSERT INTO bookings (...)
SELECT ... WHERE (SELECT count(*) FROM bookings WHERE ... AND status = 'confirmed') < :max
```

### booking_date Field

Essential for recurring slots. A recurring slot with `day_of_week = 3` (Wednesday) can have bookings for 2026-04-01, 2026-04-08, etc. The UNIQUE on `(schedule_slot_id, client_id, booking_date)` prevents double-booking per occurrence.

### Waitlist

Table is created but auto-promotion on cancellation is deferred. A simple join/leave endpoint is low cost and can be added as Phase 2.5.
