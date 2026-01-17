import MonacoEditor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { useCallback } from 'react';
import { MERMAID_DIAGRAM_TYPES } from '../utils/diagramTypes';

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

function Editor({ value, onChange }: EditorProps) {
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' });

    // Define Mermaid syntax highlighting
    monaco.languages.setMonarchTokensProvider('mermaid', {
      keywords: [
        ...MERMAID_DIAGRAM_TYPES,
        'subgraph', 'end', 'participant', 'actor', 'note', 'loop', 'alt',
        'else', 'opt', 'par', 'and', 'critical', 'break', 'rect', 'class',
        'state', 'title', 'section', 'dateFormat', 'axisFormat', 'excludes',
        'direction', 'TB', 'TD', 'BT', 'RL', 'LR'
      ],
      operators: ['-->', '---', '-.->',  '==>', '-->|', '---|', '-.->', '.->'],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/%%.*$/, 'comment'],
          [/[a-zA-Z_][\w-]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'string'],
          [/\[.*?\]/, 'string.bracket'],
          [/\(.*?\)/, 'string.paren'],
          [/\{.*?\}/, 'string.brace'],
          [/-->|---|-\.->|==>|--o|--x|<-->/, 'operator'],
          [/\|.*?\|/, 'string.label'],
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[;,.]/, 'delimiter'],
          [/\d+/, 'number'],
        ]
      }
    });

    // Define editor theme
    monaco.editor.defineTheme('mermgraph-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'd4ff00', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'ffffff' },
        { token: 'string', foreground: 'a0d8ef' },
        { token: 'string.bracket', foreground: '98c379' },
        { token: 'string.paren', foreground: 'e5c07b' },
        { token: 'string.brace', foreground: 'c678dd' },
        { token: 'string.label', foreground: 'd4ff00' },
        { token: 'operator', foreground: 'ff6b6b' },
        { token: 'comment', foreground: '6b6b6b', fontStyle: 'italic' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'delimiter', foreground: '808080' },
      ],
      colors: {
        'editor.background': '#141414',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editor.selectionBackground': '#d4ff0033',
        'editorCursor.foreground': '#d4ff00',
        'editorLineNumber.foreground': '#6b6b6b',
        'editorLineNumber.activeForeground': '#a0a0a0',
      }
    });

    monaco.editor.setTheme('mermgraph-dark');

    // Focus editor
    editor.focus();
  }, []);

  return (
    <MonacoEditor
      height="100%"
      language="mermaid"
      value={value}
      onChange={onChange}
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
        },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        overviewRulerLanes: 0,
      }}
    />
  );
}

export default Editor;
