"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
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
  Spin
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNodeData, useNodesInteractions } from "../../../hooks";
import styles from "./style.module.css";
import { getMetadataList } from "@/api/workflow";
import { getUuid } from "@/utils/utils";
import VariableCascader from '../../../../variableCascader';
// ==================== 常量定义 ====================
import useClickOutside from './useClickOutside'; // 自定义 hook 存在于另一个文件
import { useKnowledge } from "../hooks/use-knowledge";
/**
 * 逻辑操作符选项配置
 * 用于设置过滤条件之间的逻辑关系（AND/OR）
 */
const LOGICAL_OPERATORS = [
  {
    subText: "所有",
    logical_operator: "and",
  },
  {
    subText: "或者",
    logical_operator: "or",
  },
];

/**
 * 常量或变量类型选项配置
 * 用于选择值的类型（常量或变量）
 */
const VALUE_TYPES = [
  {
    subText: "Constant",
    type: "Constant",
  },
  {
    subText: "Variable",
    type: "Variable",
  },
];

/**
 * 字符串类型的比较操作符选项
 */
const STRING_COMPARISON_OPERATORS = [
  { value: "=", label: "是" },
  { value: "!=", label: "不是" },
  { value: "contains", label: "包含" },
  { value: "not contain", label: "不包含" },
  { value: "starts with", label: "开始是" },
  { value: "ends with", label: "结束是" },
  { value: "is null", label: "为空" },
  { value: "is not null", label: "不为空" },
];

/**
 * 数字类型的比较操作符选项
 */
const NUMBER_COMPARISON_OPERATORS = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: "≥" },
  { value: "<=", label: "≤" },
  { value: "is null", label: "为空" },
  { value: "is not null", label: "不为空" },
];

/**
 * 时间类型的比较操作符选项
 */
const TIME_COMPARISON_OPERATORS = [
  { value: "=", label: "是" },
  { value: "<", label: "早于" },
  { value: ">", label: "晚于" },
  { value: "is null", label: "为空" },
  { value: "is not null", label: "不为空" },
];

// ==================== 工具函数 ====================

/**
 * 根据属性类型获取默认比较操作符
 * @param {string} type - 属性类型
 * @returns {string} 默认比较操作符
 */
const getDefaultComparisonOperator = (type) => {
  switch (type) {
    case "string":
      return "=";
    case "number":
      return "=";
    case "time":
      return "=";
    default:
      return "=";
  }
};

/**
 * 格式化变量值为特定格式
 * @param {string} value - 原始变量值
 * @returns {string} 格式化后的变量值
 */
const formatVariableValue = (value) => {
  return `{{#${value}#}}`;
};

/**
 * 文档过滤条件模型组件
 * 用于设置知识库文档的过滤条件，支持字符串、数字、时间等类型的属性过滤
 *
 * @param {Object} props - 组件属性
 * @param {Object} props.dataObj - 数据对象，包含metadata_filtering_condition
 * @param {Function} props.metadata_filtering_conditionFunc - 过滤条件回调函数
 * @param {Object} props.mref - 父组件引用
 * @param {Object} ref - React转发引用
 */
