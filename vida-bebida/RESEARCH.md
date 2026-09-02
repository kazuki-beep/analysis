# Vida Bebida — Business & Commerce Understanding (partial)

**Status: BLOCKED on primary-source access. Do not build from this document alone.**

## 0. The blocker

Every attempt to reach `vidabebida.com` from this environment is refused by the
network egress proxy:

```
curl https://vidabebida.com/products.json  -> CONNECT tunnel failed, 403
                                              connect_rejected (organization policy)
WebFetch https://vidabebida.com/...        -> EGRESS_BLOCKED
```

This is not specific to the store. The environment is default-deny for all
outbound HTTP — `example.com`, `cdn.shopify.com` and `wikipedia.org` are refused
identically. The only tool with network reach is server-side web *search*, which
returns third-party summaries of indexed pages, not the pages themselves.

Consequences, stated plainly against the brief:

| Brief requirement | Reachable? |
|---|---|
| §01/§02 Verify the exact live 10% CHESCA announcement wording before deploy | No — only a paraphrase via search |
| §04 Real prices, variants, pack sizes, stock, discounts | No |
| §05 Real hex colors, logo files, typography, button styles | No |
| §06 Real bottle/can/packaging photography and campaign assets | No — CDN unreachable |
| §26 Full current store-locator list | Partial — a handful of addresses surfaced via search |
| §27 Real review quotes | No |
| §34/§38/§39 Shopify theme, SEO state, app stack, architecture inspection | No |

Fabricating any of the above would directly violate §04, §05, §06, §27 and §37,
so nothing in the redesign has been built yet.

## 1. What IS verified (via indexed search results, cite before use)

Treat everything here as **corroboration-grade, not deploy-grade**. Each line
must be re-checked against the live store before it reaches a page.

### Company
- 100% Mexican company producing natural kombucha with local inputs and
  artisanal technique. Based in Mexico City.
- Contact surfaced: `ventas@vidabebida.com`;
  C. Guillermo Prieto #67 Local 3, Col. San Rafael, Cuauhtémoc, 06470 CDMX.

### Product families (matches the brief's list)
- **Kombucha** — fermented green + black tea, SCOBY, organic sugar for
  fermentation, fruit, roots. Described as 100% natural, probiotic, lightly
  carbonated. Flavors reported: original, jengibre cítrico, moras silvestres,
  jamaica, mate energy. (One source says "seven flavors", another lists five —
  **unresolved conflict, must verify.**)
- **Capibara** — yerba mate (Ilex paraguariensis), flavors reported: jamaica,
  mandarina, jengibre-menta.
- **CHESCA** — sparkling agua fresca, 355 ml can. Flavors reported: jamaica,
  limón, mango.
- **Kéfir** — fermentation of bacteria and yeasts in milk and plant-based bases.
- **Super Shots** — 60 ml. Reported SKUs: Shot Immune, Shot Boost, Shot Focus.
  Immune ingredients reported as: vinagre de kombucha, jugo de limón, jugo de
  jengibre, jugo de cúrcuma, sorbato de sodio. Sold in boxes of 12.
- **Vinagre de kombucha** — own collection.
- **Merch** — collection `/collections/accesorios`.

### Formats
- Kombucha in 355 ml, 500 ml, and 3 L bidones.
- Boxes of 12 and 24 × 355 ml exist as their own products
  (`/products/caja-de-12-kombuchas-355ml`, `/products/caja-de-24-kombuchas-355ml`).

### Commerce rules (all need live re-verification)
- **Free shipping in CDMX / metropolitan area over $300 MXN.** This is the
  threshold the §28 cart progress bar would key off — it must be read
  dynamically, not hardcoded.
- **Subscriptions** exist under `/collections/suscripciones` ("Arma tu Pack").
  A **15% monthly subscription discount** was reported. Customers choose
  periods and flavors and can change flavors.
- **10% off first CHESCA order for subscribing/signing up** — the announcement
  in §01. Confirmed present sitewide, exact wording not verified.
- Notable: an "Arma tu Pack" collection already exists, which overlaps with the
  §22 "Arma tu Caja" innovation. The new build should extend that real
  mechanism rather than invent a parallel one.

### Segunda Vida
- Bottle recovery for reuse is tied to the subscription recurrence: recurring
  delivery is what lets them recover bottles and give them a second life.
  Labelling is reported to be designed specifically for reuse. Exact program
  rules (deposit? credit? where to return?) **not verified**.

