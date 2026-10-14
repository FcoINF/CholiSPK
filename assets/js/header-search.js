/* Buscador superior con sugerencias — compartido por todas las páginas.
   Usa LACHOLI_SUGGEST si existe, si no LACHOLI_PRODUCTS. */
var headerSelIdx = -1, headerMatches = [], headerTotal = 0, headerTerm = '';
function headerData() {
  if (typeof LACHOLI_SUGGEST !== 'undefined' && LACHOLI_SUGGEST) return LACHOLI_SUGGEST;
  if (typeof LACHOLI_PRODUCTS !== 'undefined' && LACHOLI_PRODUCTS) return LACHOLI_PRODUCTS;
  return [];
}
function headerNorm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function headerEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function headerFmt(n) { return '$' + Number(n).toLocaleString('es-CL'); }
function headerHay(p) { return headerNorm(p.t + ' ' + (p.type || '') + ' ' + (p.tags || []).join(' ')); }
function headerMatchAll(hay, q) { return q.split(/\s+/).filter(Boolean).every(w => hay.indexOf(w) >= 0); }
function headerImg(p) { return p.img + (p.img.indexOf('?') >= 0 ? '&' : '?') + 'width=100'; }
function headerUrl(p) { return 'https://lacholi.cl/products/' + p.h; }
function headerSuggest(val) {
  const box = document.getElementById('header-suggest');
  if (!box) return;
  const q = headerNorm(val.trim());
  headerSelIdx = -1; headerTerm = val;
  if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  const all = headerData().filter(p => headerMatchAll(headerHay(p), q));
  headerTotal = all.length;
  headerMatches = all.slice(0, 7);
  if (!all.length) {
    box.innerHTML = '<div class="px-space-md py-space-md text-center font-body-md text-body-md text-neutral-subtle font-medium">Sin coincidencias — prueba con otra palabra</div>';
    box.classList.remove('hidden');
    return;
  }
  let html = '';
  headerMatches.forEach(function (p, i) {
    html += '<a href="' + headerUrl(p) + '" target="_blank" rel="noopener" data-i="' + i + '" class="hs-item flex items-center gap-3 px-space-md py-2.5 hover:bg-vanilla-cream transition-colors border-b border-border-soft/60">'
      + '<img loading="lazy" src="' + headerImg(p) + '" alt="' + headerEsc(p.t) + '" class="w-10 h-10 rounded-lg object-contain bg-bone-white border border-border-soft shrink-0"/>'
      + '<div class="flex-1 min-w-0"><p class="font-label-md text-label-md text-chocolate-brown font-bold truncate">' + headerEsc(p.t) + '</p>'
      + '<p class="font-body-sm text-body-sm text-neutral-subtle capitalize">' + headerEsc(p.type || 'La Choli') + (p.a ? '' : ' · Agotado') + '</p></div>'
      + '<span class="font-price-headline text-price-headline text-charcoal-dark font-extrabold shrink-0">' + (p.p === 0 ? 'Consultar' : headerFmt(p.p)) + '</span></a>';
  });
  html += '<button onclick="headerGoAll()" type="button" class="w-full text-center font-label-md text-label-md text-salmon-deep hover:bg-salmon-subtle font-bold py-2.5 transition-colors">Ver los ' + headerTotal + ' resultados en el catálogo</button>';
  box.innerHTML = html;
  box.classList.remove('hidden');
}
function headerPaintSel() {
  const items = document.querySelectorAll('#header-suggest .hs-item');
  items.forEach(function (el, i) {
    if (i === headerSelIdx) el.classList.add('bg-vanilla-cream');
    else el.classList.remove('bg-vanilla-cream');
  });
}
function headerSearchKey(e) {
  const box = document.getElementById('header-suggest');
  if (e.key === 'Escape') { if (box) box.classList.add('hidden'); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = headerMatches.length;
    if (!n) return;
    headerSelIdx = e.key === 'ArrowDown' ? (headerSelIdx + 1) % n : (headerSelIdx - 1 + n) % n;
    headerPaintSel();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (headerSelIdx >= 0 && headerMatches[headerSelIdx]) {
      window.open(headerUrl(headerMatches[headerSelIdx]), '_blank');
    } else {
      headerGoAll();
    }
  }
}
function headerGoAll() {
  const box = document.getElementById('header-suggest');
  if (box) box.classList.add('hidden');
  const onCatalog = window.location.pathname.toLowerCase().endsWith('catalogo.html');
  const inp = document.getElementById('product-search');
  if (onCatalog && inp && typeof handleSearch === 'function') {
    inp.value = headerTerm;
    handleSearch(headerTerm);
    const s = document.getElementById('catalogo');
    if (s) s.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.href = 'catalogo.html?q=' + encodeURIComponent(headerTerm);
}
document.addEventListener('click', function (e) {
  const box = document.getElementById('header-suggest');
  if (!box || box.classList.contains('hidden')) return;
  if (e.target.closest && (e.target.closest('#header-suggest') || e.target.closest('#header-search'))) return;
  box.classList.add('hidden');
});
