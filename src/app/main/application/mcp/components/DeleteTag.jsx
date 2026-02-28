"use client";
import { useState } from "react";
import { Modal, Button } from "antd";

export default function DeleteTag({
  visible,
  onCancel,
  onOk,
  title = "删除确认",
  content = "删除后数据无法恢复，是否继续？",
}) {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      closable={false}
      centered={true}
      styles={{
        content: {
          backgroundImage: 'url("/model/bg_delete.png")',
          borderRadius: 24,
          padding: "26px",
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        header: {
          background: "transparent",
        },
      }}
      zIndex={99999}
      footer={null}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <img src="/del_tip.png" alt="" style={{ width: 64, height: 64 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "364052", fontWeight: 500, fontSize: 20,wordBreak: "break-all", }}>
            {title}
          </div>
          <div
            style={{
              color: "#666E82",
              fontSize: 14,
              lineHeight: "20px",
              marginTop: 4,
            }}
          >
            {content}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button style={{ borderRadius: 8 }} onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              danger
              style={{ marginLeft: 12, background: "#EE5A55", borderRadius: 8 }}
              onClick={onOk}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
