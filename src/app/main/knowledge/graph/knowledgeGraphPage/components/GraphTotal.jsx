"use client";

import React, { useState, forwardRef, useEffect } from "react";
import styles from "../page.module.css";
import { useStore } from "@/store/index";
import { getNodeNumberApi } from "@/api/graphVisualization";

const GraphTotal = forwardRef((props, graphTotalRef) => {
  const { currentNamespaceId } = useStore((state) => state);
  const [staticResult, setStaticResult] = useState({
    nodeNum: 0,
    edgeNum: 0,
  });

  const getGraphTotal = async () => {
    await getNodeNumberApi({ spaceId: currentNamespaceId }).then((res) => {
      setStaticResult(res.data);
    });
  };

  useEffect(() => {
    getGraphTotal();
  }, []);

  return (
    <div className={styles["graph-total-container"]}>
      <div className={styles["graph-item-wrapper"]}>
        <div className={styles["graph-item"]}>
          <img
            src="/knowledge/graph/current_node.svg"
            style={{ marginLeft: "10px" }}
          />
          图谱包含节点：
          <span className={styles["graph-number"]}>{staticResult.nodeNum}</span>
          <span className={styles["graph-unit"]}>个</span>
        </div>
        <div className={styles["graph-item"]}>
          <img
            src="/knowledge/graph/show_node.svg"
            style={{ marginLeft: "10px" }}
          />
          当前展示节点：
          <span className={styles["graph-number"]}>
            {props.currentShowNodes}
          </span>
          <span className={styles["graph-unit"]}>个</span>
        </div>
        <div className={styles["graph-item"]}>
          <img
            src="/knowledge/graph/show_edge.svg"
            style={{ marginLeft: "10px" }}
          />
          图谱包含边：
          <span className={styles["graph-number"]}>{staticResult.edgeNum}</span>
          <span className={styles["graph-unit"]}>条</span>
        </div>
      </div>
    </div>
  );
});

export default GraphTotal;
