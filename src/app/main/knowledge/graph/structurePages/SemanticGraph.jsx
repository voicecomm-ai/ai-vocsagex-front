"use client";
import React, {
  useState,
  forwardRef,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Button,
  message,
  Drawer,
  Form,
  Input,
  Checkbox,
  Typography,
  Row,
  Col,
  Popover,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import styles from "./page.module.css";
import { useStore } from "@/store/index";
import {
  getGraphPatternApi,
  updateGraphPatternApi,
  getGraphPatternTagApi,
  getGraphPatternEdgeApi,
} from "@/api/graphVisualization";
import { layout, useCytoscape } from "@/utils/graph/graphConfig";
import { reLayout } from "@/utils/graph/cytoscape";
import NoData from "../components/NoData";
import Tips from "../components/Tips";

const labelName = [
  { name: "属性名称", value: "propertyName", com: "input", span: 6 },
  { name: "数据类型", value: "propertyType", com: "input", span: 5 },
  { name: "附加设置", value: "extra", com: "input", span: 4 },
  { name: "是否必填", value: "tagRequired", com: "checkbox", span: 3 },
  { name: "默认值", value: "defaultValueAsString", com: "input", span: 6 },
];

const extraLabel = {
  text: "文本",
  image: "图片",
  audio: "音频",
  video: "视频",
  otherFile: "其他文件",
};

const SemanticGraph = forwardRef((props, ref) => {
  const { currentNamespaceId, colorTags } = useStore((state) => state);

  const core = useRef(null); // Cytoscape实例
  const graphDom = useRef(null);
  const container = useRef(null);
  const drawer = useRef(null);
  const [showGraph, setShowGraph] = useState(false);
  const [lastTime, setLastTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirst, setIsFirst] = useState(true);
  const [isNodeInfo, setIsNodeInfo] = useState(true);
  const [visible, setVisible] = useState(false);
  const [nodeData, setNodeData] = useState({});

  // 表单
  const [liveList, setLiveList] = useState([]);

  // 拖拽相关状态
  const [drawerPosition, setDrawerPosition] = useState({ right: 20, top: 52 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest(".ant-drawer-header")) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX,
          y: e.clientY,
        });
        e.preventDefault();
      }
    },
    [drawerPosition]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      // 计算鼠标移动的距离
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // 更新位置（右侧定位需要取反）
      const newRight = Math.max(
        20,
        Math.min(drawerPosition.right - deltaX, window.innerWidth - 100)
      );
      const newTop = Math.max(
        0,
        Math.min(drawerPosition.top + deltaY, window.innerHeight - 100)
      );

      setDrawerPosition({
        right: newRight,
        top: newTop,
      });

      // 更新鼠标起始位置
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, drawerPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 更新存活时间列表
  useEffect(() => {
    if (nodeData.ttlCol || nodeData.ttlDuration) {
      setLiveList([
        { ttlCol: nodeData.ttlCol, ttlDuration: nodeData.ttlDuration },
      ]);
    } else {
      setLiveList([{ ttlCol: "", ttlDuration: "0" }]);
    }
  }, [nodeData]);

  // 处理返回的图谱数据
  const processData = (res) => {
    const nodes = res.nodes.map((node, index) => {
      // const colorMap = new Map(
      //   colorTags.map((tag) => [tag.tagName, tag.color])
      // );

      return {
        data: {
          ...node,
          index,
          // color: colorMap.get(node.id),
        },
      };
    });
    const edges = res.edges.map((edge) => ({ data: edge }));
    return { nodes, edges };
  };

  // 获取图谱数据
  const handleGraphData = async () => {
    return await getGraphPatternApi({ spaceId: currentNamespaceId })
      .then(({ data }) => {
        setShowGraph(true);
        setLastTime(data.updatedTime);

        if (core.current) {
          core.current.destroy();
          core.current = null;
        }

        if (!data.nodes.length) {
          setShowGraph(false);
          return;
        }

        const elements = processData(data);

        setTimeout(() => {
          if (graphDom.current) {
            core.current = useCytoscape(elements, graphDom.current, {});
            bindBusinessEvent(core.current);
            reLayout(core.current, layout);
          }
        }, 100);
      })
      .finally(() => {
        setIsFirst(true);
      });
  };

  // 刷新图谱数据
  const handleChange = async () => {
    setLoading(true);
    const result = await updateGraphPatternApi({
      spaceId: currentNamespaceId,
    }).finally(() => {
      setLoading(false);
    });
    if (result) {
      await handleGraphData();
      message.success("视图刷新成功");
    }
  };

  // 打开抽屉---区分首次/非首次
  const openDrawer = (data) => {
    setNodeData(data);

    if (visible) {
      setIsNodeInfo(data.tagName ? true : false);
    } else {
      setVisible(true);
    }

    setIsNodeInfo(data.tagName ? true : false);
  };

  const handleNodeData = (params) => {
    const promise = getGraphPatternTagApi(params);
    promise.then(({ data }) => {
      if (!data.patternProperties && !data.tagName && !data.ttlCol) {
        message.error("暂无本体详细信息");
        setVisible(false);
      } else {
        openDrawer(data);
      }
    });
    return promise;
  };

  const handleEdgeData = (params) => {
    getGraphPatternEdgeApi(params).then(({ data }) => {
      if (!data.patternProperties && !data.tagName && !data.ttlCol) {
        message.error("暂无本体详细信息");
        setVisible(false);
      } else {
        openDrawer(data);
      }
    });
  };

  // 关闭抽屉时重置拖拽位置和首次标记
  const onClose = () => {
    setVisible(false);
    setDrawerPosition({ right: 20, top: 52 });
  };

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setDrawerPosition({ right: 20, top: 52 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const bindBusinessEvent = (coreInstance) => {
    let target = null;

    // 绑定节点点击事件
    coreInstance.on("tap", "node", function (evt) {
      target = evt.target;
      const params = {
        tagName: evt.target.data("id"),
        spaceId: currentNamespaceId,
      };
      handleNodeData(params);
    });

    coreInstance.on("tap", "edge", function (event) {
      target = event.target;
      const params = {
        edgeName: event.target.data("value"),
        spaceId: currentNamespaceId,
      };
      event.target.select();
      handleEdgeData(params);
    });
    // 绑定画布点击事件
    coreInstance.on("tap", function (evt) {
      target = evt.target;
      const evtTarget = evt.target;
      if (evtTarget === coreInstance) {
        onClose();
      }
    });
  };

  useEffect(() => {
    handleGraphData();
    return () => {
      if (core.current) {
        core.current.destroy();
        core.current = null;
      }
    };
  }, [currentNamespaceId]);

  const titleContent = (
    <div
      className={styles["move-header"]}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className={styles["move-title"]}>
        {isNodeInfo ? "本体信息" : "关系信息"}
      </div>
    </div>
  );

  const modalStyles = {
    body: {
      overflow: "auto",
      borderRadius: "0 0 10px 10px",
      height: "calc(100% - 56px)",
      backgroundColor: "#f9fafd",
    },
    content: {
      padding: 0,
      borderRadius: "8px",
      border: "solid 1px #e0e5f2",
    },
    header: {
      marginBottom: 0,
      padding: 0,
      color: "#121e3a",
    },
    mask: {
      pointerEvents: "none", // 禁用遮罩层的交互，允许下层内容被操作
      backgroundColor: "rgba(0, 0, 0, 0)", // 使遮罩层完全透明
    },
  };

  const renderFormComponent = (type, value, checked) => {
    switch (type) {
      case "input":
        return <Input value={value || ""} disabled />;
      case "checkbox":
        return (
          <Checkbox checked={!checked} disabled>
            必填
          </Checkbox>
        );
      default:
        return <Input value={value || ""} disabled />;
    }
  };

  return (
    <div className={styles["graph-container"]} style={{ flex: 1 }}>
      <div className={styles["util-refresh"]}>
        {lastTime && (
          <div className={styles["util-time"]}>
            <span style={{ color: "#9095a3", fontWeight: 400 }}>
              上次刷新时间：
            </span>
            <span style={{ color: "#626675", fontWeight: 500 }}>
              {lastTime}
            </span>
          </div>
        )}
        <Button
          className={styles["refresh-button"]}
          size="small"
          loading={loading}
          disabled={!isFirst}
          onClick={handleChange}
        >
          刷新
        </Button>
      </div>
      <div
        className={styles["util-container"]}
        style={{ position: "relative" }}
      >
        {showGraph ? (
          <div className={styles["graph"]} ref={graphDom}></div>
        ) : (
          <NoData />
        )}
      </div>

      <Drawer
        title={titleContent}
        footer={null}
        placement="right"
        closable={false}
        onClose={onClose}
        open={visible}
        mask={false}
        autoFocus={false}
        styles={modalStyles}
        getContainer={false}
        resizable={true}
        className={styles["drawer"]}
        style={{
          width: "670px",
          height: "calc(100% - 72px)",
          position: "fixed",
          right: `${drawerPosition.right}px`, // 使用 right
          top: `${drawerPosition.top}px`,
          zIndex: 1000,
        }}
      >
        <div className={styles["attribute-form-container"]}>
          <Form layout="vertical">
            <Row gutter={5} align="middle">
              {/* 本体/关系名称 */}
              <Col span={24}>
                <span className={styles["label-text"]}>
                  {nodeData.tagName ? "本体名称" : "关系名称"}
                </span>
              </Col>
              <Col span={16}>
                <Form.Item>
                  <Input
                    disabled
                    value={nodeData.tagName || nodeData.edgeName || ""}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <span className={styles["key-text"]}>属性信息</span>
              </Col>

              <Row
                gutter={5}
                type="flex"
                style={{ width: "100%", paddingRight: "10px" }}
              >
                {labelName.map((item, index) => (
                  <Col key={index} span={item.span}>
                    {item.value === "propertyType" ? (
                      <Popover
                        content={<Tips style={{ width: 800 }} />}
                        placement="left"
                        className={styles["custom-tip"]}
                      >
                        <span className={styles["label-text"]}>
                          {item.name}
                          <QuestionCircleOutlined
                            style={{ marginLeft: 2 }}
                            className={styles["tip-data"]}
                          />
                        </span>
                      </Popover>
                    ) : (
                      <span className={styles["label-text"]}>{item.name}</span>
                    )}
                  </Col>
                ))}
              </Row>

              {/* 属性信息内容 */}
              <Row
                gutter={5}
                type="flex"
                align="middle"
                className={styles["propertyIfo"]}
              >
                {nodeData.patternProperties?.map((valueItem, idx) => (
                  <React.Fragment key={idx}>
                    {labelName.map((labelItem, index) => (
                      <Col key={index} span={labelItem.span}>
                        <div className={styles["property-item"]}>
                          {/* 附加设置特殊处理 */}
                          {labelItem.value === "extra" &&
                          [
                            "text",
                            "image",
                            "audio",
                            "video",
                            "otherFile",
                          ].includes(valueItem[labelItem.value])
                            ? renderFormComponent(
                                labelItem.com,
                                extraLabel[valueItem[labelItem.value]] ||
                                  valueItem[labelItem.value],
                                false
                              )
                            : labelItem.value === "extra" &&
                              valueItem["propertyType"] === "FIXED_STRING" &&
                              valueItem[labelItem.value] != null
                            ? renderFormComponent(
                                labelItem.com,
                                valueItem[labelItem.value],
                                false
                              )
                            : labelItem.value === "defaultValueAsString" &&
                              valueItem[labelItem.value] != null &&
                              !valueItem["tagRequired"]
                            ? renderFormComponent(
                                labelItem.com,
                                valueItem[labelItem.value],
                                false
                              )
                            : labelItem.value !== "defaultValueAsString" &&
                              labelItem.value !== "extra"
                            ? renderFormComponent(
                                labelItem.com,
                                valueItem[labelItem.value],
                                valueItem[labelItem.value]
                              )
                            : null}
                        </div>
                      </Col>
                    ))}
                  </React.Fragment>
                ))}
              </Row>

              {/* 存活时间标题 */}
              <Col span={24}>
                <span className={styles["key-text"]}>存活时间</span>
              </Col>
              {/* 存活时间内容 */}
              {liveList.map((liveItem, index) => (
                <Row
                  key={index}
                  justify="space-between"
                  style={{ width: "100%", padding: "8px 0" }}
                >
                  <Col span={18} style={{ paddingRight: "8px" }}>
                    <Input disabled value={liveItem.ttlCol || ""} />
                  </Col>
                  <Col span={6}>
                    <Input
                      disabled
                      value={liveItem.ttlDuration || "0"}
                      suffix={<span style={{ color: "#9095a3" }}>h</span>}
                    />
                  </Col>
                </Row>
              ))}
            </Row>
          </Form>
        </div>
      </Drawer>
    </div>
  );
});
export default SemanticGraph;
