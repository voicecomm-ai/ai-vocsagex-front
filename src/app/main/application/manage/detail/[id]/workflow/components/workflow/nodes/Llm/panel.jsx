"use client";

/**
 * LLM节点面板组件
 * 
 * 功能说明：
 * - 用于配置大语言模型(LLM)节点的各种参数
 * - 包括模型选择、上下文配置、提示词模板编辑等功能
 * - 支持全屏编辑模式
 * - 使用forwardRef暴露方法给父组件
 */
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Input,
  message,
  Tooltip,
  Spin,
} from "antd";
import Image from "next/image";
import "../reset.css";
import styles from "./style.module.css";
import { getAgentModelList } from "@/api/agent";
const { TextArea } = Input;
import { useNodeData, useNodesInteractions } from "../../hooks";
import VariableCascader from "../../../variableCascader";
import { useStore } from "@/store/index";
import ContentInput from "./ContentInput";
import { getUuid } from "@/utils/utils";
import ModelSelect from '../../../model-select';
import nodeStyles from "../node.module.css";
import RunHeader from "../../components/RunHeader";   
// 常量定义
const MODEL_TYPE = {
  TEXT: 1,        // 文本模型
  MULTIMODAL: 2, // 多模态模型
  REASONING: 3,  // 推理模型
  RERANK: 9,     // 排序模型
};

const CONTEXT_VARIABLE_PATTERN = "{{#context#}}"; // 上下文变量标识符

/**
 * LLM节点面板组件
 * 使用forwardRef暴露方法给父组件
 */
