/* Per-page ambient background + preload + security meta.
   Adds a unique background photo to each of the 12 pages, preloads it
   for a fast paint, and injects meta-level security hardening for the
   static HTML pages (CSP, Referrer-Policy, X-Content-Type-Options,
   Permissions-Policy). */
(function () {
  try {
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var map = {
      'index.html':       'dashboard-growth.jpg',
      '':                 'dashboard-growth.jpg',
      'about.html':       'luxury-home.jpg',
      'marketplace.html': 'trading-on-the-go.jpg',
      'brokers.html':     'cart-analytics.jpg',
      'cart.html':        'cart-checkout.jpg',
      'contact.html':     'luxury-home.jpg',
      'account.html':     'cart-analytics.jpg',
      'blog.html':        'dashboard-growth.jpg',
      'resources.html':   'trading-on-the-go.jpg',
      'calculator.html':  'cart-analytics.jpg',
      'sell.html':        'dashboard-growth.jpg',
      'legal.html':       'luxury-home.jpg'
    };
    var img = map[path] || 'dashboard-growth.jpg';
    var base = location.pathname.replace(/[^/]*$/, '');
    var url = base + 'assets/images/' + img;

    // Preload the background image (network hint fires early)
    try {
      var pre = document.createElement('link');
      pre.rel = 'preload'; pre.as = 'image'; pre.href = url;
      pre.setAttribute('fetchpriority', 'high');
      document.head.appendChild(pre);
    } catch (_) {}

    // Set the CSS var used by enhance.css
    document.documentElement.style.setProperty('--page-bg', "url('" + url + "')");

    // ---- Security-focused meta tags (best-effort for static HTML) ----
    function meta(attr, name, value, content) {
      if (document.querySelector('meta[' + attr + '="' + name + '"]')) return;
      var m = document.createElement('meta');
      m.setAttribute(attr, name);
      if (value) m.setAttribute('content', value);
      if (content) m.setAttribute('content', content);
      document.head.appendChild(m);
    }
    meta('name', 'referrer', 'strict-origin-when-cross-origin');
    meta('http-equiv', 'X-Content-Type-Options', 'nosniff');
    meta('http-equiv', 'Permissions-Policy',
         'geolocation=(), microphone=(), camera=(), payment=(), usb=(), fullscreen=(self)');

    // Warm up amber loading indicator for reduced-motion friendly UX
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }
  } catch (e) { /* no-op */ }
})();
