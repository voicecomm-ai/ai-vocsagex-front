"use client";
import { Modal, message, Button } from "antd";
import { forwardRef, useImperativeHandle, useState } from "react";

// props:
// - optionMap: { [option]: { title, content, action } }
// - onSuccess: 操作完成回调
const DeleteModal = forwardRef(({ onSuccess }, ref) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({}); // 存储 title, content, action 等
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 暴露 open 方法供父组件控制弹窗
  useImperativeHandle(ref, () => ({
    open(config) {
      setConfig(config);
      setSelectedKeys(config.keys || []); // 兼容 keys 作为参数传入
      setVisible(true);
    },
  }));

  const handleOk = async () => {
    if (!config?.action) return;
    try {
      setConfirmLoading(true);
      await config.action(selectedKeys);
      message.success("操作成功");
      // ✅ 优先使用 config 中自定义的 onSuccess，其次才是 props.onSuccess
      if (typeof config.onSuccess === "function") {
        config.onSuccess();
      } else {
        onSuccess?.();
      }
      setConfirmLoading(false);
    } catch (err) {
      if(config.title !== '上架'){
        message.error("操作失败，请稍后重试");
      }
    } finally {
      setVisible(false);
    }
  };

  const handleCancel = () => setVisible(false);

  return (
    <Modal
      open={visible}
      closable={false}
      centered={true}
      styles={{
        content: {
          backgroundImage: `url("${
            config?.backgroundImage || "/model/bg_delete.png"
          }")`,
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
        <img
          src={config?.iconImage || "/del_tip.png"}
          alt=""
          style={{ width: 64, height: 64 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#364052",
              fontWeight: 500,
              fontSize: 20,
              wordBreak: "break-all",
            }}
          >
            {config?.title}
          </div>
          <div
            style={{
              color: "#666E82",
              fontSize: 14,
              lineHeight: "20px",
              marginTop: 6,
              height:46
            }}
          >
            {config?.content}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button style={{ borderRadius: 8 }} onClick={handleCancel}
              loading={confirmLoading}>
              取消
            </Button>
            <Button
              type="primary"
              style={{
                marginLeft: 12,
                background: config?.btnColor || "#EE5A55",
                borderRadius: 8,
              }}
              onClick={handleOk}
              loading={confirmLoading}
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default DeleteModal;
