"use client";

// React 核心库导入
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback
} from "react";

// 第三方UI组件库导入
import { Popover, message, Typography, Divider, Tooltip } from "antd";
import { Bubble, Sender } from "@ant-design/x";
import { UserOutlined } from "@ant-design/icons";

// 工具库导入
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Cookies from "js-cookie";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useChat } from "@/hooks/useChat"; // 多智能体思考过程处理函数

// 项目内部组件和工具导入
import VariableForm from "./VariableForm";
import LongMemory from "./LongMemory"; // 长期记忆组件
import { getUuid, groupByPrefix } from "@/utils/utils";
import styles from "./agent.module.css";
import { useParams } from "next/navigation";
import ThinkingTypewriter from "@/app/components/agent/ThinkingTypewriter"; // 思考类型写入组件

// 全局变量声明
let eventSource = null;

// 常量定义
const API_ENDPOINTS = {
  CHAT_TEST: "/voicesagex-console/application-web/api/agentChatUrl",
};

const RETRY_CONFIG = {
  INTERVAL: 2000,
  MAX_RETRIES: 1,
};

const SCROLL_CONFIG = {
  BLOCK: "nearest",
};

const POPOVER_ALIGN_CONFIG = {
  points: ["tr", "br"],
  offset: [10, 5],
};

/**
 * AgentChat 组件 - 智能对话聊天组件
 * 支持实时流式对话、变量表单、长期记忆等功能
 */
