import { useEffect, useRef, useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import { parseMermaidCode } from '../utils/mermaidParser';
import { detectDiagramType, isFlowDiagramType } from '../utils/diagramTypes';
import { serializeMermaidCode } from '../utils/mermaidSerializer';
import type { GraphData } from '../types/graph';

interface UseCodeSyncOptions {
  code: string;
  onCodeChange: (code: string) => void;
  debounceMs?: number;
}

export function useCodeSync({ code, onCodeChange, debounceMs = 300 }: UseCodeSyncOptions) {
  const {
    nodes,
    edges,
    direction,
    diagramType,
    isSyncingFromCode,
    setSyncingFromCode,
    updateFromParsedData,
  } = useGraphStore();
  
  // 前回のコードを保持（無限ループ防止）
  const prevCodeRef = useRef<string>(code);
  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);
  const prevDirectionRef = useRef(direction);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // コードからビジュアルへの同期
  const syncCodeToVisual = useCallback((mermaidCode: string) => {
    const diagramType = detectDiagramType(mermaidCode);
    if (!isFlowDiagramType(diagramType)) {
      return;
    }

    const result = parseMermaidCode(mermaidCode);
    
    if (result.success && result.data) {
      setSyncingFromCode(true);
      updateFromParsedData(
        result.data.nodes,
        result.data.edges,
        result.data.direction,
        result.data.type
      );
      
      // フラグをリセット
      setTimeout(() => {
        setSyncingFromCode(false);
      }, 50);
    }
  }, [setSyncingFromCode, updateFromParsedData]);
  
  const normalizeNodesForCode = useCallback((items: typeof nodes) => {
    return items.map(({ position, ...rest }) => rest);
  }, []);

  // ビジュアルからコードへの同期
  const syncVisualToCode = useCallback(() => {
    const graphData: GraphData = {
      type: diagramType,
      direction,
      nodes,
      edges,
    };
    
    const newCode = serializeMermaidCode(graphData);
    
    if (newCode !== prevCodeRef.current) {
      prevCodeRef.current = newCode;
      onCodeChange(newCode);
    }
  }, [nodes, edges, direction, diagramType, onCodeChange]);
  
  // コード変更時にビジュアルを更新
  useEffect(() => {
    if (code !== prevCodeRef.current) {
      prevCodeRef.current = code;
      syncCodeToVisual(code);
    }
  }, [code, syncCodeToVisual]);
  
  // ビジュアル変更時にコードを更新（デバウンス付き）
  useEffect(() => {
    // コードからの同期中は無視
    if (isSyncingFromCode) {
      prevNodesRef.current = nodes;
      prevEdgesRef.current = edges;
      prevDirectionRef.current = direction;
      return;
    }
    
    // 変更があるかチェック
    const hasNodeChanges =
      JSON.stringify(normalizeNodesForCode(nodes)) !==
      JSON.stringify(normalizeNodesForCode(prevNodesRef.current));
    const hasEdgeChanges = JSON.stringify(edges) !== JSON.stringify(prevEdgesRef.current);
    const hasDirectionChanges = direction !== prevDirectionRef.current;
    
    if (!hasNodeChanges && !hasEdgeChanges && !hasDirectionChanges) {
      return;
    }
    
    prevNodesRef.current = nodes;
    prevEdgesRef.current = edges;
    prevDirectionRef.current = direction;
    
    // 方向変更は即時反映
    if (hasDirectionChanges && !hasNodeChanges && !hasEdgeChanges) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncVisualToCode();
      return;
    }

    // 既存のタイマーをクリア
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // デバウンス
    syncTimeoutRef.current = setTimeout(() => {
      syncVisualToCode();
    }, debounceMs);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [nodes, edges, direction, isSyncingFromCode, syncVisualToCode, debounceMs, normalizeNodesForCode]);
  
  // 初期同期
  useEffect(() => {
    syncCodeToVisual(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    syncCodeToVisual,
    syncVisualToCode,
  };
}
