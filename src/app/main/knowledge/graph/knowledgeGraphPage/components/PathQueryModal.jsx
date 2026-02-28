import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useMemo,
  useImperativeHandle,
} from "react";
import { Modal, Form, Button, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Draggable from "react-draggable";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import { standardGraphData } from "@/utils/graph/graph";
import { queryPathApi, expansionNodeApi } from "@/api/graphVisualization";
import PathQueryForm from "./PathQueryForm";
import PathQueryList from "./PathQueryList";
import { ReactSVG } from "react-svg";

// 主模态框组件
const PathQueryModal = ({
  visible,
  onVisibleChange,
  modalPosition,
  currentNode,
  core,
  onUpdateGraph,
}) => {
  const { currentNamespaceId } = useStore((state) => state);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [isQuery, setIsQuery] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [pathList, setPathList] = useState([]);
  const [sourceAndTarget, setSourceAndTarget] = useState({
    source: "",
    target: "",
  });

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

  // 重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setIsQuery(false);
      setSourceAndTarget({ source: "", target: "" });
      setPathList([]);
      form.setFieldsValue({
        endLabel: "",
        startId: "",
        endId: "",
        edgeNameList: [],
        direction: 0,
        queryType: 1,
        stepInterval: 1,
        isChecked: false,
      });
    } else if (currentNode) {
      form.setFieldsValue({
        startLabel: {
          label: currentNode.data?.("name") || currentNode.name,
          value: currentNode.id?.() || currentNode.id,
        },
      });
    }
  }, [visible, currentNode, form]);

  // 更新可见状态
  const updateVisible = (value) => {
    onVisibleChange && onVisibleChange(value);
  };

  // 保存
  const save = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const formValues = form.getFieldsValue();
      console.log(formValues, "formValues");

      const params = {
        spaceId: currentNamespaceId,
        startId: formValues.startLabel?.value,
        endId: formValues.endLabel?.value,
        edgeNameList: formValues.edgeNameList,
        direction: formValues.direction,
        queryType: formValues.queryType,
        stepInterval: formValues.stepInterval,
      };

      const { data: result } = await queryPathApi(params);

      if (result.vertexEdge.length) {
        setPathList(result.routeVOList);
        setSourceAndTarget({
          source: formValues.startLabel?.label || "",
          target: formValues.endLabel?.label || "",
        });

        const elements = standardGraphData({ vertexVOList: result.vertexEdge });
        onUpdateGraph && onUpdateGraph(elements);
        setIsQuery(true);
      } else {
        message.warning("未查询到路径数据");
      }
    } catch (error) {
      console.error("路径查询失败:", error);
      if (error.message !== "Cancel" && error.message) {
        message.error("路径查询失败");
      }
    } finally {
      setLoading(false);
    }
  };

  // 返回查询表单
  const handleBack = () => {
    setIsQuery(false);
  };

  const titleContent = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "move",
        width: "100%",
        touchAction: "none",
        padding: "0px",
      }}
      onMouseOver={() => {
        if (disabled) {
          setDisabled(false);
        }
      }}
      onMouseOut={() => {
        setDisabled(true);
      }}
    >
      <span className={styles["blueBlock"]}></span>
      {!isQuery ? (
        <span>路径查询</span>
      ) : (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>路径列表</span>
          <div className={styles["back-container"]} onClick={handleBack}>
            <ReactSVG
              className={styles["util-icon-svg"]}
              style={{ fontSize: "16px" }}
              src="/knowledge/graph/path_back.svg"
            />
            <span className={styles["back-text"]}>返回</span>
          </div>
        </div>
      )}
    </div>
  );

  const footerContent = !isQuery && (
    <>
      <Button
        className={`${styles.commonBtn} ${styles.cancelBtn}`}
        key="back"
        onClick={() => updateVisible(false)}
      >
        取消
      </Button>
      <Button
        className={`${styles.commonBtn} ${styles.submitBtn}`}
        key="submit"
        loading={loading}
        type="primary"
        onClick={save}
      >
        {isUpdate ? "修改" : "确定"}
      </Button>
    </>
  );

  const modalStyles = {
    body: {
      // padding: "24px",
      background: "#f9fafd",
      // overflow: "hidden",
    },
    content: {
      padding: 0,
    },
    header: {
      margin: 0,
      padding: "20px 32px 20px 0px",
      color: "#121e3a",
      fontWeight: 500,
      fontSize: "20px",
      borderBottom: "1px solid #f0f0f0",
    },
    footer: {
      margin: 0,
      padding: "20px 16px",
      borderTop: "1px solid #f0f0f0",
      textAlign: "center",
    },
    mask: {
      pointerEvents: "none", // 禁用遮罩层的交互，允许下层内容被操作
      backgroundColor: "rgba(0, 0, 0, 0)", // 使遮罩层完全透明
    },
  };

  if (!visible) return null;

  return (
    <Modal
      width={480}
      open={visible}
      confirmLoading={loading}
      destroyOnHidden
      onCancel={() => updateVisible(false)}
      className={styles["parent-modal"]}
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
              left: `${modalPosition.left - 720}px`,
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
      title={titleContent}
      footer={footerContent}
    >
      {!isQuery ? (
        <div className={styles["form-wrapper"]}>
          <PathQueryForm form={form} currentNode={currentNode} />
        </div>
      ) : (
        <PathQueryList
          sourceAndTarget={sourceAndTarget}
          pathList={pathList}
          isQuery={isQuery}
          core={core}
        />
      )}
    </Modal>
  );
};

export default PathQueryModal;
