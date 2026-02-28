// hooks/useValidateConditions.js
import { useCallback } from "react";
import { message } from "antd";

import { useNodesInteractions, useNodeData } from "../../../hooks";
/**
 * 校验条件配置是否合法
 * @returns {function} validateConditions(data: {cases: any[]}, arr: any[]): boolean
 */
export function useValidateConditions() {
    
  const { getUpstreamVariables, getNodeById } = useNodeData();
  // 🔎 辅助函数：在 arr 中查找 variable_selector 是否存在
  const existsInArr = useCallback((arr, variable_selector) => {
    if (!variable_selector || variable_selector.length === 0) return false;

    const checkNode = (nodes) => {
      for (const node of nodes) {
        if (JSON.stringify(node.value_selector) === JSON.stringify(variable_selector)) {
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (checkNode(node.children)) return true;
        }
      }
      return false;
    };

    return checkNode(arr);
  }, []);

  // 🛠 提取 value 里的 {{#...#}} 占位符 -> 转成 variable_selector 数组
  const extractSelectorsFromValue = useCallback((value) => {
    if (!value || typeof value !== "string") return [];
    const regex = /\{\{#([^#}]+)#\}\}/g; // 匹配 {{# ... #}}
    const matches = [];
    let match;

    while ((match = regex.exec(value)) !== null) {
      let inside = match[1]; // 例如 "47f4fc9d-42ef.file.as"
      let parts = inside.split(".");
      matches.push(parts);
    }

    return matches;
  }, []);

  // ✅ 对外暴露的校验函数
  const validateConditions = useCallback(
    (data,warning=true) => {
        const arr = getUpstreamVariables(data.id);
      if (!data?.cases || data.cases.length === 0) return '条件不能为空';

      // 🚨 先检查是否有空条件
      const isEmptyCondition = data.cases.find((item) => item.conditions.length === 0);
      if (isEmptyCondition) {
        return `${isEmptyCondition.type}不能为空`;
      }

      // 内部递归函数
      function checkConditions(conditions) {
        for (const cond of conditions) {
          const varName = cond?.inputItem?.label || cond.variable || cond.key || "未知变量";

          // 校验 variable_selector 是否存在
          if (cond.variable_selector && cond.variable_selector.length > 0) {
            const found = existsInArr(arr, cond.variable_selector);
            if (!found) {
              // return `变量「${varName}」不存在或已被删除`;
              return `条件不能为空`;
            }
          }

          // 校验 value 中的 {{#...#}} 占位符
          if (cond.value) {
            const selectors = extractSelectorsFromValue(cond.value);
            for (const sel of selectors) {
              const found = existsInArr(arr, sel);
              if (!found) {
                // return `变量「${varName}」中的引用 ${JSON.stringify(sel)} 不存在或已被删除`;
                return `条件不能为空`;
              }
            }
          }

          // 跳过 empty / not empty
          if (cond.comparison_operator === "empty" || cond.comparison_operator === "not empty") {
            continue;
          }

          // string 校验
          if (cond.varType === "string" && cond.value === "") {
            return `变量「${varName}」的值不能为空`;
          }

          // number 校验
          if (cond.varType === "number") {
            if (cond.numberVarType === "constant" && cond.value === "") {
              return `变量「${varName}」的数值不能为空`;
            }
            if (cond.numberVarType === "variable" && !cond.numberInputItem) {
              return `变量「${varName}」请选择一个变量`;
            }
          }

          // array[file] 校验
          if (cond.varType === "array[file]") {
            const subConds = cond.sub_variable_condition?.conditions || [];
            if (subConds.length === 0) {
              return `变量「${varName}」至少需要一个子条件`;
            }
            const subError = checkConditions(subConds);
            if (subError) return subError;
          }

          // array[string] / array[number] / object 校验
          if (
            cond.varType === "array[string]" ||
            cond.varType === "object" ||
            cond.varType === "array[number]"
          ) {
            if (!cond.value || cond.value.length === 0) {
              return `变量「${varName}」的值不能为空`;
            }
          }
        }
        return null;
      }

      // 🚀 遍历最外层的每个 block
      for (const block of data.cases) {
        const error = checkConditions(block.conditions || []);
        if (error) {
          if(warning){
            message.warning(error);
          }
          return false;
        }
      }

      return true; // ✅ 通过校验
    },
    [existsInArr, extractSelectorsFromValue]
  );

  return validateConditions;
}
