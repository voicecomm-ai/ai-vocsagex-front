"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
} from "antd";
import { message } from "antd";
import styles from "./node.module.css";
import { useStore } from "@/store/index";
const { TextArea } = Input;
import StartPanel from "./start/panel";
import EndPanel from "./end/panel";
// 知识检索弹窗面板
import KnowledgeRetrievalPanel from "./KnowledgeRetrieval/panel";
//if条件
import IfElsePanel from "./IfElse/panel";
// api请求
import ApiRequestPanel from "./ApiRequest/panel";

import PanelLlm from "./Llm/panel";
import IntentionClassificationPanel from "./IntentionClassification/panel";
import DocParsePanel from "./DocumentParse/panel";
import RunCodePannel from "./CodeExtractor/panel";
import ParameterExtractionPanel from "./parameterExtraction/panel";
import { getUuid } from "@/utils/utils";
import McpPanel from "./mcp/panel";
import AssignerPanel from "./assigner/panel";
import LoopPanel from "./loop/panel";
import IterationPanel from "./iteration/panel";
import VariableAggregatorPanel from "./variable-aggregator/panel";
import AgentPanel from "./agent/panel";
import WorkflowPanel from "./workflow/panel";
const PanelContent = forwardRef((props, ref) => {
  const {
    panelVisible,
    setPanelVisible,
    pannerNode,
    setPannerNode,
    panelVisibleZsjs,
    panelVisibleYtfl,
    panelVisibleLlm,
  } = useStore((state) => state);
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  const [open, setOpen] = useState(true);
  const formRef = useRef(null);
  const [title, setTitle] = useState("创建角色"); //标题
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [action, setAction] = useState("add"); //操作类型 add 新增 edit 编辑
  const [nodeData, setNodeData] = useState({}); //选中的节点数据
  const [modalKey, setModalKey] = useState(0);

  const showModal = async (obj, type, selectDepartment) => {
    setLoading(true);
    setOpen(true);
  };
  useEffect(() => {
    if (pannerNode && panelVisible) {
      setNodeData(pannerNode);
      setModalKey(getUuid());
    }
  }, [pannerNode]);
  //弹框 className
  const classNames = {
    footer: styles["node-drawer-footer"],
    content: styles["node-drawer-content"],
    header: styles["node-drawer-header"],
    body: styles["node-drawer-body"],
  };
  //关闭事件
  const hideModal = () => {
    setPanelVisible(false);
  };

  const saveCodeRunInputVars = (data) => {};

  const noPaddingNode = [
    "llm",
    "parameter-extractor",
    "question-classifier",
    "if-else",
    "code",
    "http-request",
    "document-extractor",
  ];

  return (
    <div>
      <Drawer
        maskClosable={false}
        closable
        title={null}
        placement="right"
        open={panelVisible}
        mask={false}
        destroyOnHidden={true}
        rootStyle={{ boxShadow: "none", position: "absolute", right: 12 }}
        width={480}
        key={modalKey}
        getContainer={() => document.getElementById("workflow_page")}
        classNames={classNames}
      >
        <div
          className={`${styles["panel_content"]} ${
            noPaddingNode.includes(nodeData.type)
              ? styles["panel_content_no_padding"]
              : ""
          }`}
        >
          {nodeData.type === "start" ? (
            <StartPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "end" ? (
            <EndPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "knowledge-retrieval" ? (
            <KnowledgeRetrievalPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "document-extractor" ? (
            <DocParsePanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "if-else" ? (
            <IfElsePanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}

          {nodeData.type === "llm" ? (
            <PanelLlm key={modalKey} setPanelVisible={setPanelVisible} />
          ) : null}
          {nodeData.type === "code" ? (
            <RunCodePannel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
              runAndInputVars={saveCodeRunInputVars}
            />
          ) : null}

          {nodeData.type === "question-classifier" ? (
            <IntentionClassificationPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "parameter-extractor" ? (
            <ParameterExtractionPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "http-request" ? (
            <ApiRequestPanel
              key={modalKey}
              setPanelVisible={setPanelVisible}
              nodeData={nodeData}
            />
          ) : null}
          {nodeData.type === "mcp" ? <McpPanel key={modalKey} /> : null}
          {nodeData.type === "agent" ? <AgentPanel key={modalKey} /> : null}
          {nodeData.type === "workflow" ? (
            <WorkflowPanel key={modalKey} />
          ) : null}
          {nodeData.type === "assigner" ? (
            <AssignerPanel nodeData={nodeData} key={modalKey} />
          ) : null}
          {nodeData.type === "loop" ? (
            <LoopPanel nodeData={nodeData} key={modalKey} />
          ) : null}
          {nodeData.type === "iteration" ? (
            <IterationPanel nodeData={nodeData} key={modalKey} />
          ) : null}
          {nodeData.type === "variable-aggregator" ? (
            <VariableAggregatorPanel nodeData={nodeData} key={modalKey} />
          ) : null}
        </div>
      </Drawer>
    </div>
  );
});

export default PanelContent;
