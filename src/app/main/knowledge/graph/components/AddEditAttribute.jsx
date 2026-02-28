"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  useMemo,
} from "react";
import {
  Modal,
  Spin,
  Form,
  Input,
  Select,
  Radio,
  TimePicker,
  DatePicker,
  Button,
  message,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./component.module.css";
import dayjs from "dayjs";
import { useStore } from "@/store/index";
import PreviewModal from "@/app/components/knowledge/PreviewModal";
import {
  getURLFileName,
  getFileType,
  FILE_TYPES,
} from "@/utils/fileValidation";
import Cookies from "js-cookie";
import {
  createTagEdgePropertiesApi,
  updatePropertyApi,
  uploadFileApi,
} from "@/api/graph";

const { Option } = Select;

const AddEditAttribute = forwardRef((props, componentRef) => {
  const TYPE_LIST = [
    { lable: "INT64", value: "INT64" },
    { lable: "INT32", value: "INT32" },
    { lable: "INT16 ", value: "INT16" },
    { lable: "INT8", value: "INT8" },
    // { lable: 'FLOAT', value: 'FLOAT' },
    { lable: "DOUBLE", value: "DOUBLE" },
    { lable: "BOOL", value: "BOOL" },
    { lable: "STRING ", value: "STRING" },
    { lable: "FIXED_STRING", value: "FIXED_STRING" },
    { lable: "TIME", value: "TIME" },
    { lable: "DATE", value: "DATE" },
    { lable: "DATETIME", value: "DATETIME" },
    { lable: "TIMESTAMP", value: "TIMESTAMP" },
  ];
  const EXTRA_OPTIONS = props.extraOptions;
  const initialValues = {
    propertyName: "",
    propertyType: "",
    tagRequired: 1,
    defaultValueAsString: "",
    extra: "",
  };
  const { currentNamespaceId } = useStore((state) => state);
  const headers = { Authorization: Cookies.get("userToken") || "" };

  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mainType, setMainType] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState("新增属性");
  const [attributeObj, setAttributeObj] = useState({}); // 存储编辑数据
  // 表单监听
  const currentPropertyType = Form.useWatch("propertyType", form);
  const currentExtra = Form.useWatch("extra", form);
  const currentTagRequired = Form.useWatch("tagRequired", form);
  const curDefaultValueAsString = Form.useWatch("defaultValueAsString", form);

  const [fileList, setFileList] = useState([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState(""); //文件url
  // 控制预览弹窗显示状态
  const [previewVisible, setPreviewVisible] = useState(false);
  // 当前预览的文件信息
  const [currentFile, setCurrentFile] = useState({
    url: "",
    name: "",
  });

  const fileType = getFileType(currentFile.url);

  const accept = useMemo(() => {
    switch (currentExtra) {
      case "image":
        return FILE_TYPES.image.join(",");

      case "audio":
        return FILE_TYPES.audio.join(",");

      case "video":
        return FILE_TYPES.video.join(",");

      case "otherFile":
        return "*";
    }
  }, [currentExtra]);

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: accept,
    fileList,
    showUploadList: {
      showRemoveIcon: true,
    },
    beforeUpload(file) {
      if (file.size > 1024 * 1024 * 5) {
        if (message.error("文件大小不能超过5M")) {
          return Upload.LIST_IGNORE;
        }
      }
      const fileNameLower = file.name.toLowerCase();

      switch (currentExtra) {
        case "image":
          const isImage = FILE_TYPES.image.some((ext) =>
            fileNameLower.endsWith(ext)
          );
          if (!isImage) {
            message.error(`仅支持图片格式${FILE_TYPES.image.join("/")}`);
            return Upload.LIST_IGNORE;
          }
          break;

        case "audio":
          const isAudio = FILE_TYPES.audio.some((ext) =>
            fileNameLower.endsWith(ext)
          );
          if (!isAudio) {
            message.error(`仅支持音频格式${FILE_TYPES.audio.join("/")}`);
            return Upload.LIST_IGNORE;
          }
          if (!file.type.startsWith("audio/")) {
            message.error("请上传音频文件");
            return Upload.LIST_IGNORE;
          }
          break;

        case "video":
          const isVideo = FILE_TYPES.video.some((ext) =>
            fileNameLower.endsWith(ext)
          );
          if (!isVideo) {
            message.error(`仅支持视频格式${FILE_TYPES.video.join("/")}`);
            return Upload.LIST_IGNORE;
          }
          if (!file.type.startsWith("video/")) {
            message.error("请上传视频文件");
            return Upload.LIST_IGNORE;
          }
          break;

        default:
          break;
      }

      return true;
    },
    customRequest({ file, onSuccess, onError }) {
      const formData = new FormData();
      const fileObj = file.originFileObj || file;
      formData.append("file", fileObj, file.name);

      const fileDir = "knowledge/property";

      uploadFileApi(fileDir, formData)
        .then((res) => {
          message.success(`${file.name} 上传成功`);
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
          setFileUrl(baseUrl + res.data);
          const newFile = {
            uid: file.uid || `${Date.now()}`,
            name: file.name,
            status: "done",
            url: baseUrl + res.data,
          };

          setFileList([newFile]);

          form.setFieldsValue({
            defaultValueAsString: baseUrl + res.data, // ✅ 这里同步表单字段
          });
          onSuccess(res.data);
        })
        .catch((err) => {
          console.error(err);
          message.error(`${file.name} 上传失败`);
          onError(err);
        });
    },

    onPreview() {
      // const { defaultValueAsString: fileUrl } = attributeObj;

      if (!fileUrl || typeof fileUrl !== "string") {
        message.warning("没有可预览的文件地址");
        return;
      }

      const fileName = getURLFileName(fileUrl);

      setCurrentFile({
        url: fileUrl,
        name: fileName,
      });

      if (currentPropertyType === "STRING" && currentExtra === "otherFile") {
        window.open(fileUrl, "_blank");
      } else {
        setPreviewVisible(true);
      }
    },

    onRemove() {
      // 清空
      setFileList([]);
      setFileUrl("");
      setFileName("");
      form.setFieldsValue({
        defaultValueAsString: "", // ✅ 这里同步表单字段
      });
      setTimeout(() => {
        form.validateFields(["defaultValueAsString"]).catch((error) => {
          console.log("验证失败（这是预期的）:", error);
        });
      }, 0);
      return true;
    },

    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  useImperativeHandle(componentRef, () => ({
    showModal,
  }));

  const classNames = {
    content: "my-modal-content",
  };

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

  //显示弹窗
  const showModal = (mainType, obj, type) => {
    setMainType(mainType);
    setTitle(type === "edit" ? "编辑属性" : "新增属性");
    setIsEdit(type === "edit");
    setAttributeObj(obj);

    setOpen(true);

    // console.log(obj, "obj");

    form.setFieldsValue({
      ...obj,
      propertyName: type === "edit" ? obj?.propertyName || "" : "",
      propertyType: type === "edit" ? obj?.propertyType || "" : null,
      tagRequired: type === "edit" ? obj?.tagRequired : 1,
      extra: type === "edit" ? obj?.extra : undefined,
      defaultValueAsString:
        type === "edit"
          ? ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
              obj?.propertyType
            )
            ? dayjs(obj.defaultValueAsString, getFormatByType(obj.propertyType))
            : obj.defaultValueAsString
          : "",
    });

    if (
      type === "edit" &&
      obj?.defaultValueAsString &&
      obj?.defaultValueAsString.startsWith("http")
    ) {
      setFileUrl(obj.defaultValueAsString);
      setFileName(getURLFileName(obj.defaultValueAsString));
      setTimeout(() => {
        setFileList([
          {
            name: getURLFileName(obj.defaultValueAsString),
            status: "done",
            url: obj.defaultValueAsString,
          },
        ]);
      }, 10);
    }
  };

  const renderDynamicComponent = () => {
    switch (currentPropertyType) {
      case "DATE":
        return (
          <DatePicker
            format="YYYY-MM-DD"
            placeholder="选择日期"
            style={{ width: "100%" }}
            allowClear
          />
        );
        break;
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
        break;
      case "DATETIME":
      case "TIMESTAMP":
        return (
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择日期"
            style={{ width: "100%" }}
            allowClear
          />
        );
        break;
      case "STRING":
        if (["image", "audio", "video", "otherFile"].includes(currentExtra)) {
          return (
            <Upload {...uploadProps}>
              <Button disabled={!!fileList.length} icon={<UploadOutlined />}>
                上传文件
              </Button>
            </Upload>
          );
        } else {
          return (
            <Input
              autoComplete="off"
              placeholder="请输入默认值"
              value={form.getFieldValue("defaultValueAsString") || ""}
              onChange={(e) => {
                form.setFieldsValue({
                  defaultValueAsString: e.target.value,
                });
              }}
            />
          );
        }
        break;
      case "BOOL":
        return (
          <Select
            allowClear
            value={form.getFieldValue("defaultValueAsString") || undefined}
            onChange={(value) => {
              form.setFieldsValue({ defaultValueAsString: value });
            }}
          >
            <Option value="true">true</Option>
            <Option value="false">false</Option>
          </Select>
        );
        break;
      default:
        return (
          <Input
            autoComplete="off"
            placeholder="请输入默认值"
            value={form.getFieldValue("defaultValueAsString") || ""}
            onChange={(e) => {
              form.setFieldsValue({
                defaultValueAsString: e.target.value,
              });
            }}
          />
        );
        break;
    }
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    form.resetFields();
    setLoading(false); // 加载结束
    setFileList([]);
  };

  //提交事件
  const submitEvent = async (e) => {
    e.preventDefault();
    try {
      const currentValues = form.getFieldsValue();
      if (
        currentPropertyType === "STRING" &&
        ["image", "audio", "video", "otherFile"].includes(currentExtra)
      ) {
        if (
          fileList.length === 0 &&
          currentValues.defaultValueAsString &&
          typeof currentValues.defaultValueAsString === "object"
        ) {
          form.setFieldsValue({
            defaultValueAsString: "",
          });
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      const values = await form.validateFields();

      let formData = {};
      if (
        ["DATE", "DATETIME", "TIMESTAMP", "TIME"].includes(
          values.propertyType
        ) &&
        values.tagRequired === 0
      ) {
        formData = {
          ...values,
          defaultValueAsString: values.defaultValueAsString.format(
            getFormatByType(values.propertyType)
          ),
        };
      } else {
        formData = values;
      }

      setLoading(true);
      if (!isEdit) {
        await addSubmitEvent(formData);
      } else {
        await editSubmitEvent(formData);
      }
    } catch (error) {
      console.error("表单校验失败：", error);
      // message.error("表单填 写有误，请检查后提交");
    }
  };
  //新增提交事件
  const addSubmitEvent = async (formData) => {
    let addData = {
      ...props.currentSub,
      space: props.currentSub.spaceId,
      type: mainType === "substance" ? 0 : 1,
      tagTypes: {
        ...formData,
      },
    };
    createTagEdgePropertiesApi(addData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //修改提交事件
  const editSubmitEvent = async (formData) => {
    let editData = {
      propertyId: attributeObj.propertyId,
      // ...props.currentSub,
      ...attributeObj,
      spaceId: props.currentSub.spaceId,
      type: mainType === "substance" ? 0 : 1,
      ...formData,
    };
    updatePropertyApi(editData)
      .then((res) => {
        submitSuccessEvent();
      })
      .catch((err) => {
        setLoading(false); // 加载结束
        console.log(err);
      });
  };
  //提交成功事件
  const submitSuccessEvent = () => {
    setLoading(false); // 加载结束
    modelCancelEvent();
    message.success("操作成功");
    //调用父元素方法
    props?.searchEvent();
  };

  // 数据类型切换
  const handleTypeChange = (value) => {
    setFileList([]);
    const dateRelatedTypes = ["DATE", "DATETIME", "TIMESTAMP", "TIME"];

    if (value === "STRING") {
      form.setFieldValue("extra", "text");
    } else {
      form.setFieldValue("extra", "");
    }
    if (dateRelatedTypes.includes(value)) {
      form.setFieldValue("defaultValueAsString", null);
    } else {
      form.setFieldValue("defaultValueAsString", "");
    }
  };

  // 附加设置
  const handleExtraChange = (value) => {
    form.setFieldValue("defaultValueAsString", "");
    setFileList([]);
  };

  // 是否必填
  const handleRequireChange = (value) => {
    form.setFieldValue("defaultValueAsString", "");
  };

  useEffect(() => {
    if (
      currentPropertyType === "STRING" &&
      ["image", "audio", "video", "otherFile"].includes(currentExtra)
    ) {
      setFileName(getURLFileName(curDefaultValueAsString));
      fileName &&
        setFileList([
          { name: fileName, status: "done", url: curDefaultValueAsString },
        ]);
    }
    return () => {
      console.log("组件卸载");
    };
  }, [form]);

  const createDefaultValueValidator = (currentPropertyType, currentExtra) => {
    return async (_rule, value) => {
      // 文件上传类型验证
      if (
        currentPropertyType === "STRING" &&
        ["image", "audio", "video", "otherFile"].includes(currentExtra)
      ) {
        if (!value || value === "") {
          return Promise.reject("请上传文件");
        }
        if (value && typeof value === "object" && value.file) {
          return Promise.reject("请上传有效的文件");
        }
        if (typeof value === "string" && value.startsWith("http")) {
          return Promise.resolve();
        }
        return Promise.reject("请上传有效的文件");
      }

      // 其他数据类型验证
      const intTypes = ["INT64", "INT32", "INT16", "INT8"];
      if ([undefined, null, ""].includes(value)) {
        return Promise.reject("请完善属性默认值");
      }
      if (intTypes.includes(currentPropertyType) && !/^-?\d+$/g.test(value)) {
        return Promise.reject("请输入整数");
      }
      if (
        ["FLOAT", "DOUBLE"].includes(currentPropertyType) &&
        !/^-?\d+\.\d+$/.test(value)
      ) {
        return Promise.reject("请输入小数");
      }
      if (
        currentPropertyType === "BOOL" &&
        !["true", "false"].includes(value.toLowerCase())
      ) {
        return Promise.reject("请输入true或false");
      }
      if (
        currentPropertyType === "FIXED_STRING" &&
        value.length > currentExtra * 1
      ) {
        return Promise.reject(`请输入小于${currentExtra}位的字符串`);
      }
      return Promise.resolve();
    };
  };

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="640px"
      closable={false}
      onCancel={modelCancelEvent}
      classNames={classNames}
      destroyOnHidden
    >
      <div
        className={`${styles["knowledge_add_container"]} ${"model_container"}`}
      >
        <div className={styles["knowledge_add_container_header"]}>
          <div className="model_header">
            <div className={styles["knowledge_add_container_header_title"]}>
              {title}
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
            marginTop: 16,
          }}
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              name="basic"
              layout={"horizontal"}
              labelCol={{
                span: 4,
              }}
              wrapperCol={{
                span: 18,
              }}
              initialValues={initialValues}
              autoComplete="off"
            >
              <Form.Item
                label="属性名称"
                name="propertyName"
                rules={[
                  {
                    required: true,
                    validator: async (_rule, value) => {
                      if ([undefined, null, ""].includes(value)) {
                        return Promise.reject("请输入属性名称");
                      }
                      if (/^\d/g.test(value)) {
                        return Promise.reject("不能以数字开头");
                      }
                      if (!/^[A-Za-z0-9\u4e00-\u9fa5_]+$/g.test(value)) {
                        return Promise.reject(
                          "不能包含下划线（_）以外的特殊字符"
                        );
                      }
                      return Promise.resolve();
                    },
                    trigger: ["blur", "change"],
                  },
                ]}
              >
                <Input
                  disabled={isEdit}
                  maxLength={50}
                  placeholder="请输入属性名称"
                  showCount
                />
              </Form.Item>
              <Form.Item
                label="数据类型"
                name="propertyType"
                rules={[
                  {
                    required: true,
                    message: "请选择数据类型",
                    type: "string",
                    trigger: "blur",
                  },
                ]}
              >
                <Select
                  placeholder="请选择数据类型"
                  onChange={handleTypeChange}
                  allowClear
                >
                  {TYPE_LIST.map((item) => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {["STRING", "FIXED_STRING"].includes(currentPropertyType) && (
                <Form.Item
                  label="附加设置"
                  name="extra"
                  rules={[
                    {
                      required: true,
                      validator: async (_rule, value) => {
                        if ([undefined, null, ""].includes(value)) {
                          return Promise.reject("请完善附加值");
                        }
                        if (currentPropertyType === "FIXED_STRING") {
                          // 检查是否为数字
                          if (!/^\d+$/.test(value)) {
                            return Promise.reject("请输入有效的数字");
                          }

                          // 检查数字范围
                          const numValue = parseInt(value, 10);
                          if (numValue < 1 || numValue > 128) {
                            return Promise.reject("请输入1-128之间的数字");
                          }
                        }
                        return Promise.resolve("success");
                      },
                      trigger: ["blur", "change"],
                    },
                  ]}
                >
                  {currentPropertyType === "STRING" && (
                    <Select onChange={handleExtraChange} allowClear>
                      {EXTRA_OPTIONS.map((item) => (
                        <Option key={item.value} value={item.value}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  )}
                  {currentPropertyType === "FIXED_STRING" && (
                    <Input
                      placeholder="请输入定长字符串的长度（1-128）"
                      autoComplete="off"
                    />
                  )}
                </Form.Item>
              )}
              <Form.Item label="是否必填" name="tagRequired">
                <Radio.Group
                  disabled={isEdit}
                  onChange={(e) => handleRequireChange(e.target.value)}
                >
                  <Radio value={0}>必填</Radio>
                  <Radio value={1}>非必填</Radio>
                </Radio.Group>
              </Form.Item>
              {currentTagRequired == 0 && (
                <Form.Item
                  label="属性默认值"
                  name="defaultValueAsString"
                  rules={[
                    {
                      required: true,
                      trigger: ["blur", "change"],
                      validator: createDefaultValueValidator(
                        currentPropertyType,
                        currentExtra
                      ),
                    },
                  ]}
                >
                  {renderDynamicComponent()}
                </Form.Item>
              )}
            </Form>
          </Spin>
        </div>
        <div className="model_footer">
          <Button className="model_footer_btn" onClick={modelCancelEvent}>
            取消
          </Button>
          <Button
            onClick={submitEvent}
            loading={loading}
            className="model_footer_btn"
            type="primary"
          >
            确定
          </Button>
        </div>
      </div>
      {/* 预览弹窗 */}
      <PreviewModal
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        fileData={currentFile}
        fileType={fileType}
      />
    </Modal>
  );
});

export default AddEditAttribute;
