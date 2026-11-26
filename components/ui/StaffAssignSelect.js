'use client';

import React, { useState, useMemo } from 'react';
import { can, FIELD_PERM, eligibleMembers, presenterMembers, typeConfig, typeHasScript, typeIsCard, isUncutReporter } from '../../lib/core';
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

function StaffTileItem({ field, label, colLabel, names, r, team, actor, patchRow, notify, dense = false }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const actorCan = actor && actor.active !== false;
  const isEditor = field === 'video_editor';
  const isUncutReporterUser = isUncutReporter(actor, r);
  const val = r[field];
  const isAssigned = !!val;
  const isSelf = val === actor?.full_name;
  const okPerm = can(actor, FIELD_PERM[field]);
  const canSelf = isEditor && isUncutReporterUser && (!isAssigned || isSelf);
  const isEditable = actorCan && (okPerm || canSelf || (field === 'multimedia_journalist' && actorCan));
  const member = val ? (team || []).find((m) => m.full_name === val) : null;
  const nickname = (member && member.nickname) || val;

  const tileTitle = val
    ? (member && member.designation ? `${member.full_name} (${member.designation})` : (member ? member.full_name : val))
    : isEditable
    ? `Assign ${label}`
    : isEditor && r?.content_type === 'UNCUT'
    ? 'You need the “Assign Video Editor” permission. A Multimedia Journalist can put themselves into an empty slot.'
    : 'Not assigned';

  const stop = (e) => e.stopPropagation();

  const members = useMemo(() => {
    if (isEditor && !okPerm && isUncutReporterUser) {
      return actor ? [actor] : [];
    }
    return (names || []).map((n) => (team || []).find((m) => m.full_name === n) || { full_name: n });
  }, [names, team, isEditor, okPerm, isUncutReporterUser, actor]);

  return (
    <div
      className={`group relative flex ${dense ? 'w-[74px] max-[1439px]:w-[68px] p-0.5' : 'w-[84px] p-1'} shrink-0 flex-col items-center justify-start rounded-lg text-center transition select-none ${
        isEditable
          ? 'cursor-pointer hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-sky-400'
          : 'cursor-default'
      }`}
      title={tileTitle}
    >
      <div className={`relative ${dense ? 'mb-0.5' : 'mb-1'}`}>
        {val ? (
          <Avatar
            member={member}
            name={val}
            size={dense ? 'h-8 w-8 max-[1439px]:h-7 max-[1439px]:w-7' : 'h-9 w-9'}
            text={dense ? 'text-[12px] max-[1439px]:text-[11px]' : 'text-[13px]'}
          />
        ) : isEditable ? (
          <div className={`flex ${dense ? 'h-8 w-8 max-[1439px]:h-7 max-[1439px]:w-7' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full border-2 border-dashed border-zinc-500 text-zinc-400 transition group-hover:border-zinc-300 group-hover:text-zinc-200`}>
            <span className={`${dense ? 'text-[14px] max-[1439px]:text-[13px]' : 'text-[16px]'} leading-none select-none font-light`}>+</span>
          </div>
        ) : (
          <div className={`flex ${dense ? 'h-8 w-8 max-[1439px]:h-7 max-[1439px]:w-7' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-600/70 text-zinc-600`}>
            <span className={`${dense ? 'text-[12px] max-[1439px]:text-[11px]' : 'text-[14px]'} leading-none select-none font-light`}>—</span>
          </div>
        )}
      </div>

      {val ? (
        <span className={`w-full truncate ${dense ? 'text-[11.5px] max-[1439px]:text-[11px] leading-tight' : 'text-[12px]'} font-semibold text-white`}>
          {nickname}
        </span>
      ) : isEditable ? (
        <span className={`w-full truncate ${dense ? 'text-[11.5px] max-[1439px]:text-[11px] leading-tight' : 'text-[12px]'} font-semibold text-zinc-400 transition group-hover:text-zinc-200`}>
          Assign
        </span>
      ) : (
        <span className={`w-full truncate ${dense ? 'text-[10.5px] leading-tight' : 'text-[11px]'} italic text-zinc-600`}>
          Not assigned
        </span>
      )}

      <span className={`w-full truncate ${dense ? 'text-[8.5px] max-[1439px]:text-[8px] leading-tight' : 'text-[9px]'} uppercase tracking-wider text-zinc-500 font-medium mt-0.5`}>
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
            allowClear={isEditor && !okPerm && isUncutReporterUser ? isSelf : true}
            team={team}
          />
        </>
      ) : null}
    </div>
  );
}

