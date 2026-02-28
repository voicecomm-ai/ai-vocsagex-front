'use client'
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import singleStyle from '../page.module.css';
import { checkPermission } from "@/utils/utils";
import { Button, Typography, Select, InputNumber, Slider, Tooltip, Switch, message, Empty } from 'antd';
import {
  getAgentDetail,
  getAgentVariableList,
  deleteAgentVariable,
  updateAgentInfo,
  getAgentModelList,
  deleteSubAgent,
  getSubAgentVariableList
} from "@/api/agent";
import {
  getApplicationPublishTimeDesc,

} from "@/api/application";
import debounce from "lodash/debounce";
import ModelSelect from '../components/model-select'
import SubAgentSelect from './components/add-sub-agent'
import AgentChat from '../components/Chat'
import PublishModel from "../../../../components/publish";
import ApiDocument from "../components/apiDocument";
import ApiKey from "../../../../components/apiKey";
// ========== 常量定义 ==========
const tabList = [
  { label: "编排", key: "0" },
  { label: "访问API", key: "1" },
];

// ========== 常量定义 ==========
/** 短期记忆轮数最小值 */
const SHORT_TERM_MEMORY_MIN = 0;
/** 短期记忆轮数最大值 */
const SHORT_TERM_MEMORY_MAX = 20;
/** 长期记忆过期天数最小值 */
const LONG_TERM_MEMORY_EXPIRED_MIN = 1;
/** 长期记忆过期天数最大值 */
const LONG_TERM_MEMORY_EXPIRED_MAX = 999;
/** 防抖延迟时间（毫秒） */
const DEBOUNCE_DELAY = 100;
/** 长期记忆类型：永久有效 */
const MEMORY_TYPE_ALWAYS = "always";
/** 长期记忆类型：自定义过期时间 */
const MEMORY_TYPE_CUSTOM = "custom";
const { Text } = Typography;
const MultiAgentDetailPage = () => {
  const [currentTab, setCurrentTab] = useState("0");
  const [agentInfo, setAgentInfo] = useState({});
  const [canCreate, setCanCreate] = useState(false);
  const [childAgentList, setChildAgentList] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [itemSelect, setItemSelect] = useState({});
  const params = useParams();
  const router = useRouter();
  const subAgentSelectRef = useRef(null);
  //模型列表
  const [modelList, setModelList] = useState([]);
  const [variableList, setVariableList] = useState([]);
  const chatRef = useRef(null);
  const publishRef = useRef(null);
  const apiKeyRef = useRef(null);
  const [lastOnShelfTimeDesc, setLastOnShelfTimeDesc] = useState("");//上次上架时间描述
  const [lastPublishTimeDesc, setLastPublishTimeDesc] = useState("");//上次发布时间描述
const [publishText, setPublishText] = useState("发布&上架");//发布按钮文本
  const { id } = params;
  //合作模型选项
  const cooperationModelOptions = [
    {
      label: "主管型",
      value: "Manager",
    },
    // {
    //   label: "协作型",
    //   value: "Collaboration",
    // },
  ];

  useEffect(() => {
    getAgentModelListEvent();
    getApplicationPublishTimeDescEvent();
  }, [id]);

  // ========== 智能体详情相关 ==========
  const getAgentDetailEvent = async () => {
    await getAgentDetail(id).then((res) => {
      let agentData = res.data;

      let status = res.data.status;
      setDetailPermission(status);
      setAgentInfo({
        ...agentData,
        cooperateMode: agentData.cooperateMode || null,
        longTermMemoryType: agentData.longTermMemoryType || MEMORY_TYPE_ALWAYS,//长期记忆类型 永久有效或自定义过期时间  
      });
      let subAgentAppList = agentData.subAgentAppList || [];
      setChildAgentList(subAgentAppList);
      getSubAgentVariableListEvent();

    });
  };
  //获取子智能体变量列表
  const getSubAgentVariableListEvent = async () => {
    const params = {
      applicationId: id,
    };
    await getSubAgentVariableList(params).then((res) => {
      let data = res.data || [];
      let variableArr = [];
      data.forEach(item => {
        let variableList = item.variableList || [];
        variableList.forEach(variable => {
          variable.name = variable.applicationId+'.'+variable.name;
          variableArr.push(variable);
        })

      });
      setVariableList(variableArr);
    });
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
       getAgentDetailEvent();
    });
  };

  // ========== 防抖保存函数 ==========
  /**
   * 防抖保存记忆数据
   * 使用 useRef 确保防抖函数在组件生命周期内保持稳定引用
   */
  const debouncedSaveAgentData = useRef(
    debounce((data) => {
      updateAgentDataEvent(data);
    }, DEBOUNCE_DELAY)
  ).current;

  //设置详情权限
  const setDetailPermission = (status) => {
    let checkUrl = status == 0 ? "/main/application/manage/unreleased/operation" : "/main/application/manage/released/operation";
    setCanCreate(checkPermission(checkUrl));
  }
  // ========== 其他功能 ==========
  /**
   * 返回事件
   * 返回应用列表页面
   */
  const backEvent = () => {
    chatRef.current?.closeChatEvent();
    const unReleasedPath = "/main/application/manage/unreleased";
    const releasedPath = "/main/application/manage/released";
    if (agentInfo.status === 0) {
      router.push(unReleasedPath);
    } else {
      router.push(releasedPath);
    }
  };
  //发布事件
  const publishEvent = () => {
    if (!agentInfo.modelId) {
      message.warning("请配置模型!");
      return;
    }
    if (publishRef.current) {
      publishRef.current.showModal(agentInfo, "agent",lastPublishTimeDesc);
    }
  }

  const changeTabEvent = (key) => {
    setCurrentTab(key);
  }

  //合作模型选择事件
  const cooperationModelChangeEvent = (value) => {
    let updateData = {
      ...agentInfo,
      cooperateMode: value,
    }
    updateAgentEvent(updateData);
  }
  //模型选择更新事件
  const updateModelSelect = (data) => {
    let updateData = {
      ...agentInfo,
      modelId: data.modelId,
      modelName: data.modelName,
    }
    updateAgentEvent(updateData);
  }

  //短期记忆失去焦点事件
  const handleShortTermMemoryRoundsBlur =(e)=>{
   let value =e.target.value;
   let shortRounds =value?value:1;
   let updateData = {
    ...agentInfo,
    shortTermMemoryRounds: shortRounds,
  }
  setAgentInfo(updateData);
  debouncedSaveAgentData(updateData);
  }
  //短期记忆轮次选择事件
  const handleShortTermMemoryRoundsChange = (value) => {
    let updateData = {
      ...agentInfo,
      shortTermMemoryRounds: value,
    }
    setAgentInfo(updateData);
    debouncedSaveAgentData(updateData);
  }

 //长期记忆失去焦点事件
 const handleLongTermMemoryRoundsBlur =(e)=>{
  let value =e.target.value;
  let longExpired =value?value:365;
  let updateData = {
    ...agentInfo,
    longTermMemoryExpired: longExpired,
  }
  setAgentInfo(updateData);
  debouncedSaveAgentData(updateData);
 }

  //长期记忆过期天数选择事件
  const handleLongTermMemoryExpiredChange = (value) => {
    let longExpired =value?value:365;
    let updateData = {
      ...agentInfo,
      longTermMemoryExpired: longExpired,
    }
    setAgentInfo(updateData);
    debouncedSaveAgentData(updateData);
  }
  //长期记忆启用切换事件
  const handleLongTermMemoryEnabledChange = (value) => {
    let updateData = {
      ...agentInfo,
      longTermMemoryEnabled: value,
    }
    updateAgentEvent(updateData);
  }

  //长期记忆类型选择事件
  const handleLongTermMemoryTypeChangeEvent = (value) => {
    let updateData = {
      ...agentInfo,
      longTermMemoryType: value,
    }
    updateAgentEvent(updateData);
  }

  //更新智能体事件
  const updateAgentEvent = (data) => {
    setAgentInfo(data)
    updateAgentDataEvent(data);
  }

  //更新智能体信息事件
  const updateAgentDataEvent = async (data) => {
    await updateAgentInfo(data).then((res) => {
      getAgentDetailEvent();
    });
  }
  //变量hover事件
  const itemHover = (obj) => {
    setIsHovered(true);
    setItemSelect(obj);
  };
  //鼠标移出事件
  const itemMouseOut = (obj) => {
    setIsHovered(false);
    setItemSelect({});
  };
  //添加子智能体事件
  const addSubAgentEvent = () => {
    if (childAgentList.length >= 10) {
      return;
    }
    subAgentSelectRef.current.showModal(agentInfo, childAgentList);
  }
  //跳转到api文档界面
  const handleApiDocumentEvent = () => {
    changeTabEvent("1");
  }
  //跳转到api文档界面并打开api密钥弹框
  const handleApiDocumentEventAndOpenApiKeyModal = () => {
    apiKeyClickEvent();
  }
  /**
 * API密钥点击事件
 * 打开API密钥弹窗
 */
  const apiKeyClickEvent = () => {
    apiKeyRef.current?.showModal();
  };

  //删除子智能体事件
  const deleteSubAgentEvent = (data) => {

    let deleteData = {
      currentAppId: id,
      deletedAppId: data.applicationId,
    }
    deleteSubAgent(deleteData).then((res) => {
      getAgentDetailEvent();
      chatRef.current?.updateVariableList();
    }).catch((err) => {
      console.log(err);
    });
  }
  //刷新子智能体列表事件
  const refreshSubAgentList = () => {
    getAgentDetailEvent();
      chatRef.current?.updateVariableList();
  }
    //获取应用发布时间描述信息
    const getApplicationPublishTimeDescEvent = () => {
      getApplicationPublishTimeDesc(id)
        .then((res) => {
          setLastOnShelfTimeDesc(res.data.lastOnShelfTimeDesc || "");
          setLastPublishTimeDesc(res.data.lastPublishedTimeDesc || "");
          if(res.data.lastPublishedTimeDesc){
            setPublishText("更新上架");
          }
        })
        .catch((err) => {
          console.error("获取发布时间描述失败:", err);
        });
    };
  return (
    <div className={styles["multi_agent_container"]}>
      <div className={singleStyle["agent_container_header"]}>
        {/* 左侧：返回按钮和应用信息 */}
        <div className={singleStyle["agent_container_header_left"]}>
          {/* 返回按钮 */}
          <div
            onClick={backEvent}
            className={singleStyle["agent_container_header_left_back"]}
          >
            <img src="/find/back.png" alt="返回" />
          </div>

          {/* 应用标题和图标 */}
          <div className={singleStyle["agent_container_header_title"]}>
            <img
              src={
                process.env.NEXT_PUBLIC_API_BASE + agentInfo?.applicationIconUrl
              }
              alt="icon"
            />
            <div className={singleStyle["agent_container_header_title_text"]}>
              <div className={singleStyle["agent_container_header_title_text_top"]}>
                <Text
                  style={{ maxWidth: 210 }}
                  ellipsis={{ tooltip: agentInfo.applicationName }}
                >
                  <span
                    className={singleStyle["agent_container_header_title_text_name"]}
                  >
                    {agentInfo.applicationName}
                  </span>
                </Text>
              </div>
              <div className={singleStyle["agent_container_header_title_text_desc"]}>
                多智能体合作
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：发布按钮 */}
        <div className={singleStyle["agent_container_header_right"]}>
          {currentTab === "0" && (
            <div className={singleStyle["agent_container_header_right_action"]}>
              <Button
                type="primary"
                disabled={!canCreate}
                className={singleStyle["agent_container_right_header_model_btn"]}
                onClick={publishEvent}
              >
                <img
                  className={singleStyle["action_img"]}
                  src="/application/publish.png"
                  alt="发布"
                />
                {publishText}
              </Button>
            </div>
          )}
          {currentTab === "1" && (
            <div className={singleStyle["workflow_page_header_right_api"]}>
              <div
                className={singleStyle["workflow_page_header_right_api_btn"]}
                onClick={apiKeyClickEvent}
              >
                <img src="/common/key.png" alt="API密钥" />API密钥
              </div>
            </div>
          )}
        </div>

        <div className={singleStyle["workflow_page_header_right_center"]}>
          {tabList.map((item) => (
            <div
              key={item.key}
              className={`${singleStyle["tab_item"]} ${currentTab == item.key ? singleStyle["tab_item_active"] : ""
                }`}
              onClick={() => changeTabEvent(item.key)}
            >
              {parseInt(item.key) === 0 && (
                <>
                  <img src={ currentTab === item.key?"/application/arrangement_hover.png":"/application/arrangement.png"} alt="编排" /> {item.label}
                </>
              )}
              {parseInt(item.key) === 1 && (
                <>
                  <img src={ currentTab === item.key?"/application/api_hover.png":"/application/api.png"} alt="访问API" /> {item.label}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {currentTab == 0 && (
        <div className={styles["multi_agent_container_content"]}>
          <div className={styles["multi_agent_container_content_left"]}>
            <div className={styles["multi_agent_container_left_header"]}>
              <div className={styles["multi_agent_container_left_header_title"]}>
                应用编辑
              </div>
              <div className={styles["multi_agent_container_left_header_right"]}>
                <div className={styles['cooperation_model']}>
                  <img className={styles['cooperation_model_img']} src="/agent/cooperation_model.png" alt="合作模式" />
                  <div className={styles['cooperation_model_text']}>合作模式：</div>
                  <Select
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(55,114,254,0.06)",
                    }}
                    placeholder='请选择合作模式'
                    variant="borderless"
                    classNames={{
                      root: styles["cooperation_model_select"],
                    }}
                    value={agentInfo.cooperateMode}
                    options={cooperationModelOptions}

                    onChange={cooperationModelChangeEvent}
                  />
                </div>
                <div className={styles['model_select']}>
                  <ModelSelect
                    modelId={agentInfo.modelId}
                    modelList={modelList}
                    onChange={updateModelSelect}
                    canCreate={canCreate}

                  />
                </div>

              </div>
            </div>
            <div className={styles['multi_agent_memory']}>
              <div className={styles['multi_agent_memory_text']}>记忆</div>

              <div className={styles["agent_long_memory_content_body"]}>
                {/* 短期记忆配置区域 */}
                <div className={styles["agent_long_memory_content_body_left"]}>
                  <div className={styles["memory_section_header"]}>
                    <div className={styles["memory_section_title"]}>短期记忆</div></div>
                  <div className={styles["memory_input_group"]}>
                    {/* 数字输入框 */}
                    <InputNumber
                      value={agentInfo.shortTermMemoryRounds}
                      onBlur={handleShortTermMemoryRoundsBlur}
                      min={SHORT_TERM_MEMORY_MIN}
                      max={SHORT_TERM_MEMORY_MAX}
                      suffix="轮对话"
                      disabled={!canCreate}
                      className={styles["memory_number_input"]}
                    />
                    {/* 滑块控件 */}
                    <div className={styles["memory_slider_container"]}>
                      <Slider
                        min={SHORT_TERM_MEMORY_MIN}
                        max={SHORT_TERM_MEMORY_MAX}
                        value={agentInfo.shortTermMemoryRounds}
                        onChange={handleShortTermMemoryRoundsChange}
                        disabled={!canCreate}
                      />
                    </div>
                  </div>
                </div>

                {/* 长期记忆配置区域 */}
                <div className={styles["agent_long_memory_content_body_right"]}>
                  {/* 长期记忆头部：标题和开关 */}
                  <div className={styles["memory_section_header"]}>
                    <div className={styles["memory_section_title"]}>
                      长期记忆
                      {/* 提示信息 */}
                      <Tooltip title="总结聊天对话的内容，并用于更好的响应用户的消息。">
                        <img
                          src="/agent/info.png"
                          alt="长期记忆说明"
                          className={styles["info_img"]}
                        />
                      </Tooltip>
                    </div>
                    {/* 长期记忆开关 */}
                    <Switch
                      checked={agentInfo.longTermMemoryEnabled}
                      onChange={handleLongTermMemoryEnabledChange}
                      className={styles["memory_switch"]}
                      disabled={!canCreate}
                    />
                  </div>

                  {/* 长期记忆详细配置（仅在启用时显示） */}
                  {agentInfo.longTermMemoryEnabled && (
                    <div className={styles["memory_expiration_options"]}>
                      {/* 记忆类型选择按钮组 */}
                      <div className={styles["memory_option_buttons"]}>
                        {/* 永久有效选项 */}
                        <div
                          className={`${styles["memory_option_buttons_item"]} ${agentInfo.longTermMemoryType === MEMORY_TYPE_ALWAYS
                            ? styles["memory_option_btn_active"]
                            : ""
                            }`}
                          onClick={() =>
                            handleLongTermMemoryTypeChangeEvent(MEMORY_TYPE_ALWAYS)
                          }
                        >
                          永久有效
                        </div>
                        {/* 自定义过期时间选项 */}
                        <div
                          className={`${styles["memory_option_buttons_item"]} ${agentInfo.longTermMemoryType === MEMORY_TYPE_CUSTOM
                            ? styles["memory_option_btn_active"]
                            : ""
                            }`}
                          onClick={() =>
                            handleLongTermMemoryTypeChangeEvent(MEMORY_TYPE_CUSTOM)
                          }
                        >
                          自定义
                        </div>
                      </div>

                      {/* 自定义过期时间配置（仅在选择"自定义"时显示） */}
                      {agentInfo.longTermMemoryType === MEMORY_TYPE_CUSTOM && (
                        <div className={styles["memory_input_group_custom"]}>
                          {/* 过期天数输入框 */}
                          <InputNumber
                            value={agentInfo.longTermMemoryExpired}
                            onBlur={handleLongTermMemoryRoundsBlur}
                            min={LONG_TERM_MEMORY_EXPIRED_MIN}
                            max={LONG_TERM_MEMORY_EXPIRED_MAX}
                            changeOnBlur={false}
                            suffix="天过期"
                            className={styles["memory_number_input"]}
                            disabled={!canCreate}
                          />
                          {/* 过期天数滑块 */}
                          <div className={styles["memory_slider_container"]}>
                            <Slider
                              min={LONG_TERM_MEMORY_EXPIRED_MIN}
                              max={LONG_TERM_MEMORY_EXPIRED_MAX}
                              value={agentInfo.longTermMemoryExpired}
                              onChange={handleLongTermMemoryExpiredChange}
                              disabled={!canCreate}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 子智能体 */}
            <div className={styles["multi_child_agent"]}>
              <div className={styles["multi_child_agent_header"]}>
                <div className={styles["multi_child_agent_title"]}>
                  <div className={styles["multi_child_agent_title_name"]}>子智能体</div><div className={styles["multi_child_agent_title_page"]}>({childAgentList.length}/10 )</div>
                </div>
                <div className={`${styles["multi_child_agent_add_btn"]} ${childAgentList.length >= 10 ? styles["multi_child_agent_add_btn_disabled"] : ""}`} onClick={addSubAgentEvent}>

                  <img
                    src="/agent/sub_add.png"
                    alt="添加"
                    className={styles["sub_add"]}
                  />
                  添加
                </div>
              </div>
              {childAgentList.length > 0 && (
                <div className={styles["multi_child_agent_list"]}>
                  {childAgentList.map((item, index) => (
                    <div
                      key={item.id}
                      className={styles["agent_mcp_item"]}
                      onMouseMove={() => itemHover(item)}
                      onMouseEnter={() => itemHover(item)}
                      onMouseLeave={() => itemMouseOut(item)}
                    >
                      <div className={styles["agent_mcp_item_left"]}>
                        <img
                          className={styles["agent_mcp_item_left_icon_img"]}
                          src={process.env.NEXT_PUBLIC_API_BASE + item.applicationIconUrl}
                          alt=""
                        />

                        <div className={styles["agent_mcp_item_left_content"]}>
                          <div className={styles["agent_mcp_item_left_content_top"]}>
                            <div
                              className={styles["agent_mcp_item_left_content_name"]}
                            >
                              <Text
                                style={{ maxWidth: 600 }}
                                ellipsis={{
                                  tooltip: item.applicationName
                                }}
                              >
                                <span
                                  className={
                                    styles["agent_mcp_item_left_content_name_text"]
                                  }
                                >
                                  {" "}
                                  {item.applicationName
                                  }
                                </span>
                              </Text>
                              {item.isIntegrated && (
                                <div
                                  className={styles["agent_mcp_item_left_content_tag_integrated"]}
                                >
                                  <img
                                    src="/agent/integrated.png"
                                    alt="基础"
                                    className={styles["agent_mcp_item_left_content_tag_integrated_img"]}
                                  />
                                </div>
                              )}
                            </div>
                            <div
                              className={styles["agent_mcp_item_left_content_tag"]}
                            >
                              {item.tagList && (
                                <Tooltip title={item.tagText}>
                                  <div className={styles["agent_mcp_content_item"]}>
                                    <div
                                      className={
                                        styles["knowledge_select_item_tag_first"]
                                      }
                                    >
                                      <Text
                                        className={
                                          styles["knowledge_select_item_tag_other"]
                                        }
                                        style={{ maxWidth: 80 }}
                                        ellipsis={true}
                                      >
                                        {item.tagList[0].name}
                                      </Text>
                                    </div>
                                    {item.tagList.length > 1 && (
                                      <div
                                        className={
                                          styles["knowledge_select_item_tag_other"]
                                        }
                                      >
                                        ,+{item.tagList.length - 1}{" "}
                                      </div>
                                    )}
                                  </div>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <div className={styles["agent_mcp_item_left_content_desc"]}>
                            <Text
                              style={{ maxWidth: "100%" }}
                              ellipsis={{ tooltip: item.applicationDescription }}
                            >
                              <span style={{ fontSize: 12, color: "#60687D" }}>
                                {item.applicationDescription}
                              </span>
                            </Text>
                          </div>
                        </div>
                      </div>

                      {canCreate && isHovered && itemSelect.id === item.id &&
                        !item.isIntegrated && (
                          <div className={styles["agent_variable_item_right"]}>
                            <div className={styles["agent_variable_item_btn"]} onClick={() => deleteSubAgentEvent(item)}>
                              <img
                                alt="删除"
                                src="/agent/delete.png"

                              />
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
              {childAgentList.length === 0 && (
                <div className={styles["multi_child_agent_list_empty"]}>
                  <Empty
                    image={"/application/app_empty.png"}
                    styles={{ image: { height: 220, width: 220 } }}
                    description={<span style={{ color: "#666E82", fontWeight: 500 }}>暂无子智能体</span>}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={styles["multi_agent_container_content_right"]}>
            <AgentChat
              canCreate={canCreate}
              variableList={variableList}
              ref={chatRef}
              agentInfo={agentInfo}
            />
          </div>
        </div>
      )}

      {currentTab == 1 && (
        <ApiDocument ref={apiKeyRef} agentInfo={agentInfo} />
      )}

      {/* 子智能体选择器 */}
      <SubAgentSelect ref={subAgentSelectRef} refreshSubAgentList={refreshSubAgentList} />
      <PublishModel canCreate={canCreate} ref={publishRef} openApiDocumentEvent={handleApiDocumentEvent} openApiDocumentEventAndOpenApiKeyModal={handleApiDocumentEventAndOpenApiKeyModal} closeCallback={getApplicationPublishTimeDescEvent} />
      {/* API密钥弹窗组件 */}
      <ApiKey ref={apiKeyRef} canCreate={canCreate} />
    </div>
  );
};
export default MultiAgentDetailPage;