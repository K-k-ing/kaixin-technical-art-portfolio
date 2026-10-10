(() => {
  'use strict';

  function readPreference(storageName, key) {
    try {
      return window[storageName].getItem(key);
    } catch {
      return null;
    }
  }

  function savePreference(storageName, key, value) {
    try {
      window[storageName].setItem(key, value);
    } catch {
      // Navigation and controls still work when browser storage is unavailable.
    }
  }

  function focusElement(element) {
    if (element && element.isConnected && typeof element.focus === 'function') {
      element.focus({ preventScroll: true });
    }
  }

  function initializeHomepage() {
    const body = document.body;
    if (!body) return;

    const locale = body.dataset.locale === 'zh' ? 'zh' : 'en';
    const rootPrefix = body.dataset.rootPrefix || './';
    const isRootPage = body.dataset.rootPage === 'true';

    if (isRootPage && readPreference('sessionStorage', 'kp-locale') === 'zh') {
      window.location.replace(`${rootPrefix}zh/index.html${window.location.hash}`);
      return;
    }
    savePreference('sessionStorage', 'kp-locale', locale);

    const localeLinks = Array.from(document.querySelectorAll('[data-locale-link]'))
      .map(link => ({ link, href: link.getAttribute('href') || '' }));

    function preserveLocaleHash() {
      for (const { link, href } of localeLinks) {
        if (href && !href.includes('#')) {
          link.setAttribute('href', `${href}${window.location.hash}`);
        }
      }
    }

    preserveLocaleHash();
    window.addEventListener('hashchange', preserveLocaleHash);
    for (const { link } of localeLinks) {
      link.addEventListener('click', () => {
        const nextLocale = link.dataset.localeLink;
        if (nextLocale === 'en' || nextLocale === 'zh') {
          savePreference('sessionStorage', 'kp-locale', nextLocale);
        }
        preserveLocaleHash();
      });
    }

    const nav = document.querySelector('#kp-nav');
    const menuToggle = document.querySelector('.kp-menu-toggle');
    if (nav && menuToggle) {
      function setNavigationOpen(open, restoreFocus = false) {
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.classList.toggle('is-open', open);
        nav.classList.toggle('is-open', open);
        body.dataset.navOpen = String(open);
        if (restoreFocus) focusElement(menuToggle);
      }

      setNavigationOpen(false);
      menuToggle.addEventListener('click', () => {
        setNavigationOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('a');
        if (link && nav.contains(link)) setNavigationOpen(false);
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
          event.preventDefault();
          setNavigationOpen(false, true);
        }
      });
      document.addEventListener('click', event => {
        if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
        if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
          setNavigationOpen(false);
        }
      });
    }

    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const libraryCards = Array.from(document.querySelectorAll('.kp-library-card'));
    const filterCount = document.querySelector('#kp-filter-count');
    const allowedFilters = new Set(['all', 'spatial-ai', 'technical-art', 'tools', 'interactive']);

    function applyFilter(value) {
      const filter = allowedFilters.has(value) ? value : 'all';
      let visibleCount = 0;
      for (const card of libraryCards) {
        const categories = (card.dataset.categories || '').split(/\s+/).filter(Boolean);
        const visible = filter === 'all' || categories.includes(filter);
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      }
      for (const button of filterButtons) {
        const active = button.dataset.filter === filter;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
      }
      if (filterCount) {
        const label = filterCount.dataset.countLabel || (locale === 'zh' ? '个项目' : 'projects');
        filterCount.textContent = `${visibleCount} ${label}`;
        if (!filterCount.hasAttribute('aria-live')) filterCount.setAttribute('aria-live', 'polite');
      }
    }

    if (filterButtons.length || libraryCards.length) {
      const initiallyActive = filterButtons.find(button => button.getAttribute('aria-pressed') === 'true');
      applyFilter(initiallyActive ? initiallyActive.dataset.filter : 'all');
      for (const button of filterButtons) {
        button.addEventListener('click', () => applyFilter(button.dataset.filter));
      }
    }

    const motionButtons = Array.from(document.querySelectorAll('[data-motion-toggle]'));
    const revealNodes = Array.from(document.querySelectorAll('[data-kp-reveal]'));
    const reducedMotion = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    let userMotionOff = readPreference('localStorage', 'kp-motion') === 'off';
    let revealObserver = null;

    function revealAll() {
      for (const element of revealNodes) element.classList.add('is-visible');
      if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = null;
      }
    }

    function renderMotionPreference() {
      const systemMotionOff = Boolean(reducedMotion && reducedMotion.matches);
      const motionOn = !systemMotionOff && !userMotionOff;
      body.dataset.motion = motionOn ? 'on' : 'off';
      for (const button of motionButtons) {
        // This is a pause toggle: its pressed state means motion is off.
        button.setAttribute('aria-pressed', String(!motionOn));
        button.disabled = systemMotionOff;
        button.textContent = motionOn
          ? (button.dataset.labelOn || (locale === 'zh' ? '动态开启' : 'Motion on'))
          : (button.dataset.labelOff || (locale === 'zh' ? '动态关闭' : 'Motion off'));
      }
      if (!motionOn) revealAll();
    }

    renderMotionPreference();
    for (const button of motionButtons) {
      button.addEventListener('click', () => {
        if (reducedMotion && reducedMotion.matches) return;
        userMotionOff = !userMotionOff;
        savePreference('localStorage', 'kp-motion', userMotionOff ? 'off' : 'on');
        renderMotionPreference();
      });
    }
    if (reducedMotion) {
      if (typeof reducedMotion.addEventListener === 'function') {
        reducedMotion.addEventListener('change', renderMotionPreference);
      } else if (typeof reducedMotion.addListener === 'function') {
        reducedMotion.addListener(renderMotionPreference);
      }
    }

    if (body.dataset.motion === 'on' && typeof window.IntersectionObserver === 'function') {
      revealObserver = new window.IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          if (revealObserver) revealObserver.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -16px 0px' });
      for (const element of revealNodes) revealObserver.observe(element);
    } else {
      revealAll();
    }

    const lightbox = document.querySelector('#kp-lightbox');
    const lightboxImage = lightbox ? lightbox.querySelector('img') : null;
    const lightboxCaption = lightbox ? lightbox.querySelector('figcaption') : null;
    if (lightbox && lightboxImage) {
      const closeButtons = Array.from(lightbox.querySelectorAll('[data-lightbox-close]'));
      let lightboxTrigger = null;
      let previousOverflow = '';

      function restoreAfterLightbox() {
        lightboxImage.removeAttribute('src');
        lightboxImage.alt = '';
        if (lightboxCaption) lightboxCaption.textContent = '';
        body.classList.remove('kp-lightbox-open');
        body.style.overflow = previousOverflow;
        const returnTarget = lightboxTrigger;
        lightboxTrigger = null;
        focusElement(returnTarget);
      }

      function closeLightbox() {
        if (!lightbox.open) return;
        if (typeof lightbox.close === 'function') {
          lightbox.close();
        } else {
          lightbox.removeAttribute('open');
          restoreAfterLightbox();
        }
      }

      if (!lightbox.open) lightboxImage.removeAttribute('src');
      lightbox.addEventListener('close', restoreAfterLightbox);
      lightbox.addEventListener('cancel', event => {
        event.preventDefault();
        closeLightbox();
      });
      lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
      });
      for (const button of closeButtons) button.addEventListener('click', closeLightbox);

      document.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const trigger = event.target.closest('[data-kp-lightbox]');
        if (!trigger || !trigger.dataset.src) return;
        event.preventDefault();
        if (!lightbox.open) previousOverflow = body.style.overflow;
        lightboxTrigger = trigger;
        lightboxImage.alt = trigger.dataset.alt || '';
        lightboxImage.src = trigger.dataset.src;
        if (lightboxCaption) lightboxCaption.textContent = trigger.dataset.caption || '';
        body.classList.add('kp-lightbox-open');
        body.style.overflow = 'hidden';
        if (!lightbox.open) {
          if (typeof lightbox.showModal === 'function') lightbox.showModal();
          else lightbox.setAttribute('open', '');
        }
        focusElement(closeButtons[0]);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomepage, { once: true });
  } else {
    initializeHomepage();
  }
})();
