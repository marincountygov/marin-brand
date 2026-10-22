# Working on this Marin application

## Architecture

This is a static, zero-build MarinOS docs-shell application — the Brand Center, a multi-brand reference library (County of Marin today, room for others as they're added). It uses the shared `marin-ui` brand bundle (vendored via `marin-ui/scripts/sync-consumer.sh`, version recorded in `marin.yml`) and follows `marin-digital-standards`. See `marin.yml` for this project's owner, status, and platform versions.

Each brand lives in its own `brands/<slug>/` folder. `brands/<slug>/brand.json` is the source of truth; `brands/<slug>/index.html` is generated from it by `scripts/build-brand.js` and must never be hand-edited. The "Brands" directory on this repo's own landing page (`index.html`, between the `<!-- BRANDS:START -->`/`<!-- BRANDS:END -->` markers) is likewise generated, by `scripts/build-all.js`.

## Before making changes

1. Editing a brand's content means editing its `brand.json`, then running `node scripts/build-all.js` — never edit a `brands/<slug>/index.html` directly, it will be overwritten.
2. Validate before building: `node scripts/validate-brand.js` checks every `brands/*/brand.json` against `schemas/brand.schema.json`.
3. Adding a new brand: see the README's "Adding a brand" section and `templates/brand.template.json`. `schemas/brand.schema.json` is deliberately permissive (no `additionalProperties: false`) so a new brand isn't forced into County of Marin's shape — citation/source-document fields, `identity`, and `typography.digitalImplementation` are all optional.
4. If a change needs to touch `scripts/build-brand.js`'s generated HTML shape (not just `brand.json` content), keep it data-driven — the goal is that a future brand never needs a code change, only a new `brand.json`.
5. Keep the default view immediately functional — info/how-to content belongs in the About tab, not stacked above or alongside the content.

## Before finishing

Run `bash scripts/check.sh` (shell integrity, the button audit, `node scripts/validate-brand.js`, and `tests/test_generated.py`, which fails when a generated page is out of date, a referenced file is missing, or a color is not printed as text) and `bash scripts/check.sh --browser` (adds `tests/browser_brand.py`, which needs Playwright for Python with Chromium). Also manually verify: `node scripts/validate-brand.js` passes, `node scripts/build-all.js` runs clean and is idempotent (no diff on a second run with no data changes), and against the review checklist in `marin-skills/marin-app-builder/SKILL.md`: metadata placeholders replaced, nav includes About and Updates, accessibility basics, no invented components.

## References

- `marin-ui` — shared components, tokens, app shell: https://github.com/marincountygov/marin-ui
- `marin-digital-standards` — accessibility, content, brand, and product-design requirements, including `brand/` (the short, prescriptive digital-brand standard this repo's `typography.digitalImplementation` fields cross-reference): https://github.com/marincountygov/marin-digital-standards
- `marin-skills` — AI workflows for building and reviewing Marin applications, including `marin-app-builder` and `app-maintainer`: https://github.com/marincountygov/marin-skills
- `marin-os` — the MarinOS app directory this project is registered in: https://github.com/marincountygov/marin-os
- `marin-docs` — where this content lived before it was extracted into its own repo: https://github.com/marincountygov/marin-docs
