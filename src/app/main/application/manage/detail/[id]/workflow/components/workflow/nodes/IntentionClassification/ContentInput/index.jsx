"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import {
  Button,
  Modal,
  Spin,
  Form,
  Input,
  message,
  InputNumber,
  Checkbox,
  Select,
  Slider,
  Tooltip,
  Dropdown,
  Menu,
} from "antd";
import { DownOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import dynamic from "next/dynamic";
import Optimization from "../../../../optimization"; //提示词优化组件
// 关闭 SSR
const VariableEditor = dynamic(() => import("../../../../variable-editor"), {
  ssr: false,
});

const ContentInput = forwardRef(
  (
    {
      handleFullscreenEvent,
      nodeData,
      updateDataEvent,
      data,
      index,
      variables = [],
      isContext,
      isFullscreen,
      pannerNodeId = null,
      readOnly = false,
      countChange,
    },
    ref
  ) => {
    //子组件暴露方法
    const ROLE_PLACEHOLDER = {
      user: "在这里写你的提示词，输入“{”或者“/” 选择变量",
      assistant: "在这里写你的提示词，输入“{”或者“/” 选择变量",
      system: "在这里写你的提示词，输入“{”或者“/” 选择变量",
    };
    const ROLE_TIP = {
      user: "用户输入",
      assistant: "模型回复",
      system: "系统提示",
    };

    const ROLE_LIST = [
      {
        label: "User",
        value: "user",
      },
      {
        label: "Assistant",
        value: "assistant",
      },
    ];
    // console.log(pannerNodeId,'pannerNodeIdpannerNodeIdpannerNodeId');

    const [title, setTitle] = useState("添加变量"); //标题
    const [actionType, setActionType] = useState("add"); //
    const [wordCount, setWordCount] = useState(0);
    const { TextArea } = Input;
    const [initValue, setInitValue] = useState(data.instruction);
    useImperativeHandle(ref, () => ({}));
    const [open, setOpen] = useState(false);
    const editorRef = useRef(null);
    const optimizationRef = useRef(null); //提示词优化组件

    // 复制文本处理函数
    const handleCopyPrompt_template = (itemPar) => {
      // const jsonStr = JSON.stringify(itemPar.instruction);
      // console.log(jsonStr,'jsonStr');
      if (readOnly) return;
      navigator.clipboard.writeText(itemPar.instruction).then(() => {
        message.success("复制成功");
      });
    };

    // 编辑器内容变化事件
    const handleChange = (plainText) => {
      handleUpdatePrompt_template("instruction", plainText);
    };

    const handleUpdatePrompt_template = (key, value) => {

      let instruction = nodeData.instruction;
      instruction = value;
      updateDataEvent("instruction", instruction);
    };

    // 字数统计事件
    const handleWordCountChange = (count) => {
      // setWordCount(count);
      if (countChange) {
        countChange(count);
      }
    };

    //全屏点击事件
    const handleFullscreen = () => {
      handleFullscreenEvent(data, index);
    };
    // useEffect(() => {
    //   if (data?.instruction !== undefined && data.instruction !== initValue) {
    //     setInitValue(data.instruction || "");
    //   }
    // }, [data?.instruction]);

    useEffect(() => {
      // console.log(data.instruction,'data.instruction');

      setInitValue(data.instruction);
    }, [isFullscreen]);
    return (
      <div className={styles.contentInput}>
        {/* <div className={styles.contentInput_header}>
          <div className={styles.contentInput_header_right}>
            <div className={styles.contentInput_header_right_wordCount}>{wordCount}</div>

            <img
              className={styles.contentInput_header_right_copy}
              onClick={() => handleCopyPrompt_template(data)}
              src='/workflow/common/copy.png'
              alt=''
              style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
            />

            <img
              className={styles.contentInput_header_right_copy}
              onClick={() => handleFullscreen()}
              src='/workflow/common/full.png'
              alt=''
            />
          </div>
        </div> */}
        <div className={styles.contentInput_content}>
          <VariableEditor
            ref={editorRef}
            value={initValue}
            onChange={handleChange}
            onCharCountChange={handleWordCountChange}
            variables={variables}
            isContext={false}
            pannerNodeId={pannerNodeId}
            readOnly={readOnly}
            placeholder='请输入附加说明，比如丰富的分类依据，增强分类能力，引用“{”、“/”插入变量；'
            allowMiddleSelect={false}
          ></VariableEditor>
        </div>
        {/* 提示词优化组件 */}
        {/* <Optimization  ref={optimizationRef} replaceEvent={replaceEvent}></Optimization> */}
      </div>
    );
  }
);

export default ContentInput;
