#!/usr/bin/env python3
"""
Generate one static detail page per hackathon project from projects.json.

Each page lives at projects/<slug>.html with a real <title>, meta description,
Open Graph / Twitter tags and a canonical URL, so individual projects can be
shared (X, Discord) and indexed. Covers reuse cover.js (same look as the cards).
Also (re)writes sitemap.xml.

Run this after replacing projects.json, then re-publish:
    python3 build_pages.py
The slug logic is kept identical to data.js so a page URL matches the modal id.
"""
import json, pathlib, re, html

HERE = pathlib.Path(__file__).parent
OUT  = HERE / "projects"
SITE = "https://jazzy-anvil-4vex.here.now"

TRACKS = {
    "general":  {"name": "General Purpose", "short": "General",  "color": "#16E3C1"},
    "mobile":   {"name": "Mobile",          "short": "Mobile",   "color": "#6878B4"},
    "psy":      {"name": "Psy Models",       "short": "Psy",      "color": "#B44D75"},
    "tinkerer": {"name": "Tinkerer",         "short": "Tinkerer", "color": "#C48A2E"},
}
TRACK_ID = {
    "general purpose": "general", "mobile": "mobile",
    "psy models": "psy", "psy": "psy", "tinkerer": "tinkerer",
}


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s or "project"


def adapt(data):
    """Mirror the data.js adapter: same slug + dedupe, same track mapping."""
    seen, out = {}, []
    for i, r in enumerate(data):
        sid = slugify(r.get("project_name"))
        if sid in seen:
            sid = f"{sid}-{i}"
        seen[sid] = True
        track = TRACK_ID.get((r.get("track") or "").lower().strip(), "general")
        links = {}
        if r.get("github"):     links["GitHub"]    = r["github"]
        if r.get("demo_video"): links["Video"]     = r["demo_video"]
        if r.get("live_demo"):  links["Live demo"] = r["live_demo"]
        out.append({
            "id": sid,
            "name": r.get("project_name") or "Untitled",
            "team": r.get("team_name") or None,
            "track": track,
            "category": r.get("category") or "Other",
            "description": (r.get("description") or "").strip(),
            "links": links,
        })
    return out


def meta_desc(text):
    t = re.sub(r"\s+", " ", text).strip()
    return (t[:157] + "...") if len(t) > 160 else t


def js_str(s):
    # safe to embed inside a <script> string literal
    return json.dumps(s).replace("</", "<\\/")


ARROW = '<svg viewBox="0 0 14 14" width="12" fill="none"><path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" stroke-width="1.5"/></svg>'


def link_buttons(links):
    if not links:
        return '<span class="no-links">No links provided.</span>'
    out = []
    for i, (label, url) in enumerate(links.items()):
        cls = "lk primary" if i == 0 else "lk"
        out.append(f'<a class="{cls}" href="{html.escape(url, quote=True)}" '
                   f'target="_blank" rel="noopener">{html.escape(label)} {ARROW}</a>')
    return "".join(out)


def field(k, v):
    return (f'<div class="m-field"><div class="k">{html.escape(k)}</div>'
            f'<div class="v">{v}</div></div>') if v else ""


