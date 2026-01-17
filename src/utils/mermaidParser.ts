import type { 
  GraphDirection, 
  MermaidNode, 
  MermaidEdge, 
  NodeShape, 
  ArrowType,
  ParseResult,
  MermaidNodeData,
  MermaidEdgeData,
} from '../types/graph';
import { DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE } from '../types/graph';
import { detectDiagramType, isFlowDiagramType } from './diagramTypes';
import { layoutFlowNodes } from './flowLayout';

// ノード形状のパターンマッチング
const NODE_SHAPE_PATTERNS: Array<{
  pattern: RegExp;
  shape: NodeShape;
  extract: (match: RegExpMatchArray) => string;
}> = [
  // ((text)) - 円形
  { pattern: /^\(\((.+)\)\)$/, shape: 'circle', extract: (m) => m[1] },
  // ([text]) - スタジアム形
  { pattern: /^\(\[(.+)\]\)$/, shape: 'stadium', extract: (m) => m[1] },
  // [(text)] - 円筒形
  { pattern: /^\[\((.+)\)\]$/, shape: 'cylinder', extract: (m) => m[1] },
  // [[text]] - サブルーチン
  { pattern: /^\[\[(.+)\]\]$/, shape: 'subroutine', extract: (m) => m[1] },
  // {{text}} - 六角形
  { pattern: /^\{\{(.+)\}\}$/, shape: 'hexagon', extract: (m) => m[1] },
  // {text} - 菱形
  { pattern: /^\{(.+)\}$/, shape: 'diamond', extract: (m) => m[1] },
  // (text) - 角丸四角形
  { pattern: /^\((.+)\)$/, shape: 'rounded', extract: (m) => m[1] },
  // [/text/] - 平行四辺形
  { pattern: /^\[\/(.+)\/\]$/, shape: 'parallelogram', extract: (m) => m[1] },
  // >text] - 非対称
  { pattern: /^>(.+)\]$/, shape: 'asymmetric', extract: (m) => m[1] },
  // [text] - 四角形
  { pattern: /^\[(.+)\]$/, shape: 'rectangle', extract: (m) => m[1] },
];

// エッジタイプのパターンマッチング
const EDGE_PATTERNS: Array<{
  pattern: RegExp;
  arrowType: ArrowType;
  hasLabel: boolean;
}> = [
  // ラベル付きエッジ
  { pattern: /-->\|([^|]+)\|/, arrowType: 'arrow', hasLabel: true },
  { pattern: /---\|([^|]+)\|/, arrowType: 'open', hasLabel: true },
  { pattern: /-\.->\|([^|]+)\|/, arrowType: 'dotted', hasLabel: true },
  { pattern: /==>\|([^|]+)\|/, arrowType: 'thick', hasLabel: true },
  { pattern: /--o\|([^|]+)\|/, arrowType: 'circle', hasLabel: true },
  { pattern: /--x\|([^|]+)\|/, arrowType: 'cross', hasLabel: true },
  // ラベルなしエッジ
  { pattern: /-->/, arrowType: 'arrow', hasLabel: false },
  { pattern: /---/, arrowType: 'open', hasLabel: false },
  { pattern: /-\.->/, arrowType: 'dotted', hasLabel: false },
  { pattern: /==>/, arrowType: 'thick', hasLabel: false },
  { pattern: /--o/, arrowType: 'circle', hasLabel: false },
  { pattern: /--x/, arrowType: 'cross', hasLabel: false },
];

// ノードIDとラベルを解析
function parseNodeDefinition(text: string): { id: string; label: string; shape: NodeShape } {
  const trimmed = text.trim();
  
  // まずIDと定義部分を分離
  // 例: "A[Start]" -> id="A", definition="[Start]"
  const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(.*)$/);
  
  if (!match) {
    return { id: trimmed, label: trimmed, shape: 'rectangle' };
  }
  
  const id = match[1];
  const definition = match[2].trim();
  
  if (!definition) {
    return { id, label: id, shape: 'rectangle' };
  }
  
  // 形状を判定
  for (const { pattern, shape, extract } of NODE_SHAPE_PATTERNS) {
    const shapeMatch = definition.match(pattern);
    if (shapeMatch) {
      return { id, label: extract(shapeMatch), shape };
    }
  }
  
  return { id, label: id, shape: 'rectangle' };
}

