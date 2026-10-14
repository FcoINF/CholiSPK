/* Buscador superior con sugerencias — compartido por todas las páginas.
   Escritorio: #header-search + #header-suggest. Celular: #m-search + #m-suggest.
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
function headerImg(p) { return p.img + (p.img.indexOf('?') >= 0 ? '&' : '?') + 'width=100'; }
function headerUrl(p) { return 'https://lacholi.cl/products/' + p.h; }
function headerHay(p) { return headerNorm(p.t + ' ' + (p.type || '') + ' ' + (p.tags || []).join(' ')); }
function headerMatchAll(hay, q) { return q.split(/\s+/).filter(Boolean).every(w => hay.indexOf(w) >= 0); }
function hsGoName(boxId) { return boxId === 'm-suggest' ? 'mGoAll()' : 'headerGoAll()'; }
function hsRender(boxId, val) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const q = headerNorm((val || '').trim());
  box._sel = -1; box._term = val; box._matches = [];
  if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  const all = headerData().filter(p => headerMatchAll(headerHay(p), q));
  box._matches = all.slice(0, 7);
  if (!all.length) {
    box.innerHTML = '<div class="px-space-md py-space-md text-center font-body-md text-body-md text-neutral-subtle font-medium">Sin coincidencias — prueba con otra palabra</div>';
    box.classList.remove('hidden');
    return;
  }
  let html = '';
  box._matches.forEach(function (p, i) {
    html += '<a href="' + headerUrl(p) + '" target="_blank" rel="noopener" data-i="' + i + '" class="hs-item flex items-center gap-3 px-space-md py-2.5 hover:bg-vanilla-cream transition-colors border-b border-border-soft/60">'
      + '<img loading="lazy" src="' + headerImg(p) + '" alt="' + headerEsc(p.t) + '" class="w-10 h-10 rounded-lg object-contain bg-bone-white border border-border-soft shrink-0"/>'
      + '<div class="flex-1 min-w-0"><p class="font-label-md text-label-md text-chocolate-brown font-bold truncate">' + headerEsc(p.t) + '</p>'
      + '<p class="font-body-sm text-body-sm text-neutral-subtle capitalize">' + headerEsc(p.type || 'La Choli') + (p.a ? '' : ' · Agotado') + '</p></div>'
      + '<span class="font-price-headline text-price-headline text-charcoal-dark font-extrabold shrink-0">' + (p.p === 0 ? 'Consultar' : headerFmt(p.p)) + '</span></a>';
  });
  html += '<button onclick="' + hsGoName(boxId) + '" type="button" class="w-full text-center font-label-md text-label-md text-salmon-deep hover:bg-salmon-subtle font-bold py-2.5 transition-colors">Ver los ' + all.length + ' resultados en el catálogo</button>';
  box.innerHTML = html;
  box.classList.remove('hidden');
}
function headerSuggest(val) { headerTerm = val; hsRender('header-suggest', val); }
function mSuggest(val) { hsRender('m-suggest', val); }
function hsPaintSel(box) {
  const items = box.querySelectorAll('.hs-item');
  items.forEach(function (el, i) {
    if (i === box._sel) el.classList.add('bg-vanilla-cream');
    else el.classList.remove('bg-vanilla-cream');
  });
}
function hsKey(e, boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  if (e.key === 'Escape') { box.classList.add('hidden'); const r = document.getElementById('m-search-row'); if (boxId === 'm-suggest' && r) r.classList.add('hidden'); return; }
  const list = box._matches || [];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!list.length) return;
    box._sel = e.key === 'ArrowDown' ? ((box._sel + 1) % list.length) : ((box._sel - 1 + list.length) % list.length);
    hsPaintSel(box);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (box._sel >= 0 && list[box._sel]) {
      window.open(headerUrl(list[box._sel]), '_blank');
    } else if (boxId === 'm-suggest') {
      mGoAll();
    } else {
      headerGoAll();
    }
  }
}
function headerSearchKey(e) { hsKey(e, 'header-suggest'); }
function mKey(e) { hsKey(e, 'm-suggest'); }
function hsGoAll(boxId) {
  const box = document.getElementById(boxId);
  const term = box && box._term != null ? box._term : '';
  if (box) box.classList.add('hidden');
  const onCatalog = window.location.pathname.toLowerCase().endsWith('catalogo.html');
  const inp = document.getElementById('product-search');
  if (onCatalog && inp && typeof handleSearch === 'function') {
    inp.value = term;
    handleSearch(term);
    const s = document.getElementById('catalogo');
    if (s) s.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.href = 'catalogo.html?q=' + encodeURIComponent(term);
}
function headerGoAll() { headerTerm = (document.getElementById('header-suggest') || {})._term || headerTerm; hsGoAll('header-suggest'); }
function mGoAll() { hsGoAll('m-suggest'); }
function mToggle(force) {
  const row = document.getElementById('m-search-row');
  if (!row) return;
  const show = typeof force === 'boolean' ? force : row.classList.contains('hidden');
  row.classList.toggle('hidden', !show);
  if (show) {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    setTimeout(function () { const i = document.getElementById('m-search'); if (i) i.focus(); }, 80);
  } else {
    const b = document.getElementById('m-suggest');
    if (b) b.classList.add('hidden');
  }
}
document.addEventListener('click', function (e) {
  ['header-suggest', 'm-suggest'].forEach(function (id) {
    const box = document.getElementById(id);
    if (!box || box.classList.contains('hidden')) return;
    const inputId = id === 'm-suggest' ? 'm-search' : 'header-search';
    if (e.target.closest && (e.target.closest('#' + id) || e.target.closest('#' + inputId))) return;
    box.classList.add('hidden');
  });
});
