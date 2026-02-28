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
  Row,
  Col,
  Spin,
  AutoComplete,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
// import { useDrag } from "@use-gesture/react";
// import { useSpring, animated } from "@react-spring/web";
import Draggable from "react-draggable";
import { debounce } from "lodash-es";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import {
  selectVertexInfoApi,
  setCenterNodeApi,
  getCenterNodeApi,
} from "@/api/graphVisualization";

// 主模态框组件
const NodeCenterModal = ({
  visible,
  onVisibleChange,
  modalPosition,
  // onDone,
}) => {
  const { currentNamespaceId } = useStore((state) => state);

  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false); // 是否是编辑状态
  const [lastSelectedValue, setLastSelectedValue] = useState(null); // 真正存储选中数据的状态
  const [displayValue, setDisplayValue] = useState(""); // 输入框显示的值（存历史）
  const [searchValue, setSearchValue] = useState(""); // 搜索框输入值
  const [options, setOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [lastFetchId, setLastFetchId] = useState(0);

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

  useEffect(() => {
    if (visible && modalPosition) {
      getDetail();
    } else {
      setSearchValue("");
      setDisplayValue("");
      setLastSelectedValue(null);
      setOptions([]);
    }
  }, [visible, modalPosition]);

  const handleInputFocus = () => {
    if (lastSelectedValue) {
      setDisplayValue(""); // 输入框展示为空
      setSearchValue(""); // 搜索值也清空，避免影响搜索
    }
  };

  const handleInputBlur = () => {
    if (!displayValue && lastSelectedValue) {
      setDisplayValue(
        lastSelectedValue.originName || lastSelectedValue.vertexName || ""
      );
    }
  };

  const vertexLabel = (name, tags, highlightText = "") => {
    const renderHighlightedName = () => {
      if (!highlightText) {
        return (
          <span className={styles["lable-name"]} title={name}>
            {name}
          </span>
        );
      }

      // 转义特殊字符并创建正则表达式
      const escapedHighlightText = highlightText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const highlightRegex = new RegExp(`(${escapedHighlightText})`, "gi");

      // 分割字符串
      const parts = name.split(highlightRegex).filter((part) => part);

      return (
        <span className={styles["lable-name"]} title={name}>
          {parts.map((part, index) => {
            // 检查是否匹配（忽略大小写）
            if (part.toLowerCase() === highlightText.toLowerCase()) {
              return (
                <span key={index} style={{ color: "#4775fd" }}>
                  {part}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    };

    const remark = tags.join(",");
    return (
      <div className={styles["lable-wrapper-test"]} alt={name}>
        {renderHighlightedName()}
        <span className={styles["lable-remark"]} title={remark}>
          {remark}
        </span>
      </div>
    );
  };

  // 获取详情
  const getDetail = async () => {
    await getCenterNodeApi({ spaceId: currentNamespaceId })
      .then(({ data }) => {
        if (data.vertexId) {
          const selectedData = {
            vertexId: data.vertexId,
            vertexName: data.vertexName,
            originName: data.vertexName,
          };
          setDisplayValue(data.vertexName);
          setIsUpdate(true);
          setLastSelectedValue(selectedData);
        }
      })
      .catch(() => {
        message.error("获取中心节点失败");
        setIsUpdate(false);
        setLastSelectedValue(null);
        setSearchValue("");
        setDisplayValue("");
      });
  };

  // 更新可见状态
  const updateVisible = (value) => {
    onVisibleChange && onVisibleChange(value);
  };

  // 保存
  const save = async () => {
    try {
      const finalValue = lastSelectedValue;

      setLoading(true);

      let params = {
        vertexId: "",
        vertexName: "",
        spaceId: currentNamespaceId,
      };
      if (finalValue) {
        params = {
          vertexId: finalValue.vertexId,
          vertexName: finalValue.vertexName || finalValue.originName,
          spaceId: currentNamespaceId,
        };
      }

      if (isUpdate) {
        params = {
          type: 0,
          ...params,
        };
      }

      await setCenterNodeApi(params);
      setLoading(false);
      message.success("中心节点设置成功");
      updateVisible(false);
      // onDone && onDone();
    } catch (error) {
      setLoading(false);
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
      <span>设置中心节点</span>
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
        {/* {isUpdate ? "修改" : "确定"} */}
        确定
      </Button>
    </>
  );

  const modalStyles = {
    body: {
      padding: "24px",
      background: "#f9fafd",
      overflow: "hidden",
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

  // 防抖处理搜索请求
  const debouncedFetch = useRef(
    debounce(async (value, currentQueryType) => {
      // 过滤非法字符
      const filteredValue = value.replace(
        /[^A-Za-z0-9\u4e00-\u9fa5--_""“”'‘()（），,、’【】\[\]\.\/\s]/g,
        ""
      );

      // 生成请求标识，防止请求顺序错乱
      setLastFetchId(lastFetchId + 1);
      const fetchId = lastFetchId;
      setFetching(true);

      if (value) {
        try {
          const { data } = await selectVertexInfoApi({
            spaceId: currentNamespaceId,
            vertexName: value,
          });

          if (fetchId !== lastFetchId) return;

          const apiOptions = data.map((node) => {
            const name = node.vertexName;
            const remark = node.vertexTagName.join(",");
            return {
              label: vertexLabel(
                node.vertexName,
                node.vertexTagName,
                filteredValue
              ),
              value: node.vertexId,
              originName: name,
              vertexName: name,
              vertexId: node.vertexId,
            };
          });
          setOptions(apiOptions);
        } catch (error) {
          console.error("搜索失败：", error);
          message.error("搜索出错，请重试");
        } finally {
          fetchId === lastFetchId && setFetching(false);
        }
      }
    }, 300) // 300ms防抖
  ).current;

  // 搜索输入处理
  const handleSearch = (value) => {
    if (value) {
      setSearchValue(value);
      debouncedFetch(value); // 触发防抖请求
    }
  };

  // 选择结果处理
  const handleSelect = async (value, option) => {
    if (!value || !option) return;
    setLastSelectedValue(option); // 存储实际选中数据
    setDisplayValue(option.originName || option.vertexName || ""); // 显示选中的值
    setSearchValue(""); // 清空搜索值
  };

  // 监听查询类型变化：重置搜索状态
  useEffect(() => {
    setSearchValue("");
    // setSelectValue(null);
    setOptions([]);
    setFetching(false);
    debouncedFetch.cancel();
  }, [debouncedFetch]);

  // 组件卸载时清除防抖
  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  // 处理输入框变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setDisplayValue(value);
    setSearchValue(value);
    // 如果输入了内容，触发搜索
    if (value) {
      handleSearch(value);
    } else {
      setOptions([]);
    }
  };

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
      <div style={{ minHeight: "280px" }}>
        <div className={styles["select-wrapper"]}>
          <label className={styles["select-label"]}>选择节点：</label>
          <AutoComplete
            value={displayValue}
            options={options}
            onSearch={handleSearch}
            onSelect={handleSelect}
            allowClear
            style={{ width: "100%" }}
            filterOption={false} // 禁用内置过滤，手动处理搜索逻辑
            getPopupContainer={(trigger) => trigger.parentNode}
            onClear={() => {
              setLastSelectedValue(null); // 清空实际数据
              setDisplayValue(""); // 清空显示值
              setSearchValue("");
              setOptions([]);
            }}
            notFoundContent={fetching ? <Spin size="small" /> : null}
          >
            <Input
              prefix={<SearchOutlined style={{ color: "#999" }} />}
              value={displayValue}
              className={styles["custom-input"]}
              placeholder={
                lastSelectedValue
                  ? lastSelectedValue.originName || "实体名称"
                  : "实体名称"
              }
              onChange={handleInputChange}
              onFocus={handleInputFocus} // 聚焦时清空显示
              onBlur={handleInputBlur}
            />
          </AutoComplete>
        </div>
      </div>
    </Modal>
  );
};

export default NodeCenterModal;
