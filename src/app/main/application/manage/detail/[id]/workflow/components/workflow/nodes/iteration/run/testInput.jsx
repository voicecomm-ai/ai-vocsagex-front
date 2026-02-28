"use client";

/**
 * 测试输入组件
 * 用于迭代节点的运行测试，支持多种输入类型（文本、数字、选择、文件、JSON等）
 * 通过 forwardRef 暴露方法供父组件调用
 */
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Button, Spin, Form, InputNumber, Select, Input } from "antd";
import styles from "../../../../test/input/input.module.css";
const { TextArea } = Input;
import SingleFile from "../../../../test/SingleFile";
import RunJson from "../../../../run-json/index";
import runStyle from "./run.module.css";
import { getUuid } from "@/utils/utils";
import ArgInput from "./argInput";
import { useNodeData } from "../../../hooks/useNodeData";
import { useReactFlow } from "@xyflow/react";
const TestInput = forwardRef((props, ref) => {
  const { getNodeById } = useNodeData();
  const reactFlowInstance = useReactFlow();
  // ==================== 状态管理 ====================
  /** 变量列表，包含所有需要输入的字段配置 */
  const [variables, setVariables] = useState([]);
  /** 运行加载状态 */
  const [loading, setLoading] = useState(false);
  /** 文件上传加载状态 */
  const [fileLoading, setFileLoading] = useState(false);
  /** JSON 编辑器引用 */
  const jsonEditorRef = useRef(null);
  /** 表单引用 */
  const formRef = useRef(null);
  /** JSON 格式错误状态 */
  const [jsonError, setJsonError] = useState(false);
  /** 表单初始值 */
  const [initialValues, setInitialValues] = useState({});
  /** 其他输入内容列表（动态添加的输入项） */
  const [argList, setArgList] = useState([]);
  const [argFullscreen, setArgFullscreen] = useState(false);
  const [argFullscreenItem, setArgFullscreenItem] = useState(null);
  const [argFullscreenIndex, setArgFullscreenIndex] = useState(null);
  

  // ==================== 暴露给父组件的方法 ====================
  useImperativeHandle(ref, () => ({
    closeLoading, // 关闭加载状态
    clearFormEvent, // 清空表单
    initFun, // 初始化函数
      onJSONError, // JSON 错误处理
  }));

  // ==================== 副作用处理 ====================
  /**
   * 监听变量变化，初始化表单字段
   * 对于 object 和 array 类型，设置默认值
   */
  useEffect(() => {
    let isFileUpload = props.nodeData.iterator_input_type=='array[file]'?true:false;
    console.log(props.nodeData,'1111');
    if (props.variables && props.variables.length > 0) {
      setVariables(props.variables);
      props.variables.forEach((item) => {
        if (item.varType === "object" || item.varType === "array") {
          formRef.current?.setFieldsValue({
            [item.variableQuery]: item.varType === "object" ? {} : [],
          });
        }
      });
    }
    if(!isFileUpload && argList.length === 0 && props.nodeData.id){
      handleAddArgEvent();
    }
  }, [props.variables,props.nodeData]);

  /**
   * 监听运行状态变化，更新加载状态
   */
  useEffect(() => {
    if (props.isRun) {
      setLoading(props.isRun);
    }
  }, [props.isRun]);

  // ==================== 内部方法 ====================
  /**
   * 关闭加载状态
   */
  const closeLoading = () => {
    setLoading(false);
  };

  /**
   * 初始化函数
   * 重置所有加载状态
   */
  const initFun = () => {
    setLoading(false);
    setFileLoading(false);
  };

  /**
   * 运行按钮点击事件
   * 1. 验证表单字段
   * 2. 获取表单所有字段值
   * 3. 将字段名包装为 #字段名# 格式
   * 4. 调用父组件的运行方法
   */

  //获取当前节点下的llm节点
  const getLlmNodeEvent = () => {
    let nodes = reactFlowInstance.getNodes();
    let llmNodeArray = nodes.filter(
      (node) => node.type === "llm" && node.parentId === props.nodeId
    );
    let llmNodeVariables = [];
    llmNodeArray.forEach((node) => {
      let nodeData = getNodeById(node.id);
      let context = nodeData.data.context;
      let variable_selector = context.variable_selector;
      if (variable_selector && variable_selector.length > 0) {
        llmNodeVariables.push(variable_selector.join("."));
      }
    });
    return llmNodeVariables;
  };

  const runClickEvent = async () => {
    // 验证表单字段
    await formRef.current.validateFields();
    // 获取所有字段值（包括未触发的字段）
    const fieldSet = await formRef.current.getFieldsValue(true);
    let input_selector = [];
    let input_key = [];
    argList.forEach((item) => {
      if (item.value.trim()) {
        input_selector.push(item.value);
        input_key.push(item.variableQuery);
      }
    });
    // 将字段名包装为 #字段名# 格式
    const inputs = {};
    let llmNodeVariables = getLlmNodeEvent();
    for (const key in fieldSet) {
      if(!input_key.includes(key)){
      let keyValue = "#" + key + "#";
       inputs[keyValue] = fieldSet[key];
      if (llmNodeVariables.includes(key)) {//处理上下文传参
        let contextValue = "#context#";
        inputs[contextValue] = fieldSet[key];
      }
    }
    }
    if (input_selector.length > 0) {
      let iterator_selector = props.nodeData.iterator_selector;
      let key = iterator_selector.join(".");
      let keyValue = "#" + key + "#";
      inputs[keyValue] = input_selector;
    }
    setLoading(true);
    props.runSingeNodeEvent(inputs);
  };

  /**
   * 清空表单事件
   */
  const clearFormEvent = () => {
    formRef.current?.resetFields();
  };

  /**
   * JSON 值变化事件
   * @param {Object} item - 变量配置项
   * @param {*} value - 新的 JSON 值
   */
  const jsonChangeEvent = (item, value) => {
    formRef.current?.setFieldsValue({
      [item.variableQuery]: value,
    });
  };

  /**
   * JSON 错误处理
   * @param {boolean} error - 是否有错误
   */
  const onJSONError = (error) => {
    setJsonError(error);
  };

  /**
   * 全屏切换处理
   * @param {*} data - 全屏数据
   * @param {string} title - 标题
   */
  const handleFullscreen = (data, title) => {
    props.handleFullscreen(data, title);
  };

  /**
   * 处理添加输入事件
   * 添加一个新的动态输入项到列表
   */
  const handleAddArgEvent = () => {
    console.log(props.nodeData);
    setArgList([
      ...argList,
      {
        type: "text-input",
        variableQuery: props.nodeData.id + ".arg" + (argList.length + 1),
        id: getUuid(), // 唯一id
        value: "",
        required: true,
      },
    ]);
  };

  /**
   * 处理输入变化事件
   * @param {Object} item - 要更新的输入项
   * @param {*} value - 新的值
   */
  const handleArgChange = (item, value) => {
    if (argFullscreen) {
      setArgFullscreenItem({ ...argFullscreenItem, value: value });
    }
    setArgList(
      argList.map((argItem) =>
        argItem.id === item.id ? { ...argItem, value: value } : argItem
      )
    );
  };

  /**
   * 处理删除事件
   * @param {string} id - 要删除的输入项 id
   */
  const handleDeleteArgEvent = (id) => {
    setArgList(argList.filter((item) => item.id !== id));
  };

  //处理arg 全屏事件
  const handleArgFullscreen = (status, item, index) => {
    setArgFullscreen(status);
    setArgFullscreenItem(item);
    setArgFullscreenIndex(index);
  };
  // ==================== 渲染 ====================
  return (
    <div className={styles["test_input"]}>
      <Spin spinning={loading}>
        <Form layout={"vertical"} ref={formRef} initialValues={initialValues}>
          {/* 动态渲染变量输入字段 */}
          {variables &&
            variables.map((item, index) => (
              <div key={index}>
                {/* 文本输入框 */}
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
                      className="run_input_input"
                    />
                  </Form.Item>
                )}

                {/* 段落输入框（多行文本） */}
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
                      className="run_input_input"
                    />
                  </Form.Item>
                )}

                {/* 数字输入框 */}
                {item.type === "number" && (
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
                      className="run_input_input"
                    />
                  </Form.Item>
                )}

                {/* 选择框 */}
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
                      style={{ height: "36px" }}
                      classNames={{ root: styles["run_input_select"] }}
                      variant="borderless"
                    />
                  </Form.Item>
                )}

                {/* 单文件上传 */}
                {item.type === "file" && (
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
                        formRef.current?.setFieldsValue({
                          [item.variableQuery]: file[0],
                        });
                      }}
                    />
                  </Form.Item>
                )}

                {/* 多文件上传 */}
                {item.type === "file-list" && (
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
                        formRef.current?.setFieldsValue({
                          [item.variableQuery]: file,
                        });
                      }}
                    />
                  </Form.Item>
                )}

                {/* JSON 编辑器 */}
                {item.type === "json" && (
                  <Form.Item
                    label={item.label}
                    name={item.variableQuery}
                    rules={[
                      {
                        validator: (_, value) => {
                          // 非必填且空值：直接通过
                          if (
                            !item.required &&
                            (value === null ||
                              value === undefined ||
                              value === "")
                          ) {
                            return Promise.resolve();
                          }

                          // 必填但值为空
                          if (
                            item.required &&
                            (value === null ||
                              value === undefined ||
                              value === "")
                          ) {
                            return Promise.reject(new Error("请输入"));
                          }

                          // 类型校验：object
                          if (item.varType === "object") {
                            // 必须是对象且不能是数组
                            if (
                              typeof value !== "object" ||
                              Array.isArray(value)
                            ) {
                              return Promise.reject(
                                new Error("请输入有效的 JSON 对象")
                              );
                            }

                            return Promise.resolve();
                          }

                          // 类型校验：array
                          if (item.varType === "array") {
                            if (!Array.isArray(value)) {
                              return Promise.reject(
                                new Error("请输入有效的 JSON 数组")
                              );
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

          {/* 动态输入列表区域 */}
          {!props.isFile && (
          <div className={runStyle["arg_list"]}>
            {/* 列表头部：标题和添加按钮 */}
            <div className={runStyle["arg_list_header"]}>
              <div className={runStyle["arg_list_header_title"]}>
              <span className="span_required">*</span>输入
              
              </div>
              <div
                className={runStyle["arg_list_header_add"]}
                onClick={handleAddArgEvent}
              >
                <img
                  alt=""
                  src="/workflow/add.png"
                  className={runStyle["arg_list_header_img"]}
                />
                添加
              </div>
            </div>
            {/* 列表内容：动态输入项 */}
            <div className={runStyle["arg_list_content"]}>
              {argList.map((item, index) => (
                <div
                  key={item.id}
                  className={runStyle["arg_list_content_item"]}
                >
                    <Form.Item
               
                    name={item.variableQuery}
                    rules={[
                      {
                        required: item.required,
                        message: "请输入" ,
                      },
                    ]}
                  >
                  <ArgInput
                    labelLength={argList.length}
                    index={index}
                    label={"内容" + (index + 1)}
                    item={item}
                    value={item.value}
                    argFullscreen={argFullscreen}
                    onFullscreen={handleArgFullscreen}
                    onChange={(value) => handleArgChange(item, value)}
                    onDelete={(id) => handleDeleteArgEvent(id)}
                  />
                  </Form.Item>
                </div>
              ))}
            </div>
          </div>
          )}
        </Form>
      </Spin>

      {/* 操作按钮区域 */}
      <div className={styles["test_input_btns"]}>
        <Button
          disabled={fileLoading || jsonError}
          loading={loading}
          onClick={runClickEvent}
          type="primary"
          className={styles["test_input_btn"]}
        >
          {fileLoading || loading ?"": <img className={styles["test_input_btn_img"]} src="/find/find_run.png" alt="运行" />}
             {loading ? "运行中..." : "运行"}
        </Button>
      </div>

      {argFullscreen && (
        <div className={runStyle["arg_fullscreen"]}>
          <ArgInput
            labelLength={argList.length}
            index={argFullscreenIndex}
            label={"内容" + (argFullscreenIndex + 1)}
            item={argFullscreenItem}
            argFullscreen={argFullscreen}
            value={argFullscreenItem.value}
            onFullscreen={handleArgFullscreen}
            onChange={(value) => handleArgChange(argFullscreenItem, value)}
            onDelete={(id) => handleDeleteArgEvent(id)}
          />
        </div>
      )}
    </div>
  );
});

export default TestInput;
