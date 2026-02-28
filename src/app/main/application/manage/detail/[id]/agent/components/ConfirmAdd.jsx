'use client'

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect
} from "react";
import styles from "../page.module.css";
import { Select } from "antd";
 import{getAgentModelList} from '@/api/agent'
 import {Button} from 'antd'

 const ConfirmAdd = forwardRef((props, ref) => {
  const  [variableList, setVariableList] = useState([]);

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  const  showModal = (arr) => {
    setVariableList(arr);
  } 
  const cancelEvent = () => {
    props.cancelConfirmAddVisible()
  }
  //保存点击事件
  const saveEvent = () => {
    props.batchsaveVariable(variableList)
  }
  return (
    <div className={styles['confirmAdd_content']}>
    <div className={styles['confirmAdd_content_model']}>
    <div className={styles['confirmAdd_content_model_title']}>
      <div className={styles['confirmAdd_content_model_title_left']}>
        <img src='/agent/variable_add.png' />
      </div>
        <div className={styles['confirmAdd_content_model_title_right']}>
         提示词中引用了未定义的变量，是否自动添加到用户输入表单中？ 
        </div>
     
      </div>
      <div className={styles['confirmAdd_content_model_content']}>
   {variableList.map((variable, index) => (
  <div key={index} className={styles['confirmAdd_content_item']}>
   
    {`{{${variable}}}`}
  </div>
    ))}
      </div>
      <div className={styles['confirmAdd_content_model_footer']}>
       <Button onClick={cancelEvent}>取消</Button>
       <Button onClick={saveEvent} type='primary'>添加</Button>
      </div>
    </div>
    </div>
  )
})
export default ConfirmAdd;