// エッジを解析
function parseEdge(
  line: string,
  nodeMap: Map<string, MermaidNode>
): MermaidEdge | null {
  // エッジタイプを検出
  for (const { pattern, arrowType, hasLabel } of EDGE_PATTERNS) {
    if (pattern.test(line)) {
      // エッジの両端を分割
      const parts = line.split(pattern);
      if (parts.length < 2) continue;
      
      const sourceText = parts[0].trim();
      const targetText = parts[parts.length - 1].trim();
      
      // ソースノードを解析
      const sourceInfo = parseNodeDefinition(sourceText);
      const targetInfo = parseNodeDefinition(targetText);
      
      // ノードがまだ存在しない場合は追加
      if (!nodeMap.has(sourceInfo.id)) {
        nodeMap.set(sourceInfo.id, createNode(sourceInfo.id, sourceInfo.label, sourceInfo.shape, nodeMap.size));
      }
      if (!nodeMap.has(targetInfo.id)) {
        nodeMap.set(targetInfo.id, createNode(targetInfo.id, targetInfo.label, targetInfo.shape, nodeMap.size));
      }
      
      // 既存ノードのラベルと形状を更新（より詳細な定義がある場合）
      const existingSource = nodeMap.get(sourceInfo.id)!;
      if (sourceInfo.label !== sourceInfo.id) {
        existingSource.data.label = sourceInfo.label;
        existingSource.data.shape = sourceInfo.shape;
      }
      
      const existingTarget = nodeMap.get(targetInfo.id)!;
      if (targetInfo.label !== targetInfo.id) {
        existingTarget.data.label = targetInfo.label;
        existingTarget.data.shape = targetInfo.shape;
      }
      
      // ラベルを抽出
      let label: string | undefined;
      if (hasLabel) {
        const labelMatch = line.match(pattern);
        if (labelMatch && labelMatch[1]) {
          label = labelMatch[1];
        }
      }
      
      const edgeData: MermaidEdgeData = {
        label,
        arrowType,
        style: { ...DEFAULT_EDGE_STYLE },
      };
      
      return {
        id: `e-${sourceInfo.id}-${targetInfo.id}-${Date.now()}`,
        source: sourceInfo.id,
        target: targetInfo.id,
        data: edgeData,
      };
    }
  }
  
  return null;
}

// ノードを作成
function createNode(
  id: string,
  label: string,
  shape: NodeShape,
  index: number
): MermaidNode {
  // 簡単なグリッドレイアウト
  const col = index % 3;
  const row = Math.floor(index / 3);
  
  const nodeData: MermaidNodeData = {
    label,
    shape,
    style: { ...DEFAULT_NODE_STYLE },
  };
  
  return {
    id,
    type: 'mermaid',
    position: { x: col * 200 + 100, y: row * 150 + 100 },
    data: nodeData,
  };
}

// Mermaidコードをパース
export function parseMermaidCode(code: string): ParseResult {
  try {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%%'));
    
    if (lines.length === 0) {
      return { success: false, error: 'Empty code' };
    }
    
    // 最初の行からグラフタイプと方向を取得
    const diagramType = detectDiagramType(lines[0]);
    if (!diagramType || !isFlowDiagramType(diagramType)) {
      return { success: false, error: 'Invalid diagram type. Expected flowchart or graph.' };
    }

    const firstLine = lines[0].toLowerCase();
    const type = diagramType;
    let direction: GraphDirection = 'TD';

    // 方向を抽出
    const dirMatch = firstLine.match(/\b(tb|td|bt|rl|lr)\b/i);
    if (dirMatch) {
      direction = dirMatch[1].toUpperCase() as GraphDirection;
    }
    
    const nodeMap = new Map<string, MermaidNode>();
    const edges: MermaidEdge[] = [];
    
    // 残りの行を解析
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // subgraph, end などのキーワードはスキップ
      if (/^(subgraph|end)\b/i.test(line)) {
        continue;
      }
      
      // エッジを含む行を解析
      const edge = parseEdge(line, nodeMap);
      if (edge) {
        edges.push(edge);
      }
    }
    
    // ノードの位置を方向に応じて調整
    const nodes = Array.from(nodeMap.values());
    layoutFlowNodes(nodes, edges, direction);
    
    return {
      success: true,
      data: {
        type,
        direction,
        nodes,
        edges,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse error',
    };
  }
}

