import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

// ─── Envelope Encryption ──────────────────────────────────────────────────────

export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12) + tag(16) + ciphertext — all base64
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptWithKey(ciphertext: string, key: Buffer): string {
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export interface EncryptedEnvelope {
  encryptedData: string;  // data encrypted with DEK
  encryptedDek: string;   // DEK encrypted with master key
}

export function envelopeEncrypt(
  plaintext: string,
  masterKey: Buffer,
): EncryptedEnvelope {
  const dek = randomBytes(32); // 256-bit data encryption key
  const encryptedData = encryptWithKey(plaintext, dek);
  const encryptedDek = encryptWithKey(dek.toString("hex"), masterKey);
  return { encryptedData, encryptedDek };
}

export function envelopeDecrypt(
  envelope: EncryptedEnvelope,
  masterKey: Buffer,
): string {
  const dekHex = decryptWithKey(envelope.encryptedDek, masterKey);
  const dek = Buffer.from(dekHex, "hex");
  return decryptWithKey(envelope.encryptedData, dek);
}

export function getMasterKey(): Buffer {
  const keyHex = process.env["MASTER_ENCRYPTION_KEY"];
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("MASTER_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

// ─── HMAC Webhook Signature ───────────────────────────────────────────────────

export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signWebhookPayload(payload, secret);
  // Constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(`sha256=${expected}`);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  let mismatch = 0;
  for (let i = 0; i < sigBuffer.length; i++) {
    mismatch |= (sigBuffer[i] ?? 0) ^ (expectedBuffer[i] ?? 0);
  }
  return mismatch === 0;
}

// ─── API Key Hashing ──────────────────────────────────────────────────────────

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(prefix = "ff_live_"): { key: string; hash: string; displayPrefix: string } {
  const random = randomBytes(24).toString("base64url");
  const key = `${prefix}${random}`;
  return {
    key,
    hash: hashApiKey(key),
    displayPrefix: key.slice(0, 12),
  };
}
