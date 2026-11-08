/* Shared, accessible cart navigation for static and injected headers. */
(() => {
  const cartSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.4 11.2h11l2-8H6.2"/></svg>';
  function updateCart() {
    const nav = document.querySelector('header nav');
    if (!nav) return;
    let link = nav.querySelector('.cart-btn');
    if (!link) {
      link = document.createElement('a');
      link.className = 'cart-btn';
      link.innerHTML = cartSvg + '<span class="cart-count">0</span>';
      nav.insertBefore(link, nav.querySelector('.nav-cta, .hamburger'));
    }
    link.setAttribute('href', 'cart.html');
    link.setAttribute('aria-label', 'View shopping cart');
    link.setAttribute('title', 'View shopping cart');
    let count = 0;
    try {
      const cart = JSON.parse(localStorage.getItem('tlmCart') || '[]');
      if (Array.isArray(cart)) count = cart.length;
    } catch { /* An invalid draft is an empty cart. */ }
    const badge = link.querySelector('.cart-count');
    if (badge) badge.textContent = String(count);
  }
  updateCart();
  // Checkout renders its header after its module dependencies have loaded.
  const header = document.getElementById('coHeader');
  if (header) new MutationObserver(updateCart).observe(header, { childList: true });
  window.addEventListener('storage', updateCart);
  window.addEventListener('pageshow', updateCart);
  document.addEventListener('click', () => setTimeout(updateCart, 0));

  /* Show a full-page loading circle the instant someone taps a link to the
     tradelines vault, so the wait is acknowledged before the page changes. */
  let pageLoader = null;
  function showPageLoader() {
    if (pageLoader) return;
    pageLoader = document.createElement('div');
    pageLoader.className = 'tl-page-loader';
    pageLoader.innerHTML =
      '<div class="tl-page-loader-ring" role="status" aria-label="Loading tradelines"></div>' +
      '<div class="tl-page-loader-text">Loading available tradelines</div>';
    document.body.appendChild(pageLoader);
  }
  function hidePageLoader() {
    if (pageLoader) { pageLoader.remove(); pageLoader = null; }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (e.defaultPrevented || e.button !== 0 || a.hasAttribute('download') ||
        (a.target && a.target !== '_self') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const destination = new URL(href, window.location.href);
    if (destination.origin === window.location.origin && destination.pathname.endsWith('/marketplace.html') &&
        !window.location.pathname.endsWith('/marketplace.html')) {
      e.preventDefault();
      showPageLoader();
      // Give the browser a paint before replacing the current document.
      requestAnimationFrame(() => setTimeout(() => window.location.assign(destination.href), 80));
    }
  }, true);

  // If the browser restores this page from its back/forward cache, remove the veil.
  window.addEventListener('pageshow', (e) => { if (e.persisted) hidePageLoader(); });

  /* Make existing menu and dashboard controls usable without a mouse. */
  const menu = document.getElementById('mobileNav');
  const trigger = document.getElementById('menuBtn') || document.querySelector('.hamburger');
  if (menu && trigger) {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', 'Open navigation');
    trigger.setAttribute('aria-controls', 'mobileNav');
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Site navigation');
    const isOpen = () => menu.classList.contains('open');
    const controls = () => [...menu.querySelectorAll('a[href], button, [tabindex="0"]')].filter(el => el.getClientRects().length);
    const syncMenu = () => {
      trigger.setAttribute('aria-expanded', String(isOpen()));
      if (isOpen()) controls()[0]?.focus();
    };
    syncMenu();
    new MutationObserver(syncMenu).observe(menu, { attributes: true, attributeFilter: ['class'] });
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
    });
    document.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        menu.querySelector('.mobile-nav-close')?.click();
        trigger.focus();
      }
      if (e.key === 'Tab') {
        const items = controls();
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    });
  }
  document.querySelectorAll('.dash-nav-item[onclick]').forEach(item => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
  document.querySelectorAll('.res-tab[onclick]').forEach(item => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
})();
