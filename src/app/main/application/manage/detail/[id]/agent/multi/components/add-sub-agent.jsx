"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip, Input,message } from "antd";
import styles from "../page.module.css";
import { getMcpListNoPage } from "@/api/mcp";
import { SearchOutlined } from "@ant-design/icons";
import { getSubPublishedAgentList,addSubAgent } from "@/api/agent";
const SubAgentSelect = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [agentList, setAgentList] = useState([]);
  const [selectData, setSelectData] = useState([]);
  const [internalArray, setInternalArray] = useState([]);//内置数据
  const [agentInfo, setAgentInfo] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const classNames = {
    content: styles["my-modal-content"],
  };

  //展示模态框
  const showModal = (obj, data) => {
    setAgentInfo(obj);
    setOpen(true);
    setSelectAgentList(data);
    setSearchKeyword("");
    getSubAgentListEvent();
  };
  
  
  //设置选中智能体guo列表
  const setSelectAgentList = (data) => {
    let internalData = [];//内置数据
    let externalData = [];//非内置数据
    data.forEach((item) => {
      if(item.isIntegrated){
        internalData.push(item);
      }
      else{
        externalData.push(item);
      }
    });
    setInternalArray(internalData);//内置数据
    setSelectData(externalData);//非内置数据
  }

  //获取所有子智能体列表
  const getSubAgentListEvent = (val,type) => {
    let data = {
      applicationName:type=='search'?val:searchKeyword,//搜索关键词
    };
    getSubPublishedAgentList(data)
      .then((res) => {
        let agentList =[];
        let arr = res.data || [];
        arr.forEach((item) => {
          if(!item.isIntegrated){
           agentList.push(item);
          }
        });
        setAgentList(agentList);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //模态框关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    setSearchKeyword("");
  };
  //选择点击事件
  const selectClickEvent = (item) => {
    let arr = JSON.parse(JSON.stringify(selectData));
    let findIndex = arr.findIndex((data) => data.id === item.id);
    if (findIndex == -1) {
      arr.push(item);
    } else {
      arr.splice(findIndex, 1);
    }
    let internalLength = internalArray.length;
    let addLength = arr.length;
    if(internalLength + addLength <= 10){
       setSelectData(arr);
    }
    else{
      message.warning("智能体已超过10个");
    }
 
  };
  //保存点击
  const saveEvent = () => {
    // 获取 selectData 中所有对象的 id
    let addIds =[];
    let internalIds =internalArray.map((item) => item.applicationId);
   let notINIds = selectData.map((item) => item.applicationId);
     addIds = internalIds.concat(notINIds);
    let addObj = {
      selectedAppIds: addIds,//选中的子智能体id列表
      currentAppId: agentInfo.applicationId,
    };
    setLoading(true);
    addSubAgent(addObj) 
      .then((res) => {
        setLoading(false);
        modelCancelEvent();
        props.refreshSubAgentList();
      })
      .catch((err) => {});
  };

  //搜索事件
  const searchEvent = () => {
    getSubAgentListEvent();
  };
  const searchChangeEvent = (e) => {
    setSearchKeyword(e.target.value);
    getSubAgentListEvent(e.target.value, "search");
  };
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="720px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={10000}
      centered
    >
      <div className={styles["sub_agent_select_container"]}>
        <div className={styles["sub_agent_select_container_header"]}>
          <div className={styles["sub_agent_select_container_header_title"]}>
            添加智能体
          </div>
          <div className={styles["sub_agent_select_container_header_close"]}>
           <img
           src="/close.png"
           alt=""
           onClick={() => modelCancelEvent()}
          />
          </div>
        </div>
        <div className={styles["sub_agent_select_container_input"]}>
          <Input
            className={styles["sub_agent_select_container_search"]}
            placeholder="搜索智能体名称,不超过50个字"
            maxLength={50}
            value={searchKeyword}
            onChange={(e) => searchChangeEvent(e)}
            onPressEnter={() => searchEvent()}
            suffix={
              <SearchOutlined
                style={{ cursor: "pointer" }}
                onClick={() => searchEvent()}
              />
            }
          />
        </div>
        <div className={styles["sub_agent_select_container_content"]}>
          {agentList.map((item, index) => (
            <div
              className={`${styles["sub_agent_select_item"]} ${
                selectData.some((data) => data.id === item.id)
                  ? styles["sub_agent_select_item_active"]
                  : ""
              }`}
              key={index}
              onClick={() => selectClickEvent(item)}
            >
              <img
                className={styles["sub_agent_select_item_img"]}
                src={process.env.NEXT_PUBLIC_API_BASE + item.applicationIconUrl}
              />

              <div className={styles["sub_agent_select_item_content"]}>
                <Text
                  style={{ maxWidth: 240 }}
                  ellipsis={{ tooltip: item.applicationName }}
                >
                  {item.applicationName}
                </Text>
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
          ))}
        </div>
        <div className={styles["sub_agent_select_container_footer"]}>
          <div className={styles["sub_agent_select_container_footer_num"]}>
            <img src="/agent/knowledge_select.png" /> 已选中
            <span>{selectData.length}</span>个智能体
          </div>
          <div className={styles["sub_agent_select_container_footer_btn"]}>
            <Button
              className={styles["sub_agent_cancel"]}
              onClick={modelCancelEvent}
            >
              取消
            </Button>
            <Button
              loading={loading}
              className={styles["sub_agent_save"]}
              onClick={saveEvent}
              type="primary"
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default SubAgentSelect;
