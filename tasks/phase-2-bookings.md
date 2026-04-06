# Phase 2: Bookings — Tasks

## Booking Core

- [ ] `2.1a` Create migration `006_create_bookings.js`
- [ ] `2.1b` Create booking service with capacity check and double-booking prevention
- [ ] `2.1c` Create booking router: create, cancel, list endpoints
- [ ] `2.1d` Implement `GET /api/bookings/my` for client's own bookings
- [ ] `2.1e` Implement booking completion and no-show marking for admin
- [ ] `2.1f` Emit booking events on the event bus (`booking:confirmed`, `booking:cancelled`, `booking:completed`)

## Waitlist (optional)

- [ ] `2.2a` Create migration `007_create_waitlist.js`
- [ ] `2.2b` Create waitlist service with position management
- [ ] `2.2c` Create waitlist join/leave endpoints
