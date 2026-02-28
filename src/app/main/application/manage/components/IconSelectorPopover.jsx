"use client";
import { useState } from "react";
import { Upload, Avatar, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { uploadApplicationIcon } from "@/api/application";
import imageCompression from "browser-image-compression";

// 默认图标列表（导出可复用）
export const defaultAppIcons = [
  "/file/voicesagex-console/defaultAppIcon/1.png",
  "/file/voicesagex-console/defaultAppIcon/2.png",
  "/file/voicesagex-console/defaultAppIcon/3.png",
  "/file/voicesagex-console/defaultAppIcon/4.png",
  "/file/voicesagex-console/defaultAppIcon/5.png",
  "/file/voicesagex-console/defaultAppIcon/6.png",
  "/file/voicesagex-console/defaultAppIcon/7.png",
];

export default function IconSelectorPopover({
  value,
  onChange,
  iconList = defaultAppIcons,
  onLoadingChange,
}) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const customUpload = async ({ file, onSuccess, onError }) => {
    try {
      setLoading(true);
      onLoadingChange(true);
      // 压缩图片
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedBlob = await imageCompression(file, options);

      // 转换为 File 对象
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
        lastModified: Date.now(),
      });

      // 上传
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await uploadApplicationIcon(formData);
      const imgUrl = res.data;
      const resultImgUrl = imgUrl.replace("/data1", `/file`);

      setImageUrl(resultImgUrl);
      onChange?.(resultImgUrl); // 通知父组件
      onSuccess(res, compressedFile);
    } catch (err) {
      message.error("上传失败");
      onError(err);
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  const uploadButton = (
    <button
      style={{ border: 0, background: "none", cursor: "pointer" }}
      type="button"
    >
      {loading ? (
        <LoadingOutlined />
      ) : (
        <img src="/application/add_pic.png"></img>
      )}
      <div style={{ marginTop: 4, color: "#8D96A7", fontSize: 12 }}>
        点击上传，支持格式：PNG,JPG,JPEG
      </div>
    </button>
  );

  return (
    <div style={{ padding: "4px 16px", width: 280 }}>
        <p style={{ fontSize: 14, color: "#121E3A", fontWeight: 500,margin:6 }}>
        上传应用图标
      </p>
         <Upload
        name="picture"
        listType="picture-card"
        className="avatar-uploader full-upload"
        showUploadList={false}
        customRequest={customUpload}
        accept="image/png, image/jpeg, image/jpg"
      >
        {/* {imageUrl ? (
          <img src={imageUrl} alt="avatar" style={{ width: 50 }} />
        ) : (
          uploadButton
        )} */}
        {uploadButton}
      </Upload>
      <p style={{ fontSize: 14, color: "#121E3A", fontWeight: 500,margin:6 }}>
        系统默认图标
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
          gap: "6px",
          marginBottom: 16,
        }}
      >
        {iconList.map((icon) => (
          <div
            key={icon}
            onClick={() => onChange?.(icon)}
            style={{
              padding: 2,
              border: value === icon ? "1px solid #DDDFE4" : "",
              borderRadius: 8,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Avatar
              shape="square"
              size={48}
              src={process.env.NEXT_PUBLIC_API_BASE + icon}
            />
          </div>
        ))}
      </div>

   
    </div>
  );
}
