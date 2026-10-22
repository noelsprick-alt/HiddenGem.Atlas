#!/usr/bin/env node
// Meldet neue/geänderte Seiten per IndexNow an Bing (und Yandex, Seznam, Naver, Yep).
// Aufruf:  node scripts/indexnow.mjs <datei-mit-geänderten-pfaden>   oder   node scripts/indexnow.mjs --all
import fs from 'node:fs';
const KEY = '3b437570558daf81410deb19495a48ea';
const BASE = 'https://noelsprick-alt.github.io/HiddenGem.Atlas/';
const HOST = 'noelsprick-alt.github.io';
let urls = [];
if (process.argv[2] === '--all') {
  urls = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
} else if (process.argv[2] && fs.existsSync(process.argv[2])) {
  urls = fs.readFileSync(process.argv[2], 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
    .map((p) => (p === 'index.html' ? BASE : /index\.html$/.test(p) ? BASE + p.replace(/index\.html$/, '') : null)).filter(Boolean);
}
urls = [...new Set(urls)].slice(0, 10000);
if (!urls.length) { console.log('IndexNow: nichts zu melden'); process.exit(0); }
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: BASE + KEY + '.txt', urlList: urls }),
});
console.log('IndexNow:', urls.length, 'URLs ->', res.status, res.statusText);
