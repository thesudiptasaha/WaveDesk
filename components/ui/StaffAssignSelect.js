'use client';

import React, { useState, useMemo } from 'react';
import { can, FIELD_PERM, eligibleMembers, presenterMembers, typeConfig } from '../../lib/core';
import { Avatar, PersonName } from './Shared';
import { PersonPicker } from './PersonPicker';

export function StaffAssignSelect({ value, names, placeholder, onChange, team, title }) {
  const [open, setOpen] = useState(false);
  const stop = (e) => e.stopPropagation();

  const member = value ? (team || []).find((m) => m.full_name === value) : null;
  const label = member ? (member.nickname || member.full_name) : value;

  const members = useMemo(() => {
    return (names || []).map((n) => (team || []).find((m) => m.full_name === n) || { full_name: n });
  }, [names, team]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen(true);
        }}
        onMouseDown={stop}
        onKeyDown={stop}
        className="text-[11px] rounded-md border border-white/10 bg-transparent px-1.5 py-0.5 text-zinc-300 outline-none w-full max-w-[150px] truncate transition focus:border-white/20 focus:bg-white/[0.03] text-left cursor-pointer"
        title={label || placeholder}
      >
        <span className="truncate">{value ? label : placeholder}</span>
      </button>
      <PersonPicker
        open={open}
        onClose={() => setOpen(false)}
        title={title || 'Select person'}
        members={members}
        value={value}
        onSelect={onChange}
        allowClear={true}
        team={team}
      />
    </>
  );
}

function StaffTileItem({ field, label, colLabel, names, r, team, actor, patchRow, notify }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const actorCan = actor && actor.active !== false;
  const isEditable = actorCan && can(actor, FIELD_PERM[field]);
  const val = r[field];
  const member = val ? (team || []).find((m) => m.full_name === val) : null;
  const nickname = (member && member.nickname) || val;

  const tileTitle = val
    ? (member && member.designation ? `${member.full_name} (${member.designation})` : (member ? member.full_name : val))
    : isEditable
    ? `Assign ${label}`
    : 'Not assigned';

  const stop = (e) => e.stopPropagation();

  const members = useMemo(() => {
    return (names || []).map((n) => (team || []).find((m) => m.full_name === n) || { full_name: n });
  }, [names, team]);

  return (
    <div
      className={`group relative flex w-[84px] shrink-0 flex-col items-center justify-start rounded-lg p-1 text-center transition select-none ${
        isEditable
          ? 'cursor-pointer hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-sky-400'
          : 'cursor-default'
      }`}
      title={tileTitle}
    >
      <div className="relative mb-1">
        {val ? (
          <Avatar member={member} name={val} size="h-9 w-9" text="text-[13px]" />
        ) : isEditable ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-500 text-zinc-400 transition group-hover:border-zinc-300 group-hover:text-zinc-200">
            <span className="text-[16px] leading-none select-none font-light">+</span>
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-600/70 text-zinc-600">
            <span className="text-[14px] leading-none select-none font-light">—</span>
          </div>
        )}
      </div>

      {val ? (
        <span className="w-full truncate text-[12px] font-semibold text-white">
          {nickname}
        </span>
      ) : isEditable ? (
        <span className="w-full truncate text-[12px] font-semibold text-zinc-400 transition group-hover:text-zinc-200">
          Assign
        </span>
      ) : (
        <span className="w-full truncate text-[11px] italic text-zinc-600">
          Not assigned
        </span>
      )}

      <span className="w-full truncate text-[9px] uppercase tracking-wider text-zinc-500 font-medium mt-0.5">
        {colLabel}
      </span>

      {isEditable ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setPickerOpen(true);
            }}
            onMouseDown={stop}
            onKeyDown={stop}
            aria-haspopup="dialog"
            aria-label={`${label}: ${val ? nickname : 'Unassigned'}`}
            title={tileTitle}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus:outline-none"
          />
          <PersonPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            title={`Select ${label}`}
            members={members}
            value={val}
            onSelect={async (v) => {
              const ok = await patchRow(r.id, { [field]: v });
              if (ok && notify) {
                notify(v ? `${label.replace(/:$/, '')} → ${v}` : `${label.replace(/:$/, '')} cleared`, 'success');
              }
            }}
            allowClear={true}
            team={team}
          />
        </>
      ) : null}
    </div>
  );
}

