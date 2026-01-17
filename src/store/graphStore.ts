import { create } from 'zustand';
import { 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import type { 
  MermaidNode, 
  MermaidEdge, 
  GraphDirection, 
  NodeStyle, 
  EdgeStyle,
  NodeShape,
  ArrowType,
  MermaidNodeData,
  MermaidEdgeData,
} from '../types/graph';
import { DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE } from '../types/graph';
import { layoutFlowNodes } from '../utils/flowLayout';

interface GraphState {
  // グラフデータ
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  direction: GraphDirection;
  diagramType: 'flowchart' | 'graph';
  
  // 選択状態
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  
  // 編集状態
  editingNodeId: string | null;
  
  // 同期フラグ（コードからの更新中は同期を抑制）
  isSyncingFromCode: boolean;
  
  // アクション
  setNodes: (nodes: MermaidNode[]) => void;
  setEdges: (edges: MermaidEdge[]) => void;
  setDirection: (direction: GraphDirection) => void;
  setDiagramType: (type: 'flowchart' | 'graph') => void;
  
  // React Flow用のハンドラー
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
  onConnect: (connection: Connection) => void;
  
  // ノード操作
  addNode: (label: string, shape: NodeShape, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<{ label: string; shape: NodeShape; style: NodeStyle }>) => void;
  deleteNode: (nodeId: string) => void;
  
  // エッジ操作
  addEdgeManual: (source: string, target: string, label?: string, arrowType?: ArrowType) => void;
  updateEdge: (edgeId: string, updates: Partial<{ label: string; arrowType: ArrowType; style: EdgeStyle }>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // 選択操作
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  clearSelection: () => void;
  
  // 編集操作
  setEditingNodeId: (id: string | null) => void;
  
  // 同期
  setSyncingFromCode: (isSyncing: boolean) => void;
  
  // 一括更新（パースからの更新用）
  updateFromParsedData: (nodes: MermaidNode[], edges: MermaidEdge[], direction: GraphDirection, type: 'flowchart' | 'graph') => void;
}

// ユニークID生成
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateEdgeId = (source: string, target: string) => `e-${source}-${target}-${Date.now()}`;

export const useGraphStore = create<GraphState>((set, get) => ({
  // 初期状態
  nodes: [],
  edges: [],
  direction: 'TD',
  diagramType: 'flowchart',
  selectedNodeIds: [],
  selectedEdgeIds: [],
  editingNodeId: null,
  isSyncingFromCode: false,
  
  // 基本セッター
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setDirection: (direction) => {
    const { nodes, edges } = get();
    const nextNodes = nodes.map((node) => ({
      ...node,
      position: { ...node.position },
    }));
    layoutFlowNodes(nextNodes, edges, direction);
    set({ direction, nodes: nextNodes });
  },
  setDiagramType: (type) => set({ diagramType: type }),
  
  // React Flowハンドラー
  onNodesChange: (changes) => {
    const currentNodes = get().nodes;
    const updatedNodes = applyNodeChanges(changes, currentNodes as Node[]);
    set({
      nodes: updatedNodes as MermaidNode[],
    });
  },
  
  onEdgesChange: (changes) => {
    const currentEdges = get().edges;
    const updatedEdges = applyEdgeChanges(changes, currentEdges as Edge[]);
    set({
      edges: updatedEdges as MermaidEdge[],
    });
  },
  
  onConnect: (connection) => {
    const newEdgeData: MermaidEdgeData = {
      arrowType: 'arrow',
      style: { ...DEFAULT_EDGE_STYLE },
    };
    const newEdge: MermaidEdge = {
      id: generateEdgeId(connection.source!, connection.target!),
      source: connection.source!,
      target: connection.target!,
      data: newEdgeData,
    };
    const currentEdges = get().edges;
    const updatedEdges = addEdge(newEdge as Edge, currentEdges as Edge[]);
    set({
      edges: updatedEdges as MermaidEdge[],
    });
  },
  
  // ノード操作
  addNode: (label, shape, position) => {
    const id = generateId();
    const newNodeData: MermaidNodeData = {
      label,
      shape,
      style: { ...DEFAULT_NODE_STYLE },
    };
    const newNode: MermaidNode = {
      id,
      type: 'mermaid',
      position,
      data: newNodeData,
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  
  updateNode: (nodeId, updates) => {
    set({
      nodes: get().nodes.map(node => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            ...(updates.label !== undefined && { label: updates.label }),
            ...(updates.shape !== undefined && { shape: updates.shape }),
            ...(updates.style !== undefined && { style: { ...node.data.style, ...updates.style } }),
          },
        };
      }),
    });
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      selectedNodeIds: get().selectedNodeIds.filter(id => id !== nodeId),
    });
  },
  
  // エッジ操作
  addEdgeManual: (source, target, label, arrowType = 'arrow') => {
    const newEdgeData: MermaidEdgeData = {
      label,
      arrowType,
      style: { ...DEFAULT_EDGE_STYLE },
    };
    const newEdge: MermaidEdge = {
      id: generateEdgeId(source, target),
      source,
      target,
      data: newEdgeData,
    };
    set({ edges: [...get().edges, newEdge] });
  },
  
  updateEdge: (edgeId, updates) => {
    set({
      edges: get().edges.map(edge => {
        if (edge.id !== edgeId) return edge;
        const currentData = edge.data ?? { arrowType: 'arrow' as ArrowType, style: { ...DEFAULT_EDGE_STYLE } };
        return {
          ...edge,
          data: {
            ...currentData,
            ...(updates.label !== undefined && { label: updates.label }),
            ...(updates.arrowType !== undefined && { arrowType: updates.arrowType }),
            ...(updates.style !== undefined && { style: { ...currentData.style, ...updates.style } }),
          },
        } as MermaidEdge;
      }),
    });
  },
  
  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter(e => e.id !== edgeId),
      selectedEdgeIds: get().selectedEdgeIds.filter(id => id !== edgeId),
    });
  },
  
  // 選択操作
  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
  setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),
  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),
  
  // 編集操作
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  
  // 同期
  setSyncingFromCode: (isSyncing) => set({ isSyncingFromCode: isSyncing }),
  
  // 一括更新
  updateFromParsedData: (nodes, edges, direction, type) => {
    set({
      nodes,
      edges,
      direction,
      diagramType: type,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      editingNodeId: null,
    });
  },
}));
