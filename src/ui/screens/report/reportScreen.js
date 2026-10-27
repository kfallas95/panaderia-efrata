// Pantalla Reporte (wireframe §10, T-10.1). REQ-F-19 · INV-19, INV-21 · D-010, D-046, D-084, D-116.
// Período en la dirección: #/report?period=day&date=YYYY-MM-DD o #/report?period=month&month=YYYY-MM.

import { h } from '../../dom.js';
import { Chips } from '../../components/chips.js';
import { FieldError } from '../../components/fieldError.js';
import { MoneyText } from '../../components/moneyText.js';
import { DateInput } from '../../components/formParts.js';
import { ReportPeriod } from '../../../domain/types.js';
import { isValidDate, isValidMonth, isFutureDate, monthOf, formatMonthLabel } from '../../../domain/dates.js';

const dayHref = (date) => `#/report?period=day&date=${date}`;
const monthHref = (month) => `#/report?period=month&month=${month}`;

/** Lee el período de la dirección; si falta o no es válido, usa el mes actual (D-116). */
function readPeriod(query, today) {
  if (query.period === 'day') {
    const date = isValidDate(query.date) && !isFutureDate(query.date, today) ? query.date : today;
    return { type: ReportPeriod.DAY, date };
  }
  const month = isValidMonth(query.month) && query.month <= monthOf(today) ? query.month : monthOf(today);
  return { type: ReportPeriod.MONTH, month };
}

function ReportCard(title, cents, details = []) {
  return h('div', { class: 'card report-card' },
    h('p', { class: 'text-muted', text: title }),
    MoneyText(cents, 'report-amount'),
    details.map(([label, value]) => h('p', { class: 'report-detail' }, `${label} `, MoneyText(value))),
  );
}

export function renderReportScreen(container, query, ctx) {
  const today = ctx.clock.today();
  const currentMonth = monthOf(today);
  const period = readPeriod(query, today);
  const isDay = period.type === ReportPeriod.DAY;
  const report = ctx.services.report.build(period);

  let picker;
  if (isDay) {
    const input = DateInput(period.date, today);
    input.addEventListener('change', () => {
      if (isValidDate(input.value) && !isFutureDate(input.value, today)) ctx.navigate(dayHref(input.value));
    });
    picker = FieldError({ label: 'Día', control: input });
  } else {
    const select = h('select', {},
      ctx.services.report.availableMonths(currentMonth).map((m) =>
        h('option', { value: m, text: formatMonthLabel(m), selected: m === period.month })),
    );
    select.addEventListener('change', () => ctx.navigate(monthHref(select.value)));
    picker = FieldError({ label: 'Mes', control: select });
  }

  container.append(
    h('h1', { text: 'Reporte' }),
    Chips([
      { label: 'Día', href: dayHref(today), active: isDay },
      { label: 'Mes', href: monthHref(currentMonth), active: !isDay },
    ], 'Período'),
    h('div', { class: 'report-picker' }, picker.element),
    h('div', { class: 'report-cards' },
      ReportCard('Total vendido', report.totalSold),
      ReportCard('Total de gastos', report.totalExpenses, [['Insumos', report.suppliesExpenses], ['Servicios', report.servicesExpenses]]),
      ReportCard('Ganancia', report.profit),
    ),
  );
}
