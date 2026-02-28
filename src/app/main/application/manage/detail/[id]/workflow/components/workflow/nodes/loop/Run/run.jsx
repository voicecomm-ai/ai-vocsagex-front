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
import { useLoop } from "../hooks/use-loop";
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
  const { getNodeById, getUpstreamVariables } = useNodeData();
  const { runVisible, setRunVisible, pannerNode, setPannerNode } = useStore(
    (state) => state
  );
  const reactFlowInstance = useReactFlow();
  const { getLoopChildNodeVariables } = useLoop();
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
    if (pannerNode && runVisible && pannerNode.type == "loop") {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
     getLoopNodeVariables(nodeData.data);
      setData(nodeData.data);
    }
  }, [runVisible]);

  //验证俩个数组是否完整相同
  const arrayEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  // 获取llm节点中变量，并对比开始节点变量，只保留在开始节点变量中的llm变量
  // 从upstreamVariables（树形结构）中查找llmVars对应的变量和属性，组成数据
  const getLoopNodeVariables = (data) => {
    let childVariables = getLoopChildNodeVariables(pannerNode.data.id);
    console.log(childVariables,'childVariables')
    let upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    let loopVars = [];
    let loop_variables = data.loop_variables || [];
    let break_conditions = data.break_conditions || [];
    loop_variables.forEach(loopVariable => { //循环变量
     if(loopVariable.value_type=='variable') {
      loopVars.push({
          var_type: loopVariable.var_type,  //变量类型
          value_selector:loopVariable.value, //变量值
        })
      }
    });
    childVariables.forEach(childVariable => {
      loopVars.push({
        var_type: '',
        value_selector:childVariable,
      })
    })
    break_conditions.forEach(breakCondition => {//中止条件
      console.log(breakCondition,'breakCondition')
      if(breakCondition.numberVarType=='variable'&&breakCondition.var_type=='number') {
        loopVars.push({
          var_type: breakCondition.var_type,
          value_selector:breakCondition.value,
        })
      }
    });

    // 递归查找树形结构中的变量
    function findVariableInTree(tree, varStr) {
      if(!varStr) return;
      // varStr 形如 [start,xxx] 或者 [start,xxx,xxx]
      let nodeId = varStr[0]; //节点id
      let result = null;
      function traverse(nodes) {
        if (!nodes || !Array.isArray(nodes)) return;
        for (let node of nodes) {
          if (node.nodeId === nodeId) {
            // 找到对应节点
            if (node.children && Array.isArray(node.children)) {
              for (let child of node.children) {
                if (arrayEqual(child.value_selector, varStr)) {
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
    let filteredVars = [];
    // 获取开始节点变量
    let nodeData = _.cloneDeep(reactFlowInstance.getNodes());
    const startNode = nodeData.find((node) => node.type == "start");
    let startVars = [];
    if (startNode) {
      startVars = startNode.data.variables || [];
    }
    let loopInputArr =capitalizeFirstLetter(loopVars);
    loopInputArr.forEach((varStr) => {
      const found = findVariableInTree(upstreamVariables, varStr.value_selector);
      if (found) {
        console.log(found,'found.var_type')
        let valueQuery = found.value_selector.join(".");
        let addData = {};
        if (found.nodeType == "start") {
          //从开始节点获取变量
          const foundStart = startVars.find(
            (item) => item.variable === found.variable
          );
          if (foundStart) {
            //如果开始节点有变量，则使用开始节点变量
            addData = {
              ...foundStart,
              variableQuery: valueQuery,
             required:true,
            };
            //如果开始节点变量是文件或文件列表
            if (foundStart.type == "file" || foundStart.type == "file-list") {
              addData.allowed_file_upload_methods = [
                "local_file",
                "remote_url",
              ];
              addData.max_length = 5;
              addData.allowed_file_types = [];
            }
          } else {
            addData = {
              label: found.label,
              type: found.variable_type=="number"?"number":"text-input",
              max_length: null,
              required: true,
              variable: found.variable,
              variableQuery: valueQuery,
            };
          }
        } else {
          const varType = isObjectArray(found.variable_type);
          addData = {
            label: found.label,
            type: (varType === "object" || varType === "array") ? "json" : "text-input",
            max_length: null,
            required: true,
            variable: found.variable,
            variableQuery: valueQuery,
            [valueQuery]:varType === "object"?{}: varType==='array'?[]:'',
            varType:varType
          };
        }
        filteredVars.push(addData);
      }
    });
    setVariables(filteredVars);
  };

  //判断当前类型是对象还是数组，返回 object 或者 array
  const isObjectArray = (varType) => {
    if (varType == "object") {
      return "object";
    }
    if (varType == "array" || varType == "array[string]" || varType == "array[number]" || varType == "array[object]") {
      return "array";
    }
    return null;
  }
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  const capitalizeFirstLetter = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
        // 将 value_selector 转成字符串作为唯一标识
        const key = JSON.stringify(item.value_selector);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });

  }
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
    <div
      className={`${styles.start_run_panel_main} ${styles.llm_run_panel_main_fullscreen}`}
    >
      <div className={styles["panel_run_header"]}>
 
          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/${data.type}.png`}
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Text
                style={{ maxWidth: '100%' }}
                ellipsis={{ tooltip: data.title }}
              >
              <span className={runStyles["panel_main_header_left_title_text"]}>  {data.title}</span>
              </Text>
            </div>
          </div>
          <div className={styles["panel_run_header_right"]}>
            <RunStatus runData={runData} />

            <img
              onClick={closePanelEvent}
              className={styles["panel_close"]}
              src="/close.png"
            />
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
