import React from 'react';
import { createRoot } from 'react-dom/client';

export const PAGE_CONTENT_HEIGHT_MM = 261;
export const PAGE_CONTENT_WIDTH_MM = 178;
export const DEFAULT_LINE_HEIGHT = 2;
export const MIN_LINE_HEIGHT = 1.6;
export const LINE_HEIGHT_STEP = 0.1;
export const SAFETY_MARGIN_RATIO = 0.99;
export const USABLE_PAGE_HEIGHT_MM = PAGE_CONTENT_HEIGHT_MM * SAFETY_MARGIN_RATIO;

export async function measurePrint({
  html,
  mode = 'full',
  row,
  team,
  lineHeight = DEFAULT_LINE_HEIGHT,
  script,
} = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { pages: 1, bodyHeightMm: 0, headerHeightMm: 0, lastPageFill: 0 };
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.visibility = 'hidden';
  container.style.width = `${PAGE_CONTENT_WIDTH_MM}mm`;
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  let root = null;
  try {
    const { ScriptPrintDocument } = await import('../components/ui/ScriptPrint');
    root = createRoot(container);
    root.render(
      <ScriptPrintDocument
        mode={mode}
        row={row}
        team={team}
        script={script}
        html={html}
        lineHeight={lineHeight}
        measure={true}
      />
    );

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    const containerRect = container.getBoundingClientRect();
    const pxPerMm = (containerRect.width || 672.756) / PAGE_CONTENT_WIDTH_MM;

    const measureEl = container.querySelector('.script-measure-root') || container;
    const bodyEl = measureEl.querySelector('.script-print-body');

    const measureRect = measureEl.getBoundingClientRect();
    const totalHeightPx = measureEl.scrollHeight || measureRect.height;

    let headerHeightPx = 0;
    if (mode === 'full' && bodyEl) {
      const bodyRect = bodyEl.getBoundingClientRect();
      headerHeightPx = Math.max(0, bodyRect.top - measureRect.top);
    }

    const bodyHeightPx = Math.max(0, totalHeightPx - headerHeightPx);

    const headerHeightMm = headerHeightPx / pxPerMm;
    const bodyHeightMm = bodyHeightPx / pxPerMm;
    const totalHeightMm = headerHeightMm + bodyHeightMm;

    const usableHeightMm = USABLE_PAGE_HEIGHT_MM;
    const pages = totalHeightMm > 0 ? Math.max(1, Math.ceil(totalHeightMm / usableHeightMm)) : 1;

    let lastPageFill = 0;
    if (pages === 1) {
      lastPageFill = totalHeightMm > 0 ? Math.min(1, Math.max(0, totalHeightMm / usableHeightMm)) : 0;
    } else {
      const remainingMm = totalHeightMm - (pages - 1) * usableHeightMm;
      lastPageFill = Math.min(1, Math.max(0, remainingMm / usableHeightMm));
    }

    return {
      pages,
      bodyHeightMm: Math.round(bodyHeightMm * 100) / 100,
      headerHeightMm: Math.round(headerHeightMm * 100) / 100,
      lastPageFill: Math.round(lastPageFill * 1000) / 1000,
    };
  } finally {
    if (root) {
      try {
        root.unmount();
      } catch {}
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

export async function pickPrintLineHeight({
  html,
  mode = 'full',
  row,
  team,
  script,
} = {}) {
  try {
    const defaultRes = await measurePrint({
      html,
      mode,
      row,
      team,
      script,
      lineHeight: DEFAULT_LINE_HEIGHT,
    });
    const pagesAtDefault = defaultRes.pages;

    if (pagesAtDefault <= 1) {
      return {
        lineHeight: DEFAULT_LINE_HEIGHT,
        pages: pagesAtDefault,
        pagesAtDefault,
        tightened: false,
        lastPageFill: defaultRes.lastPageFill,
      };
    }

    const minRes = await measurePrint({
      html,
      mode,
      row,
      team,
      script,
      lineHeight: MIN_LINE_HEIGHT,
    });

    if (minRes.pages >= pagesAtDefault) {
      return {
        lineHeight: DEFAULT_LINE_HEIGHT,
        pages: pagesAtDefault,
        pagesAtDefault,
        tightened: false,
        lastPageFill: defaultRes.lastPageFill,
      };
    }

    const targetPages = minRes.pages;

    // Test candidate line-heights in descending order: 1.9, 1.8, 1.7
    // Pick the highest line-height that achieves targetPages.
    const steps = [1.9, 1.8, 1.7];
    for (const stepLh of steps) {
      const stepRes = await measurePrint({
        html,
        mode,
        row,
        team,
        script,
        lineHeight: stepLh,
      });
      if (stepRes.pages <= targetPages) {
        return {
          lineHeight: stepLh,
          pages: stepRes.pages,
          pagesAtDefault,
          tightened: true,
          lastPageFill: stepRes.lastPageFill,
        };
      }
    }

    return {
      lineHeight: MIN_LINE_HEIGHT,
      pages: minRes.pages,
      pagesAtDefault,
      tightened: true,
      lastPageFill: minRes.lastPageFill,
    };
  } catch (err) {
    console.error('pickPrintLineHeight failed:', err);
    return {
      lineHeight: DEFAULT_LINE_HEIGHT,
      pages: 1,
      pagesAtDefault: 1,
      tightened: false,
      lastPageFill: 0,
    };
  }
}

