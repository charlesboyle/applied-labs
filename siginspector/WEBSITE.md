# SigInspector — Landing Page Spec

A complete design specification for the SigInspector landing page. Every section includes exact copy, HTML structure, and CSS. Extension UI mockups are rendered in code — no screenshots required.

---

## Design Philosophy

The page _is_ the extension. Same fonts. Same tokens. Same elevation system. The only difference is scale. A developer landing on this page should immediately recognize the aesthetic when they open DevTools — it's the same hand.

No decoration for decoration's sake. No hero gradients. No testimonial carousels. The product speaks; the page gets out of the way.

---

## Design System

### Typography

```css
/* Loaded from Google Fonts — same as the extension */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Role              | Font             | Size  | Weight | Tracking      |
|-------------------|------------------|-------|--------|---------------|
| Hero headline     | Instrument Sans  | 68px  | 600    | −0.03em       |
| H2 section        | Instrument Sans  | 38px  | 600    | −0.02em       |
| Body              | Instrument Sans  | 17px  | 400    | 0             |
| Section label     | Instrument Sans  | 11px  | 600    | +0.08em, caps |
| Monospace / badge | JetBrains Mono   | 10px  | 500    | +0.04em       |

### Color Tokens

```css
:root {
  /* Page surfaces — exact match to extension light mode */
  --bg:       #F4F4F2;
  --card:     #FFFFFF;
  --bar:      #EDECE9;
  --well:     #E5E4E1;

  /* Borders */
  --line:     #E0DFDC;
  --line-hi:  #C9C8C4;

  /* Ink */
  --ink:      #1A1917;
  --ink2:     #6B6A67;
  --ink3:     #AEADA9;

  /* Accent — Statsig-adjacent warm orange */
  --a:        #EE5B2A;
  --a-soft:   rgba(238, 91, 42, 0.08);
  --a-ring:   rgba(238, 91, 42, 0.20);

  /* Typography */
  --sans:     'Instrument Sans', system-ui, sans-serif;
  --mono:     'JetBrains Mono', 'SF Mono', ui-monospace, monospace;

  /* Elevation */
  --sh:       0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05);
  --sh-up:    0 4px 14px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05);
  --sh-hero:  0 40px 120px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.07);

  /* Extension dark theme — used inside mockup components */
  --ext-bg:     #0C0C0B;
  --ext-card:   #161614;
  --ext-bar:    #111110;
  --ext-well:   #1B1B19;
  --ext-inset:  #222220;
  --ext-line:   #232321;
  --ext-line-hi:#2E2D2A;
  --ext-ink:    #F0EFEC;
  --ext-ink2:   #8A8986;
  --ext-ink3:   #4C4B48;
  --ext-a:      #FF6B3D;

  /* Event-type badge colors (dark-mode variants — used in mockups) */
  --b-init:   rgba(124,58,237,0.18);  --b-init-fg:   #A78BFA;
  --b-gate:   rgba(37,99,235,0.18);   --b-gate-fg:   #60A5FA;
  --b-exp:    rgba(13,148,136,0.18);  --b-exp-fg:    #34D399;
  --b-config: rgba(217,119,6,0.18);   --b-config-fg: #FCD34D;
  --b-layer:  rgba(99,102,241,0.18);  --b-layer-fg:  #A5B4FC;
  --b-event:  rgba(22,163,74,0.18);   --b-event-fg:  #86EFAC;
  --b-sdk:    rgba(113,113,122,0.18); --b-sdk-fg:    #A1A1AA;
}
```

### Spacing & Radius

```
Section padding:  100px 40px (mobile: 64px 24px)
Max content width: 1100px
Card radius:      8px
Badge radius:     3px
Button radius:    7px
Feature section gap: 80px
```

---

## Page Layout

```
┌─────────────────────────────────────────────┐
│  NAVBAR — sticky, blurred, 56px             │
├─────────────────────────────────────────────┤
│  HERO                                       │
│   ·  eyebrow label                         │
│   ·  H1 headline (centered, 2 lines)       │
│   ·  subheadline                           │
│   ·  CTA buttons                           │
│   ──────────────────────────────────────   │
│   [  BROWSER SHELL + EXTENSION PANEL  ]    │
│   (full-width, bottom bleeds into next)    │
├─────────────────────────────────────────────┤
│  §1  Event Classification  (copy L, viz R) │
├─────────────────────────────────────────────┤
│  §2  Time Bucketing        (viz L, copy R) │
├─────────────────────────────────────────────┤
│  §3  Blocked + Dedup       (copy L, viz R) │
├─────────────────────────────────────────────┤
│  §4  Keyboard Nav          (full-width)    │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

