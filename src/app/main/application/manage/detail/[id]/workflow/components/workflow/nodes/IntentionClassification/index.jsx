// components/CustomNode.jsx or .tsx
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import styles from "../node.module.css";
import pageStyles from "./style.module.css";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import Operator from "../../components/Operator";
import { Input, Popover, Tooltip, Drawer,Typography } from "antd";
const { Text } = Typography;
import codeStyles from "../CodeExtractor/runCode.module.css";
import debounce from "lodash/debounce";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const actionList = [
  {
    name: "重命名",
    icon: "/workflow/update.png",
    type: "rename",
  },
  {
    name: "复制",
    icon: "/workflow/copy.png",
    type: "copy",
  },
  {
    name: "删除",
    icon: "/workflow/delete.png",
    type: "delete",
  },
];

const IntentionClassification = ({ id, data, selected, type }) => {
  const { updateNodeDetail, isNodeConnected } = useNodesInteractions();
  const [isFocus, setIsFocus] = useState(false);
  const reactFlowInstance = useReactFlow();
  const { setPanelVisible, readOnly, setPannerNode, pannerNode, setRunVisible } = useStore(
    (state) => state
  );
  useEffect(() => {}, []);

  //节点点击事件
  const onNodeClick = () => {
    setRunVisible(false);
    setPannerNode({ id, data, type });
    setPanelVisible(true);
  };

  // 打开测试运行Llm弹窗
  const handleRun = (event) => {
    // 阻止事件冒泡
    event.stopPropagation();

    const nodeData = reactFlowInstance.getNodes().find((item) => item.id === id);

    setPanelVisible(false);
    setPannerNode(nodeData);
    setRunVisible(true);
  };

  // 鼠标进入节点
  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  // 鼠标离开节点
  const handleMouseLeave = () => {
    setIsFocus(false);
  };
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${pageStyles["intention_node"]} ${
        pannerNode && pannerNode.id == id ? styles["selected_node"] : ""
      }`}
    >
      <div onClick={() => onNodeClick()} className={styles["custom_node_content"]}>
        <div className={styles["custom_node_header"]}>
          <img className={styles["custom_node_header_icon"]} src={`/workflow/${data.type}.png`} alt="" />

          <div className={styles["custom_node_header_title"]}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}> {data.title}</span></Text>
            </div>
          <div className={styles["custom_node_header_type"]}>流程控制</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div className={styles["custom_node_actions"]} onClick={(e) => e.stopPropagation()}>
              <Operator id={id}></Operator>
            </div>
          )}
        </div>

        {data.modelInfo && (
          <div className={pageStyles["panel-if-condition-left-item"]} style={{ marginTop: 12 }}>
            <div className={styles["start_panel_variable_item_left"]}>
              {data.modelInfo.iconUrl && (
                <img
                  alt=''
                  className={codeStyles["model_label_render_img"]}
                  src={process.env.NEXT_PUBLIC_API_BASE + data.modelInfo.iconUrl}
                />
              )}
              <div className={codeStyles["model_label_render_title"]}>{data.modelInfo.name}</div>
              <div className={codeStyles["model_label_render_type"]}>
                {data.modelInfo.classificationName ? data.modelInfo.classificationName : null}
              </div>
              {data.modelInfo && data.modelInfo.tagList && data.modelInfo.tagList.length > 0 && (
                <div className={codeStyles["model_label_render_tag"]}>
                  {data.modelInfo && data.modelInfo.tagList.map((tag) => tag.name).join(",")}
                </div>
              )}
            </div>
          </div>
        )}
        {data.classes && (
          <>
            {data.classes.map((item, index) => (
              <div
                key={item.id}
                className={pageStyles["panel-if-condition-left-item"]}
                style={{ position: "relative" }}
              >
                <div className={styles["start_panel_variable_item_left"]}>
                  <span>分类{index + 1}</span>
                  <div className={styles["start_panel_variable_item_left_content"]}>
                    <div className={styles["start_panel_variable_name"]}>{item.name}</div>
                  </div>
                </div>
                {/* 为每个分类项添加句柄 */}
                <NodeSourceHandle id={item.id} isFocus={isFocus} nodeId={id} suffix={false} childHandle={true} />  
              </div>
            ))}
          </>
        )}

        {data.desc && <div className={styles["custom_node_desc"]}>{data.desc}</div>}
      </div>
       <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id}  />  
      {/* 右边的句柄 */}
      {/* <Handle
        type='source'
        id={id}
        className={
          isNodeConnected(id, "source")
            ? styles.customHandleSourceNoContent
            : (pannerNode && pannerNode.id == id) || isFocus
            ? styles.customHandleSourceNoContent
            : styles.customHandleHidden
        }
        position={Position.Right}
      /> */}
    </div>
  );
};

export default IntentionClassification;
