'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isFeatureEnabled } from '../../utils/features';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import { scriptStats } from '../../utils/scriptDuration';
import { isRemovedPublished, formatDay, formatTime, formatStamp, ROLE_LABEL, PLATFORMS } from '../../lib/core';

export function formatScriptSavedAt(iso) {
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

const QC_KIND_LABEL = {
  revision: 'Revision note',
  qa: 'QA remark',
  audit: 'Audit comment',
  change: 'Change',
};

const STAFF_FIELDS = [
  { key: 'concept_creator', label: 'Concept Creator' },
  { key: 'writer', label: 'Research & Script Writer' },
  { key: 'presenter_name', label: 'Presenter' },
  { key: 'producer', label: 'Producer' },
  { key: 'camera_operator', label: 'Camera Operator' },
  { key: 'teleprompter_operator', label: 'Teleprompter Operator' },
  { key: 'light_designer', label: 'Light Designer' },
  { key: 'sound_recordist', label: 'Sound Recordist' },
  { key: 'voice_over_artist', label: 'Voice Over Artist' },
  { key: 'video_editor', label: 'Video Editor' },
  { key: 'motion_graphics_designer', label: 'Motion Graphics Designer' },
  { key: 'graphic_designer', label: 'Graphic Designer' },
  { key: 'colorist', label: 'Colorist' },
  { key: 'audio_mixer', label: 'Audio Mixer' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'live_video_switcher', label: 'Live Video Switcher', liveOnly: true },
  { key: 'live_audio_mixer', label: 'Live Audio Mixer', liveOnly: true },
];

function getPersonDisplay(name, team) {
  if (!name) return '';
  const m = (team || []).find((x) => x.full_name === name);
  return (m && m.nickname) || name;
}

function formatScriptSavedDetail(row) {
  let datePart = '';
  if (row.script_saved_at) {
    try {
      const d = new Date(row.script_saved_at);
      if (!Number.isNaN(d.getTime())) {
        datePart = new Intl.DateTimeFormat('bn-BD', {
          timeZone: 'Asia/Dhaka',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(d);
      }
    } catch {
      datePart = '';
    }
  }

  const stats = scriptStats(row.script);
  const hasStats = stats && stats.words > 0;
  const statsPart = hasStats ? `${stats.words} words, ~${stats.label}` : '';

  if (datePart && statsPart) return `${datePart} (${statsPart})`;
  if (datePart) return datePart;
  if (statsPart) return statsPart;
  return '—';
}

function formatAuditAction(a) {
  const isStatus = a.kind === 'status' || (!a.field && a.to && a.kind !== 'revision' && a.kind !== 'qa' && a.kind !== 'audit');
  if (isStatus) {
    return (
      <span>
        Status: {a.from ? `${a.from} → ` : ''}<strong>{a.to}</strong>
        {a.note ? <span style={{ color: '#555' }}> — {a.note}</span> : null}
      </span>
    );
  }
  if (a.kind === 'change') {
    return (
      <span>
        <strong>{a.field}</strong>: {a.from || 'empty'} → {a.to || 'empty'}
        {a.note ? <span style={{ color: '#555' }}> — {a.note}</span> : null}
      </span>
    );
  }
  const label = QC_KIND_LABEL[a.kind] || a.kind || 'Note';
  return (
    <span>
      <strong>{label}</strong>{a.note ? `: ${a.note}` : a.to ? `: ${a.to}` : ''}
    </span>
  );
}

export function ScriptPrintSheet({ row, team, platforms = PLATFORMS, printing, onAfterPrint }) {
  const onAfterPrintRef = useRef(onAfterPrint);
  onAfterPrintRef.current = onAfterPrint;

  const printedRef = useRef(false);

  useEffect(() => {
    if (!printing) {
      printedRef.current = false;
      return undefined;
    }

    if (printedRef.current) return undefined;
    printedRef.current = true;

    const handleAfterPrint = () => {
      if (onAfterPrintRef.current) onAfterPrintRef.current();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    let hasRun = false;
    let rafId2 = null;
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        hasRun = true;
        window.print();
      });
    });

    return () => {
      if (!hasRun) {
        printedRef.current = false;
      }
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printing]);

  if (!printing || typeof document === 'undefined' || !row) return null;

  const richEnabled = isFeatureEnabled('rich_editor');
  const title = row.title || row.slug_name || 'Untitled';
  const writerMember = (team || []).find((m) => m.full_name === row.writer);
  const writerDisplay = (writerMember && writerMember.nickname) || row.writer || '—';
  const savedDate = formatScriptSavedAt(row.script_saved_at);
  const platformList = platforms || PLATFORMS;
  const platformLabels = (row.target_platforms || [])
    .map((pId) => platformList.find((p) => p.id === pId)?.label || platformList.find((p) => p.id === pId)?.name || pId)
    .join(', ');

  const scheduledStr = row.scheduled_publish_time
    ? `${formatDay(row.scheduled_publish_time)} ${formatTime(row.scheduled_publish_time)}`
    : '—';

  const isLive = row.content_type === 'LIVE';
  const assignedStaff = STAFF_FIELDS
    .filter((f) => (!f.liveOnly || isLive) && !!row[f.key])
    .map((f) => ({
      key: f.key,
      label: f.label,
      person: getPersonDisplay(row[f.key], team),
    }));

  const auditEntries = Array.isArray(row.audit_log) ? [...row.audit_log].reverse() : [];
  const revisionEntries = Array.isArray(row.revisions) ? [...row.revisions].reverse() : [];

  return createPortal(
    <div id="script-print-root">
      {/* Page 1: The Script */}
      <div className="script-print-page script-print-page-1">
        <div className="script-print-mast">
          <span>WAVEDESK · SCRIPT</span>
          <span>{row.channel || '—'}</span>
        </div>
        <h1 className="script-print-title">{title}</h1>
        <div className="script-print-by">
          <div className="script-print-by-item">
            <span className="script-print-by-label">লেখক</span>
            <span className="script-print-by-val">{writerDisplay}</span>
          </div>
          <div className="script-print-by-item">
            <span className="script-print-by-label">তারিখ</span>
            <span className="script-print-by-val">{savedDate}</span>
          </div>
          <div className="script-print-by-item">
            <span className="script-print-by-label">আইডি</span>
            <span className="script-print-by-val">{row.content_uid || '—'}</span>
          </div>
        </div>
        <div className="script-print-body">
          {richEnabled ? (
            <article
              dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(scriptToHtml(row.script || '')) }}
            />
          ) : (
            <article>
              {scriptToPlainText(row.script || '').split(/\n{2,}/).map((para, i) => (
                <p key={i}>
                  {para}
                </p>
              ))}
            </article>
          )}
        </div>
      </div>

      {/* Page 2: Script Information */}
      <div className="script-print-page script-print-page-2">
        <div className="script-print-mast">
          <span>WAVEDESK · SCRIPT INFORMATION</span>
          <span>{row.content_uid || '—'}</span>
        </div>
        <h2 className="script-print-title" style={{ fontSize: '18pt' }}>{title}</h2>

        {/* Details */}
        <section className="script-print-section">
          <h3 className="script-print-heading">Details</h3>
          <table className="script-print-table">
            <tbody>
              <tr>
                <td className="script-print-label-col">Slug</td>
                <td className="script-print-val-col">{row.slug_name || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Title</td>
                <td className="script-print-val-col">{row.title || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Thumbnail hook</td>
                <td className="script-print-val-col">{row.thumbnail_text || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Type · Status</td>
                <td className="script-print-val-col">
                  {row.content_type || '—'} · {isRemovedPublished(row) ? 'Published, later removed' : (row.status || '—')}
                </td>
              </tr>
              <tr>
                <td className="script-print-label-col">Channel</td>
                <td className="script-print-val-col">{row.channel || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Scheduled publish</td>
                <td className="script-print-val-col">{scheduledStr}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Platforms</td>
                <td className="script-print-val-col">{platformLabels || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Archive shelf ID</td>
                <td className="script-print-val-col">{row.archive_shelf_id || '—'}</td>
              </tr>
              <tr>
                <td className="script-print-label-col">Script saved</td>
                <td className="script-print-val-col">{formatScriptSavedDetail(row)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Staff */}
        <section className="script-print-section">
          <h3 className="script-print-heading">Staff</h3>
          <table className="script-print-table">
            <tbody>
              {assignedStaff.length > 0 ? (
                assignedStaff.map((s) => (
                  <tr key={s.key}>
                    <td className="script-print-label-col">{s.label}</td>
                    <td className="script-print-val-col">{s.person}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '4.5pt 0', color: '#555' }}>No staff assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Activity log */}
        <section className="script-print-section">
          <h3 className="script-print-heading">Activity Log</h3>
          <table className="script-print-table script-print-log-table">
            <tbody>
              {auditEntries.length > 0 ? (
                auditEntries.map((a, i) => (
                  <tr key={i}>
                    <td className="script-print-label-col" style={{ width: '38%' }}>
                      <div>{formatStamp(a.time)}</div>
                      <div style={{ color: '#111', fontWeight: 600 }}>
                        {a.actor || 'System'}
                        {a.role ? <span style={{ color: '#555', fontWeight: 400 }}> ({ROLE_LABEL[a.role] || a.role})</span> : null}
                      </div>
                    </td>
                    <td className="script-print-val-col" style={{ width: '62%' }}>
                      {formatAuditAction(a)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '4.5pt 0', color: '#555' }}>No activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Revisions & notes */}
        {revisionEntries.length > 0 ? (
          <section className="script-print-section">
            <h3 className="script-print-heading">Revisions &amp; Notes</h3>
            <table className="script-print-table script-print-log-table">
              <tbody>
                {revisionEntries.map((r, i) => (
                  <tr key={i}>
                    <td className="script-print-label-col" style={{ width: '38%' }}>
                      <div>{formatStamp(r.time)}</div>
                      <div style={{ color: '#111', fontWeight: 600 }}>
                        {r.actor || 'System'}
                        {r.role ? <span style={{ color: '#555', fontWeight: 400 }}> ({ROLE_LABEL[r.role] || r.role})</span> : null}
                      </div>
                    </td>
                    <td className="script-print-val-col" style={{ width: '62%' }}>
                      {r.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
