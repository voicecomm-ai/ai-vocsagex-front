"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Button, Modal, Spin, Form, Input, message, Cascader } from "antd";
import styles from "./index.module.css";
import { useRouter } from "next/navigation";
import { getCurUserInfo } from "@/api/login";
import { addDept, updateDept } from "@/api/department";
import { createApiKey } from "@/api/application";

const CreateApiKeyModal = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); //标题
  const [tip, setTip] = useState(""); //提示信息
  const [data, setData] = useState({}); //数据

  const showModal = (id) => {
    setOpen(true);
    
    createApiKeyEvent(id) 
  };
  const [apiKey, setApiKey] = useState(""); //API密钥

  
    //重新生成密钥事件
    const createApiKeyEvent = async (id) => {
      createApiKey({appId:id}).then(res => {
        let data=res.data;
        setApiKey(data.keyValue);
      }).catch(err => {
        console.error(err);
      });
    };

  //关闭事件
  const hideModal = () => {
    setApiKey("");
    setOpen(false);
  };
  const classNames = {
    content: styles["create_api_key_modal_content"],
  };
  //提交事件
  const submitEvent = async (e) => {
    props?.saveCallBack();
    hideModal();
  };
  //复制事件
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(apiKey);
    message.success("复制成功");
  };
  //关闭模态框事件
  const closeModelEvent =()=>{
    props?.saveCallBack();
    hideModal();
  }
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="480px"
     closable={false}
      onCancel={hideModal}
      maskClosable={false}
      classNames={classNames}
      zIndex={1001}
    >
      <div className={styles["create_api_key_modal"]}>
        <div className={styles["create_api_key_modal_title"]}>
          
          新建API密钥
         <img src='/common/close.png' onClick={closeModelEvent} className={styles["create_api_key_modal_title_close"]} />
          </div>
        <div className={styles["create_api_key_modal_desc"]}>
          请将此密钥保存在安全且可访问的地方。
        </div>
        <div className={styles["create_api_key_modal_center"]}>
          <div className={styles["create_api_key_modal_center_text"]}>{apiKey}</div>
          <div className={styles["create_api_key_modal_center_btn"]}>
            <div
              className={`${styles["option-btn"]} ${styles["copy"]}`}
              onClick={() => copyToClipboard()}
              title="复制"
            ></div>
          </div>
        </div>
        <div className={styles["create_api_key_modal_footer"]}>
        
          <Button type="primary" onClick={submitEvent}>好的</Button>
        </div>
      </div>
    </Modal>
  );
});

export default CreateApiKeyModal;
