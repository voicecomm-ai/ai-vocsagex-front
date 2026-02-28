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
const ApiRequestRun = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { getNodeById, getUpstreamVariables, getContentNodeVariables, mergeAndDeduplicate } =
    useNodeData();
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
  const [runData, setRunData] = useState(null);
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
    if (pannerNode && runVisible && pannerNode.type == "http-request") {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      handleRenderVariables(nodeData);
      setData(nodeData.data);
    }
  }, [runVisible]);
  // 获取llm节点中变量，并对比开始节点变量，只保留在开始节点变量中的llm变量

  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  const handleRenderVariables = (nodeData) => {
    // console.log(nodeData.data.body.data,'ppp');

    const urlDatas = nodeData.data?.url
      ? [
          {
            text: nodeData.data?.url,
          },
        ]
      : [];
    const headerDatas = nodeData.data?.headers
      ? [
          {
            text: nodeData.data.headers,
          },
        ]
      : [];

    const paramDatas = nodeData.data?.params
      ? [
          {
            text: nodeData.data.params,
          },
        ]
      : [];
    let bodyTableVars = [];
    let bodyInputVars = [];
    let bodyBinary = [];
    switch (nodeData.data.body.type) {
      case "none":
        bodyInputVars = [];
        break;
      case "json":
      case "raw-text":
        bodyInputVars = [
          {
            text: nodeData.data.body.data[0].value,
          },
        ];
        break;
      case "x-www-form-urlencoded":
        let string = convertKeyValueArrayToString(nodeData.data.body.data);
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
        let textString = convertKeyValueArrayToString(nodeData.data.body.data);
        bodyTableVars = [
          {
            text: textString,
          },
        ];
        break;
      case "binary":
        const dataVlaue = nodeData.data.binaryVars;
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

    // console.log(bodyInputVars,bodyTableVars, "body");

    const urls = getContentNodeVariables(urlDatas, pannerNode.data.id) || [];

    const headers = getContentNodeVariables(headerDatas, pannerNode.data.id) || [];

    const params = getContentNodeVariables(paramDatas, pannerNode.data.id) || [];

    const bodyTableVarsList = getContentNodeVariables(bodyTableVars, pannerNode.data.id) || [];
    const bodyInputVarsList = getContentNodeVariables(bodyInputVars, pannerNode.data.id) || [];
    // console.log(urls, headers, params, bodyTableVarsList,bodyInputVarsList);
    const result = mergeAndDeduplicate(
      "label",
      urls,
      headers,
      params,
      bodyBinary,
      bodyTableVarsList,
      bodyInputVarsList
    );
    console.log(result, "Variables list");
    setVariables(result);
  };

  function convertKeyValueArrayToString(arr) {
    // 遍历数组，将每个对象转换为 "key:value" 格式
    const stringItems = arr.map((item) => {
      // 拼接 key 和 value，中间用冒号分隔
      return `${item.key}:${item.value}`;
    });

    // 用换行符 \n 拼接所有项
    return stringItems.join("\n");
  }

  const closePanelEvent = () => {
    testInputRef.current?.clearFormEvent();
    setPannerNode(null);
    setRunVisible(false);
  };

  const runSingeNodeEvent = async (value) => {
    let inputs = {};
    for (const key in value) {
      inputs[key] = value[key];
    }

    let runData = {
      app_id: id,
      node_id: pannerNode.id,
      user_inputs: inputs,
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
              style={{ width: "24px", height: "24px" }}
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

export default ApiRequestRun;
