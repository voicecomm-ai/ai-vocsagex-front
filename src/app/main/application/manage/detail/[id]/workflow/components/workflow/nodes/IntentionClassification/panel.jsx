"use client";

/**
 * 意图分类节点配置面板组件
 * 
 * 功能说明：
 * 1. 管理节点的标题和描述
 * 2. 选择和管理AI模型
 * 3. 配置用户输入变量
 * 4. 管理意图分类列表（添加、删除、编辑）
 * 5. 编辑分类说明（支持全屏编辑）
 * 6. 显示输出变量信息
 */

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Input,
  Select,
  message,
  Button,
} from "antd";
import { useReactFlow } from "@xyflow/react";
import Image from "next/image";
import "../reset.css";
import styles from "./style.module.css";
import codeStyles from "../CodeExtractor/runCode.module.css";
import { getAgentModelList } from "@/api/agent";
import { useStore } from "@/store/index";

const { TextArea } = Input;
import { useNodeData, useNodesInteractions } from "../../hooks";
import { getUuid } from "@/utils/utils";
import VariableCascader from "../../../variableCascader";
import ContentInput from "./ContentInput";
import RunHeader from "../../components/RunHeader";  
import ModelSelect from '../../../model-select';
/**
 * 创建空的意图分类项模板
 * @returns {Object} 包含name和id的分类项对象
 */
const createPromptItemTemplate = () => ({
  name: "",
  id: getUuid(),
});

