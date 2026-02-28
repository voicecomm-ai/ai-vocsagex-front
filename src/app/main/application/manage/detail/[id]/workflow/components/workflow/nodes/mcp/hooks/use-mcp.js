

import { message } from "antd";
import { useNodesInteractions } from "../../../hooks";
export const useMcp = () => {
  const {isNodeConnected } = useNodesInteractions();
  //验证mcp必填参数·
  const validateMcpNode = (data) => {
    let isNodeConnect=  isNodeConnected(data.id,'target');
    let param = data.param;
    let isValidate = true;
    let isRequired = param.find(item => item.required&&!item.value);
      if(isRequired){
        message.warning("请输入必填参数");
        isValidate = false;
      } 
      if(!isNodeConnect){ //当前节点未连接
      let isRe = param.find(item => item.required&&item.value_type=='Variable'&&item.value);
      if(isRe){
         message.warning("请输入必填参数");
         isValidate = false;
       }
      }
    
    return isValidate;
  };
  return {
    validateMcpNode,
  };
};
