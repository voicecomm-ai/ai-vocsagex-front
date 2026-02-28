import _ from "lodash";
import { useNodeData } from "../hooks";
import { useReactFlow } from '@xyflow/react'

/**
 * 工作流运行相关的自定义 Hook
 * 提供变量处理、去重、类型转换等功能
 */
export const useRun = () => {
  const reactFlowInstance = useReactFlow()
  const { getUpstreamVariables } = useNodeData();

  /**
   * 去除变量数组中的重复项
   * 基于 value_selector 进行去重判断
   * @param {Array} arr - 待去重的变量数组
   * @returns {Array} 去重后的变量数组
   */
  const removeDuplicateVariables = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
      // 将 value_selector 转成字符串作为唯一标识
      const key = JSON.stringify(item.value_selector);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  /**
   * 判断变量类型是对象还是数组
   * @param {string} varType - 变量类型字符串
   * @returns {string|null} 返回 "object"、"array" 或 null
   */
  const isObjectArray = (varType) => {
    if (varType === "object") {
      return "object";
    }
    // 判断是否为数组类型（包括各种数组子类型）
    if (
      varType === "array" ||
      varType === "array[string]" ||
      varType === "array[number]" ||
      varType === "array[object]"
    ) {
      return "array";
    }
    return null;
  };

  /**
   * 在树形结构中递归查找变量
   * @param {Array} tree - 变量树形结构
   * @param {Array} varStr - 变量选择器数组，形如 [start,xxx] 或 [start,xxx,xxx]
   * @returns {Object|null} 找到的变量对象，未找到返回 null
   */
  const findVariableInTree = (tree, varStr) => {
    if (!varStr) return null;
    
    // varStr 形如 [start,xxx] 或者 [start,xxx,xxx]，第一个元素是节点id
    const targetNodeId = varStr[0];
    let result = null;

    /**
     * 递归遍历节点树
     * @param {Array} nodes - 节点数组
     */
    function traverse(nodes) {
      if (!nodes || !Array.isArray(nodes)) return;
      
      for (let node of nodes) {
        // 找到目标节点
        if (node.nodeId === targetNodeId) {
          // 在节点的子变量中查找匹配的变量
          if (node.children && Array.isArray(node.children)) {
            for (let child of node.children) {
              if (arrayEqual(child.value_selector, varStr)) {
                result = { ...child };
                return;
              }
            }
          }
        }
        // 继续递归查找子节点
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children);
          if (result) return;
        }
      }
    }
    
    traverse(tree);
    return result;
  };

  /**
   * 处理文件类型变量的额外配置
   * @param {Object} addData - 待处理的变量数据对象
   */
  const handleFileTypeConfig = (addData) => {
    if (addData.type === "file" || addData.type === "file-list") {
      addData.allowed_file_upload_methods = ["local_file", "remote_url"];
      addData.max_length = 5;
      addData.allowed_file_types = [];
    }
  };

  /**
   * 创建开始节点的变量数据
   * @param {Object} found - 找到的变量对象
   * @param {Array} startVars - 开始节点的变量列表
   * @param {string} valueQuery - 变量查询路径
   * @param {boolean} isLabel - 是否使用自定义标签
   * @param {Object} varStr - 变量字符串对象（包含 label）
   * @param {boolean} customVariable - 是否使用自定义变量名
   * @returns {Object} 处理后的变量数据对象
   */
  const createStartNodeData = (found, startVars, valueQuery, isLabel, varStr,isRequired,customVariable) => {
    // 从开始节点获取变量
    const foundStart = startVars.find(
      (item) => item.variable === found.variable
    );
    
    if (foundStart) {
      // 如果开始节点有变量，则使用开始节点变量
      return {
        ...foundStart,
        variableQuery: customVariable ? varStr.label : valueQuery,
        required: isRequired,
        label: isLabel ? varStr.label : found.label,
      };
    } else {
      // 如果开始节点没有变量，则创建新的变量数据
      return {
        label: isLabel ? varStr.label : found.label,
        type: handleVariableType(found.variable_type),
        max_length: null,
        required: isRequired,
        variable: found.variable,
        variableQuery: customVariable ? varStr.label : valueQuery,
      };
    }
  };

  /**
   * 创建非开始节点的变量数据
   * @param {Object} found - 找到的变量对象
   * @param {string} valueQuery - 变量查询路径
   * @param {boolean} isLabel - 是否使用自定义标签
   * @param {Object} varStr - 变量字符串对象（包含 label）
   * @returns {Object} 处理后的变量数据对象
   */
  const createNonStartNodeData = (found, valueQuery, isLabel, varStr,isRequired,customVariable) => {
    const varType = isObjectArray(found.variable_type);
    
    // 根据变量类型设置默认值
    const defaultValue = varType === "object" 
      ? {} 
      : varType === "array" 
        ? [] 
        : '';
    
    return {
      label: isLabel ? varStr.label : found.label,
      type: handleVariableType(found.variable_type),
      max_length: null,
      required: isRequired,
      variable: found.variable,
      variableQuery: customVariable ? varStr.label : valueQuery,
      [valueQuery]: defaultValue,
      varType: varType
    };
  };

  /**
   * 获取节点的变量列表
   * 根据上游变量和输入数据，过滤并处理变量信息
   * @param {Array} data - 输入的变量数据数组
   * @param {string} nodeId - 当前节点ID
   * @param {boolean} isLabel - 是否使用自定义变量名，如果为true，则使用变量名作为变量名
   * @param {boolean} isRequired - 是否必填，如果为false，则不必填
   * @returns {Array} 处理后的变量数组
   */
  const getNodeVariables = (data, nodeId, isLabel = false,isRequired = true,customVariable = true) => {
    // 获取上游变量树形结构
    const upstreamVariables = getUpstreamVariables(nodeId);
    
    // 获取开始节点变量
    const nodeData = _.cloneDeep(reactFlowInstance.getNodes());
    const startNode = nodeData.find((node) => node.type === "start");
    const startVars = startNode?.data?.variables || [];
    
    // 去重处理输入变量
    const inputArr = removeDuplicateVariables(data);
    const filteredVars = [];
    
    // 遍历输入变量，查找并处理匹配的变量
    inputArr.forEach((varStr) => {
      const found = findVariableInTree(upstreamVariables, varStr.value_selector);
      
      if (found) {
        const valueQuery = found.value_selector.join(".");
        let addData = {};
        console.log(valueQuery, 'valueQuery');
        
        // 根据节点类型创建不同的变量数据
        if (found.nodeType === "start") {
          addData = createStartNodeData(found, startVars, valueQuery, isLabel, varStr,isRequired,customVariable);
        } else {
          addData = createNonStartNodeData(found, valueQuery, isLabel, varStr,isRequired,customVariable);
        }
        
        // 处理文件类型变量的额外配置
        handleFileTypeConfig(addData);
        
        filteredVars.push(addData);
      }
    });
    
    return filteredVars;
  };
  
  /**
   * 处理变量类型转换
   * 将内部变量类型转换为UI展示类型
   * - object 或 array 类型 → json
   * - number 类型 → number
   * - file 或 array[file] 类型 → file-list
   * - 其他类型 → text-input
   * @param {string} varType - 变量类型字符串
   * @returns {string} UI展示类型
   */
  const handleVariableType = (varType) => {
    // 对象和数组类型统一转换为 json
    const jsonTypes = [
      "object",
      "array[object]",
      "array[any]",
      "array[boolean]",
      "array[number]",
      "array[string]",
      "array"
    ];
    
    if (jsonTypes.includes(varType)) {
      return "json";
    }
    
    // 数字类型
    if (varType === "number") {
      return "number";
    }
    
    // 文件类型
    if (varType === "file" || varType === "array[file]") {
      return "file-list";
    }
    
    // 默认返回文本输入类型
    return "text-input";
  };

  /**
   * 验证两个数组是否完全相等
   * @param {Array} a - 第一个数组
   * @param {Array} b - 第二个数组
   * @returns {boolean} 如果两个数组完全相等返回 true，否则返回 false
   */
  const arrayEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  };

  return { 
    capitalizeFirstLetter: removeDuplicateVariables, // 保持向后兼容
    removeDuplicateVariables,
    getNodeVariables 
  };
};
