import { Result } from "../result";

export interface Node {
  id: string;
}

export interface Edge {
  from: string;
  to: string;
}

export interface TopologicalSortResult {
  order: string[];
  inDegree: Map<string, number>;
  adjacency: Map<string, string[]>;
}

export interface Graph {
  validate(nodes: Node[], edges: Edge[]): Result;
  topologicalSort(nodes: Node[], edges: Edge[]): TopologicalSortResult;
  getExecutionLayers(nodes: Node[], edges: Edge[]): string[][];
}

export declare function graph(): Graph;