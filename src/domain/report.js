// Reporte por día o por mes (T-1.7). INV-19 · REQ-F-19 · D-010.
// Las salidas de inventario no cuentan como venta ni como gasto (INV-21).

import { ExpenseCategory, ReportPeriod } from './types.js';
import { isInDay, isInMonth } from './dates.js';
import { saleTotal } from './totals.js';

/**
 * @param {{sales: Array, expenses: Array}} data
 * @param {{type: 'DAY', date: string} | {type: 'MONTH', month: string}} period
 * @returns {{totalSold: number, totalExpenses: number, suppliesExpenses: number,
 *            servicesExpenses: number, profit: number}} montos en céntimos
 */
export function buildReport(data, period) {
  const inPeriod = period.type === ReportPeriod.DAY
    ? (date) => isInDay(date, period.date)
    : (date) => isInMonth(date, period.month);

  const totalSold = data.sales
    .filter((sale) => inPeriod(sale.date))
    .reduce((total, sale) => total + saleTotal(sale), 0);

  const expenses = data.expenses.filter((e) => inPeriod(e.date));
  const suppliesExpenses = expenses
    .filter((e) => e.category === ExpenseCategory.SUPPLIES)
    .reduce((total, e) => total + e.amount, 0);
  const servicesExpenses = expenses
    .filter((e) => e.category === ExpenseCategory.SERVICES)
    .reduce((total, e) => total + e.amount, 0);
  const totalExpenses = suppliesExpenses + servicesExpenses;

  return {
    totalSold,
    totalExpenses,
    suppliesExpenses,
    servicesExpenses,
    profit: totalSold - totalExpenses,
  };
}
