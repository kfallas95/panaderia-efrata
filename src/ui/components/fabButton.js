// Botón (+) de la sección (T-4.3, D-046).
// Celular: botón flotante abajo a la derecha. Computadora: botón en el encabezado
// de la sección (design §3.4). En Inventario abre un menú con 5 acciones.

import { h } from '../dom.js';

// Un solo par de escuchas en el documento cierra cualquier menú abierto
// (clic afuera o Escape), para no agregar escuchas nuevas en cada pantalla.
let openMenuCloser = null;
let documentListening = false;

function listenOnce() {
  if (documentListening) return;
  documentListening = true;
  document.addEventListener('click', () => openMenuCloser?.());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') openMenuCloser?.();
  });
}

/**
 * @param {{ label: string, href?: string, menu?: Array<{label: string, href: string}> }} action
 * @param {'floating' | 'header'} variant
 */
export function FabButton(action, variant) {
  const isFloating = variant === 'floating';
  const content = isFloating ? h('span', { 'aria-hidden': 'true', text: '+' }) : `+ ${action.label}`;
  const baseClass = isFloating ? 'fab' : 'btn btn-primary section-action';

  if (!action.menu) {
    return h('a', { class: baseClass, href: action.href, 'aria-label': isFloating ? action.label : null }, content);
  }

  const menu = h('div', { class: 'fab-menu', role: 'menu' },
    action.menu.map((item) => h('a', { class: 'fab-menu-item', role: 'menuitem', href: item.href, text: item.label })),
  );
  menu.hidden = true;

  const button = h('button', {
    type: 'button',
    class: baseClass,
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    'aria-label': isFloating ? action.label : null,
  }, content);

  const setOpen = (open) => {
    if (open) openMenuCloser?.();
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    openMenuCloser = open ? () => setOpen(false) : null;
  };
  listenOnce();
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(menu.hidden);
  });
  menu.addEventListener('click', () => setOpen(false));

  return h('div', { class: isFloating ? 'fab-wrapper' : 'section-action-wrapper' }, menu, button);
}
