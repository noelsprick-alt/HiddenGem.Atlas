#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fotos (Handy-Originale, JPG/HEIC/PNG) -> Web-Bilder + Zuordnung zu Karten-Orten.
Schritt 1:  python3 scripts/process_photos.py scan  <ordner>   -> images/photos/*.webp (+ t/ Vorschau), photos-index.json, Kontaktbögen
Schritt 2:  python3 scripts/process_photos.py apply [--gallery all|<datei mit Dateinamen>]  -> data/content.json (Ort-Galerien + Fotografie-Galerie)
GPS/EXIF wird NICHT in die Web-Bilder übernommen (Datenschutz)."""
import sys, os, io, re, json, math, hashlib, subprocess, glob
from PIL import Image, ImageOps, ImageDraw
try:
    import pillow_heif; pillow_heif.register_heif_opener()
except Exception: pass
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'images', 'photos'); IDX = os.path.join(ROOT, 'photos-index.json')
MAXD, TH, MATCH_M = 1600, 480, 400
def dms(v, ref):
    d = float(v[0]) + float(v[1]) / 60 + float(v[2]) / 3600
    return -d if ref in ('S', 'W') else d
def exif(im):
    ex = im.getexif(); lat = lon = None; date = ''
    try:
        g = ex.get_ifd(0x8825)
        if g and 2 in g and 4 in g: lat, lon = dms(g[2], g.get(1, 'N')), dms(g[4], g.get(3, 'E'))
        e = ex.get_ifd(0x8769); date = str(e.get(36867) or ex.get(306) or '')
    except Exception: pass
    return lat, lon, date
def hav(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1] - a[1])
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))
def places():
    P = []
    for f in ('moments-extra.json', 'moments-world.json'):
        p = os.path.join(ROOT, 'data', f)
        if os.path.exists(p): P += json.load(open(p, encoding='utf-8'))
    js = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    a = js.index('const MOMENTS'); b = js.index('];', a)
    code = 'var MOMENTS' + js[a + len('const MOMENTS'):b + 2].lstrip() + '\nconsole.log(JSON.stringify(MOMENTS.filter(Boolean)))'
    import tempfile
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf: tf.write(code)
    r = subprocess.run(['node', tf.name], capture_output=True, text=True, encoding='utf-8'); os.unlink(tf.name)
    if r.stdout: P += json.loads(r.stdout)
    return [p for p in P if 'lat' in p and 'lon' in p]
def scan(src):
    os.makedirs(os.path.join(OUT, 't'), exist_ok=True)
    P = places(); res = []
    files = sorted(f for f in glob.glob(os.path.join(src, '**', '*'), recursive=True) if re.search(r'\.(jpe?g|png|heic|heif|webp)$', f, re.I))
    for f in files:
        try:
            im = Image.open(f); lat, lon, date = exif(im); im = ImageOps.exif_transpose(im).convert('RGB')
        except Exception as e:
            print('übersprungen', f, e); continue
        h = hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8]
        name = (re.sub(r'\D', '', date)[:8] or 'foto') + '-' + h
        big = im.copy(); big.thumbnail((MAXD, MAXD)); big.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        th = im.copy(); th.thumbnail((TH, TH)); th.save(os.path.join(OUT, 't', name + '.webp'), 'WEBP', quality=72, method=6)
        m = None
        if lat is not None:
            best = min(P, key=lambda p: hav((lat, lon), (p['lat'], p['lon']))) if P else None
            if best:
                d = hav((lat, lon), (best['lat'], best['lon']))
                # eigene Hidden Gems bevorzugen, wenn nahe genug
                gems = [p for p in P if p.get('kind') == 'gem' and hav((lat, lon), (p['lat'], p['lon'])) < MATCH_M]
                if gems: best = min(gems, key=lambda p: hav((lat, lon), (p['lat'], p['lon']))); d = hav((lat, lon), (best['lat'], best['lon']))
                m = {'id': best['id'], 'name': best.get('city') or best.get('title'), 'dist': round(d), 'ok': d <= MATCH_M}
        res.append({'file': name + '.webp', 'src': os.path.basename(f), 'lat': lat, 'lon': lon, 'date': date, 'match': m})
        print(name, 'GPS' if lat is not None else 'kein GPS', (m or {}).get('name', ''), (m or {}).get('dist', ''))
    json.dump(res, open(IDX, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # Kontaktbögen (5x4) zum schnellen Durchsehen
    for i in range(0, len(res), 20):
        sh = Image.new('RGB', (5 * 300, 4 * 230), 'white'); d = ImageDraw.Draw(sh)
        for j, r in enumerate(res[i:i + 20]):
            t = Image.open(os.path.join(OUT, 't', r['file'])); t.thumbnail((290, 200)); x, y = (j % 5) * 300, (j // 5) * 230
            sh.paste(t, (x + 5, y + 5)); d.text((x + 5, y + 208), str(i + j) + ' ' + ((r['match'] or {}).get('name') or '-')[:34], fill='black')
        sh.save(os.path.join(os.path.dirname(IDX), 'contact-%02d.jpg' % (i // 20)), quality=80)
    ok = sum(1 for r in res if r['match'] and r['match']['ok'])
    print('Fertig: %d Fotos, %d mit Ort (<%d m), %d ohne GPS/Ort' % (len(res), ok, MATCH_M, len(res) - ok))
def apply(gallery='all'):
    cp = os.path.join(ROOT, 'data', 'content.json'); c = json.load(open(cp, encoding='utf-8')); det = c.setdefault('detail', {})
    res = json.load(open(IDX, encoding='utf-8'))
    only = None
    if gallery != 'all': only = set(x.strip() for x in open(gallery) if x.strip())
    add = lambda key, path: (lambda cur: (cur.setdefault('photos', []).append(path) if path not in cur['photos'] else None))(det.setdefault(key, {'photos': []}) if 'photos' not in det.get(key, {}) else det[key])
    n1 = n2 = 0
    for r in res:
        path = 'images/photos/' + r['file']
        m = r.get('match')
        if m and m['ok']: add('moment-' + m['id'], path); n1 += 1
        if only is None or r['file'] in only or r['src'] in only: add('pillar-fotografie', path); n2 += 1
    json.dump(c, open(cp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('Ort-Galerien: %d, Fotografie-Galerie: %d' % (n1, n2))
if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'scan': scan(sys.argv[2])
    elif len(sys.argv) > 1 and sys.argv[1] == 'apply': apply(sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--gallery' else 'all')
    else: print(__doc__)
