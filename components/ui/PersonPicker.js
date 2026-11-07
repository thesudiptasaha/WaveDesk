'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icons';
import { Avatar, inputBase, inputLocked } from './Shared';
import { isExternal } from '../../lib/core';

export function PersonPicker({ open, onClose, title, members, value, onSelect, allowClear = true, team }) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const byKeyboardRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setHighlightIndex(null);
      return;
    }
    setHighlightIndex(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (byKeyboardRef.current && highlightIndex !== null && listRef.current) {
      byKeyboardRef.current = false;
      const el = listRef.current.children[highlightIndex];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const stop = (e) => e.stopPropagation();

  const extraMember = useMemo(() => {
    if (!value) return null;
    const exists = (members || []).some((m) => m.full_name === value);
    if (exists) return null;
    const found = (team || []).find((m) => m.full_name === value);
    return found || { full_name: value };
  }, [value, members, team]);

  const sortedMembers = useMemo(() => {
    const list = [...(members || [])];
    list.sort((a, b) => {
      const nameA = (a.nickname || a.full_name || '').toLowerCase();
      const nameB = (b.nickname || b.full_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return list;
  }, [members]);

  const matchesQuery = (m, q) => {
    if (!q) return true;
    const nick = String(m?.nickname || '').toLowerCase();
    const name = String(m?.full_name || '').toLowerCase();
    const desig = String(m?.designation || '').toLowerCase();
    return nick.includes(q) || name.includes(q) || desig.includes(q);
  };

  const q = search.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    return sortedMembers.filter((m) => matchesQuery(m, q));
  }, [sortedMembers, q]);

  const extraMatches = extraMember ? matchesQuery(extraMember, q) : false;

  const showUnassigned = allowClear && (!q || 'unassigned'.includes(q) || 'clear'.includes(q));

  const listItems = useMemo(() => {
    const items = [];
    if (showUnassigned) {
      items.push({ kind: 'unassigned' });
    }
    if (extraMember && extraMatches) {
      items.push({ kind: 'extra', member: extraMember });
    }
    filteredMembers.forEach((m) => {
      items.push({ kind: 'member', member: m });
    });
    return items;
  }, [showUnassigned, extraMember, extraMatches, filteredMembers]);

  const handleSelect = (item) => {
    if (!item) return;
    if (item.kind === 'unassigned') {
      onSelect('');
      onClose();
    } else if (item.kind === 'extra' || item.kind === 'member') {
      onSelect(item.member.full_name);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (listItems.length) {
        byKeyboardRef.current = true;
        setHighlightIndex((prev) => (prev === null ? 0 : (prev + 1) % listItems.length));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (listItems.length) {
        byKeyboardRef.current = true;
        setHighlightIndex((prev) => (prev === null ? listItems.length - 1 : (prev - 1 + listItems.length) % listItems.length));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex !== null) {
        if (listItems[highlightIndex]) {
          handleSelect(listItems[highlightIndex]);
        }
      } else if (search.trim()) {
        const firstMatch = listItems.find((it) => it.kind === 'member' || it.kind === 'extra');
        if (firstMatch) {
          handleSelect(firstMatch);
        }
      }
    }
  };

  if (!mounted || !open) return null;

  const hasNoEligible = (!members || members.length === 0) && !extraMember;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-6"
      onClick={stop}
      onMouseDown={stop}
      onPointerDown={stop}
      onTouchStart={stop}
      onKeyDown={handleKeyDown}
      onKeyUp={stop}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#121215]/90 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:max-w-md sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Select person'}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[16px] font-semibold tracking-tight text-white">{title || 'Select person'}</h2>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/[0.06] p-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(null);
              }}
              placeholder="Search by name or designation…"
              className={`${inputBase} !py-2 !pl-9 !pr-4 !text-[13px]`}
            />
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {hasNoEligible ? (
            <div className="py-8 px-4 text-center text-[13px] text-zinc-500">
              No one has this role yet. A Manager can tick the role for a person in Team.
            </div>
          ) : listItems.length === 0 ? (
            <div className="py-8 px-4 text-center text-[13px] text-zinc-500">
              No match
            </div>
          ) : (
            listItems.map((item, idx) => {
              const isHighlighted = idx === highlightIndex;
              if (item.kind === 'unassigned') {
                const isSelected = !value;
                return (
                  <button
                    key="unassigned"
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left transition select-none ${
                      isSelected
                        ? 'bg-sky-500/15 border border-sky-400/30 text-white'
                        : isHighlighted
                        ? 'bg-white/[0.06] text-zinc-100'
                        : 'hover:bg-white/[0.04] text-zinc-200'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 text-zinc-400 text-[18px] font-light">
                      —
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[14px] text-zinc-200">Unassigned</div>
                      <div className="text-[11px] text-zinc-500">Clear assignment</div>
                    </div>
                    {isSelected ? <Icon name="check" className="h-4 w-4 shrink-0 text-sky-400" /> : null}
                  </button>
                );
              }

              const m = item.member;
              const isSelected = value === m.full_name;
              const isCurrentExtra = item.kind === 'extra';

              return (
                <button
                  key={`${item.kind}-${m.id || m.full_name}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left transition select-none ${
                    isSelected
                      ? 'bg-sky-500/15 border border-sky-400/30 text-white'
                      : isHighlighted
                      ? 'bg-white/[0.06] text-zinc-100'
                      : 'hover:bg-white/[0.04] text-zinc-200'
                  }`}
                >
                  <Avatar member={m} name={m.full_name} size="h-10 w-10" text="text-[15px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-[14px] text-white">
                        {m.nickname || m.full_name}
                      </span>
                      {isExternal(m) ? (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
                          EXTERNAL
                        </span>
                      ) : null}
                      {isCurrentExtra ? (
                        <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          Currently assigned
                        </span>
                      ) : null}
                    </div>
                    {m.nickname && m.nickname !== m.full_name ? (
                      <div className="truncate text-[12px] text-zinc-400">{m.full_name}</div>
                    ) : null}
                    {m.designation ? (
                      <div className="truncate text-[11px] text-zinc-500">{m.designation}</div>
                    ) : null}
                  </div>
                  {isSelected ? <Icon name="check" className="h-4 w-4 shrink-0 text-sky-400" /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PersonSelect({
  value,
  onChange,
  members,
  team,
  placeholder = 'Select…',
  disabled = false,
  title,
  allowClear = true,
  compact = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  const member = useMemo(() => {
    if (!value) return null;
    const list = team || members || [];
    return list.find((m) => m.full_name === value) || { full_name: value };
  }, [value, team, members]);

  const baseCls = disabled ? inputLocked : inputBase;
  const compactCls = compact ? '!px-2.5 !py-1.5 !text-[12px] !rounded-lg' : '';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={`${baseCls} ${compactCls} flex w-full items-center justify-between gap-2 text-left pr-8 cursor-pointer min-w-0`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {value ? (
            <>
              <Avatar member={member} name={value} size={compact ? 'h-4 w-4' : 'h-5 w-5'} text="text-[9px]" />
              <span className="min-w-0 truncate font-medium text-zinc-100">
                {member?.nickname || member?.full_name || value}
              </span>
              {isExternal(member) ? (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
                  EXTERNAL
                </span>
              ) : null}
            </>
          ) : (
            <span className="min-w-0 truncate text-zinc-500">{placeholder}</span>
          )}
        </div>
        <Icon name="chevronDown" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 shrink-0" />
      </button>

      <PersonPicker
        open={open}
        onClose={() => setOpen(false)}
        title={title || placeholder}
        members={members}
        value={value}
        onSelect={onChange}
        allowClear={allowClear}
        team={team}
      />
    </div>
  );
}

