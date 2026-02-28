import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import _ from "lodash";

/**
 * 变量类型枚举
 * 定义了工作流中支持的所有变量类型
 */
export const VarType = {
  string: "string",
  number: "number",
  secret: "secret",
  boolean: "boolean",
  object: "object",
  file: "file",
  array: "array",
  arrayString: "array[string]",
  arrayNumber: "array[number]",
  arrayObject: "array[object]",
  arrayFile: "array[file]",
  any: "any",
};

/**
 * 输出类型映射
 * 用于变量聚合节点等场景的输出类型定义
 * 支持基本类型和数组类型
 */
export const OUTPUT_TYPE = {
  string: "string",
  number: "number",
  secret: "secret",
  boolean: "boolean",
  object: "object",
  file: "file",
  array: "array",
  "array[string]": "array[string]",
  "array[object]": "array[object]",
  "array[file]": "array[file]",
  "array[any]": "array[any]",
  "array[number]": "array[number]",
  "array[boolean]": "array[boolean]",
};

/**
 * 文件类型字段列表
 * 用于文件类型变量的子字段定义，包括文件名、大小、类型等元数据信息
 */
const FILE_FIELDS = [
  "name", // 文件名
  "size", // 文件大小（字节）
  "type", // 文件类型
  "extension", // 文件扩展名
  "mime_type", // MIME 类型
  "transfer_method", // 传输方式
  "url", // 文件URL
  "related_id", // 关联ID
];

/**
 * 规范化变量类型
 * 如果类型不存在或不在支持的类型列表中，则返回默认的 string 类型
 * @param {string} type - 原始类型字符串
 * @returns {string} 规范化后的类型
 */
const normalizeVarType = (type) => {
  if (!type) return VarType.string;
  return Object.values(VarType).includes(type) ? type : VarType.string;
};

/**
 * 提取数组类型中的内部类型
 * 从类似 "array[string]" 或 "Array<String>" 的字符串中提取内部类型
 * @param {string} typeStr - 类型字符串，如 "array[string]"
 * @returns {string|null} 提取的内部类型，如 "string"，如果无法提取则返回 null
 */
const extractInnerType = (typeStr) => {
  if (typeof typeStr !== "string") return null;
  // 匹配 array[string] 或 Array<String> 等格式
  const match = typeStr.match(
    /^[a-zA-Z]+\s*[\[\<]\s*([^\]\>]+)\s*[\]\>]\s*$/
  );
  return match ? match[1].trim() : null;
};

/**
 * 工作流节点数据管理 Hook
 * 提供节点变量的提取、查询、引用管理等核心功能
 * @returns {Object} 包含各种节点数据操作方法的对象
 */
