// Inline SVG network / coin badges used on the payment + order pages.
// Keys match the network keys used in checkout-core.js (WALLET_ADDRESSES).

const ICONS = {
  'TRC-20': `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#EF0027"/><path d="M23 10.4 9.3 8l6.4 15.6 8.6-10.7-1.3-2.5Zm-.7 2 1 1.9-3.2-.6 2.2-1.3Zm-3.6 1.1-6-1.1 8.1-1.4-2.1 2.5Zm-.6 1.4-2 5.2-3.7-9 5.7 3.8Zm1.3.2 3.4.6-5 6.2 1.6-6.8Z" fill="#fff"/></svg>`,
  'ERC-20': `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#627EEA"/><path d="M16 5v8.9l7.5 3.3L16 5Z" fill="#fff" fill-opacity=".7"/><path d="M16 5 8.5 17.2 16 13.9V5Z" fill="#fff"/><path d="M16 22.9V28l7.5-9.4L16 22.9Z" fill="#fff" fill-opacity=".7"/><path d="M16 28v-5.1l-7.5-4.3L16 28Z" fill="#fff"/><path d="m16 21.4 7.5-4.2L16 13.9v7.5Z" fill="#fff" fill-opacity=".4"/><path d="M8.5 17.2 16 21.4v-7.5l-7.5 3.3Z" fill="#fff" fill-opacity=".7"/></svg>`,
  'BEP-20': `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#F3BA2F"/><path d="M16 6.5l3 3.1-3 3-3-3 3-3.1ZM10.4 12l3 3.1-3 3-3-3 3-3.1Zm11.2 0 3 3.1-3 3-3-3 3-3.1ZM16 17.4l3 3.1-3 3-3-3 3-3.1Z" fill="#fff"/><path d="m16 12.9 3.1 3.1L16 19.1 12.9 16 16 12.9Z" fill="#fff"/></svg>`,
  Solana: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="solg" x1="4" y1="26" x2="28" y2="6" gradientUnits="userSpaceOnUse"><stop stop-color="#9945FF"/><stop offset="1" stop-color="#14F195"/></linearGradient></defs><circle cx="16" cy="16" r="16" fill="#131313"/><g fill="url(#solg)"><path d="M10 10.7c.2-.2.4-.3.7-.3h13c.4 0 .6.5.3.8l-2.6 2.6c-.2.2-.4.3-.7.3H7.7c-.4 0-.6-.5-.3-.8L10 10.7Z"/><path d="M10 18.2c.2-.2.4-.3.7-.3h13c.4 0 .6.5.3.8l-2.6 2.6c-.2.2-.4.3-.7.3H7.7c-.4 0-.6-.5-.3-.8l2.6-2.6Z"/><path d="M21.4 14.4c-.2-.2-.4-.3-.7-.3H7.7c-.4 0-.6.5-.3.8l2.6 2.6c.2.2.4.3.7.3h13c.4 0 .6-.5.3-.8l-2.6-2.6Z"/></g></svg>`,
  Bitcoin: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#F7931A"/><path d="M22 14.3c.3-1.9-1.2-2.9-3.2-3.6l.6-2.6-1.6-.4-.6 2.5-1.3-.3.6-2.5-1.6-.4-.7 2.6-3.2-.8-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-1.9 7.6c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.9 3.3.8-.7 2.6 1.6.4.6-2.6 1.3.3-.6 2.6 1.6.4.6-2.6c2.7.5 4.7.3 5.5-2.1.7-2-.1-3.1-1.5-3.8 1.1-.2 1.9-.9 2-2.6Zm-3.5 5c-.5 2-3.7.9-4.8.6l.9-3.6c1 .3 4.4.7 3.9 3Zm.5-5c-.4 1.8-3.1.9-4.1.6l.8-3.2c1 .2 3.8.6 3.3 2.6Z" fill="#fff"/></svg>`,
  Litecoin: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#345D9D"/><path d="m13.4 8h4.2l-2.2 8.5 2.5-.8-.6 2.4-2.5.8-.9 3.3h9.2l-.8 3H9.6l1.5-5.7-2.3.7.6-2.4 2.3-.7L13.4 8Z" fill="#fff"/></svg>`,
  RENEC: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#0F5EF7"/><path d="M11 22V10h5.6c2.6 0 4.3 1.5 4.3 3.9 0 1.8-1 3.1-2.6 3.6l3 4.5h-3.3l-2.6-4.1h-1.4V22H11Zm3-6.4h2.3c1.1 0 1.8-.6 1.8-1.6s-.7-1.6-1.8-1.6H14v3.2Z" fill="#fff"/></svg>`,
};

export function chainIcon(networkKey, size = 22) {
  const svg = ICONS[networkKey];
  if (!svg) return '';
  return `<span class="chain-ico" style="width:${size}px;height:${size}px;display:inline-flex;flex:0 0 ${size}px">${svg}</span>`;
}

export const COIN_ICON = {
  USDT: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#26A17B"/><path d="M17.9 17.4v0c-.1 0-.8.1-2 .1-.9 0-1.6 0-1.8-.1v0c-3.3-.1-5.8-.7-5.8-1.4 0-.7 2.5-1.3 5.8-1.5v2.3c.2 0 .9.1 1.8.1 1.2 0 1.9-.1 2-.1v-2.3c3.3.2 5.8.8 5.8 1.5 0 .7-2.5 1.3-5.8 1.4Zm0-3.1v-2h4.7V9.2H9.4v3.1h4.7v2C10.3 14.5 7.5 15.3 7.5 16.2c0 .9 2.8 1.7 6.6 1.9v6.5h3.8v-6.5c3.8-.2 6.6-1 6.6-1.9 0-.9-2.8-1.7-6.6-1.9Z" fill="#fff"/></svg>`,
  BTC: ICONS.Bitcoin,
  LTC: ICONS.Litecoin,
};
