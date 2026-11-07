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
  const loaderCss = document.createElement('style');
  loaderCss.textContent =
    '.tl-page-loader{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:16px;background:rgba(245,240,224,0.96);}' +
    '.tl-page-loader-ring{width:52px;height:52px;border-radius:50%;border:5px solid rgba(11,42,91,0.15);' +
    'border-top-color:#c9a84c;animation:tlPageSpin 0.8s linear infinite;}' +
    '.tl-page-loader-text{font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;' +
    'color:rgba(11,42,91,0.7);font-family:inherit;}' +
    '@keyframes tlPageSpin{to{transform:rotate(360deg)}}';
  document.head.appendChild(loaderCss);

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
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (/marketplace\.html/.test(href)) showPageLoader();
  }, true);

  // If the browser restores this page from its back/forward cache, remove the veil.
  window.addEventListener('pageshow', (e) => { if (e.persisted) hidePageLoader(); });
})();
