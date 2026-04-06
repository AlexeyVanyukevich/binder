# Phase 6: Payments — Tasks

## Subscription Plans

- [ ] `6.1a` Create migration `014_create_subscription_plans.js`
- [ ] `6.1b` Create subscription plan CRUD service and endpoints

## Payment Core

- [ ] `6.2a` Create migration `013_create_payments.js`
- [ ] `6.2b` Create payment provider abstraction and manual provider
- [ ] `6.2c` Create Stripe provider wrapper
- [ ] `6.2d` Implement purchase flow: initiate, create pending payment, return redirect
- [ ] `6.2e` Implement webhook handler with signature verification
- [ ] `6.2f` Wire payment completion to subscription creation via events

## Trial & History

- [ ] `6.3a` Create migration `015_add_trial_flag.js`
- [ ] `6.3b` Implement trial lesson redemption flow
- [ ] `6.3c` Create payment listing endpoints (admin and client)