---

## Global CSS

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--sans);
  font-size: 17px;
  background: var(--bg);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* ── Shared section wrapper ── */
.section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 100px 40px;
}

/* ── Section label (orange ALL CAPS eyebrow) ── */
.label {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--a);
  margin-bottom: 14px;
}

/* ── Headings ── */
h1 {
  font-family: var(--sans);
  font-size: clamp(44px, 6vw, 68px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.06;
  color: var(--ink);
}

h2 {
  font-family: var(--sans);
  font-size: clamp(28px, 3.5vw, 38px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--ink);
}

/* ── Body ── */
.body-text {
  font-size: 17px;
  line-height: 1.65;
  color: var(--ink2);
  max-width: 440px;
}

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  height: 44px;
  background: var(--a);
  color: #fff;
  border-radius: 7px;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: opacity 0.15s ease;
}
.btn-primary:hover { opacity: 0.86; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  height: 44px;
  color: var(--ink2);
  border: 1px solid var(--line-hi);
  border-radius: 7px;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.btn-ghost:hover { border-color: var(--ink3); color: var(--ink); }

/* ── 2-column feature grid ── */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.feature-copy { display: flex; flex-direction: column; gap: 20px; }
.feature-copy h2 { margin: 0; }
.feature-copy .body-text { margin: 0; }

/* ── Horizontal rule ── */
.rule {
  border: none;
  border-top: 1px solid var(--line);
  margin: 0;
}

/* ── Scroll reveal ── */
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal.visible { opacity: 1; transform: none; }

/* ── Responsive ── */
@media (max-width: 800px) {
  .feature-grid { grid-template-columns: 1fr; gap: 40px; }
  .section { padding: 64px 24px; }
  .feature-grid .viz-first { order: -1; } /* mockup above copy on mobile */
}
```

---

## Section 1 — Navbar

**Behavior:** Sticky. Transparent at top, gains `backdrop-filter` on scroll via JS class toggle.

### HTML

```html
<nav id="nav">
  <a class="nav-logo" href="/">
    <img src="icons/logo.svg" alt="SigInspector" height="16">
    <span>SigInspector</span>
  </a>
  <a class="btn-primary nav-cta" href="[CHROME_STORE_URL]" target="_blank" rel="noopener noreferrer">
    Add to Chrome
    <!-- Chrome logo SVG inline -->
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.75">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 0 1 6.928 4H12a4 4 0 0 0-4 4 4 4 0 0 0 .138 1.047L4.16 7.028A7.956 7.956 0 0 1 12 4zm0 16a8 8 0 0 1-7.465-5.144L8.27 11.5A4 4 0 0 0 12 16a4 4 0 0 0 3.465-2h5.327A8 8 0 0 1 12 20z"/>
    </svg>
  </a>
</nav>
```

### CSS

```css
#nav {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 56px;
  background: rgba(244, 244, 242, 0);
  border-bottom: 1px solid rgba(224, 223, 220, 0);
  transition: background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease;
}

#nav.scrolled {
  background: rgba(244, 244, 242, 0.88);
  border-bottom-color: rgba(224, 223, 220, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.nav-cta { height: 34px; font-size: 13px; padding: 0 14px; gap: 6px; }
```

### JS (scroll behavior)

```js
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });
```

---

## Section 2 — Hero

### Copy

```
[eyebrow]    Free Chrome extension

[H1]         Statsig traffic,
             live in DevTools.

[sub]        Catch every initialize call, gate check, and event
             the SDK fires — as it happens, with full JSON detail.

[CTA row]    [Add to Chrome →]   [View on GitHub]
```

**Notes on the H1:**
- "Statsig traffic," on line 1 in the default ink color `#1A1917`
- "live in DevTools." on line 2 — the word "live" gets a slight italic treatment in Instrument Sans to create a visual pause. Not colored; the restraint is the point.
- Do NOT use a gradient on the headline. The warm orange accent belongs on the CTA only.

