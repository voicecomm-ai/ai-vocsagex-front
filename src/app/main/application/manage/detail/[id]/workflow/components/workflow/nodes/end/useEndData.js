

import { getUuid } from "@/utils/utils";


  function resolveVariableName(value_selector) {
    if (!Array.isArray(value_selector) || value_selector.length === 0)
      return "";
const uuidSimple = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = uuidSimple.test(value_selector[0]);

    if (isUUID) {
      // 如果是节点ID，直接取最后一个字段名
      return value_selector[value_selector.length - 1];
    } else {
      // 否则按路径格式拼接
      return value_selector.join(".");
    }
  }

 function findMatchingChild(children, targetValueSelector, parentNode = null) {
    for (const child of children) {
      // 确保子节点有正确的 nodeId 和 nodeType
      const childNodeId = child.nodeId || (parentNode ? parentNode.nodeId : null);
      const childNodeType = child.nodeType || (parentNode ? parentNode.nodeType : null);
      const childNodeName = child.title || (parentNode ? parentNode.title : null);
      
      if (
        JSON.stringify(child.value_selector) ===
        JSON.stringify(targetValueSelector)
      ) {
        return {
          ...child,
          nodeId: childNodeId,
          nodeType: childNodeType,
          nodeName: childNodeName
        };
      }

      if (child.children && child.children.length > 0) {
        const found = findMatchingChild(child.children, targetValueSelector, { 
          nodeId: childNodeId, 
          nodeType: childNodeType,
          title: childNodeName
        });
        if (found) return found;
      }
    }

    return null;
  }

  export const mapVariablesToNodeInfo = (variableMappings, nodes) => {
  
    return variableMappings.map(({ variable, value_selector }) => {
      let matchedNode = null;

      for (const node of nodes) {
        if (!node.children) continue;

        const matchedChild = findMatchingChild(node.children, value_selector);
                 if (matchedChild) {
           matchedNode = {
             variable:variable,
             variable_name: resolveVariableName(value_selector),
             nodeId: node.nodeId,
             nodeType: node.nodeType,
             title: node.title,
             nodeName: matchedChild.nodeName || node.title,
             variable_type: matchedChild.variable_type?.toUpperCase() || 'STRING',
             valueSelectorArr:matchedChild.value_selector,
             valueSelectorData:matchedChild.value_selector
           };
           break;
         }
      }

             return (
         matchedNode || {
          variable:variable,
          variable_name: resolveVariableName(value_selector),
           nodeId: null,
           nodeType: null,
           title: null,
           nodeName: null,
           variable_type: 'STRING',  
           valueSelectorArr:[],
           valueSelectorData:value_selector
         }
       );
    });
  }

