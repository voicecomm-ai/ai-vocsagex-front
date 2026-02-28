

import { message } from "antd";
import { useNodesInteractions } from "../../../hooks";
export const useLlm = () => {
  const {isNodeConnected } = useNodesInteractions();
  //验证mcp必填参数·
  const validateLlmNode = (data) => {
    let isNodeConnect=  isNodeConnected(data.id,'target');
      //处理llm节点弹框
      let prompt_template =data.prompt_template;
      let system_prompt = prompt_template.find((item) => item.role === "system");
      if (!system_prompt.text) {
        message.warning("系统提示词不能为空");
        return;
      } 
      if(!isNodeConnect){  //当前节点未连接
        let matches = system_prompt.text.match(/{{#(.*?)#}}/g);
         if(matches){
         message.warning("系统提示词不能为空");
         return false;
       }
      }
    
    return isValidate;
  };
  return {
    validateLlmNode,
  };
};
