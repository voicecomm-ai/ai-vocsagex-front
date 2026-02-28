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
  Divider,
  InputNumber,
  Tooltip,
  Slider
} from "antd";
import styles from "../node.module.css";
import loopStyles from "./loop.module.css";
import JsonEditor from "./JsonEditor";
import { useNodesInteractions, useNodeData, useCheck } from "../../hooks";

import debounce from "lodash/debounce";
import { useStore } from "@/store/index";
import { getUuid } from "@/utils/utils";
import VariableCascader from "../../../variableCascader";
import RunHeader from "../../components/RunHeader";   
const dataTypeOptions = [
  //数据类型选项
  {
    label: "String",
    value: "string",
  },
  {
    label: "Number",
    value: "number",
  },
  {
    label: "Object",
    value: "object",
  },
  {
    label: "Array[String]",
    value: "array[string]",
  },
  {
    label: "Array[Number]",
    value: "array[number]",
  },
  {
    label: "Array[Object]",
    value: "array[object]",
  },
];
const VariableTypeOptions = [
  //变量类型选项
  {
    label: "Constant",
    value: "constant",
  },
  {
    label: "Variable",
    value: "variable",
  },
];

/**
 * 字符串类型的比较操作符选项
 */
const STRING_COMPARISON_OPERATORS = [
  { value: "contains", label: "包含" },
  { value: "not contains", label: "不包含" },
  { value: "start with", label: "开始是" },
  { value: "end with", label: "结束是" },
  { value: "is", label: "是" },
  { value: "is not", label: "不是" },
  { value: "empty", label: "为空" },
  { value: "not empty", label: "不为空" },
];
/**
 * 数字类型的比较操作符选项
 */
const NUMBER_COMPARISON_OPERATORS = [
  { value: "=", label: "=" },
  { value: "≠", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "≥", label: "≥" },
  { value: "≤", label: "≤" },
  { value: "empty", label: "为空" },
  { value: "not empty", label: "不为空" },
];

/**
 * 对象类型的比较操作符选项
 */
const OBJECT_COMPARISON_OPERATORS = [
  { value: "empty", label: "为空" },
  { value: "not empty", label: "不为空" },
];
/**
 * 数组类型的比较操作符选项
 */