### HTML

```html
<section class="hero">
  <div class="hero-copy">
    <span class="label">Free Chrome extension</span>
    <h1>
      Statsig traffic,<br>
      <em>live</em> in DevTools.
    </h1>
    <p class="body-text hero-sub">
      Catch every initialize call, gate check, and event<br>
      the SDK fires&mdash;as it happens, with full JSON detail.
    </p>
    <div class="hero-actions">
      <a class="btn-primary" href="[CHROME_STORE_URL]" target="_blank" rel="noopener noreferrer">
        Add to Chrome
      </a>
      <a class="btn-ghost" href="[GITHUB_URL]" target="_blank" rel="noopener noreferrer">
        View on GitHub
      </a>
    </div>
  </div>

  <!-- Full-width browser shell with extension panel mockup -->
  <div class="hero-panel-wrap">
    [BROWSER_SHELL_MOCKUP]  ← see full code block below
  </div>
</section>
```

### Hero CSS

```css
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 96px 40px 0;
  max-width: 1100px;
  margin: 0 auto;
  overflow: visible;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  max-width: 680px;
}

.hero-copy h1 em {
  font-style: italic;
  font-weight: 600;
}

.hero-sub {
  max-width: 500px;
  text-align: center;
  font-size: 18px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 6px;
}

.hero-panel-wrap {
  width: 100vw;
  margin-top: 64px;
  /* Full bleed — extends beyond the section's max-width */
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  padding: 0 40px;
  animation: panel-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}

@keyframes panel-rise {
  from { opacity: 0; transform: translateY(32px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}
```

---

## Hero: Browser Shell + Extension Panel Mockup

This is the centerpiece of the page. Rendered entirely in HTML/CSS — no images.

The shell shows a simplified browser chrome (dots, URL bar, DevTools tab strip) with the SigInspector tab active. Below it, the full extension panel UI: toolbar, event list, and detail panel.

### HTML

```html
<div class="browser-shell">

  <!-- Browser chrome bar -->
  <div class="browser-chrome">
    <div class="browser-dots">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
    </div>
    <div class="browser-url">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#4C4B48;flex-shrink:0;">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>dashboard.yourapp.com</span>
    </div>
    <div class="devtools-tabs">
      <span class="dt-tab">Elements</span>
      <span class="dt-tab">Console</span>
      <span class="dt-tab">Network</span>
      <span class="dt-tab dt-active">SigInspector</span>
    </div>
  </div>

  <!-- Extension panel -->
  <div class="ext-panel">

    <!-- Toolbar -->
    <div class="ext-toolbar">
      <img src="icons/logo.svg" alt="" height="13" style="opacity:0.9; flex-shrink:0;">
      <div class="filter-tabs">
        <button class="filter-tab ft-active">All</button>
        <button class="filter-tab">Exposures</button>
        <button class="filter-tab">Events</button>
        <button class="filter-tab">Init</button>
      </div>
      <div class="search-wrap">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#4C4B48;position:absolute;left:8px;top:50%;transform:translateY(-50%);">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="ext-search" placeholder="Search events…" readonly>
      </div>
      <div style="flex:1;"></div>
      <button class="ext-icon-btn" title="Clear">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
      <button class="ext-icon-btn" title="More">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>

    <!-- Panel body: event list + detail -->
    <div class="ext-body">

      <!-- Event list -->
      <div class="ext-list">

        <div class="time-sep">Today</div>

        <!-- INIT card (selected) -->
        <div class="ev-card ev-selected">
          <div class="ev-header">
            <span class="badge b-init">INIT</span>
            <span class="ev-name">initialize</span>
            <span class="ev-time">14:22:01.048</span>
          </div>
          <div class="ev-subs">
            <div class="ev-sub ev-sub-selected">
              <span class="badge b-gate">GATE</span>
              <span class="sub-name">show_new_onboarding</span>
              <span class="sub-val">true</span>
            </div>
            <div class="ev-sub">
              <span class="badge b-exp">EXP</span>
              <span class="sub-name">pricing_page_v3</span>
              <span class="sub-val">control</span>
            </div>
            <div class="ev-sub">
              <span class="badge b-config">CONFIG</span>
              <span class="sub-name">feature_config</span>
              <span class="sub-val">{ "max_items"…</span>
            </div>
            <div class="ev-sub">
              <span class="badge b-layer">LAYER</span>
              <span class="sub-name">checkout_layer</span>
              <span class="sub-val">variant_b</span>
            </div>
          </div>
        </div>

        <!-- log_event card -->
        <div class="ev-card">
          <div class="ev-header">
            <span class="badge b-event">EVENT</span>
            <span class="ev-name">button_clicked</span>
            <span class="ev-time">14:22:09.312</span>
          </div>
        </div>

        <!-- log_event card -->
        <div class="ev-card">
          <div class="ev-header">
            <span class="badge b-event">EVENT</span>
            <span class="ev-name">page_viewed</span>
            <span class="ev-time">14:22:00.114</span>
          </div>
        </div>

        <div class="time-sep">Yesterday</div>

        <!-- blocked card -->
        <div class="ev-card ev-blocked">
          <div class="ev-header">
            <span class="badge b-event">EVENT</span>
            <span class="ev-name">purchase_complete</span>
            <span style="margin-left:auto; display:flex; align-items:center; gap:8px;">
              <span class="badge b-blocked">BLOCKED</span>
              <span class="ev-time">09:14:55.001</span>
            </span>
          </div>
        </div>

      </div><!-- /ext-list -->

      <!-- Detail panel -->
      <div class="ext-detail">
        <div class="detail-head">
          <span class="badge b-gate">GATE</span>
          <span class="detail-name">show_new_onboarding</span>
          <button class="ext-icon-btn" style="margin-left:auto;" title="Copy JSON">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <div class="detail-kv">
          <div class="kv-row">
            <span class="kv-k">value</span>
            <span class="kv-v kv-true">true</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">rule_id</span>
            <span class="kv-v">3h9fk2j</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">user_id</span>
            <span class="kv-v">usr_8821</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">email</span>
            <span class="kv-v">ali@company.io</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">reason</span>
            <span class="kv-v">Network</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">time</span>
            <span class="kv-v" style="font-family:var(--mono); font-size:10px;">1709640121048</span>
          </div>
        </div>
      </div><!-- /ext-detail -->

    </div><!-- /ext-body -->
  </div><!-- /ext-panel -->
</div><!-- /browser-shell -->
```

