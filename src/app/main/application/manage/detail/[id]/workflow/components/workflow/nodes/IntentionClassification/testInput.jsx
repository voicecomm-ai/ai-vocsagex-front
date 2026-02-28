"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Button, Spin, Form, InputNumber, Select, Input, Tree, ConfigProvider } from "antd";
import { message } from "antd";
import styles from "./run.module.css";
const { TextArea } = Input;
import { useStoreApi, useReactFlow } from "@xyflow/react";
import SingleFile from "../../../test/SingleFile";
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
  const [contextJSON, setContextJSON] = useState({
    content: "",
    title: "",
    url: "",
    icon: "",
    metadata: {
      dataset_id: "",
      dataset_name: "",
      document_id: [],
      document_name: "",
      document_data_source_type: "",
      segment_id: "",
      segment_position: "",
      segment_word_count: "",
      segment_hit_count: "",
      segment_index_node_hash: "",
      score: "",
    },
  });
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
      // console.log(props.variables, "props.variables");

      setVariables(props.variables);
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

  for (const key in fieldSet) {
    console.log(key, "key");
    let keyValue = "";
    if (key === "query") {
      keyValue = key;
    } else {
      keyValue = "#" + key + "#";
    }

    if (key === "context" && props.isContext) {
      inputs[keyValue] = [fieldSet[key]];
    } else {
      inputs[keyValue] = fieldSet[key];
    }
  }

  // ✅ 额外处理：隐藏变量同步 query 的值
  (props.variables || []).forEach((v) => {
    if (v.hidden && v.variableQuery !== "query") {
      const queryVal = fieldSet["query"];
      if (queryVal !== undefined) {
        let hiddenKey = "#" + v.variableQuery + "#";
        inputs[hiddenKey] = queryVal;
      }
    }
  });

  setLoading(true);
  props.runSingeNodeEvent(inputs);
};

  const clearFormEvent = () => {
    formRef.current.resetFields();
  };

  //上下文JSON改变事件
  const onChangeContextJSON = (value) => {
    formRef.current.setFieldsValue({
      context: value,
    });
    setContextJSON(value);
    jsonEditorRef.current.setContent(value);
  };
  const jsonChangeEvent = (value) => {
    formRef.current.setFieldsValue({
      context: value,
    });
  };
  const onJSONError = (error) => {
    if (error) {
      message.error("上下文格式错误");
    }
    setJsonError(error);
  };
  //全屏切换
  const handleFullscreen = (data, title) => {
    props.handleFullscreen(data, title);
  };
  return (
    <div className={styles["test_input"]}>
      <Spin spinning={loading}>
        <Form layout={"vertical"} ref={formRef}>
          {variables &&
            variables.map((item, index) => (
            !item.hidden&&(  <div key={index}>
                {item.type === "text-input" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: item.required, message: "请输入" + item.label }]}
                  >
                    <Input variant='filled' placeholder='请输入' maxLength={item.max_length} />
                  </Form.Item>
                )}
                {item.type === "paragraph" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      { required: item.required, message: "请输入" + item.label },
                     
                    ]}
                  >
                    <TextArea
                      variant='filled'
                      autoSize={{ minRows: 2, maxRows: 11 }}
                      showCount
                      placeholder='请输入'
                      maxLength={item.max_length}
                    />
                  </Form.Item>
                )}
                {item.type === "number" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: item.required, message: "请输入" + item.label }]}
                  >
                    <InputNumber variant='filled' style={{ width: "100%" }} placeholder='请输入' />
                  </Form.Item>
                )}
                {item.type === "select" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[{ required: item.required, message: "请选择" + item.label }]}
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
                    rules={[{ required: item.required, message: "请上传" + item.label }]}
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
                    rules={[
                      { required: item.required, message: "请上传" + item.label, type: "array" },
                    ]}
                  >
                    <SingleFile
                      fileLoadingChange={(loading) => {
                        setFileLoading(loading);
                      }}
                      item={item}
                      fileChange={(file) => {
                        formRef.current.setFieldsValue({
                          [item.variableQuery]: file,
                        });
                      }}
                    />
                  </Form.Item>
                )}
              </div>)
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
