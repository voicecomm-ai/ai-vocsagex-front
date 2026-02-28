import React from 'react';
import { Divider } from 'antd';
import styles from "../run/test.module.css";

const RunStatus = ({ runData }) => {
  if (!runData) {
    return null;
  }

  return (
    <div
      className={`${styles["run_status"]} ${styles[runData.status]}`}
    >
      <img
        className={styles["run_status_img"]}
        src={`/workflow/run/${runData.status}.png`}
        alt={runData.status}
      />
      <div className={styles["run_status_content"]}>
        {runData.status === "running" && (
          <div className={styles["run_status_text"]}>RUNNING </div>
        )}
        {runData.status !== "running" && (
        <div className={styles['run_status_right']}>
        <div
          className={`${styles["run_status_text"]} ${
            runData.status !== "running"
              ? styles["un_status_tex_flex"]
              : ""
          }`}
        >
          {runData.elapsed_time || 0} S{" "}
        </div>
        <Divider type="vertical" />
        <div
          className={`${styles["run_status_text"]} ${
            runData.status !== "running"
              ? styles["un_status_tex_flex"]
              : ""
          }`}
        >
          {" "}
          {runData.outputs?.usage?.total_tokens || 0} {" "} Tokens
        </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default RunStatus;
