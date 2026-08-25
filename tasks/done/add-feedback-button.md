# Task: Add feedback button to daily subscription email

- Owner: executor
- Status: queued
- Goal: Add a feedback button to the daily Haiku-ly subscription email, including the English and Chinese versions.
- Requirements:
  - Add a clear feedback CTA to the daily email HTML.
  - English label: "Give feedback".
  - Chinese label: "反馈这首俳句".
  - Link to a Haiku-ly feedback route/page using a privacy-preserving, signed or opaque token and the daily message identifier.
  - Preserve existing unsubscribe behavior and List-Unsubscribe headers.
  - Do not expose the subscriber email address in the link.
  - Keep confirmation emails unchanged.
- Acceptance:
  - Existing subscription email tests continue to pass.
  - New tests cover the English and Chinese feedback CTA and link construction.
  - No secrets or environment files are committed.
  - Push the implementation and report the commit and preview/test result in the task handoff.

## Watcher result

- Status: success
- Finished: 2026-08-25T00:54:50Z
- Implementation commit: `fdba9f6`
- Production Worker version: `961b375f-f93d-46a6-90e1-e1753f94b48a`
- Database: `0001_add_subscription_feedback.sql` applied to `haikuly-subscriptions-prod`; no migrations remain.
- Validation: lint and typecheck passed; production build passed; all 55 tests passed.
- Live verification: `/feedback` returned HTTP 200; the Chinese feedback controls worked; an invalid-token submission returned the localized invalid-link status and wrote no feedback.
- Security: daily emails use a dedicated encrypted feedback token with the daily poem date; subscriber email addresses, environment files, API keys, and generated dependencies were not committed.
