import React, { useState, useRef, useEffect } from 'react';
import { STATUS_META, ROLE_LABEL } from '../../utils/constants';
import { Icon } from './Icons';

export function StatusBadge({ status, removed = false }) {
  const meta = STATUS_META[status] || STATUS_META.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset backdrop-blur-md ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.live ? 'live-dot' : ''}`} />
      {removed ? 'Published, later removed' : status}
    </span>
  );
}

export function TypeBadge({ type }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300">
      {type}
    </span>
  );
}

export function TypeBox({ type, small = false }) {
  return <span className="type-box" style={small ? { fontSize: '8.5px', padding: '1px 5px' } : undefined}>{type || 'UNKNOWN'}</span>;
}

export function IdBox({ uid, small = false }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!uid) return null;

  const handleCopy = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    let ok = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(uid));
        ok = true;
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = String(uid);
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (__) {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCopy(e);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      aria-label={`Copy content ID ${uid}`}
      title="Click to copy the content ID"
      className="type-box cursor-pointer select-none inline-flex items-center gap-1.5 font-mono whitespace-nowrap"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.03em',
        fontWeight: 700,
        lineHeight: 1.35,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        fontSize: small ? '11px' : '13px',
        padding: small ? '2px 7px' : '3px 9px',
      }}
    >
      <Icon name="folder" strokeWidth={2.2} className={`shrink-0 text-amber-500 ${small ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      <span>{copied ? 'Copied' : uid}</span>
    </span>
  );
}

export function RoleBadge({ role }) {
  const tone =
    role === 'owner'
      ? 'text-amber-300 bg-amber-500/15 ring-amber-400/25'
      : role === 'manager'
      ? 'text-sky-300 bg-sky-500/15 ring-sky-400/25'
      : 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${tone}`}>{ROLE_LABEL[role] || role}</span>;
}

export function DesignationPill({ designation }) {
  if (!designation) return null;
  return (
    <span className="inline-flex max-w-[160px] items-center truncate whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400 backdrop-blur-md">
      {designation}
    </span>
  );
}