### CSS — Browser Shell + Extension Panel

```css
/* ─── Browser shell ─────────────────────────────────── */
.browser-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
  box-shadow: var(--sh-hero);
  background: var(--ext-bg);
}

.browser-chrome {
  height: 42px;
  background: #1E1E1C;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  border-bottom: 1px solid var(--ext-bg);
  flex-shrink: 0;
}

.browser-dots { display: flex; gap: 6px; flex-shrink: 0; }
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.dot-red    { background: #FF5F57; }
.dot-yellow { background: #FFBD2E; }
.dot-green  { background: #28C840; }

.browser-url {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 300px;
  margin: 0 auto;
  height: 24px;
  background: #141412;
  border-radius: 5px;
  padding: 0 10px;
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--ext-ink3);
}

.devtools-tabs {
  display: flex;
  gap: 2px;
  font-family: var(--sans);
  font-size: 11px;
  color: var(--ext-ink2);
  margin-left: auto;
}
.dt-tab { padding: 4px 10px; border-radius: 3px; cursor: pointer; }
.dt-active {
  color: var(--ext-a);
  border-bottom: 2px solid var(--ext-a);
}

/* ─── Extension panel ───────────────────────────────── */
.ext-panel {
  display: flex;
  flex-direction: column;
  height: 420px;
  background: var(--ext-bg);
  font-family: var(--sans);
  font-size: 12px;
  color: var(--ext-ink);
}

/* Toolbar */
.ext-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 44px;
  background: var(--ext-bar);
  border-bottom: 1px solid var(--ext-line);
  flex-shrink: 0;
}

.filter-tabs {
  display: flex;
  background: var(--ext-well);
  border: 1px solid var(--ext-line);
  border-radius: 5px;
  padding: 2px;
  gap: 1px;
  flex-shrink: 0;
}
.filter-tab {
  padding: 0 9px;
  height: 22px;
  border-radius: 3px;
  border: none;
  background: transparent;
  color: var(--ext-ink2);
  font-size: 11px;
  font-weight: 500;
  font-family: var(--sans);
  cursor: default;
  line-height: 22px;
  white-space: nowrap;
}
.ft-active {
  background: var(--ext-card);
  color: var(--ext-ink);
  box-shadow: 0 1px 2px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04);
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.ext-search {
  height: 26px;
  width: 180px;
  background: var(--ext-well);
  border: 1px solid var(--ext-line);
  border-radius: 5px;
  padding: 0 10px 0 26px;
  font-family: var(--sans);
  font-size: 11px;
  color: var(--ext-ink3);
  outline: none;
  cursor: default;
}
.ext-search::placeholder { color: var(--ext-ink3); }

.ext-icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--ext-ink2);
  border-radius: 4px;
  cursor: default;
  flex-shrink: 0;
}

/* Body split */
.ext-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Event list */
.ext-list {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid var(--ext-line);
  overflow-y: auto;
  padding: 4px 0;
}

.time-sep {
  padding: 5px 12px 3px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ext-ink3);
  font-family: var(--sans);
}

/* Event cards */
.ev-card {
  margin: 2px 6px;
  border: 1px solid var(--ext-line);
  border-radius: 6px;
  background: var(--ext-card);
  overflow: hidden;
  cursor: default;
}
.ev-selected {
  border-color: rgba(255,107,61,0.30);
  background: rgba(255,107,61,0.05);
}
.ev-blocked {
  border-color: rgba(239,68,68,0.25);
  background: rgba(239,68,68,0.04);
}

.ev-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
}
.ev-name {
  flex: 1;
  font-weight: 500;
  font-size: 12px;
  color: var(--ext-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ev-time {
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--ext-ink3);
  flex-shrink: 0;
}

/* Sub-event rows */
.ev-subs { border-top: 1px solid var(--ext-line); }
.ev-sub {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px 5px 13px;
  border-bottom: 1px solid rgba(35,35,33,0.5);
}
.ev-sub:last-child { border-bottom: none; }
.ev-sub-selected { background: rgba(255,107,61,0.08); }

.sub-name {
  flex: 1;
  font-size: 11px;
  color: var(--ext-ink2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-val {
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--ext-ink3);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Badges ────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 5px;
  border-radius: 3px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  white-space: nowrap;
}

.b-init   { background: var(--b-init);   color: var(--b-init-fg);   }
.b-gate   { background: var(--b-gate);   color: var(--b-gate-fg);   }
.b-exp    { background: var(--b-exp);    color: var(--b-exp-fg);    }
.b-config { background: var(--b-config); color: var(--b-config-fg); }
.b-layer  { background: var(--b-layer);  color: var(--b-layer-fg);  }
.b-event  { background: var(--b-event);  color: var(--b-event-fg);  }
.b-sdk    { background: var(--b-sdk);    color: var(--b-sdk-fg);    }
.b-blocked {
  background: rgba(239,68,68,0.15);
  color: #F87171;
  border: 1px solid rgba(239,68,68,0.25);
}

/* ─── Detail panel ──────────────────────────────────── */
.ext-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ext-bg);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ext-line);
  flex-shrink: 0;
}
.detail-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--ext-ink);
}

.detail-kv {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.kv-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(35,35,33,0.6);
}
.kv-row:last-child { border-bottom: none; }

.kv-k {
  width: 72px;
  flex-shrink: 0;
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--ext-ink3);
}
.kv-v {
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--ext-ink2);
}
.kv-true { color: #34D399; }
```

