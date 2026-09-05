/* ==========================================================================
   Terraço Urbano Bar e Restaurante — main.js
   Single self-contained JavaScript file (no modules / no external deps)
   Handles all client-side interactivity for the site.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
   * Utilities
   * ---------------------------------------------------------------------- */
  var REVIEW_STEP = 0.55; // px por frame no carrossel de avaliações (~33px/s)
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function isElementVisible(el) {
    return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function dispatch(target, name, detail) {
    var event;
    if (typeof window.CustomEvent === 'function') {
      event = new CustomEvent(name, { detail: detail });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(name, true, true, detail);
    }
    (target || document).dispatchEvent(event);
  }

  /* ------------------------------------------------------------------------
   * 1. DOM LOADING
   * ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initHeaderEffects();
    initMobileMenu();
    initScrollProgress();
    initMenuSystem();
    initEventsSystem();
    initGalleryLightbox();
    initScrollAnimations();
    initSmoothScroll();
    initWhatsApp();
    initAnalytics();
    initHoursDisplay();
    initScrollToTop();
    initImageLazyLoading();
    initSwipeDetection();
    initDataTrackBinding();
    initCookieConsent();
    initWaze();
    initReviews();

    onMenuLoaded();
  });

  /* Small helper so that analytics / other features know the menu has loaded */
  function onMenuLoaded() {
    // Ensures lazy-loading observers pick up dynamically injected images
    initImageLazyLoading();
  }

  /* ------------------------------------------------------------------------
   * 2. HEADER SCROLL EFFECT
   * ---------------------------------------------------------------------- */
  function initHeaderEffects() {
    var header = $('.site-header');
    var floatingCta = $('.floating-cta');
    if (!header && !floatingCta) return;

    var lastScrollY = window.pageYOffset || 0;
    var ticking = false;
    var progressBar = $('.scroll-progress');

    function updateHeader() {
      var scrollY = window.pageYOffset || 0;
      var scrollingDown = scrollY > lastScrollY;

      if (header) {
        if (scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        if (scrollingDown && scrollY > 250) {
          header.classList.add('hidden');
        } else {
          header.classList.remove('hidden');
        }
      }

      if (floatingCta) {
        if (scrollingDown && scrollY > 250) {
          floatingCta.classList.add('hidden');
        } else {
          floatingCta.classList.remove('hidden');
        }
      }

      // Scroll progress bar
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      if (progressBar) {
        progressBar.style.setProperty('--scroll-progress', progress.toFixed(2) + '%');
      }
      if (document.documentElement) {
        document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(2) + '%');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    updateHeader();
  }

  /* ------------------------------------------------------------------------
   * 3. MOBILE MENU TOGGLE
   * ---------------------------------------------------------------------- */
  function initMobileMenu() {
    var hamburger = $('.hamburger');
    var nav = $('.main-nav');
    var body = document.body;

    if (!hamburger || !nav) return;

    var menuOpen = false;
    var lastFocused = null;

    function getFocusableElements() {
      return $$('a, button, input, select, textarea', nav).filter(function (el) {
        return !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1';
      });
    }

    function openMenu() {
      menuOpen = true;
      lastFocused = document.activeElement;
      hamburger.classList.add('active');
      nav.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      nav.setAttribute('aria-hidden', 'false');
      body.classList.add('menu-open');
    }

    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      hamburger.classList.remove('active');
      nav.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
      body.classList.remove('menu-open');
      if (lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on nav link click
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) {
        closeMenu();
      }

      // Trap focus inside menu when open
      if (e.key === 'Tab' && menuOpen) {
        var focusables = getFocusableElements();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        var active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !nav.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !nav.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (menuOpen && !nav.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    });

    // Reset state on resize (desktop)
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && menuOpen) {
        closeMenu();
      }
    });

    hamburger.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');
  }

  /* ------------------------------------------------------------------------
   * 4. SCROLL PROGRESS BAR
   *    (handled within initHeaderEffects via --scroll-progress CSS variable)
   * ---------------------------------------------------------------------- */

  /* ------------------------------------------------------------------------
   * 5. MENU SYSTEM (Cardápio)
   * ---------------------------------------------------------------------- */
  function initMenuSystem() {
    var container = $('[data-menu-container]');
    if (!container) return;

    var menuData = null;
    var activeCategory = 'all';
    var menuTabsWrap = $('[data-menu-tabs]', container);
    var menuItemsWrap = $('[data-menu-items]', container);
    var menuRoot = $('[data-menu-root]', container) || container;

    var tabs = [];
    var allItems = [];

    // ---- Fetch data ----
    fetch('data/menu.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.categories) {
          renderMenuError('Estrutura inválida em data/menu.json');
          return;
        }
        menuData = data;

        // Flatten all items with their category
        data.categories.forEach(function (category) {
          (category.items || []).forEach(function (item) {
            allItems.push({
              category: category,
              item: item
            });
          });
        });

        // Build tabs (All + each category)
        tabs = [{ id: 'all', name: 'Todos', icon: '' }].concat(
          data.categories.map(function (cat) {
            return { id: cat.id, name: cat.name, icon: cat.icon || '' };
          })
        );

        buildTabs();
        renderCategory('all');
        trackMenuView('all');
      })
      .catch(function (err) {
        renderMenuError('Falha ao carregar o cardápio. Tente novamente.');
        if (window.console) console.error('Menu load error:', err);
      });

    // ---- Build filter tabs ----
    function buildTabs() {
      if (!menuTabsWrap) return;
      menuTabsWrap.innerHTML = '';

      tabs.forEach(function (tab) {
        var btn = document.createElement('button');
        btn.className = 'menu-tab';
        btn.type = 'button';
        btn.dataset.category = tab.id;
        btn.setAttribute('aria-pressed', tab.id === activeCategory ? 'true' : 'false');
        if (tab.icon) {
          var icon = document.createElement('span');
          icon.className = 'menu-tab-icon';
          icon.textContent = tab.icon;
          btn.appendChild(icon);
        }
        var label = document.createElement('span');
        label.className = 'menu-tab-label';
        label.textContent = tab.name;
        btn.appendChild(label);

        if (tab.id === 'all') {
          btn.classList.add('menu-tab-all');
        }

        btn.addEventListener('click', function () {
          if (activeCategory === tab.id) return;
          activeCategory = tab.id;
          renderCategory(activeCategory);
          trackMenuView(activeCategory);
        });

        menuTabsWrap.appendChild(btn);
      });
    }

    // ---- Render category ----
    function renderCategory(categoryId) {
      // Update active tab styling
      if (menuTabsWrap) {
        $$('.menu-tab', menuTabsWrap).forEach(function (btn) {
          var isActive = btn.dataset.category === categoryId;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      }

      if (!menuItemsWrap) return;

      if (categoryId === 'all') {
        renderAllCategories();
      } else {
        var cat = (menuData.categories || []).find(function (c) {
          return c.id === categoryId;
        });
        if (!cat) {
          renderMenuError('Categoria não encontrada.');
          return;
        }
        renderSingleCategory(cat);
      }
    }

    function renderSingleCategory(cat) {
      var items = cat.items || [];
      if (items.length === 0) {
        menuItemsWrap.innerHTML = '<div class="menu-empty">Em breve novas opções em ' + escapeHtml(cat.name) + '.</div>';
        return;
      }

      var inner = '';
      items.forEach(function (item) {
        inner += menuItemHTML(cat, item);
      });

      menuItemsWrap.innerHTML =
        '<div class="menu-category">' +
          '<div class="menu-category-header">' +
            '<span class="menu-category-icon">' + (cat.icon || '') + '</span>' +
            '<h3 class="menu-category-title">' + escapeHtml(cat.name) + '</h3>' +
          '</div>' +
          '<div class="menu-items-grid">' + inner + '</div>' +
        '</div>';
    }

    function renderAllCategories() {
      var cats = menuData.categories || [];
      var html = '';
      cats.forEach(function (cat) {
        var items = cat.items || [];
        if (items.length === 0) return;
        var inner = '';
        items.forEach(function (item) {
          inner += menuItemHTML(cat, item);
        });
        html +=
          '<div class="menu-category" id="menu-cat-' + escapeHtml(cat.id) + '">' +
            '<div class="menu-category-header">' +
              '<span class="menu-category-icon">' + (cat.icon || '') + '</span>' +
              '<h3 class="menu-category-title">' + escapeHtml(cat.name) + '</h3>' +
            '</div>' +
            '<div class="menu-items-grid">' + inner + '</div>' +
          '</div>';
      });

      if (!html) {
        html = '<div class="menu-empty">O cardápio ainda está sendo preparado.</div>';
      }
      menuItemsWrap.innerHTML = html;

      // Refresh lazy loading for newly injected images
      initImageLazyLoading();

      // Refresh scroll animations for new elements
      initScrollAnimations(menuItemsWrap);
    }

    function menuItemHTML(cat, item) {
      var featureBadge = item.featured ? '<span class="menu-badge">Destaque</span>' : '';
      var imgHTML;
      var image = item.image || '';

      if (image && image.indexOf('[INSERIR') === -1) {
        imgHTML =
          '<div class="menu-item-image">' +
            '<img data-src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.name) + '" ' +
                 'class="lazy-image">' +
            featureBadge +
          '</div>';
      } else {
        imgHTML =
          '<div class="menu-item-image menu-item-image-placeholder">' +
            '<span class="menu-item-icon">' + (cat.icon || '🍴') + '</span>' +
            featureBadge +
          '</div>';
      }

      var priceText = String(item.price || '').replace('[INSERIR PREÇO]', 'A definir');

      return (
        '<article class="menu-item" data-category="' + escapeHtml(cat.id) + '">' +
          imgHTML +
          '<div class="menu-item-body">' +
            '<h4 class="menu-item-name">' + escapeHtml(item.name).replace(/\[INSERIR[^\]]*\]/g, 'Novidade') + '</h4>' +
            '<p class="menu-item-description">' + escapeHtml(item.description).replace(/\[INSERIR[^\]]*\]/g, '') + '</p>' +
            '<div class="menu-item-footer">' +
              '<span class="menu-item-price">' + escapeHtml(priceText) + '</span>' +
              renderItemTags(item.tags) +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }

    function renderItemTags(tags) {
      if (!tags || tags.length === 0) return '';
      return (
        '<div class="menu-item-tags">' +
          tags.map(function (tag) {
            return '<span class="menu-item-tag">' + escapeHtml(tag) + '</span>';
          }).join('') +
        '</div>'
      );
    }

    function renderMenuError(message) {
      if (menuItemsWrap) {
        menuItemsWrap.innerHTML =
          '<div class="menu-error">' +
            '<p>' + escapeHtml(message) + '</p>' +
            '<button type="button" class="btn btn-primary" data-menu-retry>Recarregar</button>' +
          '</div>';
        var retry = $('[data-menu-retry]', menuItemsWrap);
        if (retry) retry.addEventListener('click', function () { initMenuSystem(); });
      }
    }

    function trackMenuView(categoryId) {
      trackEvent('menu', 'view', categoryId || 'all');
    }
  }

  /* ------------------------------------------------------------------------
   * 6. EVENTS SYSTEM
   * ---------------------------------------------------------------------- */
  function initEventsSystem() {
    var container = $('[data-events-container]');
    if (!container) return;

    fetch('data/events.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.events) {
          renderEventsError(container, 'Estrutura inválida em data/events.json');
          return;
        }
        renderEvents(container, data);
      })
      .catch(function (err) {
        renderEventsError(container, 'Falha ao carregar a programação.');
        if (window.console) console.error('Events load error:', err);
      });
  }

  function renderEvents(container, data) {
    var events = (data.events || []).map(function (ev) {
      return Object.assign({}, ev, {
        sortDate: normalizeEventDate(ev.date)
      });
    });

    // Sort so events with resolved dates come first (upcoming first), then recurring
    events.sort(function (a, b) {
      if (a.sortDate === null && b.sortDate !== null) return 1;
      if (a.sortDate !== null && b.sortDate === null) return -1;
      if (a.sortDate !== null && b.sortDate !== null) {
        return a.sortDate.getTime() - b.sortDate.getTime();
      }
      return 0;
    });

    var featured = events.filter(function (ev) { return ev.featured; });
    var nonFeatured = events.filter(function (ev) { return !ev.featured; });
    var ordered = featured.concat(nonFeatured);

    var inner = '';
    ordered.forEach(function (ev) {
      inner += eventCardHTML(ev);
    });

    if (!inner) {
      inner = '<div class="events-empty">Nossa agenda está sendo atualizada. Volte em breve!</div>';
    }

    container.innerHTML =
      '<div class="events-grid">' + inner + '</div>';

    // Refresh lazy loading for injected images
    initImageLazyLoading();
    initScrollAnimations(container);
  }

  function eventCardHTML(ev) {
    var image = ev.image || '';
    var isRecurring = ev.date === 'every-saturday' || ev.date === 'every-saturday';

    var dateHTML;
    if (isRecurring) {
      dateHTML =
        '<div class="event-date event-date-recurring">' +
          '<span class="event-date-label">Todo</span>' +
          '<span class="event-date-value">Sábado</span>' +
        '</div>';
    } else {
      var d = parseEventDate(ev.date);
      if (d) {
        dateHTML =
          '<div class="event-date">' +
            '<span class="event-date-label">' + monthShort(d) + '</span>' +
            '<span class="event-date-value">' + d.getDate() + '</span>' +
          '</div>';
      } else {
        dateHTML = '<div class="event-date event-date-placeholder"><span>A definir</span></div>';
      }
    }

    var imgHTML = image && image.indexOf('[INSERIR') === -1
      ? '<img data-src="' + escapeHtml(image) + '" alt="' + escapeHtml(ev.title) + '" class="lazy-image">'
      : '<div class="event-image-placeholder"><span>🎤</span></div>';

    var featuredBadge = ev.featured ? '<span class="event-badge">Destaque</span>' : '';

    var time = ev.time || '';
    if (time.indexOf('[INSERIR') !== -1) time = '';

    return (
      '<article class="event-card' + (ev.featured ? ' event-card-featured' : '') + '">' +
        '<div class="event-image">' + imgHTML + featuredBadge + '</div>' +
        '<div class="event-body">' +
          dateHTML +
          '<div class="event-content">' +
            '<h3 class="event-title">' + escapeHtml(ev.title) + '</h3>' +
            (ev.artist ? '<p class="event-artist">' + escapeHtml(ev.artist) + '</p>' : '') +
            (ev.description ? '<p class="event-description">' + escapeHtml(ev.description) + '</p>' : '') +
            '<div class="event-meta">' +
              (time ? '<span class="event-time">🕗 ' + escapeHtml(time) + '</span>' : '') +
              (isRecurring ? '<span class="event-recurring-badge">Recorrente</span>' : '') +
              '<a class="event-reserve" href="' + contactTarget() + '" ' +
                 'data-track-label="reserva-evento-' + escapeHtml(ev.id) + '">' +
                'Garantir mesa' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function parseEventDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    if (dateStr === 'every-saturday') return null;
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function normalizeEventDate(dateStr) {
    var d = parseEventDate(dateStr);
    if (d) return d;
    if (dateStr === 'every-saturday') {
      return nextSaturday();
    }
    return null;
  }

  function nextSaturday() {
    var now = new Date();
    var day = now.getDay(); // 0=Sun ... 6=Sat
    var diff = (6 - day + 7) % 7;
    if (diff === 0) diff = 7; // next saturday, not today
    var d = new Date(now);
    d.setDate(now.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function renderEventsError(container, message) {
    container.innerHTML =
      '<div class="events-error"><p>' + escapeHtml(message) + '</p></div>';
  }

  /* ------------------------------------------------------------------------
   * 16. DATE FORMATTING (Brazilian Portuguese)
   * ---------------------------------------------------------------------- */
  var MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MONTHS_FULL = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  var DAYS_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  function monthShort(date) {
    return MONTHS_SHORT[date.getMonth()];
  }

  function formatDateBR(date) {
    if (!date || isNaN(date.getTime())) return '';
    return date.getDate() + ' de ' + MONTHS_FULL[date.getMonth()] + ' de ' + date.getFullYear();
  }

  function formatNextRecurring(dayName) {
    // dayName like 'sábado'
    var idx = DAYS_FULL.indexOf(dayName.toLowerCase());
    return nextWeekday(idx);
  }

  function nextWeekday(targetDay) {
    var now = new Date();
    var day = now.getDay();
    var diff = (targetDay - day + 7) % 7;
    if (diff === 0) diff = 7;
    var d = new Date(now);
    d.setDate(now.getDate() + diff);
    return d;
  }

  /* ------------------------------------------------------------------------
   * 7. GALLERY LIGHTBOX
   * ---------------------------------------------------------------------- */
  function initGalleryLightbox() {
    var gallery = $('[data-gallery]');
    if (!gallery) return;

    var lightbox = $('[data-lightbox]');
    var lightboxImg = $('[data-lightbox-image]', lightbox || document);
    var lightboxCaption = $('[data-lightbox-caption]', lightbox || document);
    var closeBtn = $('[data-lightbox-close]', lightbox || document);
    var prevBtn = $('[data-lightbox-prev]', lightbox || document);
    var nextBtn = $('[data-lightbox-next]', lightbox || document);

    var images = [];
    var currentIndex = 0;
    var startX = 0;
    var startY = 0;

    function collectImages() {
      images = $$('[data-lightbox-item]', gallery).filter(function (el) {
        return isElementVisible(el);
      });
    }

    function openLightbox(index) {
      collectImages();
      if (images.length === 0) return;
      if (index < 0) index = 0;
      if (index >= images.length) index = images.length - 1;
      currentIndex = index;
      showImage();
      if (lightbox) {
        lightbox.classList.add('open');
        document.body.classList.add('lightbox-open');
      }
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('open');
      document.body.classList.remove('lightbox-open');
    }

    function showImage() {
      if (!lightbox || images.length === 0) return;
      var el = images[currentIndex];
      var src = el.getAttribute('data-full') || el.getAttribute('src') || el.getAttribute('data-src') || '';
      var alt = el.getAttribute('alt') || '';

      if (src && lightboxImg) {
        // Real image
        if (lightboxImg.tagName.toLowerCase() === 'img') {
          lightboxImg.setAttribute('src', src);
          lightboxImg.setAttribute('alt', alt);
          lightboxImg.style.display = 'block';
          clearPlaceholder();
        } else if (lightboxImg.querySelector) {
          lightboxImg.innerHTML = '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '">';
          clearPlaceholder();
        }
      } else {
        // Placeholder handling
        renderPlaceholder(alt);
      }

      if (lightboxCaption) {
        lightboxCaption.textContent = alt || '';
      }

      function clearPlaceholder() {
        var ph = $('[data-lightbox-placeholder]', lightbox);
        if (ph) ph.style.display = 'none';
      }

      function renderPlaceholder(alt) {
        var ph = $('[data-lightbox-placeholder]', lightbox);
        if (ph) {
          ph.style.display = 'flex';
          ph.textContent = alt || 'Imagem em breve';
        }
        if (lightboxImg && lightboxImg.tagName.toLowerCase() === 'img') {
          lightboxImg.removeAttribute('src');
          lightboxImg.style.display = 'none';
        } else if (lightboxImg && lightboxImg.querySelector) {
          lightboxImg.innerHTML = '';
        }
      }
    }

    function next() {
      if (images.length === 0) return;
      currentIndex = (currentIndex + 1) % images.length;
      showImage();
      trackEvent('gallery', 'navigate', 'next');
    }

    function prev() {
      if (images.length === 0) return;
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage();
      trackEvent('gallery', 'navigate', 'prev');
    }

    // Open on click
    gallery.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('[data-lightbox-item]') : null;
      if (!target && e.target.hasAttribute && e.target.hasAttribute('data-lightbox-item')) {
        target = e.target;
      }
      if (target) {
        collectImages();
        var idx = images.indexOf(target);
        if (idx > -1) {
          openLightbox(idx);
          trackEvent('gallery', 'open', target.getAttribute('alt') || '');
        }
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // Click outside image closes
    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    // Keyboard nav
    document.addEventListener('keydown', function (e) {
      if (!lightbox || !lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // Touch swipe
    if (lightbox) {
      lightbox.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      }, { passive: true });

      lightbox.addEventListener('touchend', function (e) {
        var touch = e.changedTouches[0];
        var deltaX = touch.clientX - startX;
        var deltaY = touch.clientY - startY;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
          if (deltaX < 0) next();
          else prev();
        }
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------------------
   * 8. SCROLL ANIMATIONS (Intersection Observer)
   * ---------------------------------------------------------------------- */
  function initScrollAnimations(scope) {
    var prefersReduced = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    var targets = $$('.animate-on-scroll', scope || document);

    if (prefersReduced) {
      targets.forEach(function (el) {
        el.classList.add('animate-in');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('animate-in');
      });
      return;
    }

    targets.forEach(function (el) {
      if (el.classList.contains('animate-in')) return;
      el.classList.add('animate-ready');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          window.requestAnimationFrame(function () {
            el.classList.add('animate-in');
            el.classList.remove('animate-ready');
          });
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    targets.forEach(function (el) {
      if (!el.classList.contains('animate-in')) {
        observer.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------------
   * 9. SMOOTH SCROLL + Active nav highlighting
   * ---------------------------------------------------------------------- */
  function initSmoothScroll() {
    var header = $('.site-header');
    var headerHeight = 0;

    function getHeaderHeight() {
      if (header) {
        var h = header.offsetHeight;
        headerHeight = h > 0 ? h : 0;
      } else {
        headerHeight = 0;
      }
      return headerHeight;
    }

    var anchors = $$('a[href^="#"]');

    anchors.forEach(function (anchor) {
      var hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash === '#!') return;

      anchor.addEventListener('click', function (e) {
        var target = $(hash);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight();
        var extraOffset = parseInt(anchor.getAttribute('data-offset') || '0', 10);
        top = Math.max(top + extraOffset, 0);
        window.scrollTo({ top: top, behavior: 'smooth' });
        isProgrammaticScroll = true;
      });
    });

    var isProgrammaticScroll = false;

    // Active nav link highlighting based on current section
    var sections = $$('section[id], [data-section-id]');
    var navLinks = $$('a[href^="#"]');

    function onScrollSpy() {
      var pos = window.pageYOffset + getHeaderHeight() + 80;

      var currentId = null;
      sections.forEach(function (section) {
        var id = section.getAttribute('id') || section.getAttribute('data-section-id');
        if (!id) return;
        if (section.offsetTop <= pos) {
          currentId = id;
        }
      });

      navLinks.forEach(function (link) {
        var hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        var targetId = hash.slice(1);
        link.classList.toggle('active', targetId === currentId);
      });
    }

    window.addEventListener('scroll', function () {
      isProgrammaticScroll = true;
      window.clearTimeout(onScrollSpyTimer);
      onScrollSpyTimer = window.setTimeout(function () {
        isProgrammaticScroll = false;
      }, 500);
      onScrollSpy();
    }, { passive: true });

    var onScrollSpyTimer;
    window.requestAnimationFrame(onScrollSpy);
  }

  /* ------------------------------------------------------------------------
   * 10. WHATSAPP INTEGRATION
   * ---------------------------------------------------------------------- */
  var DEFAULT_WA_MESSAGE = 'Olá! Gostaria de fazer uma reserva no Terraço Urbano.';

  var siteConfig = null;

  function loadSiteConfig() {
    fetch('data/site.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        siteConfig = data;
        dispatch(document, 'siteconfig:loaded', { data: siteConfig });
      })
      .catch(function () {
        siteConfig = null;
      });
  }

  function getWhatsappNumber() {
    if (siteConfig && siteConfig.site && siteConfig.site.whatsapp) {
      var raw = String(siteConfig.site.whatsapp);
      if (/INSERIR|VALIDAR|CONFIRMAR/i.test(raw)) return '';
      return raw.replace(/[^0-9]/g, '');
    }
    return '';
  }

  function getPhoneNumber() {
    if (siteConfig && siteConfig.site && siteConfig.site.phone) {
      var raw = String(siteConfig.site.phone);
      if (/INSERIR|VALIDAR|CONFIRMAR/i.test(raw)) return '';
      return raw.replace(/[^0-9]/g, '');
    }
    return '';
  }

  function whatsappLink(message) {
    var number = getWhatsappNumber();
    if (!number) return '#';
    var msg = message || DEFAULT_WA_MESSAGE;
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(msg);
  }

  function contactTarget(message) {
    var wa = getWhatsappNumber();
    if (wa) return whatsappLink(message);
    var phone = getPhoneNumber();
    if (phone) return 'tel:+' + phone;
    return '#';
  }

  function convertContactSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.8.6a2 2 0 0 1 1.8 2.2z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function reservationDateBR(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  function whatsappReservationMessage(fields) {
    var obs = fields.observacoes && fields.observacoes.trim() ? fields.observacoes.trim() : 'Nenhuma';
    var lines = [
      'Nome: ' + (fields.nome || '—'),
      'Data: ' + (fields.data || '—'),
      'Horário: ' + (fields.horario || '—'),
      'Pessoas: ' + (fields.pessoas || '—'),
      'Observações: ' + obs
    ];
    return 'Olá! Gostaria de solicitar uma reserva no Terraço Urbano.\n\n' +
      lines.join('\n') + '\n\nAguardo a confirmação. Obrigado!';
  }

  function initWhatsApp() {
    loadSiteConfig();

    // Preenchimento antecipado dos links quando a config e carregada
    document.addEventListener('siteconfig:loaded', function () {
      var hasWA = !!getWhatsappNumber();

      $$('[data-whatsapp]').forEach(function (el) {
        var url = contactTarget(el.getAttribute('data-whatsapp-message') || DEFAULT_WA_MESSAGE);
        if (url !== '#') el.setAttribute('href', url);
      });

      // Botao flutuante: sem WhatsApp confirmado, troca o icone para telefone
      if (!hasWA) {
        var flt = $('.whatsapp-float');
        if (flt) {
          var svg = flt.querySelector('svg');
          if (svg) {
            var holder = document.createElement('span');
            holder.innerHTML = convertContactSvg();
            var icon = holder.firstChild;
            svg.parentNode.replaceChild(icon, svg);
          }
          flt.setAttribute('aria-label', 'Ligar para o Terraço Urbano');
        }
      }
    });

    // Delegation: cobre elementos estaticos e dinamicos
    // e decide o canal (WhatsApp confirmado -> wa.me, senao -> ligacao)
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-whatsapp]') : null;
      if (!el) return;
      var msg = el.getAttribute('data-whatsapp-message') || DEFAULT_WA_MESSAGE;
      var url = contactTarget(msg);
      if (!url || url === '#') {
        e.preventDefault();
        return;
      }
      var isWA = url.indexOf('https://wa.me/') === 0;
      trackEvent(isWA ? 'whatsapp' : 'phone', 'click',
        el.getAttribute('data-track-label') || (isWA ? 'whatsapp' : 'contato'));
      if (isWA) {
        e.preventDefault();
        window.open(url, '_blank');
      }
      // tel: tem navegacao padrao
    });

    // Reservation form (if present)
    var reservationForm = $('[data-reservation-form]');
    if (reservationForm) {
      var hintField = $('.form-hint', reservationForm);

      function field(selector) {
        return reservationForm.querySelector(selector);
      }

      reservationForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var people = (field('[name="pessoas"]').value || '').trim();
        var fields = {
          nome: (field('[name="nome"]').value || '').trim(),
          data: reservationDateBR(field('[name="data"]').value),
          horario: (field('[name="horario"]').value || '').trim(),
          pessoas: people,
          observacoes: (field('[name="observacoes"]').value || '').trim()
        };

        // Validacao dos campos obrigatorios
        var required = [
          [field('[name="nome"]'), 'nome'],
          [field('[name="data"]'), 'data'],
          [field('[name="horario"]'), 'horario'],
          [field('[name="pessoas"]'), 'pessoas']
        ];
        var firstInvalid = null;
        required.forEach(function (pair) {
          var el = pair[0];
          var name = pair[1];
          if (!el) return;
          var ok = !!el.value && String(el.value).trim() !== '';
          el.classList.toggle('form-input--invalid', !ok);
          el.setAttribute('aria-invalid', ok ? 'false' : 'true');
          if (!ok && !firstInvalid) firstInvalid = el;
          if (name === 'data') fields.data = ok ? fields.data : '';
        });

        if (firstInvalid) {
          firstInvalid.focus();
          if (hintField) hintField.textContent = 'Preencha os campos obrigatórios para continuar (nome, data, horário e pessoas).';
          return;
        }

        if (hintField) hintField.textContent = 'Abrindo WhatsApp com sua mensagem pronta...';

        var msg = whatsappReservationMessage(fields);
        var wa = getWhatsappNumber();
        if (wa) {
          var url = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
          var opened = null;
          try { opened = window.open(url, '_blank'); } catch (err) { /* popup bloqueado */ }
          if (!opened) window.location.href = url;
        } else {
          window.location.href = 'tel:+' + getPhoneNumber();
        }
        trackEvent('reservation', 'submit', fields.nome + ', ' + fields.data + ', ' + fields.horario + ', ' + fields.pessoas + ' pessoas');
      });
    }
  }

  /* ------------------------------------------------------------------------
   * 11. REVIEWS CAROUSEL (avaliações reais via data/reviews.json)
   * ---------------------------------------------------------------------- */
  function reviewInitials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    var initials = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
    initials = initials.toUpperCase();
    return initials || 'G';
  }

  function reviewStars(rating) {
    var value = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    return new Array(5).fill('').map(function (_, i) {
      return i < value
        ? '<span class="review-card__star" aria-hidden="true">★</span>'
        : '<span class="review-card__star review-card__star--empty" aria-hidden="true">★</span>';
    }).join('');
  }

  function reviewCardHTML(review) {
    var avatar = review.photo
      ? '<img class="review-card__avatar-img" src="' + escapeHtml(review.photo) + '" alt="" loading="lazy">'
      : '<span class="review-card__avatar" aria-hidden="true">' + escapeHtml(reviewInitials(review.name)) + '</span>';

    var stars = reviewStars(review.rating);

    return '' +
      '<article class="review-card" role="group" aria-roledescription="slide" aria-label="Avaliação de ' + escapeHtml(review.name) + '">' +
        '<div class="review-card__header">' + avatar +
          '<div class="review-card__author-info">' +
            '<p class="review-card__author-name">' + escapeHtml(review.name) + '</p>' +
            '<p class="review-card__platform">Google</p>' +
          '</div>' +
        '</div>' +
        '<div class="review-card__stars" role="img" aria-label="' + escapeHtml(String(review.rating || 5)) + ' de 5 estrelas">' + stars + '</div>' +
        '<p class="review-card__quote">“' + escapeHtml(review.text) + '”</p>' +
      '</article>';
  }

  function renderReviewsEmpty(track) {
    track.innerHTML = '<p class="reviews-empty">As avaliações reais do Google entram aqui em breve — nenhum depoimento é inventado.</p>';
  }

  function renderReviewsCarousel(track, reviews) {
    var html = '';
    for (var i = 0; i < reviews.length; i++) html += reviewCardHTML(reviews[i]);
    // Set duplicado para o loop infinito contínuo
    track.appendChild(makeNode(html + html));
    startReviewsMarquee(track);
  }

  function startReviewsMarquee(track) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var offset = 0;
    var running = false;
    var last = null;
    var dragging = false;
    var moved = false;
    var startX = 0;
    var rafId = null;

    function halfWidth() {
      var hw = track.scrollWidth / 2;
      return hw > 0 ? hw : 0;
    }

    function apply() {
      var hw = halfWidth();
      if (hw > 0) {
        while (offset < 0) offset += hw;
        while (offset >= hw) offset -= hw;
      }
      track.style.transform = 'translateX(-' + offset + 'px)';
    }

    function step(t) {
      if (!running) return;
      if (last === null) last = t;
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      offset += REVIEW_STEP * 60 * dt;
      apply();
      if (running) rafId = window.requestAnimationFrame(step);
    }

    function run() {
      if (!running) return;
      window.cancelAnimationFrame(rafId);
      last = null;
      rafId = window.requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(rafId);
    }

    function resume() {
      if (reduced) return;
      if (dragging) return;
      running = true;
      run();
    }

    function onDown(e) {
      dragging = true;
      moved = false;
      startX = e.clientX;
      stop();
      track.classList.add('is-dragging');
      if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
    }

    function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      startX = e.clientX;
      offset -= dx;
      apply();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (!moved) offset = Math.round(offset);
      resume();
    }

    if (reduced) {
      apply();
      return;
    }

    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onEnd);
    track.addEventListener('pointercancel', onEnd);
    track.addEventListener('pointerleave', onEnd);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else resume();
    });

    resume();
  }

  function initReviews() {
    var carousel = $('[data-reviews-carousel]');
    var track = $('[data-reviews-track]', carousel);
    if (!carousel || !track) return;

    fetch('data/reviews.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (reviews) {
        if (!Array.isArray(reviews) || !reviews.length) {
          renderReviewsEmpty(track);
          return;
        }
        renderReviewsCarousel(track, reviews);
      })
      .catch(function () {
        renderReviewsEmpty(track);
      });
  }

  function makeNode(html) {
    var holder = document.createElement('div');
    holder.innerHTML = html;
    return holder.firstElementChild;
  }

  /* ------------------------------------------------------------------------
   * 12. ANALYTICS TRACKING
   * ---------------------------------------------------------------------- */
  function trackEvent(category, action, label) {
    // Google Analytics 4
    if (typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label || '',
        send_to: window.gtagConfig && window.gtagConfig.gaId ? window.gtagConfig.gaId : undefined
      });
    }

    // Meta Pixel
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('trackCustom', action, {
          category: category,
          label: label || ''
        });
      } catch (e) { /* ignore pixel errors */ }
    }
  }

  function initAnalytics() {
    // Auto-bind elements with data-track attribute
    $$('[data-track]').forEach(function (el) {
      if (el.__trackBound) return;
      el.__trackBound = true;

      var category = el.getAttribute('data-track-category') || mapTrackType(el.getAttribute('data-track'));
      var action = el.getAttribute('data-track-action') || 'click';
      var label = el.getAttribute('data-track-label') || (el.textContent || '').trim().slice(0, 50);

      el.addEventListener('click', function () {
        trackEvent(category, action, label);
      });
    });
  }

  function mapTrackType(type) {
    switch (type) {
      case 'whatsapp': return 'whatsapp';
      case 'phone': return 'phone';
      case 'call': return 'phone';
      case 'delivery': return 'delivery';
      case 'menu': return 'menu';
      case 'directions': return 'directions';
      case 'reservation': return 'reservation';
      case 'instagram': return 'instagram';
      default: return 'interaction';
    }
  }

  function initDataTrackBinding() {
    initAnalytics();

    // Delivery links
    $$('[data-delivery]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackEvent('delivery', 'click', el.getAttribute('data-track-label') || 'delivery');
      });
    });

    // Directions links
    $$('[data-directions]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackEvent('directions', 'click', el.getAttribute('data-track-label') || 'directions');
      });
    });

    // Instagram links
    $$('[data-instagram]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackEvent('instagram', 'click', el.getAttribute('data-track-label') || 'instagram');
      });
    });

    // Reservation buttons
    $$('[data-reservation]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackEvent('reservation', 'click', el.getAttribute('data-track-label') || 'reservation');
      });
    });
  }

  /* ------------------------------------------------------------------------
   * COOKIE CONSENT (LGPD)
   * ---------------------------------------------------------------------- */
  function initCookieConsent() {
    var banner = $('[data-cookie-consent]');
    if (!banner) return;

    var tracking = window.__tuTracking || { ga4: false, pixel: false };
    // Sem scripts de medição reais configurados, não há cookies o que avisar.
    if (!tracking.ga4 && !tracking.pixel) return;

    // Já houve escolha salva (aceitar ou recusar).
    if (window.__tuCookie && window.__tuCookie.get()) return;

    // Config já liberou consentimento ao carregar? Não mostra o banner.
    if (window.__tuConsentGranted) return;

    banner.hidden = false;

    var accept = $('[data-cookie-accept]', banner);
    var decline = $('[data-cookie-decline]', banner);

    if (accept) {
      accept.addEventListener('click', function () {
        if (window.__tuUpdateConsent) window.__tuUpdateConsent(true);
        // Recarrega para que GA4/Meta Pixel carreguem com o consentimento.
        window.location.reload();
      });
    }
    if (decline) {
      decline.addEventListener('click', function () {
        if (window.__tuUpdateConsent) window.__tuUpdateConsent(false);
        banner.hidden = true;
      });
    }
  }

  /* ------------------------------------------------------------------------
   * WAZE (rota)
   * ---------------------------------------------------------------------- */
  function initWaze() {
    $$('[data-waze]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackEvent('directions', 'click', el.getAttribute('data-track-label') || 'waze');
      });
    });

    document.addEventListener('siteconfig:loaded', function () {
      var url = siteConfig && siteConfig.site && siteConfig.site.wazeUrl ? siteConfig.site.wazeUrl : '';
      if (!url || url.indexOf('[INSERIR') !== -1) return;
      $$('[data-waze]').forEach(function (el) {
        el.setAttribute('href', url);
      });
    });
  }

  /* Expose trackEvent to the global scope for other scripts/onclick use */
  window.TerracoUrbano = window.TerracoUrbano || {};
  window.TerracoUrbano.trackEvent = trackEvent;
  window.TerracoUrbano.formatDateBR = formatDateBR;

  /* ------------------------------------------------------------------------
   * 12. HOURS DISPLAY
   * ---------------------------------------------------------------------- */
  function initHoursDisplay() {
    var hoursContainers = $$('[data-hours]');
    var statusEls = $$('[data-status]');
    if (hoursContainers.length === 0 && statusEls.length === 0) return;

    fetch('data/site.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var hours = data && data.site && data.site.hours ? data.site.hours : null;
        if (!hours) return;

        hoursContainers.forEach(function (c) { renderHours(c, hours); });
        statusEls.forEach(function (el) { updateOpenStatus(el, hours); });
        setInterval(function () {
          statusEls.forEach(function (el) { updateOpenStatus(el, hours); });
        }, 60000);
      })
      .catch(function () {
        hoursContainers.forEach(function (c) { renderHoursFallback(c); });
      });
  }

  var DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function renderHours(container, hours) {
    if (!container) return;

    var now = new Date();
    var todayIndex = now.getDay();
    var rows = DAY_KEYS.map(function (key, i) {
      var val = hours[key];
      if (val && val.indexOf('[INSERIR') !== -1) val = '';
      var isToday = i === todayIndex;
      return (
        '<div class="hours-row' + (isToday ? ' hours-row-today' : '') + '">' +
          '<span class="hours-day">' + DAY_LABELS[i] + (isToday ? ' <em>(hoje)</em>' : '') + '</span>' +
          '<span class="hours-time">' + (val ? escapeHtml(val) : 'Fechado') + '</span>' +
        '</div>'
      );
    });

    container.innerHTML = '<div class="hours-list">' + rows.join('') + '</div>';

    // Update today's row each minute (rollover at midnight)
    setInterval(function () {
      var newToday = new Date().getDay();
      if (newToday !== todayIndex) {
        todayIndex = newToday;
        renderHours(container, hours);
      }
    }, 60000);
  }

  function renderHoursFallback(container) {
    if (container) {
      container.innerHTML = '<p class="hours-unavailable">Horários não informados.</p>';
    }
  }

  // Parse "18:00 - 23:00" style strings -> {open: [h,m], close: [h,m]}
  function parseHourRange(str) {
    if (!str) return null;
    var match = str.match(/(\d{1,2})[:.](\d{2})?\s*[-–—]\s*(\d{1,2})[:.](\d{2})?/);
    if (!match) return null;
    var openH = parseInt(match[1], 10);
    var openM = match[2] ? parseInt(match[2], 10) : 0;
    var closeH = parseInt(match[3], 10);
    var closeM = match[4] ? parseInt(match[4], 10) : 0;
    return {
      openMin: openH * 60 + openM,
      closeMin: closeH * 60 + closeM
    };
  }

  function isOpenNow(hours) {
    var now = new Date();
    var key = DAY_KEYS[now.getDay()];
    var val = hours[key];
    if (!val || val.indexOf('[INSERIR') !== -1) return null; // unknown

    var range = parseHourRange(val);
    if (!range) return null;

    var mins = now.getHours() * 60 + now.getMinutes();

    // Handle overnight ranges (close < open)
    if (range.openMin <= range.closeMin) {
      return mins >= range.openMin && mins <= range.closeMin;
    }
    // Overnight: open today until midnight + open from midnight until close
    return mins >= range.openMin || mins <= range.closeMin;
  }

  function updateOpenStatus(el, hours) {
    if (!el) return;
    var open = isOpenNow(hours);
    var label;
    var cls;
    if (open === null) {
      label = 'Horário não informado';
      cls = 'status-unknown';
    } else if (open) {
      label = 'Aberto agora';
      cls = 'status-open';
    } else {
      label = 'Fechado agora';
      cls = 'status-closed';
    }
    el.textContent = label;
    el.className = el.className.replace(/\bstatus-(open|closed|unknown)\b/g, '').trim();
    el.classList.add(cls);
  }

  /* ------------------------------------------------------------------------
   * 13. SCROLL TO TOP BUTTON
   * ---------------------------------------------------------------------- */
  function initScrollToTop() {
    var btn = $('[data-scroll-top]');
    if (!btn) return;

    function onScroll() {
      var scrollY = window.pageYOffset || 0;
      if (scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------------
   * 14. IMAGE LAZY LOADING
   * ---------------------------------------------------------------------- */
  function initImageLazyLoading() {
    var images = $$('img[data-src]');

    var supportsNativeLazy = 'loading' in document.createElement('img');

    if (supportsNativeLazy) {
      images.forEach(function (img) {
        if (img.loading === undefined) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }

    if (!supportsNativeLazy && !('IntersectionObserver' in window)) {
      // Fallback: load all immediately
      images.forEach(loadImage);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      images.forEach(loadImage);
      return;
    }

    images.forEach(function (img) {
      if (img.__lazyBound) return;
      img.__lazyBound = true;

      if (!img.classList.contains('lazy-image')) {
        img.classList.add('lazy-image');
      }

      if (supportsNativeLazy && !img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          loadImage(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px 200px 0px',
      threshold: 0.01
    });

    images.forEach(function (img) {
      if (!img.getAttribute('src') && img.getAttribute('data-src')) {
        observer.observe(img);
      }
    });
  }

  function loadImage(img) {
    var src = img.getAttribute('data-src');
    if (!src || img.getAttribute('src')) return;

    var done = function () {
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    };

    if (img.complete && img.naturalWidth > 0) {
      done();
      return;
    }

    img.addEventListener('load', done);
    img.addEventListener('error', function () {
      img.classList.add('lazy-error');
      img.removeAttribute('data-src');
      img.setAttribute('alt', '');
    });

    img.setAttribute('src', src);
    img.classList.add('lazy-loading');
  }

  /* ------------------------------------------------------------------------
   * 15. TOUCH SWIPE (reusable for carousel/gallery)
   * ---------------------------------------------------------------------- */
  function initSwipeDetection() {
    // Generic swipe support for [data-swipe] elements
    $$('[data-swipe]').forEach(function (el) {
      var startX = 0;
      var startY = 0;
      var startTime = 0;
      var minDistance = parseInt(el.getAttribute('data-swipe-distance') || '50', 10);

      el.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
      }, { passive: true });

      el.addEventListener('touchend', function (e) {
        if (!e.changedTouches) return;
        var touch = e.changedTouches[0];
        var deltaX = touch.clientX - startX;
        var deltaY = touch.clientY - startY;
        var elapsed = Date.now() - startTime;

        if (Math.abs(deltaX) < minDistance) return;
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return; // vertical scroll, ignore
        if (elapsed > 1000) return; // too slow

        var direction = deltaX < 0 ? 'left' : 'right';
        dispatch(el, 'swipe', { direction: direction, deltaX: deltaX, deltaY: deltaY });
        try {
          if (typeof el.dataset.swipe === 'function') {
            el.dataset.swipe(direction);
          }
        } catch (e2) { /* ignore */ }
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
   * HTML ESCAPING (safety)
   * ---------------------------------------------------------------------- */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
