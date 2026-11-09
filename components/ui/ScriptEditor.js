'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { normalizeEditorHtml, scriptToHtml, sanitizeScriptHtml, scriptToPlainText } from '../../utils/scriptRich';
import { pickPrintLineHeight } from '../../utils/printFit';
import { useEffect, useRef, useState, useCallback } from 'react';

const pageBreaksPluginKey = new PluginKey('pageBreaks');

function createBreakElement(page, approximate) {
  const div = document.createElement('div');
  div.className = 'script-editor-page-break';
  div.setAttribute('contenteditable', 'false');
  div.setAttribute('aria-hidden', 'true');
  div.style.userSelect = 'none';
  div.style.WebkitUserSelect = 'none';
  div.style.pointerEvents = 'none';
  div.style.width = '100%';
  div.style.boxSizing = 'border-box';
  div.style.margin = '10px 0';
  div.style.padding = '0';
  div.style.borderTop = '1.5px dashed rgba(180, 83, 60, 0.7)';
  div.style.position = 'relative';
  div.style.display = 'flex';
  div.style.justifyContent = 'flex-end';
  div.style.alignItems = 'flex-start';
  div.style.lineHeight = '1';

  const label = document.createElement('span');
  label.style.display = 'inline-block';
  label.style.fontSize = '11px';
  label.style.fontFamily = '"Noto Serif Bengali", Georgia, serif';
  label.style.color = '#9a3412';
  label.style.backgroundColor = '#f6f1e4';
  label.style.padding = '1px 6px';
  label.style.marginTop = '-8px';
  label.style.borderRadius = '3px';
  label.style.letterSpacing = '0.02em';
  label.style.boxShadow = '0 0 0 1px rgba(180, 83, 60, 0.15)';

  const bnPage = new Intl.NumberFormat('bn-BD').format(page);
  label.textContent = approximate ? `পাতা ${bnPage} শেষ (প্রায়)` : `পাতা ${bnPage} শেষ`;

  div.appendChild(label);
  return div;
}

