import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnSelectionChangeParams,
  SelectionMode,
  ConnectionMode,
  BackgroundVariant,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import MermaidNode from './nodes/MermaidNode';
import MermaidEdge, { EdgeMarkerDefs } from './edges/MermaidEdge';
import { useGraphStore } from '../store/graphStore';
import type { NodeShape } from '../types/graph';
import './VisualEditor.css';

// カスタムノード/エッジタイプの登録
const nodeTypes = {
  mermaid: MermaidNode,
};

const edgeTypes = {
  default: MermaidEdge,
};

interface VisualEditorProps {
  onNodeSelect?: (nodeIds: string[]) => void;
  onEdgeSelect?: (edgeIds: string[]) => void;
}

function VisualEditor({ onNodeSelect, onEdgeSelect }: VisualEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    setEditingNodeId,
    addNode,
  } = useGraphStore();
  
  // 選択変更ハンドラー
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      const nodeIds = selectedNodes.map(n => n.id);
      const edgeIds = selectedEdges.map(e => e.id);
      
      setSelectedNodeIds(nodeIds);
      setSelectedEdgeIds(edgeIds);
      
      onNodeSelect?.(nodeIds);
      onEdgeSelect?.(edgeIds);
    },
    [setSelectedNodeIds, setSelectedEdgeIds, onNodeSelect, onEdgeSelect]
  );
  
  // ノードダブルクリックで編集開始
  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setEditingNodeId(node.id);
    },
    [setEditingNodeId]
  );
  
  // ドロップでノード追加
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData('application/mermgraph-node-type');
      if (!type || !reactFlowWrapper.current) return;
      
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 50,
        y: event.clientY - bounds.top - 25,
      };
      
      addNode('New Node', type as NodeShape, position);
    },
    [addNode]
  );
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // MiniMap用のノード色
  const nodeColor = useCallback((node: Node) => {
    const data = node.data as { style?: { backgroundColor?: string } };
    return data?.style?.backgroundColor ?? '#2d2d2d';
  }, []);
  
  // プロアクションの設定
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  
  return (
    <div
      ref={reactFlowWrapper}
      className="visual-editor-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <EdgeMarkerDefs />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={proOptions}
        defaultEdgeOptions={{
          type: 'default',
        }}
        className="visual-editor-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#404040"
        />
        <Controls
          showZoom
          showFitView
          showInteractive
          className="visual-editor-controls"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(20, 20, 20, 0.8)"
          className="visual-editor-minimap"
        />
      </ReactFlow>
    </div>
  );
}

export default VisualEditor;
