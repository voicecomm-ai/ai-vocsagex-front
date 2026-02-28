

import { useCallback } from 'react'
import { type } from 'os';


export const useVaiable = () => {

/**
   * 根据值选择器路径查找节点
   * @param {Array} nodes - 节点数组
   * @param {Array} valueSelectorPath - 值选择器路径
   * @returns {Object|null} 找到的节点对象或null
   */
const findNodeByValue = (nodes, valueSelectorPath) => {
  for (const node of nodes) {
    // 检查当前节点是否有子节点（变量）
    if (node.children && node.children.length > 0) {
      for (const variable of node.children) {
        // 使用递归辅助函数在变量及其子节点中搜索
        const found = findVariableBySelector(variable, valueSelectorPath);
        if (found) {
          found.icon = node.icon;//设置节点图标
          return found;
        }
      }
    }
  }
  return null;
};  

/**
* 递归辅助函数，查找匹配完整值选择器路径的变量
* @param {Object} node - 当前节点
* @param {Array} targetPath - 目标路径
* @returns {Object|null} 找到的变量对象或null
*/
const findVariableBySelector = (node, targetPath) => {
 if (!node || !node.value_selector) return null;

 const nodePath = node.value_selector;
 if (Array.isArray(nodePath) && arraysEqual(nodePath, targetPath)) {
   return node;
 }

 if (node.children && node.children.length > 0) {
   for (const child of node.children) {
     const found = findVariableBySelector(child, targetPath);
     if (found) {
       return found;
     }
   }
 }

 return null;
};

/**
* 辅助函数：比较两个数组是否相等
* @param {Array} a - 第一个数组
* @param {Array} b - 第二个数组
* @returns {boolean} 是否相等
*/
const arraysEqual = (a, b) => {
 if (!Array.isArray(a) || !Array.isArray(b)) return false;
 if (a.length !== b.length) return false;

 return a.every((val, index) => val === b[index]);
};

/**
* 当 value_selector 变化时，查找并设置对应的数据
*/
const parseValueSelector = (value_selector) => {
 if (typeof value_selector !== "string") return value_selector;
 // 匹配 {{# ... #}} 格式
 const reg = /^\{\{#(.+?)#\}\}$/;
 const match = value_selector.match(reg);
 if (match) {
   // match[1] 是 #号之间的内容，如 1755765827936.text.name
   return match[1].split(".");
 }
 return value_selector;
};

//变量图标列表
const iconMap = {
  'string': '/workflow/knowledge/string.png',
  'number': '/workflow/knowledge/number.png',
  'file': '/workflow/knowledge/file.png',
  'object': '/workflow/knowledge/object.png',
  'array': '/workflow/knowledge/array.png',
  'array[string]':'/workflow/knowledge/array.png',
  'array[number]':'/workflow/knowledge/array.png',
  'array[object]':'/workflow/knowledge/array.png',
  'array[file]':'/workflow/knowledge/array.png',
  'any':'/workflow/knowledge/string.png',
}

//获取变量图标
const  getVarIcon=(type)=>{
 let url=iconMap[type]
 if(!url){
  url='/workflow/common/string.png'
 }
 return url
}


  return {
    findNodeByValue,
    parseValueSelector,
    getVarIcon, 
  }
}   

