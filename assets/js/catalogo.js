/* Catálogo completo La Choli — renders LACHOLI_PRODUCTS (products-data.js) with search/filter/sort/pagination.
   Same look & behavior as index.html featured catalog. */
const PER_PAGE = 24;
const CAT_STATE = { filter: 'all', search: '', sort: 'featured', maxPrice: 27000, hideOut: false, page: 1 };

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function catsOf(p) {
  let t = (p.type || '').toLowerCase().trim();
  if (!t && p.tags) {
    const tg = p.tags.join(' ').toLowerCase();
    if (tg.includes('molde')) t = 'molde de silicona';
    else if (tg.includes('cortador')) t = 'cortador de galletas';
    else if (tg.includes('sprinkle') || tg.includes('glitter')) t = 'sprinkles';
    else if (tg.includes('globo') || tg.includes('vela') || tg.includes('cotill')) t = 'globos';
    else if (tg.includes('caja') || tg.includes('papel') || tg.includes('sticker')) t = 'papel para alfajor';
    else if (tg.includes('chocolate') || tg.includes('cobertura')) t = 'chocolates';
  }
  let cats = [];
  if (t.startsWith('molde')) cats.push('moldes');
  else if (t.includes('cortador') || t.includes('multicortador')) cats.push('cortadores');
  else if (t === 'sprinkles' || t === 'glitter') cats.push('sprinkles');
  else if (t === 'chocolates' || t === 'crema de avellanas') cats.push('chocolates');
  else if (['globos', 'arco de globos', 'velas', 'topper', 'set decoración', 'cortina cumpleaños', 'banderín', 'cookie card', 'set cotillón', 'inflador de globos', 'pegamento de globos', 'corona', 'vasos shot', 'vasos desechables', 'pocillo desechable', 'plato plástico', 'plato cartón', 'servilletas'].includes(t)) cats.push('cotillon');
  else if (t.startsWith('papel') || t.startsWith('bandeja') || t === 'tulipas' || t.startsWith('caja') || t === 'stickers' || t.startsWith('etiqueta') || t.startsWith('alambre') || t.startsWith('cinta') || t.startsWith('calendario') || t.startsWith('stack')) cats.push('empaques');
  else cats.push('reposteria');
  const hay = norm(p.t + ' ' + (p.tags || []).join(' ') + ' ' + (p.type || ''));
  if (/halloween|bruj|calabaza|fantasma|murcielago|terror|truco o trato|vampiro|arana|monster/.test(hay)) cats.push('halloween');
  return cats;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-CL');
}

function imgUrl(p) {
  if (!p.img) return '';
  return p.img + (p.img.includes('?') ? '&' : '?') + 'width=600';
}

function productUrl(p) {
  return 'https://lacholi.cl/products/' + p.h;
}

function customRules() { return (typeof window !== 'undefined' && window.CATALOG_FILTERS) || null; }

function matchRule(p, key) {
  const rules = customRules();
  if (!rules) return catsOf(p).includes(key);
  const r = rules.find(x => x.key === key);
  if (!r) return false;
  const t = (p.type || '').toLowerCase().trim();
  if ((r.types || []).includes(t)) return true;
  if ((r.starts || []).some(s => t.startsWith(s))) return true;
  const hay = norm(p.t + ' ' + (p.tags || []).join(' ') + ' ' + (p.type || ''));
  return (r.kw || []).some(k => hay.includes(norm(k)));
}

function buildCustomChips() {
  const rules = customRules();
  if (!rules) return;
  const box = document.getElementById('filter-chips');
  if (!box) return;
  const active = 'filter-btn active bg-salmon-primary text-charcoal-dark font-label-md text-label-md px-space-md py-1.5 rounded-full transition-all font-bold shadow-xs';
  const cls = 'filter-btn bg-bone-white border border-border-soft text-chocolate-brown hover:bg-salmon-subtle font-label-md text-label-md px-space-md py-1.5 rounded-full transition-all font-semibold';
  let html = '<button class="' + active + '" data-filter="all" onclick="applyFilter(' + "'all'" + ', this)" type="button">Todos</button>'
    + '<button class="' + cls + '" data-filter="stock" onclick="applyFilter(' + "'stock'" + ', this)" type="button">Solo En Stock</button>';
  rules.forEach(function (r) {
    html += '<button class="' + cls + '" data-filter="' + r.key + '" onclick="applyFilter(' + "'" + r.key + "'" + ', this)" type="button">' + r.label + '</button>';
  });
  box.innerHTML = html;
}

