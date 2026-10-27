// Nuevo / editar insumo (wireframe §8). REQ-F-07, REQ-F-20 a REQ-F-22 · D-039, D-102.

import { h } from '../../dom.js';
import { FieldError } from '../../components/fieldError.js';
import { ScreenTitle, FormMessage, SubmitButton } from '../../components/formParts.js';
import { SupplyUnit, SUPPLY_UNIT_LABELS } from '../../../domain/types.js';
import { MSG } from '../../../domain/messages.js';

/** @param {{ id?: string }} params */
export function renderSupplyForm(container, { id = null }, ctx) {
  const supply = id ? ctx.store.getState().data.supplies.find((s) => s.id === id) : null;
  const backHref = supply ? `#/inventory/supplies/${id}` : '#/inventory/supplies';
  const locked = ctx.services.supplies.isUnitLocked(id);

  const name = FieldError({ label: 'Nombre', control: h('input', { type: 'text', value: supply?.name ?? '', autocomplete: 'off' }) });
  const select = h('select', { disabled: locked },
    h('option', { value: '', text: 'Elige una unidad' }),
    Object.values(SupplyUnit).map((unit) => h('option', { value: unit, text: SUPPLY_UNIT_LABELS[unit], selected: supply?.unit === unit })),
  );
  const unit = FieldError({ label: 'Unidad', control: select });
  const message = FormMessage();

  const form = h('form', { class: 'form', novalidate: true },
    name.element,
    unit.element,
    locked ? h('p', { class: 'text-muted field-note', text: MSG.UNIT_LOCKED }) : null,
    message.element,
    SubmitButton(),
  );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await ctx.services.supplies.save({ id, name: name.control.value, unit: select.value });
    name.setError(result.errors?.name);
    unit.setError(result.errors?.unit);
    message.set(result.errors?.form);
    if (result.ok) ctx.navigate(supply ? backHref : '#/inventory/supplies');
  });

  container.append(ScreenTitle(supply ? 'Editar insumo' : 'Nuevo insumo', backHref), form);
}
