import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { MermaidNodeData, NodeShape } from '../../types/graph';
import { useGraphStore } from '../../store/graphStore';
import './MermaidNode.css';

// ノード形状に応じたSVGパスを生成
function getShapePath(shape: NodeShape, width: number, height: number): string {
  const w = width;
  const h = height;
  
  switch (shape) {
    case 'rectangle':
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    case 'rounded':
      const r = Math.min(8, w / 4, h / 4);
      return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0`;
    case 'stadium':
      const sr = h / 2;
      return `M ${sr} 0 L ${w - sr} 0 A ${sr} ${sr} 0 0 1 ${w - sr} ${h} L ${sr} ${h} A ${sr} ${sr} 0 0 1 ${sr} 0`;
    case 'diamond':
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    case 'hexagon':
      const hx = w * 0.15;
      return `M ${hx} 0 L ${w - hx} 0 L ${w} ${h / 2} L ${w - hx} ${h} L ${hx} ${h} L 0 ${h / 2} Z`;
    case 'parallelogram':
      const px = w * 0.15;
      return `M ${px} 0 L ${w} 0 L ${w - px} ${h} L 0 ${h} Z`;
    case 'cylinder':
      const cy = h * 0.15;
      return `M 0 ${cy} A ${w / 2} ${cy} 0 0 1 ${w} ${cy} L ${w} ${h - cy} A ${w / 2} ${cy} 0 0 1 0 ${h - cy} Z M 0 ${cy} A ${w / 2} ${cy} 0 0 0 ${w} ${cy}`;
    case 'circle':
      const cr = Math.min(w, h) / 2;
      return `M ${w / 2} 0 A ${cr} ${cr} 0 1 1 ${w / 2} ${h} A ${cr} ${cr} 0 1 1 ${w / 2} 0`;
    case 'subroutine':
      const sx = 8;
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${sx} 0 L ${sx} ${h} M ${w - sx} 0 L ${w - sx} ${h}`;
    case 'asymmetric':
      const ax = w * 0.15;
      return `M 0 ${h / 2} L ${ax} 0 L ${w} 0 L ${w} ${h} L ${ax} ${h} Z`;
    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

// ノードの推奨サイズを取得
function getNodeSize(shape: NodeShape, labelLength: number): { width: number; height: number } {
  const baseWidth = Math.max(100, labelLength * 10 + 40);
  const baseHeight = 50;
  
  switch (shape) {
    case 'diamond':
      return { width: baseWidth * 1.4, height: baseWidth * 0.8 };
    case 'hexagon':
      return { width: baseWidth * 1.2, height: baseHeight * 1.2 };
    case 'circle':
      const diameter = Math.max(baseWidth, baseHeight * 1.5);
      return { width: diameter, height: diameter };
    case 'cylinder':
      return { width: baseWidth, height: baseHeight * 1.4 };
    default:
      return { width: baseWidth, height: baseHeight };
  }
}

type MermaidNodeProps = NodeProps & {
  data: MermaidNodeData;
};

function MermaidNodeComponent({ id, data, selected }: MermaidNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { updateNode, setEditingNodeId, editingNodeId } = useGraphStore();
  
  const { width, height } = getNodeSize(data.shape, data.label.length);
  const shapePath = getShapePath(data.shape, width, height);
  
  // 外部からの編集開始
  useEffect(() => {
    if (editingNodeId === id && !isEditing) {
      setIsEditing(true);
      setEditValue(data.label);
    }
  }, [editingNodeId, id, isEditing, data.label]);
  
  // 編集開始時にフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(data.label);
    setEditingNodeId(id);
  }, [data.label, id, setEditingNodeId]);
  
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setEditingNodeId(null);
    if (editValue.trim() && editValue !== data.label) {
      updateNode(id, { label: editValue.trim() });
    } else {
      setEditValue(data.label);
    }
  }, [editValue, data.label, id, updateNode, setEditingNodeId]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(data.label);
      setIsEditing(false);
      setEditingNodeId(null);
    }
  }, [handleBlur, data.label, setEditingNodeId]);
  
  return (
    <div
      className={`mermaid-node ${selected ? 'selected' : ''}`}
      style={{
        width,
        height,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mermaid-node-shape"
      >
        <path
          d={shapePath}
          fill={data.style.backgroundColor}
          stroke={selected ? '#d4ff00' : data.style.borderColor}
          strokeWidth={selected ? 3 : data.style.borderWidth}
        />
      </svg>
      
      <div className="mermaid-node-content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="mermaid-node-input"
            style={{
              color: data.style.textColor,
              fontSize: data.style.fontSize,
              fontWeight: data.style.fontWeight,
            }}
          />
        ) : (
          <span
            className="mermaid-node-label"
            style={{
              color: data.style.textColor,
              fontSize: data.style.fontSize,
              fontWeight: data.style.fontWeight,
            }}
          >
            {data.label}
          </span>
        )}
      </div>
      
      {/* 接続ハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        className="mermaid-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="mermaid-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="mermaid-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="mermaid-handle"
      />
    </div>
  );
}

export default memo(MermaidNodeComponent);
