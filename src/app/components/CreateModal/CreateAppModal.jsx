// React 核心库
import { forwardRef, useImperativeHandle, useState } from "react";
// Next.js 路由
import { useRouter } from "next/navigation";
// Ant Design 组件库
import { Modal, Input, Button, Popover, Avatar, Form, Spin } from "antd";
// 样式文件
import styles from "./page.module.css";
// API 接口
import { addApplication } from "@/api/application";
import { addAgentInfo } from "@/api/agent";
// 自定义组件
import IconSelectorPopover from "../../main/application/manage/components/IconSelectorPopover";

// 常量定义
const DEFAULT_ICONS = [
  "/file/voicesagex-console/defaultAppIcon/1.png",
  "/file/voicesagex-console/defaultAppIcon/2.png",
  "/file/voicesagex-console/defaultAppIcon/3.png",
  "/file/voicesagex-console/defaultAppIcon/4.png",
  "/file/voicesagex-console/defaultAppIcon/5.png",
  "/file/voicesagex-console/defaultAppIcon/6.png",
  "/file/voicesagex-console/defaultAppIcon/7.png",
];

const FORM_RULES = {
  name: [
    { required: true, message: "请输入应用名称" },
    {
      validator: (_, value) => {
        // 仅在有输入但全为空格时校验，空值由 required 处理，避免重复提示
        if (typeof value === "string" && value.length > 0 && !value.trim()) {
          return Promise.reject(new Error("请输入应用名称"));
        }
        return Promise.resolve();
      },
    },
    { max: 50, message: "应用名称不能超过50个字符" },
  ],

  description: [
    { required: true, message: "请输入应用描述" },
    {
      validator: (_, value) => {
        // 仅在有输入但全为空格时校验，空值由 required 处理，避免重复提示
        if (typeof value === "string" && value.length > 0 && !value.trim()) {
          return Promise.reject(new Error("请输入应用描述"));
        }
        return Promise.resolve();
      },
    },
    { max: 400, message: "应用描述不能超过400个字符" },
  ],
};

const MODAL_STYLES = {
  content: {
    backgroundImage: `url("/layout/create/create_back.png")`,
    borderRadius: 24,
    padding: "36px 40px 10px",
    backgroundColor: "#fff",
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% auto",
  },
  header: {
    background: "transparent",
  },
};

/**
 * 应用类型文本映射
 * 将应用类型值转换为对应的中文显示文本
 */
const  TYPE_TEXT_MAP = {
  agent: "智能体",
  workflow: "工作流",
  multi_agent: "多智能体合作",
};
/**
 * 创建应用模态框组件
 * 支持创建智能体和工作流两种类型的应用
 * @param {Object} props - 组件属性
 * @param {Object} ref - 组件引用
 */