const PanelLlm = forwardRef((props, ref) => {
  // ==================== Hooks 和状态管理 ====================
  
  /**
   * 获取节点交互相关方法
   * updateNodeDetail: 更新节点详情的方法
   */
  const { updateNodeDetail } = useNodesInteractions();
  
  /**
   * 获取节点数据相关方法
   * getUpstreamVariables: 获取上游节点的变量列表
   * getNodeById: 根据节点ID获取节点数据
   */
  const { getUpstreamVariables, getNodeById } = useNodeData();

  /**
   * 从全局状态获取面板相关状态
   */
  const {
    panelVisible,    // 面板是否可见
    pannerNode,      // 当前面板节点数据
    readOnly,        // 是否只读模式
    setPannerNode,   // 设置面板节点
    setPanelVisible, // 设置面板可见性
    setRunVisible,   // 设置运行可见性
    changeId,        // 变更ID，用于触发重新初始化
  } = useStore((state) => state);

  /**
   * 向父组件暴露方法
   * 当前为空对象，可根据需要添加方法
   */
  useImperativeHandle(ref, () => ({}));

  // ==================== 组件状态定义 ====================
  
  /**
   * 节点数据状态
   * 包含节点的所有配置信息，如模型、提示词模板、上下文等
   */
  const [data, setData] = useState({});
  
  /**
   * 加载状态
   * 用于控制Spin组件的显示，在初始化数据时显示加载动画
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * 变量数组状态
   * 存储上游节点的变量列表，用于在提示词中引用
   */
  const [variableData, setVariableData] = useState([]);
  
  /**
   * 面板是否已打开
   * 使用ref避免在组件卸载后仍执行更新操作
   */
  const isOpen = useRef(false);
  
  /**
   * 是否存在上下文变量
   * 用于判断提示词模板中是否包含上下文变量标识符
   */
  const [isContext, setIsContext] = useState(false);
  
  /**
   * 是否全屏编辑模式
   * 控制ContentInput组件是否以全屏模式显示
   */
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  /**
   * 全屏编辑的数据
   * 存储当前全屏编辑的提示词模板项数据
   */
  const [fullscreenData, setFullscreenData] = useState({});
  
  /**
   * 全屏编辑的索引
   * 记录当前全屏编辑的提示词模板项在数组中的位置
   */
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  /**
   * 变量ID
   * 用于强制重新渲染VariableCascader组件，当变量数据更新时使用
   */
  const [variableId, setVariableId] = useState(null);
  
  /**
   * LLM模型列表
   * 存储从API获取的可用模型列表
   */
  const [llmModelList, setLlmModelList] = useState([]);
  
  /**
   * 标题输入框是否正在编辑
   * 用于控制标题输入框的样式，编辑时显示不同的样式
   */
  const [isEditing, setIsEditing] = useState(false);

  // ==================== 副作用处理 ====================
  
  // ==================== 初始化相关函数 ====================
  
  /**
   * 渲染变量函数
   * 获取上游节点的变量列表，并生成新的变量ID以触发VariableCascader重新渲染
   * @param {Array} outputs - 输出参数（当前未使用）
   */
  const handleRenderVariable = useCallback((outputs) => {
    // 生成新的变量ID，用于强制重新渲染VariableCascader组件
    setVariableId(getUuid());
    
    // 获取上游节点的变量列表
    if (pannerNode?.data?.id) {
      const upstreamVariables = getUpstreamVariables(pannerNode.data.id);
      setVariableData(upstreamVariables);
    }
  }, [pannerNode, getUpstreamVariables]);

  /**
   * 获取模型列表事件
   * 从API获取可用的LLM模型列表
   * @param {Object} nodeDataPar - 节点数据参数（当前未使用）
   */
  const getAgentModelListEvent = useCallback(async (nodeDataPar) => {
    // 构建请求参数
    const reqPar = {
      type: 1,
      tagIdList: [MODEL_TYPE.TEXT, MODEL_TYPE.MULTIMODAL], // 文本模型和多模态模型
      isShelf: 1,  // 已上架的模型
      isOr: 1,     // 或条件
    };
    
    try {
      const res = await getAgentModelList(reqPar);
      const dataArray = res.data || [];
      setLlmModelList(dataArray);
    } catch (error) {
      console.error("获取模型列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 初始化函数
   * 在面板打开时执行，用于加载节点数据和模型列表
   */
  const initFun = useCallback(async () => {
    if (!pannerNode?.data?.id) return;
    
    isOpen.current = true;
    setLoading(true);
    
    // 渲染变量列表
    handleRenderVariable();
    
    // 获取节点数据
    const nodeData = getNodeById(pannerNode.data.id);
    
    // 设置节点数据
    setData(nodeData.data);
    
    // 获取模型列表
    await getAgentModelListEvent(nodeData.data);
  }, [pannerNode, handleRenderVariable, getNodeById, getAgentModelListEvent]);

  /**
   * 监听面板可见性和节点数据变化，初始化数据
   * 当面板打开且节点类型为llm时，执行初始化操作
   */
  useEffect(() => {
    if (panelVisible && pannerNode && pannerNode.type === "llm") {
      initFun();
    }
  }, [panelVisible, changeId, pannerNode, initFun]);

  /**
   * 处理是否存在上下文变量
   * 检查提示词模板中是否包含上下文变量标识符
   * 如果包含，则设置isContext为true
   */
  const handleContextChange = useCallback(() => {
    const promptTemplate = data.prompt_template || [];
    
    // 检查是否有任何提示词项包含上下文变量标识符
    const hasContext = promptTemplate.some((item) =>
      item.text?.includes(CONTEXT_VARIABLE_PATTERN)
    );
    
    setIsContext(hasContext);
  }, [data.prompt_template]);

  /**
   * 监听节点数据变化，检查是否存在上下文变量
   * 当data变化时，重新检查提示词模板中是否包含上下文变量
   */
  useEffect(() => {
    handleContextChange();
  }, [data, handleContextChange]);

  // ==================== 数据更新相关函数 ====================
  
  /**
   * 更新数据事件处理函数
   * 更新节点数据的指定字段，并同步更新到节点详情
   * @param {string} dataPar - 要更新的数据字段名
   * @param {any} dataParValue - 要更新的数据值
   */
  const updateDataEvent = (dataPar, dataParValue) => {
    const nodeData = getNodeById(pannerNode.data.id);
    console.log(nodeData,'测试修改问题日')
    
    // 只有在面板打开状态下才更新数据，避免组件卸载后仍执行更新
    if (isOpen.current) {
      const updatedData = {
        ...nodeData.data,
        [dataPar]: dataParValue,
      };
      console.log(updatedData,'测试修改问题日')   
      // 更新本地状态
      setData(updatedData);
      
      // 同步更新节点详情
      updateNodeDetailEvent(updatedData);
    }
  };

  /**
   * 更新节点详情的函数
   * 将更新后的数据同步到节点详情中
   * @param {Object} data - 要更新的节点数据
   */
  const updateNodeDetailEvent = (data) => {
    const newData = {
      nodeId: pannerNode.data.id,
      data: {
        ...data,
      },
    };
    updateNodeDetail(newData);
  };

  // ==================== UI事件处理函数 ====================
  
  /**
   * 关闭面板事件
   * 清理状态并关闭面板
   */
  const closePanelEvent = () => {
    setPannerNode(null);
    isOpen.current = false;
    setPanelVisible(false);
  };

  /**
   * 处理节点标题变更
   * @param {Event} e - 输入框change事件
   */
  const handleNodeTitleChange = (e) => {
    updateDataEvent("title", e.target.value);
  };

  /**
   * 处理节点描述变更
   * @param {Event} e - 输入框change事件
   */
  const handleNodeDescChange = (e) => {
    updateDataEvent("desc", e.target.value);
  };

  /**
   * 标题输入框获得焦点事件
   * 设置编辑状态为true，用于显示编辑样式
   */
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  /**
   * 标题输入框失去焦点事件
   * 设置编辑状态为false，恢复默认样式
   */
  const handleTitleBlur = () => {
    setIsEditing(false);
  };

  // ==================== 模型相关函数 ====================
  

  /**
   * 选择模型处理函数
   * 当用户选择模型时，更新节点数据中的模型信息
   * @param {Object} obj - 选中的模型对象
   */
  const handleSelectModal = (obj) => {
    const modelPar = {
      ...data.model,
      ...obj,
    };
    updateDataEvent("model", modelPar);
  };

  // ==================== 提示词模板相关函数 ====================
  
  /**
   * 添加消息处理函数
   * 在提示词模板列表中添加新的消息项
   * 根据当前最后一条消息的角色，自动确定新消息的角色（user和assistant交替）
   * @param {Event} event - 点击事件
   */
  const handleAddMessage = (event) => {
    // 只读模式下不允许添加
    if (readOnly) return;
    
    // 阻止事件冒泡
    event.stopPropagation();
    
    const prompt_template = data.prompt_template || [];
    let roleStr;
    
    // 根据当前消息列表确定下一个消息的角色
    // 如果最后一条是user，则下一条是assistant；否则下一条是user
    if (prompt_template.length > 0) {
      const lastRole = prompt_template[prompt_template.length - 1]?.role;
      roleStr = lastRole === "user" ? "assistant" : "user";
    } else {
      // 如果列表为空，默认第一条为user
      roleStr = "user";
    }
    
    // 创建新的消息项
    const newPromptItem = {
      role: roleStr,
      text: "",
      id: getUuid(),
      edition_type: "basic",
      jinja2_text: "",
    };
    
    // 更新提示词模板列表
    updateDataEvent("prompt_template", [
      ...prompt_template,
      newPromptItem,
    ]);
  };

  // ==================== 上下文相关函数 ====================
  
  /**
   * 选择变量值处理函数
   * 当用户在变量选择器中选择变量时，更新上下文配置
   * @param {Object} obj - 变量选择器返回的对象
   * @param {string} obj.value_selector - 选中的变量选择器路径
   */
  const onChangeVariable = (obj) => {
    const context = {
      enabled: !!obj.value_selector, // 如果有选择器，则启用上下文
      variable_selector: obj.value_selector,
    };
    updateDataEvent("context", context);
  };


  // ==================== 运行相关函数 ====================
  
  /**
   * 运行面板事件
   * 验证系统提示词是否填写，然后打开运行面板
   */
  const runPanelEvent = () => {
    // 只读模式下不允许运行
    if (readOnly) return;
    
    const nodeData = getNodeById(pannerNode.data.id);
    const prompt_template = nodeData.data.prompt_template || [];
    
    // 查找系统提示词
    const system_prompt = prompt_template.find((item) => item.role === "system");
    
    // 验证系统提示词是否为空
    if (!system_prompt || !system_prompt.text) {
      message.warning("系统提示词不能为空");
      return;
    }
    
    // 打开运行面板
    setPannerNode(nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };

  // ==================== 全屏编辑相关函数 ====================
  
  /**
   * 全屏处理事件
   * 切换全屏编辑模式，并设置要全屏编辑的数据和索引
   * @param {Object} data - 要全屏编辑的提示词模板项数据
   * @param {number} index - 提示词模板项在数组中的索引
   */
  const handleFullscreenEvent = (data, index) => {
    setIsFullscreen(!isFullscreen);
    setFullscreenData(data);
    setFullscreenIndex(index);
  };

  // ==================== 渲染函数 ====================
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }
  return (
    <div className={styles["panel_main"]}>
      {/* 加载动画包装器 */}
      <Spin spinning={loading} wrapperClassName="node_main_spin">
        {/* ==================== 面板头部区域 ==================== */}
        <RunHeader  data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}  isPadding={true}   />

        {/* ==================== 面板主要内容区域 ==================== */}
        <div className={styles["panel_main_con"]}>
          {/* ==================== 模型选择区域 ==================== */}
          <div className={styles["panel_main_con_model"]}>
            {/* 模型选择标题 */}
            <div className={styles["panel_main_con_modeltxt"]}>
              <span className="span_required">*</span>
              模型
            </div>
            
            {/* 模型选择器组件 */}
            <div className={styles["panel_main_con_modelsel"]}>
              <ModelSelect
                modelId={data.model?.id}
                model={data.model}
                modelList={llmModelList}
                updateModelSelect={handleSelectModal}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* ==================== 上下文配置区域 ==================== */}
          <div className={styles["panel_main_con_context"]}>
            {/* 上下文标题和提示 */}
            <div className={styles["panel_main_con_contexttitle"]}>
              <span className={styles["panel_main_con_contexttxt"]}>
                上下文
              </span>
              <Tooltip title="您可以导入知识库作为上下文">
                <img
                
                   src="/agent/info.png"
                  alt="提示"
                  width="16"
                  height="16"
               
                />
              </Tooltip>
            </div>

            {/* 变量选择器：用于选择上游节点的变量作为上下文 */}
            <div className={styles["panel_main_con_query"]}>
              <VariableCascader
                onChange={onChangeVariable}
                disabled={readOnly}
                key={variableId} // 使用variableId作为key，当变量数据更新时强制重新渲染
                value_selector={data.context?.variable_selector}
                data={variableData}
              />
            </div>

            {/* 上下文警告提示：当启用了上下文但未在提示词中使用上下文变量时显示 */}
            {!isContext && data.context?.enabled && (
              <div className={styles["panel_main_con_contextWaring"]}>
                要启用上下文功能，请在提示中填写上下文变量
              </div>
            )}

            {/* ==================== 提示词模板输入区域 ==================== */}
            <div className={styles["panel_main_con_inputvar"]}>
              {/* 遍历渲染每个提示词模板项 */}
              {data.prompt_template &&
                data.prompt_template.length > 0 &&
                data.prompt_template.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      className={styles["panel_main_con_inputvar_item"]}
                    >
                      <ContentInput
                        handleFullscreenEvent={handleFullscreenEvent}
                        nodeData={data}
                        isContext={isContext}
                        updateDataEvent={updateDataEvent}
                        data={item}
                        index={index}
                        key={`${data.id}_${variableId}`} // 组合key确保变量更新时重新渲染
                        variables={variableData}
                        isFullscreen={isFullscreen}
                      />
                    </div>
                  );
                })}

              {/* 添加消息按钮：在提示词模板列表中添加新的消息项 */}
              <div
                className={`${styles["panel_main_con_msgcon"]} ${
                  readOnly ? "readOnly" : ""
                }`}
                onClick={handleAddMessage}
              >
                <Image
                  src="/workflow/add.png"
                  alt="添加"
                  width="12"
                  height="12"
                />
                <span className={styles["panel_main_con_msgcontxt"]}>
                  添加消息
                </span>
              </div>
            </div>

            {/* ==================== 输出变量区域 ==================== */}
            <div className={styles["panel_main_con_outputvar"]}>
              {/* 输出变量标题 */}
              <div className={styles["panel_main_con_outputvartitle"]}>
                <div className={styles["main_con_outputvartitle_left"]}>
                  输出
                </div>
              </div>

              {/* 输出变量列表 */}
              <ul className={styles["panel_main_con_outputvarconul"]}>
                {/* Text输出变量：LLM节点默认输出文本内容 */}
                <li className={styles["panel_main_con_outputvarconul_li"]}>
                  <div
                    className={styles["panel_main_con_outputvarconul_litop"]}
                  >
                    {/* 变量名称 */}
                    <span
                      className={
                        styles["panel_main_con_outputvarconul_litop_a"]
                      }
                    >
                      text
                    </span>
                    {/* 变量类型 */}
                    <span
                      className={
                        styles["panel_main_con_outputvarconul_litop_b"]
                      }
                    >
                      String
                    </span>
                  </div>
                  {/* 变量描述 */}
                  <div>生成内容</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Spin>

      {/* ==================== 全屏编辑容器 ==================== */}
      {/* 当isFullscreen为true时，显示全屏编辑模式 */}
      {isFullscreen && (
        <div className={styles.fullscreen_container}>
          <ContentInput
            handleFullscreenEvent={handleFullscreenEvent}
            nodeData={data}
            isContext={isContext}
            updateDataEvent={updateDataEvent}
            data={fullscreenData}
            index={fullscreenIndex}
            variables={variableData}
            content={fullscreenData}
            isFullscreen={isFullscreen}
            disabled={readOnly}
          />
        </div>
      )}
    </div>
  );
});

export default PanelLlm;
