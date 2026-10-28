'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon, LockIcon } from './Icons';
import { copyText, safeHttpUrl } from '../../utils/helpers';
import { scriptStats } from '../../utils/scriptDuration';
import { saveDraft, loadDraft, clearDraft } from '../../utils/scriptDraft';
import { isFeatureEnabled } from '../../utils/features';
import { Teleprompter } from './Teleprompter';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import dynamic from 'next/dynamic';
const ScriptEditor = dynamic(() => import('./ScriptEditor'), { ssr: false });
import { StatusBadge, TypeBadge, RoleBadge, DesignationPill } from './Badges';
import { inputBase, inputLocked, btnPrimary, btnGhost, btnDanger, Avatar, PersonName, Field, SelectBox, BlurInput, ModalShell, FullScreenCard, Toggle, ActionButtons } from './Shared';
import {
  DEFAULT_CHANNELS, CONTENT_TYPES, CONTENT_TYPE_HINT, PLATFORMS, PERMISSIONS, ROLE_LABEL,
  STATUS_META, ALL_STATUSES, isManager, isOwner, can, afterScript, afterShoot, getActions,
  startOfDay, addDays, sameDay, MONTHS, pad, formatRangeLabel, toLocalInput, fromLocalInput,
  formatTime, formatDay, formatStamp, SLUG_MAX, normalizeSlugInput, uid, generateUserUID,
  makeContentUid, asArray, shortsInRange, rowTimeIn, isParked, isRemovedPublished, normalizeRow, normalizeMember,
  FIELD_PERM, TRACKED_FIELDS, presenterMembers
} from '../../lib/core';


function CreditSelect({ label, field, skillKey, row, patch, team, disabled }) {
  const filtered = team.filter((t) => !skillKey || t[skillKey] || t.role === 'owner' || t.role === 'manager');
  const options = filtered.map((m) => ({ value: m.full_name, label: m.nickname || m.full_name }));
  if (row[field] && !filtered.some((m) => m.full_name === row[field])) {
    const extra = team.find((m) => m.full_name === row[field]);
    options.unshift({ value: row[field], label: (extra && extra.nickname) || row[field] });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</label>
      <SelectBox
        value={row[field] || ''}
        disabled={disabled}
        onChange={(v) => patch({ [field]: v })}
        options={options}
        placeholder="— Unassigned —"
      />
    </div>
  );
}

const STAFF_GROUPS = [
  {
    id: 'idea',
    title: 'Idea & Script',
    hint: 'who thought of it and wrote it',
    stripe: 'bg-sky-400',
    chip: 'bg-sky-400/15 text-sky-200',
    fields: [
      { field: 'concept_creator', label: 'Concept Creator', skillKey: 'role_concept_creator' },
      { field: 'writer', label: 'Research & Script Writer', skillKey: 'role_research_script_writer' },
    ],
  },
  {
    id: 'post',
    title: 'Post-Production',
    hint: 'after the shoot',
    stripe: 'bg-amber-400',
    chip: 'bg-amber-400/15 text-amber-300',
    fields: [
      { field: 'video_editor', label: 'Video Editor', skillKey: 'role_video_editor' },
      { field: 'motion_graphics_designer', label: 'Motion Graphics Designer', skillKey: 'role_motion_graphics_designer' },
      { field: 'graphic_designer', label: 'Graphic Designer', skillKey: 'role_graphic_designer' },
      { field: 'colorist', label: 'Colorist', skillKey: 'role_colorist' },
      { field: 'audio_mixer', label: 'Audio Mixer', skillKey: 'role_audio_mixer' },
    ],
  },
  {
    id: 'crew',
    title: 'Production Crew',
    hint: 'on the shoot',
    stripe: 'bg-red-400',
    chip: 'bg-red-400/15 text-red-200',
    fields: [
      { field: 'producer', label: 'Producer', skillKey: 'role_producer' },
      { field: 'presenter_name', label: 'Presenter', skillKey: 'role_presenter' },
      { field: 'camera_operator', label: 'Camera Operator', skillKey: 'role_camera_operator' },
      { field: 'teleprompter_operator', label: 'Teleprompter Operator', skillKey: 'role_teleprompter_operator' },
      { field: 'light_designer', label: 'Light Designer', skillKey: 'role_light_designer' },
      { field: 'sound_recordist', label: 'Sound Recordist', skillKey: 'role_sound_recordist' },
      { field: 'voice_over_artist', label: 'Voice Over Artist', skillKey: 'role_voice_over_artist' },
    ],
  },
  {
    id: 'publish',
    title: 'Publishing',
    hint: 'who puts it live',
    stripe: 'bg-emerald-400',
    chip: 'bg-emerald-400/15 text-emerald-200',
    fields: [
      { field: 'publisher', label: 'Publisher', skillKey: 'role_publisher' },
    ],
  },
  {
    id: 'live',
    title: 'Live Crew',
    hint: 'shown only for LIVE content',
    stripe: 'bg-violet-400',
    chip: 'bg-violet-400/15 text-violet-300',
    fields: [
      { field: 'live_video_switcher', label: 'Live Video Switcher', skillKey: 'role_live_video_switcher' },
      { field: 'live_audio_mixer', label: 'Live Audio Mixer', skillKey: 'role_live_audio_mixer' },
    ],
  },
];

