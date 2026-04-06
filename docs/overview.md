# Bendlab MVP Overview

## What is Bendlab?

A platform for managing a stretching / calisthenics studio: online booking, scheduling, client management, progress tracking, subscriptions, and payments.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Node.js (no TypeScript) | JSDoc + `.d.ts` for type safety |
| Framework | Custom (node:http) | Full control, zero framework deps |
| Database | PostgreSQL | Relational data, native UUID, JSONB |
| Auth | Custom JWT (node:crypto) | No third-party auth deps |
| Notifications | Telegram + Email | Both channels from MVP |
| Roles | Client + Admin | Admin manages everything; trainer role deferred |
| Multi-studio | Yes, from day one | `studio_id` in all tables |
| Architecture | Monolith, API-first | UI built separately later |
| Dependencies | Minimal, encapsulated in `src/lib/` | Routes and services never import third-party packages directly |

## Architecture

```
src/
  index.js                     # Entry point: config -> server -> listen
  migrate.js                   # Migration CLI entry point
  app/
    index.js                   # App bootstrap: creates context, wires routes
    context.js                 # AppContext typedef: { db, config, bus, qb }
    api/                       # Route handlers grouped by domain
    webhooks/                  # External webhook receivers
  middleware/
    auth.js                    # JWT verification, req.user
    require-role.js            # Role-based access control
  lib/
    pg/                        # PostgreSQL driver wrapper (pg package)
    auth/                      # Password hashing (scrypt), JWT (HMAC-SHA256)
    validator/                 # Schema-based request body validation
    migration/                 # File-based migration runner
    notification/              # Notification service + providers
    payment/                   # Payment service + providers
    config/                    # (existing) Multi-provider config system
    http/                      # (existing) HTTP server, router, client
    event-emitter/             # (existing) Event bus
    query-builder/             # (existing) SQL query builder
    pool/                      # (existing) Generic resource pool
    graph/                     # (existing) DAG utilities
  migrations/                  # Numbered SQL migration files
  result/                      # (existing) Ok/Err result monad
  store/                       # (existing) Store abstraction
  schema/                      # Validation schemas per entity
```

## Cross-Cutting Patterns

### AppContext

Every router factory receives a single context object instead of individual dependencies:

```js
/** @type {{ db: PgClient, config: Config, bus: EventEmitter, qb: QueryBuilder }} */
const ctx = { db, config, bus, qb };
```

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "BOOKING_CAPACITY_FULL",
    "message": "This class is fully booked",
    "details": {}
  }
}
```

### Pagination

All list endpoints accept `?page=1&limit=20` and return:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

### Studio Scoping

All domain queries include `WHERE studio_id = :studioId`. A helper function prepends this condition automatically.

### Timestamps

All tables use `TIMESTAMP WITH TIME ZONE`. The application works in UTC internally. The `studios.timezone` field is for display/formatting only.

## Phases

| Phase | Focus | Tables | Est. Tasks |
|-------|-------|--------|------------|
| 0 | Foundation (PG, auth, migrations, joins, validation) | `users`, `migrations` | 16 |
| 1 | Studios & Schedule | `studios`, `rooms`, `class_types`, `schedule_slots` | 13 |
| 2 | Bookings | `bookings`, `waitlist` | 8 |
| 3 | Notifications | `notification_preferences`, `notification_log` | 10 |
| 4 | Client Management & Progress | `client_profiles`, `subscriptions`, `progress_records` | 11 |
| 5 | Admin Panel API | (no new tables) | 8 |
| 6 | Payments | `payments`, `subscription_plans` | 9 |

See individual phase docs for full details.
