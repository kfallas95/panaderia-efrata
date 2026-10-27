// Campo de formulario con su mensaje de error junto al campo (T-4.4, RC-04, REQ-F-20).

import { h } from '../dom.js';

let nextId = 0;

/**
 * @param {{ label: string, control: HTMLElement, optional?: boolean }} options
 * @returns {{ element: HTMLElement, control: HTMLElement, setError: (message: string|null) => void }}
 */
export function FieldError({ label, control, optional = false }) {
  nextId += 1;
  const id = control.id || `campo-${nextId}`;
  const errorId = `${id}-error`;
  control.id = id;

  const error = h('div', { class: 'field-error', id: errorId, role: 'alert' });
  error.hidden = true;

  const element = h('div', { class: 'field' },
    h('label', { for: id }, label, optional ? h('span', { class: 'text-muted', text: ' (opcional)' }) : null),
    control,
    error,
  );

  return {
    element,
    control,
    setError(message) {
      error.textContent = message ?? '';
      error.hidden = !message;
      if (message) control.setAttribute('aria-describedby', errorId);
      else control.removeAttribute('aria-describedby');
      control.classList.toggle('has-error', Boolean(message));
    },
  };
}
