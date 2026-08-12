# Bono audit

Instrumented comparison between **bono.eco** and the redesign. Its own Vercel
project, separate from the site, with `X-Robots-Tag: noindex` set by header.

The page renders only what the collector measured. If the collector hasn't run,
every data section stays hidden and the page shows how to run it — so it can
never display a finding that wasn't measured.

## Collect the evidence

```bash
cd bono-audit
npm run setup                    # playwright + chromium

# serve the redesign from the repo root, in another terminal
cd .. && python3 -m http.server 8000

npm run collect                  # or: node collect.mjs
```

Point it at a deployed preview instead of localhost:

```bash
node collect.mjs --new https://bono.vercel.app
```

Already have a Chromium on the machine:

```bash
CHROMIUM_PATH=/path/to/chrome node collect.mjs
```

This writes `evidence/evidence.json` plus desktop and mobile screenshots of
each target. Open `index.html` over HTTP (`npm run serve`) — the `fetch` for
the evidence file won't work from `file://`.

## What it measures

Each target is loaded twice, at 1440×900 and 390×844:

| Group | Measured |
|---|---|
| Web vitals | LCP, CLS, TTFB |
| Network | Bytes, requests, third-party origins, webfonts, image weight, failed requests |
| Mobile | Horizontal scroll, and any text element painting outside the viewport with no scroll container above it — content the visitor cannot read |
| Accessibility | WCAG AA contrast per text node against its effective background, images without `alt`, links and buttons with no accessible name, heading-level skips |
| SEO | Title, meta description length, canonical, hreflang count, H1 count, `lang` |
| Errors | Uncaught JavaScript on load |

Findings are emitted **only** when a measured value crosses a threshold, and
each one carries the number that triggered it. Nothing is authored by hand.

Contrast is computed against the nearest opaque ancestor background, which is a
close approximation rather than a full WCAG audit — it won't resolve text over
images or gradients.

## Deploy

```bash
cd bono-audit
vercel --prod
```

Keep it a **separate project** from the site so the `noindex` header in
`vercel.json` applies only here.

## Why the current-site columns may be empty

`bono.eco` was unreachable from the environment this was built in, so the
`current-es` / `current-en` targets record a load error rather than
measurements. Run the collector from a machine with network access and those
columns fill in.
