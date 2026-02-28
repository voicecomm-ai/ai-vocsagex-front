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
  Divider,
} from "antd";
import { DownOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import dynamic from 'next/dynamic'
import Optimization from '../../../../optimization';//提示词优化组件
import { useStore } from "@/store/index";
// 关闭 SSR
const VariableEditor = dynamic(() => import('../../../../variable-editor'), {
  ssr: false,
})
const filterData = ['string','number','file','array[string]','array[number]','array[file]'];

const ContentInput = forwardRef(({handleFullscreenEvent,nodeData,updateDataEvent, data,index, variables = [],isContext,isFullscreen }, ref) => {
  const { readOnly } = useStore((state) => state);
  //子组件暴露方法
  const ROLE_PLACEHOLDER = {
    user: "在这里写你的提示词，输入“{”或者“/” 选择变量",
    assistant: "在这里写你的提示词，输入“{”或者“/” 选择变量",
    system: "在这里写你的提示词，输入“{”或者“/” 选择变量",
  };
  const ROLE_TIP = {
    user: "向模型提供指令、查询或任何基于文本的输入",
    assistant: "基于用户消息的模型回复",
    system: "为对话提供高层指导",
  };

  const ROLE_LIST = [
    {
      key:'user',
      label: "User",
      value: "user",
    },
    {
      key:'assistant',
      label: "Assistant",
      value: "assistant",
    },
  ];

  const [wordCount, setWordCount] = useState(0);
  const { TextArea } = Input;
  const [initValue, setInitValue] = useState(data.text);
  useImperativeHandle(ref, () => ({}));
  const [open, setOpen] = useState(false);
  const editorRef = useRef(null);
  const optimizationRef = useRef(null);//提示词优化组件
  // 复制文本处理函数
  const handleCopyPrompt_template = (itemPar) => {
    if(readOnly) return;
    navigator.clipboard.writeText(itemPar.text).then(() => {
      message.success("复制成功");
    });
  };
  //角色切换事件
  const handleRoleChange = (e) => {
    let key = e.key;
    handleUpdatePrompt_template('role',key);
  };
  //删除当前信息
  const handleDeletePrompt_template = () => {
    if(readOnly) return;
   let prompt_template = nodeData.prompt_template;
   prompt_template.splice(index, 1);
   updateDataEvent('prompt_template', prompt_template);
  };
  // 编辑器内容变化事件
  const handleChange = (plainText) => {
    handleUpdatePrompt_template('text',plainText);
  };

  const handleUpdatePrompt_template = (key,value) => {
    let prompt_template = nodeData.prompt_template;
    prompt_template[index][key] = value;
    updateDataEvent('prompt_template', prompt_template);
  };

  // 字数统计事件
  const handleWordCountChange = (count) => {
    setWordCount(count);
  };
  // 提示词优化事件
  const handleOptimization = (data) => {
    if(readOnly) return;
    optimizationRef.current.showModal(data, nodeData);
  };
  // 替换提示词事件
  const replaceEvent = (text) => {
     setInitValue(text);
    handleUpdatePrompt_template('text',text);
  };
   //全屏点击事件
   const handleFullscreen = () => {
    handleFullscreenEvent(data,index);
   };
   useEffect(() => {
    setInitValue(data.text);
   }, [isFullscreen]);
  return (
    <div className={styles.contentInput}>
      <div className={styles.contentInput_header}>
        {data.role === "system" && (
          <div className={styles.contentInput_header_title}>
            <span className='span_required'>*</span>
            {data.role.toUpperCase()}
          </div>
        )}
        {data.role !== "system" && (
          <Dropdown
          disabled={readOnly}
            menu={{ items: ROLE_LIST, onClick: handleRoleChange }}
            trigger={["click"]}
          >
            <div
              className={styles.contentInput_header_title}
              style={{ cursor: "pointer" }}
            >
              {data.role.toUpperCase()}{" "}
              <DownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
            </div>
          </Dropdown>
        )}
        <Tooltip title={ROLE_TIP[data.role]}>
          <img
            className={styles.contentInput_header_info}
            src="/workflow/info.png"
            alt=""
          />
        </Tooltip>

      <div className={styles.contentInput_header_right}>
      <div className={styles.contentInput_header_right_wordCount}>{wordCount}</div>

 
      {data.role == "system" && (
        <div className={`${styles.contentInput_header_right_copy} ${readOnly ? 'readOnly' : ''}`}>
        <img  onClick={() => handleOptimization(data)} src="/workflow/common/optimization.png" alt="" />
        </div>
      )}
      <div  className={styles['contentInput_header_right_line']}></div>
        {data.role !== "system" && (
        <div className={`${styles.contentInput_header_right_copy} ${readOnly ? 'readOnly' : ''}`}>
        <img  onClick={() => handleDeletePrompt_template(data)} src="/workflow/delete.png" alt="" />
        </div>
      )}
         <div className={`${styles.contentInput_header_right_copy} ${readOnly ? 'readOnly' : ''}`}>
        <img  onClick={() => handleCopyPrompt_template(data)} src="/workflow/common/copy.png" alt="" />
        </div>
        <div className={`${styles.contentInput_header_right_copy} ${readOnly ? 'readOnly' : ''}`}>
        <img  onClick={() => handleFullscreen()} src="/workflow/common/full.png" alt="" />
       </div>
        </div>
      </div>
      <div className={styles.contentInput_content}>
       <VariableEditor ref={editorRef}  value={initValue} onChange={handleChange} placeholder={ROLE_PLACEHOLDER[data.role]} onCharCountChange={handleWordCountChange} variables={variables} isContext={isContext} showContext={true} readOnly={readOnly} filterData={filterData}></VariableEditor>
      </div>
      {/* 提示词优化组件 */}
      <Optimization  ref={optimizationRef} replaceEvent={replaceEvent}></Optimization>
    </div>
  );
});

export default ContentInput;
