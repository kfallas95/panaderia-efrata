// Marco de la app (T-4.2, D-046, R7):
// celular → encabezado + contenido + barra inferior con 5 secciones;
// computadora (≥ 768 px) → menú lateral con el encabezado arriba.

import { h } from '../dom.js';
import { Icon } from './icon.js';
import { SECTIONS } from '../sections.js';

/** Crea el marco una sola vez. Devuelve sus partes para actualizarlas en cada ruta. */
export function AppShell() {
  const banner = h('div', { class: 'banner-slot' });

  const brand = h('a', { class: 'brand', href: '#/orders' },
    h('img', { src: 'assets/illustrations/wheat.svg', alt: '', width: 32, height: 32 }),
    h('span', { text: 'Panadería Efrata' }),
  );

  const navLinks = SECTIONS.map((section) => h('a', {
    class: 'nav-link',
    href: section.href,
    dataset: { section: section.key },
  }, Icon(section.icon, 'icon nav-icon'), h('span', { class: 'nav-label', text: section.label })));

  const nav = h('nav', { class: 'app-nav', 'aria-label': 'Secciones' }, navLinks);
  const header = h('header', { class: 'app-header' }, brand);
  const sidebar = h('aside', { class: 'app-sidebar' }, header, nav);
  const actionSlot = h('div', { class: 'section-action-slot' });
  const main = h('main', { class: 'app-main' });
  const fabSlot = h('div', { class: 'fab-slot' });

  const element = h('div', { class: 'app-shell' },
    banner,
    sidebar,
    h('div', { class: 'app-content' }, actionSlot, main),
    fabSlot,
  );

  return {
    element,
    banner,
    main,
    actionSlot,
    fabSlot,
    /** Marca la sección activa en la navegación. */
    setActiveSection(key) {
      for (const link of navLinks) {
        const active = link.dataset.section === key;
        link.classList.toggle('nav-link-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    },
  };
}
