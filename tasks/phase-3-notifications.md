# Phase 3: Notifications — Tasks

## Notification Infrastructure

- [ ] `3.1a` Create notification service abstraction with provider interface
- [ ] `3.1b` Create migration for `notification_preferences` and `notification_log` tables
- [ ] `3.1c` Create message template system per event type per channel
- [ ] `3.1d` Wire event listeners to notification service in app bootstrap

## Telegram Provider

- [ ] `3.2a` Create Telegram bot wrapper using HTTP client
- [ ] `3.2b` Implement Telegram linking flow (code generation, webhook handler)
- [ ] `3.2c` Create notification preferences API endpoints

## Email Provider

- [ ] `3.3a` Create email provider wrapper (HTTP API based)
- [ ] `3.3b` Create email templates for booking events

## Reminders

- [ ] `3.4a` Create booking reminder scheduler (periodic task)
- [ ] `3.4b` Create notification history endpoint
- [ ] `3.4c` Add deduplication logic to prevent double-sending
