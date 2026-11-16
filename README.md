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

Each brand has one `brands/<slug>/` folder: its `brand.json` and `assets/` (copies of the data in `marin-data`), the generated `index.html` (never hand-edited — it doesn't edit itself), and no stored PDFs: a source guide is linked by `sourceUrl` if it has a public URL, and otherwise not linked (see `marin-data/sources.json`).

## Where brand data is edited

The brand data is edited in `marin-data`: each brand's `brand/<slug>/brand.json` and its `assets/`. The `brands/<slug>/brand.json` and `assets/` here are copies, so the Download buttons and the addresses other apps use stay the same. A daily Data sync copies any change here, rebuilds the pages, runs the checks, and pushes a `data-sync` branch for review. Never edit a copy.

By hand: `python3 scripts/sync-brand.py`, then `node scripts/validate-brand.js` and `node scripts/build-all.js`. `marin-data.lock` records the `marin-data` version this repo uses. After a sync, run `bash ../marin-data/scripts/lock.sh .` to update it.

## Adding a brand

1. In `marin-data`, make `brand/<slug>/` (a short, URL-safe id, e.g. `parks`).
2. Copy `templates/brand.template.json` (in `marin-data`) to `brand/<slug>/brand.json` and fill it in. See `brands/county-of-marin/brand.json` here for a fully filled-out example, and [`schemas/brand.schema.json`](schemas/brand.schema.json) for what is required versus optional. Source-guide fields are optional: fill them in only if this brand really has a public source guide.
3. Add the logo and preview image files the `brand.json` names under `brand/<slug>/assets/`.
   - Optional: add a `qrCodeLogos` block with a square PNG (for example `assets/qr-code-logos/square.png`) to show a "QR code logos" part under Logos. Mark the main one `"default": true`.
4. In `marin-data`, run `python3 check_brand.py`. It checks that every file `brand.json` names exists and that none is left out. Merge it.
5. Here, the daily Data sync picks it up. Or run `python3 scripts/sync-brand.py`, `node scripts/validate-brand.js` and `node scripts/build-all.js`. That generates `brands/<slug>/index.html` and adds the new brand's card to this repo's own landing page.

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
