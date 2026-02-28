import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { isMcpAvailable } from '@/api/mcp'
import { checkApplicationStatus } from "@/api/workflow";
export const useDataVerify = () => {

  
  //检查mcp节点是否下
  const checkMcpAvailable = async (id) => {
    let res =  await isMcpAvailable(id);
     let status = res.data;
     if(!status){
       return false;
     }
     return true;
   }
   const checkNodeAvailable = async (appId) => {
    let res =  await checkApplicationStatus(appId );
    let status = res.data;
    if(!status){
      return false;
    }
    return true;
   }
   return { checkMcpAvailable, checkNodeAvailable }
}

