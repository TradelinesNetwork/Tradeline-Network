// Brand marks for card issuers, drawn as inline SVG so they render crisply
// everywhere (marketplace cards, cart rows, checkout summaries) with no
// network requests and no emoji.

const wrap = (size, bg, inner, radius = 8) =>
  `<span class="bank-logo" style="width:${size}px;height:${size}px;flex:0 0 ${size}px;border-radius:${radius}px;background:${bg};display:inline-flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)">${inner}</span>`;

const svg = (body, vb = '0 0 40 40') =>
  `<svg viewBox="${vb}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;

const LOGOS = {
  amex: (s) =>
    wrap(
      s,
      '#006FCF',
      svg(
        `<rect width="40" height="40" fill="#006FCF"/>
         <rect x="5" y="12" width="30" height="16" rx="2" fill="#fff"/>
         <text x="20" y="23.6" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="8.4" font-weight="700" fill="#006FCF" letter-spacing=".4">AMEX</text>`,
      ),
    ),
  chase: (s) =>
    wrap(
      s,
      '#117ACA',
      svg(
        `<rect width="40" height="40" fill="#117ACA"/>
         <g fill="#fff">
           <path d="M18.6 9h2.8c.6 0 1 .4 1 1v5.4h-4.8V10c0-.6.4-1 1-1Z"/>
           <path d="M31 18.6v2.8c0 .6-.4 1-1 1h-5.4v-4.8H30c.6 0 1 .4 1 1Z"/>
           <path d="M21.4 31h-2.8c-.6 0-1-.4-1-1v-5.4h4.8V30c0 .6-.4 1-1 1Z"/>
           <path d="M9 21.4v-2.8c0-.6.4-1 1-1h5.4v4.8H10c-.6 0-1-.4-1-1Z"/>
         </g>`,
      ),
    ),
  discover: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <text x="20" y="18" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="7.2" font-weight="700" fill="#12100B" letter-spacing="-.2">DISC VER</text>
         <circle cx="24.1" cy="15.4" r="2.9" fill="#F26E21"/>
         <rect x="4" y="24" width="32" height="9" rx="4.5" fill="#F26E21"/>
         <text x="20" y="30.4" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6" font-weight="700" fill="#fff">CARD</text>`,
      ),
    ),
  barclays: (s) =>
    wrap(
      s,
      '#00AEEF',
      svg(
        `<rect width="40" height="40" fill="#00AEEF"/>
         <path d="M20 8c5 2.6 8.6 5.6 11 9.6-3.4-1.6-6.2-2.2-9-2.2 3.6 2.6 6.2 6 7.8 10.2-3-2.6-5.8-4.2-8.8-5 2.4 3 3.8 6 4.4 9.4-2.4-3-4.6-5-7.4-6.4 1.2 2.6 1.8 5 1.8 7.4-2.6-4.6-5.4-8-9.8-11 3.6.4 6.4.4 9-.2-3.6-1.8-6.4-4.4-8.4-7.8 3.4 1.8 6.4 2.8 9.6 3-1.6-2.2-2.4-4.4-2.2-7Z" fill="#fff"/>`,
      ),
    ),
  citi: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <path d="M12 15c2.2-4 5.4-6 9.4-6 2.4 0 4.4.6 6.2 1.8" stroke="#EE1C25" stroke-width="2.6" fill="none" stroke-linecap="round"/>
         <text x="20" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="700" fill="#003B70">citi</text>`,
      ),
    ),
  capitalone: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <path d="M6 25c6-9 16-13 28-11-9 1-16 4-21 9 6-2 11-2.4 16-1.4-9 1-16 4-21 8.4L6 25Z" fill="#D03027"/>
         <text x="20" y="34" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6.4" font-weight="700" fill="#004879">CAPITAL ONE</text>`,
      ),
    ),
  boa: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <path d="M6 22c4-4 9-7 14-8.6-3.4 2-6.4 4.4-9 7.2-1.8.4-3.4.9-5 1.4Z" fill="#E31837"/>
         <path d="M14 25c5-5 11-8.6 17-10.6-4 2.4-7.6 5.4-10.6 8.8-2.2.5-4.3 1.1-6.4 1.8Z" fill="#012169"/>
         <path d="M22 28c5.4-5.6 11.6-9.6 12-9.8-3.4 3-6.4 6.4-8.8 10.2-1.1-.2-2.2-.3-3.2-.4Z" fill="#E31837"/>
         <text x="20" y="36" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="5.6" font-weight="700" fill="#012169">BANK OF AMERICA</text>`,
      ),
    ),
  wells: (s) =>
    wrap(
      s,
      '#D71E28',
      svg(
        `<rect width="40" height="40" fill="#D71E28"/>
         <rect x="7" y="16" width="26" height="9" rx="1.4" fill="#FFCD41"/>
         <circle cx="13" cy="27" r="3" fill="#FFCD41"/>
         <circle cx="28" cy="27" r="3.6" fill="#FFCD41"/>
         <path d="M9 16 12 12h14l4 4H9Z" fill="#FFCD41"/>`,
      ),
    ),
  pnc: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <path d="M6 27 14 9l6 18H6Z" fill="#F58025"/>
         <path d="M18 27 26 9l8 18H18Z" fill="#004B87"/>
         <text x="20" y="35" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="7" font-weight="700" fill="#004B87">PNC</text>`,
      ),
    ),
  usbank: (s) =>
    wrap(
      s,
      '#0C2074',
      svg(
        `<rect width="40" height="40" fill="#0C2074"/>
         <rect x="6" y="12" width="28" height="4" fill="#D6001C"/>
         <text x="20" y="27" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="700" fill="#fff">U.S.</text>
         <text x="20" y="34" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="5.6" font-weight="700" fill="#fff">BANK</text>`,
      ),
    ),
  navyfed: (s) =>
    wrap(
      s,
      '#002B5C',
      svg(
        `<rect width="40" height="40" fill="#002B5C"/>
         <g stroke="#FDB913" stroke-width="2" fill="none" stroke-linecap="round">
           <path d="M20 12v16"/>
           <path d="M15 16h10"/>
           <path d="M11 24a9 9 0 0 0 18 0"/>
         </g>
         <circle cx="20" cy="10.5" r="2.4" fill="none" stroke="#FDB913" stroke-width="2"/>`,
      ),
    ),
  synchrony: (s) =>
    wrap(
      s,
      '#ffffff',
      svg(
        `<rect width="40" height="40" fill="#fff"/>
         <circle cx="20" cy="18" r="8" fill="none" stroke="#00539B" stroke-width="3"/>
         <path d="M20 10a8 8 0 0 1 8 8" stroke="#F5B335" stroke-width="3" fill="none" stroke-linecap="round"/>
         <text x="20" y="35" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6" font-weight="700" fill="#00539B">SYNCHRONY</text>`,
      ),
    ),
  elan: (s) =>
    wrap(
      s,
      '#0F4C81',
      svg(
        `<rect width="40" height="40" fill="#0F4C81"/>
         <text x="20" y="25" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="#fff">elan</text>`,
      ),
    ),
  auto: (s) =>
    wrap(
      s,
      '#12324F',
      svg(
        `<rect width="40" height="40" fill="#12324F"/>
         <g fill="none" stroke="#8FD3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M9 24h22v-4l-3-6H12l-3 6v4Z"/><path d="M13 28a2 2 0 1 0 0-.1"/><path d="M27 28a2 2 0 1 0 0-.1"/>
         </g>`,
      ),
    ),
  mortgage: (s) =>
    wrap(
      s,
      '#123F32',
      svg(
        `<rect width="40" height="40" fill="#123F32"/>
         <g fill="none" stroke="#8FE3C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M9 20 20 11l11 9"/><path d="M12 20v10h16V20"/><path d="M17 30v-6h6v6"/>
         </g>`,
      ),
    ),
  package: (s) =>
    wrap(
      s,
      '#3B2E63',
      svg(
        `<rect width="40" height="40" fill="#3B2E63"/>
         <g fill="none" stroke="#C9B8FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M20 10 30 15v10l-10 5-10-5V15l10-5Z"/><path d="M10 15l10 5 10-5"/><path d="M20 20v10"/>
         </g>`,
      ),
    ),
  service: (s) =>
    wrap(
      s,
      '#4A3A16',
      svg(
        `<rect width="40" height="40" fill="#4A3A16"/>
         <g fill="none" stroke="#F6CE6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M20 9l9 4v7c0 5.5-3.8 9.4-9 11-5.2-1.6-9-5.5-9-11v-7l9-4Z"/><path d="M16 20l3 3 6-6"/>
         </g>`,
      ),
    ),
  generic: (s, name) =>
    wrap(
      s,
      'linear-gradient(135deg,#1f2a44,#33436b)',
      svg(
        `<rect width="40" height="40" fill="none"/>
         <text x="20" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" font-weight="700" fill="#fff">${(name || 'TL').slice(0, 2).toUpperCase()}</text>`,
      ),
    ),
};

