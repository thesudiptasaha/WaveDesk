'use client';

import React from 'react';

export function StepBar({ tabs = [], active, onSelect }) {
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const isSelected = active === t.id;
        const isDone = Boolean(t.done);

        let variantCls = '';
        let inlineStyle = undefined;

        if (isDone && isSelected) {
          variantCls = 'border-sky-400 text-emerald-200';
          inlineStyle = { textShadow: '0 0 12px rgba(52,211,153,0.55)' };
        } else if (isDone && !isSelected) {
          variantCls = 'border-emerald-400/70 text-emerald-300';
          inlineStyle = {
            textShadow: '0 0 12px rgba(52,211,153,0.55)',
            boxShadow: '0 6px 14px -8px rgba(52,211,153,0.8)',
          };
        } else if (isSelected) {
          variantCls = 'border-sky-400 text-white';
        } else {
          variantCls = 'border-transparent text-zinc-500 hover:text-zinc-300';
        }

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect && onSelect(t.id)}
            title={isDone ? 'Completed' : undefined}
            aria-current={isSelected ? 'page' : undefined}
            style={inlineStyle}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition ${variantCls}`}
          >
            {t.label}
            {isDone ? <span className="sr-only">(completed)</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
