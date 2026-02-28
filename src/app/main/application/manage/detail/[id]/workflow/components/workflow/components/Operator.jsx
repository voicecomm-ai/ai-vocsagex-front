"use client";
import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import styles from "../workflow.module.css";
import { Input, Popover, message, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNodesInteractions } from "../hooks";
import { useStore } from "@/store/index";
import { useReactFlow } from "@xyflow/react";
import { isMcpAvailable } from "@/api/mcp";
import { useApi } from "../nodes/ApiRequest/hooks/use-api";
import {useValidateConditions} from "../nodes/IfElse/hooks/use-ifelse"
import { useCheck } from "../hooks/use-check";
import DeleteModel from "./DeleteModal";
const Operator = forwardRef((props, ref) => {
  const deleteModelRef = useRef(null);
  const reactFlowInstance = useReactFlow();
   const { validateApiNode } = useApi();
  const validateConditions = useValidateConditions()
  const { checkLoopNodeRequired,checkIterationNodeRequired,checkWorkflowNodeRequired  } = useCheck();
  const { handleNodeDelete, handleNodeCopy } = useNodesInteractions();
  const { setPanelVisible, setPannerNode, setRunVisible } = useStore((state) => state);
  const actionList = props.actionList || [
    {
      name: "复制",
      icon: "/workflow/operator/copy.png",
      hoverIcon: "/workflow/operator/copy_hover.png",
      type: "copy",
    },
    {
      name: "删除",
      icon: "/workflow/operator/delete.png",
      hoverIcon: "/workflow/operator/delete_hover.png",
      type: "delete",
    },
  ];

  //处理点击事件
  const handleMenuItem = (item) => {
    let nodeData = reactFlowInstance.getNodes().find((item) => item.id === props.id);
    switch (item.type) {
      case "rename":
        props.updataNameEvent();

        break;
      case "copy":
        handleNodeCopy(props.id);
        handleDisplayPanel();
        break;
      case "delete":
      if(nodeData.type == "loop"){
        deleteModelRef.current.showModal(
          {id: props.id},
          "删除循环节点",
          "删除循环节点将删除所有子节点"
        );
      }
      else if(nodeData.type == "iteration"){
        deleteModelRef.current.showModal(
          {id: props.id},
          "删除批处理节点",
          "删除批处理节点将删除所有子节点"
        );
      }
        else{
          handleNodeDelete(props.id);
          handleDisplayPanel();
        }
      
        break;
    }
  };
 
  //运行处理事件
  const handleRun = () => {
    const nodeData = reactFlowInstance.getNodes().find((item) => item.id === props.id);
    if (nodeData.type == "parameter-extractor") {
      //处理参数提取节点
      if (!nodeData.data.query) return message.warning("请选择变量");
      if (nodeData.data.parameters.length === 0) return message.warning("请填写提取参数");
    }
    if (nodeData.type == "question-classifier") {
      //处理意图分类节点弹框
      let variable = nodeData.data.query_variable_selector;
      if (!variable) {
        message.warning("用户输入不能为空");
        return;
      }
    }
    if (nodeData.type == "llm") {
      //处理llm节点弹框
      let prompt_template = nodeData.data.prompt_template;
      let system_prompt = prompt_template.find((item) => item.role === "system");
      if (!system_prompt.text) {
        message.warning("系统提示词不能为空");
        return;
      }
    }
    if (nodeData.type == "document-extractor") {
      if (!nodeData.data.inputItem) {
        message.warning("请设置输入变量");
        return;
      }
    }
    if (nodeData.type == "knowledge-retrieval") {
      props.runKnowledgeRetrievalEvent();
      return;
    }
    if (nodeData.type == "code") {
      if (nodeData.data?.codeOutputs?.length) {
        for (const key in nodeData.data.outputs) {
          // console.log(key, !Object.keys(nodeData.data.outputs)?.length)

          if (key === "" || !Object.keys(nodeData.data.outputs)?.length) {
            message.warning("请选择输出");
            return;
          }
        }
      } else {
        message.warning("请选择输出");
        return;
      }
      if (nodeData.data.runInputs.length) {
        if (nodeData.data.variables) {
          let input_empty = nodeData.data.variables.find(
            (item) => !item.variable || !item.value_selector.length
          );
          if (input_empty) {
            message.warning("请选择输入变量");
            return;
          }
        }
      }
    }
    if (nodeData.type == "mcp") {
      props.runMcpEvent();
      return;
    }
    if (nodeData.type == "http-request") {
      if(!validateApiNode(nodeData.data)){
         return
      }
    }
    if (nodeData.type == "if-else") {
      const { data } = nodeData;
      const isValid = validateConditions(data); 
    if (!isValid) return;
    }
    if (nodeData.type == "loop") {
      const isValid = checkLoopNodeRequired(nodeData.data);
      if (!isValid) {
        message.warning("必填项未完成配置!");
        return;
      }
    }
    if (nodeData.type == "variable-aggregator") {
      props.runVariableAggregatorEvent();
      return;
    }
    if (nodeData.type == "iteration") {
      const isValid = checkIterationNodeRequired(nodeData.data);
      if (!isValid) {
        message.warning("必填项未完成配置!");
        return;
      }
    }
    if(nodeData.type == "agent"){
       props.runAgentEvent();
      return;
    }
    if (nodeData.type == "workflow") {
      props.runWorkflowEvent();
      return;
    }

    setPanelVisible(false);
    setPannerNode(nodeData);
    setRunVisible(true);
  };

  const handleDisplayPanel = () => {
    setPanelVisible(false);
    setRunVisible(false);
  };
 
  //处理删除验证事件
  const deleteCallBack = (data) => {
    handleNodeDelete(props.id);
    handleDisplayPanel();
  }

  return (
    <>
    <div className={styles["operator_content"]}>
      {!props.isEnd && (
        <Tooltip title="运行">
        <img
          onClick={(e) => {
            handleRun();
          }}
          onMouseEnter={(e) => (e.currentTarget.src = "/workflow/operator/run_hover.png")}
          onMouseLeave={(e) => (e.currentTarget.src = "/workflow/operator/run.png")}
          className={styles["operator_run_img"]}
          src='/workflow/operator/run.png'
        />
        </Tooltip>
      )}
      {!props.isStart &&
        actionList?.length &&
        actionList.map((item, index) => {
          return (
            <div
              onClick={() => handleMenuItem(item)}
              className={styles["operator_content_popover_item"]}
              key={index}
            >
              <Tooltip title={item.name}>
              <img
                onMouseEnter={(e) => (e.currentTarget.src = item.hoverIcon)}
                onMouseLeave={(e) => (e.currentTarget.src = item.icon)}
                className={styles["operator_content_popover_item_img"]}
                src={item.icon}
                alt=''
              />
              </Tooltip>
            </div>
          );
        })}
    </div>
    <DeleteModel zIndex={10000} ref={deleteModelRef} deleteCallBack={deleteCallBack} />
    </> 
  );
});
export default Operator;
