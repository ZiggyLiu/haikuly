import type { Language } from "../app/haiku";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TOKEN_VERSION = 1;

export type ActionPurpose = "confirm" | "unsubscribe";

export type ActionTokenPayload = {
  version: 1;
  subscriberId: string;
  purpose: ActionPurpose;
  language: Language;
  expiresAt: number | null;
};

function decodeBase64(value: string): Uint8Array {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("TOKEN_ENCRYPTION_KEY must be valid base64.");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function deriveKey(
  source: CryptoKey,
  info: string,
  algorithm: AesDerivedKeyParams | HmacImportParams,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("haikuly-subscriptions-v1"),
      info: encoder.encode(info),
    },
    source,
    algorithm,
    false,
    usages,
  );
}

async function encryptString(value: string, key: CryptoKey, context: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(context) },
    key,
    encoder.encode(value),
  );
  const output = new Uint8Array(iv.length + encrypted.byteLength);
  output.set(iv);
  output.set(new Uint8Array(encrypted), iv.length);
  return encodeBase64Url(output);
}

async function decryptString(value: string, key: CryptoKey, context: string): Promise<string | null> {
  try {
    const packed = decodeBase64(value);
    if (packed.length <= IV_BYTES) return null;
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: packed.slice(0, IV_BYTES),
        additionalData: encoder.encode(context),
      },
      key,
      packed.slice(IV_BYTES),
    );
    return decoder.decode(decrypted);
  } catch {
    return null;
  }
}

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "zh" || value === "ja";
}

function isActionTokenPayload(value: unknown): value is ActionTokenPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.version === TOKEN_VERSION &&
    typeof candidate.subscriberId === "string" &&
    candidate.subscriberId.length > 0 && candidate.subscriberId.length <= 64 &&
    (candidate.purpose === "confirm" || candidate.purpose === "unsubscribe") &&
    isLanguage(candidate.language) &&
    (candidate.expiresAt === null || (typeof candidate.expiresAt === "number" && Number.isFinite(candidate.expiresAt)));
}

export function normalizeEmail(value: string): string {
  const trimmed = value.trim();
  const separator = trimmed.lastIndexOf("@");
  if (separator < 1) return trimmed;
  return `${trimmed.slice(0, separator)}@${trimmed.slice(separator + 1).toLocaleLowerCase("en-US")}`;
}

export function isValidEmail(value: string): boolean {
  if (value.length < 3 || value.length > 254 || /[\s\u0000-\u001f\u007f]/u.test(value)) return false;
  const separator = value.lastIndexOf("@");
  if (separator < 1 || separator === value.length - 1) return false;
  const local = value.slice(0, separator);
  const domain = value.slice(separator + 1);
  return local.length <= 64 && domain.length <= 253 && domain.includes(".") &&
    /^[^@<>(),;:\\"\[\]]+$/u.test(local) &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu.test(domain);
}

export async function createSubscriptionCrypto(secret: string) {
  const sourceBytes = decodeBase64(secret);
  if (sourceBytes.length !== KEY_BYTES) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }

  const sourceBuffer = sourceBytes.buffer.slice(
    sourceBytes.byteOffset,
    sourceBytes.byteOffset + sourceBytes.byteLength,
  ) as ArrayBuffer;
  const source = await crypto.subtle.importKey("raw", sourceBuffer, "HKDF", false, ["deriveKey"]);
  const [emailKey, actionKey, indexKey] = await Promise.all([
    deriveKey(source, "email-encryption", { name: "AES-GCM", length: 256 }, ["encrypt", "decrypt"]),
    deriveKey(source, "action-token-encryption", { name: "AES-GCM", length: 256 }, ["encrypt", "decrypt"]),
    deriveKey(source, "email-index", { name: "HMAC", hash: "SHA-256", length: 256 }, ["sign"]),
  ]);

  return {
    async emailHash(email: string): Promise<string> {
      const signature = await crypto.subtle.sign("HMAC", indexKey, encoder.encode(normalizeEmail(email)));
      return encodeBase64Url(new Uint8Array(signature));
    },

    encryptEmail(email: string): Promise<string> {
      return encryptString(normalizeEmail(email), emailKey, "haikuly-email-v1");
    },

    decryptEmail(ciphertext: string): Promise<string | null> {
      return decryptString(ciphertext, emailKey, "haikuly-email-v1");
    },

    createActionToken(
      subscriberId: string,
      purpose: ActionPurpose,
      language: Language,
      expiresAt: number | null,
    ): Promise<string> {
      const payload: ActionTokenPayload = {
        version: TOKEN_VERSION,
        subscriberId,
        purpose,
        language,
        expiresAt,
      };
      return encryptString(JSON.stringify(payload), actionKey, "haikuly-action-v1");
    },

    async readActionToken(token: string, expectedPurpose: ActionPurpose): Promise<ActionTokenPayload | null> {
      if (!token || token.length > 2048) return null;
      const plaintext = await decryptString(token, actionKey, "haikuly-action-v1");
      if (!plaintext) return null;
      try {
        const parsed: unknown = JSON.parse(plaintext);
        if (!isActionTokenPayload(parsed) || parsed.purpose !== expectedPurpose) return null;
        if (parsed.expiresAt !== null && parsed.expiresAt < Date.now()) return null;
        return parsed;
      } catch {
        return null;
      }
    },
  };
}