export function StaffCell({ r, team, actor, patchRow, notify, layout = 'stack', dense = false }) {
  if (typeIsCard(r.content_type)) {
    const designer = r.graphic_designer;
    if (layout === 'columns') {
      return (
        <div className="flex gap-2.5">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500">GRAPHIC DESIGNER</div>
            {designer ? <PersonName name={designer} team={team} hideDesignation /> : <span className="text-[12px] italic text-zinc-600">Not taken yet</span>}
          </div>
        </div>
      );
    }
    if (layout === 'rows') {
      return (
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Graphic Designer:</span>
            {designer ? <PersonName name={designer} team={team} hideDesignation /> : <span className="text-[11px] italic text-zinc-600">Not taken yet</span>}
          </div>
        </div>
      );
    }
    if (layout === 'tiles') {
      return (
        <div className="flex items-start gap-1">
          <div className={`group relative flex flex-col justify-between rounded-md border border-white/[0.06] bg-white/[0.02] ${dense ? 'p-1 min-w-[84px]' : 'p-1.5 min-w-[100px]'}`}>
            <div className={`${dense ? 'text-[8.5px]' : 'text-[9px]'} font-semibold uppercase tracking-wider text-zinc-500`}>GRAPHIC DESIGNER</div>
            <div className={dense ? 'mt-0.5' : 'mt-1'}>
              {designer ? <PersonName name={designer} team={team} hideDesignation /> : <span className={`${dense ? 'text-[10.5px]' : 'text-[11px]'} italic text-zinc-600`}>Not taken yet</span>}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 w-[110px] shrink-0">Graphic Designer:</span>
          {designer ? <PersonName name={designer} team={team} hideDesignation /> : <span className="text-[11px] italic text-zinc-600">Not taken yet</span>}
        </div>
      </div>
    );
  }

  const actorCan = actor && actor.active !== false;

  const writers = eligibleMembers(team, 'role_research_script_writer').map((m) => m.full_name);
  const presenters = presenterMembers(team).map((m) => m.full_name);
  const editors = eligibleMembers(team, 'role_video_editor').map((m) => m.full_name);
  const journalists = eligibleMembers(team, 'role_multimedia_journalist').map((m) => m.full_name);

  const renderLine = (field, label, names, colLabel = null, showEmpty = false) => {
    const isEditor = field === 'video_editor';
    const isUncutReporterUser = isUncutReporter(actor, r);
    const val = r[field];
    const isAssigned = !!val;
    const isSelf = val === actor?.full_name;
    const okPerm = can(actor, FIELD_PERM[field]);
    const canSelf = isEditor && isUncutReporterUser && (!isAssigned || isSelf);
    const isEditable = actorCan && (okPerm || canSelf || (field === 'multimedia_journalist' && actorCan));
    const effectiveNames = (isEditor && !okPerm && isUncutReporterUser) ? (actor?.full_name ? [actor.full_name] : []) : names;

    let control = null;
    if (isEditable) {
      control = (
        <StaffAssignSelect
          value={val}
          names={effectiveNames}
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
        {typeHasScript(r.content_type) ? renderLine('writer', 'Script Writer:', writers, 'SCRIPT WRITER') : null}
        {!typeConfig(r.content_type).hiddenCredits.includes('presenter_name') ? renderLine('presenter_name', 'Presenter:', presenters, 'PRESENTER') : null}
        {r.content_type === 'UNCUT' ? renderLine('multimedia_journalist', 'Multimedia Journalist:', journalists, 'MULTIMEDIA JOURNALIST') : null}
        {!typeConfig(r.content_type).usesVideoEditor ? null : renderLine('video_editor', 'Video Editor:', editors, 'VIDEO EDITOR')}
      </div>
    );
  }

  if (layout === 'rows') {
    return (
      <div className="flex flex-col gap-1 text-[11px]">
        {typeHasScript(r.content_type) ? renderLine('writer', 'Script Writer:', writers, null, true) : null}
        {!typeConfig(r.content_type).hiddenCredits.includes('presenter_name') ? renderLine('presenter_name', 'Presenter:', presenters, null, true) : null}
        {r.content_type === 'UNCUT' ? renderLine('multimedia_journalist', 'Multimedia Journalist:', journalists, null, true) : null}
        {!typeConfig(r.content_type).usesVideoEditor ? null : renderLine('video_editor', 'Video Editor:', editors, null, true)}
      </div>
    );
  }

  if (layout === 'tiles') {
    return (
      <div className="flex items-start gap-1">
        {typeHasScript(r.content_type) ? (
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
            dense={dense}
          />
        ) : null}
        {!typeConfig(r.content_type).hiddenCredits.includes('presenter_name') ? (
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
            dense={dense}
          />
        ) : null}
        {r.content_type === 'UNCUT' ? (
          <StaffTileItem
            field="multimedia_journalist"
            label="Multimedia Journalist"
            colLabel="MULTIMEDIA JOURNALIST"
            names={journalists}
            r={r}
            team={team}
            actor={actor}
            patchRow={patchRow}
            notify={notify}
            dense={dense}
          />
        ) : null}
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
            dense={dense}
          />
        )}
      </div>
    );
  }

  const lineWriter = typeHasScript(r.content_type) ? renderLine('writer', 'Script Writer:', writers) : null;
  const linePresenter = !typeConfig(r.content_type).hiddenCredits.includes('presenter_name') ? renderLine('presenter_name', 'Presenter:', presenters) : null;
  const lineJournalist = r.content_type === 'UNCUT' ? renderLine('multimedia_journalist', 'Multimedia Journalist:', journalists) : null;
  const lineEditor = !typeConfig(r.content_type).usesVideoEditor ? null : renderLine('video_editor', 'Video Editor:', editors);

  if (!lineWriter && !linePresenter && !lineJournalist && !lineEditor) {
    return <span className="text-zinc-600 italic">Unassigned</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {lineWriter}
      {linePresenter}
      {lineJournalist}
      {lineEditor}
    </div>
  );
}