---

## Section 3 — Event Classification

### Copy

```
[label]  Classification

[H2]     Every call, tagged.

[body]   Gates, experiments, configs, layers, and custom events —
         each one intercepted and classified the moment it fires.
         Seven distinct types. No overlap. No ambiguity.
```

**Layout:** Copy left, badge showcase right.

### HTML

```html
<section>
  <div class="section reveal">
    <div class="feature-grid">

      <!-- Copy -->
      <div class="feature-copy">
        <span class="label">Classification</span>
        <h2>Every call, tagged.</h2>
        <p class="body-text">
          Gates, experiments, configs, layers, and custom events —
          each one intercepted and classified the moment it fires.
          Seven distinct types. No overlap. No ambiguity.
        </p>
      </div>

      <!-- Visual: badge strip on dark card -->
      <div class="badge-showcase-wrap">
        <div class="badge-showcase">
          <div class="badge-row">
            <span class="badge b-init">INIT</span>
            <span class="bshow-name">initialize</span>
            <span class="bshow-meta">SDK bootstrap · gate + exp assignments</span>
          </div>
          <div class="badge-row">
            <span class="badge b-gate">GATE</span>
            <span class="bshow-name">show_new_onboarding</span>
            <span class="bshow-val bv-true">true</span>
          </div>
          <div class="badge-row">
            <span class="badge b-exp">EXP</span>
            <span class="bshow-name">pricing_page_v3</span>
            <span class="bshow-val">control</span>
          </div>
          <div class="badge-row">
            <span class="badge b-config">CONFIG</span>
            <span class="bshow-name">feature_config</span>
            <span class="bshow-val">{ "max_items": 10 }</span>
          </div>
          <div class="badge-row">
            <span class="badge b-layer">LAYER</span>
            <span class="bshow-name">checkout_layer</span>
            <span class="bshow-val">variant_b</span>
          </div>
          <div class="badge-row">
            <span class="badge b-event">EVENT</span>
            <span class="bshow-name">button_clicked</span>
            <span class="bshow-val">{ "target": "CTA" }</span>
          </div>
          <div class="badge-row" style="border-bottom:none;">
            <span class="badge b-sdk">SDK</span>
            <span class="bshow-name">sdk_internal</span>
            <span class="bshow-meta">flush · retry · diagnostic</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
```

