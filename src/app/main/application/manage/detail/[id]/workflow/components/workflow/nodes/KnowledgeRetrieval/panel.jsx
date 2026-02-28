"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Input, Select, Typography, Spin, Tooltip } from "antd";
import Image from "next/image";
import { getKnowledgeBaseList } from "@/api/knowledge";
import RecallSettingsModel from "./RecallSettingsModel/index";
import KnowledgeSelectModel from "./KnowledgeSelectModel/index";
import DocumentFilterCriteriaModel from "./DocumentFilterCriteriaModel/index";
import KnowledgeConf from '@/app/components/knowledge/Update.jsx'; // 知识库配置组件
import "../reset.css";
import styles from "./style.module.css";
import { getAgentModelList } from "@/api/agent";
import { useStore } from "@/store/index";
const { TextArea } = Input;
import { useNodeData, useNodesInteractions } from "../../hooks";
import throttle  from "lodash/throttle";
import VariableCascader from '../../../variableCascader';
import ModelSelect from '../../../model-select';
import { useKnowledge } from "./hooks/use-knowledge";
import { getMetadataList } from "@/api/workflow";
import nodeStyles from "../node.module.css";
import RunHeader  from '../../components/RunHeader'
/**
 * 文档过滤模式配置
 * - disabled: 禁用文档过滤
 * - automatic: 根据用户查询自动生成文档过滤条件
 * - manual: 手动添加文档过滤条件
 */
const filterProperties = [
  {
    name: "禁用",
    type: "disabled",
    subText: "禁用文档过滤",
  },
  {
    name: "自动",
    type: "automatic",
    subText: "根据用户查询自动生成文档过滤条件",
  },
  {
    name: "手动",
    type: "manual",
    subText: "手动添加文档过滤条件",
  },
];

/**
 * 知识库检索类型映射
 */
const knowledgeType = {
  FULL_TEXT: '全文检索',
  HYBRID: '混合检索',
  VECTOR: '向量检索',
}

/**
 * 知识检索面板组件
 * 用于配置知识检索节点的各项参数，包括：
 * - 用户输入变量选择
 * - 知识库选择和管理
 * - 文档属性过滤配置
 * - 召回设置
 */
