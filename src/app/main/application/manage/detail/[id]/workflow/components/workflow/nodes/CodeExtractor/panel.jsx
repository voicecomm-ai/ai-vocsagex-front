/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Divider,
  Form,
  Select,
  Input,
  Typography,
  message,
} from "antd";
import codeStyles from "./runCode.module.css";
import VariableCascader from "../../../variableCascader";
import { getUuid } from "@/utils/utils";
import { useNodesInteractions, useNodeData } from "../../hooks";
import { useStore } from "@/store/index";
import CodeEditor from "../../../code-editor/index";
import RunHeader from "../../components/RunHeader";

/**
 * 代码提取器节点面板组件
 * 用于配置代码节点的输入变量、代码内容和输出变量
 */
const RunCodePanel = forwardRef((props, ref) => {
  // ==================== Store 状态管理 ====================
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
    setChangeId,
  } = useStore((state) => state);

  // ==================== Hooks ====================
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const { updateNodeDetail } = useNodesInteractions();

  // ==================== Refs ====================
  /** 用于保存输入变量表单的 add 函数 */
  const addVariableRef = useRef(null);
  /** 用于保存输出变量表单的 add 函数 */
  const addOutputVariableRef = useRef(null);

  // ==================== Form 实例 ====================
  const [form] = Form.useForm();

  // ==================== State 状态 ====================
  /** 变量选择器的 key，用于强制重新渲染 */
  const [variableId, setVariableId] = useState(null);
  /** 节点数据 */
  const [data, setData] = useState({});
  /** 输入变量列表映射 */
  const [inputItemMap, setInputItemMap] = useState([]);
  /** 输出变量列表映射 */
  const [outputItemMap, setOutputItemMap] = useState([]);
  /** 是否全屏显示代码编辑器 */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** 是否显示下拉菜单 */
  const [showDropdown, setShowDropdown] = useState(false);
  /** 是否已点击运行按钮 */
  const [hasClickedRun, setHasClickedRun] = useState(false);
  /** 全屏时的数据 */
  const [fullscreenData, setFullscreenData] = useState({});
  /** 全屏时的标题 */
  const [fullscreenTitle, setFullscreenTitle] = useState("");
  /** 代码语言类型 */
  const [codeLanguage, setCodeLanguage] = useState("python3");
  /** 节点标题编辑状态 */
  const [isEditing, setIsEditing] = useState(false);
  /** 代码内容 */
  const [codeContent, setCodeContent] = useState("");
  /** 当前鼠标悬停的项 ID */
  const [hoveredId, setHoveredId] = useState(null);
  /** 上游变量列表 */
  const [variableList, setVariableList] = useState([{ title: "" }]);
  /** 节点标题 */
  const [title, setTitle] = useState("");
  // ==================== 常量定义 ====================
  /** 输出变量类型选项列表 */
  const outputVarsList = [
    { label: "String", value: "string" },
    { label: "Number", value: "number" },
    { label: "Array[Number]", value: "array[number]" },
    { label: "Array[String]", value: "array[string]" },
    { label: "Array[Object]", value: "array[object]" },
    { label: "Object", value: "object" },
  ];

  // ==================== 暴露给父组件的方法 ====================
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  // ==================== Effects ====================
  /**
   * 面板显示时初始化节点数据
   * 当面板可见且节点存在时，加载节点的所有配置数据
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      let nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      // console.log(nodeData.data,'nodeData.data');

      // 初始化输入变量
      if (nodeData.data?.codeInputs?.length) {
        nodeData.data.codeInputs.forEach((inp) => {
          inp.isValid = false;
        });
        setInputItemMap(nodeData.data.codeInputs);
      }
      if (nodeData.data?.runInputs?.length) {
        form.setFieldValue("inputVariables", nodeData.data.runInputs);
      }
      if (nodeData.data?.codeOutputs) {
        form.setFieldValue("outputVariables", nodeData.data.codeOutputs);
        setOutputItemMap(nodeData.data.codeOutputs);
      }
      if (nodeData.data?.code) {
        setCodeContent(nodeData.data.code);
      }
      if (nodeData.data?.code_language) {
        setCodeLanguage(nodeData.data?.code_language);
      }
      if (nodeData.data?.code) {
        setCodeContent(nodeData.data?.code);
      }

      getSelectOptions(nodeData.data);
      setTitle(nodeData.data.title);
    }
    // getSystemVariablesEvent()
  }, [panelVisible]);

  /**
   * 当节点数据变更时，重新获取变量选项
   * changeId 变化时触发，用于同步最新的上游变量
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      const nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      getSelectOptions(nodeData.data);
    }
  }, [changeId]);

  /**
   * 关闭弹窗事件
   * 注意：此函数目前未使用，保留用于兼容性
   */
  const hideModal = () => {
    // 预留接口，暂无实际功能
  };

  /**
   * 获取上游变量的下拉选项值
   * 为变量树结构添加唯一 ID，并设置类型信息
   * @param {Object} data - 节点数据
   */
  const getSelectOptions = (data) => {
    // 更新变量选择器的 key，用于强制重新渲染
    setVariableId(getUuid());
    
    // 获取上游变量列表
    const arr = getUpstreamVariables(pannerNode.id);

    // 为变量树结构添加唯一 ID 和类型信息
    arr.forEach((first, index) => {
      first.id = `first-${index}`;
      if (first?.children?.length) {
        first.children.forEach((second, idx) => {
          second.id = `second-${idx}`;
          if (second?.children?.length) {
            second.children.forEach((third, i) => {
              third.id = `third-${i}`;
              // 根据变量类型设置输入类型
              third.type = third.variable_type === "string" ? "text-input" : "number";
            });
          }
        });
      }
    });

    setVariableList(arr);
  };

  /**
   * 关闭面板事件
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  /**
   * 更新节点详情事件
   * @param {Object} data - 要更新的节点数据
   */
  const updateNodeDetailEvent = (data) => {

    const newData = {
      nodeId: props.nodeData.id,
      data: { ...data, id: props.nodeData.id },
    };
    console.log(newData,'newData')
    setData(newData.data);
    updateNodeDetail(newData);
    // 更新 changeId 以触发其他组件的重新渲染
    setChangeId(getUuid());
  };


  /**
   * 更新节点变量数据
   * 将表单中的输入输出变量数据同步到节点数据中
   */
  const updateVariableEvent = () => {
    const inputVariables = form.getFieldValue("inputVariables") || [];
    const outputVariables = form.getFieldValue("outputVariables") || [];

    // 处理输入变量数组
    const variableArr = inputVariables.map((item) => ({
      variable: item.variable,
      value_type: item?.infos ? item?.infos[0]?.variable_type : null,
      value_selector: item.value_selector,
    }));

    // 处理输出变量对象
    const outputsObj = {};
    outputVariables.forEach((item) => {
      outputsObj[item.variable] = {
        type: item.value_selector,
        children: null,
      };
    });

    // 构建运行时的输入变量数组（包含 infos 信息）
    const variablesArr = inputVariables.map((item) => ({
      variable: item.variable,
      value_type: item?.infos ? item?.infos[0]?.variable_type : null,
      value_selector: item.value_selector,
      infos: item.infos,
    }));
    let nodeData = getNodeById(pannerNode.data.id);
    let newData =nodeData.data;
    // 更新节点数据
    const obj = {
      ...newData,
      variables: variableArr,
      outputs: outputsObj,
      code: codeContent,
      code_language: codeLanguage,
      codeInputs: inputVariables,
      codeOutputs: outputVariables,
      runInputs: variablesArr,
    };

    setData(obj);
    updateNodeDetailEvent(obj);
  };

  /**
   * 删除变量项
   * @param {number} index - 要删除的变量索引
   * @param {string} type - 变量类型：'input' 或 'output'
   */
  const removeRenderDataRef = (index, type) => {
    let formArr = [];
    if (type === "input") {
      formArr = form.getFieldValue("inputVariables").filter((item, i) => index !== i);
      form.setFieldValue("inputVariables", formArr);
    } else {
      formArr = form.getFieldValue("outputVariables").filter((item, i) => index !== i);
      form.setFieldValue("outputVariables", formArr);
    }
    updateVariableEvent();
  };

  /**
   * 运行面板事件
   * 验证输入输出变量后，打开运行面板
   */
  const runPanelEvent = async () => {
    setHasClickedRun(true);
    let nodeData = getNodeById(pannerNode.data.id);
    let newData =nodeData.data;
    console.log(newData,'newData')
    const inputs = newData.codeInputs;
    const outputs = newData.codeOutputs;
    // 验证输出变量
    if (!outputs || !outputs.length) {
      message.warning("请选择输出");
      return;
    }

    // 检查输出对象是否有效
    if (data.outputs) {
      const outputKeys = Object.keys(data.outputs);
      if (!outputKeys.length || outputKeys.some((key) => key === "")) {
        message.warning("请选择输出");
        return;
      }
    }

    // 验证表单字段
    await form.validateFields();

    // 如果没有输入变量，直接运行
    if (!inputs || !inputs.length) {
      setPannerNode(props.nodeData);
      setPanelVisible(false);
      setRunVisible(true);
      return;
    }

    // 验证输入变量是否都已填写
    const inputEmpty = inputs.find(
      (item) => !item.variable || !item.value_selector?.length
    );

    if (inputEmpty) {
      message.warning("请选择输入变量！");
      return;
    }

    // 所有验证通过，打开运行面板
    setPannerNode(props.nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  /**
   * 打开列表事件
   * @param {Event} e - 事件对象
   */
  const handleOpenList = (e) => {
    e.stopPropagation();
    setShowDropdown(true);
  };

  /**
   * 添加变量事件
   * @param {string} type - 变量类型：'input' 或 'output'
   */
  const addVariableEvent = (type) => {
    if (readOnly) return;

    if (type === "output") {
      // 添加输出变量
      if (addOutputVariableRef.current) {
        addOutputVariableRef.current({
          value_selector: null,
          variable: "",
        });
      }
      const arr = [
        ...outputItemMap,
        {
          value_selector: null,
          variable: "",
          isValid: false,
        },
      ];
      setOutputItemMap(arr);
      
      // 为表单中的输出变量添加 ID
      const formArr = form.getFieldValue("outputVariables") || [];
      formArr.forEach((item) => {
        if (!item.id) {
          item.id = getUuid();
        }
      });
      form.setFieldValue("outputVariables", formArr);
    } else {
      // 添加输入变量
      if (addVariableRef.current) {
        addVariableRef.current({
          value_selector: [],
          infos: [],
          variable: "",
        });
      }
    }
    updateVariableEvent();
  };

  /**
   * 表单值改变事件
   * @param {Object} changedValues - 改变的值
   * @param {Object} allValues - 所有表单值
   */
  const handleFormValuesChange = (changedValues, allValues) => {
    updateVariableEvent();
  };

  /**
   * 代码生成事件处理
   * @param {string} value - 生成的代码
   */
  const handleGeneratedCode = (value) => {
    // 预留接口，暂无实际功能
  };

  /**
   * 选择变量事件
   * @param {Object} value - 选中的变量对象
   * @param {number} formIndex - 表单索引
   */
  const selectItem = (value, formIndex) => {
    const arr = form.getFieldValue("inputVariables");
    
    if (value) {
      // 文件类型变量不允许选择
      if (value.variable_type === "file") return;

      // 根据变量类型确定输入类型
      let inputValue = "";
      if (value.nodeType === "start") {
        inputValue = value.type;
      } else {
        switch (value.variable_type) {
          case "number":
            inputValue = "number";
            break;
          case "string":
            inputValue = "text-input";
            break;
          case "array[file]":
            inputValue = "file-list";
            break;
          case "array[object]":
          case "object":
            inputValue = "code";
            break;
          default:
            break;
        }
      }

      // 更新变量信息
      arr[formIndex].infos = [
        {
          nodeId: value.nodeId,
          nodeName: value.nodeName,
          nodeType: value.nodeType,
          variable_name: value.variable_name,
          variable_type: value.variable_type,
          label: value.label,
          allowed_file_types: [],
          allowed_file_upload_methods: ["local_file", "remote_url"],
          type: inputValue,
          max_length: 5,
          required: true,
          options: value.options,
        },
      ];
      arr[formIndex].value_selector = value.value_selector;
    } else {
      // 清空选择
      arr[formIndex].value_selector = [];
      arr[formIndex].infos = [];
    }

    setInputItemMap(arr);
    form.setFieldValue("inputVariables", arr);
    form.validateFields([formIndex]);
    updateVariableEvent();

    // 重置下拉菜单状态
    setShowDropdown(false);
  };
  /**
   * 全屏切换事件
   * @param {Object} data - 全屏数据
   * @param {string} title - 全屏标题
   */
  const handleFullscreen = (data, title) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenTitle(title);
  };

  /**
   * 更新代码语言
   * @param {Object} value - 包含 code_language 和 codeContent 的对象
   */
  const updateCodeLanguage = (value) => {
    let nodeData = getNodeById(pannerNode.data.id);
    let newData =nodeData.data;
    const obj = {
      ...newData,
      code_language: value.code_language,
      code: value.codeContent,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  };

  /**
   * 代码内容改变事件
   * @param {string} value - 新的代码内容
   */
  const handleCodeChange = (value) => {
    let nodeData = getNodeById(pannerNode.data.id);
    let newData =nodeData.data;
    const obj = {
      ...newData,
      code: value,
    };

    setCodeContent(value);
    setData(obj);
    updateNodeDetailEvent(obj);
  };

  // const getVariableClass = (variables, index, type) => {
  //   // console.log(variables,inputItemMap,'variables');

  //   let className = "end_cascader_variable_item_empty";
  //   if (type === "input") {
  //     className =
  //       readOnly ? 'end_cascader_variable_item_ban' :
  //         variables.value_selector.length === 0
  //           ? inputItemMap.length
  //             ? inputItemMap[index].isValid
  //               ? "item_empty_form_required"
  //               : "end_cascader_variable_item_empty"
  //             : "end_cascader_variable_item_empty"
  //           : "end_cascader_variable_item";
  //   } else {
  //     className =
  //       variables.value_selector.length === 0
  //         ? outputItemMap.length
  //           ? outputItemMap[index].isValid
  //             ? "item_empty_form_required"
  //             : "end_cascader_variable_item_empty"
  //           : "end_cascader_variable_item_empty"
  //         : "end_cascader_variable_item";
  //   }
  //   return className;
  // };

  // const getInputVarValid = (index) => {
  //   const variables = inputItemMap[index] || null;
  //   return variables ? variables.value_selector.length === 0 && inputItemMap[index].isValid : false;
  // };
  // const getOutputVarValid = (index) => {
  //   const variables = outputItemMap[index];
  //   return variables
  //     ? variables.value_selector.length === 0 && outputItemMap[index].isValid
  //     : false;
  // };

  /**
   * 获取输入变量的值选择器
   * @param {number} index - 变量索引
   * @returns {Array} 值选择器数组
   */
  const getInputValue = (index) => {
    const item = form.getFieldValue(["inputVariables", index, "value_selector"]);
    return item;
  };

  /**
   * 标题获得焦点事件
   */
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  /**
   * 通过头部组件更新节点数据
   * @param {Object} obj - 节点数据对象
   */
  const updateNodeDataByHeader = (obj) => {
    const newData = {
      nodeId: props.nodeData.id,
      data: { ...obj, id: props.nodeData.id },
    };
    console.log(newData,'newData')
    setData(newData.data);
    updateNodeDetail(newData);
  };

  return (
    <div className={codeStyles["panel_main"]}>
     <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}  isPadding={true}   />

      <div className={codeStyles["code_variables_content"]}>
        <Form
          form={form}
          layout='vertical'
          onValuesChange={(changed, allValues) => handleFormValuesChange(changed, allValues)}
          disabled={readOnly}
        >
          <div className={codeStyles["start_panel_variable"]}>
            <div className={codeStyles["start_panel_variable_title"]}>用户输入</div>
              <div
                onClick={() => addVariableEvent("input")}
                className={readOnly ? `${codeStyles["start_panel_variable_add_ban"]}`:`${codeStyles["start_panel_variable_add"]}`}
              >
                <img
                  style={{ width: "12px", height: "12px" }}
                  src='/workflow/code_add.png'
                  alt=''
                />
                添加
              </div>
          </div>
          <Form.List name='inputVariables'>
            {(fields, { add, remove }) => {
              // 直接赋值，不调用 Hook
              addVariableRef.current = add;
              return (
                <>
                  {fields.map((item, index) => (
                    <div key={`input-${item.key}`} style={{ display: "flex", gap: "3px" }}>
                      <Form.Item
                        className={codeStyles["code_form_item"]}
                        style={{ marginBottom: "8px !important", flex: 1 }}
                        {...item}
                        name={[item.name, "variable"]}
                        rules={[
                          // {
                          //   required: true,
                          //   message: "请输入变量名",
                          //   trigger: "change",
                          // },
                          {
                            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                            message: "变量名只能包含字母、数字和下划线，且不能以数字开头",
                          },
                          {
                            validator: (_, value, callback) => {
                              // console.log(inputItemMap.length, value);

                              const variables = form.getFieldValue("inputVariables") || [];

                              // 获取当前 index
                              const currentIndex = item.name;

                              // 检查是否存在相同变量名（忽略当前项）
                              const duplicate = variables.some((item, idx) => {
                                return idx !== currentIndex && item.variable === value;
                              });

                              let isRequired = false
                              if (inputItemMap.length === 0) {
                                isRequired = false
                              } else {
                                isRequired = value === ''
                              }

                              return !isRequired
                                ? duplicate
                                  ? Promise.reject("变量名已存在")
                                  : Promise.resolve()
                                : Promise.reject("请输入变量名");
                            },
                          },
                        ]}
                      >
                        <Input  variant="borderless" className="workflow_input_input"  maxLength={20} placeholder='变量名' />
                      </Form.Item>

                      <Form.Item
                        {...item}
                        key={`input-${item.key}_${item.name}`}
                        className={codeStyles["code_form_item"]}
                        name={[item.name, "value_selector"]}
                        style={{ width: 262, marginBottom: "8px !important" }}
                        rules={[
                          {
                            validator: (_, value, callback) => {
                              // console.log(value)

                              if (!value) return Promise.resolve();

                              const variables = form.getFieldValue("inputVariables") || [];
                              // console.log(variables, 'variables')

                              return Promise.resolve();
                              // return duplicate ? Promise.reject('变量名已存在') : Promise.resolve()
                            },
                          },
                        ]}
                      >
                        <VariableCascader
                          onChange={(value) => selectItem(value, index)}
                          disabled={readOnly}
                          key={variableId}
                          value_selector={getInputValue(index)}
                          data={variableList}
                        />
                        {/* {true && renderCascaderDisplay(index, "input")} */}
                      </Form.Item>
                      {!readOnly && (
                        <div
                          className={codeStyles["variable_content_item_del"]}
                          onMouseEnter={() => setHoveredId(`input-${item.key}`)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          {hoveredId === `input-${item.key}` ? (
                            <img
                              style={{ width: "16px", height: "16px" }}
                              onClick={() => {
                                // 先删除 renderDataRef 中对应索引的数据
                                removeRenderDataRef(item.name, "input");
                                // 然后删除表单项
                                // console.log(item.name, fields, 'name')

                                // remove(item.name)
                              }}
                              alt=''
                              src='/workflow/del_hover.png'
                            />
                          ) : (
                            <img
                              style={{ width: "16px", height: "16px" }}
                              alt=''
                              src='/workflow/code_del.png'
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              );
            }}
          </Form.List>
          <Divider style={{ width: "100%", margin: "16px 0" }}></Divider>
          <CodeEditor
            isFullscreen={isFullscreen}
            title='数据处理'
            language={codeLanguage}
            handleFullscreen={handleFullscreen}
            onChange={handleCodeChange}
            content={codeContent}
            onGenerated={handleGeneratedCode}
            updateCodeLanguage={updateCodeLanguage}
          />
          {isFullscreen && (
            <div className={codeStyles.fullscreen_container}>
              <CodeEditor
                isFullscreen={isFullscreen}
                title='数据处理'
                handleFullscreen={handleFullscreen}
                onChange={handleCodeChange}
                content={codeContent}
                language={codeLanguage}
                onGenerated={handleGeneratedCode}
                updateCodeLanguage={updateCodeLanguage}
              />
            </div>
          )}
          <Divider style={{ width: "100%", margin: "16px 0" }}></Divider>
          <div className={codeStyles["start_panel_variable"]}>
            <div className={codeStyles["start_panel_variable_title"]}>
              <span className={codeStyles["start_panel_variable_title_requir"]}>*</span>输出
            </div>
            
              <div
                onClick={() => addVariableEvent("output")}
                className={readOnly ? `${codeStyles["start_panel_variable_add_ban"]}`:`${codeStyles["start_panel_variable_add"]}`}
              >
                <img
                  style={{ width: "12px", height: "12px" }}
                  src='/workflow/code_add.png'
                  alt=''
                />
                添加
              </div>
            
          </div>
          <Form.List name='outputVariables'>
            {(fields, { add, remove }) => {
              // 直接赋值，不调用 Hook
              addOutputVariableRef.current = add;
              return (
                <>
                  {fields.map((item, index) => (
                    <div key={`output-${item.key}`} style={{ display: "flex", gap: "3px" }}>
                      <Form.Item
                        className={codeStyles["code_form_item"]}
                        style={{ marginBottom: "8px !important", flex: 1 }}
                        {...item}
                        name={[item.name, "variable"]}
                        rules={[
                          {
                            required: true,
                            message: "请输入变量名",
                            trigger: "change",
                          },
                          {
                            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                            message: "变量名只能包含字母、数字和下划线，且不能以数字开头",
                          },
                          {
                            validator: (_, value, callback) => {
                              // console.log(value)

                              if (!value) return Promise.resolve();

                              const variables = form.getFieldValue("outputVariables") || [];

                              // 获取当前 index
                              const currentIndex = item.name;

                              // 检查是否存在相同变量名（忽略当前项）
                              const duplicate = variables.some((item, idx) => {
                                return idx !== currentIndex && item.variable === value;
                              });

                              return duplicate ? Promise.reject("变量名已存在") : Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input  variant="borderless" className="workflow_input_input"  maxLength={20} placeholder='变量名' />
                      </Form.Item>

                      <Form.Item
                        {...item}
                        rules={[
                          {
                            required: true,
                            message: "请选择变量类型",
                            trigger: "change",
                          },
                          // {
                          //   pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                          //   message: '变量名只能包含字母、数字和下划线，且不能以数字开头',
                          // },
                          // {
                          //   validator: (_, value, callback) => {
                          //     // console.log(value)

                          //     if (!value) return Promise.resolve()

                          //     const variables = form.getFieldValue('outputVariables') || []

                          //     // 获取当前 index
                          //     const currentIndex = item.name

                          //     // 检查是否存在相同变量名（忽略当前项）
                          //     const duplicate = variables.some((item, idx) => {
                          //       return idx !== currentIndex && item.variable === value
                          //     })

                          //     return duplicate ? Promise.reject('变量名已存在') : Promise.resolve()
                          //   },
                          // },
                        ]}
                        key={`value_selector_output${item.name}`}
                        className={codeStyles["code_form_item"]}
                        name={[item.name, "value_selector"]}
                        style={{ width: 260, marginBottom: "8px !important" }}
                      >
                        <Select style={{ height: '36px',background: '#F5F9FC' }} variant="borderless" classNames={{ root: 'workflow_input_select' }} options={outputVarsList} placeholder='请选择' />
                        {/* {variableList && renderCascaderDisplay(index, 'output')} */}
                      </Form.Item>
                      {!readOnly && (
                        <div
                          className={codeStyles["variable_content_item_del"]}
                          onMouseEnter={() => setHoveredId(`output-${item.key}`)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          {hoveredId === `output-${item.key}` ? (
                            <img
                              style={{ width: "16px", height: "16px" }}
                              onClick={() => {
                                // console.log(item.name)

                                // 先删除 renderDataRef 中对应索引的数据
                                removeRenderDataRef(item.name, "output");
                                // console.log(item.name, fields, 'output')
                                // 然后删除表单项
                                // remove(item.name)
                              }}
                              alt=''
                              src='/workflow/del_hover.png'
                            />
                          ) : (
                            <img
                              style={{ width: "16px", height: "16px" }}
                              alt=''
                              src='/workflow/code_del.png'
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              );
            }}
          </Form.List>
        </Form>
      </div>
    </div>
  );
});

export default RunCodePanel;
