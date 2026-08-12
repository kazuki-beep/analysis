# Content verification log

This build follows one rule strictly: **nothing about Bono was invented.**

The environment this site was built in blocks outbound network access to
`bono.eco` (and to every other external host), so the live site could not be
crawled. Facts below were gathered through web search results that quote Bono's
own pages and blog. Everything that could not be sourced that way was left
**visibly blank** rather than estimated — those gaps are listed in section 3 and
each one is marked in the UI with a dashed border or a "Pending verification"
label so it cannot ship unnoticed.

---

## 1. Verified — sourced from Bono's own pages

These statements appear on the site and are traceable to Bono content.

| Claim used on the site | Source |
|---|---|
| Bono is a decarbonization platform for industry: companies measure their carbon footprint, define targets and a decarbonization roadmap, and quote/contract solutions and financing | bono.eco homepage description |
| Three products: Decarbonization Platform, Supply Chain Management, Marketplace | bono.eco/solutions/* |
| Platform: carbon accounting, features for all industries, understand operations, benchmark emissions progress | bono.eco/solutions/decarbonization-platform |
| Supply Chain: Scope 3 emissions and actionable insights; supplier engagement and data gathering; prioritize collaboration with critical suppliers | bono.eco/solutions/supply-chain-management |
| Supply Chain sends structured forms to suppliers, consolidates responses, generates data in the technical format SBTi accepts | Bono SBTi blog article |
| "In manufacturing industries, Scope 3 represents on average more than 70% of the total carbon footprint" | Bono SBTi blog article |
| Marketplace connects organizations with decarbonization solution providers | bono.eco/solutions/market-place |
| Marketplace solution categories: energy efficiency, renewable energy PPAs, on-site generation, software for logistics and agriculture, sustainable transportation, nature-based solutions, sustainable construction materials | bono.eco/solutions/market-place |
| Customers named: Ecopetrol, Enel, ISA, Celsia, Bancolombia, Grupo SURA, Cementos Argos | bono.eco/our-customers |
| Grupo Modelo: partnership since 2022; Net Zero goal in 2040 | Bono blog — Grupo Modelo case |
| Grupo Modelo: suppliers in paper, cardboard, plastic, sugar, rice and corn, in seven Latin American countries | Bono blog — Grupo Modelo case |
| Grupo Modelo: emissions baselines established for 2022 and 2023; critical supply-chain emissions made visible | Bono blog — Grupo Modelo case |
| Grupo Modelo: solutions explored include on-site renewable energy (solar panel installation) and purchase of renewable energy | Bono blog — Grupo Modelo case |
| Bono works with Bancolombia on sustainable finance | Bono blog — Bancolombia article |
| Bono maintains a blog and a sustainability glossary | bono.eco/resources/* |

**Action before launch:** re-read each source page directly and confirm the
wording still matches. Search snippets are a weaker source than the live page.

---

## 2. Supplied by the brief, not independently confirmed

The master brief listed these as authorized client logos. Three of them
(Grupo Modelo, Bancolombia, ISA) were independently confirmed; two were not.

| Logo | Status | Where it appears |
|---|---|---|
| Grupo Modelo | Confirmed | Trust bar, customer story, case study |
| Bancolombia | Confirmed | Trust bar, customer story |
| ISA | Confirmed | Trust bar, customer story |
| **AB InBev** | **Not confirmed — not rendered.** Grupo Modelo is an AB InBev company, but AB InBev was not found named as a Bono customer. Confirm the logo rights separately before adding. | — |
| **Grupo Arcor** | **Not confirmed — not rendered.** Not found on Bono's customers page. Confirm before adding. | — |

To add either one, append a `<li class="trust__logo">` to the trust bar in
`index.html` and `es/index.html`.

---

## 3. Deliberately blank — fill these in before launch

Every item below renders as `—`, a dashed card, or a "Pending verification"
label. Nothing is guessed.

### 3.1 Impact metrics (homepage `#impact` / `#impacto`)

Six metric tiles are built and animate on scroll, but carry no values. The brief
explicitly warned that Bono's public pages show different figures in different
places and languages, so none was adopted.

| Metric | File / location |
|---|---|
| Companies measuring with Bono | `index.html` §IMPACT NUMBERS, `es/index.html` §IMPACTO |
| Emissions measured on the platform (tCO₂e) | same |
| Supply-chain providers reporting | same |
| Decarbonization projects in roadmaps | same |
| Countries with active operations | same |
| Years operating | same |

**To populate:** replace `—` in `.metric__value` with
`<span class="num" data-count-to="12345">0</span>`, drop the `metric--pending`
class from the parent, and replace the `.metric__source` text with the source
and as-of date. The counter animation then runs automatically.

### 3.2 Grupo Modelo case study

Present and sourced: challenge, starting point, solution, roadmap approach,
timeline, supplier sectors, countries, target year.

Absent by design (dashed card on the page): tonnes measured, reductions
achieved, number of suppliers onboarded, financial impact, and a customer quote.
Add only with Grupo Modelo's and Bono's written approval.

### 3.3 Company facts (`resources.html#company`, `es/recursos.html#empresa`)

Blank: founding year, team size, offices, funding, certifications, partnerships,
awards.

### 3.4 Other customer stories

Bancolombia and the industrial/energy card carry qualitative framing only, and
say explicitly that full cases are pending approval. Do not add outcomes without
sign-off.

---

## 4. Clearly labelled demonstration data

These are product illustrations, not claims. Each carries a visible disclosure
(`.demo-note`) in both languages.

| Where | What is synthetic |
|---|---|
| Hero dashboard | Total emissions, scope split, target, ROI, $/tCO₂e, project counts |
| Engine panels (01–06) | Inventory, driver breakdown, targets, project economics, tracking |
| Scopes section | 22 / 14 / 64% split — stated as a typical industrial profile |
| Roadmap chart + projects table | All six projects, CAPEX, ROI, payback, status |
| Marketplace cards | All offers and their economics; providers are unnamed |
| Supply chain network | Six suppliers, emissions, maturity, progress |
| Simulator | Industry lever weights and the trajectory curve |

Real UI screenshots were requested in the brief but none could be obtained
(no network access, and none supplied). The dashboards here are hand-built
recreations of the product's information architecture. **Swap them for real
product screenshots before launch** — the sections are laid out so a screenshot
drops into the same `.surface` container.

---

## 5. Claims deliberately softened

| Topic | How it is worded, and why |
|---|---|
| Financing | "Bono can help connect the roadmap with financing opportunities." A visible note states that approval, terms and rates are set by the financial institution, not Bono. No rate, amount or approval is promised. |
| Marketplace providers | Named as "Provider · verified on Marketplace" — no company names invented. |
| Simulator | Labelled illustrative, generated from generic industry profiles, explicitly not an audited calculation or a commitment of results. |
| Regulatory coverage | No country is claimed as covered by a compliance capability. CBAM/CDP/regulation clusters are marked as planned content. |
| SBTi | Described as target format alignment, not as validation or certification by SBTi. |

---

## 6. Placeholders that need a real destination

| Element | Current | Needs |
|---|---|---|
| Demo form | No endpoint; client-side only, shows a confirmation screen | Wire to Bono's CRM/marketing endpoint |
| Sign-in page | Static form, no auth | Point at Bono's real platform authentication |
| Canonical/hreflang URLs | Assume `bono.eco/`, `/es/`, `/demo`, `/resources`, `/case-studies/…` | Confirm final URL structure and update `sitemap.xml` to match |
| Trust bar logos | Set as monochrome wordmarks | Replace with real SVG logos where usage rights allow; hover state already inverts to full colour |
