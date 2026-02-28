import React, { useState, useEffect } from "react";
import { InfoCircleFilled } from "@ant-design/icons";
import styles from "../page.module.css";
import { standardGraphData } from "@/utils/graph/graph";
import { ReactSVG } from "react-svg";

const PathQueryList = ({ sourceAndTarget, pathList, isQuery, core }) => {
  const [currentPath, setCurrentPath] = useState("");

  // 重置选中状态
  useEffect(() => {
    if (!isQuery) {
      setCurrentPath("");
    }
  }, [isQuery]);

  // 处理路径选中
  const handleActive = (item, index) => {
    setCurrentPath(index);
    const elements = standardGraphData({ vertexVOList: item.vertexVOList });

    if (core) {
      core.batch(() => {
        const $selected = core.$(":selected");
        $selected.unselect();
        [...elements.nodes, ...elements.edges].forEach((element) => {
          core.filter(`[id='${element.data.id}']`).select();
        });
      });
    }
  };

  return (
    <div className={styles["path-list-wrapper"]}>
      <div className={styles["path-source-target-container"]}>
        <InfoCircleFilled style={{ color: "#34c7b0" }} />
        <span>{sourceAndTarget.source}</span>
        <span>—</span>
        <span>{sourceAndTarget.target}</span>
        <span className={styles["path-total-container"]}>
          共计{" "}
          <span className={styles["path-total-number"]}>
            {pathList.length}条
          </span>
          线路
        </span>
      </div>
      <ul className={styles["path-list-result"]}>
        {pathList.map((item, index) => (
          <li
            key={item.hopCount + index}
            className={currentPath === index ? styles["active"] : ""}
            onClick={() => handleActive(item, index)}
          >
            {(index === 0 || item.hopCount === pathList[0].hopCount) && (
              <span className={styles["path-short"]}>最短路径</span>
            )}
            <span className={styles["path-name-label"]}>线路{index + 1}：</span>
            <span className={styles["path-number"]}>{item.hopCount}跳</span>
            <ReactSVG
              className={styles["util-icon-svg"]}
              style={{ marginLeft: "auto", fontSize: "18px" }}
              src="/knowledge/graph/path.svg"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PathQueryList;
