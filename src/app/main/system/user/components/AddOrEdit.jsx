"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Button,
  Modal,
  Spin,
  Form,
  Input,
  message,
  Cascader,
  Switch,
  Select,
} from "antd";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";
import { getRoleList,createUser,updateUser,getUserInfo,getRolesByDeptId,getRolesByDeptIdWithSelf} from "@/api/user";
import { getDepartmentTree,getParentDeptIdsById} from "@/api/department";
import ShowPwd from './NewPwd';
const AddOrEdit = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const showPwdRef = useRef(null); // 子组件实例的ref
  const [title, setTitle] = useState("创建账号"); //标题
  const [actionType, setActionType] = useState("add"); //
  const { TextArea } = Input;
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [departmentList, setDepartmentList] = useState([]); //部门列表
  const [departmentObj, setDepartmentObj] = useState({}); //用户信息
  const [roleList, setRoleList] = useState([]); //角色列表
  const [loading, setLoading] = useState(false); //加载状态
  const [userInfo, setUserInfo] = useState({}); //用户信息
  const showModal = async (obj, type, selectDepartment) => {
    setOpen(true);
    setLoading(true); // 开始加载
    await getDepartmentList(); //获取部门列表
  let modelTitle = type === "add" ? "创建账号" : type === "show" ? "查看" : "编辑"; //
    setActionType(type);
    setTitle(modelTitle); //标题

    if (type === "add") {
      await getRoleListEvent(selectDepartment.id); //获取角色列表
      getParentDeptIdsById(selectDepartment.id).then((res) => {
        let deptIdList = res.data;
        formRef.current.setFieldsValue({
          deptIdList:deptIdList,
        });
      }); 
    }
    else {//编辑回显
      await getRoleListWithSelfEvent(obj); //获取角色列表  
      getUserInfo(obj.id).then((res) => {
        let data = res.data;
        setUserInfo(data); //用户信息
      formRef.current.setFieldsValue({
        username: data.username,
        account: data.account,
        phone: data.phone,
        deptIdList: data.deptIdList,
        roleId: data.roleId,
        status: data.status == 0 ? true : false,
      }); 
      })
     
    }
    setLoading(false); // 加载结束
  };
  //获取部门列表
  const getDepartmentList = async () => {
   await getDepartmentTree({}).then((res) => {
      let data = res.data;
      setDepartmentList(res.data);
    });
  };
  //根据部门获取角色列表
  const getRoleListEvent = async (departmentId) => {
    await  getRolesByDeptId(departmentId).then((res) => {
      let  data =res.data.filter(
        (item) => item.roleName !== "超级管理员"
      );
      setRoleList(data);
    });
  };
  //根据部门获取角色列表(包含自己)
  const getRoleListWithSelfEvent = async (obj) => {
    let deptId =obj.deptId;
    let roleId = obj.roleId;
    await  getRolesByDeptIdWithSelf(deptId).then((res) => {
    
      let  data =res.data.filter(
        (item) => item.roleName !== "超级管理员"
      );
    //当前roleId是否在data中，如果不在，就添加到data中
      if(!data.some(item => item.id === roleId)){
        data.push({id:roleId,roleName:obj.roleName});
      }

      setRoleList(data);
    });
  };
  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    formRef.current.resetFields();
    setLoading(false); // 加载结束
  };
  const classNames = {
    content: "my-modal-content",
  };
  //提交事件 
  const submitEvent = async (e) => {
    e.preventDefault();
    const values = await formRef.current.validateFields();
    if (actionType === "add") {
      addSubmitEvent(values);
    } else {
      editSubmitEvent(values);
    }
  };
  //新增提交事件
  const addSubmitEvent = async (values) => {
    let addData = {
      deptId: values.deptIdList[values.deptIdList.length - 1],
      status:  values.status == true ? 0 : 1,
      account:values.account,
      roleId:values.roleId,
      phone:values.phone,
      password:values.password,
      username:values.username,
    };
    createUser(addData)
      .then((res) => {
        submitSuccessEvent(addData);
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //修改提交事件
  const editSubmitEvent = async (values) => {
    let data = {
      id: userInfo.id,
      deptId: values.deptIdList[values.deptIdList.length - 1],
      status:  values.status == true ? 0 : 1,
      account:values.account,
      roleId:values.roleId,
      phone:values.phone,
      password:values.password,
      username:values.username,
    };
    updateUser(data)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //提交成功事件
  const submitSuccessEvent = (addData) => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    if(actionType === "add"){//新增成功
      showPwdRef.current.showModal(addData); //显示密码
    }
    //调用父元素方法
    props?.searchEvent();
  };
  //级联选择事件
  const cascaderChange = (value, selectedOptions, extra) => {
    if (selectedOptions.length != 0) {
      getRoleListEvent(selectedOptions[selectedOptions.length - 1].id); //获取角色列表
      
    }
    if (selectedOptions.length == 0) {
      setRoleList([]); //清空角色列表
    }
    formRef.current.setFieldsValue({
      roleId:null,
    })
  
  };

  return (
    <div>
     
    <Modal
      open={open}
      title=""
      footer={null}
      width="640px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
    >
      <div className={`${styles["user_add_container"]} ${"model_container"}`} style={{ height: actionType === "add" ? "602px" : "532px" }}>
        <div className="model_header">
          <div className="model_header_title">{title}</div>
          <img
            className="model_header_close_img"
            onClick={modelCancelEvent}
            src="/close.png"
            alt=""
          />
        </div>
        <div className="model_content">
          <Spin spinning={loading}>
            <Form
              ref={formRef}
              name="basic"
              layout={"horizontal"}
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
              disabled={actionType === "show"}
              autoComplete="off"
            >
              {/* 修正重复的表单项和错误的 name 属性 */}
              <Form.Item
                label="所属部门"
                name="deptIdList"
                rules={[
                  {
                    required: true,
                    message: "请选择所属部门",
                    trigger: "blur",
                    type: "array",
                  },
                ]}
              >
                <Cascader
                onChange={cascaderChange}
                  fieldNames={{
                    label: "departmentName",
                    value: "id",
                    children: "children",
                  }}
                  changeOnSelect 
                  options={departmentList}
                  placeholder="所属部门"
                />
              </Form.Item>
              <Form.Item
                label="登录账号"
                name="account"
                rules={[
                  {
                    required: true,
                    message: "请输入登录账号",
                    trigger: "blur",
                  },
{
// 正则表达式，确保字符串不能全为空格且不能输入中文
pattern: /^(?!\s+$)[^\u4e00-\u9fa5\s][^\u4e00-\u9fa5]*$/,
  trigger: 'blur',
  message: '格式不正确',
},
                ]}
              >
                <Input
                disabled={actionType === "edit" || actionType === "show"}
                  maxLength={50}
                  placeholder="输入数字/英文字母，不超过50个字符"
                />
              </Form.Item>
              {actionType === "add" && (
                <Form.Item
                  label="初始密码"
                  name="password"
                  rules={[
                    {
                      required: true,
// 修改正则，确保不能输入中文，同时满足原有的大小写字母和数字的要求
pattern:  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\u4e00-\u9fa5]{6,20}$/,
                      message: "6-20位，需包含大小写英文和数字，不允许中文",
                      trigger: "blur",
                    },
                    {
                      validator: (rule, value, callback) => {
                        if (
                          /(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(
                            value
                          )
                        ) {
                          callback(
                            new Error("为了密码的安全，请不要输入连续3位的数字")
                          );
                        } else {
                          callback();
                        }
                      },
                      trigger: "blur",
                    },
                  ]}
                  extra="6-20位，需包含大小写英文和数字，不允许中文"
                >
                  <Input.Password maxLength={20} placeholder="请输入初始密码" />
                
                </Form.Item>
               )}
          
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  {
                    required: true,
                    message: "请输入用户名",
                    trigger: "blur",
                  },
                  {
  // 匹配全部为空格的情况，若全部为空格则提示格式错误
  validator: (rule, value, callback) => {
    if (/^\s+$/.test(value)) {
      callback(new Error('格式错误'));
    } else {
      callback();
    }
  },
  trigger: "blur",
}
                ]}
              >
                <Input maxLength={50} placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                label="联系方式"
                name="phone"
                rules={[
                  {
                    pattern:
                      /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/,
                    message: "手机号格式不正确",
                    trigger: "blur",
                  },
                ]}
              >
                <Input placeholder="请输入联系方式" maxLength={20} />
              </Form.Item>
              <Form.Item
                label="所属角色"
                name="roleId"
                rules={[
                  {
                    required: true,
                    message: "请选择所属角色",
                    trigger: "blur",
                    type: "number",
                  },
                ]}
              >
                <Select
                  placeholder="请选择所属角色"
                  options={roleList}
                  fieldNames={{ label: "roleName", value: "id" }}
                ></Select>
              </Form.Item>
              <Form.Item label="状态" name="status">
                <Switch />
              </Form.Item>
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button className="model_footer_btn" onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
            onClick={submitEvent}
            className="model_footer_btn"
            type="primary"
            disabled={actionType === "show" || loading}
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>
    <ShowPwd ref={showPwdRef} />
    </div> 
  );
});

export default AddOrEdit;
