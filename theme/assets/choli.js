/* Choli Shopify: carrito real (Cart API), buscador predictivo, favoritos, slider, modales. */
const CholiMoney = c => '$' + (Number(c) / 100).toLocaleString('es-CL');
const CholiEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- Carrito Shopify ---------- */
async function cartGet() { const r = await fetch('/cart.js'); return r.json(); }
async function addToCartByVariant(id, qty) {
  qty = qty || 1;
  await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, quantity: qty }) });
  await renderCart();
  toggleCart(true);
}
async function cartChange(line, qty) {
  await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ line, quantity: qty }) });
  await renderCart();
}
async function renderCart() {
  let cart = { items: [], item_count: 0, total_price: 0 };
  try { cart = await cartGet(); } catch (e) {}
  document.querySelectorAll('#bag-btn, #bag-fab').forEach(btn => {
    let badge = btn.querySelector('.cart-count-bubble');
    if (cart.item_count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-count-bubble absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#E87373] text-white rounded-full text-[11px] font-bold items-center justify-center shadow';
        badge.style.display = 'flex';
        btn.appendChild(badge);
      }
      badge.innerText = cart.item_count > 99 ? '99+' : cart.item_count;
      badge.style.display = 'flex';
    } else if (badge) badge.style.display = 'none';
  });
  const box = document.getElementById('cart-items');
  if (!box) return;
  const foot = document.getElementById('cart-foot');
  const cnt = document.getElementById('cart-title-count');
  if (cnt) cnt.innerText = cart.item_count;
  if (!cart.items.length) {
    if (foot) foot.style.display = 'none';
    box.innerHTML = '<div class="flex flex-col items-center text-center gap-3 py-10">'
      + '<div class="w-16 h-16 rounded-full bg-[#FDFBF7] border border-[#F0E7DE] flex items-center justify-center text-[#7A736E]"><span class="material-symbols-outlined text-[32px]">shopping_bag</span></div>'
      + '<p class="text-lg text-[#5C4033] font-bold">Tu bolsa está vacía</p>'
      + '<button onclick="toggleCart(false)" type="button" class="bg-[#FF9E9E] text-sm px-6 py-2.5 rounded-full font-bold">Seguir comprando</button></div>';
    return;
  }
  if (foot) foot.style.display = '';
  box.innerHTML = cart.items.map(it =>
    '<div class="flex gap-3 py-3 border-b border-[#F0E7DE]/70">'
    + (it.image ? '<img src="' + it.image.replace(/(\.[a-z]+)(\?.*)?$/i, '_small$1') + '" alt="" class="w-14 h-14 rounded-xl object-contain bg-[#FDFBF7] border border-[#F0E7DE] shrink-0"/>' : '')
    + '<div class="flex-1 min-w-0"><p class="text-xs font-bold leading-snug line-clamp-2">' + CholiEsc(it.product_title) + '</p>'
    + '<div class="flex items-center justify-between mt-1.5"><div class="flex items-center gap-1 bg-[#FDFBF7] border border-[#F0E7DE] rounded-full px-1 py-0.5">'
    + '<button onclick="cartChange(' + it.line + ',' + (it.quantity - 1) + ')" type="button" class="w-6 h-6 font-bold">−</button>'
    + '<span class="text-xs font-extrabold min-w-6 text-center">' + it.quantity + '</span>'
    + '<button onclick="cartChange(' + it.line + ',' + (it.quantity + 1) + ')" type="button" class="w-6 h-6 font-bold">+</button></div>'
    + '<span class="text-[20px] font-extrabold">' + CholiMoney(it.line_price) + '</span></div></div>'
    + '<button onclick="cartChange(' + it.line + ',0)" type="button" aria-label="Quitar" class="text-[#7A736E] self-start"><span class="material-symbols-outlined text-[20px]">delete</span></button></div>'
  ).join('');
  const sub = document.getElementById('cart-subtotal');
  if (sub) sub.innerText = CholiMoney(cart.total_price);
}
function toggleCart(open) {
  const d = document.getElementById('cart-drawer'), o = document.getElementById('cart-overlay');
  if (!d || !o) return;
  const show = typeof open === 'boolean' ? open : d.classList.contains('translate-x-full');
  d.classList.toggle('translate-x-full', !show);
  o.classList.toggle('hidden', !show);
  document.body.style.overflow = show ? 'hidden' : '';
  if (show) renderCart();
}
function cartCheckoutWA() {
  cartGet().then(cart => {
    let txt = 'Hola La Choli, quiero comprar:\n';
    cart.items.forEach(it => { txt += '• ' + it.quantity + 'x ' + it.product_title + ' — ' + CholiMoney(it.line_price) + '\n'; });
    txt += 'Total: ' + CholiMoney(cart.total_price);
    window.open('https://wa.me/56954076195?text=' + encodeURIComponent(txt), '_blank');
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-add-to-cart]');
  if (b) addToCartByVariant(b.getAttribute('data-add-to-cart'), 1);
});

