/**
 * 工作流节点交互处理 Hook
 * 
 * 该文件提供了工作流编辑器中节点相关的交互功能，包括：
 * - 节点删除：支持删除节点及其所有子节点，并清理相关边连接
 * - 节点复制：支持普通节点和循环节点的复制，自动生成唯一标题和位置偏移
 * - 节点更新：更新节点数据并触发内部状态刷新
 * - 节点连接状态判断：检查节点的连接情况
 * 
 * @module useNodesInteractions
 */

import { useCallback } from "react";
import {
  useStoreApi,
  useReactFlow,
  useUpdateNodeInternals,
  getConnectedEdges,
} from "@xyflow/react";
import { produce } from "immer";
import {
  getNodesConnectedSourceOrTargetHandleIdsMap,
  getTopLeftNodePosition,
} from "../utils";
import {
  BlockEnum,
  NODES_INITIAL_DATA,
  CUSTOM_ITERATION_START_NODE,
} from "../types";
import _ from "lodash";
import { useStore } from "@/store/index";
import { generateNewNode } from "../utils";
import { useDataUpdate } from "./useDataUpdate";
import { useDataVerify } from "./useDataVerify";
import { message } from "antd";
import { getUuid } from "@/utils/utils";

/**
 * 标题后缀正则表达式
 * 用于匹配形如 "标题 (数字)" 的格式，例如："节点名称 (1)"
 */
const TITLE_SUFFIX_REGEX = /^(.+?)\s*\((\d+)\)\s*$/;

/**
 * 规范化标题元数据
 * 将标题解析为基础名称和序号后缀
 * 
 * @param {string} title - 原始标题
 * @returns {Object} 包含 base（基础名称）和 suffix（序号）的对象
 * @example
 * normalizeTitleMeta("节点名称 (2)") // { base: "节点名称", suffix: 2 }
 * normalizeTitleMeta("节点名称") // { base: "节点名称", suffix: 0 }
 */
const normalizeTitleMeta = (title = "") => {
  const safeTitle = typeof title === "string" ? title.trim() : "";
  if (!safeTitle) {
    return { base: "", suffix: 0 };
  }
  const match = safeTitle.match(TITLE_SUFFIX_REGEX);
  if (match) {
    return {
      base: match[1].trim(),
      suffix: Number.parseInt(match[2], 10) || 0,
    };
  }
  return { base: safeTitle, suffix: 0 };
};

/**
 * 限制标题长度
 * 如果标题超过50个字符，则截断到50个字符
 * 
 * @param {string} title - 原始标题
 * @returns {string} 截断后的标题
 */
const clampTitleLength = (title) =>
  title.length > 50 ? title.substring(0, 50) : title;

/**
 * 构建唯一标题
 * 根据现有节点列表，为给定标题生成一个唯一的标题（带序号）
 * 
 * @param {string} title - 原始标题
 * @param {Array} existingNodes - 现有节点列表
 * @returns {string} 唯一的标题，格式为 "基础名称 (序号)"
 * @example
 * buildUniqueTitle("节点", [节点1, 节点2]) // "节点 (3)"
 */
const buildUniqueTitle = (title, existingNodes = []) => {
  if (!title) return "";
  // 提取标题的基础部分
  const { base } = normalizeTitleMeta(title);
  // 查找所有具有相同基础名称的节点的序号
  const suffixes = existingNodes
    .map((node) => normalizeTitleMeta(node?.data?.title || ""))
    .filter(({ base: candidateBase }) => candidateBase === base)
    .map(({ suffix }) => suffix);
  // 计算下一个序号（最大值 + 1，如果没有则从1开始）
  const nextSuffix = suffixes.length ? Math.max(...suffixes) + 1 : 1;
  return clampTitleLength(`${base} (${nextSuffix})`);
};

/**
 * 获取标题中的序号
 * 从标题中提取序号后缀，如果没有则返回0
 * 
 * @param {string} title - 标题字符串
 * @returns {number} 序号值，如果没有则返回0
 * @example
 * getTitleSuffixIndex("节点名称 (3)") // 3
 * getTitleSuffixIndex("节点名称") // 0
 */
