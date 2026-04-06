# Phase 6: Payments

## Goal

Support subscription purchases with payment tracking, payment provider abstraction, trial lessons, and webhook-based payment confirmations.

## Dependencies

Phase 4 complete (subscriptions, client profiles).

## Database Tables

```sql
-- Migration: 013_create_payments.js
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id           UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id     UUID REFERENCES subscriptions(id),
  amount              NUMERIC(10, 2) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                      -- 'pending' | 'completed' | 'failed' | 'refunded'
  provider            VARCHAR(50) NOT NULL,     -- 'stripe' | 'manual' | 'trial'
  provider_payment_id VARCHAR(255),              -- external payment ID
  metadata            JSONB,                     -- provider-specific data
  paid_at             TIMESTAMP WITH TIME ZONE,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_client ON payments(client_id, studio_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

-- Migration: 014_create_subscription_plans.js
CREATE TABLE subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id       UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  type            VARCHAR(20) NOT NULL,     -- 'visits' | 'unlimited'
  total_visits    INTEGER,                   -- NULL for unlimited
  duration_days   INTEGER NOT NULL,          -- validity period
  price           NUMERIC(10, 2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Migration: 015_add_trial_flag.js
ALTER TABLE client_profiles ADD COLUMN has_used_trial BOOLEAN NOT NULL DEFAULT false;
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/studios/:studioId/subscription-plans` | Create subscription plan | Admin |
| GET | `/api/studios/:studioId/subscription-plans` | List available plans | Public |
| PUT | `/api/studios/:studioId/subscription-plans/:id` | Update plan | Admin |
| DELETE | `/api/studios/:studioId/subscription-plans/:id` | Deactivate plan | Admin |
| POST | `/api/studios/:studioId/payments/purchase` | Initiate subscription purchase (`{ plan_id }`) | Client |
| POST | `/api/studios/:studioId/payments/manual` | Record manual/cash payment | Admin |
| GET | `/api/studios/:studioId/payments` | List payments (filter: client, date, status) | Admin |
| GET | `/api/payments/my` | Current user's payments | Client |
| POST | `/api/webhooks/payments/:provider` | Payment webhook | Public (signature verified) |
| POST | `/api/studios/:studioId/trial` | Redeem trial lesson | Client |

## Key Implementation Details

### Payment Provider Abstraction (`src/lib/payment/`)

```
src/lib/payment/index.js                   -- PaymentService
src/lib/payment/provider/index.d.ts        -- PaymentProvider interface
src/lib/payment/provider/stripe/index.js   -- Stripe implementation
src/lib/payment/provider/manual/index.js   -- Manual/cash (no external call)
```

Provider interface:
```js
{
  createPayment(amount, currency, metadata) -> Result<{ id, redirect_url }>
  verifyWebhook(body, signature, secret) -> Result<PaymentEvent>
}
```

### Purchase Flow

1. Client selects a plan, calls `/payments/purchase`.
2. Service creates `payments` row with `status = 'pending'`.
3. Calls payment provider to create a session (e.g., Stripe Checkout).
4. Returns redirect URL to client.
5. Client completes payment on provider's page.
6. Provider sends webhook to `/webhooks/payments/stripe`.
7. Webhook handler verifies signature, updates `payments.status = 'completed'`, creates `subscriptions` row.
8. Emits `payment:completed` event.

### Manual Payment

Admin records cash/card payment directly. Creates both `payments` row (`status = 'completed'`, `provider = 'manual'`) and `subscriptions` row immediately.

### Trial Lesson

1. Check `client_profiles.has_used_trial` for the studio.
2. If false: create payment (`amount = 0`, `provider = 'trial'`) and subscription (`type = 'trial'`, `total_visits = 1`).
3. Set `has_used_trial = true`.

### Webhook Security

Each provider has its own signature verification. The webhook route extracts raw body + signature header, delegates to `provider.verifyWebhook()`. Returns 200 immediately, processes asynchronously via event emission.
