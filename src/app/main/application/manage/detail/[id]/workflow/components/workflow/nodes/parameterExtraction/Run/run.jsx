"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Typography,
} from "antd";
import { message, Divider } from "antd";
import { useParams } from "next/navigation";
import styles from "../../node.module.css";
import Variable from "../../../../Dialog/Variable";
import { useStore } from "@/store/index";
import { useNodesInteractions, useNodeData } from "../../../hooks";
import { useReactFlow } from "@xyflow/react";
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";

import TestInput from "./testInput";
import TabItem from "../../../../test/TabItem";
import TestDetail from "../../../../test/SingleDetail";
import RunStatus from "../../../../test/RunStatus";
import JsonEditor from "./JsonEditor";
import runStyles from "./run.module.css";
const LlmRun = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { getNodeById, getUpstreamVariables } = useNodeData();
  const { runVisible, setRunVisible, pannerNode, setPannerNode } = useStore((state) => state);
  const reactFlowInstance = useReactFlow();
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [isEditing, setIsEditing] = useState(false); //是否编辑
  const variableRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectVariable, setSelectVariable] = useState({});
  const testInputRef = useRef(null);
  const [runData, setRunData] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({});
  const [fullscreenTitle, setFullscreenTitle] = useState("");
  const [tabKey, setTabKey] = useState("1");
  const testDetailRef = useRef(null);
  const [variables, setVariables] = useState([]);
  const [isExitData, setIsExitData] = useState(false); //是否存在上一次运行数据
  const [isContext, setIsContext] = useState(false); //是否存在上下文
  const runStatus = {
    succeeded: "SUCCESS",
    failed: "FAILED",
    running: "RUNNING",
  };
  const tabItems = [
    {
      key: "1",
      label: "输入",
    },
    {
      key: "3",
      label: "详情",
    },
  ];
  useEffect(() => {
    if (pannerNode && runVisible && pannerNode.type == "parameter-extractor") {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      getParameterVars(nodeData.data);
      setData(nodeData.data);
    }
  }, [runVisible]);
  // 获取节点中变量，并对比开始节点变量，只保留在开始节点变量中的变量提取变量
  // 从upstreamVariables（树形结构）中查找parameterVars对应的变量和属性，组成数据
  const getParameterVars = (data) => {
    let parameterVars = [];
    let instruction = data.instruction || "";

    if (instruction) {
      const matches = instruction.match(/{{#(.*?)#}}/g);

      if (matches) {
        matches.forEach((match) => {
          const variable = match.match(/{{#(.*?)#}}/);
          if (variable && variable[1]) {
            if (!parameterVars.includes(variable[1])) {
              parameterVars.push(variable[1]);
            }
          }
        });
      }
    }
    // 获取开始节点变量（树形结构）
    let upstreamVariables = getUpstreamVariables(pannerNode.data.id);

    // 递归查找树形结构中的变量
    function findVariableInTree(tree, varStr) {
      // varStr 形如 start.xxx
      let valueSelect = varStr.split(".");
      let StringValue = JSON.stringify(valueSelect);

      let nodeId = valueSelect[0]; //节点id
      const [nodeKey, propKey] = varStr.split(".");
      let result = null;
      function traverse(nodes) {
        if (!nodes || !Array.isArray(nodes)) return;
        for (let node of nodes) {
          if (node.nodeId === nodeId) {
            // 找到对应节点
            if (node.children && Array.isArray(node.children)) {
              for (let child of node.children) {
                if (JSON.stringify(child.value_selector) === StringValue) {
                  result = {
                    ...child,
                  };
                  return;
                }
              }
            }
          }
          if (node.children && Array.isArray(node.children)) {
            traverse(node.children);
            if (result) return;
          }
        }
      }
      traverse(tree);
      return result;
    }

    // 只保留在upstreamVariables中的llm变量
    let filteredVars = [
      {
        type: "paragraph",
        label: "用户输入",
        options: [],
        max_length: null,
        required: true,
        variableQuery: "query",
        variable: data.query.join("."),
      },
    ];
    // 获取开始节点变量
    let nodeData = _.cloneDeep(reactFlowInstance.getNodes());
    const startNode = nodeData.find((node) => node.type == "start");
    let startVars = [];
    if (startNode) {
      startVars = startNode.data.variables || [];
    }
    parameterVars.forEach((varStr) => {
      const found = findVariableInTree(upstreamVariables, varStr);
      if (found) {
        let valueQuery = found.value_selector.join(".");
        let addData = {};
        if (found.nodeType == "start") {
          //从开始节点获取变量
          const foundStart = startVars.find((item) => item.variable === found.variable);
          if (foundStart) {
            addData = {
              ...foundStart,
              variable: valueQuery,
              variableQuery: valueQuery,
              required: true,
            };
          } else {
            addData = {
              label: found.label,
              type: "text-input",
              max_length: null,
              required: true,
              variable: valueQuery,
              variableQuery: valueQuery,
            };
          }
        } else {
          addData = {
            label: found.label,
            type: "text-input",
            max_length: null,
            required: true,
            variable: valueQuery,
            variableQuery: valueQuery,
          };
        }
        filteredVars.push(addData);
      }
    });
    // ✅ 特殊处理：只隐藏和第一个用户输入重复的变量
    const queryVar = filteredVars[0]; // 用户输入
    const newFilteredVars = filteredVars.map((item, index) => {
      if (index !== 0 && item.variable === queryVar.variable) {
        return { ...item, hidden: true };
      }
      return item;
    });

    // console.log(newFilteredVars, "filteredVars after hide duplicates");
    setVariables(newFilteredVars);

    // setVariables(filteredVars);
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  const closePanelEvent = () => {
    testInputRef.current?.clearFormEvent();
    setPannerNode(null);
    setRunVisible(false);
  };

  const runSingeNodeEvent = async (value) => {
    let runData = {
      app_id: id,
      node_id: pannerNode.id,
      user_inputs: value,
    };
    setLoading(true);
    setRunData({
      status: "running",
    });

    runNode(runData)
      .then((res) => {
        let runObj = res.data;
        if (runObj.error) {
          //失败运行提示错误
          message.warning(runObj.error);
        }
        setRunData(runObj);
        setLoading(false);
        setIsExitData(runObj ? true : false);
        setTabKey("3"); //运行完成后跳转到详情
        testInputRef.current.closeLoading();
      })
      .catch(() => {
        setLoading(false);
        testInputRef.current?.closeLoading();
      });
  };

  // 获取上一次运行结果
  const getLastRunResultEvent = async (nodeId) => {
    getLastRunResult({
      app_id: id,
      node_id: nodeId,
    }).then((res) => {
      let runObj = res.data;
      setIsExitData(runObj ? true : false);
      setRunData(runObj);
    });
  };
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };
  const handleTabClick = (key) => {
    setTabKey(key);
  };
  const onChangeFullscreenData = (data) => {
    testInputRef.current?.onChangeContextJSON(data);
  };
  const onJSONError = (error) => {
    testInputRef.current?.onJSONError(error);
  };
  return (
    <div className={`${styles.start_run_panel_main} ${styles.llm_run_panel_main_fullscreen}`}>
      <div className={styles["panel_run_header"]}>

          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/${data.type}.png`}
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Text style={{ maxWidth: '100%' }} ellipsis={{ tooltip: data.title }}>
                {data.title}
              </Text>
            </div>
          </div>
          <div className={styles["panel_run_header_right"]}>
            <RunStatus runData={runData} />

            <img onClick={closePanelEvent} className={styles["panel_close"]} src='/close.png' />
          </div>
 
      </div>

      <div className={styles["start_run_panel_content"]}>
        {isExitData && (
          <div className={styles["test_container_tab"]}>
            {tabItems.map((item) => (
              <TabItem
                key={item.key}
                item={item}
                isActive={item.key === tabKey}
                onClick={handleTabClick}
              />
            ))}
          </div>
        )}
        <div
          className={`${styles["start_run_panel_content_main"]} ${
            tabKey != "1" ? styles["start_run_panel_content_main_hidden"] : ""
          }`}
        >
          <TestInput
            isFullscreen={isFullscreen}
            handleFullscreen={handleFullscreen}
            variables={variables}
            ref={testInputRef}
            runSingeNodeEvent={runSingeNodeEvent}
            isContext={isContext}
            isRun={loading}
          />
        </div>

        {tabKey === "3" && (
          <div className={styles["start_run_panel_content_main"]}>
            <TestDetail runData={runData} ref={testDetailRef} />
          </div>
        )}
      </div>
      {isFullscreen && (
        <div className={runStyles.fullscreen_container}>
          <JsonEditor
            onError={onJSONError}
            handleFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            title={fullscreenTitle}
            onChange={onChangeFullscreenData}
            content={fullscreenData}
          />
        </div>
      )}
    </div>
  );
});

export default LlmRun;
