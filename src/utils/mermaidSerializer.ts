import type { 
  GraphData, 
  MermaidNode, 
  MermaidEdge, 
  NodeShape, 
  ArrowType 
} from '../types/graph';

// ノード形状をMermaid構文に変換
function shapeToMermaidSyntax(label: string, shape: NodeShape): string {
  switch (shape) {
    case 'rectangle':
      return `[${label}]`;
    case 'rounded':
      return `(${label})`;
    case 'stadium':
      return `([${label}])`;
    case 'diamond':
      return `{${label}}`;
    case 'hexagon':
      return `{{${label}}}`;
    case 'parallelogram':
      return `[/${label}/]`;
    case 'cylinder':
      return `[(${label})]`;
    case 'circle':
      return `((${label}))`;
    case 'subroutine':
      return `[[${label}]]`;
    case 'asymmetric':
      return `>${label}]`;
    default:
      return `[${label}]`;
  }
}

// 矢印タイプをMermaid構文に変換
function arrowTypeToMermaidSyntax(arrowType: ArrowType, label?: string): string {
  let arrow: string;
  
  switch (arrowType) {
    case 'arrow':
      arrow = '-->';
      break;
    case 'open':
      arrow = '---';
      break;
    case 'dotted':
      arrow = '-.->';
      break;
    case 'thick':
      arrow = '==>';
      break;
    case 'circle':
      arrow = '--o';
      break;
    case 'cross':
      arrow = '--x';
      break;
    default:
      arrow = '-->';
  }
  
  if (label) {
    return `${arrow}|${label}|`;
  }
  
  return arrow;
}

// グラフデータをMermaidコードにシリアライズ
export function serializeMermaidCode(data: GraphData): string {
  const lines: string[] = [];
  
  // ヘッダー行
  lines.push(`${data.type} ${data.direction}`);
  
  // ノード定義を追跡（エッジに含まれないノード用）
  const referencedNodes = new Set<string>();
  
  // エッジを出力
  for (const edge of data.edges) {
    const sourceNode = data.nodes.find(n => n.id === edge.source);
    const targetNode = data.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) continue;
    
    referencedNodes.add(sourceNode.id);
    referencedNodes.add(targetNode.id);
    
    const sourceStr = `${sourceNode.id}${shapeToMermaidSyntax(sourceNode.data.label, sourceNode.data.shape)}`;
    const targetStr = `${targetNode.id}${shapeToMermaidSyntax(targetNode.data.label, targetNode.data.shape)}`;
    const arrowStr = arrowTypeToMermaidSyntax(edge.data?.arrowType ?? 'arrow', edge.data?.label);
    
    lines.push(`    ${sourceStr} ${arrowStr} ${targetStr}`);
  }
  
  // エッジに含まれない孤立ノードを出力
  for (const node of data.nodes) {
    if (!referencedNodes.has(node.id)) {
      const nodeStr = `${node.id}${shapeToMermaidSyntax(node.data.label, node.data.shape)}`;
      lines.push(`    ${nodeStr}`);
    }
  }
  
  // スタイル定義を追加（カスタムスタイルがある場合）
  const styledNodes = data.nodes.filter(node => hasCustomStyle(node));
  const styledEdges = data.edges.filter(edge => edge.data && hasCustomEdgeStyle(edge));
  
  if (styledNodes.length > 0 || styledEdges.length > 0) {
    lines.push('');
    
    // ノードスタイル
    for (const node of styledNodes) {
      const styleStr = nodeStyleToMermaid(node);
      if (styleStr) {
        lines.push(`    style ${node.id} ${styleStr}`);
      }
    }
    
    // エッジスタイル（linkStyleを使用）
    data.edges.forEach((edge, index) => {
      if (edge.data && hasCustomEdgeStyle(edge)) {
        const styleStr = edgeStyleToMermaid(edge);
        if (styleStr) {
          lines.push(`    linkStyle ${index} ${styleStr}`);
        }
      }
    });
  }
  
  return lines.join('\n');
}

// デフォルトスタイルと異なるかチェック
function hasCustomStyle(node: MermaidNode): boolean {
  const style = node.data.style;
  return (
    style.backgroundColor !== '#2d2d2d' ||
    style.borderColor !== '#d4ff00' ||
    style.textColor !== '#ffffff'
  );
}

function hasCustomEdgeStyle(edge: MermaidEdge): boolean {
  const style = edge.data?.style;
  if (!style) return false;
  return (
    style.strokeColor !== '#a0a0a0' ||
    style.strokeWidth !== 2 ||
    style.animated === true
  );
}

// ノードスタイルをMermaid形式に変換
function nodeStyleToMermaid(node: MermaidNode): string {
  const style = node.data.style;
  const parts: string[] = [];
  
  if (style.backgroundColor !== '#2d2d2d') {
    parts.push(`fill:${style.backgroundColor}`);
  }
  if (style.borderColor !== '#d4ff00') {
    parts.push(`stroke:${style.borderColor}`);
  }
  if (style.textColor !== '#ffffff') {
    parts.push(`color:${style.textColor}`);
  }
  if (style.borderWidth !== 2) {
    parts.push(`stroke-width:${style.borderWidth}px`);
  }
  
  return parts.join(',');
}

// エッジスタイルをMermaid形式に変換
function edgeStyleToMermaid(edge: MermaidEdge): string {
  const style = edge.data?.style;
  if (!style) return '';
  
  const parts: string[] = [];
  
  if (style.strokeColor !== '#a0a0a0') {
    parts.push(`stroke:${style.strokeColor}`);
  }
  if (style.strokeWidth !== 2) {
    parts.push(`stroke-width:${style.strokeWidth}px`);
  }
  
  return parts.join(',');
}

// コードの変更箇所のみを更新（部分更新用）
export function updateNodeInCode(
  code: string,
  nodeId: string,
  newLabel: string,
  newShape: NodeShape
): string {
  const lines = code.split('\n');
  const newNodeDef = `${nodeId}${shapeToMermaidSyntax(newLabel, newShape)}`;
  
  // ノードIDを含む行を探して更新
  const nodePattern = new RegExp(`\\b${nodeId}\\s*[\\[\\(\\{\\>]`);
  
  return lines.map(line => {
    if (nodePattern.test(line)) {
      // この行のノード定義を置換
      return line.replace(
        new RegExp(`${nodeId}\\s*(?:\\[\\[.+?\\]\\]|\\{\\{.+?\\}\\}|\\(\\[.+?\\]\\)|\\[\\(.+?\\)\\]|\\(\\(.+?\\)\\)|\\[\\/.+?\\/\\]|>.+?\\]|\\[.+?\\]|\\(.+?\\)|\\{.+?\\})`),
        newNodeDef
      );
    }
    return line;
  }).join('\n');
}
