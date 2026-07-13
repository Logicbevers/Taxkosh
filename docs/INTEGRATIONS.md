# Third-Party Integrations — Status & Go-Live Checklist

Every integration below has a **graceful fallback** already built in, so the
platform runs (and demos) without any of them. Each one auto-enables the moment
its environment variables are set in Vercel — no code changes required unless
noted.

| # | Integration | Status / fallback | To finish | Provider | Priority |
|---|-------------|-------------------|-----------|----------|----------|
| 1 | Payments | ✅ **Configured & validated locally** (Razorpay **test** keys — real order created + webhook signature-verified → order marked PAID + invoice). Demo checkout is the fallback when unset. | **Prod:** add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` to Vercel; register webhook `https://www.taxkosh.com/api/payments/razorpay/webhook` (event `payment.captured`); swap test→**live** keys after merchant KYC | Razorpay | **P0 — revenue** |
| 2 | Document storage | ✅ **Configured & validated locally** — S3 bucket `taxkosh-documents-production` in `ap-south-1`, AES-256 at rest; app upload → object in S3, view → presigned URL. Local-disk (`/tmp` on Vercel) is the fallback when unset. | **Prod:** add `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` to Vercel (prod uploads stay ephemeral until then) | AWS S3 | **P0 — data loss risk** |
| 3 | Email | Simulated sends; signups auto-verify | Rotate the Resend key; verify taxkosh.com domain (SPF/DKIM); set `RESEND_API_KEY`, `EMAIL_FROM="TaxKosh <noreply@taxkosh.com>"` | Resend | P1 |
| 4 | SMS / phone OTP | Phone-verification step is **skipped in the purchase flow** while no provider is configured (`lib/sms.ts → isSmsConfigured()`) — real users could never receive the OTP | Set `MSG91_AUTH_KEY` (or Fast2SMS/Twilio) **and** add the actual send call in `app/api/auth/phone/send-otp/route.ts`; DLT registration required for Indian transactional SMS | MSG91 / Fast2SMS | P1 (deferred) |
| 5 | Google OAuth | Sign-in button hidden automatically | OAuth client with redirect `https://www.taxkosh.com/api/auth/callback/google`; set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud | P2 |
| 6 | WhatsApp notifications | Not built (in-app + email only) | WhatsApp Business API + approved templates; hook into `lib/notifications.ts → triggerStatusNotification()` | Meta Cloud API / Gupshup / Interakt | P1 roadmap |
| 7 | Error monitoring | Vercel function logs only | `@sentry/nextjs` + DSN | Sentry | P2 |
| 8 | Analytics | ✅ **DONE** — `@vercel/analytics` wired in the root layout; data appears in the Vercel dashboard automatically | Nothing | Vercel Analytics | ✅ |
| 9 | Rate-limit store | ✅ **Code done** — limiter uses Upstash REST when configured, memory otherwise (fails open on Redis errors) | Create free Upstash Redis; set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | P3 |
| 10 | Virus scanning | Stub — always passes (`scanFileForViruses`) | Real scan before accepting uploads | Cloudmersive / ClamAV | P3 |
| 11 | ERI e-filing | CAs file manually on the govt portal | e-Return Intermediary registration with the Income Tax Dept (regulatory process) | IT Dept ERI program | Long-term |

## Local vs Production (Vercel)

Integrations are wired in the **local `.env`** but **NOT yet on Vercel** — the
live site (www.taxkosh.com) still runs on fallbacks until these are added under
Vercel → Settings → Environment Variables (then redeploy):

| Var | Local | Vercel (prod) |
|-----|:-----:|:-------------:|
| `DATABASE_URL`, `DIRECT_URL` | ✅ | ✅ |
| `AUTH_SECRET`, `ENCRYPTION_KEY` | ✅ | ✅ |
| `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` | ✅ | ✅ |
| `RAZORPAY_*` (4) | ✅ test | ⬜ **pending** (use live keys) |
| `AWS_*` (4) | ✅ | ⬜ **pending** |
| `RESEND_API_KEY`, `EMAIL_FROM` | ⬜ | ⬜ |
| `ALLOW_DEMO_CHECKOUT=false` | n/a | ⬜ set before real traffic |

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

- The Resend API key, Neon DB password, Razorpay **test** secret, and AWS IAM
  keys used during development were shared in chat sessions — **rotate all of
  them** before real customer data / money flows, and generate fresh values for
  production Vercel.
- Use Razorpay **live** keys on prod (the ones in local `.env` are test keys).
- The S3 IAM user is scoped to `PutObject`/`GetObject` on the one bucket only
  (least privilege) — keep it that way; don't attach broader policies.
- Change the seeded admin password (`admin@taxkosh.in` / `Admin@1234`) after
  first login.
