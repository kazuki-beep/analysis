/* =========================================================================
   Bono — site behaviour
   Dependency-free, progressive enhancement, language-agnostic.
   Every module is a no-op when its markup is absent, so one file serves
   every page in both languages.
   ========================================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function svg(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    return el;
  }

  function readJSON(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  /* Locale-aware number formatting driven by <html lang>. */
  var LOCALE = document.documentElement.lang || 'en';
  function fmt(n, digits) {
    return new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0
    }).format(n);
  }

  /* ---------------------------------------------------------------------
     1. Navigation — sticky state, mega-menu, mobile drawer
     --------------------------------------------------------------------- */

  function initNav() {
    var nav = $('.nav');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mega-menu: opens on hover and on focus, closes on Escape or blur.
       aria-expanded on the trigger is the single source of truth. */
    $$('[data-mega-trigger]').forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;
      var closeTimer;

      function open() {
        clearTimeout(closeTimer);
        $$('[data-mega-trigger]').forEach(function (other) {
          if (other !== trigger) close(other);
        });
        trigger.setAttribute('aria-expanded', 'true');
        panel.setAttribute('data-open', 'true');
      }

      function close(t) {
        var tr = t || trigger;
        var p = document.getElementById(tr.getAttribute('aria-controls'));
        tr.setAttribute('aria-expanded', 'false');
        if (p) p.setAttribute('data-open', 'false');
      }

      function scheduleClose() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function () { close(); }, 160);
      }

      /* Pointer hover opens; keyboard uses Enter/Space on the button. Opening
         on focus would both pop the menu while tabbing past it and re-open it
         when Escape returns focus to the trigger. */
      trigger.addEventListener('mouseenter', open);
      trigger.addEventListener('mouseleave', scheduleClose);
      panel.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
      panel.addEventListener('mouseleave', scheduleClose);

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (trigger.getAttribute('aria-expanded') === 'true') close(); else open();
      });

      /* Close once focus leaves the whole disclosure. */
      document.addEventListener('focusin', function (e) {
        if (!panel.contains(e.target) && e.target !== trigger) close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
          close();
          trigger.focus();
        }
      });
    });

    /* Mobile drawer reuses the same link list. */
    var toggle = $('.nav__toggle');
    var drawer = $('#nav-drawer');
    if (toggle && drawer) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        drawer.hidden = open;
        document.body.style.overflow = open ? '' : 'hidden';
      });
      $$('a', drawer).forEach(function (a) {
        a.addEventListener('click', function () {
          toggle.setAttribute('aria-expanded', 'false');
          drawer.hidden = true;
          document.body.style.overflow = '';
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     2. Scroll reveal + counters
     --------------------------------------------------------------------- */

  function initReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var counters = $$('[data-count-to]');
    if (!counters.length) return;

    function run(el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var digits = parseInt(el.getAttribute('data-count-digits') || '0', 10);
      if (isNaN(to)) return;
      if (reduceMotion) { el.textContent = fmt(to, digits); return; }

      var start = performance.now();
      var dur = 1400;
      function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * eased, digits);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* SVG paths animate their own length so the dash offset is exact. */
  function initDrawLengths() {
    $$('.draw').forEach(function (path) {
      try {
        var len = Math.ceil(path.getTotalLength());
        path.style.setProperty('--len', len);
      } catch (e) { /* path not rendered yet — CSS fallback applies */ }
    });
  }

  /* ---------------------------------------------------------------------
     3. Hero — journey chips + live dashboard
     --------------------------------------------------------------------- */

  function initHero() {
    var steps = $$('.journey__step');
    if (steps.length && !reduceMotion) {
      var i = 0;
      setInterval(function () {
        steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        i = (i + 1) % steps.length;
      }, 1500);
    } else {
      steps.forEach(function (s) { s.classList.add('is-active'); });
    }

    /* Scope split bar fills to its declared share once visible. */
    var bars = $$('.scopebar span');
    bars.forEach(function (b) {
      var w = b.getAttribute('data-width');
      if (!w) return;
      if (reduceMotion) { b.style.width = w + '%'; return; }
      b.style.width = '0%';
      setTimeout(function () { b.style.width = w + '%'; }, 260);
    });
  }

  /* ---------------------------------------------------------------------
     4. Decarbonization engine — stepper with autoplay
     --------------------------------------------------------------------- */

  function initEngine() {
    var root = $('[data-engine]');
    if (!root) return;

    var steps = $$('.step', root);
    var panels = $$('.stage-panel', root);
    if (!steps.length) return;

    var timer = null;
    var paused = false;

    function select(index, userDriven) {
      steps.forEach(function (s, i) {
        s.setAttribute('aria-selected', String(i === index));
        s.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      panels.forEach(function (p, i) {
        p.setAttribute('data-active', String(i === index));
      });
      root.setAttribute('data-current', String(index));
      if (userDriven) { paused = true; clearInterval(timer); }
    }

    steps.forEach(function (step, i) {
      step.addEventListener('click', function () { select(i, true); });
      step.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % steps.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + steps.length) % steps.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = steps.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
        steps[next].focus();
      });
    });

    select(0);

    /* Autoplay only while the section is on screen and untouched. */
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          clearInterval(timer);
          if (entry.isIntersecting && !paused) {
            timer = setInterval(function () {
              var cur = parseInt(root.getAttribute('data-current') || '0', 10);
              select((cur + 1) % steps.length);
            }, 7000);
          }
        });
      }, { threshold: 0.35 });
      io.observe(root);
    }
  }

  /* ---------------------------------------------------------------------
     5. Scopes — touch-friendly disclosure
     --------------------------------------------------------------------- */

  function initScopes() {
    $$('.scope').forEach(function (scope) {
      scope.addEventListener('click', function () {
        var open = scope.getAttribute('aria-expanded') === 'true';
        $$('.scope').forEach(function (s) { s.setAttribute('aria-expanded', 'false'); });
        scope.setAttribute('aria-expanded', String(!open));
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. Decarbonization roadmap
         Chart is decorative (aria-hidden); the projects table beneath it is
         the accessible equivalent, and the two cross-highlight.
     --------------------------------------------------------------------- */

  function initRoadmap() {
    var host = $('[data-roadmap]');
    if (!host) return;
    var data = readJSON('roadmap-data');
    if (!data) return;

    var W = 900, H = 300, padL = 46, padR = 24, padT = 20, padB = 34;
    var x0 = data.startYear, x1 = data.endYear;
    var yMax = data.baseline;

    function X(year) { return padL + (year - x0) / (x1 - x0) * (W - padL - padR); }
    function Y(val) { return padT + (1 - val / yMax) * (H - padT - padB); }

    var root = svg('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      class: 'chart',
      'aria-hidden': 'true',
      focusable: 'false',
      preserveAspectRatio: 'xMidYMid meet'
    });

    /* Gridlines + year axis */
    var grid = svg('g', { class: 'chart-grid' });
    for (var g = 0; g <= 4; g++) {
      var gy = padT + g * (H - padT - padB) / 4;
      grid.appendChild(svg('line', { x1: padL, y1: gy, x2: W - padR, y2: gy }));
    }
    root.appendChild(grid);

    data.ticks.forEach(function (year) {
      var t = svg('text', { x: X(year), y: H - 12, class: 'chart-axis', 'text-anchor': 'middle' });
      t.textContent = year;
      root.appendChild(t);
    });

    ['100%', '75%', '50%', '25%', '0'].forEach(function (label, idx) {
      var t = svg('text', {
        x: padL - 8, y: padT + idx * (H - padT - padB) / 4 + 3,
        class: 'chart-axis', 'text-anchor': 'end'
      });
      t.textContent = label;
      root.appendChild(t);
    });

    /* Business-as-usual reference */
    var bau = svg('line', {
      x1: X(x0), y1: Y(yMax), x2: X(x1), y2: Y(yMax * (data.bauGrowth || 1)),
      stroke: 'var(--line-strong)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4'
    });
    root.appendChild(bau);
    /* Label sits below the line: above it would clip out of the viewBox
       whenever the business-as-usual case grows past the baseline. */
    var bauLabel = svg('text', { x: X(x1) - 4, y: Y(yMax * (data.bauGrowth || 1)) + 14, class: 'chart-axis', 'text-anchor': 'end' });
    bauLabel.textContent = data.bauLabel;
    root.appendChild(bauLabel);

    /* Decarbonization trajectory */
    var pts = data.trajectory.map(function (p) { return [X(p[0]), Y(p[1])]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');

    var areaPath = svg('path', {
      d: d + ' L' + pts[pts.length - 1][0] + ' ' + Y(0) + ' L' + pts[0][0] + ' ' + Y(0) + ' Z',
      fill: 'url(#roadGrad)', opacity: '0'
    });
    var defs = svg('defs');
    var lg = svg('linearGradient', { id: 'roadGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
    lg.appendChild(svg('stop', { offset: '0%', 'stop-color': 'var(--green)', 'stop-opacity': '.18' }));
    lg.appendChild(svg('stop', { offset: '100%', 'stop-color': 'var(--green)', 'stop-opacity': '0' }));
    defs.appendChild(lg);
    root.appendChild(defs);
    root.appendChild(areaPath);

    var line = svg('path', {
      d: d, fill: 'none', stroke: 'var(--green)', 'stroke-width': 2.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'draw'
    });
    root.appendChild(line);

    /* Net Zero terminus */
    var end = pts[pts.length - 1];
    root.appendChild(svg('circle', { cx: end[0], cy: end[1], r: 5, fill: 'var(--lime)', stroke: 'var(--carbon)', 'stroke-width': 1.5 }));
    var nz = svg('text', { x: end[0], y: end[1] - 14, class: 'chart-axis', 'text-anchor': 'end', 'font-weight': '600' });
    nz.textContent = data.netZeroLabel;
    root.appendChild(nz);

    /* Project markers, keyed to table rows */
    var markers = {};
    data.projects.forEach(function (p) {
      var cx = X(p.year);
      var traj = data.trajectory;
      var cy = Y(interp(traj, p.year));
      var m = svg('g', { 'data-project': p.id, opacity: '0' });
      m.appendChild(svg('circle', { cx: cx, cy: cy, r: 11, fill: 'var(--green)', opacity: '.12' }));
      m.appendChild(svg('circle', { cx: cx, cy: cy, r: 4.5, fill: 'var(--warm-white)', stroke: 'var(--green)', 'stroke-width': 2 }));
      root.appendChild(m);
      markers[p.id] = m;

      if (!reduceMotion) {
        setTimeout(function () {
          m.style.transition = 'opacity .4s ease';
          m.setAttribute('opacity', '1');
        }, 900 + p.order * 140);
      } else {
        m.setAttribute('opacity', '1');
      }
    });

    if (reduceMotion) areaPath.setAttribute('opacity', '1');
    else setTimeout(function () {
      areaPath.style.transition = 'opacity .8s ease';
      areaPath.setAttribute('opacity', '1');
    }, 500);

    function interp(traj, year) {
      for (var i = 1; i < traj.length; i++) {
        if (year <= traj[i][0]) {
          var a = traj[i - 1], b = traj[i];
          var t = (year - a[0]) / (b[0] - a[0]);
          return a[1] + (b[1] - a[1]) * t;
        }
      }
      return traj[traj.length - 1][1];
    }

    host.appendChild(root);
    initDrawLengths();

    /* Cross-highlight between table rows and markers */
    $$('[data-project-row]').forEach(function (row) {
      var id = row.getAttribute('data-project-row');
      function on() {
        var m = markers[id];
        if (!m) return;
        m.querySelector('circle').setAttribute('opacity', '.32');
        m.querySelectorAll('circle')[1].setAttribute('r', '6');
      }
      function off() {
        var m = markers[id];
        if (!m) return;
        m.querySelector('circle').setAttribute('opacity', '.12');
        m.querySelectorAll('circle')[1].setAttribute('r', '4.5');
      }
      row.addEventListener('mouseenter', on);
      row.addEventListener('mouseleave', off);
      row.addEventListener('focusin', on);
      row.addEventListener('focusout', off);
    });
  }

  /* ---------------------------------------------------------------------
     7. Marketplace filters
     --------------------------------------------------------------------- */

  function initMarket() {
    var chips = $$('[data-filter]');
    var offers = $$('[data-category]');
    if (!chips.length || !offers.length) return;

    var status = $('[data-filter-status]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var value = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });

        var shown = 0;
        offers.forEach(function (offer) {
          var match = value === 'all' || offer.getAttribute('data-category') === value;
          offer.hidden = !match;
          if (match) shown++;
        });

        if (status) {
          status.textContent = status.getAttribute('data-template').replace('{n}', shown);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     8. Financing flow — sequential lighting
     --------------------------------------------------------------------- */

  function initFlow() {
    var flow = $('[data-flow]');
    if (!flow) return;
    var nodes = $$('.flow__node', flow);
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-lit'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        nodes.forEach(function (n, i) {
          setTimeout(function () { n.classList.add('is-lit'); }, i * 220);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    io.observe(flow);
  }

  /* ---------------------------------------------------------------------
     9. Supply chain network
         Hub-and-spoke graph built from JSON so labels stay localized.
     --------------------------------------------------------------------- */

  function initNetwork() {
    var host = $('[data-network]');
    if (!host) return;
    var data = readJSON('network-data');
    if (!data) return;

    var W = 560, H = 420, cx = W / 2, cy = H / 2, R = 155;
    var root = svg('svg', {
      viewBox: '0 0 ' + W + ' ' + H, class: 'chart',
      role: 'group', 'aria-label': data.chartLabel
    });

    var n = data.suppliers.length;
    var positions = data.suppliers.map(function (s, i) {
      var angle = (-Math.PI / 2) + (i * 2 * Math.PI / n);
      return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });

    /* Edges first so nodes paint over them */
    var edges = [];
    positions.forEach(function (p, i) {
      var e = svg('line', { x1: cx, y1: cy, x2: p.x, y2: p.y, class: 'edge' });
      root.appendChild(e);
      edges.push(e);
    });

    /* Hub */
    var hub = svg('g');
    hub.appendChild(svg('circle', { cx: cx, cy: cy, r: 46, fill: 'var(--carbon)' }));
    hub.appendChild(svg('circle', { cx: cx, cy: cy, r: 56, fill: 'none', stroke: 'var(--green)', 'stroke-opacity': '.3' }));
    var hubText = svg('text', {
      x: cx, y: cy + 3, 'text-anchor': 'middle',
      fill: 'var(--on-dark)', 'font-size': '9.5', 'font-family': 'var(--mono)',
      'letter-spacing': '.05em'
    });
    data.hubLabel.split('\n').forEach(function (linePart, idx) {
      var ts = svg('tspan', { x: cx, dy: idx === 0 ? -4 : 12 });
      ts.textContent = linePart;
      hubText.appendChild(ts);
    });
    hub.appendChild(hubText);
    root.appendChild(hub);

    /* Supplier nodes */
    var nodes = [];
    data.suppliers.forEach(function (s, i) {
      var p = positions[i];
      var colour = s.reporting ? 'var(--green)' : 'var(--warn)';

      var g = svg('g', {
        class: 'node-hit', tabindex: '0', role: 'button',
        'aria-label': s.name + ' — ' + s.statusLabel
      });
      g.appendChild(svg('circle', {
        cx: p.x, cy: p.y, r: 21, class: 'node-ring',
        fill: 'none', stroke: colour, 'stroke-opacity': '.35', 'stroke-width': '1.5'
      }));
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 13, fill: 'var(--warm-white)', stroke: colour, 'stroke-width': '1.5' }));
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 4, fill: colour }));

      var label = svg('text', {
        x: p.x, y: p.y + (p.y < cy ? -30 : 38), class: 'node-label', 'text-anchor': 'middle'
      });
      label.textContent = s.short;
      g.appendChild(label);

      root.appendChild(g);
      nodes.push(g);

      function pick() { select(i); }
      g.addEventListener('click', pick);
      g.addEventListener('mouseenter', pick);
      g.addEventListener('focus', pick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
    });

    host.appendChild(root);

    /* Detail card */
    var card = $('[data-supplier-card]');
    function select(i) {
      var s = data.suppliers[i];
      nodes.forEach(function (g, idx) { g.setAttribute('data-selected', String(idx === i)); });
      edges.forEach(function (e, idx) { e.classList.toggle('is-active', idx === i); });
      if (!card) return;

      $('[data-field="name"]', card).textContent = s.name;
      $('[data-field="sector"]', card).textContent = s.sector;
      $('[data-field="status"]', card).textContent = s.statusLabel;
      var pill = $('[data-field="status"]', card);
      pill.className = 'pill ' + (s.reporting ? 'pill--live' : 'pill--fin');
      $('[data-field="emissions"]', card).textContent = fmt(s.emissions) + ' tCO₂e';
      $('[data-field="maturity"]', card).textContent = s.maturity;
      $('[data-field="progress"]', card).textContent = s.progress + '%';
      $('[data-field="meter"]', card).style.width = s.progress + '%';
    }
    select(0);
  }

  /* ---------------------------------------------------------------------
     10. Illustrative roadmap simulator
         Purely indicative arithmetic — labelled as such in the markup.
     --------------------------------------------------------------------- */

  function initSimulator() {
    var sim = $('[data-simulator]');
    if (!sim) return;

    var config = readJSON('sim-data');
    if (!config) return;

    var els = {
      industry: $('#sim-industry'),
      emissions: $('#sim-emissions'),
      emissionsOut: $('#sim-emissions-out'),
      country: $('#sim-country'),
      energy: $('#sim-energy'),
      target: $('#sim-target'),
      targetOut: $('#sim-target-out'),
      year: $('#sim-year'),
      chart: $('[data-sim-chart]'),
      levers: $('[data-sim-levers]'),
      readCurrent: $('[data-sim-current]'),
      readTarget: $('[data-sim-target]'),
      readCut: $('[data-sim-cut]')
    };

    function compute() {
      var base = parseInt(els.emissions.value, 10);
      var pct = parseInt(els.target.value, 10);
      var year = parseInt(els.year.value, 10);
      var industry = config.industries[els.industry.value] || config.industries._default;
      var energy = config.energy[els.energy.value] || {};

      var target = base * (1 - pct / 100);

      els.emissionsOut.textContent = fmt(base) + ' tCO₂e';
      els.targetOut.textContent = pct + '%';
      els.readCurrent.textContent = fmt(base);
      els.readTarget.textContent = fmt(Math.round(target));
      els.readCut.textContent = fmt(Math.round(base - target));

      /* Weighted levers: industry profile nudged by the declared energy source. */
      var levers = industry.levers.map(function (l) {
        var weight = l.weight * (energy.boost && energy.boost[l.key] ? energy.boost[l.key] : 1);
        return { key: l.key, label: config.leverLabels[l.key], weight: weight };
      });
      var total = levers.reduce(function (a, l) { return a + l.weight; }, 0);
      levers.sort(function (a, b) { return b.weight - a.weight; });

      els.levers.innerHTML = '';
      levers.slice(0, 4).forEach(function (l) {
        var share = Math.round(l.weight / total * 100);
        var li = document.createElement('li');
        li.className = 'stack-sm';
        li.innerHTML =
          '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:baseline">' +
            '<span style="font-size:.875rem;font-weight:560">' + l.label + '</span>' +
            '<span class="num" style="font-size:.8125rem;color:var(--ink-muted)">~' + share + '%</span>' +
          '</div>' +
          '<div class="meter"><i style="width:' + share + '%"></i></div>';
        els.levers.appendChild(li);
      });

      drawTrajectory(base, target, year);
    }

    function drawTrajectory(base, target, endYear) {
      var startYear = config.startYear;
      var W = 640, H = 260, padL = 52, padR = 20, padT = 18, padB = 30;
      els.chart.innerHTML = '';

      var root = svg('svg', {
        viewBox: '0 0 ' + W + ' ' + H, class: 'chart',
        'aria-hidden': 'true', focusable: 'false'
      });

      function X(y) { return padL + (y - startYear) / (endYear - startYear) * (W - padL - padR); }
      function Y(v) { return padT + (1 - v / base) * (H - padT - padB); }

      var grid = svg('g', { class: 'chart-grid' });
      for (var i = 0; i <= 4; i++) {
        var gy = padT + i * (H - padT - padB) / 4;
        grid.appendChild(svg('line', { x1: padL, y1: gy, x2: W - padR, y2: gy }));
      }
      root.appendChild(grid);

      [0, 0.25, 0.5, 0.75, 1].forEach(function (f, i) {
        var t = svg('text', {
          x: padL - 8, y: padT + i * (H - padT - padB) / 4 + 3,
          class: 'chart-axis', 'text-anchor': 'end'
        });
        t.textContent = fmt(Math.round(base * (1 - f)));
        root.appendChild(t);
      });

      [startYear, Math.round((startYear + endYear) / 2), endYear].forEach(function (y) {
        var t = svg('text', { x: X(y), y: H - 10, class: 'chart-axis', 'text-anchor': 'middle' });
        t.textContent = y;
        root.appendChild(t);
      });

      /* Target line */
      root.appendChild(svg('line', {
        x1: padL, y1: Y(target), x2: W - padR, y2: Y(target),
        stroke: 'var(--lime-deep)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4'
      }));

      /* Slightly convex path: early wins, then harder abatement. */
      var pts = [];
      var span = endYear - startYear;
      for (var y = startYear; y <= endYear; y++) {
        var p = (y - startYear) / span;
        var shaped = 1 - Math.pow(1 - p, 1.55);
        pts.push([X(y), Y(base - (base - target) * shaped)]);
      }
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');

      var area = svg('path', {
        d: d + ' L' + X(endYear) + ' ' + Y(0) + ' L' + X(startYear) + ' ' + Y(0) + ' Z',
        fill: 'var(--green)', opacity: '.10'
      });
      root.appendChild(area);
      root.appendChild(svg('path', {
        d: d, fill: 'none', stroke: 'var(--green)', 'stroke-width': 2.5,
        'stroke-linecap': 'round'
      }));
      root.appendChild(svg('circle', {
        cx: X(endYear), cy: Y(target), r: 5,
        fill: 'var(--green)', stroke: 'var(--warm-white)', 'stroke-width': 2
      }));

      els.chart.appendChild(root);
    }

    ['industry', 'emissions', 'country', 'energy', 'target', 'year'].forEach(function (k) {
      if (els[k]) els[k].addEventListener('input', compute);
    });
    compute();
  }

  /* ---------------------------------------------------------------------
     11. Demo request wizard
         Client-side only: no endpoint is wired up, so nothing is
         transmitted. See README for connecting a real handler.
     --------------------------------------------------------------------- */

  function initWizard() {
    var form = $('[data-wizard]');
    if (!form) return;

    var steps = $$('.wizard__step', form);
    var progress = $$('.wizard__progress li', form);
    var back = $('[data-wizard-back]', form);
    var next = $('[data-wizard-next]', form);
    var submit = $('[data-wizard-submit]', form);
    var confirm = $('[data-wizard-confirm]');
    var current = 0;

    function render() {
      steps.forEach(function (s, i) { s.hidden = i !== current; });
      progress.forEach(function (p, i) {
        p.setAttribute('data-state', i < current ? 'done' : (i === current ? 'current' : 'todo'));
      });
      back.hidden = current === 0;
      next.hidden = current === steps.length - 1;
      submit.hidden = current !== steps.length - 1;

      var heading = $('h2, h3', steps[current]);
      if (heading) heading.setAttribute('tabindex', '-1');
      if (heading && current > 0) heading.focus();
    }

    function validate(index) {
      var ok = true;
      $$('[required]', steps[index]).forEach(function (field) {
        var valid = field.checkValidity();
        field.setAttribute('aria-invalid', String(!valid));
        var msg = field.parentElement.querySelector('.error-text');
        if (msg) msg.hidden = valid;
        if (!valid && ok) { field.focus(); ok = false; }
      });
      return ok;
    }

    next.addEventListener('click', function () {
      if (!validate(current)) return;
      current = Math.min(current + 1, steps.length - 1);
      render();
    });

    back.addEventListener('click', function () {
      current = Math.max(current - 1, 0);
      render();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(current)) return;
      form.hidden = true;
      if (confirm) {
        confirm.hidden = false;
        var h = $('h1, h2', confirm);
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
        confirm.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });

    /* Enter should advance rather than submit on non-final steps. */
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && current < steps.length - 1) {
        e.preventDefault();
        next.click();
      }
    });

    render();
  }

  /* ---------------------------------------------------------------------
     12. Mobile sticky CTA — appears once the hero has scrolled away
     --------------------------------------------------------------------- */

  function initStickyCta() {
    var cta = $('.sticky-cta');
    var hero = $('.hero');
    if (!cta || !hero || !('IntersectionObserver' in window)) return;

    document.body.classList.add('has-sticky-cta');
    var io = new IntersectionObserver(function (entries) {
      cta.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(hero);
  }

  /* ---------------------------------------------------------------------
     13. Language preference — remember the visitor's choice, never force it
     --------------------------------------------------------------------- */

  function initLangMemory() {
    $$('[data-lang-switch]').forEach(function (link) {
      link.addEventListener('click', function () {
        try { localStorage.setItem('bono-lang', link.getAttribute('data-lang-switch')); } catch (e) {}
      });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function boot() {
    initNav();
    initReveal();
    initCounters();
    initHero();
    initEngine();
    initScopes();
    initRoadmap();
    initMarket();
    initFlow();
    initNetwork();
    initSimulator();
    initWizard();
    initStickyCta();
    initLangMemory();
    initDrawLengths();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
