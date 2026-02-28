"use client";
import { useState } from "react";
import { Modal, Button } from "antd";

export default function DeleteFailModal({
  visible,
  onCancel,
  onOk,
  title = "无法删除",
  content = "当前图谱知识库关联了抽取任务故不可删除，如需删除，请您删除关联的抽取任务",
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
      footer={null}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <img src="/close_error.png" alt="" style={{ width: 64, height: 64 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "364052",
              fontWeight: 500,
              fontSize: 20,
              wordBreak: "break-all",
            }}
          >
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
            {/* <Button style={{ borderRadius: 8 }} onClick={onCancel}>
              取消
            </Button> */}
            <Button
              type="primary"
              danger
              style={{ marginLeft: 12, background: "#EE5A55", borderRadius: 8 }}
              onClick={onOk}
            >
              知道了
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
