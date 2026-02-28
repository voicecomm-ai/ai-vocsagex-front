"use client";
import { useState,useRef } from "react";
import { ArrowLeftOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import {
  Row,
  Col,
  Avatar,
  Input,
  Button,
  Form,
  Popover,
  Modal,
  Tooltip,
  Spin,
} from "antd";
import styles from "./create.module.css";
import { useRouter } from "next/navigation";
import { addApplication } from "@/api/application";
import { addAgentInfo } from "@/api/agent";
import IconSelectorPopover from "../components/IconSelectorPopover";

const appTypeList = [
  {
    title: "智能体应用",
    type: "agent",
    describe:
      "适用于客户服务、销售咨询、技术支持等场景。智能体可以理解客户需求，提供即时的解答和帮助，从而提升企业的服务效率和用户满意度。",
    tips: "智能体应用依靠大模型进行自主决策，在与用户进行自然语言交互的时候，根据用户问题自主选择使用RAG、MCP服务、长期记忆等多种能力。智能体可以作为企业的智能助手，处理日常任务、提供信息查询和智能推荐等服务。",
    iconUrl: "/application/agent.svg",
  },
  {
    title: "工作流应用",
    type: "workflow",
    describe:
      "适用于需要结合大模型执行高确定性的业务逻辑的流程型应用，如可执行不同任务的智能助理工作流、自动化分析会议记录工作流等。",
    tips: "工作流应用支持用户通过画布自定义和编排业务流程，编排主体为原子节点，如大模型节点、知识库查询节点等快速实现业务逻辑设计及业务效果验证。",
    iconUrl: "/application/workflow.svg",
  },
  {
    title: "智能体编排应用",
    type: "agent_arrangement",
    describe:
      "适用于需要处理大量数据、进行复杂计算或执行多任务处理的场景。例如，在金融领域，可通过智能体编排搭建支持风险评估、投资组合优化、研报分析多种复杂能力的智能投顾系统。",
    tips: "智能体编排应用支持用户通过画布的自定义智能体执行逻辑，编排主体为智能体，如智能体节点、智能体组及节点等，可快速实现复杂多智能体协同的逻辑设计和业务效果验证。",
    iconUrl: "/application/agent_arrangement.svg",
  },
];

export default function CreateAppPage() {
  const router = useRouter();
  const [type, setAppType] = useState("agent");
  const [form] = Form.useForm();
  const [selectedIcon, setSelectedIcon] = useState(
    "/file/voicesagex-console/defaultAppIcon/pic_应用默认图1@2x.png"
  );
  const [createBtnLoading, setCreateBtnLoading] = useState(false);
  const isCreatingRef = useRef(false);

  const backHandle = () => {
    router.push("/main/application/manage");
  };

  const onFinish = (values) => {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    setCreateBtnLoading(true);
  
    const createParams = { ...values, type, status: 0, iconUrl: selectedIcon };
    addApplication(createParams)
      .then((res) => {
        if (type == "agent") {
          createAgentEvent(res.data);
        }   else if (type == "workflow") {
       router.push(`/main/application/manage/${res.data}/workflow`);
        }
        else {
        router.push(`/main/application/manage`);
        }
      })
      .catch(() => {
        setCreateBtnLoading(false);
        isCreatingRef.current = false;
      });
  };
  
  //创建智能体事件
  const createAgentEvent = (id) => {
    const data = { applicationId: id };
    addAgentInfo(data)
      .then(() => {
        router.push(`/main/application/manage/${id}/agent`);
      })
      .catch(() => {
        setCreateBtnLoading(false);
        isCreatingRef.current = false;
      });
  };
  const [iconLoading, setIconLoading] = useState(false);

  return (
    <div className={styles["create-app-page"]}>
      <div className={styles["page-title"]}>
        <img
          src="/application/back_icon.svg"
          className={styles["back-icon"]}
          onClick={backHandle}
        ></img>
        创建应用
      </div>

      <div className={styles["create-container"]}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ name: "", description: "" }}
          onFinish={onFinish}
        >
          <p className={styles["step-title"]}>第1步：选择应用类型</p>
          <Row gutter={16}>
            {appTypeList.map((item, index) => (
              <Col key={index} span={8}>
                <div
                  className={styles["type-card"]}
                  onClick={() => setAppType(item.type)}
                  style={{
                    border:
                      type === item.type
                        ? "2px solid #3772FE"
                        : "1px solid #dddfe4",
                  }}
                >
                  <img className={styles["type-icon"]} src={item.iconUrl}></img>
                  <div className={styles["type-title"]}>
                    {item.title}
                    <Tooltip
                      title={<div style={{ fontSize: 12 }}>{item.tips}</div>}
                      color={"rgba(54, 64, 82, 0.90)"}
                    >
                      <QuestionCircleOutlined
                        className={styles["question-icon"]}
                      />
                    </Tooltip>
                  </div>
                  <Tooltip
                    placement="rightTop"
                    title={<div style={{ fontSize: 12 }}>{item.describe}</div>}
                    color={"rgba(54, 64, 82, 0.90)"}
                  >
                    <div className={styles["type-describe"]}>
                      {item.describe}
                    </div>
                  </Tooltip>
                </div>
              </Col>
            ))}
          </Row>

          <p className={styles["step-title"]}>第2步：填写基本信息</p>
          <div className={styles["basic-info"]}>
            <div
              className={styles["info-name"]}
              style={{ display: "flex", alignItems: "center" }}
            >
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
                  <div className={styles["app-image"]}>
                    <Spin spinning={iconLoading}></Spin>
                  </div>
                ) : (
                  <Avatar
                    className={styles["app-image"]}
                    shape="square"
                    size={48}
                    src={process.env.NEXT_PUBLIC_API_BASE + selectedIcon}
                  />
                )}
              </Popover>
              <Form.Item
                name="name"
                rules={[
                  { required: true, message: "请输入应用名称" },
                  { max: 50, message: "应用名称不能超过50个字符" },
                ]}
                style={{ flex: 1, marginBottom: 0, height: 48 }}
              >
                <Input
                  placeholder="给你的应用起一个响亮的名字"
                  showCount
                  maxLength={50}
                  style={{ height: 48, background: "#F2F4F6", border: "none" }}
                />
              </Form.Item>
            </div>
            <Form.Item name="description" style={{ marginTop: 20 }}>
              <Input.TextArea
                rows={5}
                placeholder="输入应用的描述（非必填）"
                showCount
                maxLength={400}
                style={{ background: "#F2F4F6", border: "none" }}
              />
            </Form.Item>
          </div>

          <div className={styles["footer-btn"]}>
            <Form.Item>
              <Button
                style={{ width: 110, marginRight: 24, borderRadius: 12 }}
                onClick={backHandle}
                loading={createBtnLoading}
              >
                取消
              </Button>
              <Button
                style={{ width: 110, borderRadius: 12 }}
                type="primary"
                htmlType="submit"
                loading={createBtnLoading}
              >
                创建
              </Button>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
}