### CSS

```css
.badge-showcase-wrap {
  background: var(--ext-bg);
  border: 1px solid var(--ext-line-hi);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--sh-up);
}

.badge-showcase {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ext-line);
  font-family: var(--mono);
  font-size: 11px;
}

.bshow-name {
  color: var(--ext-ink);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bshow-val {
  color: var(--ext-ink3);
  font-size: 10.5px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bshow-meta {
  color: var(--ext-ink3);
  font-family: var(--sans);
  font-size: 10.5px;
  font-style: italic;
}
.bv-true { color: #34D399; }
```

---

## Section 4 — Time Bucketing

### Copy

```
[label]  Timeline

[H2]     When it fired matters.

[body]   Events group by session time — Today, Yesterday, exact date.
         Millisecond timestamps on every call. Navigate any session
         without losing your place.
```

**Layout:** Slim event-list mockup left, copy right. (Mockup comes first on mobile.)

### HTML

```html
<section style="background: var(--card);">
  <div class="section reveal">
    <div class="feature-grid">

      <!-- Visual: tall slim event list -->
      <div class="viz-first tl-wrap">
        <div class="tl-list">
          <div class="time-sep" style="color:var(--ext-ink3);font-family:var(--sans);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:6px 12px 4px;">Today</div>

          <div class="ev-card" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-event">EVENT</span>
              <span class="ev-name">checkout_started</span>
              <span class="ev-time">14:33:09.812</span>
            </div>
          </div>

          <div class="ev-card" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-gate">GATE</span>
              <span class="ev-name">show_discount_banner</span>
              <span class="ev-time">14:32:44.001</span>
            </div>
          </div>

          <div class="ev-card ev-selected" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-exp">EXP</span>
              <span class="ev-name">checkout_flow_v2</span>
              <span class="ev-time">14:32:41.599</span>
            </div>
          </div>

          <div class="ev-card" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-event">EVENT</span>
              <span class="ev-name">item_added_to_cart</span>
              <span class="ev-time">14:31:18.304</span>
            </div>
          </div>

          <div class="time-sep" style="color:var(--ext-ink3);font-family:var(--sans);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:6px 12px 4px;">Yesterday</div>

          <div class="ev-card" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-init">INIT</span>
              <span class="ev-name">initialize</span>
              <span class="ev-time">09:14:22.555</span>
            </div>
          </div>

          <div class="ev-card" style="margin:2px 6px;">
            <div class="ev-header">
              <span class="badge b-event">EVENT</span>
              <span class="ev-name">session_start</span>
              <span class="ev-time">09:14:20.113</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Copy -->
      <div class="feature-copy">
        <span class="label">Timeline</span>
        <h2>When it fired matters.</h2>
        <p class="body-text">
          Events group by session time &mdash; Today, Yesterday, exact date.
          Millisecond timestamps on every call. Navigate any session
          without losing your place.
        </p>
      </div>

    </div>
  </div>
</section>
```

