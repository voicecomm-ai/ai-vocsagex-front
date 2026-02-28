"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Button, Modal, Spin, Form, Input, message, Cascader } from "antd";
import styles from "./component.module.css";
import { useStore } from "@/store/index";
import { useRouter } from "next/navigation";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { createTagEdgeApi } from "@/api/graph";

const Ontology = forwardRef((props, ref) => {
  //子组件暴露方法
  const router = useRouter();
  const { isCommonSpace, currentNamespaceId, currentNamespaceObj } = useStore(
    (state) => state
  );
  const [title, setTitle] = useState("新增本体"); //标题
  const [curType, setCurType] = useState("substance");
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); //加载状态
  //显示弹窗
  const showModal = (type) => {
    setOpen(true);
    setTitle(type === "substance" ? "新增本体" : "新增关系");
    setCurType(type);
    setFormDataEvent();
  };
  //获取用户信息
  const setFormDataEvent = () => {
    setTimeout(() => {
      formRef.current.setFieldsValue({
        tagName: "",
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
    if (curType === "substance") {
      addSubstanceEvent(values);
    } else {
      addAttributeEvent(values);
    }
  };
  //新增本体事件
  const addSubstanceEvent = async (values) => {
    let addData = {
      spaceId: currentNamespaceId,
      tagName: values.tagName,
      type: 0,
    };
    console.log(addData, "addData");
    createTagEdgeApi(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //新增属性事件
  const addAttributeEvent = async (values) => {
    let addData = {
      spaceId: currentNamespaceId,
      tagName: values.tagName,
      type: 1,
    };
    createTagEdgeApi(addData)
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
    props?.getOntologyList(curType);
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
              {curType === "substance" ? (
                <Form.Item
                  label="本体名称"
                  name="tagName"
                  rules={[
                    {
                      required: true,
                      validator: async (_rule, value) => {
                        // 必填验证
                        if (!value || value.trim() === "") {
                          return Promise.reject("请输入本体名称");
                        }

                        // 不能全为空格
                        if (/^\s+$/.test(value)) {
                          return Promise.reject("格式错误");
                        }

                        // 不能以数字开头
                        if (/^\d/.test(value)) {
                          return Promise.reject("不能以数字开头");
                        }

                        // 特殊字符验证
                        if (!/^[A-Za-z0-9\u4e00-\u9fa5_]+$/.test(value)) {
                          return Promise.reject(
                            "不能包含下划线（_）以外的特殊字符"
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    maxLength={50}
                    placeholder="请输入本体名称"
                    showCount
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  label="关系名称"
                  name="tagName"
                  rules={[
                    {
                      required: true,
                      validator: async (_rule, value) => {
                        // 必填验证
                        if (!value || value.trim() === "") {
                          return Promise.reject("请输入关系名称");
                        }

                        // 不能全为空格
                        if (/^\s+$/.test(value)) {
                          return Promise.reject("格式错误");
                        }

                        // 不能以数字开头
                        if (/^\d/.test(value)) {
                          return Promise.reject("不能以数字开头");
                        }

                        // 特殊字符验证
                        if (!/^[A-Za-z0-9\u4e00-\u9fa5_]+$/.test(value)) {
                          return Promise.reject(
                            "不能包含下划线（_）以外的特殊字符"
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    maxLength={50}
                    placeholder="请输入关系名称"
                    showCount
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
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default Ontology;
