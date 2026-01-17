import { useCallback, useMemo } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { NodeShape, ArrowType, NodeStyle, EdgeStyle } from '../types/graph';
import { 
  NODE_SHAPE_LABELS, 
  ARROW_TYPE_LABELS, 
  COLOR_PRESETS,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
} from '../types/graph';
import './StylePanel.css';

function StylePanel() {
  const {
    nodes,
    edges,
    selectedNodeIds,
    selectedEdgeIds,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
  } = useGraphStore();
  
  // 選択されたノードを取得
  const selectedNodes = useMemo(
    () => nodes.filter(n => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds]
  );
  
  // 選択されたエッジを取得
  const selectedEdges = useMemo(
    () => edges.filter(e => selectedEdgeIds.includes(e.id)),
    [edges, selectedEdgeIds]
  );
  
  // 最初の選択ノード（編集対象）
  const primaryNode = selectedNodes[0];
  const primaryEdge = selectedEdges[0];
  
  // ノードスタイル更新
  const handleNodeStyleChange = useCallback(
    (updates: Partial<NodeStyle>) => {
      selectedNodeIds.forEach(id => {
        updateNode(id, { style: updates as NodeStyle });
      });
    },
    [selectedNodeIds, updateNode]
  );
  
  // ノード形状更新
  const handleShapeChange = useCallback(
    (shape: NodeShape) => {
      selectedNodeIds.forEach(id => {
        updateNode(id, { shape });
      });
    },
    [selectedNodeIds, updateNode]
  );
  
  // ノードラベル更新
  const handleLabelChange = useCallback(
    (label: string) => {
      if (primaryNode) {
        updateNode(primaryNode.id, { label });
      }
    },
    [primaryNode, updateNode]
  );
  
  // エッジスタイル更新
  const handleEdgeStyleChange = useCallback(
    (updates: Partial<EdgeStyle>) => {
      selectedEdgeIds.forEach(id => {
        updateEdge(id, { style: updates as EdgeStyle });
      });
    },
    [selectedEdgeIds, updateEdge]
  );
  
  // 矢印タイプ更新
  const handleArrowTypeChange = useCallback(
    (arrowType: ArrowType) => {
      selectedEdgeIds.forEach(id => {
        updateEdge(id, { arrowType });
      });
    },
    [selectedEdgeIds, updateEdge]
  );
  
  // エッジラベル更新
  const handleEdgeLabelChange = useCallback(
    (label: string) => {
      if (primaryEdge) {
        updateEdge(primaryEdge.id, { label });
      }
    },
    [primaryEdge, updateEdge]
  );
  
  // 削除
  const handleDelete = useCallback(() => {
    selectedNodeIds.forEach(id => deleteNode(id));
    selectedEdgeIds.forEach(id => deleteEdge(id));
  }, [selectedNodeIds, selectedEdgeIds, deleteNode, deleteEdge]);
  
  // 何も選択されていない場合
  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    return (
      <div className="style-panel">
        <div className="style-panel-empty">
          <span className="material-icons">touch_app</span>
          <p>ノードまたはエッジを選択してスタイルを編集</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="style-panel">
      {/* ノード編集セクション */}
      {selectedNodes.length > 0 && (
        <div className="style-section">
          <h3 className="style-section-title">
            <span className="material-icons">crop_square</span>
            ノード ({selectedNodes.length})
          </h3>
          
          {/* ラベル編集 */}
          {primaryNode && (
            <div className="style-field">
              <label>ラベル</label>
              <input
                type="text"
                value={primaryNode.data.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="style-input"
              />
            </div>
          )}
          
          {/* 形状選択 */}
          <div className="style-field">
            <label>形状</label>
            <select
              value={primaryNode?.data.shape ?? 'rectangle'}
              onChange={(e) => handleShapeChange(e.target.value as NodeShape)}
              className="style-select"
            >
              {Object.entries(NODE_SHAPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 背景色 */}
          <div className="style-field">
            <label>背景色</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={primaryNode?.data.style.backgroundColor ?? DEFAULT_NODE_STYLE.backgroundColor}
                onChange={(e) => handleNodeStyleChange({ backgroundColor: e.target.value })}
                className="color-input"
              />
              <div className="color-presets">
                {COLOR_PRESETS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    className="color-preset"
                    style={{ backgroundColor: color }}
                    onClick={() => handleNodeStyleChange({ backgroundColor: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* ボーダー色 */}
          <div className="style-field">
            <label>ボーダー色</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={primaryNode?.data.style.borderColor ?? DEFAULT_NODE_STYLE.borderColor}
                onChange={(e) => handleNodeStyleChange({ borderColor: e.target.value })}
                className="color-input"
              />
              <div className="color-presets">
                {COLOR_PRESETS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    className="color-preset"
                    style={{ backgroundColor: color }}
                    onClick={() => handleNodeStyleChange({ borderColor: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* テキスト色 */}
          <div className="style-field">
            <label>テキスト色</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={primaryNode?.data.style.textColor ?? DEFAULT_NODE_STYLE.textColor}
                onChange={(e) => handleNodeStyleChange({ textColor: e.target.value })}
                className="color-input"
              />
              <div className="color-presets">
                {COLOR_PRESETS.slice(6).map((color) => (
                  <button
                    key={color}
                    className="color-preset"
                    style={{ backgroundColor: color }}
                    onClick={() => handleNodeStyleChange({ textColor: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* エッジ編集セクション */}
      {selectedEdges.length > 0 && (
        <div className="style-section">
          <h3 className="style-section-title">
            <span className="material-icons">trending_flat</span>
            エッジ ({selectedEdges.length})
          </h3>
          
          {/* ラベル編集 */}
          {primaryEdge && (
            <div className="style-field">
              <label>ラベル</label>
              <input
                type="text"
                value={primaryEdge.data?.label ?? ''}
                onChange={(e) => handleEdgeLabelChange(e.target.value)}
                className="style-input"
                placeholder="ラベルを入力..."
              />
            </div>
          )}
          
          {/* 矢印タイプ */}
          <div className="style-field">
            <label>矢印タイプ</label>
            <select
              value={primaryEdge?.data?.arrowType ?? 'arrow'}
              onChange={(e) => handleArrowTypeChange(e.target.value as ArrowType)}
              className="style-select"
            >
              {Object.entries(ARROW_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          {/* ストローク色 */}
          <div className="style-field">
            <label>線の色</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={primaryEdge?.data?.style?.strokeColor ?? DEFAULT_EDGE_STYLE.strokeColor}
                onChange={(e) => handleEdgeStyleChange({ strokeColor: e.target.value })}
                className="color-input"
              />
              <div className="color-presets">
                {COLOR_PRESETS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    className="color-preset"
                    style={{ backgroundColor: color }}
                    onClick={() => handleEdgeStyleChange({ strokeColor: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* アニメーション */}
          <div className="style-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={primaryEdge?.data?.style?.animated ?? false}
                onChange={(e) => handleEdgeStyleChange({ animated: e.target.checked })}
              />
              アニメーション
            </label>
          </div>
        </div>
      )}
      
      {/* 削除ボタン */}
      <div className="style-section">
        <button
          className="btn btn-danger"
          onClick={handleDelete}
        >
          <span className="material-icons">delete</span>
          選択を削除
        </button>
      </div>
    </div>
  );
}

export default StylePanel;
