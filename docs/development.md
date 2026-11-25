# Development

## Run locally

Open `index.html` directly in a browser:

```text
file:///path/to/index.html
```

Serve the folder with any static web server when browser origin behavior matters (IndexedDB, service workers, stricter runtime packaging), or when running accessibility tools like WAVE.

## Customize the starter

1. Replace every `APP_NAME`, `APP_DESCRIPTION`, and `APP_OWNER` placeholder — search the project for these tokens (`index.html`, `README.md`) and fill them in with real values.
2. Update the page `<title>` and `<meta name="description">`.
3. Replace the starter `#start` section in `index.html` with the real workflow. Keep the standard `#about`, `#security`, `#accessibility`, and `#updates` sections in `index.html`; the App Shell (`<marin-app-info>`) generates and routes them.
4. Keep About and Updates out of the application header (they are in the footer), with no default **Start** item. Keep the footer app name as plain text followed by **About**, **Security**, **Accessibility**, and **Updates**, with **MarinOS** on its own line.
5. Add app-specific styles to `assets/app.css` and app-specific behavior to `assets/app.js` — see the guidance comments in each file before adding new patterns.

## Use the App Shell

This project installs a release of the [MarinOS App Shell](https://github.com/marincountygov/marin-app-shell) in `vendor/marinos/`, with its fonts and icons in `vendor/fonts/` and `vendor/icons/`. The version is recorded in `platform.shell` in `marin.yml`.

Prefer existing App Shell components and tokens over new CSS. See `marin-ui`'s `docs/` (architecture, foundations, components, app shell, accessibility implementation) before adding new markup patterns.

### Updating the App Shell

Use the installer from a local checkout of `marin-app-shell`:

```text
bash scripts/install.sh /path/to/this-project
```

Do not edit files in `vendor/` directly — fixes belong in the App Shell, then re-install.

After installing, review the App Shell changelog, check the resulting diff, and re-test the app before committing.

## Test changes

- Keyboard: tab through the page, confirm visible focus, and confirm the skip link and menu work.
- Reflow: check the page at a narrow viewport and at 200% zoom.
- Color mode: check both light and dark, since the shell follows `prefers-color-scheme` and does not provide a manual toggle.
- Accessibility: run WAVE over HTTP (or grant the extension local-page access for `file://`) — see marin-ui's `docs/accessibility-implementation.md`.

## Deployment

Deployment steps vary by hosting target and are not yet standardized here. Document the actual deployment process for this application in this file once it is established, rather than assuming a specific host.
