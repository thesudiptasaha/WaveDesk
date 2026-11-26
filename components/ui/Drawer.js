'use client';

import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Icon, LockIcon } from './Icons';
import { copyText, safeHttpUrl } from '../../utils/helpers';
import { scriptStats } from '../../utils/scriptDuration';
import { saveDraft, loadDraft, clearDraft } from '../../utils/scriptDraft';
import { isFeatureEnabled } from '../../utils/features';
import { Teleprompter } from './Teleprompter';
import { ScriptPrintSheet, formatScriptSavedAt } from './ScriptPrint';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import dynamic from 'next/dynamic';
const ScriptEditor = dynamic(() => import('./ScriptEditor'), { ssr: false });
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from './Badges';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, PersonName, Field, SelectBox, BlurInput, ModalShell, FullScreenCard, ActionButtons, ConfirmDialog, useNow } from './Shared';
import { PersonPicker } from './PersonPicker';
import { StepBar } from './StepBar';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, typeConfig, typeHasScript, typeIsCard, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  STATUS_META, ALL_STATUSES, isManager, isOwner, can, afterScript, afterShoot, getActions,
  canRequestPhotoCards, canApprovePhotoCards, canManagePhotoTemplates,
  startOfDay, addDays, sameDay, MONTHS, pad, formatRangeLabel, toLocalInput, fromLocalInput,
  formatTime, formatDay, formatStamp, SLUG_MAX, normalizeSlugInput, uid, generateUserUID,
  makeContentUid, asArray, shortsInRange, rowTimeIn, isParked, isRemovedPublished, normalizeRow, normalizeMember,
  FIELD_PERM, TRACKED_FIELDS, eligibleMembers, presenterMembers, rolesInDrawerGroup, ROLE_LIST,
  GUARDED_ASSIGN_FIELDS, isUncutReporter, canAssignProductionCrew, canEditShootTimes,
  canTickFilesDelivered, canEditProductionNotes, FILES_DELIVERED_STATUSES,
  AD_TYPES, AD_STATUSES, canEditAds, stepProgress,
  canMarkFilesReceived, canFixFilesProblem,
  canRescheduleRow, publishCheckState, canAnswerPublishCheckNow,
  isExternal, canManageExternals, getPublishedLinks
} from '../../lib/core';
import {
  BookingsContext,
  useContentBookings,
  latestBookingFor,
  BookingBadge,
  InviteModal,
  BookingStatusModal
} from './BookingInvite';



const STAFF_GROUPS = [
  {
    id: 'idea',
    title: 'Idea & Script',
    hint: 'who thought of it and wrote it',
    stripe: 'bg-sky-400',
    chip: 'bg-sky-400/15 text-sky-200',
    fields: rolesInDrawerGroup('idea').map((r) => ({ field: r.field, label: r.label, skillKey: r.key })),
  },
  {
    id: 'post',
    title: 'Post-Production',
    hint: 'after the shoot',
    stripe: 'bg-amber-400',
    chip: 'bg-amber-400/15 text-amber-300',
    fields: rolesInDrawerGroup('post').map((r) => ({ field: r.field, label: r.label, skillKey: r.key })),
  },
  {
    id: 'crew',
    title: 'Production Crew',
    hint: 'on the shoot',
    stripe: 'bg-red-400',
    chip: 'bg-red-400/15 text-red-200',
    fields: rolesInDrawerGroup('crew').map((r) => ({ field: r.field, label: r.label, skillKey: r.key })),
  },
  {
    id: 'publish',
    title: 'Publishing',
    hint: 'who puts it live',
    stripe: 'bg-emerald-400',
    chip: 'bg-emerald-400/15 text-emerald-200',
    fields: rolesInDrawerGroup('publish').map((r) => ({ field: r.field, label: r.label, skillKey: r.key })),
  },
  {
    id: 'live',
    title: 'Live Crew',
    hint: 'shown only for LIVE content',
    stripe: 'bg-violet-400',
    chip: 'bg-violet-400/15 text-violet-300',
    fields: rolesInDrawerGroup('live').map((r) => ({ field: r.field, label: r.label, skillKey: r.key })),
  },
];

function StaffTile({ field, label, skillKey, row, patch, team, actor }) {
  const { bookings } = useContext(BookingsContext);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const active = !!actor && actor.active !== false;
  const isPresenter = field === 'presenter_name';
  const isEditor = field === 'video_editor';
  const isCrew = GUARDED_ASSIGN_FIELDS.includes(field);
  const isCrewAdmin = isCrew && canAssignProductionCrew(actor, row);
  const assignedName = row[field];
  const isAssigned = !!assignedName;
  const isSelf = assignedName === actor?.full_name;

  let isLocked = false;
  let lockTitle = '';

  if (isPresenter) {
    const okPres = can(actor, 'can_assign_presenter');
    isLocked = !active || !okPres;
    lockTitle = isPresenter
      ? 'You need the “Assign Presenter” permission'
      : 'You do not have permission to assign staff';
  } else if (isEditor) {
    const okEditor = can(actor, 'can_assign_video_editor');
    const isUncutReporterUser = isUncutReporter(actor, row);
    const canSelfAdd = isUncutReporterUser && !isAssigned;
    const canSelfRemove = isUncutReporterUser && isSelf;
    isLocked = !active || (!okEditor && !canSelfAdd && !canSelfRemove);
    lockTitle = row?.content_type === 'UNCUT'
      ? 'You need the “Assign Video Editor” permission. A Multimedia Journalist can put themselves into an empty slot.'
      : 'You need the “Assign Video Editor” permission';
  } else if (isCrew) {
    const canSelfAdd = !!actor && actor[skillKey] === true && !isAssigned;
    const canSelfRemove = isSelf;
    isLocked = !active || (!isCrewAdmin && !canSelfAdd && !canSelfRemove);
    lockTitle = field === 'publisher'
      ? 'Only the Producer, Production Manager or a Manager can change the Publisher. If you hold the Publisher role you can put yourself into an empty slot.'
      : 'Only the Producer, Production Manager or a Manager can change the crew. You can put yourself into an empty slot of your own role.';
  } else {
    isLocked = !active;
    lockTitle = 'You do not have permission to assign staff';
  }

  const member = isAssigned ? (team || []).find((m) => m.full_name === assignedName) : null;
  const nickname = (member && member.nickname) || assignedName;
  const isExt = isAssigned && member && isExternal(member);
  const booking = isExt ? latestBookingFor(bookings, field, member.id) : null;

  const tileTitle = isLocked
    ? lockTitle
    : isAssigned
    ? (member && member.designation ? `${member.full_name} (${member.designation})` : (member ? member.full_name : assignedName))
    : `Assign ${label}`;

  let pickerMembers = [];
  let allowClear = true;

  if (isCrew && !isCrewAdmin) {
    allowClear = isSelf;
    pickerMembers = actor ? [actor] : [];
  } else if (isEditor && !can(actor, 'can_assign_video_editor')) {
    allowClear = isSelf;
    pickerMembers = actor ? [actor] : [];
  } else {
    pickerMembers = isPresenter
      ? presenterMembers(team)
      : skillKey
      ? eligibleMembers(team, skillKey)
      : (team || []).filter((t) => t.active !== false);
    allowClear = true;
  }

  return (
    <div
      className={`group relative flex flex-col items-center justify-start p-2.5 text-center rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.04] transition focus-within:ring-2 focus-within:ring-sky-400 select-none ${
        isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      title={tileTitle}
    >
      <div className="relative mb-2">
        {isAssigned ? (
          <Avatar member={member} name={assignedName} size="h-10 w-10" text="text-[15px]" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 text-zinc-400 group-hover:border-zinc-400 group-hover:text-zinc-200 transition">
            <span className="text-[18px] leading-none select-none font-light">+</span>
          </div>
        )}
        {isLocked ? (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#121215] border border-white/20 text-zinc-400 shadow-sm"
            title={lockTitle}
          >
            <Icon name="lock" className="h-2.5 w-2.5" />
          </span>
        ) : null}
      </div>

      {isAssigned ? (
        <span className="w-full truncate text-[12px] font-semibold text-white">
          {nickname}
        </span>
      ) : (
        <span className="w-full truncate text-[12px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition">
          Assign
        </span>
      )}
      <span className="w-full truncate text-[10px] uppercase tracking-wider text-zinc-500 font-medium mt-0.5">
        {label}
      </span>

      {isExt ? (
        booking ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatusOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
            className="relative z-10 mt-1 cursor-pointer rounded-full transition hover:opacity-80 active:scale-95 focus:outline-none focus:ring-1 focus:ring-sky-400"
            title="View booking status"
          >
            <BookingBadge booking={booking} />
          </button>
        ) : canManageExternals(actor) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInviteOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
            className="relative z-10 mt-1 inline-flex cursor-pointer items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/20 active:scale-95 transition focus:outline-none focus:ring-1 focus:ring-sky-400"
            title={`Invite ${nickname} via WhatsApp`}
          >
            Invite
          </button>
        ) : null
      ) : null}

      {!isLocked ? (
        <>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-label={`${label}: ${isAssigned ? nickname : 'Unassigned'}`}
            title={tileTitle}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:outline-none"
          />
          <PersonPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            title={`Select ${label}`}
            members={pickerMembers}
            value={assignedName}
            onSelect={(v) => patch({ [field]: v })}
            allowClear={allowClear}
            team={team}
          />
        </>
      ) : null}

      {isExt ? (
        <>
          {inviteOpen ? (
            <InviteModal
              open={inviteOpen}
              onClose={() => setInviteOpen(false)}
              row={row}
              field={field}
              label={label}
              member={member}
              actor={actor}
            />
          ) : null}
          {statusOpen && booking ? (
            <BookingStatusModal
              open={statusOpen}
              onClose={() => setStatusOpen(false)}
              booking={booking}
              row={row}
              label={label}
              member={member}
              actor={actor}
              onInviteAgain={() => {
                setStatusOpen(false);
                setInviteOpen(true);
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function visibleFieldsFor(group, row) {
  if (!group || !row) return [];
  if (group.id === 'live' && !(typeConfig(row.content_type).showsLiveCredits || row.live_video_switcher || row.live_audio_mixer)) {
    return [];
  }
  const showCredit = (field) => !(typeConfig(row.content_type).hiddenCredits.includes(field) && !row[field]);
  return (group.fields || []).filter((f) => showCredit(f.field));
}

function StaffGroupCard({ group, row, actor, team, patch, className = '' }) {
  const g = typeof group === 'string' ? STAFF_GROUPS.find((item) => item.id === group) : group;
  if (!g) return null;
  const visibleFields = visibleFieldsFor(g, row);
  if (visibleFields.length === 0) return null;
  const assigned = visibleFields.filter((f) => !!row[f.field]).length;
  const visible = visibleFields.length;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5 ${className}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${g.stripe}`} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${g.chip}`}>{g.title}</span>
          <span className="hidden text-[12px] text-zinc-500 sm:inline">{g.hint}</span>
        </div>
        <span className="text-[12px] font-semibold text-zinc-400">{assigned} / {visible}</span>
      </div>
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))' }}
      >
        {visibleFields.map((f) => (
          <StaffTile
            key={f.field}
            field={f.field}
            label={f.label}
            skillKey={f.skillKey}
            row={row}
            patch={patch}
            team={team}
            actor={actor}
          />
        ))}
      </div>
    </div>
  );
}

function StaffAssignment({ row, actor, team, patch, groups, title }) {
  const groupIds = Array.isArray(groups) ? groups : STAFF_GROUPS.map((g) => g.id);
  const targetGroups = groupIds
    .map((id) => (typeof id === 'string' ? STAFF_GROUPS.find((g) => g.id === id) : id))
    .filter(Boolean);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title || 'Staff assignment'}
        </span>
        <span className="hidden text-[12px] font-normal normal-case text-zinc-500 sm:inline">
          · Click a photo to change · hover to see who
        </span>
      </div>
      <div className="lg:columns-2 gap-4">
        {targetGroups.map((g) => (
          <StaffGroupCard
            key={g.id}
            group={g}
            row={row}
            actor={actor}
            team={team}
            patch={patch}
            className="inline-block w-full break-inside-avoid mb-4"
          />
        ))}
      </div>
    </div>
  );
}

function ContentDetailsFields({ row, actor, channels, platforms = PLATFORMS, patch, onAddPlatform }) {
  const lockMsg = (label) => `You need the “${label}” permission`;
  const okMeta = can(actor, 'can_edit_content_details');
  const okSched = canRescheduleRow(actor, row);
  const heldLock = row.status === 'On Hold' && !isManager(actor);
  const okChan = can(actor, 'can_change_channel');
  const isCard = typeIsCard(row.content_type);

  return (
    <div className="space-y-6 details-compact">
      <section className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Channel" locked={!okChan} lockMessage={lockMsg('Change Channel')}>
            <SelectBox value={row.channel} disabled={!okChan} options={channels} onChange={(v) => patch({ channel: v })} />
          </Field>
          {isCard ? (
            <Field label="Published at">
              <div className="flex min-h-[42px] items-center text-[13px]">
                {row.status === 'Published' ? (
                  <span className="font-medium text-emerald-400">
                    {formatStamp(row.went_live_at || row.published_at || row.scheduled_publish_time)}
                  </span>
                ) : (
                  <span className="italic text-zinc-500">Set when it is published</span>
                )}
              </div>
            </Field>
          ) : (
          <Field label="Scheduled publish" locked={!okSched || heldLock} lockMessage={heldLock ? 'Only Managers and the Owner can reschedule held content' : lockMsg('Reschedule Content')}>
              <input
                type="datetime-local"
                disabled={!okSched || heldLock}
                value={toLocalInput(row.scheduled_publish_time)}
                onChange={(e) => e.target.value && patch({ scheduled_publish_time: fromLocalInput(e.target.value) })}
                className={`${(okSched && !heldLock) ? inputBase : inputLocked} [color-scheme:dark]`}
              />
          </Field>
          )}
        </div>
        <Field label="Slug name" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')} hint={`${(row.slug_name || '').length}/${SLUG_MAX}`}>
          <BlurInput value={row.slug_name} disabled={!okMeta} maxLength={SLUG_MAX} onCommit={(v) => { const s = normalizeSlugInput(v); if (s) patch({ slug_name: s }); }} placeholder="Slug name" />
        </Field>
        {!isCard ? (
          <>
            <Field label="Title" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
              <BlurInput value={row.title} disabled={!okMeta} onCommit={(v) => patch({ title: v })} placeholder="Title" />
            </Field>
            <Field label="Thumbnail text (Hook)" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
              <BlurInput value={row.thumbnail_text} disabled={!okMeta} onCommit={(v) => patch({ thumbnail_text: v })} placeholder="Hook on the thumbnail" />
            </Field>
          </>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4">
        {!isCard ? (
          <Field label="Archive shelf ID" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
            <BlurInput value={row.archive_shelf_id} disabled={!okMeta} onCommit={(v) => patch({ archive_shelf_id: v })} placeholder="e.g. SHELF-A12" />
          </Field>
        ) : null}
        <Field label="Target platforms" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
          <div className="flex flex-wrap items-center gap-2">
            {(platforms || PLATFORMS).map((p) => {
              const on = row.target_platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  disabled={!okMeta}
                  onClick={() => patch({ target_platforms: on ? row.target_platforms.filter((x) => x !== p.id) : [...row.target_platforms, p.id] })}
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition disabled:cursor-not-allowed ${
                    on ? 'border-sky-400/50 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400'
                  } ${okMeta && !on ? 'hover:bg-white/[0.08]' : ''}`}
                >
                  {p.label || p.name}
                </button>
              );
            })}
            {onAddPlatform && isManager(actor) ? (
              <button
                type="button"
                onClick={onAddPlatform}
                className="rounded-full border border-dashed border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-[12px] font-medium text-sky-300 transition hover:bg-sky-500/20"
                title="Add a new publish platform"
              >
                + Add platform
              </button>
            ) : null}
          </div>
        </Field>
      </section>
    </div>
  );
}


