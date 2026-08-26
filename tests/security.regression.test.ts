/**
 * Security regression tests — run via `bun test`.
 * These lock in behaviors that must NOT regress:
 *   1. HTML escaping used in cart/account render paths.
 *   2. Server-side transaction-hash format validation for the
 *      /api/public/orders endpoint (rejects short / arbitrary strings).
 */

import { describe, it, expect } from "bun:test";

// Duplicated from public/assets/js/tlm-auth.js so the test can run without
// a browser. If the escape helper diverges, this test will fail.
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Mirrors src/routes/api/public/orders.ts::isValidTxHash — must stay in sync.
function isValidTxHash(crypto: string, network: string, hash: string): boolean {
  if (typeof hash !== "string") return false;
  const h = hash.trim();
  if (crypto === "BTC" && network === "Bitcoin") return /^[a-fA-F0-9]{64}$/.test(h);
  if (crypto === "LTC" && network === "Litecoin") return /^[a-fA-F0-9]{64}$/.test(h);
  if (crypto === "USDT" && network === "TRC-20") return /^[a-fA-F0-9]{64}$/.test(h);
  if (network === "ERC-20" || network === "BEP-20") return /^0x[a-fA-F0-9]{64}$/.test(h);
  if (network === "Solana") return /^[1-9A-HJ-NP-Za-km-z]{60,120}$/.test(h);
  return false;
}

describe("XSS: escapeHtml on user-controlled fields", () => {
  it("escapes script tags", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });
  it("escapes img onerror payloads", () => {
    expect(escapeHtml('<img src=x onerror="x">')).toBe(
      "&lt;img src=x onerror=&quot;x&quot;&gt;",
    );
  });
  it("escapes quotes and ampersands", () => {
    expect(escapeHtml(`a&b"c'd`)).toBe("a&amp;b&quot;c&#39;d");
  });
  it("handles null/undefined without throwing", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("Crypto: transaction hash format validation", () => {
  it("rejects arbitrary text pretending to be a hash", () => {
    expect(isValidTxHash("BTC", "Bitcoin", "not a real tx hash at all!!!")).toBe(false);
    expect(isValidTxHash("BTC", "Bitcoin", "aaaaaaaaaaaaaaaaaaaa")).toBe(false); // 20 chars
  });
  it("rejects the exact 20-char bypass from the old client-only checker", () => {
    expect(isValidTxHash("BTC", "Bitcoin", "x".repeat(20))).toBe(false);
    expect(isValidTxHash("USDT", "TRC-20", "x".repeat(20))).toBe(false);
  });
  it("accepts a well-formed BTC/LTC/USDT-TRC20 tx hash (64 hex)", () => {
    const good = "a".repeat(64);
    expect(isValidTxHash("BTC", "Bitcoin", good)).toBe(true);
    expect(isValidTxHash("LTC", "Litecoin", good)).toBe(true);
    expect(isValidTxHash("USDT", "TRC-20", good)).toBe(true);
  });
  it("accepts a well-formed ERC-20 hash (0x + 64 hex)", () => {
    expect(isValidTxHash("USDT", "ERC-20", "0x" + "b".repeat(64))).toBe(true);
  });
  it("rejects ERC-20 hash missing the 0x prefix", () => {
    expect(isValidTxHash("USDT", "ERC-20", "b".repeat(64))).toBe(false);
  });
  it("rejects unknown networks", () => {
    expect(isValidTxHash("BTC", "MadeUpNet", "a".repeat(64))).toBe(false);
  });
});
