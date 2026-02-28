"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip, Input,message } from "antd";
import styles from "./mcp.module.css";
const { Paragraph, Text } = Typography;
import JsonEditor from "./JsonEditor";
import { getUuid } from "@/utils/utils";
const JsonModal = forwardRef((props, ref) => {

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useImperativeHandle(ref, (props) => ({
    showModal,
  }));
  const [obj,setObj] = useState({});
  const [index,setIndex] = useState(0);
  const [json,setJson] = useState('');//
  const jsonRef = useRef(null);
  const [jsonId,setJsonId] = useState(0);
  const classNames = {
    content: styles["json_modal_content"],
    body: styles["json_modal_body"],
  };


  const showModal = (obj,index) => {
    setOpen(true);
    setObj(obj);
    setIndex(index);
    setJson(obj.value);
    setJsonId(getUuid());
  };

  const handleJsonChange = (value) => {
    console.log(value);
    setJson(value);
  };

  const modelCancelEvent = () => {
    setOpen(false);
  };

  let arrayTypes =['array','array[string]','array[number]','array[object]','array[file]'];
  const modelConfirmEvent = () => {
    try {
      let jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
      setOpen(false);
      props.changeJsonData(obj,index,jsonObj);
      } catch (error) {
      message.warning('当前值不是json格式');
      return;   
    } 
  };


  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="960px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      centered
    >
      <div className={styles["json_modal_container"]}>
        <div className={styles["json_modal_header"]}>
         <div className={styles['json_modal_header_left']}>  JSON 编辑 </div>
         <div className={styles['json_modal_header_right']}>
          <img src="/close.png" onClick={modelCancelEvent} />
         </div>
        </div>
        <div className={styles["json_modal_container_main"]}>
          <JsonEditor ref={jsonRef} key={jsonId} readOnly={props.readOnly} content={json} showLineNumbers={true} onChange={handleJsonChange} />
      
        </div>
        <div className={styles["json_modal_footer"]}> 
          <Button onClick={modelCancelEvent}>取消</Button>
          <Button disabled={props.readOnly} type="primary" onClick={modelConfirmEvent}>确定</Button>
        </div>
      </div>
    </Modal>
  );
});

export default JsonModal;
