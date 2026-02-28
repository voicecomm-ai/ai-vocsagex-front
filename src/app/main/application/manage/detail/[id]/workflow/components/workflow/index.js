"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  useReactFlow,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import StartNode from "./nodes/start";
import EndNode from "./nodes/end";
import LoopNode from "./nodes/loop";
// 知识检索
import KnowledgeRetrievalNode from "./nodes/KnowledgeRetrieval/index.jsx";
// 意图分类
import IntentionClassification from "./nodes/IntentionClassification/index.jsx";
//if分支
import IfElse from "./nodes/IfElse/index.jsx";
// 文档提取
import DocumentParsingNode from "./nodes/DocumentParse/index";
// 代码运行
import RunCodeNode from "./nodes/CodeExtractor/index";
//参数提取
import ParameterExtractionNode from "./nodes/parameterExtraction/index";
// LLM
import Llm from "./nodes/Llm/index.jsx";
// api请求
import ApiRequestNode from "./nodes/ApiRequest/index";
// 循环开始
import LoopStartNode from "./nodes/loop-start/index";
// 迭代开始
import IterationStartNode from "./nodes/iteration-start/index";
// 迭代
import IterationNode from "./nodes/iteration/index";
import CustomToolbar from "./CustomToolbar";
import CustomEdge from "./edge/CustomEdge";
import DragPanel from "./drag-panel"; //拖拽面板
import styles from "../../workflow.module.css";
import PanelContent from "./nodes/panel";
import AssignerNode from "./nodes/assigner";
import VariableAggregatorNode from "./nodes/variable-aggregator";
import AgentNode from "./nodes/agent";
import WorkflowNode from "./nodes/workflow";
import { useStore } from "@/store/index";
import { updateWorkflow } from "@/api/workflow";
import debounce from "lodash/debounce";
import NodeRun from "./nodes/run"; //运行节点
import dayjs from "dayjs";
import { findByValueSelector } from "./utils/node";
import { useNodesInteractions, useShortcuts, useEdgesInteractions, useDrag,useLoop } from "./hooks";
// 定义节点类型
import { getUuid } from "@/utils/utils";
import NodePanel from "./nodes/nodePanel";
import McpNode from "./nodes/mcp";
import { useCheck } from "./hooks";
import { useNodeData } from "./hooks";
const nodeTypes = {
  // 可以在这里定义自定义节点类型
  start: StartNode,
  end: EndNode,
  loop: LoopNode,
  "loop-start": LoopStartNode,
  "knowledge-retrieval": KnowledgeRetrievalNode,
  "question-classifier": IntentionClassification,
  "if-else": IfElse,
  "document-extractor": DocumentParsingNode,
  "http-request": ApiRequestNode,
  "parameter-extractor": ParameterExtractionNode,
  "iteration": IterationNode,
  "iteration-start": IterationStartNode,
  code: RunCodeNode,
  llm: Llm,
  mcp: McpNode,
  agent: AgentNode, //Agent节点
  workflow: WorkflowNode, //工作流节点
  assigner: AssignerNode,//变量赋值节点
  "variable-aggregator": VariableAggregatorNode,//变量聚合节点
};
const edgeTypes = {
  custom: CustomEdge,
};
const WorkflowEditor = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showPanel, setShowPanel] = useState(true); //是否展示拖拽面板
  const { handleEdgeChangeEvent, handleEdgeAdd } = useEdgesInteractions();
  const { handleNodeEnter, handleNodeLeave } = useNodesInteractions();
  const { autoResizeParentNode } = useLoop();
  const { checkNodeRequired } = useCheck();
  const { getUpstreamVariables } = useNodeData();
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const { setMousePosition } = useStore((state) => state);
  const panelContentRef = useRef(null);
  const [modelList, setModelList] = useState([]); //模型列表
  const [applicationDetail, setApplicationDetail] = useState({});
  const [vectorModelList, setVectorModelList] = useState([]); //向量模型列表
  const [rerankModelList, setRerankModelList] = useState([]); //排序模型列表
  const [textModelList, setTextModelList] = useState([]); //文本模型列表
  const isInitRef = useRef(false);
  const { dragEndEvent } = useDrag(vectorModelList, rerankModelList, textModelList, setNodes);
  const {
    panelVisible,
    runVisible,
    setPanelVisible,
    pannerNode,
    setPannerNode,
    setRunVisible,
    setUpdateTime,
    viewportZoom,
    setViewportZoom,
    readOnly,
    setApplicationData,
    changeId,
    setMcpIsDrag,
    setVectorModelData,
    setRerankModelData,
    setTextModelData,
  } = useStore((state) => state);

  useImperativeHandle(ref, () => ({
    setWorkflowData,
  }));

  const setWorkflowData = (data) => {
    isInitRef.current = true;
    let graph = data.graph;

    let zoom = graph.viewport?.zoom ? graph.viewport.zoom : 1; //默认缩放等级
    let getViewport = graph.viewport ? graph.viewport : viewport;
    setApplicationDetail(data);
    setApplicationData(data);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setViewport(graph.viewport);
    setViewportZoom(zoom);
    reactFlowInstance.setViewport(getViewport);
    setTimeout(() => {
      isInitRef.current = false;
    }, 300);
  };
  // 从存储加载工作流数据
  useEffect(() => {
    setPanelVisible(false);
    setRunVisible(false);
  }, []);

  useShortcuts(); //监听快捷键

  useEffect(() => {
    //监听模型列表变化
    if (props.modelList.length > 0) {
      // 向量模型列表（classification === 6）
      const vectorModelArr = props.modelList.filter((item) => item.classification == 6);
      // 排序模型列表（classification === 9）
      const rerankModelArr = props.modelList.filter((item) => item.classification == 9);
      const textModelArr = props.modelList.filter(
        (item) => item.classification == 1 || item.classification == 2
      );
      setVectorModelList(vectorModelArr);
      setRerankModelList(rerankModelArr);
      setTextModelList(textModelArr);
      setVectorModelData(vectorModelArr);
      setRerankModelData(rerankModelArr);
      setTextModelData(textModelArr);
    }
  }, [props.modelList]);
  // 处理边连接
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);

  const onConnectStart = () => {
    setIsDraggingConnection(true);
  };

  const onConnectEnd = (event) => {

    setIsDraggingConnection(false);
  };

  //连线处理
  const onConnect = (params) => {
    if (readOnly) {
      return;
    }
    if (!isDraggingConnection) {
      // 不是拖拽连接，阻止
      return;
    }
    let sourceNode = nodes.find((node) => node.id === params.source);
    let targetNode = nodes.find((node) => node.id === params.target);
    if(sourceNode.parentId!=targetNode.parentId){
      return false;
    }
  
    addEdgeEvent(params);
  };

  //处理左侧开始拖拽事件
  const handleDragStart = (event, obj) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(obj));
    event.dataTransfer.effectAllowed = "move";
  };
  //处理拖拽放置事件
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  //处理拖拽放置事件
  // 修改onDrop方法
  const onDrop = (event) => {
    setMcpIsDrag(false);
    dragEndEvent(event);
  };

  //添加连线事件
  const addEdgeEvent = (params) => {
    handleEdgeAdd(params);
    return;
  };

  //处理拖拽面板显示隐藏
  const handlePanelShow = (show) => {
    setShowPanel(show);
  };
  //节点点击事件
  const onNodeClick = (event, node) => {
    let actionButton = event.target.closest(".node-action-button");
    // console.log(actionButton, "actionButton");
  };

  const handleNodesChange = (changes) => {
    autoResizeParentNode(changes,setNodes,nodes);
    const updatedChanges = changes.map((change) => {
      if (change.type !== "position") return change;
  
      const node = nodes.find((n) => n.id === change.id);
      if (!node || !node.parentId) return change;
  
      const parentNode = nodes.find((n) => n.id === node.parentId);
      console.log(parentNode,'parentNode');
      if (!parentNode) return change;
  
      const positionX = change.position?.x ?? node.position.x;
      const positionY = change.position?.y ?? node.position.y;
      const measured = node.measured;
      const parentMeasured = parentNode.measured;

      // 获取节点尺寸（默认值如果不存在）
      const nodeWidth = measured.width ;
      const nodeHeight = measured.height ;
      const parentWidth = parentMeasured.width ;
      const parentHeight = parentMeasured.height ;
  
      // 限制边距为 16px
      const margin = 16;
      const minX = margin;
      const maxX = parentWidth - nodeWidth - margin;
      const minY = 58; // 顶部限制保持 47px
      const maxY = parentHeight - nodeHeight - margin; // 底部限制 16px
 
      let newX = positionX;
      let newY = positionY;
      // 限制 X 坐标（左右边距 16px）
      if (positionX < minX) {
        newX = minX;
      } else if (positionX > maxX) {
        newX = maxX;
      }
  
      // 限制 Y 坐标（顶部 47px，底部 16px）
      if (positionY < minY) {
        newY = minY;
      } else if (positionY > maxY) {
        newY = maxY;
      }
  
      // 如果位置有变化，返回更新后的位置
      if (newX !== positionX || newY !== positionY) {
        return {
          ...change,
          position: {
            ...change.position,
            x: newX,
            y: newY,
          },
        };
      }
  
      return change;
    });
    // 调用原有的节点变化逻辑
    onNodesChange(updatedChanges);
  };
  

  // 处理边的变化
  const handleEdgesChange = (change) => {
    handleEdgeChangeEvent(change, onEdgesChange);
  };
 
  //判断当前变量类型是否为数组类型
  const isArrayType = (variable_type) => {
    return variable_type.includes("array");
  }
  useEffect(() => {
    checkAllRequiredEvent(nodes);
    if ((nodes.length === 0 && edges.length === 0) || isInitRef.current) return;
    //http-request类型更新file值
    nodes.forEach((node) => {
      if (node.type === "http-request" && node.data?.body?.type === "form-data") {
        const formDataList = node.data.body.data || [];
        formDataList.forEach((formItem) => {
          if (formItem.type === "file" && formItem.value) {
            const arr1 = formItem.value.split("#")[1];
            const arr2 = arr1.split(".");
            formItem.file = arr2;
          }
        });
      }
      if(node.type == 'iteration'){//迭代节点
        let variables = getUpstreamVariables(node.id);
        let nodeData = node.data;
        let iterator_input_type = nodeData.iterator_input_type;
        let iterator_selector = nodeData.iterator_selector;
        if(iterator_selector.length){ 
        let foundData = findByValueSelector(iterator_selector, variables);   
        if(foundData && foundData.variable_type!=iterator_input_type){
          node.data.iterator_input_type = foundData.variable_type;
        }
        if(!foundData || !isArrayType(foundData.variable_type)){//没有找到变量
          node.data.iterator_input_type = "array[string]";
          node.data.iterator_selector = [];
        }
      }
    }
    });
    debouncedUpdateWorkflow(nodes, edges, applicationDetail, viewport);

  }, [nodes, edges]);


  //验证是否全部必填
  const checkAllRequiredEvent = () => {
    const isValid = checkNodeRequired(nodes);
  
    props?.updateRequiredEvent(isValid)
  }


  const debouncedUpdateWorkflow = useRef(
    debounce(async (nodes, edges, detail, viewport) => {
      let data = {
        ...detail,
        graph: { nodes, edges, viewport },
      };
      await updateWorkflow(data).then((res) => {
        const formattedTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
        setUpdateTime(formattedTime);
      });
    }, 500) // 1000ms 无操作后才触发
  ).current;
  const handleViewportChange = (value) => {
    if (isInitRef.current) return;
    setViewportZoom(value.zoom);
    setViewport(value);
    debouncedUpdateWorkflow(nodes, edges, applicationDetail, value);
  };

  useEffect(() => {
    const unsubscribe = useStore.getState().subscribeEvent((type, payload) => {
      if (type == "panelShow") {
      }
      if (type == "panelClose") {
        handlePaneVisible();
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePaneVisible = (type, payload) => {};

  return (
    <div className={styles["workflow_editor"]}>
      {showPanel && (
        <DragPanel onDragStart={handleDragStart} handlePanelShow={handlePanelShow}></DragPanel>
      )}
      {!showPanel && (
        <div   className={styles["workflow_panel_expand"]}>
        <img
          onClick={() => handlePanelShow(true)}
          alt=""
          src='/workflow/pane_expand.png'
        />
        </div>
      )}

      <div className={styles["workflow_editor_content"]} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          zIndexMode ={'basic'}
          style={{ background: '#f5f9fc' }} 
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeMouseEnter={handleNodeEnter}
          onNodeMouseLeave={handleNodeLeave}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={null}
          connectable={!readOnly} // 禁用连接线
          nodesDraggable={!readOnly} // 禁用节点拖动
          nodesConnectable={!readOnly} // 冗余，确保禁用连接
          elementsSelectable={!readOnly} // 禁用点击/选中
          onNodeClick={onNodeClick}
          onViewportChange={handleViewportChange}
          selectionKeyCode={null}
          defaultViewport={viewport}
          Background={Background}
          zIndex={true}
          connectionLineContainerStyle={{ zIndex: 10000000 }}
        >
          <CustomToolbar />
          <MiniMap 
            position="bottom-left"
          
          />
        </ReactFlow>
        {/* 运行节点 */}
        { runVisible && <NodeRun></NodeRun>}
        {/* 节点详情 */}
        {panelVisible && (
          <PanelContent panelVisible={panelVisible} ref={panelContentRef}></PanelContent>
        )}
      </div>
    </div>
  );
});

export default WorkflowEditor;
