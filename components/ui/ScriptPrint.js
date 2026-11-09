'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isFeatureEnabled } from '../../utils/features';
import { scriptToPlainText, scriptToHtml, sanitizeScriptHtml } from '../../utils/scriptRich';
import { channelLogoSrc } from '../../utils/channelLogo';
import { pickPrintLineHeight } from '../../utils/printFit';

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

export function waitForPrintImages(rootEl, timeoutMs = 2000) {
  if (!rootEl || typeof document === 'undefined') return Promise.resolve();
  const imgs = Array.from(rootEl.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve();
      }
    }, timeoutMs);

    Promise.all(
      imgs.map((img) => {
        if (img.complete) {
          if (typeof img.decode === 'function') {
            return img.decode().catch(() => {});
          }
          return Promise.resolve();
        }
        return new Promise((res) => {
          const done = () => {
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            if (typeof img.decode === 'function') {
              img.decode().catch(() => {}).then(res);
            } else {
              res();
            }
          };
          img.addEventListener('load', done);
          img.addEventListener('error', done);
        });
      })
    ).then(() => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    });
  });
}

export function ScriptPrintDocument({
  row,
  team,
  mode = 'full',
  script,
  html,
  lineHeight,
  measure = false,
}) {
  const rawScript = script !== undefined ? script : (row?.script || '');
  const richEnabled = mode === 'full' ? isFeatureEnabled('rich_editor') : true;

  const isFull = mode === 'full';
  const title = (row && (row.title || row.slug_name)) || 'Untitled';
  const writerDisplay = (row && getPersonDisplay(row.writer, team)) || (row && row.writer) || '—';
  const savedDate = row ? formatScriptSavedAt(row.script_saved_at) : '—';
  const slugUid = row ? [row.slug_name, row.content_uid].filter(Boolean).join(' · ') : '';
  const logoSrc = row ? channelLogoSrc(row.channel) : null;

  const idText = escapeCssString(row?.content_uid || '');
  const leftRule = idText
    ? `@bottom-left {
        content: "${idText}";
        text-align: left;
        font-size: 7pt;
        color: #666666;
        font-family: 'Noto Serif Bengali', Georgia, serif;
        vertical-align: middle;
        white-space: nowrap;
      }`
    : '';

  const pageStyle = `@page {
    ${leftRule}
    @bottom-right {
      content: "পাতা " counter(page, bengali) "/" counter(pages, bengali);
      text-align: right;
      font-size: 7pt;
      color: #666666;
      font-family: 'Noto Serif Bengali', Georgia, serif;
      vertical-align: middle;
      white-space: nowrap;
    }
  }`;

  const rootStyle = lineHeight != null ? { '--sp-line-height': lineHeight } : undefined;

  const content = (
    <>
      {!measure ? <style dangerouslySetInnerHTML={{ __html: pageStyle }} /> : null}
      {isFull ? (
        <>
          <div className="script-print-header-top">
            <span className="script-print-slug-uid">{slugUid}</span>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                loading="eager"
                decoding="sync"
                className="script-print-channel-logo"
                style={{
                  height: '8.5mm',
                  width: 'auto',
                  aspectRatio: '287.82 / 77.17',
                  minWidth: '31.7mm',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
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
        {html ? (
          <article
            dangerouslySetInnerHTML={{ __html: sanitizeScriptHtml(html) }}
          />
        ) : richEnabled ? (
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
    </>
  );

  if (measure) {
    return (
      <div className="script-measure-root" style={rootStyle}>
        {content}
      </div>
    );
  }

  return (
    <div id="script-print-root" style={rootStyle}>
      {content}
    </div>
  );
}

export function ScriptPrintSheet({ row, team, platforms, printing, onAfterPrint }) {
  const onAfterPrintRef = useRef(onAfterPrint);
  onAfterPrintRef.current = onAfterPrint;

  const rowRef = useRef(row);
  rowRef.current = row;

  const teamRef = useRef(team);
  teamRef.current = team;

  const [measuredLineHeight, setMeasuredLineHeight] = useState(null);
  const printedRef = useRef(false);

  useEffect(() => {
    if (!printing) {
      printedRef.current = false;
      setMeasuredLineHeight(null);
      return undefined;
    }

    if (printedRef.current) return undefined;

    let cancelled = false;

    if (measuredLineHeight === null) {
      (async () => {
        let lh = 2;
        try {
          const currentRow = rowRef.current;
          const currentTeam = teamRef.current;
          const res = await pickPrintLineHeight({
            mode: 'full',
            row: currentRow,
            team: currentTeam,
            script: currentRow?.script,
          });
          if (res && res.lineHeight) {
            lh = res.lineHeight;
          }
        } catch (e) {
          console.error('Print line height calculation error:', e);
        }
        if (!cancelled) {
          setMeasuredLineHeight(lh);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    printedRef.current = true;

    const handleAfterPrint = () => {
      setMeasuredLineHeight(null);
      if (onAfterPrintRef.current) onAfterPrintRef.current();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    let hasRun = false;
    let rafId2 = null;

    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(async () => {
        if (cancelled) return;
        const rootEl = document.getElementById('script-print-root');
        await waitForPrintImages(rootEl, 2000);
        if (cancelled) return;
        hasRun = true;
        window.print();
      });
    });

    return () => {
      cancelled = true;
      if (!hasRun) {
        printedRef.current = false;
      }
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printing, measuredLineHeight]);

  if (!printing || typeof document === 'undefined' || !row) return null;

  return createPortal(
    <ScriptPrintDocument
      mode="full"
      row={row}
      team={team}
      script={row.script}
      lineHeight={measuredLineHeight}
    />,
    document.body
  );
}
