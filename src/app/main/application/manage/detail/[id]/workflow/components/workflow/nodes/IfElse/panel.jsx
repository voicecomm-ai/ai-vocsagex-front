"use client";

/**
 * 条件分支面板组件 (IfElse Panel)
 * 
 * 功能说明：
 * - 支持 IF/ELIF/ELSE 条件分支配置
 * - 支持多种变量类型的条件判断（字符串、数字、文件、数组等）
 * - 支持嵌套的子变量条件（针对 array[file] 类型）
 * - 支持数字类型的变量/常量选择
 * - 支持条件之间的逻辑运算符（且/或）
 */

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Input, Form, message, Button, Divider, Select } from "antd";
import styles from "../node.module.css";
import pageStyles from "./page.module.css";
import { useNodesInteractions, useNodeData } from "../../hooks";
import { getUuid } from "@/utils/utils";
import VariableCascader from "../../../variableCascader";
import AddCondition from "./AddCondition/index";
import ContentInput from "./ContentInput/index";
import { useValidateConditions } from "./hooks/use-ifelse";

const { TextArea } = Input;
import { useStore } from "@/store/index";
import RunHeader from "../../components/RunHeader";  
// ==================== 常量定义 ====================

/**
 * 文本类型变量的关系操作符列表
 * 用于字符串类型变量的条件判断
 */
