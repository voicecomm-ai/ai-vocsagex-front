"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Cascader} from 'antd';
import styles from '../page.module.css';
import { useRouter } from 'next/navigation';
import { getCurUserInfo } from '@/api/login';
import { addDept, updateDept } from "@/api/department";


const ShowPwd = forwardRef((props, ref) => {

  useImperativeHandle(ref, () => ({
    showModal,hideModal
  }));
  const [open, setOpen] = useState(false); //是否显示
  const  [data, setData] = useState({}); //数据

  const showModal = (obj) => {
    setOpen(true);
    setData(obj); //数据
  };
 
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };
  const classNames = {
    content: 'my-modal-content',
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
    >
      <div className={`${styles['delete_container']} ${'model_container'}`}>
       <div className ={styles['delete_container_content']}>
        <img className={styles['delete_container_content_img']} src="/user/tip.png" alt=""/>
        <div className={styles['delete_container_content_title']}>用户创建成功啦!</div>
        <div className={styles['delete_container_content_tip']}>
        <div className={styles['delete_container_content_tip_title']}>账号：</div>{data.account}</div>
        <div className={styles['delete_container_content_tip']}>
       <div className={styles['delete_container_content_tip_title']}>初始密码：</div>{data.password}</div>
       </div>
       <div className ={styles['delete_container_footer']}>
        <Button className='model_footer_btn' onClick={hideModal}>
          知道了  
        </Button>
        </div> 
      </div>
    </Modal>
  );
});

export default ShowPwd;