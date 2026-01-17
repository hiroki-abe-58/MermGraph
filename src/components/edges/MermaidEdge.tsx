import { memo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  type EdgeProps 
} from '@xyflow/react';
import type { MermaidEdgeData, ArrowType } from '../../types/graph';
import './MermaidEdge.css';

// 矢印タイプに応じたマーカーIDを取得
function getMarkerId(arrowType: ArrowType): string {
  switch (arrowType) {
    case 'arrow':
      return 'url(#arrow-marker)';
    case 'open':
      return '';
    case 'dotted':
      return 'url(#arrow-marker)';
    case 'thick':
      return 'url(#arrow-marker-thick)';
    case 'circle':
      return 'url(#circle-marker)';
    case 'cross':
      return 'url(#cross-marker)';
    default:
      return 'url(#arrow-marker)';
  }
}

// 矢印タイプに応じたストロークスタイルを取得
function getStrokeStyle(arrowType: ArrowType): { strokeDasharray?: string; strokeWidth: number } {
  switch (arrowType) {
    case 'dotted':
      return { strokeDasharray: '5,5', strokeWidth: 2 };
    case 'thick':
      return { strokeWidth: 4 };
    default:
      return { strokeWidth: 2 };
  }
}

type MermaidEdgeProps = EdgeProps & {
  data?: MermaidEdgeData;
};

function MermaidEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: MermaidEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  const arrowType = data?.arrowType ?? 'arrow';
  const strokeStyle = getStrokeStyle(arrowType);
  const markerId = getMarkerId(arrowType);
  
  const strokeColor = selected 
    ? '#d4ff00' 
    : (data?.style?.strokeColor ?? '#a0a0a0');
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: strokeStyle.strokeWidth,
          strokeDasharray: strokeStyle.strokeDasharray,
        }}
        markerEnd={markerId}
        className={`mermaid-edge ${selected ? 'selected' : ''} ${data?.style?.animated ? 'animated' : ''}`}
      />
      
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`mermaid-edge-label ${selected ? 'selected' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// SVGマーカー定義コンポーネント
export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* 通常の矢印マーカー */}
        <marker
          id="arrow-marker"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0a0a0" />
        </marker>
        
        {/* 太い矢印マーカー */}
        <marker
          id="arrow-marker-thick"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0a0a0" />
        </marker>
        
        {/* 円マーカー */}
        <marker
          id="circle-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <circle cx="5" cy="5" r="4" fill="#a0a0a0" />
        </marker>
        
        {/* Xマーカー */}
        <marker
          id="cross-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 2 2 L 8 8 M 8 2 L 2 8" stroke="#a0a0a0" strokeWidth="2" fill="none" />
        </marker>
      </defs>
    </svg>
  );
}

export default memo(MermaidEdgeComponent);