const textTypeList = [
  { label: "包含", value: "contains" },
  { label: "不包含", value: "not contains" },
  { label: "开始是", value: "start with" },
  { label: "结束是", value: "end with" },
  { label: "是", value: "is" },
  { label: "不是", value: "is not" },
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 简单文件类型的关系操作符列表
 * 用于单个文件类型变量的条件判断
 */
const simpleFileTypeList = [
  { label: "存在", value: "exists" },
  { label: "不存在", value: "not exists" },
];

/**
 * 文件数组类型的关系操作符列表
 * 用于 array[file] 类型变量的条件判断
 */
const arrFileTypeList = [
  { label: "包含", value: "contains" },
  { label: "不包含", value: "not contains" },
  { label: "全部是", value: "all of" },
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 文本或数字数组类型的关系操作符列表
 * 用于 array[string] 和 array[number] 类型变量的条件判断
 */
const textOrNumberArrTypeList = [
  { label: "包含", value: "contains" },
  { label: "不包含", value: "not contains" },
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 对象数组类型的关系操作符列表
 * 用于 array[object] 和 object 类型变量的条件判断
 */
const arrObjectTypeList = [
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 数字类型的关系操作符列表
 * 用于数字类型变量的条件判断
 */
const numberTypeList = [
  { label: "=", value: "=" },
  { label: "≠", value: "≠" },
  { label: ">", value: ">" },
  { label: "<", value: "<" },
  { label: "≥", value: "≥" },
  { label: "≤", value: "≤" },
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 对象类型的关系操作符列表
 * 用于对象类型变量的条件判断
 */
const objectTypeList = [
  { label: "是", value: "is" },
  { label: "不是", value: "is not" },
  { label: "为空", value: "empty" },
  { label: "不为空", value: "not empty" },
];

/**
 * 变量类型与关系操作符的映射表
 * 根据不同的变量类型返回对应的关系操作符列表
 */
const relationOptionsMap = {
  string: textTypeList,
  number: numberTypeList,
  "array[file]": arrFileTypeList,
  "array[string]": textOrNumberArrTypeList,
  "array[number]": textOrNumberArrTypeList,
  "array[object]": arrObjectTypeList,
  file: simpleFileTypeList,
  object: arrObjectTypeList,
};

/**
 * 类型判断的关系操作符列表
 * 用于 type 和 transfer_method 等特殊字段的判断
 */
const typeList = [
  { label: "是", value: "is" },
  { label: "不是", value: "is not" },
];

/**
 * 大小比较的关系操作符列表
 * 用于 size 字段的数值比较
 */
const sizeList = [
  { label: ">", value: ">" },
  { label: "≥", value: "≥" },
  { label: "<", value: "<" },
  { label: "≤", value: "≤" },
];

/**
 * 扩展名判断的关系操作符列表
 * 用于 extension 字段的判断
 */
const extensionList = [
  { label: "是", value: "is" },
  { label: "不是", value: "is not" },
  { label: "包含", value: "contains" },
  { label: "不包含", value: "not contains" },
];

/**
 * 子变量字段与关系操作符的映射表
 * 用于 array[file] 类型变量的子字段条件判断
 */
const childrenRelationOptionsMap = {
  type: typeList,
  size: sizeList,
  name: textTypeList,
  url: textTypeList,
  extension: extensionList,
  mime_type: textTypeList,
  transfer_method: extensionList.slice(0, 2), // 只取前两个选项（是/不是）
  related_id: textTypeList,
};

/**
 * 子变量字段选项列表
 * 用于 array[file] 类型变量时选择子字段
 */
const childVariableOptions = [
  { label: "type", value: "type" },
  { label: "size", value: "size" },
  { label: "name", value: "name" },
  { label: "url", value: "url" },
  { label: "extension", value: "extension" },
  { label: "mime_type", value: "mime_type" },
  { label: "transfer_method", value: "transfer_method" },
  { label: "related_id", value: "related_id" },
];

/**
 * 初始条件结构
 * 默认包含一个 IF 条件块
 */
const initCondition = [
  { type: "IF", conditions: [], logical_operator: "or", id: "true", case_id: "true" },
];

/**
 * 条件分支面板组件
 * 使用 forwardRef 暴露方法给父组件
 */
const ConditionalBranchPanel = forwardRef((props, ref) => {
  // ==================== Hooks ====================
  const validateConditions = useValidateConditions();
  const { updateNodeDetail } = useNodesInteractions();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const [form] = Form.useForm();

  // 从全局状态获取面板相关状态
  const {
    panelVisible,
    pannerNode,
    readOnly,
    setPannerNode,
    setPanelVisible,
    setRunVisible,
    changeId,
  } = useStore((state) => state);

  // ==================== 状态管理 ====================
  const [title, setTitle] = useState("");
  const [data, setData] = useState({});
  const isInitializing = useRef(false); // 标记是否正在初始化，避免初始化时触发更新
  const nodeId = useRef("");
  const [isEditing, setIsEditing] = useState(false); // 标题输入框是否处于编辑状态

  /**
   * 数字类型变量下拉菜单的状态管理
   * 用于控制数字类型变量选择下拉菜单的显示和位置
   */
  const [numberDropdownState, setNumberDropdownState] = useState({
    open: false,
    blockIndex: null,
    itemIndex: null,
    subItemIndex: null,
  });

  /**
   * 变量列表
   * 包含所有可用的上游变量
   */
  const [variableList, setVariableList] = useState([]);

  /**
   * 数字类型变量列表
   * 从 variableList 中过滤出的数字类型变量，用于数字类型条件的选择
   */
  const [numberVariableList, setNumberVariableList] = useState([]);

  /**
   * 变量ID
   * 用于强制重新渲染 VariableCascader 组件
   */
  const [variableId, setVariableId] = useState(null);

  // ==================== 暴露给父组件的方法 ====================
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  /**
   * 显示模态框（预留方法，当前未使用）
   */
  const showModal = async () => {
    // 预留方法，当前未实现
  };

  /**
   * 隐藏模态框（预留方法，当前未使用）
   */
  const hideModal = () => {
    // 预留方法，当前未实现
  };

  /**
   * 关闭面板事件处理
   * 清空面板节点、隐藏面板和运行面板
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
    setRunVisible(false);
  };

  // ==================== 生命周期 ====================

  /**
   * 当面板显示或节点变化时初始化
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      initFun();
    }
  }, [panelVisible, pannerNode]);

  /**
   * 当节点ID变化时重新初始化
   */
  useEffect(() => {
    if (panelVisible) {
      initFun();
    }
  }, [changeId]);

  /**
   * 初始化函数
   * 加载节点数据，同步变量类型，获取变量选项
   */
  const initFun = () => {
    isInitializing.current = true;
    setTitle(pannerNode.data.title);
    nodeId.current = pannerNode.id;
    const nodeObj = getNodeById(pannerNode.id);
    const initialData = {
      ...nodeObj.data,
      cases: nodeObj.data.cases || initCondition,
    };

    // 获取最新的上游变量列表
    const arr = getUpstreamVariables(pannerNode.id);
    // 同步变量类型（处理变量类型变化的情况）
    const syncedData = syncVariableTypes(initialData, arr);
    setData(syncedData);

    // 获取变量选项列表
    getSelectOptions();
    
    // 延迟重置初始化标记，避免初始化时触发更新
    setTimeout(() => {
      isInitializing.current = false;
    }, 100);
  };

  // ==================== 变量类型同步 ====================

  /**
   * 在变量列表中查找指定选择器对应的变量
   * @param {Array} arr - 变量列表
   * @param {Array} selector - 变量的选择器路径
   * @returns {Object|null} 找到的变量对象，未找到返回 null
   */
  const findVariableInArr = (arr, selector) => {
    for (const item of arr) {
      if (JSON.stringify(item.value_selector) === JSON.stringify(selector)) {
        return item;
      }
      // 递归查找子节点
      if (item.children && item.children.length) {
        const found = findVariableInArr(item.children, selector);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * 同步条件数据中的变量类型
   * 处理场景：当上游节点的输出变量类型发生变化时，需要同步更新条件中的变量类型
   * @param {Object} data - 节点数据
   * @param {Array} arr - 最新的变量列表
   * @returns {Object} 同步后的数据
   */
  const syncVariableTypes = (data, arr) => {
    if (!data?.cases) return data;

    const newData = { ...data };
    newData.cases = newData.cases.map((c) => {
      return {
        ...c,
        conditions: c.conditions.map((cond) => {
          const selector = cond.variable_selector;
          const latestVar = findVariableInArr(arr, selector);
          // 如果变量类型发生变化，更新条件中的变量类型
          if (latestVar && cond.inputItem?.variable_type !== latestVar.variable_type) {
            return {
              ...cond,
              varType: latestVar.variable_type, // 更新条件里的 varType
              inputItem: {
                ...cond.inputItem,
                variable_type: latestVar.variable_type, // 更新 inputItem 里的 variable_type
              },
            };
          }
          return cond;
        }),
      };
    });

    return newData;
  };

  // ==================== 数据更新 ====================

  /**
   * 更新节点详情
   * 将当前数据同步到节点数据中
   */
  const updateNodeDetailEvent = () => {
    const newData = {
      nodeId: nodeId.current,
      data: { ...data, id: nodeId.current },
    };
    updateNodeDetail(newData);
  };

  /**
   * 当数据变化时自动更新节点详情
   * 排除初始化阶段，避免不必要的更新
   */
  useEffect(() => {
    if (!isInitializing.current) {
      updateNodeDetailEvent();
    }
  }, [data]);

  // ==================== 节点基本信息处理 ====================

  /**
   * 处理节点标题变化
   * @param {Event} e - 输入事件
   */
  const handleNodeTitleChange = (e) => {
    setData((prev) => ({
      ...prev,
      title: e.target.value,
    }));
  };

  /**
   * 处理节点描述变化
   * @param {Event} e - 输入事件
   */
  const handleNodeDescChange = (e) => {
    const desc = e.target.value;
    setData((prev) => ({
      ...prev,
      desc,
    }));
  };

  // ==================== 条件操作处理 ====================

  /**
   * 处理关系操作符变化
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {string} value - 新的关系操作符值
   */
  const handleRelationChange = (blockIndex, itemIndex, value) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const block = newConditions[blockIndex];
      const conditions = block.conditions;
      conditions[itemIndex].comparison_operator = value;
      
      // 如果选择的是"为空"或"不为空"，清空值和子条件
      if (value === "empty" || value === "not empty") {
        conditions[itemIndex].value = "";
        conditions[itemIndex].sub_variable_condition.conditions = [];
      }
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 处理条件值变化
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {any} value - 新的值
   */
  const handleValueChange = (blockIndex, itemIndex, value) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const block = newConditions[blockIndex];
      const conditions = block.conditions;
      conditions[itemIndex].value = value;
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 添加子变量条件
   * 用于 array[file] 类型变量，添加子字段条件
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   */
  const handleAddChildVariable = (blockIndex, itemIndex) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      
      // 如果子变量条件不存在，初始化它
      if (!newItem.sub_variable_condition) {
        newItem.sub_variable_condition = {
          case_id: getUuid(),
          logical_operator: "or",
          conditions: [],
        };
      }
      
      // 添加新的子变量条件，默认选择 type 字段
      newItem.sub_variable_condition.conditions.push({
        id: getUuid(),
        key: "type",
        varType: "string",
        comparison_operator: "is",
        value: null,
        variable_selector: [], // 子实体数组变量
      });
      
      // 如果有多个子条件，确保逻辑操作符存在
      if (newItem.sub_variable_condition.conditions.length >= 2) {
        newItem.sub_variable_condition.logical_operator =
          newItem.sub_variable_condition.logical_operator || "or";
      }
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 切换子变量条件的逻辑操作符（且/或）
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   */
  const toggleChildLogicOperator = (blockIndex, itemIndex) => {
    if (readOnly) return;
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      const currentOperator = newItem.sub_variable_condition.logical_operator;
      newItem.sub_variable_condition.logical_operator = currentOperator === "or" ? "and" : "or";
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 添加条件块（ELIF）
   * 在现有条件块后添加一个新的 ELIF 条件块
   */
  const addConditionBlock = () => {
    setData((prevData) => {
      const newConditions = [
        ...(prevData.cases || initCondition),
        { type: "ELIF", conditions: [], logical_operator: "or", case_id: getUuid() },
      ];
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 删除条件块
   * 如果删除的是 IF 块，将下一个块提升为 IF
   * @param {number} blockIndex - 要删除的条件块索引
   */
  const deleteBlock = (blockIndex) => {
    setData((prevData) => {
      const newConditions = (prevData.cases || initCondition).filter((_, i) => i !== blockIndex);
      const isIfBlock = (prevData.cases || initCondition)[blockIndex].type === "IF";
      
      // 如果删除的是 IF 块，将第一个剩余块提升为 IF
      if (isIfBlock && newConditions.length > 0) {
        newConditions[0] = {
          ...newConditions[0],
          type: "IF",
        };
      }
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 删除条件项
   * 如果删除后条件块为空，根据块类型进行不同处理
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   */
  const deleteConditionItem = (blockIndex, itemIndex) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newItems = newConditions[blockIndex].conditions.filter((_, i) => i !== itemIndex);
      
      // 如果删除后条件块为空
      if (newItems.length === 0) {
        const blockType = newConditions[blockIndex].type;
        
        if (blockType === "IF") {
          // 如果是 IF 块，尝试将下一个块提升为 IF
          const remainingBlocks = newConditions.slice(blockIndex + 1);
          if (remainingBlocks.length > 0) {
            const nextBlock = remainingBlocks[0];
            nextBlock.type = "IF";
            const resultConditions = [nextBlock, ...remainingBlocks.slice(1)];
            return { ...prevData, cases: resultConditions };
          } else {
            // 没有剩余块，保留空的 IF 块
            newConditions[blockIndex].conditions = [];
            return { ...prevData, cases: newConditions };
          }
        } else {
          // 如果是 ELIF 块，直接删除
          const remainingConditions = newConditions.filter((_, i) => i !== blockIndex);
          if (remainingConditions.length === 0) {
            // 如果删除后没有条件块，创建一个空的 IF 块
            return {
              ...prevData,
              cases: [{ type: "IF", conditions: [], logical_operator: "or" }],
            };
          }
          return { ...prevData, cases: remainingConditions };
        }
      }
      
      // 删除后条件块不为空，直接更新
      newConditions[blockIndex].conditions = newItems;
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 检查是否存在 ELIF 块
   * 用于控制删除按钮的显示
   */
  const hasElifBlock = data?.cases?.some((block) => block.type === "ELIF");

  /**
   * 切换条件块内条件的逻辑操作符（且/或）
   * @param {number} blockIndex - 条件块索引
   */
  const toggleLogicOperator = (blockIndex) => {
    if (readOnly) {
      return;
    }
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const block = newConditions[blockIndex];
      block.logical_operator = block.logical_operator === "or" ? "and" : "or";
      return { ...prevData, cases: newConditions };
    });
  };

  // ==================== 子变量条件处理 ====================

  /**
   * 更新子变量条件的通用方法
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   * @param {Function} updater - 更新函数，接收子条件项作为参数
   */
  const updateChildItem = (blockIndex, itemIndex, childItemIndex, updater) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      const newChildItems = newItem.sub_variable_condition.conditions;
      const newChildItem = newChildItems[childItemIndex];
      updater(newChildItem);
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 处理子变量字段变化
   * 当选择不同的子变量字段（如 type、size、name 等）时调用
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   * @param {string} value - 新的子变量字段值
   */
  const handleChildVariableChange = (blockIndex, itemIndex, childItemIndex, value) => {
    const newRelationOptions = childrenRelationOptionsMap[value];
    const defaultRelationValue =
      newRelationOptions && newRelationOptions.length > 0 ? newRelationOptions[0].value : "";
    
    updateChildItem(blockIndex, itemIndex, childItemIndex, (childItem) => {
      childItem.key = value;
      childItem.comparison_operator = defaultRelationValue;
      childItem.variable_selector = [];
      childItem.numberInputItem = null;
      
      // 根据字段类型设置默认值
      if (value === "type" || value === "transfer_method") {
        childItem.value = null; // 选择框类型，值为 null
      } else {
        childItem.value = ""; // 输入框类型，值为空字符串
      }
      
      // size 字段需要数字类型，设置默认的 numberVarType
      if (value === "size") {
        childItem.numberVarType = "variable"; // 默认值
      } else {
        // 其他情况删除该属性，避免脏数据
        delete childItem.numberVarType;
      }
    });
  };

  /**
   * 处理子变量关系操作符变化
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   * @param {string} value - 新的关系操作符值
   */
  const handleChildRelationChange = (blockIndex, itemIndex, childItemIndex, value) => {
    updateChildItem(blockIndex, itemIndex, childItemIndex, (childItem) => {
      childItem.comparison_operator = value;
    });
  };

  /**
   * 处理子变量值变化
   * 支持输入框和选择框两种类型的值变化
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   * @param {any} valueOrEvent - 值或事件对象
   */
  const handleChildValueChange = (blockIndex, itemIndex, childItemIndex, valueOrEvent) => {
    // 处理事件对象和直接值两种情况
    const value = valueOrEvent && valueOrEvent.target ? valueOrEvent.target.value : valueOrEvent;

    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const block = newConditions[blockIndex];
      const childConditions = block.conditions[itemIndex].sub_variable_condition.conditions;

      childConditions[childItemIndex].value = value;

      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 删除子变量条件
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   */
  const handleDeleteChildVariable = (blockIndex, itemIndex, childItemIndex) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      const newChildItems = (newItem.sub_variable_condition.conditions || []).filter(
        (_, i) => i !== childItemIndex
      );
      newItem.sub_variable_condition.conditions = newChildItems;
      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 更新条件项的通用方法
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {Function} updater - 更新函数，接收条件项作为参数
   */
  const updateItem = (blockIndex, itemIndex, updater) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      updater(newItem);
      return { ...prevData, cases: newConditions };
    });
  };

  // ==================== 变量选择处理 ====================

  /**
   * 处理新增条件时的变量选择
   * 当用户从下拉菜单中选择变量添加新条件时调用
   * @param {Object} variable - 选中的变量对象
   * @param {number} blockIndex - 条件块索引
   */
  const handleSelectNewCondition = (variable, blockIndex) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const block = newConditions[blockIndex];

      // 获取该类型对应的关系操作选项
      const newRelationOptions = relationOptionsMap[variable.variable_type];
      let defaultRelationValue = "";
      
      // 特殊字段使用固定的关系操作符
      if (variable.label === "transfer_method" || variable.label === "type") {
        defaultRelationValue = "is";
      } else {
        defaultRelationValue =
          newRelationOptions && newRelationOptions.length > 0 ? newRelationOptions[0].value : "";
      }

      // 创建新的条件项
      const newItem = {
        id: getUuid(),
        varType: variable.variable_type,
        variable_selector: variable.value_selector,
        inputItem: variable,
        comparison_operator: defaultRelationValue,
        sub_variable_condition: {
          case_id: getUuid(),
          logical_operator: "or",
          conditions: [],
        },
        value: "",
        // 数字类型需要额外的配置
        ...(variable.variable_type === "number" && {
          numberVarType: "variable",
          numberInputItem: null,
        }),
      };

      block.conditions.push(newItem);

      // 如果新增后有多个条件，确保逻辑操作符存在
      if (block.conditions.length >= 2) {
        block.logical_operator = "or";
      }

      return { ...prevData, cases: newConditions };
    });
  };

  // ==================== 数字类型变量处理 ====================

  /**
   * 处理数字类型变量选择
   * 当数字类型条件选择"Variable"模式时，选择具体的数字变量
   * @param {Object|Array} variableOrSelector - 变量对象或选择器路径数组
   * @param {Object} options - 选项对象
   * @param {number} options.blockIndex - 条件块索引
   * @param {number} options.itemIndex - 条件项索引
   * @param {number|null} options.subItemIndex - 子条件项索引，null 表示一级条件
   */
  const handleSelectNumberVariable = (
    variableOrSelector,
    { blockIndex, itemIndex, subItemIndex = null }
  ) => {
    // 如果传过来的是数组（value_selector），则在 variableList 中查找对应完整对象
    let variable = variableOrSelector;
    if (Array.isArray(variableOrSelector)) {
      const findVariable = (nodes, path) => {
        for (const node of nodes) {
          if (node.value_selector && JSON.stringify(node.value_selector) === JSON.stringify(path)) {
            return node;
          }
          if (node.children) {
            const found = findVariable(node.children, path);
            if (found) return found;
          }
        }
        return null;
      };
      variable = findVariable(variableList, variableOrSelector);
    }

    if (!variable) {
      console.warn("未找到对应变量对象", variableOrSelector);
      return;
    }

    // 生成模板字符串，用于变量引用
    const templateValue = `{{#${variable.value_selector.join(".")}#}}`;

    // 根据是子条件还是一级条件，更新不同的数据
    if (subItemIndex !== null) {
      // 二级条件（子变量条件）
      updateChildItem(blockIndex, itemIndex, subItemIndex, (childItem) => {
        childItem.numberVarType = "variable";
        childItem.value = templateValue; // 保留模板字符串
        childItem.numberInputItem = variable;
        childItem.variable_selector = variable.value_selector;
      });
    } else {
      // 一级条件
      updateItem(blockIndex, itemIndex, (item) => {
        item.numberVarType = "variable";
        item.value = templateValue; // 保留模板字符串
        item.numberInputItem = variable;
      });
    }
  };

  /**
   * 处理子变量数字类型选择变化（Variable/Constant）
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {number} childItemIndex - 子条件项索引
   * @param {string} value - 选择的值："variable" 或 "constant"
   */
  const handleChildNumberSelectChange = (blockIndex, itemIndex, childItemIndex, value) => {
    updateChildItem(blockIndex, itemIndex, childItemIndex, (childItem) => {
      childItem.numberVarType = value;

      // 切换时清空旧数据
      childItem.value = "";
      childItem.numberInputItem = null;
      childItem.variable_selector = [];
    });

    // 如果选择变量模式，打开下拉菜单
    if (value === "variable") {
      setNumberDropdownState({
        open: true,
        blockIndex,
        itemIndex,
        subItemIndex: childItemIndex,
      });
    } else {
      // 选择常量模式，关闭下拉菜单
      setNumberDropdownState({
        open: false,
        blockIndex: null,
        itemIndex: null,
        subItemIndex: null,
      });
    }
  };

  /**
   * 处理一级条件数字类型选择变化（Variable/Constant）
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {string} value - 选择的值："variable" 或 "constant"
   */
  const handleNumberSelectChange = (blockIndex, itemIndex, value) => {
    updateItem(blockIndex, itemIndex, (item) => {
      item.numberVarType = value;

      // 切换时清空旧数据
      item.value = "";
      item.numberInputItem = null;
    });

    // 如果选择变量模式，打开下拉菜单
    if (value === "variable") {
      setNumberDropdownState({
        open: true,
        blockIndex,
        itemIndex,
        subItemIndex: null, // 第一层没有 subItemIndex
      });
    } else {
      // 选择常量模式，关闭下拉菜单
      setNumberDropdownState({
        open: false,
        blockIndex: null,
        itemIndex: null,
        subItemIndex: null,
      });
    }
  };

  // ==================== 变量列表处理 ====================

  /**
   * 获取变量选项列表
   * 从上游节点获取可用变量，并标记父子关系，同时过滤出数字类型变量
   */
  const getSelectOptions = () => {
    // 更新 variableId 以强制重新渲染 VariableCascader 组件
    setVariableId(getUuid());
    const arr = getUpstreamVariables(pannerNode.id);
    
    // 标记变量的父子关系
    arr.forEach((p) => {
      p.isParent = true;
      if (p.children.length) {
        p.children.forEach((child) => {
          child.isParent = false;
        });
      }
    });

    setVariableList(arr);
    // 过滤出数字类型变量，用于数字类型条件的选择
    const numberVars = filterNumberVariables(arr);
    setNumberVariableList(numberVars);
  };

  /**
   * 递归收集所有数字类型的变量节点
   * 用于数字类型条件时，只显示数字类型的变量
   * @param {Array} nodes - 变量节点列表
   * @returns {Array} 过滤后的数字类型变量列表
   */
  const filterNumberVariables = (nodes) => {
    if (!Array.isArray(nodes)) return [];

    return nodes
      .map((node) => {
        // 递归处理子节点
        const children = filterNumberVariables(node.children || []);

        // 如果自己是 number 类型，保留该节点
        if (node.variable_type === "number") {
          return { ...node, children };
        }

        // 自己不是 number，但子节点可能有 number，保留该节点
        if (children.length > 0) {
          return { ...node, children };
        }

        // 自己不是 number 且没有子 number → 过滤掉
        return null;
      })
      .filter(Boolean); // 去掉 null
  };

  // ==================== 事件处理 ====================

  /**
   * 运行面板事件
   * 验证条件后，切换到运行面板
   */
  const runPanelEvent = () => {
    const isValid = validateConditions(data);
    if (!isValid) return;
    setPannerNode(props.nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  /**
   * 处理一级条件变量变化
   * 当用户选择或更改条件中的变量时调用
   * @param {Object} val - 选中的变量对象
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   */
  const handleVariableChange = (val, blockIndex, itemIndex) => {
    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));
      const newBlock = newConditions[blockIndex];
      const newItem = newBlock.conditions[itemIndex];
      
      // 变量不是 number 时清空相关值
      if (val.variable_type !== "number") {
        newItem.numberInputItem = null;
      } else {
        newItem.numberVarType = "variable";
      }
      
      // 重置子变量条件和相关属性
      newItem.sub_variable_condition.conditions = [];
      newItem.varType = val.variable_type;
      newItem.variable_selector = val.value_selector;
      newItem.value = "";
      newItem.inputItem = val;

      // 根据变量类型设置默认的关系操作符
      const newRelationOptions = relationOptionsMap[val.variable_type];
      const defaultRelationValue =
        newRelationOptions && newRelationOptions.length > 0 ? newRelationOptions[0].value : "";
      
      // 特殊字段使用固定的关系操作符
      if (val.label === "transfer_method" || val.label === "type") {
        newItem.comparison_operator = typeList[0].value;
      } else {
        newItem.comparison_operator = defaultRelationValue;
      }

      return { ...prevData, cases: newConditions };
    });
  };

  /**
   * 根据条件项获取对应的关系操作符选项
   * 处理特殊字段（extension、transfer_method、type）的特殊情况
   * @param {Object} item - 条件项对象
   * @returns {Array} 关系操作符选项列表
   */
  const processRelationOptions = (item) => {
    if (item.inputItem.label === "extension") {
      return extensionList;
    } else if (item.inputItem.label === "transfer_method" || item.inputItem.label === "type") {
      return typeList;
    } else {
      return relationOptionsMap[item.varType] || textTypeList;
    }
  };

  /**
   * 处理一级条件值变化
   * 用于处理特殊字段（transfer_method、type）的值变化
   * @param {number} blockIndex - 条件块索引
   * @param {number} itemIndex - 条件项索引
   * @param {any} valueOrEvent - 值或事件对象
   */
  const handleFirstValueChange = (blockIndex, itemIndex, valueOrEvent) => {
    // 处理事件对象和直接值两种情况
    const value = valueOrEvent && valueOrEvent.target ? valueOrEvent.target.value : valueOrEvent;

    setData((prevData) => {
      const newConditions = JSON.parse(JSON.stringify(prevData.cases || initCondition));

      const block = newConditions[blockIndex];
      const condition = block.conditions[itemIndex];

      // 更新条件的值
      condition.value = value;

      return { ...prevData, cases: newConditions };
    });
  };


  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={styles["panel_main"]}>
          <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent} isPadding={true}  />
      <div className={pageStyles["panel_main_content"]}>
        {data.cases?.map((block, blockIndex) => (
          <div className={pageStyles["panel-if-content"]} key={blockIndex}>
            <div className={pageStyles["panel-if-title"]}>
              <span className={pageStyles["blue-box"]}>{block.type}</span>
            </div>
            <div className={pageStyles["panel-if-list-container"]}>
              {block.conditions.length > 1 && (
                <div className={pageStyles["panel-and-button-wrapper"]}>
                  <div
                    className={pageStyles["panel-and-button"]}
                    onClick={() => toggleLogicOperator(blockIndex)}
                    style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                  >
                    {block.logical_operator === "or" ? "或" : "且"}
                  </div>
                </div>
              )}
              <div className={pageStyles["panel-if-list-wrapper"]}>
                <div className={pageStyles["panel-if-condition-item-left-border"]}>
                  {block.conditions.map((item, itemIndex) => (
                    <div key={itemIndex} className={pageStyles["panel-if-condition-item"]}>
                      <div
                        className={
                          item.varType === "array[file]"
                            ? pageStyles["panel-if-condition-item-top-array"]
                            : pageStyles["panel-if-condition-item-top"]
                        }
                      >
                        <div
                          className={
                            item.varType === "array[file]"
                              ? pageStyles["panel-if-condition-array-header"]
                              : pageStyles["panel-if-condition-common-header"]
                          }
                        >
                          <VariableCascader
                            key={variableId}
                            data={variableList}
                            clearable={false}
                            style={{ border: "none" }}
                            placeholder='请选择变量'
                            value_selector={item.inputItem?.value_selector}
                            isSingle={false}
                            onChange={(val) => handleVariableChange(val, blockIndex, itemIndex)}
                            labelMaxWidth={100}
                            disabled={readOnly}
                          ></VariableCascader>

                          <div
                            className={pageStyles["panel-if-condition-right"]}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={pageStyles["dividing-line"]}></div>
                            <Select
                              value={item.comparison_operator}
                              variant='borderless'
                              disabled={readOnly}
                              className={pageStyles["panel-if-condition-select"]}
                              // options={relationOptionsMap[item.varType] || textTypeList}
                              options={processRelationOptions(item)}
                              style={{ width: "80px" }}
                              onChange={(value) =>
                                handleRelationChange(blockIndex, itemIndex, value)
                              }
                            ></Select>
                          </div>
                        </div>

                        {item.varType === "array[file]" &&
                          item.comparison_operator !== "empty" &&
                          item.comparison_operator !== "not empty" && (
                            <div className={pageStyles["variable-child-wrapper"]}>
                              {item.sub_variable_condition?.conditions?.length > 1 && (
                                <div className={pageStyles["panel-and-button-wrapper"]}>
                                  <div
                                    className={pageStyles["panel-and-button"]}
                                    onClick={() => toggleChildLogicOperator(blockIndex, itemIndex)}
                                    style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                                  >
                                    {item.sub_variable_condition.logical_operator === "or"
                                      ? "或"
                                      : "且"}
                                  </div>
                                </div>
                              )}
                              {item.sub_variable_condition?.conditions?.length > 0 && (
                                <div className={pageStyles["child-items-list"]}>
                                  {item.sub_variable_condition.conditions.map(
                                    (childItem, childItemIndex) => (
                                      <div
                                        key={childItemIndex}
                                        className={pageStyles["child-item"]}
                                      >
                                        <div className={pageStyles["variable-child-container"]}>
                                          <div className={pageStyles["variable-child-row"]}>
                                            <Select
                                              value={childItem.key}
                                              variant='borderless'
                                              suffixIcon={null}
                                              disabled={readOnly}
                                              options={childVariableOptions}
                                              labelRender={(props) => {
                                                return (
                                                  <span
                                                    style={{
                                                      color: "#3772FE",
                                                      fontWeight: 500,
                                                    }}
                                                  >{`{x} ${props.label}`}</span>
                                                );
                                              }}
                                              style={{ width: 170 }}
                                              onChange={(value) =>
                                                handleChildVariableChange(
                                                  blockIndex,
                                                  itemIndex,
                                                  childItemIndex,
                                                  value
                                                )
                                              }
                                            ></Select>
                                            <div
                                              className={pageStyles["panel-if-condition-right"]}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className={pageStyles["dividing-line"]}></div>
                                              <Select
                                                className={pageStyles["panel-if-condition-select"]}
                                                value={childItem.comparison_operator}
                                                variant='borderless'
                                                disabled={readOnly}
                                                options={childrenRelationOptionsMap[childItem.key]}
                                                style={{ width: 80 }}
                                                onChange={(value) =>
                                                  handleChildRelationChange(
                                                    blockIndex,
                                                    itemIndex,
                                                    childItemIndex,
                                                    value
                                                  )
                                                }
                                              ></Select>
                                            </div>
                                          </div>

                                          <div className={pageStyles["panel-if-condition-bottom"]}>
                                            {childItem.key === "transfer_method" && (
                                              <Select
                                                value={childItem.value}
                                                variant='borderless'
                                                placeholder='请选择'
                                                disabled={readOnly}
                                                options={[
                                                  {
                                                    label: "本地上传",
                                                    value: "local_file",
                                                  },
                                                  { label: "URL", value: "remote_url" },
                                                ]}
                                                suffixIcon={null}
                                                style={{ width: "100%" }}
                                                onChange={(value) =>
                                                  handleChildValueChange(
                                                    blockIndex,
                                                    itemIndex,
                                                    childItemIndex,
                                                    value
                                                  )
                                                }
                                              ></Select>
                                            )}
                                            {childItem.key === "type" && (
                                              <Select
                                                value={childItem.value}
                                                variant='borderless'
                                                disabled={readOnly}
                                                placeholder='请选择'
                                                options={[
                                                  { label: "图片", value: "image" },
                                                  { label: "文档", value: "document" },
                                                  { label: "音频", value: "audio" },
                                                  { label: "视频", value: "video" },
                                                ]}
                                                suffixIcon={null}
                                                style={{ width: "100%" }}
                                                onChange={(value) =>
                                                  handleChildValueChange(
                                                    blockIndex,
                                                    itemIndex,
                                                    childItemIndex,
                                                    value
                                                  )
                                                }
                                              ></Select>
                                            )}
                                            {childItem.key === "size" && (
                                              <div
                                                className={
                                                  pageStyles["panel-condition-number-select"]
                                                }
                                              >
                                                <Select
                                                  value={childItem.numberVarType}
                                                  variant='borderless'
                                                  disabled={readOnly}
                                                  options={[
                                                    { label: "Variable", value: "variable" },
                                                    { label: "Constant", value: "constant" },
                                                  ]}
                                                  style={{ width: 86, height: 20 }}
                                                  onChange={(value) =>
                                                    handleChildNumberSelectChange(
                                                      blockIndex,
                                                      itemIndex,
                                                      childItemIndex,
                                                      value
                                                    )
                                                  }
                                                ></Select>
                                                <span
                                                  className={pageStyles["dividing-line"]}
                                                ></span>
                                                {childItem.numberVarType === "variable" ? (
                                                  <VariableCascader
                                                    key={variableId}
                                                    data={numberVariableList}
                                                    clearable={false}
                                                    disabled={readOnly}
                                                    style={{
                                                      border: "none",
                                                      height: "30px",
                                                      margin: "2px 0",
                                                      width: "96%",
                                                      background: "transparent",
                                                    }}
                                                    // labelMaxWidth={40}
                                                    placeholder='请选择变量'
                                                    value_selector={
                                                      childItem.numberInputItem?.value_selector
                                                    }
                                                    isSingle={true} // 仍然单选
                                                    allowMiddleSelect={false}
                                                    onChange={(val) => {
                                                      handleSelectNumberVariable(val, {
                                                        blockIndex,
                                                        itemIndex,
                                                        subItemIndex: childItemIndex,
                                                      });
                                                    }}
                                                  />
                                                ) : (
                                                  <Input
                                                    className={
                                                      pageStyles["panel-if-condition-input"]
                                                    }
                                                    style={{ height: "34px" }}
                                                    placeholder='输入值'
                                                    variant='borderless'
                                                    type='number'
                                                    value={childItem.value}
                                                    onChange={(event) =>
                                                      handleChildValueChange(
                                                        blockIndex,
                                                        itemIndex,
                                                        childItemIndex,
                                                        event.target.value
                                                      )
                                                    }
                                                    onBlur={(event) =>
                                                      handleChildValueChange(
                                                        blockIndex,
                                                        itemIndex,
                                                        childItemIndex,
                                                        event.target.value
                                                      )
                                                    }
                                                  />
                                                )}
                                              </div>
                                            )}
                                            {childItem.key !== "type" &&
                                              childItem.key !== "transfer_method" &&
                                              childItem.key !== "size" && (
                                                <ContentInput
                                                  key={variableId}
                                                  nodeData={data}
                                                  data={childItem.value}
                                                  minHeight={36}
                                                  bg={"transparent"}
                                                  border={"none"}
                                                  renderType={"url"}
                                                  isHeader={false}
                                                  updateDataEvent={(obj) =>
                                                    handleChildValueChange(
                                                      blockIndex,
                                                      itemIndex,
                                                      childItemIndex,
                                                      obj
                                                    )
                                                  }
                                                  variables={variableList}
                                                  pannerNodeId={pannerNode?.id}
                                                  readOnly={readOnly}
                                                />
                                              )}
                                          </div>
                                        </div>
                                        {!readOnly && (
                                          <img
                                            className={pageStyles["panel-if-condition-item-delete"]}
                                            src='/workflow/if_delete.png'
                                            alt=''
                                            height={16}
                                            width={16}
                                            onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                                            onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                                            onClick={() =>
                                              handleDeleteChildVariable(
                                                blockIndex,
                                                itemIndex,
                                                childItemIndex
                                              )
                                            }
                                          />
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                              <Button
                                className={pageStyles["variable-child-add-button"]}
                                onClick={() => handleAddChildVariable(blockIndex, itemIndex)}
                                disabled={readOnly}
                              >
                                <img
                                  src='/workflow/blue_add.png'
                                  alt=''
                                  width='10'
                                  height='10'
                                ></img>
                                添加子变量
                              </Button>
                            </div>
                          )}
                        {item.varType === "number" &&
                          item.comparison_operator !== "empty" &&
                          item.comparison_operator !== "not empty" && (
                            <>
                              <div className={pageStyles["if_border"]}></div>
                              <div className={pageStyles["panel-condition-number-select"]}>
                                <Select
                                  value={item.numberVarType}
                                  disabled={readOnly}
                                  variant='borderless'
                                  options={[
                                    { label: "Variable", value: "variable" },
                                    { label: "Constant", value: "constant" },
                                  ]}
                                  style={{ width: 120, height: 20 }}
                                  onChange={(value) =>
                                    handleNumberSelectChange(blockIndex, itemIndex, value)
                                  }
                                ></Select>
                                <span className={pageStyles["dividing-line"]}></span>
                                {item.numberVarType === "variable" ? (
                                  <VariableCascader
                                    key={variableId}
                                    data={numberVariableList}
                                    disabled={readOnly}
                                    clearable={false}
                                    placeholder='请选择变量'
                                    value_selector={item.numberInputItem?.value_selector}
                                    isSingle={true} // 数字类型只选择单个值
                                    allowMiddleSelect={false}
                                    onChange={(val) => {
                                      handleSelectNumberVariable(val, {
                                        blockIndex,
                                        itemIndex,
                                        subItemIndex: null, // 一级条件
                                      });
                                    }}
                                    style={{ border: "none" }}
                                  />
                                ) : (
                                  <Input
                                    className={pageStyles["panel-if-condition-input"]}
                                    placeholder='输入值'
                                    variant='borderless'
                                    value={item.value}
                                    type='number'
                                    onChange={(event) =>
                                      handleValueChange(blockIndex, itemIndex, event.target.value)
                                    }
                                    onBlur={(event) =>
                                      handleValueChange(blockIndex, itemIndex, event.target.value)
                                    }
                                  ></Input>
                                )}
                              </div>
                            </>
                          )}
                        {item.inputItem.label === "transfer_method" && (
                          <>
                            <div className={pageStyles["if_border"]}></div>
                            <Select
                              value={item.value}
                              variant='borderless'
                              placeholder='请选择'
                              disabled={readOnly}
                              options={[
                                {
                                  label: "本地上传",
                                  value: "local_file",
                                },
                                { label: "URL", value: "remote_url" },
                              ]}
                              suffixIcon={null}
                              style={{ width: "100%", height: 22 }}
                              onChange={(value) =>
                                handleFirstValueChange(blockIndex, itemIndex, value)
                              }
                            ></Select>
                          </>
                        )}
                        {item.inputItem.label === "type" && (
                          <>
                            <div className={pageStyles["if_border"]}></div>
                            <Select
                              value={item.value}
                              variant='borderless'
                              disabled={readOnly}
                              placeholder='请选择'
                              options={[
                                { label: "图片", value: "image" },
                                { label: "文档", value: "document" },
                                { label: "音频", value: "audio" },
                                { label: "视频", value: "video" },
                              ]}
                              suffixIcon={null}
                              style={{ width: "100%", height: 22 }}
                              onChange={(value) =>
                                handleFirstValueChange(blockIndex, itemIndex, value)
                              }
                            ></Select>
                          </>
                        )}

                        {item.varType !== "number" &&
                          item.varType !== "array[file]" &&
                          item.varType !== "file" &&
                          item.comparison_operator !== "empty" &&
                          item.comparison_operator !== "not empty" &&
                          item.inputItem.label !== "transfer_method" &&
                          item.inputItem.label !== "type" && (
                            <>
                             <div className={pageStyles["if_border"]}></div>
                              <ContentInput
                                key={variableId}
                                nodeData={data}
                                data={item.value}
                                minHeight={36}
                                bg={"transparent"}
                                border={"none"}
                                renderType={"url"}
                                isHeader={false}
                                updateDataEvent={(obj) =>
                                  handleValueChange(blockIndex, itemIndex, obj)
                                }
                                variables={variableList}
                                pannerNodeId={pannerNode?.id}
                                readOnly={readOnly}
                              />
                            </>
                          )}
                      </div>
                      {!readOnly && (
                        <div className='node_delete_icon' style={{marginTop: '6px'}}>
                        <img
                          className={pageStyles["panel-if-condition-item-delete"]}
                          src='/workflow/if_delete.png'
                          onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                          onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                          alt='删除条件'
                          width={16}
                          height={16}
                          onClick={() => deleteConditionItem(blockIndex, itemIndex)}
                        ></img>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={pageStyles["panel-condition-option-btn-wrapper"]}>
              <AddCondition
                data={variableList}
                clearable={false}
                disabled={readOnly}
                style={{ border: "none" }}
                placeholder='请选择变量'
                isSingle={false} // 数字类型只选择单个值
                onSelectChange={(val) => {
                  handleSelectNewCondition(val, blockIndex);
                }}
              />
              {(block.type === "ELIF" || (block.type === "IF" && hasElifBlock)) && (
                <Button type='text' onClick={() => deleteBlock(blockIndex)} disabled={readOnly}>
                  <img src='/workflow/if_delete.png' alt='' width={12} height={12} />
                  移除
                </Button>
              )}
            </div>
            <Divider style={{ marginBottom: 6 }} />
          </div>
        ))}
        <Button
          className={pageStyles["add-elseif-condition-btn"]}
          onClick={addConditionBlock}
          variant='filled'
          disabled={readOnly}
        >
          <img src='/workflow/light_add.png' alt='' width='12' height='12'></img>
          添加ELIF
        </Button>
        <Divider size='small' />
        <div className={pageStyles["panel-if-title"]} style={{ margin: "20px 0" }}>
          <span className={pageStyles["blue-box-else"]}>ELSE</span>
          <span className={pageStyles["ml-12"]}>用于定义当 if 条件不满足时应执行的逻辑。</span>
        </div>
      </div>
    </div>
  );
});

export default ConditionalBranchPanel;
