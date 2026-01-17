import type { GraphDirection, MermaidNode, MermaidEdge } from '../types/graph';

export function layoutFlowNodes(
  nodes: MermaidNode[],
  edges: MermaidEdge[],
  direction: GraphDirection
): void {
  if (nodes.length === 0) return;

  // 依存関係からレベルを計算
  const levels = new Map<string, number>();
  const processed = new Set<string>();

  // ルートノードを見つける（ソースになっていてターゲットになっていないノード）
  const targets = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !targets.has(n.id));

  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }

  // BFSでレベルを計算
  const queue: Array<{ id: string; level: number }> = roots.map((r) => ({
    id: r.id,
    level: 0,
  }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (processed.has(id)) continue;
    processed.add(id);

    levels.set(id, level);

    // このノードから出るエッジを見つける
    const outgoing = edges.filter((e) => e.source === id);
    for (const edge of outgoing) {
      if (!processed.has(edge.target)) {
        queue.push({ id: edge.target, level: level + 1 });
      }
    }
  }

  // レベルごとにノードをグループ化
  const levelGroups = new Map<number, MermaidNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  }

  // 方向に応じて位置を計算
  const isHorizontal = direction === 'LR' || direction === 'RL';
  const isReverse = direction === 'BT' || direction === 'RL';

  const spacing = { x: isHorizontal ? 250 : 180, y: isHorizontal ? 120 : 150 };
  const startOffset = { x: 100, y: 100 };

  const maxLevel = Math.max(...Array.from(levels.values()), 0);

  for (const [level, group] of levelGroups) {
    const adjustedLevel = isReverse ? maxLevel - level : level;

    group.forEach((node, index) => {
      const offset = (group.length - 1) / 2;

      if (isHorizontal) {
        node.position = {
          x: startOffset.x + adjustedLevel * spacing.x,
          y: startOffset.y + (index - offset) * spacing.y + offset * spacing.y,
        };
      } else {
        node.position = {
          x: startOffset.x + (index - offset) * spacing.x + offset * spacing.x,
          y: startOffset.y + adjustedLevel * spacing.y,
        };
      }
    });
  }
}
