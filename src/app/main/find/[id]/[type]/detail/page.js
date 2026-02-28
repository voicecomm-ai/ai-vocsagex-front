"use client";

import styles from "./detail.module.css";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { applicationGetById } from "@/api/application";
import { Avatar, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import Image from "next/image";
import DetailRight from './components/Right'; //右侧组件
import AgentDetailIndex from './components/agent/index'; //智能体详情组件
import { getFindAgentDetail, getFindWorkflowDetail } from "@/api/find";
import WorkflowIndex from './components/workflow/index'; //工作流详情组件

/**
 * 应用类型映射
 * 将英文类型映射为中文显示
 */
const applicationTypeMap = {
  agent: "智能体",
  workflow: "工作流",
  agent_arrangement: "智能体编排",
};

/**
 * 详情页面组件
 * 用于展示智能体或工作流的详细信息
 */
export default function DetailPage() {
  const { Paragraph, Text } = Typography;
  const { id, type } = useParams(); // 获取路由参数
  const router = useRouter();
  const [applicationInfo, setApplicationInfo] = useState({}); // 应用信息
  const [showRight, setShowRight] = useState(true); // 是否显示右侧面板
  const [tagList, setTagList] = useState([]); // 标签列表

  /**
   * 返回上一页
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * 初始化函数
   * 根据类型获取不同的详情数据
   */
  const initFunction = () => {
    if (type === 'agent') {
      getFindAgentDetailEvent();
    } else if (type === 'workflow') {
      getFindWorkflowDetailEvent();
    }
  };

  /**
   * 获取智能体详情
   */
  const getFindAgentDetailEvent = () => {
    getFindAgentDetail(id).then((res) => {
      unifiedApplicationInfo(res.data);
    });
  };

  /**
   * 获取工作流详情
   */
  const getFindWorkflowDetailEvent = () => {
    getFindWorkflowDetail(id).then((res) => {
      unifiedApplicationInfo(res.data);
    });
  };

  /**
   * 统一工作流和智能体详情字段
   * 处理不同接口返回的字段差异
   * @param {Object} data - 详情数据
   */
  const unifiedApplicationInfo = (data) => {
    // 统一图标URL字段
    data.applicationIconUrl = data.applicationIconUrl || data.application_icon_url;
    // 统一应用名称字段
    data.applicationName = data.applicationName || data.application_name;
    // 统一标签列表字段
    let tagArr = data.tagList || data.tags;
    // 更新状态
    setApplicationInfo(data);
    setTagList(tagArr?.length > 0 ? tagArr : []);
  };

  /**
   * 设置是否显示右侧面板
   * @param {boolean} show - 是否显示
   */
  const showRightEvent = (show) => {
    setShowRight(show);
  };

  /**
   * 切换右侧面板显示状态
   */
  const tipClickEvent = () => {
    setShowRight(!showRight);
  };

  // 当id变化时，重新初始化数据
  useEffect(() => {
    initFunction();
  }, [id]);

  return (
    <div className={styles["detail_container"]}>
      {/* 页面头部 */}
      <div className={styles["detail_container_header"]}>
        {/* 返回按钮 */}
        <Image
          src="/find/back.png"
          className={styles["detail_container_header_back_icon"]}
          onClick={handleBack}
          alt="返回"
          width={24}
          height={24}
        />
        
        {/* 应用图标 */}
        <img
          src={process.env.NEXT_PUBLIC_API_BASE + applicationInfo?.applicationIconUrl}
          className={styles["detail_container_header_icon"]}
        />
        
        {/* 应用标题和用户信息 */}
        <div className={styles["detail_container_header_title"]}>
          <div className={styles["detail_container_header_title_name"]}>
            <span className={styles["detail_container_header_title_text"]}>
              {applicationInfo.applicationName}
            </span>
            <div className={styles["detail_container_header_title_type"]}>
              {applicationInfo.agentType == "multiple" ? "多智能体合作" : applicationTypeMap[type]}
            </div>
          </div>
          <div className={styles["detail_container_header_title_user"]}>
            <Avatar
              size={16}
              className={styles.detail_right_user_icon}
              src={'/avatar.png'}
              alt="用户"
            />
            <div className={styles["detail_container_header_title_user_text"]}>
              {applicationInfo.createUsername}
            </div>
          </div>
        </div>
      </div>
      
      {/* 页面内容 */}
      <div className={styles["detail_container_content"]}>
        {/* 左侧详情内容 */}
        <div className={styles["detail_container_content_left"]}>
          {/* 智能体详情组件 */}
          {type === 'agent' && (
            <AgentDetailIndex 
              showRight={showRight} 
              applicationInfo={applicationInfo} 
              type={type} 
              tipClickEvent={tipClickEvent} 
            />
          )}
          
          {/* 工作流详情组件 */}
          {type === 'workflow' && (
            <WorkflowIndex 
              applicationInfo={applicationInfo} 
              type={type} 
              tipClickEvent={tipClickEvent} 
            />
          )}
        </div>
        
        {/* 右侧信息面板 */}
        {showRight && (
          <div className={styles["detail_container_content_right"]}>
            <DetailRight 
              applicationInfo={applicationInfo} 
              type={type} 
              showRightEvent={showRightEvent} 
              tagList={tagList} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
