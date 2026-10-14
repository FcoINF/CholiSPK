/* Catálogo con datos en vivo (LACHOLI_PRODUCTS lo genera Liquid). Filtros automáticos o manuales. */
let PER_PAGE = 24;
const CAT_STATE = { filter: 'all', search: '', sort: 'featured', maxPrice: 30000, hideOut: false, page: 1 };

function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(n) { return '$' + Number(n).toLocaleString('es-CL'); }
function pretty(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function customRules() { return window.CATALOG_FILTERS || null; }

function autoRules() {
  const sec = document.getElementById('catalogo');
  const mode = (sec && sec.dataset.filterMode) || 'tipos';
  const excl = ((sec && sec.dataset.filterExclude) || '').split(',').map(s => norm(s.trim())).filter(Boolean);
  const map = {};
  (typeof LACHOLI_PRODUCTS !== 'undefined' ? LACHOLI_PRODUCTS : []).forEach(p => {
    let vals = [];
    if (mode === 'etiquetas') vals = (p.tags || []).map(t => String(t));
    else if (p.type) vals = [p.type];
    vals.forEach(v => {
      const key = norm(v);
      if (!key || excl.includes(key)) return;
      if (!map[key]) map[key] = { key: key, label: pretty(v.trim()), count: 0 };
      map[key].count++;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
}

function matchRule(p, key) {
  const rules = customRules();
  if (rules) {
    const r = rules.find(x => x.key === key);
    if (!r) return false;
    const t = (p.type || '').toLowerCase().trim();
    if ((r.types || []).includes(t)) return true;
    if ((r.starts || []).some(s => t.startsWith(s))) return true;
    const ptags = (p.tags || []).map(x => String(x).toLowerCase());
    if ((r.tags || []).some(s => ptags.includes(String(s).toLowerCase()))) return true;
    const hay = norm(p.t + ' ' + (p.tags || []).join(' ') + ' ' + (p.type || ''));
    return (r.kw || []).some(k => hay.includes(norm(k)));
  }
  const sec = document.getElementById('catalogo');
  const mode = (sec && sec.dataset.filterMode) || 'tipos';
  if (mode === 'etiquetas') return (p.tags || []).some(t => norm(t) === key);
  return norm(p.type || '') === key;
}

function typeLabel(p) {
  if (p.type) return p.type;
  if (p.tags) {
    const t = p.tags.find(x => !['halloween', 'navidad'].includes(String(x).toLowerCase()));
    if (t) return pretty(t);
  }
  return 'La Choli';
}

function buildChips() {
  const box = document.getElementById('filter-chips');
  if (!box) return;
  const rules = customRules() || autoRules();
  const active = 'filter-btn active bg-[#FF9E9E] text-[#333] text-xs px-4 py-1.5 rounded-full font-bold shadow-sm';
  const cls = 'filter-btn bg-[#FDFBF7] border border-[#F0E7DE] text-[#5C4033] hover:bg-[#FFEBEB] text-xs px-4 py-1.5 rounded-full font-semibold transition-all';
  let html = '<button class="' + active + '" data-filter="all" onclick="applyFilter(\'all\', this)" type="button">Todos</button>'
    + '<button class="' + cls + '" data-filter="stock" onclick="applyFilter(\'stock\', this)" type="button">Solo En Stock</button>';
  rules.forEach(r => {
    html += '<button class="' + cls + '" data-filter="' + esc(r.key) + '" onclick="applyFilter(\'' + esc(r.key).replace(/'/g, "\\'") + '\', this)" type="button">' + esc(r.label) + '</button>';
  });
  box.innerHTML = html;
}

function filteredProducts() {
  const q = norm(CAT_STATE.search.trim());
  const list = (typeof LACHOLI_PRODUCTS !== 'undefined' ? LACHOLI_PRODUCTS : []);
  let out = list.filter(p => {
    if (CAT_STATE.filter === 'stock') { if (!p.a) return false; }
    else if (CAT_STATE.filter !== 'all') { if (!matchRule(p, CAT_STATE.filter)) return false; }
    if (CAT_STATE.hideOut && !p.a) return false;
    if (p.p > CAT_STATE.maxPrice) return false;
    if (q) {
      const hay = norm(p.t + ' ' + (p.type || '') + ' ' + (p.tags || []).join(' '));
      if (!q.split(/\s+/).filter(Boolean).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  if (CAT_STATE.sort === 'price-asc') out = out.slice().sort((a, b) => a.p - b.p);
  else if (CAT_STATE.sort === 'price-desc') out = out.slice().sort((a, b) => b.p - a.p);
  else if (CAT_STATE.sort === 'alpha') out = out.slice().sort((a, b) => String(a.t).localeCompare(String(b.t), 'es'));
  return out;
}

function badgeFor(p) {
  if (!p.a) return '<span class="absolute top-2 left-2 bg-[#F0EAE1] text-[#8c827a] text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Agotado</span>';
  if (p.c && p.c > p.p) return '<span class="absolute top-2 left-2 bg-[#FFE5E7] text-[#D9534F] text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Oferta -' + Math.round((1 - p.p / p.c) * 100) + '%</span>';
  return '<span class="absolute top-2 left-2 bg-[#8DE4C5] text-[#207255] text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Disponible</span>';
}
function productUrl(p) { return '/products/' + p.h; }
function imgUrl(p) { return p.img + (p.img.includes('?') ? '&' : '?') + 'width=600'; }

function cardHtml(p) {
  const avail = !!p.a;
  const priceTxt = p.p === 0 ? 'Consultar' : fmt(p.p);
  const sub = (p.c && p.c > p.p)
    ? '<span class="text-[11px] text-[#7A736E] line-through">' + fmt(p.c) + '</span>'
    : '<span class="text-[11px] text-[#7A736E]">' + esc(typeLabel(p)) + '</span>';
  const btn = !avail
    ? '<button class="w-full mt-2 bg-[#F0EAE1] text-[#8c827a] text-xs py-2 rounded-full font-semibold cursor-not-allowed flex items-center justify-center gap-1" disabled type="button">Agotado</button>'
    : (p.p === 0
      ? '<a class="w-full mt-2 bg-[#FFF3CD] text-xs py-2 rounded-full text-center font-bold border border-[#F0E7DE]" href="' + productUrl(p) + '">Ver producto</a>'
      : '<button class="w-full mt-2 bg-[#8DE4C5] hover:bg-[#A8E6CF] text-[#207255] text-xs py-2 rounded-full font-bold flex items-center justify-center gap-1 active:scale-95" data-add-to-cart="' + p.v + '" type="button"><span class="material-symbols-outlined text-[16px]">shopping_bag</span><span>Agregar al carrito</span></button>');
  return '<div class="product-card group bg-white rounded-2xl p-2 shadow-sm border border-[#F0E7DE] hover:shadow-md transition-all flex flex-col justify-between" data-price="' + p.p + '">'
    + '<div class="relative w-full aspect-square rounded-xl bg-[#FDFBF7] overflow-hidden flex items-center justify-center p-3 border border-[#F0E7DE]/60">'
    + '<a href="' + productUrl(p) + '" class="w-full h-full flex items-center justify-center" tabindex="-1"><img loading="lazy" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300' + (!avail ? ' grayscale' : '') + '" alt="' + esc(p.t) + '" src="' + imgUrl(p) + '"/></a>'
    + badgeFor(p)
    + '<button class="wishlist-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-[#F0E7DE] flex items-center justify-center text-[#7A736E]" data-wish-id="' + p.id + '" data-wish-title="' + esc(p.t) + '" data-wish-price="' + p.p + '" data-wish-img="' + esc(p.img) + '" data-wish-url="' + productUrl(p) + '" onclick="toggleWishlist(this)" type="button"><span class="material-symbols-outlined text-[16px]">favorite</span></button>'
    + '</div><div class="flex flex-col gap-1 mt-2 px-1">'
    + '<span class="text-[11px] text-[#7A736E] uppercase font-semibold capitalize">' + esc(typeLabel(p)) + '</span>'
    + '<a href="' + productUrl(p) + '"><h3 class="text-[15px] leading-tight text-[#5C4033] font-bold line-clamp-2 min-h-[38px]">' + esc(p.t) + '</h3></a>'
    + '<div class="flex flex-wrap items-baseline justify-between gap-x-2 mt-1"><span class="text-[20px] font-extrabold">' + priceTxt + '</span>' + sub + '</div>'
    + btn + '</div></div>';
}

function renderCatalog() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const list = filteredProducts();
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (CAT_STATE.page > totalPages) CAT_STATE.page = totalPages;
  const start = (CAT_STATE.page - 1) * PER_PAGE;
  const items = list.slice(start, start + PER_PAGE);
  grid.innerHTML = items.length ? items.map(cardHtml).join('')
    : '<div class="col-span-full bg-white border border-[#F0E7DE] rounded-2xl p-10 text-center text-sm">Sin resultados. Prueba con otra búsqueda o filtro.</div>';
  document.getElementById('results-count').innerText = 'Mostrando ' + (list.length ? start + 1 : 0) + '–' + Math.min(start + PER_PAGE, list.length) + ' de ' + list.length + ' artículos';
  renderPagination(totalPages);
  if (typeof syncHearts === 'function') { try { syncHearts(); } catch (e) {} }
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
  const base = 'h-9 min-w-9 px-2 rounded-full text-xs flex items-center justify-center font-bold ';
  let html = '<button class="w-9 h-9 rounded-full flex items-center justify-center ' + (cur === 1 ? 'bg-[#F5EFE6] text-[#7A736E]' : 'bg-white border border-[#F0E7DE]') + '" ' + (cur === 1 ? 'disabled' : 'onclick="goPage(' + (cur - 1) + ')"') + '><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>';
  pages.forEach(n => {
    html += n === '…' ? '<span class="text-[#7A736E] px-1">…</span>'
      : (n === cur
        ? '<button class="w-9 h-9 rounded-full bg-[#FF9E9E] font-bold text-xs flex items-center justify-center">' + n + '</button>'
        : '<button class="' + base + 'bg-white border border-[#F0E7DE]" onclick="goPage(' + n + ')">' + n + '</button>');
  });
  html += '<button class="w-9 h-9 rounded-full flex items-center justify-center ' + (cur === totalPages ? 'bg-[#F5EFE6] text-[#7A736E]' : 'bg-white border border-[#F0E7DE]') + '" ' + (cur === totalPages ? 'disabled' : 'onclick="goPage(' + (cur + 1) + ')"') + '><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>';
  el.innerHTML = html;
}

function goPage(n) {
  CAT_STATE.page = n;
  renderCatalog();
  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}
function applyFilter(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('bg-[#FF9E9E]', 'active'));
  if (btn) btn.classList.add('bg-[#FF9E9E]', 'active');
  CAT_STATE.filter = filter;
  CAT_STATE.page = 1;
  renderCatalog();
}
function handleSearch(v) { CAT_STATE.search = v; CAT_STATE.page = 1; renderCatalog(); }
function toggleStockOnly(c) { CAT_STATE.hideOut = c; CAT_STATE.page = 1; renderCatalog(); }
function filterByPrice(val) {
  document.getElementById('price-val').innerText = '$' + Number(val).toLocaleString('es-CL');
  CAT_STATE.maxPrice = Number(val);
  CAT_STATE.page = 1;
  renderCatalog();
}
function sortProducts(v) { CAT_STATE.sort = v; CAT_STATE.page = 1; renderCatalog(); }
function setColumns(cols) {
  const grid = document.getElementById('product-grid');
  grid.className = cols === 5 ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
}

function paintChipCounts() {
  const list = (typeof LACHOLI_PRODUCTS !== 'undefined' ? LACHOLI_PRODUCTS : []);
  const countFor = f => {
    if (f === 'all') return list.length;
    if (f === 'stock') return list.filter(p => p.a).length;
    return list.filter(p => {
      const sec = document.getElementById('catalogo');
      const mode = (sec && sec.dataset.filterMode) || 'tipos';
      if (customRules()) return matchRule(p, f);
      if (mode === 'etiquetas') return (p.tags || []).some(t => norm(t) === f);
      return norm(p.type || '') === f;
    }).length;
  };
  document.querySelectorAll('.filter-btn').forEach(b => {
    const f = b.getAttribute('data-filter');
    const label = b.textContent.trim().replace(/\s*\(\d+\)\s*$/, '');
    const n = countFor(f);
    if (n === 0 && f !== 'all' && f !== 'stock') { b.style.display = 'none'; return; }
    b.textContent = label + ' (' + n + ')';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const sec = document.getElementById('catalogo');
  if (sec && sec.dataset.perPage) PER_PAGE = Number(sec.dataset.perPage) || 24;
  // chips base (conteos se agregan después)
  const box = document.getElementById('filter-chips');
  if (box && !box.children.length) {
    const mk = (f, label, on) => '<button class="filter-btn ' + (on ? 'active bg-[#FF9E9E] text-[#333]' : 'bg-[#FDFBF7] border border-[#F0E7DE] text-[#5C4033] hover:bg-[#FFEBEB]') + ' text-xs px-4 py-1.5 rounded-full font-semibold transition-all" data-filter="' + f + '" onclick="applyFilter(\'' + f + '\', this)" type="button">' + label + '</button>';
    box.innerHTML = mk('all', 'Todos', true) + mk('stock', 'Solo En Stock', false);
  }
  buildChips();
  if (typeof LACHOLI_PRODUCTS !== 'undefined' && LACHOLI_PRODUCTS.length) {
    const maxP = Math.max.apply(null, LACHOLI_PRODUCTS.map(p => p.p || 0));
    const nice = Math.ceil((maxP + 1) / 1000) * 1000;
    CAT_STATE.maxPrice = nice;
    const range = document.getElementById('price-range');
    if (range) { range.max = nice; range.value = nice; }
    const val = document.getElementById('price-val');
    if (val) val.innerText = '$' + Number(nice).toLocaleString('es-CL');
  }
  try {
    const qq = new URLSearchParams(window.location.search).get('q');
    if (qq) {
      CAT_STATE.search = qq;
      const si = document.getElementById('product-search');
      if (si) si.value = qq;
    }
  } catch (e) {}
  paintChipCounts();
  renderCatalog();
});
