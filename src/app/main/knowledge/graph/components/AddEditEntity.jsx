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
  Drawer,
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
  Row,
  Col,
  Tabs,
  Popover,
  InputNumber,
  Image,
} from "antd";
import {
  UploadOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import styles from "./component.module.css";
import dayjs from "dayjs";
import { useStore } from "@/store/index";
import PreviewModal from "@/app/components/knowledge/PreviewModal";
import Tips from "./Tips";
import {
  getURLFileName,
  getFileType,
  FILE_TYPES,
  images,
} from "@/utils/fileValidation";
import {
  uploadFileApi,
  getTagPropertiesApi,
  saveEntityApi,
  getEntityApi,
  updateEntityApi,
} from "@/api/graph";

const { Option } = Select;

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

const BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
];

const TYPE_LABEL_LIST = {
  text: "STRING",
  image: "图片",
  audio: "音频",
  video: "视频",
  otherFile: "其他文件",
};

const OperationsSlot = {
  left: <div style={{ width: "32px" }}></div>,
  right: (
    <div className={styles["container_tabs_slot"]}>
      <Popover
        placement="right"
        content={<Tips />}
        trigger={["hover", "click"]}
        arrow={true}
        offset={[0, 10]}
        style={{ zIndex: 1000 }}
      >
        <QuestionCircleOutlined
          style={{
            marginLeft: 4,
            cursor: "pointer",
            fontSize: 14,
            color: "#a5a7a8ff",
            position: "relative",
          }}
        />
      </Popover>
      属性说明
    </div>
  ),
};

