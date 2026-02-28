"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Button, Spin, Form, InputNumber, Select, Input, Tree, ConfigProvider } from "antd";
import { message } from "antd";
import styles from "./run.module.css";
const { TextArea } = Input;
import { useStoreApi, useReactFlow } from "@xyflow/react";
import SingleFile from "./SingleFile";
import { debounce } from "lodash";
import { useStore } from "@/store/index";
import JsonEditor from "./JsonEditor";

const TestInput = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow();
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const jsonEditorRef = useRef(null);
  const { setPanelVisible, setPannerNode, runVisible } = useStore((state) => state);
  const formRef = useRef(null);
  const [jsonError, setJsonError] = useState(false);
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    initFun,
    onChangeContextJSON,
    onJSONError,
  }));

  useEffect(() => {
    if (props.variables && props.variables.length > 0) {
      //如果llm节点有变量，则使用llm节点变量
      setVariables(props.variables);
      console.log(props, "props");
    }
  }, [props.variables]);

  useEffect(() => {
    if (props.isRun) {
      setLoading(props.isRun);
    }
  }, [props.isRun]);

  const closeLoading = () => {
    setLoading(false);
  };
  //初始化
  const initFun = () => {
    setLoading(false);
    setFileLoading(false);
  };

  const runClickEvent = async () => {
    let value = await formRef.current.validateFields();
    let fieldSet = await formRef.current.getFieldsValue(true);
    let inputs = {};

    console.log(fieldSet, "fieldSet");

    for (const key in fieldSet) {
      // 找到当前字段对应的配置
      const variableItem = (variables || []).find((v) => v.variableQuery === key);
      if (!variableItem) continue;

      let keyValue = "";
      if (variableItem.type === "code") {
        if (variableItem.nodeId) {
          keyValue = `#${variableItem.nodeId}.${key}#`;
        } else {
          keyValue = `#${key}#`; // 没有 nodeId 就退化成普通 key
        }
      } else {
        keyValue = `#${key}#`;
      }

      if (typeof fieldSet[key] === "object" && !Array.isArray(fieldSet[key])) {
        // JSON 编辑器返回对象
        inputs[keyValue] = [fieldSet[key]];
      } else {
        inputs[keyValue] = fieldSet[key];
      }
    }

    // console.log(inputs, "inputs");

    setLoading(true);
    props.runSingeNodeEvent(inputs);
  };

  const clearFormEvent = () => {
    formRef.current.resetFields();
  };

  //上下文JSON改变事件
  const onChangeContextJSON = (value) => {
    // console.log(value,'value');

    formRef.current.setFieldsValue({
      context: value,
    });
    // setContextJSON(value);
    jsonEditorRef.current.setContent(value);
  };

  const onJSONError = (error) => {
    if (error) {
      message.error("json格式错误");
    }
    setJsonError(error);
  };

  const jsonChangeEvent = (value, key) => {
    formRef.current.setFieldsValue({
      [key]: value,
    });
  };

  //全屏切换
  const handleFullscreen = (data, title, key) => {
    props.handleFullscreen(data, title, key);
  };

  return (
    <div className={styles["test_input"]}>
      <Spin spinning={loading}>
        <Form
          layout={"vertical"}
          ref={formRef}
          // initialValues={{
          //   context: contextJSON,
          // }}
        >
          {variables &&
            variables.map((item, index) => (
              <div key={index}>
                {item.type === "text-input" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请输入" + item.label }]}
                  >
                    <Input variant='filled' placeholder='请输入' />
                  </Form.Item>
                )}
                {item.type === "paragraph" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请输入" + item.label }]}
                  >
                    <TextArea
                      variant='filled'
                      autoSize={{ minRows: 2, maxRows: 11 }}
                      showCount
                      placeholder='请输入'
                    />
                  </Form.Item>
                )}
                {item.type === "number" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请输入" + item.label }]}
                  >
                    <InputNumber variant='filled' style={{ width: "100%" }} placeholder='请输入' />
                  </Form.Item>
                )}
                {item.type === "select" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请选择" + item.label }]}
                  >
                    <Select
                      variant='filled'
                      options={item.options.map((option) => ({ value: option, label: option }))}
                      placeholder='请选择'
                    />
                  </Form.Item>
                )}
                {item.type === "file" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label=''
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请上传" + item.label }]}
                  >
                    <SingleFile
                      fileLoadingChange={(loading) => {
                        setFileLoading(loading);
                      }}
                      key={item.variable}
                      item={item}
                      fileChange={(file) => {
                        formRef.current.setFieldsValue({
                          [item.variableQuery]: file[0],
                        });
                      }}
                    />
                  </Form.Item>
                )}
                {item.type === "file-list" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label=''
                    name={item.variableQuery}
                    rules={[{ required: true, message: "请上传" + item.label, type: "array" }]}
                  >
                    <SingleFile
                      fileLoadingChange={(loading) => {
                        setFileLoading(loading);
                      }}
                      item={{ ...item, max_length: 5 }}
                      fileChange={(file) => {
                        formRef.current.setFieldsValue({
                          [item.variableQuery]: file,
                        });
                      }}
                    />
                  </Form.Item>
                )}
                {item.type === "code" && (
                  <Form.Item label={item.label} name={item.variableQuery}>
                    <JsonEditor
                      onError={(error) => onJSONError(error, item.variableQuery)}
                      onChange={(value) => jsonChangeEvent(value, item.variableQuery)}
                      handleFullscreen={(data, title) =>
                        handleFullscreen(data, title, item.variableQuery)
                      }
                      title='JSON'
                      content={formRef.current?.getFieldValue(item.variableQuery) || {}}
                      ref={jsonEditorRef}
                    />
                  </Form.Item>
                )}
              </div>
            ))}
          {/* {props.isContext && (
          <Form.Item
            label='上下文'
            name='context'
          >
         <JsonEditor onError={onJSONError} onChange={jsonChangeEvent} handleFullscreen={handleFullscreen} isFullscreen={props.isFullscreen} title='JSON' content={contextJSON} ref={jsonEditorRef}></JsonEditor>
          </Form.Item>
        )} */}
        </Form>
      </Spin>
      <div className={styles["test_input_btns"]}>
        <Button
          disabled={fileLoading || jsonError}
          loading={loading}
          onClick={runClickEvent}
          type='primary'
          className={styles["test_input_btn"]}
        >
          {props.isRun ? "运行中" : "开始运行"}
        </Button>
      </div>
    </div>
  );
});

export default TestInput;
