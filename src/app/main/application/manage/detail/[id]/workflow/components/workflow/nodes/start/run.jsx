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
import styles from "../node.module.css";
import Variable from "../../../Dialog/Variable";
import { useStore } from "@/store/index";
import { useNodesInteractions, useNodeData } from "../../hooks";
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";
import JsonEditorPage from "../../../test/JsonEditorPage";
// 由于 TestInput 已声明但从未使用，移除该导入以避免警告
import TestInput from "../../../test/testInput";
import TabItem from "../../../test/TabItem";
import TestDetail from "../../../test/SingleDetail";
import RunStatus from "../../../test/RunStatus";
const StartPanel = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { getNodeById } = useNodeData();
  const { runVisible, setRunVisible, pannerNode, setPannerNode } = useStore(
    (state) => state
  );

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
  const [isExitData,setIsExitData] = useState(false);//是否存在上一次运行数据

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
    if (pannerNode && runVisible) {
      getLastRunResultEvent(pannerNode.id);
      let nodeData = getNodeById(pannerNode.id);
      setData(nodeData.data);
    }
  }, [pannerNode]);

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
        setRunData(runObj);
        setLoading(false);
        setIsExitData(runObj?true:false);
       setTabKey("3");//运行完成后跳转到详情
        testInputRef.current.closeLoading();
      })
      .catch(() => {
        setLoading(false);
        testInputRef.current.closeLoading();
      });
  };

  // 获取上一次运行结果
  const getLastRunResultEvent = async (nodeId) => {
    getLastRunResult({
      app_id: id,
      node_id: nodeId,
    }).then((res) => {
      let runObj = res.data;
      setIsExitData(runObj?true:false);
      setRunData(runObj);
    });
  };
  const handleFullscreen = (data,title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };
  const handleTabClick = (key) => {
    setTabKey(key);
  };
  return (
    <div className={styles["start_run_panel_main"]}>
      <div className={styles["panel_run_header"]}>

          <div className={styles["panel_main_header_left"]}>
            <img
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/${data.type}.png`}
            />

            <div className={styles["panel_main_header_left_title"]}>
              <Text
                style={{ maxWidth: '100%`' }}
                ellipsis={{ tooltip: data.title }}
              >
                {data.title}
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
        {isExitData&&(
      
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
          <div className={`${styles["start_run_panel_content_main"]} ${tabKey != "1" ? styles["start_run_panel_content_main_hidden"] : ""}`}>
            <TestInput ref={testInputRef} runSingeNodeEvent={runSingeNodeEvent} isRun={loading} />
          </div>
  
        {tabKey === "3" && (
        <div className={styles["start_run_panel_content_main"]}>
          <TestDetail  runData={runData} ref={testDetailRef} />
        </div>
        )}
       

      </div>
    </div>
  );
});

export default StartPanel;
