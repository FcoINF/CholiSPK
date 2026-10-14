/* Mi Cuenta La Choli: modal de sesión con accesos reales + atajos locales. */
function toggleAccount(open) {
  const m = document.getElementById('account-modal');
  const o = document.getElementById('account-overlay');
  if (!m || !o) return;
  const show = typeof open === 'boolean' ? open : m.classList.contains('hidden');
  m.classList.toggle('hidden', !show);
  o.classList.toggle('hidden', !show);
  document.body.style.overflow = show ? 'hidden' : '';
}
document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('account-modal')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = '<div id="account-overlay" onclick="toggleAccount(false)" class="hidden fixed inset-0 bg-charcoal-dark/40 backdrop-blur-[2px] z-[55]"></div>'
      + '<div id="account-modal" role="dialog" aria-label="Mi cuenta" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-gutter pointer-events-none">'
      + '<div class="pointer-events-auto w-full max-w-sm bg-surface-card rounded-3xl border border-border-soft shadow-2xl p-space-lg flex flex-col gap-space-md max-h-[90vh] overflow-y-auto">'
      + '<div class="flex items-center justify-between">'
      + '<h3 class="font-headline-sm text-[19px] text-chocolate-brown font-extrabold flex items-center gap-2"><span class="material-symbols-outlined text-salmon-deep">person</span>Mi Cuenta</h3>'
      + '<button onclick="toggleAccount(false)" type="button" aria-label="Cerrar" class="w-9 h-9 rounded-full hover:bg-salmon-subtle text-chocolate-brown flex items-center justify-center transition-colors"><span class="material-symbols-outlined">close</span></button>'
      + '</div>'
      + '<p class="font-body-md text-body-md text-neutral-subtle font-medium -mt-2">Inicia sesión o crea tu cuenta en la tienda oficial.</p>'
      + '<a class="w-full bg-salmon-primary hover:bg-salmon-deep text-charcoal-dark font-label-lg text-label-lg py-3 rounded-full font-bold transition-all text-center active:scale-95" target="_blank" rel="noopener" href="https://lacholi.cl/account/login">Iniciar sesión</a>'
      + '<a class="w-full bg-vanilla-cream hover:bg-vanilla-cream/70 text-chocolate-brown font-label-lg text-label-lg py-3 rounded-full font-bold border border-border-soft transition-all text-center" target="_blank" rel="noopener" href="https://lacholi.cl/account/register">Crear cuenta</a>'
      + '<div class="border-t border-border-soft pt-space-sm flex flex-col gap-1">'
      + '<p class="font-label-sm text-label-sm text-neutral-subtle uppercase font-bold tracking-widest">En esta web</p>'
      + '<a class="flex items-center gap-3 py-2 text-chocolate-brown hover:text-salmon-deep font-label-md text-label-md font-bold transition-colors" href="favoritos.html"><span class="material-symbols-outlined">favorite</span>Mis favoritos</a>'
      + '<button class="flex items-center gap-3 py-2 text-chocolate-brown hover:text-salmon-deep font-label-md text-label-md font-bold transition-colors" onclick="toggleAccount(false);toggleCart(true)" type="button"><span class="material-symbols-outlined">shopping_bag</span>Mi bolsa</button>'
      + '<a class="flex items-center gap-3 py-2 text-chocolate-brown hover:text-salmon-deep font-label-md text-label-md font-bold transition-colors" href="contacto.html"><span class="material-symbols-outlined">support_agent</span>Ayuda y contacto</a>'
      + '</div>'
      + '<p class="font-body-sm text-body-sm text-neutral-subtle font-medium text-center">Tus favoritos y tu bolsa se guardan en este navegador.</p>'
      + '</div></div>';
    document.body.appendChild(wrap);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleAccount(false);
  });
});
