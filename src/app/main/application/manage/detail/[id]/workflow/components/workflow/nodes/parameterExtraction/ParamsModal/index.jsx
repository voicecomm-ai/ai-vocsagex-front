"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Slider,
  Switch,
  DatePicker,
  Typography,
  Dropdown,
  Spin,
} from "antd";
import styles from "./index.module.css";
const { TextArea } = Input;

const paramsTypeOptions = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Array[String]", value: "array[string]" },
  { label: "Array[Number]", value: "array[number]" },
  { label: "Array[Object]", value: "array[object]" },
];

const ParamsModal = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editIndex, setEditIndex] = useState(null);

  // 暴露
  useImperativeHandle(ref, () => ({
    showModal: (initialValues = null, index = null) => {
      if (initialValues) {
        // 编辑
        form.setFieldsValue(initialValues);
        setEditIndex(index);
      } else {
        // 新增
        form.resetFields();
        setEditIndex(null);
      }
      setOpen(true);
    },
    closeModal: () => setOpen(false),
  }));

  // 关闭弹窗
  const closeModalEvent = () => {
    setOpen(false);
    form.resetFields();
    setEditIndex(null);
  };

  // 添加
  const addHandle = async () => {
    try {
      const values = await form.validateFields();
      props.onSubmit?.(values, editIndex); //
      closeModalEvent();
    } catch (err) {
      console.log("表单校验失败:", err);
    }
  };

  return (
    <Modal
      open={open}
      title=''
      footer={null}
      width='500px'
      closable={false}
      onCancel={closeModalEvent}
      zIndex={10000}
      centered={true}
      styles={{
        content: {
          borderRadius: 24,
          padding: "24px 32px",
        },
      }}
    >
      <div className={styles.params_container}>
        <span className={styles.params_title}>{editIndex !== null ? "编辑" : "添加"}参数提取</span>
        <Form form={form} layout='vertical' className={styles.params_form}>
          <Form.Item
            label='名称'
            name='name'
            rules={[
              { required: true, message: "请输入参数名称" },
              {
                pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                message: "只能输入英文、数字、下划线，且不能以数字开头",
              },
            ]}
          >
            <Input style={{ background: '#F5F9FC',height: '36px',lineHeight: '36px'}} className={styles.params_input}   placeholder='请输入参数名称' variant='filled' />
          </Form.Item>

          <Form.Item
            label='类型'
            name='type'
            rules={[{ required: true, message: "请选择参数类型" }]}
          >
            <Select style={{ background: '#F5F9FC',height: '36px'}} className={styles.params_select} placeholder='请选择参数类型' options={paramsTypeOptions} variant='filled' />
          </Form.Item>

          <Form.Item
            label='描述'
            name='description'
            rules={[{ required: true, message: "请输入参数描述" }]}
          >
            <TextArea style={{ background: '#F5F9FC'}} className={styles.params_textarea} placeholder='请输入参数描述' rows={4} variant='filled' />
          </Form.Item>

          <div className={styles.params_footer}>
            <Button onClick={closeModalEvent}>取消</Button>
            <Button type='primary' className={styles.params_add_btn} onClick={addHandle}>
              {editIndex ? "保存" : "添加"}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
});

export default ParamsModal;
