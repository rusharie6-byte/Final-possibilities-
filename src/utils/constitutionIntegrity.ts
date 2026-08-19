// Constitutional Integrity, SHA-256 Fingerprint, Circuit Breaker & Security Redaction System for Possibilities
// Implements Cryptographic SHA-256 Verification, Emergency Constitutional Circuit Breaker,
// Startup Integrity Verifier, Structured Disagreement Framework, and Secure Export Redactor.

export function calculateSha256(str: string): string {
  const utf8 = unescape(encodeURIComponent(str));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  
  const bitLength = utf8.length * 8;
  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const w = new Array(64);

  for (let i = 0; i < words.length; i += 16) {
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
        const gamma1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + ch + k[j] + w[j]) | 0;
      const sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return (toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7)).toLowerCase();
}

export interface StructuredDisagreement {
  concern: string;
  reasoning: string;
  alternative: string;
  expectedOutcome: string;
}

export interface CircuitBreakerState {
  active: boolean;
  reason: string | null;
  triggeredAt: string | null;
}

export const EXPECTED_CONSTITUTION_SHA256 = 'fd9763908e8ebdd2b29029bec5c88af7bcce0a5bc22d3de36f8ed1a3d13451b9';

class ConstitutionIntegrityManager {
  private circuitBreaker: CircuitBreakerState = {
    active: false,
    reason: null,
    triggeredAt: null,
  };

  private knownGoodFingerprint: string = EXPECTED_CONSTITUTION_SHA256;

  constructor() {
    this.knownGoodFingerprint = EXPECTED_CONSTITUTION_SHA256;
  }

  public setKnownGoodFingerprint(fingerprint: string): void {
    this.knownGoodFingerprint = fingerprint;
  }

  public getKnownGoodFingerprint(): string | null {
    return this.knownGoodFingerprint;
  }

  public computeFingerprint(constitutionText: string): string {
    return calculateSha256(constitutionText.trim());
  }

  public verifyFingerprint(constitutionText: string): { isValid: boolean; expected: string | null; actual: string } {
    const actual = this.computeFingerprint(constitutionText);
    const expected = this.knownGoodFingerprint;
    const isValid = expected ? actual === expected : true;
    return { isValid, expected, actual };
  }

  public isCircuitBreakerActive(): boolean {
    return this.circuitBreaker.active;
  }

  public getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  public triggerCircuitBreaker(reason: string): void {
    this.circuitBreaker = {
      active: true,
      reason,
      triggeredAt: new Date().toISOString(),
    };
    console.error(`[EMERGENCY CONSTITUTIONAL CIRCUIT BREAKER TRIPPED] Reason: ${reason}`);
  }

  public restoreCircuitBreaker(restoredConstitutionText: string): { success: boolean; message: string } {
    const actual = this.computeFingerprint(restoredConstitutionText);
    if (this.knownGoodFingerprint && actual !== this.knownGoodFingerprint) {
      return {
        success: false,
        message: `Restoration failed: SHA-256 mismatch. Expected ${this.knownGoodFingerprint}, got ${actual}`,
      };
    }

    this.circuitBreaker = {
      active: false,
      reason: null,
      triggeredAt: null,
    };
    return { success: true, message: 'Circuit Breaker reset successfully. Stable Constitution restored.' };
  }

  // ==================================================
  // AUTOMATIC STARTUP INTEGRITY VERIFICATION
  // ==================================================
  public verifyStartupIntegrity(
    constitutionText: string,
    creatorProfile?: { actualName?: string; preferredAddress?: string }
  ): { passed: boolean; fingerprint: string; errors: string[]; summary: string } {
    const errors: string[] = [];

    // Check 1: Existence
    if (!constitutionText || constitutionText.trim().length === 0) {
      errors.push('Constitution document is missing or empty.');
    }

    // Check 2: SHA-256 Fingerprint
    const fingerprint = this.computeFingerprint(constitutionText);
    if (this.knownGoodFingerprint && fingerprint !== this.knownGoodFingerprint) {
      errors.push(`Constitutional SHA-256 Fingerprint mismatch! Expected: ${this.knownGoodFingerprint}, Actual: ${fingerprint}`);
    }

    // Check 3: LAW 12 Anti-Gaslighting presence
    if (!constitutionText.includes('LAW 12') || !constitutionText.includes('ANTI-GASLIGHTING')) {
      errors.push('Missing LAW 12 — Anti-Gaslighting & History Integrity in Constitution.');
    }

    // Check 4: Creator Identity
    if (creatorProfile) {
      if (creatorProfile.actualName !== 'Arno' || creatorProfile.preferredAddress !== 'Arie') {
        errors.push(`Creator Identity compromised: ${creatorProfile.actualName} / ${creatorProfile.preferredAddress}`);
      }
    }

    if (errors.length > 0) {
      const reason = `Startup Integrity Verification Failed: ${errors.join(' | ')}`;
      this.triggerCircuitBreaker(reason);
      return {
        passed: false,
        fingerprint,
        errors,
        summary: `BOOT ABORTED. Circuit Breaker Active. ${reason}`,
      };
    }

    return {
      passed: true,
      fingerprint,
      errors: [],
      summary: `Startup Integrity Verified (SHA-256: ${fingerprint.substring(0, 16)}...). All systems operational.`,
    };
  }

  // ==================================================
  // STRUCTURED DISAGREEMENT FRAMEWORK
  // ==================================================
  public formatStructuredDisagreement(d: StructuredDisagreement): string {
    return `
[POSSIBILITIES STRUCTURED DISAGREEMENT FRAMEWORK]
• Concern: ${d.concern}
• Reasoning: ${d.reasoning}
• Alternative: ${d.alternative}
• Expected Outcome: ${d.expectedOutcome}
`.trim();
  }

  // ==================================================
  // SECURE EXPORT REDACTION
  // ==================================================
  public redactSecrets(inputStr: string): string {
    if (!inputStr) return inputStr;
    let redacted = inputStr;

    // Google / Gemini API keys
    redacted = redacted.replace(/AIzaSy[A-Za-z0-9_-]{30,40}/g, '[REDACTED_GEMINI_API_KEY]');

    // OpenAI / Anthropic keys
    redacted = redacted.replace(/sk-[A-Za-z0-9_-]{32,}/g, '[REDACTED_SECRET_KEY]');

    // GitHub Personal Access Tokens
    redacted = redacted.replace(/ghp_[A-Za-z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]');

    // Generic Bearer Tokens
    redacted = redacted.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');

    // JSON Password/Secret/Token fields
    redacted = redacted.replace(/"(password|secret|token|apiKey|api_key|client_secret)"\s*:\s*"[^"]+"/gi, '"$1": "[REDACTED_FIELD]"');

    // Key=Value patterns in plain text or logs
    redacted = redacted.replace(/(password|secret|token|apiKey|api_key)=([^\s&]+)/gi, '$1=[REDACTED]');

    return redacted;
  }
}

export const constitutionIntegrity = new ConstitutionIntegrityManager();
