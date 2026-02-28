"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Button, Modal, Spin, Form, Input, message, Cascader } from "antd";
import styles from "../page.module.css";
import { useRouter } from "next/navigation";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { createKnowledgeBase, editKnowledgeBase } from "@/api/knowledge";

const AddOrEdit = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const [title, setTitle] = useState("创建空知识库"); //标题
  const [actionType, setActionType] = useState("add"); //
  const { TextArea } = Input;
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  const [knowledgeObj, setKnowledgeObj] = useState({}); //知识库信息
  //显示弹窗
  const showModal = (obj, type) => {
    setOpen(true);
    let modelTitle = type === "add" ? "创建空知识库" : "编辑"; //
    setActionType(type);
    setTitle(modelTitle); //标题
    setFormDataEvent(obj, type);
  };
  //获取用户信息
  const setFormDataEvent = (obj, type) => {
    setKnowledgeObj(obj);
    setTimeout(() => {
      formRef.current.setFieldsValue({
        name: type == "edit" ? obj?.name : "",
        description: type === "edit" ? obj?.description : "",
      });
    }, 0);
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
    setLoading(true); // 加载开始
    if (actionType === "add") {
      addSubmitEvent(values);
    } else {
      editSubmitEvent(values);
    }
  };
  //新增提交事件
  const addSubmitEvent = async (values) => {
    let addData = {
      name: values.name,
      description: values.description,
    };
    createKnowledgeBase(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //修改提交事件
  const editSubmitEvent = async (values) => {
    let data = {
      id: knowledgeObj.id,
      name: values.name,
      description: values.description,
    };
    editKnowledgeBase(data)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent();
  };

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
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              {title}
            </div>
            <img
              className={styles["knowledge_add_container_header_close_img"]}
              onClick={modelCancelEvent}
              src="/close.png"
              alt=""
            />
          </div>
          {actionType === "add" && (
            <div className={styles["model_header_tip"]}>
              <ExclamationCircleOutlined />
              空知识库中还没有文档，你可以在今后任何时候上传文档至该知识库.
            </div>
          )}
        </div>
        <div
          className="model_content"
          style={{
            marginTop: 16,
          }}
        >
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
              autoComplete="off"
            >
              <Form.Item
                label="知识库名称"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "请输入知识库名称",
                    trigger: "blur",
                  },
                  {
                    // 正则修改为不能全为空格
                    pattern: /^(?!\s+$).+$/,
                    message: "格式错误",
                    trigger: "blur",
                  },
                ]}
              >
                <Input
                  maxLength={50}
                  placeholder="请输入知识库名称"
                  showCount
                />
              </Form.Item>
              {actionType === "edit" && (
                <Form.Item label="知识库描述" name="description">
                  <TextArea
                    autoSize={{ minRows: 8, maxRows: 10 }}
                    showCount
                    maxLength={400}
                    placeholder="描述该数据集的内容。详细描述可以让AI更快地访问数据集的内容"
                  />
                </Form.Item>
              )}
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button className="model_footer_btn" onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
            onClick={submitEvent}
            loading={loading}
            className="model_footer_btn"
            type="primary"
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default AddOrEdit;