const DocumentFilterCriteriaModel = forwardRef((props, ref) => {
  // ==================== 状态管理 ====================
  const { Text } = Typography;
  const formRef = useRef(null);
  const [form] = Form.useForm();

  // 基础状态
  const [actionType, setActionType] = useState("add"); // 操作类型：add/edit
  const [open, setOpen] = useState(false); // 模态框显示状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [isAddconditionOpen, setIsAddconditionOpen] = useState(false); // 添加条件弹窗状态
  const [variableData, setVariableData] = useState([]);//变量数据
  const { getUpstreamVariables } = useNodeData();
  const { sortByOriginalOrder } = useKnowledge();
  // 默认过滤条件设置
  const [activeTypeItem, setActiveTypeItem] = useState({
    subText: "所有",
    type: "and",
  });

  // 搜索文件数组
  const [searchFileArray, setSearchFileArray] = useState([]);
  const [searchFileArrayCopy, setSearchFileArrayCopy] = useState([]); //搜索文件数组备份
  // 文档过滤条件数组列表
  const [filterConditions, setFilterConditions] = useState({
    logical_operator: "and",
    conditions: [],
  });
  const attributePopupRef = useRef(null);//条件选择框引用
  // ==================== 组件暴露方法 ====================

  /**
   * 向父组件暴露的方法
   */
  useImperativeHandle(ref, () => ({
    showModal,
  }));

  // ==================== 核心功能函数 ====================

  /**
   * 显示模态框并获取知识库元数据列表
   * @param {Array} data - 知识库数据数组
   */
  const showModal = (data) => {
   
    setOpen(true);
    clearConfigData();
    getVariableData(data);
    getKnowledgeBaseMetadataList(data);
  };
  //清除配置的数据
  const clearConfigData = () => {
    setFilterConditions({//初始化过滤条件
      logical_operator: "and",
      conditions: [],
    });
    setSearchFileArray([]);
    setSearchFileArrayCopy([]);
  };

  //验证当前值为{{#${value}#}} 格式
  const validateValue = (value) => {
    const reg = /^\{\{#(.+?)#\}\}$/;
    return reg.test(value);
  };
  //获取变量数据
  const getVariableData = (data) => {
    let upstreamVariables = getUpstreamVariables(data.id);
    setVariableData(upstreamVariables);
  };
  /**
   * 获取当前知识库的元数据列表
   * @param {Array} arr - 知识库数组
   */
  const getKnowledgeBaseMetadataList = async (data) => {
    let arr = data.dataSet_list || []; //知识库数组
    let conditions = data.metadata_filtering_condition?.conditions || [];//过滤条件数组
    let newConditions = [];
      // 提取传入数组中每个元素的 id
      const ids = arr.map((item) => item.id);
      setLoading(true);
      getMetadataList(ids).then(res => {
        let dataArr = (res.data || []).map((item) => ({
          ...item,
          type: item.type ? String(item.type).toLowerCase() : item.type,
        }));

        //处理已经被删除元属性
         conditions.forEach(item => {
          let existIndex = dataArr.findIndex(condition => condition.name === item.name&&condition.type === item.type);
          if(existIndex != -1){
            newConditions.push(item);
          }
         });
        setSearchFileArray(dataArr);
        setSearchFileArrayCopy(dataArr); //搜索文件数组备份 
        let sortDataArr = sortByOriginalOrder(conditions, newConditions);
        //处理过滤条件数据对象
        let newFilterConditions = {
          logical_operator: data.metadata_filtering_condition?data.metadata_filtering_condition.logical_operator:'and',
          conditions: sortDataArr,
        };
        //更新数据到父组件
        props.updateMetadataFilteringCondition(newFilterConditions);
        //设置过滤条件
        setFilterConditions(newFilterConditions);
      
        setLoading(false);
     
      }).catch(err => {
        setLoading(false);
        console.error("获取元数据列表失败:", err);
      })
  };

  const classNames = {
    content: styles["my-modal-content"],
  };

  // ==================== 事件处理函数 ====================

  /**
   * 提交事件处理
   * @param {Event} e - 表单提交事件
   */
  const submitEvent = async (e) => {
    e.preventDefault();
    try {
      const values = await formRef.current.validateFields();
      if (actionType === "add") {
        addSubmitEvent(values);
      } else {
        editSubmitEvent(values);
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  /**
   * 添加提交事件处理
   * @param {Object} values - 表单值
   */
  const addSubmitEvent = (values) => {
    console.log("添加提交:", values);
  };

  /**
   * 编辑提交事件处理
   * @param {Object} values - 表单值
   */
  const editSubmitEvent = (values) => {
    console.log("编辑提交:", values);
  };

  /**
   * 打开/关闭添加条件弹窗
   * @param {Event} event - 点击事件
   */
  const handleOpenAddcondition = (event) => {
    if(props.readOnly) return;
    event.stopPropagation();
    setSearchFileArray(searchFileArrayCopy);
    setIsAddconditionOpen((prev) => !prev);
  };

  /**
   * 关闭模态框并保存过滤条件
   */
  const closeModalEvent = () => {
    setIsAddconditionOpen(false);
    setOpen(false);
    props.updateMetadataFilteringCondition(filterConditions);
 
  };

  /**
   * 搜索匹配列表
   * @param {Event} event - 输入事件
   */
  const onSearchFunc = (event) => {
    event.stopPropagation();
    const searchValue = event.target.value;
    const filteredResults = searchFileArrayCopy.filter((item) =>
      item.name.includes(searchValue)
    );
    setSearchFileArray(filteredResults);
  };

  /**
   * 处理文档过滤属性条件选择
   * @param {Object} valuePar - 选中的值对象
   */
  const handleSelectFunc = (valuePar) => {
    setFilterConditions((prev) => ({
      ...prev,
      logical_operator: valuePar.logical_operator,
    }));
  };

  /**
   * 更新条件比较操作符的通用方法
   * @param {string} conditionId - 条件ID
   * @param {string} newOperator - 新的比较操作符
   */
  const updateConditionComparisonOperator = (conditionId, newOperator) => {
    setFilterConditions((prev) => ({
      ...prev,
      conditions: prev.conditions.map((item) =>
        item.id === conditionId
          ? { ...item, comparison_operator: newOperator }
          : item
      ),
    }));
  };

  /**
   * 更新条件值的通用方法
   * @param {string} conditionName - 条件名称
   * @param {any} newValue - 新值
   */
  const updateConditionValue = (id, newValue) => {
    setFilterConditions((prev) => ({
      ...prev,
      conditions: prev.conditions.map((item) =>
        item.id === id ? { ...item, value: newValue } : item
      ),
    }));
  };


    /**
   * 处理字符串类型比较操作符变化
   * @param {string} eVal - 新的比较操作符
   * @param {Object} itemPar - 条件项参数
   */
  const handleChangeBoole = (eVal, itemPar) => {
    updateConditionComparisonOperator(itemPar.id, eVal);
  };

  /**
   * 筛选变量常量类型选择
   * @param {Object} value - 选中的值对象
   */
  const handleSelectVariable = (value,index) => {
    updateConditionOperator(value.type, index);
  };
  /**
   * 更新条件操作符
   * @param {string} value - 新的操作符
   * @param {number} index - 条件索引
   */
  const updateConditionOperator = (value, index) => {
    setFilterConditions((prev) => ({
      ...prev,
      conditions: prev.conditions.map((item,i) =>
          i === index ? { ...item, value_type: value,value: "" } : item
      ),
    }));
  };
  /**
   * 处理筛选文档属性选择
   * @param {Object} itemPar - 被选中的文档属性对象
   */
  const handleSelectAttribute = (itemPar) => {
    // 检查该属性是否已存在于过滤条件中
    const existIndex = filterConditions.conditions.findIndex(
      (item) => item.name === itemPar.name
    );


      const comparisonOperator = getDefaultComparisonOperator(itemPar.type);

      setFilterConditions((prev) => ({
        ...prev,
        conditions: [
          ...prev.conditions,
          {
            id: getUuid(), // 生成唯一id，防止重复
            name: itemPar.name,
            comparison_operator: comparisonOperator,
            value: "",
            type: itemPar.type,
            value_type: "Constant",//Constant,Variable
          },
        ],
      }));

      // 关闭添加条件弹窗
      setIsAddconditionOpen(false);
    
  };

  /**
   * 删除符合条件的列表项
   * @param {Object} itemPar - 要删除的条件项
   */
  const handleDeleteFilterConditions = (itemPar) => {
    setFilterConditions((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((item) => item.id !== itemPar.id),
    }));
  };

  /**
   * 更改字符串输入类型的值
   * @param {Event} event - 输入事件
   * @param {Object} itemPar - 条件项参数
   */
  const onInputChangeString = (event, itemPar) => {
    updateConditionValue(itemPar.id, event.target.value);
  };


  /**
   * 处理数字类型比较操作符变化
   * @param {string} eVal - 新的比较操作符
   * @param {Object} itemPar - 条件项参数
   */
  const handleChangeBooleNumber = (eVal, itemPar) => {
    updateConditionComparisonOperator(itemPar.id, eVal);
  };

  /**
   * Number类型输入值变化
   * @param {number} eventVal - 输入值
   * @param {Object} itemPar - 条件项参数
   */
  const onInputNumberChange = (eventVal, itemPar) => {
    updateConditionValue(itemPar.id, eventVal);
  };

  /**
   * 设置变量值 Number
   * @param {string} eventVal - 选中的变量值
   * @param {Object} itemPar - 条件项参数
   */
  const onChangeVaribleNumber = (eventVal, itemPar) => {
    const eventValTxt = formatVariableValue(eventVal);
    updateConditionValue(itemPar.id, eventValTxt);
  };
  /**
   * 处理时间类型比较操作符变化
   * @param {string} eVal - 新的比较操作符
   * @param {Object} itemPar - 条件项参数
   */
  const handleChangeBooleTime = (eVal, itemPar) => {
    updateConditionComparisonOperator(itemPar.id, eVal);
  };

  /**
   * Time类型时间变化
   * @param {Object} value - 时间值
   * @param {string} timeString - 格式化的时间字符串
   * @param {Object} itemPar - 条件项参数
   */
  const handleChangeEventTime = (value, timeString, itemPar) => {
    console.log("选择的时间: ", value);
    console.log("格式化的时间: ", timeString);
    console.log("条件项参数: ", itemPar);
    
    // 如果选择了时间，立即更新值
    if (value) {
      const timestamp = value.valueOf();
      updateConditionValue(itemPar.id, timestamp);
    }
  };

  /**
   * Time类型确定事件
   * @param {Object} value - 时间值
   * @param {Object} itemPar - 条件项参数
   */
  const onOkTime = (value, itemPar) => {
    if (value) {
      const timestamp = value.valueOf();
      updateConditionValue(itemPar.id, timestamp);
    }
  };

  // ==================== 渲染函数 ====================

  /** 
   * 添加条件弹窗内容
   */
 //鼠标移出关闭条件选择框
 const handleMouseLeave = () => {
  setIsAddconditionOpen(false);
 };
 //点击其他地方关闭条件选择框
 const handleClickOther = () => {
  setSearchFileArray(searchFileArrayCopy);
  setIsAddconditionOpen(false);
 };
  useClickOutside(attributePopupRef, handleClickOther);
  const isAddconditionOpenCon = (
    <div  className={styles["filterArea__attributePopup"]} onMouseLeave={handleMouseLeave} ref={attributePopupRef}>
      <div className={styles["attributePopup__search"]}>
        <Input
          style={{
            marginRight: 10,
            backgroundColor: "rgba(220, 220, 220, 0.3)",
            border: "0",
          }}
          onChange={onSearchFunc}
          placeholder="搜索文档属性"
          maxLength={50}
          suffix={<SearchOutlined />}
        />
      </div>
      <div className={styles["attributePopup__list"]}>
        {searchFileArray.length > 0 &&
          searchFileArray.map((item) => (
            <div
              className={styles["attributePopup__item"]}
              key={`${item.name}-${item.type}`}
              onClick={() => handleSelectAttribute(item)}
            >
              <div className={styles["attributePopup__itemLeft"]}>
                <Image
                src={`/workflow/knowledge/${item.type}.png`}
                  alt=""
                  width="16"
                  height="16"
                />
                <span className={styles["attributePopup__itemName"]}>
                  <Text
                    style={{ maxWidth: 200 }}
                    ellipsis={{ tooltip: item.name }}
                  >
                    {item.name}
                  </Text>
                </span>
              </div>
              <div className={styles["attributePopup__itemType"]}>
                {item.type}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  /**
   * 根据过滤条件类型渲染判断条件选择器
   * @param {Object} itemPar - 条件项参数
   * @returns {JSX.Element} 判断条件组件
   */
  const judgingCondition = (itemPar) => {
    const renderSelect = (options, defaultValue, onChange) => (
      <div className={styles["filterCondition__operator"]}>
        <Select
          defaultValue={itemPar.comparison_operator}
          className={styles["filterCondition__operatorSelect"]}
          onChange={(eVal) => onChange(eVal, itemPar)}
          options={options}
           variant="filled"
          disabled={props.readOnly}
        />
      </div>
    );

    switch (itemPar.type) {
      case "string":
        return renderSelect(
          STRING_COMPARISON_OPERATORS,
          "is",
            handleJudgingCondition
        );
      case "number":
        return renderSelect(
          NUMBER_COMPARISON_OPERATORS,
          "=",
          handleJudgingCondition
        );
      case "time":
        return renderSelect(
          TIME_COMPARISON_OPERATORS,
          "before",
          handleJudgingCondition
        );
      default:
        return null;
    }
  };
 
  const  handleJudgingCondition = (eVal, itemPar) => {
    updateConditionComparisonOperator(itemPar.id, eVal);
  };
  /**
   * 选择变量值
   * @param {string} eventVal - 选中的变量值
   * @param {Object} itemPar - 条件项参数
   */
  const onChangeVariable = (eventVal, itemPar) => {
    let value = eventVal.value_selector;
    let valueTxt =value? "{{#" + value.join(".") + "#}}":null;
    updateConditionValue(itemPar.id, valueTxt);
  };
  /**
   * 根据类型渲染条件值输入组件
   * @param {Object} itemPar - 条件项参数
   * @param {number} index - 索引
   * @returns {JSX.Element} 条件值输入组件
   */

  const variableStyle = {
    background: "#F2F4F6",
    borderRadius: "8px",
    border: "none",
  };
  const typeRenderingConditions = (itemPar, index) => {
    // 常量/变量选择器组件
    const renderValueTypeSelector = (itemPar) => {
      const dropdownItems = VALUE_TYPES.map((item) => ({
        key: item.type,
        label: item.subText,
        onClick: () => handleSelectVariable(item,index),
      }));

      return (
        <div className={styles["filterCondition__value"]}>
          <Dropdown
            disabled={props.readOnly}
            menu={{ items: dropdownItems }}
            trigger={["click"]}
            placement="bottomLeft"
          >
            <div className={styles["valueTypeSelector"]}>
              <div className={styles["valueTypeSelector__text"]}>
                {itemPar.value_type}
              </div>
              {!props.readOnly && (
              <Image
                className={styles["valueTypeSelector__icon"]}
                src="/workflow/selectorstow_icon.png"
                alt=""
                width="14"
                height="14"
              />
              )}
              <div className={styles["valueTypeSelector__divider"]}></div>
            </div>
          </Dropdown>
        </div>
      );
    };

    // 字符串类型渲染
    if (itemPar.type === "string") {
      return (
        <div className={styles["stringValueInput"]}>
          {renderValueTypeSelector(itemPar)}
          <div className={styles["valueInput"]}>
            {itemPar.value_type === "Constant" ? (
              <Input
                disabled={props.readOnly}
                placeholder="输入值"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "0",
                  borderColor: "#F2F4F6",
                  backgroundColor: "#F2F4F6",
                }}
                value={itemPar.value}
                onChange={(event) => onInputChangeString(event, itemPar)}
              />
            ) : (
              <div className={styles["valueInput__variable"]}>
               <VariableCascader
                 disabled={props.readOnly}
                 onChange={(eventVal) => onChangeVariable(eventVal, itemPar)}
                  value_selector={itemPar.value}
                  type={itemPar.type}
                  data={variableData}
                  key={itemPar.id}
                  style={variableStyle}
                 />
              </div>
            )}
          </div>
        </div>
      );
    }
    // 数字类型渲染
    else if (itemPar.type === "number") {
      return (
        <div className={styles["numberValueInput"]}>
          {renderValueTypeSelector(itemPar)}
          <div className={styles["valueInput"]}>
                {itemPar.value_type === "Constant" ? (
              <InputNumber 
                value={itemPar.value}
                disabled={props.readOnly}
                placeholder="输入值"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "0",
                  borderColor: "#F2F4F6",
                  backgroundColor: "#F2F4F6",
                }}
                onChange={(eventVal) => onInputNumberChange(eventVal, itemPar)}
              />
            ) : (
              <div className={styles["valueInput__variable"]}>
                   <VariableCascader
                 disabled={props.readOnly}
                 onChange={(eventVal) => onChangeVariable(eventVal, itemPar)}
                  value_selector={itemPar.value}
                  type={itemPar.type}
                  data={variableData}
                  key={itemPar.id}
                  style={variableStyle}
                 />
            
              </div>
            )}
          </div>
        </div>
      );
    }
    // 时间类型渲染
    else if (itemPar.type === "time") {
      // 将时间戳转换为 dayjs 对象
      const dateValue = itemPar.value ? dayjs(itemPar.value) : null;
      
      return (
        <div className={styles["timeValueInput"]}>
          <DatePicker
            disabled={props.readOnly}
            style={{ width: "100%", height: "100%",borderRadius: "8px",backgroundColor: "#F2F4F6" }}
            showTime={{ format: "HH:mm" }}
            value={dateValue}
            format="YYYY-MM-DD HH:mm"
            onChange={(value, timeString) =>
              handleChangeEventTime(value, timeString, itemPar)
            }
            onOk={(eventVal) => onOkTime(eventVal, itemPar)}
          />
        </div>
      );
    }
  };

  // ==================== 模态框样式配置 ====================

  // ==================== 主渲染 ====================

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="736px"
      closable={false}
      onCancel={closeModalEvent}
      classNames={classNames}
      zIndex={10000}
    >

      <div className={styles["documentFilterModal"]}>
        
        {/* 模态框头部 */}
        <div className={styles["documentFilterModal__header"]}>
          <div className={styles["documentFilterModal__headerTitle"]}>
            文档过滤条件
          </div>
          <div className={styles["documentFilterModal__headerClose"]}>
            <Image
              onClick={closeModalEvent}
              className={styles["panel_close"]}
              src="/close.png"
              alt=""
              width="32"
              height="32"
            />
          </div>
        </div>

        {/* 模态框内容 */}
        <div className={styles["documentFilterModal__content"]}>
          {/* 逻辑操作符选择区域 */}
          <div className={styles["documentFilterModal__logicSelector"]}>
            <div className={styles["logicSelector__container"]}>
              <span className={styles["logicSelector__label"]}>
                符合以下
              </span>
              <Dropdown
                disabled={props.readOnly}
                menu={{
                  items: LOGICAL_OPERATORS.map((item) => ({
                    key: item.logical_operator,
                    label: item.subText,
                    onClick: () => handleSelectFunc(item),
                  })),
                }}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <div className={styles["logicSelector__dropdown"]}>
                  <span className={styles["logicSelector__text"]}>
                    {filterConditions.logical_operator === "and"
                      ? "所有"
                      : "或者"}
                  </span>
                  <Image
                    src="/workflow/selectorstow_icon.png"
                    alt=""
                    width="14"
                    height="14"
                  />
                </div>
              </Dropdown>
              <span className={styles["logicSelector__label"]}>
                条件
              </span>
            </div>
          </div>

          {/* 过滤条件列表区域 */}
          <div className={styles["documentFilterModal__filterArea"]}>
            <div className={styles["filterConditionList"]}>
              {filterConditions.conditions.length > 0 &&
                filterConditions.conditions.map((item, index) => (
                  <div
                    className={styles["filterCondition"]}
                    key={item.id}
                  >
                    <div className={styles["filterCondition__attribute"]}>
                   
                    
                      <div
                        className={styles["filterCondition__attributeName"]}
                      >
                       <img      src={`/workflow/knowledge/${item.type}.png`} alt="" className={styles["filterCondition__attribute_img"]} />
                        <Text
                          style={{ maxWidth: 120 }}
                          ellipsis={{ tooltip: item.name }}
                        >
                          {item.name}
                        </Text>
                        <div
                          className={styles["filterCondition__attributeType"]}
                        >
                          {item.type}
                        </div>
                      </div>
                    </div>

                    {/* 比较操作符选择器 */}
                    {judgingCondition(item)}
                    {/* 条件值输入组件 */}
                    {item.comparison_operator!='is null'&& item.comparison_operator!='is not null'&&( 
                      typeRenderingConditions(item, index)
                    )}
                    {!props.readOnly && (
                    <img
                      className={styles["filterCondition__delete"]}
                      src="/workflow/common/delete.png"
                      alt=""
                      onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                      onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                      width="16"
                      height="16"
                      onClick={() => handleDeleteFilterConditions(item)}
                    />
                    )}
                  </div>
                ))}
            </div>

            {/* 添加条件按钮 */}
            <div className={styles["filterConditionList__addButton"]}>
            {!props.readOnly && (
              <div
                className={styles["filterArea__addButton"]}
                onClick={handleOpenAddcondition}
              >
                  <Image
                  src="/workflow/zsjsadd_icon.png"
                  alt=""
                  width="10"
                  height="10"
                />
                <span className={styles["filterArea__addButtonText"]}>
                  添加条件
                </span>
              </div>
            )}
            </div>

            {/* 添加条件弹窗 */}
            {isAddconditionOpen && isAddconditionOpenCon}
          </div>
        </div>
      </div>

    </Modal>
  );
});

export default DocumentFilterCriteriaModel;