const getTitleSuffixIndex = (title = "") => {
  const match = title.match(TITLE_SUFFIX_REGEX);
  return match ? Number.parseInt(match[2], 10) || 0 : 0;
};
/**
 * 节点交互处理 Hook
 * 
 * 提供工作流编辑器中节点的各种交互功能，包括删除、复制、更新等操作
 * 
 * @returns {Object} 包含各种节点交互处理函数的对象
 * @returns {Function} handleNodeDelete - 节点删除处理函数
 * @returns {Function} handleNodeCopy - 节点复制处理函数
 * @returns {Function} updateNodeDetail - 节点详情更新函数
 * @returns {Function} handleNodeEnter - 节点进入事件处理函数
 * @returns {Function} handleNodeLeave - 节点离开事件处理函数
 * @returns {Function} isNodeConnected - 节点连接状态判断函数
 */
export const useNodesInteractions = () => {
  // 获取 React Flow 的 Store API
  const store = useStoreApi();
  // 从全局状态中获取需要的状态和方法
  const {
    panelVisible,        // 面板是否可见
    runVisible,         // 运行面板是否可见
    setPanelVisible,    // 设置面板可见性
    pannerNode,         // 当前面板节点
    setPannerNode,      // 设置面板节点
    setRunVisible,      // 设置运行面板可见性
    setUpdateTime,      // 设置更新时间
    viewportZoom,       // 视口缩放级别
    setViewportZoom,    // 设置视口缩放
    setChangeId,        // 设置变更ID
    setChangeNodeType   // 设置变更节点类型
  } = useStore((state) => state);

  // 获取 React Flow 实例
  const reactFlowInstance = useReactFlow();
  // 获取更新节点内部的函数
  const updateNodeInternals = useUpdateNodeInternals();
  // 获取防抖的工作流更新函数
  const { debouncedUpdateWorkflow } = useDataUpdate();
  // 获取 MCP 可用性检查函数
  const { checkMcpAvailable, checkNodeAvailable } = useDataVerify();
  
  /**
   * 节点删除事件处理函数
   * 删除指定节点及其所有子节点，并清理相关的边连接
   * 
   * @param {string} nodeId - 要删除的节点ID
   * @description 
   * - 禁止删除开始节点（Start 节点）
   * - 递归删除所有子节点（包括子节点的子节点）
   * - 自动清理与删除节点相关的所有边
   * - 更新父节点的 _children 属性
   * - 触发工作流更新（防抖）
   */
  const handleNodeDelete = useCallback(
    (nodeId) => {
      try {

  
        // 获取当前状态：节点列表和边列表
        let { nodes, edges, setNodes, setEdges } = store.getState();
  
        // 找到要删除的节点
        const currentNode = nodes.find((n) => n.id === nodeId);
        if (!currentNode) return;
  
        // 禁止删除开始节点（Start 节点是工作流的入口，不允许删除）
        if (currentNode.data?.type === BlockEnum.Start) {
          return;
        }
  
        /**
         * 递归收集所有子节点 ID（包括子节点的子节点）
         * 这是一个递归函数，用于获取所有层级的子节点
         * 
         * @param {string} parentId - 父节点ID
         * @param {Array} allNodes - 所有节点列表
         * @returns {Array} 所有子节点的ID数组
         */
        const collectChildIds = (parentId, allNodes) => {
          // 查找直接子节点
          const children = allNodes.filter((n) => n.parentId === parentId);
          // 递归收集子节点的子节点，并扁平化结果
          return children.flatMap((child) => [
            child.id,
            ...collectChildIds(child.id, allNodes),
          ]);
        };
  
        // 收集所有需要删除的节点ID（包括当前节点和所有子节点）
        const allChildIds = collectChildIds(nodeId, nodes);
        const idsToDelete = [nodeId, ...allChildIds];
  
  
        // 过滤掉要删除的节点，生成新的节点列表
        const newNodes = nodes.filter((n) => !idsToDelete.includes(n.id));
  
        // 删除所有与这些节点相关的边
        // 边的源节点或目标节点如果是要删除的节点，则该边也需要删除
        const newEdges = edges.filter(
          (e) =>
            !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
        );
  
        // 如果有父节点，更新父节点的 _children 属性
        // 从父节点的子节点列表中移除被删除的节点
        if (currentNode.parentId) {
          const parentIndex = newNodes.findIndex(
            (n) => n.id === currentNode.parentId
          );
          if (parentIndex !== -1) {
            const parent = newNodes[parentIndex];
            // 过滤掉被删除的子节点
            parent.data._children = parent.data._children?.filter(
              (c) => !idsToDelete.includes(c.nodeId)
            );
          }
        }

        // 从 React Flow 实例中删除节点元素
        reactFlowInstance.deleteElements({
          nodes: idsToDelete.map((id) => ({ id })),
        });
    
        // 更新 React Flow 的节点和边状态
        reactFlowInstance.setNodes(newNodes);
        reactFlowInstance.setEdges(newEdges);
  
        // 触发工作流更新（使用防抖函数，避免频繁更新）
        debouncedUpdateWorkflow();
  
      } catch (error) {
        console.error('handleNodeDelete error:', error);
      }
    },
    [store, reactFlowInstance, debouncedUpdateWorkflow]
  );
  

  /**
   * 节点复制事件处理函数
   * 
   * @param {string} nodeId - 要复制的节点ID
   * @description 支持普通节点和循环节点（loop）的复制
   * - 普通节点：复制节点本身，并计算偏移位置避免重叠
   * - 循环节点：复制 loop 节点及其所有子节点，同时复制内部的边连接关系
   * - 特殊处理：MCP 节点复制前会检查是否已下架
   * - 自动生成唯一标题：为复制的节点生成带序号的唯一标题
   * - 位置偏移：计算新节点的位置，避免与原有节点重叠
   * 
   * @returns {Promise<void>}
   */
  const handleNodeCopy = useCallback(
    async (nodeId) => {
      // 参数校验：如果节点ID不存在，直接返回
      if (!nodeId) return;

      // 获取当前的节点和边数据（深拷贝，避免直接修改原数据）
      const nodeData = _.cloneDeep(reactFlowInstance.getNodes());
      const edges = _.cloneDeep(reactFlowInstance.getEdges());
      // 用于存储循环节点的子节点列表
      let childNodes=[];

      // 查找要复制的节点，并排除不允许复制的节点类型
      let findData = nodeData.find(
        (node) =>
          node.id === nodeId &&
          node.data.type !== BlockEnum.Start && // 起始节点不允许复制（工作流入口）
          node.data.type !== BlockEnum.LoopEnd  // 循环结束节点不允许复制（由系统自动管理）
      );

      // 如果找不到要复制的节点，直接返回
      if (!findData) return;
      let nodeToCopy = JSON.parse(JSON.stringify(findData));
      // MCP 节点特殊处理：复制前检查节点是否已下架
      // MCP（Model Context Protocol）节点需要验证其可用性
      if (nodeToCopy.type === "mcp") {
        const isAvailable = await checkMcpAvailable(nodeToCopy.data.mcp_id);
        if (!isAvailable) {
          message.warning("当前 MCP 已下架!");
          return;
        }
      }
      if (nodeToCopy.type === "agent" || nodeToCopy.type === "workflow") {
        const isAvailable = await checkNodeAvailable(nodeToCopy.data.appId);
        if (!isAvailable) {
          message.warning("模板已下架!");
          return;
        }
      }
      // 获取原始节点的位置信息（左上角坐标）
      const { x, y } = getTopLeftNodePosition([nodeToCopy]);
      const measured = nodeToCopy.measured; // 节点的测量尺寸信息

      // 计算新节点的偏移量，避免与原有节点重叠
      // 基础偏移：节点宽度 + 间距，或使用默认值
      const baseOffsetX = measured?.width || 200;
      const baseOffsetY = (measured?.height || 100) + 50;
      
      // 为循环节点生成唯一标题，并计算复制索引
      const nodesForTitle = [...nodeData];
      const uniqueLoopTitle = buildUniqueTitle(
        nodeToCopy.data.title,
        nodesForTitle
      );
      // 计算复制索引（用于累加偏移）
      const loopCopyIndex = Math.max(
        0,
        getTitleSuffixIndex(uniqueLoopTitle) - 1
      );
      // 累加偏移：每个复制节点额外偏移 20px，避免完全重叠
      const offsetX = baseOffsetX + 20 * loopCopyIndex;
      const offsetY = baseOffsetY + 20 * loopCopyIndex;

      // 初始化数据映射和待粘贴的节点/边数组
      const idMapping = {};      // 原始节点ID -> 新节点ID 的映射关系（用于更新边的连接）
      const nodesToPaste = [];   // 待添加的新节点数组
      const edgesToPaste = [];   // 待添加的新边数组

      /**
       * ========================================
       * 循环节点（loop）的特殊复制逻辑
       * ========================================
       * 循环节点需要复制：
       * 1. Loop 节点本身
       * 2. Loop 节点内的所有子节点
       * 3. 子节点之间的边连接关系
       */
      // 判断是否为循环节点（loop 或 iteration 类型）
      if (nodeToCopy.type === "loop" || nodeToCopy.type === "iteration") {
        // ========== 步骤1：查找所有属于该 loop 节点的子节点 ==========
        // 通过 parentId 查找所有直接子节点
        childNodes = nodeData.filter((n) => n.parentId === nodeId);
        // 为新的循环开始节点生成唯一ID
        let newLoopStarNodeId = getUuid();
        
        // ========== 计算新节点的 zIndex ==========
        // 计算原节点子节点的最大 zIndex（用于首次复制）
        const originalChildMaxZIndex = childNodes.length > 0
          ? Math.max(...childNodes.map((n) => n.zIndex || 0))
          : -1;
        
        // 查找所有已存在的同类型节点（loop 或 iteration），排除原节点本身
        // 这些节点可能是之前复制的结果
        const sameTypeNodes = nodeData.filter(
          (n) => n.type === nodeToCopy.type && n.id !== nodeId
        );
        
        // 计算所有已复制节点的子节点的最大 zIndex（用于重复复制）
        let copiedChildMaxZIndex = -1;
        if (sameTypeNodes.length > 0) {
          // 对每个已复制的同类型节点，查找其所有子节点
          const allCopiedChildNodes = sameTypeNodes.flatMap((parentNode) =>
            nodeData.filter((n) => n.parentId === parentNode.id)
          );
          // 计算这些子节点的最大 zIndex
          if (allCopiedChildNodes.length > 0) {
            copiedChildMaxZIndex = Math.max(
              ...allCopiedChildNodes.map((n) => n.zIndex || 0)
            );
          }
        }
        
        // 计算新父节点的 zIndex
        // 如果是首次复制：使用原节点子节点的最大 zIndex + 1
        // 如果是重复复制：使用已复制节点子节点的最大 zIndex + 1
        // 如果两者都没有子节点，则使用原节点 zIndex + 1（兜底逻辑）
        let newParentZIndex;
        if (copiedChildMaxZIndex >= 0) {
          // 重复复制：使用已复制节点子节点的最大 zIndex + 1
          newParentZIndex = copiedChildMaxZIndex + 1;
        } else if (originalChildMaxZIndex >= 0) {
          // 首次复制：使用原节点子节点的最大 zIndex + 1
          newParentZIndex = originalChildMaxZIndex + 1;
        } else {
          // 兜底逻辑：如果原节点和已复制节点都没有子节点，使用原节点 zIndex + 1
          const originalZIndex = nodeToCopy.zIndex || 0;
          newParentZIndex = originalZIndex + 1;
        }
        
        // 计算新子节点的 zIndex（父节点 zIndex + 1）
        const newChildZIndex = newParentZIndex + 1;
        
        // ========== 步骤2：创建新的 loop 节点 ==========
        const { newNode: newLoopNode } = generateNewNode({
          type: nodeToCopy.type, // 保持原节点类型
          data: {
            ...NODES_INITIAL_DATA[nodeToCopy.data.type], // 合并节点类型的初始数据
            ...nodeToCopy.data,                          // 合并原节点的数据
            selected: false,                             // 取消选中状态
            _isBundled: false,                           // 重置打包状态
            title: uniqueLoopTitle,                      // 生成新标题（带序号）
            start_node_id: newLoopStarNodeId             // 设置新的开始节点ID
          },
          start_node_id: newLoopStarNodeId,              // 设置开始节点ID
          position: {
            x: nodeToCopy.position.x + offsetX,         // 新位置：原位置 + 偏移量
            y: nodeToCopy.position.y + offsetY,
          },
          selected: false,
          zIndex: newParentZIndex,                       // 设置父节点层级
        });

        // 复制原循环节点的宽高（measured 属性），保持尺寸一致
        if (nodeToCopy.measured) {
          newLoopNode.measured = nodeToCopy.measured;
          newLoopNode.width = nodeToCopy.width;
          newLoopNode.height = nodeToCopy.height;
        }
        newLoopNode.zIndex =newParentZIndex;
        // 建立原始 loop 节点到新 loop 节点的 ID 映射（用于后续更新边的连接）
        idMapping[nodeToCopy.id] = newLoopNode.id;
        nodesToPaste.push(newLoopNode);

        // ========== 步骤3：复制所有子节点 ==========
        childNodes.forEach((child) => {
          const nodeType = child.data.type;
          // 为子节点生成唯一标题（考虑已存在的节点和新创建的节点）
          const childTitle = buildUniqueTitle(child.data.title, [
            ...nodeData,
            ...nodesToPaste,
          ]);
          
          // 创建新的子节点
          const { newNode: newChild } = generateNewNode({
            type: child.type,                            // 保持原子节点类型
            data: {
              ...NODES_INITIAL_DATA[nodeType],          // 合并节点类型的初始数据
              ...child.data,                             // 合并原子节点的数据
              selected: false,                           // 取消选中状态
              _isBundled: false,                         // 重置打包状态
              title: childTitle,                         // 生成新标题（带序号）
            },
            position: {
              // 子节点位置：保持相对于 loop 节点的相对位置
              // 注意：这里使用的是相对位置，因为子节点会跟随父节点移动
              x: child.position.x,
              y: child.position.y,
            },
            selected: false,
            zIndex: newChildZIndex,                      // 设置子节点层级（父节点 zIndex + 1）
          });
          
          // 复制原子节点的宽高（measured 属性），保持尺寸一致
          if (child.measured) {
            newChild.measured = {
              width: child.measured.width,
              height: child.measured.height,
            };
          }
          
          // 关键：设置新子节点的父节点ID为新创建的 loop 节点ID
          // 这样新子节点就会成为新 loop 节点的子节点
          newChild.parentId = newLoopNode.id;
          
          // 特殊处理：循环开始节点（loop-start 或 iteration-start）
          // 需要设置 loop_id 和 id，确保循环结构正确
          if (newChild.type === 'loop-start' || newChild.type === 'iteration-start') {
                  // 设置循环ID
            newChild.data.loop_id =newChild.type === 'loop-start' ? newLoopNode.id : null;      // 设置数据中的循环ID
            newChild.id = newLoopStarNodeId;             // 使用预生成的开始节点ID
            newChild.data.id = newLoopStarNodeId;  
            newChild.data.iteration_id = newChild.type === 'iteration-start' ? newLoopNode.id : null;   // 设置数据中的批处理ID
          }
          if(newLoopNode.type === 'iteration'){
            newChild.data.iteration_id = newLoopNode.id;
          }
          if(newLoopNode.type === 'loop'){
            newChild.data.loop_id = newLoopNode.id;
          }

          // 建立原始子节点到新子节点的 ID 映射（用于后续更新边的连接）
          idMapping[child.id] = newChild.id;
        
          // 将新子节点添加到待粘贴列表
          nodesToPaste.push(newChild);
        });
        // ========== 步骤4：复制循环节点内部的边连接 ==========
        // 筛选出所有子节点之间的边（边的源节点和目标节点都在子节点列表中）
        // 这些边是循环节点内部的连接，需要一起复制
        const childNodeIds = childNodes.map((c) => c.id);
        const loopEdges = edges.filter(
          (edge) =>
            childNodeIds.includes(edge.source) &&    // 源节点是子节点
            childNodeIds.includes(edge.target)       // 目标节点也是子节点
        );

        // 为每条边创建新的边，并更新源节点和目标节点的ID
        loopEdges.forEach((edge) => {
          // 判断是否为特殊边（if-else 或 question-classifier 类型）
          // 这些类型的边需要保留原始的 sourceHandle
          let isSpecialEdge = edge.data.sourceType === 'if-else' || 
                             edge.data.sourceType === 'question-classifier' 
                             ? true : false;
          
          // 创建新边
          const newEdge = {
            ...edge,                                    // 复制边的所有属性
            id: getUuid(),                              // 生成新的边ID
            source: idMapping[edge.source],             // 更新源节点ID（使用映射后的新ID）
            target: idMapping[edge.target],             // 更新目标节点ID（使用映射后的新ID）
            // 特殊边保留原始 sourceHandle，普通边使用默认格式
            sourceHandle: isSpecialEdge 
              ? edge.sourceHandle 
              : idMapping[edge.source] + '-source',
            // 目标句柄使用默认格式
            targetHandle: idMapping[edge.target] + '-target',      
          };
          edgesToPaste.push(newEdge);
        });
 
        
        // ========== 步骤5：更新 ReactFlow 实例，添加新节点和新边 ==========
        reactFlowInstance.setNodes([...nodeData, ...nodesToPaste]);
        reactFlowInstance.setEdges([...edges, ...edgesToPaste]);
        return;
      }
      else {
        /**
         * ========================================
         * 普通节点的复制逻辑
         * ========================================
         * 普通节点只需要复制节点本身，不需要处理子节点和内部边
         */
        
        // 为普通节点生成唯一标题
        const uniqueTitle = buildUniqueTitle(nodeToCopy.data.title, [
          ...nodeData,
          ...nodesToPaste,
        ]);
        // 计算复制索引（用于位置偏移）
        const copyIndex = Math.max(0, getTitleSuffixIndex(uniqueTitle) - 1);
        
        // 如果节点有父节点，需要计算相对于父节点的偏移
        // 查找所有同级节点（具有相同父节点的节点）
        const siblingNodes = nodeToCopy.parentId
          ? nodeData.filter((node) => node.parentId === nodeToCopy.parentId)
          : [];
        const siblingCount = siblingNodes.length;
        
        // 计算偏移量
        // 如果有父节点，使用基于同级节点数量的偏移
        const childOffsetX = baseOffsetX + 20 * siblingCount;
        const childOffsetY = baseOffsetY + 20 * siblingCount;
        // 如果没有父节点，使用基于复制索引的偏移
        const nodeType = nodeToCopy.data.type;
        const offsetX = baseOffsetX + 20 * copyIndex;
        const offsetY = baseOffsetY + 20 * copyIndex;
        
        // 根据是否有父节点选择不同的偏移量
        let newX = nodeToCopy.parentId ? childOffsetX : offsetX;
        let newY = nodeToCopy.parentId ? childOffsetY : offsetY;
        let  prompt_template=[];

        // 创建新的普通节点
        const { newNode } = generateNewNode({
          type: nodeToCopy.type,                        // 保持原节点类型
          data: {
            ...NODES_INITIAL_DATA[nodeType],            // 合并节点类型的初始数据
            ...nodeToCopy.data,                         // 合并原节点的数据
            selected: false,                            // 取消选中状态
            _isBundled: false,                          // 重置打包状态
            title: uniqueTitle,   
          
          },
          position: {
            x: x + newX,                                // 新位置：原位置 + 偏移量
            y: y + newY,
          },
          selected: false,
          zIndex: 1,
          parentId: nodeToCopy?.parentId,               // 保持原节点的父节点关系
        });
       


        // 建立原始节点到新节点的 ID 映射（虽然普通节点复制不需要，但保持一致性）
        idMapping[nodeToCopy.id] = newNode.id;
        nodesToPaste.push(newNode);
        
        // 更新 ReactFlow 实例，添加新节点
        reactFlowInstance.setNodes([...nodeData, ...nodesToPaste]);
      }
    },
    [reactFlowInstance, checkMcpAvailable]
  );

  /**
   * 更新节点详情
   * 
   * 更新指定节点的数据，并触发节点内部状态刷新
   * 
   * @param {Object} obj - 包含节点更新信息的对象
   * @param {string} obj.nodeId - 要更新的节点ID
   * @param {Object} obj.data - 新的节点数据
   * @param {string} [obj.type] - 节点类型（可选，用于特殊处理）
   * @description 
   * - 深拷贝节点列表，避免直接修改原数据
   * - 更新指定节点的数据
   * - 使用 setTimeout 确保在下一个事件循环中更新节点内部状态
   * - 如果是循环节点，触发变更通知
   */
  const updateNodeDetail = useCallback(
    (obj) => {
      // 深拷贝节点列表，避免直接修改原数据
      let nodeData = _.cloneDeep(reactFlowInstance.getNodes());
      // 更新指定节点的数据
      let newNodes = nodeData.map((node) =>
        node.id === obj.nodeId ? { ...node, data: obj.data } : node
      );
      // 更新 ReactFlow 的节点状态
      reactFlowInstance.setNodes(newNodes);
      
      // 使用 setTimeout 确保在下一个事件循环中更新节点内部状态
      // 这样可以确保节点尺寸等内部状态能够正确更新
      setTimeout(() => {
        // 更新节点内部状态（触发重新渲染和尺寸计算）
        updateNodeInternals(obj.nodeId);
        
        // 如果是循环节点，触发变更通知
        // 这用于通知其他组件循环节点发生了变化
        if (obj.type === 'loop') {
          setChangeId(getUuid());        // 生成新的变更ID
          setChangeNodeType(obj.type);   // 设置变更的节点类型
        }
      }, 0);
    },
    [reactFlowInstance, updateNodeInternals, setChangeId, setChangeNodeType]
  );

  /**
   * 节点进入事件处理函数
   * 
   * 当鼠标进入节点区域时触发
   * 
   * @param {Event} event - 鼠标事件对象
   * @param {Object} node - 进入的节点对象
   * @description 
   * - 如果面板或运行面板可见，则不处理
   * - 目前功能已注释，可根据需要启用
   */
  const handleNodeEnter = (event, node) => {
    // 如果面板或运行面板可见，不处理节点进入事件
    if (panelVisible || runVisible) {
      return;
    }
    // 可以在这里设置面板节点，目前功能已注释
    // setPannerNode(node)
  };

  /**
   * 节点离开事件处理函数
   * 
   * 当鼠标离开节点区域时触发
   * 
   * @param {Event} event - 鼠标事件对象
   * @param {Object} node - 离开的节点对象
   * @description 
   * - 如果面板或运行面板可见，则不处理
   * - 目前功能已注释，可根据需要启用
   */
  const handleNodeLeave = (event, node) => {
    // 如果面板或运行面板可见，不处理节点离开事件
    if (panelVisible || runVisible) {
      return;
    }
    // 可以在这里清除面板节点，目前功能已注释
    // setPannerNode(null)
  };

  /**
   * 判断节点的连接状态
   * 
   * 根据节点ID和连接类型参数，判断节点是否已连接
   * 
   * @param {string} nodeId - 要检查的节点ID
   * @param {string} [type="any"] - 连接类型，可选值：
   *   - "source": 判断是否作为源节点（链接其他节点）
   *   - "target": 判断是否作为目标节点（被其他节点链接）
   *   - "both": 判断是否既是源又是目标
   *   - "any": 默认值，判断是否有任何连接
   * @returns {boolean} 节点的连接状态
   * @description 
   * - 获取所有与该节点相关的边
   * - 根据 type 参数判断不同的连接状态
   */
  const isNodeConnected = useCallback(
    (nodeId, type = "any") => {
      // 从 store 中获取所有边
      const { edges } = store.getState();
      
      // 获取所有与该节点相关的边（作为源节点或目标节点）
      const connectedEdges = edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId
      );

      // 根据传入的 type 参数判断连接状态
      switch (type) {
        case "source":
          // 判断是否作为源节点（链接其他节点）
          return connectedEdges.some((edge) => edge.source === nodeId);
          
        case "target":
          // 判断是否作为目标节点（被其他节点链接）
          return connectedEdges.some((edge) => edge.target === nodeId);
          
        case "both":
          // 判断是否既是源又是目标（既有出边又有入边）
          const isSource = connectedEdges.some(
            (edge) => edge.source === nodeId
          );
          const isTarget = connectedEdges.some(
            (edge) => edge.target === nodeId
          );
          return isSource && isTarget;
          
        case "any":
        default:
          // 默认判断是否有任何连接（只要有边连接即可）
          return connectedEdges.length > 0;
      }
    },
    [store]
  );

  // 返回所有节点交互处理函数
  return {
    handleNodeDelete,    // 节点删除处理函数
    handleNodeCopy,      // 节点复制处理函数
    updateNodeDetail,    // 节点详情更新函数
    handleNodeEnter,     // 节点进入事件处理函数
    handleNodeLeave,     // 节点离开事件处理函数
    isNodeConnected,     // 节点连接状态判断函数
  };
};
