// Fechas y horas locales (T-1.4).
// El dominio no lee el reloj del sistema: recibe "hoy" o "ahora" como parámetro (design §2.1).
// Formatos: fecha 'YYYY-MM-DD', hora 'HH:MM', ahora = { date: 'YYYY-MM-DD', time: 'HH:MM' }.
//
// Para comparar fechas y horas se convierten a "minutos de reloj" con Date.UTC.
// Así la cuenta no depende de la zona horaria del navegador: nunca se usa
// new Date('2026-11-07'), que se interpreta como UTC y en Costa Rica (UTC-6)
// daría el día anterior.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** true si el texto es una fecha real con formato YYYY-MM-DD (rechaza 2026-02-30). */
export function isValidDate(text) {
  const match = DATE_PATTERN.exec(String(text ?? ''));
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  return d <= daysInMonth;
}

/** true si el texto es una hora válida HH:MM (24 h). */
export function isValidTime(text) {
  return TIME_PATTERN.test(String(text ?? ''));
}

/** Minutos de reloj de una fecha y hora locales. Solo sirve para comparar y sumar. */
export function toClockMinutes(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
}

/** Minutos de reloj de una fecha y hora ISO guardada con su zona, por ejemplo countedAt. */
export function isoToClockMinutes(iso) {
  return toClockMinutes(iso.slice(0, 10), iso.slice(11, 16));
}

/** Minutos de reloj del momento "ahora" ({date, time}). */
export function nowToClockMinutes(now) {
  return toClockMinutes(now.date, now.time);
}

/** true si la fecha es posterior a hoy (REQ-F-23). */
export function isFutureDate(date, today) {
  return date > today;
}

/** Mes de una fecha: '2026-11-07' → '2026-11'. */
export function monthOf(date) {
  return date.slice(0, 7);
}

/** true si la fecha cae dentro del día indicado. */
export function isInDay(date, day) {
  return date === day;
}

/** true si la fecha cae dentro del mes indicado ('YYYY-MM'). */
export function isInMonth(date, month) {
  return monthOf(date) === month;
}

