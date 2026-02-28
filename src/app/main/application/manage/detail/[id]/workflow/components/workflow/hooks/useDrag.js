import { useReactFlow } from "@xyflow/react";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { checkApplicationStatus } from "@/api/workflow";
import { isMcpAvailable } from "@/api/mcp";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";  
import { message } from "antd";
import { useNodeData } from "./useNodeData";
export const useDrag = (
  vectorModelList,
  rerankModelList,
  textModelList,

) => {
  const reactFlowInstance = useReactFlow();
  const { setUpdateTime, setMcpRefresh, setTemplateRefresh } = useStore((state) => state);
  const { getNodeById } = useNodeData();
  const dragEndEvent = async (event) => {
    event.preventDefault();
    const container = event.currentTarget;
    // 使用新的坐标转换方法
    const position = convertPosition(event, container);
    // 获取节点数据并添加节点
    const nodeDataStr = event.dataTransfer.getData("application/reactflow");
    if (nodeDataStr) {
      const nodeData = JSON.parse(nodeDataStr);
      if (nodeData.type == "mcp") {
        //mcp节点
        let status = await checkMcpAvailable(nodeData);
        if (!status) {
          //mcp节点已下架
          setMcpRefresh(true);
          return message.warning("当前MCP已下架!");
        }
        addNodeEvent(position, nodeData);
      } 
      else if (nodeData.type == "agent"  || nodeData.type == "workflow") {
        let   res = await checkApplicationStatusEvent(nodeData.appId);
        console.log(res, "res");
        if(res) {
          addNodeEvent(position, nodeData);
        } else {//应用已下架
          setTemplateRefresh(true);
         return message.warning("模板已下架!");
        }
      }
      else {
        //其他节点
        addNodeEvent(position, nodeData);
      }
    }
  };
 
  //检查应用状态
  const checkApplicationStatusEvent = async (appId) => {
    let res = await checkApplicationStatus(appId);
    let status = res.data;
    if (!status) {
      return false;
    }
    return true;
  };

  //检查mcp节点是否下架
  const checkMcpAvailable = async (mcp) => {
    let res = await isMcpAvailable(mcp.id);
    let status = res.data;
    if (!status) {
      return false;
    }
    return true;
  };
  //转换坐标
  const project = (position, viewport) => {
    // 解构视图参数并提供默认值，防止undefined错误
    const { x: viewportX = 0, y: viewportY = 0, zoom = 1 } = viewport || {};

    // 处理缩放为0的边界情况，避免除以零
    const safeZoom = zoom <= 0 ? 1 : zoom;

    // 计算转换后的坐标，添加微小精度修正
    return {
      x: Math.round(((position.x - viewportX) / safeZoom) * 100) / 100,
      y: Math.round(((position.y - viewportY) / safeZoom) * 100) / 100,
    };
  };
  //转换坐标
  const convertPosition = (event, container) => {
    const rect = container.getBoundingClientRect();
    const style = getComputedStyle(container);

    // 计算容器边框宽度
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;

    // 获取鼠标在视口中的位置
    const clientX = event.clientX - rect.left - borderLeft;
    const clientY = event.clientY - rect.top - borderTop;

    // 获取当前视图信息
    const viewport = reactFlowInstance.getViewport();

    // 使用project函数将屏幕坐标转换为流程图坐标
    return project({ x: clientX, y: clientY }, viewport);
  };

  //添加节点
  const addNodeEvent = (position, data,parentId) => {
    let addData = {};
    let nodeId = getUuid();
    let parentNode = parentId ? getNodeById(parentId) : null;
    if (data.type == "llm") {
      //llm节点
      addData = handleLlmNodeData(data);
    }

    if (data.type == "knowledge-retrieval") {
      addData = {
        query_variable_selector: [],
        multiple_retrieval_config: {
          topK: 4,
          score_threshold: 0.8, // 分数阈值。
          reranking_enable: false,
          enableScore: false,
          reranking_mode: "reranking_model", // 重新排序模式。
          reranking_model: {
            id: rerankModelList.length > 0 ? rerankModelList[0].id : null,
            name: rerankModelList.length > 0 ? rerankModelList[0].name : null,
            completion_params: {},
          },
          weights: {
            // 权重设置。
            vector_setting: {
              // 向量设置。
              vector_weight: 0.7, // 向量权重。
              embedding_provider_name: null, // 嵌入提供者名称。
              embedding_model_name: null, // 嵌入模型名称。
            },
            keyword_setting: {
              // 关键字设置。
              keyword_weight: 0.3, // 关键字权重。
            },
            model: {
              // 模型
              name: vectorModelList.length > 0 ? vectorModelList[0].name : null,
              mode: null, // 模式
              id: vectorModelList.length > 0 ? vectorModelList[0].id : null, // 模型id
              completion_params: {
                topK: null, // top_k 参数
                temperature: null, // 温度参数
                topP: null, // top_p 参数
                max_tokens: null, // 最大令牌数
                seed: null, // 随机种子
                responseFormat: null, // 响应格式
                repetitionPenalty: null, // 重复惩罚参数
                stop: [], // 停止符列表
              },
            },
          },
        },
        //检索模型
        metadata_model: {
          provider: null,
          name: null,
          mode: null,
          id: null,
          completion_params: {},
        },

        metadata_filtering_mode: "disabled", //文档过滤模式
      };
    }
  //处理变量聚合节点拖拽事件
  if (data.type == "variable-aggregator") {
    addData = handleVariableAggregatorNodeData(data);
  }
    //意图分类
    if (data.type == "question-classifier") {
      addData = handleQuestionNodeData(data);
    }
    if (data.type == "parameter-extractor") {
      addData = handleParameterExtractionNodeData(data);
    }
    if (data.type == "mcp") {
      addData = handleMcpNodeData(data);
    }
    if (data.type == "agent") {
      addData = handleAgentNodeData(data);
    }
    if (data.type == "workflow") {
      addData = handleWorkflowNodeData(data);
    }
    //处理循环节点拖拽事件
    if (data.type == "loop") {
     let loopNodeId = handleLoopNodeData(position, data);
      return loopNodeId; // 循环节点返回 null，因为会创建多个节点
    }
    //处理批处理节点拖拽事件
    if (data.type == "iteration") {
      let iterationNodeId = handleIterationNodeData(position, data);
      return iterationNodeId; // 批处理节点返回 null，因为会创建多个节点
    }
  
    const newNode = {
      id: nodeId,
      type: data.type,
      position: position,
      selected: false,
      isEditing: false, // 编辑状态
      parentId: parentId?parentId:null,//是否存在父节点id
   
      data: {
        type: data.type, //节点类型
        title: data.name, //节点标题
        desc: "", //节点描述
        id: nodeId,
        isInLoop:parentNode?.type == "loop"?true:false,//是否在循环节点中
        loop_id:parentNode?.type == "loop"?parentNode.id:null,//循环节点id
        isInIteration:parentNode?.type == "iteration"?true:false,//是否在批处理节点中
        iteration_id:parentNode?.type == "iteration"?parentNode.id:null,//批处理节点id
        ...addData,
      },
    };
    reactFlowInstance.setNodes((nodes) => [...nodes, newNode]);
    return nodeId; // 返回新节点的 ID
  };

  // 父节点生成新节点事件
  const generateNewNodeEvent = (nodeId, type, position, data, parentId, draggable = true, deletable = true,parentNodeType=null) => {
    let newNode = {
      id: nodeId,
      type: type,
      position: position,
      selected: false,
      isEditing: false, // 编辑状态
      parentId: parentId,
      draggable:draggable,//节点是否可以拖动
      deletable:deletable,//节点是否可以删除

      expandParent:type=="loop" || type=="iteration"?true:false,//节点是否可以展开父节点
      data: {
        type: type, //节点类型
        title: data?.name, //节点标题
        desc: "", //节点描述
        id: nodeId,
        ...data,
        isInLoop:parentNodeType == "loop"?true:false,//是否在循环节点中
        loop_id:parentNodeType == "loop"?parentId:null,//循环节点id
        isInIteration:parentNodeType == "iteration"?true:false,//是否在批处理节点中
        iteration_id:parentNodeType == "iteration"?parentId:null,//批处理节点id
      },
    };
    return newNode;
  };
  //处理生成批处理节点事件
  const handleIterationNodeData = (position, data) => {
    let iterationNodeId = getUuid(); //批处理节点id
    let iterationStartNodeId = getUuid(); //批处理开始节点id
    let startNodePosition = { x: 36, y: 68 }; //批处理开始节点位置
    let iterationData={
      ...data,
      desc:"",//节点描述
      start_node_id:iterationStartNodeId,//批处理开始节点id
      iterator_selector:[],
      output_selector:[],//输出变量
      is_parallel:false,//是否并行
      parallel_nums:10,//最大并行数
      error_handle_mode:'terminated',//错误处理模式
      output_type:'array[string]',//输出类型
      iterator_input_type:"",//迭代输入类型

    }
    let newIterationNode = generateNewNodeEvent(iterationNodeId, "iteration", position, iterationData, null); 
    let newIterationStartNode = generateNewNodeEvent(iterationStartNodeId, "iteration-start", startNodePosition, {}, iterationNodeId, false, false, "iteration");
    let addNodes = [newIterationNode, newIterationStartNode];
    reactFlowInstance.setNodes((nodes) => [...nodes, ...addNodes]);
    return iterationNodeId;
  }

  //处理生成循环节点事件
  const handleLoopNodeData = (position, data) => {
    let loopNodeId = getUuid(); //循环节点id
    let loopStartNodeId = getUuid(); //循环开始节点id
    let loopData={
       ...data,
        desc: "", //节点描述
       loop_variables:[],
       logical_operator:'and',
       loop_count:10,//
       start_node_id:loopStartNodeId,//
       break_conditions:[],
    }
    let loopPosition = { x: 36, y: 68 };
    let newLoopNode = generateNewNodeEvent(loopNodeId, "loop", position, loopData, null,); 
    let newLoopStartNode = generateNewNodeEvent(loopStartNodeId, "loop-start", loopPosition, {}, loopNodeId, false, false, "loop");
    let addNodes = [newLoopNode, newLoopStartNode];
    reactFlowInstance.setNodes((nodes) => [...nodes, ...addNodes]);
    return loopNodeId;
  };

  //处理生成变量聚合节点事件
  const handleVariableAggregatorNodeData = (data) => {
    let variableAggregatorData={
      ...data,
      desc:"",//节点描述
      output_type:'any',//输出类型
      variables:[],//变量
      advanced_settings:{
        group_enabled:true,
        groups: [
          {
            output_type: "any",
            variables: [],
            group_name: "Group1",
            groupId: getUuid()
          }
        ]
      }
    }
    return variableAggregatorData;
  }

  //创建提示词模板
  const createPromptItemTemplate = () => ({
    name: "",
    id: getUuid(),
  });
  const handleQuestionNodeData = (data) => {
    // 过滤意图分类所需模型数据
    const formatModelList =
      textModelList.length &&
      textModelList.filter(
        (model) => model.classification === 1 || model.classification === 2
      );
    let firstModel = formatModelList[0] || null;
    let addData = {};
    if (data.type == "question-classifier") {
      addData = {
        modelInfo: firstModel,
        model_id: firstModel ? firstModel.id : null, //模型id
        model_name: firstModel ? firstModel.name : null, //模型名称
        classes: [createPromptItemTemplate(), createPromptItemTemplate()], //默认添加两个分类
      };
    }
    return addData;
  };
  //处理参数提取节点数据
  const handleParameterExtractionNodeData = (data) => {
    let firstModel = textModelList.length > 0 ? textModelList[0] : null;
    let addData = {};
    if (data.type == "parameter-extractor") {
      addData = {
        query: [],
        model: {
          //模型参数
          provider: null,
          name: firstModel ? firstModel.name : null, //模型名称
          mode: null,
          id: firstModel ? firstModel.id : null, //模型id
          completion_params: {},
          ...firstModel,
        },
        parameters: [], //参数提取列表
        instruction: "", //系统提示词
      };
    }
    console.log(addData, "addData11");
    return addData;
  };

  //处理生成llm节点数据
  const handleLlmNodeData = (data) => {
    let firstModel = textModelList.length > 0 ? textModelList[0] : null;
    let addData = {};
    if (data.type == "llm") {
      addData = {
        context: {
          enabled: false,
          variable_selector: [],
        },
        prompt_template: [
          {
            role: "system",
            text: "",
            id: getUuid(),
          },
        ],
        model: {
          //模型参数
          provider: null,
          name: firstModel ? firstModel.name : null, //模型名称
          mode: null,
          id: firstModel ? firstModel.id : null, //模型id
          completion_params: {},
          ...firstModel,
        },
      };
    }
    console.log(addData, "addData");
    return addData;
  };

  //处理生成mcp节点数据
  const handleMcpNodeData = (data) => {
    console.log(data, "data");
    let addData = {};
    if (data.type == "mcp") {
      addData = {
        mcp_id: data.id,
        title: data.displayName, //节点标题
        mcp_url: data.mcpIconUrl, //mcp url
        tool_name: null, //工具Id
        param: [], //变量
        tagList:data.tagList,//标签列表
      };
    }
    console.log(addData, "addData");
    return addData;
  };
  //处理生成智能体节点数据
  const handleAgentNodeData = (data) => {
    let addData = {};
    if (data.type == "agent") {
      addData = {
        appId: data.appId,
        tagList:data.tagList,
        iconUrl:data.iconUrl,
        title:data.name,
        desc:"",
        param: [], //变量
        queryValue:"",
        query_value_type:"Variable",
      };
    }
    return addData;
  };
  //处理生成工作流节点数据
  const handleWorkflowNodeData = (data) => {
    let addData = {};
    if (data.type == "workflow") {
      addData = {
        appId: data.appId,
        tagList:data.tagList,
        iconUrl:data.iconUrl,
        title:data.name,
        desc:"",
        param: [], //变量
      };
    }
    return addData;
  };
  return {addNodeEvent, dragEndEvent,checkMcpAvailable,checkApplicationStatusEvent };
};
