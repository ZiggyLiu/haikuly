# 🌸 Haiku-ly — New Feature Wishlist

_Status: planning · Target: local test first, then deploy to Cloudflare_

---

## Phase 1 — One-Screen Layout + Elegant Fonts

**Goal:** fit the whole studio on one screen without scrolling, and give generated poems a more elegant, poetic feel — all with free fonts.

### 1a. Compact one-screen layout

Current problem: the hero banner ("Spring Whispers") + intro + controls + poem paper + footer add up to a page taller than one screen, so users must scroll to reach the output box and buttons.

Planned changes (CSS-only, in `app/globals.css` unless noted):

| Area | Current | Planned |
|---|---|---|
| `.hero` top/bottom margins | `margin: 88px auto 56px` | Reduce to ~`40px auto 28px` |
| `h1` title size | `clamp(38px, 5.2vw, 66px)`, `line-height: 2` | Reduce to ~`clamp(30px, 4vw, 48px)`, `line-height: 1.35` |
| `.eyebrow` bottom margin | `22px` | ~`12px` |
| `.intro` margin / size | `28px auto 0`, `15px` | ~`16px auto 0`, `13.5px` |
| `.poem-paper` min-height | `390px`, padding `48px 44px 32px` | ~`300px`, padding `32px 36px 24px` |
| `.poem-line p` margins | `24px 0` | ~`14px 0` |
| `.action-row` min-height | `68px`, `padding-top: 18px` | ~`52px`, `padding-top: 12px` |
| `.studio` bottom margin | `96px` | ~`40px` |
| `.site-header` height | `92px` | ~`72px` |
| `footer` padding | `32px 0 40px` | ~`16px 0 24px` |

Mobile: keep the compact feel; a little scroll on phones is acceptable but we minimize it.

Verification:
- [ ] Fits without scroll on a typical laptop (13–16" @ ~900px viewport height)
- [ ] All controls (language, form, mode, keyword, generate) visible with output
- [ ] Ink-wash aesthetic preserved; nothing looks cramped

### 1b. Elegant free fonts for generated poems

Current: poem lines use Geist Sans (`--font-geist-sans`) — clean but not "poetic."

Planned (Google Fonts, free; loaded via `next/font/google` like the current fonts):

| Language | Current | Proposed | Style |
|---|---|---|---|
| English | Geist Sans | **Cormorant Garamond** (400/500) | Elegant literary serif, light & poetic |
| Chinese (中文) | system fallback | **Ma Shan Zheng** or **Liu Jian Mao Cao** | Brush-script calligraphy feel |
| Japanese (日本語) | system fallback | **Shippori Mincho** | Refined Mincho (serif) |

Notes:
- Add fonts in `app/layout.tsx` alongside existing `Dancing_Script` / `Zhi_Mang_Xing`.
- Wire per-language font-family in `app/globals.css` under `.poem-lines[lang=...]`.
- Keep an eye on bundle size (Workers limit ~3MB); if heavy, load only the language fonts actually used, or subset them.
- Hero title font can stay as-is (Dancing Script) — it's already decorative; the change targets the **poem output** font.

Verification:
- [ ] English poem in Cormorant Garamond looks elegant
- [ ] 中文 poem renders with calligraphy-style font, no broken glyphs
- [ ] 日本語 poem renders cleanly
- [ ] Page still loads fast (no big font payload regression)

### Phase 1 acceptance criteria
- [ ] Local test passes on all three languages
- [ ] One-screen layout on laptop
- [ ] Fonts look "poetic, elegant, free"
- [ ] Deploy to Cloudflare, verify on live site

---

## Phase 2 — Daily Haiku Email Subscription (free tier)

**Goal:** let visitors subscribe (free) and receive one haiku per day by email.

### Architecture (all free/low-cost)

| Piece | Choice | Cost |
|---|---|---|
| Subscribe form (name + email) | Add to site (Phase 2 UI) | $0 |
| Store subscribers | Cloudflare **D1** database (project already has Drizzle setup) | Free (up to 5GB) |
| Send daily email | Newsletter service: **Buttondown** or **Resend** (API) | Free tier up to ~500 subs / small volume |
| Daily job | Cloudflare **Cron Trigger** → generate haiku → email all subscribers | $0 (part of Worker) |
| Unsubscribe link | Required by law (CAN-SPAM/GDPR-style) — include in every email | $0 |

### Steps

1. **Schema:** add `subscribers` table (email, name, created_at, token, subscribed flag) via Drizzle.
2. **API routes:**
   - `POST /api/subscribe` — validate email, store with a unique unsubscribe token, return confirmation.
   - `POST /api/unsubscribe` — token-based removal (no login needed).
3. **Form UI:** small "Get a daily haiku" box under the studio with email input + button; success/error states; i18n (EN/中文/日本語).
4. **Cron job:** Cloudflare scheduled handler (cron `0 8 * * *` → daily 8:00 UTC):
   - Generate one haiku (reuse existing DeepSeek logic)
   - Loop subscribers, send email via Resend/Buttondown with unsubscribe link
   - Respect per-email rate limits; log results
5. **Privacy:** minimal data (email only); add a short privacy note; unsubscribe honored immediately.

### Acceptance criteria
- [ ] User can subscribe from the site
- [ ] Confirmation shown without page reload
- [ ] Daily haiku email arrives (test with own email first)
- [ ] Unsubscribe link works
- [ ] Works for EN / 中文 / 日本語 subscribers (language preference stored)

### Later (out of scope for Phase 2)
- Payment layer (tip jar / premium collections) — decide after subscription proves demand
- Email drip / weekly digest options
- Premium tier: choose theme, more haiku per day

---

## Notes
- Work locally first (`npm run dev`), then deploy (`npx vinext deploy`).
- Keep the "guest book" (visitor IP logging) untouched.
- Phase 1 and Phase 2 are independent — Phase 1 first (quick win), Phase 2 when ready.
