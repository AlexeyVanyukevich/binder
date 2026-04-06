# Phase 0: Foundation — Tasks

## PostgreSQL Driver

- [ ] `0.2a` Install `pg` package, create `src/lib/pg/index.js` + `index.d.ts` — pool wrapper, `connect()`, `query()`, `end()`

## PG Query Builder (dialect wrapper, base QB unchanged)

- [ ] `0.3a` Create `src/lib/pg/query-builder/index.js` + `index.d.ts` — wrapper factory over base QB
- [ ] `0.3b` Implement placeholder rewriting (`?` → `$N`) as post-processing in PG wrapper
- [ ] `0.3c` Add `RETURNING` support to PG wrapper's `insert()` method
- [ ] `0.3d` Override UUID and timestamp type mappings in PG wrapper
- [ ] `0.4a` Extend PG wrapper's `select()` to accept optional `joins` in options — JOIN compilation with `$N` placeholders
- [ ] `0.4b` Create `src/lib/pg/query-builder/join/index.js` + `index.d.ts` — JOIN AST and compiler

## Migration System

- [ ] `0.5a` Create `src/lib/migration/index.js` + `index.d.ts` — runner core: read files, track state in `migrations` table
- [ ] `0.5b` Implement `up` and `down` commands with transaction wrapping
- [ ] `0.5c` Create `src/migrate.js` CLI entry point and npm scripts
- [ ] `0.5d` Write initial migration `001_create_users.js`

## Auth System

- [ ] `0.6a` Create `src/lib/auth/index.js` + `index.d.ts` — password hashing with `node:crypto` scrypt
- [ ] `0.6b` Add JWT sign/verify with `node:crypto` HMAC-SHA256 to auth module
- [ ] `0.6c` Create auth service: register, login, refresh token logic
- [ ] `0.6d` Create auth routes: POST `/register`, POST `/login`, POST `/refresh`, GET `/me`
- [ ] `0.7a` Create `src/middleware/auth/index.js` + `index.d.ts` — auth middleware and `requireRole` factory
- [ ] `0.7b` Extend `ServerRequest` type (`index.d.ts`) to include `user` property

## Validation & Bootstrap

- [ ] `0.8a` Create `src/lib/validator/index.js` + `index.d.ts` — schema-based validation returning Result
- [ ] `0.8b` Create `parseBody(req, schema)` helper in validator module
- [ ] `0.1a` Fix entry point imports, remove dead bus/workflow references, clean bootstrap
- [ ] `0.1b` Create `src/app/context/index.js` + `index.d.ts` — AppContext typedef
- [ ] `0.1c` Wire up PG client creation in server startup, pass through app context
