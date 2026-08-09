# Stillpoint

Stillpoint is a small DeepSeek-powered haiku studio. It creates a random 5–7–5 poem or builds one from a short keyword or phrase. The user can write in English or 中文; English is the default.

Both modes use the DeepSeek Chat Completions API. English poems use a 5–7–5 syllable pattern. Chinese poems use a 5–7–5 Han-character pattern. Each poem must pass the local form check and a separate DeepSeek common-sense review before the Site displays it. The Site returns a clear error when DeepSeek is unavailable. It does not generate a local fallback poem.

## Local development

Use Node.js 22.13 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add a DeepSeek API key to `.env.local` to enable generation. Do not commit `.env.local`.

Run the production checks with:

```bash
npm run build
npm test
npm run lint
```
