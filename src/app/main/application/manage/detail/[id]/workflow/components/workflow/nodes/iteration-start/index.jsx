import React, { useRef, useEffect, useState } from "react";
import { Handle, Position, Background, NodeResizeControl } from "@xyflow/react";
import styles from "./iterationStart.module.css";
import { useStore } from "@/store/index";
import { ExpandAltOutlined } from "@ant-design/icons";
import nodeStyles from "../node.module.css";
import Operator from "../../components/Operator";
import { NodeSourceHandle, NodeTargetHandle } from "../../node-handle";
const IterationStartNode = ({ id, data }) => {
  const {
    setPanelVisible,
    readOnly,
    setPannerNode,
    pannerNode,
    setRunVisible,
  } = useStore((state) => state);
  const contentRef = useRef(null);
  const [isFocus, setIsFocus] = useState(false);

  // 鼠标进入节点
  const handleMouseEnter = () => {
    setIsFocus(true);
  };
  // 鼠标离开节点
  const handleMouseLeave = () => {
    setIsFocus(false);
  };
  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={styles.iteration_start_node}
      >
        <img
          src="/workflow/start.png"
          className={styles.iteration_start_node_icon}
        />
        <NodeSourceHandle id={id} isFocus={isFocus} nodeId={id} />
      </div>
    </>
  );
};

export default IterationStartNode;