### Known live URLs (structure, useful for §34 SEO equity preservation)
```
/  /collections  /collections/all  /collections/kombucha-1
/collections/capibara  /collections/kefir  /collections/super-shots
/collections/vinagre-de-kombucha  /collections/accesorios
/collections/suscripciones  /pages/kombucha  /pages/nosotros
/pages/distribuidor-de-vida-bebida  /pages/aviso-de-privacidad
/products/kombucha-original-355ml  /products/kombucha-jengibre-citrico-355ml
/products/caja-de-12-kombuchas-355ml  /products/caja-de-24-kombuchas-355ml
/products/caja-de-12-piezas-de-shot-immune
```

### Points of sale surfaced (incomplete — §26 needs the real list)
- Av. Observatorio 444, 16 de Septiembre, Miguel Hidalgo, 11810 CDMX
- Culinaria Vegetal — Mérida 140, Roma Nte., Cuauhtémoc, 06700 CDMX
- Adamanta Santa Fe — C. 3 55 B, Zedec Sta Fé, Álvaro Obregón, 01219 CDMX
- Adamanta Escandón — Av. José Martí 195, Escandón I Secc, Miguel Hidalgo, 11800 CDMX
- Palmas Hills — Blvrd. Interlomas Mz 1-Lote 1, Interlomas, 52763 Edo. Méx.
- Lomas de Santa Fe — Vasco de Quiroga 3800, Contadero, Cuajimalpa, 05109 CDMX

### Third-party retail presence (confirms products are real, not a source of truth for price)
Amazon MX, The Green Deli, Tiendas Verum, Green Republic, Súper Naturista,
Orgánico y Sano, Nutrinat, Tots Global, Puro Amor Vegano.

## 2. What is missing before any code is written

1. **Brand system** — logo files, exact hex values, typefaces, button geometry,
   promo colors, illustration style. §05 forbids inventing a palette, and a
   palette cannot be sampled from a page that cannot be loaded.
2. **Product imagery** — every real bottle, can, bidón, lifestyle and campaign
   asset (§06). The Shopify CDN is unreachable.
3. **Catalog data** — titles, handles, variants, prices, pack sizes, inventory,
   metafields, ingredient lists (§04, §17, §19, §20, §21).
4. **The live announcement string** — §01 requires the current promotion be used
   verbatim as source of truth.
5. **Shopify implementation** — current theme, app stack, subscription app,
   checkout config, analytics. §39 requires inspecting this *before* choosing
   theme-improvement vs. headless.
6. **Real testimonials** (§27) and **real Segunda Vida program rules** (§24).
7. **Baseline screenshots** — §46 requires real before/after captures and
   explicitly forbids fabricating them.

## 3. Unblock options (any one is sufficient to start)

- **A — Allowlist egress.** Add `vidabebida.com` and `cdn.shopify.com` to the
  environment's network policy. Best option: gives catalog JSON, live HTML,
  imagery, and the announcement string in one pass.
- **B — Shopify Storefront API token** (read-only, public scope). Gives
  authoritative catalog, variants, pricing, selling plans. Still needs the CDN
  allowlisted for imagery.
- **C — Theme export + product export.** A `.zip` of the live theme plus
  `products.json` / a CSV export, uploaded to the repo. Fully offline, and also
  answers §39 (architecture) and §34 (existing SEO).
- **D — Explicitly scope down.** Build the interaction architecture — discovery
  quiz, Arma tu Caja, cart drawer, announcement strip, Segunda Vida loop — as a
  data-driven shell with a single `catalog.json` / `tokens.css` seam, shipped
  with the data slots empty and clearly labelled as unfilled. Honest, but it
  cannot pass the §47 quality gate and should not be presented to the client as
  "Vida Bebida 2.0".

## 4. Sources

- https://vidabebida.com/ (indexed summary only)
- https://vidabebida.com/collections , /collections/all , /collections/capibara
- https://vidabebida.com/collections/kefir , /collections/super-shots
- https://vidabebida.com/collections/suscripciones , /pages/kombucha
- https://vidabebida.com/pages/distribuidor-de-vida-bebida , /pages/nosotros
- https://www.animalgourmet.com/2020/07/29/vida-bebida-kombucha
- https://thefoodtech.com/soluciones-y-tecnologia-alimentaria/kombucha-llega-hasta-la-puerta-de-tu-casa-con-vida-bebida/
- https://supernaturista.com/products/shot-immune-60-ml-vida-bebida
- https://www.amazon.com.mx/VIDA-BEBIDA-Kombucha-ingredientes-org%C3%A1nicos/dp/B0B52GNVT9
- https://greenrepublic.mx/products/vida-bebida-kombucha-menta-500ml-solo-cdmx
