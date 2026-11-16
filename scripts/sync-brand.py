#!/usr/bin/env python3
"""Copy the brand data from marin-data into brands/ and schemas/.

Brands are edited in marin-data (brand/<slug>/brand.json and assets/). Everything here that comes from
there is a copy: each brand's brand.json and assets/, and schemas/brand.schema.json. Never edit a copy.
Each brand's generated index.html and styles.css, and the root brands.json, belong to this repo.
After a sync, run node scripts/build-all.js.

  python3 scripts/sync-brand.py           copy from ../marin-data. Files removed there are removed here.
  python3 scripts/sync-brand.py --check   fail if the copies differ. Skipped when marin-data is not next to this repo.
"""
from __future__ import annotations

import fnmatch
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT.parent / "marin-data"
SOURCE = DATA / "brand"
BRANDS = ROOT / "brands"
SCHEMA = ("schemas/brand.schema.json", DATA / "schemas" / "brand.schema.json", ROOT / "schemas" / "brand.schema.json")
OURS = ["*/index.html", "*/styles.css", ".DS_Store", "*/.DS_Store", "*/*/.DS_Store", "*/*/*/.DS_Store"]


def wanted() -> dict[str, Path]:
    """Destination path (relative to brands/) -> the file in marin-data that it copies."""
    return {f.relative_to(SOURCE).as_posix(): f for f in sorted(SOURCE.rglob("*")) if f.is_file() and f.name != ".DS_Store"}


def stale(want: dict[str, Path]) -> list[str]:
    out = []
    for f in sorted(BRANDS.rglob("*")):
        if f.is_file():
            rel = f.relative_to(BRANDS).as_posix()
            if rel not in want and not any(fnmatch.fnmatch(rel, p) for p in OURS):
                out.append(rel)
    return out


def gone_brands() -> list[str]:
    here = {d.name for d in SOURCE.iterdir() if d.is_dir()}
    return sorted(d.name for d in BRANDS.iterdir() if d.is_dir() and d.name not in here)


if not SOURCE.is_dir():
    if "--check" in sys.argv:
        print("skipped: marin-data is not next to this repo")
        sys.exit(0)
    sys.exit(f"marin-data not found at {SOURCE.parent}")

want = wanted()
if "--check" in sys.argv:
    problems = []
    for rel, src in want.items():
        dst = BRANDS / rel
        if not dst.is_file():
            problems.append(f"brands/{rel}: missing")
        elif dst.read_bytes() != src.read_bytes():
            problems.append(f"brands/{rel}: differs from marin-data")
    problems += [f"brands/{rel}: not in marin-data any more" for rel in stale(want)]
    problems += [f"brands/{name}/: brand is not in marin-data any more" for name in gone_brands()]
    name, src, dst = SCHEMA
    if not dst.is_file() or dst.read_bytes() != src.read_bytes():
        problems.append(f"{name}: differs from marin-data")
    if problems:
        sys.exit("brand data differs from marin-data:\n  " + "\n  ".join(problems)
                 + "\nRun: python3 scripts/sync-brand.py && node scripts/build-all.js")
    print(f"ok: {len(want)} brand files match marin-data")
else:
    for name in gone_brands():
        shutil.rmtree(BRANDS / name)
        print(f"removed brands/{name}/ (not in marin-data any more)")
    for rel, src in want.items():
        dst = BRANDS / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.is_file() or dst.read_bytes() != src.read_bytes():
            shutil.copyfile(src, dst)
            print(f"copied brands/{rel}")
    for rel in stale(want):
        (BRANDS / rel).unlink()
        print(f"removed brands/{rel}")
    for d in sorted((p for p in BRANDS.rglob("*") if p.is_dir()), key=lambda p: -len(p.parts)):
        if not any(d.iterdir()):
            d.rmdir()
    name, src, dst = SCHEMA
    if not dst.is_file() or dst.read_bytes() != src.read_bytes():
        shutil.copyfile(src, dst)
        print(f"copied {name}")
    print(f"brand data matches marin-data ({len(want)} files)")
