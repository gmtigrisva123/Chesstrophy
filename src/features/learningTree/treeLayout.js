// @ts-check
import { TREE_DATA } from "../../data/learningTree.js";

// ── Flatten all nodes for easy lookup ────────────────────────────────────────
function flattenTree(node, result = []) {
  result.push(node);
  (node.children || []).forEach(c => flattenTree(c, result));
  return result;
}
const ALL_NODES = flattenTree(TREE_DATA);

// ── SVG layout ────────────────────────────────────────────────────────────────
// Root at the top, each branch fanning out below it. These are pure functions of
// the tree data, so they live here rather than inside the page component — where
// they would be rebuilt on every render and defeat the memoisation around them.

const BRANCH_SPACING = 160; // horizontal spacing per branch
const LAYER_HEIGHT   = 150; // vertical spacing per depth level

/**
 * Positions every node in the tree, returning a copy annotated with screen
 * coordinates (`sx`, `sy`) and its `depth`.
 *
 * @param {object} node - Tree node with an optional `children` array.
 * @param {number} [depth] - Depth of `node`, 0 for the root.
 * @param {number} [branchIdx] - Index of `node` among its siblings, centred on 0.
 * @param {number} [totalBranches] - Number of siblings at this level.
 * @returns {object} The node with `sx`, `sy`, `depth` and positioned `children`.
 */
function nodeCoords(node, depth = 0, branchIdx = 0, totalBranches = 1) {
  const x = (branchIdx - (totalBranches - 1) / 2) * BRANCH_SPACING * (depth === 0 ? 1 : 0.75);
  const y = depth * LAYER_HEIGHT;
  const children = node.children || [];
  return {
    ...node,
    sx: x,
    sy: y,
    depth,
    children: children.map((c, i) => nodeCoords(c, depth + 1, i - (children.length - 1) / 2, children.length)),
  };
}

/**
 * Depth-first flatten of a positioned tree.
 *
 * @param {object} node - A node returned by {@link nodeCoords}.
 * @param {object[]} [result] - Accumulator, for the recursive calls.
 * @returns {object[]} Every node, parents before children.
 */
function flatCoords(node, result = []) {
  result.push(node);
  (node.children || []).forEach(c => flatCoords(c, result));
  return result;
}

/**
 * Derives the parent→child line segments of a positioned tree.
 *
 * @param {object} node - A node returned by {@link nodeCoords}.
 * @param {object[]} [result] - Accumulator, for the recursive calls.
 * @returns {{x1: number, y1: number, x2: number, y2: number, color: string, id: string}[]}
 */
function buildEdges(node, result = []) {
  (node.children || []).forEach(c => {
    result.push({ x1: node.sx, y1: node.sy, x2: c.sx, y2: c.sy, color: c.color || "#888", id: c.id });
    buildEdges(c, result);
  });
  return result;
}

// ── Node status helper ────────────────────────────────────────────────────────
function getNodeStatus(nodeId, unlockedNodes, nodeProgress) {
  if (!unlockedNodes.includes(nodeId)) return "locked";
  const progress = nodeProgress[nodeId] || 0;
  if (progress >= 100) return "mastered";
  if (progress > 0)    return "inprogress";
  return "unlocked";
}

export {
  flattenTree,
  ALL_NODES,
  nodeCoords,
  flatCoords,
  buildEdges,
  getNodeStatus,
};