const KnowledgeRetrievalPanel = forwardRef((props, ref) => {
  // ==================== Hooks ====================
  const { updateNodeDetail } = useNodesInteractions();
  const { validateKnowledgeNode, sortByOriginalOrder } = useKnowledge();
  const { getUpstreamVariables, getNodeById } = useNodeData();
  const { Paragraph, Text } = Typography;
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  // ==================== Store 状态 ====================
  const {
    setPanelVisible,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
    readOnly
  } = useStore((state) => state);

  // ==================== 组件状态 ====================
  /** 节点数据 */
  const [data, setData] = useState({});
  /** 加载状态 */
  const [loading, setLoading] = useState(false);
  /** 标题编辑状态 */
  const [isEditing, setIsEditing] = useState(false);
  /** 文本模型列表 */
  const [textModelList, setTextModelList] = useState([]);
  /** 当前激活的文档过滤类型 */
  const [activeTypeItem, setActiveTypeItem] = useState({
    name: "禁用",
    type: "disabled",
    subText: "禁用文档过滤",
  });
  /** 已选择的知识库列表 */
  const [selDatabase, setSelDatabase] = useState([]);
  /** 所有知识库列表 */
  const [knowledgeList, setKnowledgeList] = useState([]);
  /** 上游变量数据 */
  const [variableData, setVariableData] = useState([]);
  /** 重排序模型列表 */
  const [rerankModelListArray, setRerankModelListArray] = useState([]);
  /** 变量过滤数据类型 */
  const [filterData, setFilterData] = useState(['string', 'file']);

  // ==================== Refs ====================
  /** 知识库配置弹窗引用 */
  const knowledgeConfRef = useRef(null);
  /** 召回设置弹窗引用 */
  const KnowledgeRetrievalPanelRef = useRef(null);
  /** 知识库选择弹窗引用 */
  const KnowledgeSelectModelRef = useRef(null);
  /** 文档过滤条件弹窗引用 */
  const documentFilterCriteriaRef = useRef(null);
  /** 面板是否打开 */
  const isOpen = useRef(false);
  /** 是否已初始化 */
  const isInit = useRef(false);

  /**
   * 显示弹窗（暴露给父组件的方法）
   * @param {Object} obj - 节点对象
   * @param {string} type - 类型
   * @param {Object} selectDepartment - 选择的部门
   */
  const showModal = async (obj, type, selectDepartment) => {
    setLoading(true);
  };
  // ==================== 初始化防抖函数 ====================
  /**
   * 初始化函数的节流版本，防止频繁调用
   * 延迟 1000ms 执行，避免短时间内多次触发
   */
  const initFunThrottle = useRef(
    throttle(async () => {
      console.log('initFunDebounce');
      initFun();
    }, 1000)
  ).current;

  // ==================== useEffect 生命周期 ====================
  /**
   * 面板可见时初始化数据
   * 仅在首次打开面板时执行一次初始化
   */
  useEffect(() => {
    if (panelVisible && pannerNode && pannerNode.type === 'knowledge-retrieval') {
      if (!isInit.current) {
        isInit.current = true;
        initFunThrottle();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initFunThrottle 是 useRef，不需要添加到依赖中

  /**
   * 当工作流节点ID变化时，重新渲染变量
   * 用于更新上游变量的数据
   */
  useEffect(() => {
    if (panelVisible) {
      handleRenderVariable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeId]); // handleRenderVariable 和 panelVisible 不需要添加到依赖中

  // ==================== 初始化函数 ====================
  /**
   * 初始化面板数据
   * 1. 获取节点数据
   * 2. 设置文档过滤模式
   * 3. 加载知识库列表
   * 4. 加载模型列表
   */
  const initFun = async () => {
    isOpen.current = true;
    if (pannerNode && pannerNode.data) {
      const nodeData = getNodeById(pannerNode.data.id);
      setData(nodeData.data);
      setLoading(true);
      handleRenderVariable();
      
      // 设置当前激活的文档过滤类型
      const activeFilterType = filterProperties.find(
        item => item.type === pannerNode.data.metadata_filtering_mode
      );
      if (activeFilterType) {
        setActiveTypeItem(activeFilterType);
      }
      
      // 加载知识库列表和模型列表
      getKnowledgeBaseListEvent(nodeData.data);
      getAgentModelListEvent();
    }
  };

  // ==================== 知识库相关函数 ====================
  /**
   * 获取知识库列表
   * 1. 调用API获取所有知识库
   * 2. 过滤掉空的知识库
   * 3. 获取已选择知识库的元数据信息
   * @param {Object} nodeData - 节点数据
   */
  const getKnowledgeBaseListEvent = async (nodeData) => {
    const requestData = {
      name: "",
      tagIds: [],
    };
    
    try {
      const res = await getKnowledgeBaseList(requestData);
      // 过滤掉空的知识库
      const availableKnowledgeBases = res.data.filter((item) => item.isEmpty === false);
      setKnowledgeList(availableKnowledgeBases);
      
      // 获取节点中已选择的知识库列表
      const selectedList = nodeData.dataSet_list || [];
      // 获取已选择知识库的元数据信息
      getKnowledgeBaseMetadataList(nodeData, availableKnowledgeBases, selectedList);
    } catch (err) {
      isInit.current = false;
      setLoading(false);
      console.error("获取知识库列表失败:", err);
    }
  };

  /**
   * 获取知识库的元数据列表
   * 1. 对知识库进行排序（保持原有顺序）
   * 2. 获取元数据列表
   * 3. 过滤已删除的元属性
   * 4. 更新节点数据
   * @param {Object} nodeData - 节点数据
   * @param {Array} knowledgeArray - 所有知识库数组
   * @param {Array} setList - 已选择的知识库数组
   */
  const getKnowledgeBaseMetadataList = async (nodeData, knowledgeArray, setList) => {
    // 获取现有的过滤条件
    const conditions = nodeData.metadata_filtering_condition?.conditions || [];
    const defaultKnowledgeArr = setList;
    
    // 过滤出当前存在的知识库（避免已删除的知识库）
    const existingKnowledgeBases = setList
      ? knowledgeArray.filter((item) => setList.some((data) => data.id === item.id))
      : [];
    
    // 按原始顺序排序知识库
    const sortedKnowledgeBases = sortByOriginalOrder(defaultKnowledgeArr, existingKnowledgeBases);
    
    // 提取知识库ID列表
    const knowledgeBaseIds = sortedKnowledgeBases.map((item) => item.id);
    
    setLoading(true);
    
    try {
      const res = await getMetadataList(knowledgeBaseIds);
      // 统一元数据类型为小写
      const metadataArray = (res.data || []).map((item) => ({
        ...item,
        type: item.type ? String(item.type).toLowerCase() : item.type,
      }));
      
      // 过滤已删除的元属性，只保留仍然存在的条件
      const validConditions = [];
      conditions.forEach(item => {
        const existIndex = metadataArray.findIndex(
          condition => condition.name === item.name && condition.type === item.type
        );
        if (existIndex !== -1) {
          validConditions.push(item);
        }
      });
      
      // 按原始顺序排序过滤条件
      const sortedConditions = sortByOriginalOrder(conditions, validConditions);
      
      // 构建新的过滤条件对象
      const newFilterConditions = {
        logical_operator: nodeData.metadata_filtering_condition?.logical_operator || 'and',
        conditions: sortedConditions,
      };
      
      // 更新数据
      const updateData = {
        metadata_filtering_condition: newFilterConditions,
        dataSet_list: sortedKnowledgeBases,
      };
      
      setSelDatabase(sortedKnowledgeBases);
      updateMoreDataEvent(nodeData, updateData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("获取元数据列表失败:", err);
    }
  };
  
  // ==================== 数据更新函数 ====================
  /**
   * 批量更新节点数据
   * @param {Object} nodeData - 原始节点数据
   * @param {Object} otherData - 要更新的数据对象
   */
  const updateMoreDataEvent = (nodeData, otherData) => {
    const updatedData = {
      ...nodeData,
      ...otherData,
    };
    console.log(updatedData, 'updatedData');
    setData(updatedData);
    updateNodeDetailEvent(updatedData);
  };

  /**
   * 更新单个节点数据字段
   * @param {string} dataPar - 要更新的字段名
   * @param {any} dataParValue - 字段的新值
   */
  const updateDataEvent = (dataPar, dataParValue) => {
    console.log('updateDataEvent', dataPar, dataParValue);
    const updatedData = {
      ...data,
      [dataPar]: dataParValue,
    };
    setData(updatedData);
    updateNodeDetailEvent(updatedData);
  };

  /**
   * 更新节点详情到全局状态
   * @param {Object} data - 节点数据
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

  /**
   * 渲染上游变量
   * 获取当前节点上游的所有变量，用于变量选择器
   */
  const handleRenderVariable = () => {
    const upstreamVariables = getUpstreamVariables(props.nodeData.id);
    setVariableData(upstreamVariables);
  };

  // ==================== 面板控制函数 ====================
  /**
   * 隐藏弹窗（暴露给父组件的方法）
   */
  const hideModal = () => {
    setOpen(false);
  };

  /**
   * 关闭面板
   * 重置状态并关闭面板
   */
  const closePanelEvent = () => {
    isOpen.current = false;
    setPannerNode(null);
    setPanelVisible(false);
  };

  // ==================== 节点标题处理函数 ====================
  /**
   * 处理节点标题变更
   * @param {Object} e - 输入事件对象
   */
  const handleNodeTitleChange = (e) => {
    updateDataEvent('title', e.target.value);
  };

  /**
   * 标题输入框获得焦点
   */
  const handleTitleFocus = () => {
    setIsEditing(true);
  };

  /**
   * 标题输入框失去焦点
   */
  const handleTitleBlur = () => {
    setIsEditing(false);
  };

  // ==================== 文档过滤处理函数 ====================
  /**
   * 选择文档过滤模式
   * 当选择"自动"模式时，如果没有配置模型，则自动选择第一个文本模型
   * @param {Object} itemPar - 过滤模式配置对象
   */
  const handleSelectFunc = (itemPar) => {
    setActiveTypeItem(itemPar);
    const updateData = {
      metadata_filtering_mode: itemPar.type,
    };
    
    // 如果选择自动模式，需要配置模型
    if (itemPar.type === "automatic") {
      let metadataModel = data.metadata_model || {
        provider: null,
        name: null,
        mode: null,
        id: null,
        completion_params: {},
      };
      
      // 如果没有配置模型，使用第一个文本模型
      if (!metadataModel.id && textModelList.length > 0) {
        const firstModel = textModelList[0];
        metadataModel = {
          ...metadataModel,
          ...firstModel,
        };
        updateData.metadata_model = metadataModel;
      }
    }
    
    updateMoreDataEvent(data, updateData);
  };

  // ==================== 知识库操作函数 ====================
  /**
   * 打开召回设置弹窗
   */
  const handleRecallSettings = () => {
    KnowledgeRetrievalPanelRef.current.showModal(data);
  };

  /**
   * 添加知识库
   * 打开知识库选择弹窗
   */
  const handleAddKnowledgeBase = () => {
    if (readOnly) return;
    KnowledgeSelectModelRef.current.showModal(selDatabase);
  };

  /**
   * 编辑知识库配置
   * @param {Object} item - 知识库对象
   */
  const handleEditKnowledgeBase = (item) => {
    if (readOnly) return;
    knowledgeConfRef.current.showModal(item, 'agent');
  };

  /**
   * 删除选择的知识库
   * @param {Object} itemPar - 要删除的知识库对象
   */
  const deleteSelDatabaseItem = (itemPar) => {
    if (readOnly) return;
    const newSelDatabase = selDatabase.filter((item) => item.id !== itemPar.id);
    setSelDatabase(newSelDatabase);
    
    // 转换为简化的数据结构
    const simplifiedData = newSelDatabase.map((item) => ({
      name: item.name,
      id: item.id,
    }));
    
    handleKnowledgeChangeEvent(simplifiedData);
  };

  /**
   * 保存选择的知识库
   * 将选择的知识库转换为简化格式并更新数据
   * @param {Array} databaseArray - 选择的知识库数组
   */
  const setSelDatabaseFunc = (databaseArray) => {
    setSelDatabase(databaseArray);
    
    // 转换为简化的数据结构（只保留 name 和 id）
    const simplifiedData = databaseArray.map((item) => ({
      name: item.name,
      id: item.id,
    }));

    handleKnowledgeChangeEvent(simplifiedData);
  };

  /**
   * 处理知识库变更事件
   * 当知识库列表发生变化时，重新获取元数据
   * @param {Array} dataParValue - 新的知识库列表数据
   */
  const handleKnowledgeChangeEvent = (dataParValue) => {
    getKnowledgeBaseMetadataList(data, knowledgeList, dataParValue);
  };

  // ==================== 模型相关函数 ====================
  /**
   * 获取模型列表
   * 获取文本模型和重排序模型列表
   */
  const getAgentModelListEvent = async () => {
    const requestParams = {
      type: 1,
      tagIdList: [1, 2, 3, 6, 9], // 1:文本模型 2:多模态模型 3:推理 9:排序
      isShelf: 1,
      isOr: 1,
    };
    
    try {
      const res = await getAgentModelList(requestParams);
      const dataArray = res.data || [];
      // 过滤出文本模型（classification === 1）
      const textModelArr = dataArray.filter((item) => item.classification === 1);
      
      setLoading(false);
      setTextModelList(textModelArr);
      setRerankModelListArray(dataArray);
    } catch (err) {
      isInit.current = false;
      setLoading(false);
      console.error("获取模型列表失败:", err);
    }
  };

  /**
   * 选择模型
   * 更新元数据模型配置
   * @param {Object} itemPar - 选择的模型对象
   */
  const handleSelectModal = (itemPar) => {
    const selectedModel = textModelList.find((item) => item.id === itemPar.id);
    if (!selectedModel) return;
    
    const metadataModel = {
      provider: null,
      name: selectedModel.name,
      mode: null,
      id: selectedModel.id,
      completion_params: {},
      ...selectedModel,
    };
    
    updateDataEvent('metadata_model', metadataModel);
  };

  // ==================== 变量和过滤条件处理函数 ====================
  /**
   * 选择变量值
   * @param {Object} obj - 变量选择器返回的对象
   */
  const onChangeVarible = (obj) => {
    updateDataEvent('query_variable_selector', obj.value_selector);
  };

  /**
   * 打开文档过滤条件弹窗
   */
  const handleOpenWdgltj = () => {
    documentFilterCriteriaRef.current?.showModal(data);
  };

  /**
   * 更新文档过滤条件
   * @param {Object} dataObj - 文档过滤条件对象
   */
  const updateMetadataFilteringCondition = (dataObj) => {
    updateDataEvent('metadata_filtering_condition', dataObj);
  };

  /**
   * 召回设置回调事件
   * @param {Object} dataObj - 召回配置对象
   */
  const updateCallBackEvent = (dataObj) => {
    updateDataEvent('multiple_retrieval_config', dataObj);
  };

  // ==================== 渲染辅助函数 ====================
  /**
   * 根据文档过滤模式渲染右侧内容
   * - manual: 显示条件按钮和条件数量
   * - automatic: 显示模型选择器
   * - disabled: 不显示任何内容
   */
  const documentSelectRight = () => {
    switch (activeTypeItem.type) {
      case "manual":
        return (
          <div
            className={styles["documentFilterSelectCondition"]}
            onClick={handleOpenWdgltj}
          >
            <Image
              src={`/workflow/condition.png`}
              alt=""
              width="16"
              height="16"
            />
            <span className={styles["documentFilterConditionLabel"]}>条件</span>
            <span className={styles["documentFilterConditionCount"]}>
              {data.metadata_filtering_condition?.conditions.length > 0 &&
                data.metadata_filtering_condition?.conditions.length}
            </span>
          </div>
        );
      case "automatic":
        return (
          <div className={styles["documentFilterSelectModel"]}>
            <ModelSelect
              disabled={readOnly}
              modelId={data?.metadata_model?.id}
              model={data.metadata_model}
              modelList={textModelList}
              updateModelSelect={handleSelectModal}
            />
          </div>
        );
      default:
        return null;
    }
  };

  /**
   * 处理节点描述变更
   * @param {Object} e - 输入事件对象
   */
  const handleNodeDescChange = (e) => {
    updateDataEvent('desc', e.target.value);
  };

  /**
   * 运行面板事件
   * 验证节点配置后打开运行面板
   */
  const runPanelEvent = () => {
    if (readOnly) return;
    
    const nodeData = getNodeById(pannerNode.data.id);
    // 验证知识库节点配置是否完整
    if (!validateKnowledgeNode(nodeData.data)) {
      return;
    }
    
    // 打开运行面板
    setPannerNode(nodeData);
    setPanelVisible(false);
    setRunVisible(true);
  };
  const updateNodeDataByHeader =(obj)=>{
    setData(obj);
    updateNodeDetailEvent(obj);
   }

  return (
    <div className={styles["knowledgePanel"]}>
     <Spin spinning={loading} wrapperClassName='node_main_spin' >
          {/* 面板头部区域 */}
          <RunHeader data={data} updateNodeDataByHeader={updateNodeDataByHeader} runPanelEventByHeader={runPanelEvent}   />
      <div className={styles["knowledgePanelContent"]}>
        <div className={styles["knowledgePanelQuerySection"]}>
          <div className={styles["queryVariableLabel"]}>
          <span className='span_required'>*</span>
            <span>用户输入</span>
          </div>
         <VariableCascader
          disabled={readOnly}
          onChange={onChangeVarible}
          value_selector={data.query_variable_selector}
          data={variableData}
          filterData={filterData}
          />
        </div>
        <div className={styles["knowledgePanelKnowledgeBaseSection"]}>
          <div className={styles["knowledgeBaseHeader"]}>
            <div className={styles["knowledgeBaseHeaderLeft"]}>
             <span className='span_required'>*</span>
              <span>知识库</span>
            </div>
            <div className={styles["knowledgeBaseHeaderRight"]}>
              <div
                className={styles["knowledgeBaseActionRecall"]}
                style={selDatabase.length === 0 ? { cursor: "not-allowed", opacity: 0.5 } : {}}
              >
                <Image
                  src="/workflow/call_back.png"
                  alt=""
                  width="14"
                  height="14"
                  style={selDatabase.length === 0 ? { filter: "grayscale(100%)" } : {}}
                ></Image>
                <span
                  className={styles["actionText"]}
                  onClick={selDatabase.length === 0 ? undefined : handleRecallSettings}
                  style={selDatabase.length === 0 ? { pointerEvents: "none", color: "#ccc" } : {}}
                >
                  召回设置
                </span>
              </div>
            
              <div
                className={`${styles["knowledgeBaseActionAdd"]} ${readOnly ? 'readOnly' : ''}`}
                onClick={handleAddKnowledgeBase}
              >
                <Image
                  src="/workflow/knowledge_add.png"
                  alt=""
                  width="14"
                  height="14"
                ></Image>
                <span className={styles["actionText"]}>添加</span>
              </div>
            
            </div>
          </div>
          <ul className={styles["knowledgeBaseList"]}>
            {selDatabase.length > 0 ? (
              selDatabase.map((item) => {
                return (
                  <li
                    className={styles["knowledgeBaseItem"]}
                    key={item.id}
                  >
                    <div className={styles["knowledgeBaseItemLeft"]}>
                      <Image
                       src="/agent/knowledge.png"
                        alt=""
                        width="20"
                        height="20"
                      ></Image>
                      <div className={styles["knowledgeBaseItemName"]}>
                      <Text
                            style={{ maxWidth: 240 }}
                            ellipsis={{ tooltip: item.name }}
                          >
                            {item.name}
                          </Text>
                      </div>
                    </div>
                    <div className={styles["knowledgeBaseItemRight"]}>
                      <div className={styles["knowledgeBaseItemActions"]}>
                    
                          <div className={styles["knowledgeBaseItemStrategy"]}>
                            <span className={styles["knowledgeBaseItemStrategyText"]}>
                            {item.searchStrategy ? knowledgeType[item.searchStrategy] : ''}
                            </span>
                          </div>        
                        <div
                          className={styles["knowledgeBaseItemActionButtons"]}
                        >
                       
                          <div className={`${styles["knowledgeBaseItemActionEdit"]} ${readOnly ? 'readOnly' : ''}`} onClick={() => handleEditKnowledgeBase(item)}>
                            <Image
                              src="/workflow/common/edit.png"
                              alt=""
                              width="16"
                              height="16"
                            ></Image>
                          </div>
                          
                         
                            <div
                            className={`${styles["knowledgeBaseItemActionDelete"]} ${readOnly ? 'readOnly' : ''}`}
                            onClick={() => deleteSelDatabaseItem(item)}
                          >
                            <Image
                              src="/workflow/common/delete_hover.png"
                              alt=""
                              width="16"
                              height="16"
                            ></Image>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li
                className={`${styles["knowledgeBaseItemEmpty"]} ${readOnly ? 'readOnly' : ''}`}
                onClick={handleAddKnowledgeBase}
              >
                <div className={styles["knowledgeBaseItemEmptyInner"]}>
                  <Image
                    src="/workflow/knowledge_add.png"
                    alt=""
                    width="14"
                    height="14"
                  ></Image>
                  <span className={styles["knowledgeBaseItemEmptyText"]}>
                    添加第一个知识库
                  </span>
                </div>
              </li>
            )}
          </ul>
        </div>
        <div className={styles["knowledgePanelDocumentSection"]}>
          <div className={styles["documentFilterTitle"]}>
            
            <span className={styles["documentFilterTitleText"]}>
              文档属性过滤
            </span>
          <Tooltip title="文档属性过滤是使用文档属性（例如标签、类别）来控制系统内相关信息的检索过程">
            <Image
              src="/workflow/tip.png"
              alt=""
              width="16"
              height="16"
              className={styles["documentFilterTitleIcon"]}
            ></Image>
            </Tooltip>
          </div>
          <div className={styles["documentFilterContent"]}>
            <div className={styles["documentFilterSelect"]}>
              <div className={styles["documentFilterSelectLeft"]}>
                <div className={styles["documentFilterSelectText"]}>
                  <span className={styles["documentFilterSelectTextSpan"]}>
                    {activeTypeItem.name}
                  </span>
                </div>
                {!readOnly && (
                <Image
                  src="/workflow/selectorstow_icon.png"
                  alt=""
                  width="16"
                  height="16"
                  className={styles["documentFilterSelectIcon"]}
                ></Image>
                )}
                {!readOnly && (
                <div className={styles["documentFilterSelectPopup"]}>
                  <ul className={styles["documentFilterPopupList"]}>
                    {filterProperties.map((item) => {
                      return (
                        <li
                          key={item.type}
                          className={`${styles["documentFilterPopupItem"]} ${
                           data.metadata_filtering_mode === item.type
                              ? styles["documentFilterPopupItemActive"]
                              : ""
                          }`}
                          onClick={() => handleSelectFunc(item)}
                        >
                          <div className={styles["documentFilterPopupItemName"]}>
                            {item.name}
                          </div>
                          <div className={styles["documentFilterPopupItemDesc"]}>
                            {item.subText}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                )}
              </div>
              <div className={styles["documentFilterSelectRight"]}>
                {documentSelectRight()}
              </div>
          
            </div>
            {data.metadata_filtering_mode === "automatic" && (
          <div className={styles["documentFilterModelTip"]}>
            根据 Query Variable 自动生成文档属性过滤条件
          </div>    
          )}
          </div>
        </div>
        <div className={styles["knowledgePanelOutput"]}>
          <div className={styles["outputVariableTitle"]}>输出</div>
          <div className={styles["outputVariableResult"]}>
            <div className={styles["outputVariableResultText"]}>
              <div className={styles["outputVariableResultName"]}>
                result
              </div>
              <div className={styles["outputVariableResultType"]}>
                Array[Object]
              </div>
            </div>
            <div className={styles["outputVariableResultDesc"]}>
              召回的分段
            </div>
          </div>
          <div className={styles["knowledgePanelOutputList"]}>
            <ul className={styles["knowledgePanelOutputListUl"]}>
              <li className={styles["knowledgePanelOutputListItem"]}>
                <div className={styles["outputListItemTop"]}>
                  <span className={styles["outputListItemName"]}>
                    content
                  </span>
                  <span className={styles["outputListItemType"]}>
                    string
                  </span>
                </div>
                <div className={styles["outputListItemDesc"]}>
                  分段内容
                </div>
              </li>
              <li className={styles["knowledgePanelOutputListItem"]}>
                <div className={styles["outputListItemTop"]}>
                  <span className={styles["outputListItemName"]}>
                    title
                  </span>
                  <span className={styles["outputListItemType"]}>
                    string
                  </span>
                </div>
                <div className={styles["outputListItemDesc"]}>
                  分段标题
                </div>
              </li>
              <li className={styles["knowledgePanelOutputListItem"]}>
                <div className={styles["outputListItemTop"]}>
                  <span className={styles["outputListItemName"]}>
                    url
                  </span>
                  <span className={styles["outputListItemType"]}>
                    string
                  </span>
                </div>
                <div className={styles["outputListItemDesc"]}>
                  分段链接
                </div>
              </li>
              <li className={styles["knowledgePanelOutputListItem"]}>
                <div className={styles["outputListItemTop"]}>
                  <span className={styles["outputListItemName"]}>
                    icon
                  </span>
                  <span className={styles["outputListItemType"]}>
                    string
                  </span>
                </div>
                <div className={styles["outputListItemDesc"]}>
                  分段图标
                </div>
              </li>
              <li className={styles["knowledgePanelOutputListItem"]}>
                <div className={styles["outputListItemTop"]}>
                  <span className={styles["outputListItemName"]}>
                    metadata
                  </span>
                  <span className={styles["outputListItemType"]}>
                    object
                  </span>
                </div>
                <div className={styles["outputListItemDesc"]}>
                  其他检索数据
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      </Spin> 
      {/* 召回设置弹窗 */}
      <RecallSettingsModel
        readOnly={readOnly}
        ref={KnowledgeRetrievalPanelRef}
        updateCallBackEvent={updateCallBackEvent}
      />
      {/* 选择引用知识库弹窗 */}
      <KnowledgeSelectModel
        ref={KnowledgeSelectModelRef}
        setSelDatabaseFunc={setSelDatabaseFunc}
      />
      {/* 文档过滤条件弹窗 */}
      <DocumentFilterCriteriaModel
        ref={documentFilterCriteriaRef}
        readOnly={readOnly}
        dataObj={data}
        updateMetadataFilteringCondition={updateMetadataFilteringCondition}
      />
      {/* 知识库配置弹窗 */}
      <KnowledgeConf  ref={knowledgeConfRef} searchEvent={getKnowledgeBaseListEvent}></KnowledgeConf>
    </div>
  );
});

export default KnowledgeRetrievalPanel;
