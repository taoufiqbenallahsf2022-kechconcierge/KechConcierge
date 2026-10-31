# Stripe payment testing

## Automated mock tests

These tests do not call Stripe and do not require API keys.

```powershell
cd apps/admin-api
npm run test:payments
```

They cover Checkout Session creation, server-owned amounts, idempotency,
currency conversion, duplicate-session reuse, payment-state transitions,
signed webhook verification, and raw webhook request bodies.

## Local Stripe test payment

1. In Stripe Dashboard, switch **Test mode** on, open **Developers → API
   keys**, and reveal the test secret key (`sk_test_...`).
2. Add it to `apps/admin-api/.env`:

   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PUBLIC_WEBSITE_URL=http://localhost:3000
   ```

3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then run its
   webhook listener. Copy the `whsec_...` value it prints
   into `STRIPE_WEBHOOK_SECRET`, then restart the Admin API.

   ```powershell
   stripe login
   stripe listen --forward-to localhost:8081/api/public/stripe/webhook
   ```

4. Start the project, create an order in Admin, request an advance payment,
   open the emailed link, and continue to Stripe Checkout.
5. Use Stripe's successful test card:

   ```text
   Card: 4242 4242 4242 4242
   Expiry: any future date
   CVC: any 3 digits
   Postal code: any valid value
   ```

Useful failure cases:

```text
3DS authentication: 4000 0025 0000 3155
Declined payment:    4000 0000 0000 9995
```

Only use these card numbers while Stripe is in test mode.

## Staging and production

Create a webhook endpoint for each environment using:

```text
https://{PUBLIC_ADMIN_API_HOST}/api/public/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

Each environment needs its own `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`. Live mode must use `sk_live_...` and the webhook
secret generated for the live endpoint.
