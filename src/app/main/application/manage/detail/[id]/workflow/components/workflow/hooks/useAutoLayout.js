import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import dagre from "@dagrejs/dagre";

const LAYOUT_PADDING_X = 40;
const LAYOUT_PADDING_Y = 20;
const CHILD_PARENT_TOP_SPACING = 64;
const DEFAULT_NODE_SIZE = { width: 180, height: 80 };
const LOOP_START_HORIZONTAL_GAP = 48;
const DAGRE_CONFIG = {
  rankdir: "LR",
  nodesep: 30,
  ranksep: 120,
};

/**
 * 将节点自动布局逻辑抽离为独立 Hook，便于在不同场景复用
 */
export const useAutoLayout = () => {
  const reactFlowInstance = useReactFlow();

  const getNodeSize = useCallback(
    (node) => ({
      width: node.measured?.width || node.width || DEFAULT_NODE_SIZE.width,
      height: node.measured?.height || node.height || DEFAULT_NODE_SIZE.height,
    }),
    []
  );

  const collectNodesForLayout = useCallback(
    (nodes, parentId) =>
      parentId
        ? nodes.filter(
            (node) =>
              node.parentId === parentId &&
              node.type !== "loop-start" &&
              node.type !== "iteration-start"
          )
        : nodes.filter(
            (node) =>
              !node.parentId &&
              node.type !== "loop-start" &&
              node.type !== "iteration-start"
          ),
    []
  );

  const collectLoopStartNodes = useCallback(
    (nodes, parentId) =>
      parentId
        ? nodes.filter(
            (node) =>
              node.parentId === parentId &&
              (node.type === "loop-start" || node.type === "iteration-start")
          )
        : nodes.filter(
            (node) =>
              !node.parentId &&
              (node.type === "loop-start" || node.type === "iteration-start")
          ),
    []
  );

  const buildDagrePositions = useCallback(
    (nodesToLayout, edges) => {
      if (nodesToLayout.length === 0) return null;

      if (nodesToLayout.length === 1) {
        return {
          dagrePositions: {
            [nodesToLayout[0].id]: { x: 0, y: 0 },
          },
          minX: 0,
          minY: 0,
        };
      }

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setGraph(DAGRE_CONFIG);
      dagreGraph.setDefaultEdgeLabel(() => ({}));

      const nodeIdSet = new Set();

      nodesToLayout.forEach((node) => {
        const { width, height } = getNodeSize(node);
        dagreGraph.setNode(node.id, { width, height });
        nodeIdSet.add(node.id);
      });

      edges.forEach((edge) => {
        if (nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
          dagreGraph.setEdge(edge.source, edge.target);
        }
      });

      dagre.layout(dagreGraph);

      let minX = Infinity;
      let minY = Infinity;
      const dagrePositions = {};

      nodesToLayout.forEach((node) => {
        const dagreNode = dagreGraph.node(node.id);
        if (!dagreNode) return;
        const { width, height } = getNodeSize(node);
        const x = dagreNode.x - width / 2;
        const y = dagreNode.y - height / 2;
        dagrePositions[node.id] = { x, y };
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      });

      return { dagrePositions, minX, minY };
    },
    [getNodeSize]
  );

  const applyAutoLayoutForParent = useCallback(
    (parentId = null) => {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();
      const nodesToLayout = collectNodesForLayout(nodes, parentId);
      const loopStartNodes = collectLoopStartNodes(nodes, parentId);
      const dagreResult = buildDagrePositions(nodesToLayout, edges);

      if (!dagreResult && loopStartNodes.length === 0) return;

      const { dagrePositions = {}, minX = 0, minY = 0 } = dagreResult || {};
      const paddingY = parentId ? CHILD_PARENT_TOP_SPACING : LAYOUT_PADDING_Y;
      const baseY = paddingY;

      const shouldReserveLoopStartSpace =
        loopStartNodes.length > 0 && nodesToLayout.length > 0;

      let loopStartOffsetX = 0;
      const loopStartSizes = {};
      if (shouldReserveLoopStartSpace) {
        loopStartNodes.forEach((node) => {
          const size = getNodeSize(node);
          loopStartSizes[node.id] = size;
          loopStartOffsetX = Math.max(loopStartOffsetX, size.width);
        });
        loopStartOffsetX += LOOP_START_HORIZONTAL_GAP;
      }

      const baseX = LAYOUT_PADDING_X + loopStartOffsetX;
      const nodesMap = new Map(nodes.map((node) => [node.id, node]));

      const finalNodePositions = Object.entries(dagrePositions).reduce(
        (acc, [nodeId, position]) => {
          acc[nodeId] = {
            x: position.x - minX + baseX,
            y: position.y - minY + baseY,
          };
          return acc;
        },
        {}
      );

      const loopStartPositions = {};
      if (loopStartNodes.length) {
        loopStartNodes.forEach((loopNode) => {
          // 如果 loop-start 节点已有位置，保持原位置不变
          if (loopNode.position && (loopNode.position.x !== undefined || loopNode.position.y !== undefined)) {
            loopStartPositions[loopNode.id] = {
              x: loopNode.position.x,
              y: loopNode.position.y,
            };
            return;
          }

          // 如果没有位置，则按原逻辑计算位置
          const size = loopStartSizes[loopNode.id] || getNodeSize(loopNode);
          const linkedEdge = edges.find(
            (edge) => edge.source === loopNode.id && finalNodePositions[edge.target]
          );

          if (linkedEdge) {
            const targetNode = nodesMap.get(linkedEdge.target);
            const targetSize = targetNode ? getNodeSize(targetNode) : DEFAULT_NODE_SIZE;
            const targetPos = finalNodePositions[linkedEdge.target];
            loopStartPositions[loopNode.id] = {
              x: LAYOUT_PADDING_X,
              y: targetPos.y + (targetSize.height - size.height) / 2,
            };
          } else {
            loopStartPositions[loopNode.id] = {
              x: LAYOUT_PADDING_X,
              y: baseY,
            };
          }
        });
      }

      reactFlowInstance.setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (finalNodePositions[node.id]) {
            return {
              ...node,
              position: finalNodePositions[node.id],
            };
          }

          if (loopStartPositions[node.id]) {
            return {
              ...node,
              position: loopStartPositions[node.id],
            };
          }

          return node;
        })
      );
    },
    [
      buildDagrePositions,
      collectLoopStartNodes,
      collectNodesForLayout,
      getNodeSize,
      reactFlowInstance,
    ]
  );

  const applyAutoLayoutForAllNodes = useCallback(() => {
    const nodes = reactFlowInstance.getNodes();
    const parentIds = new Set([null]);

    nodes.forEach((node) => {
      if (node.parentId) {
        parentIds.add(node.parentId);
      }
    });

    parentIds.forEach((parentId) => {
      applyAutoLayoutForParent(parentId);
    });
  }, [applyAutoLayoutForParent, reactFlowInstance]);

  return {
    applyAutoLayoutForParent,
    applyAutoLayoutForAllNodes,
  };
};


