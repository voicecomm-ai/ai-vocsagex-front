"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip, Input,message } from "antd";
import styles from "./assigner.module.css";

import JsonEditor from "./JsonEditor";
import { getUuid } from "@/utils/utils";
const JsonModal = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
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
  const [isError,setIsError] = useState(false);
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
    setJson(value);
  };
  const handleJsonError = (error) => {
    setIsError(error);
  };
  const modelCancelEvent = () => {
    setOpen(false);
  };

  let arrayTypes =['array','array[string]','array[number]','array[object]','array[file]'];
  const modelConfirmEvent = () => {
    props.changeJsonDataEvent(index,json);
    setOpen(false);
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
          <JsonEditor ref={jsonRef} key={jsonId} readOnly={props.readOnly} content={json} showLineNumbers={true} onChange={handleJsonChange} onError={handleJsonError} />
      
        </div>
        <div className={styles["json_modal_footer"]}> 
          <Button onClick={modelCancelEvent}>取消</Button>
          <Button disabled={props.readOnly || isError} type="primary" onClick={modelConfirmEvent}>确定</Button>
        </div>
      </div>
    </Modal>
  );
});

export default JsonModal;
