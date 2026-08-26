// Shared state + chrome for the 4-step checkout flow.
// Steps: 1 cart.html · 2 au-info.html · 3 payment.html · 4 confirm.html
import { supabase, currentUser, authedFetch, escapeHtml } from "./tlm-auth.js";

export { supabase, currentUser, authedFetch, escapeHtml };

export const CART_KEY = "tlmCart";
export const CHECKOUT_KEY = "tlmCheckout";

export const STEPS = [
  { n: 1, label: "Cart", href: "cart.html" },
  { n: 2, label: "AU Info", href: "au-info.html" },
  { n: 3, label: "Payment", href: "payment.html" },
  { n: 4, label: "Confirm", href: "confirm.html" },
];

export const CRYPTO_RATES = { USDT: 1, BTC: 67500, LTC: 84 };

export const WALLET_ADDRESSES = {
  USDT: {
    "TRC-20": "TNFTorYbtRQuMEHnBtxKVJudt8FCNnDXxZ",
    "ERC-20": "0x030C80DCC078bfCA89Cd29522D3Ad6C6422989A4",
    "BEP-20": "0x6bEB869150621957108586099c1F12Aa6E841A23",
    Solana: "9PGaMHfoExqn69yuwRBM5ZxiQeQtBexXHKAGMxTfU7DE",
  },
  BTC: {
    Bitcoin: "34VTQzfkTqDzQvuvKepuQZabAXQyjNoZvx",
    "BEP-20": "0x6bEB869150621957108586099c1F12Aa6E841A23",
    RENEC: "2118THmsx9wnDQnAVZufHb3JAMuEUaaJA4trTtQcNTNX",
  },
  LTC: { Litecoin: "MMUseN9FzhdyrvqVgMhpfjh1pKEbxBWypS" },
};

export const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];

export const bankEmoji = (b) => {
  const name = String(b || "Card").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[1][0])
    : name.slice(0, 2);
  return initials.toUpperCase();
};

/* ── CART ─────────────────────────────────────────────── */
export function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
export function cartUnits(cart = getCart()) {
  return cart.flatMap((i) => Array.from({ length: Math.max(1, Number(i.qty) || 1) }, () => i));
}
export function cartSubtotal(cart = getCart()) {
  return cart.reduce((s, i) => s + Number(i.price || 0) * (Number(i.qty) || 1), 0);
}
export function cartFees() {
  return 0;
}
export function cartTotal(cart = getCart()) {
  return cartSubtotal(cart) + cartFees();
}

/* ── CHECKOUT DRAFT (AU details + payment selection) ──── */
export function getCheckout() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKOUT_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
export function saveCheckout(patch) {
  const next = { ...getCheckout(), ...patch };
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(next));
  return next;
}
export function clearCheckout() {
  localStorage.removeItem(CHECKOUT_KEY);
  localStorage.removeItem(CART_KEY);
}

/** Signature of the cart so stale AU data is discarded when the cart changes. */
export function cartSignature(cart = getCart()) {
  return cart.map((i) => `${i.id}x${Number(i.qty) || 1}`).join("|");
}

export function hasValidAu() {
  const c = getCheckout();
  const units = cartUnits();
  return (
    c.cartSig === cartSignature() &&
    Array.isArray(c.au) &&
    c.au.length === units.length &&
    c.au.every((a) => a && a.first && a.last && a.dob && a.ssn && a.addr && a.city && a.state && a.zip)
  );
}
export function hasValidPayment() {
  const p = getCheckout().payment;
  if (!p) return false;
  if (p.method === "card") return !!(p.card && p.card.last4 && p.card.brand);
  return !!(p.crypto && p.network && p.txHash);
}

/* ── SHARED CHROME ────────────────────────────────────── */
const NAV_LINKS = [
  ["index.html", "Home"],
  ["marketplace.html", "Buy Tradelines"],
  ["extension.html", "Buy Extension"],
  ["sell.html", "Sell Tradelines"],
  ["brokers.html", "Brokers"],
  ["resources.html", "Resources"],
  ["about.html", "About"],
  ["contact.html", "Contact"],
];

