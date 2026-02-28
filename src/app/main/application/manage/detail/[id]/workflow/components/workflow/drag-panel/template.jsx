import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

import { getDraftTemplateList } from "@/api/workflow";
import styles from "./drag.module.css";
import { useParams } from "next/navigation";
import { Popover, Typography, Tooltip } from "antd";
const { Text, Paragraph } = Typography;
import { useStore } from "@/store/index";

/**
 * 草稿模板组件
 * 用于显示和管理智能体和工作流模板列表，支持拖拽和点击选择功能
 * @param {Object} props - 组件属性
 * @param {boolean} props.isSelector - 是否为选择器模式（选择器模式下禁用拖拽）
 * @param {boolean} props.readOnly - 是否为只读模式
 * @param {string} props.searchKeyword - 搜索关键词，用于过滤模板列表
 * @param {Function} props.onDragStart - 拖拽开始时的回调函数
 * @param {Function} props.handleNodeSelectClick - 点击选择节点时的回调函数
 * @param {Object} ref - 组件引用，用于暴露内部方法
 */
const DraftTemplate = forwardRef((props, ref) => {
  const { isSelector = false } = props;
  const { id } = useParams();
  const { mcpIsDrag, setMcpIsDrag, templateRefresh, setTemplateRefresh } = useStore(
    (state) => state
  );
  // 状态管理
  const [agentList, setAgentList] = useState([]); // 智能体列表
  const [workflowList, setWorkflowList] = useState([]); // 工作流列表

  // 常量定义
  const POPOVER_Z_INDEX = 10001; // Popover 的 z-index 值
  const TEXT_MAX_WIDTH = 230; // Popover 中文本的最大宽度
  const ITEM_TEXT_MAX_WIDTH = 120; // 列表项中文本的最大宽度
  const DESC_FONT_SIZE = 12; // 描述文字大小
  const DESC_COLOR = "#60687D"; // 描述文字颜色

  // 通过 ref 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getDraftTemplateList: getDraftTemplateListEvent,
  }));

  /**
   * 当搜索关键词变化时，重新获取模板列表
   */
  useEffect(() => {
    getDraftTemplateListEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchKeyword]);

  useEffect(() => {
    console.log(templateRefresh, "templateRefresh");
    if (templateRefresh) {
      getDraftTemplateListEvent();
    }
  }, [templateRefresh]);

  /**
   * 获取草稿模板列表
   * 从 API 获取智能体和工作流列表数据
   */
  const getDraftTemplateListEvent = () => {
    getDraftTemplateList({ name: props.searchKeyword, appId: id }).then(
      (res) => {
        const agentLists = res.data?.agentList || [];
        const workflowLists = res.data?.workflowList || [];
        setAgentList(agentLists);
        setWorkflowList(workflowLists);
        setTemplateRefresh(false);
      }
    );
  };

  /**
   * 拖拽开始事件处理
   * @param {Event} e - 拖拽事件对象
   * @param {Object} app - 应用对象
   * @param {string} type - 类型（'agent' 或 'workflow'）
   */
  const onDragStart = (e, app, type) => {
    setMcpIsDrag(true);
    const dragData = {
      ...app,
      type: type,
    };
    props.onDragStart?.(e, dragData);
  };

  /**
   * 应用选择点击事件处理
   * @param {Object} app - 应用对象
   * @param {string} type - 类型（'agent' 或 'workflow'）
   */
  const handleAppSelectClick = (app, type) => {
    const selectData = {
      ...app,
      type: type,
    };
    props.handleNodeSelectClick?.(selectData, type);
  };

  /**
   * 渲染 Popover 内容
   * 显示应用的图标、名称和描述信息
   * @param {Object} obj - 应用对象
   * @returns {JSX.Element} Popover 内容组件
   */
  const renderContent = (obj) => {
    const iconUrl = process.env.NEXT_PUBLIC_API_BASE + obj.iconUrl;
    
    return (
      <div className={styles["drag_popover_content"]}>
        <div className={styles["drag_popover_content_header"]}>
          <img
            className={styles["drag_panel_content_item_content_item_icon"]}
            src={iconUrl}
            alt={obj.name || ""}
          />
          <Text style={{ maxWidth: 280 }} ellipsis={{ tooltip: obj.name }}>
            {obj.name}
          </Text>
        </div>
        { obj.description && (
        <div className={styles["drag_popover_content_desc"]}>
          <Tooltip title={obj.description}>
          <Paragraph
            className={styles["drag_popover_content_desc_text"]}
            ellipsis={{ rows: 2, tooltip: false }}
          >
            <span style={{ fontSize: DESC_FONT_SIZE, color: DESC_COLOR }}>
              {obj.description}
            </span>
          </Paragraph>
          </Tooltip>
        </div>
        )}
      </div>
    );
  };

  /**
   * 判断是否禁用拖拽功能
   * @param {boolean} itemDisabled - 项目是否被禁用
   * @returns {boolean} 是否禁用拖拽
   */
  const isDragDisabled = (itemDisabled) => {
    return  props.readOnly || itemDisabled;
  };

  /**
   * 渲染模板列表
   * 根据类型渲染智能体或工作流列表
   * @param {string} type - 类型（'agent' 或 'workflow'）
   * @param {Array} list - 模板列表数据
   * @param {string} title - 列表标题
   * @returns {JSX.Element} 模板列表组件
   */
  const renderTemplateList = (type, list, title) => {
    if (!list || list.length === 0) {
      return null;
    }

    return (
      <div className={styles.mcp_content}>
        <div className={styles["drag_panel_mcp_title"]}>{title}</div>
        {list.map((item) => (
          <div className={styles.mcp_content_item} key={item.id}>
            <div className={styles.mcp_content_item_tag}>{item.tagName}</div>
            <div className={styles.mcp_content_item_content}>
              {item.applicationDtos &&
                item.applicationDtos.map((app) => {
                  const dragDisabled = isDragDisabled(item.disabled);
                  const iconUrl = process.env.NEXT_PUBLIC_API_BASE + app.iconUrl;

                  return (
                    <Popover
                      placement="right"
                      arrow={false}
                      content={renderContent(app)}
                      title=""
                      trigger="hover"
                      key={app.id}
                      zIndex={POPOVER_Z_INDEX}
                    >
                      <div
                        onClick={() => handleAppSelectClick(app, type)}
                        onDragStart={
                          dragDisabled
                            ? undefined
                            : (e) => onDragStart(e, app, type)
                        }
                        onDragEnd={() => setMcpIsDrag(false)}
                        draggable={!dragDisabled}
                        style={
                          dragDisabled ? { cursor: "not-allowed" } : {}
                        }
                        className={styles.mcp_content_item_content_item}
                      >
                        <div
                          className={
                            styles.mcp_content_item_content_item_header
                          }
                        >
                          <img
                            className={
                              styles.mcp_content_item_content_item_header_img
                            }
                            src={iconUrl}
                            alt={app.name || ""}
                          />
                          <div
                            className={
                              styles.mcp_content_item_content_item_header_text
                            }
                          >
                            <Text
                              style={{ maxWidth: ITEM_TEXT_MAX_WIDTH }}
                              ellipsis={{
                                tooltip: mcpIsDrag ? "" : app.name,
                              }}
                            >
                              {app.name}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Popover>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.template_section}>
      {agentList.length > 0 &&
        renderTemplateList("agent", agentList, "智能体")}
      {workflowList.length > 0 &&
        renderTemplateList("workflow", workflowList, "工作流")}
    </div>
  );
});

DraftTemplate.displayName = "DraftTemplate";

export default DraftTemplate;
