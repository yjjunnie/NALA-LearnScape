// src/components/editor/NotesEditor.tsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import type { Ref } from 'react';
import Theme from './Theme';
import ToolbarPlugin from './ToolbarPlugin';

interface NotesEditorProps {
  placeholder?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  contentEditableRef?: Ref<HTMLDivElement>;
}

function Placeholder({ text }: { text?: string }) {
  return (
    <div className="text-gray-400 absolute top-4 left-4 pointer-events-none font-['GlacialIndifference',sans-serif]">
      {text || "Start taking notes for this topic..."}
    </div>
  );
}

export default function NotesEditor({
  placeholder,
  initialContent,
  onSave,
  contentEditableRef,
}: NotesEditorProps) {
  const initialConfig = {
    namespace: 'NotesEditor',
    nodes: [HeadingNode],
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: Theme,
    editorState: initialContent,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <ToolbarPlugin />
        
        <div className="relative min-h-[600px]">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                ref={contentEditableRef}
                className="outline-none p-4 min-h-[600px] text-[#0c1e4a] font-['GlacialIndifference',sans-serif]"
              />
            }
            placeholder={<Placeholder text={placeholder} />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}