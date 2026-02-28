

import { message } from "antd";
import { useNodesInteractions, useNodeData } from "../../../hooks";
export const useApi = () => {
  const { isNodeConnected } = useNodesInteractions();
  const { getUpstreamVariables, getNodeById } = useNodeData();

 /**
 * 根据ID数组，移除字符串中所有{{#id.xxx#}}格式且id在数组中的变量
 * 支持多层级格式（如{{#id.file.url#}}，仍提取id作为判断依据）
 * @param {string} str - 包含{{#id.xxx#}}变量的原始字符串
 * @param {string[]} idArray - 需要移除的id数组
 * @returns {string} - 移除目标变量后的字符串
 */
function removeVarsByID(str, idArray) {
  // 修正正则：匹配 {{#id.xxx#}} 格式（xxx可包含多层级，如file.url）
  // 捕获组1：完整变量片段（如{{#id.file.url#}}）
  // 捕获组2：id部分（第一个.前的内容，如7377ae7a-693e-4413-8bc7-f2140f56a79f）
  const varRegex = /(\{\{#([0-9a-f-]+)\.[^#]+#\}\})/g;

  const idSet = new Set(idArray); // 转为Set，提高查找效率
  let result = "";
  let lastIndex = 0; // 记录上一次匹配结束的位置，避免遗漏非变量内容

  let match;
  // 循环匹配所有符合格式的变量
  while ((match = varRegex.exec(str)) !== null) {
    const fullVar = match[1]; // 完整变量片段（如{{#id.file.url#}}）
    const varId = match[2];   // 提取的ID（第一个.前的内容，核心判断依据）
    const currentIndex = match.index; // 当前变量在原字符串的起始位置

    // 1. 拼接「上一次结束位置 ~ 当前变量起始位置」的非变量内容
    result += str.slice(lastIndex, currentIndex);

    // 2. 若ID不在目标数组中，保留变量；否则移除（不拼接）
    if (!idSet.has(varId)) {
      result += fullVar;
    }

    // 3. 更新上一次匹配的结束位置（当前变量的末尾）
    lastIndex = varRegex.lastIndex;
  }

  // 4. 拼接「最后一个变量 ~ 原字符串末尾」的非变量内容
  result += str.slice(lastIndex);

  return result;
}


   function extractVariableIds(str) {
      // 正则表达式：全局匹配 {{#A.B#}} 格式，捕获 A 部分（变量ID）
      // \{\{# 匹配开头的 {{#
      // ([0-9a-f-]+) 捕获变量ID（假设ID由数字、小写字母和短横线组成）
      // \.[a-zA-Z0-9]+#\}\} 匹配 .B#}} 部分（非捕获，仅用于定位格式）
      // g 表示全局匹配，找到所有符合条件的变量

  const matches = str.match(/{{#(.*?)#}}/g);
  let ids = [];
   if (matches) {
        matches.forEach((match) => {
          const variable = match.match(/{{#(.*?)#}}/);
          
          if (variable && variable[1]) {
            const id = variable[1].split('.')[0]
            // 变量格式如 start.xxx，分割后[0]=start,[1]=xxx
            // 如果不存在重复才push进数组
            if (!ids.includes(id)) {
              ids.push(id);
            }
          }
        });
      }
     
      return ids;
    }

  //验证mcp必填参数·
  const validateApiNode = (data,isWarning=true) => {
    console.log(data,'1111');
    
    const variableData = getUpstreamVariables(data.id);
    let isValidate = true;
    if (!data.url) {
      if(isWarning){ //是否显示警告
        message.warning("请输入必填参数");
      }
      isValidate = false;
    } else {
      let urlIds = extractVariableIds(data.url);
      console.log(urlIds,'urlIds');
      
      //当前可连接的nodeid
      let currentNodeIds = variableData.map((item) => item.nodeId);
      // 删除连线后丢失的nodeId
      let disconnectIds = urlIds.filter((id) => !currentNodeIds.includes(id));
console.log(disconnectIds,'disconnectIds');

      let str = removeVarsByID(data.url, disconnectIds);
  console.log(str,'str');
  
      if (!str) {
        if(isWarning){//是否显示警告
          message.warning("请输入必填参数");
        }
        isValidate = false;
      } 
    }
    return isValidate;
  };
  return {
    validateApiNode,
  };
};
