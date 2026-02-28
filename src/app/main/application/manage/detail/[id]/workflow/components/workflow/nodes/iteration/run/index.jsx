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
import { useNodesInteractions, useNodeData, useParent,useRun } from "../../../hooks";
import { useReactFlow } from "@xyflow/react";
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";
import TestInput from "./testInput";
import TabItem from "../../../../test/TabItem";
import TestDetail from "../../../../test/SingleDetail";
import RunStatus from "../../../../test/RunStatus";
import runStyles from "./run.module.css";
import RunJson from '../../../../run-json/index';
import { getUuid } from "@/utils/utils";
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
  const { getParentChildVariables } = useParent();
  const { getNodeVariables } = useRun();
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
 const [isFile,setIsFile] = useState(false); //是否是文件
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
    if (pannerNode && runVisible && pannerNode.type == "iteration") {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
     getIterationNodeVariables(nodeData.data);
      setData(nodeData.data);
    }
  }, [runVisible]);


  const getIterationNodeVariables = (data) => {

    let childVariables = getParentChildVariables(pannerNode.data.id);
    let isFileUpload = data.iterator_input_type=='array[file]'?true:false;
    let fileKey = "";
    if(isFileUpload){
    let iterator_selector = data.iterator_selector;
     fileKey = iterator_selector.join(".");
    }
    setIsFile(isFileUpload);
    let nodeId = data.id;
    let loopVars = [];
    childVariables.forEach(childVariable => {
      loopVars.push({
        var_type: '',
        value_selector:childVariable,
      })
    })

    let variables = getNodeVariables(loopVars,nodeId,false,true,false);
    console.log(variables,'variables')
    if(isFileUpload){
      let fileVariable = {
        "type": "file-list",
        "label": "输入",
        "options": [],
        "max_length": 5,
        "required": true,
        "variable": fileKey,
        "id": getUuid(),
        "allowed_file_upload_methods": [
            "local_file",
            "remote_url"
        ],
        "allowed_file_extensions": [],
        "allowed_file_types": [],
        "variableQuery": fileKey
      }
    variables.push(fileVariable);
    }
    setVariables(variables);
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
    <div
      className={`${styles.start_run_panel_main} ${styles.llm_run_panel_main_fullscreen}`}
    >
      <div className={styles["panel_run_header"]}>

          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/${data.type}.png`}
              alt=""
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Text
                style={{ maxWidth: 100 }}
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
              alt=""
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
            nodeId={data.id}
            nodeData={data}
            isFile={isFile}
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
          <RunJson
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
