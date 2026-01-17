import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Editor from './components/Editor';
import VisualEditor from './components/VisualEditor';
import Preview from './components/Preview';
import StylePanel from './components/StylePanel';
import Toolbar from './components/Toolbar';
import ExportPanel from './components/ExportPanel';
import { useCodeSync } from './hooks/useCodeSync';
import { detectDiagramType, isFlowDiagramType } from './utils/diagramTypes';

const DEFAULT_MERMAID = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

const RESIZER_SIZE = 6;
const MIN_PANEL_WIDTH = 240;
const MIN_STYLE_WIDTH = 220;
const MIN_STYLE_WIDTH_FALLBACK = 180;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSplitLimits = (availableWidth: number) => {
  const min = Math.min(MIN_PANEL_WIDTH, Math.max(0, availableWidth / 2));
  const max = Math.max(min, availableWidth - min);
  return { min, max };
};

const getStyleLimits = (mainWidth: number, isSplit: boolean) => {
  const resizerSpace = RESIZER_SIZE * (isSplit ? 2 : 1);
  const minLeft = MIN_PANEL_WIDTH * (isSplit ? 2 : 1);
  const rawMax = mainWidth - minLeft - resizerSpace;
  const max = Math.max(MIN_STYLE_WIDTH_FALLBACK, rawMax);
  const min = Math.min(MIN_STYLE_WIDTH, max);
  return { min, max };
};

