// PreviewModal.jsx
import { Modal, Button } from "antd";
import { useRef } from "react";

const PreviewModal = ({ visible, onCancel, fileData, fileType }) => {
  const { url, name } = fileData;

  // 音视频元素
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // 取消函数
  const handleCancel = () => {
    // 如果有音频正在播放，则暂停
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // 如果有视频正在播放，则暂停
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // 调用原始 onCancel 函数关闭模态框
    onCancel();
  };

  return (
    <Modal
      title={name}
      open={visible}
      onCancel={handleCancel}
      width="80%"
      maskClosable={true}
      footer={null}
    >
      <div style={{ textAlign: "center", maxHeight: "70vh", overflow: "auto" }}>
        {/* 图片预览 */}
        {fileType === "image" && (
          <img
            src={url}
            alt={name}
            style={{
              maxWidth: "100%",
              maxHeight: "60vh",
              objectFit: "contain",
            }}
          />
        )}

        {/* 视频预览 */}
        {fileType === "video" && (
          <video
            ref={videoRef}
            src={url}
            controls
            style={{
              maxWidth: "100%",
              maxHeight: "60vh",
            }}
          />
        )}

        {/* 音频预览 */}
        {fileType === "audio" && (
          <audio
            ref={audioRef}
            src={url}
            controls
            style={{ width: "100%", marginTop: "20px" }}
          />
        )}

        {/* 文档和其他类型 */}
        {(fileType === "document" || fileType === "other") && (
          <div style={{ padding: "20px" }}>
            <p>该文件类型建议在新窗口打开查看</p>
            <Button
              type="primary"
              onClick={() => window.open(url, "_blank")}
              style={{ marginTop: "10px" }}
            >
              在新窗口打开
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PreviewModal;
