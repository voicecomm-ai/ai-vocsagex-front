import { useCallback } from "react";
import { useStore } from "@/store/index";
import { useReactFlow } from "@xyflow/react";
export const useParent = () => {
  const reactFlowInstance = useReactFlow();
  const calculateChildNodesBounds = useCallback(
    (parentId) => {
      const nodes = reactFlowInstance.getNodes();
      const parentNode =
        reactFlowInstance.getNode(parentId) ||
        nodes.find((node) => node.id === parentId);

      if (!parentNode) return null;

      // 获取所有子节点（排除 loop-start 节点）
      const childNodes = nodes.filter(
        (node) =>
          node.parentId === parentId &&
          node.type !== "loop-start" &&
          node.type !== "iteration-start"
      );
      // 如果没有子节点，返回null
      if (childNodes.length === 0) return null;

      // 计算子节点的包围盒
      let minX = Infinity;
      let minY = Infinity;
      let maxRight = -Infinity;
      let maxBottom = -Infinity;

      // Header 高度（55px）- 子节点的位置是相对于父节点的，需要考虑 header
      const headerHeight = 55;

      childNodes.forEach((childNode) => {
        const childX = childNode.position?.x || 0;
        // 子节点的 y 坐标是相对于父节点的，如果小于 header 高度，说明在 header 区域
        // 我们需要确保计算时考虑实际的子节点位置
        const childY = childNode.position?.y || 0;
        // 获取子节点的实际尺寸
        const childWidth = childNode.measured?.width || childNode.width || 320;
        const childHeight =
          childNode.measured?.height || childNode.height || 100;

        // 计算子节点的边界
        minX = Math.min(minX, childX);
        // 如果子节点的 y 坐标小于 header 高度，说明它可能被 header 遮挡
        // 但我们仍然使用实际的 y 坐标，因为 ReactFlow 可能会自动调整
        minY = Math.min(minY, childY);
        const childRight = childX + childWidth;
        const childBottom = childY + childHeight;
        maxRight = Math.max(maxRight, childRight);
        maxBottom = Math.max(maxBottom, childBottom);
      });

      // 如果没有有效的子节点位置信息，返回null
      if (
        !isFinite(minX) ||
        !isFinite(minY) ||
        !isFinite(maxRight) ||
        !isFinite(maxBottom)
      ) {
        return null;
      }

      // 添加边距（确保子节点不会紧贴边界）
      const margin = 20;

      // 计算父节点需要的最小尺寸
      const minRequiredWidth =
        minX < 0 ? maxRight - minX + margin * 2 : maxRight + margin;

      const minRequiredHeight =
        minY < 0 ? maxBottom - minY + margin * 2 : maxBottom + margin;

      // 确保最小尺寸
      const absoluteMinWidth = 500;
      const absoluteMinHeight = 200;

      // 计算实际需要的最小尺寸
      const requiredWidth = Math.max(minRequiredWidth, absoluteMinWidth);
      const requiredHeight = Math.max(minRequiredHeight, absoluteMinHeight);

      return {
        width: requiredWidth,
        height: requiredHeight,
      };
    },
    [reactFlowInstance]
  );

  //获取父节点所有子节点的变量
  //获取循环节点子节点所有引用的变量
  const getParentChildVariables = useCallback(
    (id) => {
      const nodeArr= JSON.parse(JSON.stringify(reactFlowInstance.getNodes()));
      console.log(nodeArr,'测试数据')
      let childVariables = [];
      const childNodes = nodeArr.filter(
        (node) =>
          node.parentId === id &&
          node.type != "loop-start" &&
          node.type != "iteration-start"
      );
      childNodes.forEach((node) => {
        if (node.type == "question-classifier") {
          let arr = getIntentionClassificationVariables(node);
          childVariables.push(...arr);
        }
        if (node.type == "if-else") {
          let arr = getIfElseVariables(node.data);
          childVariables.push(...arr);
        }
        if (node.type == "assigner") {
          let arr = getVariableAssignmentVariables(node.data);
          childVariables.push(...arr);
        }
        //参数提取
        if (node.type == "parameter-extractor") {
          let arr = getParameterExtractorVariables(node.data);
          childVariables.push(...arr);
        }
        //大模型
        if (node.type == "llm") {
          let arr = getLlmVariables(node.data);
          childVariables.push(...arr);
        }
        //知识检索
        if (node.type == "knowledge-retrieval") {
          let arr = getKnowledgeRetrievalVariables(node.data);
          childVariables.push(...arr);
        }
        //文档解析
        if (node.type == "document-extractor") {
          let arr = getDocumentExtractorVariables(node.data);
          childVariables.push(...arr);
        }
        //执行代码
        if (node.type == "code") {
          let arr = getCodeVariables(node.data);
          childVariables.push(...arr);
        }
        //外部接口
        if (node.type == "http-request") {
          let arr = getHttpRequestVariables(node.data);
          childVariables.push(...arr);
        }
        if (node.type == "mcp") {//MCP节点
          let arr = getMcpVariables(node.data);
          childVariables.push(...arr);
        }
        if(node.type=='variable-aggregator'){//变量聚合节点
          let arr = getVariableAggregatorVariables(node.data);
          childVariables.push(...arr);
        }
         //智能体节点
         if(node.type == "agent"){
          let arr = getAgentNodeVariables(node.data);
          childVariables.push(...arr);
        } 
        //工作流节点
        if(node.type =='workflow'){
          let arr = getWorkflowNodeVariables(node.data);
          childVariables.push(...arr);
        }
      });
      return childVariables;
    },
    [reactFlowInstance]
  );
   //获取工作流节点所引用的变量
   const getWorkflowNodeVariables = (data) => {
    const params = data.param || [];
    let workflowVars = [];
    params.forEach((param) => {
      if(param.value_type == 'Variable'&& param.value){
        workflowVars.push(handleVariableToValue(param.value));
      }
    });
    return workflowVars;
  };


  //获取智能体节点所引用的变量
  const getAgentNodeVariables = (data) => {
    const params = data.param || [];
     let agentVars = [];
     if(data.query_value_type=='Variable' && data.queryValue){
      agentVars.push(handleVariableToValue(data.queryValue));
     }
    params.forEach((param) => {
    if(param.value_type == 'Variable'&& param.value){
     agentVars.push(handleVariableToValue(param.value));
    }
    });
  
    return agentVars;
  };
  //获取变量聚合节点所引用的变量
  const getVariableAggregatorVariables = (data) => {
    let variables = [];
    let groups = data.advanced_settings.groups || [];
    groups.forEach((group) => {
      let variables = group.variables || [];
      variables.forEach((variable) => {
        if(variable){
          variables.push(variable);
        }
      });
    });
    return variables;
  };
  //获取意图分类所引用的变量

  const getIntentionClassificationVariables = (node) => {
    let data = node.data;
    let variables = [];
    let instruction = data.instruction || "";
    if (instruction) {
      const matches = instruction.match(/{{#(.*?)#}}/g);
      if (matches) {
        matches.forEach((match) => {
          const variable = match.match(/{{#(.*?)#}}/);
          if (variable && variable[1]) {
            if (!variables.includes(variable[1])) {
              variables.push(splitByDot(variable[1]));
            }
          }
        });
      }
    }
    return variables;
  };
  //获取条件分支的变量

  const getIfElseVariables = (data) => {
    const results = [];

    // 用来从字符串中提取所有 {{#...#}}
    function extractBraces(str) {
      const regex = /\{\{#.*?#\}\}/g;
      const matches = str.match(regex) || [];
      return matches.map((m) => ({ text: m }));
    }

    function traverse(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else if (obj && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj)) {
          if (
            key === "variable_selector" &&
            Array.isArray(value) &&
            value.length
          ) {
            const text = `{{#${value.join(".")}#}}`;
            results.push({ text });
          }
          if (
            key === "value" &&
            typeof value === "string" &&
            value.includes("{{#")
          ) {
            console.log(value, "value222");
            results.push(...extractBraces(value));
          }
          traverse(value);
        }
      }
    }

    traverse(data);

    // 去重
    const unique = [];
    const seen = new Set();
    for (const item of results) {
      if (!seen.has(item.text)) {
        seen.add(item.text);
        unique.push(item);
      }
    }

    const resultVar = transformArray(unique);
    return resultVar;
  };

  //获取变量赋值节点所引用的变量
  const getVariableAssignmentVariables = (data) => {
    let variables = [];
    let items = data.items || [];
    items.forEach((item) => {
      if (
        (item.operation == "over-write" ||
          item.operation == "append" ||
          item.operation == "extend") &&
        item.value
      ) {
        variables.push(item.value);
      }
    });
    return variables;
  };

  //获取参数提取节点所引用的变量
  const getParameterExtractorVariables = (data) => {
    let parameterVars = [];
    let instruction = data.instruction || "";
    if (instruction) {
      const matches = instruction.match(/{{#(.*?)#}}/g);
      if (matches) {
        matches.forEach((match) => {
          const variable = match.match(/{{#(.*?)#}}/);
          if (variable && variable[1]) {
            if (!parameterVars.includes(variable[1])) {
              parameterVars.push(splitByDot(variable[1]));
            }
          }
        });
      }
    }
    return parameterVars;
  };
  //获取大模型节点所引用的变量
  const getLlmVariables = (data) => {
    let llmVars = [];
    let prompt_template = data.prompt_template || [];
    // 提取llm节点中的所有变量
    prompt_template.forEach((item) => {
      const matches = item.text.match(/{{#(.*?)#}}/g);
      if (matches) {
        matches.forEach((match) => {
          const variable = match.match(/{{#(.*?)#}}/);
          if (variable && variable[1]) {
            // 变量格式如 start.xxx，分割后[0]=start,[1]=xxx
            // 如果不存在重复才push进数组
            if (!llmVars.includes(variable[1])) {
              llmVars.push(splitByDot(variable[1]));
            }
          }
        });
      }
    });
    return llmVars;
  };
  //获取文档解析节点所引用的变量
  const getDocumentExtractorVariables = (data) => {
    let variable_selector = data.variable_selector;
    let documentVars = [];
    if (variable_selector) {
      documentVars.push(variable_selector);
    }
    return documentVars;
  };
  //获取知识检索节点所引用的变量
  const getKnowledgeRetrievalVariables = (data) => {
    let knowledgeVars = [];
    let query_variable_selector = data.query_variable_selector;
    if(query_variable_selector){
      knowledgeVars.push(query_variable_selector);
    }
    return knowledgeVars;
  };
  //获取执行代码节点所引用的变量
  const getCodeVariables = (data) => {
    let runInputs = data.runInputs;
    let codeVars = [];
    if (runInputs) {
      runInputs.forEach((input) => {
        codeVars.push(input.value_selector);
      });
    }

    return codeVars;
  };

  //获取外部接口节点所引用的变量
  const getHttpRequestVariables = (data) => {
    const urlDatas = data?.url
      ? [
          {
            text: data?.url,
          },
        ]
      : [];
    const headerDatas = data?.headers
      ? [
          {
            text: data.headers,
          },
        ]
      : [];

    const paramDatas = data?.params
      ? [
          {
            text: data.params,
          },
        ]
      : [];
    let bodyTableVars = [];
    let bodyInputVars = [];
    let bodyBinary = [];
    switch (data.body.type) {
      case "none":
        bodyInputVars = [];
        break;
      case "json":
      case "raw-text":
        bodyInputVars = [
          {
            text: data.body.data[0].value,
          },
        ];
        break;
      case "x-www-form-urlencoded":
        let string = convertKeyValueArrayToString(data.body.data);
        bodyTableVars = [
          {
            text: string,
          },
        ];
        break;
      case "form-data":
        // console.log(nodeData.data.body.data);
        // let dataObj = [...nodeData.data.body.data];
        // let newData = dataObj.map((item) => {
        //   if (item.type === "text") {
        //     return item;
        //   } else {
        //     const newValue = item.value ? Array.isArray(item.value) ? item.value.join("."): item.value : "";
        //     item.value = newValue;
        //     return item;
        //   }
        // });
        // newData.forEach((data) => {
        //   if (data.type === "file") {
        //     data.value = data.value ? !data.value.includes('{{#') ? `{{#${data.value}#}}` : data.value : "";
        //   }
        // });
        let textString = convertKeyValueArrayToString(data.body.data);
        bodyTableVars = [
          {
            text: textString,
          },
        ];
        break;
      case "binary":
        const dataVlaue = data.binaryVars;
        dataVlaue.required = true;
        dataVlaue.allowed_file_upload_methods = ["local_file", "remote_url"];
        dataVlaue.max_length = 5;
        dataVlaue.allowed_file_types = [];
        const variableQuery = dataVlaue.value_selector.join(".");
        bodyBinary = dataVlaue
          ? [
              {
                variableQuery,
                ...dataVlaue,
              },
            ]
          : [];
        break;
    }
    let middleData = [
      ...transformArray(urlDatas),
      ...transformArray(headerDatas),
      ...transformArray(paramDatas),
      ...transformArray(bodyTableVars),
      ...transformArray(bodyInputVars),
      ...transformArray(bodyBinary),
    ];
    return middleData;
  };
  //获取MCP节点所引用的变量
  const getMcpVariables = (data) => {
    let middleData = [];
    let param = data.param;
    param.forEach((item) => {
      if (item.value_type === "Variable") {
        middleData.push({ text: item.value });
      }
    });
    let result = transformArray(middleData);

    return result;
  };
  //提取{{}}
  const transformArray = (arr) => {
    return arr
      .map((item) => {
        // 使用正则提取 {{#...#}} 中的内容
        const match = item.text.match(/{{#(.*?)#}}/);
        if (!match) return null;

        // 用点分割字符串
        return match[1].split(".");
      })
      .filter(Boolean); // 去掉可能的 null
  };
  const convertKeyValueArrayToString = (arr) => {
    // 遍历数组，将每个对象转换为 "key:value" 格式
    const stringItems = arr.map((item) => {
      // 拼接 key 和 value，中间用冒号分隔
      return `${item.key}:${item.value}`;
    });

    // 用换行符 \n 拼接所有项
    return stringItems.join("\n");
  };
  //分割
  const splitByDot = (str) => {
    return str.split(".");
  };

   //转换变量 从{{#38638f54-b6e5-4036-9c5b-2e1056ccc2f3.test_text#}} 转换为 ["38638f54-b6e5-4036-9c5b-2e1056ccc2f3", "test_text"]
 const handleVariableToValue = (value) => {
  //判断value是否为boolean类型
  if (value && typeof value === "boolean") {
    return value;
  }
  if (value && isWrappedField(value)) {
    return value.split("{{#")[1].split("#}}")[0].split(".");
  }
  return value;
};
//判断value是否为包裹字段
const isWrappedField = (str) => {
  const pattern = /^\{\{#.*#\}\}$/;
  return pattern.test(str);
};
  return { calculateChildNodesBounds, getParentChildVariables };
};
