"""Re-capture SGD pathway diagram images from YeastPathways.

Same recipe as the original capture (detail-level=2, 2x scale, screenshot of the
diagram canvas element) plus dismissal of the two UI overlays that contaminated
the first pass: the "Green ?" tip popup and the OPERATIONS side panel (#navBox).
"""
import sys
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

IDS = [
    "ALL-CHORISMATE-PWY-1", "ARO-PWY-1", "COMPLETE-ARO-PWY-1", "DENOVOPURINE2-PWY",
    "GLUT-REDOX2-PWY", "P4-PWY-1", "PHOS-PWY", "PRPP-PWY-1", "PWY-2201", "PWY-6125",
    "PWY3O-1", "PWY3O-2", "PWY3O-20", "PWY3O-285", "PWY3O-4108", "PWY3O-4153",
    "PWY3O-450", "PWY3O-5962", "PWY3O-661", "PWY3O-8514", "PWY3O-862",
    "SPHINGOLIPID-SYN-PWY-1", "YEAST-RNT-SALV",
]
URL = "https://pathway.yeastgenome.org/YEAST/NEW-IMAGE?type=PATHWAY&object={}&detail-level=2"
CANVAS = '[id^="canvas-WG_"][id*="_PWY_DIAGRAM"]'

CLEANUP_JS = """() => {
    const removed = [];
    // 1. OPERATIONS side panel
    const nav = document.getElementById('navBox');
    if (nav) { nav.remove(); removed.push('navBox'); }
    // 2. Tip popup ("Green ? Buttons Provide Help" / "Pathway Tools Tip") -
    //    remove the outermost absolutely-positioned ancestor of the tip text
    for (const el of [...document.querySelectorAll('div')]) {
        const t = el.textContent || '';
        if (/Provide Help|Next Tip|Pathway Tools Tip/.test(t)) {
            let target = null, a = el;
            while (a && a !== document.body) {
                const pos = getComputedStyle(a).position;
                if (pos === 'absolute' || pos === 'fixed') target = a;
                a = a.parentElement;
            }
            if (target) { target.remove(); removed.push('tipBox'); break; }
        }
    }
    // 3. Belt and braces: hide any remaining positioned overlay that intersects
    //    the diagram canvas (except the transparent WGoverlayCanvas, which the
    //    original captures included)
    const canvas = document.querySelector('CANVAS_SEL');
    const c = canvas.getBoundingClientRect();
    for (const el of [...document.body.querySelectorAll('div, table, ul')]) {
        if (el.contains(canvas) || canvas.contains(el)) continue;
        const s = getComputedStyle(el);
        if (s.position !== 'absolute' && s.position !== 'fixed') continue;
        if (s.visibility === 'hidden' || s.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) continue;
        const overlaps = r.left < c.right && r.right > c.left &&
                         r.top < c.bottom && r.bottom > c.top;
        if (overlaps && el.id !== 'WGoverlayCanvas') {
            el.style.visibility = 'hidden';
            removed.push('overlay:' + (el.id || el.className || el.tagName));
        }
    }
    return removed;
}""".replace("CANVAS_SEL", CANVAS)


def has_artifacts(path):
    a = np.asarray(Image.open(path).convert("RGB"))
    r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    blue = int(((b > 180) & (r < 100) & (g < 100)).sum())
    grey = (abs(r - g) < 8) & (abs(g - b) < 8) & (abs(r - b) < 8) & (r > 215) & (r < 250)
    h, w = grey.shape
    solid = 0
    for y0 in range(0, h - 39, 40):
        for x0 in range(0, w - 39, 40):
            if grey[y0:y0 + 40, x0:x0 + 40].mean() > 0.85:
                solid += 1
    return blue > 500 or solid >= 4, blue, solid


def capture(page, pid):
    page.goto(URL.format(pid), wait_until="networkidle", timeout=90000)
    page.wait_for_selector(CANVAS, timeout=60000)
    # wait until the canvas size is stable (diagram fully laid out)
    prev = None
    for _ in range(20):
        page.wait_for_timeout(1500)
        size = page.eval_on_selector(CANVAS, "el => [el.width, el.height]")
        if size == prev:
            break
        prev = size
    removed = page.evaluate(CLEANUP_JS)
    page.wait_for_timeout(500)
    out = f"out/{pid}.png"
    page.query_selector(CANVAS).screenshot(path=out, timeout=60000)
    return out, removed


with sync_playwright() as p:
    browser = p.chromium.launch()
    failures = []
    for pid in IDS:
        ok = False
        for attempt in (1, 2):
            context = browser.new_context(
                viewport={"width": 1700, "height": 1400}, device_scale_factor=2)
            page = context.new_page()
            try:
                out, removed = capture(page, pid)
                bad, blue, solid = has_artifacts(out)
                size = Image.open(out).size
                print(f"{pid}: {size[0]}x{size[1]} removed={removed} "
                      f"blue={blue} greyblocks={solid}"
                      + ("  << ARTIFACT, retrying" if bad else ""), flush=True)
                if not bad:
                    ok = True
                    break
            except Exception as e:
                print(f"{pid}: attempt {attempt} FAILED: {e}", flush=True)
            finally:
                context.close()
        if not ok:
            failures.append(pid)
    print("\nDone. failures:", failures or "none")
    sys.exit(1 if failures else 0)
