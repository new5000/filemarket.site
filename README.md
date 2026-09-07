# FileMarket Digital Assets

A modern, high-performance digital marketplace and storefront built with React, TypeScript, Tailwind CSS, and Firebase.

---

> [!WARNING]
> ### ⚠️ CRITICAL SECURITY NOTICE: ROTATE PREVIOUS SECRETS IMMEDIATELY
> If you have previously committed credentials, bot tokens, or API keys directly to git history or source files prior to this secret safety remediation:
>
> 1. **Rotate Telegram Bot Tokens Immediately**: Revoke and generate a new token via Telegram's `@BotFather` (`/revoke`). Any previously committed token in git history is compromised and public.
> 2. **Rotate Payment Gateway Credentials**: Regenerate sandbox and live API secret keys for Stripe, PayPal, Razorpay, SSLCommerz, ShurjoPay, AamarPay, Paystack, and Flutterwave.
> 3. **Purge Git History**: If this repository was pushed to a public remote, rewrite git history (using tools such as `git filter-repo` or BFG Repo-Cleaner) to purge historical commits containing secret literals.

---

## 🔒 Secret Safety & Environment Variable Architecture

FileMarket follows strict least-privilege security architecture:

1. **Client-Side Variables (`VITE_*`)**:
   - Only non-sensitive, public identifiers are prefixed with `VITE_` (e.g., `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYPAL_CLIENT_ID`, Firebase Web configuration).
   - These are visible in client browser DevTools and must never contain private secrets.

2. **Server-Side Only Secrets**:
   - Private keys such as `STRIPE_SECRET_KEY`, `PAYPAL_SECRET_KEY`, `GEMINI_API_KEY`, database connection strings (`DATABASE_URL`), and gateway merchant passwords must remain on the server and must **never** use the `VITE_` prefix.

3. **Ignored Configuration Files**:
   - `.env`, `.env.local`, and any local secret files are strictly listed in `.gitignore` and must never be tracked by version control.
   - Refer to `.env.example` for all configurable environment keys.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your project keys:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```

---

## 💳 Payment Gateway Setup

FileMarket includes resilient built-in mock fallback configurations for all active gateways so the application builds, previews, and tests seamlessly without crashing even before custom keys are added.

Active gateways can be configured in **Admin Settings** (`/admin` -> Payment Settings) or via client environment variables:

| Gateway | Public Variable (Client-Safe) | Default / Sandbox Fallback |
|---|---|---|
| **Stripe** | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_sample_stripe_filemarket` |
| **PayPal** | `VITE_PAYPAL_CLIENT_ID` | `sb-sample-paypal-client-id` |
| **SSLCommerz** | `VITE_SSLCOMMERZ_STORE_ID` | `testbox` |
| **ShurjoPay** | `VITE_SHURJOPAY_USERNAME` | `sp_sandbox_merchant` |
| **AamarPay** | `VITE_AAMARPAY_STORE_ID` | `aamarpaytest` |
| **Razorpay** | `VITE_RAZORPAY_KEY_ID` | `rzp_test_sample_razorpay_key` |
| **bKash, Nagad, Rocket, Upay** | Configured in Admin UI | Direct Merchant Number & Instructions |

---

## 📱 Telegram Order Notifications (Optional)

Real-time instant admin push alerts are strictly optional and disabled by default. If desired, you can configure them via:
- Admin Panel -> Telegram Settings
- Or via environment variables: `VITE_TELEGRAM_BOT_TOKEN` and `VITE_TELEGRAM_CHAT_ID`.
