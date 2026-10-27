// Confirmación simple con texto (T-4.4). REQ-F-02, REQ-F-14, REQ-F-16.

import { h } from '../dom.js';

/**
 * Muestra una confirmación y espera la respuesta.
 * @param {{ message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} options
 * @returns {Promise<boolean>} true si el usuario confirma
 */
export function confirmDialog({ message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const confirm = h('button', { type: 'button', class: danger ? 'btn btn-danger' : 'btn btn-primary', text: confirmLabel });
    const cancel = h('button', { type: 'button', class: 'btn', text: cancelLabel });
    const dialog = h('dialog', { class: 'confirm-dialog' },
      h('p', { text: message }),
      h('div', { class: 'dialog-actions' }, cancel, confirm),
    );

    const close = (answer) => {
      dialog.close();
      dialog.remove();
      resolve(answer);
    };
    confirm.addEventListener('click', () => close(true));
    cancel.addEventListener('click', () => close(false));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close(false);
    });

    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
