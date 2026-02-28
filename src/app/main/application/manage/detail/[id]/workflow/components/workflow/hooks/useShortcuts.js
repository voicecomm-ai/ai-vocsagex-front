

import { useKeyPress } from 'ahooks'
import { useCallback } from 'react'
import { useStore } from "@/store/index";
import {
  useEdgesInteractions,
  useNodesInteractions,
} from '.'
import { useReactFlow } from '@xyflow/react'

export const useShortcuts = () => {
      const {
    readOnly,
  } = useStore((state) => state);
  const reactFlowInstance = useReactFlow()
  const { handleEdgeDelete } = useEdgesInteractions()
  //监听删除键
 const isEventTargetInputArea = (target) => {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      return true

    if (target.contentEditable === 'true')
      return true
  }

  useKeyPress(['delete'], (e) => {
    console.log(isEventTargetInputArea(e.target), "isEventTargetInputArea");
  
  
    if (!readOnly &&!isEventTargetInputArea(e.target)) {
      e.preventDefault()
      handleEdgeDelete()
    }
    //监听空格事件
    
  })
}