function keyFor(bank) {
  const n = String(bank || '').toLowerCase();
  if (n.includes('american express') || n.includes('amex')) return 'amex';
  if (n.includes('chase')) return 'chase';
  if (n.includes('discover')) return 'discover';
  if (n.includes('barclay')) return 'barclays';
  if (n.includes('citi')) return 'citi';
  if (n.includes('capital one')) return 'capitalone';
  if (n.includes('bank of america')) return 'boa';
  if (n.includes('wells')) return 'wells';
  if (n.includes('pnc')) return 'pnc';
  if (n.includes('u.s bank') || n.includes('u.s. bank') || n.includes('us bank')) return 'usbank';
  if (n.includes('navy federal')) return 'navyfed';
  if (n.includes('synchrony')) return 'synchrony';
  if (n.includes('elan')) return 'elan';
  if (n.includes('auto')) return 'auto';
  if (n.includes('mortgage')) return 'mortgage';
  if (n.includes('package') || n.includes('cpn')) return 'package';
  if (n.includes('sweep') || n.includes('sba') || n.includes('service')) return 'service';
  return 'generic';
}

/** Returns an HTML string with the issuer's brand mark. */
export function bankLogo(bank, size = 38) {
  const key = keyFor(bank);
  const fn = LOGOS[key] || LOGOS.generic;
  return fn(size, bank);
}

export default bankLogo;
