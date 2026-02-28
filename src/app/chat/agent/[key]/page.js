"use client";
import React, { useEffect, useState, useRef } from "react";
import styles from "./index.module.css";
import { useRouter, useParams } from "next/navigation";
import {
  getApplicationInfoByUrlKey,
  generateConversationTokenByUrlKey,
  getApplicationParamsByUrlKey,
  getConversationListByUrlKey,
  updateConversationTitleByUrlKey,
  deleteConversationByUrlKey,
  getConversationInfoByUrlKey,
  getMultipleAgentUrlParameters
} from "@/api/chat";
import { Typography, Input, message, Modal, Spin } from "antd";

const { Text } = Typography;
import AgentChat from "./components/Chat";
import DeleteConversationModal from "./components/Delete";
import UpdateConversationTitleModal from './components/Update'


/**
 * 智能体聊天页面
 * 用于展示智能体对话界面，包括对话列表、对话内容和智能体信息
 */
const AgentChatPage = () => {
  const { key } = useParams();
  const router = useRouter();
  // 智能体信息状态
  const [applicationInfo, setApplicationInfo] = useState({});
  // 应用参数列表状态
  const [variableList, setVariableList] = useState([]);
  // 对话列表状态
  const [conversationList, setConversationList] = useState([]);
  // 展开的日期组状态
  const [expandedDates, setExpandedDates] = useState({});
  // 当前选中的对话ID状态
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  // 当前悬停的对话ID状态
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  // 删除对话模态框引用
  const deleteConversationModalRef = useRef(null);
  // 更新对话标题模态框引用
  const updateConversationTitleModalRef = useRef(null);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 左侧面板显示状态
  const [showLeft, setShowLeft] = useState(true);
  // 聊天组件引用
  const chatRef = useRef(null);
  // 是否可以操作左侧面板状态
  const [canOperateLeftPanel, setCanOperateLeftPanel] = useState(true);

  /**
   * 跳转到404页面
   */
  const goto404Page = () => {
    router.push(`/chat/${key}`);
  }

  /**
   * 根据urlkey和token获取应用参数列表
   * @param {string} token - 对话令牌
   */
  const getApplicationParamsEvent = (token) => {
    let data = {
      urlKey: key,
      token: token,
    };
    getApplicationParamsByUrlKey(data)
      .then((res) => {
        let data = res.data;
        setVariableList(data);
      })
      .catch((err) => {});
  };

  /**
   * 获取多智能体变量列表
   * @param {string} token - 对话令牌
   */
  const getMultipleAgentUrlParametersEvent = (token) => {
    let data = {
      urlKey: key,
      token: token,
    };
    getMultipleAgentUrlParameters(data)
      .then((res) => {
        let data = res.data || [];
        let variableArr = [];
        data.forEach(item => {
          let variableList = item.variableList || [];
          variableList.forEach(variable => {
            // 为子智能体变量添加应用ID前缀，避免变量名冲突
            variable.name = variable.applicationId + '.' + variable.name;
            variableArr.push(variable);
          });
        });
        setVariableList(variableArr);
      })
      .catch((err) => {});
  }

  /**
   * 获取对话列表
   * @param {string} token - 对话令牌
   */
  const getConversationListEvent = (token) => {
    let data = {
      urlKey: key,
      token: token,
    };
    getConversationListByUrlKey(data)
      .then((res) => {
        setLoading(false);
        let data = res.data || [];
        setConversationList(data);
      })
      .catch((err) => {});
  };

  /**
   * 获取运行的信息
   * @param {string} token - 对话令牌
   */
  const getRunningInfoEvent = (token, data) => {
    getConversationListEvent(token);
    let agentType = data.agentType || 'single';//智能体类型，single为单智能体，multiple为多智能体
    if (agentType === 'multiple') {//多智能体
      getMultipleAgentUrlParametersEvent(token);
    } else {///单智能体
      getApplicationParamsEvent(token);
    }
  };

  /**
   * 获取智能体信息
   */
  const getApplicationInfoEvent = () => {
    getApplicationInfoByUrlKey(key)
      .then((res) => {
        let data = res.data;
        if (!data) {
          goto404Page();
          return;
        }
        setApplicationInfo(data);
        initFunction(data);
      })
      .catch((err) => {
        console.error("获取智能体信息失败:", err);
        goto404Page();
      });
  };

  /**
   * 根据urlkey获取对话所用的token
   */
  const getConversationTokenEvent = (data) => {
    generateConversationTokenByUrlKey(key)
      .then((res) => {
        let token = res.data;
        localStorage.setItem("conversationToken", token);
        getRunningInfoEvent(token, data);
      })
      .catch((err) => {
        goto404Page();
        console.error("获取对话所用的token失败:", err);
      });
  };

  /**
   * 初始化函数
   * 处理token的获取和存储逻辑
   */
  const initFunction = (data) => {
    let urlKey = localStorage.getItem("conversationUrlKey");
    // 获取智能体信息
    setLoading(true);
    if (urlKey !== key) {
      // 如果urlKey不一致，则重新获取token
      localStorage.setItem("conversationUrlKey", key);
      getConversationTokenEvent(data);
      return;
    }
    // 获取对话列表
    // 获取对话所用的token
    let token = localStorage.getItem("conversationToken");
    if (!token) {
      // 如果token不存在，则获取token
      getConversationTokenEvent(data);
    } else {
      getRunningInfoEvent(token, data);
    }
  };

  // 当key变化时，获取智能体信息
  useEffect(() => {
    if (key) {
      getApplicationInfoEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /**
   * 刷新对话列表
   */
  const refreshConversationListEvent = () => {
    let token = localStorage.getItem("conversationToken");
    getConversationListEvent(token);
  };

  /**
   * 切换日期组展开/折叠
   * @param {string} date - 日期字符串
   */
  const toggleDateGroup = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // 初始化时展开所有日期组
  useEffect(() => {
    if (conversationList.length > 0) {
      const initialExpanded = {};
      conversationList.forEach((item) => {
        initialExpanded[item.date] = true;
      });
      setExpandedDates(initialExpanded);
    }
  }, [conversationList]);

  /**
   * 打开删除对话模态框
   * @param {Object} conversation - 对话对象
   */
  const handleDeleteConversation = (conversation) => {
    deleteConversationModalRef.current.showModal(conversation.id);
  };

  /**
   * 删除对话回调函数
   * @param {string} id - 对话ID
   */
  const deleteCallBack = (id) => {
    let token = localStorage.getItem("conversationToken");
    let delData = {
      urlKey: key,
      id: id,
      token: token,
    }
    deleteConversationByUrlKey(delData).then((res) => {
      message.success("删除成功");
      refreshConversationListEvent();
      if (id == selectedConversationId) {
        handleNewConversation();
      }
    }).catch((err) => {
    });
  };

  /**
   * 修改标题点击事件
   * @param {Object} obj - 对话对象
   */
  const handleEditEvent = (obj) => {
    updateConversationTitleModalRef.current.showModal(obj);
  }

  /**
   * 点击对话事件
   * @param {Object} obj - 对话对象
   */
  const handleConversationClick = (obj) => {
    setSelectedConversationId(obj.id);
    getConversationInfoEvent(obj.id);
  }

  /**
   * 获取对话详情
   * @param {string} id - 对话ID
   */
  const getConversationInfoEvent = (id) => {
    let token = localStorage.getItem("conversationToken");
    let data = {
      urlKey: key,
      id: id,
      token: token
    }
    getConversationInfoByUrlKey(data).then((res) => {
      let id = res.data.id;
      let chatList = res.data.chatHistory || [];
      chatRef.current.setUrlChatIdAndChatHistory(id, chatList);
    }).catch(err => {
      console.error("获取对话详情失败:", err);
    })
  }

  /**
   * 开启新对话
   */
  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setHoveredConversationId(null);
    chatRef.current.setUrlChatIdAndChatHistory(null, []);
    chatRef.current.stopByDeleteEvent();
  }

  /**
   * 根据id刷新对话列表
   * @param {string} id - 对话ID
   */
  const refreshConversationListById = (id) => {
    console.log(id, "id");
    setSelectedConversationId(id);
    let token = localStorage.getItem("conversationToken");
    getConversationListEvent(token);
  }

  /**
   * 隐藏左侧面板
   */
  const hideLeftPanel = () => {
    setShowLeft(false);
  }

  /**
   * 设置是否可以操作左侧面板
   * @param {boolean} bool - 是否可以操作
   */
  const setCanOperateLeftPanelEvent = (bool) => {
    setCanOperateLeftPanel(bool);
  }

  return (
    <div className={styles.agent_chat_page}>
      {/* 全屏加载提示 */}
      <Spin
        spinning={loading}
        wrapperClassName="node_main_spin"
        fullscreen
        tip="加载中..."
      >
        {" "}
      </Spin>

      {/* 左侧对话列表面板 */}
      {showLeft && (
        <div className={styles.agent_chat_page_left}>
          {/* 左侧面板头部 */}
          <div className={styles.agent_chat_page_left_header}>
            <img
              className={styles.agent_chat_page_left_header_icon}
              src={process.env.NEXT_PUBLIC_API_BASE + applicationInfo?.iconUrl}
              alt=""
            />
            <div className={styles.agent_chat_page_left_header_name}>
              <Text
                ellipsis={{ tooltip: applicationInfo?.name }}
                style={{ maxWidth: 120 }}
              >
                <span className={styles.agent_chat_page_left_header_name_text}>
                  {" "}
                  {applicationInfo?.name}
                </span>
              </Text>
            </div>
            <div className={styles.agent_chat_page_left_header_right} onClick={hideLeftPanel}>
              <img
                className={styles["drag_panel_header_right_img"]}
                src="/workflow/pane_collect.png"
                alt=""
              />
            </div>
          </div>

          {/* 开启新对话按钮 */}
          <div className={styles.agent_chat_page_left_header_btn} onClick={handleNewConversation}>
            <img src="/chat/new_chat.png" alt="开启新对话" />
            开启新对话
          </div>

          {/* 对话列表内容 */}
          <div className={styles.agent_chat_page_left_content}>
            {conversationList.map((dateGroup) => (
              <div key={dateGroup.date} className={styles.agent_chat_date_group}>
                {/* 日期分组头部 */}
                <div
                  className={styles.agent_chat_date_header}
                  onClick={() => toggleDateGroup(dateGroup.date)}
                >
                  <span className={styles.agent_chat_date_text}>
                    {dateGroup.date}
                  </span>
                  <img
                    src="/chat/down.png"
                    alt="展开/折叠"
                    className={`${styles.agent_chat_date_expand_icon} ${
                      expandedDates[dateGroup.date]
                        ? styles.agent_chat_date_expand_icon_expanded
                        : ""
                    }`}
                  />
                </div>

                {/* 日期分组内容 */}
                {expandedDates[dateGroup.date] && (
                  <div className={styles.agent_chat_date_content}>
                    {dateGroup.agentChatList.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`${styles.agent_chat_item} ${selectedConversationId == conversation.id ? styles.agent_chat_item_hovered : ""}`}
                        onMouseEnter={() =>
                          setHoveredConversationId(conversation.id)
                        }
                        onMouseLeave={() => setHoveredConversationId(null)}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        {/* 对话标题 */}
                        <div
                          className={styles.agent_chat_page_left_content_item_name}
                        >
                          <Text ellipsis={{ tooltip: conversation.conversationTitle }} style={{ maxWidth: 150 }}>
                            <span className={styles.agent_chat_page_left_content_item_name_text}>{conversation.conversationTitle}</span>
                          </Text>
                        </div>

                        {/* 对话操作按钮 */}
                        {hoveredConversationId === conversation.id && canOperateLeftPanel && (
                          <div className={styles.agent_chat_item_actions}>
                            {/* 编辑按钮 */}
                            <div className={styles.agent_chat_item_action_edit}>
                              <img
                                src="/agent/edit.png"
                                alt="编辑"
                                className={styles.agent_chat_item_action_icon}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(conversation);
                                }}
                              />
                            </div>

                            {/* 删除按钮 */}
                            <div className={styles.agent_chat_item_action_delete}>
                              <img
                                src="/agent/delete.png"
                                alt="删除"
                                className={styles.agent_chat_item_action_icon}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 左侧面板展开按钮 */}
      {!showLeft && (
        <div onClick={() => setShowLeft(true)} className={styles["workflow_panel_expand"]}>
          <img
            alt=""
            src='/workflow/pane_expand.png'
          />
        </div>
      )}

      {/* 右侧聊天内容面板 */}
      <div className={styles.agent_chat_page_right}>
        <AgentChat
          applicationInfo={applicationInfo}
          variableList={variableList}
          ref={chatRef}
          refreshConversationListEvent={refreshConversationListEvent}
          refreshConversationListById={refreshConversationListById}
          setCanOperateLeftPanelEvent={setCanOperateLeftPanelEvent}
        />
      </div>

      {/* 删除对话模态框 */}
      <DeleteConversationModal ref={deleteConversationModalRef} deleteCallBack={deleteCallBack} />

      {/* 修改标题模态框 */}
      <UpdateConversationTitleModal
        ref={updateConversationTitleModalRef}
        onSuccess={refreshConversationListEvent}
      />
    </div>
  );
};

export default AgentChatPage;
