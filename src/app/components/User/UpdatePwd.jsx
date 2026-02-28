"use client";

import React, { useState, forwardRef, useImperativeHandle,useRef  } from 'react';
import { Button, Modal,Spin,Form,Input,message   } from 'antd';
import styles from '../page.module.css';
import {resetPassword} from '@/api/user';
import { rsa } from '@/utils/rsa';
import { useRouter } from 'next/navigation';
const UpdatePwd = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('修改密码');
  const [userInfo, setUserInfo] = useState({}); //用户信息
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [action, setAction] = useState(1); //操作类型 1-修改密码 2-重置密码
  const showModal = (obj,type) => {
    setOpen(true);
    setAction(type);
    setTitle(type==1?'修改密码':'重置密码');
    if(type==1){//当为修改密码时，获取用户信息
      initFunc();
    }
    else{ //当为重置密码时，直接设置用户信息
      setUserInfo(obj);
    }
  };
  //获取用户信息
  const initFunc = () => {
    let userData = JSON.parse(sessionStorage.getItem('userInfo'));
    setOpen(true);
    setUserInfo(userData);
  }
  //关闭事件

  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
  };
  const classNames = {
    content: styles['my-modal-content'],
  };
  //校验确认密码
  const checkConfirmPwd = (rule, value, callback) => {
    const form = formRef.current;
    if (!value) {
      callback('请输入确认密码');
    }
    if (value && value !== form.getFieldValue('newPsw')) {
      callback('两次输入的密码不一致');
    } else {
      callback();
    }
  };
  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    let data = {
      id: userInfo.id,//用户id
      oldPassword: values.oldPsw? rsa(values.oldPsw):'',
      firstPassword: rsa(values.newPsw),
      secondPassword: rsa(values.confirmNewPsw),
    };
    setLoading(true); // 开始加载
    resetPassword(data).then((res) => {
      submitSuccessEvent();
    
    }).catch((err) => {
      setLoading(false); // 加载结束
      console.log(err);
    });
  }

  // 提交成功事件
  const submitSuccessEvent = () => {
    modelCancelEvent();
    if (action === 1) { // 修改密码成功后，跳转到登录页面
      message.success('修改密码成功');
      router.push("/login");
    }
    else{ //重置密码成功后，关闭弹窗
      message.success('重置密码成功');
      porps?.searchEvent();
    }
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
      <div className={styles['update_pwd_container']}>
       <div className ={styles['model_header']}>
        <div className={styles['model_header_title']}>{title}</div>   
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
{action === 1 ? (
  <Form.Item
    label="原密码"
    name="oldPsw"
    rules={[
      {
        required: true,
        message: '请输入原密码',
      },
    ]}
  >
    <Input.Password
      placeholder="请输入原密码"
      maxLength={20}
    />
  </Form.Item>
) : (
  <Form.Item
    label="当前帐号"
  >
    <Input
      value={userInfo.account || ''}
      disabled
    />
  </Form.Item>
)}
            <Form.Item
              label="新密码"
              name="newPsw"
              rules={[
{
  required: true,
// 此正则表达式确保密码包含至少一个小写字母、一个大写字母和一个数字，且长度在 6 到 20 位之间，不包含特殊符号
pattern:  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\u4e00-\u9fa5]{6,20}$/,
  message: '6-20位，需包含大小写英文和数字，不能包含中文',
  trigger: 'blur',
},
                {
                  validator: (rule, value, callback) => {
                    if (
                      /(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(
                        value
                      )
                    ) {
                      callback(new Error('为了密码的安全，请不要输入连续3位的数字'));
                    } else {
                      callback();
                    }
                  },
                  trigger: 'blur',
                },
              ]}
            >
              <Input.Password
                placeholder="6-20位，需包含大小写英文和数字，不允许中文"
                maxLength={20}
            
              />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="confirmNewPsw"
              rules={[
          { required: true, validator: checkConfirmPwd, trigger: 'blur' },
        ]}
            >
              <Input.Password placeholder="请再次输入新密码"      maxLength={20} />
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

export default UpdatePwd;