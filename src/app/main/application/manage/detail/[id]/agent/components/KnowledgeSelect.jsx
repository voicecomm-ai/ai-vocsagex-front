"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip } from "antd";
import styles from "../page.module.css";
import { getKnowledgeBaseList } from "@/api/knowledge";
import { addKnowledgeToAgent } from "@/api/agent";
const KnowledgeSelect = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  useImperativeHandle(ref, () => ({
    showModal,
  }));
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [selectData, setSelectData] = useState([]);
  const [agentInfo, setAgentInfo] = useState([]);

  const classNames = {
    content: styles["my-modal-content"],
  };

  //展示模态框
  const showModal = (obj, data) => {
    setAgentInfo(obj);
    setOpen(true);
    getAllKnowledgeList();
    setSelectData(data);
  };

  useEffect(() => {
    getAllKnowledgeList();
  }, []);
  //获取所有知识库列表
  const getAllKnowledgeList = () => {
    let data = {
      name: "",
      tagIds: [],
    };
    getKnowledgeBaseList(data)
      .then((res) => {
        let arr = res.data.filter((item) => item.isEmpty === false);
        arr.forEach((item) => {
          let tagText = item.tags
            ? item.tags.map((tag) => tag.name).join(",")
            : "";
          item.tagText = tagText;
        });
        setKnowledgeList(arr);
      })
      .catch((err) => {});
  };

  //模态框关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
  };
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
      knowledgeBaseIds: addIds,
      applicationId: agentInfo.applicationId,
    };
    setLoading(true);
    addKnowledgeToAgent(addObj)
      .then((res) => {
        setLoading(false);
        setOpen(false);
        props.updateKnowledgeList();
      })
      .catch((err) => {});
  };

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
          选择引用知识库
        </div>
        <div className={styles["knowledge_select_container_content"]}>
          {knowledgeList.map((item, index) => (
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
                className={styles["knowledge_select_item_img"]}
                src="/agent/knowledge.png"
              />

              <div className={styles["knowledge_select_item_content"]}>
                <Text
                  style={{ maxWidth: 240 }}
                  ellipsis={{ tooltip: item.name }}
                >
                  {item.name}
                </Text>
              </div>
              {item.tagText && (
                <Tooltip title={item.tagText}>
                  <div className={styles["knowledge_select_item_tag"]}>
                    <div className={styles["knowledge_select_item_tag_first"]}>
                      <Text   className={styles["knowledge_select_item_tag_other"]} style={{ maxWidth: 80 }} ellipsis={true}>
                        {item.tags[0].name}
                      </Text>
                    </div>
                    {item.tags.length > 1 && (
                      <div
                        className={styles["knowledge_select_item_tag_other"]}
                      >
                        ,+{item.tags.length - 1}{" "}
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
            <span>{selectData.length}</span>个知识库
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
