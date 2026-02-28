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
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Typography,
  message,
  Select,
  Tooltip,
  Spin,
  InputNumber,
  Empty,
  Divider
} from "antd";
import styles from "../node.module.css";
import { getPublishedWorkflowParams } from "@/api/workflow";
import workflowStyles from "./index.module.css";
import nodeStyles from "../node.module.css";
import { useNodesInteractions, useNodeData,useCheck} from "../../hooks";
import { checkApplicationStatus } from "@/api/workflow";
import Image from "next/image";
const { TextArea } = Input;
import debounce from "lodash/debounce";
import VariableCascader from "../../../variableCascader";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import RunHeader from "../../components/RunHeader";
const { Paragraph, Text } = Typography;

const booleanList = [
  {
    label: "是",
    value: true,
  },
  {
    label: "否",
    value: false,
  },
];

const defaultValues = {
  //数组类型默认值
  "array[string]": [""],
  "array[number]": [0],
  "array[object]": [
    {
      key: "value",
    },
  ],
  object: {
    key: "value",
  },
  string: "",
};

const valueTypeArray = {
  //值类型列表
  "text-input": "string",
  paragraph: "string",
  select: "string",
  number: "number",
  file: "file",
  "file-list": "array[file]",
};
const WorkflowPanel = forwardRef((props, ref) => {
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
  } = useStore((state) => state);
  const { updateNodeDetail } = useNodesInteractions();
  const { renameVariableReferences, getNodeById, getUpstreamVariables } =
    useNodeData();
  const { checkWorkflowNodeRequired } = useCheck();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  const deleteModalRef = useRef(null); //变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const jsonModalRef = useRef(null);
  const variableRef = useRef(null);
  const [mcpToolList, setMcpToolList] = useState([]);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [paramList, setParamList] = useState([]); //工具参数列表
  const [variableData, setVariableData] = useState([]); //变量数据
  const [jsonId, setJsonId] = useState(0);
  const [variableId, setVariableId] = useState(0);
  const [valueTypeList, setValueTypeList] = useState([
    {
      label: "输入",
      value: "Constant",
    },
    {
      label: "引用",
      value: "Variable",
    },
  ]); //引用方式列表
  useEffect(() => {
    if (panelVisible && pannerNode) {
      initFun();
    }
    //getSystemVariablesEvent();
  }, [panelVisible]);

  useEffect(() => {
    if (panelVisible) {
      getVariableDataEvent();
    }
  }, [changeId]);
  //初始化
  const initFun = () => {
    setLoading(true);
    setData(pannerNode.data);
    setTitle(pannerNode.data.title);
    getWorkflowParamsEvent(pannerNode.data);
    getVariableDataEvent();
  };
  const getVariableDataEvent = () => {
    let upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    setVariableData(upstreamVariables);
    setVariableId(getUuid());
  };
  //关闭事件
  const hideModal = () => {
    setOpen(false);
  };

  //根据appId 获取工作流参数列表
  const getWorkflowParamsEvent = (obj) => {
    getPublishedWorkflowParams({ appId: obj.appId })
      .then((res) => {
        if (obj.param && obj.param.length > 0) {
          setParamList(obj.param);
        }else{
          handleWorkflowParamsEvent(res.data, obj);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log(err, "err");
        setLoading(false);
      });
  };
  //获取工具的参数列表
  const handleWorkflowParamsEvent = (data, obj) => {
    console.log(data, "data");
    let paramArray = [];
    let paramData = data || [];
    paramData.forEach((item) => {
      let addItem = {
        name: item.variable,
        required: item.required,
        type: valueTypeArray[item.type],
        value_type:
          item.type == "file" || item.type == "file-list"
            ? "Variable"
            : "Variable",
        value: "",
        label: item.label,
      filterData:[valueTypeArray[item.type]]
      };
      paramArray.push(addItem);
    });
    setParamList(paramArray);
    initUpdateNodeDetailEvent(obj, paramArray);
  };
  //初始化更新节点数据
  const initUpdateNodeDetailEvent = (obj, paramArray) => {
    let newObj = {
      ...obj,
      param: paramArray, //工具参数
    };
    setData(newObj);
    updateNodeDetailEvent(newObj);
  };

  // 关闭面板事件
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };
  // 更新数据事件处理函数
  const updateDataEvent = (dataPar, dataParValue) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      [dataPar]: dataParValue,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
  };
  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      let newData = {
        nodeId: pannerNode.id,
        data: { ...data },
      };
      updateNodeDetail(newData);
    }, 10) // 1000ms 无操作后才触发
  ).current;

  // 节点标题改变事件
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    setTitle(title);
  };
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };
  // 保存标题
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      return message.warning("节点名称不能为空");
    }
    updateDataEvent("title", value);
  };
  // 失去焦点时保存标题并关闭编辑
  const handleTitleBlur = () => {
    setIsEditing(false);
    saveTitle(title);
  };

  // 运行面板事件
  const runPanelEvent = () => {
    if (readOnly) return;
    checkApplicationStatus(pannerNode.data.appId).then((res) => {
      if(!res){
        message.warning("模板已下架!");
        return;
      }
      let isPassed = checkWorkflowNodeRequired(pannerNode.data);
      if(!isPassed){
        message.warning("必填项未完成配置!");
      return;
    }
    setPannerNode(pannerNode);
    setPanelVisible(false);
    setRunVisible(true);
    });

  };

  //引用方式选择事件
  const handleValueTypeChange = (value, obj, index) => {
    let newParamList = paramList.map((item, i) => {
      let defaultValue = defaultValues[item.type]; //查找对应的默认值
      let defaultVal = item.defaultValue ? item.defaultValue : defaultValue;
      if (i === index) {
        //如果索引相同，则更新引用方式 更改引用方式清空输入值
        return {
          ...item,
          value_type: value,
          value: value === "Variable" ? "" : defaultVal,
        };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };

  const variableStyle = {
    width: "100%",
    height: "36px",
    background: "#F5F9FC",
    borderRadius: "8px 8px 8px 8px",
    border: "none",
  };
  //引用变量改变事件
  const handleValueVariableChange = (obj, item, index) => {
    let value = handleValueVariable(obj.value_selector); //变量值
    let newParamList = paramList.map((item, i) => {
      if (i === index) {
        return { ...item, value: value };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };

  //转换变量 从["38638f54-b6e5-4036-9c5b-2e1056ccc2f3", "test_text"] 转换为 {{#38638f54-b6e5-4036-9c5b-2e1056ccc2f3.test_text#}}
  const handleValueVariable = (value) => {
    if (value && Array.isArray(value)) {
      return `{{#${value.join(".")}#}}`;
    }
    return value;
  };
  //转换变量 从{{#38638f54-b6e5-4036-9c5b-2e1056ccc2f3.test_text#}} 转换为 ["38638f54-b6e5-4036-9c5b-2e1056ccc2f3", "test_text"]
  const handleVariableToValue = (value) => {
    //判断value是否为boolean类型
    if (value && typeof value === "boolean") {
      return value;
    }
    if (value && isWrappedField(value)) {
      return value.split("{{#")[1].split("#}}")[0].split(".");
    }
    return value;
  };
  //判断value是否为包裹字段
  const isWrappedField = (str) => {
    const pattern = /^\{\{#.*#\}\}$/;
    return pattern.test(str);
  };
  //处理输入变量改变事件
  const handleValueConstantChange = (value, item, index) => {
    let newParamList = paramList.map((item, i) => {
      if (i === index) {
        return { ...item, value: value };
      }
      return item;
    });
    setParamList(newParamList);
    updateDataEvent("param", newParamList);
  };


  //渲染输入变量内容
  const renderInputVariable = (item, index) => {
    let type = item.type; // 类型
    if (type == "string") {
      //
      return (
        <Input
          value={item.value}
          variant="borderless"
          disabled={readOnly}
          placeholder="请输入"
          className={workflowStyles.mcp_input}
          onChange={(e) => {
            handleValueConstantChange(e.target.value, item, index);
          }}
        />
      );
    }
    if (type == "number") {
      return (
        <InputNumber
          value={item.value}
          disabled={readOnly}
          variant="borderless"
          className={workflowStyles.mcp_input}
          controls={false}
          min={0}
          placeholder="请输入"
          onChange={(value) => {
            handleValueConstantChange(value, item, index);
          }}
        />
      );
    }
    if (type == "boolean") {
      return (
        <Select
          disabled={readOnly}
          style={{ height: "36px", width: "100%" }}
          value={item.value}
          variant="borderless"
          classNames={{ root: workflowStyles.mcp_select }}
          options={booleanList}
          placeholder="请选择"
          onChange={(value) => {
            handleValueConstantChange(value, item, index);
          }}
        />
      );
    }
  };

  const updateNodeDataByHeader = (obj) => {
    setData(obj);
    updateNodeDetailEvent(obj);
  };

  return (
    <div className={styles["panel_main"]}>
      <Spin spinning={loading} wrapperClassName="node_main_spin">
        <RunHeader
          data={data}
          updateNodeDataByHeader={updateNodeDataByHeader}
          runPanelEventByHeader={runPanelEvent}
        />
        <div className="node_panel_config">

          <div className={nodeStyles["start_panel_variable"]}>
            <div className={nodeStyles["mcp_panel_variable_title"]}>
              输入
              <Tooltip title="输入变量，工作流的输入参数">
                <img
                  src="/workflow/tip.png"
                  alt=""
            
                  className={nodeStyles["node_tip_icon"]}
                />
              </Tooltip>
            </div>
          </div>
          {/* 变量列表 */}
          {paramList.length > 0 && (
            <div className={workflowStyles["mcp_param_list"]}>
              <div
                className={`${workflowStyles.mcp_param_list_item} ${workflowStyles.mcp_param_list_item_title}`}
              >
                <div className={workflowStyles.mcp_para_list_item_name_title}>
                  变量名
                </div>
                <div
                  className={workflowStyles.mcp_para_list_item_citation_title}
                >
                  引用方式
                </div>
                <div className={workflowStyles.mcp_para_list_item_value_title}>
                  值
                </div>
              </div>
              {paramList.map((item, index) => (
                <div className={workflowStyles.mcp_param_list_item} key={index}>
                  <div className={workflowStyles.span_required}>
                    {item.required && <span>*</span>}
                  </div>

                  <div className={workflowStyles.mcp_para_list_item_name}>
                    <Text ellipsis={{ tooltip: item.name }}>{item.name}</Text>
                  </div>
                  <div className={workflowStyles.mcp_para_list_item_citation}>
                    <Select
                      style={{ height: "36px",width:'80px' }}
                      variant="borderless"
                      disabled={
                        readOnly ||
                        item.type == "file" ||
                        item.type == "array[file]"
                      }
                      classNames={{
                        root: workflowStyles.mcp_para_list_item_citation_select,
                      }}
                      onChange={(value) => {
                        handleValueTypeChange(value, item, index);
                      }}
                      value={item.value_type}
                      options={valueTypeList}
                    />
                  </div>
                  <div className={workflowStyles.mcp_para_list_item_value}>
                    {/* 引用变量 */}
                    {item.value_type === "Variable" && (
                      <VariableCascader
                        data={variableData}
                        filterData={[item.type]}
                        disabled={readOnly}
                        style={variableStyle}
                        key={variableId}
                        allowMiddleSelect={
                          item.type == "file" || item.type == "array[file]"
                        }
                        value_selector={handleVariableToValue(item.value)}
                        onChange={(value) => {
                          handleValueVariableChange(value, item, index);
                        }}
                      />
                    )}
                    {item.value_type === "Constant" && (
                      <div
                        className={
                          workflowStyles.mcp_para_list_item_value_input
                        }
                      >
                        <div
                          className={
                            workflowStyles.mcp_para_list_item_value_input_left
                          }
                        >
                         {item.type}
                        </div>
                        <Divider type='vertical' />
                        <div
                          className={
                            workflowStyles.mcp_para_list_item_value_input_right
                          }
                        >
                          {renderInputVariable(item, index)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {paramList.length == 0 && (
            <div className={workflowStyles["mcp_param_list_empty"]}>
              <Empty description="暂无数据" />
            </div>
          )}
          {/* 输出变量 */}
          <div className={workflowStyles["workflow_panel_output"]}>
            <div className={workflowStyles["workflow_panel_output_title"]}>
              输出
            </div>
            <div className={workflowStyles["workflow_panel_output_main"]}>
              <div
                className={workflowStyles["workflow_panel_output_main_item"]}
              >
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_name"]
                  }
                >
                  text
                </div>
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_value"]
                  }
                >
                  String
                </div>
              </div>
              <div className="workflow_panel_output_main_item_desc">
              工具生成的内容
              </div>
            </div>
            <div className={workflowStyles["workflow_panel_output_main"]}>
              <div
                className={workflowStyles["workflow_panel_output_main_item"]}
              >
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_name"]
                  }
                >
                  files
                </div>
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_value"]
                  }
                >
                  Array[File]
                </div>
              </div>
              <div className="workflow_panel_output_main_item_desc">
                工具生成的文件
              </div>
            </div>
            <div className={workflowStyles["workflow_panel_output_main"]}>
              <div
                className={workflowStyles["workflow_panel_output_main_item"]}
              >
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_name"]
                  }
                >
                  json
                </div>
                <div
                  className={
                    workflowStyles["workflow_panel_output_main_item_value"]
                  }
                >
                  Array[Object]
                </div>
              </div>
              <div className="workflow_panel_output_main_item_desc">
                工具生成的json
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
});

export default WorkflowPanel;