const AgentChat = forwardRef((props, ref) => {
  // 解构props，设置默认值
  const {
    applicationInfo = {},
    variableList = [],
    canCreate = true,
    type = "experience", //数据类型草稿draft，已发布published，试用experience
  } = props;
  const { key } = useParams();
  // ========== 状态管理 ==========
  const { handleMultiAgentThinking,thinkDataToMarkdown } = useChat(); // 多智能体思考过程处理函数
  // 聊天相关状态
  const [chatList, setChatList] = useState([]); // 聊天消息列表
  const [chatHistory, setChatHistory] = useState([]); // 聊天历史记录
  const [currentId, setCurrentId] = useState(null); // 当前对话ID

  // UI状态管理
  const [popoverOpen, setPopoverOpen] = useState(false); // 变量表单弹窗状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [isStop, setIsStop] = useState(false); // 停止状态
  const [hiddenStop, setHiddenStop] = useState(false); // 隐藏停止按钮状态

  // 输入相关状态
  const [query, setQuery] = useState(null); // 当前输入内容

  // 尺寸相关状态
  const [chatWidth, setChatWidth] = useState(0); // 聊天区域宽度
  const [chatHeight, setChatHeight] = useState(0); // 聊天区域高度
  const [formHeight, setFormHeight] = useState(0); // 表单高度
  const [mainWidth, setMainWidth] = useState(1000);
  // ========== Ref引用 ==========

  // 组件引用
  const variableFormRef = useRef(null); // 变量表单组件引用
  const longMemoryRef = useRef(null); // 长期记忆组件引用
  const chatRef = useRef(null); // 聊天容器引用
  const chatContentRef = useRef(null); // 聊天内容区域引用
  const listRef = useRef(null); // 消息列表引用
  const urlChatIdRef = useRef(null); // 对话ID引用
  const [typing, setTyping] = useState(true);
  const [goNext, setGoNext] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set()); //展开的节点
  const [chatUrl, setChatUrl] = useState(API_ENDPOINTS.CHAT_TEST); // 聊天API URL
  const [agentType, setAgentType] = useState("single"); // 智能体类型
  // 控制引用
  const isStopRef = useRef(false); // 停止状态引用（用于异步操作中保持最新状态）
  const abortRef = useRef(null); // 请求中止控制器引用
  const [pushComplete, setPushComplete] = useState(false); //思考过程是否推送完成
  const thinkTypingCompleteRef = useRef(false); //思考过程是否打字完成的ref
  const pushCompleteRef = useRef(false); //思考过程是否推送完成的ref
  const currentIdRef = useRef(null); // 当前对话 id 的 ref，供 SSE 回调使用
  const [isStartPush,setIsStartPush] =useState(false);//是否开始
  // ========== 组件对外暴露的方法 ==========

  // 监听智能体类型变化，更新聊天API URL
  useEffect(() => {
    let appType = applicationInfo?.agentType || "single";
    let url = "";
    if (appType == "multiple") {
      // 多智能体模式
      url = "/voicesagex-console/application-web/api/multipleAgentChatUrl";
    } else {
      // 单智能体模式
      url = API_ENDPOINTS.CHAT_TEST;
    }
    setAgentType(appType);
    setChatUrl(url);
  }, [applicationInfo]);
  /**
   * 更新变量列表
   * 供父组件调用，用于刷新变量表单
   */
  const updateVariableList = () => {
    variableFormRef?.current.updateChatForm();
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateVariableList,
    setUrlChatIdAndChatHistory,
    stopByDeleteEvent,
  }));

  // ========== 副作用处理 ==========

  /**
   * 同步停止状态到ref
   * 确保异步操作中能获取到最新的停止状态
   */
  useEffect(() => {
    isStopRef.current = isStop;
  }, [isStop]);

  /**
   * 计算聊天区域宽度
   * 当聊天容器尺寸变化时更新宽度
   */
  // 监听clientWidth的变化
  useEffect(() => {
    const resizeObserver = new window.ResizeObserver(() => {
      updateInputWidth();
    });
    if (chatRef.current) {
      resizeObserver.observe(chatRef.current);
    }
    return () => {
      if (chatRef.current) {
        resizeObserver.unobserve(chatRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  //更新输入框宽度
  const updateInputWidth = () => {
    if (chatRef.current) {
      setChatWidth(chatRef.current.clientWidth - 150);
    }
  };

  /**
   * 计算聊天内容区域高度
   * 当聊天容器尺寸变化时更新高度
   */
  useEffect(() => {
    if (chatContentRef.current) {
      setChatHeight(chatContentRef.current.clientHeight - 32);
    }
  }, []);

  /**
   * 监听浏览器窗口缩放事件
   * 当窗口大小变化时重新计算聊天区域高度
   */
  const handleResize = () => {
    if (chatContentRef.current) {
      setChatHeight(chatContentRef.current.clientHeight - 32);
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * 根据变量列表长度控制弹窗显示
   * 当有变量时自动显示弹窗
   */
  useEffect(() => {
    setPopoverOpen(variableList.length > 0);
  }, [variableList]);

  /**
   * 弹窗关闭时重置表单高度
   * 确保UI布局正确
   */
  useEffect(() => {
    if (!popoverOpen) {
      setFormHeight(0);
    }
  }, [popoverOpen]);

  // ========== 事件处理函数 ==========

  /**
   * 处理弹窗开关状态
   * 只有在有变量时才允许切换弹窗状态
   */
  const handleOpenChange = () => {
    if (variableList.length) {
      setPopoverOpen((prev) => !prev);
    }
  };
  // ========== 工具函数 ==========

  /**
   * 检查是否有必填项未填写
   * @returns {Promise<boolean>} 返回是否有必填项未填写
   */
  const findRequiredItem = async () => {
    // 检查是否有必填项
    const hasRequired = variableList.some((item) => item.required === true);
    if (!hasRequired) return false;

    // 获取表单所有值
    const values = (await variableFormRef.current?.getAllValue()) || {};

    // 检查必填项是否已填写
    return variableList.some((item) => {
      if (item.required) {
        return !values[item.name];
      }
      return false;
    });
  };

  /**
   * 清理图片链接，将https://file/路径转换为相对路径
   * @param {string} text - 需要处理的文本内容
   * @returns {string} 处理后的文本内容
   */
  const sanitizeImageLinks = (text) => {
    if (typeof text !== "string") return text;

    // 替换 markdown 图片链接中以 https://file/ 开头的路径
    let sanitized = text.replace(/!\[\]\(https:\/\/file\//g, "![](file/");

    // 替换 HTML <img> 标签中以 https://file/ 开头的 src，并添加 className
    sanitized = sanitized.replace(
      /<img\s+([^>]*)src=(["'])https:\/\/file\//g,
      (match, attrs, quote) => {
        // 检查是否已经有 className
        if (attrs.includes("class=")) {
          return match.replace(`https://file/`, "file/");
        }
        return `<img className="chat-image" ${attrs}src=${quote}file/`;
      },
    );

    return sanitized;
  };
  // ========== 核心业务函数 ==========

  //设置urlChatId和聊天记录
  const setUrlChatIdAndChatHistory = (id, array) => {
    if (chatting) {
      return;
    }
    setTyping(false);
    urlChatIdRef.current = id;
    setChatHistory(array);
    handleGenerateChatContent(array);
  };

  //处理生成对话内容
  const handleGenerateChatContent = (array) => {
    let arr = [];
    array.forEach((element) => {
      element.role = element.type == "human" ? "user" : element.type;
      if (element.type == "ai") {
        let subAgentThinkingProcess = element.subAgentThinkingProcess || [];
        element.thinkData = handleThinkDataAssemble(subAgentThinkingProcess);
        element.markdownThinkData =thinkDataToMarkdown(element.thinkData)
        element.isThinkComplete=true;
        element.isAllThinking=true;
      }
      arr.push(element);
    });
    console.log(arr);
    setChatList(arr);
  };

  //处理思考数据展示数组
  const handleThinkDataAssemble = (arr) => {
    let data = [];
    arr.forEach((item) => {
      let addObj = {
        task_name: item.task_name,
        agentList: item.agent_array,
      };
      data.push(addObj);
    });

    return data;
  };
  //处理智能体变量组装
  const handleVariableAssemble = (inputs) => {
    let res = {};
    if (applicationInfo.agentType == "multiple") {
      res = groupByPrefix(inputs);
    } else {
      res = inputs;
    }
    return res;
  };
  /**
   * 发送消息事件处理
   * 处理用户输入、验证必填项、建立连接、处理流式响应
   * @param {string} value - 用户输入的消息内容
   */
  const sendEvent = async (value) => {
    // 验证输入内容
    if (!value.trim()) {
      return message.warning("请输入对话内容");
    }
    setTyping(true);
    // 检查必填项
    const isRequired = await findRequiredItem();
    if (!popoverOpen && isRequired) {
      setPopoverOpen(true);
      setTimeout(() => {
        variableFormRef.current?.validateFrom();
      }, 100);
      return false;
    }
    props?.setCanOperateLeftPanelEvent(false);
    setChatting(true);
    // 准备发送请求
    setIsStartPush(false);
    setHiddenStop(false);
    let formData = await variableFormRef.current?.validateFrom();
    let inputs = handleVariableAssemble(formData);
    const uuid = getUuid();
    setCurrentId(uuid);
    currentIdRef.current = uuid;
    const startTime = new Date().getTime();
    abortRef.current = new AbortController();
    let isComplete = agentType == "multiple" ? false : true; // 思考过程全部出现
    thinkTypingCompleteRef.current = isComplete;
    pushCompleteRef.current = isComplete;
    setPushComplete(isComplete);
    // 添加用户消息和AI占位消息到聊天列表
    setChatList((prev) => [
      ...prev,
      {
        role: "user",
        content: value,
        id: uuid,
      },
      {
        role: "ai",
        content: "",
        id: uuid,
        time: null,
        tokens: null,
        isThinkComplete: agentType == "multiple" ? false : true, // 思考过程全部出现
        isAllThinking: false, //是否全部思考信息都返回了
        cacheContent: "", //缓存答案内容
        thinkData:[],//思考过程数据
        markdownThinkData:"",
      },
    ]);
    let thinkDataArr = []//思考过程数据数组
    // 获取认证token并重置状态
    let token = localStorage.getItem("conversationToken");
    setQuery(null);
    setLoading(true);
    setIsStop(false);
    setGoNext(true);
    isStopRef.current = false;

    // 用于记录响应时间和token数量
    let time = null;
    let tokens = null;

    // 建立Server-Sent Events连接
    fetchEventSource(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        urlChatId: urlChatIdRef.current,
        query: value,
        conversationId: uuid,
        inputs,
        chatHistory,
        token: token, //对话token
        urlKey: key,
      }),
      signal: abortRef.current.signal,
      retryInterval: RETRY_CONFIG.INTERVAL,
      maxRetries: RETRY_CONFIG.MAX_RETRIES,
      openWhenHidden: true,

      /**
       * 连接打开时的处理
       */
      onopen() {
        console.log("SSE连接已建立");
      },

      /**
       * 接收消息时的处理
       * @param {Object} data - 接收到的数据
       */
      onmessage(data) {
        // 处理错误事件
        if (data.event === "error") {
          message.warning(data.data);
          setLoading(false);
          setIsStop(true);
          setHiddenStop(false);
          isStopRef.current = true;
          abortRef.current?.abort();
          props?.setCanOperateLeftPanelEvent(true);
          return;
        }
        if (data.event === "flushUrlChat") {
          //刷新对话列表
          let chatData = JSON.parse(data.data);
          urlChatIdRef.current = chatData;
          props?.refreshConversationListById(chatData);
        }

        // 处理正常消息事件
        if (data.event === "msg" && !isStopRef.current) {
          setIsStartPush(true);
          setHiddenStop(true);
          const chatData = JSON.parse(data.data);
          const id = data.id;
          const assistant_message = sanitizeImageLinks(
            chatData.assistant_message,
          );
          const chat_history = chatData.chat_history;
          if (chat_history.length == 2) {
            //如果聊天历史记录只有1条，则刷新对话列表
            urlChatIdRef.current = chatData.urlChatId;
            props?.refreshConversationListById(chatData.urlChatId);
          }
          setChatHistory(chat_history);

          // 处理使用统计信息
          if (chatData.usage) {
            const endTime = new Date().getTime();
            time = parseFloat(((endTime - startTime) / 1000).toFixed(2));
            tokens = chatData.usage.total_tokens;
          }
          let additional_kwargs = chatData.additional_kwargs; //思考过程数据
          setExpandedItemsEvent(id); //设置默认展示
          thinkDataArr=handleMultiAgentThinking(
            thinkDataArr,
            additional_kwargs
          );
          console.log(thinkDataArr,'思考数据')
          console.log(chatData.additional_kwargs,'思考过程打字结束')
          if (thinkDataArr.length == 0 && chatData.assistant_message) {
            thinkTypingCompleteRef.current = true;
          }   
          let isThinkComplete =
          agentType == "multiple" ? thinkTypingCompleteRef.current : true; 
          // 更新聊天列表 - 处理AI响应数据并更新UI
          setChatList((prev) => {
            let index = prev.findIndex(
              (item) => item.id === id && item.role === "ai"
            );
            if (index != -1) {
              let newList = [...prev];
              let nowData = newList[index]; //当前数据
              // 更新现有AI消息
              let newThinkData = thinkDataArr;
              // 判断是否所有思考信息都已返回
              let isAllThinking =
                additional_kwargs && additional_kwargs.is_subtask_done
                  ? true
                  : nowData.isAllThinking
                  ? true
                  : false;
              // 判断思考过程是否全部出现
              if (newThinkData.length == 0 && chatData.assistant_message) {
                thinkTypingCompleteRef.current = true;
              }
          
              let markdownThinkData = thinkDataToMarkdown(newThinkData);
              // 累积缓存内容
              let cacheContent =
                newList[index].cacheContent + assistant_message;
              // 思考过程打字结束后再结束思考状态，不在这里提前结束
              newList[index] = {
                ...newList[index],
                cacheContent: cacheContent,
                content: isThinkComplete ? cacheContent : "", // 只有在思考完成后才显示内容
                time: time,
                tokens: tokens,
                id: id,
                thinkData: newThinkData,
                isAllThinking: isAllThinking, // 有思考数据时处于思考中状态
                isThinkComplete: isThinkComplete, // 思考过程全部出现
                markdownThinkData: markdownThinkData,
              };
              return newList;
            } else {
              let newThinkData = thinkDataArr;
              // 添加新的AI消息
              return [
                ...prev,
                {
                  role: "ai",
                  cacheContent: assistant_message,
                  content: "",
                  id: id,
                  time: time,
                  tokens: tokens,
                  thinkData: newThinkData,
                  isThinkComplete: false, // 思考过程全部出现
                  isAllThinking: false,
                  markdownThinkData: markdownThinkData,
                },
              ];
            }
          });
          setGoNext(true);
          setChatting(false);
          props?.setCanOperateLeftPanelEvent(true);
        }
        if (data.event == "close"&&!isStopRef.current) {
            setPushComplete(true);
          pushCompleteRef.current = true;
          // 思考打字若已先完成，此时才 pushComplete，需在这里把答案显示出来
          if (thinkTypingCompleteRef.current&&currentIdRef.current) {
            const id = currentIdRef.current;
            setChatList((prev) =>
              prev.map((item) =>
                item.id === id && item.role === "ai"
                  ? {
                      ...item,
                      content: item.cacheContent ?? item.content,
                      isThinkComplete: true,
                    }
                  : item
              )
            );
          }
        }
      },

      /**
       * 连接关闭时的处理
       */
      onclose() {
        abortRef.current?.abort();
      },

      /**
       * 连接错误时的处理
       */
      onerror() {
        setLoading(false);
        abortRef.current?.abort();
        props?.setCanOperateLeftPanelEvent(true);
      },
    });
  };

  /**
   * 清空聊天记录
   * 只有在允许创建的情况下才能清空
   */
  const clearEvent = () => {
    if (canCreate) {
      setChatList([]);
      setChatHistory([]);
      stopEvent();
    }
  };

  const stopByDeleteEvent = () => {
    stopEvent('clear');
    setChatList([]);
  };

  /**
   * 停止当前对话
   * 中止请求并重置相关状态
   */
  const stopEvent = (type) => {
    setIsStop(true);
    isStopRef.current = true;
    abortRef.current?.abort();
    setLoading(false);
    setHiddenStop(false);
    setChatting(false); 
    if(type=='clear'){
      setChatList([]);
      setChatHistory([]);
    }
  };

  /**
   * 处理输入框内容变化
   * @param {string} value - 输入的内容
   */
  const senderChange = (value) => {
    setQuery(value);
  };

  /**
   * 更新聊天表单高度
   * @param {number} height - 表单高度
   */
  const updateChatFormHeight = (height) => {
    setFormHeight(height);
  };

  // ========== 渲染相关函数 ==========

  /**
   * 弹窗内容组件
   * 包含变量表单
   */
  const popoverContent = (
    <VariableForm
      ref={variableFormRef}
      updateChatFormHeight={updateChatFormHeight}
      chatWidth={chatWidth}
      variableList={variableList}
    />
  );

  /**
   * 渲染Markdown内容
   * @param {string} content - Markdown内容
   * @returns {JSX.Element} 渲染后的组件
   */
  const renderMarkdown = (content) => {
    return (
      <div className={styles["chat_markdown"]}>
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };
  // 切换展开状态
  const toggleItemEvent = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  //设置展开数据
  const setExpandedItemsEvent = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has(id)) {
        newSet.add(id);
      }
      return newSet;
    });
  };


  /**
   * 思考过程全部打印完成事件
   * 当思考过程打字动画完成后，将缓存的内容显示出来
   * @param {string|number} id - 消息ID
   */
  const onAllThinkingEnd = (id) => {
    if(id!=currentIdRef.current){
      return;
    }
    console.log("思考过程全部打印完成事件",id,pushComplete, pushCompleteRef.current);
    thinkTypingCompleteRef.current = true;
    if (pushComplete || pushCompleteRef.current ) {
   
      setChatList((prev) =>
        prev.map((item) =>
          item.id === id && item.role === "ai"
            ? {
                ...item,
                content: item.cacheContent ?? item.content,
                isThinkComplete: true,
              }
            : item
        )
      );
    }
  };
  /**
   * 渲染思考过程头部
   * 生成思考过程的UI组件，包括展开/折叠控制和内容展示
   * @param {Object} bubbleData - 消息数据对象
   * @returns {JSX.Element} 思考过程UI组件
   */
  const renderHeader = (bubbleData) => {
    console.log(bubbleData, "bubbleData");
    return (
      <div className={styles["chat_thought_process"]}>
        <div
          className={styles["chat_thought_process_header"]}
          onClick={() => toggleItemEvent(bubbleData.id)}
        >
          <div className={styles["chat_thought_process_header_title"]}>
            思考过程
          </div>
          <img
            src={
              expandedItems.has(bubbleData.id)
                ? "/common/agent_fold.png"
                : "/common/agent_expand.png"
            }
            alt="展开"
          />
        </div>
        {expandedItems.has(bubbleData.id) && (
          <div className={`${styles["chat_thought_process_content"]} ${styles["chat_markdown"]}`}>
            <ThinkingTypewriter
              key={bubbleData.id}
              bubbleData={bubbleData}
              id={bubbleData.id}
              text={bubbleData.markdownThinkData}
              active={expandedItems.has(bubbleData.id)}
              loading={loading}
              currentId={currentId}
              isAllThinking={bubbleData.isAllThinking}
              onAllThinkingEnd={() => onAllThinkingEnd(bubbleData.id)}
            />
          </div>
        )}
      </div>
    );
  };
  /**
   * 渲染消息底部信息（时间和token数）
   * @param {number} time - 响应时间
   * @param {number} tokens - token数量
   * @returns {JSX.Element} 底部信息组件
   */
  const renderFooter = (time, tokens) => (
    <div className={styles["chat_footer_time"]}>
      <span>{time}s</span>
      <Divider type="vertical" />
      <span>{tokens}Tokens</span>
    </div>
  );

  /**
   * 渲染聊天项
   * 根据消息角色（AI或用户）生成相应的聊天气泡组件配置
   * @param {Object} bubbleData - 聊天数据对象
   * @returns {Object} 聊天气泡组件配置对象
   */
  const renderChatItem = useCallback(
    (bubbleData) => {
      console.log(bubbleData,'聊天气泡数据')
      // 默认内容渲染函数
      const RenderIndex = (content) => <div>{content}</div>;
    // 滚动到最新消息
    if (listRef.current && goNext) {
      listRef.current.scrollTo({ key: bubbleData.index, block: "nearest" });
      setGoNext(false);
    }
    // 渲染加载中状态
    const renderLoading = () => (
      <div className={styles["loading_content"]}>思考中...</div>
    );
    // 根据角色渲染不同的聊天项
    switch (bubbleData.role) {
      case "ai":
        return {
          placement: "start",
          avatar: {
            src:
              process.env.NEXT_PUBLIC_API_BASE +
              props.applicationInfo.iconUrl,
          },
          typing: { step: 1, interval: 10 },
          style: {
            marginRight: 45,
          },
          loading:
            (!isStartPush ||
              (!bubbleData.content && bubbleData.isThinkComplete)) &&
            !isStop &&
            currentId === bubbleData.id,
          loadingRender:
            !bubbleData.isThinkComplete && agentType === "multiple"
              ? renderLoading
              : null,
          classNames: {
            content:
              !bubbleData.cacheContent &&
              bubbleData.thinkData.length == 0 &&
              !isStop &&
              currentId === bubbleData.id
                ? styles["bubble_content_loading"]
                : bubbleData.isThinkComplete && bubbleData.content != ""
                ? styles["bubble_content_ai"]
                : bubbleData.isThinkComplete && !bubbleData.content
                ? styles["bubble_content_loading"]
                : styles["bubble_content_noText"],
            footer: styles["bubble_content_footer"],
          },
          header:
            bubbleData.thinkData && bubbleData.thinkData.length > 0
              ? renderHeader(bubbleData)
              : null,
          messageRender: (content) => {
            return renderMarkdown(content, bubbleData);
          },
          footer: bubbleData.time
            ? renderFooter(bubbleData.time, bubbleData.tokens)
            : null,
          onTypingComplete: () => {
            if (listRef.current && goNext) {
              listRef.current.scrollTo({
                key: bubbleData.index,
                block: "nearest",
              });
            }
            if (bubbleData.isThinkComplete && bubbleData.content &&bubbleData.id ==currentIdRef.current) {
              setLoading(false);
              setGoNext(false);
            }
          },
        };
      case "user":
        return {
          placement: "end",
          avatar: { icon: <UserOutlined /> },
          style: {
            marginLeft: 45,
          },
          classNames: {
            content: styles["bubble_content_user"],
          },
          messageRender: RenderIndex,
          onTypingComplete: () => {
            if (listRef.current && goNext) {
              listRef.current.scrollTo({
                key: bubbleData.index,
                block: "nearest",
              });
            }
            setGoNext(false);
          },
        };
      default:
        return { messageRender: RenderIndex };
    }
    },
    // renderHeader, renderMarkdown, renderFooter 在函数内部定义，不需要作为依赖项
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      goNext,
      isStartPush,
      isStop,
      currentId,
      agentType,
      loading,
      expandedItems,
      onAllThinkingEnd,
      props.applicationInfo.applicationIconUrl,
    ]
  );

  /**
   * 长期记忆弹框点击事件
   * 显示长期记忆管理弹窗
   */
  const longMemoryClick = () => {
    longMemoryRef.current.showModal(applicationInfo, type);
  };

  const tipClickEvent = () => {
    setPopoverOpen(false);
    props?.tipClickEvent();
    updateInputWidth();
    setPopoverOpen(true);
  };

  useEffect(() => {
    if (props.showRight) {
      setMainWidth(1000);
    } else {
      setMainWidth(1200);
    }
  }, [props.showRight]);

  const handleScroll = (e) => {};

  // ========== 组件渲染 ==========

  return (
    <div className={styles["chat_container"]} ref={chatRef}>
      {/* 聊天头部区域 */}
      <div className={styles["chat_container_header"]}>
        <div className={styles["chat_container_header_left"]}></div>
        <div className={styles["chat_container_header_right"]}>
          {/* 长期记忆按钮 */}
          {applicationInfo?.longTermMemoryEnabled && (
            <Tooltip title="长期记忆">
              <img
                src="/agent/memory.png"
                alt="长期记忆"
                style={{ cursor: "pointer" }}
                onClick={longMemoryClick}
              />
            </Tooltip>
          )}

          {/* 变量设置弹窗 */}
          {variableList.length > 0 && (
            <Popover
              classNames={{ root: "chat_popover" }}
              align={POPOVER_ALIGN_CONFIG}
              placement="bottom"
              trigger="click"
              content={popoverContent}
              open={popoverOpen}
              style={{ borderRadius: 12 }}
            >
              <Tooltip title="用户信息表单">
                <img
                  onClick={handleOpenChange}
                  src="/agent/set.png"
                  alt="用户信息表单"
                  style={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Popover>
          )}
        </div>
      </div>

      {/* 聊天内容区域 */}

      <div
        className={styles["chat_container_content"]}
        ref={chatContentRef}
        style={{
          overflowY: "hidden",
          flex: 1,
          marginTop: formHeight,
          margin: props.showRight ? " 0 160px" : "0 240px",
        }}
      >
        {chatList.length > 0 && (
          <Bubble.List
            ref={listRef}
            style={{ height: chatHeight - formHeight }}
            roles={renderChatItem}
            autoScroll={true}
            items={chatList.map((item, i) => ({
              ...item,
              key: i,
              role: item.role,
              content: item.content,
              time: item.time,
              tokens: item.tokens,
              id: item.id,
              index: i,
              thinkData: item.thinkData,
            }))}
            onScroll={handleScroll}
          />
        )}
        {chatList.length == 0 && (
          <div className={styles["chat_container_empty"]}>
            <img
              src={process.env.NEXT_PUBLIC_API_BASE + applicationInfo.iconUrl}
              alt="icon"
              className={styles["chat_container_empty_icon"]}
            />
            <div className={styles["chat_container_empty_text"]}>
              {applicationInfo.name}
            </div>
          </div>
        )}
      </div>

      {/* 停止响应按钮 */}
      {loading && !hiddenStop && (
        <div className={styles["chat_container_stop"]} onClick={stopEvent}>
          <img src="/agent/stop.png" alt="停止" /> 停止响应
        </div>
      )}

      {/* 输入区域 */}
      <div
        className={styles["chat_container_footer"]}
        style={{ margin: props.showRight ? " 0 160px" : "0 240px" }}
      >
        <Sender
          value={query}
          readOnly={loading}
          submitType="enter"
          onChange={senderChange}
          onSubmit={sendEvent}
          placeholder="和机器人对话聊天"
        />
      </div>

      {/* 长期记忆组件 */}
      <LongMemory
        ref={longMemoryRef}
        canCreate={canCreate}
        applicationInfo={applicationInfo}
      />
    </div>
  );
});

export default AgentChat;
