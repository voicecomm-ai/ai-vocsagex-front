/* eslint-disable @next/next/no-img-element */
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
import { useStore } from "@/store/index";

// 关闭 SSR
const VariableEditor = dynamic(() => import("../../../../variable-editor"), {
  ssr: false,
});

const ContentInput = forwardRef(
  (
    {
      handleFullscreenEvent,
      nodeData,
      bodyType = '',
      isHeader,
      updateDataEvent,
      renderType,
      rowKey,
      tableIndex,
      data,
      index,
      minHeight,
      bg,
      border,
      variables = [],
      pannerNodeId = null,
      isContext,
      isFullscreen,
      minWidth,
    },
    ref
  ) => {
    const { readOnly } = useStore((state) => state);
    //子组件暴露方法
    const ROLE_PLACEHOLDER = {
      user: "在这里写你的提示词，输入“{”或者“/” 选择变量",
      assistant: "在这里写你的提示词，输入“{”或者“/” 选择变量",
      system: "在这里写你的提示词，输入“{”或者“/” 选择变量",
    };

    const [wordCount, setWordCount] = useState(0);
    const { TextArea } = Input;
    const [initValue, setInitValue] = useState("");
    useImperativeHandle(ref, () => ({}));
    const [open, setOpen] = useState(false);
    const editorRef = useRef(null);
    const optimizationRef = useRef(null); //提示词优化组件
    // 复制文本处理函数
    const handleCopyPrompt_template = (itemPar) => {
      if (readOnly) return;
      navigator.clipboard.writeText(itemPar.text).then(() => {
        message.success("复制成功");
      });
    };
    //角色切换事件
    const handleRoleChange = (e) => {
      let key = e.key;
      handleUpdatePrompt_template("role", key);
    };
    //删除当前信息
    const handleDeletePrompt_template = () => {
      if (readOnly) return;
      let prompt_template = nodeData.prompt_template;
      prompt_template.splice(index, 1);
      updateDataEvent(prompt_template);
    };
    // 编辑器内容变化事件
    const handleChange = (plainText) => {
      handleUpdatePrompt_template(plainText);
    };

    const handleUpdatePrompt_template = (value) => {
      // console.log(value,bodyType,'vvvvvvv');
      const keytypes = ["headers", "params", "form-data","x-www-form-urlencoded"];
      let obj = null;
      if (keytypes.includes(renderType) || keytypes.includes(bodyType)) {
       
          obj = {
            value,
            rowKey,
            tableIndex,
          };
          // console.log(obj,'input');
          
          updateDataEvent(obj);
      
      } else {
       obj = value
       
          updateDataEvent(obj,renderType,bodyType);
      }
    };

    // 字数统计事件
    const handleWordCountChange = (count) => {
      setWordCount(count);
    };

    //全屏点击事件
    const handleFullscreen = () => {
      handleFullscreenEvent(data, index);
    };
    // useEffect(() => {
    //   if (data !== undefined && isUpdate || data == '' && (!isUpdate && bodyType !== '')) {
    //     setInitValue(data || "");
    //   }
    // }, [data]);
    useEffect(() => {
      setInitValue(data);
    }, [isFullscreen]);

    return (
      <div className={styles.contentInput} style={{minHeight:`${minHeight}px`,background:`${bg}`,border:`${border}`}}>
        {isHeader && (
          <div className={styles.contentInput_header}>
            <div>{bodyType === 'json' ? bodyType.toUpperCase():'RAW'}</div>
            <div className={styles.contentInput_header_right}>
              {/* <div className={styles.contentInput_header_right_wordCount}>{wordCount}</div> */}

              {/* <img
              className={`${styles.contentInput_header_right_copy} ${readOnly ? "readOnly" : ""}`}
              onClick={() => handleCopyPrompt_template(data)}
              src='/workflow/common/copy.png'
              alt=''
            /> */}

              <img
                className={`${styles.contentInput_header_right_copy} ${readOnly ? "readOnly" : ""}`}
                onClick={() => handleFullscreen()}
                src='/workflow/common/full.png'
                alt=''
              />
            </div>
          </div>
        )}
        <div className={styles.contentInput_content}>
          <VariableEditor
            ref={editorRef}
            style={
              {
                minHeight:'36px',
                background:bg,
                // border
              }
            }
            value={initValue}
            onChange={handleChange}
            placeholder='输入"{","/"插入变量'
            onCharCountChange={handleWordCountChange}
            variables={variables}
            pannerNodeId={pannerNodeId}
            minWidth={minWidth}
            readOnly={readOnly}
             allowMiddleSelect={false}
          ></VariableEditor>
        </div>
      </div>
    );
  }
);

export default ContentInput;
