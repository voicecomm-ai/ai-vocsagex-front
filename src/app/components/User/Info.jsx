"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message,Cascader} from 'antd';
import styles from '../page.module.css';
import {resetPassword} from '@/api/user';
import { rsa } from '@/utils/rsa';
import { useRouter } from 'next/navigation';
import { getCurUserInfo } from '@/api/login';
import { getDepartmentTree } from '@/api/department';
import  {updateUser} from '@/api/user';


const UserInfoModel = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [userInfo, setUserInfo] = useState({}); //用户信息
  const showModal = () => {
    setOpen(true);
    getDepartmentList();
    getUserInfoEvent();
 
  };
  //获取部门列表
  const getDepartmentList = () => {
    getDepartmentTree({}).then((res) => {
      setDepartmentList(res.data);
    });
  }
   //获取用户信息
   const getUserInfoEvent = () => {
    getCurUserInfo().then((res) => {
      setUserInfo(res.data);
     formRef.current.setFieldsValue({
      deptIdList: res.data.deptIdList, 
      account: res.data.account,
      status: res.data.status ? "禁用" : "正常",
      username: res.data.username,
      phone: res.data.phone,
      roleName: res.data.roleName,
    });
    })
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
    let data = {
     ...userInfo,
      username: values.username,//用户名称
      phone: values.phone,//联系方式
    };
    setLoading(true); // 开始加载
    updateUser(data).then((res) => {
     modelCancelEvent();
     message.success('操作成功');
    }).catch((err) => {
      setLoading(false); // 加载结束
      console.log(err);
    });
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
      <div className={styles['userInfo_container']}>
       <div className ={styles['model_header']}>
        <div className={styles['model_header_title']}>个人信息</div>   
          <img    className={styles['model_header_close_img']} onClick={modelCancelEvent} src="/close.png" alt=""/>
      
       </div>
       <div className ={styles['model_content']}>
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
            {/* 修正重复的表单项和错误的 name 属性 */}
            <Form.Item
              label="所属部门"
              name="deptIdList"
            >
           <Cascader fieldNames={{
            label: 'departmentName',
            value: 'id',
            children: 'children',
           }} options={departmentList} disabled placeholder="所属部门" />
            </Form.Item>
            <Form.Item
              label="登录账号"
              name="account"
            >
              <Input  maxLength={20} disabled />
            </Form.Item>
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                {
                  required: true,
                  message: '请输入用户名',
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
              <Input  maxLength={50} placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="联系方式"
              name="phone"
              rules={[
                {
                
                  pattern:
                    /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/,
                  message: '手机号格式不正确',
                  trigger: 'blur',
                }
              ]}
            >
              <Input  placeholder="请输入联系方式" maxLength={20} />
            </Form.Item>
            <Form.Item
              label="角色"
              name="roleName"
            >
              <Input  maxLength={20}  disabled />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
            >
              <Input  maxLength={20} disabled />  
            </Form.Item>
          
    
          </Form>
        </Spin>
       </div>
       <div className ={styles['model_footer']}>
        <Button className={styles['model_footer_btn']} onClick={modelCancelEvent}>
          取消  
        </Button>
        <Button  onClick={submitEvent} className={styles['model_footer_btn']} type="primary" >
          确定
        </Button>
        </div> 
      </div>
    </Modal>
  );
});

export default UserInfoModel;