import React, { useState, useEffect, useRef, useMemo } from "react";
import { Modal, Form } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Draggable from "react-draggable";
import { debounce } from "lodash-es";
import styles from "../page.module.css";
import NodeTab from "./NodeTab";
import {
  isUrl,
  getURLFileName,
  getFileType,
  FILE_TYPES,
} from "@/utils/fileValidation";
import FilePreview from "@/app/components/knowledge/PreviewPC";

// 主模态框组件
const NodeDetailModal = ({ visible, nodeDetailInfo, modalPosition }) => {
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState(0);
  const [tagTabList, setTagTabList] = useState([]);

  // 拖拽相关状态
  const [disabled, setDisabled] = useState(false);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef(null);

  const onStart = (_event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  const titleContent = (
    <div className={styles["move-header"]}>
      <div className={styles["move-title"]}>
        {nodeDetailInfo.vertexName}
        <div className={styles["node-id-content"]}>
          ID：
          {nodeDetailInfo.vertexId
            ? nodeDetailInfo.vertexId.toString().slice(-10)
            : "--"}
        </div>
      </div>
    </div>
  );

  const modalStyles = {
    body: {
      background: "#212f4f",
      overflow: "hidden",
      borderRadius: "0 0 10px 10px",
    },
    content: {
      padding: 0,
      boxShadow: "0px 0px 20px 0px rgba(18, 30, 58, 0.6)",
    },
    header: {
      background: "#212f4f",
      borderBottom: "1px solid rgba(255, 255, 255, 0.16)",
      marginBottom: 0,
    },
    mask: {
      pointerEvents: "none", // 禁用遮罩层的交互，允许下层内容被操作
      backgroundColor: "rgba(0, 0, 0, 0)", // 使遮罩层完全透明
    },
  };

  useEffect(() => {
    if (visible && nodeDetailInfo?.tagName) {
      const tagTabList = nodeDetailInfo.tagName.map((item) => item.tagName);
      setTagTabList(tagTabList);
      setCurrentTag(0);
    } else {
      setTagTabList([]);
      setCurrentTag(0);
    }
  }, [visible, nodeDetailInfo]);

  const currentTagProperties = useMemo(() => {
    return nodeDetailInfo?.tagName?.[currentTag]?.vertexPropertiesVOS || [];
  }, [nodeDetailInfo, currentTag]);

  return (
    <Modal
      width={600}
      title={titleContent}
      footer={null}
      open={visible}
      confirmLoading={loading}
      destroyOnHidden
      closable={false}
      maskClosable={false}
      mask={false}
      modalRender={(modal) => (
        <Draggable
          disabled={disabled}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}
        >
          <div
            ref={draggleRef}
            style={{
              position: "relative",
              zIndex: 1000,
              left: `${modalPosition.right - 1260}px`,
              top: `${modalPosition.top - 44}px`,
            }}
          >
            {modal}
          </div>
        </Draggable>
      )}
      wrapClassName={styles["modal-no-mask"]}
      styles={modalStyles}
      getContainer={false}
    >
      <div style={{ display: "flex", pointerEvents: "auto" }}>
        <div ref={useRef(null)} className={styles["move-wrapper"]}>
          <div className={styles["node-tab-wrapper"]}>
            <NodeTab
              tagTabList={tagTabList}
              currentTag={currentTag}
              onUpdateCurrentTag={setCurrentTag}
            />
          </div>
          {/* className={styles['detailForm']} */}
          <div style={{ paddingBottom: "10px" }}>
            <div className={styles["move-body"]}>
              <Form className={styles["detailForm"]} layout="horizontal">
                {nodeDetailInfo.tagName[currentTag].vertexPropertiesVOS.map(
                  (item, index) => (
                    <Form.Item key={index} label={item.propertyName}>
                      {item.propertyValue ? (
                        isUrl(item.propertyValue) ? (
                          <FilePreview
                            record={{
                              propertyType: item.propertyType,
                              defaultValueAsString: item.propertyValue,
                              extra: item.extra,
                              fileUrl: item.propertyValue,
                            }}
                            textAlign={"left"}
                          />
                        ) : (
                          item.propertyValue
                        )
                      ) : (
                        "--"
                      )}
                    </Form.Item>
                  )
                )}
              </Form>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NodeDetailModal;
