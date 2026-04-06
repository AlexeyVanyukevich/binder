# Phase 4: Client Management & Progress — Tasks

## Client Profiles

- [ ] `4.1a` Create migration `010_create_client_profiles.js`
- [ ] `4.1b` Create client profile service with auto-creation on first booking
- [ ] `4.1c` Create client management endpoints (admin) and profile endpoints (client)
- [ ] `4.1d` Create visit history endpoint using JOIN query

## Subscriptions

- [ ] `4.2a` Create migration `011_create_subscriptions.js`
- [ ] `4.2b` Create subscription service: create, extend, revoke, check balance
- [ ] `4.2c` Create subscription CRUD endpoints
- [ ] `4.2d` Wire `booking:completed` event to subscription deduction
- [ ] `4.2e` Create subscription expiration check (scheduled task)

## Progress Tracking

- [ ] `4.3a` Create migration `012_create_progress_records.js`
- [ ] `4.3b` Create progress service and endpoints
- [ ] `4.3c` Create `/api/progress/my` endpoint for client self-view
