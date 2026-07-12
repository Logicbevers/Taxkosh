# Third-Party Integrations — Status & Go-Live Checklist

Every integration below has a **graceful fallback** already built in, so the
platform runs (and demos) without any of them. Each one auto-enables the moment
its environment variables are set in Vercel — no code changes required unless
noted.

| # | Integration | Fallback today | To go live | Provider | Priority |
|---|-------------|----------------|-----------|----------|----------|
| 1 | Payments | Demo checkout (auto-settles, no real money) | Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`; register webhook `https://www.taxkosh.com/api/payments/razorpay/webhook` (event: `payment.captured`) in the Razorpay dashboard | Razorpay | **P0 — revenue** |
| 2 | Document storage | `/tmp` on Vercel — **ephemeral, uploads are lost** | Create S3 bucket (ap-south-1) + IAM user with PutObject/GetObject; set `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS S3 | **P0 — data loss risk** |
| 3 | Email | Simulated sends; signups auto-verify | Rotate the Resend key; verify taxkosh.com domain (SPF/DKIM); set `RESEND_API_KEY`, `EMAIL_FROM="TaxKosh <noreply@taxkosh.com>"` | Resend | P1 |
| 4 | SMS / phone OTP | Phone-verification step is **skipped in the purchase flow** while no provider is configured (`lib/sms.ts → isSmsConfigured()`) — real users could never receive the OTP | Set `MSG91_AUTH_KEY` (or Fast2SMS/Twilio) **and** add the actual send call in `app/api/auth/phone/send-otp/route.ts`; DLT registration required for Indian transactional SMS | MSG91 / Fast2SMS | P1 (deferred) |
| 5 | Google OAuth | Sign-in button hidden automatically | OAuth client with redirect `https://www.taxkosh.com/api/auth/callback/google`; set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud | P2 |
| 6 | WhatsApp notifications | Not built (in-app + email only) | WhatsApp Business API + approved templates; hook into `lib/notifications.ts → triggerStatusNotification()` | Meta Cloud API / Gupshup / Interakt | P1 roadmap |
| 7 | Error monitoring | Vercel function logs only | `@sentry/nextjs` + DSN | Sentry | P2 |
| 8 | Analytics | ✅ **DONE** — `@vercel/analytics` wired in the root layout; data appears in the Vercel dashboard automatically | Nothing | Vercel Analytics | ✅ |
| 9 | Rate-limit store | ✅ **Code done** — limiter uses Upstash REST when configured, memory otherwise (fails open on Redis errors) | Create free Upstash Redis; set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | P3 |
| 10 | Virus scanning | Stub — always passes (`scanFileForViruses`) | Real scan before accepting uploads | Cloudmersive / ClamAV | P3 |
| 11 | ERI e-filing | CAs file manually on the govt portal | e-Return Intermediary registration with the Income Tax Dept (regulatory process) | IT Dept ERI program | Long-term |

## Fallback-detection logic (where each toggle lives)

- **Razorpay:** `lib/razorpay.ts → isRazorpayConfigured()` — placeholder keys are
  treated as unconfigured; the demo-settlement endpoint
  (`/api/payments/demo/complete`) returns 403 once real keys exist.
- **S3:** `lib/s3.ts → S3_CONFIGURED` — unset bucket → local-disk storage
  (`.local-uploads/` locally, `/tmp` on Vercel).
- **Email:** `lib/mailer.ts → getValidResendKey()` — placeholder/absent key →
  simulated sends; registration auto-verifies users when delivery is impossible.
- **Google OAuth:** `lib/auth.ts → googleAuthEnabled` — provider not registered
  and the login button hidden when creds are placeholders.
- **Env policy:** `lib/env.ts` — only `DATABASE_URL`, `AUTH_SECRET`,
  `ENCRYPTION_KEY` are fatal; all integrations above warn instead of crashing.

## ⚠ Before real marketing traffic

- Set `ALLOW_DEMO_CHECKOUT=false` in Vercel (or configure real Razorpay keys).
  While demo checkout is on, any visitor can "pay" and claim a service for
  free — fine for stakeholder demos, not for the open internet.

## Security notes

- The Resend API key and Neon DB password used during development were shared
  in a chat session — **rotate both** before real customer data flows.
- Change the seeded admin password (`admin@taxkosh.in`) after first login.
