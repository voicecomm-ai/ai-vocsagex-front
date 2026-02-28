
import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

export const useLoop = () => {
  const reactFlowInstance = useReactFlow();

  /**
   * 计算子节点边界并返回所需的最小尺寸
   * @param {string} parentId - 父节点ID
   * @returns {{width: number, height: number} | null} - 所需的最小尺寸，如果无法计算则返回null
   */
  const calculateChildNodesBounds = useCallback(
    (parentId) => {
      const nodes = reactFlowInstance.getNodes();
      const parentNode = reactFlowInstance.getNode(parentId) || 
        nodes.find((node) => node.id === parentId);
      
      if (!parentNode) return null;

      // 获取所有子节点（排除 loop-start 节点）
      const childNodes = nodes.filter(
        (node) => node.parentId === parentId && node.type !== "loop-start" && node.type !== "iteration-start"
      );

      // 如果没有子节点，返回null
      if (childNodes.length === 0) return null;

      // 计算子节点的包围盒
      let minX = Infinity;
      let minY = Infinity;
      let maxRight = -Infinity;
      let maxBottom = -Infinity;

      // Header 高度（55px）- 子节点的位置是相对于父节点的，需要考虑 header
      const headerHeight = 55;
      
      childNodes.forEach((childNode) => {
        const childX = childNode.position?.x || 0;
        // 子节点的 y 坐标是相对于父节点的，如果小于 header 高度，说明在 header 区域
        // 我们需要确保计算时考虑实际的子节点位置
        const childY = childNode.position?.y || 0;
        // 获取子节点的实际尺寸
        const childWidth = childNode.measured?.width || childNode.width || 320;
        const childHeight =
          childNode.measured?.height || childNode.height || 100;

        // 计算子节点的边界
        minX = Math.min(minX, childX);
        // 如果子节点的 y 坐标小于 header 高度，说明它可能被 header 遮挡
        // 但我们仍然使用实际的 y 坐标，因为 ReactFlow 可能会自动调整
        minY = Math.min(minY, childY);
        const childRight = childX + childWidth;
        const childBottom = childY + childHeight;
        maxRight = Math.max(maxRight, childRight);
        maxBottom = Math.max(maxBottom, childBottom);
      });

      // 如果没有有效的子节点位置信息，返回null
      if (
        !isFinite(minX) ||
        !isFinite(minY) ||
        !isFinite(maxRight) ||
        !isFinite(maxBottom)
      ) {
        return null;
      }

      // 添加边距（确保子节点不会紧贴边界）
      const margin = 20;

      // 计算父节点需要的最小尺寸
      const minRequiredWidth =
        minX < 0
          ? maxRight - minX + margin * 2
          : maxRight + margin;

      const minRequiredHeight =
        minY < 0
          ? maxBottom - minY + margin * 2
          : maxBottom + margin;

      // 确保最小尺寸
      const absoluteMinWidth = 500;
      const absoluteMinHeight = 200;

      // 计算实际需要的最小尺寸
      const requiredWidth = Math.max(minRequiredWidth, absoluteMinWidth);
      const requiredHeight = Math.max(minRequiredHeight, absoluteMinHeight);

      return {
        width: requiredWidth +36,
        height: requiredHeight +72,
      };
    },
    [reactFlowInstance]
  );

  /**
   * 自动调整父节点尺寸以适应子节点
   * @param {string} parentId - 父节点ID
   * @param {HTMLElement} parentElement - 父节点的DOM元素（用于获取padding等样式）
   */
  const autoResizeParentNode = useCallback(
      (changes,setNodes,nodes) => {
      try {
        let dimensionsNode = changes.find((change) => change.type === "dimensions");
      
        if(!dimensionsNode) return;
        let nodeId = dimensionsNode.id;
       let nowNode = reactFlowInstance.getNode(nodeId);
       if(!nowNode) return;
       let parentId = nowNode.parentId;
       if(!parentId) return;
        const bounds = calculateChildNodesBounds(parentId);
        if (!bounds) return;
    
        const parentNode = nodes.find((node) => node.id === parentId);
        if (!parentNode) return;

        // 获取父节点当前尺寸
        const currentWidth = parentNode.width || parentNode.measured?.width || 500;
        const currentHeight = parentNode.height || parentNode.measured?.height || 200;
        // 检查是否需要调整尺寸
        const needsWidthResize = bounds.width > currentWidth;
        const needsHeightResize = bounds.height > currentHeight;

        if (needsWidthResize || needsHeightResize) {
          // 更新节点尺寸
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === parentId) {
                return {
                  ...node,
                  width: needsWidthResize ? bounds.width : node.width,
                  height: needsHeightResize ? bounds.height : node.height,
                  measured  : {
                    ...node.measured,
                    width: needsWidthResize ? bounds.width : node.measured?.width,
                    height: needsHeightResize ? bounds.height : node.measured?.height,
                  },
                };
              }
              return node;
            })
          );
        }
      } catch (error) {
        console.error('autoResizeParentNode 执行出错:', error);
      }
    },
    [reactFlowInstance, calculateChildNodesBounds]
  );

  return {
    calculateChildNodesBounds,
    autoResizeParentNode,
  };
};
