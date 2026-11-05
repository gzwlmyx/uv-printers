/* NOCAI — site interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var html = document.documentElement;
  var LANG_KEY = 'lang';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = readLang();

  function readLang() {
    try {
      return localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en';
    } catch (e) {
      return 'en';
    }
  }

  function storeLang(next) {
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* private mode */ }
  }

  function setText(node, value) {
    if (value !== null && value !== undefined) node.textContent = value;
  }

  function applyLang(next, persist) {
    lang = next === 'zh' ? 'zh' : 'en';
    html.lang = lang === 'zh' ? 'zh-CN' : 'en';
    html.setAttribute('data-lang', lang);

    var nodes = document.querySelectorAll('[data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      setText(node, node.getAttribute('data-' + lang));
    }

    var ariaNodes = document.querySelectorAll('[data-aria-en]');
    for (var a = 0; a < ariaNodes.length; a++) {
      var label = ariaNodes[a].getAttribute('data-aria-' + lang);
      if (label) ariaNodes[a].setAttribute('aria-label', label);
    }

    var altNodes = document.querySelectorAll('[data-alt-en]');
    for (var m = 0; m < altNodes.length; m++) {
      var alt = altNodes[m].getAttribute('data-alt-' + lang);
      if (alt !== null) altNodes[m].setAttribute('alt', alt);
    }

    var title = html.getAttribute('data-title-' + lang);
    if (title) document.title = title;
    var desc = html.getAttribute('data-desc-' + lang);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (desc && metaDesc) metaDesc.setAttribute('content', desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (title && ogTitle) ogTitle.setAttribute('content', title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (desc && ogDesc) ogDesc.setAttribute('content', desc);

    var langButtons = document.querySelectorAll('.lang__btn');
    for (var b = 0; b < langButtons.length; b++) {
      var active = langButtons[b].getAttribute('data-lang') === lang;
      langButtons[b].classList.toggle('is-active', active);
      langButtons[b].setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (persist) storeLang(lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* language buttons */
  document.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('.lang__btn') : null;
    if (!btn) return;
    applyLang(btn.getAttribute('data-lang'), true);
  });

  /* header shadow + back-to-top */
  var header = document.getElementById('site-header');
  var toTop = document.getElementById('to-top');
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* mobile drawer */
  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('site-drawer');
  var lastFocus = null;
  function setDrawer(open) {
    if (!drawer || !toggle) return;
    drawer.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('drawer-open', open);
    if (open) {
      lastFocus = document.activeElement;
      var first = drawer.querySelector('a, button');
      if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 120);
    } else if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
      lastFocus = null;
    }
  }
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
    drawer.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setDrawer(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) { setDrawer(false); return; }
      if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
      var focusables = drawer.querySelectorAll('a[href], button:not([disabled])');
      if (!focusables.length) return;
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) { event.preventDefault(); lastEl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastEl) { event.preventDefault(); firstEl.focus(); }
    });
  }

  /* reveal on scroll */
  var revealNodes = document.querySelectorAll('.reveal, .reveal-stagger');
  function showAll() {
    for (var i = 0; i < revealNodes.length; i++) revealNodes[i].classList.add('is-in');
  }
  if (!revealNodes.length) {
    /* nothing to do */
  } else if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('is-in');
            observer.unobserve(entries[i].target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );
    for (var r = 0; r < revealNodes.length; r++) observer.observe(revealNodes[r]);
  }

  /* category filter tabs */
  function updateFilterCount(shown) {
    var counter = document.getElementById('filter-count');
    if (!counter) return;
    var total = parseInt(counter.getAttribute('data-total'), 10) || shown;
    var en = 'Showing ' + shown + ' of ' + total + ' machines';
    var zh = '显示 ' + shown + ' / 共 ' + total + ' 台设备';
    counter.setAttribute('data-en', en);
    counter.setAttribute('data-zh', zh);
    counter.textContent = lang === 'zh' ? zh : en;
  }

  var refilter = [];
  var tabGroups = document.querySelectorAll('[data-tabs]');
  for (var t = 0; t < tabGroups.length; t++) {
    (function (group) {
      var targetSel = group.getAttribute('data-target');
      var target = targetSel ? document.querySelector(targetSel) : null;
      if (!target) return;
      var cards = Array.prototype.slice.call(target.querySelectorAll('[data-cat]'));
      var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab'));
      var current = 'all';

      function apply(filter) {
        current = filter;
        var shown = 0;
        for (var c = 0; c < cards.length; c++) {
          var match = filter === 'all' || cards[c].getAttribute('data-cat') === filter;
          cards[c].classList.toggle('is-hidden', !match);
          if (match) shown++;
        }
        for (var i = 0; i < tabs.length; i++) {
          var on = tabs[i].getAttribute('data-filter') === filter;
          tabs[i].classList.toggle('is-active', on);
          tabs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        updateFilterCount(shown);
      }

      group.addEventListener('click', function (event) {
        var tab = event.target.closest ? event.target.closest('.tab') : null;
        if (!tab || !group.contains(tab)) return;
        var filter = tab.getAttribute('data-filter');
        apply(filter);
        if (window.history && history.replaceState) {
          var base = window.location.pathname + window.location.search;
          history.replaceState(null, '', filter === 'all' ? base : base + '#cat-' + filter);
        }
      });

      var hash = window.location.hash;
      if (hash.indexOf('#cat-') === 0) {
        var wanted = hash.slice(5);
        for (var h = 0; h < tabs.length; h++) {
          if (tabs[h].getAttribute('data-filter') === wanted) {
            apply(wanted);
            break;
          }
        }
      }

      refilter.push(function () { apply(current); });
    })(tabGroups[t]);
  }
  document.addEventListener('langchange', function () {
    for (var i = 0; i < refilter.length; i++) refilter[i]();
  });

  /* product gallery */
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var mainImage = gallery.querySelector('#pd-main');
    gallery.addEventListener('click', function (event) {
      var thumb = event.target.closest ? event.target.closest('.pd__thumb') : null;
      if (!thumb || !mainImage) return;
      var full = thumb.getAttribute('data-full');
      if (!full) return;
      mainImage.src = full;
      mainImage.setAttribute('data-full', full);
      var thumbs = gallery.querySelectorAll('.pd__thumb');
      for (var i = 0; i < thumbs.length; i++) thumbs[i].classList.toggle('is-active', thumbs[i] === thumb);
    });
  }

  /* enquiry form */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var status = document.getElementById('form-status');
    var formError = document.getElementById('form-error');
    var configNote = document.getElementById('form-config');

    var model = new URLSearchParams(window.location.search).get('model');
    if (model) {
      var messageField = document.getElementById('f-message');
      if (messageField && !messageField.value) {
        messageField.value = lang === 'zh'
          ? '我想了解 ' + model + ' 的报价与配置。'
          : 'I would like a quote and configuration for ' + model + '.';
      }
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'model';
      hidden.value = model;
      form.appendChild(hidden);
    }

    form.addEventListener('input', function (event) {
      if (event.target.classList) event.target.classList.remove('is-invalid');
      if (formError) formError.hidden = true;
    });

    form.addEventListener('submit', function (event) {
      var fields = form.querySelectorAll('[required]');
      var valid = true;
      var firstBad = null;
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = (field.value || '').trim();
        var ok = value.length > 0;
        if (ok && field.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        field.classList.toggle('is-invalid', !ok);
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) {
          valid = false;
          if (!firstBad) firstBad = field;
        }
      }
      if (!valid) {
        event.preventDefault();
        if (formError) formError.hidden = false;
        if (status) status.hidden = true;
        if (configNote) configNote.hidden = true;
        if (firstBad) firstBad.focus();
        return;
      }
      if (formError) formError.hidden = true;

      var action = form.getAttribute('action') || '';
      var mailto = action.match(/^mailto:(.+)$/i);
      if (mailto) {
        event.preventDefault();
        var to = mailto[1];
        var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        var isZh = document.documentElement.lang === 'zh-CN';
        var lines = [];
        lines.push((isZh ? '姓名：' : 'Name: ') + val('f-name'));
        lines.push((isZh ? '邮箱：' : 'Email: ') + val('f-email'));
        var country = val('f-country');
        if (country) lines.push((isZh ? '国家/地区：' : 'Country: ') + country);
        if (model) lines.push((isZh ? '咨询型号：' : 'Model: ') + model);
        lines.push('');
        lines.push(val('f-message'));
        var subject = (isZh ? '网站询盘 — ' : 'Website enquiry — ') + (model || 'NOCAI');
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        if (status) {
          status.hidden = false;
          status.textContent = isZh
            ? '已生成询盘邮件，请在邮件客户端点击「发送」。如果没反应，请直接发邮件到 ' + to + '。'
            : 'Your email app should now open with the enquiry — press send. If nothing happens, email ' + to + '.';
        }
        if (configNote) configNote.hidden = true;
        return;
      }
      if (status) status.hidden = false;
    });
  }


  /* background music (off by default, user initiated) */
  var musicBtn = document.getElementById('music-toggle');
  var bgMusic = document.getElementById('bg-music');
  if (musicBtn && bgMusic) {
    bgMusic.volume = 0.32;
    var saved = null;
    try { saved = localStorage.getItem('music'); } catch (e) {}
    function paintMusic(on) {
      musicBtn.classList.toggle('is-playing', on);
      musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      musicBtn.title = on ? '暂停背景音乐 / Pause music' : '播放背景音乐 / Play music';
    }
    function playMusic() {
      var p = bgMusic.play();
      if (p && p.catch) {
        p.then(function () { paintMusic(true); try { localStorage.setItem('music', 'on'); } catch (e) {} })
         .catch(function () { paintMusic(false); });
      } else {
        paintMusic(true);
      }
    }
    musicBtn.addEventListener('click', function () {
      if (bgMusic.paused) { playMusic(); }
      else {
        bgMusic.pause();
        paintMusic(false);
        try { localStorage.setItem('music', 'off'); } catch (e) {}
      }
    });
    if (saved === 'on') { playMusic(); } else { paintMusic(false); }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !bgMusic.paused) {
        bgMusic.pause();
        paintMusic(false);
      }
    });
  }

  /* apply stored language before first paint (script sits at end of body) */
  applyLang(lang, false);
})();
