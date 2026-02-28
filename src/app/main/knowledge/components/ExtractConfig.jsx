import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Tabs,
  Button,
  Empty,
  message,
  Spin,
} from "antd";
import { InfoCircleFilled } from "@ant-design/icons";
import styles from "../page.module.css";
import ExtractPreview from "./ExtractPreview";
import {
  getExtractConfigApi,
  extractPreviewApi,
  extractConfigApi,
} from "@/api/knowledgeExtraction";

const { TextArea } = Input;

// 抽取配置弹窗组件
const ExtractConfig = forwardRef((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeKey, setActiveKey] = useState("entity");
  const [extractList, setExtractList] = useState([]);
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  const [form] = Form.useForm();
  const initialFormValues = useMemo(
    () => ({
      documentId: "",
      extractEntityModel: "Extractor",
      entityPromptRequire:
        "你是专门进行实体抽取的专家。请从input中抽取出符合schema定义的实体，不存在的实体类型返回空列表",
      entityPromptOutput:
        "请按照JSON字符串的格式回答。\n" +
        '{{"schema": {ner_schema},"input": "{input}"}}',
      extractRelationModel: "Extractor",
      relationPromptRequire:
        "你是专门进行关系抽取的专家。请从input中抽取出符合schema定义的关系三元组，不存在的关系返回空列表",
      relationPromptOutput:
        "请按照JSON字符串的格式回答。\n" +
        '{{"schema": {re_schema},"input": "{input}"}}',
    }),
    []
  );

  // 下拉选项配
  const extractOptions = [
    { label: "Extractor", value: "Extractor" },
    { label: "OneKE", value: "OneKE" },
  ];

  // 表单校验规则
  const formRules = {
    extractEntityModel: [
      { required: true, message: "请选择抽取模型", trigger: "change" },
    ],
    extractRelationModel: [
      { required: true, message: "请选择抽取模型", trigger: "change" },
    ],
    entityPromptRequire: [
      { required: true, message: "请输入提示词内容...", trigger: "blur" },
    ],
    relationPromptRequire: [
      { required: true, message: "请输入提示词内容...", trigger: "blur" },
    ],
  };

  const getDocumentExtractConfigDetail = useCallback(
    async (id) => {
      try {
        const reqId = Number(id || documentId);
        const documentExtractConfig = await getExtractConfigApi({
          documentId: reqId,
        });
        // 合并表单数据
        const mergedFormValues = {
          ...initialFormValues,
          ...documentExtractConfig,
        };
        form.setFieldsValue(mergedFormValues);
      } catch (error) {
        console.error("获取抽取配置失败：", error);
        // 初始化默认值
        form.setFieldsValue(initialFormValues);
      }
    },
    [documentId, form]
  );

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  //显示弹窗
  const showModal = async (id) => {
    setOpen(true);
    setActiveKey("entity");
    setDocumentId(id);
    setExtractList([]);
    if (id) {
      await getDocumentExtractConfigDetail(id);
    } else {
      form.setFieldsValue(initialFormValues);
    }
  };

  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();

    const extractEntityModel = form.getFieldValue("extractEntityModel");
    const entityPromptRequire = form.getFieldValue("entityPromptRequire");
    const extractRelationModel = form.getFieldValue("extractRelationModel");
    const relationPromptRequire = form.getFieldValue("relationPromptRequire");

    // 前置校验，切换对应标签
    if (!extractEntityModel || !entityPromptRequire) {
      setActiveKey("entity");
      // 校验当前标签表单
      await form.validateFields(["extractEntityModel", "entityPromptRequire"]);
      return;
    }
    if (!extractRelationModel || !relationPromptRequire) {
      setActiveKey("relation");
      // 校验当前标签表单
      await form.validateFields([
        "extractRelationModel",
        "relationPromptRequire",
      ]);
      return;
    }

    try {
      // 完整表单校验
      await form.validateFields();
      setLoading(true);

      const formValues = {
        ...initialFormValues, // 先取默认值
        ...form.getFieldsValue(), // 再取表单填写值，覆盖默认值
        documentId: Number(documentId), // 手动补充documentId
      };

      // 调用保存接口
      await extractConfigApi(formValues);
      message.success("操作成功");
      submitSuccessEvent();
    } catch (error) {
      console.error("保存抽取配置失败：", error);
      message.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    form.resetFields();
    setLoading(false);
    setIsPreviewLoading(false);
  };

  //提交成功事件
  const submitSuccessEvent = () => {
    modelCancelEvent();
    props?.searchEvent();
  };

  const beginExtractPreview = async () => {
    try {
      setIsPreviewLoading(true);

      const formValues = {
        ...initialFormValues,
        ...form.getFieldsValue(),
        documentId: Number(documentId),
      };

      const { data: result } = await extractPreviewApi(formValues);
      setExtractList(result || []);
    } catch (error) {
      console.error("获取抽取预览失败：", error);
      message.error("预览失败，请重试");
      setExtractList([]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 实体抽取表单内容
  const renderEntityFormContent = () => {
    return (
      <>
        <Form.Item
          name="extractEntityModel"
          label="抽取模型:"
          rules={formRules.extractEntityModel}
        >
          <Select
            placeholder="请选择大模型"
            options={extractOptions}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="提示词(Prompt)" required>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            className={styles["llm-help-text"]}
          >
            <InfoCircleFilled style={{ color: "#2b50d6", marginRight: 4 }} />
            <span>您可以使用“{"{x}"}引用变量”格式来进行插入使用，具体说明</span>
          </div>
          <p
            style={{ margin: "0 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #要求
            <span
              style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
              className={styles["extract-prompt-title__sub"]}
            >
              (可谨慎修改，建议直接使用此要求)
            </span>
          </p>
          <Form.Item
            name="entityPromptRequire"
            rules={formRules.entityPromptRequire}
            noStyle
          >
            <TextArea
              showCount
              rows={4}
              maxLength={2000}
              placeholder="请按照格式说明，合理正确的输入提示词内容..."
            />
          </Form.Item>

          <p
            style={{ margin: "16px 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #其他要求
          </p>
          <Form.Item name="entityPromptOtherRequire" noStyle>
            <TextArea
              showCount
              rows={4}
              maxLength={2000}
              placeholder="如有其他要求，请在这里输入..."
            />
          </Form.Item>

          <p
            style={{ margin: "16px 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #输出
            <span
              style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
              className={styles["extract-prompt-title__sub"]}
            >
              (暂不支持修改)
            </span>
          </p>
          <Form.Item noStyle>
            <TextArea
              disabled
              autoSize={{ minRows: 3, maxRows: 3 }}
              maxLength={2000}
              value={initialFormValues.entityPromptOutput}
            />
          </Form.Item>
        </Form.Item>
      </>
    );
  };

  // 关系抽取表单内容
  const renderRelationFormContent = () => {
    return (
      <>
        <Form.Item
          name="extractRelationModel"
          label="抽取模型:"
          rules={formRules.extractRelationModel}
        >
          <Select
            placeholder="请选择大模型"
            options={extractOptions}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="提示词(Prompt)" required>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            className={styles["llm-help-text"]}
          >
            <InfoCircleFilled style={{ color: "#2b50d6", marginRight: 4 }} />
            <span>您可以使用“{"{x}"}引用变量”格式来进行插入使用，具体说明</span>
          </div>
          <p
            style={{ margin: "0 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #要求
            <span
              style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
              className={styles["extract-prompt-title__sub"]}
            >
              (可谨慎修改，建议直接使用此要求)
            </span>
          </p>
          <Form.Item
            name="relationPromptRequire"
            rules={formRules.relationPromptRequire}
            noStyle
          >
            <TextArea
              showCount
              rows={4}
              maxLength={2000}
              placeholder="请按照格式说明，合理正确的输入提示词内容..."
            />
          </Form.Item>

          <p
            style={{ margin: "16px 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #其他要求
          </p>
          <Form.Item name="relationPromptOtherRequire" noStyle>
            <TextArea
              showCount
              rows={4}
              maxLength={2000}
              placeholder="如有其他要求，请在这里输入..."
            />
          </Form.Item>

          <p
            style={{ margin: "16px 0 8px 0" }}
            className={styles["extract-prompt-title"]}
          >
            #输出
            <span
              style={{ color: "#666", fontSize: 12, marginLeft: 8 }}
              className={styles["extract-prompt-title__sub"]}
            >
              (暂不支持修改)
            </span>
          </p>
          <Form.Item noStyle>
            <TextArea
              disabled
              autoSize={{ minRows: 3, maxRows: 3 }}
              maxLength={2000}
              value={initialFormValues.relationPromptOutput}
            />
          </Form.Item>
        </Form.Item>
      </>
    );
  };

  const extractFormTabs = [
    {
      label: "实体抽取大模型及提示词",
      key: "entity",
      children: (
        <div className={styles["extract-form"]}>
          {renderEntityFormContent()}
        </div>
      ),
    },
    {
      label: "关系抽取大模型及提示词",
      key: "relation",
      children: (
        <div className={styles["extract-form"]}>
          {renderRelationFormContent()}
        </div>
      ),
    },
  ];

  return (
    <Modal
      width="1460px"
      maskClosable={false}
      open={open}
      zIndex={1001}
      classNames={{ content: "my-modal-content" }}
      footer={null}
      closable={false}
      onCancel={modelCancelEvent}
    >
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              抽取配置
            </div>
            <img
              className={styles["knowledge_add_container_header_close_img"]}
              onClick={modelCancelEvent}
              src="/close.png"
              alt=""
            />
          </div>
        </div>
        <div className={styles["extract-form__container"]}>
          <Form
            form={form}
            layout="vertical"
            initialValues={initialFormValues}
            autoComplete="off"
          >
            <div className={styles["extract_tabs"]}>
              <Tabs
                style={{
                  padding: "16px 0 0 16px",
                  height: "100%",
                }}
                activeKey={activeKey}
                onChange={setActiveKey}
                items={extractFormTabs}
                // forceRender={true}
              />
            </div>
          </Form>

          <div className={styles["extract-preview__container"]}>
            <div className={styles["extract-title"]}>抽取预览:</div>
            {extractList.length > 0 ? (
              <div className={styles["extract-list__container"]}>
                {extractList.map((extractItem, index) => (
                  <ExtractPreview
                    key={index}
                    index={index}
                    extractData={extractItem}
                  />
                ))}
              </div>
            ) : (
              <Empty
                description="暂无可预览的内容"
                image={Empty.PRESENTED_IMAGE_DEFAULT}
              />
            )}
          </div>
        </div>
        <div className="model_footer">
          <Button
            key="back"
            className="model_footer_btn"
            onClick={modelCancelEvent}
          >
            取消
          </Button>
          <Button
            key="test"
            className="model_footer_btn"
            type="primary"
            loading={isPreviewLoading}
            onClick={beginExtractPreview}
          >
            测试预览
          </Button>
          <Button
            key="submit"
            className="model_footer_btn"
            type="primary"
            loading={loading}
            onClick={submitEvent}
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default ExtractConfig;