function ScriptPaperHeader({ row, team }) {
  const channel = row.channel || '—';
  const title = row.title || row.slug_name || 'Untitled';
  const writerMember = (team || []).find((m) => m.full_name === row.writer);
  const writerDisplay = (writerMember && writerMember.nickname) || row.writer || '—';
  const savedDate = formatScriptSavedAt(row.script_saved_at);
  const contentUid = row.content_uid || '—';

  return (
    <div className="script-paper-header">
      <div className="script-paper-mast">
        <span>WAVEDESK · SCRIPT</span>
        <span>{channel}</span>
      </div>
      <h1 className="script-paper-title">{title}</h1>
      <div className="script-paper-by">
        <div className="script-paper-by-item">
          <span className="script-paper-by-label">লেখক</span>
          <span className="script-paper-by-val">{writerDisplay}</span>
        </div>
        <div className="script-paper-by-item">
          <span className="script-paper-by-label">তারিখ</span>
          <span className="script-paper-by-val">{savedDate}</span>
        </div>
        <div className="script-paper-by-item">
          <span className="script-paper-by-label">আইডি</span>
          <span className="script-paper-by-val">{contentUid}</span>
        </div>
      </div>
    </div>
  );
}

function ScriptTab({ row, actor, patch, team, platforms = PLATFORMS, fetchScriptMeta }) {
  const locked = row.is_script_locked === true;
  const mgr = isManager(actor);
  const canEdit = can(actor, 'can_write_edit_scripts') && (!locked || mgr);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.script || '');
  const [showPrompter, setShowPrompter] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const draftKey = `wd-script-draft:${row.id}`;
  const draftsEnabled = isFeatureEnabled('script_drafts');
  const [storedDraft, setStoredDraft] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const baseScriptRef = useRef(row.script || '');
  const baseSavedAtRef = useRef(row.script_saved_at || null);

  useEffect(() => {
    if (!draftsEnabled || !canEdit) return;
    const sd = loadDraft(window.localStorage, draftKey);
    if (sd && sd.text !== (row.script || '')) {
      setStoredDraft(sd);
    } else if (sd && sd.text === (row.script || '')) {
      clearDraft(window.localStorage, draftKey);
    }
  }, [row.script, draftKey, draftsEnabled, canEdit]);

  useEffect(() => {
    if (!editing) baseScriptRef.current = row.script || '';
  }, [row.script, editing]);

  useEffect(() => {
    if (!editing) baseSavedAtRef.current = row.script_saved_at || null;
  }, [row.script_saved_at, editing]);

  useEffect(() => {
    if (!draftsEnabled || !canEdit || !editing) return;
    const t = setTimeout(() => {
      saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
    }, 1500);
    return () => clearTimeout(t);
  }, [draft, editing, draftKey, draftsEnabled, canEdit]);

  useEffect(() => {
    if (!draftsEnabled || !canEdit || !editing) return;
    const handleBeforeUnload = (e) => {
      if (draft !== (row.script || '')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const handleSaveNow = () => {
      saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
    };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') handleSaveNow(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleSaveNow);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleSaveNow);
    };
  }, [draft, editing, draftKey, draftsEnabled, canEdit, row.script]);

  const timer = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(row.script || '');
  }, [row.script, editing]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  useEffect(() => {
    setPrinting(false);
  }, [row.id]);

  const richEnabled = isFeatureEnabled('rich_editor');
  const text = scriptToPlainText(row.script || '');
  const stats = scriptStats(editing ? draft : row.script);
  const hasConflictNotice = editing && (row.script_saved_at || null) !== baseSavedAtRef.current;

  const doCopy = async () => {
    if (!text) return;
    const ok = await copyText(scriptToPlainText(row.script || ''));
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleOpenPrompter = () => {
    if (typeof document !== 'undefined') {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    }
    setShowPrompter(true);
  };

  const handleCancel = () => {
    setDraft(row.script || '');
    setEditing(false);
    if (draftsEnabled) {
      clearDraft(window.localStorage, draftKey);
      setStoredDraft(null);
    }
  };

  const handleSave = async () => {
    if (draft === (row.script || '')) {
      setEditing(false);
      if (draftsEnabled) {
        clearDraft(window.localStorage, draftKey);
        setStoredDraft(null);
      }
      return;
    }
    let latest = null;
    if (typeof fetchScriptMeta === 'function') {
      try {
        latest = await fetchScriptMeta(row.id);
      } catch (e) {
        latest = null;
      }
    }
    const serverSavedAt = latest?.script_saved_at ?? (row.script_saved_at || null);
    const serverScript = latest ? (latest.script || '') : (row.script || '');
    const isConflict = latest && serverSavedAt !== baseSavedAtRef.current && serverScript !== draft;
    if (isConflict) {
      setConflictData({ latestScript: serverScript, latestSavedAt: serverSavedAt });
      return;
    }
    const ok = await patch({ script: draft });
    setEditing(false);
    if (draftsEnabled) {
      if (ok) {
        clearDraft(window.localStorage, draftKey);
        setStoredDraft(null);
      } else {
        const record = { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current };
        saveDraft(window.localStorage, draftKey, record);
        setStoredDraft(record);
      }
    }
    if (ok && typeof fetchScriptMeta === 'function') {
      const fresh = await fetchScriptMeta(row.id);
      if (fresh?.script_saved_at) baseSavedAtRef.current = fresh.script_saved_at;
    }
  };

  const handleSaveMineAnyway = async () => {
    const ok = await patch({ script: draft });
    setEditing(false);
    if (draftsEnabled && ok) {
      clearDraft(window.localStorage, draftKey);
      setStoredDraft(null);
    }
    if (ok && typeof fetchScriptMeta === 'function') {
      const fresh = await fetchScriptMeta(row.id);
      if (fresh?.script_saved_at) baseSavedAtRef.current = fresh.script_saved_at;
    }
    setConflictData(null);
  };

  const handleTakeTheirs = () => {
    const theirDraft = { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current };
    saveDraft(window.localStorage, draftKey, theirDraft);
    setStoredDraft(theirDraft);
    setDraft(conflictData?.latestScript || '');
    baseSavedAtRef.current = conflictData?.latestSavedAt || null;
    setEditing(false);
    setConflictData(null);
  };

  const handleCancelConflict = () => {
    setConflictData(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-500">
          <span>
            {stats.words} words · {stats.label} on air
          </span>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/25 backdrop-blur-md">
              <Icon name="lock" className="h-3 w-3" /> Script locked
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isFeatureEnabled('teleprompter') ? (
            <button
              type="button"
              onClick={handleOpenPrompter}
              disabled={!text.trim()}
              title={text.trim() ? 'Play Script' : 'No script to play'}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                text.trim()
                  ? 'play-glow'
                  : 'border border-white/[0.08] bg-white/[0.03] text-zinc-500 cursor-not-allowed opacity-40'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Script
            </button>
          ) : null}
          {mgr ? (
            <button
              onClick={() => patch({ is_script_locked: !locked })}
              title={locked ? 'Let writers edit this script again' : 'Stop everyone except Managers and the Owner from editing'}
              className={locked ? `${btnGhost} !border-amber-400/40 !text-amber-300` : btnGhost}
            >
              <Icon name={locked ? 'unlock' : 'lock'} className="h-3.5 w-3.5" />
              {locked ? 'Unlock Script' : 'Lock Script'}
            </button>
          ) : null}
          <div className="relative">
            {copied ? (
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-500 px-2.5 py-1 text-[12px] font-semibold text-black shadow-lg">
                Copied!
              </span>
            ) : null}
            <button onClick={doCopy} disabled={!text} className={copied ? `${btnGhost} !border-emerald-400/40 !text-emerald-300` : btnGhost}>
              <Icon name={copied ? 'check' : 'copy'} />
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPrinting(true)}
            disabled={!text.trim() || editing}
            title={!text.trim() ? 'No script to print' : editing ? 'Print saved script only' : 'Print'}
            className={btnGhost}
          >
            Print
          </button>
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={handleSave}
              >
                Save script
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              disabled={!canEdit}
              title={canEdit ? '' : locked ? 'This script is locked by a Manager' : 'You need the “Edit script” permission'}
              className={btnPrimary}
            >
              <Icon name={canEdit ? 'edit' : 'lock'} className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {storedDraft && !editing && canEdit ? (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[13px] text-amber-200">
          <div className="flex items-start gap-2">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Unsaved draft from {new Date(storedDraft.savedAt).toLocaleString()} found.</p>
              {storedDraft.baseScript !== (row.script || '') ? (
                <p className="mt-1 opacity-80">The script was changed by someone else after this draft was started.</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button onClick={() => { setDraft(storedDraft.text); baseScriptRef.current = storedDraft.baseScript; setEditing(true); setStoredDraft(null); }} className={`${btnGhost} !bg-amber-500 !text-amber-950 font-bold !border-transparent hover:!bg-amber-400`}>Restore draft</button>
                <button onClick={() => { clearDraft(window.localStorage, draftKey); setStoredDraft(null); }} className={`${btnGhost} !border-amber-500/20 !text-amber-200 hover:!bg-amber-500/10`}>Discard draft</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {editing ? (
        <div>
          {hasConflictNotice ? (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[13px] text-amber-200">
              <div className="flex items-start gap-2">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p>Someone saved a new version of this script while you were editing. Your text is kept. When you save you will be asked what to do.</p>
              </div>
            </div>
          ) : null}
          <div className="script-paper">
            <ScriptPaperHeader row={row} team={team} />
            <div className="script-paper-body">
              {richEnabled ? (
                <ScriptEditor 
                  value={draft}
                  onChange={setDraft}
                  onBlur={() => {
                    if (draftsEnabled) saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
                  }}
                  autoFocus 
                  printRow={row}
                  team={team}
                />
              ) : (
                <textarea
                  onBlur={() => {
                    if (draftsEnabled) saveDraft(window.localStorage, draftKey, { text: draft, savedAt: new Date().toISOString(), baseScript: baseScriptRef.current });
                  }}
                  autoFocus
                  value={scriptToPlainText(draft)}
                  onChange={(e) => setDraft(e.target.value)}
                  className="script-paper-textarea"
                  placeholder="Write the script…"
                />
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={handleSave}
            >
              Save script
            </button>
          </div>
        </div>
      ) : text ? (
        <div className="script-paper">
          <ScriptPaperHeader row={row} team={team} />
          <div className="script-paper-body">
            {richEnabled ? (
              <article
                className="outline-none"
                dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(scriptToHtml(row.script)) }}
              />
            ) : (
              <article className="outline-none">
                {text.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </article>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center text-[14px] text-zinc-500">
          No script yet.{canEdit ? ' Click Edit to write one.' : ''}
        </div>
      )}
{!canEdit && !editing ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-zinc-500">
          <LockIcon /> {locked && !mgr ? 'Read-only — this script is locked. Only Managers and the Owner can edit it.' : 'Read-only — you need the “Edit script” permission to make changes.'}
        </p>
      ) : null}
      {showPrompter && text.trim() ? (
          <Teleprompter text={text} onClose={() => setShowPrompter(false)} />
        ) : null}
      <ScriptPrintSheet
        row={row}
        team={team}
        platforms={platforms}
        printing={printing}
        onAfterPrint={() => setPrinting(false)}
      />
      {conflictData ? (
        <ModalShell
          title="This script was changed by someone else"
          subtitle="Someone else saved a new version of this script while you were editing."
          onClose={handleCancelConflict}
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
              <button
                type="button"
                className={btnGhost}
                onClick={handleCancelConflict}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${btnGhost} !border-amber-500/30 !text-amber-200 hover:!bg-amber-500/10`}
                onClick={handleTakeTheirs}
              >
                Take theirs (my text stays as a saved draft)
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={handleSaveMineAnyway}
              >
                Save mine anyway
              </button>
            </div>
          }
        >
          <div className="text-[13px] text-zinc-300 space-y-2">
            <p>Another user updated this script. If you save yours, their changes will be overwritten.</p>
            <p className="text-zinc-400 text-[12px]">You can cancel to copy your text, take their version (your draft is preserved), or save yours anyway.</p>
          </div>
        </ModalShell>
      ) : null}
      </div>
    );
  }
  
  function normalizeHashtags(v) {
  return String(v || '')
    .split(/[\s,]+/)
    .map((w) => w.replace(/^#+/, '').trim())
    .filter(Boolean)
    .map((w) => `#${w}`)
    .join(' ');
}

function LinkRow({ label, value, disabled, onCommit }) {
  return (
    <Field label={label} locked={disabled} lockMessage="Inactive members cannot edit">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <BlurInput value={value} disabled={disabled} onCommit={onCommit} placeholder="https://..." />
        </div>
        {safeHttpUrl(value) ? (
            <a href={safeHttpUrl(value)} target="_blank" rel="noopener noreferrer" className={`${btnGhost} !px-3`} title="Open link">
              <Icon name="link" />
            </a>
          ) : null}
      </div>
    </Field>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasText = Boolean(text && String(text).trim());

  const handleCopy = async () => {
    if (!hasText) return;
    let ok = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(text));
        ok = true;
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = String(text);
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

  return (
    <button
      type="button"
      disabled={!hasText}
      onClick={handleCopy}
      className={`${btnGhost} !px-3 !py-1 !text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
        copied ? '!border-emerald-400/40 !text-emerald-300' : ''
      }`}
      title={copied ? 'Copied' : 'Copy'}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function formatShootDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const totalMins = Math.round((end - start) / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) {
    return `${h} h ${m} min`;
  }
  return `${m} min`;
}

function ShootDateTimeInput({ label, value, disabled, lockMessage, onCommit }) {
  const [localVal, setLocalVal] = useState(toLocalInput(value));
  const isFocusedRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) setLocalVal(toLocalInput(value));
  }, [value]);

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (dirtyRef.current) {
      dirtyRef.current = false;
      const targetIso = fromLocalInput(localVal);
      if (targetIso !== (value || null)) {
        onCommit(targetIso);
      }
    } else {
      setLocalVal(toLocalInput(value));
    }
  };

  const handleChange = (e) => {
    dirtyRef.current = true;
    const v = e.target.value;
    setLocalVal(v);
    if (!v) {
      if (value) onCommit(null);
    } else {
      const nextIso = fromLocalInput(v);
      if (nextIso && nextIso !== value) {
        onCommit(nextIso);
      }
    }
  };

  return (
    <Field label={label} locked={disabled} lockMessage={lockMessage}>
      <input
        type="datetime-local"
        disabled={disabled}
        value={localVal}
        onFocus={() => { isFocusedRef.current = true; }}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${!disabled ? inputBase : inputLocked} [color-scheme:dark]`}
      />
    </Field>
  );
}

function ShootCard({ row, actor, patch, locationOptions = [] }) {
  const canEdit = canEditShootTimes(actor, row);
  const lockMsg = row?.content_type === 'UNCUT'
    ? 'Only the Multimedia Journalist, Camera Operator, Producer, Production Manager or a Manager can change shoot times'
    : 'Only the Camera Operator, Producer, Production Manager or a Manager can change shoot times';
  const durationText = formatShootDuration(row.shoot_started_at, row.shoot_finished_at);
  const showDuration = !row.shoot_started_at || !!durationText;

  const handleCommitLocation = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      patch({ shoot_location: '' });
      return;
    }
    const match = (locationOptions || []).find((loc) => loc.toLowerCase() === trimmed.toLowerCase());
    patch({ shoot_location: match || trimmed });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-400" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-sky-400/15 text-sky-200">
            Shoot
          </span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ShootDateTimeInput
            label="Started"
            value={row.shoot_started_at}
            disabled={!canEdit}
            lockMessage={lockMsg}
            onCommit={(v) => patch({ shoot_started_at: v })}
          />
          <ShootDateTimeInput
            label="Finished"
            value={row.shoot_finished_at}
            disabled={!canEdit}
            lockMessage={lockMsg}
            onCommit={(v) => patch({ shoot_finished_at: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Field label="Location" locked={!canEdit} lockMessage={lockMsg}>
            <BlurInput
              list={`shoot-location-${row.id}`}
              maxLength={120}
              value={row.shoot_location}
              disabled={!canEdit}
              onCommit={handleCommitLocation}
              placeholder="Where was this shot? e.g. Mirpur Stadium, Studio 2"
            />
            <datalist id={`shoot-location-${row.id}`}>
              {(locationOptions || []).map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </Field>
          {row?.content_type === 'UNCUT' && !row.shoot_location?.trim() && canEdit ? (
            <p className="text-[12px] text-amber-400">Location not set</p>
          ) : null}
          {!canEdit ? (
            <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
              <LockIcon message={lockMsg} /> {lockMsg}
            </p>
          ) : null}
        </div>

        {showDuration ? (
          <div className="flex items-center justify-between text-[12px] pt-1 border-t border-white/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Duration</span>
            {!row.shoot_started_at ? (
              <span className="text-zinc-500">Not started yet</span>
            ) : (
              <span className="font-medium text-white">{durationText}</span>
            )}
          </div>
        ) : null}

        <p className="text-[12px] leading-relaxed text-zinc-500">
          Filled automatically when Start Shoot / Finish Shoot is pressed. If another Camera Operator presses Start Shoot, their name replaces the earlier one (the old name stays in the log). Producer, Production Manager, Camera Operator and Managers can correct the times. Location is a free text; pick an earlier one from the suggestions to keep spellings the same.
        </p>
      </div>
    </div>
  );
}

function FilesDeliveredCard({ row, actor, patch }) {
  const [ticking, setTicking] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoReason, setUndoReason] = useState('');
  const [undoBusy, setUndoBusy] = useState(false);

  const isDelivered = Boolean(row.files_delivered_at);
  const canTick = canTickFilesDelivered(actor, row);
  const statusAllowed = FILES_DELIVERED_STATUSES.includes(row.status) || (row.content_type === 'UNCUT' && row.status === 'Draft');
  const canDeliver = canTick && statusAllowed;

  let disabledReason = '';
  if (!statusAllowed) {
    disabledReason = row.content_type === 'UNCUT' ? 'Available from Draft onwards' : 'Available from Shooting onwards';
  } else if (!canTick) {
    disabledReason = row.content_type === 'UNCUT'
      ? 'Only the Multimedia Journalist, Camera Operator, Data Wrangler, Producer, Production Manager or a Manager can tick this'
      : 'Only the Camera Operator, Data Wrangler, Producer, Production Manager or a Manager can tick this';
  }

  const handleTick = async () => {
    if (!canDeliver || ticking) return;
    setTicking(true);
    try {
      await patch({ files_delivered_at: new Date().toISOString() });
    } finally {
      setTicking(false);
    }
  };

  const undoValid = undoReason.trim().length >= 3;

  const handleUndoConfirm = async () => {
    if (!undoValid || undoBusy) return;
    setUndoBusy(true);
    try {
      const prevAudit = Array.isArray(row.audit_log) ? row.audit_log : [];
      const fromStamp = row.files_delivered_at ? formatStamp(row.files_delivered_at) : '';
      const fromStr = `Delivered by ${row.files_delivered_by || ''} at ${fromStamp}`.trim();
      const newEntry = {
        kind: 'change',
        field: 'Files delivered',
        from: fromStr,
        to: 'Undone',
        actor: actor.full_name,
        role: actor.role,
        time: new Date().toISOString(),
        note: undoReason.trim(),
      };
      await patch({
        files_delivered_at: null,
        audit_log: [...prevAudit, newEntry],
      });
      setShowUndoModal(false);
    } finally {
      setUndoBusy(false);
    }
  };

  const [fixingProblem, setFixingProblem] = useState(false);
  const canFix = canFixFilesProblem(actor, row);

  const handleFixProblem = async () => {
    if (!canFix || fixingProblem) return;
    setFixingProblem(true);
    try {
      await patch({ files_problem_at: null });
    } finally {
      setFixingProblem(false);
    }
  };

  useEffect(() => {
    if (!showUndoModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setShowUndoModal(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [showUndoModal]);

  const canEditNotes = canEditProductionNotes(actor, row);
  const lockMsgNotes = row?.content_type === 'UNCUT'
    ? 'Only the Multimedia Journalist, Camera Operator, Data Wrangler, Producer, Production Manager or a Manager can edit production notes'
    : 'Only the Camera Operator, Data Wrangler, Producer, Production Manager or a Manager can edit production notes';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${isDelivered ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
              isDelivered ? 'bg-emerald-400/15 text-emerald-200' : 'bg-zinc-700/30 text-zinc-300'
            }`}
          >
            Files
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {row.content_uid ? (
          <div className="space-y-1.5">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <span className="inline-flex items-center text-amber-400 shrink-0">
                <Icon name="folder" className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="font-mono text-[13px] sm:text-[14px] font-semibold text-zinc-200 select-all">
                {row.content_uid}
              </span>
              <CopyButton text={row.content_uid} />
            </div>
            <p className="text-[12px] text-zinc-500">
              The folder on the drive is named exactly like the content ID.
            </p>
          </div>
        ) : null}

        {!isDelivered ? (
          <div>
            <button
              type="button"
              className={`${btnPrimary} min-h-[44px] w-full sm:w-auto px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!canDeliver || ticking}
              title={!canDeliver ? disabledReason : 'Files delivered'}
              onClick={handleTick}
            >
              {ticking ? 'Marking delivered…' : 'Files delivered'}
            </button>
            {!canDeliver && disabledReason ? (
              <p className="mt-1.5 text-[12px] text-zinc-500">
                {disabledReason}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="text-[13px]">
                <div className="font-medium text-emerald-200">
                  Delivered by {row.files_delivered_by || 'Unknown'}
                </div>
                <div className="text-[12px] text-zinc-400">
                  {row.files_delivered_at ? formatStamp(row.files_delivered_at) : ''}
                  {row.files_received_at ? (
                    <div className="mt-1 text-emerald-400/90">
                      Received by {row.files_received_by || 'Unknown'} · {formatStamp(row.files_received_at)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {isManager(actor) ? (
              <button
                type="button"
                className={`${btnGhost} !px-3 !py-1 text-[12px] min-h-[44px] sm:min-h-0 text-zinc-300 hover:text-white`}
                onClick={() => {
                  setUndoReason('');
                  setShowUndoModal(true);
                }}
              >
                Undo
              </button>
            ) : null}
          </div>

          {row.files_problem_at ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 space-y-2">
              <div className="text-[13px] font-medium text-red-300">
                Problem reported by {row.files_problem_by || 'Unknown'} · {formatStamp(row.files_problem_at)}
              </div>
              {row.files_problem_note ? (
                <p className="text-[13px] text-zinc-200 whitespace-pre-wrap select-text">
                  {row.files_problem_note}
                </p>
              ) : null}
              <div className="pt-1">
                <button
                  type="button"
                  className={`${btnPrimary} min-h-[44px] w-full sm:w-auto px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={!canFix || fixingProblem}
                  onClick={handleFixProblem}
                >
                  {fixingProblem ? 'Saving…' : 'Problem fixed'}
                </button>
                {!canFix ? (
                  <p className="mt-1.5 text-[12px] text-zinc-500">
                    Only Production or a Manager can mark it fixed
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}

        <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
          <Field label="Production notes" locked={!canEditNotes} lockMessage={lockMsgNotes}>
            <BlurInput
              multiline
              rows={4}
              value={row.production_notes}
              disabled={!canEditNotes}
              onCommit={(v) => patch({ production_notes: v })}
              placeholder="Anything the editor or the team should know about this shoot…"
            />
          </Field>
          {!canEditNotes ? (
            <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
              <LockIcon message={lockMsgNotes} /> {lockMsgNotes}
            </p>
          ) : null}
        </div>
      </div>

      {showUndoModal ? (
        <ModalShell
          title="Undo files delivered?"
          subtitle="This will clear the delivered stamp and allow files to be marked delivered again."
          onClose={() => setShowUndoModal(false)}
          footer={
            <>
              <button
                type="button"
                className={`${btnGhost} min-h-[44px] sm:min-h-0`}
                onClick={() => setShowUndoModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${btnDanger} min-h-[44px] sm:min-h-0`}
                disabled={!undoValid || undoBusy}
                onClick={handleUndoConfirm}
              >
                {undoBusy ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-[14px] text-zinc-300">
              Please enter a reason for undoing (at least 3 characters):
            </p>
            <input
              autoFocus
              type="text"
              className={inputBase}
              placeholder="Reason for undoing…"
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && undoValid && !undoBusy) {
                  e.preventDefault();
                  handleUndoConfirm();
                }
              }}
            />
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function ProductionTab({ row, actor, team, patch, locationOptions }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div>
        <StaffAssignment groups={['crew']} row={row} actor={actor} team={team} patch={patch} />
      </div>
      <div className="space-y-4">
        <div className="hidden lg:block h-[27px]" aria-hidden="true" />
        <ShootCard row={row} actor={actor} patch={patch} locationOptions={locationOptions} />
        <FilesDeliveredCard row={row} actor={actor} patch={patch} />
      </div>
    </div>
  );
}

function FilesDeliveredStatus({ row, actor, patch }) {
  const [receiving, setReceiving] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemText, setProblemText] = useState('');
  const [problemBusy, setProblemBusy] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoReason, setUndoReason] = useState('');
  const [undoBusy, setUndoBusy] = useState(false);

  useEffect(() => {
    if (!showProblemModal && !showUndoModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showProblemModal) setShowProblemModal(false);
        else if (showUndoModal) setShowUndoModal(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [showProblemModal, showUndoModal]);

  const hasPostStage = typeConfig(row.content_type).hasPostStage;
  const isDelivered = Boolean(row.files_delivered_at);
  const canMark = canMarkFilesReceived(actor, row);

  const handleReceived = async () => {
    if (!canMark || receiving) return;
    setReceiving(true);
    try {
      await patch({ files_received_at: new Date().toISOString() });
    } finally {
      setReceiving(false);
    }
  };

  const problemValid = problemText.trim().length >= 3;
  const handleSendProblem = async () => {
    if (!problemValid || problemBusy) return;
    setProblemBusy(true);
    try {
      await patch({
        files_problem_at: new Date().toISOString(),
        files_problem_note: problemText.trim(),
      });
      setShowProblemModal(false);
      setProblemText('');
    } finally {
      setProblemBusy(false);
    }
  };

  const undoValid = undoReason.trim().length >= 3;
  const handleUndoConfirm = async () => {
    if (!undoValid || undoBusy) return;
    setUndoBusy(true);
    try {
      const prevAudit = Array.isArray(row.audit_log) ? row.audit_log : [];
      await patch({
        files_received_at: null,
        audit_log: [
          ...prevAudit,
          {
            kind: 'change',
            field: 'Files',
            from: 'Received',
            to: 'Undone',
            actor: actor.full_name,
            role: actor.role,
            time: new Date().toISOString(),
            note: undoReason.trim(),
          },
        ],
      });
      setShowUndoModal(false);
      setUndoReason('');
    } finally {
      setUndoBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Files from Production
        </span>
      </div>
      {!hasPostStage ? (
        <p className="text-[13px] text-zinc-400">No editing for {row.content_type} content.</p>
      ) : !isDelivered ? (
        <div>
          <p className="text-[13px] text-zinc-300">Not delivered yet</p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Production ticks Files delivered in the Production tab.
          </p>
        </div>
      ) : row.files_problem_at ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 space-y-2">
            <div className="text-[13px] font-medium text-red-300">
              Problem reported by {row.files_problem_by || 'Unknown'} · {row.files_problem_at ? formatStamp(row.files_problem_at) : ''}
            </div>
            {row.files_problem_note ? (
              <p className="text-[13px] text-zinc-200 whitespace-pre-wrap select-text">
                {row.files_problem_note}
              </p>
            ) : null}
            <p className="text-[12px] text-zinc-500">
              Waiting for Production to mark it fixed
            </p>
          </div>
          {row.content_uid ? (
            <p className="font-mono text-[12px] text-zinc-500 select-all">
              {row.content_uid}
            </p>
          ) : null}
        </div>
      ) : row.files_received_at ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="text-[13px]">
                <div className="font-medium text-emerald-200">
                  Received by {row.files_received_by || 'Unknown'} · {row.files_received_at ? formatStamp(row.files_received_at) : ''}
                </div>
                <div className="text-[12px] text-zinc-400">
                  Delivered by {row.files_delivered_by || 'Unknown'} · {row.files_delivered_at ? formatStamp(row.files_delivered_at) : ''}
                </div>
              </div>
            </div>
            {isManager(actor) ? (
              <button
                type="button"
                className={`${btnGhost} !px-3 !py-1 text-[12px] min-h-[44px] sm:min-h-0 text-zinc-300 hover:text-white`}
                onClick={() => {
                  setUndoReason('');
                  setShowUndoModal(true);
                }}
              >
                Undo
              </button>
            ) : null}
          </div>
          {row.content_uid ? (
            <p className="font-mono text-[12px] text-zinc-500 select-all">
              {row.content_uid}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-[13px] text-zinc-200">
              Delivered by {row.files_delivered_by || 'Unknown'} · {row.files_delivered_at ? formatStamp(row.files_delivered_at) : ''}
            </p>
            {row.content_uid ? (
              <p className="mt-1 font-mono text-[12px] text-zinc-500 select-all">
                {row.content_uid}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className={`${btnPrimary} min-h-[44px] w-full sm:w-auto px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!canMark || receiving}
                onClick={handleReceived}
              >
                {receiving ? 'Marking received…' : 'Received'}
              </button>
              <button
                type="button"
                className={`${btnGhost} !text-red-400 hover:!text-red-300 min-h-[44px] w-full sm:w-auto px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!canMark || receiving}
                onClick={() => {
                  setProblemText('');
                  setShowProblemModal(true);
                }}
              >
                Problem
              </button>
            </div>
            {!canMark ? (
              <p className="text-[12px] text-zinc-500">
                Only the assigned Video Editor or a Manager can do this
              </p>
            ) : null}
          </div>
        </div>
      )}

      {showUndoModal ? (
        <ModalShell
          title="Undo files received?"
          subtitle="This will clear the received stamp and allow files to be marked received again."
          onClose={() => setShowUndoModal(false)}
          footer={
            <>
              <button
                type="button"
                className={`${btnGhost} min-h-[44px] sm:min-h-0`}
                onClick={() => setShowUndoModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${btnDanger} min-h-[44px] sm:min-h-0`}
                disabled={!undoValid || undoBusy}
                onClick={handleUndoConfirm}
              >
                {undoBusy ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-[14px] text-zinc-300">
              Please enter a reason for undoing (at least 3 characters):
            </p>
            <input
              autoFocus
              type="text"
              className={inputBase}
              placeholder="Reason for undoing…"
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && undoValid && !undoBusy) {
                  e.preventDefault();
                  handleUndoConfirm();
                }
              }}
            />
          </div>
        </ModalShell>
      ) : null}

      {showProblemModal ? (
        <ModalShell
          title="Report a problem with files"
          subtitle="Production will be notified to resolve the issue."
          onClose={() => setShowProblemModal(false)}
          footer={
            <>
              <button
                type="button"
                className={`${btnGhost} min-h-[44px] sm:min-h-0`}
                onClick={() => setShowProblemModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${btnDanger} min-h-[44px] sm:min-h-0`}
                disabled={!problemValid || problemBusy}
                onClick={handleSendProblem}
              >
                {problemBusy ? 'Sending…' : 'Send problem'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block text-[14px] text-zinc-300">
              What is the problem?
            </label>
            <textarea
              autoFocus
              rows={4}
              className={inputBase}
              placeholder="Describe the problem with the files (at least 3 characters)…"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && problemValid && !problemBusy) {
                  e.preventDefault();
                  handleSendProblem();
                }
              }}
            />
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function PostProductionTab({ row, actor, team, patch }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div>
        <StaffAssignment groups={['post']} row={row} actor={actor} team={team} patch={patch} title="Editing crew" />
      </div>
      <div className="space-y-4">
        <div className="hidden lg:block h-[27px]" aria-hidden="true" />
        <FilesDeliveredStatus row={row} actor={actor} patch={patch} />
      </div>
    </div>
  );
}

function PackagingTab({ row, actor, team = [], patch, platforms = PLATFORMS, onAddPlatform }) {
  const active = !!actor && actor.active !== false;
  const ok = can(actor, 'can_edit_content_details');
  const msg = 'You need the "Edit Content Details" permission';

  // Short Content Creation Form State
  const [shortPlatforms, setShortPlatforms] = useState(
    row.target_platforms && row.target_platforms.length > 0 ? row.target_platforms : ['youtube', 'facebook']
  );
  const [captionText, setCaptionText] = useState('');
  const [onVideoText, setOnVideoText] = useState('');
  const [shortWhen, setShortWhen] = useState('');
  const [shortUrl, setShortUrl] = useState('');

  const nextShortN = row.shorts.reduce((m, s, i) => Math.max(m, s.n || i + 1), 0) + 1;
  const shortUid = (s, i) => `${row.content_uid || 'WAVECON'}-short_${String(s.n || i + 1).padStart(4, '0')}`;
  const updateShort = (id, p) => patch({ shorts: row.shorts.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  // Published links per platform
  const pubLinks = getPublishedLinks(row);
  const allPlatforms = platforms || PLATFORMS;
  const targetPlatforms = Array.from(new Set([
    ...(row.target_platforms && row.target_platforms.length > 0 ? row.target_platforms : allPlatforms.map((p) => p.id)),
    ...Object.keys(pubLinks),
  ]));

  const onCommitPublishedLink = (platformId, val) => {
    const updated = { ...pubLinks, [platformId]: (val || '').trim() };
    if (!updated[platformId]) delete updated[platformId];
    
    const hasKeys = Object.keys(updated).length > 0;
    const payload = {
      live_video_url: hasKeys ? JSON.stringify(updated) : '',
    };
    if ('published_links' in row) {
      payload.published_links = updated;
    }
    patch(payload);
  };

  const handleAddShort = () => {
    if (!captionText.trim() && !onVideoText.trim()) return;
    const newShort = {
      id: uid(),
      n: nextShortN,
      title: captionText.trim() || onVideoText.trim(),
      caption: captionText.trim(),
      on_video_text: onVideoText.trim(),
      thumb_text: onVideoText.trim(),
      platforms: shortPlatforms.length > 0 ? shortPlatforms : ['youtube'],
      platform: shortPlatforms[0] || 'youtube',
      url: shortUrl.trim(),
      publish_at: fromLocalInput(shortWhen),
      published: false,
    };
    patch({ shorts: [...row.shorts, newShort] });
    setCaptionText('');
    setOnVideoText('');
    setShortWhen('');
    setShortUrl('');
  };

  const captionCount = `${(row.post_caption || '').length} characters`;
  const tagCount = `${(row.seo_keywords || '').split(',').map((t) => t.trim()).filter(Boolean).length} tags`;
  const hashtagCount = `${(row.hashtags || '').split(/\s+/).filter(Boolean).length} hashtags`;

  return (
    <div className="space-y-6">
      {/* a) Publisher */}
      <div className="w-full lg:w-1/2">
        <StaffGroupCard group="publish" row={row} actor={actor} team={team} patch={patch} />
      </div>

      {/* File links */}
      <section className="space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">File links</div>
        <LinkRow label="Raw footage" value={row.raw_footage_link} disabled={!active} onCommit={(v) => patch({ raw_footage_link: v })} />
        <LinkRow label="Project file" value={row.project_file_url} disabled={!active} onCommit={(v) => patch({ project_file_url: v })} />
        <LinkRow label="Master export" value={row.master_export_url} disabled={!active} onCommit={(v) => patch({ master_export_url: v })} />
        <p className="text-[12px] text-zinc-500">The folder on the drive is named exactly like the content ID.</p>
      </section>

      {/* b, c, d: Post Caption, SEO keywords & Hashtags */}
      <section className="space-y-4">
        {!ok ? (
          <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
            <LockIcon message={msg} /> Read-only -- {msg.toLowerCase()} to make changes.
          </p>
        ) : (
          <p className="text-[12px] text-zinc-500">Changes save automatically when you click away from a field.</p>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              Post caption / social copy
              {!ok ? <LockIcon message={msg} /> : null}
            </span>
            <div className="flex items-center gap-2">
              <span className="normal-case tracking-normal text-zinc-500">{captionCount}</span>
              <CopyButton text={row.post_caption || ''} />
            </div>
          </div>
          <BlurInput
            multiline
            rows={6}
            value={row.post_caption}
            disabled={!ok}
            onCommit={(v) => patch({ post_caption: v })}
            placeholder="Caption that goes out with the post..."
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              SEO keywords / tags
              {!ok ? <LockIcon message={msg} /> : null}
              <span className="normal-case tracking-normal text-zinc-600">comma separated</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="normal-case tracking-normal text-zinc-500">{tagCount}</span>
              <CopyButton text={row.seo_keywords || ''} />
            </div>
          </div>
          <BlurInput
            multiline
            rows={6}
            value={row.seo_keywords}
            disabled={!ok}
            onCommit={(v) => patch({ seo_keywords: v })}
            placeholder="budget, fiscal year, economy"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              Hashtags (#)
              {!ok ? <LockIcon message={msg} /> : null}
              <span className="normal-case tracking-normal text-zinc-600"># is added for you</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="normal-case tracking-normal text-zinc-500">{hashtagCount}</span>
              <CopyButton text={row.hashtags || ''} />
            </div>
          </div>
          <BlurInput
            multiline
            rows={4}
            value={row.hashtags}
            disabled={!ok}
            onCommit={(v) => patch({ hashtags: normalizeHashtags(v) })}
            placeholder="#budget #economy"
          />
        </div>
      </section>

      {/* e) Published Links */}
      <section className="border-t border-white/[0.08] pt-4">
        <div className="mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Published Links</div>
          <p className="text-[12px] text-zinc-500">Published live URLs for each platform where this content is live.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
          {targetPlatforms.map((pId) => {
            const pMeta = allPlatforms.find((p) => p.id === pId) || { id: pId, label: pId };
            const currentUrl = pubLinks[pId] || '';
            return (
              <Field key={pId} label={`${pMeta.label} Published Link`} locked={!active} lockMessage="Inactive members cannot edit">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <BlurInput
                      value={currentUrl}
                      disabled={!active}
                      onCommit={(v) => onCommitPublishedLink(pId, v)}
                      placeholder={`https://${pId}.com/...`}
                    />
                  </div>
                  {safeHttpUrl(currentUrl) ? (
                    <a
                      href={safeHttpUrl(currentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnGhost} !px-3`}
                      title={`Open ${pMeta.label} link`}
                    >
                      <Icon name="link" />
                    </a>
                  ) : null}
                </div>
              </Field>
            );
          })}
        </div>
      </section>

      {/* f) Divider & Short Content */}
      <hr className="border-white/[0.08]" />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Short Content ({row.shorts.length})</div>
        </div>

        {/* Existing Short Content Items */}
        <div className="space-y-2">
          {row.shorts.map((s, i) => {
            const itemPlatforms = s.platforms && Array.isArray(s.platforms) && s.platforms.length > 0
              ? s.platforms
              : (s.platform ? [s.platform] : []);

            return (
              <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-zinc-500">{shortUid(s, i)}</span>
                    <div className="flex flex-wrap gap-1">
                      {itemPlatforms.map((pid) => {
                        const pm = allPlatforms.find((p) => p.id === pid);
                        return (
                          <span key={pid} className="rounded-full bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                            {pm?.label || pid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!active}
                      onClick={() => updateShort(s.id, { published: !s.published })}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset disabled:opacity-50 transition ${
                        s.published ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' : 'bg-white/[0.04] text-zinc-400 ring-white/10'
                      }`}
                    >
                      {s.published ? 'Published' : 'Pending'}
                    </button>
                    {safeHttpUrl(s.url) ? (
                      <a href={safeHttpUrl(s.url)} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white" title="Open short URL">
                        <Icon name="link" />
                      </a>
                    ) : null}
                    <button disabled={!active} onClick={() => patch({ shorts: row.shorts.filter((x) => x.id !== s.id) })} className="text-zinc-500 hover:text-red-400 disabled:opacity-40" title="Delete short">
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>

                {s.on_video_text || s.thumb_text ? (
                  <div className="text-[12px] text-amber-300/90 font-medium">
                    <span className="text-zinc-500 text-[11px] font-normal uppercase mr-1">On Video:</span>
                    {s.on_video_text || s.thumb_text}
                  </div>
                ) : null}

                {s.caption || s.title ? (
                  <div className="text-[13px] text-zinc-200 whitespace-pre-wrap">
                    {s.caption || s.title}
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                  <span>{s.publish_at ? `Publish: ${formatStamp(s.publish_at)}` : 'No publish time set'}</span>
                  {s.url ? <span className="truncate max-w-[200px] text-zinc-400">{s.url}</span> : null}
                </div>
              </div>
            );
          })}
          {row.shorts.length === 0 ? <p className="text-[13px] text-zinc-600">No short content yet.</p> : null}
        </div>

        {/* Add Short Content Form */}
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div className="text-[12px] font-semibold text-zinc-300">Add Short Content</div>

          {/* Platform selection toggle similar to main content */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1.5">Target Platforms</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {allPlatforms.map((p) => {
                const on = shortPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!active}
                    onClick={() => {
                      setShortPlatforms((prev) =>
                        prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                      );
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition disabled:cursor-not-allowed ${
                      on
                        ? 'border-sky-400/50 bg-sky-500/15 text-sky-200 font-medium'
                        : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08]'
                    }`}
                  >
                    {p.label || p.name}
                  </button>
                );
              })}
              {onAddPlatform && isManager(actor) ? (
                <button
                  type="button"
                  onClick={onAddPlatform}
                  className="rounded-full border border-dashed border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300 transition hover:bg-sky-500/20"
                  title="Add a new publish platform"
                >
                  + Add
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">On Video Text</label>
              <input
                className={inputBase}
                placeholder="Text overlay appearing on the video..."
                value={onVideoText}
                disabled={!active}
                onChange={(e) => setOnVideoText(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Caption Text</label>
              <textarea
                rows={2}
                className={`${inputBase} resize-y`}
                placeholder="Short caption / social copy..."
                value={captionText}
                disabled={!active}
                onChange={(e) => setCaptionText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Publish Date & Time</label>
              <input
                type="datetime-local"
                className={`${inputBase} [color-scheme:dark]`}
                value={shortWhen}
                disabled={!active}
                onChange={(e) => setShortWhen(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">Published Link (optional)</label>
              <input
                className={inputBase}
                placeholder="https://..."
                value={shortUrl}
                disabled={!active}
                onChange={(e) => setShortUrl(e.target.value)}
              />
            </div>

            <button
              className={`${btnPrimary} sm:col-span-2 mt-1`}
              disabled={!active || (!captionText.trim() && !onVideoText.trim())}
              onClick={handleAddShort}
            >
              <Icon name="plus" /> Add Short Content
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function canEditCardDetails(actor, row) {
  if (!actor || actor.active === false) return false;
  if (isManager(actor)) return true;
  if (!canRequestPhotoCards(actor)) return false;
  return ['Draft', 'Requested', 'Designing', 'In Review'].includes(row.status);
}

function canEditCardCaption(actor) {
  if (!actor || actor.active === false) return false;
  if (isManager(actor)) return true;
  if (canRequestPhotoCards(actor)) return true;
  if (can(actor, 'can_edit_content_details')) return true;
  if (actor.role_publisher === true) return true;
  return false;
}

function canEditCardProduction(actor, row) {
  if (!actor || actor.active === false) return false;
  if (isManager(actor)) return true;
  if (actor.role_graphic_designer === true) return true;
  if (row.graphic_designer && row.graphic_designer === actor.full_name) return true;
  return false;
}

function canEditCardFolder(actor, row) {
  if (!actor || actor.active === false) return false;
  if (isManager(actor)) return true;
  if (actor.role_graphic_designer === true) return true;
  if (row.graphic_designer && row.graphic_designer === actor.full_name) return true;
  if (actor.role_publisher === true) return true;
  if (row.publisher && row.publisher === actor.full_name) return true;
  return false;
}

function canEditLinkedContent(actor, row) {
  if (!actor || actor.active === false) return false;
  if (isManager(actor)) return true;
  if (canRequestPhotoCards(actor)) return true;
  if (actor.role_publisher === true) return true;
  if (row.publisher && row.publisher === actor.full_name) return true;
  return false;
}

function PhotoCardEditorialTab({ row, actor, patch, photoTemplates = [] }) {
  const okEdit = canEditCardDetails(actor, row);
  const cardLockMsg = !canRequestPhotoCards(actor)
    ? 'You need the “Request Photo Cards” permission'
    : 'Only editable before approval (or by Managers)';
  const okCaption = canEditCardCaption(actor);
  const captionLockMsg = 'You need permission to edit content details, request photo cards, or publish';

  const tpl = (photoTemplates || []).find((t) => t.id === row.template_id);

  return (
    <div className="space-y-6">
      {/* a) Requested by */}
      {row.requested_by ? (
        <div className="flex items-center gap-2 text-[12px] text-zinc-400">
          <Icon name="user" className="h-3.5 w-3.5 text-zinc-500" />
          <span>
            Requested by <strong className="text-zinc-200">{row.requested_by}</strong>
            {row.requested_at ? ` on ${formatStamp(row.requested_at)}` : ''}
          </span>
        </div>
      ) : null}

      {/* b) Template line */}
      <Field label="Template">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5">
          <span className="text-[13px] font-medium text-zinc-200">
            {tpl ? `#${tpl.number} · ${tpl.name}` : (row.template_id ? `Template #${row.template_id}` : 'None')}
          </span>
          {safeHttpUrl(tpl?.sample_url) ? (
            <a
              href={safeHttpUrl(tpl.sample_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-400 hover:text-sky-300 hover:underline"
            >
              Sample ↗
            </a>
          ) : null}
        </div>
      </Field>

      {/* Template fields */}
      {tpl && Array.isArray(tpl.fields) && tpl.fields.length > 0 ? (
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Template Fields</div>
          {tpl.fields.map((f) => {
            const val = (row.card_fields && row.card_fields[f.key]) || '';
            const labelWithReq = (
              <span>
                {f.label || f.key}
                {f.required ? <span className="text-red-400 ml-1">*</span> : null}
              </span>
            );
            const counterHint = f.max_length ? `${val.length}/${f.max_length}` : undefined;
            if (f.type === 'long') {
              return (
                <Field key={f.key} label={labelWithReq} hint={counterHint} locked={!okEdit} lockMessage={cardLockMsg}>
                  <BlurInput
                    multiline
                    rows={3}
                    value={val}
                    disabled={!okEdit}
                    maxLength={f.max_length || undefined}
                    onCommit={(v) => patch({ card_fields: { ...(row.card_fields || {}), [f.key]: v } })}
                    placeholder={f.hint || f.label}
                  />
                </Field>
              );
            }
            if (f.type === 'image') {
              return (
                <Field
                  key={f.key}
                  label={
                    <span className="flex items-center justify-between w-full">
                      <span>{labelWithReq}</span>
                      {safeHttpUrl(val) ? (
                        <a
                          href={safeHttpUrl(val)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline lowercase tracking-normal"
                        >
                          Open ↗
                        </a>
                      ) : null}
                    </span>
                  }
                  hint="Paste a link the designer can open without asking for permission"
                  locked={!okEdit}
                  lockMessage={cardLockMsg}
                >
                  <BlurInput
                    value={val}
                    disabled={!okEdit}
                    onCommit={(v) => patch({ card_fields: { ...(row.card_fields || {}), [f.key]: v.trim() } })}
                    placeholder="https://..."
                  />
                </Field>
              );
            }
            if (f.type === 'date') {
              return (
                <Field key={f.key} label={labelWithReq} locked={!okEdit} lockMessage={cardLockMsg}>
                  <input
                    type="date"
                    disabled={!okEdit}
                    value={val}
                    onChange={(e) => patch({ card_fields: { ...(row.card_fields || {}), [f.key]: e.target.value } })}
                    className={`${okEdit ? inputBase : inputLocked} [color-scheme:dark]`}
                  />
                </Field>
              );
            }
            return (
              <Field key={f.key} label={labelWithReq} hint={counterHint} locked={!okEdit} lockMessage={cardLockMsg}>
                <BlurInput
                  value={val}
                  disabled={!okEdit}
                  maxLength={f.max_length || undefined}
                  onCommit={(v) => patch({ card_fields: { ...(row.card_fields || {}), [f.key]: v } })}
                  placeholder={f.hint || f.label}
                />
              </Field>
            );
          })}
        </div>
      ) : (
        row.card_fields && Object.keys(row.card_fields).length > 0 ? (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Template Fields</div>
            {Object.entries(row.card_fields).map(([k, v]) => (
              <Field key={k} label={k} locked lockMessage="Template not found">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-[13px] text-zinc-300">
                  {String(v ?? '')}
                </div>
              </Field>
            ))}
          </div>
        ) : null
      )}

      {/* e) Source */}
      <Field
        label={
          <span className="flex items-center justify-between w-full">
            <span>
              Source <span className="text-red-400 ml-0.5">*</span>
            </span>
            {safeHttpUrl(row.card_source) ? (
              <a
                href={safeHttpUrl(row.card_source)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline lowercase tracking-normal"
              >
                Open ↗
              </a>
            ) : null}
          </span>
        }
        locked={!okEdit}
        lockMessage={cardLockMsg}
      >
        <BlurInput
          value={row.card_source}
          disabled={!okEdit}
          onCommit={(v) => patch({ card_source: v.trim() })}
          placeholder="Where the info came from (link or plain text)"
        />
      </Field>

      {/* f) Caption */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          <span className="flex items-center gap-1.5">
            Post caption / social copy
            {!okCaption ? <LockIcon message={captionLockMsg} /> : null}
          </span>
          <div className="flex items-center gap-2">
            <span className="normal-case tracking-normal text-zinc-500">{(row.post_caption || '').length} characters</span>
            <CopyButton text={row.post_caption || ''} />
          </div>
        </div>
        <BlurInput
          multiline
          rows={5}
          value={row.post_caption}
          disabled={!okCaption}
          onCommit={(v) => patch({ post_caption: v })}
          placeholder="Caption that goes out with the post..."
        />
      </div>

      {/* g) Instructions for designer */}
      <Field label="Instructions for designer" locked={!okEdit} lockMessage={cardLockMsg}>
        <BlurInput
          multiline
          rows={3}
          value={row.designer_instructions}
          disabled={!okEdit}
          onCommit={(v) => patch({ designer_instructions: v })}
          placeholder="Any specific requests, crop preferences, or visual notes..."
        />
      </Field>
    </div>
  );
}

// PhotoCardProductionTab: kept for the future Design tab
function PhotoCardProductionTab({ row, actor, patch }) {
  const okProd = canEditCardProduction(actor, row);
  const prodLockMsg = 'Graphic Designer or Managers only';

  const historyItems = [];
  if (row.requested_by || row.requested_at) {
    historyItems.push({
      label: 'Requested',
      value: `${row.requested_by || 'Unknown'}${row.requested_at ? ` · ${formatStamp(row.requested_at)}` : ''}`,
    });
  }
  if (row.designer_taken_at) {
    historyItems.push({
      label: 'Taken by designer',
      value: formatStamp(row.designer_taken_at),
    });
  }
  if (row.made_at) {
    historyItems.push({
      label: 'Made',
      value: formatStamp(row.made_at),
    });
  }
  if (row.approved_by || row.approved_at) {
    historyItems.push({
      label: 'Approved',
      value: `${row.approved_by || 'Unknown'}${row.approved_at ? ` · ${formatStamp(row.approved_at)}` : ''}`,
    });
  }
  if (row.correction_count > 0 || row.correction_note) {
    historyItems.push({
      label: 'Corrections',
      value: `${row.correction_count || 0}${row.correction_note ? ` (Last: ${row.correction_note})` : ''}`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Graphic Designer Tile */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Graphic Designer</div>
        <div className="flex items-center gap-3">
          <Avatar name={row.graphic_designer} />
          <div>
            <div className={`text-[14px] font-semibold ${row.graphic_designer ? 'text-zinc-100' : 'text-zinc-500 italic'}`}>
              {row.graphic_designer || 'Not taken yet'}
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">Set when a designer takes the card</p>
          </div>
        </div>
      </div>

      {/* Card folder */}
      <Field label="Card folder" locked={!okProd} lockMessage={prodLockMsg} hint="Where is the finished card on the shared drive">
        <BlurInput
          value={row.card_folder}
          disabled={!okProd}
          onCommit={(v) => patch({ card_folder: v.trim() })}
          placeholder="e.g. Google Drive link or folder path"
        />
      </Field>

      {/* Production notes */}
      <Field label="Production notes" locked={!okProd} lockMessage={prodLockMsg}>
        <BlurInput
          multiline
          rows={4}
          value={row.production_notes}
          disabled={!okProd}
          onCommit={(v) => patch({ production_notes: v })}
          placeholder="Notes for production and design..."
        />
      </Field>

      {/* History block */}
      {historyItems.length > 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">History & Workflow</span>
          </div>
          <div className="space-y-2 text-[12px]">
            {historyItems.map((item, idx) => (
              <div key={idx} className="flex items-baseline justify-between gap-2 border-b border-white/[0.04] pb-1.5 last:border-0 last:pb-0">
                <span className="text-zinc-400">{item.label}</span>
                <span className="font-medium text-zinc-200 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PhotoCardPublishTab({ row, actor, team, patch, platforms = PLATFORMS }) {
  const active = !!actor && actor.active !== false;
  const okCaption = canEditCardCaption(actor);
  const captionLockMsg = 'You need permission to edit content details, request photo cards, or publish';
  const okLinked = canEditLinkedContent(actor, row);
  const linkedLockMsg = 'Publisher, Request Photo Cards holders, or Managers only';
  const okFolder = canEditCardFolder(actor, row);
  const folderLockMsg = 'Graphic Designer, Publisher or Managers only';

  const [copiedCombined, setCopiedCombined] = useState(false);
  const copyCombinedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyCombinedTimerRef.current) clearTimeout(copyCombinedTimerRef.current);
    };
  }, []);

  const cleanCap = (row.post_caption || '').trim();
  const cleanTags = (row.hashtags || '').trim();
  const combinedText = cleanCap && cleanTags ? `${cleanCap}\n\n${cleanTags}` : (cleanCap || cleanTags);
  const canCopyCombined = Boolean(cleanCap || cleanTags);

  const handleCopyCombined = async () => {
    if (!canCopyCombined) return;
    const ok = await copyText(combinedText);
    if (ok) {
      setCopiedCombined(true);
      if (copyCombinedTimerRef.current) clearTimeout(copyCombinedTimerRef.current);
      copyCombinedTimerRef.current = setTimeout(() => {
        setCopiedCombined(false);
      }, 1800);
    }
  };

  const pubLinks = getPublishedLinks(row);
  const allPlatforms = platforms || PLATFORMS;
  const targetPlatforms = Array.from(new Set([
    ...(row.target_platforms && row.target_platforms.length > 0 ? row.target_platforms : allPlatforms.map((p) => p.id)),
    ...Object.keys(pubLinks),
  ]));

  const onCommitPublishedLink = (platformId, val) => {
    const updated = { ...pubLinks, [platformId]: (val || '').trim() };
    if (!updated[platformId]) delete updated[platformId];
    
    const hasKeys = Object.keys(updated).length > 0;
    const payload = {
      live_video_url: hasKeys ? JSON.stringify(updated) : '',
    };
    if ('published_links' in row) {
      payload.published_links = updated;
    }
    patch(payload);
  };

  const captionCount = `${(row.post_caption || '').length} characters`;
  const hashtagCount = `${(row.hashtags || '').split(/\s+/).filter(Boolean).length} hashtags`;

  return (
    <div className="space-y-6">
      {/* a) Publisher */}
      <div className="w-full lg:w-1/2">
        <StaffGroupCard group="publish" row={row} actor={actor} team={team} patch={patch} />
      </div>

      {/* b) Target Platforms (read-only chips) */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Target Platforms</div>
        <div className="flex flex-wrap items-center gap-2">
          {(row.target_platforms || []).map((pId) => {
            const pMeta = allPlatforms.find((p) => p.id === pId) || { id: pId, label: pId };
            return (
              <span
                key={pId}
                className="rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1 text-[12px] font-medium text-sky-200"
              >
                {pMeta.label || pMeta.name || pId}
              </span>
            );
          })}
          {(!row.target_platforms || row.target_platforms.length === 0) ? (
            <span className="text-[12px] text-zinc-500 italic">No target platforms selected (edit in Details on the left)</span>
          ) : null}
        </div>
      </div>

      {/* c) Published links per platform */}
      <section className="border-t border-white/[0.08] pt-4">
        <div className="mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Published Links</div>
          <p className="text-[12px] text-zinc-500">Published live URLs for each platform where this card is live.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
          {targetPlatforms.map((pId) => {
            const pMeta = allPlatforms.find((p) => p.id === pId) || { id: pId, label: pId };
            const currentUrl = pubLinks[pId] || '';
            return (
              <Field key={pId} label={`${pMeta.label || pId} Published Link`} locked={!active} lockMessage="Inactive members cannot edit">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <BlurInput
                      value={currentUrl}
                      disabled={!active}
                      onCommit={(v) => onCommitPublishedLink(pId, v)}
                      placeholder={`https://${pId}.com/...`}
                    />
                  </div>
                  {safeHttpUrl(currentUrl) ? (
                    <a
                      href={safeHttpUrl(currentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnGhost} !px-3`}
                      title={`Open ${pMeta.label || pId} link`}
                    >
                      <Icon name="link" />
                    </a>
                  ) : null}
                </div>
              </Field>
            );
          })}
        </div>
      </section>

      {/* d) Caption & Hashtags */}
      <section className="space-y-4 border-t border-white/[0.08] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Caption & Hashtags</div>
          <button
            type="button"
            disabled={!canCopyCombined}
            onClick={handleCopyCombined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
              copiedCombined
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09] hover:text-white'
            }`}
          >
            <Icon name={copiedCombined ? 'check' : 'copy'} className="h-3 w-3" />
            <span>{copiedCombined ? 'Copied!' : 'Copy caption + hashtags'}</span>
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              Post caption / social copy
              {!okCaption ? <LockIcon message={captionLockMsg} /> : null}
            </span>
            <div className="flex items-center gap-2">
              <span className="normal-case tracking-normal text-zinc-500">{captionCount}</span>
              <CopyButton text={row.post_caption || ''} />
            </div>
          </div>
          <BlurInput
            multiline
            rows={3}
            value={row.post_caption}
            disabled={!okCaption}
            onCommit={(v) => patch({ post_caption: v })}
            placeholder="Caption that goes out with the post..."
          />
          <p className="mt-1 text-[12px] text-zinc-500">One caption for all platforms for now.</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5">
              Hashtags (#)
              {!okCaption ? <LockIcon message={captionLockMsg} /> : null}
              <span className="normal-case tracking-normal text-zinc-600"># is added for you</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="normal-case tracking-normal text-zinc-500">{hashtagCount}</span>
              <CopyButton text={row.hashtags || ''} />
            </div>
          </div>
          <BlurInput
            multiline
            rows={2}
            value={row.hashtags}
            disabled={!okCaption}
            onCommit={(v) => patch({ hashtags: normalizeHashtags(v) })}
            placeholder="#budget #economy"
          />
        </div>
      </section>

      {/* Card folder */}
      <section className="border-t border-white/[0.08] pt-4">
        <Field
          label={
            <span className="flex items-center justify-between w-full">
              <span>Card folder</span>
              {safeHttpUrl(row.card_folder) ? (
                <a
                  href={safeHttpUrl(row.card_folder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline lowercase tracking-normal"
                >
                  Open ↗
                </a>
              ) : null}
            </span>
          }
          hint="Where is the finished card on the shared drive"
          locked={!okFolder}
          lockMessage={folderLockMsg}
        >
          <BlurInput
            value={row.card_folder}
            disabled={!okFolder}
            onCommit={(v) => patch({ card_folder: v.trim() })}
            placeholder="e.g. Google Drive link or folder path"
          />
        </Field>
      </section>

      {/* e) Linked Content */}
      <section className="border-t border-white/[0.08] pt-4">
        <Field
          label={
            <span className="flex items-center justify-between w-full">
              <span>Linked content</span>
              {safeHttpUrl(row.linked_content_uid) ? (
                <a
                  href={safeHttpUrl(row.linked_content_uid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline lowercase tracking-normal"
                >
                  Open ↗
                </a>
              ) : null}
            </span>
          }
          hint="Content ID or link to a related video or post"
          locked={!okLinked}
          lockMessage={linkedLockMsg}
        >
          <BlurInput
            value={row.linked_content_uid}
            disabled={!okLinked}
            onCommit={(v) => patch({ linked_content_uid: v.trim() })}
            placeholder="e.g. WAVECON-0042 or https://..."
          />
        </Field>
      </section>
    </div>
  );
}

const QC_KINDS = [
  { id: 'revision', label: 'Revision note' },
  { id: 'qa', label: 'QA remark' },
  { id: 'audit', label: 'Audit comment' },
];
const QC_KIND_LABEL = { revision: 'Revision note', qa: 'QA remark', audit: 'Audit comment', change: 'Change' };

function QcTab({ row, actor, patch }) {
  const active = !!actor && actor.active !== false;
  const [kind, setKind] = useState('revision');
  const [note, setNote] = useState('');
  const reasons = [
    ['On hold', row.hold_reason],
    [isRemovedPublished(row) ? 'Removed after publishing' : 'Dropped', row.drop_reason],
    ['Re-shoot', row.reshoot_reason],
  ].filter((r) => r[1]);

  const addNote = () => {
    const text = note.trim();
    if (!text || !active) return;
    const now = new Date().toISOString();
    const entry = { actor: actor.full_name, role: actor.role, time: now };
    const audit = [...row.audit_log, { ...entry, kind, from: '', to: QC_KIND_LABEL[kind], note: text }];
    if (kind === 'revision') patch({ revisions: [...row.revisions, { ...entry, note: text }], audit_log: audit });
    else patch({ audit_log: audit });
    setNote('');
  };

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Add a note {!active ? <LockIcon message="Inactive members cannot add notes" /> : null}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {QC_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                disabled={!active}
                onClick={() => setKind(k.id)}
                className={`rounded-full border px-3 py-1.5 text-[12px] transition disabled:cursor-not-allowed ${
                  kind === k.id ? 'border-sky-400/50 bg-sky-500/15 text-sky-200' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08]'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            disabled={!active}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === 'revision' ? 'What needs to be changed?' : kind === 'qa' ? 'Quality check remark…' : 'Audit comment…'}
            className={active ? inputBase : inputLocked}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] text-zinc-600">Recorded with your name, role and the exact time.</span>
            <button className={btnPrimary} disabled={!active || !note.trim()} onClick={addNote}>
              <Icon name="plus" /> Add {QC_KIND_LABEL[kind].toLowerCase()}
            </button>
          </div>
        </section>

        {reasons.length ? (
          <section className="space-y-2">
            {reasons.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-400">{k}</div>
                <div className="mt-1 text-[13px] text-zinc-200">{v}</div>
              </div>
            ))}
          </section>
        ) : null}
      </div>

      <div className="space-y-6">
        <section>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Revision requests ({row.revisions.length})</div>
          {row.revisions.length === 0 ? <p className="text-[13px] text-zinc-600">No revisions requested.</p> : null}
          <div className="space-y-2">
            {[...row.revisions].reverse().map((r, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="text-[13px] text-zinc-200">{r.note}</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {r.actor}
                  {r.role ? ` (${ROLE_LABEL[r.role] || r.role})` : ''} · {formatStamp(r.time)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Audit trail ({row.audit_log.length})</div>
          {row.audit_log.length === 0 ? <p className="text-[13px] text-zinc-600">Nothing recorded yet.</p> : null}
          <ol className="relative space-y-4 border-l border-white/[0.08] pl-5">
            {[...row.audit_log].reverse().map((a, i) => {
              const isNote = a.kind === 'revision' || a.kind === 'qa' || a.kind === 'audit';
              const dot = isNote ? 'bg-violet-400' : a.kind === 'change' ? 'bg-amber-400' : 'bg-sky-400';
              return (
                <li key={i} className="relative">
                  <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${dot}`} />
                  <div className="text-[13px] text-zinc-200">
                    {isNote ? (
                      <span className="font-medium text-white">{QC_KIND_LABEL[a.kind]}</span>
                    ) : a.kind === 'change' ? (
                      <>
                        <span className="font-medium text-white">{a.field}</span>: <span className="text-zinc-400">{a.from || 'empty'}</span> → <span className="font-medium text-white">{a.to || 'empty'}</span>
                      </>
                    ) : (
                      <>
                        {a.from ? `${a.from} → ` : ''}
                        <span className="font-medium text-white">{a.to}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {a.actor}
                    {a.role ? ` (${ROLE_LABEL[a.role] || a.role})` : ''} · {formatStamp(a.time)}
                  </div>
                  {a.note ? <div className="mt-1 text-[12px] text-zinc-400">“{a.note}”</div> : null}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

function CreditsTab({ row, actor, team, patch }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const creditedRoles = ROLE_LIST.filter((r) => !!(row[r.field] && String(row[r.field]).trim()));
  const hasCredits = creditedRoles.length > 0;
  const creditLineText = hasCredits
    ? creditedRoles.map((r) => `${r.label}: ${String(row[r.field]).trim()}`).join(' · ')
    : '';

  const handleCopyCredits = async () => {
    if (!hasCredits) return;
    const ok = await copyText(creditLineText);
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top: StaffGroupCard for crew at full width */}
      <StaffGroupCard group="crew" row={row} actor={actor} team={team} patch={patch} />

      {/* Below: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column: idea, publish, live */}
        <div className="space-y-4">
          <StaffGroupCard group="idea" row={row} actor={actor} team={team} patch={patch} />
          <StaffGroupCard group="publish" row={row} actor={actor} team={team} patch={patch} />
          <StaffGroupCard group="live" row={row} actor={actor} team={team} patch={patch} />
        </div>

        {/* Right column: post, Credit line card */}
        <div className="space-y-4">
          <StaffGroupCard group="post" row={row} actor={actor} team={team} patch={patch} />

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Credit line</span>
              <button
                type="button"
                disabled={!hasCredits}
                onClick={handleCopyCredits}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  copied
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09] hover:text-white'
                }`}
              >
                <Icon name={copied ? 'check' : 'copy'} className="h-3 w-3" />
                <span>{copied ? 'Copied!' : 'Copy credits'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={hasCredits ? creditLineText : 'No one is credited yet.'}
              onFocus={(e) => e.target.select()}
              className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed outline-none resize-none transition focus:border-sky-400/60 focus:bg-white/[0.06] select-all ${
                hasCredits ? 'text-zinc-200' : 'text-zinc-500 italic'
              }`}
            />
            <p className="mt-2 text-[12px] text-zinc-500">Everyone who worked on this content, in one place.</p>
          </div>
        </div>
      </div>

      <p className="text-[12px] text-zinc-500 pt-2">
        Every role of every stage is here. The Production tab shows the Production Crew again and the Publish tab shows the Publisher again. The same rules apply everywhere.
      </p>
    </div>
  );
}

function CardCreditsTab({ row, photoTemplates = [] }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const tpl = (photoTemplates || []).find((t) => String(t.id) === String(row.template_id));
  const templateDesigner = tpl?.designed_by || '';

  const creditRows = [
    {
      label: 'Requested by',
      name: row.requested_by ? String(row.requested_by).trim() : '',
      time: row.requested_at ? formatStamp(row.requested_at) : '',
    },
    {
      label: 'Designed by',
      name: row.graphic_designer ? String(row.graphic_designer).trim() : '',
      time: '',
    },
    {
      label: 'Approved by',
      name: row.approved_by ? String(row.approved_by).trim() : '',
      time: row.approved_at ? formatStamp(row.approved_at) : '',
    },
    {
      label: 'Published by',
      name: (row.publisher || row.published_by) ? String(row.publisher || row.published_by).trim() : '',
      time: (row.went_live_at || row.published_at) ? formatStamp(row.went_live_at || row.published_at) : '',
    },
    {
      label: 'Template by',
      name: templateDesigner ? String(templateDesigner).trim() : '',
      time: '',
    },
  ];

  const creditParts = creditRows
    .filter((r) => !!r.name)
    .map((r) => `${r.label}: ${r.name}`);

  const hasCredits = creditParts.length > 0;
  const creditLineText = hasCredits ? creditParts.join(' · ') : '';

  const handleCopyCredits = async () => {
    if (!hasCredits) return;
    const ok = await copyText(creditLineText);
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Photo Card Credits</div>
        <div className="space-y-3 text-[13px]">
          {creditRows.map((r, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.04] pb-2.5 last:border-0 last:pb-0">
              <span className="text-zinc-400 font-medium">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className={r.name ? 'font-semibold text-zinc-100' : 'text-zinc-500'}>
                  {r.name || '—'}
                </span>
                {r.time ? (
                  <span className="text-[11px] text-zinc-500">· {r.time}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Credit line</span>
          <button
            type="button"
            disabled={!hasCredits}
            onClick={handleCopyCredits}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
              copied
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09] hover:text-white'
            }`}
          >
            <Icon name={copied ? 'check' : 'copy'} className="h-3 w-3" />
            <span>{copied ? 'Copied!' : 'Copy credits'}</span>
          </button>
        </div>
        <textarea
          readOnly
          rows={3}
          value={hasCredits ? creditLineText : 'No one is credited yet.'}
          onFocus={(e) => e.target.select()}
          className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed outline-none resize-none transition focus:border-sky-400/60 focus:bg-white/[0.06] select-all ${
            hasCredits ? 'text-zinc-200' : 'text-zinc-500 italic'
          }`}
        />
        <p className="mt-2 text-[12px] text-zinc-500">Everyone who worked on this photo card, in one place.</p>
      </div>
    </div>
  );
}

export function DeleteModal({ row, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const key = (row.slug_name || row.title || row.content_uid || 'DELETE').trim();
  const ok = text.trim().toLowerCase() === key.toLowerCase();
  return (
    <ModalShell
      title="Delete permanently?"
      subtitle="This cannot be undone."
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            className={btnDanger}
            disabled={!ok || busy}
            onClick={async () => {
              setBusy(true);
              const done = await onConfirm(row);
              setBusy(false);
              if (done) onClose();
            }}
          >
            <Icon name="trash" /> {busy ? 'Deleting…' : 'Delete forever'}
          </button>
        </>
      }
    >
      <p className="mb-4 text-[14px] leading-relaxed text-zinc-300">
        The script, links, shorts, notes and history of this content will be removed for everyone. To confirm, type <span className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px] text-white">{key}</span> below.
      </p>
      <input autoFocus className={inputBase} value={text} onChange={(e) => setText(e.target.value)} placeholder={key} />
    </ModalShell>
  );
}



function SponsorsSection({ row, actor, advertisers = [], ads = [], onAdd, onUpdate, onDelete }) {
  const canEdit = canEditAds(actor);
  const activeAdvertisers = useMemo(() => advertisers.filter((a) => a.active !== false), [advertisers]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addAdvId, setAddAdvId] = useState('');
  const [addType, setAddType] = useState('spoken');
  const [addStatus, setAddStatus] = useState('agreed');
  const [addInstruction, setAddInstruction] = useState('');
  const [addFileNote, setAddFileNote] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editAdvId, setEditAdvId] = useState('');
  const [editType, setEditType] = useState('spoken');
  const [editStatus, setEditStatus] = useState('agreed');
  const [editInstruction, setEditInstruction] = useState('');
  const [editFileNote, setEditFileNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [confirmDeleteAd, setConfirmDeleteAd] = useState(null);

  const resetAddForm = () => {
    setAddAdvId('');
    setAddType('spoken');
    setAddStatus('agreed');
    setAddInstruction('');
    setAddFileNote('');
  };

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    if (!addAdvId || !addType || !onAdd) return;
    setAdding(true);
    try {
      const ok = await onAdd({
        advertiser_id: addAdvId,
        ad_type: addType,
        status: addStatus,
        instruction: addInstruction,
        file_note: addFileNote,
      });
      if (ok) {
        resetAddForm();
        setShowAddForm(false);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!id || !editAdvId || !editType || !onUpdate) return;
    setUpdating(true);
    try {
      const ok = await onUpdate(id, {
        advertiser_id: editAdvId,
        ad_type: editType,
        status: editStatus,
        instruction: editInstruction,
        file_note: editFileNote,
      });
      if (ok) {
        setEditingId(null);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Rule 2d: User may not edit (canEditAds false) and the content has no ads: render NOTHING
  if (!canEdit && (!ads || ads.length === 0)) {
    return null;
  }

  const hasAgreed = (ads || []).some((a) => a.status === 'agreed');

  const addForm = (
    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-3.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white">Add sponsor ad</span>
        <button
          type="button"
          className="inline-flex items-center text-[12px] text-zinc-400 hover:text-white min-h-[44px] lg:min-h-0"
          onClick={() => {
            setShowAddForm(false);
            resetAddForm();
          }}
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
            Advertiser
          </label>
          <SelectBox
            value={addAdvId}
            onChange={setAddAdvId}
            options={activeAdvertisers.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Select advertiser..."
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
            Ad Type
          </label>
          <SelectBox
            value={addType}
            onChange={setAddType}
            options={AD_TYPES}
            placeholder="Select ad type..."
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
            Status
          </label>
          <SelectBox
            value={addStatus}
            onChange={setAddStatus}
            options={AD_STATUSES}
            placeholder="Select status..."
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
            File Note (optional)
          </label>
          <input
            type="text"
            className={inputBase}
            placeholder="Drive link, filename..."
            value={addFileNote}
            onChange={(e) => setAddFileNote(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
            Instruction (optional)
          </label>
          <textarea
            rows={2}
            className={`${inputBase} resize-y text-[13px]`}
            placeholder="Instructions for presenter, editor, or crew..."
            value={addInstruction}
            onChange={(e) => setAddInstruction(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className={`${btnGhost} text-[12px] min-h-[44px] lg:min-h-0 lg:!py-1.5 lg:!px-3`}
          onClick={() => {
            setShowAddForm(false);
            resetAddForm();
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${btnPrimary} text-[12px] min-h-[44px] lg:min-h-0 lg:!py-1.5 lg:!px-3`}
          disabled={!addAdvId || !addType || adding}
          onClick={handleAdd}
        >
          {adding ? 'Adding...' : 'Add ad'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-5 pt-5 border-t border-white/[0.08] flex flex-col gap-3">
      {ads.length === 0 ? (
        // User may edit and the content has no ads: show one clear dashed "＋ Add sponsor" button
        <>
          {showAddForm ? (
            addForm
          ) : (
            <div>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-500/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={activeAdvertisers.length === 0}
                title={activeAdvertisers.length === 0 ? 'No active advertisers' : undefined}
                onClick={() => {
                  setShowAddForm(true);
                  resetAddForm();
                }}
              >
                <span>＋ Add sponsor</span>
              </button>
              {activeAdvertisers.length === 0 ? (
                <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-[12px] text-zinc-400">
                  No advertisers yet. A Manager can add them from the Manage menu.
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : (
        // Content has ads
        <>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ring-inset text-violet-300 bg-violet-500/15 ring-violet-400/25 ${
                hasAgreed ? 'sponsor-glow' : ''
              }`}
            >
              <Icon name="megaphone" className="h-4 w-4 shrink-0" />
              <span>Sponsored · {ads.length}</span>
            </span>
            {canEdit ? (
              <button
                type="button"
                className={`${btnGhost} text-[12px] min-h-[44px] lg:min-h-0 lg:!py-1 lg:!px-2.5`}
                disabled={activeAdvertisers.length === 0}
                title={activeAdvertisers.length === 0 ? 'No active advertisers' : undefined}
                onClick={() => {
                  if (showAddForm) {
                    setShowAddForm(false);
                    resetAddForm();
                  } else {
                    setShowAddForm(true);
                  }
                }}
              >
                {showAddForm ? 'Cancel' : '＋ Add'}
              </button>
            ) : null}
          </div>

          {!canEdit ? (
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Only the Owner, Managers and people with the “Manage Sponsors” permission can change ads</span>
            </p>
          ) : null}

          {canEdit && showAddForm && activeAdvertisers.length > 0 ? addForm : null}

          <div className="flex flex-col gap-2">
            {ads.map((ad) => {
              const isEditing = editingId === ad.id;
              if (isEditing) {
                const editAdvOptions = advertisers
                  .filter((a) => a.active !== false || a.id === ad.advertiser_id)
                  .map((a) => ({ value: a.id, label: a.name }));
                return (
                  <div key={ad.id} className="rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-white">Edit sponsor ad</span>
                      <button
                        type="button"
                        className="inline-flex items-center text-[12px] text-zinc-400 hover:text-white min-h-[44px] lg:min-h-0"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
                          Advertiser
                        </label>
                        <SelectBox
                          value={editAdvId}
                          onChange={setEditAdvId}
                          options={editAdvOptions}
                          placeholder="Select advertiser..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
                          Ad Type
                        </label>
                        <SelectBox
                          value={editType}
                          onChange={setEditType}
                          options={AD_TYPES}
                          placeholder="Select ad type..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
                          Status
                        </label>
                        <SelectBox
                          value={editStatus}
                          onChange={setEditStatus}
                          options={AD_STATUSES}
                          placeholder="Select status..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
                          File Note (optional)
                        </label>
                        <input
                          type="text"
                          className={inputBase}
                          placeholder="Drive link, filename..."
                          value={editFileNote}
                          onChange={(e) => setEditFileNote(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-1">
                          Instruction (optional)
                        </label>
                        <textarea
                          rows={2}
                          className={`${inputBase} resize-y text-[13px]`}
                          placeholder="Instructions for presenter, editor, or crew..."
                          value={editInstruction}
                          onChange={(e) => setEditInstruction(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        className={`${btnGhost} text-[12px] min-h-[44px] lg:min-h-0 lg:!py-1.5 lg:!px-3`}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`${btnPrimary} text-[12px] min-h-[44px] lg:min-h-0 lg:!py-1.5 lg:!px-3`}
                        disabled={!editAdvId || !editType || updating}
                        onClick={() => handleUpdate(ad.id)}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              }

              const typeLabel = (AD_TYPES.find((t) => t.value === ad.ad_type) || {}).label || ad.ad_type;
              const statusLabel = (AD_STATUSES.find((s) => s.value === ad.status) || {}).label || ad.status;
              const statusTone =
                ad.status === 'aired'
                  ? 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25'
                  : ad.status === 'added'
                  ? 'text-amber-300 bg-amber-500/15 ring-amber-400/25'
                  : 'text-zinc-300 bg-zinc-500/15 ring-zinc-400/25';

              return (
                <div key={ad.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-[13px] truncate">{ad.advertiser_name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-white/[0.06] text-zinc-300 ring-1 ring-inset ring-white/10">
                          {typeLabel}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ring-inset ${statusTone}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className={`${btnGhost} text-[11px] min-h-[44px] lg:min-h-0 lg:!py-1 lg:!px-2`}
                          onClick={() => {
                            setEditingId(ad.id);
                            setEditAdvId(ad.advertiser_id);
                            setEditType(ad.ad_type || 'spoken');
                            setEditStatus(ad.status || 'agreed');
                            setEditInstruction(ad.instruction || '');
                            setEditFileNote(ad.file_note || '');
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${btnDanger} text-[11px] min-h-[44px] lg:min-h-0 lg:!py-1 lg:!px-2`}
                          onClick={() => setConfirmDeleteAd(ad)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {ad.instruction ? (
                    <div className="text-[12px] text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
                      {ad.instruction}
                    </div>
                  ) : null}

                  {ad.file_note ? (
                    <div className="text-[11px] text-zinc-500 break-words">
                      File: <span className="text-zinc-400">{ad.file_note}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      {confirmDeleteAd ? (
        <ConfirmDialog
          title="Remove ad"
          message={`Are you sure you want to remove the ad for "${confirmDeleteAd.advertiser_name || 'this advertiser'}"?`}
          confirmLabel="Remove"
          danger
          onConfirm={async () => {
            if (onDelete) await onDelete(confirmDeleteAd.id);
            setConfirmDeleteAd(null);
          }}
          onCancel={() => setConfirmDeleteAd(null)}
        />
      ) : null}
    </div>
  );
}

function PublishCheckBanner({ row, actor, onAnswer }) {
  const now = useNow(30000);
  const state = publishCheckState(row, now);
  if (!state) return null;

  if (state === 'unanswered') {
    const canAnswer = canAnswerPublishCheckNow(actor, row, now);
    return (
      <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] text-zinc-200">
          <span>The publish time passed ({row.scheduled_publish_time ? formatStamp(row.scheduled_publish_time) : ''}). Did it go out?</span>
          {!canAnswer ? (
            <p className="mt-1 text-[12px] text-zinc-500">Only the assigned Publisher or a Manager can answer</p>
          ) : null}
        </div>
        <button
          type="button"
          className={`${btnPrimary} min-h-[44px] sm:min-h-0 !px-4 !py-1.5 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={!canAnswer}
          onClick={() => onAnswer && onAnswer(row)}
        >
          Answer
        </button>
      </div>
    );
  }

  if (state === 'waiting_manager') {
    const isMgr = isManager(actor);
    return (
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] font-semibold text-amber-300">
            Waiting for a Manager decision
          </div>
          <button
            type="button"
            className={`${btnPrimary} min-h-[44px] sm:min-h-0 !px-4 !py-1.5 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!isMgr}
            onClick={() => onAnswer && onAnswer(row)}
          >
            Decide
          </button>
        </div>
        <div className="text-[12px] text-zinc-400">
          Asked by {row.publish_help_by || 'Unknown'} · {row.publish_help_at ? formatStamp(row.publish_help_at) : ''}
        </div>
        {row.publish_help_note ? (
          <p className="text-[13px] text-zinc-200 whitespace-pre-wrap select-text">
            {row.publish_help_note}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

function Drawer({ row, actor, team, channels, platforms = PLATFORMS, onClose, onPatch, onRun, onDelete, onAddPlatform, advertisers = [], ads = [], onAddAd, onUpdateAd, onDeleteAd, onPublishCheck, locationOptions = [], photoTemplates = [], fetchScriptMeta }) {
  const bookings = useContentBookings(row?.id);
  const savedScriptStats = scriptStats(row.script);
  const isCard = typeIsCard(row.content_type);
  const hasEditorial = typeHasScript(row.content_type) || isCard;
  const [tab, setTab] = useState(hasEditorial ? 'editorial' : 'production');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [saveState, setSaveState] = useState({ status: 'idle', at: null });
  const pendingRef = useRef(0);

  const [copiedId, setCopiedId] = useState(false);
  const copyIdTimerRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.closest('aside')) el.blur();
    };
    window.addEventListener('keydown', fn, true);
    return () => window.removeEventListener('keydown', fn, true);
  }, []);

  useEffect(() => {
    return () => {
      if (copyIdTimerRef.current) clearTimeout(copyIdTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setTab((typeHasScript(row.content_type) || typeIsCard(row.content_type)) ? 'editorial' : 'production');
    setDetailsOpen(true);
    pendingRef.current = 0;
    setSaveState({ status: 'idle', at: null });
    if (copyIdTimerRef.current) clearTimeout(copyIdTimerRef.current);
    setCopiedId(false);
  }, [row.id, row.content_uid, row.content_type]);

  const handleCopyId = async () => {
    if (!row.content_uid) return;
    const ok = await copyText(row.content_uid);
    if (ok) {
      setCopiedId(true);
      if (copyIdTimerRef.current) clearTimeout(copyIdTimerRef.current);
      copyIdTimerRef.current = setTimeout(() => {
        setCopiedId(false);
      }, 1800);
    }
  };

  const patch = async (p) => {
    pendingRef.current += 1;
    setSaveState({ status: 'saving', at: null });
    let ok = false;
    try {
      ok = await onPatch(row.id, p);
    } catch (e) {
      ok = false;
    }
    pendingRef.current -= 1;
    if (pendingRef.current === 0) {
      setSaveState(ok ? { status: 'saved', at: new Date().toISOString() } : { status: 'error', at: null });
    }
    return ok;
  };
  const actions = getActions(row, actor, { photoTemplates });
  const mainActions = actions.filter(
    (a) => a.id !== 'hold' && a.id !== 'drop' && a.id !== 'download_script' && a.id !== 'copy_script'
  );
  const dangerActions = ['hold', 'drop']
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean);
  const currentTab = isCard
    ? (tab === 'production' || tab === 'postproduction' ? 'editorial' : tab)
    : (!hasEditorial && tab === 'editorial') ? 'production' : tab;
  const prog = stepProgress(row);
  const tabs = [
    ...(hasEditorial ? [{ id: 'editorial', label: 'Editorial', done: prog.editorial }] : []),
    ...(!isCard ? [{ id: 'production', label: 'Production', done: prog.production }] : []),
    ...(!isCard ? [{ id: 'postproduction', label: 'Post-production', done: prog.post }] : []),
    { id: 'packaging', label: 'Publish', done: prog.publish },
    { id: 'qc', label: 'QC & Audit', done: false },
    { id: 'credits', label: 'Credits', done: false },
  ];
  const leftTabs = tabs.filter((t) => t.id !== 'qc' && t.id !== 'credits');
  const rightTabs = tabs.filter((t) => t.id === 'qc' || t.id === 'credits');
  const handleSelectTab = (id) => {
    setTab(id);
    setDetailsOpen(id === 'editorial');
  };

  const renderFolderIdChip = (wrapperClassName = '') => {
    if (!row.content_uid) return null;
    return (
      <div className={wrapperClassName}>
        <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-[14px] sm:text-[15px] lg:text-[16px] text-zinc-200 shrink-0 whitespace-nowrap">
          <span title="Folder name on the storage drive" className="inline-flex items-center text-zinc-400">
            <Icon name="folder" className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>{row.content_uid}</span>
        </span>
        <button
          type="button"
          onClick={handleCopyId}
          aria-label="Copy content ID"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition active:scale-[0.98] ${
            copiedId
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.09] hover:text-white'
          }`}
        >
          <Icon name={copiedId ? 'check' : 'copy'} className="h-3 w-3" />
          <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
        </button>
      </div>
    );
  };

  const renderTabBar = ({ isDesktop = false } = {}) => {
    if (isDesktop) {
      return (
        <div className="hidden lg:flex items-center justify-between border-b border-white/[0.06] px-6 shrink-0 z-20">
          <StepBar tabs={leftTabs} active={currentTab} onSelect={handleSelectTab} />
          <div className="ml-auto">
            <StepBar tabs={rightTabs} active={currentTab} onSelect={handleSelectTab} />
          </div>
        </div>
      );
    }
    return (
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 lg:hidden">
        <StepBar tabs={tabs} active={currentTab} onSelect={handleSelectTab} />
      </div>
    );
  };
  const publishedLinks = getPublishedLinks(row);
  const validLinkEntries = Object.entries(publishedLinks).filter(([_, u]) => safeHttpUrl(u));
  const hasPublishedLinks = validLinkEntries.length > 0 || safeHttpUrl(row.live_video_url);

  const renderPublishedLinks = () => {
    if (!hasPublishedLinks) return null;
    if (validLinkEntries.length === 0 && safeHttpUrl(row.live_video_url)) {
      return (
        <a
          href={safeHttpUrl(row.live_video_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-medium text-white transition hover:bg-white/20"
        >
          <Icon name="link" className="h-3 w-3" />
          View Published Content
        </a>
      );
    }
    return validLinkEntries.map(([pId, u]) => {
      const pMeta = PLATFORMS.find((p) => p.id === pId);
      return (
        <a
          key={pId}
          href={safeHttpUrl(u)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-medium text-white transition hover:bg-white/20"
        >
          <Icon name="link" className="h-3 w-3" />
          {pMeta?.label || pId}
        </a>
      );
    });
  };

  return (
    <BookingsContext.Provider value={{ bookings }}>
      <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[580px] lg:w-[94vw] lg:max-w-[1600px] flex-col border-l border-white/[0.08] bg-black/60 shadow-2xl shadow-black backdrop-blur-xl">
        <header className="border-b border-white/[0.06] px-4 sm:px-5 lg:px-6 pt-3 pb-0 lg:pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <TypeBadge type={row.content_type} />
              <StatusBadge status={row.status} removed={isRemovedPublished(row)} />
              {typeHasScript(row.content_type) && savedScriptStats.words > 0 && (
                <span className="script-duration-badge inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-white/10 bg-zinc-800 text-zinc-200">
                  Script {savedScriptStats.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saveState.status === 'saving' && <span aria-live="polite" className="text-[11px] text-zinc-500">Saving…</span>}
              {saveState.status === 'saved' && <span aria-live="polite" className="text-[11px] text-emerald-400">Saved ✓ {formatTime(saveState.at)}</span>}
              {saveState.status === 'error' && <span aria-live="polite" className="text-[11px] text-red-400">Not saved</span>}
              <button
                onClick={onClose}
                className="drawer-close-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300 ring-1 ring-red-400/30 transition hover:bg-red-500 hover:text-white"
                aria-label="Close drawer"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 lg:flex-nowrap min-w-0">
            <h2 className="truncate text-[20px] lg:text-[22px] font-black tracking-tight text-white shrink min-w-0">
              {row.slug_name || row.title || 'Untitled'}
            </h2>
            <span className="shrink-0 text-[12px] lg:text-[13px] text-zinc-500 whitespace-nowrap">
              {row.channel || 'No channel'} · {formatDay(row.scheduled_publish_time)} {formatTime(row.scheduled_publish_time)}
            </span>
            {hasPublishedLinks ? (
              <div className="hidden lg:flex ml-auto flex-wrap items-center gap-1.5 shrink-0">
                {renderPublishedLinks()}
              </div>
            ) : null}
            {renderFolderIdChip('flex items-center gap-2 w-full shrink-0 mt-1 lg:hidden')}
          </div>
          {hasPublishedLinks ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 lg:hidden">
              {renderPublishedLinks()}
            </div>
          ) : null}
          {renderTabBar({ isDesktop: false })}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="border-b border-white/[0.06] lg:border-b-0 drawer-left-col lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-white/[0.06] lg:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setDetailsOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between bg-white/[0.02] px-6 py-3 text-left text-[13px] font-semibold text-zinc-300 transition hover:bg-white/[0.04] lg:hidden ${detailsOpen ? 'border-b border-white/[0.06]' : ''}`}
              aria-expanded={detailsOpen}
            >
              <span>Details</span>
              <Icon name={detailsOpen ? 'chevronDown' : 'chevronRight'} className="h-4 w-4 text-zinc-400" />
            </button>
            <div className={`${detailsOpen ? 'block' : 'hidden'} lg:block px-6 py-6 lg:p-0`}>
              {renderFolderIdChip('hidden lg:flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.06]')}
              <ContentDetailsFields
                row={row}
                actor={actor}
                channels={channels}
                platforms={platforms}
                patch={patch}
                onAddPlatform={onAddPlatform}
              />
              <SponsorsSection
                row={row}
                actor={actor}
                advertisers={advertisers}
                ads={ads}
                onAdd={onAddAd}
                onUpdate={onUpdateAd}
                onDelete={onDeleteAd}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
            {renderTabBar({ isDesktop: true })}
            <div className="min-w-0 flex-1 px-6 py-6 lg:overflow-y-auto">
              <PublishCheckBanner row={row} actor={actor} onAnswer={onPublishCheck} />
              {currentTab === 'editorial' ? (
                isCard ? (
                  <PhotoCardEditorialTab row={row} actor={actor} patch={patch} photoTemplates={photoTemplates} />
                ) : (
                  <ScriptTab row={row} actor={actor} patch={patch} team={team} platforms={platforms} fetchScriptMeta={fetchScriptMeta} />
                )
              ) : null}
              {currentTab === 'production' && !isCard ? (
                  <ProductionTab row={row} actor={actor} team={team} patch={patch} locationOptions={locationOptions} />
              ) : null}
              {currentTab === 'postproduction' && !isCard ? <PostProductionTab row={row} actor={actor} team={team} patch={patch} /> : null}
              {currentTab === 'packaging' ? (
                isCard ? (
                  <PhotoCardPublishTab row={row} actor={actor} team={team} patch={patch} platforms={platforms} />
                ) : (
                  <PackagingTab row={row} actor={actor} team={team} patch={patch} platforms={platforms} onAddPlatform={onAddPlatform} />
                )
              ) : null}
              {currentTab === 'qc' ? <QcTab row={row} actor={actor} patch={patch} /> : null}
              {currentTab === 'credits' ? (
                isCard ? (
                  <CardCreditsTab row={row} photoTemplates={photoTemplates} />
                ) : (
                  <CreditsTab row={row} actor={actor} team={team} patch={patch} />
                )
              ) : null}
            </div>
          </div>
        </div>
        <footer className="border-t border-white/[0.08] bg-black/70 backdrop-blur-xl flex flex-col lg:flex-row">
          <div className="hidden lg:block drawer-left-spacer lg:shrink-0 border-r border-white/[0.06] bg-white/[0.02]" aria-hidden="true" />
          <div className="min-w-0 flex-1 px-6 py-4 lg:py-2 drawer-footer-compact">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 shrink-0">Next step</span>
                <ActionButtons actions={mainActions} onRun={(a) => onRun(row, a)} />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 lg:ml-auto">
                {dangerActions.length > 0 ? (
                  <ActionButtons actions={dangerActions} onRun={(a) => onRun(row, a)} />
                ) : null}
                <button
                  type="button"
                  className={btnDanger}
                  disabled={!isManager(actor)}
                  title={isManager(actor) ? 'Delete this content forever' : 'Only Managers and the Owner can delete content'}
                  onClick={() => onDelete(row)}
                >
                  <Icon name={isManager(actor) ? 'trash' : 'lock'} className="h-3.5 w-3.5" /> Delete permanently
                </button>
              </div>
            </div>
            {actions.some((a) => a.allowed && a.blocked) ? (
              <p className="mt-1 text-[12px] text-amber-400/80">{actions.find((a) => a.allowed && a.blocked).blocked}</p>
            ) : null}
          </div>
        </footer>
      </aside>
    </div>
    </BookingsContext.Provider>
  );
}

export { Drawer };