### CSS

```css
.tl-wrap {
  display: flex;
  justify-content: center;
}

.tl-list {
  width: 280px;
  background: var(--ext-bg);
  border: 1px solid var(--ext-line-hi);
  border-radius: 10px;
  overflow: hidden;
  padding: 4px 0;
  box-shadow: var(--sh-up);
}
```

---

## Section 5 — Blocked Detection + Dedup

### Copy

```
[label]  Reliability

[H2]     Blocked calls surface.
         Duplicates don't.

[body]   When a log_event POST fails — network error, CSP block,
         anything — SigInspector flags it immediately. When the SDK
         retries that same batch, it won't appear twice.
```

**Layout:** Copy left, blocked card mockup right.

### HTML

```html
<section>
  <div class="section reveal">
    <div class="feature-grid">

      <!-- Copy -->
      <div class="feature-copy">
        <span class="label">Reliability</span>
        <h2>Blocked calls surface.<br>Duplicates don't.</h2>
        <p class="body-text">
          When a log_event POST fails &mdash; network error, CSP block,
          anything &mdash; SigInspector flags it immediately. When the SDK
          retries that same batch, it won&rsquo;t appear twice.
        </p>
      </div>

      <!-- Visual: blocked card + tooltip -->
      <div class="blocked-wrap">

        <!-- Blocked event card -->
        <div class="ev-card ev-blocked" style="margin:0;">
          <div class="ev-header">
            <span class="badge b-event">EVENT</span>
            <span class="ev-name">purchase_complete</span>
            <div style="margin-left:auto; display:flex; align-items:center; gap:8px; flex-shrink:0;">
              <span class="badge b-blocked">BLOCKED</span>
              <span class="ev-time">14:41:02.199</span>
            </div>
          </div>
        </div>

        <!-- Tooltip -->
        <div class="blocked-tooltip">
          <div class="tooltip-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p>SigInspector detected that this batch failed to reach Statsig's servers. The payload was captured locally.</p>
        </div>

        <!-- Dedup indicator -->
        <div class="dedup-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;color:var(--ext-ink3);">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>2 identical retry payloads suppressed</span>
        </div>

      </div>

    </div>
  </div>
</section>
```

### CSS

```css
.blocked-wrap {
  background: var(--ext-bg);
  border: 1px solid var(--ext-line-hi);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--sh-up);
}

.blocked-tooltip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--ext-well);
  border: 1px solid var(--ext-line-hi);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: var(--sans);
  font-size: 11px;
  line-height: 1.55;
  color: var(--ext-ink2);
}
.tooltip-icon { flex-shrink: 0; margin-top: 1px; }

.dedup-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ext-ink3);
}
```

---

## Section 6 — Keyboard Navigation

**Layout:** Full-width, centered. Minimal. The simplicity is the message.

### Copy

```
[label]  Workflow

[H2]     Hands on the keyboard.

[body]   Arrow keys move through events. Escape closes the detail panel.
         No mouse required.
```

### HTML

```html
<section style="background: var(--card);">
  <div class="section reveal" style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:40px;">

    <div style="display:flex; flex-direction:column; align-items:center; gap:16px; max-width:480px;">
      <span class="label">Workflow</span>
      <h2>Hands on the keyboard.</h2>
      <p class="body-text" style="text-align:center; max-width:380px;">
        Arrow keys move through events. Escape closes the detail panel.
        No mouse required.
      </p>
    </div>

    <!-- Keyboard visual -->
    <div class="kbd-demo">
      <div class="kbd-group">
        <div class="kbd-cluster">
          <div style="display:flex; justify-content:center; margin-bottom:4px;">
            <div class="kbd-key">↑</div>
          </div>
          <div style="display:flex; gap:4px;">
            <div class="kbd-key" style="opacity:0.3;">←</div>
            <div class="kbd-key">↓</div>
            <div class="kbd-key" style="opacity:0.3;">→</div>
          </div>
        </div>
        <span class="kbd-desc">Navigate events</span>
      </div>
      <div class="kbd-divider"></div>
      <div class="kbd-group">
        <div class="kbd-key kbd-wide">Esc</div>
        <span class="kbd-desc">Close detail panel</span>
      </div>
    </div>

  </div>
</section>
```

