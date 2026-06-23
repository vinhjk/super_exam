import { cookies } from "next/headers";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.SESSION_SECRET || "12345678901234567890123456789012"; // Must be 32 bytes
const IV_LENGTH = 12;

export interface SessionPayload {
  uid: string;
  email: string;
  role: string;
  organizationId: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex, authTagHex] = text.split(":");
  if (!ivHex || !encryptedHex || !authTagHex) throw new Error("Invalid session token structure");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;
    const decrypted = decrypt(sessionCookie);
    return JSON.parse(decrypted) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function setSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  const encrypted = encrypt(JSON.stringify(payload));
  cookieStore.set("session", encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
