# MoorishConcierge Website

Updated frontend version for the MoorishConcierge tourism website.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Included

- Correct brand: MoorishConcierge
- Home page
- About page
- Services page
- Contact page
- Separate `/chat` page
- Login/sign-up modal simulation
- Floating contact button with 3 options:
  - WhatsApp
  - Contact form
  - Chat page
- Horizontal scroll sections with arrow buttons
- More mock data for villas, apartments, activities, transportation, SPA, restaurants
- Detail pages with image gallery and selectable thumbnails
- Category pages with pagination structure
- Mock data ready to replace later with API calls

## Main data file

```txt
src/lib/catalog.ts
```
# Public payment page

Set `NEXT_PUBLIC_ADMIN_API_URL` to the public admin API base URL (including `/api`). Emailed payment links use it to create a hosted Stripe Checkout Session and verify the payment when Stripe returns the client to the website.

Stripe secret keys and webhook secrets belong in `apps/admin-api`; never expose them through a `NEXT_PUBLIC_` website variable.
