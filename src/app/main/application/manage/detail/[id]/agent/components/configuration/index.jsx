"use client";
/**
 * 智能体管理页面组件
 * 功能包括：提示词编辑、变量管理、知识库管理、MCP服务配置、记忆设置、模型选择、聊天测试等
 */
import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./index.module.css";
import {
  getAgentDetail,
  getAgentVariableList,
  deleteAgentVariable,
  updateAgentInfo,
  getAgentModelList,
  batchCreateAgentVariable,
  getAgentKnowledgeList,
  deleteKnowledgeFromAgent,
} from "@/api/agent";
import { Button, Select, message, Popover, Tooltip, Typography } from "antd";
import VariableModel from "../VariableAddOrEdit.jsx";
import ModelSelect from "../ModelSelect";
import Optimization from "../Optimization"; // 提示词优化组件
import ContentInput from "../ContentInput"; // 提示词输入组件
import ConfirmAdd from "../ConfirmAdd"; // 确认添加组件
import KnowledgeSelect from "../KnowledgeSelect"; // 知识库选择组件
import KnowledgeConf from "../../../../../../../knowledge/components/Update"; // 知识库配置组件
import AgentChat from "../Chat";
import AgentItem from "../Item";
import McpSelect from "../McpSelect";
import { checkPermission } from "@/utils/utils";
import Memory from "../set/memory";
const AgentConfig = forwardRef((props, ref) => {
  const { id } = useParams();
  const { Text } = Typography;
  const router = useRouter();
  useImperativeHandle(ref, () => ({
    closeChatEvent
  }));
  // ========== State 状态管理 ==========
  const [agentInfo, setAgentInfo] = useState({}); // 智能体基本信息
  const [textNum, setTextNum] = useState(0); // 提示词字符数
  const [variableList, setVariableList] = useState([]); // 变量列表
  const [isHovered, setIsHovered] = useState(false); // 是否鼠标悬停
  const [selectedVariable, setSelectedVariable] = useState({}); // 当前选中的变量
  const [modelList, setModelList] = useState([]); // 模型列表
  const [selectedModel, setSelectedModel] = useState(null); // 当前选中的模型
  const [popupVisible, setPopupVisible] = useState(false); // 变量选择弹框显示状态
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 }); // 变量选择弹框位置
  const [variableAddShow, setVariableAddShow] = useState(false); // 批量添加变量弹框显示状态
  const [popupVisibleOptimization, setPopupVisibleOptimization] =
    useState(false); // 提示词优化弹框显示状态
  const [selectKnowledge, setSelectKnowledge] = useState({}); // 当前选中的知识库
  const [agentId, setAgentId] = useState(null); // 智能体ID
  const [knowledgeList, setKnowledgeList] = useState([]); // 知识库列表
  const [mcpList, setMcpList] = useState([]); // MCP服务列表
  const [canCreate, setCanCreate] = useState(false); // 是否有创建/编辑权限

  // ========== Refs 组件引用 ==========
  const variableModelRef = useRef(null); // 变量新增/编辑弹框组件引用
  const modelSelectRef = useRef(null); // 模型选择组件引用
  const contentInputRef = useRef(null); // 提示词输入组件引用
  const confirmAddRef = useRef(null); // 确认添加变量组件引用
  const agentContentRef = useRef(null); // 编辑器容器引用
  const knowledgeRef = useRef(null); // 知识库选择组件引用
  const knowledgeConfRef = useRef(null); // 知识库配置组件引用
  const chatRef = useRef(null); // 聊天测试组件引用
  const mcpItemRef = useRef(null); // MCP服务项组件引用
  const mcpSelectRef = useRef(null); // MCP选择组件引用
  const memoryRef = useRef(null); // 记忆设置组件引用
  const publishRef = useRef(null); // 发布组件引用
  const [tab, setTab] = useState("promptWords"); //promptWords 记忆 skills knowledge
  const promptWordRef = useRef(null); // 提示词编辑器引用
  const memoryContentRef = useRef(null); // 记忆内容区域引用
  const [isVariableExpanded, setIsVariableExpanded] = useState(false); // 变量是否展开
  const [isMemoryExpanded, setIsMemoryExpanded] = useState(false); // 记忆是否展开
  const [isKnowledgeExpanded, setIsKnowledgeExpanded] = useState(false); // 知识是否展开
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false); // 技能是否展开
  const mcpContentRef = useRef(null); // MCP服务内容区域引用
  const knowledgeContentRef = useRef(null); // 知识库内容区域引用
  const agentScrollRef = useRef(null); // 智能体内容区域引用
  const [currentTab, setCurrentTab] = useState("0"); // 当前选中的标签
  const [reasoningModeArray, setReasoningModeArray] = useState([]);
  // ========== 常量定义 ==========
  /** 知识库检索类型映射 */
  const knowledgeType = {
    FULL_TEXT: "全文检索",
    HYBRID: "混合检索",
    VECTOR: "向量检索",
  };

  const leftTabList = [
    { label: "提示词", value: "promptWords" },
    { label: "记忆", value: "memory" },
    { label: "技能", value: "skills" },
    { label: "知识", value: "knowledge" },
  ];
  const tabList = [
    { label: "编排", key: "0" },
    { label: "访问API", key: "1" },
  ];
  // ========== 初始化函数 ==========
  /**
   * 初始化数据
   * 依次获取模型列表、知识库列表、变量列表
   * @param {string} id - 智能体ID
   */
  const initFunction = async (id) => {
    await getAgentModelListEvent(id);
    await getAgentKnowledgeListEvent(id);
    await getVariableListEvent(id);
  };

  // ========== 生命周期 ==========
  /**
   * 组件初始化
   * 检查权限、设置智能体ID、初始化数据
   */
  useEffect(() => {
  
    setAgentId(id);
  
    initFunction(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ========== 智能体详情相关 ==========
  /**
   * 获取智能体详情
   * @param {string} id - 智能体ID
   * @param {Array} modelArr - 模型数组
   * @param {boolean} isUpdate - 是否为更新操作（更新时不重置提示词编辑器）
   */
  const getAgentDetailEvent = async (id, modelArr, isUpdate) => {
    await getAgentDetail(id).then((res) => {
      const data = res.data;

      // 设置提示词内容（仅在非更新时设置，避免覆盖用户正在编辑的内容）
      if (!isUpdate && contentInputRef.current) {
        contentInputRef.current.setValue(data.promptWords);
      }

      // 设置当前选中的模型
      if (modelArr && modelArr.length > 0) {
        const modelObj = modelArr.find((item) => item.id === data.modelId);
        let reasoningMode = modelObj?.reasoningMode ||[];
        let reasoningModes = parseReasoningMode(reasoningMode);
        setReasoningModeArray(reasoningModes);
        setSelectedModel(modelObj);
      }
       let agentModeVal = data.agentMode || null;
       data.agentMode = agentModeVal;
       
      setAgentInfo(data);
      setDetailPermission(data);

      // 设置MCP服务列表
      const mcpData = data.mcpList || [];
      setMcpList(mcpData);
      props?.refreshAgentData();
    });
  };
  //设置详情权限
  const setDetailPermission = (data) => {
      let status = data.status;
    let  checkDefaultUrl ="/main/application/manage/integrated/operation";//内置内容权限
    let  checkUrl =status == 0 ? "/main/application/manage/unreleased/operation" : "/main/application/manage/released/operation";
    if(data.isIntegrated){
      checkUrl = checkDefaultUrl;
    }
    setCanCreate(checkPermission(checkUrl));
  }
  /**
   * 更新智能体信息
   * @param {Object} updateData - 要更新的数据
   */
  const updateAgentInfoEvent = (updateData) => {
    const data = { ...agentInfo, ...updateData };
    updateAgentInfo(data).then(() => {
      getAgentDetailEvent(id, modelList);
    });
  };

  // ========== 变量管理相关 ==========
  /**
   * 获取变量列表
   * @param {string} id - 智能体ID
   */
  const getVariableListEvent = (id) => {
    getAgentVariableList(id).then((res) => {
      setVariableList(res.data);
      setIsVariableExpanded(res.data.length > 0);
    });
  };

  /**
   * 更新变量列表
   * 刷新变量列表并同步更新聊天组件的变量
   */
  const updateVaiableList = () => {
    setIsVariableExpanded(true);
    getVariableListEvent(agentId);
    // 延迟更新聊天变量，确保变量列表已更新
    setTimeout(() => {
      updateChatVariable();
    }, 100);
  };

  /**
   * 更新聊天组件的变量列表
   */
  const updateChatVariable = () => {
    if (chatRef.current) {
      chatRef.current.updateVariableList(variableList);
    }
  };

  /**
   * 添加变量
   * 打开变量新增弹框
   */
  const addVariableEvent = () => {
    if (variableModelRef.current) {
      variableModelRef.current.showModal(agentId, "", "add");
    }
  };

  /**
   * 修改变量
   * @param {Object} obj - 要修改的变量对象
   */
  const editVariableEvent = (obj) => {
    if (variableModelRef.current) {
      variableModelRef.current.showModal(agentId, obj, "update");
    }
  };

  /**
   * 删除变量
   * @param {Object} obj - 要删除的变量对象
   */
  const deleteVariableEvent = (obj) => {
    deleteAgentVariable(obj.id).then(() => {
      // 从编辑器中移除该变量
      if (contentInputRef.current) {
        contentInputRef.current.removeVariable(obj.name);
      }
      getVariableListEvent(agentId);
      updateChatVariable();
    });
  };

  /**
   * 变量鼠标悬停事件
   * @param {Object} obj - 变量对象
   */
  const variableHover = (obj) => {
    setIsHovered(true);
    setSelectedVariable(obj);
  };

  /**
   * 变量鼠标移出事件
   */
  const variableMouseOut = () => {
    setIsHovered(false);
    setSelectedVariable({});
  };

  /**
   * 将变量插入到编辑器
   * @param {Object} item - 变量对象
   */
  const addVariableToEditor = (item) => {
    if (contentInputRef.current) {
      contentInputRef.current.insertVariable(item.name);
    }
    setPopupVisible(false);
  };

  /**
   * 在光标位置插入变量占位符
   */
  const insertVariableEvent = () => {
    if (contentInputRef.current) {
      contentInputRef.current.insertVariableAtCursor();
    }
    setPopupVisible(false);
  };

  /**
   * 控制变量选择弹框的显示/隐藏
   * @param {Object} pos - 弹框位置 {top, left}
   * @param {boolean} visible - 是否显示
   */
  const handlePopupVisible = (pos, visible) => {
    if (pos) {
      setPopupPos(pos);
    }
    setPopupVisible(visible);
  };

  /**
   * 编辑器失焦事件处理
   * 检测新变量并提示用户是否添加到变量列表
   * @param {Array} variables - 编辑器中的变量数组
   * @param {string} html - 编辑器HTML内容
   * @param {number} type - 事件类型（2表示失焦）
   */
  const onEditorBlur = (variables, html, type) => {
    // 找出编辑器中存在但变量列表中不存在的变量
    const newVariables = variables.filter(
      (item) => !variableList.some((v) => v.name === item)
    );

    // 如果是失焦事件且有新变量，显示确认添加弹框
    if (newVariables && newVariables.length > 0 && type === 2) {
      setVariableAddShow(true);
      setTimeout(() => {
        if (confirmAddRef.current) {
          confirmAddRef.current.showModal(newVariables);
        }
      }, 10);
    }

    // 更新智能体提示词内容
    updateAgentContent(html);
  };

  /**
   * 更新智能体提示词内容
   * @param {string} value - 提示词内容
   */
  const updateAgentContent = (value) => {
    const data = { ...agentInfo, promptWords: value };
    updateAgentInfo(data).then(() => {
      getAgentDetailEvent(agentId, modelList, true);
    });
  };


  const closeChatEvent = () => {
    console.log('测试关闭')
   chatRef.current?.closeChatEvent();
  }
  /**
   * 编辑器内容变化时的回调
   * 实时更新本地状态（不立即保存到服务器）
   * @param {string} value - 提示词内容
   */
  const updateTextByChange = (value) => {
    setAgentInfo({ ...agentInfo, promptWords: value });
  };

  /**
   * 设置文本长度
   * @param {number} val - 文本长度
   */
  const setTextLengthEvent = (val) => {
    setTextNum(val);
  };

  /**
   * 批量添加变量
   * @param {Array} arr - 变量名称数组
   */
  const batchsaveVariable = (arr) => {
    const data = arr.map((item) => ({
      name: item,
      applicationId: agentId,
      displayName: item,
      selectOptions: null,
      maxLength: 48,
      required: true,
      fieldType: "text",
    }));

    batchCreateAgentVariable(data)
      .then(() => {
        getVariableListEvent(agentId);
        setVariableAddShow(false);
        updateChatVariable();
      })
      .catch((err) => {
        console.error("批量添加变量失败:", err);
      });
  };

  /**
   * 关闭批量添加变量弹框
   */
  const cancelConfirmAddVisible = () => {
    setVariableAddShow(false);
  };

  // ========== 模型管理相关 ==========
  /**
   * 获取模型列表
   * @param {string} id - 智能体ID
   */
  const getAgentModelListEvent = async (id) => {
    const params = {
      type: 1,
      tagIdList: [1, 2, 3, 4],
      isShelf: 1,
      isOr: 1,
    };

    await getAgentModelList(params).then((res) => {
      const modelData = res.data;
      setModelList(modelData);
      getAgentDetailEvent(id, modelData);
    });
  };

  /**
   * 模型选择更新事件
   * @param {Object} data - 模型数据
   */
  /**
   * 更新模型选择，并同步agent信息
   * @param {Object} data - 选择的模型数据，通常包含modelId、modelName、以及reasoningMode对象
   */
  const updateModelSelect = (data) => {
    let reasoningModeArr = parseReasoningMode(data.reasoningMode);
   
    // 默认选中第一个推理模式的value作为agentMode，没有则为null
    let agentMode =
      reasoningModeArr.length > 0 ? reasoningModeArr[0].value : null;
    // 组装更新需要的结构体
    let updateData = {
      modelId: data.modelId,
      modelName: data.modelName,
      agentMode: agentMode,
    };
    // 更新reasoningMode数组，用于下拉等
    setReasoningModeArray(reasoningModeArr);
    // 发送agent信息更新事件
    updateAgentInfoEvent(updateData);
  };

  /**
   * 解析reasoningMode对象
   * @param {Object} reasoningModeObj - reasoningMode对象
   * @returns {Array} reasoningMode数组
   */
  const parseReasoningMode = (reasoningModeObj) => {
    if (reasoningModeObj && typeof reasoningModeObj === "object") {
      return Object.entries(reasoningModeObj).map(([label,value]) => ({ label:label, value: value }));
    }
    return [];
  }
  // ========== 提示词优化相关 ==========
  /**
   * 打开提示词优化弹框
   * 需要先配置模型才能使用优化功能
   */
  const createPromptEvent = () => {
    if (!agentInfo.modelId) {
      message.warning("请配置模型!");
      return;
    }
    setPopupVisibleOptimization(true);
  };

  /**
   * 关闭提示词优化弹框
   */
  const closeOptimizationEvent = () => {
    setPopupVisibleOptimization(false);
  };

  /**
   * 替换提示词内容
   * @param {string} value - 新的提示词内容
   */
  const replaceEvent = (value) => {
    if (contentInputRef.current) {
      contentInputRef.current.setValue(value);
    }
    updateAgentContent(value);
  };

  // ========== 知识库管理相关 ==========
  /**
   * 获取智能体知识库列表
   * @param {string} id - 智能体ID
   */
  const getAgentKnowledgeListEvent = (id) => {
    getAgentKnowledgeList({ applicationId: id }).then((res) => {
      setKnowledgeList(res.data);
      setIsKnowledgeExpanded(res.data.length > 0);
    });
  };

  /**
   * 更新知识库列表
   */
  const updateKnowledgeList = () => {
    getAgentKnowledgeListEvent(agentId);
  };

  /**
   * 添加知识库
   * 打开知识库选择弹框
   */
  const addAgentKnowledge = () => {
    if (knowledgeRef.current) {
      knowledgeRef.current.showModal(agentInfo, knowledgeList);
    }
  };

  /**
   * 编辑知识库配置
   * @param {Object} obj - 知识库对象
   */
  const editKnowledgeEvent = (obj) => {
    if (knowledgeConfRef.current) {
      knowledgeConfRef.current.showModal(obj, "agent");
    }
  };

  /**
   * 删除知识库
   * @param {Object} obj - 要删除的知识库对象
   */
  const deleteKnowledgeEvent = (obj) => {
    const delData = {
      knowledgeBaseId: obj.id,
      applicationId: agentId,
    };
    deleteKnowledgeFromAgent(delData).then(() => {
      setSelectKnowledge({});
      updateKnowledgeList();
    });
  };

  /**
   * 知识库鼠标悬停事件
   * @param {Object} obj - 知识库对象
   */
  const knowledgeHover = (obj) => {
    console.log(obj,'obj');

    setIsHovered(true);
    setSelectKnowledge(obj);
  };

  /**
   * 知识库鼠标移出事件
   */
  const knowledgeMouseOut = () => {
    setIsHovered(false);
    setSelectKnowledge({});
  };

  // ========== MCP服务相关 ==========
  /**
   * 添加MCP服务
   * 打开MCP选择弹框
   */
  const addMcpEvent = () => {
    if (mcpSelectRef.current) {
      mcpSelectRef.current.showModal(agentInfo, mcpList);
    }
  };

  /**
   * 刷新MCP列表
   * 重新获取智能体详情以更新MCP列表
   */
  const refreshMcpList = () => {
    getAgentDetailEvent(agentId, modelList, true);
  };

  // ========== 记忆设置相关 ==========
  /**
   * 记忆设置变更事件
   * @param {Object} data - 记忆设置数据
   */
  const onMemoryChange = (data) => {
    updateAgentInfoEvent(data);
  };

  // ========== 其他功能 ==========
  /**
   * 返回上一页
   */
  const backEvent = () => {
    let unReleasedPath = "/main/application/manage/unreleased";
    let releasedPath = "/main/application/manage/released";
    if (agentInfo.status === 0) {
      router.push(unReleasedPath);
    } else {
      router.push(releasedPath);
    }
  };

  /**
   * 发布智能体
   * 需要先配置模型才能发布
   */
  const publishEvent = () => {
    if (!agentInfo.modelId) {
      message.warning("请配置模型!");
      return;
    }
    if (publishRef.current) {
      publishRef.current.showModal(agentInfo, "agent");
    }
  };

  // ========== Popover内容组件 ==========
  /** 模型选择弹框内容 */
  const popoverContent = (
    <ModelSelect
      ref={modelSelectRef}
      agentInfo={agentInfo}
      updateModelSelect={updateModelSelect}
      canCreate={canCreate}
    />
  );

  /** 提示词优化弹框内容 */
  const popoverTipContent = (
    <Optimization
      agentInfo={agentInfo}
      replaceEvent={replaceEvent}
      closeOptimizationEvent={closeOptimizationEvent}
      updateAgentInfoEvent={updateAgentInfoEvent}
    />
  );

  // ========== 副作用处理 ==========
  /**
   * 监听编辑器滚动事件
   * 滚动时隐藏变量选择弹框
   */
  useEffect(() => {
    const handleScroll = () => {
      setPopupVisible(false);
    };

    const currentRef = agentContentRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    // 组件卸载时移除监听
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  /**
   * 左侧菜单点击事件
   * @param {string} value - 菜单值
   */
  const leftTabClickEvent = (value) => {
    switch (value) {
      case "promptWords":
        promptWordRef.current.scrollIntoView({ behavior: "smooth" });
        break;
      case "memory":
        memoryContentRef.current.scrollIntoView({ behavior: "smooth" });
        break;
      case "skills":
        mcpContentRef.current.scrollIntoView({ behavior: "smooth" });
        break;

      case "knowledge":
        knowledgeContentRef.current.scrollIntoView({ behavior: "smooth" });
        break;
    }
    setTab(value);
  };

  // ========== 自动监听滚动区域并高亮 tab ==========
  /**
   * 监听滚动区域并自动高亮对应的 tab
   * 使用 IntersectionObserver 监听各个区域的可见性，选择可见性最高的区域对应的 tab
   */
  useEffect(() => {
    const container = agentScrollRef.current;
    if (!container) return;

    // 区域 ID 到 tab 值的映射
    const sectionToTabMap = {
      "prompt-section": "promptWords",
      "memory-section": "memory",
      "skills-section": "skills",
      "knowledge-section": "knowledge",
    };

    // 用于跟踪每个区域的可见性比例和位置信息
    const visibilityMap = {
      "prompt-section": 0,
      "memory-section": 0,
      "skills-section": 0,
      "knowledge-section": 0,
    };

    // 存储每个区域的位置信息
    const sectionPositions = {};

    // 防抖函数，避免频繁更新 tab
    let updateTimer = null;
    const updateActiveTab = () => {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      updateTimer = setTimeout(() => {
        // 检查是否滚动到顶部
        const scrollTop = container.scrollTop;
        if (scrollTop <= 50 && promptWordRef.current) {
          // 滚动到顶部时，优先选择 prompt-section
          setTab("promptWords");
          return;
        }

        // 找到可见性最高的区域
        let maxVisibility = 0;
        let activeSection = null;

        // 计算每个区域在视口中的位置权重
        Object.keys(visibilityMap).forEach((sectionId) => {
          const visibility = visibilityMap[sectionId];
          const section = sectionPositions[sectionId];

          if (section && visibility > 0) {
            // 计算区域顶部距离容器顶部的距离
            const distanceFromTop = section.top - container.scrollTop;
            // 如果区域在视口上半部分，增加权重
            const positionWeight =
              distanceFromTop < container.clientHeight / 2 ? 1.2 : 1;
            const weightedVisibility = visibility * positionWeight;

            // 优先选择可见性更高且超过阈值的区域
            if (weightedVisibility > maxVisibility && visibility > 0.05) {
              maxVisibility = weightedVisibility;
              activeSection = sectionId;
            }
          }
        });

        // 如果有可见区域，更新对应的 tab
        if (activeSection && sectionToTabMap[activeSection]) {
          setTab(sectionToTabMap[activeSection]);
        }
      }, 50); // 50ms 防抖延迟
    };

    // 更新区域位置信息
    const updateSectionPositions = () => {
      const sections = [
        { ref: promptWordRef, id: "prompt-section" },
        { ref: memoryContentRef, id: "memory-section" },
        { ref: mcpContentRef, id: "skills-section" },
        { ref: knowledgeContentRef, id: "knowledge-section" },
      ];

      sections.forEach(({ ref, id }) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          sectionPositions[id] = {
            top: rect.top - containerRect.top + container.scrollTop,
            bottom: rect.bottom - containerRect.top + container.scrollTop,
            height: rect.height,
          };
        }
      });
    };

    const observerOptions = {
      root: container,
      rootMargin: "-10% 0px -10% 0px", // 减小负边距，让顶部区域更容易被检测
      threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1], // 增加更多阈值点，包括更小的阈值
    };

    const observer = new IntersectionObserver((entries) => {
      // 更新所有区域的可见性比例
      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        if (sectionId in visibilityMap) {
          visibilityMap[sectionId] = entry.intersectionRatio;
        }
      });

      // 更新区域位置信息
      updateSectionPositions();

      // 触发 tab 更新
      updateActiveTab();
    }, observerOptions);

    // 滚动事件监听，用于检测滚动到顶部的情况
    const handleScroll = () => {
      updateSectionPositions();
      updateActiveTab();
    };

    // 使用 setTimeout 确保 DOM 已渲染
    const timer = setTimeout(() => {
      updateSectionPositions();

      const sections = [
        { ref: promptWordRef, id: "prompt-section" },
        { ref: memoryContentRef, id: "memory-section" },
        { ref: mcpContentRef, id: "skills-section" },
        { ref: knowledgeContentRef, id: "knowledge-section" },
      ];

      sections.forEach(({ ref, id }) => {
        if (ref.current) {
          // 确保元素有正确的 id
          if (!ref.current.id) {
            ref.current.id = id;
          }
          observer.observe(ref.current);
        }
      });

      // 添加滚动事件监听
      container.addEventListener("scroll", handleScroll, { passive: true });

      // 初始化时也检查一次
      updateActiveTab();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles["agent_config_container"]}>
      {/* 提示词优化弹框遮罩层 */}
      {popupVisibleOptimization && (
        <div className="popover-mask" onClick={closeOptimizationEvent}></div>
      )}

      {/* 主要内容区域 */}
      <div className={styles["agent_container_content"]}>
        {/* 左侧菜单区域（预留） */}
        <div className={styles["agent_container_left"]}>
          <div className={styles["agent_container_left_menu"]}>
            {leftTabList.map((item) => (
              <div
                onClick={() => leftTabClickEvent(item.value)}
                key={item.value}
                className={`${styles["left_menu_item"]} ${
                  tab === item.value ? styles["left_menu_item_active"] : ""
                }`}
              >
                <div
                  className={
                    tab === item.value
                      ? styles["left_menu_item_icon_active"]
                      : styles["left_menu_item_icon"]
                  }
                >
                  <img
                    className={styles["left_menu_item_icon_img"]}
                    src={
                      tab === item.value
                        ? "/agent/tab/" + item.value + "_selected.png"
                        : "/agent/tab/" + item.value + "_unselected.png"
                    }
                    alt={item.label}
                  />
                </div>
                <div
                  className={`${styles["left_menu_item_text"]} ${
                    tab === item.value
                      ? styles["left_menu_item_text_active"]
                      : ""
                  }`}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className={styles["agent_container_right"]}>
          {/* 左侧编辑区域 */}
          <div className={styles["agent_container_right_content_left"]}>
            {/* 编辑区域头部：标题、推理模式、模型选择 */}
            <div className={styles["agent_container_right_header"]}>
              <div className={styles["agent_container_right_header_title"]}>
                应用编辑
              </div>

              <div className={styles["agent_container_right_header_right"]}>
                {/* 推理模式选择 */}
                <div className={styles["agent_agentMode"]}>
                  <div className={styles["agent_agentMode_title"]}>
                    <img
                      src="/agent/agentMode.png"
                      className={styles["agent_agentMode_title_img"]}
                      alt=""
                    />
                    <span className={styles["agent_agentMode_title_text"]}>
                      推理模式：
                    </span>
                  </div>
                  <Select
                    options={reasoningModeArray}
                    value={agentInfo.agentMode}
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(55,114,254,0.06)",
                    }}
                    disabled={!canCreate}
                    classNames={{
                      root: styles["agent_agentMode_select"],
                    }}
                    placeholder='请选择推理模式'
                    variant="borderless"
                    onChange={(value) => {
                      setAgentInfo({ ...agentInfo, agentMode: value });
                      updateAgentInfoEvent({ agentMode: value });
                    }}
                  />
                </div>

                {/* 模型选择弹框 */}
                <Popover
                  className={styles["popover_content"]}
                  classNames={{
                    root: styles["popover_content_root"],
                  }}
                  placement="bottomLeft"
                  arrow={false}
                  content={popoverContent}
                  trigger="click"
                  style={{ borderRadius: "16px" }}
                >
                  <div className={styles["agent_container_right_header_model"]}>
                    {selectedModel ? (
                      <div className={styles["model_label_render"]}>
                        {selectedModel.iconUrl && (
                          <img
                            className={styles["model_label_render_img"]}
                            src={
                              process.env.NEXT_PUBLIC_API_BASE +
                              selectedModel.iconUrl
                            }
                            alt={selectedModel.name}
                          />
                        )}
                        <div className={styles["model_label_render_title"]}>
                          {selectedModel.name}
                        </div>
                        {selectedModel.classificationName && (
                          <div className={styles["model_label_render_type"]}>
                            {selectedModel.classificationName}
                          </div>
                        )}
                        {selectedModel.tagList &&
                          selectedModel.tagList.length > 0 && (
                            <div className={styles["model_label_render_tag"]}>
                              {selectedModel.tagList
                                .map((tag) => tag.name)
                                .join(",")}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className={styles["model_label_render"]}>
                        请选择模型
                      </div>
                    )}
                    <div
                      className={
                        styles["agent_container_right_header_model_img"]
                      }
                    >
                      <img src="/agent/model.png" alt="模型" />
                    </div>
                  </div>
                </Popover>
              </div>
            </div>
            {/* 编辑内容区域 */}
            <div
              ref={agentScrollRef}
              className={styles["agent_container_right_content_left_content"]}
            >
              {/* 提示词编辑区域 */}
              <div
                ref={promptWordRef}
                className={
                  agentInfo.promptWords
                    ? styles["agent_prompt_word"]
                    : styles["agent_prompt_word_empty"]
                }
                id="prompt-section"
              >
                {/* 提示词头部 */}
                <div className={styles["agent_prompt_word_header"]}>
                  <div className={styles["agent_prompt_word_header_left"]}>
                    提示词
                    <Tooltip title="提示词用于对AI的回复做出一系列指令和约束。可插入表单变量，例如{{input}}。这段提示词不会被最终用户所看到。">
                      <img
                        className={styles["info_img"]}
                        style={{ marginTop: 2 }}
                        src="/agent/info.png"
                        alt="提示"
                      />
                    </Tooltip>
                  </div>

                  <div className={styles["agent_prompt_word_header_right"]}>
                    {/* 字符数统计 */}

                    {/* 提示词优化按钮 */}
                    <Popover
                      classNames={{
                        root: "popover_content",
                      }}
                      placement="rightTop"
                      arrow={false}
                      open={popupVisibleOptimization}
                      content={popoverTipContent}
                      trigger="click"
                    >
                      <Button
                        className={
                          !agentInfo.promptWords || !canCreate
                            ? styles[
                                "agent_prompt_word_header_right_btn_disabled"
                              ]
                            : styles["agent_prompt_word_header_right_btn"]
                        }
                        disabled={!agentInfo.promptWords || !canCreate}
                        size="small"
                        onClick={createPromptEvent}
                      >
                        <img
                          className={
                            styles["agent_prompt_word_header_right_btn_img"]
                          }
                          src="/agent/optimize.png"
                          alt="优化"
                        />
                        帮我优化
                      </Button>
                    </Popover>
                  </div>
                </div>
                <div className={styles["agent_prompt_word_main"]}>
                  {/* 提示词编辑器 */}
                  <div
                    className={styles["agent_prompt_word_content"]}
                    ref={agentContentRef}
                  >
                    <ContentInput
                      canCreate={canCreate}
                      updateTextByChange={updateTextByChange}
                      ref={contentInputRef}
                      handlePopupVisible={handlePopupVisible}
                      onEditorBlur={onEditorBlur}
                      setTextLengthEvent={setTextLengthEvent}
                    />
                  </div>
                  <div className={styles["agent_prompt_word_header_right_num"]}>
                    {textNum}
                  </div>
                </div>
                {/* 变量选择下拉框 */}
                {popupVisible && (
                  <div
                    className={styles["variable_select"]}
                    style={{
                      top: popupPos.top,
                      left: popupPos.left,
                    }}
                    onMouseDown={(e) => e.preventDefault()} // 阻止编辑器失焦
                    onMouseLeave={() => setPopupVisible(false)} // 鼠标移出时隐藏弹框
                  >
                    {/* 变量列表 */}
                    {variableList.map((item) => (
                      <div
                        key={item.id}
                        className={styles["variable_select_item"]}
                        onClick={() => addVariableToEditor(item)}
                      >
                        <div className={styles["agent_variable_name"]}>
                          <img
                            className={
                              styles["agent_variable_item_left_icon_img"]
                            }
                            src="/agent/variable.png"
                            alt="变量"
                          />
                          <div
                            className={styles["agent_variable_name_content"]}
                          >
                            {item.name}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 添加新变量选项 */}
                    <div
                      className={styles["variable_select_item"]}
                      onClick={insertVariableEvent}
                    >
                      <div className={styles["agent_variable_name"]}>
                        <img
                          className={
                            styles["agent_variable_item_left_icon_img"]
                          }
                          src="/agent/variable.png"
                          alt="变量"
                        />
                        <div className={styles["agent_variable_name_content"]}>
                          添加新变量
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 批量添加变量确认弹框 */}
                {variableAddShow && (
                  <ConfirmAdd
                    ref={confirmAddRef}
                    cancelConfirmAddVisible={cancelConfirmAddVisible}
                    batchsaveVariable={batchsaveVariable}
                  />
                )}
              </div>
              <div
                className={styles["memory_content_scroll"]}
                ref={memoryContentRef}
                id="memory-section"
              >
                <div className={styles["memory_content_scroll_title"]}>
                  记忆
                </div>
                {/* 记忆设置 */}
                {/* 变量管理区域 */}
                <div className={styles["agent_variable_content"]}>
                  <div
                    className={`${styles["agent_variable_content_header"]} ${
                      !isVariableExpanded ? styles["left_tab_item_active"] : ""
                    }`}
                  >
                    <div
                      onClick={() => setIsVariableExpanded(!isVariableExpanded)}
                      className={styles["agent_variable_content_header_left"]}
                    >
                      <img
                        src="/workflow/arrow_bottom.png"
                        alt="展开"
                        className={`${styles.track_step_expand} ${
                          isVariableExpanded ? styles.expanded : ""
                        }`}
                      />
                      变量
                      <Tooltip title="变量将以表单形式让用户在对话前填写，用户填写的表单内容将自动替换提示词中的变量。">
                        <img
                          className={styles["info_img"]}
                          src="/agent/info.png"
                          alt="提示"
                        />
                      </Tooltip>
                    </div>
                    {canCreate && (
                      <div
                        className={
                          styles["agent_variable_content_header_right"]
                        }
                        onClick={addVariableEvent}
                      >
                        <img
                          className={styles["add_img"]}
                          src="/agent/add.png"
                          alt="添加"
                        />
                        <span>添加</span>
                      </div>
                    )}
                  </div>

                  {/* 变量列表 */}
                  {variableList.length > 0 && isVariableExpanded && (
                    <div className={styles["agent_variable_content_list"]}>
                      {variableList.map((item) => (
                        <div
                          key={item.id}
                          className={styles["agent_variable_item"]}
                          onMouseEnter={() => variableHover(item)}
                          onMouseLeave={variableMouseOut}
                        >
                          <div className={styles["agent_variable_item_left"]}>
                            <div
                              className={
                                styles["agent_variable_item_left_content"]
                              }
                            >
                              <div className={styles["agent_variable_name"]}>
                                <Text
                                  style={{ maxWidth: 260 }}
                                  ellipsis={{ tooltip: item.name }}
                                >
                                  <span
                                    className={
                                      styles["agent_variable_name_span"]
                                    }
                                  >
                                    {" "}
                                    {`{{${item.name}}}`}
                                  </span>
                                </Text>
                              </div>

                              <div
                                className={styles["agent_variable_displayName"]}
                              >
                                <Text
                                  style={{ maxWidth: 300 }}
                                  ellipsis={{ tooltip: item.displayName }}
                                >
                                  <span
                                    className={
                                      styles["agent_variable_displayName_span"]
                                    }
                                  >
                                    {" "}
                                    {item.displayName}
                                  </span>
                                </Text>
                              </div>
                            </div>
                          </div>

                          <div className={styles["agent_variable_item_right"]}>
                            {/* 未悬停或悬停的不是当前项：显示字段类型 */}
                            {(!isHovered ||
                              (isHovered &&
                                selectedVariable.id !== item.id)) && (
                              <div
                                className={
                                  styles["agent_variable_item_fieldType"]
                                }
                              >
                                <div
                                  className={
                                    styles["agent_variable_item_fieldType_text"]
                                  }
                                >
                                  {" "}
                                  {item.fieldType}
                                </div>
                                <img
                                  alt="字段类型"
                                  src={"/agent/" + item.fieldType + ".png"}
                                  className={
                                    styles["agent_variable_item_fieldType_img"]
                                  }
                                />
                              </div>
                            )}

                            {/* 有权限且悬停的是当前项：显示编辑删除按钮 */}
                            {canCreate &&
                              isHovered &&
                              selectedVariable.id === item.id && (
                                <div
                                  className={styles["agent_variable_item_btn"]}
                                >
                                  <img
                                    src="/agent/edit.png"
                                    onClick={() => editVariableEvent(item)}
                                    alt="编辑"
                                  />
                                  <img
                                    src="/agent/delete.png"
                                    onClick={() => deleteVariableEvent(item)}
                                    alt="删除"
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Memory
                  data={agentInfo}
                  ref={memoryRef}
                  canCreate={canCreate}
                  onMemoryChange={onMemoryChange}
                />
              </div>
              <div
                className={styles["agent_mcp_config"]}
                ref={mcpContentRef}
                id="skills-section"
              >
                <div className={styles["agent_mcp_config_title"]}>技能</div>
                {/* MCP服务管理 */}
                <AgentItem
                  ref={mcpItemRef}
                  title="MCP服务"
                  tooltip="智能体可以通过标准化协议（MCP）连接企业内部服务API并发起调用"
                  agentId={agentId}
                  data={mcpList}
                  addItemEvent={addMcpEvent}
                  refreshMcpList={refreshMcpList}
                  canCreate={canCreate}
                />
              </div>
              {/* 知识库管理区域 */}
              <div
                className={styles["agent_knowledge_content"]}
                ref={knowledgeContentRef}
                id="knowledge-section"
              >
                <div className={styles["agent_mcp_config_title"]}>知识</div>
                <div
                  className={`${styles["agent_variable_content_header"]} ${
                    !isKnowledgeExpanded ? styles["left_tab_item_active"] : ""
                  }`}
                >
                  <div
                    className={styles["agent_variable_content_header_left"]}
                    onClick={() => setIsKnowledgeExpanded(!isKnowledgeExpanded)}
                  >
                    <img
                      src="/workflow/arrow_bottom.png"
                      alt="展开"
                      className={`${styles.track_step_expand} ${
                        isKnowledgeExpanded ? styles.expanded : ""
                      }`}
                    />
                    知识库
                  </div>
                  {canCreate && (
                    <div
                      className={styles["agent_variable_content_header_right"]}
                      onClick={addAgentKnowledge}
                    >
                      <img
                        className={styles["add_img"]}
                        src="/agent/add.png"
                        alt="添加"
                      />
                      <span>添加</span>
                    </div>
                  )}
                </div>

                {/* 知识库列表 */}
                {isKnowledgeExpanded && (
                  <div className={styles["agent_variable_content_list"]}>
                    {knowledgeList.map((item) => (
                      <div
                        key={item.id}
                        className={styles["agent_knowledge_item"]}
                        onMouseEnter={() => knowledgeHover(item)}
                        onMouseMove={() => knowledgeHover(item)}
                        onMouseLeave={knowledgeMouseOut}
                      >
                        <div className={styles["agent_knowledge_item_left"]}>
                          <img
                            className={
                              styles["agent_knowledge_item_left_icon_img"]
                            }
                            src="/agent/knowledge.png"
                            alt="知识库"
                          />
                          <div
                            className={`${styles["agent_variable_item_left_content"]} ${styles["agent_knowledge_name"]}`}
                          >
                            <Text
                              style={{ maxWidth: "100%" }}
                              ellipsis={{ tooltip: item.name }}
                            >
                              {item.name}
                            </Text>
                          </div>
                        </div>

                        <div className={styles["agent_variable_item_right"]}>
                          {/* 未悬停或悬停的不是当前项：显示检索类型 */}
                          {(!isHovered ||
                            (isHovered && selectKnowledge.id !== item.id)) && (
                            <div
                              className={
                                styles["agent_variable_item_fieldType"]
                              }
                            >
                              {item.searchStrategy
                                ? knowledgeType[item.searchStrategy]
                                : ""}
                            </div>
                          )}

                          {/* 有权限且悬停的是当前项：显示编辑删除按钮 */}
                          {canCreate &&
                            isHovered &&
                            selectKnowledge.id === item.id && (
                              <div
                                className={styles["agent_variable_item_btn"]}
                              >
                                <img
                                  src="/agent/edit.png"
                                  onClick={() => editKnowledgeEvent(item)}
                                  alt="编辑"
                                />
                                <img
                                  src="/agent/delete.png"
                                  onClick={() => deleteKnowledgeEvent(item)}
                                  alt="删除"
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：聊天测试区域 */}
          <div className={styles["agent_container_right_content_right"]}>
            <AgentChat
              canCreate={canCreate}
              variableList={variableList}
              ref={chatRef}
              agentInfo={agentInfo}
            />
          </div>
        </div>
      </div>

      {/* ========== 弹框组件 ========== */}
      {/* 变量新增/编辑弹框 */}
      <VariableModel
        ref={variableModelRef}
        updateVaiableList={updateVaiableList}
      />

      {/* 知识库选择弹框 */}
      <KnowledgeSelect
        ref={knowledgeRef}
        updateKnowledgeList={updateKnowledgeList}
      />

      {/* 知识库配置弹框 */}
      <KnowledgeConf ref={knowledgeConfRef} searchEvent={updateKnowledgeList} />

      {/* MCP选择弹框 */}
      <McpSelect ref={mcpSelectRef} refreshMcpList={refreshMcpList} />
    </div>
  );
});

export default AgentConfig;
