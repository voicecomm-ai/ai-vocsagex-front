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

import TestInput from "../../../../test/input";
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
  const { getNodeById, getUpstreamVariables, getContentNodeVariables } = useNodeData();
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
    if (pannerNode && runVisible && pannerNode.type == "if-else") {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      // getLlmNodeVariables(nodeData.data);
      extractTexts(nodeData.data)
      setData(nodeData.data);
    }
  }, [runVisible]);

function extractTexts(data) {
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
        if (key === "variable_selector" && Array.isArray(value) && value.length) {
          const text = `{{#${value.join(".")}#}}`;
          results.push({ text });
        }
        if (key === "value" && typeof value === "string" && value.includes("{{#")) {
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

  const resultVar = getContentNodeVariables(unique, pannerNode.data.id)
  console.log(resultVar,'resultVar');
  setVariables(resultVar)
}

// const getLlmNodeVariables = (data) => {
//   // 1. 先提取输入中的变量
//   const inputVar = [];
//   data.cases.forEach((item) => {
//     item.conditions.forEach((condition) => {
//       inputVar.push({ text: condition.value });
//     });
//   });
//   const getInputVariables =
//     getContentNodeVariables(inputVar, pannerNode.data.id) || [];

//   // 2. 递归收集 inputItem / numberInputItem
//   const collectVars = (conditions) => {
//     let vars = [];
//     conditions.forEach((cond) => {
//       if (cond.inputItem) vars.push(cond.inputItem);

//       if (cond.numberInputItem && cond.numberInputItem.variable_type === "number") {
//         vars.push(cond.numberInputItem);
//       }

//       if (cond.sub_variable_condition?.conditions?.length) {
//         vars = vars.concat(collectVars(cond.sub_variable_condition.conditions));
//       }
//     });
//     return vars;
//   };
//   let conditionVars = data.cases.flatMap((item) => collectVars(item.conditions));

//   // 3. 合并两部分变量
//   let allVars = [...getInputVariables, ...conditionVars];
// console.log(allVars,'allVars');

//   // 4. 遍历变量并在树中查找
//   let upstreamVariables = getUpstreamVariables(pannerNode.data.id);

//   function findVariableInTree(tree, varStr) {
//     let valueSelect = varStr.split(".");
//     let StringValue = JSON.stringify(valueSelect);
//     let nodeId = valueSelect[0];
//     let result = null;

//     function traverse(nodes) {
//       if (!nodes || !Array.isArray(nodes)) return;
//       for (let node of nodes) {
//         if (node.nodeId === nodeId) {
//           if (node.children?.length) {
//             for (let child of node.children) {
//               if (JSON.stringify(child.value_selector) === StringValue) {
//                 result = { ...child };
//                 return;
//               }
//             }
//           }
//         }
//         if (node.children?.length) {
//           traverse(node.children);
//           if (result) return;
//         }
//       }
//     }
//     traverse(tree);
//     return result;
//   }

//   let filteredVars = [];
//   let nodeData = _.cloneDeep(reactFlowInstance.getNodes());
//   const startNode = nodeData.find((node) => node.type == "start");
//   let startVars = startNode ? startNode.data.variables || [] : [];

//   allVars.forEach((inputItem) => {
//     if (!inputItem.value_selector) return; // 兜底
//     const varStr = inputItem.value_selector.join(".");
//     const found = findVariableInTree(upstreamVariables, varStr);

//     if (found) {
//       let valueQuery = found.value_selector.join(".");
//       let addData = {};

//       if (found.nodeType === "start") {
//         const foundStart = startVars.find((item) => item.variable === found.variable);
//         if (foundStart) {
//           addData = {
//             ...foundStart,
//             max_length: foundStart.type === "file-list" ? 5 : 1,
//             variable: valueQuery,
//             variableQuery: valueQuery,
//             nodeId: found.nodeId,
//           };
//         } else {
//           addData = {
//             label: found.label,
//             type: found.variable_type,
//             max_length: null,
//             required: true,
//             variable: valueQuery,
//             variableQuery: valueQuery,
//             nodeId: found.nodeId,
//           };
//         }
//       } else {
//         if (found.nodeType === "code") {
//           addData = {
//             label: found.label,
//             type: "code",
//             max_length: null,
//             required: false,
//             variable: found.variable,
//             variableQuery: found.variable,
//             nodeId: found.nodeId,
//           };
//         } else if (found.type === "file-list") {
//           addData = {
//             label: found.label,
//             type: found.type,
//             max_length: found.max_length,
//             required: true,
//             variable: found.variable,
//             variableQuery: found.variable,
//             nodeId: found.nodeId,
//           };
//         } else {
//           addData = {
//             label: found.label,
//             type: found.variable_type,
//             max_length: null,
//             required: true,
//             variable: found.variable,
//             variableQuery: found.variable,
//             nodeId: found.nodeId,
//           };
//         }
//       }

//       // ✅ 去重（label + variable 双重唯一）
//       const exists = filteredVars.some(
//         (item) => item.label === addData.label && item.variable === addData.variable
//       );
//       if (!exists) {
//         filteredVars.push(addData);
//       }
//     }
//   });
// console.log(filteredVars,'filteredVars');

//   setVariables(filteredVars);
// };

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
  const onJSONError = (error, key) => {
    if (error) {
      message.error(`${key} 格式错误`);
    }
    testInputRef.current?.onJSONError(error, key);
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
