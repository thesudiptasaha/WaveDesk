'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { normalizeEditorHtml, scriptToHtml } from '../../utils/scriptRich';
import { useEffect, useRef } from 'react';

export default function ScriptEditor({ value, onChange, onBlur, autoFocus }) {
  const isInitialRender = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

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
    ],
    content: scriptToHtml(value),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChangeRef.current(normalizeEditorHtml(editor.getHTML()));
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
    </div>
  );
}
