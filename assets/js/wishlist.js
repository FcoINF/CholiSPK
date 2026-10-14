/* Favoritos La Choli: estado real persistente + sincronía de corazones. */
var LACHOLI_FAVS = {};
try {
  const raw = localStorage.getItem('lacholi_favs');
  if (raw) LACHOLI_FAVS = JSON.parse(raw) || {};
} catch (e) { LACHOLI_FAVS = {}; }

function favSave() {
  try { localStorage.setItem('lacholi_favs', JSON.stringify(LACHOLI_FAVS)); } catch (e) {}
}
function favEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function favParsePrice(txt) {
  if (!txt) return 0;
  const n = parseInt(String(txt).replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}
function favFromCard(card) {
  if (!card) return null;
  const title = (card.querySelector('h3') || {}).innerText || '';
  if (!title.trim()) return null;
  const priceEl = card.querySelector('.font-price-headline');
  const price = favParsePrice(priceEl ? priceEl.innerText : '');
  const img = card.querySelector('img');
  const link = card.querySelector('a[href^="http"]');
  return {
    id: title.trim() + '|' + price,
    t: title.trim(),
    p: price,
    img: img ? img.src : '',
    url: link ? link.href : ''
  };
}
function favPaint(btn, on) {
  const icon = btn.querySelector('.material-symbols-outlined');
  if (on) {
    btn.classList.remove('text-neutral-subtle');
    btn.classList.add('text-salmon-deep');
    if (icon) icon.style.fontVariationSettings = "'FILL' 1";
  } else {
    btn.classList.add('text-neutral-subtle');
    btn.classList.remove('text-salmon-deep');
    if (icon) icon.style.fontVariationSettings = "'FILL' 0";
  }
}
function favToast(msg) {
  const toast = document.getElementById('cart-toast');
  const el = document.getElementById('toast-message');
  if (el) el.innerText = msg;
  if (!toast) return;
  toast.classList.remove('translate-y-32');
  setTimeout(() => { toast.classList.add('translate-y-32'); }, 2200);
}
function toggleWishlist(btn) {
  const f = favFromCard(btn && btn.closest ? btn.closest('.product-card') : null);
  if (!f) return;
  if (LACHOLI_FAVS[f.id]) {
    delete LACHOLI_FAVS[f.id];
    favToast('Quitado de favoritos');
  } else {
    LACHOLI_FAVS[f.id] = f;
    favToast('Guardado en favoritos');
  }
  favSave();
  syncHearts();
  if (typeof favRender === 'function' && document.getElementById('fav-grid')) favRender();
}
function syncHearts() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const card = btn.closest ? btn.closest('.product-card') : null;
    const f = favFromCard(card);
    favPaint(btn, !!(f && LACHOLI_FAVS[f.id]));
  });
  const n = Object.keys(LACHOLI_FAVS).length;
  document.querySelectorAll('[data-fav-count]').forEach(el => { el.innerText = n; });
}
document.addEventListener('DOMContentLoaded', function () { syncHearts(); });
