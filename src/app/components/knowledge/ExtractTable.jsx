import React, { useRef, useEffect, useState } from "react";
import styles from "./com.module.css";
import PreviewModal from "./PreviewModal";
import { getURLFileName, getFileType } from "@/utils/fileValidation";

const ExtractTable = ({ tableXmlText }) => {
  const tableContainer = useRef(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState({
    url: "",
    name: "",
  });

  // 监听点击事件
  useEffect(() => {
    const handleClick = (event) => {
      if (event.target instanceof HTMLImageElement) {
        const imageSrc = event.target.src;

        const fileName = getURLFileName(imageSrc) || "预览图片";
        const fileType = getFileType(imageSrc);

        setCurrentFile({
          url: imageSrc,
          name: fileName,
        });
        setPreviewVisible(true);
      }
    };

    const container = tableContainer.current;
    if (container) {
      container.addEventListener("click", handleClick);
    }

    // 清理事件监听
    return () => {
      if (container) {
        container.removeEventListener("click", handleClick);
      }
    };
  }, []);

  const fileType = getFileType(currentFile.url);

  return (
    <>
      <div className={styles["extract-table__wrapper"]} ref={tableContainer}>
        <div dangerouslySetInnerHTML={{ __html: tableXmlText }} />
      </div>
      <PreviewModal
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        fileData={currentFile}
        fileType={fileType}
      />
    </>
  );
};

export default ExtractTable;
