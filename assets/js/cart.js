/* Bolsa de compra La Choli: drawer lateral, cantidades, persistencia y pedido por WhatsApp. */
var LACHOLI_CART = {};
try {
  const raw = localStorage.getItem('lacholi_cart');
  if (raw) LACHOLI_CART = JSON.parse(raw) || {};
} catch (e) { LACHOLI_CART = {}; }

function cartSave() {
  try { localStorage.setItem('lacholi_cart', JSON.stringify(LACHOLI_CART)); } catch (e) {}
}
function cartCount() {
  return Object.values(LACHOLI_CART).reduce((s, it) => s + (it.qty || 0), 0);
}
function cartTotal() {
  return Object.values(LACHOLI_CART).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
}
function cartFmt(n) { return '$' + Number(n).toLocaleString('es-CL'); }
function cartEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function cartAdd(title, price, img) {
  const id = title + '|' + price;
  if (!LACHOLI_CART[id]) LACHOLI_CART[id] = { title: title, price: Number(price) || 0, img: img || '', qty: 0 };
  if (img && !LACHOLI_CART[id].img) LACHOLI_CART[id].img = img;
  LACHOLI_CART[id].qty += 1;
  cartSave();
  renderCart();
}

function addToCart(title, price, el) {
  let img = '';
  try {
    const card = el && el.closest ? el.closest('.product-card') : null;
    const im = card ? card.querySelector('img') : null;
    if (im) img = im.src;
  } catch (e) {}
  cartAdd(title, price, img);
  const toast = document.getElementById('cart-toast');
  const msg = document.getElementById('toast-message');
  if (msg) msg.innerText = '¡' + title + ' añadido! (' + cartFmt(price) + ')';
  if (toast) {
    toast.classList.remove('translate-y-32');
    setTimeout(() => { toast.classList.add('translate-y-32'); }, 2200);
  }
}

function addToCartIdx(i) {
  const p = (window._page || [])[i];
  if (!p) return;
  addToCart(p.t, p.p, null);
  if (p.img && LACHOLI_CART[p.t + '|' + p.p]) {
    let im = p.img;
    im = im + (im.indexOf('?') >= 0 ? '&' : '?') + 'width=200';
    LACHOLI_CART[p.t + '|' + p.p].img = im;
    cartSave();
    renderCart();
  }
}

function cartChange(idB64, delta) {
  const id = decodeURIComponent(escape(atob(idB64)));
  const it = LACHOLI_CART[id];
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) delete LACHOLI_CART[id];
  cartSave();
  renderCart();
}
function cartRemove(idB64) {
  const id = decodeURIComponent(escape(atob(idB64)));
  delete LACHOLI_CART[id];
  cartSave();
  renderCart();
}
function cartId(id) { return btoa(unescape(encodeURIComponent(id))); }

function toggleCart(open) {
  const d = document.getElementById('cart-drawer');
  const o = document.getElementById('cart-overlay');
  if (!d || !o) return;
  const show = typeof open === 'boolean' ? open : d.classList.contains('translate-x-full');
  d.classList.toggle('translate-x-full', !show);
  o.classList.toggle('hidden', !show);
  document.body.style.overflow = show ? 'hidden' : '';
}

function cartCheckout() {
  const items = Object.values(LACHOLI_CART);
  if (!items.length) return;
  let txt = 'Hola La Choli, quiero comprar:\n';
  items.forEach(it => { txt += '• ' + it.qty + 'x ' + it.title + ' — ' + cartFmt(it.qty * it.price) + '\n'; });
  txt += 'Total: ' + cartFmt(cartTotal()) + '\nNombre:\nDirección de envío/retiro:';
  window.open('https://wa.me/56954076195?text=' + encodeURIComponent(txt), '_blank');
}

