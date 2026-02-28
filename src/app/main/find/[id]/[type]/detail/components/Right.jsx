"use client";
import React, { useState, useEffect,  forwardRef,useImperativeHandle,useRef } from "react";
import styles from "../detail.module.css";
import { Typography, Button, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import ReuseModel from "../../../../../../components/CreateModal/ReuseModel";
const applicationTypeMap = {
  agent: "智能体",
  workflow: "工作流",
  agent_arrangement: "智能体编排",
};
const DetailRight = forwardRef((props, ref) => {
  const { Text } = Typography;
  const { applicationInfo,tagList } = props;
  const reuseModelRef = useRef(null); //复用模态框引用
  const handleClose = () => {
  props.showRightEvent(false);
  };

  const handleCopyEvent = () => {//复用事件
    let obj = {
      name: applicationInfo.applicationName,
      description: applicationInfo.applicationDescription || applicationInfo.description,
      appId: applicationInfo.app_id || applicationInfo.applicationId,
      type: props.type,
    }
    console.log(obj, "obj");
    reuseModelRef.current.showModal(obj);
  };

  useImperativeHandle(ref, () => ({

  }));

  return (
    <div className={styles["detail_right"]}>
      <div className={styles["detail_right_header"]}>
        <div className={styles["detail_right_header_left"]}>应用详情</div>
        <div className={styles["detail_right_header_right"]}>
          <img src="/find/find_close.png" alt="close" onClick={handleClose} />
        </div>
      </div>
      <div className={styles["detail_right_icon"]}>
        <img
          src={process.env.NEXT_PUBLIC_API_BASE + applicationInfo.applicationIconUrl}
          alt="icon"
        />
      </div>
      <div className={styles["detail_right_name"]}>
       <Text ellipsis={{ tooltip: applicationInfo.applicationName }} style={{ maxWidth: 350 }}>
     <span className={styles["detail_right_name_text"]}> {applicationInfo.applicationName}</span>   
       </Text>
      </div>
      <div className={styles["detail_right_type"]}>
        <div className={styles["detail_container_header_title_type"]}>
          {applicationInfo.agentType == "multiple" ? "多智能体合作" : applicationTypeMap[props.type]}
        </div>
      </div>
      <div className={styles["detail_right_desc"]}>
        {applicationInfo.applicationDescription}
      </div>
      <div className={styles["detail_right_tag"]}>
        {tagList.map((item) => (
          <div key={item.id} className={styles["detail_right_tag_item"]}>
            <Text style={{ maxWidth: 117 }} ellipsis={{ tooltip: item.name }}>
              <span className={styles["detail_right_tag_item_text"]}>
                {item.name}
              </span>
            </Text>
          </div>
        ))}
      </div>
      <div className={styles["detail_right_btn"]}>
        <Button
          className={styles["detail_right_btn_copy"]}
          type="primary"
          onClick={handleCopyEvent}
        >
          <img src="/find/copy.png" alt="copy" />
          复用
        </Button>
      </div>
      <div className={styles["detail_right_user_title"]}>
        发布信息
      </div>
      <div className={styles["detail_right_user_content"]}>
        <div>发布人：</div>
          <div className={styles["detail_right_user_content_user"]}>
            <Avatar
              size={16}
              className={styles.detail_right_user_icon}
             src={'/avatar.png'}
              alt="用户"
            />
            <div className={styles["detail_right_user_content_user_text"]}>
           {applicationInfo.createUsername}
           </div> 
          </div>
      </div>
      <ReuseModel ref={reuseModelRef} />
    </div>
  );
});

export default DetailRight;
