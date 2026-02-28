/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Button, Drawer, Form, Radio, Input, Upload, ConfigProvider, Typography } from "antd";
import { message, Divider } from "antd";
import { useParams } from "next/navigation";
import styles from "../node.module.css";
import docStyles from "./docParse.module.css";
import Variable from "../../../Dialog/Variable";
import { useStore } from "@/store/index";
import TabItem from "./TabItem";
import { useNodesInteractions, useNodeData } from "../../hooks";
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";
import JsonEditorPage from "../../../test/JsonEditorPage";
// 由于 TestInput 已声明但从未使用，移除该导入以避免警告
import TestInput from "./testInputDoc";
import RunStatus from "../../../test/RunStatus";
import { useRun } from "../../hooks/use-run";
import TestDetail from "../../../test/SingleDetail";
const DocParseRun = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Paragraph, Text } = Typography;
  const { getNodeVariables } = useRun();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { getNodeById, getUpstreamVariables } = useNodeData();
  const { runVisible, setRunVisible, pannerNode, setPannerNode, docInputData } = useStore(
    (state) => state
  );
  const [tabKey, setTabKey] = useState("1"); //输入

  const options = [
    { label: "从本地上传", value: "local" },
    { label: "粘贴URL链接", value: "url" },
  ];
  const [tabItems, setTabItems] = useState([
    {
      key: "1",
      label: "输入",
    },
    // {
    //   key: '2',
    //   label: '详情',
    // },
  ]);
  const { Dragger } = Upload;
  const [uploadType, setUploadType] = useState("local");
  const [remote_url, setRemoteUrl] = useState("");
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [fileloading, setFileLoading] = useState(false); //加载中
  const [isEditing, setIsEditing] = useState(false); //是否编辑
  const variableRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [inputItem, setInputItem] = useState(null);
  const testInputRef = useRef(null);
  // const [runData, setRunData] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({});
  const [fullscreenTitle, setFullscreenTitle] = useState("");
   const testDetailRef = useRef(null);
  const [runData, setRunData] = useState(null);

  const runStatus = {
    succeeded: "SUCCESS",
    failed: "FAILED",
    running: "RUNNING",
  };

  useEffect(() => {
    if (pannerNode && runVisible) {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      if(nodeData.data.variable_selector){
        let arr =[{
          value_selector:nodeData.data.variable_selector,
        }]
        let variableArr = getNodeVariables(arr,pannerNode.id,true);
        console.log(variableArr, 'item')
        variableArr.forEach((item,i)=>{
      
          item.label ='用户输入';
          item.variableQuery ='files'
          item.variable_type =item.type=='file-list'?'array[file]':'file';
          item.variable_name =item.variableQuery;

        })
        setInputItem(variableArr[0]);
      }
      setData(nodeData.data);
      // console.log(nodeData.data, inputData, 'data run')

      setTabKey("1");
    }
  }, [runVisible]);

  const [uploadConfig, setUploadConfig] = useState({});

  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  const closePanelEvent = () => {
    // testInputRef.current.clearFormEvent()
    setPannerNode(null);
    setRunVisible(false);
  };

  const runSingeNodeEvent = async (value) => {
    // console.log(value, 'vvvv')

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
        if (runObj) {
          runObj.isHasProcessData = Object.keys(runObj.process_data).length !== 0;
        }
        setRunData(runObj);
        setLoading(false);
        if (tabItems.length === 1) {
          setTabItems([
            ...tabItems,
            {
              key: "2",
              label: "详情",
            },
          ]);
        }
        setTabKey("2");
        testInputRef.current.closeLoading();
      })
      .catch(() => {
        setLoading(false);
        testInputRef.current.closeLoading();
      });
  };
  // 标签点击事件
  const handleTabClick = (key) => {
    setTabKey(key);
  };

  // 获取上一次运行结果
  const getLastRunResultEvent = async (nodeId) => {
    getLastRunResult({
      app_id: id,
      node_id: nodeId,
    }).then((res) => {
      let runObj = res.data;
      setRunData(runObj);
      if (runObj) {
        runObj.isHasProcessData = Object.keys(runObj.process_data).length !== 0;
        setTabItems([
          ...tabItems,
          {
            key: "2",
            label: "详情",
          },
        ]);
      }
      // console.log(runData, 'docRunData')
    });
  };
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };

  return (
    <div className={styles["start_run_panel_main"]}>
      <div className={styles["panel_run_header"]}>

          <div className={styles["panel_main_header_left"]}>
            {data.type && (
              <img
                className={styles["panel_main_header_left_icon"]}
                src={`/workflow/${data.type}.png`}
                alt=''
              />
            )}

            <div className={styles["panel_main_header_left_title"]}>
              <Text style={{ maxWidth: '100%' }} ellipsis={{ tooltip: data.title }}>
                {data.title}
              </Text>
            </div>
          </div>
          <div className={styles["panel_run_header_right"]}>
          <RunStatus runData={runData} />

            <img
              onClick={closePanelEvent}
              className={docStyles["panel_close"]}
              src='/close.png'
              alt=''
            />
          </div>

      </div>
      {runData && (
        <div className={docStyles["test_container_tab"]}>
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

      <div className={docStyles["run_panel_content"]}>
        {inputItem && (
          <div
            className={docStyles["doc_parse_content_upload"]}
            style={{ display: tabKey === "1" ? "block" : "none" }}
          >
            <div className={docStyles["start_run_panel_content_main"]}>
              <TestInput
                ref={testInputRef}
                variable={inputItem}
                isRun={loading}
                runSingeNodeEvent={runSingeNodeEvent}
              />
            </div>
          </div>
        )}

        {tabKey === "2" && runData && runData.status != "running" && (
          <div className={styles["start_run_panel_content_main"]}>
          <TestDetail runData={runData} ref={testDetailRef} />
        </div>
        )}
      </div>
    </div>
  );
});

export default DocParseRun;
