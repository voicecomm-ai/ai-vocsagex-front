import { useCallback, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'

export const useNode = () => {
  const reactFlowInstance = useReactFlow();
 // 缓存节点数据，避免重复获取
 const nodes = useMemo(() => {
  try {
    return reactFlowInstance.getNodes() || [];
  } catch (error) {
    console.warn('获取节点数据失败:', error);
    return [];
  }
}, [reactFlowInstance]);

  
// 渲染节点图标 
const getNodeIcon = useCallback((type,nodeId) => {
  if (!type) {
    return '/workflow/default.png'; // 默认图标
  }

  // MCP节点需要特殊处理
  if (type === 'mcp') {
    const mcpNode = nodes.find(node => node.data?.id == nodeId);
    if (mcpNode?.data?.mcp_url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
      return baseUrl + mcpNode.data.mcp_url;
    }
    return '/workflow/mcp.png'; // MCP默认图标
  }
  if(type=='agent' || type=='workflow'){
    const appNode = nodes.find(node => node.data?.id == nodeId);
    if (appNode?.data?.iconUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
      return baseUrl + appNode.data.iconUrl;
    }
    return '/workflow/mcp.png'; // MCP默认图标
  }

  // 其他节点类型使用标准图标
  return `/workflow/${type}.png`;
}, [nodes]);

  return {
    getNodeIcon,
  };
};