const PageBreaksExtension = Extension.create({
  name: 'pageBreaks',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pageBreaksPluginKey,
        state: {
          init() {
            return {
              breaks: [],
              decoSet: DecorationSet.empty,
            };
          },
          apply(tr, prev, oldState, newState) {
            const meta = tr.getMeta(pageBreaksPluginKey);
            if (meta !== undefined) {
              const breaks = Array.isArray(meta) ? meta : [];
              const decos = [];
              newState.doc.forEach((node, offset, index) => {
                const matching = breaks.filter((b) => b.afterBlock === index);
                for (const brk of matching) {
                  const pos = offset + node.nodeSize;
                  decos.push(
                    Decoration.widget(
                      pos,
                      () => createBreakElement(brk.page, brk.approximate),
                      {
                        key: `page-break-${brk.page}`,
                        side: 1,
                        ignoreSelection: true,
                      }
                    )
                  );
                }
              });
              return {
                breaks,
                decoSet: DecorationSet.create(newState.doc, decos),
              };
            }
            if (tr.docChanged) {
              return {
                breaks: prev.breaks,
                decoSet: prev.decoSet.map(tr.mapping, newState.doc),
              };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            return pageBreaksPluginKey.getState(state)?.decoSet || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export default function ScriptEditor({ value, onChange, onBlur, autoFocus, printRow, team }) {
  const isInitialRender = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const printRowRef = useRef(printRow);
  printRowRef.current = printRow;
  const teamRef = useRef(team);
  teamRef.current = team;

  const editorRef = useRef(null);
  const reqIdRef = useRef(0);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const [summaryState, setSummaryState] = useState(null);

  const scheduleMeasure = useCallback((html, activeEditor) => {
    if (!printRowRef.current || !isMountedRef.current) return;
    const targetEditor = activeEditor || editorRef.current;
    const normalized = normalizeEditorHtml(html);

    if (!normalized || !scriptToPlainText(normalized).trim()) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      reqIdRef.current++;
      setSummaryState({
        pages: 1,
        lastPageFill: 0,
        tightened: false,
        isEmpty: true,
      });
      if (targetEditor && !targetEditor.isDestroyed) {
        try {
          targetEditor.view.dispatch(
            targetEditor.state.tr.setMeta(pageBreaksPluginKey, []).setMeta('addToHistory', false)
          );
        } catch {}
      }
      return;
    }

    const currentReqId = ++reqIdRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current || currentReqId !== reqIdRef.current) return;
      try {
        const res = await pickPrintLineHeight({
          html: normalized,
          mode: 'full',
          row: printRowRef.current,
          team: teamRef.current,
          withBreaks: true,
        });
        if (!isMountedRef.current || currentReqId !== reqIdRef.current) return;
        const currentEditor = editorRef.current;
        if (!currentEditor || currentEditor.isDestroyed) return;

        let effectiveBreaks = [];
        try {
          const sanitized = sanitizeScriptHtml(normalized);
          const parsed = new DOMParser().parseFromString(sanitized, 'text/html');
          const printBlockCount = parsed.body.children.length;
          const docBlockCount = currentEditor.state.doc.childCount;
          if (printBlockCount === docBlockCount) {
            effectiveBreaks = res.breaks || [];
          }
        } catch {
          effectiveBreaks = [];
        }

        setSummaryState({
          pages: res.pages,
          lastPageFill: res.lastPageFill,
          tightened: res.tightened,
          isEmpty: false,
        });

        try {
          currentEditor.view.dispatch(
            currentEditor.state.tr.setMeta(pageBreaksPluginKey, effectiveBreaks).setMeta('addToHistory', false)
          );
        } catch {}
      } catch {
        if (!isMountedRef.current || currentReqId !== reqIdRef.current) return;
        setSummaryState(null);
        const currentEditor = editorRef.current;
        if (currentEditor && !currentEditor.isDestroyed) {
          try {
            currentEditor.view.dispatch(
              currentEditor.state.tr.setMeta(pageBreaksPluginKey, []).setMeta('addToHistory', false)
            );
          } catch {}
        }
      }
    }, 600);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        italic: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
        link: false,
        trailingNode: false,
        listKeymap: false,
      }),
      Highlight.configure({ multicolor: false }),
      PageBreaksExtension,
    ],
    content: scriptToHtml(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: currentEditor }) => {
      editorRef.current = currentEditor;
      onChangeRef.current(normalizeEditorHtml(currentEditor.getHTML()));
      if (printRowRef.current) {
        scheduleMeasure(currentEditor.getHTML(), currentEditor);
      }
    },
    onBlur: () => {
      if (onBlurRef.current) onBlurRef.current();
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[320px] w-full text-[17.5px] leading-[2]',
        style: 'font-family: "Noto Serif Bengali", Georgia, "Times New Roman", serif;',
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (!editor) return;
    if (printRow) {
      scheduleMeasure(editor.getHTML(), editor);
    } else {
      setSummaryState(null);
      if (!editor.isDestroyed) {
        try {
          editor.view.dispatch(
            editor.state.tr.setMeta(pageBreaksPluginKey, []).setMeta('addToHistory', false)
          );
        } catch {}
      }
    }
  }, [editor, printRow, team, scheduleMeasure]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editor && autoFocus && isInitialRender.current) {
      editor.commands.focus('end');
      isInitialRender.current = false;
    }
  }, [editor, autoFocus]);

  if (!editor) return null;

  const preventFocus = (e) => e.preventDefault();
  const btnClass = (isActive) =>
    `flex min-w-[34px] min-h-[34px] items-center justify-center rounded text-[14px] font-semibold transition-colors border ${
      isActive
        ? 'bg-[#1c1814] text-[#f6f1e4] border-[#1c1814]'
        : 'text-[#5c5245] hover:bg-[#1c1814]/10 hover:text-[#1c1814] border-transparent'
    }`;

  const isNearlyEmpty =
    summaryState && summaryState.pages > 1 && summaryState.lastPageFill != null && summaryState.lastPageFill < 0.12;

  return (
    <div className="bg-transparent border-0 ring-0 outline-none p-0">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#b9ae98] pb-2 mb-3 bg-transparent">
        <button
          type="button"
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <span className="underline underline-offset-2">U</span>
        </button>
        <button
          type="button"
          onMouseDown={preventFocus}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive('highlight'))}
          title="Highlight (Ctrl+Shift+H)"
        >
          <span className="bg-yellow-400 text-black px-1 rounded-sm text-[11px] font-bold">H</span>
        </button>
      </div>
      
      <div 
        className="relative" 
        style={{ fontFamily: '"Noto Serif Bengali", Georgia, "Times New Roman", serif' }}
      >
        {editor.isEmpty ? (
          <div className="pointer-events-none absolute text-[#8a7f70] left-0 top-0 leading-[2] text-[17.5px] select-none">
            Write the script…
          </div>
        ) : null}
        <style dangerouslySetInnerHTML={{__html: `
          .tiptap p { margin-bottom: 12px; }
          .tiptap p:last-child { margin-bottom: 0; }
          .tiptap mark { background-color: #facc15; color: #111827; border-radius: 2px; padding: 0 4px; }
        `}} />
        <EditorContent editor={editor} className="tiptap" />
      </div>

      {printRow && summaryState ? (
        <div
          className={`script-editor-summary mt-2.5 pt-2 border-t border-[#b9ae98]/40 text-[12.5px] leading-relaxed flex flex-wrap items-center gap-x-1.5 select-none ${
            isNearlyEmpty ? 'text-[#b4533c] font-medium' : 'text-[#7d7263]'
          }`}
          style={{ fontFamily: '"Noto Serif Bengali", Georgia, "Times New Roman", serif' }}
        >
          {summaryState.isEmpty ? (
            <span>ছাপলে ১ পাতা</span>
          ) : (
            <>
              <span>
                {`ছাপলে ${new Intl.NumberFormat('bn-BD').format(summaryState.pages)} পাতা · শেষ পাতা ${new Intl.NumberFormat('bn-BD').format(Math.round((summaryState.lastPageFill || 0) * 100))}% ভরা`}
              </span>
              {isNearlyEmpty ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>শেষ পাতায় মাত্র কয়েক লাইন আছে। ছোট করলে কাগজ বাঁচবে।</span>
                </>
              ) : null}
              {summaryState.tightened ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={isNearlyEmpty ? 'text-[#b4533c]' : 'text-[#6b6355]'}>
                    ছাপার সময় লাইনের ফাঁক কমিয়ে পাতা বাঁচানো হবে।
                  </span>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
