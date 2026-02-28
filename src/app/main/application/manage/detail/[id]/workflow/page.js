"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./workflow.module.css";
import WorkflowEditor from "./components/workflow";
import { Typography, Button, Spin } from "antd";
import { ReactFlowProvider } from "@xyflow/react";
import { getWorkflowDetail } from "@/api/workflow";
import Test from "./components/run";
import { useStore } from "@/store/index";
import { checkPermission } from "@/utils/utils";
import { getAgentModelList } from "@/api/agent";
import PublishModel from "../../../components/publish"; // 发布组件
import ApiComponent from "./components/apiDocument";
import ApiKey from "../../../components/apiKey";
import { message } from "antd";
import {
  getApplicationPublishTimeDesc,
} from "@/api/application";
// 常量定义
const APPLICATION_STATUS = {
  UNRELEASED: 0, // 未发布状态
};

const ROUTE_PATHS = {
  UNRELEASED: "/main/application/manage/unreleased",
  RELEASED: "/main/application/manage/released",
};

const PERMISSION_PATHS = {
  UNRELEASED_OPERATION: "/main/application/manage/unreleased/operation",
  RELEASED_OPERATION: "/main/application/manage/released/operation",
};

// 模型标签ID定义
const MODEL_TAG_IDS = {
  TEXT: 1, // 文本模型
  MULTIMODAL: 2, // 多模态模型
  REASONING: 3, // 推理模型
  RERANK: 9, // 排序模型
};

const MODEL_TAG_LIST = [
  MODEL_TAG_IDS.TEXT,
  MODEL_TAG_IDS.MULTIMODAL,
  MODEL_TAG_IDS.REASONING,
  6, // 其他模型类型
  MODEL_TAG_IDS.RERANK,
];

const TAB_CONFIG = {
  ORCHESTRATION: "0", // 编排
  API_ACCESS: "1", // 访问API
};

const RUN_STATUS = {
  RUNNING: "running",
};

/**
 * 工作流页面组件
 * 用于展示和编辑工作流的编排、测试和发布功能
 */
