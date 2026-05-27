/* ============================================
   IRONFORGE GYM — Main JavaScript
   Version: 1.0.0
   ============================================ */

(function () {
  'use strict';

  /* ─── HELPERS ─────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ─── NAVBAR ──────────────────────────────── */
  var navbar     = qs('.navbar');
  var hamburger  = qs('.navbar__hamburger');
  var mobileMenu = qs('.navbar__mobile');
  var menuOpen   = false;

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 18);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function toggleMenu(force) {
    menuOpen = typeof force === 'boolean' ? force : !menuOpen;
    if (hamburger)  hamburger.classList.toggle('open', menuOpen);
    if (mobileMenu) mobileMenu.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (hamburger) hamburger.setAttribute('aria-expanded', String(menuOpen));
  }

  if (hamburger)  hamburger.addEventListener('click', function () { toggleMenu(); });

  // Close menu on mobile link click
  qsa('.navbar__mobile-link').forEach(function (link) {
    link.addEventListener('click', function () { toggleMenu(false); });
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (menuOpen && mobileMenu && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Keyboard ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) toggleMenu(false);
  });

  /* ─── ACTIVE NAV LINK ─────────────────────── */
  (function setActiveLink() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    qsa('.navbar__link, .navbar__mobile-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  })();

  /* ─── SCROLL REVEAL ───────────────────────── */
  (function initReveal() {
    var els = qsa('.reveal, .reveal-left, .reveal-right');
    if (!els.length || typeof IntersectionObserver === 'undefined') {
      // Fallback: show all immediately
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -36px 0px' });

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ─── COUNTER ANIMATION ───────────────────── */
  (function initCounters() {
    var counters = qsa('[data-counter]');
    if (!counters.length || typeof IntersectionObserver === 'undefined') return;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function runCounter(el) {
      var target   = parseInt(el.getAttribute('data-target') || '0', 10);
      var duration = 2100;
      var start    = null;

      function step(ts) {
        if (!start) start = ts;
        var elapsed  = ts - start;
        var progress = Math.min(elapsed / duration, 1);
        var value    = Math.round(easeOutCubic(progress) * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      }

      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { io.observe(el); });
  })();

  /* ─── FAQ ACCORDION ───────────────────────── */
  (function initFAQ() {
    var items = qsa('.faq__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = qs('.faq__question', item);
      if (!btn) return;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        // Collapse all
        items.forEach(function (i) { i.classList.remove('open'); });
        // Expand clicked if it was closed
        if (!isOpen) item.classList.add('open');
      });

      // Keyboard support
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  })();

  /* ─── CONTACT FORM VALIDATION ─────────────── */
  (function initForm() {
    var form = qs('#contactForm');
    if (!form) return;

    var fields   = qsa('[data-required]', form);
    var fieldsEl = qs('.form__fields', form);
    var successEl = qs('.form__success', form);

    function getError(field) {
      var val  = field.value.trim();
      var type = field.getAttribute('data-validate') || '';

      if (!val) return 'This field is required.';

      if (type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
      }

      if (type === 'phone') {
        if (!/^[\d\s\+\-\(\)]{7,20}$/.test(val)) return 'Please enter a valid phone number.';
      }

      if (type === 'minlen') {
        var min = parseInt(field.getAttribute('data-min') || '10', 10);
        if (val.length < min) return 'Please write at least ' + min + ' characters.';
      }

      return '';
    }

    function validateField(field) {
      var msg    = getError(field);
      var errEl  = qs('#err_' + field.id, form);
      var isOk   = !msg;

      field.classList.toggle('error', !isOk);
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.toggle('show', !isOk);
      }
      return isOk;
    }

    fields.forEach(function (field) {
      field.addEventListener('blur',  function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      fields.forEach(function (f) { if (!validateField(f)) valid = false; });

      if (valid) {
        if (fieldsEl) fieldsEl.style.display = 'none';
        if (successEl) successEl.classList.add('show');
      }
    });
  })();

  /* ─── SMOOTH ANCHOR SCROLL ────────────────── */
  qsa('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = qs(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
        var top    = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ─── PRICING TOGGLE (monthly / annual) ──── */
  (function initPricingToggle() {
    var toggle = qs('#billingToggle');
    if (!toggle) return;

    var monthlyPrices = [49, 89, 149];
    var annualPrices  = [39, 71, 119];   // ~20% off
    var priceEls      = qsa('[data-price]');
    var toggleLabel   = qs('.pricing__toggle-label');

    toggle.addEventListener('change', function () {
      var annual = toggle.checked;
      priceEls.forEach(function (el, idx) {
        el.textContent = annual ? annualPrices[idx] : monthlyPrices[idx];
      });
      if (toggleLabel) toggleLabel.textContent = annual ? 'Billed annually (save 20%)' : 'Billed monthly';
    });
  })();

  /* ─── LAZY IMAGE LOADING ──────────────────── */
  (function initLazyImages() {
    if ('loading' in HTMLImageElement.prototype) return; // native support
    if (typeof IntersectionObserver === 'undefined') return;

    var imgs = qsa('img[data-src]');
    var io   = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    imgs.forEach(function (img) { io.observe(img); });
  })();

})();
