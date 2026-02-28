'use client'

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect
} from "react";
import styles from "./agent.module.css";
import {
  Button,
  Select,
  Form,
  Input,
  Space,
  Radio,
  Checkbox,
  Popover,
  Slider,
  Tag,
  Modal,
  InputNumber
} from 'antd';
import { useRouter, useParams } from 'next/navigation';
 import{getAgentModelList} from '@/api/agent'
 import {  getAgentVariableList  } from '@/api/agent'
 const { TextArea } = Input;
 const VariableForm = forwardRef((props, ref) => {
     const { id } = useParams();
  const  [variableList, setVariableList] = useState([]);
  const formRef =useRef(null);
  const formContentRef=useRef(null)
  const [appId,setAppId] = useState('');

  useImperativeHandle(ref, () => ({
    validateFrom,
    updateChatForm,
    getAllValue
  }));
   
  //获取变量表单的高度
  const getFormHeight=()=>{
    if(formContentRef.current){
      const height=formContentRef.current.clientHeight;
      props.updateChatFormHeight(height);
    }
  }
  useEffect(()=>{
    getFormHeight();
  },[variableList])

// 使用 ResizeObserver 监听 formContentRef 元素的尺寸变化，当尺寸变化时更新高度
useEffect(() => {
  const ref = formContentRef.current;
  if (!ref) return;

  const observer = new ResizeObserver(() => {
    getFormHeight();
  });

  observer.observe(ref);

  return () => {
    observer.disconnect();
  };
}, [formContentRef]);
  //根据变量新增编辑更新变量表单
  const updateChatForm = () => {
    getFormHeight();
    // getVariableListEvent(appId)
  }
  //表单验证事件
  const  validateFrom =  async () => {
    let value =await formRef.current.validateFields();
    return value;
  } 
  //获取表单的所有的值
  const getAllValue = async () => {
    let value =await formRef.current.getFieldsValue(true);
    return value;
  }
  useEffect(()=>{
 
    setAppId(id)
   // getVariableListEvent(id);
  },[])
  useEffect(()=>{
 
    getVariableListEvent(props.variableList)
   // getVariableListEvent(id);
  },[props.variableList]) 

// 获取变量列表，并同步清理表单中已删除字段的值
const getVariableListEvent = async (data) => {
  let values = await getAllValue();
  // 取出当前表单所有字段和值
  const formValues = await formRef.current.getFieldsValue(true);
  // 转成数组方便查找
  let newValues = Object.entries(values).map(([label, value]) => ({ label, value }));


    // 1. 清理表单中存在但接口返回中不存在的字段的值
    const currentNames = data.map(item => item.name);
    Object.keys(formValues).forEach(fieldName => {
      if (!currentNames.includes(fieldName)) {
        formRef.current.setFieldValue(fieldName, undefined);
      }
    });

    // 2. 处理选项及值校验
    data.forEach((item) => {
      item.selectOptionArr = item.selectOptions ? item.selectOptions.split(',') : [];
      // 检查是否存在已有的表单值
      if (newValues.length) {
        const findObj = newValues.find((item1) => item1.label === item.name);
        if (findObj && item.fieldType === 'select') {
          const findIndex = item.selectOptionArr.findIndex((select) => select === findObj.value);
          if (findIndex === -1) {
            formRef.current.setFieldValue(item.name, null);
          }
        }
      }
    });
    // 3. 更新变量列表状态
    setVariableList(data);
  
}

  const cancelEvent = () => {
    props.cancelConfirmAddVisible()
  }
  //保存点击事件
  const saveEvent = () => {
    props.batchsaveVariable(variableList)
  }
  return (
    <div className={styles['variable_form_container']} style={{width:props.chatWidth}} ref={formContentRef}>

     <Form layout={"vertical"} ref={formRef}>
       {variableList.map((item, index) => (
         <div key={index}>
         {item.fieldType === 'text' && (
           <Form.Item
             label={item.displayName}
             name={item.name}
             rules={[{ required: item.required, message: '请输入' + item.displayName }]}
           >
             <Input variant="filled" className={styles['variable_input']}  placeholder='请输入' maxLength={item.maxLength}/>
           </Form.Item>
         )}
         {item.fieldType === 'paragraph' && (
           <Form.Item
             label={item.displayName}
             name={item.name}
             rules={[{ required: item.required, message: '请输入' + item.displayName }]}
           >
             <TextArea  variant="filled" className={styles['variable_input_textarea']}  autoSize={{ minRows: 2, maxRows: 11 }}  showCount placeholder='请输入' maxLength={item.maxLength} />
           </Form.Item>
         )}
         {item.fieldType === 'number' && (
           // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
           <Form.Item
             label={item.displayName}
             name={item.name}
             rules={[{ required: item.required, message: '请输入' + item.displayName }]}
           >
             <InputNumber variant="filled" className={styles['variable_input']} style={{width:'100%'}} placeholder='请输入' min={0}  />
           </Form.Item>
         )}
         {item.fieldType === 'select' && (
           <Form.Item
             label={item.displayName}
             name={item.name}
             rules={[{ required: item.required, message: '请选择' + item.displayName }]}
           >
             <Select variant="borderless" style={{width:'100%',backgroundColor:'#F5F9FC',height:'36px',borderRadius:'8px'}} options={item.selectOptionArr.map(option => ({ value: option, label: option }))} placeholder='请选择' />
           </Form.Item>
         )}
         </div>
       ))}
     </Form>
    </div>
 )
})
export default VariableForm;
