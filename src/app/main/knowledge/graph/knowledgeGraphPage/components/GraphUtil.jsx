"use client";

import React, { useState, forwardRef, useRef, useEffect } from "react";
import {
  Spin,
  Form,
  Select,
  Space,
  AutoComplete,
  Input,
  message,
  Tooltip,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ReactSVG } from "react-svg";
import screenfull from "screenfull";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import { debounce } from "lodash";
import { standardGraphData } from "@/utils/graph/graph";
import { layoutConfig, setNodeCenter, reLayout } from "@/utils/graph/cytoscape";
import {
  selectVertexInfoApi,
  queryFullGraphApi,
} from "@/api/graphVisualization";

const QueryTypeOptions = [
  { label: "全图查询", value: "fullQuery" },
  { label: "画布定位", value: "canvasPosition" },
  { label: "导入节点", value: "nodeImport" },
];

const nodeTooltips = [
  {
    title: "显示隐藏节点",
    changeType: "showHiddenNode",
    url: "/knowledge/graph/show_hidden.svg",
  },
  {
    title: "节点拓展",
    changeType: "nodeExpand",
    url: "/knowledge/graph/node_expand.svg",
  },
  {
    title: "设置中心节点",
    changeType: "nodeCenter",
    url: "/knowledge/graph/node_center.svg",
  },
  {
    title: "路径查询",
    changeType: "pathQuery",
    url: "/knowledge/graph/menu_path_query.svg",
  },
];

const edgeTooltips = [
  {
    title: "隐藏边名称",
    changeType: "hiddenLabelText",
    url: "/knowledge/graph/edge_hidden.svg",
  },
  {
    title: "显示边名称",
    changeType: "showLabelText",
    url: "/knowledge/graph/edge_show.svg",
  },
];

const layoutTooltips = [
  {
    title: "力矢量布局",
    changeType: "forceLayout",
    url: "/knowledge/graph/layout_force.svg",
  },
  {
    title: "同心圆布局",
    changeType: "circleLayout",
    url: "/knowledge/graph/layout_circle.svg",
  },
  {
    title: "树形布局",
    changeType: "treeLayout",
    url: "/knowledge/graph/layout_tree.svg",
  },
];

const tooltipTypes = [
  { id: 1, label: "节点：", func: nodeTooltips },
  { id: 2, label: "边：", func: edgeTooltips },
  { id: 3, label: "布局：", func: layoutTooltips },
];

