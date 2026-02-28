"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Cascader} from 'antd';
import styles from '../page.module.css';
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

  const showModal = (obj,tilteVal,tipVal) => {
    setOpen(true);
    setTitle(tilteVal); //标题
    setTip(tipVal); //提示信息
    setData(obj); //数据
  };
 
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  const classNames = {
    content: styles['my-modal-content'],
  };
  //提交事件
  const submitEvent = async (e) => {
     props.deleteCallBack(data);
  }
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="480px"
      closable={false}
      onCancel={hideModal}
      classNames={classNames}
      zIndex={props.zIndex?props.zIndex:1000}
    >
      <div className={`${styles['delete_container']} ${'model_container'}`}>
       <div className ={styles['delete_container_content']}>
        <img className={styles['delete_container_content_img']} src="/del_tip.png" alt=""/>
        <div className={styles['delete_container_content_title']}>{title}</div>
        <div className={styles['delete_container_content_tip']}>{tip}</div>
       </div>
       <div className ={styles['delete_container_footer']}>
        <Button className='model_footer_btn' onClick={hideModal}>
          取消  
        </Button>
        <Button  onClick={submitEvent} className='model_footer_btn' type="primary" danger>
          确定
        </Button>
        </div> 
      </div>
    </Modal>
  );
});

export default DeleteModel;