def page(p):
    t = TRACKS[p["track"]]
    title = f'{p["name"]} · QVAC Hackathon'
    desc = meta_desc(p["description"])
    url = f'{SITE}/projects/{p["id"]}.html'
    e = html.escape
    ea = lambda s: html.escape(s, quote=True)
    fields = (
        field("Team", e(p["team"]) if p["team"] else "")
        + field("Category", e(p["category"]))
        + field("Track", f'<span style="color:{t["color"]}">{e(t["name"])}</span>')
    )
    # real AI cover if present, else the deterministic procedural cover
    has_video = "Video" in p["links"]
    has_live_demo = "Live demo" in p["links"]
    demo_pill = ('<span class="vbadge demo"><svg viewBox="0 0 24 24" fill="none" '
                 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
                 '<path d="M14 3h7v7M21 3l-9 9M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>'
                 '</svg>Demo</span>') if has_live_demo else ""
    video_pill = ('<span class="vbadge"><svg viewBox="0 0 24 24" fill="currentColor">'
                  '<path d="M8 5v14l11-7z"/></svg>Video</span>') if has_video else ""
    badge = (f'<span class="badges">{demo_pill}{video_pill}</span>'
             if (has_live_demo or has_video) else "")
    if (HERE / "covers" / f'{p["id"]}.jpg').exists():
        cover_block = f'<div class="cover"><img src="../covers/{p["id"]}.jpg" alt="{ea(p["name"])} cover" loading="lazy">{badge}</div>'
        cover_script = ""
    else:
        cover_block = f'<div class="cover" id="cover">{badge}</div>'
        cover_script = ('<script src="../cover.js?v=2"></script>\n'
                        '  <script>document.getElementById("cover").innerHTML = '
                        f'window.qvacCover({{ id: {js_str(p["id"])}, name: {js_str(p["name"])} }}, "{t["color"]}");</script>')
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<meta name="description" content="{ea(desc)}">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/svg+xml" href="../assets/qvac-mark.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="QVAC Hackathon">
<meta property="og:title" content="{ea(title)}">
<meta property="og:description" content="{ea(desc)}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{ea(title)}">
<meta name="twitter:description" content="{ea(desc)}">
<style>
  @font-face{{font-family:"Geist";src:url("../assets/Geist.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}}
  :root{{--bg:#161718;--bg2:#171817;--card:#1e1f20;--card2:#252728;--accent:#16e3c1;--ink:#0f1010;--text:#ECF1EE;--muted:#8ca59e;--muted2:#7c7d7e;--line:rgba(48,80,72,.45);--line2:rgba(255,255,255,.06);--r-card:14px;--r-btn:9px;--r-pill:999px}}
  *{{margin:0;padding:0;box-sizing:border-box}}
  body{{font-family:"Geist",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;min-height:100vh;
    background:radial-gradient(900px 460px at 80% -6%,rgba(22,227,193,.07),transparent 60%),linear-gradient(180deg,var(--bg2),var(--bg) 46%)}}
  a{{color:inherit;text-decoration:none}} svg{{display:block}}
  .wrap{{max-width:860px;margin:0 auto;padding:0 24px}}
  header.top{{position:sticky;top:0;z-index:40;backdrop-filter:blur(12px);background:linear-gradient(180deg,rgba(22,24,23,.86),rgba(22,24,23,.62));border-bottom:1px solid var(--line2)}}
  .top-in{{display:flex;align-items:center;justify-content:space-between;height:64px;max-width:860px;margin:0 auto;padding:0 24px}}
  .brand{{display:flex;align-items:center;gap:12px}} .brand .mark{{height:22px}} .brand .sep{{width:1px;height:20px;background:var(--line)}}
  .brand .ed{{font-size:13px;color:var(--muted)}} .brand .ed b{{color:var(--text);font-weight:600}}
  .back{{font-size:13px;font-weight:600;color:var(--muted)}} .back:hover{{color:var(--accent)}}
  main{{padding:26px 0 80px}}
  .cover{{position:relative;aspect-ratio:16/7;border-radius:var(--r-card);overflow:hidden;border:1px solid var(--line2);background:#1b1f1c}}
  .cover .badges{{position:absolute;top:12px;right:12px;display:flex;gap:6px}}
  .cover .vbadge{{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(22,227,193,.92);color:var(--ink)}}
  .cover .vbadge.demo{{background:rgba(15,16,16,.7);color:var(--text);border:1px solid var(--line2);backdrop-filter:blur(4px)}}
  .cover .vbadge svg{{width:11px;height:11px}}
  .cover svg{{width:100%;height:100%;object-fit:cover}}
  .tag{{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 11px;border-radius:var(--r-pill);font-size:12px;font-weight:700;margin:22px 0 0;background:{t["color"]}22;color:{t["color"]}}}
  .tag .sw{{width:7px;height:7px;border-radius:2px;background:{t["color"]}}}
  h1{{font-size:34px;font-weight:700;letter-spacing:-.02em;margin:12px 0 4px}}
  .sub{{color:var(--muted);font-size:14px;min-height:1px}}
  .m-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}}
  .m-field{{background:var(--bg);border:1px solid var(--line2);border-radius:10px;padding:11px 13px}}
  .m-field .k{{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted2)}}
  .m-field .v{{font-size:14px;font-weight:600;margin-top:3px}}
  .desc{{font-size:16px;line-height:1.7;color:#cdd6d1;margin-top:6px;white-space:pre-line}}
  .links{{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}}
  .lk{{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 15px;border-radius:var(--r-btn);background:var(--card2);border:1px solid var(--line2);font-size:13px;font-weight:600;transition:.12s}}
  .lk:hover{{border-color:rgba(22,227,193,.45);color:var(--accent)}} .lk svg{{width:12px;height:12px}}
  .lk.primary{{background:var(--accent);color:var(--ink);border-color:transparent}} .lk.primary:hover{{color:var(--ink);background:#2bf0d0}}
  .no-links{{color:var(--muted2);font-size:14px}}
  .foot{{margin-top:40px;padding-top:22px;border-top:1px solid var(--line2)}}
  .foot a{{font-size:14px;font-weight:600;color:var(--accent)}}
  @media(max-width:640px){{h1{{font-size:27px}}.m-grid{{grid-template-columns:1fr 1fr}}}}
</style>
</head>
<body>
  <header class="top"><div class="top-in">
    <a class="brand" href="../index.html" aria-label="QVAC Hackathon home"><img class="mark" src="../assets/qvac-wordmark.svg" alt="QVAC"><span class="sep"></span><span class="ed">Hackathon <b>Beta Edition</b></span></a>
    <a class="back" href="../index.html">&larr; All projects</a>
  </div></header>

  <div class="wrap"><main>
    {cover_block}
    <span class="tag"><span class="sw"></span>{e(t["name"])}</span>
    <h1>{e(p["name"])}</h1>
    <div class="sub">{("by " + e(p["team"])) if p["team"] else ""}</div>
    <div class="m-grid">{fields}</div>
    <p class="desc">{e(p["description"])}</p>
    <div class="links">{link_buttons(p["links"])}</div>
    <div class="foot"><a href="../index.html">&larr; Back to all projects</a></div>
  </main></div>

  {cover_script}
</body>
</html>
"""


def sitemap(projects):
    urls = [f"{SITE}/"] + [f'{SITE}/projects/{p["id"]}.html' for p in projects]
    body = "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{body}\n</urlset>\n")


def main():
    data = json.loads((HERE / "projects.json").read_text())
    projects = adapt(data)
    OUT.mkdir(exist_ok=True)
    for f in OUT.glob("*.html"):     # clear stale pages (removed projects)
        f.unlink()
    for p in projects:
        (OUT / f"{p['id']}.html").write_text(page(p))
    (HERE / "sitemap.xml").write_text(sitemap(projects))
    print(f"generated {len(projects)} project pages in {OUT}/ + sitemap.xml")
    print("slugs:", ", ".join(p["id"] for p in projects))


if __name__ == "__main__":
    main()
