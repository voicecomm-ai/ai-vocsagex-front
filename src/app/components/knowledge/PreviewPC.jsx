import { useState } from "react";
import { message, Button, Tooltip } from "antd";
import PreviewModal from "./PreviewModal";
import { getURLFileName, getFileType } from "@/utils/fileValidation";

const FilePreview = ({ record, textAlign }) => {
  // 控制预览弹窗显示状态
  const [previewVisible, setPreviewVisible] = useState(false);
  // 当前预览的文件信息
  const [currentFile, setCurrentFile] = useState({
    url: "",
    name: "",
  });

  // 处理文件预览
  const handlePreview = () => {
    const { propertyType, extra, defaultValueAsString: fileUrl } = record;

    // 验证文件地址
    if (!fileUrl || typeof fileUrl !== "string") {
      message.warning("没有可预览的文件地址");
      return;
    }

    // 提取文件名
    const fileName = getURLFileName(fileUrl);

    // 设置当前文件信息并显示弹窗
    setCurrentFile({
      url: fileUrl,
      name: fileName,
    });

    if (propertyType === "STRING" && extra === "otherFile") {
      window.open(fileUrl, "_blank");
    } else {
      setPreviewVisible(true);
    }
  };

  // 处理文件下载
  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = currentFile.url;
      link.target = "_blank";
      link.download = currentFile.name; // 指定下载文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      message.error("下载失败，请手动访问链接");
      console.error("下载错误:", err);
    }
  };

  const fileType = getFileType(currentFile.url);
  const fileName = getURLFileName(record.defaultValueAsString);

  return (
    <>
      {/* 预览按钮 */}
      <div
        style={{
          display: "flex",
          justifyContent: textAlign && textAlign == "left" ? "start" : "center",
        }}
      >
        {/* <Tooltip title={fileName}> */}
        <Button
          type="link"
          onClick={handlePreview}
          style={{
            padding: 0,
            maxWidth: textAlign ? "100%" : "130px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            textAlign: textAlign ? textAlign : "center",
          }}
          title={fileName}
        >
          {fileName}
        </Button>
        {/* </Tooltip> */}
      </div>

      {/* 预览弹窗 */}
      <PreviewModal
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        fileData={currentFile}
        fileType={fileType}
      />
    </>
  );
};

export default FilePreview;
