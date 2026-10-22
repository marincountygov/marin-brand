#!/usr/bin/env python3
"""Checks on the brand data and the pages generated from it. Needs Node (the generators are Node scripts).

1. Every brand.json validates (scripts/validate-brand.js).
2. The generated pages are current: running the generators in a copy of the repo changes nothing.
3. Every file a brand points at (logo previews, download files, source documents) exists.
4. Every color has a name and a hex value, and the page prints each value as text (never color alone).
5. Every download link and every on-page link to a page section lands somewhere.

Run: python3 tests/test_generated.py
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRANDS = sorted(p.parent for p in (ROOT / "brands").glob("*/brand.json"))


def node(*args, cwd=ROOT):
    return subprocess.run(["node", *args], cwd=cwd, capture_output=True, text=True)


def referenced_files(value, found=None):
    """Every string in the data that looks like a relative file path."""
    found = [] if found is None else found
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"preview", "file"} and isinstance(item, str):
                found.append(item)
            else:
                referenced_files(item, found)
    elif isinstance(value, list):
        for item in value:
            referenced_files(item, found)
    return found


class GeneratedBrandTests(unittest.TestCase):
    def test_there_are_brands(self):
        self.assertGreaterEqual(len(BRANDS), 3, "county-of-marin, engage-marin and fixitmarin")

    def test_brand_data_validates(self):
        result = node("scripts/validate-brand.js")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_generated_pages_are_current(self):
        with tempfile.TemporaryDirectory() as temp:
            copy = Path(temp) / "repo"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__"))
            result = node("scripts/build-all.js", cwd=copy)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            pages = [Path("index.html")] + [p.relative_to(ROOT) for p in (ROOT / "brands").glob("*/index.html")]
            stale = [str(p) for p in pages if (ROOT / p).read_text(encoding="utf-8") != (copy / p).read_text(encoding="utf-8")]
            self.assertEqual(stale, [], f"These pages differ from what the generators produce; run node scripts/build-all.js: {stale}")

    def test_generation_is_repeatable(self):
        with tempfile.TemporaryDirectory() as temp:
            copy = Path(temp) / "repo"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__"))
            node("scripts/build-all.js", cwd=copy)
            first = {str(p.relative_to(copy)): p.read_bytes() for p in copy.glob("brands/*/index.html")}
            node("scripts/build-all.js", cwd=copy)
            second = {str(p.relative_to(copy)): p.read_bytes() for p in copy.glob("brands/*/index.html")}
            self.assertEqual(first, second, "A second run changes the pages")

    def test_referenced_files_exist(self):
        for folder in BRANDS:
            data = json.loads((folder / "brand.json").read_text(encoding="utf-8"))
            for path in referenced_files(data):
                if re.match(r"^[a-z]+://", path):
                    continue
                self.assertTrue((folder / path).is_file(), f"{folder.name}: {path} is missing")

    def test_colors_have_names_and_values_in_text(self):
        for folder in BRANDS:
            data = json.loads((folder / "brand.json").read_text(encoding="utf-8"))
            html = (folder / "index.html").read_text(encoding="utf-8")
            colors = data["colors"] if isinstance(data["colors"], list) else data["colors"].get("palette", data["colors"].get("swatches", []))
            self.assertTrue(colors, f"{folder.name}: no colors found in the data")
            for color in colors:
                self.assertTrue(color.get("name"), f"{folder.name}: a color has no name")
                hexes = [v for v in color.values() if isinstance(v, str) and re.fullmatch(r"#[0-9A-Fa-f]{6}", v)]
                self.assertTrue(hexes, f"{folder.name}: {color.get('name')} has no hex value")
                self.assertIn(hexes[0].upper(), html.upper(), f"{folder.name}: {color['name']} value is not printed as text")

    def test_page_links_land_somewhere(self):
        for folder in BRANDS:
            html = (folder / "index.html").read_text(encoding="utf-8")
            ids = set(re.findall(r'\bid="([^"]+)"', html))
            for target in set(re.findall(r'href="#([^"]+)"', html)):
                self.assertIn(target, ids, f"{folder.name}: link to #{target} has no target")
            for href in re.findall(r'<a [^>]*download[^>]*href="([^"]+)"|<a [^>]*href="([^"]+)"[^>]*download', html):
                link = next(h for h in href if h)
                if not re.match(r"^[a-z]+://", link):
                    self.assertTrue((folder / link).is_file(), f"{folder.name}: download {link} is missing")


if __name__ == "__main__":
    unittest.main()
