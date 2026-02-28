import React, { memo } from "react";
import { Progress } from "antd";
import styles from "../page.module.css";

const ExtractProgress = memo(({ uploadProgress, isUploadFinish }) => {
  return (
    <div className={styles["extract-progress__container"]}>
      <div className={styles["import-icon__wrapper"]}>
        <img
          style={{ width: "48px" }}
          src={
            isUploadFinish
              ? "/knowledge/extract/imported.svg"
              : "/knowledge/extract/importing.svg"
          }
        />
      </div>
      <div className={styles["import-message__info"]}>
        <div className={styles["import-message__text"]}>
          {isUploadFinish ? "文件导入成功" : "文件导入中，请稍候..."}
        </div>

        <Progress
          percent={uploadProgress}
          strokeColor={isUploadFinish ? "#34C7B0" : "#4070FD"}
          status={isUploadFinish ? "success" : "active"}
          showInfo={false}
        />
        {/* 进度百分比文本（动态类名） */}
        <span
          className={`${styles["import-message-progress"]} ${
            isUploadFinish ? styles["upload-success-color"] : ""
          }`}
        >
          {uploadProgress}%
        </span>
      </div>
    </div>
  );
});

export default ExtractProgress;
