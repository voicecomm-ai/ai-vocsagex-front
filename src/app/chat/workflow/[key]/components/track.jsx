import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import styles from "./workflow.module.css";
import { Empty } from "antd";
import { getWorkflowRunNodeList } from "@/api/workflow";
import RunLoop from "../../../../components/workflow/run/loop";

const RunTrack = forwardRef((props, ref) => {
  const [trackData, setTrackData] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set()); //展开的节点
  useImperativeHandle(ref, () => ({
    updateStepStatus,
  }));
  const updateStepStatus = () => {
    getWorkflowRunDetailData();
  };
  //获取工作流运行详情
  const getWorkflowRunDetailData = () => {
    getWorkflowRunNodeList({ workflowRunId: props.runId })
      .then((res) => {
        let data = res.data || [];
        data.forEach((item) => {
          item.node_type = item.node_type.toLowerCase();
        });
        setTrackData(data);
      })
      .catch((err) => {
        console.log(err, "err");
      });
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
  //获取节点图标
  // 渲染节点图标
  const getNodeIcon = (obj, nodeId) => {
    let type =obj.node_type;
    if (!type) {
      return "/workflow/default.png"; // 默认图标
    }

    // MCP节点需要特殊处理
    if (type === "mcp") {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
        return baseUrl +obj.iconUrl; 
    }
    // agent节点工作流节点需要特殊处理
   if (type === "agent" || type === "workflow") {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "";
    return baseUrl + obj.iconUrl;
    
    }
    // 其他节点类型使用标准图标
    return `/workflow/${type}.png`;
  };
  useEffect(() => {
    if (!props.runId) {
      return;
    }
    getWorkflowRunDetailData();
  }, [props.runId]);

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
  return (
    <div className={styles["run_track"]}>
      {!trackData ||
        (trackData.length === 0 && (
          <div className={styles["run_result_empty"]}>
            <Empty
              description="暂无追踪"
              image={"/find/empty.png"}
              styles={{ image: { height: 220, width: 220 } }}
            />
          </div>
        ))}
      {trackData && trackData.length > 0 && (
        <div className={styles["track_steps"]}>
          {trackData.map((step, index) => (
            <div key={step.id} className={styles["track_step"]}>
              <div className={styles["step_number"]}>{index + 1}</div>
              <div className={styles["step_content"]}>
                <div
                  onClick={() => toggleExpand(step.id)}
                  className={`${styles["step_content_header"]} ${step.node_type == "loop" ? styles.loop_header : ""}`}
                >
                   {step.node_type == "loop" && (
                   <img
          src="/workflow/arrow_bottom.png"
          alt="展开"
          className={`${styles.track_step_expand} ${
            expandedItems.has(step.id) ? styles.expanded : ""
          }`}
        
        />
        )}
                  <img
                    className={styles["step_icon"]}
                    src={getNodeIcon(step, step.node_id)}
                    alt={step.node_type}
                  />
                  <div className={styles["step_label"]}>{step.title}</div>
                  <div className={styles["step_status"]}>
                    <img
                      className={styles["step_status_img"]}
                      src={getStatusIcon(step.status)}
                      alt={step.status}
                    />
                  </div>
                </div>
                {/* 展开的内容 */}
                {expandedItems.has(step.id) && (
                  <div className={styles["step_content_content"]}>
                    {/* 渲染循环节点 */}
                    {step.node_type == "loop" && <RunLoop item={step} />}
                  </div>
                )}
              </div>
              {index < trackData.length - 1 && (
                <div className={styles["step_connector"]}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default RunTrack;
