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
  Tooltip,
} from "antd";
import { message } from "antd";
import styles from "./test.module.css";
import { useStore } from "@/store/index";
import JsonEditorPage from "./JsonEditorPage";
const { TextArea } = Input;
import { getWorkflowRunDetail } from "@/api/workflow";
const { Text } = Typography;
const TestDetail = forwardRef((props, ref) => {
  const { panelVisible, setPanelVisible, pannerNode } = useStore(
    (state) => state
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState({});
  const [fullscreenTitle, setFullscreenTitle] = useState("");
  const runStatus = {
    succeeded: "SUCCESS",
    failed: "FAILED",
    running: "RUNNING",
  };
  const [runData, setRunData] = useState({});
  useEffect(() => {
    if (props.runId) {
      getRunData();
    }
  }, []);

  //获取运行数据
  const getRunData = () => {
    getWorkflowRunDetail({
      workflowRunId: props.runId,
    }).then((res) => {
      let data = res.data;
      setRunData(data);
    });
  };
  useImperativeHandle(ref, () => ({
    setFullscreenData,
    setFullscreenTitle,
    setIsFullscreen,
  }));
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };

  const renderErrorContent = () => {
    return <div className={styles["run_tooltip_content"]}>{runData.error}</div>;
  };

  return (
    <div className={styles["run_panel_result"]}>
      {runData.error && (
        <div className={styles["run_panel_result_error"]}>
          <img
            className={styles["run_panel_result_error_left"]}
            src="/workflow/run/error.png"
            alt="error"
          />

          <Text
            style={{ maxWidth: 345 }}
            ellipsis={{ tooltip: renderErrorContent }}
          >
            <span className={styles["run_panel_result_error_right_text"]}>
              {" "}
              {runData.error}
            </span>
          </Text>
        </div>
      )}
      <div style={{ marginBottom: "4px" }}>
        <JsonEditorPage
          handleFullscreen={handleFullscreen}
          isFullscreen={isFullscreen}
          title="输入"
          content={runData.inputs}
        />
      </div>
      <JsonEditorPage
        handleFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
        title="输出"
        content={runData.outputs}
      />

      <div className={styles["run_panel_footer"]}>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>状态：</div>
          <div className={styles["run_panel_footer_item_right"]}>
            {runStatus[runData.status] || runData.status}
          </div>
        </div>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>执行人：</div>

          <div className={styles["run_panel_footer_item_right"]}>
            {" "}
            {runData.createdAccount}
          </div>
        </div>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>开始时间：</div>
          <div className={styles["run_panel_footer_item_right"]}>
            {runData.created_at}
          </div>
        </div>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>运行时间：</div>
          <div className={styles["run_panel_footer_item_right"]}>
            {runData.elapsed_time || 0} s
          </div>
        </div>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>
            总token数：
          </div>
          <div className={styles["run_panel_footer_item_right"]}>
            {runData.total_tokens} Tokens
          </div>
        </div>
        <div className={styles["run_panel_footer_item"]}>
          <div className={styles["run_panel_footer_item_left"]}>运行步数：</div>
          <div className={styles["run_panel_footer_item_right"]}>
            {runData.total_steps}
          </div>
        </div>
      </div>
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

export default TestDetail;
