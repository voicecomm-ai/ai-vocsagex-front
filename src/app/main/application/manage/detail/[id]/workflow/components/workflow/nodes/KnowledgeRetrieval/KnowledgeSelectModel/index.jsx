"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { Modal, Button, Typography, Tooltip } from "antd";
import { useStore } from "@/store/index";
import styles from "../../../../../../agent/page.module.css";
import { getKnowledgeBaseList } from "@/api/knowledge";
import { addKnowledgeToAgent } from "@/api/agent";

const KnowledgeSelectModel = forwardRef((props, ref) => {
  
  const { Paragraph, Text } = Typography;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const knowledgeType={
    FULL_TEXT:'全文检索',
    HYBRID:"混合检索",
    VECTOR:"向量检索",
  }
  useImperativeHandle(ref, () => ({
    showModal,
    deleteSelectClickEvent
  }));
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [selectData, setSelectData] = useState([]);
  const [selectDataCopy, setSelectDataCopy] = useState([]);

  const classNames = {
    content: styles["my-modal-content"],
  };

  //展示模态框
  const showModal = (data) => {
    console.log(data,'data');
    setOpen(true);
    setLoading(true);
   // deleteSelectClickEvent()
    getAllKnowledgeList();
    setSelectData(data);
    setSelectDataCopy(data);
  };

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
      setLoading(false);  
    })
    .catch((err) => {
      setLoading(false);
    });
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

  const deleteSelectClickEvent = (item) => {
    let arr = JSON.parse(JSON.stringify(selectData));
    let findIndex = arr.findIndex((data) => data.id === item.id);
    if (findIndex == -1) {
      arr.push(item);
    } else {
      arr.splice(findIndex, 1);
    }
    setSelectData(arr);
  };


  const sortByOriginalOrder = (originalArray, modifiedArray) => {
    // 创建原始数组元素id到索引的映射，统一id为字符串类型以避免类型问题
    const idOrderMap = new Map();
    originalArray.forEach((item, index) => {
        const unifiedId = String(item.id);
        idOrderMap.set(unifiedId, index);
    });
    
    // 为修改后的数组元素添加原始索引，用于稳定排序新增元素
    const arrayWithIndices = modifiedArray.map((item, index) => ({
        ...item,
        _originalIndex: index
    }));
    
    // 排序逻辑
    arrayWithIndices.sort((a, b) => {
        const aId = String(a.id);
        const bId = String(b.id);
        
        // 两个元素都在原始数组中，按原始顺序排序
        if (idOrderMap.has(aId) && idOrderMap.has(bId)) {
            return idOrderMap.get(aId) - idOrderMap.get(bId);
        }
        
        // 只有a在原始数组中，a排在前面
        if (idOrderMap.has(aId)) {
            return -1;
        }
        
        // 只有b在原始数组中，b排在前面
        if (idOrderMap.has(bId)) {
            return 1;
        }
        
        // 两个元素都不在原始数组中，按它们在modifiedArray中的原始顺序排序
        return a._originalIndex - b._originalIndex;
    });
    
    // 移除临时添加的索引属性
    return arrayWithIndices.map(({ _originalIndex, ...item }) => item);
}

 
  

  //保存点击
  const saveEvent = () => {
    let setArr = sortByOriginalOrder(selectDataCopy, selectData);
    props.setSelDatabaseFunc(setArr)
    setOpen(false);
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
      zIndex={100000}
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

export default KnowledgeSelectModel;
