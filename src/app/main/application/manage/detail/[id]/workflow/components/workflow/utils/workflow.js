



export function getNodesConnectedSourceOrTargetHandleIdsMap(changes, nodes) {
  const nodesConnectedSourceOrTargetHandleIdsMap = {};

  changes.forEach((change) => {
    const { edge, type } = change;
    // 查找源节点
    const sourceNode = nodes.find(node => node.id === edge.source);
    if (sourceNode) {
      // 如果映射中没有该节点数据，则初始化
      if (!nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id]) {
        nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id] = {
          _connectedSourceHandleIds: [...(sourceNode.data?._connectedSourceHandleIds || [])],
          _connectedTargetHandleIds: [...(sourceNode.data?._connectedTargetHandleIds || [])],
        };
      }
    }

    // 查找目标节点
    const targetNode = nodes.find(node => node.id === edge.target);
    if (targetNode) {
      // 如果映射中没有该节点数据，则初始化
      if (!nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id]) {
        nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id] = {
          _connectedSourceHandleIds: [...(targetNode.data?._connectedSourceHandleIds || [])],
          _connectedTargetHandleIds: [...(targetNode.data?._connectedTargetHandleIds || [])],
        };
      }
    }

    // 处理源节点的连接变化
    if (sourceNode) {
      if (type === 'remove') {
        // 移除源节点上的连接句柄ID
        const index = nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id]
          ._connectedSourceHandleIds
          .findIndex(handleId => handleId === edge.sourceHandle);
        if (index !== -1) { // 确保找到了才删除
          nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id]
            ._connectedSourceHandleIds
            .splice(index, 1);
        }
      } else if (type === 'add') {
        // 添加源节点上的连接句柄ID
        nodesConnectedSourceOrTargetHandleIdsMap[sourceNode.id]
          ._connectedSourceHandleIds
          .push(edge.sourceHandle || 'source');
      }
    }

    // 处理目标节点的连接变化
    if (targetNode) {
      if (type === 'remove') {
        // 移除目标节点上的连接句柄ID
        const index = nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id]
          ._connectedTargetHandleIds
          .findIndex(handleId => handleId === edge.targetHandle);
        if (index !== -1) { // 确保找到了才删除
          nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id]
            ._connectedTargetHandleIds
            .splice(index, 1);
        }
      } else if (type === 'add') {
        // 添加目标节点上的连接句柄ID
        nodesConnectedSourceOrTargetHandleIdsMap[targetNode.id]
          ._connectedTargetHandleIds
          .push(edge.targetHandle || 'target');
      }
    }
  });

  return nodesConnectedSourceOrTargetHandleIdsMap;
}


export const getTopLeftNodePosition = (nodes) => {
  let minX = Infinity;
  let minY = Infinity;

  nodes.forEach((node) => {
    if (node.position.x < minX)
      minX = node.position.x;

    if (node.position.y < minY)
      minY = node.position.y;
  });

  return {
    x: minX,
    y: minY,
  };
};