const AddEditEntity = forwardRef((props, componentRef) => {
  const { currentNamespaceId, isCommonSpace, graphType } = useStore(
    (state) => state
  );

  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [mainType, setMainType] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState("新增实体");
  const [attributeObj, setAttributeObj] = useState({}); // 存储编辑数据
  const [curOntology, setCurOntology] = useState([]); // 所选择的本体项
  const [isAddTag, setIsAddTag] = useState(false); // 判断是否是添加本体
  const [ontologyOptions, setOntologyOptions] = useState([]); // 存储本体列表
  const [propertiesList, setPropertiesList] = useState([]); // 存储属性列表
  const [tabItems, setTabItems] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [entityForm, setEntityForm] = useState({
    file: [],
    spaceId: currentNamespaceId,
    tagId: [],
    tagName: "",
    entityName: "",
    entityProperties: [],
    propertiesList: [],
    entityId: null,
  });
  const [preview, setPreview] = useState({
    isVisible: false,
    name: "",
    src: "",
    type: "",
  });
  const [entityTagInfo, setEntityTagInfo] = useState([]);

  // 权限控制
  const isDisable = useMemo(() => {
    return !isCommonSpace || (!graphType && isEdit);
  }, [isCommonSpace, graphType, isEdit]);

  const canEdit = useMemo(() => {
    return isCommonSpace;
  }, [isCommonSpace]);

  useImperativeHandle(componentRef, () => ({
    initData,
  }));

  // 获取上传文件类型
  const getUploadAccept = (extra) => {
    switch (extra) {
      case "image":
        return images.toString();
      case "audio":
        return "audio/*";
      case "video":
        return "video/*";
      default:
        return "*";
    }
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

  // 设置标签页和属性
  const setTabsAndPropertiesEvent = async (data, list) => {
    const tabs = list.filter((v) => data.includes(v.tagId));
    if (tabs.length > 0) {
      setActiveKey(String(tabs[0].tagId));
    }

    // 判断是否是新增本体
    const isAdd = tabs.length > entityForm.propertiesList.length;
    setIsAddTag(isAdd);

    if (isAdd) {
      // 添加新选择的本体
      // const newProperties = [...entityForm.propertiesList];
      const newProperties = [...propertiesList];

      tabs.forEach((item) => {
        if (!newProperties.some((prop) => prop.tagId === item.tagId)) {
          newProperties.push({
            ...item,
            loading: false,
            children: [],
            propertyValueList: [],
          });
        }
      });
      setEntityForm((prev) => ({ ...prev, propertiesList: newProperties }));
    } else {
      // 移除未选择的本体
      const filteredProperties = entityForm.propertiesList.filter((prop) =>
        data.includes(prop.tagId)
      );
      setEntityForm((prev) => ({
        ...prev,
        tagId: data,
        propertiesList: filteredProperties,
      }));
      return;
    }

    await getTagPropertiesListEvent(data);
  };

  // 初始化数据
  const initData = (type, list, id, currentSub, obj) => {
    setIsEdit(type === "edit");
    setTitle(
      type === "edit"
        ? canEdit || !isDisable
          ? "编辑实体"
          : "查看实体"
        : "新增实体"
    );
    setOpen(true);
    setSubmitLoading(false);
    setOntologyOptions(list);

    setEntityForm({
      file: [],
      spaceId: id,
      tagId: currentSub ? [currentSub.tagId] : [],
      tagName: "",
      entityName: "",
      entityProperties: [],
      propertiesList: [],
      entityId: null,
    });
    setPropertiesList([]);

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        tagId: currentSub ? [currentSub.tagId] : [],
        entityName: "",
        entityId: null,
      });
    }, 0);

    setActiveKey("");
    setTabItems([]);

    if (currentSub) {
      setTabsAndPropertiesEvent([currentSub.tagId], list);
    }

    if (type === "edit" && obj) {
      getEntityInfoEvent(obj);
    }
  };

  // 获取实体详情
  const getEntityInfoEvent = async (obj) => {
    setSpinning(true);
    try {
      const params = {
        entityId: obj.entityId,
        spaceId: entityForm.spaceId,
      };
      const { data } = await getEntityApi(params);

      // 暂存实体属性数据
      setEntityTagInfo(data.tagInfoDetailVOS);

      const updatedPropertiesList = data.tagInfoDetailVOS.map((item) => ({
        spaceId: data.spaceId,
        tagId: item.tagId,
        tagName: item.tagName,
        entityName: data.entityName,
        entityId: data.entityId,
        children: item.entityProperties.map((prop) => {
          let validValue =
            prop.propertyValue || prop.defaultValueAsString || "";
          if (
            ["DATE", "TIME", "DATETIME", "TIMESTAMP"].includes(
              prop.propertyType
            )
          ) {
            const dayjsValue = dayjs(
              validValue,
              getFormatByType(prop.propertyType)
            );
            validValue = dayjsValue.isValid()
              ? dayjsValue.format(getFormatByType(prop.propertyType))
              : "";
          }
          return {
            ...prop,
            propertyValue: validValue,
            propertyValueList: prop.propertyValue
              ? [
                  {
                    name: getURLFileName(prop.propertyValue),
                    extra: prop.extra,
                    response: { data: prop.propertyValue },
                    status: "done",
                  },
                ]
              : [],
          };
        }),
      }));

      // 更新表单数据
      setEntityForm((prev) => ({
        ...prev,
        entityName: data.entityName,
        entityId: data.entityId,
        tagId: data.tagInfoDetailVOS.map((item) => item.tagId),
        tagName: data.tagInfoDetailVOS.map((item) => item.tagName),
        propertiesList: updatedPropertiesList,
      }));
      setPropertiesList(updatedPropertiesList);

      // 设置标签页
      if (data.tagInfoDetailVOS.length > 0) {
        setActiveKey(String(data.tagInfoDetailVOS[0].tagId));
        const tagIds = data.tagInfoDetailVOS.map((item) => item.tagId);
        await getTagPropertiesListEvent(tagIds);
      }
    } catch (error) {
      console.error("获取实体信息失败:", error);
    } finally {
      setSpinning(false);
    }
  };

  // 获取本体属性列表
  const getTagPropertiesListEvent = async (tagIds) => {
    try {
      const { data } = await getTagPropertiesApi(tagIds);
      let properties = [];
      if (data.length > 0) {
        properties = data.map((item) => ({
          ...item,
          propertyValue:
            item.defaultValueAsString && item.defaultValueAsString !== "null"
              ? item.defaultValueAsString
              : "",
          propertyValueList: item.defaultValueAsString
            ? item.extra === "image"
              ? [item.defaultValueAsString]
              : [
                  {
                    name: getURLFileName(item.defaultValueAsString),
                    extra: item.extra,
                    response: { data: item.defaultValueAsString },
                    status: "done",
                  },
                ]
            : [],
        }));

        // 更新属性列表
        setEntityForm((prev) => {
          const updatedProperties = prev.propertiesList.map((prop) => {
            if (!prop.children || prop.children.length === 0) {
              return {
                ...prop,
                children: properties.filter((p) => p.tagId === prop.tagId),
              };
            }
            return prop;
          });
          return { ...prev, tagId: tagIds, propertiesList: updatedProperties };
        });
      }
    } catch (error) {
      console.error("获取属性列表失败:", error);
    }
  };

  useEffect(() => {
    if (entityForm.propertiesList && entityForm.propertiesList.length > 0) {
      const fieldsValue = {};

      entityForm.propertiesList.forEach((prop, pIndex) => {
        if (prop.children && prop.children.length > 0) {
          prop.children.forEach((child, index) => {
            const fieldName = `propertiesList.${pIndex}.children.${index}.propertyValue`;
            const timeTypes = ["DATE", "TIME", "DATETIME", "TIMESTAMP"];
            if (timeTypes.includes(child.propertyType) && child.propertyValue) {
              const format = getFormatByType(child.propertyType);
              const dayjsValue = dayjs(child.propertyValue, format);
              fieldsValue[fieldName] = dayjsValue.isValid() ? dayjsValue : null;
            } else {
              fieldsValue[fieldName] = child.propertyValue || "";
            }
          });
        }
      });
      form.setFieldsValue({
        tagId: entityForm.tagId,
        entityName: entityForm.entityName,
        entityId: entityForm.entityId
          ? entityForm.entityId.toString().slice(-10)
          : "",
        ...fieldsValue,
      });
    }
  }, [entityForm]);

  // 监听属性列表变化
  useEffect(() => {
    const tabs = entityForm.tagId
      .map((tagId) => ontologyOptions.find((v) => v.tagId === tagId))
      .filter((item) => item !== undefined);

    if (tabs.length > 0) {
      const newTabItems = tabs.map((item) => {
        const propertyContents = entityForm.propertiesList
          .map((prop, index) => ({ prop, index }))
          .filter(({ prop }) => prop.tagId === item.tagId)
          .map(({ prop, index }) => (
            <div
              key={`${prop.tagName}-${index}`}
              className={styles["property-content"]}
            >
              {renderTabContent(prop, index)}
            </div>
          ));
        return {
          key: String(item.tagId),
          label: item.tagName,
          children:
            propertyContents.length > 0 ? (
              propertyContents
            ) : (
              <div className={styles["empty-placeholder"]}>
                <img src="/knowledge/graph/empty_img_1.png" alt="empty" />
                <div>暂无数据</div>
              </div>
            ),
        };
      });
      setTabItems(newTabItems);
    }
  }, [entityForm.propertiesList, entityForm.tagId]);

  // 本体变更处理
  const handleTagChange = async (value) => {
    if (value && value.length) {
      let lastTagId = value[value.length - 1];
      setEntityForm((prev) => ({
        ...prev,
        tagId: value,
      }));
      setActiveKey(String(lastTagId));
      await setTabsAndPropertiesEvent(value, ontologyOptions);

      // 编辑模式下新增本体时回显属性
      if (isAddTag && isEdit) {
        const tagInfo = entityTagInfo.find((tag) => tag.tagId === lastTagId);
        if (!tagInfo) return;

        setEntityForm((prev) => {
          const newProperties = prev.propertiesList.map((prop) => {
            if (prop.tagId !== lastTagId) return prop;
            return {
              ...prop,
              children: prop.children.map((child) => {
                const historyProp = tagInfo.entityProperties.find(
                  (p) => p.propertyName === child.propertyName
                );
                return {
                  ...child,
                  propertyValue: historyProp?.propertyValue || "",
                };
              }),
            };
          });
          return { ...prev, tagId: value, propertiesList: newProperties };
        });
      }
    } else {
      setEntityForm((prev) => ({
        ...prev,
        tagId: [],
        tagName: "",
        propertiesList: [],
      }));
      setActiveKey("");
      setTabItems([]);
    }
  };

  // 更新属性值
  const updatePropertyValue = (pIndex, index, value) => {
    setEntityForm((prev) => {
      const newProperties = [...prev.propertiesList];
      if (newProperties[pIndex]?.children) {
        newProperties[pIndex].children[index].propertyValue = value;

        // 更新文件列表
        if (
          ["image", "audio", "video", "otherFile"].includes(
            newProperties[pIndex].children[index].extra
          )
        ) {
          newProperties[pIndex].children[index].propertyValueList = value
            ? [
                {
                  name: getURLFileName(value),
                  url: value,
                  status: "done",
                  extra: newProperties[pIndex].children[index].extra,
                },
              ]
            : [];
        } else {
          newProperties[pIndex].children[index].propertyValueList = value
            ? [
                {
                  name: value,
                  response: {
                    data: value,
                  },
                  extra: newProperties[pIndex].children[index].extra,
                  status: "done",
                },
              ]
            : [];
        }
      }
      return { ...prev, propertiesList: newProperties };
    });
  };

  // 处理文件预览
  const handlePreview = (item) => {
    if (!item.propertyValue) return;

    let type = "";
    if (item.extra === "image") type = "img";
    else if (item.extra === "audio") type = "audio";
    else if (item.extra === "video") type = "video";
    else {
      // 其他文件类型直接下载
      window.open(item.propertyValue, "_blank");
      return;
    }

    setPreview({
      isVisible: true,
      name: item.name,
      src: item.propertyValue,
      type,
    });
  };

  // 属性值验证
  const validateValue = (rule, value, callback) => {
    const { field } = rule;
    const fieldParts = field.split(".");

    const pIndex = parseInt(fieldParts[1]);
    const index = parseInt(fieldParts[3]);

    const property = entityForm.propertiesList[pIndex]?.children?.[index];

    if (!property) {
      return callback();
    }

    // 必填验证
    if (property.tagRequired === 0) {
      if (
        property.propertyType === "STRING" &&
        ["image", "audio", "video", "otherFile"].includes(property.extra)
      ) {
        const hasValue =
          property.propertyValue ||
          (property.propertyValueList && property.propertyValueList.length > 0);
        if (!hasValue) {
          return callback(`请上传${property.propertyName}`);
        }
      } else if (value === undefined || value === null || value === "") {
        return callback(`请输入${property.propertyName}`);
      }
    }

    // 数字类型验证
    if (["FLOAT", "DOUBLE"].includes(property.propertyType) && value) {
      if (!/^-?\d+\.\d+$/.test(value)) {
        return callback("请输入有效的小数");
      }
    }

    // 整数类型验证
    if (
      ["INT64", "INT32", "INT16", "INT8"].includes(property.propertyType) &&
      value
    ) {
      if (!/^-?\d+$/.test(value)) {
        return callback("请输入有效的整数");
      }
    }

    callback();
  };

  // 渲染属性控件
  const renderPropertyControl = (item, pIndex, index) => {
    const { propertyType, extra, propertyValue, propertyValueList } = item;
    const isDisabled = isDisable || !canEdit;

    switch (propertyType) {
      case "DATE":
        return (
          <DatePicker
            format="YYYY-MM-DD"
            disabled={isDisabled}
            placeholder="请选择"
            value={propertyValue ? dayjs(propertyValue, "YYYY-MM-DD") : null}
            onChange={(date) => {
              const newValue = date?.format("YYYY-MM-DD") || "";
              updatePropertyValue(pIndex, index, newValue);
            }}
          />
        );

      case "TIME":
        return (
          <TimePicker
            format="HH:mm:ss"
            disabled={isDisabled}
            placeholder="请选择"
            value={propertyValue ? dayjs(propertyValue, "HH:mm:ss") : null}
            onChange={(time) => {
              const newValue = time?.format("HH:mm:ss") || "";
              updatePropertyValue(pIndex, index, newValue);
            }}
          />
        );

      case "DATETIME":
      case "TIMESTAMP":
        return (
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择"
            disabled={isDisabled}
            value={
              propertyValue ? dayjs(propertyValue, "YYYY-MM-DD HH:mm:ss") : null
            }
            onChange={(date) => {
              const newValue = date?.format("YYYY-MM-DD HH:mm:ss") || "";
              updatePropertyValue(pIndex, index, newValue);
            }}
          />
        );

      case "BOOL":
        return (
          <Select
            disabled={isDisabled}
            value={propertyValue || undefined}
            placeholder="请选择"
            onChange={(value) => updatePropertyValue(pIndex, index, value)}
          >
            {BOOLEAN_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );

      case "STRING":
        if (["image", "audio", "video", "otherFile"].includes(extra)) {
          return (
            <div>
              {extra === "image" ? (
                <div>
                  {propertyValue ? (
                    <div className={styles["image-preview-container"]}>
                      <Image
                        className={styles["image-preview"]}
                        src={propertyValue}
                        alt="preview"
                        width={100}
                        height={100}
                        style={{ objectFit: "cover" }}
                        preview={false}
                      />
                      <div className={styles["image-actions"]}>
                        <Button
                          style={{
                            color: "#b8b9ce",
                            cursor: "pointer",
                            fontSize: "16",
                          }}
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() =>
                            handlePreview({
                              name: getURLFileName(propertyValue),
                              extra: "image",
                              propertyValue: propertyValue,
                            })
                          }
                        />
                        <div className={styles["line"]}></div>
                        <img
                          style={{ width: " 14px", cursor: "pointer" }}
                          src="/knowledge/graph/delete1.svg"
                          onClick={() => updatePropertyValue(pIndex, index, "")}
                        />
                      </div>
                    </div>
                  ) : (
                    <Upload
                      name="file"
                      multiple={false}
                      accept={getUploadAccept(extra)}
                      showUploadList={false}
                      listType="picture-card"
                      beforeUpload={(file) => {
                        if (file.size > 1024 * 1024 * 5) {
                          message.error("文件大小不能超过5M");
                          return Upload.LIST_IGNORE;
                        }
                        const fileNameLower = file.name.toLowerCase();
                        if (extra === "image") {
                          const isImage = images.find((item) =>
                            fileNameLower.includes(item)
                          );
                          if (!isImage) {
                            message.error(`仅支持${images.join("/")}格式`);
                            return Upload.LIST_IGNORE;
                          }
                        }
                        return true;
                      }}
                      customRequest={({ file, onSuccess, onError }) => {
                        const formData = new FormData();
                        const fileObj = file.originFileObj || file;
                        formData.append("file", fileObj, file.name);
                        const fileDir = "knowledge/entity";
                        uploadFileApi(fileDir, formData)
                          .then((res) => {
                            message.success(`${file.name} 上传成功`);
                            const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
                            const fileUrl = baseUrl + res.data;

                            updatePropertyValue(pIndex, index, fileUrl);

                            onSuccess(res.data);
                          })
                          .catch((err) => {
                            console.error(err);
                            message.error(`${file.name} 上传失败`);
                            onError(err);
                          });
                      }}
                    >
                      <div className={styles["upload-container"]}>
                        {item.loading ? (
                          <LoadingOutlined />
                        ) : (
                          <>
                            <PlusOutlined />
                            <p className={styles["upload-tip"]}>
                              {`支持${images.join("/")}格式`}
                            </p>
                          </>
                        )}
                      </div>
                    </Upload>
                  )}
                  <div className={styles["upload-text"]}>
                    建议上传500*500不超过5M的图片
                  </div>
                </div>
              ) : (
                <div>
                  {propertyValueList && propertyValueList[0] ? (
                    <div className={styles["upload_list"]}>
                      <div
                        className={styles["upload_list_item"]}
                        onClick={() => {
                          if (extra === "otherFile") {
                            window.open(propertyValue, "_blank");
                          } else {
                            handlePreview({
                              name: propertyValueList[0].name,
                              extra: extra,
                              propertyValue: propertyValue,
                            });
                          }
                        }}
                      >
                        <img src="/knowledge/graph/file_link.svg" alt="" />
                        <span>{propertyValueList[0].name}</span>
                      </div>
                      <img
                        className={styles["upload_list_delete"]}
                        src="/knowledge/graph/delete1.svg"
                        onClick={() => updatePropertyValue(pIndex, index, "")}
                      />
                    </div>
                  ) : (
                    <Upload
                      name="file"
                      multiple={false}
                      accept={getUploadAccept(extra)}
                      fileList={propertyValueList || []}
                      beforeUpload={(file) => {
                        if (file.size > 1024 * 1024 * 5) {
                          message.error("文件大小不能超过5M");
                          return Upload.LIST_IGNORE;
                        }
                        const fileNameLower = file.name.toLowerCase();
                        switch (extra) {
                          case "audio":
                            if (!file.type.startsWith("audio")) {
                              message.error("请上传音频文件");
                              return Upload.LIST_IGNORE;
                            }
                            break;
                          case "video":
                            if (!file.type.startsWith("video")) {
                              message.error("请上传视频文件");
                              return Upload.LIST_IGNORE;
                            }
                            break;
                          default:
                            break;
                        }
                        return true;
                      }}
                      customRequest={({ file, onSuccess, onError }) => {
                        const formData = new FormData();
                        const fileObj = file.originFileObj || file;
                        formData.append("file", fileObj, file.name);
                        const fileDir = "knowledge/entity";
                        uploadFileApi(fileDir, formData)
                          .then((res) => {
                            message.success(`${file.name} 上传成功`);
                            const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
                            const fileUrl = baseUrl + res.data;

                            updatePropertyValue(pIndex, index, fileUrl);

                            onSuccess(res.data);
                          })
                          .catch((err) => {
                            console.error(err);
                            message.error(`${file.name} 上传失败`);
                            onError(err);
                          });
                      }}
                    >
                      {!propertyValue && (
                        <Button icon={<UploadOutlined />}>上传文件</Button>
                      )}
                    </Upload>
                  )}
                </div>
              )}
            </div>
          );
        }
        // 普通文本输入
        return (
          <Input
            disabled={isDisabled}
            value={propertyValue || ""}
            placeholder="请输入属性值"
            onChange={(e) => updatePropertyValue(pIndex, index, e.target.value)}
          />
        );

      case "FIXED_STRING":
        return (
          <Input.TextArea
            disabled={isDisabled}
            placeholder="请输入属性值"
            value={propertyValue || ""}
            onChange={(e) => updatePropertyValue(pIndex, index, e.target.value)}
            maxLength={Number(item.extra)}
            autoSize
          />
        );

      case "INT64":
      case "INT32":
      case "INT16":
      case "INT8":
        return (
          <InputNumber
            disabled={isDisabled}
            placeholder="请输入属性值"
            value={propertyValue ? Number(propertyValue) : undefined}
            onChange={(value) =>
              updatePropertyValue(pIndex, index, value?.toString() || "")
            }
            precision={0}
            style={{ width: "100%" }}
          />
        );

      // case "DOUBLE":
      //   return (
      //     <InputNumber
      //       disabled={isDisabled}
      //       placeholder="请输入属性值"
      //       value={propertyValue ? Number(propertyValue) : undefined}
      //       onChange={(value) =>
      //         updatePropertyValue(pIndex, index, value?.toString() || "")
      //       }
      //       style={{ width: "100%" }}
      //     />

      //   );

      default:
        return (
          <Input
            disabled={isDisabled}
            placeholder="请输入属性值"
            value={propertyValue || ""}
            onChange={(e) => updatePropertyValue(pIndex, index, e.target.value)}
          />
        );
    }
  };

  // 渲染标签页内容
  const renderTabContent = (prop, pIndex) => {
    const { children } = prop;
    if (!children || children.length === 0) {
      return (
        <div className={styles["empty-placeholder"]}>
          <img src="/knowledge/graph/empty_img_1.png" alt="empty" />
          <div>暂无数据</div>
        </div>
      );
    }

    return (
      <div className={styles["property-list"]}>
        {children.map((item, index) => (
          <Form.Item
            key={`${pIndex}-${index}`}
            label={`${item.propertyName}(
                ${
                  item.propertyType === "STRING"
                    ? item.extra
                      ? TYPE_LABEL_LIST[item.extra]
                      : item.propertyType
                    : item.propertyType
                }
                )`}
            name={`propertiesList.${pIndex}.children.${index}.propertyValue`}
            rules={[
              {
                required: item.tagRequired === 0,
                validator: validateValue,
                trigger: ["blur", "change"],
              },
            ]}
          >
            {/* `propertiesList.${pIndex}.children.${index}.propertyValue` */}
            {renderPropertyControl(item, pIndex, index)}
          </Form.Item>
        ))}
      </div>
    );
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 表单验证
      await form.validateFields();
      setSubmitLoading(true);

      // 格式化提交数据
      const { propertiesList, entityName, entityId, spaceId } = entityForm;

      const formattedData = propertiesList.map((prop) => ({
        spaceId,
        tagId: prop.tagId,
        tagName: prop.tagName,
        entityName,
        entityId: isEdit ? entityId : null,
        entityProperties: prop.children,
      }));

      // 提交请求
      if (!isEdit) {
        await saveEntityApi(formattedData);
        message.success("新增实体成功");
      } else {
        await updateEntityApi({
          entityId,
          entityName,
          spaceId,
          tagInfoDetailVOS: formattedData.map((prop) => {
            const { children, ...rest } = prop;
            return rest;
          }),
        });
        message.success("编辑实体成功");
      }

      // 关闭弹窗并刷新列表
      handleCancel();
      props.searchEvent();
    } catch (error) {
      console.error("表单提交失败:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setEntityForm({
      file: [],
      spaceId: currentNamespaceId,
      tagId: [],
      tagName: "",
      entityName: "",
      entityProperties: [],
      propertiesList: [],
      entityId: null,
    });
    setActiveKey("");
    setTabItems([]);
    setPreview({ isVisible: false, name: "", src: "", type: "" });
    setPropertiesList([]);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setOpen(false);
    setIsEdit(false);
    setTitle("");
    form.resetFields();
    resetForm();
  };

  const [position, setPosition] = useState(["left", "right"]);
  const slot = useMemo(() => {
    if (position.length === 0) {
      return null;
    }
    return position.reduce(
      (acc, direction) => ({ ...acc, [direction]: OperationsSlot[direction] }),
      {}
    );
  }, [position]);

  return (
    <Drawer
      open={open}
      title={null}
      footer={null}
      width={720}
      closable={false}
      onClose={handleCancel}
      className={styles["drawer_panal"]}
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
              onClick={handleCancel}
              src="/close.png"
              alt=""
            />
          </div>
        </div>
        <div
          className={styles["model_content"]}
          style={{
            margin: 16,
            marginTop: 32,
            width: "90%",
            height: "calc(100vh - 240px)",
          }}
        >
          <Form
            style={{
              display: "flex",
              flexDirection: "column",
            }}
            form={form}
            name="basic"
            layout={"horizontal"}
            layout="vertical"
            autoComplete="off"
          >
            <Row justify={"space-between"}>
              <Col span={12}>
                <Form.Item
                  label="所属本体"
                  name="tagId"
                  rules={[{ required: true, message: "请选择所属本体" }]}
                >
                  <Select
                    mode="multiple"
                    disabled={isDisable || !graphType}
                    placeholder="请选择本体"
                    onChange={handleTagChange}
                    allowClear
                    maxTagCount={3}
                  >
                    {ontologyOptions.map((item) => (
                      <Option key={item.tagId} value={item.tagId}>
                        {item.tagName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={11}>
                <Form.Item label="VID" name="entityId">
                  <Input disabled placeholder="保存后系统自动生成" />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  label="实体名称"
                  name="entityName"
                  rules={[
                    {
                      required: true,
                      validator: async (_rule, value) => {
                        if ([undefined, null, ""].includes(value)) {
                          return Promise.reject("请输入实体名称");
                        }
                        // if (/^\d/g.test(value)) {
                        //   return Promise.reject("不能以数字开头");
                        // }
                        // 更新正则表达式以支持更多字符
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
                  ]}
                >
                  <Input
                    placeholder="请输入实体名称"
                    value={entityForm.entityName}
                    onChange={(e) => {
                      setEntityForm((prev) => ({
                        ...prev,
                        entityName: e.target.value,
                      }));
                    }}
                    maxLength={50}
                    disabled={isDisable}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <div
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  flex: 1,
                  height: "calc(100vh - 400px)",
                }}
              >
                {!activeKey ? (
                  <div className={styles["empty-placeholder"]}>
                    <img src="/knowledge/graph/empty_img.png" alt="empty" />
                    <div>当前还未选择本体</div>
                  </div>
                ) : (
                  <Tabs
                    className={styles["container_tabs"]}
                    activeKey={activeKey}
                    onChange={(e) => setActiveKey(e)}
                    tabBarExtraContent={slot}
                    items={tabItems.map((item) => ({
                      key: item.key,
                      label: item.label,
                      children: item.children,
                    }))}
                  />
                )}
              </div>
            </Row>
          </Form>
        </div>
        {(!graphType && isCommonSpace) || canEdit ? (
          <div className="model_footer">
            <Button
              className="model_footer_btn"
              onClick={handleCancel}
              disabled={submitLoading}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitLoading}
              className="model_footer_btn"
              type="primary"
              disabled={isDisable && !canEdit}
            >
              确定
            </Button>
          </div>
        ) : null}
      </div>
      {/* 预览弹窗 */}
      <PreviewModal
        visible={preview.isVisible}
        onCancel={() => setPreview({ ...preview, isVisible: false })}
        fileData={{ name: preview.name, url: preview.src }}
        fileType={getFileType(preview.src)}
      />
    </Drawer>
  );
});

export default AddEditEntity;
