# Modern Institutional Financial Redesign

## Goal
Apply the approved Modern Institutional Financial direction consistently across the marketing site, marketplace, account area, and checkout flow without changing existing order or authentication behavior.

## What will change
- Standardize typography on Instrument Serif for headings and Work Sans for interface and body copy.
- Refine the Emerald Prestige palette for stronger contrast, using emerald for structure, restrained gold accents, white surfaces, and crisp neutral borders.
- Establish a more editorial page rhythm with clearer section hierarchy, narrower reading widths, stronger rules, and less card-heavy presentation.
- Rework the tradeline marketplace hierarchy so filters, availability, bank identity, pricing, deadlines, and purchase actions scan quickly on desktop and mobile.
- Add restrained trust cues around inventory, posting protection, secure checkout, and order support using professional line icons rather than emojis.
- Improve account, profile, orders, and checkout surfaces with consistent spacing, flatter panels, readable tables, and vertical mobile arrangements.
- Restore prominent keyboard focus states, improve modal behavior, fix cramped small-screen controls, and ensure tap targets remain usable.
- Replace non-semantic mobile menu triggers on static pages with accessible buttons and synchronized expanded states where practical.

## Technical details
- Consolidate the final visual layer in `theme-financial.css` and update its cache version across all HTML pages.
- Keep existing bank logos, inventory data, cart flow, account logic, payment logic, and API behavior unchanged.
- Synchronize the React fallback screen and shared design tokens with the same institutional palette and typography.
- Validate key public pages, marketplace/cart, account/auth, and checkout at desktop and narrow mobile widths; check overflow, console errors, and current preview build health.
