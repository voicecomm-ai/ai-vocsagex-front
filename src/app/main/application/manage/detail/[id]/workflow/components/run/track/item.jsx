import React, { forwardRef, useImperativeHandle, useState } from "react";
import styles from "./track.module.css";

import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Tooltip,
  Empty,
  Typography,
} from "antd";
const { Text } = Typography;
import { useNode } from "../../hooks";
import JsonEditorPage from "../JsonEditorPage";
import RunLoop from "../loop";
const TrackItem = forwardRef((props, ref) => {
  const { item, index } = props;
  const { getNodeIcon } = useNode();
  useImperativeHandle(ref, () => ({
    updateStepStatus,
  }));
  const [expandedItems, setExpandedItems] = useState(new Set()); //展开的节点

  // 渲染JSON数据
  const renderJsonData = (data, title = "数据") => {
    return (
      <JsonEditorPage
        content={data}
        title={title}
        handleFullscreen={handleFullscreen}
        isFullscreen={false}
      />
    );
  };
  // 全屏切换
  const handleFullscreen = (data, title) => {
    console.log(data, title);
    props.handleFullscreen(data, title);
  };
  // 切换展开/收起状态
  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case "succeeded":
        return "/workflow/run/succeeded.png";
      case "running":
        return "/workflow/run/running.png";
      case "failed":
        return "/workflow/run/failed.png";
      default:
        return "/workflow/run/succeeded.png";
    }
  };
  // 渲染错误内容
  const renderErrorContent = (error) => {
    return <div className={styles["run_tooltip_content"]}>{error}</div>;
  };
  return (
    <div className={`${styles.track_step_card}`}>
      <div className={styles.track_step_header}    onClick={() => toggleExpand(item.id)}>
        <div className={styles.track_step_left}>
          <div className={styles.track_step_number}>{index + 1}</div>
          <img
            src={getNodeIcon(item.node_type, item.node_id)}
            alt={item.name}
            className={styles.track_step_icon}
          />
          <span className={styles.track_step_name}>
            <Text
              style={{ maxWidth: "125px" }}
              ellipsis={{ tooltip: item.title }}
            >
              {item.title}
            </Text>
          </span>
        </div>
        <div className={styles.track_step_right}>
          {item.status != "running" && (
            <>
            {item.outputs?.usage?.total_tokens!=0&&item.outputs?.usage?.total_tokens && (
            <span className={styles.track_step_tokens}>
                {item.outputs.usage.total_tokens} Tokens
              </span>
            )}
            </>
          )}
          <div className={styles.track_step_duration_container}>
            {item.status != "running" && (
              <span className={styles.track_step_duration}>
                {item.elapsed_time&&item.elapsed_time.toFixed(3)}秒
              </span>
            )}
            {item.status === "running" && (
              <span className={styles.track_step_running_text}>运行中...</span>
            )}
          </div>
          <img
            src={getStatusIcon(item.status)}
            alt={item.status}
            className={`${styles.track_step_status} ${
              item.status === "running" ? styles.running : ""
            }`}
          />
          {item.expandable && (
            <img
              src="/workflow/arrow_bottom.png"
              alt="展开"
              className={`${styles.track_step_expand} ${
                expandedItems.has(item.id) ? styles.expanded : ""
              }`}
           
            />
          )}
        </div>
      </div>

      {/* 展开的内容 */}
      {expandedItems.has(item.id) && (
        <div className={styles.track_step_content}>
          {item.status === "failed" && (
            <div className={styles["run_panel_result_error"]}>
              <img
                className={styles["run_panel_result_error_left"]}
                src="/workflow/run/error.png"
                alt="error"
              />

              <div className={styles["run_panel_result_error_right"]}>
                <Text
                  style={{ maxWidth: 300 }}
                  ellipsis={{ tooltip: renderErrorContent(item.error) }}
                >
                  <span className={styles["run_panel_result_error_right_text"]}>
                    {" "}
                    {item.error}
                  </span>
                </Text>
              </div>
            </div>
          )}
          {/* 渲染循环节点 */}
          {item.node_type == "loop" && (
        
          <RunLoop nodeType="loop" item={item} handleFullscreen={handleFullscreen} />)}
          {item.node_type == "iteration" && (
            <RunLoop nodeType="iteration" item={item} handleFullscreen={handleFullscreen} />
          )}
          <div style={{marginBottom: '4px'}}>
          {/* 输入数据 */}
          {item.inputs && renderJsonData(item.inputs, item.node_type == "loop"?"初始循环变量":item.node_type == "iteration"?"输入":"输入数据")}
          </div> 
          {/* 输出数据 */}
          {item.outputs && renderJsonData(item.outputs, item.node_type == "loop"?"最终循环变量":item.node_type == "iteration"?"输出":"输出数据")}
        </div>
      )}
    </div>
  );
});

export default TrackItem;
