// Servicio del reporte (T-10.1). REQ-F-19 · INV-19, INV-21 · D-010, D-116.
// Solo lee: calcular el reporte no modifica ningún dato.

import { monthOf } from '../domain/dates.js';
import { selectReport } from '../state/selectors.js';

/**
 * @param {{ store }} deps
 */
export function createReportService({ store }) {
  return {
    /**
     * Totales del período en céntimos: { totalSold, totalExpenses, suppliesExpenses, servicesExpenses, profit }.
     * @param {{ type: 'DAY', date: string } | { type: 'MONTH', month: string }} period (ReportPeriod)
     */
    build(period) {
      return selectReport(store.getState(), period);
    },

    /**
     * Meses para la lista: los que tienen ventas o gastos más el mes actual,
     * del más reciente al más antiguo (D-116).
     * @param {string} currentMonth 'YYYY-MM'
     */
    availableMonths(currentMonth) {
      const { sales, expenses } = store.getState().data;
      const months = new Set([currentMonth]);
      sales.forEach((s) => months.add(monthOf(s.date)));
      expenses.forEach((e) => months.add(monthOf(e.date)));
      return [...months].sort().reverse();
    },
  };
}
