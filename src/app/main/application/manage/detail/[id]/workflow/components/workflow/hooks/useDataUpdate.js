
import { useReactFlow } from '@xyflow/react'
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import  {updateWorkflow} from "@/api/workflow"
import dayjs from "dayjs"
import debounce from "lodash/debounce"
import { useStore } from "@/store/index"
export const useDataUpdate = () => { 
  const reactFlowInstance = useReactFlow();
  const { setUpdateTime,applicationData } = useStore((state) => state);

      const debouncedUpdateWorkflow = useRef(
      debounce(async () => {
        let nodes = reactFlowInstance.getNodes();
        let edges = reactFlowInstance.getEdges();
        let viewport = reactFlowInstance.getViewport();
        let data = {
          ...applicationData,
          graph: { nodes, edges, viewport },
        };
        await updateWorkflow(data).then((res) => {
          const formattedTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
          setUpdateTime(formattedTime);
        });
      }, 200) // 1000ms 无操作后才触发
    ).current;


  return { debouncedUpdateWorkflow }
  
}