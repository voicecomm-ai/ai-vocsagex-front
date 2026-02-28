import { Modal, Form, Input, Select, Button, Popover,Avatar  } from "antd";
import styles from "../manage.module.css";
import { useState, forwardRef, useImperativeHandle } from "react";
import IconSelectorPopover from "./IconSelectorPopover";
import { updateApplication } from "@/api/application";

/**
 * 表单验证规则配置
 */
const FORM_RULES = {
  name: [
    { required: true, message: "请输入应用名称" },
    { max: 50, message: "应用名称不能超过50个字符" },
  ],

};
const { TextArea } = Input;
const UpdateModel = forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAppInfo, setCurrentAppInfo] = useState({});
  const [iconLoading, setIconLoading] = useState(false);

 useImperativeHandle(ref, () => ({
  showModal
  }));

  /**
   * 显示模态框
   */
  const showModal = (appInfo) => {
    console.log(appInfo,'appInfo')
    setCurrentAppInfo(appInfo);
    form.setFieldsValue({
      name: appInfo.name,
      description: appInfo.description,
    });
    setModalVisible(true);
  };
  
  //关闭弹窗
  const closeModal = () => {
    setCurrentAppInfo({});
    setModalVisible(false);
  };

  // 编辑应用信息
  const editAppInfoEvent = (values) => {
     const formValues = form.getFieldsValue(); // 获取表单最新值
      const editParams = {
        ...currentAppInfo,
        ...formValues,
      };
      
      updateApplication(editParams)
        .then((res) => {
          setModalVisible(false);
          props.onUpdateSuccess();
        })
        .catch((error) => {
          console.error("更新应用信息失败:", error);
        });
  };

  /**
   * 模态框样式配置
   */
  const MODAL_STYLES = {
    content: {
      backgroundImage: 'url("/application/app_modal_back.png")',
      borderRadius: 24,
      padding: "24px 24px 32px",
      backgroundColor: "#fff",
      backgroundPosition: "top center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "100% auto",
    },
    header: {
      background: "transparent",
    },
  };
  return (
    <Modal
      open={modalVisible}
      onCancel={closeModal}
      className="app-custom-modal"
      width={640}
      height={440}
      title={<div style={{ fontSize: 24 }}>编辑信息</div>}
      footer={null}
      styles={MODAL_STYLES}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={currentAppInfo}
        onFinish={editAppInfoEvent}
      >
        {/* 应用图标和名称输入区域 */}
        <div style={{ display: "flex", marginTop: 20 }}>
          {/* 图标选择器 */}
          <Popover
            placement="rightTop"
            content={
              <IconSelectorPopover
                value={currentAppInfo.iconUrl}
                onChange={(val) =>
                  setCurrentAppInfo((prev) => ({
                    ...prev,
                    iconUrl: val,
                  }))
                }
                onLoadingChange={setIconLoading}
              />
            }
            arrow={false}
          >
            {iconLoading ? (
              <div className={styles["app-image"]}>
                <Spin spinning={iconLoading}></Spin>
              </div>
            ) : (
              <Avatar
                className={styles["app-image"]}
                shape="square"
                size={48}
                src={process.env.NEXT_PUBLIC_API_BASE + currentAppInfo.iconUrl}
              />
            )}
          </Popover>

          {/* 应用名称输入框 */}
          <Form.Item
            name="name"
            rules={FORM_RULES.name}
            style={{ flex: 1, marginBottom: 0, height: 48 }}
          >
            <Input
              placeholder="给你的应用起一个响亮的名字"
              showCount
              maxLength={50}
              style={{ height: 48 }}
            />
          </Form.Item>
        </div>

        {/* 应用描述输入框 */}
        <Form.Item name="description" style={{ marginTop: 20 }} rules={[{ required: true, message: "请输入应用描述" }]}>
          <TextArea
            rows={5}
            placeholder="描述该应用的内容，详细的描述可以让AI更好的理解并访问应用的内容"
            showCount
            maxLength={400}
          />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item style={{ marginTop: 32, textAlign: "right" }}>
          <Button
            style={{ marginRight: 16, width: 112 }}
            onClick={() => setModalVisible(false)}
          >
            取消
          </Button>
          <Button type="primary" htmlType="submit" style={{ width: 112 }}>
            确定
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default UpdateModel;
