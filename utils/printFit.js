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
  withBreaks = false,
} = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const res = { pages: 1, bodyHeightMm: 0, headerHeightMm: 0, lastPageFill: 0 };
    if (withBreaks) res.breaks = [];
    return res;
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

    let breaks = [];
    if (withBreaks && pages > 1) {
      const articleEl = measureEl.querySelector('.script-print-body > article');
      const blockEls = articleEl ? Array.from(articleEl.children) : [];
      const N = blockEls.length;
      if (N >= 2) {
        const blockPositions = blockEls.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            topMm: (rect.top - measureRect.top) / pxPerMm,
            bottomMm: (rect.bottom - measureRect.top) / pxPerMm,
          };
        });

        for (let k = 1; k < pages; k++) {
          const truePageEndMm = k * usableHeightMm;
          let candidate = -1;
          let approx = false;

          let straddlingIndex = -1;
          for (let i = 0; i < N; i++) {
            if (
              truePageEndMm >= blockPositions[i].topMm &&
              truePageEndMm <= blockPositions[i].bottomMm
            ) {
              straddlingIndex = i;
              break;
            }
          }

          if (straddlingIndex !== -1) {
            const i = straddlingIndex;
            const { topMm, bottomMm } = blockPositions[i];
            const distToTop = truePageEndMm - topMm;
            const distToBottom = bottomMm - truePageEndMm;
            candidate = distToTop < distToBottom ? i - 1 : i;
            approx = true;
          } else if (truePageEndMm < blockPositions[0].topMm) {
            candidate = 0;
            approx = true;
          } else if (truePageEndMm > blockPositions[N - 1].bottomMm) {
            candidate = N - 2;
            approx = true;
          } else {
            for (let i = 0; i < N - 1; i++) {
              if (
                truePageEndMm >= blockPositions[i].bottomMm &&
                truePageEndMm <= blockPositions[i + 1].topMm
              ) {
                candidate = i;
                approx = false;
                break;
              }
            }
            if (candidate === -1) {
              for (let i = N - 1; i >= 0; i--) {
                if (blockPositions[i].bottomMm <= truePageEndMm) {
                  candidate = i;
                  approx = false;
                  break;
                }
              }
            }
          }

          if (candidate < 0) {
            candidate = 0;
            approx = true;
          }
          if (candidate > N - 2) {
            candidate = N - 2;
            approx = true;
          }

          if (breaks.length > 0) {
            const prev = breaks[breaks.length - 1].afterBlock;
            if (candidate <= prev) {
              candidate = prev + 1;
              approx = true;
            }
          }

          if (candidate <= N - 2) {
            breaks.push({
              page: k,
              afterBlock: candidate,
              approximate: approx,
            });
          }
        }
      }
    }

    const res = {
      pages,
      bodyHeightMm: Math.round(bodyHeightMm * 100) / 100,
      headerHeightMm: Math.round(headerHeightMm * 100) / 100,
      lastPageFill: Math.round(lastPageFill * 1000) / 1000,
    };
    if (withBreaks) {
      res.breaks = breaks;
    }
    return res;
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
  withBreaks = false,
} = {}) {
  try {
    const defaultRes = await measurePrint({
      html,
      mode,
      row,
      team,
      script,
      lineHeight: DEFAULT_LINE_HEIGHT,
      withBreaks: false,
    });
    const pagesAtDefault = defaultRes.pages;

    if (pagesAtDefault <= 1) {
      return {
        lineHeight: DEFAULT_LINE_HEIGHT,
        pages: pagesAtDefault,
        pagesAtDefault,
        tightened: false,
        lastPageFill: defaultRes.lastPageFill,
        ...(withBreaks ? { breaks: [] } : {}),
      };
    }

    const minRes = await measurePrint({
      html,
      mode,
      row,
      team,
      script,
      lineHeight: MIN_LINE_HEIGHT,
      withBreaks: false,
    });

    if (minRes.pages >= pagesAtDefault) {
      let breaks = [];
      if (withBreaks) {
        const breakRes = await measurePrint({
          html,
          mode,
          row,
          team,
          script,
          lineHeight: DEFAULT_LINE_HEIGHT,
          withBreaks: true,
        });
        breaks = breakRes.breaks || [];
      }
      return {
        lineHeight: DEFAULT_LINE_HEIGHT,
        pages: pagesAtDefault,
        pagesAtDefault,
        tightened: false,
        lastPageFill: defaultRes.lastPageFill,
        ...(withBreaks ? { breaks } : {}),
      };
    }

    const targetPages = minRes.pages;
    let chosenLineHeight = MIN_LINE_HEIGHT;
    let chosenPages = minRes.pages;
    let chosenLastPageFill = minRes.lastPageFill;

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
        withBreaks: false,
      });
      if (stepRes.pages <= targetPages) {
        chosenLineHeight = stepLh;
        chosenPages = stepRes.pages;
        chosenLastPageFill = stepRes.lastPageFill;
        break;
      }
    }

    let breaks = [];
    if (withBreaks) {
      const breakRes = await measurePrint({
        html,
        mode,
        row,
        team,
        script,
        lineHeight: chosenLineHeight,
        withBreaks: true,
      });
      breaks = breakRes.breaks || [];
    }

    return {
      lineHeight: chosenLineHeight,
      pages: chosenPages,
      pagesAtDefault,
      tightened: true,
      lastPageFill: chosenLastPageFill,
      ...(withBreaks ? { breaks } : {}),
    };
  } catch (err) {
    console.error('pickPrintLineHeight failed:', err);
    return {
      lineHeight: DEFAULT_LINE_HEIGHT,
      pages: 1,
      pagesAtDefault: 1,
      tightened: false,
      lastPageFill: 0,
      ...(withBreaks ? { breaks: [] } : {}),
    };
  }
}

