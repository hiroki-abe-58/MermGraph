import { useState, useCallback } from 'react';

interface ExportPanelProps {
  code: string;
}

const BACKEND_URL = 'http://localhost:3001';

function ExportPanel({ code }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportDiagram = useCallback(async (format: 'png' | 'svg') => {
    if (!code.trim() || isExporting) return;

    setIsExporting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [code, isExporting]);

  const handleExportPNG = useCallback(() => exportDiagram('png'), [exportDiagram]);
  const handleExportSVG = useCallback(() => exportDiagram('svg'), [exportDiagram]);

  return (
    <div className="export-panel">
      <button 
        className="btn btn-secondary"
        onClick={handleExportSVG}
        disabled={isExporting || !code.trim()}
        title="Export as SVG"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        SVG
      </button>
      <button 
        className="btn btn-primary"
        onClick={handleExportPNG}
        disabled={isExporting || !code.trim()}
        title="Export as PNG"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        PNG
      </button>
    </div>
  );
}

export default ExportPanel;
