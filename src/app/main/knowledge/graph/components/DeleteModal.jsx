"use client";
import { useMemo, useState } from "react";
import { Modal, Button } from "antd";

export default function DeleteModal({
  visible,
  onCancel,
  onOk,
  title = "删除确认",
  content = "删除后数据无法恢复，是否继续？",
  loading = false,
  // isSurvival,
}) {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      closable={false}
      centered={true}
      maskClosable={!loading}
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
        <img src="/del_tip.png" alt="" style={{ width: 64, height: 64 }} />
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
            <Button
              style={{ borderRadius: 8 }}
              onClick={onCancel}
              loading={loading}
            >
              取消
            </Button>
            <Button
              type="primary"
              danger
              // disabled={isSurvival ? true : false}
              style={{
                marginLeft: 12,
                // background: isSurvival ? "#e0e0e0ff" : "#EE5A55",
                borderRadius: 8,
                // color: isSurvival ? "#000000" : "",
              }}
              onClick={onOk}
              loading={loading}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
