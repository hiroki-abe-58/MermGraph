import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { detectDiagramType } from '../utils/diagramTypes';

interface PreviewProps {
  code: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#2d2d2d',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#404040',
    lineColor: '#a0a0a0',
    secondaryColor: '#363636',
    tertiaryColor: '#1a1a1a',
    background: '#1a1a1a',
    mainBkg: '#2d2d2d',
    nodeBorder: '#d4ff00',
    clusterBkg: '#2d2d2d',
    clusterBorder: '#404040',
    titleColor: '#d4ff00',
    edgeLabelBackground: '#2d2d2d',
    actorBorder: '#d4ff00',
    actorBkg: '#2d2d2d',
    actorTextColor: '#ffffff',
    actorLineColor: '#a0a0a0',
    signalColor: '#ffffff',
    signalTextColor: '#ffffff',
    labelBoxBkgColor: '#2d2d2d',
    labelBoxBorderColor: '#404040',
    labelTextColor: '#ffffff',
    loopTextColor: '#ffffff',
    noteBorderColor: '#d4ff00',
    noteBkgColor: '#2d2d2d',
    noteTextColor: '#ffffff',
    activationBorderColor: '#d4ff00',
    activationBkgColor: '#363636',
    sequenceNumberColor: '#1a1a1a',
  },
  fontFamily: "'IBM Plex Sans', sans-serif",
  securityLevel: 'loose',
});

function Preview({ code }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvgContent('');
        setError(null);
        return;
      }

      try {
        const diagramType = detectDiagramType(code);
        if (!diagramType) {
          setError('未対応の図種です');
          setSvgContent('');
          return;
        }

        // Validate the diagram first
        const isValid = await mermaid.parse(code);
        if (!isValid) {
          setError('Invalid Mermaid syntax');
          return;
        }

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
        setSvgContent('');
      }
    };

    // Debounce rendering to avoid too many updates
    const timeoutId = setTimeout(renderDiagram, 150);
    return () => clearTimeout(timeoutId);
  }, [code]);

  if (error) {
    return (
      <div className="mermaid-container">
        <div className="error-message">
          <span className="material-icons" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            error_outline
          </span>
          {error}
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="mermaid-container">
        <div className="loading">
          <span style={{ color: 'var(--color-text-muted)' }}>
            Enter Mermaid code to preview...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default Preview;
