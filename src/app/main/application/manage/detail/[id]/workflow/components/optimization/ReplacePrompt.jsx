"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Cascader} from 'antd';
import styles from './optimizaiton.module.css';  
import { useRouter } from 'next/navigation';
import { getCurUserInfo } from '@/api/login';
import { addDept, updateDept } from "@/api/department";


const DeleteModel = forwardRef((props, ref) => {

  useImperativeHandle(ref, () => ({
    showModal,hideModal
  }));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(''); //标题
  const [tip, setTip] = useState(''); //提示信息
  const  [data, setData] = useState({}); //数据

  const showModal = () => {
    setOpen(true);
  };
 
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  const classNames = {
    content: styles['replace-modal-content'],
  };
  //提交事件
  const submitEvent = async (e) => {
     props.saveCallBack();
     setOpen(false);
  }
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="400px"
      closable={false}
      onCancel={hideModal}
      classNames={classNames}
    >
      <div className={`${styles['replace_container']} ${'model_container'}`}>
       <div className ={styles['replace_container_content']}>
          <img className ={styles['replace_container_content_img']} src='/agent/replace.png' />
        
    
         <div className ={styles['replace_container_content_right']}>
          <div className ={styles['replace_container_content_right_title']}>
        替换现有内容?
       </div>
         <div className ={styles['replace_container_content_right_tip']}>
        是否确认替换现有提示词?
       </div>
       </div>
       </div>
       <div className ={styles['replace_container_footer']}>
        <Button  onClick={hideModal}>
          取消  
        </Button>
        <Button  onClick={submitEvent}  type="primary" >
          确定
        </Button>
        </div> 
      </div>
    </Modal>
  );
});

export default DeleteModel;