function filteredProducts() {
  const q = norm(CAT_STATE.search.trim());
  let list = LACHOLI_PRODUCTS.filter(p => {
    if (CAT_STATE.filter === 'stock') { if (!p.a) return false; }
    else if (CAT_STATE.filter !== 'all') { if (!matchRule(p, CAT_STATE.filter)) return false; }
    if (CAT_STATE.hideOut && !p.a) return false;
    if (p.p > CAT_STATE.maxPrice) return false;
    if (q) {
      const hay = norm(p.t + ' ' + (p.type || '') + ' ' + (p.tags || []).join(' '));
      const ok = q.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
      if (!ok) return false;
    }
    return true;
  });
  if (CAT_STATE.sort === 'price-asc') list = list.slice().sort((a, b) => a.p - b.p);
  else if (CAT_STATE.sort === 'price-desc') list = list.slice().sort((a, b) => b.p - a.p);
  else if (CAT_STATE.sort === 'alpha') list = list.slice().sort((a, b) => String(a.t).localeCompare(String(b.t), 'es'));
  return list;
}

function badgeFor(p, cats) {
  if (!p.a) return '<span class="absolute top-2 left-2 bg-badge-agotado-bg text-badge-agotado-text font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Agotado</span>';
  if (p.c && p.c > p.p) {
    const off = Math.round((1 - p.p / p.c) * 100);
    return '<span class="absolute top-2 left-2 bg-badge-oferta-bg text-badge-oferta-text font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Oferta -' + off + '%</span>';
  }
  if (cats.includes('halloween')) return '<span class="absolute top-2 left-2 bg-[#241228] text-[#FFB066] border border-[#FF9E4A]/40 font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">🎃 Halloween</span>';
  return '<span class="absolute top-2 left-2 bg-mint-accent text-mint-deep font-label-sm text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shadow-xs">Disponible</span>';
}

function cardHtml(p, idx) {
  const cats = catsOf(p);
  const avail = !!p.a;
  const priceTxt = p.p === 0 ? 'Consultar' : fmt(p.p);
  const compareTxt = (p.c && p.c > p.p) ? '<span class="font-body-sm text-[11px] text-neutral-subtle line-through font-medium">' + fmt(p.c) + '</span>' : '<span class="font-body-sm text-[11px] text-neutral-subtle font-medium">' + esc(p.type || 'La Choli') + '</span>';
  const btn = !avail
    ? '<button class="w-full mt-2 bg-badge-agotado-bg text-badge-agotado-text font-label-md text-label-md py-2 rounded-full cursor-not-allowed flex items-center justify-center gap-1 font-semibold" disabled type="button"><span class="material-symbols-outlined text-[16px]">do_not_disturb_on</span><span>Agotado</span></button>'
    : (p.p === 0
      ? '<a class="w-full mt-2 bg-vanilla-cream hover:bg-vanilla-cream/80 text-chocolate-brown font-label-md text-label-md py-2 rounded-full transition-all flex items-center justify-center gap-1 font-bold border border-border-soft" target="_blank" rel="noopener" href="' + productUrl(p) + '"><span class="material-symbols-outlined text-[16px]">visibility</span><span>Ver producto</span></a>'
      : '<button class="w-full mt-2 bg-mint-accent hover:bg-mint-light text-mint-deep font-label-md text-label-md py-2 rounded-full transition-all flex items-center justify-center gap-1 font-bold shadow-xs active:scale-95" onclick="addToCartIdx(' + idx + ')" type="button"><span class="material-symbols-outlined text-[16px]">shopping_bag</span><span>Agregar al carrito</span></button>');
  return '<div class="product-card group bg-surface-card rounded-2xl p-space-sm shadow-xs border border-border-soft hover:shadow-md hover:border-salmon-light transition-all flex flex-col justify-between">'
    + '<div class="relative w-full aspect-square rounded-xl bg-bone-white overflow-hidden flex items-center justify-center p-3 border border-border-soft/60">'
    + '<a href="' + productUrl(p) + '" target="_blank" rel="noopener" class="w-full h-full flex items-center justify-center" tabindex="-1">'
    + '<img loading="lazy" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300' + (!avail ? ' filter grayscale contrast-75' : '') + '" alt="' + esc(p.t) + '" src="' + imgUrl(p) + '"/>'
    + '</a>'
    + badgeFor(p, cats)
    + '<button class="wishlist-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-card/90 backdrop-blur-sm border border-border-soft flex items-center justify-center text-neutral-subtle hover:text-salmon-deep transition-colors" onclick="toggleWishlist(this)" type="button"><span class="material-symbols-outlined text-[16px]">favorite</span></button>'
    + '</div>'
    + '<div class="flex flex-col gap-1 mt-space-sm px-1">'
    + '<span class="font-label-sm text-[11px] text-neutral-subtle uppercase font-semibold capitalize">' + esc(p.type || 'La Choli') + '</span>'
    + '<a href="' + productUrl(p) + '" target="_blank" rel="noopener" class="hover:text-salmon-deep transition-colors"><h3 class="font-headline-sm text-[15px] leading-tight text-chocolate-brown font-bold line-clamp-2 min-h-[38px]">' + esc(p.t) + '</h3></a>'
    + '<div class="flex flex-wrap items-baseline justify-between gap-x-2 mt-1 gap-1"><span class="font-price-headline text-price-headline ' + (avail ? 'text-charcoal-dark font-extrabold' : 'text-neutral-subtle') + '">' + priceTxt + '</span>' + compareTxt + '</div>'
    + btn
    + '</div></div>';
}