export function StaffCell({ r, team, actor, patchRow, notify, layout = 'stack' }) {
  const actorCan = actor && actor.active !== false;

  const writers = eligibleMembers(team, 'role_research_script_writer').map((m) => m.full_name);
  const presenters = presenterMembers(team).map((m) => m.full_name);
  const editors = eligibleMembers(team, 'role_video_editor').map((m) => m.full_name);

  const renderLine = (field, label, names, colLabel = null, showEmpty = false) => {
    const isEditable = actorCan && can(actor, FIELD_PERM[field]);
    const val = r[field];

    let control = null;
    if (isEditable) {
      control = (
        <StaffAssignSelect
          value={val}
          names={names}
          placeholder="+ Assign"
          title={`Select ${label.replace(/:$/, '')}`}
          onChange={async (v) => { const ok = await patchRow(r.id, { [field]: v }); if (ok && notify) notify(v ? `${label.replace(/:$/, '')} → ${v}` : `${label.replace(/:$/, '')} cleared`, 'success'); }}
          team={team}
        />
      );
    } else {
      if (val) {
        control = <PersonName name={val} team={team} hideDesignation />;
      } else if (colLabel) {
        control = <span className="text-[12px] italic text-zinc-600">Not assigned</span>;
      } else if (showEmpty) {
        control = <span className="text-[11px] italic text-zinc-600">Not assigned</span>;
      }
    }

    if (!control) return null;

    if (colLabel) {
      return (
        <div key={field} className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{colLabel}</div>
          {control}
        </div>
      );
    }

    return (
      <div key={field} className="flex items-center gap-1.5">
        <span className="text-zinc-500 w-[110px] shrink-0">{label}</span>
        {control}
      </div>
    );
  };

  if (layout === 'columns') {
    return (
      <div className="flex gap-2.5">
        {renderLine('writer', 'Script Writer:', writers, 'SCRIPT WRITER')}
        {renderLine('presenter_name', 'Presenter:', presenters, 'PRESENTER')}
        {!typeConfig(r.content_type).usesVideoEditor ? null : renderLine('video_editor', 'Video Editor:', editors, 'VIDEO EDITOR')}
      </div>
    );
  }

  if (layout === 'rows') {
    return (
      <div className="flex flex-col gap-1 text-[11px]">
        {renderLine('writer', 'Script Writer:', writers, null, true)}
        {renderLine('presenter_name', 'Presenter:', presenters, null, true)}
        {!typeConfig(r.content_type).usesVideoEditor ? null : renderLine('video_editor', 'Video Editor:', editors, null, true)}
      </div>
    );
  }

  if (layout === 'tiles') {
    return (
      <div className="flex items-start gap-1">
        <StaffTileItem
          field="writer"
          label="Script Writer"
          colLabel="SCRIPT WRITER"
          names={writers}
          r={r}
          team={team}
          actor={actor}
          patchRow={patchRow}
          notify={notify}
        />
        <StaffTileItem
          field="presenter_name"
          label="Presenter"
          colLabel="PRESENTER"
          names={presenters}
          r={r}
          team={team}
          actor={actor}
          patchRow={patchRow}
          notify={notify}
        />
        {!typeConfig(r.content_type).usesVideoEditor ? null : (
          <StaffTileItem
            field="video_editor"
            label="Video Editor"
            colLabel="VIDEO EDITOR"
            names={editors}
            r={r}
            team={team}
            actor={actor}
            patchRow={patchRow}
            notify={notify}
          />
        )}
      </div>
    );
  }

  const lineWriter = renderLine('writer', 'Script Writer:', writers);
  const linePresenter = renderLine('presenter_name', 'Presenter:', presenters);
  const lineEditor = renderLine('video_editor', 'Video Editor:', editors);

  if (!lineWriter && !linePresenter && !lineEditor) {
    return <span className="text-zinc-600 italic">Unassigned</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {lineWriter}
      {linePresenter}
      {lineEditor}
    </div>
  );
}