function StaffTile({ field, label, skillKey, row, patch, team, actor }) {
  const active = !!actor && actor.active !== false;
  const isPresenter = field === 'presenter_name';
  const okPres = can(actor, 'can_assign_presenter');
  const isLocked = isPresenter ? !okPres : !active;
  const lockTitle = isPresenter
    ? 'You need the “Assign Presenter” permission'
    : 'You do not have permission to assign staff';

  const assignedName = row[field];
  const isAssigned = !!assignedName;
  const member = isAssigned ? (team || []).find((m) => m.full_name === assignedName) : null;
  const nickname = (member && member.nickname) || assignedName;

  const tileTitle = isLocked
    ? lockTitle
    : isAssigned
    ? (member && member.designation ? `${member.full_name} (${member.designation})` : (member ? member.full_name : assignedName))
    : `Assign ${label}`;

  const eligibleMembers = isPresenter
    ? presenterMembers(team)
    : (team || []).filter((t) => !skillKey || t[skillKey] || t.role === 'owner' || t.role === 'manager');

  const options = eligibleMembers.map((m) => ({
    value: m.full_name,
    label: m.nickname || m.full_name,
  }));

  if (assignedName && !eligibleMembers.some((m) => m.full_name === assignedName)) {
    const extra = (team || []).find((m) => m.full_name === assignedName);
    options.unshift({
      value: assignedName,
      label: (extra && extra.nickname) || assignedName,
    });
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

      {!isLocked ? (
        <select
          value={assignedName || ''}
          onChange={(e) => patch({ [field]: e.target.value })}
          aria-label={`${label}: ${isAssigned ? nickname : 'Unassigned'}`}
          title={tileTitle}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:outline-none"
        >
          <option value="" className="bg-[#121215]">
            — Unassigned —
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#121215]">
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

function StaffAssignment({ row, actor, team, patch }) {
  const HIDE_BY_TYPE = { PACKAGE: ['camera_operator', 'teleprompter_operator', 'light_designer', 'sound_recordist'], LIVE: ['video_editor'] };
  const showCredit = (field) => !((HIDE_BY_TYPE[row.content_type] || []).includes(field) && !row[field]);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Staff assignment</span>
        <span className="hidden text-[12px] font-normal normal-case text-zinc-500 sm:inline">· Click a photo to change · hover to see who</span>
      </div>
      <div className="lg:columns-2 gap-4">
        {STAFF_GROUPS.map((g) => {
          if (g.id === 'live' && !(row.content_type === 'LIVE' || row.live_video_switcher || row.live_audio_mixer)) {
            return null;
          }
          const visibleFields = g.fields.filter((f) => showCredit(f.field));
          if (visibleFields.length === 0) return null;
          const assigned = visibleFields.filter((f) => !!row[f.field]).length;
          const visible = visibleFields.length;

          return (
            <div key={g.id} className="inline-block w-full break-inside-avoid mb-4 relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-6 pr-5">
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
        })}
      </div>
    </div>
  );
}

function ContentDetailsFields({ row, actor, channels, platforms = PLATFORMS, patch, onAddPlatform }) {
  const lockMsg = (label) => `You need the “${label}” permission`;
  const okMeta = can(actor, 'can_edit_content_details');
  const okSched = can(actor, 'can_reschedule_content');
  const heldLock = row.status === 'On Hold' && !isManager(actor);
  const okChan = can(actor, 'can_change_channel');

  return (
    <div className="space-y-6 details-compact">
      <section className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Channel" locked={!okChan} lockMessage={lockMsg('Change Channel')}>
            <SelectBox value={row.channel} disabled={!okChan} options={channels} onChange={(v) => patch({ channel: v })} />
          </Field>
          <Field label="Scheduled publish" locked={!okSched || heldLock} lockMessage={heldLock ? 'Only Managers and the Owner can reschedule held content' : lockMsg('Reschedule Content')}>
            <input
              type="datetime-local"
              disabled={!okSched || heldLock}
              value={toLocalInput(row.scheduled_publish_time)}
              onChange={(e) => e.target.value && patch({ scheduled_publish_time: fromLocalInput(e.target.value) })}
              className={`${(okSched && !heldLock) ? inputBase : inputLocked} [color-scheme:dark]`}
            />
          </Field>
        </div>
        <Field label="Slug name" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')} hint={`${(row.slug_name || '').length}/${SLUG_MAX}`}>
          <BlurInput value={row.slug_name} disabled={!okMeta} maxLength={SLUG_MAX} onCommit={(v) => { const s = normalizeSlugInput(v); if (s) patch({ slug_name: s }); }} placeholder="Slug name" />
        </Field>
        <Field label="Title" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
          <BlurInput value={row.title} disabled={!okMeta} onCommit={(v) => patch({ title: v })} placeholder="Title" />
        </Field>
        <Field label="Thumbnail text (Hook)" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
          <BlurInput value={row.thumbnail_text} disabled={!okMeta} onCommit={(v) => patch({ thumbnail_text: v })} placeholder="Hook on the thumbnail" />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <Field label="Archive shelf ID" locked={!okMeta} lockMessage={lockMsg('Edit Content Details')}>
          <BlurInput value={row.archive_shelf_id} disabled={!okMeta} onCommit={(v) => patch({ archive_shelf_id: v })} placeholder="e.g. SHELF-A12" />
        </Field>
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

function formatScriptSavedAt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('bn-BD', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d).replace(',', '');
  } catch {
    return '—';
  }
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

function ScriptTab({ row, actor, patch, team }) {
  const locked = row.is_script_locked === true;
  const mgr = isManager(actor);
  const canEdit = can(actor, 'can_write_edit_scripts') && (!locked || mgr);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.script || '');
  const [showPrompter, setShowPrompter] = useState(false);
  const [copied, setCopied] = useState(false);
  const draftKey = `wd-script-draft:${row.id}`;
  const draftsEnabled = isFeatureEnabled('script_drafts');
  const [storedDraft, setStoredDraft] = useState(null);
  const baseScriptRef = useRef(row.script || '');

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

  const richEnabled = isFeatureEnabled('rich_editor');
  const text = scriptToPlainText(row.script || '');
  const stats = scriptStats(editing ? draft : row.script);

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

function getPublishedLinks(row) {
  if (row.published_links && typeof row.published_links === 'object') {
    return row.published_links;
  }
  if (row.live_video_url && typeof row.live_video_url === 'string') {
    const trimmed = row.live_video_url.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (_) {}
    }
    if (safeHttpUrl(trimmed)) {
      const first = (row.target_platforms && row.target_platforms[0]) || 'youtube';
      return { [first]: trimmed };
    }
  }
  return {};
}

function ProductionTab({ row, actor, team, patch }) {
  const active = !!actor && actor.active !== false;
  return (
    <div className="space-y-8">
      <StaffAssignment row={row} actor={actor} team={team} patch={patch} />
      <section className="space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Files & links</div>
        <LinkRow label="Raw footage" value={row.raw_footage_link} disabled={!active} onCommit={(v) => patch({ raw_footage_link: v })} />
        <LinkRow label="Project file" value={row.project_file_url} disabled={!active} onCommit={(v) => patch({ project_file_url: v })} />
        <LinkRow label="Master export" value={row.master_export_url} disabled={!active} onCommit={(v) => patch({ master_export_url: v })} />
      </section>
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
  const shortUid = (s, i) => `${row.content_uid || 'CON'}-SHORT${pad(s.n || i + 1)}`;
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
        <CreditSelect
          label="Publisher"
          field="publisher"
          skillKey="role_publisher"
          row={row}
          patch={patch}
          team={team}
          disabled={!active}
        />
      </div>

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


function Drawer({ row, actor, team, channels, platforms = PLATFORMS, onClose, onPatch, onRun, onDelete, onAddPlatform }) {
    const savedScriptStats = scriptStats(row.script);
    const [tab, setTab] = useState('editorial');
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
    setTab('editorial');
    setDetailsOpen(true);
    pendingRef.current = 0;
    setSaveState({ status: 'idle', at: null });
    if (copyIdTimerRef.current) clearTimeout(copyIdTimerRef.current);
    setCopiedId(false);
  }, [row.id, row.content_uid]);

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
  const actions = getActions(row, actor);
  const mainActions = actions.filter(
    (a) => a.id !== 'hold' && a.id !== 'drop' && a.id !== 'download_script' && a.id !== 'copy_script'
  );
  const dangerActions = ['hold', 'drop']
    .map((id) => actions.find((a) => a.id === id))
    .filter(Boolean);
  const tabs = [
    ['editorial', 'Editorial'],
    ['production', 'Production'],
    ['packaging', 'Publish'],
    ['qc', 'QC & Audit'],
  ];
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[580px] lg:w-[94vw] lg:max-w-[1600px] flex-col border-l border-white/[0.08] bg-black/60 shadow-2xl shadow-black backdrop-blur-xl">
        <header className="border-b border-white/[0.06] px-4 sm:px-5 lg:px-6 pb-0 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <TypeBadge type={row.content_type} />
              <StatusBadge status={row.status} removed={isRemovedPublished(row)} />
              {savedScriptStats.words > 0 && (
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
            {row.content_uid ? (
              <>
                <div className="hidden lg:block lg:flex-grow" />
                <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-6 shrink-0 mt-0.5 lg:mt-0">
                  <span className="font-mono font-extrabold text-[14px] sm:text-[15px] lg:text-[19px] text-zinc-200 shrink-0 whitespace-nowrap">
                    {row.content_uid}
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
              </>
            ) : null}
          </div>
          {hasPublishedLinks ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 lg:hidden">
              {renderPublishedLinks()}
            </div>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <nav className="-mb-px flex gap-1 overflow-x-auto">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    setTab(id);
                    setDetailsOpen(id === 'editorial');
                  }}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition ${tab === id ? 'border-sky-400 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            {hasPublishedLinks ? (
              <div className="hidden lg:flex flex-wrap items-center gap-1.5 pb-1">
                {renderPublishedLinks()}
              </div>
            ) : null}
          </div>
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
              <ContentDetailsFields
                row={row}
                actor={actor}
                channels={channels}
                platforms={platforms}
                patch={patch}
                onAddPlatform={onAddPlatform}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 px-6 py-6 lg:overflow-y-auto">
            {tab === 'editorial' ? <ScriptTab row={row} actor={actor} patch={patch} team={team} /> : null}
            {tab === 'production' ? <ProductionTab row={row} actor={actor} team={team} patch={patch} /> : null}
            {tab === 'packaging' ? <PackagingTab row={row} actor={actor} team={team} patch={patch} platforms={platforms} onAddPlatform={onAddPlatform} /> : null}
            {tab === 'qc' ? <QcTab row={row} actor={actor} patch={patch} /> : null}
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
  );
}

export { Drawer };
