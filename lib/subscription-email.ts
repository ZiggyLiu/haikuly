import type { Haiku, Language } from "../app/haiku";
import type { ResendEmail } from "./resend";

type EmailSettings = {
  from: string;
  replyTo: string;
  baseUrl: string;
};

const COPY: Record<Language, {
  confirmSubject: string;
  confirmTitle: string;
  confirmIntro: string;
  confirmButton: string;
  confirmExpiry: string;
  dailySubject: string;
  dailyTitle: string;
  dailyIntro: string;
  feedback: string;
  unsubscribe: string;
  reason: string;
}> = {
  en: {
    confirmSubject: "Confirm your daily Haiku-ly email",
    confirmTitle: "One small step",
    confirmIntro: "Confirm that you want one Haiku-ly poem each day.",
    confirmButton: "Confirm my subscription",
    confirmExpiry: "This confirmation link expires in 48 hours.",
    dailySubject: "Your daily Haiku-ly",
    dailyTitle: "A small moment for today",
    dailyIntro: "Pause for three lines.",
    feedback: "Give feedback",
    unsubscribe: "Unsubscribe",
    reason: "You receive this message because you confirmed a daily Haiku-ly subscription.",
  },
  zh: {
    confirmSubject: "确认订阅 Haiku-ly 每日俳句",
    confirmTitle: "还差一步",
    confirmIntro: "请确认你愿意每天收到一首 Haiku-ly 俳句。",
    confirmButton: "确认订阅",
    confirmExpiry: "此确认链接将在 48 小时后失效。",
    dailySubject: "今日 Haiku-ly",
    dailyTitle: "给今天的一个小瞬间",
    dailyIntro: "为三行诗停一停。",
    feedback: "反馈这首俳句",
    unsubscribe: "取消订阅",
    reason: "你收到此邮件，是因为你已确认订阅 Haiku-ly 每日俳句。",
  },
  ja: {
    confirmSubject: "Haiku-ly 毎日俳句の購読確認",
    confirmTitle: "あと一歩です",
    confirmIntro: "Haiku-ly の俳句を毎日一通受け取ることを確認してください。",
    confirmButton: "購読を確認する",
    confirmExpiry: "この確認リンクは48時間後に無効になります。",
    dailySubject: "今日の Haiku-ly",
    dailyTitle: "今日の小さな瞬間",
    dailyIntro: "三行のために、少し立ち止まる。",
    feedback: "この俳句にフィードバック",
    unsubscribe: "購読を解除",
    reason: "Haiku-ly の毎日俳句を確認して購読したため、このメールをお送りしています。",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizedBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/g, "");
}

function pageShell(language: Language, body: string): string {
  const lang = language === "zh" ? "zh-CN" : language;
  return `<!doctype html>
<html lang="${lang}">
<body style="margin:0;background:#f4f0e6;color:#273a33;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:36px 20px">
    <div style="background:#faf7ef;border:1px solid #d7d0c0;padding:36px 28px">
      <p style="margin:0 0 24px;color:#6d7b74;font-size:12px;letter-spacing:.16em;text-transform:uppercase">Haiku-ly</p>
      ${body}
    </div>
  </div>
</body>
</html>`;
}

