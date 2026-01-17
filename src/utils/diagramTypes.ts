export const MERMAID_DIAGRAM_TYPES = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gantt',
  'timeline',
  'pie',
  'xychart-beta',
  'quadrantChart',
  'sankey-beta',
  'journey',
  'gitGraph',
  'mindmap',
  'requirementDiagram',
  'C4Context',
  'C4Container',
  'C4Component',
  'C4Dynamic',
  'zenuml',
  'block-beta',
  'packet-beta',
  'kanban',
  'architecture-beta',
] as const;

export type MermaidDiagramType = typeof MERMAID_DIAGRAM_TYPES[number];

export const FLOW_DIAGRAM_TYPES = ['flowchart', 'graph'] as const;
export type FlowDiagramType = typeof FLOW_DIAGRAM_TYPES[number];

const DIAGRAM_TYPE_LOOKUP = new Map<string, MermaidDiagramType>(
  MERMAID_DIAGRAM_TYPES.map((type) => [type.toLowerCase(), type])
);

export function detectDiagramType(code: string): MermaidDiagramType | null {
  const firstLine = code
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('%%'));

  if (!firstLine) {
    return null;
  }

  const match = firstLine.match(/^([a-zA-Z0-9_-]+)/);
  if (!match) {
    return null;
  }

  return DIAGRAM_TYPE_LOOKUP.get(match[1].toLowerCase()) ?? null;
}

export function isFlowDiagramType(
  diagramType: MermaidDiagramType | null
): diagramType is FlowDiagramType {
  return diagramType === 'flowchart' || diagramType === 'graph';
}
