"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback
} from "react";
import styles from "../page.module.css";
import { Popover, message, Typography, Divider, Tooltip } from "antd";

import { Bubble, Sender } from "@ant-design/x";
import { UserOutlined } from "@ant-design/icons";
import VariableForm from "./VariableForm";
import { getUuid, groupByPrefix } from "@/utils/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Cookies from "js-cookie";
import ReactMarkdown from "react-markdown";
let eventSource = null;
import rehypeRaw from "rehype-raw";
import LongMemory from "./LongMemory"; // 长期记忆组件
import ThinkingTypewriter from "@/app/components/agent/ThinkingTypewriter"; // 思考类型写入组件
import { useChat } from "@/hooks/useChat"; // 多智能体思考过程处理函数
/**
 * 智能体聊天组件
 * 用于与智能体进行对话交互，支持变量表单、流式响应和长期记忆等功能
 * @param {Object} props - 组件属性
 * @param {Object} props.agentInfo - 智能体信息
 * @param {Array} props.variableList - 变量列表
 * @param {boolean} props.canCreate - 是否可以创建
 * @param {Object} ref - 父组件引用
 */
const AgentChat = forwardRef((props, ref) => {
  // ========== 状态管理 ==========
  const { handleMultiAgentThinking, thinkDataToMarkdown } = useChat(); // 多智能体思考过程处理函数
  // 聊天消息列表 - 存储用户和AI的对话记录
  const [chatList, setChatList] = useState([]);
  // 变量表单弹窗状态 - 控制变量表单是否显示
  const [popoverOpen, setPopoverOpen] = useState(false);
  // 变量表单引用 - 用于访问变量表单组件的方法
  const variableFormRef = useRef(null);
  // 聊天容器引用 - 用于获取容器尺寸
  const chatRef = useRef(null);
  // 聊天内容容器引用 - 用于计算聊天区域高度
  const chatContentRef = useRef(null);
  // 聊天宽度 - 动态计算聊天区域宽度
  const [chatWidth, setChatWidth] = useState(0);
  // 聊天历史 - 存储历史对话记录
  const [chatHistory, setChatHistory] = useState([]);
  // 加载状态 - 标识AI是否正在响应
  const [loading, setLoading] = useState(false);
  // 输入框内容 - 用户输入的文本内容
  const [query, setQuery] = useState(null);
  // 是否停止响应 - 控制是否停止AI响应
  const [isStop, setIsStop] = useState(false);
  // 是否停止响应的ref - 用于异步操作中访问最新停止状态
  const isStopRef = useRef(false);
  // 当前对话ID - 用于标识当前对话会话
  const [currentId, setCurrentId] = useState(null);
  // 聊天高度 - 动态计算聊天区域高度
  const [chatHeight, setChatHeight] = useState(0);
  // 聊天列表引用 - 用于控制聊天列表滚动
  const listRef = useRef(null);
  // 表单高度 - 变量表单的高度
  const [formHeight, setFormHeight] = useState(0);
  // 中止控制器引用 - 用于取消正在进行的请求
  const abortRef = useRef(null);
  // 是否隐藏停止按钮 - 控制停止按钮的显示
  const [hiddenStop, setHiddenStop] = useState(false);
  // 长期记忆组件引用 - 用于访问长期记忆功能
  const longMemoryRef = useRef(null);
  // 是否滚动到最底部 - 控制聊天列表是否自动滚动到底部
  const [goNext, setGoNext] = useState(false);
  const [agentType, setAgentType] = useState("single"); //智能体类型，单智能体或多个智能体
  const [pushComplete, setPushComplete] = useState(false); //思考过程是否推送完成
  const thinkTypingCompleteRef = useRef(false); //思考过程是否打字完成的ref
  const currentIdRef = useRef(null); // 当前对话 id 的 ref，供 SSE 回调使用
  const pushCompleteRef = useRef(false); //思考过程是否推送完成的ref
  const [isStartPush, setIsStartPush] = useState(false); //是否开始
  // 聊天API URL - 根据智能体类型动态切换API地址
  const [chatUrl, setChatUrl] = useState(
    "/voicesagex-console/application-web/chat/test"
  );
  // 展开的思考过程节点 - 记录哪些思考过程节点是展开状态
  const [expandedItems, setExpandedItems] = useState(new Set());
  useImperativeHandle(ref, () => ({
    updateVariableList,
    closeChatEvent,
  }));

  // 监听智能体类型变化，更新聊天API URL
  useEffect(() => {
    let appType = props.agentInfo?.agentType || "single";
    let url = "";
    if (appType == "multiple") {
      // 多智能体模式
      url = "/voicesagex-console/application-web/chat/multipleAgentTest";
    } else {
      // 单智能体模式
      url = "/voicesagex-console/application-web/chat/test";
    }
    setAgentType(appType);
    setChatUrl(url);
  }, [props.agentInfo]);

  // 同步isStopRef值，确保在异步操作中能够访问最新的isStop状态
  useEffect(() => {
    isStopRef.current = isStop; // ✅ 保持同步
  }, [isStop]);

  // 更新变量列表 - 用于刷新变量表单
  const updateVariableList = () => {
    variableFormRef?.current.updateChatForm();
  };

  // 初始化聊天容器尺寸
  useEffect(() => {
    if (chatRef.current) {
      setChatWidth(chatRef.current.clientWidth - 60);
    }
    if (chatContentRef.current) {
      setChatHeight(chatContentRef.current.clientHeight - 32);
    }
  }, [chatRef.current]);

  // 监听浏览器缩放事件，动态调整聊天区域高度
  const handleResize = () => {
    if (chatContentRef.current) {
      setChatHeight(chatContentRef.current.clientHeight - 32);
    }
  };
  // 添加窗口大小变化监听器
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 根据变量列表长度初始化弹窗状态
  useEffect(() => {
    setPopoverOpen(props.variableList.length > 0);
  }, [props.variableList]);

  // 切换变量表单弹窗的开启/关闭状态
  const handleOpenChange = () => {
    if (props.variableList.length) {
      setPopoverOpen((prev) => !prev);
    }
  };

  // 当弹窗关闭时重置表单高度
  useEffect(() => {
    if (!popoverOpen) {
      setFormHeight(0);
    }
  }, [popoverOpen]);
  /**
   * 查找必填项是否已填写
   * 检查变量列表中是否存在必填项，以及这些必填项是否已填写
   * @returns {Promise<boolean>} - 返回是否还有未填写的必填项
   */
  const findRequiredItem = async () => {
    const hasRequired = props.variableList.some(
      (item) => item.required === true
    );
    if (!hasRequired) return false;

    const values = (await variableFormRef.current?.getAllValue()) || {};
    return props.variableList.some((item) => {
      if (item.required) {
        return !values[item.name];
      }
      return false;
    });
  };

  /**
   * 清理图像链接 - 修正图片路径格式
   * 将外部图片链接转换为内部链接格式，并为HTML img标签添加样式类
   * @param {string} text - 包含图片链接的文本
   * @returns {string} - 修正后的文本
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
      }
    );

    return sanitized;
  };

  /**
   * 处理智能体变量组装
   * 根据智能体类型对输入变量进行相应处理
   * @param {Object} inputs - 输入的变量对象
   * @returns {Object} - 处理后的变量对象
   */
  const handleVariableAssemble = (inputs) => {
    let res = {};
    if (props.agentInfo.agentType == "multiple") {
      res = groupByPrefix(inputs);
    } else {
      res = inputs;
    }
    return res;
  };
  /**
   * 发送消息事件
   * 处理用户发送消息的完整流程，包括验证、请求构建、流式响应处理等
   * @param {string} value - 发送的消息内容
   */
  const sendEvent = async (value) => {
    // 检查消息内容是否为空
    if (!value.trim()) {
      return message.warning("请输入对话内容");
    }
    // 检查是否有必填变量未填写
    const isRequired = await findRequiredItem();
    if (!popoverOpen && isRequired) {
      // 打开变量表单弹窗并验证
      setPopoverOpen(true);
      setTimeout(() => {
        variableFormRef.current?.validateFrom();
      }, 100);
      return false;
    }
    setIsStartPush(false);
    setHiddenStop(false);
    // 获取并验证变量表单数据
    let formData = await variableFormRef.current?.validateFrom();
    // 根据智能体类型组装变量数据
    let inputs = handleVariableAssemble(formData);
    // 生成对话ID
    const uuid = getUuid();
    setCurrentId(uuid);
    currentIdRef.current = uuid;
    // 记录开始时间
    let startTime = new Date().getTime();
    // 创建中止控制器
    abortRef.current = new AbortController();
    let thinkDataArr = []//思考过程数据数组
    // 添加用户消息和空的AI响应到聊天列表
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
        thinkData: [], //思考过程数据
        markdownThinkData: "",
      },
    ]);
    let isComplete = agentType == "multiple" ? false : true; // 思考过程全部出现
    thinkTypingCompleteRef.current = isComplete;
    setPushComplete(isComplete);
    pushCompleteRef.current = isComplete;
    // 获取用户令牌
    const token = Cookies.get("userToken");
    // 清空输入框
    setQuery(null);
    // 设置加载状态
    setLoading(true);
    // 重置停止状态
    setIsStop(false);
    isStopRef.current = false; // ✅ 重置 ref
    // 设置滚动到底部
    setGoNext(true);
    let time = null;
    let tokens = null;
    // 使用 fetchEventSource 实现流式响应
    fetchEventSource(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        applicationId: props.agentInfo.applicationId,
        query: value,
        conversationId: uuid,
        inputs,
        chatHistory,
        runType: "draft", //数据类型草稿draft，已发布published，试用experience
      }),
      signal: abortRef.current.signal, // ✅ 正确传入 signal
      retryInterval: 2000,
      maxRetries: 1,
      openWhenHidden: true,

      // 连接打开时的回调 - 用于处理连接建立成功的情况
      onopen() {},

      // 接收消息时的回调 - 处理来自服务端的流式响应
      onmessage(data) {
        if (data.event === "connect-open") {
          // 连接开放事件处理
        }
        // 处理错误事件
        if (data.event === "error") {
          message.warning(data.data);
          setLoading(false);
          setIsStop(true);
          setHiddenStop(false);
          isStopRef.current = true; // ✅ 同步 ref
          abortRef.current?.abort();
        }
        // 处理消息事件
        if (data.event === "msg" && !isStopRef.current) {
          setIsStartPush(true);
          setHiddenStop(true);
          let chatData = JSON.parse(data.data);
          let id = data.id;
          // 处理图片链接
          let assistant_message = sanitizeImageLinks(
            chatData.assistant_message
          );

          let chat_history = chatData.chat_history;
          // 更新聊天历史
          setChatHistory(chat_history);
          // 计算响应时间和tokens
          if (chatData.usage) {
            let endTime = new Date().getTime();
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
              let newThinkData =thinkDataArr;
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
          // 滚动到底部
          setGoNext(true);
        }
        if (data.event == "close") {
          pushCompleteRef.current = true;
          setPushComplete(true);
          // 思考打字若已先完成，此时才 pushComplete，需在这里把答案显示出来
          if (thinkTypingCompleteRef.current && currentIdRef.current) {
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

      // 连接关闭时的回调 - 清理资源
      onclose() {
        abortRef.current?.abort();
      },

      // 连接错误时的回调 - 处理连接异常情况
      onerror() {
        setLoading(false);
        abortRef.current?.abort();
      },
    });
  };

  /**
   * 清空对话内容
   * 清空当前聊天记录和历史记录
   */
  const clearEvent = () => {
    if (props.canCreate) {
      setChatList([]);
      setChatHistory([]);
      stopEvent();
    }
  };

  // 关闭聊天事件
  const closeChatEvent = () => {
    stopEvent();
  };
  /**
   * 停止响应
   * 中断当前AI响应请求并重置相关状态
   */
  const stopEvent = () => {
    setIsStop(true);
    isStopRef.current = true; // ✅ 同步 ref
    abortRef.current?.abort();
    setLoading(false);
    setHiddenStop(false);
  };

  /**
   * 输入框内容变化事件
   * 处理用户在输入框中的内容变化
   * @param {string} value - 输入框内容
   */
  const senderChange = (value) => {
    setQuery(value);
  };

  /**
   * 更新变量表单高度
   * 根据变量表单的实际高度调整容器高度
   * @param {number} height - 表单高度
   */
  const updateChatFormHeight = (height) => {
    setFormHeight(height);
  };

  /**
   * 变量表单弹窗内容
   */
  const popoverContent = (
    <VariableForm
      ref={variableFormRef}
      updateChatFormHeight={updateChatFormHeight}
      chatWidth={chatWidth}
      agentInfo={props.agentInfo}
    />
  );

  /**
   * 渲染Markdown内容
   * 将Markdown格式的内容转换为HTML元素，并处理链接等特殊元素
   * @param {string} content - Markdown内容
   * @returns {JSX.Element} 渲染后的Markdown元素
   */
  const renderMarkdown = (content, bubbleData) => {
    return (
      <div className={styles["chat_ai_content"]}>
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
      </div>
    );
  };
  /**
   * 切换思考过程展开/折叠状态
   * 控制特定思考过程节点的展开或折叠状态
   * @param {string|number} id - 节点ID
   */
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

  /**
   * 设置思考过程节点为展开状态
   * 在接收到新消息时确保思考过程节点默认展开
   * @param {string|number} id - 节点ID
   */
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
    if (pushComplete || pushCompleteRef.current) {
      console.log("打印结束:" );
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
          <div
            className={`${styles["chat_thought_process_content"]} ${styles["chat_markdown"]}`}
          >
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
   * 渲染聊天消息底部信息（时间和tokens）
   * 显示AI响应的耗时和使用的token数量
   * @param {number} time - 响应时间（秒）
   * @param {number} tokens - 使用的tokens数量
   * @returns {JSX.Element} 渲染后的底部信息元素
   */
  const renderFooter = (time, tokens) => (
    <div className={styles["chat_footer_time"]}>
      <span>{time}s</span>
      <Divider type="vertical" />
      <span>{tokens}Tokens</span>
    </div>
  );

  /**
   * 弹窗对齐配置
   * 定义变量表单弹窗的位置和偏移量
   */
  const alignConfig = {
    points: ["tr", "br"],
    offset: [45, 5],
  };

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
              props.agentInfo.applicationIconUrl,
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
      props.agentInfo.applicationIconUrl,
    ]
  );

  /**
   * 打开长期记忆弹框
   * 触发长期记忆组件的显示，允许用户查看和管理长期记忆内容
   */
  const longMemoryClick = () => {
    longMemoryRef.current.showModal(props.agentInfo);
  };

  return (
    <div className={styles["chat_container"]} ref={chatRef}>
      {/* 聊天头部区域，包含长期记忆、变量表单和清空按钮 */}
      <div className={styles["chat_container_header"]}>
        <div className={styles["chat_container_header_left"]}>预览测试</div>
        <div className={styles["chat_container_header_right"]}>
          {/* 长期记忆功能按钮 */}
          {props.agentInfo.longTermMemoryEnabled && (
            <Tooltip title="长期记忆">
              <div className={styles["chat_container_header_right_item"]}>
                <img
                  src="/agent/memory.png"
                  alt="长期记忆"
                  style={{ cursor: "pointer" }}
                  onClick={() => longMemoryClick()}
                />
              </div>
            </Tooltip>
          )}
          {/* 变量表单弹窗按钮 */}
          {props.variableList.length > 0 && (
            <Popover
              classNames={{ root: "chat_popover" }}
              align={alignConfig}
              placement="bottomRight"
              trigger="click"
              content={popoverContent}
              open={popoverOpen}
              zIndex={199}
              style={{ borderRadius: 12 }}
            >
              <Tooltip title="用户信息表单">
                <div className={styles["chat_container_header_right_item"]}>
                  <img
                    onClick={handleOpenChange}
                    src="/agent/set.png"
                    alt="设置"
                    style={{ cursor: "pointer" }}
                  />
                </div>
              </Tooltip>
            </Popover>
          )}
          {/* 清空对话按钮 */}
          <div className={styles["chat_container_clear"]}>
            {props.canCreate && (
              <Tooltip title="清空对话内容" placement="left">
                <div className={styles["chat_container_header_right_item"]}>
                  <img
                    src="/agent/clear.png"
                    alt="清空"
                    style={{ cursor: "pointer" }}
                    onClick={clearEvent}
                  />
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      {/* 聊天内容区域 */}
      <div
        className={styles["chat_container_content"]}
        ref={chatContentRef}
        style={{ overflowY: "hidden", flex: 1, marginTop: formHeight }}
      >
        {/* 聊天记录列表 */}
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
          />
        )}
        {/* 空状态显示 */}
        {chatList.length == 0 && (
          <div className={styles["chat_container_empty"]}>
            <img
              src={
                process.env.NEXT_PUBLIC_API_BASE +
                props.agentInfo.applicationIconUrl
              }
              alt="icon"
              className={styles["chat_container_empty_icon"]}
            />
            <div className={styles["chat_container_empty_text"]}>
              {props.agentInfo.applicationName}
            </div>
          </div>
        )}
      </div>

      {/* 停止响应按钮，仅在加载状态下显示 */}
      {loading && !hiddenStop && (
        <div className={styles["chat_container_stop"]} onClick={stopEvent}>
          <img src="/agent/stop.png" /> 停止响应
        </div>
      )}

      {/* 输入区域 */}
      <div className={styles["chat_container_footer"]}>
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
      <LongMemory ref={longMemoryRef} canCreate={props.canCreate} />
    </div>
  );
});

export default AgentChat;