function renderCatalog() {
  const grid = document.getElementById('product-grid');
  const list = filteredProducts();
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (CAT_STATE.page > totalPages) CAT_STATE.page = totalPages;
  const start = (CAT_STATE.page - 1) * PER_PAGE;
  const pageItems = list.slice(start, start + PER_PAGE);
  window._page = pageItems;
  grid.innerHTML = pageItems.length
    ? pageItems.map((p, i) => cardHtml(p, i)).join('')
    : '<div class="col-span-full bg-surface-card border border-border-soft rounded-2xl p-space-xl text-center text-chocolate-brown font-body-md">Sin resultados. Prueba con otra búsqueda o filtro. <a class="font-bold text-salmon-deep underline" href="https://lacholi.cl/collections/all" target="_blank" rel="noopener">Ver tienda original</a></div>';
  const from = list.length ? start + 1 : 0;
  const to = Math.min(start + PER_PAGE, list.length);
  document.getElementById('results-count').innerText = 'Mostrando ' + from + '–' + to + ' de ' + list.length + ' artículos';
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination-bar');
  const info = document.getElementById('page-info');
  if (info) info.innerText = 'Página ' + CAT_STATE.page + ' de ' + totalPages;
  if (!el) return;
  const cur = CAT_STATE.page;
  const pages = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - cur) <= 1) pages.push(n);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btnBase = 'h-9 min-w-9 px-2 rounded-full font-label-sm text-label-sm flex items-center justify-center font-bold transition-colors ';
  let html = '<button class="w-9 h-9 rounded-full ' + (cur === 1 ? 'bg-surface-container text-neutral-subtle cursor-not-allowed' : 'bg-surface-card hover:bg-salmon-subtle text-salmon-deep border border-border-soft') + ' flex items-center justify-center shadow-xs transition-colors" ' + (cur === 1 ? 'disabled' : 'onclick="goPage(' + (cur - 1) + ')"') + '><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>';
  pages.forEach(n => {
    if (n === '…') { html += '<span class="text-neutral-subtle px-1">…</span>'; return; }
    html += n === cur
      ? '<button class="w-9 h-9 rounded-full bg-salmon-primary text-charcoal-dark font-bold font-label-sm text-label-sm flex items-center justify-center shadow-xs">' + n + '</button>'
      : '<button class="' + btnBase + 'bg-surface-card hover:bg-vanilla-cream text-chocolate-brown border border-border-soft" onclick="goPage(' + n + ')">' + n + '</button>';
  });
  html += '<button class="w-9 h-9 rounded-full ' + (cur === totalPages ? 'bg-surface-container text-neutral-subtle cursor-not-allowed' : 'bg-surface-card hover:bg-salmon-subtle text-salmon-deep border border-border-soft') + ' flex items-center justify-center shadow-xs transition-colors" ' + (cur === totalPages ? 'disabled' : 'onclick="goPage(' + (cur + 1) + ')"') + '><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>';
  el.innerHTML = html;
}

function goPage(n) {
  CAT_STATE.page = n;
  renderCatalog();
  const s = document.getElementById('catalogo');
  if (s) s.scrollIntoView({ behavior: 'smooth' });
}

function applyFilter(filter, btnElement) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(b => { b.classList.remove('bg-salmon-primary', 'text-charcoal-dark', 'active'); });
  if (btnElement) { btnElement.classList.add('bg-salmon-primary', 'text-charcoal-dark', 'active'); }
  CAT_STATE.filter = filter;
  CAT_STATE.page = 1;
  renderCatalog();
}

