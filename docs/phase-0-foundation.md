# Phase 0: Foundation

## Goal

Fill every framework gap required before business features can be built. After this phase the system can: connect to PostgreSQL with pooling, run migrations, authenticate users with JWT, authorize by role, validate request bodies, and execute queries with JOINs.

## Dependencies

None — this is the foundation.

## Database Tables

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'client',  -- 'client' | 'admin'
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register new user (email, password) | None |
| POST | `/api/auth/login` | Login, returns JWT access + refresh token | None |
| POST | `/api/auth/refresh` | Refresh access token | None |
| GET | `/api/auth/me` | Get current user profile | Required |

## Key Implementation Details

### 0.1 — Bootstrap Cleanup

Fix `src/index.js` imports (`./config` → `./lib/config`, `./http/server` → `./lib/http/server`). Remove dead references to `../bus` and `../workflow` in app. Introduce `AppContext` pattern:

```js
// src/app/context.js
/**
 * @typedef {Object} AppContext
 * @property {import('../lib/pg').PgClient} db
 * @property {import('../lib/config').Config} config
 * @property {import('../lib/event-emitter').EventEmitter} bus
 * @property {import('../lib/query-builder').QueryBuilder} qb
 */
```

### 0.2 — PostgreSQL Driver Wrapper (`src/lib/pg/`)

Wrap the `pg` npm package. Expose the same `DatabaseClient` interface already defined in `src/store/database/index.d.ts`: `query<T>(sql, params?) -> Promise<QueryResult<T>>`. Internally creates a `pg.Pool` with config from the config system (`DATABASE__HOST`, `DATABASE__PORT`, `DATABASE__NAME`, `DATABASE__USER`, `DATABASE__PASSWORD`, `DATABASE__MAX_CONNECTIONS`).

Public API: `connect()`, `query()`, `end()`.

### 0.3 — Query Builder PostgreSQL Dialect (`src/lib/pg/query-builder/`)

**The base query builder must not be modified.** All PG-specific behavior lives in a wrapper layer under `src/lib/pg/query-builder/`.

The PG query builder wraps the base QB output and applies dialect-specific transformations:

1. **Placeholder rewriting**: The base QB emits `?` placeholders. The PG wrapper post-processes the compiled `{ sql, params }` to replace `?` with `$1, $2, ...` via a single pass.

2. **INSERT RETURNING**: The PG wrapper provides its own `insert(table, record, options)` that calls the base `insert()`, then appends `RETURNING *` (or specific columns) to the resulting SQL when `options.returning` is set.

3. **Type mappings**: The PG wrapper provides its own `createTable()` / column definition helpers that override type mappings:
   - `uuid` → `UUID` (native, not `CHAR(36)`)
   - `timestamptz` → `TIMESTAMP WITH TIME ZONE`

4. **General pattern**: Every method delegates to the base QB, then transforms the result. The base stays dialect-agnostic.

```
src/lib/pg/query-builder/
  index.js        -- pgQueryBuilder(baseQb) wrapper factory
  index.d.ts      -- PgQueryBuilder type extending base QueryBuilder
```

### 0.4 — JOIN Support (`src/lib/pg/query-builder/`)

JOIN is a PG dialect extension. The PG query builder's `select()` method extends the base `SelectOptions` interface with an optional `joins` field:

```js
// PG select() — same signature as base, extended options
select(table, {
  columns: [...],
  joins: [{                          // new, PG-only option
    type: 'INNER' | 'LEFT' | 'RIGHT',
    table: string,
    on: { left: string, operation: string, right: string },
    alias?: string
  }],
  where: ...,
  orderBy: ...,
  limit: ...,
  offset: ...
})
```

The PG wrapper intercepts `select()`, extracts `joins` from options, delegates the rest to the base QB, then splices the JOIN clause into the compiled SQL between `FROM` and `WHERE`. Same interface, extended capabilities.

### 0.5 — Migration System (`src/lib/migration/`)

File-based migrations in `src/migrations/`. Each file exports `up(client)` and `down(client)`. The runner:

1. Creates `migrations` table if it doesn't exist.
2. Reads files from `src/migrations/` sorted by name (convention: `001_create_users.js`).
3. Queries `migrations` table for already-applied names.
4. Runs `up()` for each unapplied migration inside a transaction.
5. Records the migration name in the `migrations` table.
6. The `down` command rolls back the last N migrations.

NPM scripts: `"migrate": "node src/migrate.js"`, `"migrate:down": "node src/migrate.js down"`.

### 0.6 — Auth System (`src/lib/auth/`)

- **Password hashing**: `node:crypto` with `scrypt`. No bcrypt dependency. Format: `salt:derivedKey` where salt is 16 random bytes hex-encoded.
- **JWT**: `node:crypto` HMAC-SHA256. Functions: `signToken(payload, secret, expiresInSeconds)`, `verifyToken(token, secret)`. Payload: `{ sub: userId, role, iat, exp }`.
- **Token pair**: Access token (15 min), refresh token (7 days). Refresh tokens stored in `refresh_tokens` table or in-memory for MVP.

### 0.7 — Auth Middleware

Middleware function registered via `router.use(authMiddleware)`:

1. Reads `Authorization: Bearer <token>` header.
2. Verifies JWT.
3. Attaches `req.user = { id, role }` to request.
4. Calls `next()` on success; returns 401 on failure.

For public routes (register, login): place them before the middleware in the router queue.

`requireRole('admin')` — middleware factory that checks `req.user.role`, returns 403 if mismatched.

### 0.8 — Request Body Validation (`src/lib/validator/`)

Schema-based validator:

```js
const schema = {
  email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: 'string', required: true, minLength: 8 },
};
```

`validate(body, schema)` returns `Result<T>` — either `ok(parsedBody)` or `err(validationErrors)`.

Helper: `parseBody(req, schema)` combines `req.getBody()` + JSON parse + validation into one call.

## Module Convention

Every new module must have both `index.js` and `index.d.ts` files — no exceptions.

## New Modules to Create

- `src/lib/pg/index.js` + `index.d.ts` — PostgreSQL driver wrapper
- `src/lib/pg/query-builder/index.js` + `index.d.ts` — PG dialect wrapper over base QB
- `src/lib/migration/index.js` + `index.d.ts` — Migration runner
- `src/lib/auth/index.js` + `index.d.ts` — Password hashing + JWT
- `src/lib/validator/index.js` + `index.d.ts` — Request body validation
- `src/middleware/auth/index.js` + `index.d.ts` — Auth middleware + requireRole
- `src/app/context/index.js` + `index.d.ts` — AppContext typedef

## Existing Files to Modify

- `src/index.js` — fix imports, wire PG client
- `src/app/index.js` — remove dead refs, accept AppContext

## Files NOT Modified

- `src/lib/query-builder/**` — base query builder stays untouched; PG-specific features live in `src/lib/pg/query-builder/`
