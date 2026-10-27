// Aviso de fecha simulada (T-4.5, D-057).

import { h } from '../dom.js';
import { formatDateLabel } from '../../domain/dates.js';

/**
 * @param {{ date: string, time: string }} now hora simulada actual
 * @param {string} realUrl dirección sin los parámetros de simulación
 */
export function SimulatedDateBanner(now, realUrl) {
  return h('div', { class: 'simulated-banner', role: 'status' },
    `Fecha simulada: ${formatDateLabel(now.date)}, ${now.time} · `,
    h('a', { href: realUrl, text: 'Volver a la fecha real' }),
  );
}
