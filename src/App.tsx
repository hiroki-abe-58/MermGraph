import { useState, useCallback } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import ExportPanel from './components/ExportPanel';

const DEFAULT_MERMAID = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

function App() {
  const [code, setCode] = useState(DEFAULT_MERMAID);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">MermGraph</h1>
        <ExportPanel code={code} />
      </header>
      <main className="app-main">
        <div className="panel editor-panel">
          <div className="panel-header">
            <span className="panel-title">Editor</span>
          </div>
          <div className="panel-content">
            <Editor value={code} onChange={handleCodeChange} />
          </div>
        </div>
        <div className="divider" />
        <div className="panel preview-panel">
          <div className="panel-header">
            <span className="panel-title">Preview</span>
          </div>
          <div className="panel-content">
            <Preview code={code} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
