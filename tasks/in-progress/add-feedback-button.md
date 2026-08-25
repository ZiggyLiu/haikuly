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
