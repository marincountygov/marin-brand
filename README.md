# Marin Brand Center

Logo, color, and typography reference for Marin brands — County of Marin today, with room for others (Marin County Parks, etc.) as they're added. Guides County staff, designers, and vendors in applying each brand consistently.

- **Purpose:** One place to find a brand's approved logos, color palette, typography, and file-format guidance.
- **Audience:** Public — County staff, designers, and vendors.
- **Owner:** County of Marin
- **Repo:** brand
- **Status:** Alpha — migrated from `marin-docs/brand/`.

## Architecture

Static, zero-build-step, same as every MarinOS app — except for the generators below, which are plain Node scripts run on demand, never as part of a deploy pipeline (the same pattern `marin-mentions`' and `marin-os`'s own generators use).

```
brands/<slug>/brand.json   →  scripts/build-brand.js <slug>  →  brands/<slug>/index.html
brands/*/brand.json        →  scripts/build-all.js           →  every brand's index.html
                                                                  + brands.json (the list Marin Links reads)
                                                                  + the "Brands" directory in this repo's own index.html
```

Each brand owns one `brands/<slug>/` folder: its `brand.json` (the source of truth), the generated `index.html` (never hand-edited — it doesn't edit itself), its own `assets/`, and `source-documents/` if it was extracted from an existing print style guide.

## Adding a brand

1. `mkdir brands/<slug>` (a short, URL-safe id, e.g. `parks`).
2. Copy [`templates/brand.template.json`](templates/brand.template.json) to `brands/<slug>/brand.json` and fill it in — see [`brands/county-of-marin/brand.json`](brands/county-of-marin/brand.json) for a fully filled-out example, and [`schemas/brand.schema.json`](schemas/brand.schema.json) for what's actually required versus optional. Citation/source-document fields are optional — only fill them in if this brand really was extracted from an existing PDF guide.
3. Add the logo/preview image files the `brand.json` references under `brands/<slug>/assets/`.
   - Optional: add a `qrCodeLogos` block with a square PNG (for example `assets/qr-code-logos/square.png`) to show a "QR code logos" part under Logos. Mark the main one `"default": true`.
4. `node scripts/validate-brand.js` — catches a malformed `brand.json` before it renders.
5. `node scripts/build-all.js` — generates `brands/<slug>/index.html` and adds the new brand's card to this repo's own landing page.

## Relationship to `marin-digital-standards/brand/`

Two different things, both already correctly separate, and this repo doesn't change that:

- **`marin-digital-standards/brand/`** is the short, prescriptive *standard* for MarinOS's own digital products — what typeface digital UI actually uses, how gold is and isn't used as a color, etc.
- **This repo** is the richer *reference library* for each brand's full identity — every logo variant, the complete color palette with print values, and (for County of Marin) the original 2014 print guide's own guidance, including where it's been deliberately superseded for digital use. A brand's `typography.digitalImplementation` field is exactly that cross-reference, already present in the migrated County of Marin content.

## Security

This app ships with `security.json`, `SECURITY.md`, and a `#security` section — see [`SECURITY.md`](SECURITY.md). It uses the `public-web` profile, not the template's default `internal`, since this Brand Center explicitly serves external designers and vendors, not County staff alone.

## Related resources

- [marin-digital-standards](https://github.com/marincountygov/marin-digital-standards) — accessibility, content, brand, and product-design requirements.
- [marin-ui](https://github.com/marincountygov/marin-ui) — the implemented components, tokens, and app shell this project is built on.
- [marin-skills](https://github.com/marincountygov/marin-skills) — AI workflows for building, reviewing, and maintaining Marin applications.
- [marin-docs](https://github.com/marincountygov/marin-docs) — where this content lived before it was extracted into its own repo.
