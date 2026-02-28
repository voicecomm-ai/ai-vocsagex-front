import React from "react";
import { useNodesInteractions, useNodeData } from "../../../hooks";
import { findByValueSelector } from "../../../utils/node";
import { useReactFlow } from "@xyflow/react";

export const useAggregator = () => {
  const reactFlowInstance = useReactFlow();
  const { isNodeConnected } = useNodesInteractions();
  const { getUpstreamVariables } = useNodeData();

  /**
   * 处理变量聚合节点的展示数据
   * 将分组配置中的变量选择器转换为实际的上游变量数据
   *
   * @param {Object} data - 节点数据对象
   * @param {string} data.id - 节点ID
   * @param {Object} data.advanced_settings - 高级设置配置
   * @param {Array} data.advanced_settings.groups - 分组列表，每个分组包含变量选择器
   * @returns {Array} 处理后的分组数组，每个分组包含 variableArray 字段，存储实际变量数据
   */
  const handleVariableData = (data) => {
    const nodeId = data.id;
    // 获取当前节点的所有上游变量数据
    const frontVariables = getUpstreamVariables(nodeId);
    console.log(frontVariables,'frontVariables');
    // 获取高级设置中的分组配置
    const advancedSettings = data.advanced_settings;
    const groups = advancedSettings?.groups || [];

    // 遍历每个分组，将变量选择器转换为实际变量数据
    const processedGroups = groups.map((group) => {
      const variables = group.variables || [];

      // 为每个分组创建新对象，保留原有属性并添加 variableArray 字段
      const groupObj = {
        ...group,
        variableArray: [],
      };

      // 遍历分组中的每个变量选择器，在上游变量中查找对应的变量数据
      const variableArray = variables.reduce((arr, variable) => {
        // 根据 value_selector 路径在上游变量中查找对应的变量节点
        const found = findByValueSelector(variable, frontVariables);

        if( found && found.nodeType   == 'mcp'){
          let mcpNode = findMcpIconData(found.nodeId);
          
          found.mcpUrl = mcpNode.data.mcp_url;
        }
        if(found && (found.nodeType == 'agent' || found.nodeType == 'workflow')){
          let appNode = findMcpIconData(found.nodeId);
        
          found.iconUrl = appNode.data.iconUrl;
        }
        if (found !== null && found !== undefined) {
          arr.push(found);
        }
        return arr;
      }, []);
     

      // 将查找到的变量数据赋值给分组对象
      groupObj.variableArray = variableArray;

      return groupObj;
    });

    return processedGroups;
  };
 
  //查找mcp 的图标数据
  const findMcpIconData = (nodeId) => {
   let nodes = reactFlowInstance.getNodes();
   let node = nodes.find((node) => node.id === nodeId);
   return node;
  }

  //验证运行必填项
  

  const validateRequired = (data) => {
    const groups = data.advanced_settings?.groups || [];
    let isValidate = true;
    for (const group of groups) {
      const variables = group.variables || [];
      if(variables.length === 0){
        isValidate = false;
       return false;
      }
      for (const variable of variables) {
        if (!variable) {
          isValidate = false;
          break;
        }
      }
    }
    return isValidate;
  };

  return {
    handleVariableData, 
    validateRequired,
  };
};
