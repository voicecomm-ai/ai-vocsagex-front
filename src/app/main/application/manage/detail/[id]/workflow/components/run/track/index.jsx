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
  Tooltip,
  Empty,
  Typography,
} from "antd";
import { message } from "antd";
import styles from "../test.module.css";
import { useStore } from "@/store/index";
import JsonEditorPage from "../JsonEditorPage";
import { getWorkflowRunNodeList } from "@/api/workflow";
import TrackItem from "./item";
const TestTrack = forwardRef((props, ref) => {
  // 模拟追踪数据
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({});
  const [fullscreenTitle, setFullscreenTitle] = useState("");
  const [trackData, setTrackData] = useState([]);
  useImperativeHandle(ref, () => ({
    updateStepStatus,
  }));
  const updateStepStatus = () => {
    console.log("updateStepStatus");
    getWorkflowRunDetailData();
  };

  useEffect(() => {
    getWorkflowRunDetailData();
  }, [props.runId]);
  //获取工作流运行详情
  const getWorkflowRunDetailData = () => {
    getWorkflowRunNodeList({ workflowRunId: props.runId })
      .then((res) => {
        let data = res.data || [];
        data.forEach((item) => {
          item.expandable = true;
          item.node_type = item.node_type.toLowerCase();
        });
        setTrackData(data);
      })
      .catch((err) => {
        console.log(err, "err");
      });
  };

  // 全屏显示
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };
  return (
    <div className={styles.test_track}>
      {trackData.length > 0 && (
        <div className={styles.track_container}>
          {trackData.map((item, index) => (
            <TrackItem
              key={item.id}
              item={item}
              index={index}
              handleFullscreen={handleFullscreen}
            />
          ))}
        </div>
      )}
      {!trackData.length && (
        <div className={styles["test_track_container_empty"]}>
          <Empty description="暂无结果" />
        </div>
      )}

      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          <JsonEditorPage
            handleFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            title={fullscreenTitle}
            content={fullscreenData}
          />
        </div>
      )}
    </div>
  );
});

export default TestTrack;
