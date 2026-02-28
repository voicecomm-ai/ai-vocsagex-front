import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../node.module.css";
import { message,Typography } from "antd";

import { useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodeData, useNodesInteractions } from "../../hooks";
import debounce from "lodash/debounce";
import endStyles from "./end.module.css";
import { NodeTargetHandle } from "../../node-handle";
const { Text } = Typography;
// ==================== 辅助函数（组件外部） ====================

/**
 * 解析变量名称
 * 根据 value_selector 数组判断是 UUID 格式还是路径格式，返回对应的变量名
 * @param {Array} value_selector - 变量选择器数组
 * @returns {string} 解析后的变量名称
 */
function resolveVariableName(value_selector) {
  if (!Array.isArray(value_selector) || value_selector.length === 0) return "";

  // UUID 格式正则：8-4-4-4-12 的十六进制字符
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(value_selector[0]);

  if (isUUID) {
    // 如果是节点ID（UUID格式），直接取最后一个字段名作为变量名
    return value_selector[value_selector.length - 1];
  } else {
    // 否则按路径格式拼接，如 "a.b.c"
    return value_selector.join(".");
  }
}

/**
 * 递归查找匹配的子节点
 * 在子节点树中查找与目标 value_selector 匹配的节点
 * @param {Array} children - 子节点数组
 * @param {Array} targetValueSelector - 目标变量选择器
 * @returns {Object|null} 匹配的子节点，未找到返回 null
 */
function findMatchingChild(children, targetValueSelector) {
  for (const child of children) {
    // 通过 JSON 序列化比较 value_selector 是否完全匹配
    if (JSON.stringify(child.value_selector) === JSON.stringify(targetValueSelector)) {
      return child;
    }

    // 递归查找子节点的子节点
    if (child.children && child.children.length > 0) {
      const found = findMatchingChild(child.children, targetValueSelector);
      if (found) return found;
    }
  }

  return null;
}

/**
 * 将变量映射转换为节点信息
 * 将上游节点的变量映射信息转换为用于显示的节点信息格式
 * @param {Array} variableMappings - 变量映射数组，包含 variable 和 value_selector
 * @param {Array} nodes - 上游节点数组
 * @returns {Array} 转换后的节点信息数组
 */
