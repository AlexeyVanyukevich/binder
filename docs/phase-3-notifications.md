# Phase 3: Notifications

## Goal

The system sends notifications when key events occur (booking confirmed, cancelled, reminder). Both Telegram and email channels supported. Clients configure their notification preferences.

## Dependencies

Phase 0 (event emitter), Phase 2 (booking events to listen to).

## Database Tables

```sql
-- Migration: 008_create_notification_preferences.js
CREATE TABLE notification_preferences (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel   VARCHAR(20) NOT NULL,     -- 'email' | 'telegram'
  enabled   BOOLEAN NOT NULL DEFAULT true,
  config    JSONB,                     -- e.g. { "chat_id": "123456" } for telegram
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_channel UNIQUE(user_id, channel)
);

-- Migration: 009_create_notification_log.js
CREATE TABLE notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  channel     VARCHAR(20) NOT NULL,
  event_type  VARCHAR(50) NOT NULL,   -- 'booking:confirmed', 'booking:cancelled', 'booking:reminder'
  payload     JSONB,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed'
  error       TEXT,
  sent_at     TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/notifications/preferences` | Get current user's notification prefs | Client |
| PUT | `/api/notifications/preferences/:channel` | Update preference for a channel | Client |
| POST | `/api/notifications/preferences/telegram/link` | Initiate Telegram linking flow | Client |
| GET | `/api/notifications/history` | Notification history for current user | Client |

## Key Implementation Details

### Notification Service (`src/lib/notification/`)

```
src/lib/notification/index.js              -- send(userId, event, data)
src/lib/notification/provider/index.js     -- Provider interface: { send(to, message) -> Result }
```

Flow:
1. Look up user's notification preferences.
2. For each enabled channel, render the message template.
3. Dispatch to the appropriate provider.
4. Log the result in `notification_log`.

### Telegram Provider (`src/lib/telegram/`)

Uses the existing `src/lib/http/client/` to call Telegram Bot API:
- `sendMessage(chatId, text)` → `https://api.telegram.org/bot<token>/sendMessage`
- Bot token from config: `TELEGRAM__BOT_TOKEN`

**Linking flow**:
1. Client hits the link endpoint → generates a unique code.
2. Client sends this code to the Telegram bot.
3. Webhook route (`/webhooks/telegram`) receives the message, matches code → user, stores `chat_id` in preferences.

### Email Provider (`src/lib/email/`)

Uses HTTP API-based email service (e.g., Resend, SendGrid) via the HTTP client. Simpler than raw SMTP for MVP.

Config: `EMAIL__API_KEY`, `EMAIL__FROM_ADDRESS`, `EMAIL__PROVIDER`.

### Event Listeners

Registered in app bootstrap:

```js
bus.on('booking:confirmed', (data) => notificationService.send(data.clientId, 'booking:confirmed', data));
bus.on('booking:cancelled', (data) => notificationService.send(data.clientId, 'booking:cancelled', data));
```

### Booking Reminders

Scheduled task (via `setInterval` or separate cron process):
- Find bookings starting within the next N hours.
- Check `notification_log` to avoid double-sending.
- Dispatch reminders.

### Message Templates

Simple functions per event type per channel:

```js
const templates = {
  'booking:confirmed': {
    telegram: (data) => `Your ${data.className} class is booked for ${data.date} at ${data.time}!`,
    email: (data) => ({ subject: 'Booking Confirmed', body: `...` }),
  }
};
```
