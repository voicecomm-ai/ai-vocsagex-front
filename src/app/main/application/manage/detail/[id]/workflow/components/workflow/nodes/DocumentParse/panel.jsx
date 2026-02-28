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
  Form,
  Input,
  message,
} from "antd";
import styles from "../node.module.css";
import docStyles from "./docParse.module.css";
import Variable from "../../../Dialog/Variable";
import VariableCascader from "../../../variableCascader";
import { useNodesInteractions, useNodeData } from "../../hooks";
import nodeStyles from "../node.module.css";
import { getUuid } from "@/utils/utils";
import { useReactFlow } from "@xyflow/react";
import { useStore } from "@/store/index";
import RunHeader from "../../components/RunHeader";  
const { TextArea } = Input;

/**
 * 文档解析节点面板组件
 * 用于配置文档解析节点的输入变量、节点信息等
 */
const DocParsePanel = forwardRef((props, ref) => {
  // ==================== Store 和 Hooks ====================
  // 从全局 store 获取状态和方法
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    setDocInputData,
    docInputData,
    panelVisible,
    pannerNode,
    changeId,
  } = useStore((state) => state);
  
  // 节点交互相关 hooks
  const { updateNodeDetail } = useNodesInteractions();
  const { getUpstreamVariables, getNodeById, renameVariableReferences } = useNodeData();
  
  // React Flow 实例，用于获取节点数据
  const reactFlowInstance = useReactFlow();
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    hideModal,
  }));

  // ==================== Refs ====================
  const formRef = useRef(null); // 表单引用
  const variableRef = useRef(null); // 变量编辑弹窗引用

  // ==================== State ====================
  const [variableId, setVariableId] = useState(null); // 变量选择器的 key，用于强制重新渲染
  const [isEditing, setIsEditing] = useState(false); // 是否正在编辑节点标题
  const [data, setData] = useState({}); // 节点数据
  const [variableList, setVariableList] = useState([]); // 可选的变量列表（上游节点的文件类型变量）
  const [title, setTitle] = useState(""); // 节点标题
  const [inputItem, setInputItem] = useState(null); // 当前选中的输入变量项
  const [searchKeyword, setSearchKeyword] = useState(""); // 搜索关键字（用于搜索文档属性）
  const [showDropdown, setShowDropdown] = useState(false); // 下拉菜单是否显示

  // ==================== Effects ====================
  /**
   * 当面板显示时，初始化节点数据
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      const nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      setTitle(nodeData.data.title);
      getSelectOptions(nodeData.data);
      if (nodeData.data?.inputItem) {
        setInputItem(nodeData.data.inputItem);
      }
    }
  }, [panelVisible]);

  /**
   * 当节点 ID 变化时，重新加载节点数据
   */
  useEffect(() => {
    if (panelVisible) {
      const nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      getSelectOptions(nodeData.data);
    }
  }, [changeId]);

  // ==================== 事件处理函数 ====================
  /**
   * 关闭弹窗
   */
  const hideModal = () => {
    // 此方法通过 useImperativeHandle 暴露给父组件
  };

  /**
   * 关闭面板事件
   * 清空当前选中的节点并隐藏面板
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  /**
   * 获取下拉选项值
   * 从上游节点中筛选出文件类型的变量，用于用户输入选择
   * @param {Object} data - 节点数据
   */
  const getSelectOptions = (data) => {
    // 生成新的 key，强制重新渲染变量选择器
    setVariableId(getUuid());
    
    // 支持的文件类型变量
    const varTypes = ["file", "array[file]"];
    
    // 获取上游节点的所有变量
    const arr = getUpstreamVariables(pannerNode.id);
    const filterArr = [];
    let inputData = null;
    
    // 如果已有选中的输入项，保留其数据
    if (data?.inputItem) {
      inputData = data.inputItem;
    }
    
    // 遍历上游变量，筛选出文件类型的变量
    arr.forEach((first) => {
      if (first?.children?.length) {
        // 过滤出文件类型的变量
        const children = first.children
          .filter((item) => varTypes.includes(item.variable_type))
          .map((second) => {
            // 如果当前项是已选中的输入项，更新其文件类型限制信息
            if (inputData && second.variable_name === inputData.variable_name) {
              inputData.allowed_file_types = second.allowed_file_types;
              // 如果是自定义文件类型，还需要保存允许的扩展名
              if (second.allowed_file_types&&second.allowed_file_types.includes("custom")) {
                inputData.allowed_file_extensions = second.allowed_file_extensions;
              }
            }
            // 清除子级，因为文件变量不需要更深层的结构
            second.children = null;
            return second;
          });
        
        // 只有当有符合条件的子项时，才保留该父级
        first.children = children.length ? children : null;
      }
      
      // 将有效的父级添加到过滤数组中
      if (first.children) {
        filterArr.push(first);
      }
    });
    
    setInputItem(inputData);
    setVariableList(filterArr);
  };

  /**
   * 节点描述改变事件
   * @param {Event} e - 输入事件对象
   */
  const handleNodeDescChange = (e) => {
    let desc = e.target.value;
    // 限制描述最大长度为 200 字符
    if (e.target.value && e.target.value.length > 200) {
      desc = e.target.value.slice(0, 200);
    }
    const obj = {
      ...data,
      desc,
    };
    setData({ ...obj });
    updateNodeDetailEvent(obj);
  };

  /**
   * 更新节点详情
   * @param {Object} data - 要更新的节点数据
   */
  const updateNodeDetailEvent = (data) => {
    const newData = {
      nodeId: props.nodeData.id,
      data: { ...data, id: props.nodeData.id },
    };
    setData(newData.data);
    updateNodeDetail(newData);
  };

  /**
   * 运行面板事件
   * 验证是否已选择输入变量，然后打开运行面板
   */
  const runPanelEvent = async () => {
    if (!inputItem) {
      message.error("请选择变量");
      return;
    }
    
    // 设置当前节点并打开运行面板
    setPannerNode(props.nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  /**
   * 选择输入变量项
   * @param {Object} child - 选中的变量项
   */
  const selectItem = (child) => {
    console.log(child, 'child')
    setInputItem(child);
    setDocInputData(child);
    setShowDropdown(false);
    setSearchKeyword("");
    
    // 构建变量选择器路径
    const variable_selector = [child.nodeId, child.variable_name];
    data.variable_selector = child?.value_selector;
    // 标记是否为数组文件类型
    data.is_array_file = child.variable_type === "array[file]";
    
    const obj = {
      ...data,
      inputItem: child,
    };
    updateNodeDetailEvent(obj);
  };

  /**
   * 清空输入变量值
   */
  const clearValueEvent = () => {
    setInputItem(null);
    setDocInputData(null);
    setShowDropdown(false);
    setSearchKeyword("");
    
    // 清空变量选择器
    const variable_selector = [];
    data.variable_selector = variable_selector;
    
    const obj = {
      ...data,
      inputItem: null,
    };
    updateNodeDetailEvent(obj);
  };

  /**
   * 保存节点标题
   * @param {string} value - 标题值
   */
  const saveTitle = (value) => {
    if (!value.trim()) {
      setTitle(data.title);
      message.warning("节点名称不能为空");
      return;
    }
    
    const obj = {
      ...data,
      title: value,
    };
    updateNodeDetailEvent(obj);
  };

  /**
   * 节点标题改变事件
   * @param {Event} e - 输入事件对象
   */
  const handleNodeTitleChange = (e) => {
    let title = e.target.value;
    // 限制标题最大长度为 50 字符
    if (e.target.value && e.target.value.length > 50) {
      title = e.target.value.slice(0, 50);
    }
    setTitle(title);
  };

  /**
   * 标题输入框失去焦点时保存标题并关闭编辑状态
   */
  const handleTitleBlur = () => {
    saveTitle(title);
    setIsEditing(false);
  };

  /**
   * 标题输入框获得焦点时进入编辑状态
   */
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  /**
   * 更新节点变量数据
   * @param {Object} validatorObj - 变量对象
   * @param {string} action - 操作类型：'add' 添加 | 'update' 更新
   */
  const updateVariableEvent = (validatorObj, action) => {
    let variableArr = data.variables || [];

    // 检查变量名是否重复
    const isDuplicate = variableArr.some((v) => {
      // 更新操作时排除自身
      if (action === "update" && v.id === validatorObj.id) return false;
      return v.variable === validatorObj.variable;
    });

    if (isDuplicate) {
      message.warning("变量名称重复");
      return;
    }

    if (action === "add") {
      // 添加新变量
      variableArr.push(validatorObj);
    } else {
      // 更新现有变量
      const index = variableArr.findIndex((i) => i.id === validatorObj.id);
      const oldVarName = variableArr[index].variable;
      variableArr[index] = validatorObj;

      // 如果变量名发生变化，需要重命名所有引用
      if (oldVarName !== validatorObj.variable) {
        renameVariableReferences(props.nodeData.id, oldVarName, validatorObj.variable);
      }
    }

    const obj = {
      ...data,
      variables: variableArr,
    };
    setData(obj);
    updateNodeDetailEvent(obj);
    // 关闭变量编辑弹窗
    variableRef.current.modelCancelEvent();
  };
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  // ==================== Render ====================
  return (
    <div className={docStyles["panel_main"]}>
      {/* 面板头部：节点图标、标题、描述 */}
      <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}  isPadding={true}   />

      {/* 面板内容区域 */}
      <>
        {/* 用户输入配置区域 */}
        <div className={docStyles["doc_parse_content_input"]}>
          <div className={docStyles["start_panel_variable_title"]}>
            <span className={docStyles["start_panel_variable_title_requir"]}>*</span>用户输入
          </div>
          <Form
            ref={formRef}
            name='basic'
            layout='vertical'
            disabled={readOnly}
            wrapperCol={{ span: 24 }}
            initialValues={{
              maxLength: 48,
              required: true,
            }}
            autoComplete='off'
          >
            <Form.Item
              name='name'
              style={{ position: "relative", marginBottom: "4px" }}
            >
              <VariableCascader
                key={variableId}
                onChange={selectItem}
                disabled={readOnly}
                value_selector={data.inputItem?.value_selector}
                data={variableList}
              />
            </Form.Item>
            {/* 支持的文件类型说明 */}
            <div className={docStyles["file_suport_types"]}>
              支持的文件类型：txt、 markdown、 mdx、 pdf、 html、 xlsx、 docx、 csv、 md、 htm。
            </div>
          </Form>
        </div>
        
        {/* 输出信息展示区域 */}
        <div className={docStyles["doc_parse_content_output"]}>
          <div style={{ margin: "16px 0 6px 0", color: "#101A28", fontSize: "14px" }}>输出</div>
          <div className={docStyles["doc_parse_content_output_desc"]}>
            <div
              className={docStyles["display_flex"]}
              style={{
                marginBottom: 2,
                lineHeight: "20px",
              }}
            >
              <span style={{ color: "#364052", marginRight: 8, fontSize: 14, fontWeight: 500 }}>
                text
              </span>
              <span>{data.is_array_file?"array[string]":"string"}</span>
            </div>
            <div>提取的文本</div>
          </div>
        </div>
      </>
      
      {/* 变量编辑弹窗组件 */}
      <Variable
        ref={variableRef}
        variables={data.variables}
        updateVariableEvent={updateVariableEvent}
      />
    </div>
  );
});

export default DocParsePanel;