const GraphUtil = forwardRef(
  (
    { fullDom, graphDom, onUpdateGraph, onImportGraph, changeType },
    coreComputedRef
  ) => {
    const { currentNamespaceId } = useStore((state) => state);
    const core = coreComputedRef?.current;

    const [queryType, setQueryType] = useState("fullQuery");
    // const [displayValue, setDisplayValue] = useState(""); // 输入框显示的值（存历史）
    const [lastSelectedValue, setLastSelectedValue] = useState(null); // 真正存储选中数据的状态
    const [displayValue, setDisplayValue] = useState(""); // 输入框显示的值（存历史）
    const [searchValue, setSearchValue] = useState(""); // 搜索框输入值
    // const [selectValue, setSelectValue] = useState(null); // 选中的选项值
    const [options, setOptions] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [lastFetchId, setLastFetchId] = useState(0);

    const [isFullscreen, setIsFullscreen] = useState(screenfull.isFullscreen);

    // 解决闭包陷阱
    const coreRef = useRef(core);

    useEffect(() => {
      coreRef.current = core;
    }, [core]);

    const handleInputFocus = () => {
      // if (lastSelectedValue) {
      //   setDisplayValue(""); // 输入框展示为空
      //   setSearchValue(""); // 搜索值也清空，避免影响搜索
      // }
      setOptions([]);
      setDisplayValue(""); // 无论是否有选中值，聚焦都清空
      setSearchValue("");
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

        try {
          // 画布定位：直接从Cytoscape实例中筛选可见节点

          if (currentQueryType === "canvasPosition" && coreRef.current) {
            const visibleNodes = coreRef.current
              .nodes(":visible")
              .filter((node) => node.data("name").includes(filteredValue));

            const nodeOptions = visibleNodes.map((node) => {
              return {
                label: vertexLabel(
                  node.data("name"),
                  node.data("tag"),
                  filteredValue
                ),
                value: node.data("id"),
                originName: node.data("name"),
                vertexName: node.data("name"),
                vertexId: node.data("id"),
              };
            });
            fetchId === lastFetchId && setOptions(nodeOptions);
          }
          // 全图查询/节点导入：调用接口获取数据
          else {
            const { data } = await selectVertexInfoApi({
              spaceId: currentNamespaceId,
              vertexName: filteredValue,
            });

            if (fetchId !== lastFetchId) return;

            const apiOptions = data.map((node) => {
              return {
                label: vertexLabel(
                  node.vertexName,
                  node.vertexTagName,
                  filteredValue
                ),
                value: node.vertexId,
                originName: node.vertexName,
                vertexName: node.vertexName,
                vertexId: node.vertexId,
              };
            });
            setOptions(apiOptions);
          }
        } catch (error) {
          console.error("搜索失败：", error);
          message.error("搜索出错，请重试");
        } finally {
          fetchId === lastFetchId && setFetching(false);
        }
      }, 300) // 300ms防抖
    ).current;

    // 搜索输入处理
    const handleSearch = (value) => {
      if (value) {
        setSearchValue(value);
        debouncedFetch(value, queryType); // 触发防抖请求
      }
    };

    // 选择结果处理
    const handleSelect = async (value, option) => {
      if (!value || !option) return;

      setLastSelectedValue(option);
      setDisplayValue(option.originName || option.vertexName || "");
      setSearchValue("");
      setOptions([]);

      switch (queryType) {
        // 画布定位：选中节点并居中
        case "canvasPosition":
          core && core.nodes().unselect();
          const targetNode = core?.$(`#${value}`);
          targetNode?.length
            ? (targetNode.select(), setNodeCenter(core, targetNode))
            : message.error("节点不存在");
          break;

        // 全图查询：请求全图数据并更新
        case "fullQuery":
          try {
            const { data } = await queryFullGraphApi({
              spaceId: currentNamespaceId,
              edges: [],
              startId: value,
            });
            data.vertexVOList.length
              ? onUpdateGraph?.(standardGraphData(data))
              : message.error("无数据");
          } catch (error) {
            console.error("全图查询失败：", error);
            message.error("全图查询出错，请重试");
          }
          break;

        // 节点导入：请求数据并导入
        case "nodeImport":
          try {
            const { data } = await queryFullGraphApi({
              spaceId: currentNamespaceId,
              edges: [],
              startId: value,
            });
            data.vertexVOList.length
              ? onImportGraph?.(standardGraphData(data), undefined, value)
              : message.error("无可导入数据");
          } catch (error) {
            // console.error("节点导入失败：", error);
          } finally {
            setOptions([]);
          }
          break;

        default:
          break;
      }
    };

    const handleLayout = (type) => {
      core.reset();
      const layoutName = layoutConfig[type];
      reLayout(core, layoutName);
    };
    const handleScreen = () => {
      if (screenfull.isEnabled) {
        screenfull.toggle(fullDom.current);
      }
    };
    const handleZoom = (num) => {
      let number = core.zoom();
      // core.zoom(number + num);
      // core.center();

      core.zoom({
        level: number + num,
        position: {
          x: core.width() / 2,
          y: core.height() / 2,
        },
      });
    };
    const handleRest = () => {
      // reLayout(core);
      core.reset();
      const layoutName = layoutConfig["forceLayout"];
      reLayout(core, layoutName);
      // core.layout(layoutConfig["forceLayout"]).run();
    };

    // 添加全屏状态监听
    useEffect(() => {
      if (!screenfull.isEnabled) return;

      const handleFullscreenChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
      };

      screenfull.on("change", handleFullscreenChange);

      return () => {
        screenfull.off("change", handleFullscreenChange);
      };
    }, []);

    // 监听查询类型变化：重置搜索状态
    useEffect(() => {
      setSearchValue("");
      setOptions([]);
      setFetching(false);
      debouncedFetch.cancel();
    }, [queryType, debouncedFetch]);

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
      <div className={styles["util-container"]}>
        <Form layout="inline" className={styles["utils-form-wrapper"]}>
          {tooltipTypes.map((item) => (
            <Form.Item key={item.id} label={item.label}>
              <div className={styles["util-icon-wrapper"]}>
                {item.func.map((tool) => (
                  <Tooltip
                    key={tool.title}
                    placement="bottom"
                    title={tool.title}
                    pointAtCenter="true"
                  >
                    <div
                      className={styles["util-icon-item"]}
                      onClick={() => {
                        item.id === 3
                          ? handleLayout(tool.changeType)
                          : changeType(tool.changeType);
                      }}
                    >
                      <ReactSVG
                        className={styles["util-icon-svg"]}
                        src={tool.url}
                      />
                    </div>
                  </Tooltip>
                ))}
              </div>
            </Form.Item>
          ))}
          <Form.Item label="画布：">
            <div className={styles["util-icon-wrapper"]}>
              <div className={styles["util-icon-item"]} onClick={handleScreen}>
                <ReactSVG
                  className={styles["util-icon-svg"]}
                  src={
                    isFullscreen
                      ? "/knowledge/graph/close_fullscreen.svg"
                      : "/knowledge/graph/fullscreen.svg"
                  }
                />
              </div>
              <div
                className={styles["util-icon-item"]}
                onClick={() => {
                  handleZoom(0.5);
                }}
              >
                <ReactSVG
                  className={styles["util-icon-svg"]}
                  src="/knowledge/graph/zoom_expand.svg"
                />
              </div>
              <div
                className={styles["util-icon-item"]}
                onClick={() => {
                  handleZoom(-0.5);
                }}
              >
                <ReactSVG
                  className={styles["util-icon-svg"]}
                  src="/knowledge/graph/zoom_mini.svg"
                />
              </div>
              <div className={styles["util-icon-item"]} onClick={handleRest}>
                <ReactSVG
                  className={styles["util-icon-svg"]}
                  src="/knowledge/graph/refresh.svg"
                />
              </div>
            </div>
          </Form.Item>
          <Form.Item
            label=""
            style={{ marginLeft: "auto", width: "400px", alignItems: "center" }}
          >
            <div className={styles["select-content"]}>
              <Select
                style={{ width: "30%" }}
                value={queryType}
                options={QueryTypeOptions}
                onChange={setQueryType}
                getPopupContainer={(trigger) => trigger.parentNode}
              ></Select>
              <div
                className={styles["select-wrapper"]}
                style={{ width: "69%", marginLeft: "5px" }}
              >
                <AutoComplete
                  value={displayValue}
                  options={options}
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  allowClear
                  style={{ width: "100%" }}
                  filterOption={false} // 禁用内置过滤，手动处理搜索逻辑
                  getPopupContainer={(trigger) => trigger.parentNode}
                  // notFoundContent={fetching ? <Spin size="small" /> : null}
                  onClear={() => {
                    setLastSelectedValue(null); // 清空实际数据
                    setDisplayValue(""); // 清空显示值
                    setSearchValue("");
                    setOptions([]);
                  }}
                >
                  <Input
                    prefix={<SearchOutlined style={{ color: "#999" }} />}
                    value={displayValue}
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
          </Form.Item>
        </Form>
      </div>
    );
  }
);

export default GraphUtil;
