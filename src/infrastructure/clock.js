// Reloj del sistema con fecha simulada para pruebas manuales (T-2.4).
// D-057, D-079 · docs/design.md §5.3 · R5.
//
// Uso de la fecha simulada: agregar a la dirección, antes del #,
//   ?today=AAAA-MM-DD            (la hora es la real del computador)
//   ?today=AAAA-MM-DD&time=HH:MM
// El reloj simulado AVANZA desde esa fecha y hora (D-079).
//
// Este es el único archivo que lee la hora del sistema (system_prompt.md §3).

import { isValidDate, isValidTime } from '../domain/dates.js';

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' en hora local. */
function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'HH:MM' en hora local. */
function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO local con zona: '2026-11-07T14:59:00-06:00'. */
function formatIsoLocal(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = pad(Math.floor(Math.abs(offset) / 60));
  const minutes = pad(Math.abs(offset) % 60);
  return `${formatDate(date)}T${formatTime(date)}:${pad(date.getSeconds())}${sign}${hours}:${minutes}`;
}

/**
 * Lee ?today y ?time. Devuelve null si no hay fecha simulada o si es inválida.
 * @param {string} search por ejemplo location.search
 */
export function parseSimulation(search) {
  const params = new URLSearchParams(search);
  const today = params.get('today');
  if (!today || !isValidDate(today)) return null;
  const time = params.get('time');
  return { today, time: time && isValidTime(time) ? time : null };
}

export class SystemClock {
  /**
   * @param {string} [search] parámetros de la dirección (location.search)
   * @param {() => number} [realNowMs] hora real en milisegundos
   */
  constructor(search = '', realNowMs = () => Date.now()) {
    this.realNowMs = realNowMs;
    this.simulation = parseSimulation(search);
    this.offsetMs = 0;

    if (this.simulation) {
      const realStart = new Date(realNowMs());
      const [y, m, d] = this.simulation.today.split('-').map(Number);
      const [hh, mm] = this.simulation.time
        ? this.simulation.time.split(':').map(Number)
        : [realStart.getHours(), realStart.getMinutes()];
      const seconds = this.simulation.time ? 0 : realStart.getSeconds();
      const simulatedStart = new Date(y, m - 1, d, hh, mm, seconds);
      this.offsetMs = simulatedStart.getTime() - realStart.getTime();
    }
  }

  /** true si la app usa una fecha simulada (para el aviso de D-057). */
  get isSimulated() {
    return this.simulation !== null;
  }

  /** Fecha y hora actuales (reales o simuladas). */
  now() {
    return new Date(this.realNowMs() + this.offsetMs);
  }

  /** 'YYYY-MM-DD' de hoy. */
  today() {
    return formatDate(this.now());
  }

  /** { date, time } para las funciones del dominio. */
  nowParts() {
    const now = this.now();
    return { date: formatDate(now), time: formatTime(now) };
  }

  /** Momento actual en ISO local con zona, para createdAt, closedAt y countedAt. */
  nowIso() {
    return formatIsoLocal(this.now());
  }
}
