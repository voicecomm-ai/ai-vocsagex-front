"use client";
import {
  Form,
  Row,
  Col,
  Input,
  Select,
  Radio,
  InputNumber,
  Divider,
  Segmented,
  ConfigProvider,
} from "antd";
import { useWatch } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import HorizontalNumberInput from "./HorizontalNumberInput";

//选择类型
const typeList = [
  { label: "范围", value: 1 },
  { label: "文本框", value: 2 },
  { label: "下拉", value: 3 },
];
//选择输入类型
const inputTypeList = [
  { label: "汉字", value: "汉字" },
  { label: "大写英文字母", value: "大写英文字母" },
  { label: "小写英文字母", value: "小写英文字母" },
  { label: "阿拉伯数字", value: "阿拉伯数字" },
  { label: "空格", value: "空格" },
  { label: "标点符号", value: "标点符号" },
];

export default function ConfigForm({
  id,
  data = {},
  onDelete,
  registerForm,
  initialValues,
}) {
  const [form] = Form.useForm();
  const supportDecimal = Form.useWatch("supportDecimal", form); //小数点显示
  const selectType = useWatch("select_type", form); //单多选响应
  const [localConfigType, setLocalConfigType] = useState(null);
  useEffect(() => {
    // 合并默认值和传入的值（新增用data，编辑用initialValues）
    const mergedValues = {
      isEnable: true,
      decimal_places: 0,
      maxChar: 1,
      select_type: "单选",
      ...data, // 新增时的默认值
      ...initialValues, // 编辑时的回显值（会覆盖data）
    };
    form.setFieldsValue(mergedValues);
    setLocalConfigType(mergedValues?.type || null);
    registerForm(id, form);
    return () => registerForm(id, null);
  }, [id, initialValues]);

  //默认值校验
  const getDefaultCharRules = [
    { required: true, message: "请输入默认值" },
    {
      validator(_, value) {
        const inputTypes = form.getFieldValue("input_type") || [];
        const maxChar = form.getFieldValue("maxChar");

        if (!value) return Promise.resolve();

        if (value.length > maxChar) {
          return Promise.reject(new Error(`不能超过最大字符数 ${maxChar}`));
        }
        const typeRegexMap = {
          汉字: /^[\u4e00-\u9fa5]$/, // 汉字
          大写英文字母: /^[A-Z]$/, // 大写英文字母
          小写英文字母: /^[a-z]$/, // 小写英文字母
          阿拉伯数字: /^[0-9]$/, // 数字
          空格: /^\s$/, // 空格
          标点符号:
            /^[\u3000-\u303F\uFF00-\uFFEF.,!?！？。，、；：“”‘’（）()\-—·…]$/, // 标点
        };

        for (const char of value) {
          const isValid = inputTypes.some((type) => {
            const reg = typeRegexMap[type];
            return reg?.test(char);
          });
          if (!isValid) {
            return Promise.reject(new Error(`包含不允许的字符：${char}`));
          }
        }

        return Promise.resolve();
      },
    },
  ];

  //下拉框内容校验
  const selectRules = [
    { required: true, message: "请输入下拉项" },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const type = getFieldValue("select_type");
        if (!value) return Promise.resolve();

        // 检测中文逗号
        if (value.includes("，")) {
          return Promise.reject(new Error("请输入英文逗号"));
        }

        const values = value.split(",").map((v) => v.trim());
        const invalidItem = values.find((item) => item.length > 10);
        if (invalidItem) {
          return Promise.reject(
            new Error(`“${invalidItem}” 超过了 10 个字符限制`)
          );
        }

        return Promise.resolve();
      },
    }),
  ];

  return (
    <div className={styles["config-item"]}>
      <div className={styles["delete-box"]} onClick={() => onDelete(id)}></div>
      <ConfigProvider
        theme={{
          components: {
            Form: {
              labelColor: " #666E82",
              verticalLabelPadding: "0 0 4px",
            },
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed, allValues) => {
            if ("type" in changed) {
              setLocalConfigType(changed.type);
            }
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true, message: "请选择类型" }]}
              >
                <Select
                  options={typeList}
                  onChange={setLocalConfigType}
                  placeholder="请选择类型"
                  className="model_type_select"
                  style={{ height: "36px" }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="代码内部名称"
                name="varible_name"
                rules={[
                  { required: true, message: "请输入代码内部名称" },
                  { max: 10, message: "不能超过10个字" },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="不超过10个字"
                  onChange={() => form.validateFields(["title_name"])}
                  style={{ border: "1px solid #DDDFE4", height: 36 }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="标题名称"
                name="title_name"
                rules={[
                  { required: true, message: "请输入标题名称" },
                  { max: 10, message: "不能超过10个字" },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="不超过10个字"
                  style={{ border: "1px solid #DDDFE4", height: 36 }}
                />
              </Form.Item>
            </Col>
            {localConfigType === 1 && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="最小值"
                    name="minValue"
                    initialValue={0}
                    dependencies={[
                      "maxValue",
                      "defaultValue",
                      "supportDecimal",
                      "decimal_places",
                    ]}
                    rules={[
                      { required: true, message: "请输入最小值" },
                      {
                        type: "number",
                        min: 0,
                        max: 999,
                        message: "必须在0到999之间",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const max = getFieldValue("maxValue");
                          if (max !== undefined && value > max) {
                            return Promise.reject(new Error("不能大于最大值"));
                          }

                          if (getFieldValue("supportDecimal")) {
                            const places = getFieldValue("decimal_places");
                            if (
                              value !== undefined &&
                              value.toString().split(".")[1]?.length > places
                            ) {
                              return Promise.reject(
                                new Error(`最多支持${places}位小数`)
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <HorizontalNumberInput
                      min={0}
                      max={999}
                      supportDecimal={supportDecimal}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="最大值"
                    name="maxValue"
                    initialValue={0}
                    dependencies={[
                      "minValue",
                      "defaultValue",
                      "supportDecimal",
                      "decimal_places",
                    ]}
                    rules={[
                      { required: true, message: "请输入最大值" },
                      {
                        type: "number",
                        min: 0,
                        max: 999,
                        message: "必须在0到999之间",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const min = getFieldValue("minValue");
                          if (min !== undefined && value <= min) {
                            return Promise.reject(new Error("必须大于最小值"));
                          }

                          if (getFieldValue("supportDecimal")) {
                            const places = getFieldValue("decimal_places");
                            if (
                              value !== undefined &&
                              value.toString().split(".")[1]?.length > places
                            ) {
                              return Promise.reject(
                                new Error(`最多支持${places}位小数`)
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <HorizontalNumberInput
                      min={0}
                      max={999}
                      supportDecimal={supportDecimal}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="默认值"
                    name="defaultValue"
                    initialValue={0}
                    dependencies={[
                      "minValue",
                      "maxValue",
                      "supportDecimal",
                      "decimal_places",
                    ]}
                    rules={[
                      { required: true, message: "请输入默认值" },
                      {
                        type: "number",
                        min: 0,
                        max: 999,
                        message: "必须在0到999之间",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const min = getFieldValue("minValue");
                          const max = getFieldValue("maxValue");
                          if (
                            min !== undefined &&
                            max !== undefined &&
                            (value <= min || value >= max)
                          ) {
                            return Promise.reject(
                              new Error(`必须在${min}和${max}之间`)
                            );
                          }

                          if (getFieldValue("supportDecimal")) {
                            const places = getFieldValue("decimal_places");
                            if (
                              value !== undefined &&
                              value.toString().split(".")[1]?.length > places
                            ) {
                              return Promise.reject(
                                new Error(`最多支持${places}位小数`)
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <HorizontalNumberInput
                      min={0}
                      max={999}
                      supportDecimal={supportDecimal}
                    />
                  </Form.Item>
                </Col>
                <Row
                  align="middle"
                  style={{ marginBottom: 16, color: "#666E82" }}
                >
                  <Col>支持小数点：</Col>
                  <Col flex={1}>
                    <Form.Item
                      name="supportDecimal"
                      initialValue={false}
                      noStyle
                    >
                      
                        <Radio.Group className={styles["custom-radio-group"]}
                        onChange={(e) => {
                          const support = e.target.value;
                          form.setFieldsValue({
                            decimal_places: support ? 1 : 0,
                          });

                          // 如果不支持小数，自动取整现有值
                          if (!support) {
                            const currentValues = form.getFieldsValue([
                              "minValue",
                              "maxValue",
                              "defaultValue",
                            ]);

                            form.setFieldsValue({
                              minValue: Math.round(currentValues.minValue || 0),
                              maxValue: Math.round(currentValues.maxValue || 0),
                              defaultValue: Math.round(
                                currentValues.defaultValue || 0
                              ),
                            });
                          }
                        }}
                      >
                        <Radio value={true}>
                          支持
                          {supportDecimal && (
                            <>
                              <Form.Item
                                name="decimal_places"
                                noStyle
                                rules={[
                                  {
                                    type: "number",
                                    min: 1,
                                    max: 4,
                                    message: "小数位数必须在 1~4 之间",
                                  },
                                ]}
                              >
                                <InputNumber
                                  min={1}
                                  max={4}
                                  style={{
                                    margin: "0 8px",
                                    width: 80,
                                    paddingLeft: 24,
                                  }}
                                />
                              </Form.Item>
                              位小数
                            </>
                          )}
                        </Radio>
                        <Radio value={false}>不支持</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {localConfigType === 2 && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="输入类型"
                    name="input_type"
                    rules={[{ required: true, message: "请选择输入类型" }]}
                  >
                    <Select
                      className={`${styles["custom-multiple-select"]} model_type_select`}
                      placeholder="请选择类型"
                      options={inputTypeList}
                      mode="multiple"
                      maxTagCount="responsive"
                      style={{ height: "36px", borderRadius: 8 }}
                      onChange={() => {
                        form.validateFields(["defaultChar"]); // 重新校验默认值
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="最大字符数"
                    name="maxChar"
                    initialValue={1}
                    rules={[{ required: true, message: "请输入最大字符数" }]}
                  >
                    <HorizontalNumberInput
                      min={1}
                      max={10}
                      onChange={() => {
                        form.validateFields(["defaultChar"]);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="默认值"
                    name="defaultChar"
                    rules={getDefaultCharRules}
                  >
                    <Input
                      placeholder="请输入默认值"
                      style={{ border: "1px solid #DDDFE4", height: 36 }}
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            {localConfigType === 3 && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="单多选"
                    name="select_type"
                    rules={[{ required: true, message: "请选择单多选类型" }]}
                  >
                    <ConfigProvider
                      theme={{
                        components: {
                          Segmented: {
                            itemSelectedColor: "#3772FE",
                            trackPadding: 3,
                          },
                        },
                      }}
                    >
                      <Segmented
                        options={["单选", "多选"]}
                        block
                        className={styles["custom-segmented"]}
                        value={selectType}
                        onChange={(val) => {
                          form.setFieldValue("select_type", val); //更新表单字段
                          form.validateFields(["options"]); //重新校验下拉项
                        }}
                      />
                    </ConfigProvider>
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="下拉项" name="options" rules={selectRules}>
                    <Input
                      placeholder="支持多个，用英文逗号隔开"
                      style={{ height: "36px", borderRadius: 8,border:"1px solid #DDDFE4"}}
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* 公共项 */}
            {localConfigType !== null && (
              <>
                <Col span={24}>
                  <Form.Item style={{ marginBottom: 0, color: "#666E82" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <label style={{ width: 74 }}>默认状态：</label>
                      <Form.Item
                        name="isEnable"
                        rules={[{ required: true, message: "请选择默认状态" }]}
                        noStyle
                      >
                        <Radio.Group className={styles["custom-radio-group"]}>
                          <Radio value={true}>开启</Radio>
                          <Radio value={false}>关闭</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  </Form.Item>
                </Col>

                <Divider size="small" />
                <Col span={24}>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    name="desc"
                    label={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span>说明</span>
                        <Form.Item noStyle shouldUpdate>
                          {({ getFieldError }) => {
                            const errors = getFieldError("desc");
                            return errors.length ? (
                              <span
                                style={{
                                  color: "#ff4d4f",
                                  marginLeft: 8,
                                  fontSize: 12,
                                }}
                              >
                                {errors.join(", ")}
                              </span>
                            ) : null;
                          }}
                        </Form.Item>
                      </div>
                    }
                    rules={[
                      { required: true, message: "请输入说明" },
                      { max: 100, message: "不能超过100个字" },
                    ]}
                    help="" // 隐藏默认错误提示
                  >
                    <Input.TextArea
                      placeholder="输入不超过100个字"
                      maxLength={100}
                      autoSize
                      variant="borderless"
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </ConfigProvider>
    </div>
  );
}
