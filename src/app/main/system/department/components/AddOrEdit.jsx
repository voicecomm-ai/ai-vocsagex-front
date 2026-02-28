"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Cascader} from 'antd';
import styles from '../page.module.css';
import { useRouter } from 'next/navigation';
import { getCurUserInfo } from '@/api/login';
import { addDept, updateDept } from "@/api/department";


const AddOrEdit = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState('添加下级'); //标题
  const [actionType, setActionType] = useState('add'); // 
  const { TextArea } = Input;
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [departmentObj, setDepartmentObj] = useState({}); //用户信息
  const showModal = (obj,type) => {
    setOpen(true);
    let modelTitle = type === 'add' ? '添加下级' : '编辑'; //
    setActionType(type);
    setTitle(modelTitle); //标题
  
    setDepartmentObj(obj);
    setFormDataEvent(obj,type);
 
  };
   //获取用户信息
   const setFormDataEvent = (obj,type) => {
  
  setTimeout(() => {
    formRef.current.setFieldsValue({
      parentDepartmentName: type=='add'? obj?.departmentName : obj?.parentDepartmentName ,
      remark: type === 'add' ? '' : obj?.remark || '',
      departmentName: type === 'add' ? '' : obj?.departmentName || '',
    });
    console.log(formRef.current)  
  }, 0);

  }

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
    setLoading(false); // 加载结束
  };
  const classNames = {
    content: styles['my-modal-content'],
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
     if(actionType === 'add'){
       
        addSubmitEvent(values);
     }  
     else{
      editSubmitEvent(values);
     }
  }
  //新增提交事件
  const addSubmitEvent = async (values) => {
    let addData = {
     parentDepartmentName : departmentObj.departmentName,
     parentId : departmentObj.id,
     level : departmentObj.level + 1,
     ...values
    }
    addDept(addData).then((res) => {
      submitSuccessEvent()
    }).catch((err) => {
      setLoading(false); // 加载结束
      console.log(err);
    });
  }
  //修改提交事件
  const editSubmitEvent = async (values) => {
    let data = {
      id : departmentObj.id,
      level : departmentObj.level,
      ...values
    }
    updateDept(data).then((res) => {
      submitSuccessEvent()
    })
    .catch((err) => {
      setLoading(false); // 加载结束
      console.log(err);
    })
  }
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success('操作成功');
    //调用父元素方法
    props?.searchEvent();

  }

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="640px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
    >
      <div className={`${styles['department_add_container']} ${'model_container'}`}>
       <div className ='model_header'>
        <div className='model_header_title'>{title}</div>
          <img    className='model_header_close_img' onClick={modelCancelEvent} src="/close.png" alt=""/>
      
       </div>
       <div className ='model_content'>
       <Spin spinning={loading}>
          <Form
            ref={formRef}
            name="basic"
            layout={'horizontal'}
            labelCol={{
              span: 4,
            }}
            wrapperCol={{
              span: 18,
            }}
            initialValues={{
              gender: 0,
              status: true,
            }}
            autoComplete="off"
          >
            <Form.Item
              label="上级部门"
              name="parentDepartmentName"
            >
              <Input  maxLength={20}  disabled />
            </Form.Item>
            <Form.Item
              label="当前名称"
              name="departmentName"
              rules={[
                {
                  required: true,
                  message: '请输入当前名称',
                  trigger: 'blur',
                },
{
  // 正则修改为不能全为空格
  pattern: /^(?!\s+$).+$/,
  message: '格式错误',
  trigger: 'blur',
}
              ]}
            >
              <Input  maxLength={10}  placeholder="输入不超过10个字符"  />
            </Form.Item>
            <Form.Item
              label="备注"
              name="remark"
            >
              <TextArea autoSize={{minRows: 2, maxRows: 3}} showCount maxLength={50} placeholder="输入不超过50个字符" />  
            </Form.Item>
          
    
          </Form>
        </Spin>
       </div>
       <div className ='model_footer'>
        <Button className='model_footer_btn' onClick={modelCancelEvent}>
          取消  
        </Button>
        <Button  onClick={submitEvent} className='model_footer_btn' type="primary" >
          确定
        </Button>
        </div> 
      </div>
    </Modal>
  );
});

export default AddOrEdit;