function filterCategory(cat) {
  const map = { bandejas: 'empaques' };
  const key = map[cat] || cat;
  const targetBtn = document.querySelector('.filter-btn[data-filter="' + key + '"]');
  if (targetBtn) {
    applyFilter(key, targetBtn);
    const s = document.getElementById('catalogo');
    if (s) s.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleSearch(term) {
  CAT_STATE.search = term;
  CAT_STATE.page = 1;
  renderCatalog();
}

function toggleStockOnly(checked) {
  CAT_STATE.hideOut = checked;
  CAT_STATE.page = 1;
  renderCatalog();
}

function filterByPrice(val) {
  document.getElementById('price-val').innerText = '$' + Number(val).toLocaleString('es-CL');
  CAT_STATE.maxPrice = Number(val);
  CAT_STATE.page = 1;
  renderCatalog();
}

function sortProducts(criteria) {
  CAT_STATE.sort = criteria;
  CAT_STATE.page = 1;
  renderCatalog();
}

function setColumns(cols) {
  const grid = document.getElementById('product-grid');
  const btn4 = document.getElementById('view-4-col');
  const btn5 = document.getElementById('view-5-col');
  if (cols === 5) {
    grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-space-md';
    if (btn5) { btn5.classList.add('bg-vanilla-cream', 'text-chocolate-brown'); btn5.classList.remove('text-neutral-subtle'); }
    if (btn4) { btn4.classList.remove('bg-vanilla-cream', 'text-chocolate-brown'); btn4.classList.add('text-neutral-subtle'); }
  } else {
    grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-md';
    if (btn4) { btn4.classList.add('bg-vanilla-cream', 'text-chocolate-brown'); btn4.classList.remove('text-neutral-subtle'); }
    if (btn5) { btn5.classList.remove('bg-vanilla-cream', 'text-chocolate-brown'); btn5.classList.add('text-neutral-subtle'); }
  }
}

function addToCart(title, price) {
  const toast = document.getElementById('cart-toast');
  const msg = document.getElementById('toast-message');
  if (msg) msg.innerText = '¡' + title + ' añadido! ($' + Number(price).toLocaleString('es-CL') + ')';
  if (!toast) return;
  toast.classList.remove('translate-y-32');
  setTimeout(() => { toast.classList.add('translate-y-32'); }, 2800);
}

function addToCartIdx(i) {
  const p = (window._page || [])[i];
  if (!p) return;
  addToCart(p.t, p.p);
}

function toggleWishlist(btn) {
  const icon = btn.querySelector('.material-symbols-outlined');
  if (btn.classList.contains('text-salmon-deep')) {
    btn.classList.remove('text-salmon-deep');
    btn.classList.add('text-neutral-subtle');
    icon.style.fontVariationSettings = "'FILL' 0";
  } else {
    btn.classList.remove('text-neutral-subtle');
    btn.classList.add('text-salmon-deep');
    icon.style.fontVariationSettings = "'FILL' 1";
  }
}

document.addEventListener('DOMContentLoaded', function () {
  buildCustomChips();
  try {
    const qq = new URLSearchParams(window.location.search).get('q');
    if (qq) {
      CAT_STATE.search = qq;
      const si = document.getElementById('product-search');
      if (si) si.value = qq;
    }
  } catch (e) {}
  if (typeof LACHOLI_PRODUCTS !== 'undefined' && LACHOLI_PRODUCTS.length) {
    const chipCount = function (f) {
      if (f === 'all') return LACHOLI_PRODUCTS.length;
      if (f === 'stock') return LACHOLI_PRODUCTS.filter(p => p.a).length;
      return LACHOLI_PRODUCTS.filter(p => matchRule(p, f)).length;
    };
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      const f = b.getAttribute('data-filter');
      const n = chipCount(f);
      if (n === 0 && f !== 'all' && f !== 'stock') { b.style.display = 'none'; return; }
      const label = b.textContent.trim().replace(/\s*\(\d+\)\s*$/, '');
      if (f === 'halloween') b.textContent = '🎃 Halloween (' + n + ')';
      else b.textContent = label + ' (' + n + ')';
    });
  }
  if (typeof LACHOLI_PRODUCTS !== 'undefined' && LACHOLI_PRODUCTS.length) {
    const maxP = Math.max.apply(null, LACHOLI_PRODUCTS.map(p => p.p || 0));
    const nice = Math.ceil((maxP + 1) / 1000) * 1000;
    CAT_STATE.maxPrice = nice;
    const range = document.getElementById('price-range');
    if (range) { range.max = nice; range.value = nice; }
    const val = document.getElementById('price-val');
    if (val) val.innerText = '$' + Number(nice).toLocaleString('es-CL');
  }
  renderCatalog();
});
