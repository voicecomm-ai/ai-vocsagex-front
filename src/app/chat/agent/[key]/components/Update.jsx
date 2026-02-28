// 导入 Ant Design 组件
import {
  Modal,
  Input,
  Button,
  Form,
  message,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
// 导入 React hooks
import { forwardRef, useImperativeHandle, useState } from "react";
// 导入 Next.js 路由
import { useParams } from "next/navigation";
// 导入样式文件
import styles from "../index.module.css";
// 导入API
import { updateConversationTitleByUrlKey } from "@/api/chat";
/**
 * 重命名对话标题模态框组件
 * 用于修改对话的名称
 */
const UpdateConversationTitleModal = forwardRef((props, ref) => {
  const params = useParams();
  const urlKey = params?.key;

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
  }));

  // 基础状态管理
  const [open, setOpen] = useState(false); // 控制模态框显示/隐藏
  const [loading, setLoading] = useState(false); // 加载状态
  const [conversationId, setConversationId] = useState(""); // 对话ID
  const [form] = Form.useForm(); // 表单实例

  /**
   * 取消操作，关闭模态框并重置状态
   */
  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setConversationId("");
  };

  /**
   * 显示模态框
   * @param {Object} conversation - 对话对象，包含id和conversationTitle
   */
  const showModal = (conversation) => {
    if (conversation) {
      setConversationId(conversation.id);
      form.setFieldsValue({
        conversationTitle: conversation.conversationTitle || "",
      });
    }
    setOpen(true);
  };

  /**
   * 提交重命名
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const title = values.conversationTitle?.trim();
      
      if (!title) {
        message.warning("对话名称不能为空");
        return;
      }

      setLoading(true);
      const token = localStorage.getItem("conversationToken");
      const data = {
        urlKey: urlKey,
        id: conversationId,
        token: token,
        conversationTitle: title,
      };

      updateConversationTitleByUrlKey(data)
        .then((res) => {
          message.success("重命名成功");
          handleCancel();
          // 触发父组件刷新对话列表
          if (props.onSuccess) {
            props.onSuccess();
          }
        })
        .catch((err) => {
          console.error("重命名失败:", err);
    
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  return (
    <Modal
      open={open}
      centered
      footer={null}
      closeIcon={false}
      width="480px"
      onCancel={handleCancel}
      zIndex={1999}
      styles={{
        content: {
          padding: 0,
          borderRadius: '24px',
      
        },
      }}
    >
      <div className={styles.update_content}>
        {/* 模态框标题栏 */}
        <div className={styles.update_header}>
          <div className={styles.update_title}>重命名</div>
          <div className={styles.update_close} onClick={handleCancel}>
            <CloseOutlined />
          </div>
        </div>

        {/* 表单内容区域 */}
        <div className={styles.update_body}>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label={
                <span>
                  对话名称
                </span>
              }
              name="conversationTitle"
              rules={[
                {
                  required: true,
                  message: "请输入对话名称",
                },
                {
                  whitespace: true,
                  message: "对话名称不能为空格",
                },
              ]}
            >
              <Input
                placeholder="请输入对话名称"
                maxLength={20}
                showCount
                style={{height:'36px',lineHeight:'36px',borderRadius:'8px'}}
           
              />
            </Form.Item>
          </Form>
        </div>

        {/* 模态框底部按钮区域 */}
        <div className={styles.update_footer}>
          <Button
            className={styles.update_footer_btn}
            onClick={handleCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            className={styles.update_footer_btn_save}
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default UpdateConversationTitleModal;