const IntentionClassificationPanel = forwardRef((props, ref) => {
  // ==================== Hooks 和 Store ====================
  const { updateNodeDetail } = useNodesInteractions();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const reactFlowInstance = useReactFlow();
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
  /** 节点数据对象，包含所有配置信息 */
  const [dataObj, setDataObj] = useState({});
  /** 上游变量列表，用于变量选择器 */
  const [variableList, setVariableList] = useState([]);
  /** 模型下拉框的打开/关闭状态 */
  const [open, setOpen] = useState(false);
  /** 可用的模型列表 */
  const [modelList, setModelList] = useState([]);
  /** 当前选中的模型ID */
  const [modelId, setModelId] = useState(0);
  /** 当前选中的模型详细信息 */
  const [modelInfo, setModelInfo] = useState(null);
  /** 分类说明的字数统计 */
  const [wordCount, setWordCount] = useState(0);
  /** 变量选择器的key，用于强制重新渲染 */
  const [variableId, setVariableId] = useState(null);
  /** 上游变量数据，传递给ContentInput组件 */
  const [variableData, setVariableData] = useState([]);
  /** 标题输入框是否处于编辑状态（聚焦） */
  const [isEditing, setIsEditing] = useState(false);
  /** 是否全屏显示分类说明编辑器 */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** 全屏编辑时的数据 */
  const [fullscreenData, setFullscreenData] = useState({});
  /** 首次渲染标记，用于跳过selectModelItem的初始调用 */
  const firstRenderRef = useRef(true);

  // ==================== 核心函数 ====================
  
  /**
   * 渲染并更新上游变量
   * 当节点连接关系变化时，重新获取可用的上游变量
   */
  const handleRenderVariable = () => {
    if (!pannerNode?.data?.id) return;
    const upstreamVariables = getUpstreamVariables(pannerNode.data.id);
    setVariableData(upstreamVariables);
    getSelectOptions(pannerNode.data);
    // 更新key以强制重新渲染VariableCascader组件
    setVariableId(getUuid());
  };

  /**
   * 更新节点详情（防抖处理）
   * @param {Object} nextData - 新的节点数据
   */
  const updateNodeDetailDebounced = (nextData) => {
    if (pannerNode && nextData) {
      updateNodeDetail({
        nodeId: pannerNode.id,
        data: { ...nextData, id: pannerNode.id },
      });
    }
  };

  // ==================== useEffect 生命周期 ====================
  
  /**
   * 监听changeId变化，重新渲染变量
   * 当工作流节点连接关系发生变化时触发
   */
  useEffect(() => {
    handleRenderVariable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeId]);

  /**
   * 监听面板可见性和节点变化，初始化数据
   * 当面板打开时，从节点数据中恢复所有配置
   */
  useEffect(() => {
    if (panelVisible && pannerNode) {
      const nodeData = getNodeById(pannerNode.data.id);
      if (!nodeData) return;

      // 渲染变量
      handleRenderVariable();
      
      // 恢复模型信息
      setModelInfo(nodeData.data?.modelInfo);
      setModelId(nodeData.data?.model_id);
      
      // 恢复节点数据
      setDataObj(nodeData.data);
      
      // 初始化变量选项和模型列表
      getSelectOptions(nodeData.data);
      getAgentModelListEvent(nodeData.data);
      
      // 注意：selectModelItem会在首次渲染时跳过，避免重复更新
      if (nodeData.data?.modelInfo) {
        firstRenderRef.current = true;
        selectModelItem(nodeData.data?.modelInfo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelVisible]);


  // ==================== 事件处理函数 ====================
  
  /**
   * 处理节点标题变化
   * @param {Event} e - 输入事件
   */
  const handleNodeTitleChange = (e) => {
    const newData = { ...dataObj, title: e.target.value };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 处理节点描述变化
   * @param {Event} e - 输入事件
   */
  const handleNodeDescChange = (e) => {
    const newData = { ...dataObj, desc: e.target.value };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 处理意图分类文本变化
   * @param {string} eventStr - 新的分类文本
   * @param {Object} itemPar - 要更新的分类项
   */
  const handleClassesTextChange = (eventStr, itemPar) => {
    const updatedClasses = (dataObj.classes || []).map((item) =>
      item.id === itemPar.id ? { ...item, name: eventStr } : item
    );
    const newData = { ...dataObj, classes: updatedClasses };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 删除指定的意图分类
   * @param {Object} itemPar - 要删除的分类项
   */
  const handleDeleteclassification = (itemPar) => {
    if (readOnly) {
      message.error("无操作权限");
      return;
    }
    const updatedClasses = (dataObj.classes || []).filter((item) => item.id !== itemPar.id);
    const newData = { ...dataObj, classes: updatedClasses };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 添加新的意图分类
   * @param {Event} event - 点击事件
   */
  const handleAddclassification = (event) => {
    event.stopPropagation();
    const updatedClasses = [
      ...(Array.isArray(dataObj.classes) ? dataObj.classes : []),
      createPromptItemTemplate(),
    ];
    const newData = { ...dataObj, classes: updatedClasses };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 处理用户输入变量选择
   * @param {Object} item - 选中的变量项
   */
  const handleVariableSelect = (item) => {
    const newData = { ...dataObj, query_variable_selector: item.value_selector };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  // ==================== 数据处理函数 ====================
  
  /**
   * 处理并格式化上游变量选项
   * 为变量树结构添加ID，并处理文件类型相关的配置
   * @param {Object} data - 节点数据，可能包含codeInputs
   */
  const getSelectOptions = (data) => {
    if (!pannerNode?.id) return;
    
    const arr = getUpstreamVariables(pannerNode.id);
    const inputData = data?.codeInputs || null;

    // 遍历变量树，为每个层级添加唯一ID
    arr.forEach((first, index) => {
      first.id = `first-${index}`;
      
      if (first?.children?.length) {
        first.children.forEach((second, idx) => {
          second.id = `second-${idx}`;
          
          // 如果存在codeInputs，同步文件类型配置
          if (inputData) {
            const findItemIndex = inputData.findIndex(
              (item) => item.variable_name === second.variable_name
            );
            if (findItemIndex !== -1) {
              inputData[findItemIndex].allowed_file_types = second.allowed_file_types;
              if (second.allowed_file_types?.includes("custom")) {
                inputData[findItemIndex].allowed_file_extensions = second.allowed_file_extensions;
              }
            }
          }
          
          // 处理第三层变量
          if (second?.children?.length) {
            second.children.forEach((third, i) => {
              third.id = `third-${i}`;
              third.type = third.variable_type === "string" ? "text-input" : "number";
            });
          }
        });
      }
    });
    console.log(arr,'测试属于局');
    setVariableList(arr);
  };

  /**
   * 获取可用的AI模型列表
   * 只获取支持分类任务的模型（classification为1或2）
   * @param {Object} initData - 初始化数据（未使用，保留以兼容现有调用）
   */
  const getAgentModelListEvent = (initData) => {
    const reqParams = {
      type: 1,
      tagIdList: [1, 2, 3, 6, 9],
      isShelf: 1, // 只获取已上架的模型
      isOr: 1,
    };
    
    getAgentModelList(reqParams).then((res) => {
      const data = res.data || [];
      // 过滤出支持分类任务的模型（classification为1或2）
      const filteredModelList = data.filter(
        (model) => model.classification === 1 || model.classification === 2
      );
      
      setModelList(filteredModelList || []);
      // 保持当前选中的模型ID
      setModelId(dataObj.model_id);
    });
  };

  // ==================== 组件方法暴露 ====================
  
  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  /**
   * 显示模态框（保留接口，实际功能待实现）
   */
  const showModal = async () => {
    // 预留接口
  };

  /**
   * 隐藏模态框
   */
  const hideModal = () => {
    setOpen(false);
  };

  // ==================== 面板控制函数 ====================
  
  /**
   * 关闭配置面板
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    setPanelVisible(false);
  };

  /**
   * 运行节点测试
   * 验证必填项后打开运行面板
   */
  const runPanelEvent = () => {
    // 验证模型是否已选择
    if (!dataObj.model_id) {
      message.error("请选择模型");
      return;
    }
    
    // 验证变量是否已选择
    if (!dataObj.query_variable_selector) {
      message.error("请选择变量");
      return;
    }
    
    // 验证所有意图分类是否已填写
    const notFilledClasses = (dataObj.classes || []).some((item) => !item.name?.trim());
    if (notFilledClasses) {
      message.error("请填写完整意图分类");
      return;
    }
    
    // 打开运行面板
    setPannerNode(props.nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  /**
   * 处理全屏编辑切换
   * @param {Object} data - 全屏编辑时的数据
   * @param {number} index - 索引（未使用，保留以兼容现有调用）
   */
  const handleFullscreenEvent = (data, index) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
  };

  /**
   * 选择模型
   * 首次渲染时跳过，避免初始化时的重复更新
   * @param {Object} model - 选中的模型对象
   */
  const selectModelItem = (model) => {
    // 首次渲染时跳过，避免在useEffect中重复更新
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    
    if (!model || !pannerNode) return;
    
    setModelInfo(model);
    setModelId(model.id);

    const newData = {
      ...pannerNode.data,
      model_id: model.id,
      model_name: model.name,
      modelInfo: model,
    };
    setDataObj(newData);
    setOpen(false);
    updateNodeDetailDebounced(newData);
  };

  /**
   * 控制模型选择下拉框的打开/关闭
   * @param {boolean} e - 是否打开
   */
  const openSelect = (e) => {
    setOpen(e);
  };

  /**
   * 处理分类说明字数变化
   * @param {number} count - 当前字数
   */
  const handleWordCountChange = (count) => {
    setWordCount(count);
  };

  /**
   * 复制分类说明到剪贴板
   */
  const handleCopy = () => {
    if (readOnly) return;
    const textToCopy = dataObj.instruction || "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      message.success("复制成功");
    }).catch(() => {
      message.error("复制失败");
    });
  };

  // ==================== 渲染辅助函数 ====================
  
  /**
   * 渲染模型选择器的标签（显示当前选中的模型）
   * @returns {JSX.Element} 模型标签或提示文本
   */
  const labelRender = () => {
    if (!modelInfo) {
      return <span>请选择模型</span>;
    }
    
    return (
      <div className={codeStyles["model_label_render"]}>
        {modelInfo.iconUrl && (
          <img
            alt={modelInfo.name || "模型图标"}
            className={codeStyles["model_label_render_img"]}
            src={process.env.NEXT_PUBLIC_API_BASE + modelInfo.iconUrl}
          />
        )}
        <div className={codeStyles["model_label_render_title"]}>{modelInfo.name}</div>
        {modelInfo.classificationName && (
          <div className={codeStyles["model_label_render_type"]}>
            {modelInfo.classificationName}
          </div>
        )}
        {modelInfo.tagList && modelInfo.tagList.length > 0 && (
          <div className={codeStyles["model_label_render_tag"]}>
            {modelInfo.tagList.map((tag) => tag.name).join(",")}
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染模型选择下拉框的选项列表
   * @param {HTMLElement} originalElement - 原始元素（未使用）
   * @returns {JSX.Element} 模型选项列表
   */
  const popupRender = (originalElement) => {
    return (
      <div>
        {modelList.map((model) => {
          const isSelected = model.id === dataObj.model_id;
          return (
            <div
              key={model.id}
              className={`${codeStyles["model_select_item"]} ${
                isSelected ? styles["model_select_item_selected"] : ""
              }`}
              onClick={() => selectModelItem(model)}
            >
              {model.iconUrl && (
                <img
                  alt={model.name || "模型图标"}
                  className={codeStyles["model_label_render_img"]}
                  src={process.env.NEXT_PUBLIC_API_BASE + model.iconUrl}
                />
              )}
              <div className={codeStyles["model_label_render_title"]}>{model.name}</div>
              {model.classificationName && (
                <div className={codeStyles["model_label_render_type"]}>
                  {model.classificationName}
                </div>
              )}
              {model.tagList && model.tagList.length > 0 && (
                <div className={codeStyles["model_label_render_tag"]}>
                  {model.tagList.map((tag) => tag.name).join(",")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * 更新分类说明数据
   * @param {string} dataParValue - 新的分类说明内容
   */
  const updateDataEvent = (dataParValue) => {
    const newData = {
      ...dataObj,
      instruction: dataParValue,
    };
    setDataObj(newData);
    updateNodeDetailDebounced(newData);
  };

  const handleSelectModal = (model) => {
    selectModelItem(model);
 
  }
  const updateNodeDetailEvent = (obj) => {
    setDataObj(obj);
    updateNodeDetailDebounced(obj);
  }
  // ==================== 渲染组件 ====================
  const updateNodeDataByHeader =(obj)=>{
    setDataObj(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={styles["panel_main"]}>
      {/* 面板头部：标题、描述和操作按钮 */}
      <RunHeader data={dataObj} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}  isPadding={true}   />
      {/* 面板主体内容 */}
      <div className={styles["panel_main_con"]}>
        {/* 模型选择区域 */}
        <div className={styles["panel_main_con_model"]}>
          <div className={styles["panel_main_con_modeltxt"]}>
            <span className="span_required">*</span>
            <span>模型</span>
          </div>
          <div className={styles["panel_main_con_modelsel"]} style={{ position: "relative" }}>
          <ModelSelect
                modelId={modelId}
                model={modelInfo}
                modelList={modelList}
                updateModelSelect={handleSelectModal}
                disabled={readOnly}
              /> 
          </div>
        </div>
       
        {/* 用户输入变量选择区域 */}
        <div className={styles["panel_main_con_query"]}>
          <div className={styles["panel_main_con_modeltxt"]} style={{ marginBottom: 6 }}>
            <span className='span_required'>*</span>
            <span>用户输入</span>
          </div>
          <VariableCascader
            data={variableList}
            value_selector={dataObj.query_variable_selector}
            onChange={handleVariableSelect}
            disabled={readOnly}
            key={variableId}
            
          />
        </div>
        {/* 意图分类管理区域 */}
        <div className={styles["panel_main_con_inputvar"]}>
          <div className={styles["panel_main_con_inputvarfenlei"]}>
            <div>
              <span className='span_required'>*</span>
              <span>意图分类</span>
            </div>
            <Button
              type='text'
              onClick={handleAddclassification}
              className={styles["panel_main_con_inputvarfenlei_add"]}
              disabled={readOnly}
            >
              <img src='/workflow/add.png' height={12} width={12} alt="添加分类" /> 添加
            </Button>
          </div>
          {/* 遍历渲染所有意图分类项 */}
          {dataObj.classes?.map((item, index) => {
            return (
              <div key={item.id || index}>
                <div className={styles["intent-classify-wrapper"]}>
                  <span className={styles["intent-classify-index"]}>{index + 1}</span>
                  <TextArea
                    rows={1}
                    variant="borderless"
                    className={styles["intent-classify-textarea"]}
                    autoSize={{ minRows: 1, maxRows: 5 }}
                    placeholder='请输入分类内容'
                    value={item.name}
                    onChange={(event) => handleClassesTextChange(event.target.value, item)}
                    disabled={readOnly}
                  ></TextArea>
                  {!readOnly && (
                    <div  className='node_delete_icon'>
                    <img
                      src='/workflow/if_delete.png'
                      width='16'
                      height='16'
                      onMouseEnter={(e) => (e.currentTarget.src = "/workflow/common/delete_hover.png")}
                      onMouseLeave={(e) => (e.currentTarget.src = "/workflow/common/delete.png")}
                      alt="删除分类"
                     
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDeleteclassification(item)}
                    />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles["divider"]}></div>
        <div className={styles["panel_main_con_inputvar"]}>
          <div className={styles["panel_main_con_inputvarfenlei"]}>
            <span>分类说明</span>
            <div className={styles.contentInput_header_right}>
              <div className={styles.contentInput_header_right_wordCount}>{wordCount}</div>
              <div className={styles.contentInput_dividing_line}></div>
              <img
                className={styles.contentInput_header_right_copy}
                src='/workflow/common/copy.png'
                alt=''
                style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                onClick={handleCopy}
              />

              <img
                className={styles.contentInput_header_right_copy}
                src='/workflow/common/full.png'
                alt=''
                onClick={handleFullscreenEvent}
              />
            </div>
          </div>
          {/* 当前使用的ContentInput实现 - 传递完整的dataObj和variableData */}
          {dataObj && Object.keys(dataObj).length > 0 && (
            <ContentInput
              key={variableId}
              handleFullscreenEvent={handleFullscreenEvent}
              nodeData={dataObj}
              updateDataEvent={(key, value) => {
                updateDataEvent(value);
              }}
              data={dataObj}
              variables={variableData}
              isFullscreen={isFullscreen}
              content={fullscreenData}
              pannerNodeId={pannerNode?.id}
              readOnly={readOnly}
              countChange={handleWordCountChange}
            />
          )}
        </div>
        {/* 输出变量展示区域 - 显示节点的输出变量信息 */}
        <div className={styles["panel_main_con_outputvar"]}>
          <div className={styles["panel_main_con_inputvarfenlei"]}>输出</div>
          <ul className={styles["panel_main_output_con_ul"]}>
            <li className={styles["panel_main_output_con_ul_li"]}>
              <div className={styles["main_output_con_ul_li_top"]}>
                {/* 输出变量名 */}
                <span className={styles["main_output_con_ul_li_topa"]}>class_name</span>
                {/* 输出变量类型 */}
                <span className={styles["main_output_con_ul_li_topb"]}>string</span>
              </div>
              {/* 输出变量描述 */}
              <div className={styles["main_output_con_ul_li_bottom"]}>分类名称</div>
            </li>
          </ul>
        </div>
      </div>
      {/* 全屏编辑模式 - 当isFullscreen为true时显示 */}
      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          <div className={styles["panel_main_con_inputvarfenlei"]}>
            <span>分类说明</span>
            <div className={styles.contentInput_header_right}>
              {/* 字数统计显示 */}
              <div className={styles.contentInput_header_right_wordCount}>{wordCount}</div>
              {/* 复制按钮 */}
              <img
                className={styles.contentInput_header_right_copy}
                src='/workflow/common/copy.png'
                alt='复制'
                style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
                onClick={handleCopy}
              />
              {/* 退出全屏按钮 */}
              <img
                className={styles.contentInput_header_right_copy}
                src='/workflow/common/full.png'
                alt='退出全屏'
                onClick={handleFullscreenEvent}
              />
            </div>
          </div>

          {/* 全屏模式下的ContentInput组件 */}
          <ContentInput
            handleFullscreenEvent={handleFullscreenEvent}
            nodeData={dataObj}
            updateDataEvent={(key, value) => {
              updateDataEvent(value);
            }}
            data={dataObj}
            variables={variableData}
            isFullscreen={isFullscreen}
            content={fullscreenData}
            pannerNodeId={pannerNode?.id}
            readOnly={readOnly}
            countChange={handleWordCountChange}
          />
        </div>
      )}
    </div>
  );
});

export default IntentionClassificationPanel;
