"use client";

/**
 * 发布&上架组件
 * 功能：提供应用的发布、上架功能，以及API访问和URL访问的配置管理
 * 支持智能体(agent)和工作流(workflow)两种应用类型
 */

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Button,
  Drawer,
  Tooltip,
  Switch,
  message,
  Typography,
} from "antd";

import styles from "./publish.module.css";
import ReleaseModel from "./Release";
import {
  CloseOutlined,
  RightOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { useParams } from "next/navigation";
import RegenerateModal from "./Regenerate";
import {
  applicationGetById,
  publishAgent,
  workflowPublish,
  getApplicationPublishTimeDesc,
  getAgentApiList,
  getWorkflowApiList,
  updateApplication,
  regenerateAccessUrl,
  publishAgentToIntegrated
} from "@/api/application";

// 应用类型常量
const APP_TYPE = {
  AGENT: "agent",
  WORKFLOW: "workflow",
};

const agentUrl ='/chat/agent/';
const workflowUrl ='/chat/workflow/';
const { Text } = Typography;
import { checkPermission } from "@/utils/utils";
const PublishModel = forwardRef((props, ref) => {

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
    hideModal,
  }));

  // ========== 状态管理 ==========
  const [open, setOpen] = useState(false); // Drawer显示/隐藏状态
  const [loading, setLoading] = useState(false); // 发布操作加载状态
  const releaseModelRef = useRef(null); // 上架组件引用
  const regenerateModelRef = useRef(null); // 重新生成组件引用
  const [apiShow, setApiShow] = useState(false); // 是否展示API详情
  const [apiList, setApiList] = useState([]); // API接口列表
  const [appType, setAppType] = useState(""); // 应用类型: "agent" | "workflow"
  const [appInfo, setAppInfo] = useState({}); // 应用详细信息
  const [lastOnShelfTimeDesc, setLastOnShelfTimeDesc] = useState(""); // 上次上架时间描述
  const [lastPublishTimeDesc, setLastPublishTimeDesc] = useState(""); // 上次发布时间描述
  const [appId, setAppId] = useState(""); // 应用ID
  const [apiKey, setApiKey] = useState(""); // API接口密钥
  const [publishText, setPublishText] = useState("发布到应用"); // 发布按钮文本
  const [canIntegrated, setCanIntegrated] = useState(false); // 是否可以发布成应用
  const [headerTitle, setHeaderTitle] = useState("发布&上架"); // 头部标题
  const [url, setUrl] = useState(""); // url地址
  /**
   * 显示发布弹窗
   * @param {Object} obj - 应用对象，包含 applicationId 或 app_id
   * @param {string} type - 应用类型: "agent" | "workflow"
   */
  const showModal = (obj, type,isPublish) => {
    setCanIntegratedEvent();
    let id = obj.applicationId || obj.app_id; // 兼容不同的ID字段名
    setAppId(id);
    setOpen(true);
    setAppType(type);
    setApiShow(false);
    setHeaderTitle(isPublish ? "更新上架" : "发布&上架");
    // 初始化数据：获取应用详情、发布时间描述和API列表
    getApplicationDetailEvent(id,type);
    getApplicationPublishTimeDescEvent(id);
    handleGetApiListEvent(type, id);
  };
 
  //设置是否可以发布为内置应用
  const setCanIntegratedEvent = () => {
   let  checkUrl ="/main/application/manage/integrated/operation";
   setCanIntegrated(checkPermission(checkUrl));
  }
  /**
   * 根据应用类型获取对应的API列表
   * @param {string} type - 应用类型: "agent" | "workflow"
   * @param {string} id - 应用ID
   */
  const handleGetApiListEvent = (type, id) => {
    if (type === APP_TYPE.AGENT) {
      getAgentApiListEvent(id);
    } else if (type === APP_TYPE.WORKFLOW) {
      getWorkflowApiListEvent(id);
    }
  };

  /**
   * 获取应用详情信息
   * @param {string} id - 应用ID
   */
  const getApplicationDetailEvent = (id,type) => {
    applicationGetById(id)
      .then((res) => {
       console.log(res.data,'res.data');
        setAppInfo(res.data);
        generateUrlEvent(res.data.urlKey,type);
      })
      .catch((err) => {
   
      });
  };

  /**
   * 获取应用发布时间描述信息
   * @param {string} id - 应用ID
   */
  const getApplicationPublishTimeDescEvent = (id) => {
    getApplicationPublishTimeDesc(id)
      .then((res) => {
        setLastOnShelfTimeDesc(res.data.lastOnShelfTimeDesc || "");
        setLastPublishTimeDesc(res.data.lastPublishedTimeDesc || "");
        if(res.data.lastPublishedTimeDesc){
          setPublishText("更新应用");
          setHeaderTitle("更新上架");
        }
      })
      .catch((err) => {
        console.error("获取发布时间描述失败:", err);
      });
  };

  /**
   * 隐藏发布弹窗
   */
  const hideModal = () => {
    setOpen(false);
    props?.closeCallback();
  };

  /**
   * 上架按钮点击事件
   * 打开上架弹窗
   */
  const releaseClickEvent = () => {
    releaseModelRef.current?.showModal(appInfo, appType);
  };

  // Drawer 样式类名配置
  const classNames = {
    content: styles["publish-drawer-content"],
    header: styles["publish-drawer-header"],
    body: styles["publish-drawer-body"],
    footer: styles["publish-drawer-footer"],
  };

  /**
   * 复制API接口URL到剪贴板
   * @param {Object} item - API接口项，包含 apiInterfaceUrl 字段
   */
  const handleCopy = (item) => {
    navigator.clipboard
      .writeText(item.apiInterfaceUrl)
      .then(() => {
        message.success("复制成功");
      })
      .catch((err) => {
        console.error("复制失败:", err);
      
      });
  };

  /**
   * 发布按钮点击事件
   * 根据应用类型调用对应的发布方法
   */
  const publishClickEvent = () => {
    setApiShow(false); // 关闭API详情展开状态
    setLoading(true);
    
    if (appType === APP_TYPE.AGENT) {
      agentPublishEvent();
    } else if (appType === APP_TYPE.WORKFLOW) {
      workflowPublishEvent();
    }
  };

  /**
   * 智能体发布事件
   * 调用智能体发布接口，发布成功后刷新API列表和时间描述
   */
  const agentPublishEvent = () => {
    setLoading(true);
    publishAgent(appId)
      .then((res) => {
        publishSuccessCallback();
        getAgentApiListEvent(appId); // 刷新API列表
      })
      .catch((err) => {
        setLoading(false);
        console.error("智能体发布失败:", err);
        
      });
  };

  /**
   * 工作流发布事件
   * 调用工作流发布接口，发布成功后刷新API列表和时间描述
   */
  const workflowPublishEvent = () => {
    setLoading(true);
    workflowPublish(appId)
      .then((res) => {
        publishSuccessCallback();
        getWorkflowApiListEvent(appId); // 刷新API列表
      })
      .catch((err) => {
        setLoading(false);
        console.error("工作流发布失败:", err);
      
      });
  };

  /**
   * 发布成功回调
   * 显示成功提示，更新加载状态，刷新发布时间描述
   */
  const publishSuccessCallback = () => {
    message.success("发布成功");
    setLoading(false);
    getApplicationPublishTimeDescEvent(appId);
    getApplicationDetailEvent(appId,appType);
  };

  /**
   * 上架成功回调
   * 刷新应用发布时间描述
   */
  const releaseSuccessCallback = () => {
    getApplicationPublishTimeDescEvent(appId);
  };

  /**
   * 获取智能体API接口列表
   * @param {string} id - 应用ID
   */
  const getAgentApiListEvent = (id) => {
    getAgentApiList({ id })
      .then((res) => {
        handleApiDetailRender(res.data);
      })
      .catch((err) => {
        console.error("获取智能体API列表失败:", err);
      });
  };

  /**
   * 获取工作流API接口列表
   * @param {string} id - 应用ID
   */
  const getWorkflowApiListEvent = (id) => {
    getWorkflowApiList({ id })
      .then((res) => {
        handleApiDetailRender(res.data);
      })
      .catch((err) => {
        console.error("获取工作流API列表失败:", err);
      });
  };

  /**
   * 处理API详情数据渲染
   * 提取API密钥和接口列表，更新状态
   * @param {Object} data - API数据对象
   * @param {string} data.apiKey - API密钥
   * @param {Array} data.apiInterfaceInfoList - API接口信息列表
   */
  const handleApiDetailRender = (data) => {
    const key = data?.apiKey || "";
    const apiInterfaceInfoList = data?.apiInterfaceInfoList || [];
    setApiKey(key);
    setApiList(apiInterfaceInfoList);
  };

  /**
   * API密钥区域点击事件
   * 切换API详情展开/收起状态
   * 当没有API密钥或正在加载时，禁止展开
   */
  const handleApiKeyClickEvent = () => {
    if (!lastPublishTimeDesc || loading) {
      return;
    }
    setApiShow(!apiShow);
  };

  /**
   * 访问URL开关切换事件
   * @param {boolean} checked - 开关状态
   * 
   */
  const urlSwitchChangeEvent = (checked) => {
    let updateData = {...appInfo, urlAccessable: checked };
    setAppInfo(updateData);
    updateApplicationEvent(updateData);
  
  };

  //访问api开关切换事件
  const apiAccessSwitchChangeEvent = (checked) => {
    let updateData = {...appInfo, apiAccessable: checked };
    setAppInfo(updateData);
    updateApplicationEvent(updateData);
  
  };

  //更新应用事件
  const updateApplicationEvent = (updateData) => {
    updateApplication(updateData)
      .then((res) => {
      getApplicationDetailEvent(appId);
      })
      .catch((err) => {
        
      });
  };

  //重新生成访问url事件
  const regenerateCallBack = (id) => {
    regenerateAccessUrl(id)
      .then((res) => {
        generateUrlEvent(res.data);
      })
      .catch((err) => {
        console.error("重新生成失败:", err);
      });
  };
  const regenerateAccessUrlEvent = () => {
    regenerateModelRef.current?.showModal(appId);
  };

  //生成url地址
  const generateUrlEvent = (data,type) => {
    let typeValue = appType? appType : type;
   // 获取完整的主机地址，如 https://localhost:3000
   let protocol = window.location.protocol;
   let host = window.location.host;
   let origin = protocol + "//" + host;
   let typeUrl = typeValue === APP_TYPE.AGENT ? agentUrl : workflowUrl;
   let newUrl = origin + typeUrl + data;
  setUrl(newUrl);
  };

  //复制url地址
  const handleCopyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      message.success("复制成功");
    }
  };

  //打开新标签页运行
  const handleRunUrlEvent =()=>{
  if(url){
    window.open(url, '_blank');
  }
  }
  
  //跳转到api文档界面
  const handleApiDocumentEvent = () => {
   setOpen(false);
   props?.openApiDocumentEvent();
  }
  //跳转到api文档界面并打开api密钥弹框
  const handleApiDocumentEventAndOpenApiKeyModal = () => {

    props?.openApiDocumentEventAndOpenApiKeyModal();
  }
 

  //发布成内置引用
  const integrateClickEvent = () => {
    if (!lastPublishTimeDesc || appInfo.isIntegrated) {
      return;
    }
    publishAgentToIntegrated(appId)
      .then((res) => {
        message.success("已注册为基础协作体")
        getApplicationDetailEvent(appId);
      })
      .catch((err) => {
        console.error("注册为基础协作体失败:", err);
      });
   
  };

  return (
    <div>
      {/* 发布&上架抽屉组件 */}
      <Drawer
        closable={false}
        destroyOnClose
        title={null}
        placement="right"
        open={open}
        rootStyle={{ boxShadow: "none" }}
        style={{ borderRadius: "20px 0px 0px 20px" }}
        width={420}
        onClose={hideModal}
        classNames={classNames}
        footer={null}
        zIndex={800}
      >
        <div className={styles.publish_content}>
          {/* ========== 头部区域 ========== */}
          <div className={styles.publish_content_header}>
            <div className={styles.publish_content_title}>{headerTitle}</div>
            <div className={styles.close_btn} onClick={hideModal}>
              <CloseOutlined />
            </div>
          </div>

          {/* ========== 主要内容区域 ========== */}
          <div className={styles.publish_content_main}>
            {/* 发布和上架操作按钮区域 */}
            <div className={styles.publish_content_buttons_box}>
              <div className={styles.publish_content_buttons}>
                {/* 发布按钮 */}
                <Button
                  type="primary"
                  className={styles.publish_btn_publish}
                  loading={loading}
                  onClick={publishClickEvent}
                >
                  {loading ? null : (
                    <img
                      className={styles["action_img"]}
                      src="/application/publish.png"
                      alt="发布到应用"
                    />
                  )}
                  {loading ? "发布中" : publishText}
                </Button>
                {/* 上架按钮 */}
                <Button
                  className={styles.publish_btn_discover}
                  onClick={releaseClickEvent}
                >
                  <img
                    className={styles["action_img"]}
                    src="/application/publish/release.png"
                    alt='上架到"发现"页'
                  />
                  上架到&quot;发现&quot;页
                </Button>

              </div>
              {/* 上次操作时间显示 */}
              <div className={styles.publish_content_last_time}>
                <div className={styles.publish_content_last_time_left}>
                  {lastPublishTimeDesc && <span>{lastPublishTimeDesc}</span>}
                </div>
                <div className={styles.publish_content_last_time_right}>
                  {lastOnShelfTimeDesc && <span>{lastOnShelfTimeDesc}</span>}
                </div>
              </div>
              {/* 生成内置应用 */}
              {(canIntegrated && appType === APP_TYPE.AGENT && appInfo.agentType !== 'multiple') && (
                <div className={styles.publish_content_buttons}>  
                <Tooltip title={appInfo.isIntegrated ? "已注册为基础协作体" : ""}>
                <Button
                  disabled={!lastPublishTimeDesc || appInfo.isIntegrated}
                  className={(!lastPublishTimeDesc || appInfo.isIntegrated ? styles.publish_btn_integrated_disabled : styles.publish_btn_integrated )}
                  onClick={integrateClickEvent}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.src = "/application/integrated_hover.png";
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.src = "/application/integrated.png";
                  }}
                >
                  <img
                    className={styles["action_img"]}
                    src="/application/integrated.png"
                    alt="注册为基础协作体"
                  />
                  注册为基础协作体
                </Button>
                </Tooltip>
              </div>
              )}
            </div>

            {/* ========== 功能配置区域 ========== */}
            <div className={styles.publish_content_items}>
              {/* API访问配置区域 */}
              <div className={styles.publish_content_api}>
                {/* API访问头部 - 可点击展开/收起 */}
                <div
                  className={`${styles.publish_content_api_header} ${
                    !lastPublishTimeDesc || loading
                      ? styles.publish_content_api_header_disabled
                      : ""
                  }`}
                  onClick={handleApiKeyClickEvent}
                >
                  <div className={styles.publish_content_api_left}>
                    <img src="/application/publish/api.png" alt="api" />
                    <span>访问API</span>
                    <Switch
                      size="small"
                      checked={appInfo.apiAccessable}
                      disabled={!lastPublishTimeDesc || loading}
                      onChange={apiAccessSwitchChangeEvent}
                      onClick={(checked,e) => e.stopPropagation()}
                    />
                  </div>
                  <div className={styles.publish_content_api_right}>
                    {apiShow ? <DownOutlined /> : <RightOutlined />}
                  </div>
                </div>

                {/* API详情展开内容 */}
             
                  <div className={styles.api_box}>
                    {/* API文档和密钥快捷入口 */}
                    <div className={styles.api_box_key_doc}>
                      {/* API文档入口 */}
                      <div className={styles.api_box_key_doc_item}    onMouseEnter={e => {
                            const icon = e.currentTarget.parentNode.querySelector('img[data-hover-icon]');
                            const docImg = e.currentTarget.querySelector('img[data-doc-icon]');
                            if (icon) icon.src = '/common/go_hover.png';
                            if (docImg) docImg.src = '/common/document_hover.png';
                          }}
                          onMouseLeave={e => {
                            const icon = e.currentTarget.parentNode.querySelector('img[data-hover-icon]');
                            const docImg = e.currentTarget.querySelector('img[data-doc-icon]');
                            if (icon) icon.src = '/common/publish_right.png';
                            if (docImg) docImg.src = '/common/document.png';
                          }} onClick={handleApiDocumentEvent}>
                        <div
                          className={styles.api_box_key_doc_item_left}
                       
                        >
                          <img
                            className={styles.api_box_key_doc_item_left_img}
                            src="/common/document.png"
                            alt="API文档"
                            data-doc-icon
                          />
                          <div className={styles.api_box_key_doc_item_title}>
                            API文档
                          </div>
                        </div>
                        <img
                          className={styles.api_box_key_doc_item_right_img}
                          src="/common/publish_right.png"
                          alt="跳转"
                          data-hover-icon
                        />
                      </div>
                      {/* API密钥入口 */}
                      <div className={styles.api_box_key_doc_item}
                             onMouseEnter={e => {
                              const icon = e.currentTarget.parentNode.querySelector('img[data-go-icon]');
                              const docImg = e.currentTarget.querySelector('img[data-api-icon]');
                              if (icon) icon.src = '/common/go_hover.png';
                              if (docImg) docImg.src = '/common/key_hover.png';
                            }}
                            onMouseLeave={e => {
                              const icon = e.currentTarget.parentNode.querySelector('img[data-go-icon]');
                              const docImg = e.currentTarget.querySelector('img[data-api-icon]');
                              if (icon) icon.src = '/common/publish_right.png';
                              if (docImg) docImg.src = '/common/key.png';
                            }}
                      onClick={handleApiDocumentEventAndOpenApiKeyModal}>
                        <div className={styles.api_box_key_doc_item_left}>
                          <img
                            className={styles.api_box_key_doc_item_left_img}
                            src="/common/key.png"
                            alt="API密钥"
                            data-api-icon
                          />
                          <div className={styles.api_box_key_doc_item_title}>
                            API密钥
                          </div>
                        </div>
                        <img
                          className={styles.api_box_key_doc_item_right_img}
                          src="/common/publish_right.png"
                          alt="跳转"
                          data-go-icon
                        />
                      </div>
                    </div>

                    {apiShow && (
                    <div className={styles.publish_content_api_list}>
                      {apiList.map((item) => (
                        <div
                          className={styles.publish_content_api_list_item}
                          key={item.id}
                        >
                          <div
                            className={styles.publish_content_api_list_item_name}
                          >
                            {item.apiInterfaceName}
                            <img
                              src="/workflow/json_copy.png"
                              alt="复制"
                              onClick={() => handleCopy(item)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                          <div
                            className={styles.publish_content_api_list_item_url}
                          >
                            {item.apiInterfaceUrl}
                          </div>
                        </div>
                      ))}
                    </div>
                      )}
                  </div>
              
              </div>
              {/* URL访问配置区域 */}
              <div className={styles.api_access_box}>
                {/* URL访问头部 - 包含开关控制 */}
                <div
                  className={`${styles.api_access_box_header} ${
                    !lastPublishTimeDesc || loading
                      ? styles.publish_content_api_header_disabled
                      : ""
                  }`}
                >
                  <div className={styles.api_access_box_header_title}>
                    <img
                      className={styles.api_access_box_header_title_img}
                      src="/application/publish/url.png"
                      alt="URL访问"
                    />
                    访问URL
                  </div>
                  <div className={styles.api_access_box_header_switch}>
                    <Switch
                      size="small"
                      checked={appInfo.urlAccessable}
                      onChange={urlSwitchChangeEvent}
                      disabled={!lastPublishTimeDesc || loading}
                    />
                  </div>
                </div>

                {/* URL访问详情内容 - 仅在启用时显示 */}
                {appInfo.urlAccessable && (
                  <div className={styles.api_access_box_content}>
                    {/* 运行入口 */}
                    <div className={styles.api_box_key_doc}>
                      <div className={styles.api_box_key_doc_item}
                         onMouseEnter={e => {
                          const icon = e.currentTarget.parentNode.querySelector('img[data-run-hover-icon]');
                          const docImg = e.currentTarget.querySelector('img[data-run-icon]');
                          if (icon) icon.src = '/common/go_hover.png';
                          if (docImg) docImg.src = '/common/run_hover.png';
                        }}
                        onMouseLeave={e => {
                          const icon = e.currentTarget.parentNode.querySelector('img[data-run-hover-icon]');
                          const docImg = e.currentTarget.querySelector('img[data-run-icon]');
                          if (icon) icon.src = '/common/publish_right.png';
                          if (docImg) docImg.src = '/common/run.png';
                        }}
                      onClick={handleRunUrlEvent}>
                        <div className={styles.api_box_key_doc_item_left}>
                          <img
                            className={styles.api_box_key_doc_item_left_img}
                            src="/common/run.png"
                            alt="运行"
                            data-run-icon
                          />
                          <div className={styles.api_box_key_doc_item_title}>
                            运行
                          </div>
                        </div>
                        <img
                          className={styles.api_box_key_doc_item_right_img}
                          src="/common/publish_right.png"
                          alt="跳转"
                          data-run-hover-icon
                        />
                      </div>
                    </div>

                    {/* URL显示和操作区域 */}
                    <div className={styles.api_access_box_content_url}>
                      <div className={styles.api_access_box_content_url_left}>
                      <Text style={{ maxWidth: 258 }} ellipsis={{ tooltip: url }}>
                       <span className={styles.api_access_box_content_url_left_text}> {url}</span></Text>
                      </div>
                      <div className={styles.api_access_box_content_url_right}>
                        {/* 重新生成URL按钮 */}
                        <Tooltip title="重新生成">
                          <img
                            className={styles.api_access_box_img}
                            src="/common/refresh.png"
                            alt="重新生成"
                            style={{ cursor: "pointer" }}
                            onClick={regenerateAccessUrlEvent}
                          />
                        </Tooltip>
                        {/* 复制URL按钮 */}
                        <img
                          className={styles.api_access_box_img}
                          src="/workflow/json_copy.png"
                          alt="复制"
                          style={{ cursor: "pointer" }}
                          onClick={handleCopyUrl}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 空状态占位 - 当没有API密钥或正在加载时显示 */}
              {(!lastPublishTimeDesc || loading) && (
                <div className={styles.publish_content_api_list_empty}></div>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* 上架弹窗组件 */}
      <ReleaseModel
        zIndex={10000}
        ref={releaseModelRef}
        releaseSuccessCallback={releaseSuccessCallback}
      />
      {/* 重新生成弹窗组件 */}
      <RegenerateModal
        zIndex={10000}
        ref={regenerateModelRef}
        regenerateCallBack={regenerateCallBack}
      />
    </div>
  );
});

export default PublishModel;