function AppContent() {
  const [code, setCode] = useState(DEFAULT_MERMAID);
  const [activeView, setActiveView] = useState<'code' | 'visual' | 'split'>('split');
  const mainRef = useRef<HTMLDivElement>(null);
  const [mainWidth, setMainWidth] = useState(0);
  const [codePanelWidth, setCodePanelWidth] = useState<number | null>(null);
  const [stylePanelWidth, setStylePanelWidth] = useState(280);
  const [activeDrag, setActiveDrag] = useState<'code-visual' | 'visual-style' | null>(null);
  const dragStart = useRef({ startX: 0, codeWidth: 0, styleWidth: 0 });
  const diagramType = useMemo(() => detectDiagramType(code), [code]);
  const isEmptyCode = code.trim().length === 0;
  const isFlowDiagram = isFlowDiagramType(diagramType) || isEmptyCode;
  const showStylePanel = activeView === 'visual' && isFlowDiagram;
  const showSplitPanels = activeView === 'split';

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  }, []);

  useEffect(() => {
    const updateMainWidth = () => {
      if (!mainRef.current) return;
      setMainWidth(mainRef.current.getBoundingClientRect().width);
    };
    updateMainWidth();
    window.addEventListener('resize', updateMainWidth);
    return () => window.removeEventListener('resize', updateMainWidth);
  }, []);

  useEffect(() => {
    if (!mainWidth) return;
    if (showStylePanel) {
      const { min, max } = getStyleLimits(mainWidth, showSplitPanels);
      setStylePanelWidth((prev) => clamp(prev, min, max));
    }
    if (showSplitPanels) {
      const resizerSpace = RESIZER_SIZE * (showStylePanel ? 2 : 1);
      const available = Math.max(0, mainWidth - (showStylePanel ? stylePanelWidth : 0) - resizerSpace);
      const { min, max } = getSplitLimits(available);
      setCodePanelWidth((prev) => {
        const fallback = available / 2;
        return clamp(prev ?? fallback, min, max);
      });
    }
  }, [mainWidth, showStylePanel, showSplitPanels, stylePanelWidth]);

  useEffect(() => {
    if (!activeDrag) return;
    const handleMouseMove = (event: MouseEvent) => {
      if (!mainRef.current) return;
      const width = mainRef.current.getBoundingClientRect().width;

      if (activeDrag === 'code-visual') {
        const resizerSpace = RESIZER_SIZE * (showStylePanel ? 2 : 1);
        const available = Math.max(0, width - (showStylePanel ? stylePanelWidth : 0) - resizerSpace);
        const { min, max } = getSplitLimits(available);
        const nextWidth = clamp(dragStart.current.codeWidth + (event.clientX - dragStart.current.startX), min, max);
        setCodePanelWidth(nextWidth);
      }

      if (activeDrag === 'visual-style') {
        const { min, max } = getStyleLimits(width, showSplitPanels);
        const nextWidth = clamp(dragStart.current.styleWidth - (event.clientX - dragStart.current.startX), min, max);
        setStylePanelWidth(nextWidth);
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      document.body.classList.remove('is-resizing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, showStylePanel, showSplitPanels, stylePanelWidth]);

  useEffect(() => {
    if (!isFlowDiagram && activeView === 'visual') {
      setActiveView('split');
    }
  }, [activeView, isFlowDiagram]);

  const resizerSpace = useMemo(() => {
    const count = (showSplitPanels ? 1 : 0) + (showStylePanel ? 1 : 0);
    return RESIZER_SIZE * count;
  }, [showSplitPanels, showStylePanel]);

  const availableForSplit = useMemo(() => {
    if (!showSplitPanels) return 0;
    return Math.max(0, mainWidth - (showStylePanel ? stylePanelWidth : 0) - resizerSpace);
  }, [mainWidth, resizerSpace, showSplitPanels, showStylePanel, stylePanelWidth]);

  const resolvedCodeWidth = useMemo(() => {
    if (!showSplitPanels) return 0;
    const { min, max } = getSplitLimits(availableForSplit);
    return clamp(codePanelWidth ?? availableForSplit / 2, min, max);
  }, [availableForSplit, codePanelWidth, showSplitPanels]);

  const startCodeVisualResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      document.body.classList.add('is-resizing');
      dragStart.current = { startX: event.clientX, codeWidth: resolvedCodeWidth, styleWidth: stylePanelWidth };
      setActiveDrag('code-visual');
    },
    [resolvedCodeWidth, stylePanelWidth]
  );

  const startVisualStyleResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      document.body.classList.add('is-resizing');
      dragStart.current = { startX: event.clientX, codeWidth: resolvedCodeWidth, styleWidth: stylePanelWidth };
      setActiveDrag('visual-style');
    },
    [resolvedCodeWidth, stylePanelWidth]
  );

  // コードとビジュアルの同期
  useCodeSync({
    code,
    onCodeChange: setCode,
    debounceMs: 500,
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">MermGraph</h1>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${activeView === 'code' ? 'active' : ''}`}
            onClick={() => setActiveView('code')}
            title="コードエディタのみ"
          >
            <span className="material-icons">code</span>
          </button>
          <button
            className={`view-toggle-btn ${activeView === 'split' ? 'active' : ''}`}
            onClick={() => setActiveView('split')}
            title="分割表示"
          >
            <span className="material-icons">vertical_split</span>
          </button>
          <button
            className={`view-toggle-btn ${activeView === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveView('visual')}
            title={isFlowDiagram ? 'ビジュアルエディタのみ' : 'フローチャートのみ対応'}
            disabled={!isFlowDiagram}
          >
            <span className="material-icons">account_tree</span>
          </button>
        </div>
        <ExportPanel code={code} />
      </header>
      
      {/* ツールバー（ビジュアルモード時のみ表示） */}
      {activeView === 'visual' && isFlowDiagram && (
        <Toolbar />
      )}
      
      <main className="app-main" ref={mainRef}>
        {/* コードエディタパネル */}
        {(activeView === 'code' || activeView === 'split') && (
          <div
            className={`panel editor-panel ${activeView === 'split' ? 'split' : 'full'}`}
            style={activeView === 'split' ? { flex: `0 0 ${resolvedCodeWidth}px`, minWidth: 0 } : undefined}
          >
            <div className="panel-header">
              <span className="panel-title">Mermaid Code</span>
            </div>
            <div className="panel-content">
              <Editor value={code} onChange={handleCodeChange} />
            </div>
          </div>
        )}
        
        {/* 分割線 */}
        {activeView === 'split' && (
          <div
            className="panel-resizer"
            role="separator"
            aria-label="Mermaid CodeとVisual Editorの幅を調整"
            onMouseDown={startCodeVisualResize}
          />
        )}
        
        {/* ビジュアルエディタパネル */}
        {(activeView === 'visual' || activeView === 'split') && (
          <div
            className={`panel ${activeView === 'split' ? 'preview-panel split' : 'visual-panel full'}`}
            style={activeView === 'split' ? { flex: '1 1 auto', minWidth: 0 } : undefined}
          >
            <div className="panel-header">
              <span className="panel-title">
                {activeView === 'split' ? 'Preview' : 'Visual Editor'}
              </span>
            </div>
            <div className="panel-content">
              {activeView === 'split' ? (
                <>
                  {!isFlowDiagram && !isEmptyCode && (
                    <div className="diagram-notice">
                      <span className="material-icons">info</span>
                      フローチャート以外はプレビューのみ対応です
                    </div>
                  )}
                  <Preview code={code} />
                </>
              ) : (
                <VisualEditor />
              )}
            </div>
          </div>
        )}
        
        {/* スタイルパネル（ビジュアルモード時のみ表示） */}
        {showStylePanel && (
          <>
            <div
              className="panel-resizer"
              role="separator"
              aria-label="Visual Editorとデザインの幅を調整"
              onMouseDown={startVisualStyleResize}
            />
            <div
              className="style-panel-wrapper"
              style={{ flex: `0 0 ${stylePanelWidth}px`, minWidth: 0 }}
            >
              <StylePanel />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}

export default App;
