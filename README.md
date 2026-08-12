# Bono — website redesign

A complete rebuild of bono.eco positioned as an enterprise decarbonization
technology platform: **carbon data → decisions → projects → financing →
reduction**, extended across the supply chain.

Read [`VERIFICATION.md`](VERIFICATION.md) before publishing. It lists what is
sourced, what is demonstration data, and what was deliberately left blank rather
than invented.

---

## Running it

Static files, no build step, no dependencies.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Structure

```
index.html                              EN homepage (full flow)
es/index.html                           ES homepage
demo.html   es/demo.html                3-step demo request + confirmation
resources.html  es/recursos.html        Knowledge hub, glossary, company
case-studies/grupo-modelo.html          Case study
es/casos-de-exito/grupo-modelo.html
signin.html  es/acceso.html             Sign-in (not wired to auth)
404.html · robots.txt · sitemap.xml
assets/css/bono.css                     Design system (single file)
assets/js/bono.js                       All behaviour (single file)
assets/img/favicon.svg
```

## Homepage flow

Nav → Hero → Trusted by → The Problem → Decarbonization Engine (Measure ·
Analyze · Plan · Reduce · Finance · Track) → Platform → Scopes → Roadmap →
Marketplace → Financing → Supply Chain → Impact → Customers → Simulator →
Why Bono → Resources → Final CTA → Footer.

## Design system

Tokens live at the top of `assets/css/bono.css`.

| Token | Value | Use |
|---|---|---|
| `--carbon` | `#08100D` | Deep carbon — dark sections, footer |
| `--green` | `#12A97C` | Bono green — data marks, fills |
| `--green-deep` | `#0A7A5A` | Text-safe green on light (5.4:1) |
| `--lime` | `#C8F751` | Electric lime — interaction and data highlights on dark only |
| `--warm-white` | `#FBFBF8` | Primary light background |
| `--soft-gray` | `#F1F1EC` | Secondary surfaces |

Typography is a system grotesk stack with a monospace face reserved for CO₂,
metrics and technical labels. **No webfonts are loaded** — zero font requests,
no layout shift, and the build stays self-contained.

Adding `.on-carbon` to any section inverts the whole token set, so components
work on both grounds without variants.

## Interactivity

All in `assets/js/bono.js`, each module a no-op if its markup is absent:
sticky nav + mega-menu, mobile drawer, scroll reveal, counters, engine stepper
(autoplays only while on screen, stops on interaction), scope disclosures,
roadmap chart with table cross-highlighting, marketplace filters, financing flow
lighting, supply-chain network graph, roadmap simulator, demo wizard, mobile
sticky CTA.

Charts are drawn as inline SVG from JSON embedded in each page
(`#roadmap-data`, `#network-data`, `#sim-data`), which keeps the copy localized
without duplicating chart code.

## Accessibility

Semantic landmarks and heading order; skip link; visible focus states; the
mega-menu and engine stepper are keyboard-operable with arrow keys and Escape;
form errors are announced per field; the roadmap chart is `aria-hidden` with the
projects table as its accessible equivalent; `prefers-reduced-motion` disables
animation, autoplay and smooth scrolling throughout.

Contrast: body text 8.9:1, muted text 6.2:1, `--green-deep` links 5.4:1,
`--on-dark-muted` 5.9:1 on carbon.

## Performance

No frameworks, no webfonts, no external requests of any kind. One CSS file, one
deferred JS file (~14 KB). Animations are limited to `transform` and `opacity`.
Charts are inline SVG, so they cost no extra requests and scale losslessly.

## Wiring before launch

1. **Demo form** — `demo.html` / `es/demo.html` submit is intercepted in
   `initWizard()`; nothing is transmitted. Replace the `form.addEventListener('submit', …)`
   handler with a POST to Bono's CRM, keeping the confirmation screen.
2. **Sign-in** — `signin.html` / `es/acceso.html` are static. Point at Bono's
   identity provider.
3. **Product screenshots** — swap the hand-built dashboards inside `.surface`
   containers for real UI captures.
4. **Metrics** — populate the impact section per `VERIFICATION.md` §3.1.
5. **URLs** — confirm the final path structure and update `sitemap.xml`,
   `canonical` and `hreflang` tags.
