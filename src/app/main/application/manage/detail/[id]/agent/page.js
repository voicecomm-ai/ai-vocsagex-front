"use client";
/**
 * 智能体管理页面组件
 */
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams,useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { getAgentDetail } from "@/api/agent";
import { Button, message, Typography } from "antd";
import { checkPermission } from "@/utils/utils";
import PublishModel from "../../../components/publish";
import AgentConfig from "./components/configuration";
import ApiDocument from "./components/apiDocument"; 
import ApiKey from "../../../components/apiKey";
import {
  getApplicationPublishTimeDesc,

} from "@/api/application";

const { Text } = Typography;
export default function AgentPage() {
  const { id } = useParams();

  const router = useRouter();
  const  searchParams = useSearchParams();
  // ========== State 状态管理 ==========
  const [agentInfo, setAgentInfo] = useState({});
  const [canCreate, setCanCreate] = useState(false);
  const [currentTab,setCurrentTab] = useState("0");
  const [fromPage,setFromPage]  = useState(null);
  const [lastOnShelfTimeDesc, setLastOnShelfTimeDesc] = useState("");//上次上架时间描述
  const [lastPublishTimeDesc, setLastPublishTimeDesc] = useState("");//上次发布时间描述
const [publishText, setPublishText] = useState("发布&上架");//发布按钮文本
  // ========== Refs 组件引用 ==========
  const agentConfigRef = useRef(null);
  const publishRef = useRef(null);
  const apiKeyRef = useRef(null);
  // ========== 常量定义 ==========
  const tabList = [
    { label: "编排", key: "0" },
    { label: "访问API", key: "1" },
  ];

  // ========== 生命周期 ==========
  useEffect(() => {
    getAgentDetailEvent();
    getApplicationPublishTimeDescEvent();
   
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(()=>{
    getUrlParamsEvent();
  },[])

  //获取url参数
  const  getUrlParamsEvent =()=>{
    let from =searchParams.get("from");
    setFromPage(from);
  }
 

  // ========== 智能体详情相关 ==========
  const getAgentDetailEvent = async () => {
    await getAgentDetail(id).then((res) => {
      setDetailPermission(res.data);
      setAgentInfo(res.data);

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
    console.log(checkUrl,'checkUrl');
    setCanCreate(checkPermission(checkUrl));
  }
  const refreshAgentData =()=>{
    getAgentDetailEvent();
  }
  const changeTabEvent = (key)=>{
    setCurrentTab(key);
  }
  // ========== 其他功能 ==========
  /**
   * 返回事件
   * 返回应用列表页面
   */
  const backEvent = () => {
    agentConfigRef.current?.closeChatEvent();
    if(fromPage=='integrated'){//
      router.push('/main/application/manage/integrated');
      return;
    }
    const unReleasedPath = "/main/application/manage/unreleased";
    const releasedPath = "/main/application/manage/released";
    if (agentInfo.status === 0) {
      router.push(unReleasedPath);
    } else {
      router.push(releasedPath);
    }
  };

  /**
   * 发布事件
   * 打开发布弹窗
   */
  const publishEvent = () => {
    if (!agentInfo.modelId) {
      message.warning("请配置模型!");
      return;
    }
    if (publishRef.current) {
      publishRef.current.showModal(agentInfo, "agent",lastPublishTimeDesc);
    }
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
    changeTabEvent("1");
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
    <div className={styles["agent_container"]}>
      {/* 页面头部 */}
      <div className={styles["agent_container_header"]}>
        {/* 左侧：返回按钮和应用信息 */}
        <div className={styles["agent_container_header_left"]}>
          {/* 返回按钮 */}
          <div
            onClick={backEvent}
            className={styles["agent_container_header_left_back"]}
          >
            <img src="/find/back.png" alt="返回" />
          </div>

          {/* 应用标题和图标 */}
          <div className={styles["agent_container_header_title"]}>
            <img
              src={
                process.env.NEXT_PUBLIC_API_BASE + agentInfo?.applicationIconUrl
              }
              alt="icon"
            />
            <div className={styles["agent_container_header_title_text"]}>
              <div className={styles["agent_container_header_title_text_top"]}>
                <Text
                  style={{ maxWidth: 210 }}
                  ellipsis={{ tooltip: agentInfo.applicationName }}
                >
                  <span
                    className={styles["agent_container_header_title_text_name"]}
                  >
                    {agentInfo.applicationName}
                  </span>
                </Text>
              </div>
              <div className={styles["agent_container_header_title_text_desc"]}>
                智能体
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：发布按钮 */}
        <div className={styles["agent_container_header_right"]}>
          {currentTab === "0" && (
          <div className={styles["agent_container_header_right_action"]}>
            <Button
              type="primary"
              disabled={!canCreate}
              className={styles["agent_container_right_header_model_btn"]}
              onClick={publishEvent}
            >
              <img
                className={styles["action_img"]}
                src="/application/publish.png"
                alt="发布"
              />
             {publishText}
            </Button>
          </div>
          )}
          {currentTab === "1" && (
          <div className={styles["workflow_page_header_right_api"]}>
            <div
              className={styles["workflow_page_header_right_api_btn"]}
              onClick={apiKeyClickEvent}
            >
              <img src="/common/key.png" alt="API密钥" />API密钥
            </div>
          </div>
          )}
        </div>

        <div className={styles["workflow_page_header_right_center"]}>
          {tabList.map((item) => (
            <div
              key={item.key}
              className={`${styles["tab_item"]} ${
                currentTab == item.key ? styles["tab_item_active"] : ""
              }`}
              onClick={()=>changeTabEvent(item.key)}
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
      <div className={styles["agent_container_content"]}>
        {currentTab==0&&(
        <AgentConfig  ref ={agentConfigRef} refreshAgentData ={refreshAgentData} />
      )}
      {currentTab==1&&(
        <ApiDocument agentInfo={agentInfo}  />
      )}
      </div>

      {/* 发布弹框 */}
      <PublishModel canCreate={canCreate} ref={publishRef} openApiDocumentEvent={handleApiDocumentEvent} openApiDocumentEventAndOpenApiKeyModal={handleApiDocumentEventAndOpenApiKeyModal} closeCallback={getApplicationPublishTimeDescEvent} />
      {/* API密钥弹窗组件 */}
      <ApiKey ref={apiKeyRef} canCreate={canCreate} />
    </div>
  );
}
