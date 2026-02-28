"use client";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Modal,
  Button,
  message,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
} from "antd";
import { debounce, cloneDeep } from "lodash-es";
import dayjs from "dayjs";
import styles from "./index.module.css";
import {
  getTagInfoApi,
  getEdgeTypePropertyApi,
  GetOriginalInformation,
  insertVerificationApi,
  updateVerificationApi,
} from "@/api/knowledgeExtraction";
import ExtractTable from "@/app/components/knowledge/ExtractTable";
import { hasTableXML } from "@/utils/graph/extractConfig";

const { Option } = Select;

const CheckAddOrEdit = forwardRef((props, ref) => {
  const { chunkId, onDone, spaceId, documentId } = props;
  // 状态管理
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [originText, setOriginText] = useState(props.originText);
  const [currentData, setCurrentData] = useState(null);

  const [form] = Form.useForm();
  // Form 相关状态
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [propertyOptions, setPropertyOptions] = useState([]);
  const [currentProperty, setCurrentProperty] = useState({});
  const [isSelectProperty, setIsSelectProperty] = useState(false);
  const searchConfig = useRef({ isSearch: false, lastFetchId: 0 });

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    showModal,
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

  // 显示弹窗
  const showModal = async (data, type) => {
    setOpen(true);

    if (data && type === "edit") {
      // 编辑模式
      setIsUpdate(true);
      setCurrentData(data);

      // 加载详情
      await getDetail(data.verificationId);

      // 填充表单数据
      const formData = {
        type: 1,
        spaceId,
        ...data,
      };
      form.setFieldsValue(formData);
    } else {
      // 新增模式
      setIsUpdate(false);
      setCurrentData(null);
      // 重置表单
      form.resetFields();
      const initData = {
        type: 1,
        spaceId,
      };
      form.setFieldsValue(initData);
    }
  };

  // 关闭弹窗
  const modelCancelEvent = () => {
    setOpen(false);
    // 重置状态
    form.resetFields();
    setCurrentData(null);
    setCurrentProperty({});
    setIsSelectProperty(false);
    setSubjectOptions([]);
    setPropertyOptions([]);
  };

  // 获取详情
  const getDetail = async (verificationId) => {
    try {
      const { data } = await GetOriginalInformation({
        verificationId,
      });
      setOriginText(data.originalInfo.chunkContent);
    } catch (error) {
      message.error("获取详情失败");
      console.error("获取详情异常:", error);
    }
  };

  const watchSubjectTag = Form.useWatch("subjectTag", form);
  const watchEdgeProperty = Form.useWatch("edgeProperty", form);
  const watchType = Form.useWatch("type", form);
  const watchObjectTag = Form.useWatch("objectTag", form);

  // 加载下拉列表
  useEffect(() => {
    if (open && spaceId) {
      getAppList();
      getRelationOrProperty();
    }
  }, [open, spaceId]);

  // 加载下拉列表
  useEffect(() => {
    if (open && spaceId && watchSubjectTag) {
      getRelationOrProperty();
    }
  }, [open, spaceId, watchSubjectTag]);

  useEffect(() => {
    setOriginText(props.originText);
  }, [props.originText]);

  // 获取主体/客体类型列表
  const getAppList = async () => {
    try {
      const { data } = await getTagInfoApi({ spaceId });
      setSubjectOptions(data.map((item) => ({ label: item, value: item })));
    } catch (err) {
      message.error("获取类型列表失败");
    }
  };

  // 获取关系/属性列表
  const getRelationOrProperty = async () => {
    try {
      const { data } = await getEdgeTypePropertyApi({
        spaceId,
        subjectType: watchSubjectTag,
      });

      // 编辑状态处理
      if (isUpdate) {
        const { edgeProperty, objectTag } = form.getFieldsValue();
        const propertyInfos1 = data.propertyInfos?.find(
          (item) => item.propertyName === edgeProperty?.split("(")[0]
        );
        if (propertyInfos1 && watchSubjectTag && !objectTag) {
          setCurrentProperty(propertyInfos1);
          const newEdgeProperty = `${propertyInfos1.propertyName}(${propertyInfos1.propertyType})`;
          form.setFieldsValue({
            propertyType: propertyInfos1.propertyType,
            edgeProperty: newEdgeProperty,
          });
        } else if (currentProperty.propertyType) {
          form.setFieldsValue({
            edgeProperty: "",
            objectNameValue: "",
            propertyType: "",
          });
        }
      }

      // 处理属性选项（添加类型后缀）
      const edges =
        data.edges?.map((item) => ({
          propertyName: item,
          name: item,
        })) || [];

      const propertyInfos =
        data.propertyInfos
          ?.filter(
            (item) =>
              item.propertyType !== "STRING" ||
              (item.propertyType === "STRING" && item.extra === "text")
          )
          .map((item) => ({
            ...item,
            name: `${item.propertyName}(${item.propertyType})`,
            propertyName: `${item.propertyName}(${item.propertyType})`,
            propertyValue: ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
              item?.propertyType
            )
              ? (() => {
                  const dayjsObj = dayjs(
                    item.propertyValue,
                    getFormatByType(item.propertyType)
                  );
                  return dayjsObj.isValid() ? dayjsObj : null;
                })()
              : item.propertyValue || "",
          })) || [];

      const newOptions = [...edges, ...propertyInfos];
      setPropertyOptions(newOptions);
      return newOptions;
      // const newOptions = [...edges, ...propertyInfos];
      // setPropertyOptions(
      //   newOptions.map((item) => ({
      //     label: item.name,
      //     value: item.name,
      //     name: item.name,
      //     propertyName: item.propertyName,
      //   }))
      // );
    } catch (err) {
      message.error("获取关系/属性列表失败");
    }
  };

  // 搜索过滤关系/属性
  const handleSearch = useMemo(
    () =>
      debounce(
        async (value) => {
          // if (!value) return;
          // setPropertyOptions([]);
          searchConfig.current.lastFetchId += 1;
          searchConfig.current.isSearch = true;
          const fetchId = searchConfig.current.lastFetchId;

          const newOptions = await getRelationOrProperty();

          if (fetchId !== searchConfig.current.lastFetchId) return;

          const filtered = newOptions.filter((item) => {
            const regExp = new RegExp(value, "ig");
            if (regExp.test(item.propertyName)) {
              item.name = item.propertyName.replace(
                regExp,
                (matched) => `<span style="color:#4070FD">${matched}</span>`
              );
              return true;
            }
            return false;
          });

          setPropertyOptions(filtered);
          searchConfig.current.isSearch = false;
        },
        200,
        { leading: true }
      ),
    [propertyOptions, getRelationOrProperty]
  );

  // 过滤选项（主体/客体类型选择器）
  const filterOption = useCallback((inputValue, option) => {
    return option.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
  }, []);

  // 选择关系/属性回调
  const handleSelectProperty = useCallback(
    async (value, option) => {
      const formValues = form.getFieldsValue();
      const lastProperty = currentProperty;
      setCurrentProperty(option);

      const wasProperty = "propertyType" in lastProperty;
      const isNowProperty = "propertyType" in option;

      const resetFormData = {};

      // 切换类型时清空相关字段
      if (wasProperty !== isNowProperty) {
        resetFormData.objectTag = null;
      }

      // 处理属性类型逻辑
      if (isNowProperty) {
        const newFormData = {
          ...formValues,
          ...resetFormData,
          type: 1,
          propertyType: option.propertyType,
          edgeProperty: value,
        };

        // 填充默认值
        if (option.propertyType === "STRING") {
          // if (!formValues.objectNameValue) {
          newFormData.objectNameValue = option.defaultValueAsString || "";
          // }
        } else if (
          ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
            option.propertyType
          )
        ) {
          const value = option.propertyValue || option.defaultValueAsString;

          newFormData.objectNameValue = value
            ? (() => {
                const dayjsObj = dayjs(
                  value,
                  getFormatByType(option.propertyType)
                );
                return dayjsObj.isValid() ? dayjsObj : null;
              })()
            : null;
        } else if (option.defaultValueAsString) {
          newFormData.objectNameValue = option.defaultValueAsString;
        } else {
          newFormData.objectNameValue = "";
        }

        // if (
        //   ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
        //     option.propertyType
        //   )
        // ) {
        //   newFormData.objectNameValue = null;
        // } else {
        //   newFormData.objectNameValue = "";
        // }

        setIsSelectProperty(true);
        await form.setFieldsValue(newFormData);
      } else {
        const newFormData = {
          ...formValues,
          ...resetFormData,
          type: 0,
          propertyType: "",
          edgeProperty: value,
          objectNameValue: "",
        };
        setIsSelectProperty(false);
        await form.setFieldsValue(newFormData);
      }
    },
    [form, currentProperty]
  );

  // 切换主体类型回调
  const handleSubjectChange = async (value) => {
    const formValues = form.getFieldsValue();
    const newFormData = { ...formValues, subjectTag: value };

    // 清空相关字段
    if (!isUpdate) {
      if (currentProperty.propertyType) {
        newFormData.edgeProperty = undefined;
        newFormData.objectNameValue = undefined;
        newFormData.propertyType = "";
      }
    } else {
      if (
        formValues.type === 1 &&
        !formValues.objectTag &&
        currentProperty.propertyType
      ) {
        newFormData.edgeProperty = undefined;
        newFormData.objectNameValue = undefined;
        newFormData.propertyType = "";
      }
    }

    await form.setFieldsValue(newFormData);
    // f();
  };

  // 表单验证规则
  const rules = useMemo(
    () => ({
      subjectTag: [
        {
          message: "请输入主体类型",
          required: true,
          trigger: ["blur", "change"],
        },
      ],
      objectTag: [
        {
          message: "请输入客体类型",
          required: true,
          trigger: ["blur", "change"],
        },
      ],
      subjectName: [
        {
          required: true,
          validator: async (_, value) => {
            if ([undefined, null, ""].includes(value)) {
              return Promise.reject("请输入主体名称");
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
      objectNameValue: [
        {
          required: true,
          validator: async (_, value) => {
            const intTypes = ["INT64", "INT32", "INT16", "INT8"];

            if (!currentProperty.propertyType) {
              if ([undefined, null, ""].includes(value)) {
                return Promise.reject("请输入客体名称");
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
            } else {
              if ([undefined, null, ""].includes(value)) {
                return Promise.reject("请完善属性值");
              }
              if (
                intTypes.includes(currentProperty.propertyType) &&
                !/^-?\d+$/.test(value)
              ) {
                return Promise.reject("请输入整数");
              }
              if (
                ["FLOAT", "DOUBLE"].includes(currentProperty.propertyType) &&
                !/^-?\d+\.\d+$/.test(value)
              ) {
                return Promise.reject("请输入小数");
              }
              if (
                currentProperty.propertyType === "BOOL" &&
                !["true", "false"].includes(value.toLowerCase())
              ) {
                return Promise.reject("请输入true或false");
              }
              if (
                currentProperty.propertyType === "FIXED_STRING" &&
                value.length > Number(currentProperty.extra || 0)
              ) {
                return Promise.reject(
                  `请输入小于${currentProperty.extra}位的字符串`
                );
              }
            }
            return Promise.resolve();
          },
          trigger: ["blur", "change"],
        },
      ],
      edgeProperty: [
        {
          required: true,
          validator: async (_, value) => {
            if ([undefined, null, ""].includes(value)) {
              return Promise.reject("请选择关系/属性");
            }
            return Promise.resolve();
          },
          trigger: ["change"],
        },
      ],
    }),
    [currentProperty]
  );

  // 渲染属性值输入组件
  const renderValueInput = useCallback(() => {
    const originValue = form.getFieldValue("objectNameValue");
    const { propertyType } = currentProperty;

    let formatValue = originValue;
    formatValue = ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
      propertyType
    )
      ? (() => {
          const dayjsObj = dayjs(originValue, getFormatByType(propertyType));
          return dayjsObj.isValid() ? dayjsObj : null;
        })()
      : originValue || "";

    if (formatValue !== originValue) {
      form.setFieldsValue({ objectNameValue: formatValue });
    }

    switch (propertyType) {
      case "TIME":
        return <TimePicker style={{ width: "100%" }} format="HH:mm:ss" />;
      case "DATE":
        return <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />;
      case "DATETIME":
      case "TIMESTAMP":
        return (
          <DatePicker
            style={{ width: "100%" }}
            format="YYYY-MM-DD HH:mm:ss"
            showTime={{ defaultValue: dayjs("00:00:00", "HH:mm:ss") }}
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
            placeholder={
              currentProperty.propertyType ? "请输入属性值" : "请输入默认值"
            }
            autoComplete="off"
          />
        );
    }
  }, [form, currentProperty]);

  // 保存（新增/编辑）
  const save = async () => {
    try {
      // 表单校验
      await form.validateFields();
      setLoading(true);

      const formData = cloneDeep(form.getFieldsValue());

      // 处理 edgeProperty
      formData.propertyType = currentProperty.propertyType || "";
      formData.edgeProperty =
        formData.edgeProperty?.replace(/(\(\w+\))/, "") || "";

      if (formData.objectNameValue) {
        switch (formData.propertyType) {
          case "TIME":
            formData.objectNameValue =
              formData.objectNameValue.format("HH:mm:ss");
            break;
          case "DATE":
            formData.objectNameValue =
              formData.objectNameValue.format("YYYY-MM-DD");
            break;
          case "DATETIME":
          case "TIMESTAMP":
            formData.objectNameValue = formData.objectNameValue.format(
              "YYYY-MM-DD HH:mm:ss"
            );
            break;
        }
      }

      console.log(formData, "formData");

      if (isUpdate) {
        const editParams = {
          ...currentData,
          ...formData,
          spaceId: Number(spaceId),
          type: 1,
        };
        if (editParams.propertyType) {
          // 移除 objectTag
          editParams.objectTag = "";
        }
        await updateVerificationApi(editParams);
      } else {
        const insertParams = {
          ...currentData,
          ...formData,
          spaceId: Number(spaceId),
          documentId: Number(documentId),
          chunkId: Number(chunkId),
          type: 1,
        };
        if (insertParams.propertyType) {
          // 移除 objectTag
          insertParams.objectTag = "";
        }
        await insertVerificationApi(insertParams);
      }

      message.success(isUpdate ? "编辑成功" : "新增成功");
      setOpen(false);
      props.onDone?.(isUpdate ? "edit" : "add", formData);
    } catch (error) {
      // message.error(isUpdate ? "编辑失败" : "新增失败");
      console.error("保存异常:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title=""
      open={open}
      width={885}
      closable={false}
      maskClosable={false}
      onCancel={modelCancelEvent}
      footer={null}
      classNames={{ content: "my-modal-content" }}
    >
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              {isUpdate ? "编辑" : "新增"}
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
            margin: "16px 32px 0 12px",
            height: "440px",
            display: "flex",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div
            className={`${styles["origin-text"]} ${
              hasTableXML(originText) ? styles["origin-container__hidden"] : ""
            }`}
          >
            {hasTableXML(originText) ? (
              <ExtractTable tableXmlText={originText} />
            ) : (
              <div>{originText}</div>
            )}
          </div>
          {/* 表单主体 */}
          <Form
            className={styles["extract-form"]}
            form={form}
            layout="vertical"
            wrapperCol={{ span: 22 }}
          >
            {/* 主体类型 */}
            <Form.Item
              label="主体类型"
              name="subjectTag"
              rules={rules.subjectTag}
            >
              <Select
                placeholder="输入关键字检索"
                showSearch
                style={{ width: "100%" }}
                filterOption={filterOption}
                options={subjectOptions}
                onChange={handleSubjectChange}
              />
            </Form.Item>

            {/* 主体名称 */}
            <Form.Item
              label="主体名称"
              name="subjectName"
              rules={rules.subjectName}
            >
              <Input
                placeholder="50个字符以内"
                maxLength={50}
                autoComplete="off"
                onChange={(e) =>
                  form.setFieldsValue({ subjectName: e.target.value })
                }
              />
            </Form.Item>

            {/* 关系/属性 */}
            <Form.Item
              label="关系/属性"
              name="edgeProperty"
              rules={rules.edgeProperty}
            >
              <Select
                placeholder="输入关键字检索"
                style={{ width: "100%" }}
                filterOption={false}
                options={propertyOptions}
                fieldNames={{ label: "propertyName", value: "propertyName" }}
                showSearch
                onSearch={handleSearch}
                onSelect={handleSelectProperty}
              />
            </Form.Item>

            {/* 新增状态 */}
            {!isUpdate ? (
              <>
                {/* 关系类型 */}
                {!currentProperty.propertyType &&
                  !isSelectProperty &&
                  form.getFieldValue("edgeProperty") && (
                    <>
                      <Form.Item
                        label="客体类型"
                        name="objectTag"
                        rules={rules.objectTag}
                      >
                        <Select
                          placeholder="输入关键字检索"
                          showSearch
                          style={{ width: "100%" }}
                          filterOption={filterOption}
                          options={subjectOptions}
                        />
                      </Form.Item>

                      <Form.Item
                        label="客体名称"
                        name="objectNameValue"
                        rules={rules.objectNameValue}
                      >
                        <Input
                          placeholder="50个字符以内"
                          maxLength={50}
                          autoComplete="off"
                        />
                      </Form.Item>
                    </>
                  )}

                {/* 属性类型 */}
                {watchEdgeProperty && isSelectProperty && (
                  <Form.Item
                    label="属性值"
                    name="objectNameValue"
                    rules={rules.objectNameValue}
                  >
                    {renderValueInput()}
                  </Form.Item>
                )}
              </>
            ) : (
              // 编辑状态
              <>
                {/* 关系类型 */}
                {(form.getFieldValue("objectTag") || watchType === 0) &&
                  !isSelectProperty && (
                    <>
                      <Form.Item
                        label="客体类型"
                        name="objectTag"
                        rules={rules.objectTag}
                      >
                        <Select
                          placeholder="输入关键字检索"
                          showSearch
                          style={{ width: "100%" }}
                          filterOption={filterOption}
                          options={subjectOptions}
                        />
                      </Form.Item>

                      <Form.Item
                        label="客体名称"
                        name="objectNameValue"
                        rules={rules.objectNameValue}
                      >
                        <Input
                          placeholder="50个字符以内"
                          maxLength={50}
                          autoComplete="off"
                        />
                      </Form.Item>
                    </>
                  )}

                {/* 属性类型 */}
                {watchEdgeProperty &&
                  currentProperty.propertyType &&
                  watchType === 1 && (
                    <Form.Item
                      label="属性值"
                      name="objectNameValue"
                      rules={rules.objectNameValue}
                    >
                      {renderValueInput()}
                    </Form.Item>
                  )}
              </>
            )}

            <Form.Item name="type" hidden></Form.Item>
          </Form>
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
  );
});

export { CheckAddOrEdit };
export default CheckAddOrEdit;