export default function WorkflowPage() {
  const { id } = useParams(); // 从路由参数获取应用ID
  const router = useRouter();
  const { Text } = Typography;

  // 从全局状态管理中获取状态和方法
  const {
    updateTime, // 更新时间（用于显示自动保存时间）
    setUpdateTime, // 设置更新时间的函数
    readOnly, // 是否只读模式
    setReadOnly, // 设置只读模式的函数
    setRunVisible, // 设置运行弹窗可见性
    setPannerNode, // 设置面板节点
    setPanelVisible, // 设置面板可见性
  } = useStore((state) => state);

  // 本地状态管理
  const [applicationDetail, setApplicationDetail] = useState({}); // 应用详情数据
  const [modelList, setModelList] = useState([]); // 模型列表
  const [loading, setLoading] = useState(false); // 页面加载状态
  const [tab, setTab] = useState(TAB_CONFIG.ORCHESTRATION); // 当前选中的标签页
  const [required, setRequired] = useState(false); // 是否必填项已配置完成
  const [runStatus, setRunStatus] = useState({}); // 运行状态
  const [lastOnShelfTimeDesc, setLastOnShelfTimeDesc] = useState("");//上次上架时间描述
  const [lastPublishTimeDesc, setLastPublishTimeDesc] = useState("");//上次发布时间描述
const [publishText, setPublishText] = useState("发布&上架");//发布按钮文本
  // 组件引用
  const workflowEditorRef = useRef(null); // 工作流编辑器引用
  const testRef = useRef(null); // 测试组件引用
  const abortRef = useRef(null); // SSE 请求中止控制器引用
  const apiRef = useRef(null); // API组件引用
  const publishRef = useRef(null); // 发布组件引用
  const apiKeyRef = useRef(null); // API密钥组件引用  
  const [canCreateApiKey, setCanCreateApiKey] = useState(false); // 是否可以创建API密钥
  // 标签页配置
  const tabList = [
    { label: "编排", key: TAB_CONFIG.ORCHESTRATION },
    { label: "访问API", key: TAB_CONFIG.API_ACCESS },
  ];

  /**
   * 返回列表界面
   * 根据应用状态跳转到对应的列表页面（未发布/已发布）
   */
  const handleBack = () => {
    const unReleasedPath = ROUTE_PATHS.UNRELEASED;
    const releasedPath = ROUTE_PATHS.RELEASED;

    if (applicationDetail.status === APPLICATION_STATUS.UNRELEASED) {
      router.push(unReleasedPath);
    } else {
      router.push(releasedPath);
    }
  };

  /**
   * 获取应用详情事件
   * 根据应用ID获取工作流详情，并初始化工作流编辑器
   */
  const getApplicationDetailEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWorkflowDetail(id);
      const data = res.data;
      setDetailPermission(data.status);
      setApplicationDetail(data);
      // 将数据设置到工作流编辑器
      workflowEditorRef.current?.setWorkflowData(data);
      setUpdateTime(data.updateTime);
    } catch (err) {
      setLoading(false);
      // 错误处理：关闭加载状态
    } finally {
      
      setLoading(false);
    }
  }, [id, setUpdateTime]);

  //设置详情权限
  const setDetailPermission = (status) => {
    let  checkUrl =status == 0 ? "/main/application/manage/unreleased/operation" : "/main/application/manage/released/operation";
   
    setCanCreateApiKey(checkPermission(checkUrl));
    setReadOnly(!checkPermission(checkUrl));
 
  }
  /**
   * 获取模型列表事件
   * 获取可用的AI模型列表，成功后继续获取应用详情
   * @param {Object} nodeDataPar - 节点数据参数（可选，当前未使用）
   */
  const getAgentModelListEvent = useCallback(async (nodeDataPar) => {
    const reqPar = {
      type: 1, // 请求类型
      tagIdList: MODEL_TAG_LIST, // 模型标签ID列表
      isShelf: 1, // 是否上架（1-是，0-否）
      isOr: 1, // 是否使用OR逻辑（1-是，0-否）
    };

    try {
      const res = await getAgentModelList(reqPar);
      const dataArray = res.data || [];
      setModelList(dataArray);
      // 模型列表获取成功后，继续获取应用详情
      getApplicationDetailEvent();
    } catch (err) {
      setLoading(false);
    }
  }, [getApplicationDetailEvent]);

  /**
   * 初始化数据加载
   * 组件挂载或ID变化时执行：检查权限、获取模型列表和应用详情
   */
  useEffect(() => {
    setLoading(true);
    // 获取模型列表（会在成功后继续获取应用详情）
    getAgentModelListEvent();
  }, [id, setReadOnly, getAgentModelListEvent]);

  /**
   * 测试点击事件
   * 打开测试弹窗，重置相关状态
   */
  const testClickEvent = () => {
    // 确保测试弹窗处于关闭状态
    testRef.current?.hideModal();
    // 重置运行相关状态
    setRunVisible(false);
    setPannerNode(null);
    setPanelVisible(false);
    // 显示测试弹窗
    testRef.current?.showModal();
  };

  /**
   * 创建SSE应用
   * 用于创建Server-Sent Events连接（当前未实现）
   * @param {Object} params - SSE连接参数
   */
  const createSseApplication = (params) => {
    // TODO: 实现SSE连接逻辑
  };

  /**
   * 关闭SSE连接
   * 中止正在进行的SSE请求
   */
  const handleSseStop = () => {
    abortRef.current?.abort();
  };

  /**
   * 设置运行状态事件
   * 更新工作流运行状态（运行中/已完成等）
   * @param {Object} obj - 运行状态对象
   */
  const setRunStatusEvent = (obj) => {
    setRunStatus(obj);
  };

  /**
   * 发布点击事件
   * 在必填项配置完成后，打开发布弹窗
   */
  const publishClickEvent = () => {
    // 检查必填项是否已完成配置
    if (!required) {
      message.warning("必填项未完成配置!");
      return;
    }

    // 关闭其他弹窗和面板
    setRunVisible(false);
    setPanelVisible(false);
    testRef.current?.hideModal();

    // 显示发布弹窗
    publishRef.current?.showModal(applicationDetail, "workflow",lastPublishTimeDesc);
  };

  /**
   * 更新必填项配置状态
   * 当工作流配置变化时，更新必填项是否已配置完成的状态
   * @param {boolean} isValid - 是否所有必填项都已配置
   */
  const updateRequiredEvent = (isValid) => {
    setRequired(isValid);
  };

  /**
   * 设置标签页事件
   * 更新当前选中的标签页
   * @param {string} key - 标签页键值
   */
  const setTabEvent = (key) => {
    if(key === TAB_CONFIG.API_ACCESS){//访问API
      testRef.current?.hideModal();
      apiRef.current?.setApiData(applicationDetail);
    }
    if(key === TAB_CONFIG.ORCHESTRATION){//编排
      getApplicationDetailEvent();
    }
    setTab(key);
  };

  /**
   * API密钥点击事件
   * 打开API密钥弹窗
   */
  const apiKeyClickEvent = () => {
    apiKeyRef.current?.showModal();
  };
   //跳转到api文档界面
   const handleApiDocumentEvent = () => {
    setTab(TAB_CONFIG.API_ACCESS);
  }
  //跳转到api文档界面并打开api密钥弹框
  const handleApiDocumentEventAndOpenApiKeyModal = () => {
    apiKeyClickEvent();
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
    <div className={styles["workflow_page"]}>
      {/* 全屏加载提示 */}
      <Spin
        spinning={loading}
        wrapperClassName="node_main_spin"
        fullscreen
        tip="加载中..."
      >
        {" "}
      </Spin>

      {/* ReactFlow 提供者，用于工作流可视化编辑 */}
      <ReactFlowProvider>
        {/* 页面头部区域 */}
        <div className={styles["workflow_page_header"]}>
          {/* 头部左侧：返回按钮和应用信息 */}
          <div className={styles["workflow_page_header_left"]}>
            {/* 返回按钮 */}
            <div
              onClick={handleBack}
              className={styles["workflow_page_header_left_back"]}
            >
              <img src="/find/back.png" alt="返回" />
            </div>

            {/* 应用标题信息 */}
            <div className={styles["workflow_page_header_title"]}>
              {/* 应用图标 */}
              <img
                src={
                  process.env.NEXT_PUBLIC_API_BASE +
                  applicationDetail?.application_icon_url
                }
                alt="应用图标"
              />
              {/* 应用名称和类型 */}
              <div className={styles["workflow_page_header_title_text"]}>
                <div className={styles["workflow_page_header_title_text_top"]}>
                  <Text
                    style={{ maxWidth: 210 }}
                    ellipsis={{ tooltip: applicationDetail.application_name }}
                  >
                    {applicationDetail.application_name}
                  </Text>
                </div>
                <div className={styles["workflow_page_header_title_text_desc"]}>
                  工作流
                </div>
              </div>
            </div>
          </div>
          
          {/* 头部右侧：自动保存时间和操作按钮 */}
          {tab === TAB_CONFIG.ORCHESTRATION && (
          <div className={styles["workflow_page_header_right"]}>
            {/* 自动保存时间显示 */}
            <div className={styles["workflow_page_header_right_time"]}>
              自动保存 {updateTime}
            </div>
            {/* 分隔线 */}
            <div className={styles["workflow_page_header_right_line"]}></div>
            {/* 操作按钮组 */}
            <div className={styles["workflow_page_header_right_action"]}>
              {/* 测试按钮 */}
              <Button
                disabled={!canCreateApiKey}
                loading={runStatus && runStatus.status === RUN_STATUS.RUNNING}
                onClick={testClickEvent}
                className={!canCreateApiKey ? styles["workflow_page_header_right_action_test_disabled"] : styles["workflow_page_header_right_action_test"]}
              >
                {/* 运行中时不显示图标 */}
                {runStatus && runStatus.status === RUN_STATUS.RUNNING ? null : (
                  <img
                    className={styles["action_img"]}
                    src="/workflow/test.png"
                    alt="测试"
                    style={{ filter: !canCreateApiKey ? "grayscale(1)" : "none" }}
                  />
                )}
                {runStatus && runStatus.status === RUN_STATUS.RUNNING
                  ? "运行中"
                  : "测试"}
              </Button>
              {/* 发布上架按钮 */}
              <Button
                type="primary"
                disabled={
                  !canCreateApiKey ||
                  readOnly ||
                  (runStatus && runStatus.status === RUN_STATUS.RUNNING)
                }
                onClick={publishClickEvent}
                className={styles["workflow_page_header_right_action_btn"]}
              >
                <img
                  className={styles["action_img"]}
                  src="/application/publish.png"
                  alt="发布"
                />
                {publishText}
              </Button>
            </div>
          </div>
          )}
              {tab === TAB_CONFIG.API_ACCESS && (
          <div className={styles["workflow_page_header_right_api"]}>
            <div
              className={styles["workflow_page_header_right_api_btn"]}
              onClick={apiKeyClickEvent}
            >
              <img src="/common/key.png" alt="API密钥" />API密钥
            </div>
          </div>
          )}

          {/* 头部中间：标签页切换 */}
          <div className={styles["workflow_page_header_right_center"]}>
            {tabList.map((item) => (
              <div
                key={item.key}
                className={`${styles["tab_item"]} ${
                  tab === item.key ? styles["tab_item_active"] : ""
                }`}
                onClick={() => setTabEvent(item.key)}
              >
                {/* 编排标签页 */}
                {parseInt(item.key) === parseInt(TAB_CONFIG.ORCHESTRATION) && (
                  <>
                    <img src={ tab === item.key?"/application/arrangement_hover.png":"/application/arrangement.png"} alt="编排" /> {item.label}
                  </>
                )}
                {/* 访问API标签页 */}
                {parseInt(item.key) === parseInt(TAB_CONFIG.API_ACCESS) && (
                  <>
                    <img src={ tab === item.key?"/application/api_hover.png":"/application/api.png"} alt="访问API" /> {item.label}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 工作流编辑器内容区域 */}
        {tab === TAB_CONFIG.ORCHESTRATION && (
          <div className={styles["workflow_page_content"]} id="workflow_page">
            <WorkflowEditor
              modelList={modelList}
              ref={workflowEditorRef}
              updateRequiredEvent={updateRequiredEvent}
            />
          </div>
        )}
        {/* 访问api */}
        {tab === TAB_CONFIG.API_ACCESS && (
          <div className={styles["workflow_page_content"]}>
            <ApiComponent ref={apiRef} />
          </div>
        )}
        {/* 测试弹窗组件 */}
        <Test
          handleSseStop={handleSseStop}
          ref={testRef}
          id={id}
          setRunStatusEvent={setRunStatusEvent}
          createSseApplication={createSseApplication}
        />

        {/* 发布弹窗组件 */}
        <PublishModel canCreate={canCreateApiKey} ref={publishRef} openApiDocumentEvent={handleApiDocumentEvent} openApiDocumentEventAndOpenApiKeyModal={handleApiDocumentEventAndOpenApiKeyModal} closeCallback={getApplicationPublishTimeDescEvent} />
        {/* API密钥弹窗组件 */}
        <ApiKey canCreate={canCreateApiKey} ref={apiKeyRef} />
      </ReactFlowProvider>
    </div>
  );
}
