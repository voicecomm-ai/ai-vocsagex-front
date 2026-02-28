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
  Divider,
  message,
} from "antd";

import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style.module.css";
import JsonEditorPage from "../../../../test/JsonEditorPage";

import { useStore } from "@/store/index";
const { TextArea } = Input;
import { runNode, getLastRunResult } from "@/api/workflow";

const IntentionClassificationRun = forwardRef((props, ref) => {
  const { id } = useParams();

  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    hideModal,
  }));
  const { runVisible, setRunVisible, pannerNode } = useStore((state) => state);
  const [open, setOpen] = useState(false);

  const [runData, setRunData] = useState("");

  // 查询变量
  const [queryValue, setQueryValue] = useState("");

  // 设置状态
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({}); //数据

  // 运行状态
  const runStatus = {
    succeeded: "SUCCESS",
    failed: "FAILED",
    running: "RUNNING",
  };

  useEffect(() => {
    if (pannerNode && runVisible) {
      getLastRunResultEvent(pannerNode.data.id);
      setData(pannerNode.data);
    }
  }, [pannerNode]);

  useEffect(() => {
    if (pannerNode && runVisible) {
      getLastRunResultEvent(pannerNode.data.id);
      setData(pannerNode.data);
    }
  }, [pannerNode]);

  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  // 运行函数
  const runSingeNodeEvent = async () => {
    const runData = {
      app_id: Number(id),
      node_id: data.id,
      user_inputs: {
        query: queryValue,
      },
    };

    setLoading(true);

    setRunData({
      status: "running",
    });

    runNode(runData)
      .then((res) => {
        const runObj = res.data;
        setRunData(runObj);
        setLoading(false);

        // testInputRef.current.closeLoading();
      })
      .catch(() => {
        setLoading(false);
        // testInputRef.current.closeLoading();
      });
  };

  //获取上一次运行结果
  const getLastRunResultEvent = async (nodeId) => {
    getLastRunResult({
      app_id: id,
      node_id: nodeId,
    }).then((res) => {
      let runObj = res.data;
      setRunData(runObj);
    });
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setRunVisible(false);
  };

  // 开始运行
  const runClickEvent = () => {
    setLoading(true);
    runSingeNodeEvent();
  };

  // 查询变量输入change事件
  const handleQueryValueTextChange = (event) => {
    setQueryValue(event.target.value);
  };

  return (
    <div className={styles["panel_main"]}>
      <div className={styles["panel_main_header"]}>
        <div className={styles["panel_main_header_top"]}>
          <div className={styles["panel_main_header_left"]}>
            <Image
              className={styles["panel_main_header_left_icon"]}
              src={`/workflow/question_classifier.png`}
              alt=""
              width="24"
              height="24"
            />
            <div className={styles["panel_main_header_left_title"]}>
              <span>测试运行 意图分类</span>
            </div>
          </div>
          <div className={styles["panel_run_header_right"]}>
            {runData && runData.status !== "running" && (
              <div
                className={`${styles["run_status"]} ${styles[runData.status]}`}
              >
                <img
                  className={styles["run_status_img"]}
                  src={`/workflow/run/${runData.status}.png`}
                ></img>
                <div className={styles["run_status_content"]}>
                  {runData.status === "running" && (
                    <div className={styles["run_status_text"]}>RUNNING </div>
                  )}
                  <div
                    className={`${styles["run_status_text"]} ${
                      runData.status != "running"
                        ? styles["un_status_tex_flex"]
                        : ""
                    }`}
                  >
                    {runData.elapsed_time || 0} S{" "}
                  </div>
                  <Divider type="vertical" />
                </div>
              </div>
            )}
            <Image
              onClick={closePanelEvent}
              className={styles["panel_close"]}
              src="/close.png"
              alt=""
              width="24"
              height="24"
            />
          </div>
        </div>
      </div>
      <div className={styles["panel_main_con"]}>
        <div className={styles["panel_main_con_query"]}>
          <div className={styles["panel_main_con_queryvar"]}>
            <span>查询变量</span>
          </div>
          <TextArea
            rows={5}
            autoSize={{ minRows: 5, maxRows: 12 }}
            value={queryValue}
            onChange={handleQueryValueTextChange}
            placeholder="请输入"
            variant="borderless"
            style={{ background: "#f2f4f67f" }}
          />
        </div>
      </div>
      <div className={styles["panel_main_con_button"]} onClick={runClickEvent}>
        <div className={styles["panel_main_con_buttontxt"]}>开始运行</div>
      </div>
      <div className={styles["run_panel_content"]}>
        {runData && runData.status !== "running" && (
          <div className={styles["run_panel_result"]}>
            <JsonEditorPage title="输入" content={runData.inputs} />
            <JsonEditorPage title="输出" content={runData.outputs} />

            <div className={styles["run_panel_footer"]}>
              <div className={styles["run_panel_footer_item"]}>
                <div className={styles["run_panel_footer_item_left"]}>
                  状态：
                </div>
                <div className={styles["run_panel_footer_item_right"]}>
                  {runStatus[runData.status] || runData.status}
                </div>
              </div>
              <div className={styles["run_panel_footer_item"]}>
                <div className={styles["run_panel_footer_item_left"]}>
                  执行人：
                </div>

                <div className={styles["run_panel_footer_item_right"]}>
                  {" "}
                  {runData.executor_name}
                </div>
              </div>
              <div className={styles["run_panel_footer_item"]}>
                <div className={styles["run_panel_footer_item_left"]}>
                  开始时间：
                </div>
                <div className={styles["run_panel_footer_item_right"]}>
                  {runData.createTime}
                </div>
              </div>
              <div className={styles["run_panel_footer_item"]}>
                <div className={styles["run_panel_footer_item_left"]}>
                  运行时间：
                </div>
                <div className={styles["run_panel_footer_item_right"]}>
                  {runData.elapsed_time || 0} s
                </div>
              </div>
              <div className={styles["run_panel_footer_item"]}>
                <div className={styles["run_panel_footer_item_left"]}>
                  总token数：
                </div>
                <div className={styles["run_panel_footer_item_right"]}>
                  0 Tokens
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default IntentionClassificationRun;