/* ---------- Favoritos (local) ---------- */
var LACHOLI_FAVS = {};
try { LACHOLI_FAVS = JSON.parse(localStorage.getItem('lacholi_favs') || '{}'); } catch (e) {}
function favSave() { try { localStorage.setItem('lacholi_favs', JSON.stringify(LACHOLI_FAVS)); } catch (e) {} }
function toggleWishlist(btn) {
  const id = btn.getAttribute('data-wish-id');
  if (!id) return;
  if (LACHOLI_FAVS[id]) delete LACHOLI_FAVS[id];
  else LACHOLI_FAVS[id] = { t: btn.getAttribute('data-wish-title'), p: Number(btn.getAttribute('data-wish-price')) || 0, img: btn.getAttribute('data-wish-img'), url: btn.getAttribute('data-wish-url'), v: btn.getAttribute('data-wish-variant') };
  favSave();
  syncHearts();
}
function syncHearts() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const on = !!LACHOLI_FAVS[btn.getAttribute('data-wish-id')];
    const icon = btn.querySelector('.material-symbols-outlined');
    btn.classList.toggle('text-[#E87373]', on);
    if (icon) icon.style.fontVariationSettings = on ? "'FILL' 1" : "'FILL' 0";
  });
  document.querySelectorAll('[data-fav-count]').forEach(el => {
    const n = Object.keys(LACHOLI_FAVS).length;
    el.innerText = n;
    el.style.display = n ? 'flex' : 'none';
  });
}

/* ---------- Buscador predictivo ---------- */
let hsTimer = null;
async function hsDo(input, boxId) {
  const box = document.getElementById(boxId);
  const q = (input.value || '').trim();
  if (q.length < 2 || !box) { if (box) box.classList.add('hidden'); return; }
  try {
    const r = await fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=7&resources[options][unavailable_products]=last');
    const j = await r.json();
    const items = (j.resources && j.resources.results && j.resources.results.products) || [];
    if (!items.length) {
      box.innerHTML = '<div class="px-4 py-4 text-center text-sm text-[#7A736E]">Sin coincidencias — prueba con otra palabra</div>';
    } else {
      box.innerHTML = items.map(p =>
        '<a href="' + p.url + '" class="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF3CD] border-b border-[#F0E7DE]/60">'
        + (p.featured_image ? '<img src="' + p.featured_image.url + '&width=100" alt="" class="w-10 h-10 rounded-lg object-contain bg-[#FDFBF7] border border-[#F0E7DE] shrink-0"/>' : '')
        + '<div class="flex-1 min-w-0"><p class="text-xs font-bold truncate">' + CholiEsc(p.title) + '</p></div>'
        + '<span class="text-[20px] font-extrabold shrink-0">' + CholiMoney(p.price) + '</span></a>'
      ).join('') + '<a href="/search?q=' + encodeURIComponent(q) + '&type=product" class="block text-center text-xs text-[#E87373] font-bold py-2.5">Ver todos los resultados</a>';
    }
    box.classList.remove('hidden');
  } catch (e) {}
}
function hsBind(inputId, boxId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => { clearTimeout(hsTimer); hsTimer = setTimeout(() => hsDo(input, boxId), 250); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.location.href = '/search?q=' + encodeURIComponent(input.value) + '&type=product';
    if (e.key === 'Escape') document.getElementById(boxId).classList.add('hidden');
  });
}
function mToggle(force) {
  const row = document.getElementById('m-search-row');
  if (!row) return;
  const show = typeof force === 'boolean' ? force : row.classList.contains('hidden');
  row.classList.toggle('hidden', !show);
  if (show) setTimeout(() => document.getElementById('m-search').focus(), 80);
}
function toggleAccount() { window.location.href = '/account'; }

/* ---------- Slider portada ---------- */
function heroSliderInit() {
  const track = document.getElementById('hero-track');
  if (!track || track.dataset.done) return;
  track.dataset.done = '1';
  const total = track.children.length;
  const dotsBox = document.getElementById('hero-dots');
  let idx = 0, timer = null;
  function paint() {
    if (!dotsBox) return;
    let html = '';
    for (let i = 0; i < total; i++) html += '<button aria-label="Slide ' + (i + 1) + '" data-dot="' + i + '" type="button" class="h-2.5 rounded-full transition-all ' + (i === idx ? 'w-7 bg-[#E87373]' : 'w-2.5 bg-[#CFC5BC]') + '"></button>';
    dotsBox.innerHTML = html;
    dotsBox.querySelectorAll('[data-dot]').forEach(b => b.addEventListener('click', () => go(Number(b.getAttribute('data-dot')))));
  }
  function restart() { if (timer) clearInterval(timer); timer = setInterval(() => go(idx + 1), 6500); }
  function go(n) { idx = ((n % total) + total) % total; track.style.transform = 'translateX(-' + idx * 100 + '%)'; paint(); restart(); }
  window.heroGo = go;
  const prev = document.getElementById('hero-prev'), next = document.getElementById('hero-next');
  if (prev) prev.addEventListener('click', () => go(idx - 1));
  if (next) next.addEventListener('click', () => go(idx + 1));
  const vp = document.getElementById('hero-viewport');
  if (vp) {
    let x0 = null;
    vp.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
    }, { passive: true });
  }
  paint(); restart();
}

document.addEventListener('DOMContentLoaded', function () {
  hsBind('header-search', 'header-suggest');
  hsBind('m-search', 'm-suggest');
  document.addEventListener('click', e => {
    ['header-suggest', 'm-suggest'].forEach(id => {
      const box = document.getElementById(id);
      if (box && !box.classList.contains('hidden') && !(e.target.closest && (e.target.closest('#' + id) || e.target.closest('#' + id.replace('-suggest', '-search'))))) box.classList.add('hidden');
    });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleCart(false); });
  syncHearts();
  heroSliderInit();
  renderCart();
});
