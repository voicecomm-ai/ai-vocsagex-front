
import { useReactFlow, useUpdateNodeInternals, addEdge } from "@xyflow/react";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import { message } from "antd";
import { useDrag } from "./useDrag";
import { useAutoLayout } from "./useAutoLayout";

/**
 * 用于流程编排画布的节点新增及自动布局逻辑：
 * - 负责新增节点、维护父子节点尺寸
 * - 处理 dagre 自动编排
 * - 保证节点不重叠并自动连接边
 */

export const useNodeAdd = () => {
  const reactFlowInstance = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const { vectorModelData, rerankModelData, textModelData } = useStore((state) => state);
  const { checkMcpAvailable,addNodeEvent } = useDrag(vectorModelData, rerankModelData, textModelData);
  const {applyAutoLayoutForParent } = useAutoLayout();
  
  /**
   * 检查两个节点是否重叠
   * @param {Object} node1 - 第一个节点
   * @param {Object} node2 - 第二个节点
   * @param {number} margin - 节点之间的最小间距
   * @returns {boolean} 是否重叠
   */
  const isNodesOverlapping = (node1, node2, margin = 60) => {
    if (!node1.measured || !node2.measured) return false;
    if (!node1.measured.width || !node1.measured.height) return false;
    if (!node2.measured.width || !node2.measured.height) return false;
    
    const node1Right = node1.position.x + node1.measured.width;
    const node1Bottom = node1.position.y + node1.measured.height;
    const node2Right = node2.position.x + node2.measured.width;
    const node2Bottom = node2.position.y + node2.measured.height;
    
    // 检查是否重叠（考虑间距）
    return (
      node1.position.x < node2Right + margin &&
      node1Right + margin > node2.position.x &&
      node1.position.y < node2Bottom + margin &&
      node1Bottom + margin > node2.position.y
    );
  };

  /**
   * 更新父节点的宽度和高度，确保所有子节点都在父节点范围内
   * @param {string} parentId - 父节点ID
   */
  // 动态调整父节点尺寸，保证所有子节点处于父容器可视范围
  const updateParentNodeSize = (parentId) => {
    const updatedNodes = reactFlowInstance.getNodes();
    const parentNode = updatedNodes.find(node => node.id === parentId);
    if (!parentNode) return;

    // 查找所有子节点
    const childNodes = updatedNodes.filter(node => node.parentId === parentId);
    if (childNodes.length === 0) return;

    // 计算所有子节点需要的最大宽度和高度
    const margin = 16; // 边距
    let maxRequiredWidth = 0;
    let maxRequiredHeight = 0;

    childNodes.forEach(childNode => {
      if (childNode.measured && childNode.measured.width) {
        // 计算子节点相对于父节点的右边界位置：x + width + margin
        // 注意：子节点的 position 是相对于父节点的
        const childRightEdge = childNode.position.x + childNode.measured.width + margin;
        if (childRightEdge > maxRequiredWidth) {
          maxRequiredWidth = childRightEdge;
        }
      }
      if (childNode.measured && childNode.measured.height) {
        // 计算子节点相对于父节点的下边界位置：y + height + margin
        const childBottomEdge = childNode.position.y + childNode.measured.height + margin;
        if (childBottomEdge > maxRequiredHeight) {
          maxRequiredHeight = childBottomEdge;
        }
      }
    });

    // 获取父节点当前宽度和高度（优先使用 style，其次使用 measured）
    // 处理 style.width 可能是字符串（如 "500px"）的情况
    const getNumericValue = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };
    
    const currentParentWidth =  parentNode.measured?.width || 500;
    const currentParentHeight = parentNode.measured?.height || 200;
  
    // 确保最小尺寸
    const minWidth = 500;
    const minHeight = 200;
    maxRequiredWidth = Math.max(maxRequiredWidth, minWidth);
    maxRequiredHeight = Math.max(maxRequiredHeight, minHeight);

    // 判断是否需要更新宽度或高度（增加一些缓冲空间）
    const needUpdateWidth = maxRequiredWidth + 100 > currentParentWidth;
    const needUpdateHeight = maxRequiredHeight + 100 > currentParentHeight;
    // 如果需要的宽度或高度大于当前值，则更新父节点
    if (needUpdateWidth || needUpdateHeight) {
      // 更新父节点的样式宽度和高度
      reactFlowInstance.setNodes((nodes) =>
        nodes.map((node) =>
          node.id === parentId
            ? {
                ...node,
                ...(needUpdateWidth && { width: maxRequiredWidth + 100 }),
                ...(needUpdateHeight && { height: maxRequiredHeight + 100 }),
                style: {
                  ...node.style,
                
                },
              }
            : node
        )
      );
      // 通知 React Flow 更新节点内部状态
      setTimeout(() => {
        updateNodeInternals(parentId);
      }, 50);
    }
  };

  /**
   * 调整重叠节点的位置，将重叠的节点向后移动
   * @param {string} newNodeId - 新添加的节点ID
   * @param {string} parentId - 父节点ID（如果有）
   * @returns {Object} 包含需要更新的节点映射对象
   */
  // 检查新节点与兄弟节点是否重叠，如重叠则向后推移直到不重叠
  const adjustOverlappingNodes = (newNodeId, parentId = null) => {
    const nodes = reactFlowInstance.getNodes();
    const newNode = nodes.find(node => node.id === newNodeId);
    if (!newNode || !newNode.measured) return {};

    const nodesToUpdate = {}; // 使用对象存储，避免重复
    const processedNodeIds = new Set([newNodeId]);
    const margin = 60; // 节点之间的最小间距

    // 获取需要检查的节点列表（如果是子节点，只检查同父节点的子节点；否则检查所有非子节点）
    const getNodesToCheck = (currentParentId) => {
      const currentNodes = reactFlowInstance.getNodes();
      return currentParentId
        ? currentNodes.filter(node => node.parentId === currentParentId && node.id !== newNodeId)
        : currentNodes.filter(node => !node.parentId && node.id !== newNodeId);
    };

    // 递归调整所有重叠的节点
    const adjustNode = (currentNode) => {
      const currentNodesToCheck = getNodesToCheck(parentId);

      currentNodesToCheck.forEach(otherNode => {
        if (processedNodeIds.has(otherNode.id)) return;
        if (!otherNode.measured || !otherNode.measured.width || !otherNode.measured.height) return;

        // 使用已更新的节点位置进行检查（如果节点已被更新，使用更新后的位置）
        const currentNodeForCheck = nodesToUpdate[currentNode.id] || currentNode;
        // 如果 otherNode 已经被更新过，使用更新后的位置
        const otherNodeForCheck = nodesToUpdate[otherNode.id] || otherNode;
        
        if (isNodesOverlapping(currentNodeForCheck, otherNodeForCheck, margin)) {
          // 计算需要移动的距离
          const currentRight = currentNodeForCheck.position.x + (currentNodeForCheck.measured?.width || 0);
          const otherLeft = otherNodeForCheck.position.x;
          const moveDistance = currentRight + margin - otherLeft;

          if (moveDistance > 0) {
            // 更新节点位置
            const updatedNode = {
              ...otherNodeForCheck,
              position: {
                x: otherNodeForCheck.position.x + moveDistance,
                y: otherNodeForCheck.position.y,
              },
            };
            nodesToUpdate[otherNode.id] = updatedNode;
            processedNodeIds.add(otherNode.id);

            // 递归检查移动后的节点是否与其他节点重叠
            adjustNode(updatedNode);
          }
        }
      });
    };

    adjustNode(newNode);
    return nodesToUpdate;
  };

   //添加节点事件
   //data:节点数据
   /**
    * 
    * @param {*} data 
    * @param {*} nodeType 
    * @param {*} nowNodeId 
    * @param {*} sourceId  //出发点
    * @param {*} targetId  //目标点
    * @param {*} isEdge  //是否是联线添加
    * @param {*} edgeId 
    * @returns 
    */
  // 拖拽/连线触发的节点新增主流程，负责节点校验、边维护与布局
  const addNodeBySelector = async  (data, nodeType,nowNodeId,sourceId,targetId,isEdge=false,edgeId=null) => {
    //查找当前节点是否存在父节点Id
    const nodes = reactFlowInstance.getNodes();
    let nowNode = nodes.find(node => node.id == nowNodeId); //获取当前节点
    if(nodeType == "mcp"){
    let status = await checkMcpAvailable(data);
      if(!status){
        message.warning("当前MCP已下架!");
        return;
      }
    }
    if(nowNode){
      let parentId =nowNode.parentId;//父节点id
      let measured =nowNode.measured;//节点测量
      let nowNowNodeWidth =measured.width;//节点宽度
      let nowNowNodeHeight =measured.height;//节点高度
  
      //生成添加节点position
      // 修复问题1：当isEdge为false且targetId存在且sourceId不存在时，新节点应该放在当前节点前面
      let position = {
        x: (!isEdge && targetId && !sourceId) 
          ? nowNode.position.x - 100  // 放在前面（后续会通过adjustOverlappingNodes调整位置）
          : nowNode.position.x + nowNowNodeWidth + 100,  // 放在后面
        y: nowNode.position.y,
      };
      
      // 1. 删除所有从 nowNodeId 连出的边
      const edges = reactFlowInstance.getEdges();
      let edgesToKeep =[];
      if(edgeId){ //当前连线的id 存在时删除当前连线,不根据sourceId 删除
        edgesToKeep = edges.filter(edge => edge.id !== edgeId);
      }
      else if(sourceId){
        // 如果sourceId存在，删除所有从sourceId连出的边
        edgesToKeep = edges.filter(edge => edge.source !== sourceId);
      }
      else if(!isEdge && targetId){
        // 修复问题2：当sourceId不存在但targetId存在时，删除从nowNodeId到targetId的边
        let targetNodeId = isTargetHandle(targetId) ? targetId : targetId.split('-target')[0];
        edgesToKeep = edges.filter(edge => !(edge.source === nowNodeId && edge.target === targetNodeId));
      }
      else{
        edgesToKeep = edges; // 不删除任何边
      }
      reactFlowInstance.setEdges(edgesToKeep);
      let nowEdge = null;
      if(edgeId){
        nowEdge = edges.find(edge => edge.id === edgeId);
      }
      
      // 2. 添加新节点并获取新节点 ID
      const newNodeId = addNodeEvent(position, data, parentId);
      if (!newNodeId) {
        // 如果返回 null（如循环节点），则不处理边的连接
        return;
      }
      
      // 等待节点渲染完成后检查重叠并调整位置
      setTimeout(() => {
        const updatedNodes = reactFlowInstance.getNodes();
        const newNode = updatedNodes.find(node => node.id === newNodeId);
        
        if (newNode && newNode.measured) {
          // 检查并调整重叠节点
          const nodesToUpdate = adjustOverlappingNodes(newNodeId, parentId);
          
          if (Object.keys(nodesToUpdate).length > 0) {
            // 更新重叠节点的位置
            reactFlowInstance.setNodes((nodes) =>
              nodes.map((node) => {
                const nodeToUpdate = nodesToUpdate[node.id];
                return nodeToUpdate ? nodeToUpdate : node;
              })
            );
            
            // 如果是子节点，在位置调整后立即更新父节点大小
            if (parentId) {
              setTimeout(() => {
                updateParentNodeSize(parentId);
              }, 50);
            }
          } else if (parentId) {
            // 即使没有重叠节点需要调整，如果是子节点也需要更新父节点大小
            updateParentNodeSize(parentId);
          }
        } else if (parentId) {
          // 如果节点还没有 measured，等待一下再更新父节点大小
          setTimeout(() => {
            updateParentNodeSize(parentId);
          }, 100);
        }
        if(parentId){
          applyAutoLayoutForParent(parentId);
        }
     
      }, 100); // 等待100ms确保节点已渲染
      let isSpecialNode = nowNode.type === "if-else" || nowNode.type === "question-classifier";
      console.log(nowEdge,'nowEdge')
      
      // 修复问题2：确保新节点正确连线
      // 如果sourceId存在，则添加从 nowNodeId 到新节点的边
      if(sourceId){  
        // 3. 添加从 nowNodeId 到新节点的边
        const sourceHandle =isSpecialNode?`${sourceId}`: isEdge?`${sourceId}-source`: `${sourceId}`;
        const targetHandle = `${newNodeId}-target`;
        const newEdge1 = {
          id: getUuid(),
          source: nowNodeId,
          target: newNodeId,
          type: 'custom',
          sourceHandle: isEdge?nowEdge.sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          data: {
            sourceType: nowNode.type,
            targetType: nodeType,
          },
          selected: false,
        };
        console.log(newEdge1,'newEdge1')
        reactFlowInstance.setEdges((eds) => addEdge(newEdge1, eds));
      } else if (!isEdge && targetId) {
        // 修复问题2：当sourceId不存在但targetId存在时（从节点前面插入），需要连接新节点到当前节点
        // 添加从新节点到 nowNodeId 的边
        const sourceHandle = `${newNodeId}-source`;
        const targetHandle = `${nowNodeId}-target`;
        const newEdge1 = {
          id: getUuid(),
          source: newNodeId,
          target: nowNodeId,
          type: 'custom',
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          data: {
            sourceType: nodeType,
            targetType: nowNode.type,
          },
          selected: false,
        };
        //如果不是意图分类节点和条件分支节点，则添加边
        if(data.type !== "question-classifier" && data.type !== "if-else"){
          console.log(newEdge1,'newEdge1 - 新节点到当前节点')
          reactFlowInstance.setEdges((eds) => addEdge(newEdge1, eds));
        }
      }
      
      // 4. 如果存在 targetId 且节点类型不是"意图分类"、"条件分支"和"结束节点"，则添加从新节点到 targetId 的边
      if (targetId && nodeType !== "question-classifier" && nodeType !== "if-else" && nodeType !== "end") {
        let targetHandleId = isTargetHandle(targetId) ? `${targetId}` : `${targetId}-target`;
        let targetNodeId= isTargetHandle(targetId) ? targetId : targetId.split('-target')[0];
        // 重新获取节点列表以确保包含新添加的节点
        const updatedNodes = reactFlowInstance.getNodes();
        const targetNode = updatedNodes.find(node => node.id === targetNodeId);
        if (targetNode) {
          const newEdge2 = {
            id: getUuid(),
            source: newNodeId,
            target: targetNodeId,
            type: 'custom',
            sourceHandle: `${newNodeId}-source`,
            targetHandle: isEdge?nowEdge.targetHandle: targetHandleId,
            data: {
              sourceType: nodeType,
              targetType: targetNode.type,
            },
            selected: false,
          };
          console.log(newEdge2,'newEdge2')
          reactFlowInstance.setEdges((eds) => addEdge(newEdge2, eds));
        }
      }
      
      //处理子节点添加 - 如果新增的节点为子节点则扩充父元素的宽度和高度
      // 注意：父节点大小更新已在位置调整逻辑中处理，这里作为备用确保更新
      if(parentId){
        // 等待节点渲染和位置调整完成后再次更新父节点宽度和高度（作为备用）
        setTimeout(() => {
          updateParentNodeSize(parentId);
        }, 250); // 等待250ms确保所有位置调整都已完成
      }
    }
  };

  //判断当前targetId 是否带targetHandle
  const isTargetHandle = (targetId) => {
    return targetId.includes("-target");
  };

  
  
    return {addNodeBySelector };
};