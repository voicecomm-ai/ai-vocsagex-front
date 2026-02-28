

import { useCallback } from "react";

import { useApi } from "../nodes/ApiRequest/hooks/use-api";
import {useValidateConditions} from "../nodes/IfElse/hooks/use-ifelse"
/**
 * 工作流节点校验 Hook
 * 提供对画布内不同类型节点的必填项检查能力
 */
export const useCheck = (nodes) => {
  const validateConditions = useValidateConditions()
  /**
   * 检查画布中所有节点的必填项是否已填写
   * @returns {boolean} true 表示全部通过，false 表示存在未填写的必填项
   */
  const checkNodeRequired = useCallback((nodes) => {
    let isRequired = false; //是否必填
    for (const node of nodes) {
      let data = node.data; //节点数据
      // 开始节点：目前无强制必填项
      if (data.type == "start") {
      }
      // 大模型（LLM）节点
      if (data.type == "llm") {
        if (!checkLlmNodeRequired(data)) return false;
      }
      // 意图分类节点
      if (data.type == "question-classifier") {
        if (!checkQuestionClassifierNodeRequired(data)) return false;
      }
      // 知识检索节点
      if (data.type == "knowledge-retrieval") {
        if (!checkKnowledgeRetrievalNodeRequired(data)) return false;
      }
      // 文档解析节点
      if (data.type == "document-extractor") {
        if (!checkDocumentExtractorNodeRequired(data)) return false;
      }
      // 自定义代码节点
      if (data.type == "code") {
        if (!checkCodeNodeRequired(data)) return false;
      }
      // HTTP 请求节点
      if (data.type == "http-request") {
        if (!checkHttpRequestNodeRequired(data)) return false;
      }
      // 参数提取节点
      if (data.type == "parameter-extractor") {
        if (!checkParameterExtractorNodeRequired(data)) return false;
      }
      // 条件分支节点
      if (data.type == "if-else") {
        if (!checkIfElseNodeRequired(data)) return false;
      }
      // MCP 工具调用节点
      if (data.type == "mcp") {
        if (!checkMcpNodeRequired(data)) return false;
      }
      // 结束节点：目前无强制必填项
      if (data.type == "end") {
      }
    }
    return true;
  }, []);

  /**
   * 检查开始节点必填项
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkStartNodeRequired = (data) => {};
  /**
   * 检查大模型（LLM）节点必填项
   * 必填：system 角色的提示词内容
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkLlmNodeRequired = (data) => {
    let prompt_template = data.prompt_template;
    let system_prompt = prompt_template.find((item) => item.role === "system");
    if (!system_prompt.text) {
      return false;
    }
    return true;
  };
  /**
   * 检查意图分类节点必填项
   * 必填：query_variable_selector
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkQuestionClassifierNodeRequired = (data) => {
    if (!data.query_variable_selector) return false;
    return true;
  };
  /**
   * 检查知识检索节点必填项
   * 必填：非空的数据集 data.dataSet_list；非空查询变量 data.query_variable_selector
   * 可选增强：当启用多路检索或自动元数据过滤时，相关模型配置需完整
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkKnowledgeRetrievalNodeRequired = (data) => {
    // 数据集必须存在且非空
    if (!Array.isArray(data.dataSet_list) || data.dataSet_list.length === 0) {
      return false;
    }
    // 查询变量必须存在且非空
    if (
      !Array.isArray(data.query_variable_selector) ||
      data.query_variable_selector.length === 0
    ) {
      return false;
    }
    // 多路检索配置的相关判定
    if (data.multiple_retrieval_config) {
      const configData = data.multiple_retrieval_config;
      if (
        (configData.reranking_mode === "reranking_model" &&
          !(configData.reranking_model && configData.reranking_model.id)) ||
        (configData.reranking_mode === "weighted_score" &&
          !(
            configData.weights &&
            configData.weights.model &&
            configData.weights.model.id
          ))
      ) {
        return false;
      }
    }
    // 元数据过滤模式为 automatic 时，metadata_model.id 必填
    if (
      data.metadata_filtering_mode === "automatic" &&
      !(data.metadata_model && data.metadata_model.id)
    ) {
      return false;
    }
    return true;
  };
  /**
   * 检查文档解析节点必填项
   * 必填：inputItem
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkDocumentExtractorNodeRequired = (data) => {
    if (!data.inputItem) {
      return false;
    }
    return true;
  };
  /**
   * 检查结束节点必填项（当前无强制项）
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkEndNodeRequired = (data) => {
    return true;
  };
  /**
   * 检查参数提取节点必填项
   * 必填：query 非空；parameters 至少包含一项
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkParameterExtractorNodeRequired = (data) => {
    if (!data.query) return false;
    if (data.parameters.length === 0) return false;
    return true;
  };
  /**
   * 检查代码节点必填项
   * 必填：存在 codeOutputs，且 outputs 的键有效；当存在 runInputs 时，variables 内的变量与取值选择需完整
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkCodeNodeRequired = (data) => {
    if (data?.codeOutputs?.length) {
      for (const key in data.outputs) {
        if (key === "" || !Object.keys(data.outputs)?.length) {
          return false;
        }
      }
    } else {
      return false;
    }
    if (data.runInputs.length) {
      if (data.variables) {
        let input_empty = data.variables.find(
          (item) => !item.variable || !item.value_selector.length
        );
        if (input_empty) {
          return false;
        }
      }
    }
    return true;
  };
  /**
   * 检查 MCP 节点必填项
   * 必填：mcp_id
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkMcpNodeRequired = (data) => {
    let param = data.param;
    let isRequired = param.find(item => item.required&&!item.value);
      if(isRequired){
        return false;
      } 
    return true;
  };
  /**
   * 检查 HTTP 请求节点必填项
   * 必填：url
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkHttpRequestNodeRequired = (data) => {
    if (!data.url) return false;
    return true;
  };
  /**
   * 检查条件分支节点必填项
   * 必填：condition
   * @param {Object} data 节点数据
   * @returns {boolean}
   */
  const checkIfElseNodeRequired = (data) => {
    const isValid = validateConditions(data,false);
    if (!isValid) return false;
    return true;
  };
 
  //检查变量赋值节点必填项
  const checkVariableAssignmentNodeRequired = (data) => {
 
    return true;
  };

  //检查循环节点必填项  
  const checkLoopNodeRequired = (data) => {
    let isPassed = true;
    console.log(data, '测试循环节点数据')
    let loop_variables = data.loop_variables || [];//循环变量
    let break_conditions = data.break_conditions || []  ; //循环中止条件
    loop_variables.forEach(loopVariable => {
    if(!loopVariable.label) {//不存在变量名称
      isPassed = false;
    }
    if(loopVariable.value === undefined || loopVariable.value === null || loopVariable.value === '') {
      isPassed = false;
    }
    })  
    
    break_conditions.forEach(breakCondition => {
    if(!breakCondition.numberVarType=='constant'&&!variable_selector) {//不存在变量名称
      isPassed = false;
    }
    if(breakCondition.comparison_operator!='empty'&& breakCondition.comparison_operator!='not empty') {
    if(breakCondition.value === undefined || breakCondition.value === null || breakCondition.value === '') {
      isPassed = false;
    } 
  }
    });
    return isPassed;
  };
  
  //验证批处理节点是否必填
  const checkIterationNodeRequired =(data)=>{
 let isPassed=true;
 let iterator_selector = data.iterator_selector || [];
 let output_selector = data.output_selector || [];
 if(iterator_selector.length===0) {
  isPassed = false;
 }
 if(output_selector.length===0) {
  isPassed = false;
 }
 return isPassed;
 
  }
  //验证工作流节点必填项
  const checkWorkflowNodeRequired = (data) => {
    let isPassed = true;
    let param = data.param;
    let isRequired = param.find(
      item =>
        item.required &&
        (item.value === undefined || item.value === null || (item.value === '' && item.value !== 0))
    );
    if (isRequired) {
      isPassed = false;
    }
    return isPassed;
  };

  //验证智能体节点必填项
  const checkAgentNodeRequired = (data) => {
    let isPassed = true;
    let param = data.param;
    if(!data.queryValue) {
      isPassed = false;
    }
    let isRequired = param.find(item => item.required&&   (item.value === undefined || item.value === null || (item.value === '' && item.value !== 0)));
    if(isRequired){
      isPassed = false;
    }
    return isPassed;
  }


  //验证应用是否下架
  const checkApplicationStatus = async (data) => {
    let isPassed = true;
    let appId = data.appId;
    let res = await checkApplicationStatusEvent(appId);
    if(!res){
      isPassed = false;
    }
  }

  return { checkNodeRequired ,checkLoopNodeRequired,checkIterationNodeRequired,checkWorkflowNodeRequired,checkAgentNodeRequired};
};
