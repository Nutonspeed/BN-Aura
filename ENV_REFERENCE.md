# BN-Aura Environment Variables Reference

## Required — Core Services

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJ...` |

## Authentication

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | NextAuth.js secret for session encryption |
| `NEXTAUTH_URL` | App base URL (e.g. `https://bn-aura.vercel.app`) |

## LINE Integration

| Variable | Description |
|----------|-------------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API channel access token |
| `LINE_CHANNEL_SECRET` | LINE Messaging API channel secret |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login channel secret |
| `LINE_LOGIN_REDIRECT_URI` | LINE Login callback URL |

## SMS Providers (choose one or more)

| Variable | Description |
|----------|-------------|
| `THAI_SMS_PLUS_API_KEY` | ThaiSMSPlus API key |
| `THAI_SMS_PLUS_SECRET` | ThaiSMSPlus secret |
| `SMSTO_API_KEY` | SMS.to API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number |

## Payments

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `OMISE_SECRET_KEY` | Omise secret key (Thai payments) |
| `OMISE_PUBLIC_KEY` | Omise public key |

## AI Services

| Variable | Description |
|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |

## Push Notifications (PWA)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key (generate with `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | VAPID private key |
| `VAPID_SUBJECT` | VAPID subject (e.g. `mailto:admin@bn-aura.com`) |

## Email

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend email API key |

## Monitoring

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps |

## Cron Jobs

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Secret token to authenticate Vercel Cron requests |

## Vercel (auto-set)

| Variable | Description |
|----------|-------------|
| `VERCEL_REGION` | Deployment region (auto-set by Vercel) |
| `VERCEL_URL` | Deployment URL (auto-set by Vercel) |

---

## Cron Job Schedule

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/reminders` | Every hour (`0 * * * *`) | Send appointment reminders (24h + 1h) |
| `/api/cron/cleanup` | Daily 3AM (`0 3 * * *`) | Clean expired OTPs, old notifications, stale push subs |
| `/api/cron/followups` | Every 2 hours (`0 */2 * * *`) | Trigger follow-up sequence steps |

## Quick Start

```bash
# 1. Clone and install
git clone <repo> && cd sudtailaw && npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Fill in required variables (Supabase URL + keys minimum)

# 4. Run dev server
npm run dev

# 5. Deploy
vercel --prod
```