export function renderChrome(activeStep) {
  const header = document.getElementById("coHeader");
  if (header) {
    header.innerHTML = `
      <header>
        <nav>
          <a href="index.html" class="logo">
            <div class="logo-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L3 5V10C3 13.87 6.13 17.48 10 18C13.87 17.48 17 13.87 17 10V5L10 2Z" fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 11.5L9.5 8.5L10 10L12.5 7" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12.5" cy="7" r="1" fill="white"/></svg></div>
            Tradelines <span>Network</span>
          </a>
          <ul class="nav-links">${NAV_LINKS.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
          <a href="marketplace.html" class="nav-cta">Continue Shopping →</a>
          <div class="hamburger" id="coBurger"><span></span><span></span><span></span></div>
        </nav>
      </header>
      <div class="mobile-nav" id="coMobileNav">
        <button class="mobile-nav-close" id="coNavClose">✕</button>
        ${NAV_LINKS.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}
        <a href="account.html">My Account</a>
      </div>`;
    const nav = document.getElementById("coMobileNav");
    document.getElementById("coBurger").addEventListener("click", () => nav.classList.add("open"));
    document.getElementById("coNavClose").addEventListener("click", () => nav.classList.remove("open"));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  const prog = document.getElementById("coProgress");
  if (prog) {
    prog.innerHTML = `<div class="co-progress"><div class="co-progress-inner">${STEPS.map((s, i) => {
      const state = s.n < activeStep ? "done" : s.n === activeStep ? "active" : "upcoming";
      const tag = s.n < activeStep ? "a" : "div";
      const href = s.n < activeStep ? ` href="${s.href}"` : "";
      const line = i < STEPS.length - 1 ? `<div class="co-line ${s.n < activeStep ? "done" : ""}"></div>` : "";
      return `<${tag} class="co-step ${state}"${href}><div class="co-step-num">${s.n < activeStep ? "✓" : s.n}</div><div class="co-step-label">${s.label}</div></${tag}>${line}`;
    }).join("")}</div></div>`;
  }

  const footer = document.getElementById("coFooter");
  if (footer) {
    footer.innerHTML = `
      <footer>
        <div class="footer-bottom">
          <div>©2026 Tradelines Network LLC. All Rights Reserved. We do not sell tradelines in Georgia.</div>
          <div style="display:flex;gap:20px"><a href="legal.html#privacy">Privacy</a><a href="legal.html#terms">Terms</a><a href="faq.html">FAQ</a></div>
        </div>
      </footer>`;
  }
}

/** Renders the sticky order summary card into #coSummary. */
export function renderSummary(extraNote = "") {
  const el = document.getElementById("coSummary");
  if (!el) return;
  const cart = getCart();
  const total = cartTotal(cart);
  el.innerHTML = `
    <div class="co-summary">
      <div class="co-summary-title">Order Summary</div>
      ${cart
        .map(
          (i) =>
            `<div class="co-sline"><span>${escapeHtml(i.bank)} #${escapeHtml(String(i.id))}${(Number(i.qty) || 1) > 1 ? ` × ${Number(i.qty)}` : ""}</span><strong>$${(Number(i.price || 0) * (Number(i.qty) || 1)).toLocaleString()}</strong></div>`,
        )
        .join("")}
      <div class="co-sline"><span>Processing Fee</span><strong>$0</strong></div>
      <div class="co-stotal"><span class="co-stotal-l">Total Due</span><span class="co-stotal-v">$${total.toLocaleString()}</span></div>
      <div class="co-guarantee">
        ✓ Guaranteed to post to 2+ bureaus<br>
        ✓ Full refund if the tradeline doesn't post<br>
        ✓ No identity documents required<br>
        ✓ Fast crypto checkout (USDT · BTC · LTC)
      </div>
      ${extraNote ? `<div class="co-guarantee">${extraNote}</div>` : ""}
    </div>
    <div style="text-align:center;margin-top:12px"><a href="marketplace.html" style="font-size:13px;color:#5a6672">← Continue shopping</a></div>`;
}

/** Redirects to the earliest incomplete step. Returns true when this page may render. */
export function guardStep(step) {
  const cart = getCart();
  if (!cart.length) {
    if (step !== 1) {
      window.location.replace("cart.html");
      return false;
    }
    return true;
  }
  if (step >= 3 && !hasValidAu()) {
    window.location.replace("au-info.html");
    return false;
  }
  if (step >= 4 && !hasValidPayment()) {
    window.location.replace("payment.html");
    return false;
  }
  return true;
}

export async function requireAuth(redirect) {
  const user = await currentUser();
  if (!user) {
    window.location.href = `account.html?redirect=${encodeURIComponent(redirect)}`;
    return null;
  }
  return user;
}
