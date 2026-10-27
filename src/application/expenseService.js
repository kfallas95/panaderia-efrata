// Servicio de gastos (T-6.3). REQ-F-09 a REQ-F-11, REQ-F-23 · INV-08 · D-037, D-040, D-041, D-075, D-103.

import { MSG } from '../domain/messages.js';
import { parseMoney } from '../domain/money.js';
import { parseSupplyQuantity } from '../domain/quantity.js';
import { isValidDate, isValidTime } from '../domain/dates.js';
import { supplyQuantity } from '../domain/stock.js';
import { ExpenseCategory, SUPPLY_UNIT_LABELS } from '../domain/types.js';
import {
  isBlank,
  validateRequired,
  validatePositive,
  validateNotFutureDate,
  checkSupplyAdjustment,
} from '../domain/validators.js';
import { upsertEntity, removeEntity } from '../state/store.js';
import { success, failure, collectErrors } from './result.js';

/**
 * Verificación defensiva de REQ-F-11: ningún insumo afectado queda en negativo
 * después del cambio. Con las reglas actuales no se dispara.
 */
function checkSuppliesAfter(data, nextExpenses, supplyIds) {
  const next = { ...data, expenses: nextExpenses };
  for (const supplyId of supplyIds) {
    if (!supplyId) continue;
    const after = supplyQuantity(supplyId, next);
    if (after < 0) {
      const supply = data.supplies.find((s) => s.id === supplyId);
      const current = supplyQuantity(supplyId, data);
      return checkSupplyAdjustment(current, after - current, SUPPLY_UNIT_LABELS[supply.unit], supply.name);
    }
  }
  return null;
}

/**
 * @param {{ store, repositories, clock, idGenerator }} deps
 */
export function createExpenseService({ store, repositories, clock, idGenerator }) {
  const data = () => store.getState().data;

  return {
    /**
     * Crea o edita un gasto.
     * @param {{ id?: string, category: string, description: string, supplyId?: string,
     *           quantityText?: string, amountText: string, date: string, time: string }} input
     */
    async save({ id = null, category, description, supplyId = '', quantityText = '', amountText, date, time }) {
      const existing = id ? data().expenses.find((e) => e.id === id) : null;
      const isSupplies = category === ExpenseCategory.SUPPLIES;
      const amount = parseMoney(amountText);
      const quantity = parseSupplyQuantity(quantityText);
      // Al editar se acepta el insumo original aunque esté desactivado.
      const supply = data().supplies.find((s) => s.id === supplyId && (s.isActive || s.id === existing?.supplyId));

      const errors = collectErrors([
        ['category', Object.values(ExpenseCategory).includes(category) ? null : MSG.REQUIRED],
        ['description', validateRequired(description)],
        ['supplyId', isSupplies && !supply ? MSG.REQUIRED : null],
        ['quantity', isSupplies ? (quantity.ok ? validatePositive(quantity.value) : quantity.error) : null],
        ['amount', amount.ok ? validatePositive(amount.value) : amount.error],
        ['date', isBlank(date) || !isValidDate(date) ? MSG.REQUIRED : validateNotFutureDate(date, clock.today())],
        ['time', isValidTime(time) ? null : MSG.REQUIRED],
      ]);
      if (errors) return failure(errors);

      const expense = {
        id: existing?.id ?? idGenerator.newId(),
        category,
        date,
        time,
        amount: amount.value,
        description: description.trim(),
        ...(isSupplies ? { supplyId, quantity: quantity.value } : {}),
      };

      const nextExpenses = existing
        ? data().expenses.map((e) => (e.id === id ? expense : e))
        : [...data().expenses, expense];
      const stockError = checkSuppliesAfter(data(), nextExpenses, [existing?.supplyId, expense.supplyId]);
      if (stockError) return failure({ quantity: stockError });

      try {
        await repositories.expenses.put(expense);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => upsertEntity(state, 'expenses', expense));
      return success(expense);
    },

    async remove(id) {
      const existing = data().expenses.find((e) => e.id === id);
      const stockError = checkSuppliesAfter(data(), data().expenses.filter((e) => e.id !== id), [existing?.supplyId]);
      if (stockError) return failure({ form: stockError });
      try {
        await repositories.expenses.delete(id);
      } catch {
        return failure({ form: MSG.SAVE_FAILED });
      }
      store.setState((state) => removeEntity(state, 'expenses', id));
      return success();
    },
  };
}
