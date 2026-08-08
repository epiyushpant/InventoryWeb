'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CapabilityItem } from './CapabilityProvider';

export type CapValueMap = Record<string, boolean>;

type Mode = 'capability' | 'permission';

type Props = {
  items: CapabilityItem[];
  /** Tick state being edited. Raw values — the cascade is applied for display only. */
  value: CapValueMap;
  onToggle: (updates: CapValueMap) => void;
  mode?: Mode;
  /**
   * Permission mode only: the shop's effective capabilities. A key that is false here cannot be
   * granted to a role, so its row is locked.
   */
  shopEnabled?: CapValueMap;
  busy?: boolean;
};

/**
 * Same cascade the API applies: a key is live only when its own tick is on and every gate above
 * it is on. Used here purely to dim blocked rows while editing, before anything is saved.
 */
export function computeEffective(items: CapabilityItem[], value: CapValueMap): CapValueMap {
  const byKey = new Map(items.map((i) => [i.key, i]));
  const effective: CapValueMap = {};
  const resolving = new Set<string>();

  const resolve = (key: string): boolean => {
    if (key in effective) return effective[key];
    const item = byKey.get(key);
    if (!item) return value[key] !== false;
    if (resolving.has(key)) return false;
    resolving.add(key);

    let on = !!value[key];
    if (on && item.parent) on = resolve(item.parent);
    if (on && item.requires?.length) on = item.requires.every(resolve);
    // A field can live on several pages; it survives while any of them is live.
    if (on && item.forms?.length) on = item.forms.some(resolve);

    resolving.delete(key);
    effective[key] = on;
    return on;
  };

  items.forEach((i) => resolve(i.key));
  return effective;
}

