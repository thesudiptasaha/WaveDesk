'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isFeatureEnabled } from '../../utils/features';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import { channelLogoSrc } from '../../utils/channelLogo';

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

function getPersonDisplay(name, team) {
  if (!name) return '';
  const m = (team || []).find((x) => x.full_name === name);
  return (m && m.nickname) || name;
}

function escapeCssString(str) {
  if (!str) return '';
  const sanitized = String(str)
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/<\/style/gi, '')
    .trim();
  return sanitized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function ScriptPrintDocument({ row, team, mode = 'full', script }) {
  const rawScript = script !== undefined ? script : (row?.script || '');
  const richEnabled = mode === 'full' ? isFeatureEnabled('rich_editor') : true;

  const isFull = mode === 'full';
  const title = (row && (row.title || row.slug_name)) || 'Untitled';
  const writerDisplay = (row && getPersonDisplay(row.writer, team)) || (row && row.writer) || '—';
  const savedDate = row ? formatScriptSavedAt(row.script_saved_at) : '—';
  const slugUid = row ? [row.slug_name, row.content_uid].filter(Boolean).join(' · ') : '';
  const logoSrc = row ? channelLogoSrc(row.channel) : null;

  const footerParts = [];
  if (row?.content_uid) footerParts.push(`আইডি ${row.content_uid}`);
  if (isFull && row) {
    const writer = getPersonDisplay(row.writer, team);
    if (writer) footerParts.push(`লেখক ${writer}`);
    const presenter = getPersonDisplay(row.presenter_name, team);
    if (presenter) footerParts.push(`প্রেজেন্টার ${presenter}`);
    const producer = getPersonDisplay(row.producer, team);
    if (producer) footerParts.push(`প্রডিউসার ${producer}`);
  }
  const prefix = footerParts.length > 0 ? `${footerParts.join(' · ')} · পাতা ` : 'পাতা ';

  const pageStyle = `@page {
    @bottom-center {
      content: "${escapeCssString(prefix)}" counter(page, bengali) "/" counter(pages, bengali);
      font-size: 7pt;
      color: #666666;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
  }`;

  return (
    <div id="script-print-root">
      <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      {isFull ? (
        <>
          <div className="script-print-header-top">
            <span className="script-print-slug-uid">{slugUid}</span>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="script-print-channel-logo"
                style={{ height: '8.5mm', width: 'auto', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />
            ) : (
              <span className="script-print-channel-text">{row?.channel || '—'}</span>
            )}
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
          </div>
        </>
      ) : null}
      <div className="script-print-body">
        {richEnabled ? (
          <article
            dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(scriptToHtml(rawScript)) }}
          />
        ) : (
          <article>
            {scriptToPlainText(rawScript).split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>
        )}
      </div>
    </div>
  );
}

export function ScriptPrintSheet({ row, team, platforms, printing, onAfterPrint }) {
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

  return createPortal(
    <ScriptPrintDocument
      mode="full"
      row={row}
      team={team}
      script={row.script}
    />,
    document.body
  );
}