function renderCart() {
  const btn = document.getElementById('bag-btn');
  if (btn) {
    let badge = document.getElementById('cart-count');
    const n = cartCount();
    if (n > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'cart-count';
        badge.className = 'absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-salmon-deep text-white rounded-full text-[11px] font-bold flex items-center justify-center shadow';
        btn.appendChild(badge);
      }
      badge.innerText = n > 99 ? '99+' : n;
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
  const box = document.getElementById('cart-items');
  if (!box) return;
  const items = Object.entries(LACHOLI_CART);
  const foot = document.getElementById('cart-foot');
  const cnt0 = document.getElementById('cart-title-count');
  if (cnt0) cnt0.innerText = cartCount();
  if (!items.length) {
    box.innerHTML = '<div class="flex flex-col items-center text-center gap-3 py-space-xl">'
      + '<div class="w-16 h-16 rounded-full bg-bone-white border border-border-soft flex items-center justify-center text-neutral-subtle"><span class="material-symbols-outlined text-[32px]">shopping_bag</span></div>'
      + '<p class="font-headline-sm text-headline-sm text-chocolate-brown font-bold">Tu bolsa está vacía</p>'
      + '<p class="font-body-md text-body-md text-neutral-subtle font-medium">Endulza tu día: mira el catálogo y agrega tus favoritos.</p>'
      + '<button onclick="toggleCart(false)" type="button" class="bg-salmon-primary hover:bg-salmon-deep text-charcoal-dark font-label-lg text-label-lg px-space-lg py-2.5 rounded-full font-bold transition-all active:scale-95">Seguir comprando</button></div>';
    if (foot) foot.style.display = 'none';
    return;
  }
  if (foot) foot.style.display = '';
  box.innerHTML = items.map(([id, it]) => {
    const b64 = cartId(id);
    const thumb = it.img
      ? '<img src="' + cartEsc(it.img) + '" alt="' + cartEsc(it.title) + '" class="w-14 h-14 rounded-xl object-contain bg-bone-white border border-border-soft shrink-0"/>'
      : '<div class="w-14 h-14 rounded-xl bg-salmon-subtle text-salmon-deep flex items-center justify-center shrink-0 font-extrabold">' + cartEsc(it.title.charAt(0).toUpperCase()) + '</div>';
    return '<div class="flex gap-3 py-3 border-b border-border-soft/70">'
      + thumb
      + '<div class="flex-1 min-w-0"><p class="font-label-md text-label-md text-chocolate-brown font-bold leading-snug line-clamp-2">' + cartEsc(it.title) + '</p>'
      + '<p class="font-body-sm text-body-sm text-neutral-subtle font-medium">' + cartFmt(it.price) + ' c/u</p>'
      + '<div class="flex items-center justify-between mt-1.5">'
      + '<div class="flex items-center gap-1 bg-bone-white border border-border-soft rounded-full px-1 py-0.5">'
      + '<button onclick="cartChange(\'' + b64 + '\',-1)" type="button" aria-label="Quitar uno" class="w-6 h-6 rounded-full hover:bg-salmon-subtle text-chocolate-brown font-bold flex items-center justify-center">−</button>'
      + '<span class="font-label-md text-label-md font-extrabold text-chocolate-brown min-w-6 text-center">' + it.qty + '</span>'
      + '<button onclick="cartChange(\'' + b64 + '\',1)" type="button" aria-label="Agregar uno" class="w-6 h-6 rounded-full hover:bg-mint-soft text-chocolate-brown font-bold flex items-center justify-center">+</button>'
      + '</div>'
      + '<span class="font-price-headline text-price-headline text-charcoal-dark font-extrabold">' + cartFmt(it.qty * it.price) + '</span>'
      + '</div></div>'
      + '<button onclick="cartRemove(\'' + b64 + '\')" type="button" aria-label="Quitar producto" class="text-neutral-subtle hover:text-salmon-deep transition-colors self-start"><span class="material-symbols-outlined text-[20px]">delete</span></button>'
      + '</div>';
  }).join('');
  const sub = document.getElementById('cart-subtotal');
  if (sub) sub.innerText = cartFmt(cartTotal());
  const cnt = document.getElementById('cart-title-count');
  if (cnt) cnt.innerText = cartCount();
}

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('cart-drawer')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = '<div id="cart-overlay" onclick="toggleCart(false)" class="hidden fixed inset-0 bg-charcoal-dark/40 backdrop-blur-[2px] z-[55]"></div>'
      + '<aside id="cart-drawer" role="dialog" aria-label="Bolsa de compra" class="fixed top-0 right-0 h-full w-[min(420px,94vw)] bg-surface-card shadow-2xl z-[60] translate-x-full transition-transform duration-300 flex flex-col" style="transition-timing-function:cubic-bezier(0.16,1,0.3,1)">'
      + '<div class="flex items-center justify-between px-space-lg py-space-md border-b border-border-soft">'
      + '<h3 class="font-headline-sm text-[17px] text-chocolate-brown font-bold flex items-center gap-2"><span class="material-symbols-outlined text-salmon-deep">shopping_bag</span>Tu bolsa (<span id="cart-title-count">0</span>)</h3>'
      + '<button onclick="toggleCart(false)" type="button" aria-label="Cerrar bolsa" class="w-9 h-9 rounded-full hover:bg-salmon-subtle text-chocolate-brown flex items-center justify-center transition-colors"><span class="material-symbols-outlined">close</span></button>'
      + '</div>'
      + '<div id="cart-items" class="flex-1 overflow-y-auto px-space-lg"></div>'
      + '<div id="cart-foot" class="border-t border-border-soft px-space-lg py-space-md flex flex-col gap-3 bg-vanilla-soft/60">'
      + '<div class="flex items-center justify-between"><span class="font-label-lg text-label-lg text-chocolate-brown font-semibold">Subtotal</span><span id="cart-subtotal" class="font-price-headline text-price-headline text-charcoal-dark font-extrabold">$0</span></div>'
      + '<p class="font-body-sm text-body-sm text-neutral-subtle font-medium">Envío se calcula por WhatsApp. Retiro gratis en Quilicura.</p>'
      + '<button onclick="cartCheckout()" type="button" class="w-full bg-mint-accent hover:bg-mint-light text-mint-deep font-label-lg text-label-lg py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 active:scale-95"><span class="material-symbols-outlined text-[20px]">chat</span><span>Pedir por WhatsApp</span></button>'
      + '<button onclick="toggleCart(false)" type="button" class="w-full text-center font-label-md text-label-md text-chocolate-brown hover:text-salmon-deep font-bold transition-colors">Seguir comprando</button>'
      + '</div></aside>';
    document.body.appendChild(wrap);
  }
  renderCart();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleCart(false);
  });
});
