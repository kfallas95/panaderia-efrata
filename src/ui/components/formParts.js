// Piezas comunes de formularios: título con "←", fecha, aviso general y botón Guardar.

import { h } from '../dom.js';

/** Título "← Nuevo producto" con enlace para volver. */
export function ScreenTitle(title, backHref) {
  return h('h1', { class: 'screen-title' },
    h('a', { class: 'back-link', href: backHref, 'aria-label': 'Volver', text: '←' }),
    ` ${title}`,
  );
}

/** Campo de fecha; por defecto hoy y sin permitir elegir días futuros. */
export function DateInput(value, max) {
  return h('input', { type: 'date', value, max });
}

/** Mensaje general del formulario (por ejemplo "No se pudo guardar"). */
export function FormMessage() {
  const element = h('p', { class: 'field-error form-message', role: 'alert' });
  element.hidden = true;
  return {
    element,
    set(message) {
      element.textContent = message ?? '';
      element.hidden = !message;
    },
  };
}

export function SubmitButton(label = 'Guardar') {
  return h('button', { type: 'submit', class: 'btn btn-primary btn-block', text: label });
}
