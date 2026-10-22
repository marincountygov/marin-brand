#!/usr/bin/env node
// brands/<slug>/index.html is generated from brands/<slug>/brand.json — it
// does not edit itself. Run this after every edit to a brand's brand.json,
// or the page keeps showing stale data. No dependencies, matching every
// other MarinOS generator (marin-docs' scripts/build-brand-center.js, which
// this one generalizes from one hardcoded brand to any brand.json
// conforming to schemas/brand.schema.json).
//
//   node scripts/build-brand.js <slug>          (one brand)
//   node scripts/build-all.js                    (every brand + the index)

const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBrand(slug) {
  const brandDir = path.join(repoRoot, "brands", slug);
  const dataPath = path.join(brandDir, "brand.json");
  const outPath = path.join(brandDir, "index.html");

  if (!fs.existsSync(dataPath)) {
    throw new Error(`No brands/${slug}/brand.json found.`);
  }
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  // --- Overview ---------------------------------------------------------

  const overviewSection = `
        <section class="section" id="overview">
          <h2>Purpose</h2>
          <p>${esc(data.purpose.summary)}</p>
          <ul>
            ${data.purpose.goals.map((g) => `<li>${esc(g)}</li>`).join("\n            ")}
          </ul>
        </section>`;

  // --- Background ---------------------------------------------------------
  // Optional: a brand with no documented symbol/story just skips this section.

  const symbol = data.identity && data.identity.symbol;
  const backgroundSection = symbol
    ? `
        <section class="section" id="background">
          <h2>Background &amp; significance</h2>
          <p>${esc(symbol.description)}</p>
          ${symbol.meaning && symbol.meaning.length ? `<p>The symbol represents:</p>
          <ul>
            ${symbol.meaning.map((m) => `<li>${esc(m)}</li>`).join("\n            ")}
          </ul>` : ""}
        </section>`
    : "";

  // --- Logos ---------------------------------------------------------

  function logoCardMeta(fields) {
    const filtered = fields.filter((f) => f.value);
    if (!filtered.length) return "";
    return `
              <div class="logo-card__meta">
                ${filtered
                  .map((f) => `<div class="logo-card__field"><span class="logo-card__label">${esc(f.label)}</span><span class="logo-card__value">${f.value}</span></div>`)
                  .join("\n                ")}
              </div>`;
  }

  // `downloads` is optional: a list of { file, label? } for assets offered in
  // more than one format (e.g. SVG + PNG). Without it, the preview file is
  // the single download, as before.
  function downloadButton(id, name, preview, downloads) {
    const files = downloads && downloads.length
      ? downloads.map((d) => ({ href: d.file, label: d.label || (d.file.split(".").pop() || "").toUpperCase() }))
      : preview
        ? [{ href: preview, label: (preview.split(".").pop() || "").toUpperCase() }]
        : [];
    if (!files.length) return "";
    if (files.length === 1) {
      const only = files[0];
      return `
              <div class="logo-card__download">
                <a class="action-button" href="${esc(only.href)}" download data-icon="download" aria-label="Download ${esc(name)} as ${esc(only.label)}" title="Download ${esc(only.label)}"></a>
              </div>`;
    }
    const panelId = `download-${id}-panel`;
    return `
              <div class="menu logo-card__download">
                <button type="button" class="action-button menu-toggle" data-icon="download" aria-expanded="false" aria-controls="${esc(panelId)}" aria-label="Download ${esc(name)}, choose a format" title="Download"><svg class="menu-toggle__caret" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg></button>
                <div id="${esc(panelId)}" class="menu-panel" hidden>
                  ${files.map((f) => `<a href="${esc(f.href)}" download aria-label="Download ${esc(name)} as ${esc(f.label)}">${esc(f.label)}</a>`).join("\n                  ")}
                </div>
              </div>`;
  }

  function logoCard(variant) {
    const reversed = variant.previewBackground === "dark" || /reversed/.test(variant.id);
    return `
            <article class="logo-card">
              ${variant.preview ? `<div class="logo-card__preview${reversed ? " logo-card__preview--reversed" : ""}">
                <img src="${esc(variant.preview)}" alt="${esc(variant.name)} preview" loading="lazy">
              </div>` : ""}
              <h3>${esc(variant.name)}${variant.preferred ? ' <span class="app-badge">Preferred</span>' : ""}</h3>
              ${variant.description ? `<p>${esc(variant.description)}</p>` : ""}
              ${variant.usage ? `<p>${esc(variant.usage)}</p>` : ""}${logoCardMeta([
      { label: "Minimum width", value: variant.minimumWidthInches ? `${esc(variant.minimumWidthInches)}"` : "" },
    ])}
              ${downloadButton(variant.id, variant.name, variant.preview, variant.downloads)}
            </article>`;
  }

  // graphicMark is optional — a brand with only wordmark/lockup logos (no
  // separate icon-only mark) skips this sub-part entirely.
  const graphicMark = data.logos.graphicMark;
  const logosSection = `
        <section class="section" id="logos">
          <h2>Logos</h2>
          ${data.logos.generalRules && data.logos.generalRules.length ? `<ul>
            ${data.logos.generalRules.map((r) => `<li>${esc(r)}</li>`).join("\n            ")}
          </ul>` : ""}
          <div class="logo-grid">${data.logos.variants.map(logoCard).join("")}
          </div>
          ${graphicMark ? `<h3>Logo graphic</h3>
          <p>${esc(graphicMark.description)} ${esc(graphicMark.colorRule)}</p>
          <div class="logo-grid">
            <article class="logo-card">
              <div class="logo-card__preview">
                <img src="${esc(graphicMark.preview)}" alt="${esc(graphicMark.name)} preview" loading="lazy">
              </div>
              <h3>${esc(graphicMark.name)}</h3>
              ${downloadButton("logo-graphic", graphicMark.name, graphicMark.preview)}
            </article>
          </div>` : ""}
        </section>`;

  // --- Illustrations ---------------------------------------------------------
  // Optional: supporting scene/concept graphics distinct from the logo itself.

  function illustrationCard(item) {
    return `
            <article class="logo-card">
              ${item.preview ? `<div class="logo-card__preview">
                <img src="${esc(item.preview)}" alt="${esc(item.name)} preview" loading="lazy">
              </div>` : `<p class="app-help-text">Preview pending.</p>`}
              <h3>${esc(item.name)}</h3>
              ${item.description ? `<p>${esc(item.description)}</p>` : ""}
              ${item.usage ? `<p>${esc(item.usage)}</p>` : ""}
              ${downloadButton(item.id, item.name, item.preview)}
            </article>`;
  }

  const illustrationsSection = data.illustrations
    ? `
        <section class="section" id="illustrations">
          <h2>Illustrations</h2>
          ${data.illustrations.guidance ? `<p>${esc(data.illustrations.guidance)}</p>` : ""}
          <div class="logo-grid">${(data.illustrations.items || []).map(illustrationCard).join("")}
          </div>
        </section>`
    : "";

  // --- Print materials ---------------------------------------------------------
  // Optional: posters/flyers distributed as a linked page, not a direct file.

  const printMaterialsSection = data.printMaterials
    ? `
        <section class="section" id="print-materials">
          <h2>Printable materials</h2>
          ${data.printMaterials.guidance ? `<p>${esc(data.printMaterials.guidance)}</p>` : ""}
          <ul>
            ${(data.printMaterials.items || [])
              .map(
                (item) =>
                  `<li><a href="${esc(item.url)}">${esc(item.name)}</a>${item.format ? ` (${esc(item.format)})` : ""}${item.description ? ` — ${esc(item.description)}` : ""}</li>`
              )
              .join("\n            ")}
          </ul>
        </section>`
    : "";

  // --- Social media ---------------------------------------------------------
  // Optional: ready-to-post assets paired with suggested caption copy.

  function captionBlock(caption) {
    return `
              <div class="digital-note">
                <h4>${esc(caption.languageLabel || caption.language)}</h4>
                ${caption.lines.map((line) => `<p>${esc(line)}</p>`).join("\n                ")}
              </div>`;
  }

  function socialAsset(asset) {
    return `
            <article class="logo-card">
              ${asset.preview ? `<div class="logo-card__preview">
                <img src="${esc(asset.preview)}" alt="${esc(asset.name)} preview" loading="lazy">
              </div>` : ""}
              <h3>${esc(asset.name)}</h3>
              ${asset.description ? `<p>${esc(asset.description)}</p>` : ""}
              ${downloadButton(asset.id, asset.name, asset.downloadUrl || asset.preview)}
              ${(asset.captions || []).map(captionBlock).join("")}
            </article>`;
  }

  const socialMediaSection = data.socialMedia
    ? `
        <section class="section" id="social-media">
          <h2>Social media</h2>
          ${data.socialMedia.guidance ? `<p>${esc(data.socialMedia.guidance)}</p>` : ""}
          <div class="logo-grid">${(data.socialMedia.assets || []).map(socialAsset).join("")}
          </div>
        </section>`
    : "";

  // --- Colors ---------------------------------------------------------

  function swatch(color) {
    const cmyk = color.cmyk ? color.cmyk.join(", ") : "";
    const rgb = color.rgb ? color.rgb.join(", ") : "";
    const pms = color.pms ? (typeof color.pms === "string" ? color.pms : Object.entries(color.pms).map(([k, v]) => `${k} ${v}`).join(" / ")) : "";
    return `
          <div class="swatch">
            <div class="swatch__block" style="background:${esc(color.hex)}"></div>
            <div class="swatch__meta">
              <h3>${esc(color.name)}</h3>
              <dl>
                <dt>Hex</dt><dd><code>${esc(color.hex)}</code></dd>
                ${rgb ? `<dt>RGB</dt><dd>${esc(rgb)}</dd>` : ""}
                ${cmyk ? `<dt>CMYK</dt><dd>${esc(cmyk)}</dd>` : ""}
                ${pms ? `<dt>PMS</dt><dd>${esc(pms)}</dd>` : ""}
              </dl>
              ${color.usage ? `<p class="swatch__usage">${esc(color.usage)}</p>` : ""}
            </div>
          </div>`;
  }

  function metallicGoldSwatch(metallic) {
    const gold = data.colors.palette.find((c) => c.id === "gold");
    if (!metallic || !gold) return "";
    return `
          <div class="swatch">
            <div class="swatch__block" style="background:${esc(gold.hex)}"></div>
            <div class="swatch__meta">
              <h3>Metallic Gold</h3>
              <dl>
                <dt>PMS</dt><dd>${esc(metallic.metallicPms)}</dd>
              </dl>
              <p class="swatch__usage">Print only. ${esc(metallic.foilGuidance)}</p>
            </div>
          </div>`;
  }

  const colorsGuidance = [
    data.colors.guidance.primaryPalette,
    data.colors.guidance.secondaryPalette,
    data.colors.guidance.continuity,
  ].filter(Boolean);

  const colorsSection = `
        <section class="section" id="colors">
          <h2>Color palette</h2>
          ${colorsGuidance.map((g) => `<p>${esc(g)}</p>`).join("\n          ")}
          <div class="swatch-grid">${data.colors.palette.map(swatch).join("")}${metallicGoldSwatch(data.colors.metallicGold)}
          </div>
        </section>`;

  // --- Typography ---------------------------------------------------------

  const typo = data.typography;
  const hasFamilies = typo.families && typo.families.length;
  const typographySection = `
        <section class="section" id="typography">
          <h2>Typography</h2>
          ${!hasFamilies && typo.guidance && typo.guidance.length ? `<ul>
            ${typo.guidance.map((g) => `<li>${esc(g)}</li>`).join("\n            ")}
          </ul>` : ""}
          ${hasFamilies ? `<dl class="details">
            ${typo.families.map((f) => `<dt>${esc(f.name)}</dt><dd>${esc(f.roles.join(", "))}</dd>`).join("\n            ")}
          </dl>` : ""}
        </section>`;

  // --- File formats ---------------------------------------------------------

  const ff = data.fileFormats;

  function fileFormatLine(f) {
    if (!f) return "";
    const parts = [];
    if (f.preferredFormat) parts.push(f.preferredFormat);
    if (f.description) parts.push((parts.length ? "— " : "") + f.description);
    const colorspace = f.colorspaces ? f.colorspaces.join(", ") : f.colorspace;
    if (colorspace) parts.push(`(${colorspace})`);
    if (f.scaling) parts.push(f.scaling);
    return esc(parts.join(" "));
  }

  const fileFormatsSection = `
        <section class="section" id="file-formats">
          <h2>File formats</h2>
          <p><strong>${esc(ff.masterArtworkRule)}</strong></p>
          <dl class="details">
            ${ff.print ? `<dt>Print</dt><dd>${fileFormatLine(ff.print)}</dd>` : ""}
            ${ff.webElectronic ? `<dt>Web &amp; electronic</dt><dd>${fileFormatLine(ff.webElectronic)}</dd>` : ""}
          </dl>
        </section>`;

  const sourceFilename = data.brand.sourceFile ? data.brand.sourceFile.split("/").pop() : null;
  const sourceDocLink =
    sourceFilename && fs.existsSync(path.join(brandDir, "source-documents", sourceFilename))
      ? `<li><a href="source-documents/${esc(sourceFilename)}">Original source document</a></li>`
      : "";
  const sourceUrlLink = data.brand.sourceUrl
    ? `<li><a href="${esc(data.brand.sourceUrl)}">Official source page</a></li>`
    : "";
  const sourceSection = `
        <section class="section" id="source">
          <h2>Source</h2>
          <ul>
            <li><a href="brand.json" download>brand.json</a></li>
            ${sourceDocLink}
            ${sourceUrlLink}
          </ul>
        </section>`;

  const sections = [
    { id: "overview", label: "Purpose", html: overviewSection },
    backgroundSection && { id: "background", label: "Background & significance", html: backgroundSection },
    { id: "logos", label: "Logos", html: logosSection },
    illustrationsSection && { id: "illustrations", label: "Illustrations", html: illustrationsSection },
    { id: "colors", label: "Color palette", html: colorsSection },
    { id: "typography", label: "Typography", html: typographySection },
    { id: "file-formats", label: "File formats", html: fileFormatsSection },
    printMaterialsSection && { id: "print-materials", label: "Printable materials", html: printMaterialsSection },
    socialMediaSection && { id: "social-media", label: "Social media", html: socialMediaSection },
    { id: "source", label: "Source", html: sourceSection },
  ].filter(Boolean);

  const toc = sections.map((s) => `<li><a href="#${s.id}">${esc(s.label)}</a></li>`).join("\n            ");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(data.brand.name)} | Marin Brand Center</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%23000'/%3E%3Cg fill='none' stroke='%23e5b53b' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round' transform='translate(9,9) scale(1.25)'%3E%3Cpath d='M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z'/%3E%3Cpath d='M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7'/%3E%3Cpath d='M 7 17h.01'/%3E%3Cpath d='m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8'/%3E%3C/g%3E%3C/svg%3E">
    <meta name="description" content="${esc(data.purpose.summary)}">
    <link rel="stylesheet" href="../../vendor/marinos/marinos.css">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to main content</a>
    <marin-os-banner></marin-os-banner>
    <header class="site-header"><div class="header-inner"><span class="docs-brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/><path d="M 7 17h.01"/><path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"/></svg></span><nav class="breadcrumb-nav" aria-label="Breadcrumb"><a href="../../index.html">Marin Brand Center</a> <span aria-hidden="true">/</span> ${esc(data.brand.name)}</nav></div></header>
    <main id="main" class="page" tabindex="-1">
      <div class="docs-layout">
        <article class="content">
          <h1 class="doc-title">${esc(data.brand.name)}</h1>
          <p class="doc-description">${esc(data.purpose.summary)}</p>
          ${data.brand.website ? `<p class="doc-website">Website: <a href="${esc(data.brand.website)}">${esc(data.brand.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p>` : ""}
          ${data.brand.lastUpdated ? `<p class="doc-updated">Updated ${esc(data.brand.lastUpdated)}</p>` : ""}
          <div class="doc-actions">
            <div class="action-group" role="group" aria-label="Page actions">
              <button type="button" class="action-button" data-action="share" data-icon="share" aria-label="Share: copy the link to this page" title="Copy link"></button>
            </div>
            <span class="doc-action-status" role="status" aria-live="polite"></span>
          </div>
${sections.map((s) => s.html).join("\n")}
        </article>
        <aside class="toc" aria-label="On this page">
          <h2>On this page</h2>
          <ul>
            ${toc}
          </ul>
        </aside>
      </div>
    </main>
    <footer class="app-footer" role="contentinfo">
      <div class="app-footer__inner">
        <div class="app-footer__local">
          <span class="app-footer__app-name">Marin Brand Center</span>
          <nav class="app-footer__nav" aria-label="Marin Brand Center information">
            <a href="../../index.html#about">About</a>
            <a href="../../index.html#security">Security</a>
            <a href="../../index.html#accessibility">Accessibility</a>
            <a href="../../index.html#updates">Updates</a>
          </nav>
        </div>
        <div class="app-footer__platform"><a href="https://marincountygov.github.io/marin-os/">MarinOS</a></div>
      </div>
    </footer>
    <a class="app-feedback" href="https://form.asana.com/?k=qVUT83d5DBmlDiIyi-WAyQ&amp;d=23133298259496" target="_blank" rel="noreferrer">Feedback</a>
    <script src="../../vendor/marinos/marinos.js" defer></script>
  </body>
</html>
`;

  fs.writeFileSync(outPath, html);
  console.log(
    `Generated brands/${slug}/index.html from brand.json (${data.colors.palette.length} colors, ${data.logos.variants.length} logo variants).`
  );
}

if (require.main === module) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: node scripts/build-brand.js <brand-slug>");
    process.exit(1);
  }
  buildBrand(slug);
}

module.exports = { buildBrand };
