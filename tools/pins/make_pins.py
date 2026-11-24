"""Pinterest-Pins (1000x1500) + Bulk-CSV + RSS-Feed für alle Guides mit eigenem Titelbild.

python3 tools/pins/make_pins.py            -> erzeugt fehlende social/pins/pin-<slug>-guide.jpg,
                                              social/pins/pinterest-bulk-upload.csv und pinterest.xml
Neuer Guide = JSON + Titelbild, dann dieses Skript erneut laufen lassen. Bestehende Pins werden nicht überschrieben.
"""
import csv, glob, json, os, re, sys
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FD = os.path.dirname(os.path.abspath(__file__))
m = re.search(r"BASE = process\.env\.SITE_URL \|\| '([^']+)'", open(os.path.join(ROOT, 'scripts/build-seo.mjs'), encoding='utf-8').read())
BASE = m.group(1)
BOARD = 'Free City Travel Guides'
START = datetime(2026, 11, 26, 17, 0)          # erster Termin, danach 3 Pins pro Tag
SLOTS = [(9, 0), (13, 0), (17, 0)]
W, H = 1000, 1500
YEL, DARK, WHITE = (255, 212, 31), (28, 20, 14), (255, 255, 255)
F = lambda w, s: ImageFont.truetype(os.path.join(FD, f'poppins-latin-{w}-normal.woff'), s)


def fit(w, text, maxw, start):
    s = start
    while s > 20 and F(w, s).getlength(text) > maxw:
        s -= 2
    return F(w, s)


def pin(src, city, n, out):
    im = Image.open(os.path.join(ROOT, src)).convert('RGB')
    ph = 1140
    sw, sh = im.size
    scale = max(W / sw, ph / sh)
    im = im.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)
    x0, y0 = (im.width - W) // 2, (im.height - ph) // 2
    im = im.crop((x0, y0, x0 + W, y0 + ph))
    can = Image.new('RGB', (W, H), DARK)
    can.paste(im, (0, 0))
    grad = Image.new('L', (W, 420), 0)
    gd = ImageDraw.Draw(grad)
    for i in range(420):
        gd.line((0, i, W, i), fill=int(255 * (i / 420) ** 1.6))
    can.paste(Image.new('RGB', (W, 420), DARK), (0, ph - 420), grad)
    d = ImageDraw.Draw(can)
    # Badge oben
    bf = F(800, 38); bt = 'FREE TRAVEL GUIDE'; bw = bf.getlength(bt) + 64
    d.rounded_rectangle(((W - bw) / 2, 52, (W + bw) / 2, 122), 35, fill=YEL)
    d.text((W / 2, 87), bt, font=bf, fill=DARK, anchor='mm')
    # Stadt + Zeilen
    cf = fit(800, city.upper(), 900, 150)
    y = 1050
    sh_ = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh_).text((W / 2 + 4, y + 6), city.upper(), font=cf, fill=200, anchor='ms')
    can.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), sh_.filter(ImageFilter.GaussianBlur(8)))
    d.text((W / 2, y), city.upper(), font=cf, fill=YEL, anchor='ms')
    d.text((W / 2, y + 70), f'{n} hidden gems & must-sees', font=fit(700, f'{n} hidden gems & must-sees', 880, 54), fill=WHITE, anchor='ms')
    d.text((W / 2, y + 175), 'Hidden gems · Free things · Google Maps', font=F(600, 38), fill=WHITE, anchor='ms')
    d.text((W / 2, y + 245), 'FREE GUIDE · hiddengem.atlas', font=F(700, 38), fill=YEL, anchor='ms')
    can.save(os.path.join(ROOT, out), quality=88, optimize=True)


rows, items = [], []
guides = [json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(os.path.join(ROOT, 'data/guides/*.json')))]
t = START; slot = SLOTS.index((START.hour, START.minute))
for g in guides:
    se, city = g['slug_en'], g.get('city_en') or g['city']
    spots = [s for b in g.get('blocks', []) for s in b.get('spots', [])]
    n, free = len(spots), sum(1 for s in spots if s.get('free'))
    out = f'social/pins/pin-{se}-guide.jpg'
    if not os.path.exists(os.path.join(ROOT, out)):
        if not g.get('hero') or not os.path.exists(os.path.join(ROOT, g['hero'])):
            print('kein Titelbild, übersprungen:', se); continue
        pin(g['hero'], city, n, out); print('neu:', out)
    link = f'{BASE}en/guide/{se}/'
    desc = (f'Free {city} travel guide by a 9-to-5 traveler: {n} spots with hidden gems'
            + (f', {free} free things to do' if free else '') +
            ', a day plan, getting there and a one-tap export to Google Maps. Available in English, German and Spanish.')
    kw = f'{city} travel guide, things to do in {city}, {city} hidden gems, free things to do {city}, {city} itinerary'
    rows.append([f'{city} Travel Guide: {n} Hidden Gems & Must-Sees', BASE + out, BOARD, '', desc,
                 link + '?utm_source=pinterest&utm_medium=social', t.strftime('%Y-%m-%dT%H:%M:%S'), kw])
    items.append((f'{city} Travel Guide: {n} Hidden Gems & Must-Sees', link, desc, BASE + out, g.get('updated', '2026-11-10')))
    slot += 1
    if slot >= len(SLOTS):
        slot = 0; t = (t + timedelta(days=1))
    t = t.replace(hour=SLOTS[slot][0], minute=SLOTS[slot][1])

with open(os.path.join(ROOT, 'social/pins/pinterest-bulk-upload.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords']); w.writerows(rows)

esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
feed = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>',
        f'<title>HiddenGem.Atlas – Free City Travel Guides</title><link>{BASE}</link>',
        '<description>Free city travel guides by Noel: hidden gems, day plans and Google Maps lists.</description><language>en</language>']
for title, link, desc, img, upd in items:
    dt = datetime.strptime(upd, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    feed.append(f'<item><title>{esc(title)}</title><link>{esc(link)}?utm_source=pinterest&amp;utm_medium=rss</link><guid isPermaLink="false">{esc(link)}</guid>'
                f'<description>{esc(desc)}</description><pubDate>{format_datetime(dt)}</pubDate>'
                f'<enclosure url="{esc(img)}" type="image/jpeg" length="0"/><media:content url="{esc(img)}" medium="image" type="image/jpeg"/></item>')
feed.append('</channel></rss>')
open(os.path.join(ROOT, 'pinterest.xml'), 'w', encoding='utf-8').write('\n'.join(feed) + '\n')
print(f'CSV: {len(rows)} Pins · Feed: {len(items)} Einträge · Basis {BASE}')
