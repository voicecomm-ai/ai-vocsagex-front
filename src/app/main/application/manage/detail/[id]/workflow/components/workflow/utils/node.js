import { BlockEnum } from '../types';
import { getUuid } from '@/utils/utils';
import { Position } from '@xyflow/react';
const LOOP_NODE_Z_INDEX = 1;
const ITERATION_NODE_Z_INDEX = 1;

export function generateNewNode({ data, position, id, zIndex, type, ...rest }) {
  let newId = id || getUuid();
  const newNode = {
    id: newId,
    type: type,
    data:{
      ...data,
      id:newId,
    },
    position,
    zIndex: data.type === BlockEnum.Iteration ? ITERATION_NODE_Z_INDEX : (data.type === BlockEnum.Loop ? LOOP_NODE_Z_INDEX : zIndex),
    ...rest,
  };

  return { newNode };
}

export const genNewNodeTitleFromOld = (oldTitle) => {
    if(!oldTitle){
     return '';
    }
  const regex = /^(.+?)\s*\((\d+)\)\s*$/;
  const match = oldTitle.match(regex);

  if (match) {
    const title = match[1];
    const num = Number.parseInt(match[2], 10);
    const newTitle = `${title} (${num + 1})`;
    return newTitle.length > 50 ? newTitle.substring(0, 50) : newTitle;
  } else {
    const newTitle = `${oldTitle} (1)`;
    return newTitle.length > 50 ? newTitle.substring(0, 50) : newTitle;
  }
};


/**
 * 通用递归查找函数
 * 根据 value_selector 路径，在任意层级数据中查找对应节点
 * 
 * @param {Array} path - value_selector，如 ["nodeId", "res", "related_id"]
 * @param {Array} data - 配置的 JSON 数组
 * @returns {Object|null}
 */
export function findByValueSelector(path, data) {
  if (!Array.isArray(path) || path.length === 0) return null;

  // 第一步：根据 nodeId 在第一层查找
  const [nodeId, ...rest] = path;
  const root = data.find(item => item.nodeId === nodeId);
  if (!root) return null;

  // 如果没有后续路径，直接返回
  if (rest.length === 0) return root;

  // 继续递归查找
  return deepFind(root, rest);
}


/**
* 递归深入 children 查找
* @param {Object} node 当前节点
* @param {Array} path 剩下的路径片段
*/
function deepFind(node, path) {
  if (!node || path.length === 0) return node;

  const [key, ...rest] = path;

  if (!node.children) return null;

  // 在 children 中匹配：label, variable, variable_name（包含结尾匹配）
  const nextNode = node.children.find(child =>
      child.label === key ||
      child.variable === key ||
      (child.variable_name && child.variable_name.endsWith(key))
  );

  if (!nextNode) return null;

  return deepFind(nextNode, rest);
}
