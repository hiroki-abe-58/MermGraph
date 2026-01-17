import { useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { NodeShape, GraphDirection } from '../types/graph';
import './Toolbar.css';

// ノード形状アイテム
const NODE_SHAPES: Array<{ shape: NodeShape; label: string; icon: string }> = [
  { shape: 'rectangle', label: '四角形', icon: 'crop_square' },
  { shape: 'rounded', label: '角丸', icon: 'crop_din' },
  { shape: 'diamond', label: '菱形', icon: 'change_history' },
  { shape: 'circle', label: '円', icon: 'circle' },
  { shape: 'stadium', label: 'スタジアム', icon: 'panorama_wide_angle' },
  { shape: 'hexagon', label: '六角形', icon: 'hexagon' },
];

// 方向アイテム
const DIRECTIONS: Array<{ direction: GraphDirection; label: string; icon: string }> = [
  { direction: 'TD', label: '上から下', icon: 'arrow_downward' },
  { direction: 'LR', label: '左から右', icon: 'arrow_forward' },
  { direction: 'BT', label: '下から上', icon: 'arrow_upward' },
  { direction: 'RL', label: '右から左', icon: 'arrow_back' },
];

function Toolbar() {
  const { direction, setDirection, addNode, nodes } = useGraphStore();
  
  // ドラッグ開始
  const handleDragStart = useCallback(
    (e: React.DragEvent, shape: NodeShape) => {
      e.dataTransfer.setData('application/mermgraph-node-type', shape);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );
  
  // クリックでノード追加
  const handleAddNode = useCallback(
    (shape: NodeShape) => {
      // ノードを中央付近に追加
      const offset = nodes.length * 30;
      const position = {
        x: 200 + offset % 300,
        y: 150 + Math.floor(offset / 300) * 100,
      };
      addNode('New Node', shape, position);
    },
    [addNode, nodes.length]
  );
  
  // 方向変更
  const handleDirectionChange = useCallback(
    (dir: GraphDirection) => {
      setDirection(dir);
    },
    [setDirection]
  );
  
  return (
    <div className="toolbar">
      {/* ノード追加セクション */}
      <div className="toolbar-section">
        <span className="toolbar-section-label">ノード追加</span>
        <div className="toolbar-items">
          {NODE_SHAPES.map(({ shape, label, icon }) => (
            <button
              key={shape}
              className="toolbar-item"
              title={`${label}を追加`}
              onClick={() => handleAddNode(shape)}
              draggable
              onDragStart={(e) => handleDragStart(e, shape)}
            >
              <span className="material-icons">{icon}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 区切り線 */}
      <div className="toolbar-divider" />
      
      {/* 方向セクション */}
      <div className="toolbar-section">
        <span className="toolbar-section-label">方向</span>
        <div className="toolbar-items">
          {DIRECTIONS.map(({ direction: dir, label, icon }) => (
            <button
              key={dir}
              className={`toolbar-item ${direction === dir ? 'active' : ''}`}
              title={label}
              onClick={() => handleDirectionChange(dir)}
            >
              <span className="material-icons">{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
