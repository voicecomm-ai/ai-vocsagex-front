import React from 'react';
import { useNodeData } from '../../../hooks/useNodeData';
export const useIteration = () => {
  const { getNodeById,getCurrentAndDownstreamVariables} = useNodeData();

  //获取当前节点的所有子节点的变量
  const getIterationChildVariables = (nodeId) => {
    // 获取所有相关变量
    const variables = getCurrentAndDownstreamVariables(nodeId);
    // 过滤掉当前节点的变量，只保留下游子节点的
    const result = variables.filter(item => item.nodeId !== nodeId);
    return result;
  }

  //验证当前节点必填项
  const checkIterationNodeRequired = (data) => {
    let param = data.param;
    let isRequired = param.find(item => item.required&&!item.value);
    if(isRequired){
      return false;
    }
    return true;
  }

  return {
    getIterationChildVariables,
    checkIterationNodeRequired
  }
}
export default useIteration;