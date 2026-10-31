# Performance reporting

The admin Performance studio uses the existing CRM records for contacts, live chats, and page visits. Email totals come from Resend's Metrics API, while individual delivery, open, click, and bounce rows are saved from signed Resend webhooks.

## Resend setup

1. Deploy the admin API.
2. In Resend, create a webhook pointing to:

   `https://YOUR-ADMIN-API/api/public/resend/webhook`

3. Subscribe it to `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, and `email.bounced`.
4. Copy its signing secret into the admin API environment as `RESEND_WEBHOOK_SECRET`.
5. Keep `RESEND_API_KEY` in the admin API environment. It is used for the historical aggregate metrics and sent-email backfill.

The local webhook can be tested with a secure tunnel to port `8081`; use the tunnel URL followed by `/api/public/resend/webhook` and its own signing secret.