function mapVariablesToNodeInfo(variableMappings, nodes) {
  return variableMappings.map(({ variable, value_selector }) => {
    let matchedNode = null;

    // 遍历上游节点，查找匹配的变量
    for (const node of nodes) {
      if (!node.children) continue;

      // 在节点的子节点中查找匹配的变量
      const matchedChild = findMatchingChild(node.children, value_selector);

      if (matchedChild) {
        // 找到匹配的变量，构建节点信息
        matchedNode = {
          variable: resolveVariableName(value_selector),
          nodeType: node.nodeType,
          title: node.title,
          variable_type: matchedChild.variable_type?.toUpperCase() || "STRING",
          icon: node.icon,
        };
        break;
      }
    }

    // 如果找到匹配节点则返回节点信息，否则返回默认信息
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

/**
 * 结束节点组件
 * 用于工作流中的结束节点，显示节点信息和上游变量
 * @param {Object} props - 组件属性
 * @param {string|Object} props.id - 节点ID
 * @param {Object} props.data - 节点数据，包含 title、outputs、desc 等
 * @param {boolean} props.selected - 节点是否被选中
 * @param {string} props.type - 节点类型
 */
const EndNode = ({ id, data, selected, type }) => {
  // ==================== Hooks 和状态管理 ====================
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const reactFlowInstance = useReactFlow();
  const { getUpstreamVariables } = useNodeData();
  const { setPanelVisible, readOnly, setPannerNode, pannerNode, setRunVisible } = useStore(
    (state) => state
  );

  // 节点编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || "");
  
  // 变量信息列表，用于显示上游节点的输出变量
  const [variableInfo, setVariableInfo] = useState([]);
  
  // 鼠标悬停状态，用于控制操作按钮的显示
  const [isFocus, setIsFocus] = useState(false);

  // ==================== 节点标题编辑相关 ====================
  
  /**
   * 触发节点名称编辑事件
   * 重置标题为原始值并进入编辑状态
   */
  const updataNameEvent = () => {
    setTitle(data.title);
    setIsEditing(true);
  };

  /**
   * 保存节点标题
   * @param {string} value - 新的标题值
   */
  const saveTitle = (value) => {
    if (!value.trim()) {
      return message.warning("节点名称不能为空");
    }
    const updatedData = {
      ...data,
      title: value,
    };
    updateNodeDetailEvent(updatedData);
  };

  /**
   * 防抖更新节点详情
   * 使用防抖避免频繁更新，100ms 无操作后才触发
   */
  const updateNodeDetailEvent = useRef(
    debounce(async (data) => {
      const newData = {
        nodeId: id,
        data: { ...data, id: id.id },
      };
      updateNodeDetail(newData);
    }, 100)
  ).current;

  /**
   * 处理节点名称改变事件
   * @param {string} value - 新的标题值
   */
  const handleTitleChange = (value) => {
    setTitle(value);
  };

  /**
   * 失去焦点时保存标题并关闭编辑状态
   */
  const handleTitleBlur = () => {
    saveTitle(title);
    setIsEditing(false);
  };

  // ==================== 变量处理相关 ====================

  /**
   * 处理并渲染变量信息
   * 根据输出配置获取上游变量并映射为节点信息
   * @param {Array} outputs - 输出配置列表
   */
  const handleRenderVariable = useCallback((outputs) => {
    const upstreamVariables = getUpstreamVariables(id);
    console.log(upstreamVariables, 'upstreamVariables')
    const mappedInfo = mapVariablesToNodeInfo(outputs, upstreamVariables);
    setVariableInfo(mappedInfo);
  }, [id, getUpstreamVariables]);

  /**
   * 处理输出数据变化
   * 当节点数据变化时，处理输出配置并更新变量信息
   */
  useEffect(() => {
    if (!data.outputs) return;

    // 获取当前所有节点（每次 effect 执行时获取最新节点列表）
    const currentNodes = reactFlowInstance.getNodes();
    const outputsList = [];
    
    data.outputs.forEach((item) => {
      if (!item) return;

      // 获取输出节点的ID（value_selector 的第一个元素）
      const outNodeId =
        item.value_selector && item.value_selector.length ? item.value_selector[0] : null;

      // 处理代码执行节点的输出参数
      if (item.outputId) {
        // 查找代码执行节点的输出类型配置
        const outputTypes =
          currentNodes.find((node) => node.id === outNodeId)?.data?.codeOutputs || null;

        if (outputTypes) {
          // 根据 outputId 查找对应的变量名
          const newOutput =
            (outputTypes &&
              outputTypes.length &&
              outputTypes.find((type) => type.id === item.outputId)?.variable) ||
            null;

          if (newOutput) {
            // 更新 value_selector，将代码执行节点的输出变量名加入路径
            const updatedItem = {
              ...item,
              value_selector: [outNodeId, newOutput],
            };
            outputsList.push(updatedItem);
          }
        }
      } else {
        // 非代码执行节点，直接验证节点是否存在
        const outputTypes = currentNodes.find((node) => node.id === outNodeId)?.data;
        if (outputTypes) {
          outputsList.push(item);
        }
      }
    });

    // 渲染处理后的变量信息
    handleRenderVariable(outputsList);
  }, [data, handleRenderVariable, reactFlowInstance]);

  // ==================== 节点交互事件 ====================

  /**
   * 节点点击事件处理
   * 点击节点时打开侧边栏面板并设置当前节点信息
   */
  const onNodeClick = () => {
    // 如果正在编辑，不响应点击事件
    if (isEditing) {
      return;
    }
    setRunVisible(false);
    setPanelVisible(true);
    setPannerNode({ id, data, type });
  };

  /**
   * 鼠标进入节点区域
   */
  const handleMouseEnter = () => {
    setIsFocus(true);
  };

  /**
   * 鼠标离开节点区域
   */
  const handleMouseLeave = () => {
    setIsFocus(false);
  };
  // ==================== 渲染 ====================
  
  /**
   * 判断节点是否被选中（在侧边栏中显示）
   */
  const isSelected = pannerNode && pannerNode.id === id;
  
  /**
   * 判断是否显示操作按钮
   * 当节点被选中或鼠标悬停时，且非只读模式下显示
   */
  const showActions = (isSelected || isFocus) && !readOnly;
  
  /**
   * 判断是否显示变量信息
   * 当节点已连接且有变量信息时显示
   */
  const showVariables = isNodeConnected(id) && variableInfo && variableInfo.length > 0;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${endStyles["end_node"]} ${
        isSelected ? styles["selected_node"] : ""
      }`}
    >
      {/* 节点主要内容区域 */}
      <div onClick={onNodeClick} className={styles["custom_node_content"]}>
        {/* 节点头部：图标、标题、操作按钮 */}
        <div className={styles["custom_node_header"]}>
          {/* 节点类型图标 */}
          <img
            className={styles["custom_node_header_icon"]}
            src={`/workflow/${data.type}.png`}
            alt={`${data.type}节点图标`}
          />

          {/* 节点标题 */}
          <div className={styles["custom_node_header_title"]}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}> {data.title}</span></Text>
            </div>
          <div className={styles["custom_node_header_type"]}>流程控制</div>

          {/* 操作按钮：编辑、删除等 */}
          {showActions && (
            <div
              className={styles["custom_node_actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              <Operator isEnd={true} id={id} updataNameEvent={updataNameEvent} />
            </div>
          )}
        </div>

        {/* 变量信息展示区域 */}
        {showVariables && (
          <div className={styles["custom_node_variable"]}>
            {variableInfo.map((item, index) =>
              item.variable && item.nodeType ? (
                <div
                  key={index}
                  className={styles["end_node_variable_item"]}
                >
                  {/* 上游节点类型图标 */}
                  {item.nodeType && (
                    <img
                      className={styles["end_node_variable_item_img"]}
                      src={item.icon}
                      alt={`${item.nodeType}节点图标`}
                    />
                  )}

                  {/* 上游节点标题 */}
                  {item.title && (
                    <div className={endStyles["end_node_variable_item_title"]}>
                         <Text style={{ maxWidth: 100 }} ellipsis={{ tooltip: item.title }}>
                         
                         <span className={endStyles["end_node_variable_item_title_text"]}>
                           {item.title}  
                         </span>
                         </Text>
                     <span className={endStyles["end_node_variable_item_title_text"]}>/
                    </span>
                    </div>
                  )}

                  {/* 变量名称 */}
                  <div className={endStyles["start_panel_variable_name"]}>
                    {`{{${item.variable}}}`}
                  </div>

                  {/* 变量类型 */}
                  <div className={styles["custom_node_variable_type"]}>
                    {item.variable_type}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* 节点描述信息 */}
        {data.desc && (
          <div className={styles["custom_node_desc"]}>{data.desc}</div>
        )}
      </div>

      {/* 节点连接点（目标连接点，用于接收上游节点的连接） */}
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};

export default EndNode;
