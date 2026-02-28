'use client'
import React, { useState, useEffect, useRef, forwardRef } from "react";

import { Form, Input, Select, Button, message } from "antd";
import AgentChat from "@/app/components/agent/Chat";
import styles from "../../detail.module.css";
import { getFindAgentVariableList } from "@/api/find";


const AgentDetailIndex = forwardRef((props, ref) => {  
  const chatRef = useRef(null);
  const { showRight } = props;
  const [variableList, setVariableList] = useState([]);

  // 获取变量列表
  useEffect(() => {
    const fetchVariableList = async () => {
      let agentType = props.applicationInfo.agentType || 'single';
      let variableArray = [];
      
      if (agentType === 'multiple' && props.applicationInfo.applicationId) {
        try {
          const res = await getFindAgentVariableList(props.applicationInfo.applicationId);
          let data = res.data || [];
          data.forEach(item => {
            let variableLists = item.variableList || [];
            variableLists.forEach(variable => {
              // 为子智能体变量添加应用ID前缀，避免变量名冲突
              variable.nameText = variable.name;
              variable.name = variable.applicationId + '.' + variable.name;
              variableArray.push(variable);
            });
          });
        } catch (error) {
          console.error("获取智能体变量列表失败:", error);
        }
      } else {
        variableArray = props.applicationInfo.variableList || [];
      }
      
      setVariableList(variableArray);
    };

    fetchVariableList();
  }, [props.applicationInfo]);

  const tipClickEvent = () => {
    props?.tipClickEvent();
  }
  
  return (
    <div className={styles.agent_detail_index}>
      <AgentChat ref={chatRef} applicationInfo={props.applicationInfo} type={'experience'} variableList={variableList} tipClickEvent={tipClickEvent} showRight={showRight} />
    </div>
  );
});

export default AgentDetailIndex;