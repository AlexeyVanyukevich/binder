# Phase 1: Studios & Schedule — Tasks

## Studio CRUD

- [ ] `1.1a` Create migration `002_create_studios.js`
- [ ] `1.1b` Create studio store/service layer
- [ ] `1.1c` Create studio router with full CRUD
- [ ] `1.1d` Add validation schemas for studio create/update

## Rooms CRUD

- [ ] `1.2a` Create migration `003_create_rooms.js`
- [ ] `1.2b` Create room store/service
- [ ] `1.2c` Create room router nested under studios

## Class Types CRUD

- [ ] `1.3a` Create migration `004_create_class_types.js`
- [ ] `1.3b` Create class type store/service
- [ ] `1.3c` Create class type router nested under studios

## Schedule Slots

- [ ] `1.4a` Create migration `005_create_schedule_slots.js` with CHECK constraint and indexes
- [ ] `1.4b` Create schedule service with end_time computation and conflict detection
- [ ] `1.4c` Create schedule router with CRUD endpoints
- [ ] `1.4d` Implement available slots endpoint with JOIN query for remaining capacity
- [ ] `1.4e` Add studio scoping helper and integrate across all routes
