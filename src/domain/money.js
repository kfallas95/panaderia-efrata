// Dinero en colones (T-1.2).
// Montos guardados como céntimos enteros (D-025): 125050 = ₡1 250,50.
// Lectura: coma o punto como separador decimal; sin separadores de miles;
// máximo 2 decimales (D-058, REQ-F-28). Negativos con el signo antes del símbolo (D-084).

import { MSG, maxDecimals } from './messages.js';

const NUMBER_PATTERN = /^(-?)(\d+)(?:[.,](\d+))?$/;

/**
 * Lee un número escrito por el usuario y lo devuelve escalado a un entero.
 * Ejemplo: parseScaledNumber('2,5', 3) → { ok: true, value: 2500 }.
 * No valida si es positivo: eso lo hacen los validadores (REQ-F-21).
 * @param {string} text
 * @param {number} decimals máximo de decimales permitidos
 * @returns {{ok: true, value: number} | {ok: false, error: string}}
 */
export function parseScaledNumber(text, decimals) {
  const raw = String(text ?? '').trim();
  if (raw === '') return { ok: false, error: MSG.REQUIRED };

  const match = NUMBER_PATTERN.exec(raw);
  if (!match) return { ok: false, error: MSG.INVALID_NUMBER };

  const [, sign, wholePart, fractionPart = ''] = match;
  if (fractionPart.length > decimals) {
    return { ok: false, error: decimals === 0 ? MSG.INTEGER : maxDecimals(decimals) };
  }

  const scale = 10 ** decimals;
  const whole = Number(wholePart);
  const fraction = Number(fractionPart.padEnd(decimals, '0') || '0');
  const value = whole * scale + fraction;
  if (!Number.isSafeInteger(value)) return { ok: false, error: MSG.INVALID_NUMBER };

  return { ok: true, value: sign === '-' ? -value : value };
}

/**
 * Lee un monto en colones y lo devuelve en céntimos.
 * '1250,50' y '1250.50' → 125050 · '1.250' → error de decimales.
 */
export function parseMoney(text) {
  return parseScaledNumber(text, 2);
}

/** Agrupa los miles con un espacio: 1250 → "1 250". */
function groupThousands(integerText) {
  return integerText.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Muestra céntimos como colones: 125050 → "₡1 250,50"; -1300050 → "−₡13 000,50".
 * @param {number} cents
 */
export function formatMoney(cents) {
  const sign = cents < 0 ? '−' : '';
  const absolute = Math.abs(Math.trunc(cents));
  const colones = groupThousands(String(Math.floor(absolute / 100)));
  const centimos = String(absolute % 100).padStart(2, '0');
  return `${sign}₡${colones},${centimos}`;
}
