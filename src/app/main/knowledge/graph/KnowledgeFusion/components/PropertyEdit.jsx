"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  Modal,
  Button,
  message,
  Form,
  Select,
  Input,
  TimePicker,
  DatePicker,
  Table,
} from "antd";
import { cloneDeep } from "lodash-es";
import dayjs from "dayjs";
import styles from "./index.module.css";
import { isUrl, getURLFileName } from "@/utils/fileValidation";
import CustomTableStyle from "@/utils/graph/scrollStyle";

// 文件类型常量
const FILE_TYPE = {
  image: "图片",
  video: "视频",
  text: "文本",
  audio: "音频",
  otherFile: "其他文件",
};

const { Option } = Select;

const PropertyEdit = forwardRef(
  ({ spaceId, tableOptions = [], attributeForm, handlePropertyDone }, ref) => {
    // 状态管理
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [atrForm, setAtrForm] = useState({
      propertyName: "",
      propertyType: "",
      propertyValue: "",
      finalValue: "",
      extra: "",
      tagRequired: false,
    });
    const [form] = Form.useForm();

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      showModal: () => {
        setOpen(true);
      },
    }));

    const getFormatByType = (type) => {
      switch (type) {
        case "DATE":
          return "YYYY-MM-DD";
        case "TIME":
          return "HH:mm:ss";
        case "DATETIME":
        case "TIMESTAMP":
          return "YYYY-MM-DD HH:mm:ss";
        default:
          return "";
      }
    };
    useEffect(() => {
      if (attributeForm) {
        setIsUpdate(true);
        setAtrForm({
          ...attributeForm,
          propertyValue: attributeForm.propertyValue || "",
          finalValue: attributeForm.finalValue || "",
        });
        form.setFieldsValue({
          propertyValue: ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
            attributeForm?.propertyType
          )
            ? (() => {
                const dayjsObj =
                  dayjs(
                    attributeForm.propertyValue,
                    getFormatByType(attributeForm.propertyType)
                  ) || null;
                return dayjsObj.isValid() ? dayjsObj : null;
              })()
            : attributeForm.propertyValue || "",
        });
      } else {
        setIsUpdate(false);
        form.resetFields();
        setAtrForm({
          propertyName: "",
          propertyType: "",
          propertyValue: "",
          finalValue: "",
          extra: "",
          tagRequired: false,
        });
      }
    }, [attributeForm, spaceId]);

    // 关闭弹窗
    const modelCancelEvent = () => {
      setOpen(false);
      // 重置状态
      form.resetFields();
      setAtrForm({
        propertyName: "",
        propertyType: "",
        propertyValue: "",
        finalValue: "",
        extra: "",
        tagRequired: false,
      });
    };

    // 表单验证规则
    const formRules = useMemo(
      () => ({
        propertyValue: [
          {
            required: !attributeForm.tagRequired,
            trigger: ["blur", "change"],
            validator: async (_rule, value) => {
              const intTypes = ["INT64", "INT32", "INT16", "INT8"];

              // 可选字段为空时通过
              if (
                attributeForm.tagRequired &&
                [undefined, null, ""].includes(value)
              ) {
                return Promise.resolve();
              }

              // 必填字段为空时拒绝
              if (
                !attributeForm.tagRequired &&
                [undefined, null, ""].includes(value)
              ) {
                return Promise.reject("请完善属性默认值");
              }

              // 整数验证
              if (
                intTypes.includes(attributeForm.propertyType) &&
                !/^-?\d+$/.test(value)
              ) {
                return Promise.reject("请输入整数");
              }

              // 浮点数验证
              if (
                ["FLOAT", "DOUBLE"].includes(attributeForm.propertyType) &&
                !/^-?\d+\.\d+$/.test(value)
              ) {
                return Promise.reject("请输入小数");
              }

              // 布尔值验证
              if (
                attributeForm.propertyType === "BOOL" &&
                !["true", "false"].includes(String(value).toLowerCase())
              ) {
                return Promise.reject("请输入true或false");
              }

              // 固定长度字符串验证
              if (
                attributeForm.propertyType === "FIXED_STRING" &&
                value?.length > Number(attributeForm.extra)
              ) {
                return Promise.reject(
                  `请输入小于${attributeForm.extra}位的字符串`
                );
              }

              return Promise.resolve();
            },
          },
        ],
      }),
      [attributeForm]
    );

    // 处理表格数据点击
    const handleData = useCallback(
      (propertyValue) => {
        let finalValue = propertyValue;
        let displayValue = propertyValue;
        const { propertyType } = atrForm;

        if (isUrl(propertyValue)) {
          displayValue = getURLFileName(propertyValue);
        }
        if (["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(propertyType)) {
          displayValue =
            dayjs(propertyValue, getFormatByType(propertyType)) || null;
        }

        setAtrForm((prev) => ({
          ...prev,
          propertyValue: displayValue,
          finalValue: finalValue,
        }));

        form.setFieldsValue({ propertyValue: displayValue });
      },
      [atrForm]
    );

    // 处理表单值变化
    const handleChange = useCallback(
      (value) => {
        let finalValue = value;

        // 处理时间/日期类型的格式化
        if (dayjs.isDayjs(value)) {
          if (atrForm.propertyType === "TIME") {
            finalValue = value.format("HH:mm:ss");
          } else if (atrForm.propertyType === "DATE") {
            finalValue = value.format("YYYY-MM-DD");
          } else if (["DATETIME", "TIMESTAMP"].includes(atrForm.propertyType)) {
            finalValue = value.format("YYYY-MM-DD HH:mm:ss");
          }
        }

        setAtrForm((prev) => ({
          ...prev,
          propertyValue: value,
          finalValue: finalValue,
        }));
      },
      [attributeForm.propertyType]
    );

    // 保存（新增/编辑）
    const save = async () => {
      try {
        // 表单校验
        await form.validateFields();
        setLoading(true);

        const formData = {
          spaceId: Number(spaceId) || "",
          ...cloneDeep(atrForm),
          ...cloneDeep(form.getFieldsValue()),
        };
        if (
          ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
            formData.propertyType
          )
        ) {
          const dayjsObj = dayjs(formData.propertyValue);
          formData.propertyValue = dayjsObj.isValid()
            ? dayjsObj.format(getFormatByType(formData.propertyType))
            : null;
          formData.finalValue = formData.propertyValue;
        } else {
          formData.finalValue = formData.propertyValue;
        }
        setOpen(false);
        handlePropertyDone(formData);
        message.success(isUpdate ? "编辑成功" : "新增成功");
      } catch (error) {
        // message.error(isUpdate ? "编辑失败" : "新增失败");
        console.error("保存异常:", error);
      } finally {
        setLoading(false);
      }
    };

    // 表格列配置
    const columns = useMemo(
      () => [
        {
          title: "属性值",
          dataIndex: "propertyValue",
          ellipsis: true,
          key: "propertyValue",
          render: (text) => (isUrl(text) ? getURLFileName(text) : text),
        },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          align: "center",
          width: 130,
          render: (_, record) => (
            <Button
              type="link"
              onClick={() => handleData(record.propertyValue)}
            >
              {isUrl(record.propertyValue) ? "以此为准" : "复制到输入框"}
            </Button>
          ),
        },
      ],
      [handleData]
    );

    // 计算文件类型显示文本
    const fileTypeText = useMemo(() => {
      return (
        FILE_TYPE[attributeForm.extra || attributeForm.propertyType] ||
        attributeForm.propertyType ||
        ""
      );
    }, [attributeForm]);

    // 判断是否显示文件/URL相关的禁用输入框
    const isFileOrUrl = useMemo(() => {
      return (
        isUrl(attributeForm.finalValue) ||
        ["image", "video", "audio", "otherFile"].includes(attributeForm.extra)
      );
    }, [attributeForm]);

    return (
      <>
        <CustomTableStyle />
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
                  属性{isUpdate ? "编辑" : "新增"}
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
                flexDirection: "column",
              }}
            >
              {/* 表单主体 */}
              <Form
                className={styles["extract-form"]}
                form={form}
                layout="horizontal"
                labelCol={{ span: 4.5 }}
                wrapperCol={{ span: 20 }}
                initialValues={{
                  propertyValue: [
                    "DATE",
                    "DATETIME",
                    "TIMESTAMP",
                    "TIME",
                  ].includes(attributeForm?.propertyType)
                    ? dayjs(
                        attributeForm.propertyValue,
                        getFormatByType(attributeForm.propertyType)
                      ) || null
                    : attributeForm.propertyValue || "",
                }}
              >
                <Form.Item
                  label={`${
                    attributeForm.propertyName || "属性"
                  }(${fileTypeText})`}
                  name="propertyValue"
                  rules={formRules.propertyValue}
                >
                  {(() => {
                    const { propertyType } = attributeForm;
                    if (isFileOrUrl) {
                      return (
                        <Input disabled placeholder="文件/链接地址不可编辑" />
                      );
                    }
                    // 根据属性类型渲染对应组件
                    switch (propertyType) {
                      case "TIME":
                        return (
                          <TimePicker
                            format="HH:mm:ss"
                            placeholder="选择时间"
                            style={{ width: "100%" }}
                            allowClear
                            defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                          />
                        );
                      case "DATE":
                        return (
                          <DatePicker
                            format="YYYY-MM-DD"
                            placeholder="选择日期"
                            style={{ width: "100%" }}
                            allowClear
                          />
                        );
                      case "DATETIME":
                      case "TIMESTAMP":
                        return (
                          <DatePicker
                            format="YYYY-MM-DD HH:mm:ss"
                            showTime
                            placeholder="选择日期"
                            style={{ width: "100%" }}
                            allowClear
                          />
                        );
                      case "BOOL":
                        return (
                          <Select style={{ width: "100%" }}>
                            <Option value="true">true</Option>
                            <Option value="false">false</Option>
                          </Select>
                        );
                      default:
                        return (
                          <Input
                            placeholder="请输入属性值"
                            autoComplete="off"
                          />
                        );
                    }
                  })()}
                </Form.Item>
              </Form>
              {/* 属性值表格 */}
              {tableOptions.length > 0 && (
                <Table
                  className="custom-table"
                  columns={columns}
                  dataSource={tableOptions}
                  scroll={{ y: 200 }}
                  size="small"
                  pagination={false}
                  style={{ marginTop: 16, width: "100%" }}
                  rowKey="propertyValue"
                />
              )}
            </div>
            <div className="model_footer">
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
      </>
    );
  }
);

export default PropertyEdit;
