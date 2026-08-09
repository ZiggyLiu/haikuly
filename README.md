# Stillpoint

Stillpoint is a small haiku studio. It creates a random 5–7–5 poem or builds one from a short keyword or phrase.

Random generation runs in the browser. Keyword generation uses the OpenAI Responses API when `OPENAI_API_KEY` is available. It switches to a local 5–7–5 generator when OpenAI is unavailable.

## Local development

Use Node.js 22.13 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add a project API key to `.env.local` to enable OpenAI keyword generation. Do not commit `.env.local`.

Run the production checks with:

```bash
npm run build
npm test
npm run lint
```