function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="cap-check"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export default function CapabilityTree({
  items,
  value,
  onToggle,
  mode = 'capability',
  shopEnabled,
  busy,
}: Props) {
  const isPermission = mode === 'permission';

  const byKey = useMemo(() => new Map(items.map((i) => [i.key, i])), [items]);
  const modules = useMemo(() => items.filter((i) => i.category === 'module'), [items]);
  const features = useMemo(() => items.filter((i) => i.category === 'feature'), [items]);

  const pagesOf = (moduleKey: string) =>
    items.filter((i) => i.category === 'form' && i.parent === moduleKey);
  const reportsOf = (moduleKey: string) =>
    items.filter((i) => i.category === 'report' && i.parent === moduleKey);
  const fieldsOf = (formKey: string) =>
    items.filter((i) => i.category === 'field' && (i.forms || []).includes(formKey));

  const [selected, setSelected] = useState<string>(modules[0]?.key ?? '');
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selected && modules.length > 0) setSelected(modules[0].key);
  }, [modules, selected]);

  const effective = useMemo(() => computeEffective(items, value), [items, value]);

  /** Why a row cannot be used, or null when it is fine. */
  const blockedReason = (item: CapabilityItem): string | null => {
    if (isPermission && shopEnabled && shopEnabled[item.key] === false) {
      return 'Not enabled for this shop';
    }
    if (!isPermission) {
      if (item.parent && !effective[item.parent]) {
        return `${byKey.get(item.parent)?.label ?? 'Module'} is off`;
      }
      const failedGate = (item.requires || []).find((r) => !effective[r]);
      if (failedGate) return `${byKey.get(failedGate)?.label ?? failedGate} is off`;
      if (item.forms?.length && !item.forms.some((f) => effective[f])) {
        return 'Its pages are off';
      }
    }
    return null;
  };

  const selectedModule = byKey.get(selected);
  const selectedPages = selected ? pagesOf(selected) : [];
  const selectedReports = selected ? reportsOf(selected) : [];

  /** Every grantable descendant of a module — used by the bulk control and the counter. */
  const descendantsOf = (moduleKey: string) => {
    const pages = pagesOf(moduleKey);
    const fields = pages.flatMap((p) => fieldsOf(p.key));
    const unique = new Map<string, CapabilityItem>();
    [...pages, ...reportsOf(moduleKey), ...fields].forEach((i) => unique.set(i.key, i));
    return Array.from(unique.values());
  };

  const setMany = (keys: string[], next: boolean) => {
    const updates: CapValueMap = {};
    keys.forEach((k) => {
      const item = byKey.get(k);
      if (isPermission && item && blockedReason(item)) return;
      updates[k] = next;
    });
    onToggle(updates);
  };

  const moduleState = (moduleKey: string) => {
    const pages = pagesOf(moduleKey);
    const onPages = pages.filter((p) => value[p.key]).length;

    if (isPermission) {
      const kids = descendantsOf(moduleKey);
      const on = kids.filter((k) => value[k.key]).length;
      return { onPages, totalPages: pages.length, checked: on > 0 && on === kids.length, partial: on > 0 };
    }
    return { onPages, totalPages: pages.length, checked: !!value[moduleKey], partial: false };
  };

  const toggleModule = (moduleKey: string) => {
    if (isPermission) {
      const kids = descendantsOf(moduleKey).map((k) => k.key);
      const allOn = kids.every((k) => value[k]);
      setMany(kids, !allOn);
      return;
    }
    onToggle({ [moduleKey]: !value[moduleKey] });
  };

  const fieldsVisible = (formKey: string) => hovered === formKey || pinned.has(formKey);

  const togglePin = (formKey: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(formKey)) next.delete(formKey);
      else next.add(formKey);
      return next;
    });
  };

  const renderRow = (item: CapabilityItem, extra?: React.ReactNode) => {
    const reason = blockedReason(item);
    const locked = !!reason;
    return (
      <div className={`cap-row ${locked ? 'is-blocked' : ''}`}>
        <input
          type="checkbox"
          className="cap-check"
          checked={!!value[item.key]}
          disabled={locked || busy}
          onChange={() => onToggle({ [item.key]: !value[item.key] })}
          aria-label={item.label}
        />
        <span className="cap-row-body">
          <span className="cap-row-label">{item.label}</span>
          <span className="cap-row-key">{item.key}</span>
        </span>
        {extra}
        {reason && <span className="cap-note">{reason}</span>}
      </div>
    );
  };

  return (
    <div className="cap-tree">
      <aside className="cap-tree-aside">
        <div className="cap-aside-title">Modules</div>
        {modules.map((m) => {
          const { onPages, totalPages, checked, partial } = moduleState(m.key);
          const dimmed = !isPermission && !value[m.key];
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelected(m.key)}
              className={`cap-aside-item ${selected === m.key ? 'active' : ''} ${dimmed ? 'is-off' : ''}`}
            >
              <TriStateCheckbox
                checked={checked}
                indeterminate={partial}
                disabled={busy}
                onChange={() => toggleModule(m.key)}
                label={`Toggle ${m.label}`}
              />
              <span className="cap-aside-text">
                <span className="cap-aside-label">{m.label}</span>
                <span className="cap-aside-meta">
                  {totalPages > 0 ? `${onPages} of ${totalPages} pages on` : 'No pages'}
                </span>
              </span>
            </button>
          );
        })}

        {!isPermission && features.length > 0 && (
          <>
            <div className="cap-aside-title" style={{ marginTop: '1rem' }}>
              Features
            </div>
            <p className="cap-aside-hint">
              Cross-cutting switches with no screen of their own. Turning one off removes the fields
              and reports that depend on it.
            </p>
            {features.map((f) => (
              <label key={f.key} className="cap-aside-item as-label">
                <input
                  type="checkbox"
                  className="cap-check"
                  checked={!!value[f.key]}
                  disabled={busy}
                  onChange={() => onToggle({ [f.key]: !value[f.key] })}
                />
                <span className="cap-aside-text">
                  <span className="cap-aside-label">{f.label}</span>
                  <span className="cap-aside-meta">{f.key}</span>
                </span>
              </label>
            ))}
          </>
        )}
      </aside>

      <section className="cap-tree-main">
        {!selectedModule ? (
          <p className="cap-empty">Select a module to see its pages and reports.</p>
        ) : (
          <>
            <header className="cap-main-head">
              <div>
                <h3>{selectedModule.label}</h3>
                <p>
                  {isPermission
                    ? 'Tick what this role may open. Rows the shop has switched off cannot be granted.'
                    : !value[selectedModule.key]
                      ? 'This module is off, so everything below is blocked. Ticks are kept for when you turn it back on.'
                      : 'Pages and reports in this module. Hover a page to see its fields.'}
                </p>
              </div>
              <div className="cap-bulk">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={busy}
                  onClick={() => setMany(descendantsOf(selected).map((d) => d.key), true)}
                >
                  All on
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={busy}
                  onClick={() => setMany(descendantsOf(selected).map((d) => d.key), false)}
                >
                  All off
                </button>
              </div>
            </header>

            {selectedPages.length === 0 && selectedReports.length === 0 && (
              <p className="cap-empty">
                This module has no screens of its own. It only gates the features and reports listed
                elsewhere.
              </p>
            )}

            {selectedPages.length > 0 && (
              <div className="cap-section">
                <div className="cap-section-title">Pages</div>
                {selectedPages.map((page) => {
                  const fields = fieldsOf(page.key);
                  const open = fieldsVisible(page.key);
                  return (
                    <div
                      key={page.key}
                      className="cap-page"
                      onMouseEnter={() => setHovered(page.key)}
                      onMouseLeave={() => setHovered((h) => (h === page.key ? null : h))}
                    >
                      {renderRow(
                        page,
                        fields.length > 0 ? (
                          <button
                            type="button"
                            className={`cap-chip ${open ? 'active' : ''}`}
                            onClick={() => togglePin(page.key)}
                            aria-expanded={open}
                          >
                            {fields.length} field{fields.length > 1 ? 's' : ''}
                            {pinned.has(page.key) ? ' ▾' : ' ▸'}
                          </button>
                        ) : undefined
                      )}
                      {open && fields.length > 0 && (
                        <div className="cap-fields">
                          {fields.map((field) => {
                            const otherPages = (field.forms || []).filter((f) => f !== page.key);
                            return (
                              <div key={field.key}>
                                {renderRow(
                                  field,
                                  otherPages.length > 0 ? (
                                    <span className="cap-tag">
                                      also on{' '}
                                      {otherPages
                                        .map((f) => byKey.get(f)?.label ?? f)
                                        .join(', ')}
                                    </span>
                                  ) : undefined
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedReports.length > 0 && (
              <div className="cap-section">
                <div className="cap-section-title">Reports</div>
                {selectedReports.map((report) => (
                  <div key={report.key}>{renderRow(report)}</div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
