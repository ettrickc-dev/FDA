// Screen engine: renders a list of field definitions (see src/content/screens.js).
import { useId } from 'react';
import { formatMoney, isVisible, moneyError, PERIODS, sumFields, parseMoney, toggleChoice } from '../lib/formLogic.js';
import Help from './Help.jsx';

function Label({ f, htmlFor, as = 'label' }) {
  const Tag = as;
  return (
    <Tag className="field-label" {...(as === 'label' ? { htmlFor } : {})}>
      {f.label}{f.optional && <span className="opt"> (optional)</span>}
    </Tag>
  );
}

function Hint({ f, id }) {
  return f.hint ? <small id={id} className="hint">{f.hint}</small> : null;
}

function MoneyInput({ value, onChange, id, describedBy, label }) {
  const err = moneyError(value);
  return (
    <div className="money-wrap">
      <div className="money">
        <span aria-hidden="true">$</span>
        <input id={id} inputMode="decimal" autoComplete="off" value={value ?? ''}
          aria-label={label} aria-invalid={!!err} aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)} maxLength={14} />
      </div>
      {err && <small className="error" role="alert">{err}</small>}
    </div>
  );
}

function PeriodSelect({ value, onChange, label }) {
  return (
    <select value={value || ''} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      <option value="">per…</option>
      {PERIODS.map(([v, l]) => <option key={v} value={v}>per {l}</option>)}
    </select>
  );
}

