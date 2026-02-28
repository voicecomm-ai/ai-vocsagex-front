import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import pageStyles from "./page.module.css";
import { Input, Tooltip, Button, Popconfirm, message, Typography } from "antd";
const { Text } = Typography;
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodeData, useNodesInteractions } from "../../hooks";
import debounce from "lodash/debounce";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const relationMap = {
  contains: "包含",
  "not contains": "不包含",
  "start with": "开始是",
  "end with": "结束是",
  is: "是",
  "is not": "不是",
  empty: "为空",
  "not empty": "不为空",
  exists: "存在",
  "not exists": "不存在",
  "all of": "全部是",
};
const valueMap = {
  image: "图片",
  document: "文档",
  audio: "音频",
  video: "视频",
  local_file: "本地上传",
  remote_url: "URL",
};

/**
 * ConditionBlock（安全版）
 * - props: child, relationMap（可选）
 * - 如果没有传 relationMap，则回退使用外层的 relationMap 常量
 */
const ConditionBlock = React.memo(({ child, relationMap: relationMapProp }) => {
  const reactFlowInstance = useReactFlow();
  // 缓存节点数据，避免重复获取
  const nodes = useMemo(() => {
    try {
      return reactFlowInstance.getNodes() || [];
    } catch (error) {
      console.warn("获取节点数据失败:", error);
      return [];
    }
  }, [reactFlowInstance]);
  // 渲染节点图标
  const renderNodeIcon = useCallback(
    (obj) => {
      if (!obj || !obj.nodeType) {
        return "/workflow/default.png"; // 默认图标
      }

      // MCP节点需要特殊处理
      if (obj.nodeType === "mcp") {
        const mcpNode = nodes.find((node) => node.data?.id == obj.nodeId);
        if (mcpNode?.data?.mcp_url) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
          return baseUrl + mcpNode.data.mcp_url;
        }
        return "/workflow/mcp.png"; // MCP默认图标
      }
      if(obj.nodeType === 'agent' || obj.nodeType === 'workflow'){
        const appNode = nodes.find(node => node.data?.id == obj.nodeId);
        if(appNode?.data?.iconUrl){
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
          return baseUrl + appNode.data.iconUrl;
        }
        return '/workflow/common/string.png'; // 智能体图标 默认图标
      }

      // 其他节点类型使用标准图标
      return `/workflow/${obj.nodeType}.png`;
    },
    [nodes]
  );
  // 回退到文件顶部定义的 relationMap（如果父组件没传）
  const relMap = relationMapProp ?? relationMap;

  const hasValue =
    (child?.value && child.value.length > 0) ||
    child?.varType === "file" ||
    child?.comparison_operator === "empty" ||
    child?.comparison_operator === "not empty";

  const getRelationLabel = (op) => {
    if (!op) return "";
    // 首先使用传入/全局的 relMap（如果存在），否则直接返回操作符本身
    return (relMap && relMap[op]) || op;
  };

  const nodeType = child?.inputItem?.nodeType;
  const variableName = child?.inputItem?.variable_name;

  function formatVariable(value) {
    if (!value) return "";

    return value.replace(/{{#([a-zA-Z0-9-]+)\.([\w.]+)#}}/g, (_, uuid, name) => {
      return `{{${name}}}`;
    });
  }
  return (
    <>
      {hasValue ? (
        <>
          <div className={pageStyles["panel-if-condition-item-title"]}>
            {nodeType && (
              <img
                src={renderNodeIcon(child?.inputItem)}
                alt={nodeType}
                className={pageStyles["panel-if-condition-var-icon"]}
                style={{ marginRight: 4,borderRadius: 4 }}
              />
            )}
           
            <Text style={{maxWidth: 110,color: "#364052;"}} ellipsis={{ tooltip: child?.inputItem?.nodeName }}>
            {child?.inputItem?.nodeName} </Text> /{" "}
            <span className={pageStyles["panel-if-condition-item-title-blue"]}>
              {` {{${variableName ?? ""}}}`}
            </span>
          </div>

          {child?.varType === "number" ? (
            child?.numberInputItem ? (
              <span
                className={pageStyles["panel-if-condition-item-title-blue"]}
                style={{ margin: "6px 0" }}
              >
                {` ${child.numberInputItem.label}`}
              </span>
            ) : (
              formatVariable(child?.value) && (
                <span className={pageStyles["panel-if-condition-item-content"]}>
                  {formatVariable(child?.value)}
                </span>
              )
            )
          ) : (
            child?.varType !== "file" &&
            formatVariable(child?.value) && (
              <span className={pageStyles["panel-if-condition-item-content"]}>
                {valueMap[child?.value] ?? formatVariable(child?.value)}
              </span>
            )
          )}
        </>
      ) : (
        child?.sub_variable_condition?.conditions?.length === 0 && <span>条件未设置</span>
      )}

      {child?.sub_variable_condition?.conditions?.length > 0 && (
        <div className={pageStyles["panel-if-condition-item-title"]}>
          {nodeType && (
            <img
              src={renderNodeIcon(child?.inputItem)}
              alt={nodeType}
              className={pageStyles["panel-if-condition-var-icon"]}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={{maxWidth: 110}} ellipsis={{ tooltip: child?.inputItem?.nodeName }}>
          {child?.inputItem?.nodeName}
          </Text> /{" "}
          <span className={pageStyles["panel-if-condition-item-title-blue"]}>
            {` {{${variableName ?? ""}}}`}
          </span>
        </div>
      )}

      <div
        className={`${pageStyles["index-child-panel-if-condition-group"]} ${
          child?.sub_variable_condition?.conditions?.length > 1 ? pageStyles["with-border"] : ""
        }`}
      >
        {child?.sub_variable_condition?.conditions?.map((subChild, idx) => (
          <React.Fragment key={subChild?.case_id ?? subChild?.id ?? idx}>
            {idx > 0 && (
              <div className={pageStyles["index-child-panel-and-button-wrapper"]}>
                <div className={pageStyles["index-child-panel-and-button"]}>
                  {child?.sub_variable_condition?.logical_operator === "or" ? "或" : "且"}
                </div>
              </div>
            )}
            <div className={pageStyles["panel-if-condition-item-sub"]}>
              <span className={pageStyles["panel-if-condition-item-title-blue"]}>
                {subChild?.key}
              </span>
              <span className={pageStyles["m6"]}>
                {getRelationLabel(subChild?.comparison_operator)}
              </span>

              {subChild?.key === "size" && subChild?.numberVarType === "variable" ? (
                <span className={pageStyles["panel-if-condition-item-title-blue"]}>
                    {` {{${subChild?.numberInputItem?.label ?? ""}}}`}
                </span>
              ) : (
                subChild?.numberVarType !== "variable" && (
                  <span>{valueMap[subChild?.value] ?? formatVariable(subChild?.value)}</span>
                )
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
});

/**
 * 主组件
 */
const ConditionalBranch = ({ id, data, selected, type }) => {
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || "");
  const { setNodes, getNodes, deleteElements } = useReactFlow();
  const { getUpstreamVariables } = useNodeData();
  const [variableInfo, setVariableInfo] = useState([]);
  const [isFocus, setIsFocus] = useState(false);
  const { setPanelVisible, readOnly, setPannerNode, pannerNode, setRunVisible } = useStore(
    (state) => state
  );

  // 保证 updateNodeDetailEvent 使用正确 id（之前写成 id.id）
  const updateNodeDetailEvent = useCallback(
    (newDataObj) => {
      const newData = {
        nodeId: id,
        data: { ...newDataObj, id }, // 将 id 保存在 data 中（按你原意）
      };
      updateNodeDetail(newData);
    },
    [id, updateNodeDetail]
  );

  const updataNameEvent = useCallback(() => {
    setTitle(data.title);
    setIsEditing(true);
  }, [data.title]);

  useEffect(() => {
    if (!data.outputs) return;
    handleRenderVariable(data.outputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.outputs]);

  const handleRenderVariable = useCallback(
    (outputs) => {
      const upstreamVariables = getUpstreamVariables(id) || [];
      const arr = mapVariablesToNodeInfo(outputs, upstreamVariables);
      setVariableInfo(arr);
    },
    [getUpstreamVariables, id]
  );

  // 修复：使用 value_selector（而非不存在的 targetValueSelector）
  function findMatchingChild(children, targetValueSelector) {
    if (!Array.isArray(children)) return null;
    for (const c of children) {
      if (JSON.stringify(c.value_selector) === JSON.stringify(targetValueSelector)) return c;
      if (c.children && c.children.length > 0) {
        const found = findMatchingChild(c.children, targetValueSelector);
        if (found) return found;
      }
    }
    return null;
  }

  function resolveVariableName(value_selector) {
    if (!Array.isArray(value_selector) || value_selector.length === 0) return "";
    const uuidSimple = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidSimple.test(value_selector[0]);
    return isUUID ? value_selector[value_selector.length - 1] : value_selector.join(".");
  }

  function mapVariablesToNodeInfo(variableMappings, nodes) {
    if (!Array.isArray(variableMappings)) return [];
    return variableMappings.map(({ variable, value_selector }) => {
      let matchedNode = null;
      for (const node of nodes) {
        if (!node.children) continue;
        const matchedChild = findMatchingChild(node.children, value_selector); // <- 使用 value_selector
        if (matchedChild) {
          matchedNode = {
            variable: resolveVariableName(value_selector),
            nodeType: node.nodeType,
            title: node.title,
            variable_type: matchedChild.variable_type?.toUpperCase() || "STRING",
          };
          break;
        }
      }
      return (
        matchedNode || {
          variable: resolveVariableName(value_selector),
          nodeType: null,
          title: null,
          variable_type: "STRING",
        }
      );
    });
  }

  // Title 编辑相关
  const handleTitleChange = useCallback((v) => setTitle(v), []);
  const saveTitle = useCallback(
    (value) => {
      if (!value.trim()) {
        return message.warning("节点名称不能为空");
      }
      const obj = {
        ...data,
        title: value,
      };
      updateNodeDetailEvent(obj);
    },
    [data, updateNodeDetailEvent]
  );
  const handleTitleBlur = useCallback(() => {
    saveTitle(title);
    setIsEditing(false);
  }, [saveTitle, title]);

  // 点击节点打开面板
  const onNodeClick = useCallback(() => {
    setRunVisible(false);
    setPanelVisible(true);
    setPannerNode({ id, data, type });
  }, [setRunVisible, setPanelVisible, setPannerNode, id, data, type]);

  const handleMouseEnter = useCallback(() => {
    setIsFocus(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsFocus(false);
  }, []);

  // memoize rendering of variableInfo items
  const renderedVariableInfo = useMemo(() => {
    if (!variableInfo || variableInfo.length === 0) return null;
    return variableInfo.map((item, idx) =>
      item.variable ? (
        <div className={styles["end_node_variable_item"]} key={item.variable + "-" + idx}>
          {item.nodeType && (
            <img
              className={styles["end_node_variable_item_img"]}
              src={`/workflow/${item.nodeType}.png`}
              alt=''
              loading='lazy'
            />
          )}
          {item.title && (
            <div className={styles["end_node_variable_item_title"]}>{item.title} /</div>
          )}
          <div className={styles["custom_node_variable_name"]}>{item.variable}</div>
          <div className={styles["custom_node_variable_type"]}>{item.variable_type}</div>
        </div>
      ) : null
    );
  }, [variableInfo]);

  // ConditionRenderer 使用 useMemo 缓存（防止父组件小更新导致全部重建）
  const ConditionRenderer = useMemo(() => {
    const cases = data?.cases || [];

    return (
      <div className={pageStyles["node-condition-wrapper"]} style={{ marginTop: 0 }}>
        {isNodeConnected(id) &&
          cases.map((block, blockIndex) => {
            const blockKey = block.case_id || block.id || `block-${blockIndex}`;
            return (
              <div key={blockKey} className={pageStyles["node-background"]}>
                <div className={pageStyles["condition-text"]}>
                  <span>{block.type}</span>
                  <NodeSourceHandle
                    id={block.case_id}
                    isFocus={isFocus}
                    nodeId={id}
                    suffix={false}
                    childHandle={true}
                  />
                  {/* <Handle
                    type='source'
                    id={`${block.case_id}`}
                    className={styles["classesHandleSource"]}
                    position={Position.Right}
                  /> */}
                </div>

                <div
                  className={`${pageStyles["index-panel-if-condition-group"]} ${
                    block.conditions?.length > 1 ? pageStyles["with-border"] : ""
                  }`}
                >
                  {block.conditions?.map((child, childIndex) => {
                    const childKey = child.case_id || child.id || `${blockIndex}-${childIndex}`;
                    return (
                      <React.Fragment key={childKey}>
                        {childIndex > 0 && (
                          <div className={pageStyles["index-panel-and-button-wrapper"]}>
                            <div className={pageStyles["index-panel-and-button"]}>
                              {block.logical_operator === "or" ? "或" : "且"}
                            </div>
                          </div>
                        )}

                        <div className={pageStyles["panel-if-condition-left-item"]}>
                          <div className={pageStyles["panel-if-condition-left-item-column"]}>
                            {/* ConditionBlock 是 memo 组件，只在 child props 改变时重渲染 */}
                            <ConditionBlock child={child} />
                          </div>

                          {(child.value?.length > 0 ||
                            child.sub_variable_condition?.conditions?.length > 0 ||
                            child.varType === "file" ||
                            child.comparison_operator === "empty" ||
                            child.comparison_operator === "not empty") && (
                            <span className={pageStyles["panel-if-condition-left-item-relation"]}>
                              {relationMap[child.comparison_operator] ?? child.comparison_operator}
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {(cases.length === 0 || !isNodeConnected(id)) && (
          <div className={pageStyles["condition-text"]}>
            <span>IF</span>
            <NodeSourceHandle
              key={`true`}
              id={`true`}
              isFocus={isFocus}
              nodeId={id}
              suffix={false}
              childHandle={true}
            />
            {/* <Handle
              type='source'
              id={`true`}
              className={styles["classesHandleSource"]}
              position={Position.Right}
            /> */}
          </div>
        )}
        <div className={pageStyles["condition-text"]}>
          <span>ELSE</span>
          <NodeSourceHandle
            key={`false`}
            id={`false`}
            isFocus={isFocus}
            nodeId={id}
            suffix={false}
            childHandle={true}
          />
          {/* <Handle
            type='source'
            id={`false`}
            className={styles["classesHandleSource"]}
            position={Position.Right}
          /> */}
        </div>
      </div>
    );
  }, [data, isFocus]); // 仅在 data 变化时重新计算

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${pageStyles["if_node"]} ${
        pannerNode && pannerNode.id == id ? styles["selected_node"] : ""
      }`}
    >
      <div onClick={() => onNodeClick()} className={styles["custom_node_content"]}>
        <div className={styles["custom_node_header"]}>
          <img
            className={styles["custom_node_header_icon"]}
            src={`/workflow/${data.type}.png`}
            alt=''
            loading='lazy'
          />

          <div className={styles["custom_node_header_title"]}>
            <Text style={{ maxWidth: 110 }} ellipsis={{ tooltip: data.title }}>
              <span style={{ fontSize: 16, fontWeight: "600", color: "#101A28" }}>
                {" "}
                {data.title}
              </span>
            </Text>
          </div>
          <div className={styles["custom_node_header_type"]}>流程控制</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div className={styles["custom_node_actions"]} onClick={(e) => e.stopPropagation()}>
              <Operator id={id} updataNameEvent={updataNameEvent} />
            </div>
          )}
        </div>

        {variableInfo && variableInfo.length > 0 && (
          <div className={styles["custom_node_variable"]}>{renderedVariableInfo}</div>
        )}

        {/* 使用 memoized ConditionRenderer */}
        {ConditionRenderer}
        {data.desc && <div className={styles["custom_node_desc"]}>{data.desc}</div>}
      </div>
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
      {/* <Handle
        type='target'
        id={`${id}-target`}
        className={
          isNodeConnected(id, "target")
            ? styles.customHandleTarget
            : (pannerNode && pannerNode.id == id) || isFocus
            ? styles.customHandleTarget
            : styles.customHandleHidden
        }
        position={Position.Left}
      /> */}
    </div>
  );
};

export default ConditionalBranch;
