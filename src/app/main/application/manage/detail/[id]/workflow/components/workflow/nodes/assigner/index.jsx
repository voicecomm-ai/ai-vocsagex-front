// components/CustomNode.js or .tsx
import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "../node.module.css";
import assignerStyles from "./assigner.module.css";
import "@xyflow/react/dist/style.css";
import Operator from "../../components/Operator";
import { useStore } from "@/store/index";
import { useNodesInteractions } from "../../hooks";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
import { useAssigner } from "./hooks/use-assigner";
import { getUuid } from "@/utils/utils";
import { Typography } from "antd";
const { Text } = Typography;
const AssignerNode = ({ id, data, selected, type }) => {
  const { isNodeConnected } = useNodesInteractions();
  const { handleVariableData } = useAssigner();
  const [isFocus, setIsFocus] = useState(false);
  const [variableInfo, setVariableInfo] = useState([]);

  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    setRunVisible,
    panelVisible,
    pannerNode,
    changeId,
  } = useStore((state) => state);

  //节点点击事件
  const onNodeClick = (node) => {
    setRunVisible(false);
    setPanelVisible(true);
    setPannerNode({ id, data, type });
  };

  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  const handleMouseLeave = () => {
    setIsFocus(false);
  };

  useEffect(() => {
    if (data.items) {
      let variableArr = handleVariableData(data.items, id);
      setVariableInfo(variableArr);
    }
  }, [data, changeId]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${styles["custom_node"]} ${assignerStyles["assigner_node"]} ${
        pannerNode && pannerNode.id === id ? styles["selected_node"] : ""
      }`}
    >
      {/* ✅ 只有选中节点时显示按钮 */}

      <div
        data-action="panel"
        onClick={() => onNodeClick({ id, data })}
        className={styles["custom_node_content"]}
      >
        <div className={styles["custom_node_header"]}>
          <img
            className={styles["custom_node_header_icon"]}
            src={`/workflow/${data.type}.png`}
            alt=""
          />

          <div className={styles["custom_node_header_title"]}>
            <Text style={{maxWidth: 110}} ellipsis={{ tooltip: data.title }}>
              <span style={{fontSize: 16,fontWeight: '600',color: "#101A28"}}> {data.title}</span></Text>
            </div>
          <div className={styles["custom_node_header_type"]}>数据处理</div>
          {((pannerNode && pannerNode.id == id) || isFocus) && !readOnly && (
            <div
              className={styles["custom_node_actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              <Operator isEnd={true} id={id}></Operator>
            </div>
          )}
        </div>
        {data.items && (
          <div className={assignerStyles["panel_variable_content"]}>
            {variableInfo.map(
              (item) =>
                item.variable_name && (
                  <div
                    className={assignerStyles["node_variable_item"]}
                    key={getUuid()}
                  >
                    <div className={assignerStyles["node_variable_item_left"]}>
                      {item.nodeType && (
                        <img
                          className={assignerStyles["node_variable_item_img"]}
                          src={`/workflow/${item.nodeType}.png`}
                          alt=""
                        />
                      )}

                      {item.nodeName && (
                        <div
                          className={assignerStyles["node_variable_item_title"]}
                        >
                          {item.nodeName} /
                        </div>
                      )}
                      <div
                        className={
                          assignerStyles[
                            "start_panel_variable_item_left_content"
                          ]
                        }
                      >
                        <div
                          className={
                            assignerStyles["start_panel_variable_name"]
                          }
                        >
                          {`{{${item.variable_name}}}`}
                        </div>
                      </div>
                    </div>
                    <div className={assignerStyles["node_variable_item_right"]}>
                      {item.writeModelTitle}{" "}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
        {data.desc && (
          <div className={styles["custom_node_desc"]}>{data.desc}</div>
        )}
      </div>

      <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
      <NodeTargetHandle id={id} isFocus={isFocus} nodeId={id} />
    </div>
  );
};

export default AssignerNode;
