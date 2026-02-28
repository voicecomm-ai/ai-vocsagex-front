"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Button,
  Spin,
  Form,
  InputNumber,
  Select,
  Input,
  Tree,
  ConfigProvider,
} from "antd";
import { message } from "antd";
import styles from "./input.module.css";
const { TextArea } = Input;
import { useStoreApi, useReactFlow } from "@xyflow/react";
import SingleFile from "../SingleFile";
import { debounce } from "lodash";
import { useStore } from "@/store/index";
import RunJson from "../../run-json";

const TestInput = forwardRef((props, ref) => {
  const reactFlowInstance = useReactFlow();
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const jsonEditorRef = useRef(null);
  const { setPanelVisible, setPannerNode, runVisible } = useStore(
    (state) => state
  );
  const formRef = useRef(null);
  const [jsonError, setJsonError] = useState(false);
  const [contextJSON, setContextJSON] = useState({});
  const [initialValues, setInitialValues] = useState({});
  useImperativeHandle(ref, () => ({
    closeLoading,
    clearFormEvent,
    initFun,
    onJSONError,
  }));

  useEffect(() => {
    if (props.variables && props.variables.length > 0) {
      setVariables(props.variables);
      props.variables.forEach((item) => {
        if (item.varType === "object" || item.varType === "array") {
          formRef.current.setFieldsValue({
            [item.variableQuery]: item.varType=='object'?{}:[],
          });
        }
      });
    }
  }, [props.variables,formRef]);

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
      let keyValue = "#" + key + "#";
      if (fieldSet[key] && (Array.isArray(fieldSet[key]) ? fieldSet[key].length > 0 : true)) {
        inputs[keyValue] = fieldSet[key]
      }
    }

    setLoading(true);
    props.runSingeNodeEvent(inputs);
  };
  const clearFormEvent = () => {
    formRef.current.resetFields();
  };

  const jsonChangeEvent = (item, value) => {
    formRef.current.setFieldsValue({
      [item.variableQuery]: value,
    });
  };
  const onJSONError = (error) => {
    setJsonError(error);
  };
  //全屏切换
  const handleFullscreen = (data, title) => {
    props.handleFullscreen(data, title);
  };
  return (
    <div className={styles["test_input"]}>

      <Spin spinning={loading}>
        <Form layout={"vertical"} ref={formRef} initialValues={initialValues}>
          {variables &&
            variables.map((item, index) => (
              <div key={index}>
                {item.type === "text-input" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请输入" + item.label,
                      },
                    ]}
                  >
                    <Input
                      variant="filled"
                      placeholder="请输入"
                      maxLength={item.max_length}
                       className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === "paragraph" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请输入" + item.label,
                      },
                    ]}
                  >
                    <TextArea
                      variant="filled"
                      autoSize={{ minRows: 2, maxRows: 11 }}
                      showCount
                      placeholder="请输入"
                      maxLength={item.max_length}
                       className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === "number" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请输入" + item.label,
                      },
                    ]}
                  >
                    <InputNumber
                      variant="filled"
                      style={{ width: "100%" }}
                      placeholder="请输入"
                       className='run_input_input'
                    />
                  </Form.Item>
                )}
                {item.type === "select" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请选择" + item.label,
                      },
                    ]}
                  >
                    <Select
                
                      options={item.options.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      placeholder="请选择"
                      style={{ height : '36px' }}
                      classNames={{ root: styles['run_input_select'] }}
                      variant='borderless'
                    />
                  </Form.Item>
                )}
                {item.type === "file" && (
                  // 数字类型通常用数字输入框，而不是选择框，这里修改为 Input.Number
                  <Form.Item
                    label=""
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请上传" + item.label,
                      },
                    ]}
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
                    label=""
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请上传" + item.label,
                        type: "array",
                      },
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

                {item.type === "json" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                
                      {
                        validator: (_, value) => {
                          console.log(value, "value");
                    
                          // 非必填且空值：直接通过
                          if (!item.required && (value === null || value === undefined || value === "")) {
                            return Promise.resolve();
                          }
                    
                          // 必填但值为空
                          if (item.required && (value === null || value === undefined || value === "")) {
                            return Promise.reject(new Error("请输入"));
                          }
                    
                          // 类型校验：object
                          if (item.varType === "object") {
                    
                            // 必须是对象且不能是数组
                            if (typeof value !== "object" || Array.isArray(value)) {
                              return Promise.reject(new Error("请输入有效的 JSON 对象"));
                            }
                    
                            return Promise.resolve();
                          }
                    
                          // 类型校验：array
                          if (item.varType === "array") {
                    
                            if (!Array.isArray(value)) {
                              return Promise.reject(new Error("请输入有效的 JSON 数组"));
                            }
                    
                            return Promise.resolve();
                          }
                    
                          // 其他类型不校验
                          return Promise.resolve();
                        },
                      },
                    ]}
                    
                  >
                    <RunJson
                      varType={item.varType}
                      onError={onJSONError}
                      onChange={(value) => jsonChangeEvent(item, value)}
                      handleFullscreen={handleFullscreen}
                      isFullscreen={props.isFullscreen}
                      title="JSON"
                      content={formRef.current?.getFieldValue(
                        item.variableQuery
                      )}
                      ref={jsonEditorRef}
                    ></RunJson>
                  </Form.Item>
                )}
              </div>
            ))}
        </Form>
      </Spin>
      <div className={styles["test_input_btns"]}>
      <Button
          disabled={fileLoading}
          loading={loading}
          onClick={runClickEvent}
          type='primary'
          className={styles['test_input_btn']}
        >
             {loading ?"": <img className={styles["test_input_btn_img"]} src="/find/find_run.png" alt="运行" />}
             {loading ? "运行中..." : "运行"}
    
        </Button>
      </div>
    </div>
  );
});

export default TestInput;