function FieldControl({ f, value, set, data }) {
  const id = useId();
  const hintId = f.hint ? `${id}-hint` : undefined;

  switch (f.type) {
    case 'heading':
      return <h2 className="section-heading">{f.text}</h2>;

    case 'notice':
      return (
        <div className={`notice ${f.tone || ''}`} role="note">
          {(Array.isArray(f.text) ? f.text : [f.text]).map((t, i) => <p key={i}>{t}</p>)}
          {f.help && <Help topic={f.help} />}
        </div>
      );

    case 'text':
    case 'number':
      return (
        <div className="field">
          <Label f={f} htmlFor={id} />
          <Hint f={f} id={hintId} />
          <input id={id} autoComplete="off" value={value ?? ''} aria-describedby={hintId}
            inputMode={f.type === 'number' ? 'numeric' : f.inputMode}
            maxLength={f.maxLength || 120} placeholder={f.placeholder}
            onChange={(e) => set(f.type === 'number' ? e.target.value.replace(/[^\d]/g, '') : e.target.value)} />
          {f.help && <Help topic={f.help} />}
        </div>
      );

    case 'date':
      return (
        <div className="field">
          <Label f={f} htmlFor={id} />
          <Hint f={f} id={hintId} />
          <input id={id} type="date" value={value ?? ''} aria-describedby={hintId}
            onChange={(e) => set(e.target.value)} />
        </div>
      );

    case 'checkbox':
      return (
        <label className="choice">
          <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} />
          <span>{f.label}</span>
        </label>
      );

    case 'select':
      return (
        <div className="field">
          <Label f={f} htmlFor={id} />
          <Hint f={f} id={hintId} />
          <select id={id} value={value || ''} aria-describedby={hintId} onChange={(e) => set(e.target.value)}>
            <option value="">{f.placeholder || 'Choose one'}</option>
            {f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
          </select>
          {f.help && <Help topic={f.help} />}
        </div>
      );

    case 'radio':
      return (
        <fieldset className="field">
          <Label f={f} as="legend" />
          <Hint f={f} id={hintId} />
          {f.options.map((o) => (
            <label key={o.value} className="choice">
              <input type="radio" name={id} value={o.value} checked={value === o.value}
                onChange={() => set(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
          {f.help && <Help topic={f.help} />}
        </fieldset>
      );

    case 'checkboxes':
      return (
        <fieldset className="field">
          <Label f={f} as="legend" />
          <Hint f={f} id={hintId} />
          {f.options.map((o) => (
            <label key={o.value} className="choice">
              <input type="checkbox" checked={(value || []).includes(o.value)}
                onChange={() => set(toggleChoice(value, o.value, f.options))} />
              <span>{o.label}</span>
            </label>
          ))}
          {f.help && <Help topic={f.help} />}
        </fieldset>
      );

    case 'money':
      return (
        <div className="field">
          <Label f={f} htmlFor={id} />
          <Hint f={f} id={hintId} />
          <MoneyInput id={id} value={value} onChange={set} describedBy={hintId} />
          {f.help && <Help topic={f.help} />}
        </div>
      );

    case 'moneyPeriod': {
      const v = value || {};
      return (
        <fieldset className="field">
          <Label f={f} as="legend" />
          <Hint f={f} id={hintId} />
          <div className="money-period">
            <MoneyInput value={v.amount} label={`${f.label} amount`}
              onChange={(a) => set({ ...v, amount: a })} describedBy={hintId} />
            <PeriodSelect value={v.period} label={`${f.label} how often`}
              onChange={(p) => set({ ...v, period: p })} />
          </div>
          {v.amount && !v.period && <small className="warn">Choose how often (per week, per month…).</small>}
          {f.help && <Help topic={f.help} />}
        </fieldset>
      );
    }

    case 'checklistDetails': {
      const v = value || { selected: [], details: {} };
      const setSel = (sel) => set({ ...v, selected: sel });
      const setDet = (k, d) => set({ ...v, details: { ...v.details, [k]: { ...(v.details?.[k] || {}), ...d } } });
      return (
        <fieldset className="field">
          <Label f={f} as="legend" />
          <Hint f={f} id={hintId} />
          {f.options.map((o) => {
            const on = v.selected.includes(o.value);
            const d = v.details?.[o.value] || {};
            return (
              <div key={o.value} className={on ? 'cd-item on' : 'cd-item'}>
                <label className="choice">
                  <input type="checkbox" checked={on}
                    onChange={() => setSel(toggleChoice(v.selected, o.value, f.options))} />
                  <span>{o.label}</span>
                </label>
                {on && !o.exclusive && (
                  <div className="cd-details">
                    <div className="money-period">
                      <MoneyInput value={d.amount} label={`${o.label} amount`} onChange={(a) => setDet(o.value, { amount: a })} />
                      <PeriodSelect value={d.period} label={`${o.label} how often`} onChange={(p) => setDet(o.value, { period: p })} />
                    </div>
                    {o.askSource && (
                      <label className="field compact">
                        <span className="field-label">{o.sourceLabel || 'Paid by (source)'}</span>
                        <input autoComplete="off" value={d.source || ''} maxLength={80}
                          onChange={(e) => setDet(o.value, { source: e.target.value })} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {f.formLines > 0 && v.selected.filter((s) => !f.options.find((o) => o.value === s)?.exclusive).length > f.formLines && (
            <p className="overflow-note">The form has room for {f.formLines}. The rest will go on an extra page attached to your form.</p>
          )}
          {f.help && <Help topic={f.help} />}
        </fieldset>
      );
    }

    case 'list': {
      const items = Array.isArray(value) ? value : [];
      const update = (i, k, val) => set(items.map((it, j) => (j === i ? { ...it, [k]: val } : it)));
      const add = () => set([...items, {}]);
      const remove = (i) => set(items.filter((_, j) => j !== i));
      return (
        <fieldset className="field list">
          <Label f={f} as="legend" />
          <Hint f={f} id={hintId} />
          {items.map((it, i) => (
            <div key={i} className="list-item">
              <div className="list-item-head">
                <strong>{f.itemLabel} {i + 1}</strong>
                <button type="button" className="link small" onClick={() => remove(i)}
                  aria-label={`Remove ${f.itemLabel} ${i + 1}`}>Remove</button>
              </div>
              {f.fields.filter((sf) => isVisible(sf, it)).map((sf) => (
                <FieldControl key={sf.name} f={sf} value={it[sf.name]} data={it}
                  set={(val) => update(i, sf.name, val)} />
              ))}
            </div>
          ))}
          <button type="button" className="btn add" onClick={add}>
            + {items.length ? f.addAnotherLabel || `Add another ${f.itemLabel.toLowerCase()}` : f.addLabel || `Add ${f.itemLabel.toLowerCase()}`}
          </button>
          {f.formLines > 0 && items.length > f.formLines && (
            <p className="overflow-note">The form has room for {f.formLines}. The rest will go on an extra page attached to your form.</p>
          )}
          {f.help && <Help topic={f.help} />}
        </fieldset>
      );
    }

    case 'total': {
      const computed = sumFields(data, typeof f.sumOf === 'function' ? f.sumOf(data) : f.sumOf);
      const override = data?.[f.name];
      const overrideN = parseMoney(override);
      const mismatch = data?.[`${f.name}_custom`] && typeof overrideN === 'number' && !Number.isNaN(overrideN) && Math.abs(overrideN - computed) >= 0.01;
      return (
        <div className="field total-box" aria-live="polite">
          <div className="total-row">
            <span className="field-label">{f.label}</span>
            <strong className="total-amount">${formatMoney(computed)}</strong>
          </div>
          <label className="choice">
            <input type="checkbox" checked={!!data?.[`${f.name}_custom`]}
              onChange={(e) => f.setCustom(e.target.checked)} />
            <span>I want to enter a different total</span>
          </label>
          {data?.[`${f.name}_custom`] && (
            <MoneyInput value={override} label="Your total" onChange={set} />
          )}
          {mismatch && (
            <p className="warn">Your total doesn't match the lines above (they add up to ${formatMoney(computed)}). Please double-check before you continue.</p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export default function Fields({ fields, data, setData }) {
  return fields.filter((f) => isVisible(f, data)).map((f, i) => {
    const set = (val) => setData((d) => ({ ...d, [f.name]: val }));
    const field = f.type === 'total'
      ? { ...f, setCustom: (on) => setData((d) => ({ ...d, [`${f.name}_custom`]: on, ...(on ? {} : { [f.name]: '' }) })) }
      : f;
    return <FieldControl key={f.name || `${f.type}-${i}`} f={field} value={f.name ? data[f.name] : undefined} set={set} data={data} />;
  });
}