export function buildConfirmationEmail(
  email: string,
  language: Language,
  token: string,
  settings: EmailSettings,
): ResendEmail {
  const copy = COPY[language];
  const confirmationUrl = `${normalizedBaseUrl(settings.baseUrl)}/api/confirm?token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(confirmationUrl);
  const html = pageShell(language, `
      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:400">${copy.confirmTitle}</h1>
      <p style="margin:0 0 26px;line-height:1.7">${copy.confirmIntro}</p>
      <p style="margin:0 0 26px"><a href="${safeUrl}" style="display:inline-block;background:#365347;color:#fff;padding:13px 20px;text-decoration:none">${copy.confirmButton}</a></p>
      <p style="margin:0;color:#6d7b74;font-size:12px;line-height:1.6">${copy.confirmExpiry}</p>
  `);

  return {
    from: settings.from,
    to: [email],
    reply_to: settings.replyTo,
    subject: copy.confirmSubject,
    html,
    text: `${copy.confirmTitle}\n\n${copy.confirmIntro}\n\n${confirmationUrl}\n\n${copy.confirmExpiry}`,
  };
}

export function buildDailyEmail(
  email: string,
  language: Language,
  haiku: Haiku,
  unsubscribeToken: string,
  settings: EmailSettings,
): ResendEmail {
  const copy = COPY[language];
  const unsubscribeUrl = `${normalizedBaseUrl(settings.baseUrl)}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const feedbackUrl = `${normalizedBaseUrl(settings.baseUrl)}/feedback?token=${encodeURIComponent(unsubscribeToken)}`;
  const safeFeedbackUrl = escapeHtml(feedbackUrl);
  const lines = haiku.lines.map(escapeHtml);
  const html = pageShell(language, `
      <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:400">${copy.dailyTitle}</h1>
      <p style="margin:0 0 34px;color:#6d7b74;font-size:14px">${copy.dailyIntro}</p>
      <div style="margin:0 0 38px;font-family:Georgia,serif;font-size:25px;line-height:1.75">
        <div>${lines[0]}</div>
        <div>${lines[1]}</div>
        <div>${lines[2]}</div>
      </div>
      <p style="margin:0 0 18px;color:#6d7b74;font-size:11px;line-height:1.6">${copy.reason}</p>
      <p style="margin:0 0 18px"><a href="${safeFeedbackUrl}" style="display:inline-block;background:#365347;color:#fff;padding:11px 16px;text-decoration:none;font-size:12px">${copy.feedback}</a></p>
      <p style="margin:0"><a href="${safeUnsubscribeUrl}" style="color:#53665d;font-size:11px">${copy.unsubscribe}</a></p>
  `);

  return {
    from: settings.from,
    to: [email],
    reply_to: settings.replyTo,
    subject: copy.dailySubject,
    html,
    text: `${copy.dailyTitle}\n\n${haiku.lines.join("\n")}\n\n${copy.reason}\n${copy.feedback}: ${feedbackUrl}\n${copy.unsubscribe}: ${unsubscribeUrl}`,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function subscriptionResultHtml(
  language: Language,
  kind: "confirmed" | "unsubscribed" | "invalid",
  baseUrl: string,
): string {
  const messages: Record<Language, Record<typeof kind, { title: string; body: string; home: string }>> = {
    en: {
      confirmed: { title: "Subscription confirmed", body: "Your first daily haiku will arrive with the next scheduled issue.", home: "Return to Haiku-ly" },
      unsubscribed: { title: "You are unsubscribed", body: "Haiku-ly will not send more daily poems to this address.", home: "Return to Haiku-ly" },
      invalid: { title: "This link is not valid", body: "The link has expired or was already replaced. You can subscribe again from Haiku-ly.", home: "Return to Haiku-ly" },
    },
    zh: {
      confirmed: { title: "订阅已确认", body: "下一次定时发送时，你将收到第一首每日俳句。", home: "返回 Haiku-ly" },
      unsubscribed: { title: "已取消订阅", body: "Haiku-ly 不会再向此邮箱发送每日俳句。", home: "返回 Haiku-ly" },
      invalid: { title: "此链接无效", body: "链接已过期或已被替换。你可以在 Haiku-ly 重新订阅。", home: "返回 Haiku-ly" },
    },
    ja: {
      confirmed: { title: "購読を確認しました", body: "次回の定時配信から、毎日の俳句が届きます。", home: "Haiku-ly に戻る" },
      unsubscribed: { title: "購読を解除しました", body: "このメールアドレスには、毎日の俳句を今後送信しません。", home: "Haiku-ly に戻る" },
      invalid: { title: "このリンクは無効です", body: "リンクの有効期限が切れたか、新しいリンクに置き換えられました。Haiku-ly から再度購読できます。", home: "Haiku-ly に戻る" },
    },
  };
  const copy = messages[language][kind];
  const homeUrl = escapeHtml(normalizedBaseUrl(baseUrl));
  return pageShell(language, `
      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:400">${copy.title}</h1>
      <p style="margin:0 0 26px;line-height:1.7">${copy.body}</p>
      <p style="margin:0"><a href="${homeUrl}" style="color:#365347">${copy.home}</a></p>
  `);
}
