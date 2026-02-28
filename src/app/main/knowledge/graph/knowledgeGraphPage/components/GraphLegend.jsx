"use client";

import React, { useState, forwardRef } from "react";
import styles from "../page.module.css";

const GraphLegend = forwardRef((props, graphLegendRef) => {
  if (!props.tags || props.tags.length === 0) {
    return null;
  }

  return (
    <div className={styles["legend-container"]}>
      {props.tags.map((tag, index) => (
        <div key={tag.tagName} className={styles["legend-item"]}>
          <span
            className={styles["tag"]}
            style={{ backgroundColor: tag.color }}
          ></span>
          <span className={styles["tag-text"]} title={tag.tagName}>
            {tag.tagName}
          </span>
        </div>
      ))}
    </div>
  );
});

export default GraphLegend;
