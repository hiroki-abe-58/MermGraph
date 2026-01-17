import type { Node, Edge } from '@xyflow/react';

// ノードの形状タイプ
export type NodeShape = 
  | 'rectangle'    // [text] - 四角形
  | 'rounded'      // (text) - 角丸四角形
  | 'stadium'      // ([text]) - スタジアム形
  | 'diamond'      // {text} - 菱形
  | 'hexagon'      // {{text}} - 六角形
  | 'parallelogram' // [/text/] - 平行四辺形
  | 'cylinder'     // [(text)] - 円筒形
  | 'circle'       // ((text)) - 円形
  | 'subroutine'   // [[text]] - サブルーチン
  | 'asymmetric';  // >text] - 非対称

// エッジの矢印タイプ
export type ArrowType = 
  | 'arrow'        // -->
  | 'open'         // ---
  | 'dotted'       // -.->
  | 'thick'        // ==>
  | 'circle'       // --o
  | 'cross';       // --x

// ノードのスタイル
export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  [key: string]: unknown;
}

// エッジのスタイル
export interface EdgeStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated?: boolean;
  [key: string]: unknown;
}

// カスタムノードデータ（インデックスシグネチャ付き）
export interface MermaidNodeData {
  label: string;
  shape: NodeShape;
  style: NodeStyle;
  [key: string]: unknown;
}

// カスタムエッジデータ（インデックスシグネチャ付き）
export interface MermaidEdgeData {
  label?: string;
  arrowType: ArrowType;
  style: EdgeStyle;
  [key: string]: unknown;
}

// React Flow用のノード型
export type MermaidNode = Node<MermaidNodeData, 'mermaid'>;

// React Flow用のエッジ型
export type MermaidEdge = Edge<MermaidEdgeData>;

// グラフの方向
export type GraphDirection = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

// グラフ全体のデータ
export interface GraphData {
  type: 'flowchart' | 'graph';
  direction: GraphDirection;
  nodes: MermaidNode[];
  edges: MermaidEdge[];
}

// パース結果
export interface ParseResult {
  success: boolean;
  data?: GraphData;
  error?: string;
}

// デフォルトスタイル
export const DEFAULT_NODE_STYLE: NodeStyle = {
  backgroundColor: '#2d2d2d',
  borderColor: '#d4ff00',
  borderWidth: 2,
  textColor: '#ffffff',
  fontSize: 14,
  fontWeight: 'normal',
};

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  strokeColor: '#a0a0a0',
  strokeWidth: 2,
};

// ノード形状のラベルマッピング
export const NODE_SHAPE_LABELS: Record<NodeShape, string> = {
  rectangle: '四角形 [text]',
  rounded: '角丸 (text)',
  stadium: 'スタジアム ([text])',
  diamond: '菱形 {text}',
  hexagon: '六角形 {{text}}',
  parallelogram: '平行四辺形 [/text/]',
  cylinder: '円筒 [(text)]',
  circle: '円 ((text))',
  subroutine: 'サブルーチン [[text]]',
  asymmetric: '非対称 >text]',
};

// 矢印タイプのラベルマッピング
export const ARROW_TYPE_LABELS: Record<ArrowType, string> = {
  arrow: '矢印 -->',
  open: '線 ---',
  dotted: '点線 -.->',
  thick: '太線 ==>',
  circle: '円 --o',
  cross: 'x印 --x',
};

// 色プリセット
export const COLOR_PRESETS = [
  '#d4ff00', // アクセント（蛍光イエロー）
  '#ff6b6b', // レッド
  '#4ecdc4', // ターコイズ
  '#45b7d1', // スカイブルー
  '#96ceb4', // ミント
  '#ffeaa7', // イエロー
  '#dfe6e9', // ライトグレー
  '#a29bfe', // パープル
  '#fd79a8', // ピンク
  '#00b894', // グリーン
  '#2d2d2d', // ダークグレー
  '#ffffff', // ホワイト
];
