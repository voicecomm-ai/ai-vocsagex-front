import { useCallback } from 'react'
import { useReactFlow,addEdge } from '@xyflow/react'
import { produce } from 'immer'
import _ from 'lodash'
import { getNodesConnectedSourceOrTargetHandleIdsMap } from '../utils'
import { getUuid } from "@/utils/utils";
import { useStore } from "@/store/index";
export const useEdgesInteractions = () => {
  const reactFlowInstance = useReactFlow()
  const { setChangeId,setChangeNodeType  } = useStore((state) => state);
  // 删除边
  const handleEdgeDelete = useCallback((setNodes) => {
    const currentNodes = _.cloneDeep(reactFlowInstance.getNodes())
    const currentEdges = _.cloneDeep(reactFlowInstance.getEdges())

    // 找出选中的边
    const selectedEdgeIndex = currentEdges.findIndex(edge => edge.selected)
    if (selectedEdgeIndex < 0) return

    const selectedEdge = currentEdges[selectedEdgeIndex]


    // 更新边列表：移除该边
    const updatedEdges = produce(currentEdges, draft => {
      draft.splice(selectedEdgeIndex, 1)
    })
    
    reactFlowInstance.setEdges(updatedEdges)
    reactFlowInstance.setNodes(currentNodes)
  
  }, [reactFlowInstance])

  // 添加边
  const handleEdgeAdd = useCallback((params) => {
    let nodeArr = _.cloneDeep(reactFlowInstance.getNodes())
   let edges = _.cloneDeep(reactFlowInstance.getEdges())
    let sourceNode = nodeArr.find(node => node.id === params.source)
    let targetNode = nodeArr.find(node => node.id === params.target)

    if (!sourceNode || !targetNode) return

    const newEdge = {
      id: getUuid(),
      source: params.source,
      target: params.target,
      type: 'custom',
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      data: {
        sourceType: sourceNode.type,
        targetType: targetNode.type,
      },
      selected: false,
    }
   
    
    reactFlowInstance.setEdges((eds) => addEdge(newEdge, eds));
        reactFlowInstance.setNodes(nodeArr);
  }, [reactFlowInstance])


  // 边状态变化事件（选中等）
  const handleEdgeChangeEvent = useCallback((change, onEdgesChange) => {
      setChangeId(getUuid())
      setChangeNodeType('edge')
    onEdgesChange(change)
  }, [])

  return {
    handleEdgeDelete,
    handleEdgeAdd,
    handleEdgeChangeEvent,
  }
}
