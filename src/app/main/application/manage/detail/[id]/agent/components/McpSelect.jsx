"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip,Input} from "antd";
import styles from "../page.module.css";
import { getMcpListNoPage } from "@/api/mcp";
import { batchAddMcpToAgent } from "@/api/agent";
import {SearchOutlined} from '@ant-design/icons'
const KnowledgeSelect = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [mcpList, setMcpList] = useState([]);
  const [selectData, setSelectData] = useState([]);
  const [agentInfo, setAgentInfo] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const classNames = {
    content: styles["my-modal-content"],
  };

  //展示模态框
  const showModal = (obj, data) => {
    setAgentInfo(obj);
    setOpen(true);
 
    setSelectData(data);
    setSearchKeyword("");
    getAllMcpList('', 'time');
  };

  //获取所有知识库列表
  const getAllMcpList = (name,type) => {
   console.log(name,type)
   console.log(searchKeyword)
    let data = {
      displayName:type=='time'? name:searchKeyword,
      isShelf:true
    };
    getMcpListNoPage(data)
      .then((res) => {
        let arr =res.data;
        arr.forEach((item) => {
          let tagText = item.tagList
            ? item.tagList.map((tag) => tag.name).join(",")
            : "";
          item.tagText = tagText;
        });
        setMcpList(arr);
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

    setSelectData(arr);
  };
  //保存点击
  const saveEvent = () => {
    // 获取 selectData 中所有对象的 id
    let addIds = selectData.map((item) => item.id);
    let addObj = {
      mcpIds: addIds,
      applicationId: agentInfo.applicationId,
    };
    setLoading(true);
    batchAddMcpToAgent(addObj)
      .then((res) => {
        setLoading(false);
        setOpen(false);
        props.refreshMcpList();
      })
      .catch((err) => {});
  };
 
  //搜索事件
  const searchEvent=()=>{
getAllMcpList();
  }
  const searchChangeEvent=(e)=>{
    setSearchKeyword(e.target.value);
 getAllMcpList(e.target.value,'time');
  }
  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="465px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      zIndex={10000}
      centered
    >
      <div className={styles["knowledge_select_container"]}>
        <div className={styles["knowledge_select_container_header"]}>
          选择MCP服务
        </div>
         <div className={styles["knowledge_select_container_input"]}>

    
           <Input
           className={styles["knowledge_select_container_search"]}
            placeholder="搜索MCP名称,不超过50个字"
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
        <div className={styles["knowledge_select_container_content"]}>
          {mcpList.map((item, index) => (
            <div
              className={`${styles["knowledge_select_item"]} ${
                selectData.some((data) => data.id === item.id)
                  ? styles["knowledge_active"]
                  : ""
              }`}
              key={index}
              onClick={() => selectClickEvent(item)}
            >
              <img
                className={styles["mcp_select_item_img"]}
                src={process.env.NEXT_PUBLIC_API_BASE+item.mcpIconUrl}
              />

              <div className={styles["knowledge_select_item_content"]}>
                <Text
                  style={{ maxWidth: 240 }}
                  ellipsis={{ tooltip: item.displayName }}
                >
                  {item.displayName}
                </Text>
              </div>
              {item.tagText && (
                <Tooltip title={item.tagText}>
                  <div className={styles["knowledge_select_item_tag"]}>
                    <div className={styles["knowledge_select_item_tag_first"]}>
                      <Text   className={styles["knowledge_select_item_tag_other"]} style={{ maxWidth: 80 }} ellipsis={true}>
                        {item.tagList[0].name}
                      </Text>
                    </div>
                    {item.tagList.length > 1 && (
                      <div
                        className={styles["knowledge_select_item_tag_other"]}
                      >
                        ,+{item.tagList.length - 1}{" "}
                      </div>
                    )}
                  </div>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
        <div className={styles["knowledge_select_container_footer"]}>
          <div className={styles["knowledge_select_container_footer_num"]}>
            <img src="/agent/knowledge_select.png" /> 已选中
            <span>{selectData.length}</span>个MCP
          </div>
          <div className={styles["knowledge_select_container_footer_btn"]}>
            <Button
              className={styles["knowledge_cancel"]}
              onClick={modelCancelEvent}
            >
              取消
            </Button>
            <Button
              loading={loading}
              className={styles["knowledge_save"]}
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

export default KnowledgeSelect;
