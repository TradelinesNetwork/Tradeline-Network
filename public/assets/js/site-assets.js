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
})();
