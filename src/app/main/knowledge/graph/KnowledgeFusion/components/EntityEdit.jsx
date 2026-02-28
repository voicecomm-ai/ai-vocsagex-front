"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
} from "react";
import { Modal, Button, message, Form, Select, Input } from "antd";
import { cloneDeep } from "lodash-es";
import styles from "./index.module.css";

const { Option } = Select;

const EntityEdit = forwardRef(
  ({ spaceId, entityForm, handleEntityDone }, ref) => {
    // 状态管理
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [currentData, setCurrentData] = useState(null);

    const [form] = Form.useForm();
    const initialFormData = useMemo(
      () => ({
        spaceId: Number(spaceId) || "",
        vertexId: "",
        vertexName: "",
        vertexTagName: [], // 所属本体标签
      }),
      [spaceId]
    );

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      showModal: () => {
        setOpen(true);
      },
    }));

    useEffect(() => {
      if (entityForm) {
        setIsUpdate(true);
        const formData = {
          spaceId: Number(spaceId) || "",
          ...entityForm,
          vertexId: entityForm.vertexId.toString().slice(-10),
        };
        setCurrentData(entityForm);
        form.setFieldsValue(formData);
      } else {
        setIsUpdate(false);
        form.resetFields();
      }
    }, [entityForm, spaceId]);

    // 关闭弹窗
    const modelCancelEvent = () => {
      setOpen(false);
      // 重置状态
      form.resetFields();
      setCurrentData(null);
    };

    // 表单验证规则
    const formRules = useMemo(
      () => ({
        vertexName: [
          {
            required: true,
            validator: async (_rule, value) => {
              if ([undefined, null, ""].includes(value)) {
                return Promise.reject("请输入实体名称");
              }
              if (
                !/^[A-Za-z0-9\u4e00-\u9fa5_\-\s""（）()【】\[\]、—\/.'‘’“”,]+$/.test(
                  value
                )
              ) {
                return Promise.reject(
                  "只能包含中文、英文、数字、下划线(_)、横线(-)、空格、引号(\"\"''“”‘’)、括号(（）【】[])、顿号(、)、英文逗号(,)、破折号(—)、斜杠(/)和点(.)"
                );
              }
              return Promise.resolve();
            },
            trigger: ["blur", "change"],
          },
        ],
      }),
      []
    );

    // 保存（新增/编辑）
    const save = async () => {
      try {
        // 表单校验
        await form.validateFields();
        setLoading(true);

        const formData = {
          ...cloneDeep(form.getFieldsValue()),
          vertexId: entityForm.vertexId,
        };

        setOpen(false);
        handleEntityDone(formData);
        message.success(isUpdate ? "编辑成功" : "新增成功");
      } catch (error) {
        message.error(isUpdate ? "编辑失败" : "新增失败");
        console.error("保存异常:", error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal
        title=""
        open={open}
        width={600}
        closable={false}
        maskClosable={false}
        onCancel={modelCancelEvent}
        footer={null}
        classNames={{ content: "my-modal-content" }}
      >
        <div
          className={`${
            styles["knowledge_add_container"]
          } ${"model_container"}`}
        >
          <div className={styles["knowledge_add_container_header"]}>
            <div className="model_header">
              <div className={styles["knowledge_add_container_header_title"]}>
                名称{isUpdate ? "编辑" : "新增"}
              </div>
              <img
                className={styles["knowledge_add_container_header_close_img"]}
                onClick={modelCancelEvent}
                src="/close.png"
                alt=""
              />
            </div>
          </div>
          <div
            className="model_content"
            style={{
              margin: "16px 48px 0 12px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {/* 表单主体 */}
            <Form
              className={styles["extract-form"]}
              form={form}
              layout="horizontal"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              initialValues={initialFormData}
            >
              {/* 所属本体 */}
              <Form.Item label="所属本体" name="vertexTagName">
                <Select
                  style={{ width: "100%" }}
                  mode="tags"
                  disabled
                  placeholder="所属本体标签"
                />
              </Form.Item>

              {/* 实体名称 */}
              <Form.Item
                label="实体名称"
                name="vertexName"
                rules={formRules.vertexName}
              >
                <Input placeholder="请输入实体名称" maxLength={50} />
              </Form.Item>

              {/* VID */}
              <Form.Item label="VID" name="vertexId">
                <Input placeholder="VID" disabled />
              </Form.Item>
            </Form>
          </div>
          <div className="model_footer" style={{ marginTop: 0 }}>
            <Button className="model_footer_btn" onClick={modelCancelEvent}>
              取消
            </Button>
            <Button
              onClick={save}
              loading={loading}
              className="model_footer_btn"
              type="primary"
            >
              确定
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

export default EntityEdit;
