import crypto from "crypto";

export interface OtpRecord {
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  lastSentAt: number;
  metadata?: Record<string, any>;
}

export class SecureOtpService {
  private static store = new Map<string, OtpRecord>();
  public static readonly TTL_MS = 5 * 60 * 1000; // Strictly 5 minutes
  public static readonly MAX_ATTEMPTS = 5; // Lockout after 5 failed tries
  public static readonly RESEND_COOLDOWN_MS = 60 * 1000; // 60-second cooldown between resends

  private static getSecret(): string {
    return process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dakshora-enterprise-otp-hmac-salt-2026";
  }

  private static hashOtp(otp: string, salt: string): string {
    return crypto
      .createHmac("sha256", this.getSecret())
      .update(`${otp.trim()}:${salt}`)
      .digest("hex");
  }

  /**
   * Generates a cryptographically random 6-digit OTP, computes its secure salted hash,
   * stores only the hash in memory/database with a 5-minute expiry and attempt counter.
   * Plaintext OTP is NEVER stored in database, memory cache, or returned to API clients.
   * It is returned ONLY for the SMS/WhatsApp dispatch gateway.
   */
  public static generateAndStore(
    identifier: string,
    metadata: Record<string, any> = {}
  ): { rawOtp: string; error?: string; retryAfterSeconds?: number } {
    const key = identifier.trim().toLowerCase();
    const now = Date.now();

    const existing = this.store.get(key);
    // Enforce 60-second resend cooldown rate limiting
    if (existing && (now - existing.lastSentAt < this.RESEND_COOLDOWN_MS)) {
      const waitSec = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return {
        rawOtp: "",
        error: `Please wait ${waitSec} seconds before requesting a new OTP.`,
        retryAfterSeconds: waitSec
      };
    }

    // Cryptographically secure 6-digit numeric OTP (100000 - 999999)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = this.hashOtp(rawOtp, salt);

    this.store.set(key, {
      hash,
      salt,
      expiresAt: now + this.TTL_MS,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      lastSentAt: now,
      metadata
    });

    return { rawOtp };
  }

  /**
   * Verifies an incoming OTP using constant-time HMAC-SHA256 comparison.
   * Strictly enforces:
   * 1. 5-Minute strict TTL expiration.
   * 2. Max 5 verification attempts before instant lockout and OTP invalidation.
   * 3. Zero replay tolerance: OTP is immediately deleted upon first successful verification.
   * 4. Complete disabling of development bypass in production mode.
   */
  public static verify(
    identifier: string,
    inputOtp: string
  ): { valid: boolean; error?: string; metadata?: Record<string, any>; status: number } {
    if (!identifier || !inputOtp || typeof inputOtp !== "string") {
      return { valid: false, error: "Identifier and 6-digit OTP are required.", status: 400 };
    }

    const key = identifier.trim().toLowerCase();
    const record = this.store.get(key);

    if (!record) {
      return { valid: false, error: "Invalid or expired OTP. Please request a new OTP.", status: 400 };
    }

    // 1. Strict 5-minute expiration check
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return { valid: false, error: "OTP has expired. Please request a new OTP.", status: 400 };
    }

    // 2. Maximum attempts check (lockout)
    if (record.attempts >= record.maxAttempts) {
      this.store.delete(key);
      return {
        valid: false,
        error: "Maximum verification attempts exceeded. Please request a new OTP.",
        status: 429
      };
    }

    // 3. Constant-time salted HMAC comparison
    const inputHash = this.hashOtp(inputOtp, record.salt);
    let hashesMatch = false;

    try {
      hashesMatch = crypto.timingSafeEqual(
        Buffer.from(inputHash, "hex"),
        Buffer.from(record.hash, "hex")
      );
    } catch {
      hashesMatch = false;
    }

    // 4. Strict hash verification (No bypasses)
    if (!hashesMatch) {
      record.attempts++;
      const remaining = record.maxAttempts - record.attempts;
      if (remaining <= 0) {
        this.store.delete(key);
        return {
          valid: false,
          error: "Maximum verification attempts exceeded. Please request a new OTP.",
          status: 429
        };
      }
      return {
        valid: false,
        error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        status: 400
      };
    }

    // 5. Successful verification: immediately delete to prevent replay/reuse attacks
    const metadata = record.metadata;
    this.store.delete(key);

    return { valid: true, metadata, status: 200 };
  }

  /**
   * Helper to mask phone numbers or emails in security logs (e.g. +91 ******3210 or a***@domain.com)
   */
  public static maskIdentifier(identifier: string): string {
    if (!identifier) return "anonymous";
    const clean = identifier.trim();
    if (clean.includes("@")) {
      const [local, domain] = clean.split("@");
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local[0]}${"*".repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
    }
    const digits = clean.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `+91 ******${digits.slice(-4)}`;
    }
    return `******${clean.slice(-2)}`;
  }

  public static clear(identifier: string) {
    this.store.delete(identifier.trim().toLowerCase());
  }
}
