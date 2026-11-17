'use client';

import React, { useState, useMemo } from 'react';
import {
  typeIsCard,
  getActions,
  isManager,
  canRequestPhotoCards,
  canApprovePhotoCards,
  isBreakingActive,
  isRemovedPublished,
  isCardCreatedBy
} from '../../lib/core';
import { Icon } from './Icons';
import { StatusBadge, BreakingBadge, IdBox } from './Badges';
import { btnPrimary, btnGhost, inputBase, ActionButtons } from './Shared';

function formatCardAge(r) {
  const isReq = !!r.requested_at;
  const timeIso = r.requested_at || r.created_at;
  if (!timeIso) return '';
  const diffMs = Math.max(0, Date.now() - new Date(timeIso).getTime());
  const mins = Math.floor(diffMs / 60000);
  const label =
    mins < 1
      ? 'just now'
      : mins < 60
      ? `${mins}m ago`
      : mins < 1440
      ? `${Math.floor(mins / 60)}h ago`
      : `${Math.floor(mins / 1440)}d ago`;
  return isReq ? `requested ${label}` : label;
}

function DeskCardItem({
  r,
  actor,
  photoTemplates,
  onOpenContent,
  onRun,
  actionFilter,
  showCorrection = false,
}) {
  const tpl = (photoTemplates || []).find((t) => String(t.id) === String(r.template_id));
  const tplLabel = tpl
    ? `#${tpl.number} · ${tpl.name}`
    : r.template_id
    ? `Template #${r.template_id}`
    : 'No template';
  const age = formatCardAge(r);
  const isBreaking = isBreakingActive(r);
  const allActions = getActions(r, actor, { photoTemplates });
  const actions = actionFilter ? allActions.filter(actionFilter) : [];

  return (
    <div
      onClick={() => onOpenContent && onOpenContent(r.id)}
      className={`group relative cursor-pointer rounded-2xl border transition bg-[#121215] p-3.5 hover:border-white/[0.22] hover:bg-white/[0.03] ${
        isBreaking
          ? 'border-red-500/50 border-l-4 border-l-red-500 bg-red-950/[0.06]'
          : 'border-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {isBreaking ? <BreakingBadge small /> : null}
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {r.channel || 'No channel'}
            </span>
            <span className="text-[11px] text-zinc-600">·</span>
            <span
              className="text-[11px] font-medium text-pink-400 truncate max-w-[200px]"
              title={tplLabel}
            >
              {tplLabel}
            </span>
            {r.content_uid ? (
              <>
                <span className="text-[11px] text-zinc-600">·</span>
                <IdBox uid={r.content_uid} small />
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={r.status} removed={isRemovedPublished(r)} />
            {age ? <span className="text-[10.5px] text-zinc-500 whitespace-nowrap">{age}</span> : null}
          </div>
        </div>

        <div className="text-[15px] font-bold uppercase tracking-wide text-white group-hover:text-sky-300 transition line-clamp-2">
          {r.slug_name || 'NO SLUG...'}
        </div>

        {showCorrection && r.correction_count > 0 ? (
          <div className="flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11.5px] text-red-300">
            <span className="font-bold uppercase tracking-wider text-red-400 shrink-0">
              Correction #{r.correction_count}:
            </span>
            <span className="break-words">{r.correction_note || 'Corrections requested'}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-zinc-400">
            <div>
              <span className="text-zinc-500">Requester: </span>
              <span className="font-medium text-zinc-300">{r.requested_by || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Designer: </span>
              <span className="font-medium text-zinc-300">{r.graphic_designer || 'Unassigned'}</span>
            </div>
          </div>
          {actions.length > 0 ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <ActionButtons compact actions={actions} onRun={(a) => onRun && onRun(r, a)} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PhotoCardDeskModal({
  rows = [],
  actor,
  team = [],
  channels = [],
  photoTemplates = [],
  onClose,
  onOpenContent,
  onRun,
  onNewCard,
}) {
  const cardRows = useMemo(() => rows.filter((r) => typeIsCard(r.content_type)), [rows]);

  const canRequest = isManager(actor) || canRequestPhotoCards(actor);
  const canApprove = isManager(actor) || canApprovePhotoCards(actor);
  const isDesigner = !!actor?.role_graphic_designer;

  const sortSectionRows = (list) => {
    return [...list].sort((a, b) => {
      const aBrk = isBreakingActive(a);
      const bBrk = isBreakingActive(b);
      if (aBrk && !bBrk) return -1;
      if (!aBrk && bBrk) return 1;
      const aTime = new Date(a.requested_at || a.created_at || a.scheduled_publish_time || 0).getTime();
      const bTime = new Date(b.requested_at || b.created_at || b.scheduled_publish_time || 0).getTime();
      return aTime - bTime;
    });
  };

  // Section 1: Waiting for a designer (status 'Requested', all channels)
  const waitingRows = useMemo(
    () => sortSectionRows(cardRows.filter((r) => r.status === 'Requested')),
    [cardRows]
  );
  const showWaiting = isManager(actor) || isDesigner;

  // Section 2: My work (status 'Designing' and graphic_designer === actor.full_name)
  const myWorkRows = useMemo(
    () =>
      sortSectionRows(
        cardRows.filter(
          (r) => r.status === 'Designing' && r.graphic_designer === actor?.full_name
        )
      ),
    [cardRows, actor?.full_name]
  );
  const showMyWork = isDesigner || myWorkRows.length > 0;

  // Section 3: Waiting for my review (status 'In Review' and approve_card allowed)
  const reviewRows = useMemo(
    () =>
      sortSectionRows(
        cardRows.filter((r) => {
          if (r.status !== 'In Review') return false;
          const actions = getActions(r, actor, { photoTemplates });
          return actions.some((a) => a.id === 'approve_card' && a.allowed === true);
        })
      ),
    [cardRows, actor, photoTemplates]
  );
  const showReview = reviewRows.length > 0 || canApprove;

  // Section 4: My requests & drafts (requested_by === actor.full_name OR isCardCreatedBy, open cards: not Published, Dropped, or On Hold)
  const myRequestsRows = useMemo(
    () =>
      sortSectionRows(
        cardRows.filter((r) => {
          const isMine = (!!r.requested_by && r.requested_by === actor?.full_name) || isCardCreatedBy(r, actor?.full_name);
          if (!isMine) return false;
          return r.status !== 'Published' && r.status !== 'Dropped' && r.status !== 'On Hold';
        })
      ),
    [cardRows, actor?.full_name]
  );
  const showMyRequests = canRequest || myRequestsRows.length > 0;

  // Breaking cards total
  const breakingCount = useMemo(
    () => cardRows.filter((r) => isBreakingActive(r)).length,
    [cardRows]
  );

  // All cards toolbar & list
  const [allChannel, setAllChannel] = useState('all');
  const [allStatus, setAllStatus] = useState('open');
  const [allSearch, setAllSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);

  const filteredAllCards = useMemo(() => {
    const q = allSearch.trim().toLowerCase();
    return cardRows
      .filter((r) => {
        if (allChannel !== 'all' && r.channel !== allChannel) return false;
        if (allStatus === 'open') {
          if (r.status === 'Published' || r.status === 'Dropped') return false;
        } else if (allStatus !== 'all') {
          if (r.status !== allStatus) return false;
        }
        if (!q) return true;
        const haystack = [
          r.slug_name,
          r.content_uid,
          r.channel,
          r.graphic_designer,
          r.requested_by,
          ...(r.card_fields
            ? Object.values(r.card_fields).filter((v) => typeof v === 'string')
            : []),
        ];
        return haystack.some((v) => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aBrk = isBreakingActive(a);
        const bBrk = isBreakingActive(b);
        if (aBrk && !bBrk) return -1;
        if (!aBrk && bBrk) return 1;
        const aTime = new Date(
          a.created_at || a.requested_at || a.scheduled_publish_time || 0
        ).getTime();
        const bTime = new Date(
          b.created_at || b.requested_at || b.scheduled_publish_time || 0
        ).getTime();
        return bTime - aTime;
      });
  }, [cardRows, allChannel, allStatus, allSearch]);

  const displayedAllCards = useMemo(
    () => filteredAllCards.slice(0, visibleCount),
    [filteredAllCards, visibleCount]
  );

  return (
    <div className="fixed inset-0 z-[45] flex flex-col bg-[#0e0e11] text-zinc-100 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#121215] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
            <Icon name="board" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
              Photo Card Desk
            </h1>
            <p className="text-[12px] text-zinc-400">
              Manage photo cards, assignments, and reviews
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canRequest && onNewCard ? (
            <button
              type="button"
              onClick={onNewCard}
              className={`${btnPrimary} !py-1.5 !px-3.5 !text-[12px] sm:!text-[13px] flex items-center gap-1.5`}
            >
              <Icon name="plus" className="h-4 w-4" />
              <span>+ New Photo Card</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-7">
        {/* Summary chips row */}
        <div className="flex flex-wrap items-center gap-2">
          {breakingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-[12px] font-bold text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              {breakingCount} Breaking
            </span>
          ) : null}
          {showWaiting ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              {waitingRows.length} Waiting for designer
            </span>
          ) : null}
          {showMyWork ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
              {myWorkRows.length} My work
            </span>
          ) : null}
          {showReview ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              {reviewRows.length} Waiting for review
            </span>
          ) : null}
          {showMyRequests ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              {myRequestsRows.length} My requests & drafts
            </span>
          ) : null}
        </div>

        {/* Four sections grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Section 1: Waiting for a designer */}
          {showWaiting ? (
            <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#121215]/80 p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                  <h2 className="text-[14px] font-bold uppercase tracking-wider text-white">
                    Waiting for a designer
                  </h2>
                </div>
                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-bold text-violet-300 tabular-nums">
                  {waitingRows.length}
                </span>
              </div>
              <div className="space-y-3">
                {waitingRows.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-zinc-500">
                    No cards waiting for a designer.
                  </p>
                ) : (
                  waitingRows.map((r) => (
                    <DeskCardItem
                      key={r.id}
                      r={r}
                      actor={actor}
                      photoTemplates={photoTemplates}
                      onOpenContent={onOpenContent}
                      onRun={onRun}
                      actionFilter={(a) => a.id === 'take_card'}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* Section 2: My work */}
          {showMyWork ? (
            <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#121215]/80 p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                  <h2 className="text-[14px] font-bold uppercase tracking-wider text-white">
                    My work
                  </h2>
                </div>
                <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-300 tabular-nums">
                  {myWorkRows.length}
                </span>
              </div>
              <div className="space-y-3">
                {myWorkRows.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-zinc-500">
                    No active cards in design.
                  </p>
                ) : (
                  myWorkRows.map((r) => (
                    <DeskCardItem
                      key={r.id}
                      r={r}
                      actor={actor}
                      photoTemplates={photoTemplates}
                      onOpenContent={onOpenContent}
                      onRun={onRun}
                      actionFilter={(a) =>
                        a.id === 'made_card' ||
                        a.id === 'skip_review' ||
                        a.id === 'give_back_card'
                      }
                      showCorrection={true}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* Section 3: Waiting for my review */}
          {showReview ? (
            <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#121215]/80 p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <h2 className="text-[14px] font-bold uppercase tracking-wider text-white">
                    Waiting for my review
                  </h2>
                </div>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[11px] font-bold text-orange-300 tabular-nums">
                  {reviewRows.length}
                </span>
              </div>
              <div className="space-y-3">
                {reviewRows.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-zinc-500">
                    No cards waiting for your review.
                  </p>
                ) : (
                  reviewRows.map((r) => (
                    <DeskCardItem
                      key={r.id}
                      r={r}
                      actor={actor}
                      photoTemplates={photoTemplates}
                      onOpenContent={onOpenContent}
                      onRun={onRun}
                      actionFilter={(a) =>
                        a.id === 'approve_card' || a.id === 'correct_card'
                      }
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* Section 4: My requests & drafts */}
          {showMyRequests ? (
            <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#121215]/80 p-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <h2 className="text-[14px] font-bold uppercase tracking-wider text-white">
                    My requests & drafts
                  </h2>
                </div>
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300 tabular-nums">
                  {myRequestsRows.length}
                </span>
              </div>
              <div className="space-y-3">
                {myRequestsRows.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-zinc-500">
                    No open requests or drafts.
                  </p>
                ) : (
                  myRequestsRows.map((r) => (
                    <DeskCardItem
                      key={r.id}
                      r={r}
                      actor={actor}
                      photoTemplates={photoTemplates}
                      onOpenContent={onOpenContent}
                      onRun={onRun}
                      actionFilter={(a) => a.id === 'submit_card'}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Section: All cards */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#121215]/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-white">All Photo Cards</h2>
              <p className="text-[12px] text-zinc-400">
                Browse, search and filter all cards across the system
              </p>
            </div>
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] font-semibold text-zinc-300 tabular-nums">
              {filteredAllCards.length} card{filteredAllCards.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <select
              value={allChannel}
              onChange={(e) => setAllChannel(e.target.value)}
              className="rounded-full border border-white/[0.1] bg-white/[0.04] py-1.5 pl-3.5 pr-8 text-[12px] font-medium text-zinc-200 outline-none hover:bg-white/[0.08]"
            >
              <option value="all" className="bg-[#121215]">
                All channels
              </option>
              {channels.map((c) => (
                <option key={c} value={c} className="bg-[#121215]">
                  {c}
                </option>
              ))}
            </select>

            <select
              value={allStatus}
              onChange={(e) => setAllStatus(e.target.value)}
              className="rounded-full border border-white/[0.1] bg-white/[0.04] py-1.5 pl-3.5 pr-8 text-[12px] font-medium text-zinc-200 outline-none hover:bg-white/[0.08]"
            >
              <option value="open" className="bg-[#121215]">
                Open cards
              </option>
              <option value="all" className="bg-[#121215]">
                All statuses
              </option>
              {[
                'Draft',
                'Requested',
                'Designing',
                'In Review',
                'Ready to Publish',
                'Scheduled',
                'Published',
                'On Hold',
                'Dropped',
              ].map((s) => (
                <option key={s} value={s} className="bg-[#121215]">
                  {s}
                </option>
              ))}
            </select>

            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                placeholder="Search slug, ID, designer, requester…"
                className="w-full rounded-full border border-white/[0.1] bg-white/[0.04] py-1.5 pl-8 pr-3 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-pink-500/50"
              />
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedAllCards.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[13px] text-zinc-500">
                No photo cards match the selected filter.
              </div>
            ) : (
              displayedAllCards.map((r) => (
                <DeskCardItem
                  key={r.id}
                  r={r}
                  actor={actor}
                  photoTemplates={photoTemplates}
                  onOpenContent={onOpenContent}
                  onRun={null}
                  actionFilter={null}
                />
              ))
            )}
          </div>

          {filteredAllCards.length > visibleCount ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 100)}
                className={`${btnGhost} text-[13px]`}
              >
                Show more ({filteredAllCards.length - visibleCount} remaining)
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
