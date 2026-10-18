import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const output = resolve('dist');
const base = (process.env.WEBSITE_BASE || '/').replace(/\/$/, '') + '/';
const origin = new URL(process.env.WEBSITE_ORIGIN || 'https://www.dantongli.com').origin;
const indexable = process.env.WEBSITE_INDEXABLE === 'true';
// Approved migration inventory: title, ordered authors, year and primary source.
const approved = [
  ['fermionic-permutation', 'Asymptotically Optimal Depth Fermionic Permutation on 2D Grid Quantum Architecture without Ancillas', ['Dantong Li', 'Shifan Xu', 'Yongshan Ding'], 2026, 'https://arxiv.org/abs/2605.26041'],
  ['logical-error-management', 'Co-Designing Error Mitigation and Error Detection for Logical Qubits', ['Rohan S. Kumar', 'Takahiro Tsunoda', 'Sophia H. Xue', 'Dantong Li', 'Robert J. Schoelkopf', 'Yongshan Ding'], 2026, 'https://arxiv.org/abs/2604.19871'],
  ['local-optimization', 'Local Optimization of Quantum Circuits', ['Jatin Arora', 'Mingkuan Xu', 'Sam Westrick', 'Pengyu Liu', 'Dantong Li', 'Yongshan Ding', 'Umut A. Acar'], 2025, 'https://mingkuan.taichi.graphics/publication/2025-oac/'],
  ['generalized-hadamard', 'Efficient Quantum Gradient and Higher-order Derivative Estimation via Generalized Hadamard Test', ['Dantong Li', 'Dikshant Dulal', 'Mykhailo Ohorodnikov', 'Hanrui Wang', 'Yongshan Ding'], 2025, 'https://arxiv.org/abs/2408.05406'],
  ['transformer-qec', 'Transformer-QEC: Quantum Error Correction Code Decoding with Transferable Transformers', ['Hanrui Wang', 'Pengyu Liu', 'Kevin Shao', 'Dantong Li', 'Jiaqi Gu', 'David Z. Pan', 'Yongshan Ding', 'Song Han'], 2023, 'https://arxiv.org/abs/2311.16082'],
  ['quantummeasurementsincompatibility', 'Measuring incompatibility and clustering quantum observables with a quantum switch', ['Ning Gao', 'Dantong Li', 'Anchit Mishra', 'Junchen Yan', 'Kyrylo Simonov', 'Giulio Chiribella'], 2023, 'https://doi.org/10.1103/PhysRevLett.130.170201'],
];
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi, entity => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  return named[entity.toLowerCase()] ?? String.fromCodePoint(parseInt(entity.slice(2, -1).replace(/^x/i, ''), entity[2].toLowerCase() === 'x' ? 16 : 10));
});
const text = value => decode(value.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const files = (await readdir(output, { recursive: true, withFileTypes: true }))
  .filter(file => file.isFile()).map(file => relative(output, resolve(file.parentPath, file.name)).split(sep).join('/'));
const fileSet = new Set(files);
const htmlFiles = files.filter(file => file.endsWith('.html'));
for (const required of ['index.html', 'about/index.html', 'publication/index.html', '404.html']) assert(fileSet.has(required), `Missing main route: ${required}`);
const htmlByFile = new Map(await Promise.all(htmlFiles.map(async file => [file, await readFile(resolve(output,file),'utf8')])));
let localLinks = 0;
let cssAssets = 0;
function pageFile(path) {
  const raw = decodeURIComponent(path).replace(/^\//,'');
  const candidates = [raw, `${raw.replace(/\/$/,'')}/index.html`];
  if (!raw) candidates.push('index.html');
  return candidates.find(candidate => fileSet.has(candidate));
}
for (const [file,html] of htmlByFile) {
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length, 1, `${file}: one page heading`);
  assert(!html.includes('Quantum-Inspired Fidelity-based Divergence'), `${file}: excluded paper`);
  assert(!/AgentSkills|Ph\.D\. Student|2027/.test(html), `${file}: stale profile claim`);
  const blocked = /<meta\b(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*noindex)[^>]*>/i.test(html);
  assert.equal(blocked, !indexable || ['404.html','instagram/index.html'].includes(file), `${file}: expected ${indexable ? 'release' : 'preview'} indexing policy`);
  assert(!/<dialog(?:\s|>)/.test(html) && !/role="(?:alertdialog|dialog)"/.test(html), `${file}: content must remain in the page, without modal windows`);
  const canonical = html.match(/<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>/i)?.[1];
  assert(canonical, `${file}: canonical URL`);
  const canonicalUrl = new URL(decode(canonical));
  assert.equal(canonicalUrl.origin, origin, `${file}: canonical origin`);
  assert(canonicalUrl.pathname.startsWith(base), `${file}: canonical base`);
  for (const [,attribute,value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const decoded=decode(value);
    assert(!/^javascript:/i.test(decoded), `${file}: script URL`);
    if (/^(?:https?:|mailto:|data:|tel:)/i.test(decoded)) continue;
    const pagePath = base + (file==='index.html'?'':file.replace(/index\.html$/,''));
    const url = new URL(decoded, `https://build.invalid${pagePath}`);
    assert.equal(url.origin, 'https://build.invalid', `${file}: unexpected external ${attribute} ${decoded}`);
    assert(url.pathname.startsWith(base), `${file}: ${attribute} ${decoded} omits preview base ${base}`);
    const target = pageFile(url.pathname.slice(base.length));
    assert(target, `${file}: missing or wrong-case ${attribute} ${decoded}`);
    if (url.hash && htmlByFile.has(target)) {
      const id=decodeURIComponent(url.hash.slice(1));
      assert(htmlByFile.get(target).includes(`id="${id}"`), `${file}: missing anchor ${decoded}`);
    }
    localLinks++;
  }
}
function verifyCss(css, file, sourcePath) {
  for (const [, , value] of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gs)) {
    const decoded = value.trim();
    if (/^(?:https?:|data:|#)/i.test(decoded)) continue;
    const url = new URL(decoded, `https://build.invalid${sourcePath}`);
    assert.equal(url.origin, 'https://build.invalid', `${file}: unexpected external CSS asset ${decoded}`);
    assert(url.pathname.startsWith(base), `${file}: CSS asset ${decoded} omits base ${base}`);
    assert(pageFile(url.pathname.slice(base.length)), `${file}: missing or wrong-case CSS asset ${decoded}`);
    cssAssets++;
  }
}
for (const file of files.filter(file => file.endsWith('.css'))) verifyCss(await readFile(resolve(output, file), 'utf8'), file, `${base}${file}`);
for (const [file, html] of htmlByFile) {
  const sourcePath = base + (file === 'index.html' ? '' : file.replace(/index\.html$/, ''));
  for (const [, css] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) verifyCss(css, file, sourcePath);
}
const paperFiles=htmlFiles.filter(file=>/^publication\/[^/]+\/index\.html$/.test(file)&&!file.includes('QuantumMeasurementsIncompatibility'));
assert.equal(paperFiles.length,6,'Exactly six approved papers.');
const archive=htmlByFile.get('publication/index.html');
for (const [id,title,authors,year,source] of approved) {
  const file=`publication/${id}/index.html`;
  const html=htmlByFile.get(file);
  assert(html, `${id}: paper route`);
  assert.equal(text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] || ''), title, `${id}: full title`);
  assert.equal(text(html.match(/<p\b[^>]*class="authors"[^>]*>([\s\S]*?)<\/p>/)?.[1] || ''), authors.join(', '), `${id}: ordered authors`);
  assert(html.includes(`href="${source}"`), `${id}: original source`);
  assert(archive.includes(`href="${base}publication/${id}/"`), `${id}: direct archive route`);
  assert(html.includes(`href="${base}publication/${id}/cite.bib"`), `${id}: citation download`);
  const bib=await readFile(resolve(output,`publication/${id}/cite.bib`),'utf8');
  assert(bib.includes(title) && bib.includes(authors.join(' and ')), `${id}: citation title and author order`);
  assert(bib.includes(`year = {${year}}`) && bib.includes(source), `${id}: citation year and source`);
  const linkedData=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  const article=linkedData.find(data=>data['@type']==='ScholarlyArticle');
  assert(article && article.headline===title && article.url===source, `${id}: machine-readable article`);
  assert.deepEqual(article.author.map(author=>author.name), authors, `${id}: machine-readable author order`);
}
const prl=htmlByFile.get('publication/quantummeasurementsincompatibility/index.html');
assert(prl?.includes('Physical Review Letters 130, 170201 (2023)'), 'Retain PRL route with corrected journal citation.');
assert(prl.includes('MED = sin(45°) / √2 = 0.5'), 'Static, useful initial MED result.');
assert(prl.includes('complete-link'), 'Grouping scope must remain explicit.');
const prlBib=await readFile(resolve(output,'publication/quantummeasurementsincompatibility/cite.bib'),'utf8');
assert(prlBib.includes('10.1103/PhysRevLett.130.170201') && /year\s*=\s*\{2023\}/.test(prlBib), 'Corrected PRL BibTeX.');
assert(fileSet.has('uploads/resume-dantong-li.pdf'), 'Retain canonical legacy CV URL.');
for (const path of ['tag/quantum_measurements/index.html','publication-type/2/index.html','publication_types/index.html','tags/index.html']) assert(fileSet.has(path), `Legacy route remains reachable: ${path}`);
const about=htmlByFile.get('about/index.html');
assert(about.includes('2028')&&about.includes('en route, 2024'), 'Approved education wording.');
assert(about.includes('Graph neural networks')&&about.includes('Computational statistics'), 'Approved combined Skills.');
assert(about.includes('Ph.D. Candidate')&&!/fairseq/i.test(about), 'Approved candidate status and current skills.');
assert(!about.includes('resume-dantong-li.pdf'), 'Do not present the retained old CV as the approved résumé.');
const robots=await readFile(resolve(output,'robots.txt'),'utf8');
assert.equal(robots,indexable?'User-agent: *\nAllow: /\n':'User-agent: *\nDisallow: /\n','Matching robots policy.');
if (process.platform!=='win32') {
  for (const [canonical,alias] of [
    ['uploads/resume-dantong-li.pdf','uploads/Resume-Dantong-Li.pdf'],
    ['publication/quantummeasurementsincompatibility/index.html','publication/QuantumMeasurementsIncompatibility/index.html'],
    ['publication/quantummeasurementsincompatibility/cite.bib','publication/QuantumMeasurementsIncompatibility/cite.bib'],
    ['publication/quantummeasurementsincompatibility/featured.png','publication/QuantumMeasurementsIncompatibility/featured.png'],
  ]) {
    assert(fileSet.has(alias),`Missing exact-case compatibility file ${alias}`);
    assert((await readFile(resolve(output,canonical))).equals(await readFile(resolve(output,alias))),`Compatibility bytes differ: ${alias}`);
  }
}
console.log(JSON.stringify({status:'passed',base,origin,htmlPages:htmlFiles.length,approvedPapers:paperFiles.length,localLinks,cssAssets,staticContent:true,indexable,caseAliases:process.platform==='win32'?'requires Linux workflow':'passed'},null,2));
