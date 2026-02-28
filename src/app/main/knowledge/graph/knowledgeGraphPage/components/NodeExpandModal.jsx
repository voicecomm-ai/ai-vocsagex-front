import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  InputNumber,
  Radio,
  Checkbox,
  Tag,
  Divider,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Draggable from "react-draggable";
import { debounce } from "lodash-es";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import { standardGraphData } from "@/utils/graph/graph";
import { getEdgeListApi, expansionNodeApi } from "@/api/graphVisualization";

// 主模态框组件
const NodeExpandModal = ({
  visible,
  selectedNode,
  onVisibleChange,
  onImportGraph,
  modalPosition,
  onSelectedNodeChange,
  // onDone,
}) => {
  const { currentNamespaceId } = useStore((state) => state);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [edgeOptions, setEdgeOptions] = useState([]);
  const [checkedAll, setCheckedAll] = useState(false);
  const selectedTypes = Form.useWatch("edgeNameList", form);
  const [indeterminate, setIndeterminate] = useState(false);
  const [mark, setMark] = useState(0);

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

  // 拓展方向选项
  const expandDirectionOptions = [
    { label: "流入", value: 0 },
    { label: "流出", value: 1 },
    { label: "双向", value: 2 },
  ];

  useEffect(() => {
    if (visible) {
      // 获取边信息
      fetchEdgeList();
      // 初始化表单
      form.setFieldsValue({
        direction: 0,
        stepNumber: 1,
        edgeNameList: [],
      });
    } else {
      form.resetFields();
      setCheckedAll(false);
    }
  }, [visible, form]);

  useEffect(() => {
    if (selectedTypes && edgeOptions.length > 0) {
      setIndeterminate(
        selectedTypes.length > 0 && selectedTypes.length < edgeOptions.length
      );
      setCheckedAll(selectedTypes.length === edgeOptions.length);
    } else {
      setIndeterminate(false);
    }
  }, [selectedTypes, edgeOptions.length]);

  // 获取拓展边列表
  const fetchEdgeList = async () => {
    try {
      setEdgeLoading(true);
      const { data: resData } = await getEdgeListApi({
        spaceId: currentNamespaceId,
      });
      setEdgeOptions(resData.map((item) => ({ label: item, value: item })));
    } catch (error) {
      console.error("获取边列表失败:", error);
      message.error("获取边列表失败");
    } finally {
      setEdgeLoading(false);
    }
  };

  // 处理全选/取消全选
  const handleCheckAll = (e) => {
    const checked = e.target.checked;
    setCheckedAll(checked);
    if (checked) {
      form.setFieldsValue({
        edgeNameList: edgeOptions.map((item) => item.value),
      });
    } else {
      form.setFieldsValue({ edgeNameList: [] });
    }
  };

  // 删除选中的节点
  const handleTagClose = (item, index) => {
    item.unselect?.();
    const newSelectedNode = selectedNode.filter((_, i) => i !== index);
    onSelectedNodeChange(newSelectedNode);
  };

  // 更新可见状态
  const updateVisible = (value) => {
    onVisibleChange && onVisibleChange(value);
  };

  useEffect(() => {
    setMark((prev) => prev + 1);
    if (mark > 0) {
      form.validateFields(["vertexInfoVOList"]);
    }
  }, [selectedNode]);

  // 保存
  const save = async () => {
    try {
      // 表单验证
      await form.validateFields();

      if (selectedNode.length === 0) {
        message.error("请选择要拓展的节点");
        return;
      }

      setLoading(true);

      const formValues = form.getFieldsValue();
      const params = {
        spaceId: currentNamespaceId,
        direction: formValues.direction,
        stepNumber: formValues.stepNumber,
        edgeNameList: formValues.edgeNameList,
        vertexInfoVOList: selectedNode.map(
          (item) => item.data?.("id") || item.id
        ),
      };

      const { data: result } = await expansionNodeApi(params);

      if (result.vertexVOList.length) {
        const nodesAndEdges = standardGraphData(result);
        onImportGraph && onImportGraph(nodesAndEdges);
        // message.success("节点拓展成功");
      } else {
        const nodeNames = selectedNode
          .map((item) => item.data?.("name") || item.name)
          .join("/");
        message.warning(`${nodeNames}暂无可拓展数据`);
      }

      setLoading(false);
      updateVisible(false);
      // onDone && onDone();
    } catch (error) {
      console.error("节点拓展失败:", error);
      setLoading(false);
      // if (error.message !== "Cancel") {
      //   message.error("节点拓展失败");
      // }
    }
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
      <span>节点拓展</span>
    </div>
  );

  const footerContent = (
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
      padding: "24px",
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

  // 自定义下拉渲染
  const popupRender = (menu) => (
    <div onMouseDown={(e) => e.preventDefault()}>
      {menu}
      <Divider style={{ margin: "4px 0" }} />
      <div style={{ padding: "5px 12px" }}>
        <Checkbox
          checked={checkedAll}
          indeterminate={indeterminate}
          onChange={handleCheckAll}
        >
          全部
        </Checkbox>
      </div>
    </div>
  );

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
      <div style={{ minHeight: "250px" }}>
        {/* <div className={styles["select-wrapper"]}>表单内容</div> */}
        <Form
          form={form}
          layout="vertical"
          validateMessages={{
            required: "${label}为必填项",
          }}
        >
          {/* 已选节点展示 */}
          <Form.Item
            label={
              <span>
                已选节点{" "}
                <span style={{ color: "#4070fd" }}>{selectedNode.length}</span>
              </span>
            }
            name="vertexInfoVOList"
            required
            rules={[
              {
                validator: (_, value) => {
                  if (selectedNode.length === 0) {
                    return Promise.reject("请选择要拓展的节点");
                  }
                  return Promise.resolve();
                },
              },
            ]}
            validateTrigger={["onChange"]}
          >
            <div className={styles["selected-node-wrapper"]}>
              {selectedNode.length > 0 ? (
                <div className={styles["tag-list"]}>
                  {selectedNode.map((item, index) => {
                    const nodeName =
                      item.data?.("name") || item.name || "未知节点";
                    const nodeColor = item.data?.("color") || "#1890ff";
                    return (
                      <Tag
                        className={styles["tag-wrapper"]}
                        key={index}
                        closable
                        onClose={() => handleTagClose(item, index)}
                        style={{ display: "flex" }}
                      >
                        <span className={styles["tag-inner"]}>
                          <span
                            className={styles["node-color"]}
                            style={{
                              backgroundColor: nodeColor,
                            }}
                          ></span>
                          <span
                            className={styles["node-text"]}
                            title={nodeName}
                          >
                            {nodeName}
                          </span>
                        </span>
                      </Tag>
                    );
                  })}
                </div>
              ) : (
                <div className={styles["empty-tip"]}>
                  请在图谱界面上选择节点（按住Shift键可多选）
                </div>
              )}
            </div>
          </Form.Item>

          {/* 拓展边选择 */}
          <Form.Item
            label="选择拓展边"
            name="edgeNameList"
            rules={[{ required: true, message: "请选择拓展边" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择拓展边"
              loading={edgeLoading}
              maxTagCount="responsive"
              popupRender={popupRender}
              style={{ width: "100%" }}
              className={styles["edge-select"]}
              menuItemSelectedIcon={null}
            >
              {edgeOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Checkbox
                      checked={selectedTypes.includes(option.value)}
                      style={{ marginRight: 8 }}
                    />
                    {option.label}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 拓展方向 */}
          <Form.Item label="拓展方向" name="direction" initialValue={0}>
            <Radio.Group options={expandDirectionOptions} />
          </Form.Item>

          {/* 拓展步数 */}
          <Form.Item label="拓展步数" name="stepNumber" initialValue={1}>
            <InputNumber
              min={1}
              max={5}
              style={{ width: "30%" }}
              controls={{ addIcon: "+", subtractIcon: "-" }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default NodeExpandModal;
