# Changelog

Tracks changes to this repo's own content and tooling — the `brands/` data, the generators, and the schema. This is separate from `platform.marin-ui`/`platform.template` in `marin.yml`, which track the vendored shared bundle and the scaffold this repo was created from.

## Unreleased

- The button that copies a page's address is now "Copy link" with the link icon, not "Share" with the share icon.

- Write `brands.json` at the repo root when the generators run. It lists each brand that has a QR code logo, in A to Z order, so Marin Links can offer new brands without a hand-kept list.
- Add an optional `qrCodeLogos` attribute to `brand.json` (schema, template, and generator), which renders a "QR code logos" part under Logos. Each brand has a default square PNG at `assets/qr-code-logos/square.png`, for use as the center logo in Marin Links.
- Extract the Brand Center out of `marin-docs/brand/` into this standalone, multi-brand repo, instantiated from `marin-app-template` 1.2.1.
- Generalize `marin-docs/scripts/build-brand-center.js` into `scripts/build-brand.js` (one brand) and `scripts/build-all.js` (every brand, plus this repo's own "Brands" directory card grid).
- Add `schemas/brand.schema.json` and `scripts/validate-brand.js`, adapted from `marin-os`'s security schema/validator pair. Deliberately permissive (no `additionalProperties: false`) so a brand with none of County of Marin's PDF-citation fields still validates.
- Add `templates/brand.template.json`, a starter file for adding a new brand.
- Migrate the County of Marin brand guide as `brands/county-of-marin/brand.json`, its assets, and its source PDF.
- Switch the security profile from the template default (`internal`) to `public-web`: this Brand Center explicitly serves designers and vendors, not County staff alone.
