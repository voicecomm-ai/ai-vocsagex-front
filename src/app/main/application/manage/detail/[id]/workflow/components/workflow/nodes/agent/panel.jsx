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
import { getWorkflowParams } from "@/api/workflow";
import workflowStyles from "./index.module.css";
import nodeStyles from "../node.module.css";
import { useNodesInteractions, useNodeData, useCheck } from "../../hooks";
import { getFindAgentDetail, getFindAgentVariableList } from "@/api/find";
const { TextArea } = Input;
import debounce from "lodash/debounce";
import VariableCascader from "../../../variableCascader";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import RunHeader from "../../components/RunHeader";
const { Paragraph, Text } = Typography;
import { checkApplicationStatus } from "@/api/workflow";
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
  text: "string",
  paragraph: "string",
  select: "string",
  number: "number",
  file: "file",
  "file-list": "array[file]",
};
const AgentPanel = forwardRef((props, ref) => {
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
  const { checkAgentNodeRequired } = useCheck();
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
    getAgentParamsEvent(pannerNode.data);
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
  const getAgentParamsEvent = (obj) => {
    getFindAgentDetail(obj.appId)
      .then((res) => {
        if (obj.param && obj.param.length > 0) {
          setParamList(obj.param);
        } else {
           let agentType = res.data.agentType || 'single';
           if(agentType === 'multiple'){//多智能体
            getAgentVariableListEvent(obj);
           }
           else{//单智能体  
            let variableList = res.data.variableList || [];
            handleAgentParamsEvent(variableList, obj);
           }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log(err, "err");
        setLoading(false);
      });
  };
 
  //根据智能体类型调用不同接口获取变量
  const getAgentVariableListEvent = (obj) => {
    getFindAgentVariableList(obj.appId)
      .then((res) => {
      let data =res.data ||[];
      let variableArr = [];
      data.forEach(item => {
        let variableList = item.variableList || [];
        variableList.forEach(variable => {
          // 为子智能体变量添加应用ID前缀，避免变量名冲突
          variable.nameText = variable.name;
          variable.name = variable.applicationId + '&' + variable.name;
          variableArr.push(variable);
        });
      });
      handleAgentParamsEvent(variableArr, obj);
      })
      .catch((err) => {
        console.log(err, "err");
        setLoading(false);
      });
  }

  //获取工具的参数列表
  const handleAgentParamsEvent = (data, obj) => {
    let paramArray = [];
    let paramData = data || [];
    paramData.forEach((item) => {
      let addItem = {
        name: item.name,
        nameText: item.nameText?item.nameText:item.name,//变量显示名
        required: item.required,
        type: valueTypeArray[item.fieldType],
        value_type:
          item.fieldType == "file" || item.type == "file-list"
            ? "Variable"
            : "Variable",
        value: "",
        label: item.displayName,
        filterData: [valueTypeArray[item.fieldType]],
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
  //批量更新数据事件
  const updateDataEventBatch = (dataObj) => {
    let nodeData = getNodeById(pannerNode.data.id);
    const obj = {
      ...nodeData.data,
      ...dataObj,
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
    }, 0) // 1000ms 无操作后才触发
  ).current;


  // 运行面板事件
  const runPanelEvent = () => {
    if (readOnly) return;
    checkApplicationStatus(data.appId).then((res) => {
      if(!res.data){
        message.warning("模板已下架!");
        return;
      }
      const isValid = checkAgentNodeRequired(data);
      if (!isValid) {
        message.warning("必填项未完成配置!");
        return;
      }
      setRunVisible(true);
      setPanelVisible(false);
      setPannerNode(pannerNode);
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
 
  //处理用户问题改变事件
  const handleQueryValueConstantChange = (value) => {
    updateDataEvent("queryValue", value);
  };
  //处理用户问题类型改变事件
  const handleQueryValueTypeChange = (value) => {
    let dataObj = {
      queryValue: '',
      query_value_type: value,
    };
    updateDataEventBatch(dataObj);
  };
  //处理用户问题变量改变事件
  const handleQueryValueVariableChange = (obj) => {
    let value_selector = handleValueVariable(obj.value_selector);
    updateDataEvent("queryValue", value_selector);
   
  };
  return (
    <div className={workflowStyles["panel_main"]}>
      <Spin spinning={loading} wrapperClassName="node_main_spin">
        <RunHeader
          data={data}
          updateNodeDataByHeader={updateNodeDataByHeader}
          runPanelEventByHeader={runPanelEvent}
        />
        <div className="node_panel_config">
          <div className={nodeStyles["start_panel_variable"]}>
            <div className={workflowStyles["app_panel_variable_title"]}>
           
              输入
               <div className="span_required">
                     <span>*</span>
                  </div>
          
            </div>
          </div>
        
          {/*输入内容区域 */}
          <div className={workflowStyles["agent_node_input"]}>
     
         <div className={workflowStyles["agent_node_input_content"]}>       
            <Select
              style={{ height: "36px",width: "95px" }}
              variant="borderless"
              disabled={readOnly}
              classNames={{
                root: workflowStyles.mcp_para_list_item_citation_select,
              }}
              onChange={(value) => {
                handleQueryValueTypeChange(value);
              }}
              value={data.query_value_type}
              options={valueTypeList}
            />
            <div className={workflowStyles.mcp_para_list_item_value_input_right}>
              {data.query_value_type === "Variable" && (
                <VariableCascader
                  data={variableData}
                  filterData={[]}
                  disabled={readOnly}
                  style={variableStyle}
                  key={variableId}
                  placeholder='请选择用户问题'
                  value_selector={data.queryValue}
                  onChange={(value) => {
                    handleQueryValueVariableChange(value);
                  }}
                />
              )}
              {data.query_value_type === "Constant" && (
              <Input
                value={data.queryValue}
                disabled={readOnly}
                variant="borderless"
                placeholder="请输入用户问题"
                maxLength={500}
                className={workflowStyles.mcp_input}
                onChange={(e) => {
                  handleQueryValueConstantChange(e.target.value);
                }}
              />
              )}
            </div>
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
                    <Text ellipsis={{ tooltip: item.nameText }}>{item.nameText}</Text>
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
                  result
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
                工具执行结果
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
});

export default AgentPanel;
