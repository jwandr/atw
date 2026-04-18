/**
 * dest.js — Shared rendering engine for all destination pages.
 *
 * Each destinations/XXX.html has <body data-dest="XXX">.
 * This script reads that attribute, fetches data/XXX.json,
 * and renders the full page.
 *
 * To add a new destination:
 *   1. Create data/newplace.json  (copy patagonia.json as template)
 *   2. Create destinations/newplace.html  (copy any stub, change data-dest)
 *   3. Add a card to index.html destinations array
 *   Done.
 */

(function () {
  'use strict';

  // ─── Tiny DOM helper ──────────────────────────────────────────────────────

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    }
    for (const c of children.flat(Infinity)) {
      if (c == null) continue;
      if (typeof c === 'string') e.append(document.createTextNode(c));
      else e.append(c);
    }
    return e;
  }

  function shimmer(w, h) {
    return el('div', { class: 'shimmer', style: `width:${w || '100%'};height:${h || '14px'};border-radius:6px;margin:4px 0;` });
  }

  // ─── Safety level maps ────────────────────────────────────────────────────

  const SAFETY_CLASS = { 1: 'safe', 2: 'caution', 3: 'warn', 4: 'danger' };
  const SAFETY_ICON  = { 1: '✓', 2: '!', 3: '⚠', 4: '⛔' };

  // ─── Section / list helpers ───────────────────────────────────────────────

  function section(title, ...children) {
    return el('div', { class: 'section' },
      el('h2', {}, title),
      ...children
    );
  }

  function ul(items) {
    return el('ul', { class: 'list' },
      ...items.map(i => el('li', {}, i))
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  function render(d) {
    document.title = `${d.title} | Travel Guide`;

    const page = document.querySelector('.page');
    page.innerHTML = '';

    // Nav breadcrumb
    page.append(
      el('nav', { class: 'site-nav' },
        el('a', { href: '../index.html' }, '✦ Travel Guide'),
        el('span', { class: 'sep' }, '›'),
        el('span', {}, d.title),
      )
    );

    // Hero image
    const hero = el('div', { class: 'hero' });
    if (d.hero_image) {
      const img = el('img', { src: d.hero_image, alt: d.title });
      img.onerror = () => {
        hero.innerHTML = '';
        hero.append(el('div', { class: 'hero-placeholder' }, '🗺'));
      };
      hero.append(img);
    } else {
      hero.append(el('div', { class: 'hero-placeholder' }, '🗺'));
    }
    page.append(hero);

    // Title + tagline
    page.append(
      el('h1', { class: 'dest-title' }, d.title),
      el('p',  { class: 'dest-tagline' }, d.tagline),
    );

    // Snapshot pills
    page.append(el('div', { class: 'snapshot' }, ...[
      `🗓 Best Time: ${d.snapshot.best_time}`,
      `⏱ ${d.snapshot.duration}`,
      `💰 ${d.snapshot.cost}`,
      `🌿 ${d.snapshot.type}`,
      `⚡ ${d.snapshot.intensity}`,
    ].map(t => el('div', { class: 'tag' }, t))));

    // Quick facts bar
    page.append(el('div', { class: 'quick-facts' }, ...[
      `🌍 ${d.quick_facts.timezone}`,
      `🛂 ${d.quick_facts.visa}`,
      `🗣 ${d.quick_facts.language}`,
      `💳 ${d.quick_facts.payments}`,
    ].map(t => el('div', {}, t))));

    // ── Sidebar panels (rendered now, populated async) ──
    const safetyPanelEl  = renderSafetyPanel();
    const weatherPanelEl = renderWeatherPanel();
    const ratePanelEl    = renderRatePanel(d);

    // ── Two-column grid ──
    page.append(
      el('div', { class: 'grid' },

        // LEFT
        el('div', {},
          section('Why Go', ul(d.why_go)),
          section('Essential Experiences', ul(d.essential_experiences)),
          renderSeasonality(d),
          section('Food & Drink', ul(d.food_and_drink)),
          section('Logistics', ul(d.logistics)),
          section('Friction Factors', ul(d.friction_factors)),
          section('Tips & Watchouts', ul(d.tips)),
          renderItinerary(d),
        ),

        // RIGHT
        el('div', { class: 'sidebar' },
          safetyPanelEl,
          renderWaterPanel(d.water_safety),
          weatherPanelEl,
          ratePanelEl,
        ),
      )
    );

    // Verdict
    page.append(
      el('div', { class: 'verdict' },
        el('strong', {}, 'Verdict'),
        el('p', {}, d.verdict),
      )
    );

    // Kick off async data loads
    fetchSafety(d, safetyPanelEl);
    fetchWeather(d, weatherPanelEl);
    fetchRate(d, ratePanelEl);
  }

  // ─── Seasonality ──────────────────────────────────────────────────────────

  function renderSeasonality(d) {
    const months = el('div', { class: 'months' },
      ...Object.entries(d.seasonality).map(([m, s]) =>
        el('span', { class: s }, m)
      )
    );
    const note = el('p', { class: 'season-note' }, d.seasonality_note);
    return section('When to Go', months, note);
  }

  // ─── Itinerary ────────────────────────────────────────────────────────────

  function renderItinerary(d) {
    const list = el('ul', { class: 'itinerary-list' },
      ...d.itinerary.map(item =>
        el('li', {},
          el('span', { class: 'day-num' }, `Day ${item.day}`),
          el('span', {}, item.label),
        )
      )
    );
    return section('Itinerary Ideas', list);
  }

  // ─── Static sidebar panels ────────────────────────────────────────────────

  function renderSafetyPanel() {
    return el('div', { class: 'panel caution', id: 'safety-panel' },
      el('h3', {}, 'Safety advice'),
      shimmer('60%', '16px'),
      shimmer('100%', '11px'),
      shimmer('80%',  '11px'),
    );
  }

  function renderWaterPanel(w) {
    const cls  = { safe: 'safe', caution: 'caution', unsafe: 'danger' }[w.status] || 'caution';
    const icon = { safe: '💧', caution: '⚠️', unsafe: '🚱' }[w.status] || '💧';
    return el('div', { class: `panel ${cls}` },
      el('h3', {}, 'Water safety'),
      el('div', { class: 'badge' }, `${icon} ${w.label}`),
      el('p', {}, w.note),
    );
  }

  function renderWeatherPanel() {
    return el('div', { class: 'panel', id: 'weather-panel' },
      el('h3', {}, 'Climate'),
      shimmer('70%', '11px'),
      shimmer('100%', '11px'),
    );
  }

  function renderRatePanel(d) {
    return el('div', { class: 'panel', id: 'rate-panel' },
      el('h3', {}, `Exchange rate (AUD → ${d.currency.code})`),
      shimmer('60%', '11px'),
    );
  }

  // ─── Async: Smartraveller safety ──────────────────────────────────────────

  async function fetchSafety(d, panel) {
    try {
      let country;

      // 1. Try nightly-cached file (written by GitHub Actions)
      try {
        const r = await fetch('../data/safety-cache.json');
        if (r.ok) {
          const cache = await r.json();
          country = cache[d.smartraveller_country];
        }
      } catch (_) {}

      // 2. Live fallback via CORS proxy
      if (!country) {
        const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.smartraveller.gov.au/destinations-export')}`;
        const r    = await fetch(proxy);
        const body = await r.json();
        const list = JSON.parse(body.contents);
        country = list.find(c => c.name === d.smartraveller_country);
      }

      if (!country) throw new Error('Not found');

      const level = country.advice_level;
      panel.className = `panel ${SAFETY_CLASS[level] || 'caution'}`;
      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Safety advice'),
        el('div', { class: 'badge' }, `${SAFETY_ICON[level]} Level ${level}: ${country.advice_text}`),
        el('p', {}, `Updated ${country.last_updated}`),
        el('a', { href: country.url, target: '_blank', rel: 'noopener' }, 'Full advice on Smartraveller →'),
      );

    } catch (_) {
      const slug = d.smartraveller_country.toLowerCase().replace(/ /g, '-');
      panel.className = 'panel caution';
      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Safety advice'),
        el('div', { class: 'badge' }, '⚠ Check before travel'),
        el('p', {}, 'Live advice unavailable.'),
        el('a', {
          href: `https://www.smartraveller.gov.au/destinations/${slug}`,
          target: '_blank', rel: 'noopener'
        }, 'Check Smartraveller →'),
      );
    }
  }

  // ─── Async: Open-Meteo climate normals ───────────────────────────────────

  async function fetchWeather(d, panel) {
    if (!d.climate) return;
    try {
      const url = [
        'https://climate-api.open-meteo.com/v1/climate',
        `?latitude=${d.climate.lat}&longitude=${d.climate.lon}`,
        '&start_date=1991-01-01&end_date=2020-12-31',
        '&monthly=temperature_2m_max,temperature_2m_min,precipitation_sum',
        '&models=EC_Earth3P_HR',
      ].join('');

      const res  = await fetch(url);
      const data = await res.json();
      if (!data.monthly) throw new Error('No climate data');

      const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const hi      = data.monthly.temperature_2m_max;
      const lo      = data.monthly.temperature_2m_min;
      const rain    = data.monthly.precipitation_sum;

      // Four quarterly columns
      const keys = [0, 3, 6, 9];
      const grid = el('div', { class: 'weather-grid' },
        ...keys.map(i =>
          el('div', { class: 'weather-month' },
            el('div', { class: 'wm-name' }, MONTHS[i]),
            el('div', { class: 'wm-hi' },   `${Math.round(hi[i])}°`),
            el('div', { class: 'wm-lo' },   `${Math.round(lo[i])}° lo`),
            el('div', { class: 'wm-rain' }, `${Math.round(rain[i])}mm`),
          )
        )
      );

      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Climate (monthly avg)'),
        grid,
        el('p', { style: 'margin-top:8px;font-size:0.78rem;' }, '30-yr averages · hi / lo / rainfall'),
      );

    } catch (_) {
      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Climate'),
        el('p', {}, 'Weather data unavailable.'),
      );
    }
  }

  // ─── Async: Frankfurter exchange rates ───────────────────────────────────

  async function fetchRate(d, panel) {
    const code = d.currency.code;
    if (code === 'AUD') {
      panel.innerHTML = '';
      panel.append(el('h3', {}, 'Currency'), el('p', {}, 'Local currency is AUD.'));
      return;
    }
    try {
      const res  = await fetch(`https://api.frankfurter.app/latest?from=AUD&to=${code}`);
      const data = await res.json();
      const rate = data.rates[code];
      if (!rate) throw new Error('No rate');

      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Exchange rate'),
        el('div', { class: 'rate-display' }, `1 AUD = ${rate.toFixed(2)} ${code}`),
        el('div', { class: 'rate-sub' }, `${d.currency.label} · live rate`),
        el('p', { style: 'margin-top:6px;font-size:0.82rem;' },
          `100 AUD ≈ ${(rate * 100).toFixed(0)} ${code}`),
      );

    } catch (_) {
      panel.innerHTML = '';
      panel.append(
        el('h3', {}, 'Exchange rate'),
        el('p', {}, `Could not load ${code} rate.`),
        el('a', {
          href: `https://www.xe.com/currencyconverter/convert/?From=AUD&To=${code}`,
          target: '_blank', rel: 'noopener',
        }, `Check on XE.com →`),
      );
    }
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────

  async function boot() {
    const destId = document.body.getAttribute('data-dest');
    if (!destId) {
      document.querySelector('.page').innerHTML =
        '<div class="error-state"><h2>No destination set</h2><p><a href="../index.html">← All destinations</a></p></div>';
      return;
    }

    try {
      const res = await fetch(`../data/${destId}.json`);
      if (!res.ok) throw new Error(res.status);
      render(await res.json());
    } catch (e) {
      document.querySelector('.page').innerHTML = `
        <div class="error-state">
          <h2>Destination not found</h2>
          <p>Could not load <code>${destId}</code>. <a href="../index.html">← All destinations</a></p>
        </div>`;
    }
  }

  boot();
})();
