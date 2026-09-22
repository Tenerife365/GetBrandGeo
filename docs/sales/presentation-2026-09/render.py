"""Render the BrandGEO deck HTML files to PDF with headless Chrome, then
rasterise every page to PNG for page by page review.

Usage (from the repo root):
    python docs/sales/presentation-2026-09/render.py

Outputs, next to this script:
    BrandGEO-Presentation-2026-09.pdf
    BrandGEO-Presentation-2026-09-appendix.pdf
    _review/<name>-pNN.png   (not committed)
"""
import pathlib
import subprocess
import sys

import fitz  # PyMuPDF

HERE = pathlib.Path(__file__).resolve().parent
CHROME_CANDIDATES = [
    pathlib.Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    pathlib.Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]
JOBS = [
    ("deck.html", "BrandGEO-Presentation-2026-09.pdf"),
    ("appendix.html", "BrandGEO-Presentation-2026-09-appendix.pdf"),
]


def chrome() -> pathlib.Path:
    for c in CHROME_CANDIDATES:
        if c.exists():
            return c
    sys.exit("No Chrome or Edge found")


def render(src: str, out: str) -> pathlib.Path:
    src_path = HERE / src
    out_path = HERE / out
    cmd = [
        str(chrome()),
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=15000",
        f"--print-to-pdf={out_path}",
        src_path.as_uri(),
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=180)
    return out_path


def rasterise(pdf: pathlib.Path) -> int:
    review = HERE / "_review"
    review.mkdir(exist_ok=True)
    doc = fitz.open(pdf)
    for i, page in enumerate(doc, start=1):
        r = page.rect
        assert abs(r.width / r.height - 16 / 9) < 0.01, f"{pdf.name} p{i} is {r}"
        page.get_pixmap(dpi=72).save(review / f"{pdf.stem}-p{i:02d}.png")
    n = doc.page_count
    doc.close()
    return n


if __name__ == "__main__":
    for src, out in JOBS:
        if not (HERE / src).exists():
            continue
        pdf = render(src, out)
        pages = rasterise(pdf)
        print(f"{out}: {pages} pages")
