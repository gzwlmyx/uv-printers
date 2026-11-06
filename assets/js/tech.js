/* INKSTONE STUDIO — tech knowledge base. Vanilla JS, no dependencies.
   1) /tech/ category filter  2) /troubleshooting/ symptom + machine filter
   3) /materials/ material + effect picker. All pages read fine without it. */
(function () {
  'use strict';

  var html = document.documentElement;

  function lang() {
    return html.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
  }
  function t(en, zh) {
    return lang() === 'zh' ? zh : en;
  }
  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }
  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 1. /tech/ — filter the article cards by category */
  var tabGroup = document.querySelector('[data-tech-tabs]');
  if (tabGroup) {
    var gridSel = tabGroup.getAttribute('data-target');
    var grid = gridSel ? document.querySelector(gridSel) : null;
    var cards = grid ? qsa('[data-cat]', grid) : [];
    var tabButtons = qsa('.tab', tabGroup);
    var counter = document.getElementById('tech-count');
    var total = counter ? parseInt(counter.getAttribute('data-total'), 10) || cards.length : cards.length;

    var paintCount = function (shown) {
      if (!counter) return;
      var en = 'Showing ' + shown + ' of ' + total + ' field notes';
      var zh = '显示 ' + shown + ' / 共 ' + total + ' 篇技术笔记';
      counter.setAttribute('data-en', en);
      counter.setAttribute('data-zh', zh);
      counter.textContent = t(en, zh);
    };

    var apply = function (filter) {
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var match = filter === 'all' || cards[i].getAttribute('data-cat') === filter;
        cards[i].classList.toggle('is-hidden', !match);
        if (match) shown++;
      }
      for (var b = 0; b < tabButtons.length; b++) {
        var on = tabButtons[b].getAttribute('data-filter') === filter;
        tabButtons[b].classList.toggle('is-active', on);
        tabButtons[b].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      paintCount(shown);
    };

    tabGroup.addEventListener('click', function (event) {
      var tab = event.target.closest ? event.target.closest('.tab') : null;
      if (!tab || !tabGroup.contains(tab)) return;
      var filter = tab.getAttribute('data-filter');
      apply(filter);
      if (window.history && history.replaceState) {
        var base = window.location.pathname + window.location.search;
        history.replaceState(null, '', filter === 'all' ? base : base + '#cat-' + filter);
      }
    });

    /* deep links: #cat-process (filter links) and #process (home page cards) */
    var hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      var wanted = hash.indexOf('cat-') === 0 ? hash.slice(4) : hash;
      for (var h = 0; h < tabButtons.length; h++) {
        if (tabButtons[h].getAttribute('data-filter') === wanted) {
          apply(wanted);
          break;
        }
      }
    }

    document.addEventListener('langchange', function () {
      var active = tabGroup.querySelector('.tab.is-active');
      apply(active ? active.getAttribute('data-filter') : 'all');
    });
  }

  /* 2. /troubleshooting/ — filter the static <details> list; without JS the
     whole list is simply visible. */
  var ts = document.querySelector('[data-ts]');
  if (ts) {
    var input = document.getElementById('ts-search');
    var chips = qsa('.ts-chip', ts);
    var items = qsa('.ts-card');
    var countEl = document.getElementById('ts-count');
    var activeMachine = 'all';
    var totalIssues = countEl ? parseInt(countEl.getAttribute('data-total'), 10) || items.length : items.length;

    var paintPlaceholder = function () {
      if (!input) return;
      var zh = input.getAttribute('data-placeholder-zh');
      var en = input.getAttribute('data-placeholder-en');
      input.setAttribute('placeholder', lang() === 'zh' ? zh || '' : en || '');
    };

    var filter = function () {
      var q = input ? (input.value || '').toLowerCase().trim() : '';
      var shown = 0;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var machineOk = activeMachine === 'all' || item.getAttribute('data-machine') === activeMachine;
        var textOk = !q || (item.getAttribute('data-search') || '').indexOf(q) !== -1;
        var match = machineOk && textOk;
        item.hidden = !match;
        if (match) shown++;
      }
      if (countEl) {
        var en = 'Showing ' + shown + ' of ' + totalIssues + ' fault patterns';
        var zh = '显示 ' + shown + ' / 共 ' + totalIssues + ' 个故障模式';
        countEl.setAttribute('data-en', en);
        countEl.setAttribute('data-zh', zh);
        countEl.textContent = t(en, zh);
      }
      /* a short result set opens itself so cause → fix → prevention is visible */
      if (shown > 0 && shown <= 3) {
        for (var j = 0; j < items.length; j++) {
          if (items[j].hidden) continue;
          var d = items[j].querySelector('details');
          if (d) d.open = true;
        }
      }
    };

    if (input) input.addEventListener('input', filter);

    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function (event) {
        var chip = event.currentTarget;
        activeMachine = chip.getAttribute('data-machine-filter') || 'all';
        for (var k = 0; k < chips.length; k++) {
          var on = chips[k] === chip;
          chips[k].classList.toggle('is-active', on);
          chips[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        filter();
      });
    }

    document.addEventListener('langchange', function () {
      paintPlaceholder();
      filter();
    });
    paintPlaceholder();
    filter();
  }

  /* 3. /materials/ — material + effect → process. The matrix only describes the
     substrate; the PROCESS rules are editorial and live here on purpose:
       colour : clean → primer (as the substrate asks) → CMYK → varnish if advised
       white  : white ground first on dark/clear media, cure, then colour
       relief : several thin varnish passes, cure between; mind thin media
       gold   : print adhesive / primer → cure → foil → peel
       crystal: print on DTF film → laminate adhesive → transfer → cure
     Machine suggestions always come from the substrate's own machines[] list. */
  var dataEl = document.getElementById('mat-data');
  if (dataEl) {
    var data = null;
    try {
      data = JSON.parse(dataEl.textContent || '{}');
    } catch (e) {
      data = null;
    }
    var substrates = (data && data.substrates) || [];
    var select = document.getElementById('mat-material');
    var out = document.getElementById('mat-out');
    var effectButtons = qsa('.mat-effect');
    var activeEffect = 'colour';

    var byId = function (id) {
      for (var i = 0; i < substrates.length; i++) {
        if (substrates[i].id === id) return substrates[i];
      }
      return null;
    };

    var build = function (sub, effect) {
      var zh = lang() === 'zh';
      var s = function (en, cn) { return zh ? cn : en; };
      var primer = zh ? sub.primer_zh : sub.primer_en;
      var adhesion = zh ? sub.adhesion_zh : sub.adhesion_en;
      var white = zh ? sub.white_zh : sub.white_en;
      var varnish = zh ? sub.varnish_zh : sub.varnish_en;
      var name = zh ? sub.zh : sub.en;
      var steps = [];
      var title = '';
      var note = '';

      if (effect === 'colour') {
        title = s('Colour print on ' + name, name + ' 上的彩色打印');
        steps = [
          s('Clean the surface and confirm adhesion — ' + adhesion + '.', '清洁表面并确认附着力 —— ' + adhesion + '。'),
          s('Pre-treatment / primer: ' + primer + '.', '预处理 / 底涂：' + primer + '。'),
          s('Print CMYK at production speed, then check a solid patch before the full run.', '按生产速度打彩墨，整批前先打一块实色确认。'),
          s('Varnish: ' + varnish + '.', '光油：' + varnish + '。'),
        ];
        note = s('Colour first, finish last: never varnish a print you would not ship without it.', '先颜色后效果：不打光油就不敢出货的印品，别指望光油能救。');
      } else if (effect === 'white') {
        title = s('White ink on ' + name, name + ' 上的白墨工艺');
        steps = [
          s('Clean and pre-treat the surface — ' + primer + '.', '清洁并预处理表面 —— ' + primer + '。'),
          s('White ink recommendation: ' + white + '.', '白墨建议：' + white + '。'),
          s('Lay white as the ground, cure it fully, then print colour on top.', '白墨先打底，完全固化后再上彩墨。'),
          s('Check opacity on the darkest part of the substrate before the full run.', '批量前在材料最深的区域确认遮盖力。'),
        ];
        note = s('White pigment settles — circulate or stir before the first job of the day.', '白墨颜料会沉淀 —— 每天开机前先循环或搅拌。');
      } else if (effect === 'relief') {
        title = s('Raised relief on ' + name, name + ' 上的浮雕效果');
        steps = [
          s('Print and fully cure the colour layer first — ' + adhesion + '.', '先打印并完全固化彩墨层 —— ' + adhesion + '。'),
          s('Varnish plan: ' + varnish + '.', '光油方案：' + varnish + '。'),
          s('Build the relief with two to four thin varnish passes, curing between each pass.', '浮雕用二到四道薄光油叠加，每道之间完成固化。'),
          s('On thin or heat-sensitive media add a delay after each pass so the sheet does not curl.', '薄材料或热敏材料每道之间加延时，避免翘边。'),
        ];
        note = s('One heavy pass flows out and loses the edge — thin passes keep it sharp.', '一道厚光油会流平、失去边缘；薄层多道才保得住边线。');
      } else if (effect === 'gold') {
        title = s('Gold foil on ' + name, name + ' 上的烫金效果');
        steps = [
          s('Confirm the surface can take a foil — ' + adhesion + '.', '先确认材料能上烫金 —— ' + adhesion + '。'),
          s('Print the adhesive / primer pass where the foil will sit, then cure it.', '在需要烫金的区域打印胶水 / 底涂，并完成固化。'),
          s('Apply the foil at the recommended temperature and pressure, then peel the carrier.', '按推荐温度与压力压合烫金膜，再撕离载体。'),
          s('Check edges and small counters — foil bridges fine detail if the adhesive is too heavy.', '检查边缘与细笔画 —— 胶层过厚会把细节糊掉。'),
        ];
        note = s('Foil is a press process after printing, not an ink: the printer lays the adhesive, the press makes the shine.', '烫金是印后的压合工艺，不是墨水：打印机只负责上胶，光泽来自压合。');
      } else {
        title = s('Crystal label on ' + name, name + ' 上的水晶标效果');
        steps = [
          s('Print the graphic on DTF / transfer film, then cure it.', '在 DTF / 转贴膜上打印图案并固化。'),
          s('Apply the adhesive layer evenly — ' + white + '.', '均匀施加胶层 —— ' + white + '。'),
          s('Laminate the carrier and transfer onto the prepared surface: ' + primer + '.', '贴合载体并转到处理好的表面：' + primer + '。'),
          s('Press from the centre out to avoid trapped air, then peel the carrier slowly.', '从中心向外压合，避免夹气，再慢慢撕离载体。'),
        ];
        note = s('Crystal labels suit curved and hard-to-print parts; test one piece before a batch.', '水晶标适合曲面与不好直接打印的工件；批量前先试一片。');
      }

      /* machine suggestions come from the substrate data; crystal labels favour
         a DTF machine when the substrate lists one */
      var machines = (sub.machines || []).slice();
      if (effect === 'crystal') {
        var dtf = [];
        var rest = [];
        for (var i = 0; i < machines.length; i++) {
          if (/DTF/i.test(machines[i].model)) dtf.push(machines[i]);
          else rest.push(machines[i]);
        }
        machines = dtf.concat(rest);
      }
      if (!machines.length) {
        note = s('No machine listed for this substrate yet — ask which configuration fits.', '该材料尚未列适用机型 —— 欢迎直接咨询配置。');
      }
      return { title: title, steps: steps, machines: machines, note: note };
    };

    var render = function () {
      if (!out) return;
      var sub = select ? byId(select.value) : null;
      if (!sub) {
        out.innerHTML =
          '<p class="mat-out__hint">' +
          esc(t('Choose a material above to see the suggested process.', '先在上方选择材料，即可看到推荐工艺。')) +
          '</p>';
        return;
      }
      var pack = build(sub, activeEffect);
      var stepsHtml = '';
      for (var i = 0; i < pack.steps.length; i++) {
        stepsHtml += '<li>' + esc(pack.steps[i]) + '</li>';
      }
      var machinesHtml = '';
      if (pack.machines.length) {
        machinesHtml =
          '<div class="mat-out__machines"><span class="ta-mono">' +
          esc(t('Compatible machines', '适用机型')) +
          '</span>' +
          pack.machines
            .map(function (m) {
              return '<a class="mat-out__mach" href="' + esc(m.url) + '">' + esc(m.model) + '</a>';
            })
            .join('') +
          '</div>';
      }
      out.innerHTML =
        '<h3 class="mat-out__title">' + esc(pack.title) + '</h3>' +
        '<p class="mat-out__sub">' +
        esc(t('A starting point from the workshop — confirm with a test piece on your own batch.', '来自车间的起点建议 —— 请在自己的材料批次上打样确认。')) +
        '</p>' +
        '<ol class="mat-out__steps">' + stepsHtml + '</ol>' +
        machinesHtml +
        '<p class="mat-out__note">' + esc(pack.note) + '</p>';
    };

    if (select) select.addEventListener('change', render);

    for (var e = 0; e < effectButtons.length; e++) {
      effectButtons[e].addEventListener('click', function (event) {
        var btn = event.currentTarget;
        activeEffect = btn.getAttribute('data-effect') || 'colour';
        for (var k = 0; k < effectButtons.length; k++) {
          var on = effectButtons[k] === btn;
          effectButtons[k].classList.toggle('is-active', on);
          effectButtons[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        render();
      });
    }

    document.addEventListener('langchange', render);
    render();
  }
})();