const ARRAY_COMPARISON_OPERATORS = [
  { value: "contains", label: "包含" },
  { value: "not contains", label: "不包含" },
  { value: "empty", label: "为空" },
  { value: "not empty", label: "不为空" },
];
const defaultValues={//数组类型默认值
  'array[string]':[""],
  'array[number]':[0],
  'array[object]':[
    {
      "key": "value"
    }
  ],
  'object':{
    "key": "value"
  },
  'string':'',
  'number':null,
}
const LoopPanel = forwardRef((props, ref) => {
  const { TextArea } = Input;
  const { Paragraph, Text } = Typography;
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    setChangeId,
    changeId,
    setChangeNodeType,
  } = useStore((state) => state);
  const { updateNodeDetail } = useNodesInteractions();
  const {
    getUpstreamVariables,
    getNodeById,
    getCurrentAndDownstreamVariables,
  } = useNodeData();
  const { checkLoopNodeRequired } = useCheck();
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  const deleteModalRef = useRef(null); //变量删除ref
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({}); //数据
  const [loading, setLoading] = useState(false); //加载中
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loopVariables, setLoopVariables] = useState([]); //变量数据列表
  const [frontVariableData, setFrontVariableData] = useState([]);
  const [loopAbortConditions, setLoopAbortConditions] = useState([]); //循环终止条件列表
  const [loopAbortVariableData, setLoopAbortVariableData] = useState([]); //循环终止条件变量数据
  const [jsonId,setJsonId] = useState(0);
  useEffect(() => {
    if (panelVisible && pannerNode) {
      setData(pannerNode.data);
      setTitle(pannerNode.data.title);
      initEvent();
    }
  }, [panelVisible]);
 
  useEffect(() => {
    if (panelVisible) {
      
      getVariableSelectorEvent();
    }
  }, [changeId]);

  //获取变量选择器
  const getVariableSelectorEvent = () => {
    let variableSelector = getUpstreamVariables(pannerNode.data.id);
    setFrontVariableData(variableSelector);
  }
  //初始化事件
  const initEvent = () => {
    let nodeData = getNodeById(pannerNode.data.id);
    let loop_variables = nodeData.data.loop_variables || [];
    let loop_abort_conditions = nodeData.data.break_conditions || [];
    setLoopVariables(loop_variables);
    setLoopAbortConditions(loop_abort_conditions);
    getVariableSelectorEvent
  };

  //关闭事件
  const hideModal = () => {
    setOpen(false);
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
      const newData = {
        nodeId: pannerNode.data.id,
        data: {
          ...data,
        },
      };
      updateNodeDetail(newData);
      setChangeId(getUuid());
      setChangeNodeType(pannerNode.data.type);
    }, 50) //
  ).current;

  // 节点标题改变事件
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    setTitle(title);
  };

  // 输入框获得焦点时
  const handleTitleFocus = () => {
    setIsEditing(true);
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

  //添加变量点击事件
  const addVariableEvent = () => {
    if(readOnly){
      return;
    }
    let addItem = {
      id: getUuid(),
      label: "",
      var_type: "string",
      value_type: "constant",
      value: "",
      errorMsg:"",
    };
    let variableArr = [...loopVariables];
    variableArr.push(addItem);
    setLoopVariablesEvent(variableArr);
  };

  //设置循环变量数据事件
  const setLoopVariablesEvent = (data) => {
    setLoopVariables(data);
    updateDataEvent("loop_variables", data);
  };

  //删除变量点击事件
  const deleteVariableEvent = (item, index) => {
    if (readOnly) return;
    let variableData = loopVariables.filter((obj, iIndex) => iIndex !== index);
    let conditionArr =[...loopAbortConditions];
    if(item.label){
      let loop_variables = [pannerNode.data.id, item.label];
      //在loopAbortConditions中查找对应的循环终止条件，并删除
      conditionArr = loopAbortConditions.filter(
        item => !(item.variable_selector && arraysEqual(item.variable_selector, loop_variables))
      );     
    }
    let dataObj = {
      'loop_variables': variableData,
      'break_conditions': conditionArr,
    };
    setLoopAbortConditions(conditionArr);
    setLoopVariables(variableData);
    updateDataEventBatch(dataObj);

  };
  //判断当前类型是对象还是数组，返回 object 或者 array
  const isObjectArray = (varType) => {
    if (varType == "object") {
      return "object";
    }
    if (varType == "array" || varType == "array[string]" || varType == "array[number]" || varType == "array[object]") {
      return "array";
    }
    return varType;
  }
  //数据类型改变事件
  // 数据类型（var_type）改变事件，更新对应变量的类型和值（对象/数组等），并通知状态变更
  const dataTypeChangeEvent = (value, index) => {
    setJsonId(getUuid()); // 每次更改强制更新 jsonId，触发下游组件刷新
    let variableArr = [...loopVariables]; // 克隆变量数组
    let item = variableArr[index]; // 当前操作的变量项
    findLoopVariableInAbortConditions(item,value)
    variableArr[index].var_type = value; // 设置新的变量类型
    // 如果是引用变量，则值留空，否则用默认值填充
    variableArr[index].value = item.value_type === 'variable' ? '' : defaultValues[value];
    setLoopVariablesEvent(variableArr); // 更新状态
  };

  //比较两个数组是否相等
  const arraysEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}
   // 在循环终止条件中查找对应的循环变量，更改其数据
   // 例如：当主循环变量类型改变时，保持 break_conditions 里引用该变量的条件与之同步
   const findLoopVariableInAbortConditions = (loop_var,value) => {
    let conditionArr = [...loopAbortConditions];
    // 构造循环变量的选择器路径，格式为 [当前节点id, 变量名]
    let loop_variables = [pannerNode.data.id, loop_var.label];
    // 遍历所有循环终止条件，查找 selector 匹配的项
    conditionArr.forEach(item => {
      if (item.variable_selector && arraysEqual(item.variable_selector, loop_variables)) {
        // 依据变量的新类型渲染可选的比较操作符
        // 此处应使用 loop_var.var_type 作为变量类型
        let comparison_operatorArr = renderSelectOptions(value);
        item.var_type = value;
        // 默认选第一个比较操作符
        item.comparison_operator = comparison_operatorArr ? comparison_operatorArr[0].value : '';
        item.value = '';
      }
    });
    // 更新终止条件状态
    setLoopAbortConditions(conditionArr);
    updateDataEvent("break_conditions", conditionArr);
  }


  // 变量类型（value_type）改变事件，如从“常量”切换为“变量引用”，需要重置 value 字段
  const variableTypeChangeEvent = (value, index) => {
    setJsonId(getUuid()); // 更新 jsonId，触发联动
    let variableArr = [...loopVariables]; // 克隆变量数组
    let item = variableArr[index]; // 当前变量项
    variableArr[index].value_type = value; // 更新变量类型
    // 如果切换为“变量引用”，值留空，否则用默认值（按类型填充）
    variableArr[index].value = value === 'variable' ? '' : defaultValues[item.var_type];
    setLoopVariablesEvent(variableArr); // 提交状态变更
  };

  //变量值change事件
  const variableValueChangeEvent = (value, index) => {
    let errorMsg = "";
    if (value) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        errorMsg = "变量名只能包含字母、数字和下划线，且不能以数字开头";
      
      }
      // 检查变量名是否重复（排除当前索引）
      const isDuplicate = loopVariables.some(
        (item, i) => i !== index && item.label === value
      );
      if (isDuplicate) {
        errorMsg = "变量名不能重复";
      }
    }
    let variableArr = [...loopVariables];
    variableArr[index].label = value;
    variableArr[index].errorMsg = errorMsg;
    setLoopVariablesEvent(variableArr);
  };
  //处理变量名失去焦点事件
  const handleVariableBlur = (value, index) => {
    if(!value.trim()) {
      let variableArr = [...loopVariables];
      variableArr[index].errorMsg = "变量名不能为空";
      setLoopVariablesEvent(variableArr);
    }
  };
  const handleInputChangeEvent = (value, index) => {
    let variableArr = [...loopVariables];
    variableArr[index].value = value;
    setLoopVariablesEvent(variableArr);
  };

  //渲染输入区域
  const renderInputArea = (item, index) => {
    switch (item.var_type) {
      case "string":
        return (
          <TextArea
            disabled={readOnly}
            variant="borderless"
            maxLength={100000}
            autoSize={{ minRows: 3, maxRows: 10 }}
            placeholder="请输入"
            value={item.value}
            onChange={(e) => {
              handleInputChangeEvent(e.target.value, index);
            }}
          />
        );
      case "number": //数字
        return (
          <InputNumber
            disabled={readOnly}
            variant="borderless"
               placeholder="请输入"
            style={{ width: "100%" }}
            value={item.value}
            onChange={(value) => {
              handleInputChangeEvent(value, index);
            }}
          />
        );
      default:
        return (
          <JsonEditor
            readOnly={readOnly}
            key={jsonId}
            content={item.value}
            disabled={readOnly}
            onChange={(value) => {
              console.log(value, "value");
              handleVariableDataChangeJson(value, item, index);
            }}
          />
        );
    }
  };
  //处理未放大json数据事件
  const handleVariableDataChangeJson = (value, item, index) => {
    let jsonObj = typeof value === "string" ? JSON.parse(value) : value;
    console.log(jsonObj, "jsonObj");
    handleInputChangeEvent(jsonObj, index);
  };
  const customStyle = {
    //自定义Cascader样式
    border: "none",
    background: "transparent",
  };
  //渲染变量选择区域
  const renderVariableArea = (item, index) => {
    let filterData = [item.var_type]; //需要过滤的变量类型
    return (
      <VariableCascader 
        disabled ={readOnly}
        value_selector={item.value}
        style={customStyle}
        placeholder="设置参数"
        filterData={filterData}
        allowMiddleSelect={false}
        onChange={(value) => {
          handleVariableChange(value, index);
        }}
        data={frontVariableData}
      />
    );
  };
  //
  const handleVariableChange = (obj, index) => {
    let value_selector = obj.value_selector;
    let variableArr = [...loopVariables];
    variableArr[index].value = value_selector;
    variableArr[index].var_type = obj.variable_type?obj.variable_type:variableArr[index].var_type; //数据类型
    setLoopVariablesEvent(variableArr);
  };
  //################################# 循环终止条件  ###########################################
  //添加条件点击事件
  const addConditionEvent = (obj) => {
    if (readOnly) return;
    if(!obj.value_selector){
      return;
    }
    let variable_selector = obj.value_selector;
    let comparison_operatorArr = renderSelectOptions(obj.variable_type);
    let addItem = {
      id: getUuid(), //唯一id
      variable_selector: variable_selector, //变量选择器
      var_type: obj.variable_type, //数据类型
      comparison_operator: comparison_operatorArr[0].value, //比较操作符
      numberVarType: "constant", //数字类型
      value: "",
    };
    let conditionArr = [...loopAbortConditions];
    conditionArr.push(addItem);
    setLoopAbortConditions(conditionArr);
    updateDataEvent("break_conditions", conditionArr);
  };

  //获取循环终止条件变量数据
  const getLoopAbortVariableData = () => {
    let abortArr = getCurrentAndDownstreamVariables(pannerNode.data.id);
    return abortArr;
  };

  //切换逻辑操作符事件
  const toggleLogicalOperatorEvent = () => {
    if (readOnly) return;
    let logical_operator = data.logical_operator == "and" ? "or" : "and";
    updateDataEvent("logical_operator", logical_operator);
  };
  //删除循环终止条件事件
  const deleteAbortConditionEvent = (obj, index) => {
    if (readOnly) return;
    let conditionData = [...loopAbortConditions];
    let conditionArr = conditionData.filter((item) => item.id !== obj.id);
    setLoopAbortConditions(conditionArr);
    updateDataEvent("break_conditions", conditionArr);
  };

  const renderSelectOptions = (variable_type) => {
    if (variable_type == "string") {
      return STRING_COMPARISON_OPERATORS;
    }
    if (variable_type == "number") {
      return NUMBER_COMPARISON_OPERATORS;
    }
    if (variable_type == "object" || variable_type == "array[object]") {
      return OBJECT_COMPARISON_OPERATORS;
    }
    if (variable_type == "array[string]" || variable_type == "array[number]") {
      return ARRAY_COMPARISON_OPERATORS;
    }
  };
  //处理循环终止条件变量改变事件
  const handleAbortVariableChange = (obj, index) => {
    let comparison_operatorArr = renderSelectOptions(obj.variable_type);
    let variableArr = [...loopAbortConditions];
    variableArr[index].variable_selector = obj.value_selector;
    variableArr[index].var_type = obj.variable_type; //数据类型
    variableArr[index].comparison_operator =comparison_operatorArr? comparison_operatorArr[0].value:''; //比较操作符
    variableArr[index].value = '';
    setLoopAbortConditions(variableArr);
    updateDataEvent("break_conditions", variableArr);
  };

  //处理循环终止条件比较操作符改变事件
  const handleAbortComparisonOperatorChange = (value, index) => {
    let variableArr = [...loopAbortConditions];
    variableArr[index].comparison_operator = value;
    setLoopAbortConditions(variableArr);
    updateDataEvent("break_conditions", variableArr);
  };
  //处理循环终止条件数字类型改变事件
  const handleAbortNumberVarTypeChange = (value, index) => {
    let variableArr = [...loopAbortConditions];
    variableArr[index].numberVarType = value;
    setLoopAbortConditions(variableArr);
    updateDataEvent("break_conditions", variableArr);
  };
  //处理循环终止条件比较输入改变事件
  const handleAbortComparisonInputChange = (value, index) => {
    console.log(value, index)
    let variableArr = [...loopAbortConditions];
    variableArr[index].value = value;
    console.log(variableArr,'variableArr')
    setLoopAbortConditions(variableArr);
    updateDataEvent("break_conditions", variableArr);
  };
  //处理渲染循环终止条件输入区域事件
  const renderAbortComparisonInputArea = (item, index) => {
    if (item.var_type == "number") {
      let numberFilterData =[item.var_type];
      return (
        <div className={loopStyles["abort_number"]}>
          <div className={loopStyles.abort_number_left}>
            <Select
              options={VariableTypeOptions}
              variant="borderless"
              disabled={readOnly}
              placeholder="操作"
              value={item.numberVarType}
              classNames={{
                root: loopStyles["loop_number_var_type_select_root"],
              }}
              onChange={(value) => {
                handleAbortNumberVarTypeChange(value, index);
              }}
            ></Select>
          </div>
          <div className={loopStyles.abort_number_right}>
           {item.numberVarType=='constant' && 
           <InputNumber
           disabled={readOnly}
           variant="borderless"
              placeholder="请输入"
           style={{ width: "100%" }}
           value={item.value}
           onChange={(value) => {
            handleAbortComparisonInputChange(value, index);
           }}
         />
           } 
           {item.numberVarType=='variable' && 
           <VariableCascader
           disabled={readOnly}
           variant="borderless"
           value_selector={item.value}
           filterData={numberFilterData}
           allowMiddleSelect={false}
           data={frontVariableData}
           style={customStyle}
           placeholder="设置参数"
           onChange={(obj) => {
            let value_selector = obj?.value_selector;
             handleAbortComparisonInputChange(value_selector, index);
           }}
           />} 
          </div>
        </div>
      );
    } else {
      return (
        <Input
          disabled={readOnly}
          variant="borderless"
          value={item.value}
          placeholder="请输入"
          onChange={(e) => {
            handleAbortComparisonInputChange(e.target.value, index);
          }}
        />
      );
    }
  };
  //处理最大循环次数改变事件
  const handleLoopCountChange = (value) => {
    updateDataEvent("loop_count", value);
  };
  //运行面板事件
  const runPanelEvent = () => {
    if(readOnly) return;
    const isValid = checkLoopNodeRequired(data);
    if(!isValid) {
      message.warning("必填项未完成配置!");
      return;
    }
    setPannerNode(props.nodeData)
    setPanelVisible(false)
    setRunVisible(true)
  };
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={loopStyles["panel_main"]}>
        <RunHeader  data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
      <div className={loopStyles["loop_panel_container"]}>
        <div className={loopStyles["loop_panel_container_header"]}>
          <div className={loopStyles["start_panel_variable_title"]}>循环变量</div>

          <div
            className={`${styles["start_panel_variable_add"]} ${
              readOnly ? "readOnly" : ""
            }`}
            onClick={addVariableEvent}
          >
            <img src="/workflow/add.png" alt="" /> 添加
          </div>
        </div>
        {/* 循环变量 */}
        {loopVariables.length>0 && 
        <div className={loopStyles["loop_panel_content"]}>
          {loopVariables.map((item, index) => (
            <div className={loopStyles["loop_panel_item"]} key={index}>
             <div className={loopStyles["loop_panel_item_content"]}>
              <div className={loopStyles["panel_item_left"]}>
                <div className={loopStyles["panel_item_left_header"]}>
                  <div className={loopStyles["panel_item_left_input"]}>
                    <Input
                      disabled={readOnly}
                      variant="borderless"
                      maxLength={20}
                      placeholder="变量名"
                      autoFocus={true}
                      value={item.label}
                      onChange={(e) => {
                        variableValueChangeEvent(e.target.value, index);
                      }}
                      onBlur={(e) => {
                        handleVariableBlur(e.target.value, index);
                      }}
                      
                    />
                  </div>
                  <div className={loopStyles["panel_item_left_data"]}>
                    <Select
                      options={dataTypeOptions}
                      variant="borderless"
                      disabled={readOnly}
                      placeholder="数据类型"
                      value={item.var_type}
                      classNames={{
                        root: loopStyles[
                          "data_type_right_select_root"
                        ],
                      }}
                      className={`${loopStyles["panel_item_left_header_right_select"]}`}
                      onChange={(value) => {
                        dataTypeChangeEvent(value, index);
                      }}
                    ></Select>
                  </div>
                  <Divider type="vertical" />
                  <div className={loopStyles["loop_variable_type_select_root"]}>
                    <Select
                      options={VariableTypeOptions}
                      variant="borderless"
                      disabled={readOnly}
                      placeholder="变量类型"
                      value={item.value_type}
                      classNames={{
                        root: loopStyles[
                          "loop_variable_type_select_root"
                        ],
                      }}
                    
                      onChange={(value) => {
                        variableTypeChangeEvent(value, index);
                      }}
                    ></Select>
                  </div>
                </div>
                <div className={loopStyles["panel_item_left_content"]}>
                  {item.value_type == "constant" &&
                    renderInputArea(item, index)}
                  {item.value_type == "variable" &&
                    renderVariableArea(item, index)}
                </div>
              </div>
              <div className={loopStyles["panel_item_right"]}>
                <img
                  onClick={() => {
                    if (readOnly) return;
                    deleteVariableEvent(item, index);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.src = "/workflow/common/delete_hover.png")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.src = "/workflow/common/delete.png")
                  }
                  className={`${loopStyles["panel_item_right_del"]} ${
                    readOnly ? "readOnly" : ""
                  }`}
                  src="/workflow/common/delete.png"
                  alt=""
                />
              </div>
              </div>  
              {item.errorMsg && <div className={loopStyles["loop_panel_item_content_error"]}>{item.errorMsg}</div>}
            </div>
          ))}
        </div>
        }
        {loopVariables.length==0 && 
        <div className={loopStyles["loop_panel_content_empty"]}>设置用于传递数据并最终输出的循环变量</div>}
        
        {/* 循环终止规则 */}
        <div className={loopStyles["loop_abort_title"]}>循环终止规则</div>
        <div className={loopStyles["loop_abort_desc"]}>
          循环终止条件
          <Tooltip title="设置循环何时停止">
            <img
              src="/workflow/tip.png"
              alt=""
              className={loopStyles["loop_abort_desc_tip"]}
            />
          </Tooltip>
        </div>
        {loopAbortConditions.length>0 && 
        <div className={loopStyles["loop_abort_conditions"]}>
           {loopAbortConditions.length>1 && 
           <>
          <div
            className={loopStyles["loop_abort_conditions_left_btn"]}
            onClick={() => {
              toggleLogicalOperatorEvent();
            }}
          >
            {data.logical_operator == "and" ? "且" : "或"}
          </div>
         
          <div className={loopStyles["loop_abort_conditions_left"]}></div>
          </>
        }
          <div className={loopStyles["loop_abort_conditions_right"]}>
            <div className={loopStyles["loop_abort_conditions_right_border"]}>
              {loopAbortConditions.map((item, index) => (
                <div className={loopStyles["abort_item"]} key={index}>
                  <div className={loopStyles["abort_item_left"]}>
                    <div className={loopStyles["panel_item_left_header"]}>
                      <div className={loopStyles["panel_item_left_input"]}>
                        <VariableCascader
                          value_selector={item.variable_selector}
                          style={customStyle}
                          allowMiddleSelect={false}
                          placeholder="设置参数"
                          renderWidth='30px'
                          labelMaxWidth={55}
                          disabled ={readOnly}
                          onChange={(value) => {
                            handleAbortVariableChange(value, index);
                          }}
                          data={getLoopAbortVariableData()}
                        />
                      </div>
                      <Divider type="vertical" />
                      <div
                        className={loopStyles["panel_item_left_header_right"]}
                      >
                        <Select
                          options={renderSelectOptions(item.var_type)}
                          variant="borderless"
                          disabled={readOnly || !item.variable_selector}
                          placeholder="操作"
                          value={item.comparison_operator}
                          classNames={{
                            root: loopStyles[
                              "panel_item_left_header_right_select_root"
                            ],
                          }}
                          className={`${loopStyles["panel_item_left_header_right_select"]}`}
                          onChange={(value) => {
                            handleAbortComparisonOperatorChange(value, index);
                          }}
                        ></Select>
                      </div>
                    </div>
                    {item.comparison_operator != "empty" &&
                      item.comparison_operator != "not empty" && (
                        <div className={loopStyles["panel_item_left_content"]}>
                          {renderAbortComparisonInputArea(item, index)}
                        </div>
                      )}
                  </div>

                  <div className={loopStyles["panel_item_right"]}>
                    <img
                      onClick={() => {
                        if (readOnly) return;
                        deleteAbortConditionEvent(item, index);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.src =
                          "/workflow/common/delete_hover.png")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.src = "/workflow/common/delete.png")
                      }
                      className={`${loopStyles["panel_item_right_del"]} ${
                        readOnly ? "readOnly" : ""
                      }`}
                      src="/workflow/common/delete.png"
                      alt=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        }
        {/* 循环终止条件选择器 */}
        <VariableCascader
           disabled ={readOnly}
          readOnly={readOnly}
          data={getLoopAbortVariableData()}
          onChange={(value) => {
            addConditionEvent(value);
          }}
        >
          <div
            className={loopStyles["loop_abort_add"]}
            onClick={addConditionEvent}
          >
            <img
              src="/workflow/add.png"
              alt=""
              className={loopStyles["loop_abort_add_img"]}
            />{" "}
            添加条件
          </div>
        </VariableCascader>
       {/*最大循环次数  */}
       <div className={loopStyles["loop_count"]}>
        <div className={loopStyles["loop_count_title"]}>最大循环次数</div>
        <div className={loopStyles["loop_count_conf"]}>
         <InputNumber
              value={data.loop_count}
              onChange={(value) => {
                handleLoopCountChange(value);
              }}
              variant="borderless"
              min={1}
              max={100}
              disabled={readOnly}
              className={loopStyles["loop_count_conf_input"]}
            />
            <div className={loopStyles["loop_count_conf_slider"]}>
              <Slider
                min={1}
                max={100}
                value={data.loop_count}
                onChange={handleLoopCountChange}
                disabled={readOnly}
              />
            </div>
        </div>
       </div>
      </div>
    </div>
  );
});

export default LoopPanel;
