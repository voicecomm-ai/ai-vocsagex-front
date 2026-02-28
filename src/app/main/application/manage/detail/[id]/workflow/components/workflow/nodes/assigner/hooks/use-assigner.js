


import { useNodesInteractions,useNodeData } from "../../../hooks";

import { useReactFlow } from "@xyflow/react";
export const useAssigner = () => {
  const actionMap ={
    'over-write':"覆盖",
    'clear':"清空",
    'set':"设置",
    "append":"追加",
    "extend":"扩展",
    "remove-first":"移除首项",
    "remove-last":"移除末项",
    '+=':"+=",
    "-=":"-=",
    "*=":"*=",
    "/=":"/=",    
  }
  const reactFlowInstance = useReactFlow();
  const { isNodeConnected } = useNodesInteractions();
  const { getUpstreamVariables } = useNodeData();
  //获取循环面板的变量值 当前节点在循环变量里或者上级节点是循环节点
  const getLoopVariableEvent = (id) => {//id为当前节点id  
   //1.判断当前节点是否被链接 
   let isConnected = isNodeConnected(id,'target');
    let loopVariable = [];//循环变量配置列表
     let data = getUpstreamVariables(id) || [];
     loopVariable = data.filter((item) => item.nodeType == 'loop');
      return loopVariable;
  };  

  /**
   * 处理变量数据，拼接节点信息以便展示渲染
   * @param {Array} items - 需要处理的变量项数组
   * @param {string} id - 当前节点ID，用于获取上游变量
   * @returns {Array} 处理后的变量数组，包含节点信息和变量信息
   */
  const handleVariableData = (items, id) => {
    // 获取所有上游节点的变量信息
    const upstreamVariables = getUpstreamVariables(id) || [];

    // 存储处理后的变量数据
    const variableArr = [];
    
    // 遍历每个变量项，提取并拼接相关信息
    items.forEach((item) => {
      // 获取变量选择器数组，格式: [节点ID, ..., 变量名]
      const variableSelector = item.variable_selector || [];
      
      // 只有当变量选择器不为空时才进行处理
      if (variableSelector.length > 0) {
        // 提取选择的节点ID（数组第一个元素）
        const selectNodeId = variableSelector[0];
        // 提取选择的变量名（数组最后一个元素）
        const selectVariable = variableSelector[variableSelector.length - 1];
        // 在上游变量中查找对应的节点信息
        const selectNode = upstreamVariables.find((node) => node.
        nodeId === selectNodeId);
        
        // 如果找到对应的节点，则拼接数据
        if (selectNode&&findNodesByValueSelector(upstreamVariables, variableSelector).length) {
          const processedItem = {
            ...item, // 保留原始项的所有属性
            writeModelTitle: actionMap[item.operation] || '', // 写入模式的中文标题
            nodeName: selectNode.title, // 节点名称
            nodeType: selectNode.nodeType, // 节点类型
            nodeId: selectNode.nodeId, // 节点ID
            variable_name: selectVariable, // 变量名称
          };
          
          // 将处理后的项添加到结果数组
          variableArr.push(processedItem);
        }
      }
    });
    return variableArr;
  }
  function findNodesByValueSelector(data, targetValueSelector) {
    const result = [];

    function search(nodes) {
        nodes.forEach(node => {
            // 判断节点的 value_selector 是否与目标匹配
            if (node.value_selector && arraysEqual(node.value_selector, targetValueSelector)) {
                result.push(node);
            }
            // 如果有 children，递归搜索
            if (node.children && Array.isArray(node.children)) {
                search(node.children);
            }
        });
    }

    // 辅助函数：判断两个数组是否完全相等
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    search(data);
    return result;
}


  return {
    getLoopVariableEvent,
    handleVariableData
  };
};