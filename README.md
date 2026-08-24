# Haiku-ly

Haiku-ly is a small DeepSeek-powered haiku studio. It creates a random 5–7–5 poem or builds one from a short keyword or phrase. The user can write in English, 中文, or 日本語; English is the default.

Both modes use the DeepSeek Chat Completions API. English poems use a 5–7–5 syllable pattern. Chinese poems use a 5–7–5 Han-character pattern. Each poem must pass the local form check and a separate DeepSeek common-sense review before Haiku-ly displays it. Haiku-ly returns a clear error when DeepSeek is unavailable. It does not generate a local fallback poem.

Visitors can also request one haiku by email each day. The service uses Resend for outbound email and Cloudflare D1 for subscriber data. It requires email confirmation before activation. It encrypts email addresses in D1 and includes a one-click unsubscribe link in every daily email.

## Local development

Use Node.js 22.13 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the local values from `.env.example` to `.env.local`. `TOKEN_ENCRYPTION_KEY` must be a base64-encoded 32-byte value. You can generate one with:

```bash
openssl rand -base64 32
```

Do not commit `.env.local`.

Run the production checks with:

```bash
npm run build
npm test
npm run lint
npm run typecheck
```

## Resend setup

1. Create a free Resend account.
2. Add and verify `haikuly.fyi` as a sending domain. Resend adds its sending records under the `send` and DKIM host names, so the existing incoming-mail MX records can remain.
3. Create a sending API key.
4. Store the key in Cloudflare with `npx wrangler secret put RESEND_API_KEY`.
5. Confirm that `DEEPSEEK_API_KEY` and `TOKEN_ENCRYPTION_KEY` are also present with `npx wrangler secret list`.

The visible sender is `Haiku-ly <daily@haikuly.fyi>`. Replies go to `zhiguoinusa@gmail.com`. The daily Cron Trigger runs at `08:00 UTC`. The free-plan safeguards limit the daily issue to 90 recipients and limit confirmation messages to 10 per day.

## Direct Cloudflare deployment

This project deploys directly to Cloudflare Workers. It does not use OpenAI Sites for hosting.

```bash
npm run build
npx wrangler d1 migrations apply haikuly-subscriptions-prod --remote
npx wrangler deploy --dry-run
npx wrangler deploy
```
