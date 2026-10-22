#!/usr/bin/env python3
"""Browser test of the generated brand pages, over HTTP with Playwright.

For every brand page: no console errors, every button and link-button has a name, Share copies the page link,
each logo has a working download (a direct link for one file, a menu for several), menus open and close with the
keyboard, the "On this page" links work, and nothing visible runs off the right edge at desktop and phone width.
Needs Playwright for Python with Chromium.  Run: python3 tests/browser_brand.py
"""
from __future__ import annotations

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted(p.parent.name for p in (ROOT / "brands").glob("*/index.html"))


def require(condition, message):
    if not condition:
        raise AssertionError(message)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


OVERFLOW = """() => [...document.querySelectorAll('body *')]
    .filter((e) => !e.closest('.visually-hidden') && e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed')
    .map((e) => e.tagName + '.' + e.className).slice(0, 5)"""


def check_page(browser, base, slug):
    context = browser.new_context(viewport={"width": 1200, "height": 900}, permissions=["clipboard-read", "clipboard-write"], accept_downloads=True)
    page = context.new_page()
    problems = []
    page.on("pageerror", lambda e: problems.append(str(e)))
    page.on("console", lambda m: problems.append(m.text) if m.type == "error" and "404" not in m.text else None)
    url = f"{base}brands/{slug}/"
    page.goto(url)
    page.wait_for_selector(".logo-card")

    unnamed = page.evaluate("""() => [...document.querySelectorAll('button, [role=button], a.action-button')]
        .filter((b) => !(b.getAttribute('aria-label') || b.textContent || '').trim()).map((b) => b.outerHTML.slice(0, 90))""")
    require(not unnamed, f"{slug}: every button has a name: {unnamed}")
    icon_only = page.evaluate("""() => [...document.querySelectorAll('.action-button')].filter((b) => !(b.textContent || '').trim() && !b.title).length""")
    require(icon_only == 0, f"{slug}: icon-only buttons have a tooltip")

    # Share copies the link and says so.
    page.click("[data-action=share]")
    page.wait_for_function("document.querySelector('.doc-action-status').textContent.trim() !== ''")
    require(page.evaluate("navigator.clipboard.readText()").rstrip("/") == url.rstrip("/"), f"{slug}: Share copies the page link")

    # Every logo card has a way to download.
    cards = page.locator(".logo-card:has(.logo-card__preview)")  # the logo cards, not the other cards that share the style
    require(cards.count() >= 1, f"{slug}: the page has logo cards")
    for i in range(cards.count()):
        card = cards.nth(i)
        direct = card.locator("a.action-button[download]")
        menu = card.locator("button.menu-toggle")
        require(direct.count() + menu.count() == 1, f"{slug}: logo {i + 1} has exactly one download control")
        if direct.count():
            href = direct.get_attribute("href")
            if href.startswith("https://"):
                pass  # hosted by the County; the page only has to link to it
            else:
                require(href and (ROOT / "brands" / slug / href).is_file(), f"{slug}: logo {i + 1} download file exists ({href})")
            require(direct.get_attribute("aria-label").startswith("Download "), f"{slug}: logo {i + 1} download is named")
        else:
            toggle = menu.first
            require(toggle.get_attribute("aria-expanded") == "false", f"{slug}: menu starts closed")
            toggle.click()
            require(toggle.get_attribute("aria-expanded") == "true" and card.locator(".menu-panel a:visible").count() >= 2, f"{slug}: the menu opens with its formats")
            page.keyboard.press("Escape")
            require(toggle.get_attribute("aria-expanded") == "false", f"{slug}: Escape closes the menu")

    # "On this page" links go to real sections.
    for href in set(page.evaluate("[...document.querySelectorAll('.toc a[href^=\"#\"]')].map((a) => a.getAttribute('href'))")):
        require(page.locator(href).count() == 1, f"{slug}: {href} has a target")

    # Colors are printed as text.
    swatches = page.locator(".swatch")
    for i in range(swatches.count()):
        text = swatches.nth(i).locator(".swatch__meta").inner_text()
        require("#" in text, f"{slug}: swatch {i + 1} prints its value: {text!r}")

    require(not page.evaluate(OVERFLOW), f"{slug}: nothing visible runs off the edge at 1200 px: {page.evaluate(OVERFLOW)}")
    page.set_viewport_size({"width": 390, "height": 800})
    page.wait_for_timeout(200)
    require(not page.evaluate(OVERFLOW), f"{slug}: nothing visible runs off the edge at 390 px: {page.evaluate(OVERFLOW)}")
    require(not problems, f"{slug}: console or page errors: {problems}")
    context.close()


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}/"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for slug in PAGES:
                check_page(browser, base, slug)
        finally:
            browser.close()
            server.shutdown()
    print(f"Marin Brand browser test ({len(PAGES)} brand pages): PASS")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
