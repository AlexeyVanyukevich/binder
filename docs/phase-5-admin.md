# Phase 5: Admin Panel API

## Goal

Comprehensive admin API: dashboard data, client management with search, schedule management with conflict detection, and basic analytics/reports.

## Dependencies

Phases 1–4 complete.

## Database Tables

No new tables. This phase builds aggregation queries and convenience endpoints on top of existing tables.

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/studios/:studioId/dashboard` | Today's schedule, upcoming bookings (24h), recent activity, stats | Admin |
| GET | `/api/studios/:studioId/clients?search=&page=&limit=` | Client list with search and pagination | Admin |
| GET | `/api/studios/:studioId/clients/:clientId/detail` | Full client detail: profile, visits, subscriptions, progress, notes | Admin |
| PUT | `/api/studios/:studioId/clients/:clientId/notes` | Update admin notes on client | Admin |
| GET | `/api/studios/:studioId/schedule/conflicts` | Detect scheduling conflicts | Admin |
| GET | `/api/studios/:studioId/reports/attendance` | Attendance stats: by date range, class type, trainer | Admin |
| GET | `/api/studios/:studioId/reports/revenue` | Revenue summary: by period, subscription type | Admin |
| GET | `/api/studios/:studioId/reports/clients` | Client stats: new registrations, retention, visit frequency | Admin |

## Key Implementation Details

### Dashboard Endpoint

Single endpoint returning composite response, sub-queries run in parallel with `Promise.all()`:

```js
{
  todaySchedule: [...],        // schedule_slots for today with booking counts
  upcomingBookings: [...],     // bookings in next 24h with client names
  recentActivity: [...],       // last 10 bookings/cancellations
  stats: {
    totalClientsToday: 5,
    totalBookingsToday: 12,
    capacityUtilization: 0.75
  }
}
```

### Client Search

`ILIKE` operator (PostgreSQL) for case-insensitive search across `first_name`, `last_name`, `email`, `phone`. Pagination via `LIMIT`/`OFFSET` from existing query builder.

### Client Detail Composite

Aggregates from `client_profiles`, `bookings` (recent visits), `subscriptions` (active), `progress_records` (latest) — all queries run in parallel.

### Reports — Raw SQL

Aggregation queries (`COUNT`, `GROUP BY`, date ranges) go beyond current query builder capabilities. Pragmatic MVP approach: use raw SQL via `db.query(sql, params)` directly. Keep report queries in `src/app/api/reports/queries.js`.

### Schedule Conflict Detection

Query for overlapping time ranges in the same room:

```sql
SELECT a.id, b.id FROM schedule_slots a, schedule_slots b
WHERE a.room_id = b.room_id
  AND a.id < b.id
  AND a.day_of_week = b.day_of_week
  AND a.start_time < b.end_time
  AND b.start_time < a.end_time
```

### Bulk Schedule Operations

Create recurring slots for N weeks ahead: given a recurring slot template, generate one-time slots for each occurrence in the specified date range.
