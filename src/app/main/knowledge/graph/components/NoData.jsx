"use client";

import React, { forwardRef } from "react";
import styles from "./component.module.css";

const NoData = forwardRef(
  ({ content = "暂时没有可展示的图谱", color = "#f9fafd" }, ref) => {
    return (
      <div className={styles["no-data"]} style={{ background: color }}>
        <img
          className={styles["no-data-img"]}
          src="/knowledge/graph/nodata.png"
          alt=""
          srcSet=""
        />
        <div className={styles["no-data-text"]}>{content}</div>
      </div>
    );
  }
);

export default NoData;
