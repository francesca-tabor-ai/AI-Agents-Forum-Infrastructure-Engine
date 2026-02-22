/**
 * App enhancements: scroll-to-top, lazy loading, micro-interactions
 */
(function () {
  'use strict';

  // ========== SCROLL TO TOP ON PAGE NAVIGATION ==========
  // Ensures every page load starts at the top; then scrolls to hash target if present
  function initScrollToTop() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    if (location.hash) {
      var el = document.getElementById(location.hash.slice(1));
      if (el) {
        requestAnimationFrame(function () {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  // ========== LAZY REVEAL - Sections animate in when they enter viewport ==========
  function initLazyReveal() {
    var targets = document.querySelectorAll(
      '.customer-cards, .pain-grid, .solution-grid, .results-stats, ' +
      '.pricing-tiers, .case-studies-grid, .logos-section, ' +
      '.section-inner > h2, .section-lead, .scale-control, .contact-inner, ' +
      '.pricing-hero, .case-studies-hero, .cta-buttons'
    );

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0 }
    );

    targets.forEach(function (el) {
      el.classList.add('lazy-reveal');
      observer.observe(el);
    });
  }

  // ========== LAZY LOADING FOR IMAGES (future-proof) ==========
  function initImageLazyLoad() {
    var images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    var imgObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            img.src = img.dataset.src || img.src;
            if (img.dataset.srcset) img.srcset = img.dataset.srcset;
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            imgObserver.unobserve(img);
          }
        });
      },
      { rootMargin: '50px 0px' }
    );

    images.forEach(function (img) { imgObserver.observe(img); });
  }

  // ========== MICRO-INTERACTIONS ==========
  function initMicroInteractions() {
    // Add active-state class for tactile button/link feedback
    var interactive = document.querySelectorAll('a.btn, button, .nav-links a, .footer-links a, .chat-probe');
    interactive.forEach(function (el) {
      el.addEventListener('mousedown', function () {
        el.classList.add('is-active');
      });
      el.addEventListener('mouseup', function () {
        el.classList.remove('is-active');
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-active');
      });
    });
  }

  // ========== INIT ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function run() {
    initScrollToTop();
    initLazyReveal();
    initImageLazyLoad();
    initMicroInteractions();
  }
})();
