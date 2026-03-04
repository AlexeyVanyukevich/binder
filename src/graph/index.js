/**
 * @typedef {import('.').Node} Node
 * @typedef {import('.').Edge} Edge
 * @typedef {import('.').TopologicalSortResult} TopologicalSortResult
 * @typedef {import('../result').Result} Result
 * @typedef {import('.').Graph} Graph
 */

const { ok, err } = require("../result");

/**
 *
 * @returns {Graph}
 */
const graph = () => {
  /**
   * Topological sort using Kahn's algorithm.
   * @param {Node[]} nodes
   * @param {Edge[]} edges
   * @returns {TopologicalSortResult}
   */
  const topologicalSort = (nodes, edges) => {
    /** @type {Map<string, number>} */
    const inDegree = new Map();
    /** @type {Map<string, string[]>} */
    const adjacency = new Map();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      adjacency.get(edge.from).push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    /** @type {string[]} */
    const queue = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    /** @type {string[]} */
    const order = [];
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      for (const neighbor of adjacency.get(current)) {
        const newDegree = inDegree.get(neighbor) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    return { order, inDegree, adjacency };
  };

  /**
   * Validates that the graph is a valid DAG (no cycles, all edge references exist).
   * @param {Node[]} nodes
   * @param {Edge[]} edges
   * @returns {Result}
   */
  const validate = (nodes, edges) => {
    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const edge of edges) {
      if (!nodeIds.has(edge.from)) {
        return err(`Unknown source node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        return err(`Unknown target node: ${edge.to}`);
      }
    }

    const result = topologicalSort(nodes, edges);
    if (result.order.length !== nodes.length) {
      return err("Cycle detected in graph");
    }

    return ok();
  };

  /**
   * Groups nodes into execution layers. Within each layer, all nodes
   * are independent and can run in parallel.
   * A node's layer = max(layer of all parents) + 1. Roots are at layer 0.
   * @param {Node[]} nodes
   * @param {Edge[]} edges
   * @returns {string[][]}
   */
  const getExecutionLayers = (nodes, edges) => {
    const { order } = topologicalSort(nodes, edges);

    /** @type {Map<string, string[]>} */
    const parents = new Map();
    for (const node of nodes) parents.set(node.id, []);
    for (const edge of edges) parents.get(edge.to).push(edge.from);

    /** @type {Map<string, number>} */
    const layerOf = new Map();

    for (const nodeId of order) {
      const parentLayers = parents.get(nodeId).map((p) => layerOf.get(p) || 0);
      layerOf.set(
        nodeId,
        parentLayers.length === 0 ? 0 : Math.max(...parentLayers) + 1
      );
    }

    /** @type {Map<number, string[]>} */
    const layerGroups = new Map();
    for (const [nodeId, layer] of layerOf) {
      if (!layerGroups.has(layer)) layerGroups.set(layer, []);
      layerGroups.get(layer).push(nodeId);
    }

    const maxLayer = Math.max(...layerOf.values(), -1);
    const layers = [];
    for (let i = 0; i <= maxLayer; i++) {
      layers.push(layerGroups.get(i) || []);
    }
    return layers;
  };

  return { validate, topologicalSort, getExecutionLayers };
};

module.exports = { graph };