### CSS

```css
.kbd-demo {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 32px 40px;
  background: var(--well);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.kbd-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.kbd-cluster {}

.kbd-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  background: var(--card);
  border: 1px solid var(--line-hi);
  border-bottom-width: 3px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--ink2);
  box-shadow: 0 1px 0 var(--line-hi);
  user-select: none;
}

.kbd-wide { min-width: 64px; font-size: 12px; }

.kbd-desc {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--ink3);
  letter-spacing: 0.01em;
}

.kbd-divider {
  width: 1px;
  height: 60px;
  background: var(--line);
}
```

---

## Section 7 — Footer

### Copy

```
[Logo]    SigInspector

[Tagline] Built for the engineers who ship Statsig.

[CTA]     Add to Chrome →

[links]   GitHub   ·   Privacy   ·   hello@applied.llc

[fine]    Free. No account required. No data leaves your browser.
```

### HTML

```html
<footer>
  <div class="footer-inner">

    <div class="footer-brand">
      <img src="icons/logo.svg" alt="SigInspector" height="20">
      <span class="footer-tagline">Built for the engineers who ship Statsig.</span>
    </div>

    <a class="btn-primary" href="[CHROME_STORE_URL]" target="_blank" rel="noopener noreferrer">
      Add to Chrome
    </a>

    <div class="footer-links">
      <a href="[GITHUB_URL]" target="_blank" rel="noopener noreferrer">GitHub</a>
      <span class="footer-dot">·</span>
      <a href="PRIVACY.md">Privacy</a>
      <span class="footer-dot">·</span>
      <a href="mailto:hello@applied.llc">hello@applied.llc</a>
    </div>

    <p class="footer-fine">Free. No account required. No data leaves your browser.</p>

  </div>
</footer>
```

### CSS

```css
footer {
  border-top: 1px solid var(--line);
  padding: 64px 40px;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-tagline {
  font-size: 14px;
  color: var(--ink2);
  letter-spacing: -0.01em;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.footer-links a {
  color: var(--ink3);
  text-decoration: none;
  text-underline-offset: 3px;
  transition: color 0.15s;
}
.footer-links a:hover { color: var(--ink); text-decoration: underline; }
.footer-dot { color: var(--line-hi); }

.footer-fine {
  font-size: 12px;
  color: var(--ink3);
}
```

---

## Scroll Reveal JS

```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

---

## Animations Summary

| Element            | Animation              | Duration | Easing                      |
|--------------------|------------------------|----------|-----------------------------|
| Hero panel         | fade-up + scale(0.985) | 750ms    | cubic-bezier(0.22, 1, 0.36, 1) |
| Section reveals    | fade-up (18px)         | 550ms    | cubic-bezier(0.22, 1, 0.36, 1) |
| Navbar blur        | CSS transition on scroll | 250ms  | ease                        |
| Button hover       | opacity 0.86           | 150ms    | ease                        |
| Ghost button hover | border-color + color   | 150ms    | ease                        |

---

## Implementation Notes

1. **Zero dependencies.** Pure HTML + CSS + ~30 lines of vanilla JS. No framework, no bundler, no build step.

2. **Fonts.** Load exactly the same Google Fonts call as the extension: `Instrument Sans` (400, 500, 600) + `JetBrains Mono` (400, 500). Add `display=swap`.

3. **No screenshots.** All extension UI is rendered in HTML/CSS. This keeps the page lightweight, always in sync with design changes, and readable in any viewport.

4. **Chrome Store URL.** Replace every `[CHROME_STORE_URL]` once the extension is published. Until then, omit the CTA or point to GitHub.

5. **Privacy.** The page should have no analytics by default — consistent with the extension's "no data leaves your browser" stance. If analytics are added later, disclose them in `PRIVACY.md`.

6. **OG / meta.** Set `og:title` to "SigInspector — Statsig DevTools Extension", `og:description` to the subheadline copy, and `og:image` to a static screenshot of the hero panel (generated once from the HTML mockup).

7. **File.** The page is a single `index.html` in the repo root. The extension's `icons/logo.svg` is referenced directly — no asset duplication needed.