export const useNodeData = () => {
  const reactFlowInstance = useReactFlow();

  /**
   * 创建变量项的基础结构
   * 用于统一生成变量项的通用字段，确保所有变量项具有一致的数据结构
   * @param {Object} params - 参数对象
   * @param {string} params.nodeId - 节点ID
   * @param {string} params.variable - 变量名
   * @param {string} params.variableType - 变量类型（VarType 枚举值）
   * @param {string} params.nodeType - 节点类型
   * @param {string} params.title - 节点标题
   * @param {Array<string>} params.valueSelector - 值选择器数组，用于定位变量值
   * @param {Object} [params.extraFields={}] - 额外的字段，会合并到返回对象中
   * @returns {Object} 变量项对象，包含变量相关的所有元数据信息
   */
  const createVariableItem = ({
    nodeId,
    variable,
    variableType,
    nodeType,
    title,
    valueSelector,
    extraFields = {},
  }) => {
    return {
      label: variable, // 变量标签名，显示用
      value_selector: valueSelector, // 变量的值选择器
      variable_type: variableType, // 变量类型
      variable: variable, // 变量名
      variable_name: variable, // 变量名（兼容性字段）
      nodeId: nodeId, // 所属节点的ID
      nodeType: nodeType, // 所属节点类型
      title: title || nodeId, // 节点标题（或ID）
      nodeName: title || nodeId, // 节点名称（或ID）
      valueSelectorArr: valueSelector, // 值选择器数组
      type:variableType,
      ...extraFields, // 额外拓展字段
    };
  };

  /**
   * 提取节点的所有变量
   * 根据节点类型提取对应的输出变量，构建变量树结构
   * 支持多种节点类型：普通节点、LLM、MCP、知识检索、问题分类、参数提取、文档提取、变量聚合、批处理、HTTP请求、代码、循环等
   * @param {Object} node - 节点对象，包含 data 属性
   * @param {boolean} [isParent=false] - 是否为父节点上下文，用于批处理节点等场景
   * @returns {Object} 包含节点信息和变量子项的树形结构
   * @returns {string} returns.title - 节点标题
   * @returns {string} returns.nodeId - 节点ID
   * @returns {string} returns.nodeType - 节点类型
   * @returns {Array<Object>} returns.children - 变量子项数组
   * @returns {string} returns.icon - 节点图标路径
   */
  const extractNodeVariables = useCallback((node, isParent = false) => {
    /**
     * 创建文件类型变量的子字段项
     * 为文件类型变量生成子字段（如 name、size、url 等）
     * @param {string} nodeId - 节点ID
     * @param {string} variable - 父变量名
     * @param {string} nodeType - 节点类型
     * @param {string} nodeTitle - 节点标题
     * @returns {Array<Object>} 文件字段变量项数组
     */
    const createFileFieldItems = (nodeId, variable, nodeType, nodeTitle) => {
      return FILE_FIELDS.map((field) =>
        createVariableItem({
          nodeId,
          variable: field,
          variableType: field === "size" ? VarType.number : VarType.string,
          nodeType,
          title: nodeTitle,
          valueSelector: [nodeId, variable, field],
          extraFields: {
            variable_name: `${variable}.${field}`,
          },
        })
      );
    };
    const nodeType = node.data.type || "user";
    const nodeTitle = node.data.title || node.id;
    const children = [];

    // 处理普通节点的变量（排除 code 类型节点）
    if (nodeType !== "code" && node.data.variables) {
      node.data.variables.forEach((v) => {
        const variableType =
          v.type === "file-list" ? VarType.arrayFile : normalizeVarType(v.type);
        const valueSelector = [node.id, v.variable];

        // 创建基础变量项
        const baseItem = createVariableItem({
          nodeId: node.id,
          variable: v.variable,
          variableType: variableType,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: valueSelector,
          extraFields: {
            type: v.type,
            allowed_file_types: v.allowed_file_types,
            allowed_file_extensions: v.allowed_file_extensions,
            allowed_file_upload_methods: v.allowed_file_upload_methods,
            options: v.options,
            max_length: v.max_length,
          },
        });

        // 如果是文件类型，添加文件字段子项
        if (v.type === "file") {
          baseItem.children = createFileFieldItems(
            node.id,
            v.variable,
            nodeType,
            nodeTitle
          );
        }

        children.push(baseItem);
      });
    }

    // if (nodeType === "start") {
    //   const sysList = [
    //     ["sys.user_id", ["sys", "user_id"], VarType.string],
    //     ["sys.app_id", ["sys", "app_id"], VarType.string],
    //     ["sys.workflow_id", ["sys", "workflow_id"], VarType.string],
    //     ["sys.workflow_run_id", ["sys", "workflow_run_id"], VarType.string],
    //   ];

    //   sysList.forEach(([label, selector, type]) => {
    //     children.push({
    //       label,
    //       value_selector: selector,
    //       variable_type: normalizeVarType(type),
    //       variable: label,
    //       variable_name: label,
    //       nodeId: node.id,
    //       nodeType: nodeType,
    //       title: node.data.title || node.id,
    //       nodeName: node.data.title || node.id,
    //       valueSelectorArr: selector
    //     });
    //   });
    // }

    // LLM 节点：输出文本和结构化输出
    if (nodeType === "llm") {
      // 添加文本输出变量
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "text",
          variableType: VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "text"],
        })
      );

      // 处理结构化输出
      const schema = node.data.structured_output?.schema;
      if (node.data.structured_output_enabled && schema?.properties) {
        // 添加结构化输出对象变量
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: "structured_output",
            variableType: VarType.object,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, "structured_output"],
          })
        );

        // 添加结构化输出的各个属性变量
        Object.entries(schema.properties).forEach(([key, prop]) => {
          children.push(
            createVariableItem({
              nodeId: node.id,
              variable: key,
              variableType: normalizeVarType(prop?.type),
              nodeType: nodeType,
              title: nodeTitle,
              valueSelector: [node.id, "structured_output", key],
            })
          );
        });
      }
    }

    // MCP 节点：输出结果
    if (nodeType === "mcp") {
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "result",
          variableType: VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "result"],
        })
      );
    }

    // 知识检索节点：输出结果数组
    if (nodeType === "knowledge-retrieval") {
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "result",
          variableType: VarType.arrayObject,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "result"],
        })
      );
    }
       // 智能体节点：输出结果数组
       if (nodeType === "agent") {
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: "result",
            variableType: VarType.string,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, "result"],
          })
        );
      }
         // 工作流节点：输出结果数组
    if (nodeType === "workflow") {
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "text",
          variableType: VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "text"],
        })
      );
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "files",
          variableType: VarType.arrayFile,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "files"],
        })
      );
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "json",
          variableType: VarType.arrayObject,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "json"],
        })
      );
    }

    // 问题分类节点：输出分类名称
    if (nodeType === "question-classifier") {
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "class_name",
          variableType: VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "class_name"],
        })
      );
    }
    // 参数提取节点：输出使用量和提取的参数
    if (nodeType === "parameter-extractor") {
      // 添加使用量变量
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "usage",
          variableType: VarType.object,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "usage"],
          extraFields: {
            description: "模型用量信息",
          },
        })
      );

      // 添加提取的参数变量
      const outputParams = node.data.parameters || [];
      outputParams.forEach((item) => {
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: item.name,
            variableType: item.type,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, item.name],
            extraFields: {
              description: item.description,
            },
          })
        );
      });
    }

    // 文档提取节点：输出提取的文本
    // 根据 is_array_file 配置决定输出类型为字符串数组还是单个字符串
    if (nodeType === "document-extractor") {
      const nodeData = node.data;
      children.push(
        createVariableItem({
          nodeId: node.id,
          variable: "text",
          variableType: nodeData.is_array_file
            ? VarType.arrayString
            : VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "text"],
        })
      );
    }
    // 变量聚合节点：根据配置的分组提取变量
    if (nodeType === "variable-aggregator") {
      const nodeData = node.data;
      const advancedSettings = nodeData.advanced_settings || {};
      const groups = advancedSettings.groups || [];

      groups.forEach((group) => {
        // 为每个分组创建一个对象变量，包含 output 子变量
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: group.group_name,
            variableType: VarType.object,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, group.group_name],
            extraFields: {
              children: [
                createVariableItem({
                  nodeId: node.id,
                  variable: "output",
                  variableType:
                    group.output_type === "any"
                      ? VarType.string
                      : OUTPUT_TYPE[group.output_type] || VarType.string,
                  nodeType: nodeType,
                  title: nodeTitle,
                  valueSelector: [node.id, group.group_name, "output"],
                }),
              ],
            },
          })
        );
      });
    }
    // 批处理节点（迭代节点）
    // 根据 isParent 参数决定提取父节点变量还是子节点变量
    if (nodeType === "iteration") {
      const nodeData = node.data;
      if (isParent) {
        // 父节点上下文：提取迭代项变量（item）和索引变量（index）
        const outputType = nodeData?.iterator_input_type || "array[string]";
        const innerType = extractInnerType(outputType);
        const baseItem = createVariableItem({
          nodeId: node.id,
          variable: "item",
          variableType: VarType[innerType] || VarType.string,
          nodeType: nodeType,
          title: nodeTitle,
          valueSelector: [node.id, "item"],
          extraFields:{
              allowed_file_upload_methods : [
                "local_file",
                "remote_url",
              ],  
              max_length : 5,
              allowed_file_types : []
          }
        });
        // 如果是文件类型，添加文件字段子项
        if (innerType === "file") {
          baseItem.children = createFileFieldItems(
            node.id,
            "item",
            nodeType,
            nodeTitle
          );
        }
        children.push(baseItem);
        // 添加索引变量
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: "index",
            variableType: VarType.number,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, "index"],
          })
        );
      } else {
        // 非父节点上下文：提取批处理节点的输出变量
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: "output",
            variableType: nodeData.output_type,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, "output"],
          })
        );
      }
    }
    // HTTP 请求节点：输出响应数据
    if (nodeType === "http-request") {
      const outputList = [
        { variable: "body", variable_type: VarType.string },
        { variable: "status_code", variable_type: VarType.number },
        { variable: "headers", variable_type: VarType.object },
        { variable: "files", variable_type: VarType.arrayFile },
      ];

      outputList.forEach((output) => {
        children.push(
          createVariableItem({
            nodeId: node.id,
            variable: output.variable,
            variableType: output.variable_type,
            nodeType: nodeType,
            title: nodeTitle,
            valueSelector: [node.id, output.variable],
          })
        );
      });
    }
    // if (nodeType === 'question-classifier') {
    //   children.push({
    //     label: 'class_name',
    //     value_selector: [node.id, 'class_name'],
    //     variable_type: VarType.arrayObject,
    //     variable: 'class_name',
    //     variable_name: 'class_name',
    //     nodeId: node.id,
    //     nodeType: nodeType,
    //     title: node.data.title || node.id,
    //     nodeName: node.data.title || node.id,
    //     valueSelectorArr: [node.id, 'class_name'],
    //   })
    // }
    // 代码节点：输出代码执行结果
    // 从 codeOutputs 配置中提取用户定义的输出变量
    if (nodeType === "code") {
      if (node.data.codeOutputs && node.data.codeOutputs.length) {
        node.data.codeOutputs.forEach((item) => {
          // 从 value_selector 字符串中提取类型（如果存在）
          // 注意：这里尝试从 value_selector 字符串匹配类型，如果匹配不到则为 undefined
          const varType =
            item.value_selector &&
            Object.values(VarType).find(
              (type) => item.value_selector.toLowerCase() === type
            );

          children.push(
            createVariableItem({
              nodeId: node.id,
              variable: item.variable,
              variableType: varType, // 可能为 undefined，表示类型未指定
              nodeType: nodeType,
              title: nodeTitle,
              valueSelector: [node.id, item.variable],
              extraFields: {
                outputId: item.id, // 保存输出项的ID，用于后续引用
              },
            })
          );
        });
      }
    }

    // 循环节点：处理循环变量配置列表
    if (nodeType === "loop") {
      const loopVariables = node.data.loop_variables || [];
      loopVariables.forEach((item) => {
        if (item.label) {
          children.push(
            createVariableItem({
              nodeId: node.id,
              variable: item.label,
              variableType: item.var_type,
              nodeType: nodeType,
              title: nodeTitle,
              valueSelector: [node.id, item.label],
            })
          );
        }
      });
    }

    // 返回节点变量树结构
    return {
      title: nodeTitle,
      nodeId: node.id,
      nodeType,
      children,
      icon:
        nodeType === "mcp"
          ? process.env.NEXT_PUBLIC_API_BASE + node.data.mcp_url
          : nodeType === "agent" || nodeType === "workflow"?process.env.NEXT_PUBLIC_API_BASE + node.data.iconUrl: `/workflow/${nodeType}.png`,
    };
  }, []);

  /**
   * 构建变量树
   * 遍历所有已连接的节点，提取它们的变量信息，构建成树形结构
   * @returns {Array} 变量树数组，每个元素包含节点信息和其变量子项
   */
  const buildVariableTree = useCallback(() => {
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();

    // 收集所有已连接的节点ID（作为源节点或目标节点）
    const connectedNodeIds = new Set();
    edges.forEach((edge) => {
      if (edge.source) connectedNodeIds.add(edge.source);
      if (edge.target) connectedNodeIds.add(edge.target);
    });

    // 构建变量树
    const tree = [];
    nodes.forEach((node) => {
      // 只处理已连接的节点
      if (!connectedNodeIds.has(node.id)) return;

      const variableInfo = extractNodeVariables(node);
      // 只添加有变量的节点
      if (variableInfo.children.length > 0) {
        tree.push(variableInfo);
      }
    });

    return tree;
  }, [reactFlowInstance, extractNodeVariables]);

  /**
   * 获取上游节点变量
   * 通过深度优先搜索找到目标节点的所有上游节点，并提取它们的变量信息
   * 如果目标节点是子节点，还会获取其父节点及父节点的上游节点变量
   * @param {string} targetNodeId - 目标节点ID
   * @returns {Array} 上游节点的变量树数组，结构与 buildVariableTree 一致
   */
  const getUpstreamVariables = useCallback(
    (targetNodeId) => {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();

      // 构建节点映射表，便于快速查找
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));

      // 用于存储已添加的节点ID，避免重复
      const addedNodeIds = new Set();
      const visited = new Set();
      const result = [];

      /**
       * 深度优先搜索函数
       * 递归查找所有连接到当前节点的上游节点
       * @param {string} currentId - 当前节点ID
       * @param {string} originalTargetId - 原始目标节点ID，用于排除目标节点本身
       * @param {boolean} allowRevisit - 是否允许重新访问已访问过的节点（用于搜索父节点的上游节点）
       * @param {Set} currentVisited - 当前DFS遍历的访问集合，用于防止循环
       */
      const dfs = (currentId, originalTargetId, allowRevisit = false, currentVisited = null) => {
        // 为当前DFS创建独立的访问集合（如果未提供）
        const localVisited = currentVisited || new Set();
        
        // 防止循环：即使 allowRevisit=true，也要防止在同一轮DFS中重复访问
        if (localVisited.has(currentId)) {
          return;
        }
        localVisited.add(currentId);

        // 如果 allowRevisit=false，使用全局 visited 集合
        if (!allowRevisit) {
          if (visited.has(currentId)) return;
          visited.add(currentId);
        }

        // 找出所有连接到 currentId 的源节点（上游节点）
        edges.forEach((edge) => {
          if (edge.target === currentId) {
            // 传递 localVisited 以确保在同一轮DFS中不会重复访问
            dfs(edge.source, originalTargetId, allowRevisit, localVisited);
          }
        });

        // 获取目标节点的父节点ID，用于过滤
        const targetNode = nodeMap.get(originalTargetId);
        const targetParentId = targetNode?.parentId;

        // 收集当前节点的变量（但不包括目标节点自己和目标节点的父节点）
        if (
          currentId !== originalTargetId &&
          currentId !== targetParentId &&
          nodeMap.has(currentId) &&
          !addedNodeIds.has(currentId)
        ) {
          const node = nodeMap.get(currentId);
          const vars = extractNodeVariables(node);

          if (vars.children.length > 0) {
            result.push(vars);
            addedNodeIds.add(currentId);
          }
        }
      };

      // 获取目标节点本身的上游节点变量
      dfs(targetNodeId, targetNodeId);

      // 如果目标节点是子节点，还需要获取父节点及父节点的上游节点变量
      const targetNode = nodeMap.get(targetNodeId);
      if (targetNode && targetNode.parentId) {
        const parentId = targetNode.parentId;
        const parentNode = nodeMap.get(parentId);

        // 如果父节点存在，添加父节点的变量
        if (parentNode && !addedNodeIds.has(parentId)) {
          const parentVars = extractNodeVariables(parentNode, true);
          if (parentVars.children.length > 0) {
            result.push(parentVars);
            addedNodeIds.add(parentId);
          }
        }

        // 获取父节点的上游节点变量
        // 使用 allowRevisit=true 允许重新访问已访问过的节点，以便能够搜索父节点的上游节点
        // 使用独立的 localVisited 集合防止循环
        dfs(parentId, targetNodeId, true);
      }

      return result;
    },
    [reactFlowInstance, extractNodeVariables]
  );

  /**
   * 查找变量引用
   * 查找所有下游节点中对指定变量的引用
   * @param {string} startNodeId - 起始节点ID
   * @param {string} variableToCheck - 要检查的变量名
   * @returns {Array} 引用信息数组，格式: [{ nodeId, references: [...] }]
   */
  const findVariableReferences = useCallback(
    (startNodeId, variableToCheck) => {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();

      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const targetValueSelector = [startNodeId, variableToCheck];

      const visited = new Set();
      const downstreamNodeIds = new Set();

      /**
       * 深度优先搜索下游节点
       * @param {string} currentId - 当前节点ID
       */
      const dfs = (currentId) => {
        if (visited.has(currentId)) return;
        visited.add(currentId);

        // 查找所有从当前节点出发的下游节点
        edges.forEach((edge) => {
          if (edge.source === currentId) {
            downstreamNodeIds.add(edge.target);
            dfs(edge.target);
          }
        });
      };

      dfs(startNodeId);

      // 检查下游节点中是否有对目标变量的引用
      const references = [];
      downstreamNodeIds.forEach((nodeId) => {
        const node = nodeMap.get(nodeId);
        if (!node || !Array.isArray(node.data?.outputs)) return;

        // 过滤出匹配的 outputs
        const matchedOutputs = node.data.outputs.filter((output) => {
          const vs = output.value_selector;
          return (
            Array.isArray(vs) &&
            vs.length >= targetValueSelector.length &&
            targetValueSelector.every((v, i) => v === vs[i])
          );
        });

        if (matchedOutputs.length > 0) {
          references.push({
            nodeId,
            references: matchedOutputs,
          });
        }
      });

      return references;
    },
    [reactFlowInstance]
  );

  /**
   * 检查 value_selector 是否匹配目标选择器
   * @param {Array} valueSelector - 要检查的值选择器
   * @param {Array} targetSelector - 目标选择器
   * @returns {boolean} 是否匹配
   */
  const isValueSelectorMatch = (valueSelector, targetSelector) => {
    return (
      Array.isArray(valueSelector) &&
      valueSelector.length >= targetSelector.length &&
      targetSelector.every((v, i) => v === valueSelector[i])
    );
  };

  /**
   * 删除变量引用
   * 删除所有下游节点中对指定变量的引用
   * @param {string} startNodeId - 起始节点ID
   * @param {string} variableToDelete - 要删除的变量名
   */
  const deleteVariableReferences = useCallback(
    (startNodeId, variableToDelete) => {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();

      const deletedValueSelector = [startNodeId, variableToDelete];

      const visited = new Set();
      const downstreamNodeIds = new Set();

      /**
       * 深度优先搜索下游节点
       * @param {string} currentId - 当前节点ID
       */
      const dfs = (currentId) => {
        if (visited.has(currentId)) return;
        visited.add(currentId);

        edges.forEach((edge) => {
          if (edge.source === currentId) {
            downstreamNodeIds.add(edge.target);
            dfs(edge.target);
          }
        });
      };

      dfs(startNodeId);

      // 更新所有下游节点，删除对目标变量的引用
      const updatedNodes = nodes.map((node) => {
        if (!downstreamNodeIds.has(node.id)) return node;

        const { data } = node;
        const newData = { ...data };

        // 清理 outputs 中的引用
        if (Array.isArray(data.outputs)) {
          newData.outputs = data.outputs.filter(
            (output) =>
              !isValueSelectorMatch(output.value_selector, deletedValueSelector)
          );
        }

        // 清理 LLM 节点的 context.variable_selector
        // 检查数组元素是否为数组类型，如果是则进行过滤
        if (Array.isArray(data.context?.variable_selector)) {
          newData.context = {
            ...data.context,
            variable_selector: data.context.variable_selector.some(
              Array.isArray
            )
              ? data.context.variable_selector.filter(
                  (vs) => !isValueSelectorMatch(vs, deletedValueSelector)
                )
              : [],
          };
        }

        // 清理知识检索节点的 query_variable_selector
        // 检查数组元素是否为数组类型，如果是则进行过滤
        if (Array.isArray(data.query_variable_selector)) {
          newData.query_variable_selector = data.query_variable_selector.some(
            Array.isArray
          )
            ? data.query_variable_selector.filter(
                (vs) => !isValueSelectorMatch(vs, deletedValueSelector)
              )
            : [];
        }

        // 清理 question-classifier 的 classes[].name 中的模板变量引用
        // 注意：当前代码中模板替换被注释掉了，保留原逻辑
        if (Array.isArray(data.classes)) {
          newData.classes = data.classes.map((cls) => {
            if (typeof cls.name === "string") {
              // const regex = new RegExp(`{{#${startNodeId}\\.${variableToDelete}#}}`, "g");
              return {
                ...cls,
                // name: cls.name.replace(regex, ''),
              };
            }
            return cls;
          });
        }

        return {
          ...node,
          data: newData,
        };
      });

      reactFlowInstance.setNodes(updatedNodes);
    },
    [reactFlowInstance]
  );

  /**
   * 重命名变量引用
   * 更新所有节点中对指定变量的引用，将旧变量名替换为新变量名
   * @param {string} nodeId - 节点ID
   * @param {string} oldVarName - 旧变量名
   * @param {string} newVarName - 新变量名
   */
  const renameVariableReferences = useCallback(
    (nodeId, oldVarName, newVarName) => {
      // 参数验证
      if (!oldVarName || !newVarName || oldVarName === newVarName) return;

      const nodes = reactFlowInstance.getNodes();
      const oldSelector = [nodeId, oldVarName];
      const newSelector = [nodeId, newVarName];
      const templateRegex = new RegExp(`{{#${nodeId}\\.${oldVarName}#}}`, "g");
      const templateReplacement = `{{#${nodeId}.${newVarName}#}}`;

      const updatedNodes = nodes.map((node) => {
        const { data } = node;
        const newData = { ...data };
        let modified = false;

        // 更新 outputs 中的引用
        if (Array.isArray(data.outputs)) {
          newData.outputs = data.outputs.map((output) => {
            const vs = output.value_selector;
            if (isValueSelectorMatch(vs, oldSelector)) {
              modified = true;
              return {
                ...output,
                value_selector: newSelector.concat(
                  vs.slice(oldSelector.length)
                ),
              };
            }
            return output;
          });
        }

        // 更新 LLM 节点的 context.variable_selector
        if (Array.isArray(data.context?.variable_selector)) {
          newData.context = {
            ...data.context,
            variable_selector: data.context.variable_selector.map((vs) => {
              if (isValueSelectorMatch(vs, oldSelector)) {
                modified = true;
                return newSelector.concat(vs.slice(oldSelector.length));
              }
              return vs;
            }),
          };
        }

        // 更新 knowledge-retrieval 的 query_variable_selector
        if (Array.isArray(data.query_variable_selector)) {
          newData.query_variable_selector = data.query_variable_selector.map(
            (vs) => {
              if (isValueSelectorMatch(vs, oldSelector)) {
                modified = true;
                return newSelector.concat(vs.slice(oldSelector.length));
              }
              return vs;
            }
          );
        }

        // 更新 question-classifier 的 classes[].name 中的模板变量
        if (Array.isArray(data.classes)) {
          newData.classes = data.classes.map((cls) => {
            if (typeof cls.name === "string" && templateRegex.test(cls.name)) {
              modified = true;
              return {
                ...cls,
                name: cls.name.replace(templateRegex, templateReplacement),
              };
            }
            return cls;
          });
        }

        // 只有修改过的节点才返回新对象
        return modified
          ? {
              ...node,
              data: newData,
            }
          : node;
      });

      reactFlowInstance.setNodes(updatedNodes);
    },
    [reactFlowInstance]
  );

  /**
   * 根据节点ID获取节点对象
   * @param {string} nodeId - 节点ID
   * @returns {Object|undefined} 节点对象，如果不存在则返回 undefined
   */
  const getNodeById = useCallback(
    (nodeId) => {
      const nodes = reactFlowInstance.getNodes();
      return nodes.find((node) => node.id === nodeId);
    },
    [reactFlowInstance]
  );

  /**
   * 获取当前节点及其所有下游子节点的变量列表
   * 通过深度优先搜索找到目标节点的所有下游节点（包括目标节点本身），并提取它们的变量信息
   * @param {string} nodeId - 目标节点ID
   * @returns {Array} 变量树数组，包含当前节点及其所有下游节点的变量信息，结构与 buildVariableTree 一致
   */
  const getCurrentAndDownstreamVariables = useCallback(
    (nodeId) => {
      const nodes = reactFlowInstance.getNodes();

      // 构建节点映射表，便于快速查找
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));

      // 如果节点不存在，返回空数组
      if (!nodeMap.has(nodeId)) {
        return [];
      }

      const visited = new Set();
      const result = [];
      const targetNodeIds = new Set([nodeId]); // 包含目标节点本身

      /**
       * 深度优先搜索函数
       * 根据 parentId 递归查找所有子节点
       * @param {string} currentId - 当前节点ID
       */
      const dfs = (currentId) => {
        if (visited.has(currentId)) return;
        visited.add(currentId);

        // 根据 parentId 查找所有子节点
        nodes.forEach((node) => {
          if (node.parentId === currentId) {
            targetNodeIds.add(node.id);
            dfs(node.id);
          }
        });
      };

      // 从目标节点开始搜索所有子节点
      dfs(nodeId);

      // 收集所有目标节点（包括当前节点本身和所有子节点）的变量
      targetNodeIds.forEach((id) => {
        if (nodeMap.has(id)) {
          const node = nodeMap.get(id);
          const vars = extractNodeVariables(node);

          // 添加节点变量（包括当前节点本身，即使没有子节点也要添加）
          if (vars.children.length > 0) {
            result.push(vars);
          }
        }
      });

      return result;
    },
    [reactFlowInstance, extractNodeVariables]
  );

  /**
   * 从上游变量树中提取内容节点变量
   * 从 LLM 节点的内容数据中提取变量引用（格式：{{#nodeId.variable#}}），
   * 并在上游变量树中查找对应的变量信息，构建变量配置数组
   * @param {Array<Object>} data - LLM 节点的内容数据数组，每个对象包含 text 属性
   * @param {string} pannerNodeId - 面板节点ID，用于获取上游变量
   * @returns {Array<Object>} 过滤后的变量配置数组，包含变量的完整配置信息
   */
  const getContentNodeVariables = (data, pannerNodeId) => {
    const llmVars = [];

    // 从 LLM 节点内容中提取所有变量引用（格式：{{#nodeId.variable#}}）
    // 使用正则表达式匹配模板变量语法
    data.forEach((item) => {
      const matches = item.text?.match(/{{#(.*?)#}}/g);
      if (matches) {
        matches.forEach((match) => {
          const variableMatch = match.match(/{{#(.*?)#}}/);
          if (variableMatch && variableMatch[1]) {
            const variableStr = variableMatch[1]; // 变量格式如 "start.xxx"
            // 去重：如果不存在重复才添加到数组
            if (!llmVars.includes(variableStr)) {
              llmVars.push(variableStr);
            }
          }
        });
      }
    });

    // 获取上游节点的变量树结构
    const upstreamVariables = getUpstreamVariables(pannerNodeId);

    /**
     * 在变量树中查找指定变量
     * 根据变量字符串（如 "start.xxx"）在变量树中查找对应的变量对象
     * @param {Array<Object>} tree - 变量树数组，每个元素包含 nodeId 和 children
     * @param {string} varStr - 变量字符串，格式如 "start.xxx" 或 "start.xxx.field"
     * @returns {Object|null} 找到的变量对象，包含变量的所有元数据，如果不存在则返回 null
     */
    const findVariableInTree = (tree, varStr) => {
      // 将变量字符串拆分为值选择器数组
      const valueSelect = varStr.split(".");
      const stringValue = JSON.stringify(valueSelect);
      const nodeId = valueSelect[0]; // 第一个元素是节点ID

      let result = null;

      /**
       * 递归遍历变量树查找变量
       * 先找到对应的节点，然后在该节点的子变量中查找匹配的变量
       * @param {Array<Object>} nodes - 节点数组
       */
      const traverse = (nodes) => {
        if (!nodes || !Array.isArray(nodes)) return;

        for (const node of nodes) {
          // 找到对应节点ID的节点
          if (node.nodeId === nodeId) {
            // 在该节点的子变量中查找匹配的变量
            if (node.children && Array.isArray(node.children)) {
              for (const child of node.children) {
                // 通过比较 value_selector 的字符串表示来匹配
                if (JSON.stringify(child.value_selector) === stringValue) {
                  result = { ...child };
                  return; // 找到后立即返回
                }
              }
            }
          }
          // 继续递归查找子节点（处理嵌套的变量结构）
          if (node.children && Array.isArray(node.children)) {
            traverse(node.children);
            if (result) return; // 如果已找到，提前返回
          }
        }
      };

      traverse(tree);
      return result;
    };

    // 获取开始节点的变量配置
    // 需要单独处理开始节点，因为开始节点的变量配置结构不同
    const nodeData = _.cloneDeep(reactFlowInstance.getNodes());
    const startNode = nodeData.find((node) => node.type === "start");
    const startVars = startNode?.data?.variables || [];

    // 过滤并构建变量配置数组
    // 为每个提取到的变量引用构建完整的配置对象
    const filteredVars = [];
    llmVars.forEach((varStr) => {
      // 在变量树中查找对应的变量信息
      const found = findVariableInTree(upstreamVariables, varStr);
      if (!found) return; // 如果找不到，跳过该变量

      const valueQuery = found.value_selector.join(".");
      let addData = {};

      // 处理开始节点的变量
      // 开始节点的变量需要从 data.variables 中获取完整配置
      if (found.nodeType === "start") {
        const foundStart = startVars.find(
          (item) => item.variable === found.variable
        );
        if (foundStart) {
          // 使用开始节点的原始配置，并添加必要的元数据
          addData = {
            ...foundStart,
            variableQuery: valueQuery,
            nodeType: found.nodeType,
            title: found.title,
            required: true,
          };

          // 如果开始节点变量是文件或文件列表，添加文件相关配置
          if (foundStart.type === "file" || foundStart.type === "file-list") {
            addData.allowed_file_upload_methods = ["local_file", "remote_url"];
            addData.max_length = 5;
            addData.allowed_file_types = [];
          }
        } else {
          // 如果开始节点变量不存在，使用默认配置
          addData = {
            label: found.label,
            type: "text-input",
            max_length: null,
            required: true,
            variable: found.variable,
            variableQuery: valueQuery,
            nodeType: found.nodeType,
            title: found.title,
          };
        }
      } else {
        // 处理其他类型节点的变量
        if (found.nodeType === "code") {
          // 代码节点的变量类型处理
          // 根据变量类型决定输入组件类型
          const isStringOrNumber = ["string", "number"].includes(
            found.variable_type
          );
          addData = {
            label: found.label,
            type: isStringOrNumber
              ? found.variable_type === "string"
                ? "text-input"
                : "number"
              : "code",
            max_length: null,
            required: true,
            variable: found.variable,
            variable_type: found.variable_type,
            variableQuery: valueQuery,
            nodeType: found.nodeType,
            title: found.title,
          };
        } else {
          // 其他节点类型使用默认文本输入组件
          addData = {
            label: found.label,
            type: "text-input",
            max_length: null,
            required: true,
            variable: found.variable,
            variableQuery: valueQuery,
            nodeType: found.nodeType,
            title: found.title,
          };
        }
      }

      filteredVars.push(addData);
    });

    return filteredVars;
  };

  /**
   * 合并多个对象数组并根据指定键名去重
   * 使用 Map 数据结构确保唯一性，保留第一次出现的对象
   * @param {string} uniqueKey - 用于判断重复的唯一键名
   * @param {...Array} arrays - 要合并的对象数组（可变参数）
   * @returns {Array} 合并后去重的数组
   */
  const mergeAndDeduplicate = (uniqueKey, ...arrays) => {
    const uniqueMap = new Map();

    // 遍历所有数组
    arrays.forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          // 确保 item 是对象且包含指定的唯一键
          if (item && typeof item === "object" && uniqueKey in item) {
            const keyValue = item[uniqueKey];
            // 如果 Map 中不存在该键，则添加（保留第一次出现的对象）
            if (!uniqueMap.has(keyValue)) {
              uniqueMap.set(keyValue, item);
            }
          }
        });
      }
    });

    return Array.from(uniqueMap.values());
  };

  /**
   * 处理节点连线变化事件
   * 将连线变化事件传递给回调函数，用于更新边的状态
   * @param {Object} change - 变化对象，包含边的变化信息
   * @param {Function} onEdgesChange - 边变化回调函数，用于处理边的更新
   */
  const handleEdgeChangeEvent = (change, onEdgesChange) => {
    onEdgesChange(change);
  };

  // 返回所有导出的方法
  // 这些方法提供了工作流节点变量的完整管理功能
  return {
    buildVariableTree, // 构建变量树
    getUpstreamVariables, // 获取上游节点变量
    deleteVariableReferences, // 删除变量引用
    findVariableReferences, // 查找变量引用
    renameVariableReferences, // 重命名变量引用
    getNodeById, // 根据ID获取节点
    getCurrentAndDownstreamVariables, // 获取当前节点及下游子节点变量
    getContentNodeVariables, // 获取内容节点变量
    mergeAndDeduplicate, // 合并并去重数组
  };
};