const CreateAppModal = forwardRef((props, ref) => {
  // 路由实例
  const router = useRouter();
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
  }));

  // 状态管理
  const [open, setOpen] = useState(false); // 控制模态框显示/隐藏
  const [createBtnLoading, setCreateBtnLoading] = useState(false); // 创建按钮加载状态
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICONS[0]); // 选中的图标
  const [iconLoading, setIconLoading] = useState(false); // 图标加载状态
  const [type, setType] = useState(""); // 应用类型：agent(智能体) 或 workflow(工作流)
  
  // 表单实例
  const [form] = Form.useForm();
  /**
   * 关闭模态框
   */
  const handleCancel = () => {
    setOpen(false);
  };

  /**
   * 显示模态框
   * @param {string} type - 应用类型：'agent' 或 'workflow'
   */
  const showModal = (type) => {
    setSelectedIcon(randomIcon());
    setType(type);
    setOpen(true);
    form.resetFields(); // 重置表单字段
  };

  /**
   * 随机选择默认图标
   * @returns {string} 随机选择的图标路径
   */
  const randomIcon = () => {
    if (!Array.isArray(DEFAULT_ICONS) || DEFAULT_ICONS.length === 0) {
      return DEFAULT_ICONS[0];
    }
    const index = Math.floor(Math.random() * DEFAULT_ICONS.length);
    return DEFAULT_ICONS[index];
  };
  /**
   * 创建智能体并跳转到智能体管理页面
   * @param {string|number} id - 应用ID
   * @param {string} appType - 应用类型：'single' 或 'multiple'
   */
  const createAgentEvent = (id,appType) => {
    let data = { applicationId: id,'cooperateMode':appType=='multiple'?'Manager':null };
    addAgentInfo(data)
      .then(() => {
        // 创建智能体成功后，根据应用类型跳转到相应页面
        if(type==='multi_agent'){//多智能体合作应用，跳转到多智能体合作详情页
          router.push(`/main/application/manage/detail/${id}/agent/multi`);
        }else{//单智能体应用，跳转到单智能体详情页
          router.push(`/main/application/manage/detail/${id}/agent`);
        }
      })
      .catch((error) => {
        console.error("创建智能体失败:", error);
      });
  };

  /**
   * 根据应用类型跳转到相应页面
   * @param {string|number} appId - 应用ID
   * @param {string} appType - 应用类型
   */
  const navigateToAppPage = (appId, appType) => {
    switch (appType) {
      case "agent":
      createAgentEvent(appId,'single');
        break;
      case "multi_agent":
      createAgentEvent(appId,'multiple');
        break;
      case "workflow":
        router.push(`/main/application/manage/detail/${appId}/workflow`);
        break;
      default:
        router.push(`/main/application/manage`);
        break;
    }
  };

  /**
   * 表单提交处理函数
   * @param {Object} values - 表单数据
   */

  const createAppEvent = async () => {
    let values = await form.validateFields();
    onFinish(values);
  }
  const onFinish = (values) => {
    setCreateBtnLoading(true);
    let addType = type=='agent' || type=='multi_agent'?'agent':type;
    // 构建创建应用的参数（名称和描述去除首尾空格）
    const createParams = { 
      ...values,
      name: values.name?.trim() ?? "",
      description: values.description?.trim() ?? "",
      type: addType, 
      status: 0, 
      iconUrl: selectedIcon,
      agentType: type==='agent'?'single':type=='multi_agent'?'multiple':null,
    };
    
    addApplication(createParams)
      .then((res) => {
        // 根据应用类型跳转到相应页面
        navigateToAppPage(res.data, type);
        
        // 关闭模态框并重置状态
        setOpen(false);
        setCreateBtnLoading(false);
      })
      .catch((error) => {
        console.error("创建应用失败:", error);
        setCreateBtnLoading(false);
        setOpen(false);
      });
  };

  return (
    <Modal
      open={open}
      centered
      footer={null}
      closeIcon={false}
      width={630}
      styles={MODAL_STYLES}
      onCancel={handleCancel}
      zIndex={10000}
    >
      <div className={styles.small_create_modal}>
        {/* 模态框标题 */}
        <div className={styles.small_create_modal_title}>
          创建{TYPE_TEXT_MAP[type]}
        </div>
        <div>
          {/* 表单区域 */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{ name: "", description: "" }}
        
          >
            <p className={styles.tips}>填写应用信息</p>
            {/* 应用名称和图标选择区域 */}
            <div className={styles.name_box}>
              {/* 图标选择器 */}
              <Popover
                placement="rightTop"
                content={
                  <IconSelectorPopover
                    value={selectedIcon}
                    onChange={setSelectedIcon}
                    onLoadingChange={setIconLoading}
                  />
                }
                arrow={false}
              >
                {iconLoading ? (
                  <div className={styles.app_image}>
                    <Spin spinning={iconLoading}></Spin>
                  </div>
                ) : (
                  <Avatar
                    className={styles.app_image}
                    shape="square"
                    size={48}
                    src={process.env.NEXT_PUBLIC_API_BASE + selectedIcon}
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
            <Form.Item name="description" style={{ marginTop: 16 }} rules={FORM_RULES.description}>
              <Input.TextArea
                rows={5}
                placeholder="描述该应用的内容，详细的描述可以让AI更好的理解并访问应用的内容"
                showCount
                maxLength={400}
              />
            </Form.Item>
            {/* 操作按钮区域 */}
            <Form.Item>
              <div className={styles.footer_btn}>
                {/* 取消按钮 */}
                <Button
                  style={{
                    width: 112,
                    marginRight: 24,
                    borderRadius: 8,
                    height: 40,
                  }}
                  onClick={handleCancel}
                  loading={createBtnLoading}
                >
                  取消
                </Button>
                {/* 创建按钮 */}
                <Button
                  style={{ width: 112, borderRadius: 8, height: 40 }}
                  type="primary"
                  onClick={()=>createAppEvent()}
                  loading={createBtnLoading}
                >
                  创建
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Modal>
  );
});
export default CreateAppModal;
