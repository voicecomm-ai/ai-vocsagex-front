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
  AutoComplete,
  InputNumber,
  Image,
} from "antd";
import {
  UploadOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  LoadingOutlined,
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
  getEdgesList,
  getEntityList,
  getEdgePropertiesList,
  selectLikeEntity,
  saveRelation,
  updateRelation,
  getRelationInfo,
} from "@/api/graph";

const { Option } = Select;
const { TextArea } = Input;

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
  { label: "true", value: "TRUE" },
  { label: "false", value: "FALSE" },
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

const AddEditRelation = forwardRef((props, componentRef) => {
  const { currentNamespaceId, isCommonSpace, graphType } = useStore(
    (state) => state
  );

  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState("新增关系数据");

  const [subjectOptions, setSubjectOptions] = useState([]); // 存储关系列表
  const [objectOptions, setObjectOptions] = useState([]);

  const [edgeList, setEdgeList] = useState([]); // 存储关系列表
  const [subjectList, setSubjectList] = useState([]); // 存储主体类型
  const [objectList, setObjectList] = useState([]); // 存储客体类型

  // 表单数据
  const [formData, setFormData] = useState({
    spaceId: currentNamespaceId,
    edgeId: undefined,
    subjectTagId: undefined,
    subjectTagName: "",
    subjectName: "",
    subjectId: undefined,
    objectTagId: undefined,
    objectTagName: "",
    objectName: "",
    objectId: undefined,
    propertiesList: [],
    entityProperties: [],
    file: [],
    rank: undefined,
  });

  // 预览相关
  const [preview, setPreview] = useState({
    isVisible: false,
    name: "",
    src: "",
    type: "",
  });

  // 其他状态
  const [drawerBtnType, setDrawerBtnType] = useState("add");
  const [randomKey, setRandomKey] = useState(Date.now());
  const [contentHeight, setContentHeight] = useState(570);
  const [cardHeight, setCardHeight] = useState(0);

  // 权限控制
  const isDisable = useMemo(() => {
    return !isCommonSpace || (!graphType && isEdit);
  }, [isCommonSpace, graphType, isEdit]);

  useImperativeHandle(componentRef, () => ({
    initData,
  }));

  // 防抖处理
  const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
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

  // 上传提示文本
  const getUploadTips = (extra) => {
    if (extra === "image") {
      return `支持${FILE_TYPES.image.join("/")}格式`;
    }
    if (extra === "video") {
      return "支持mp4、AVI、mov、wmv、flv格式";
    }
    if (extra === "audio") {
      return "支持mp3、WMA、WAV格式";
    }
    return "";
  };

  // 更新属性值
  const updatePropertyValue = (index, updates) => {
    setFormData((prev) => {
      const newProperties = [...prev.propertiesList];
      if (newProperties[index]) {
        newProperties[index] = { ...newProperties[index], ...updates };
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

  // 处理文件删除
  const handleFileRemove = (index) => {
    updatePropertyValue(index, {
      propertyValue: "",
      propertyValueList: [],
      loading: false,
    });
  };

  // 主体搜索处理
  const handleSubjectSearch = debounce(async (value) => {
    if (value) {
      // 校验是否以数字开头
      // if (/^\d/g.test(value)) {
      //   setSubjectOptions([]);
      //   return;
      // }

      // 校验是否包含非法字符
      if (
        !/^[A-Za-z0-9\u4e00-\u9fa5_\-\s""（）()【】\[\]、—\/.'‘’“”]*$/.test(
          value
        )
      ) {
        setSubjectOptions([]);
        return;
      }

      // 校验长度
      if (value.length > 50) {
        setSubjectOptions([]);
        return;
      }
    }

    try {
      const params = {
        spaceId: formData.spaceId,
        tagName: formData.subjectTagName,
        entityName: value,
      };

      const { data } = await selectLikeEntity(params);
      const options = data.map((x) => {
        const entityIdSuffix = x.entityId ? x.entityId.slice(-10) : "";
        const suffix = x.entityId ? `（${entityIdSuffix}）` : "（新建）";
        return {
          value: x.entityId,
          label: `${x.entityName}${suffix}`,
          title: x.entityName,
          key: x.entityId,
          originLabel: x.entityName,
        };
      });

      // 添加新建选项
      if (value) {
        options.unshift({
          value: "",
          label: `${value}（新建）`,
          title: value,
          key: Date.now(),
          originLabel: value,
        });
      }
      setSubjectOptions(options);
    } catch (error) {
      console.error("搜索主体失败:", error);
    }
  }, 300);

  // 客体搜索处理
  const handleObjectSearch = debounce(async (value) => {
    if (value) {
      // 校验是否以数字开头
      // if (/^\d/g.test(value)) {
      //   setObjectOptions([]);
      //   return;
      // }

      // 校验是否包含非法字符
      if (
        !/^[A-Za-z0-9\u4e00-\u9fa5_\-\s""（）()【】\[\]、—\/.'‘’“”]*$/.test(
          value
        )
      ) {
        setObjectOptions([]);
        return;
      }

      // 校验长度
      if (value.length > 50) {
        setObjectOptions([]);
        return;
      }
    }

    try {
      const params = {
        spaceId: formData.spaceId,
        tagName: formData.objectTagName,
        entityName: value,
      };

      const { data } = await selectLikeEntity(params);
      const options = data.map((x) => {
        const entityIdSuffix = x.entityId ? x.entityId.slice(-10) : "";
        const suffix = x.entityId ? `（${entityIdSuffix}）` : "（新建）";
        return {
          value: x.entityId,
          label: `${x.entityName}${suffix}`,
          title: x.entityName,
          key: x.entityId,
          originLabel: x.entityName,
        };
      });

      // 添加新建选项
      if (value) {
        options.unshift({
          value: "",
          label: `${value}（新建）`,
          title: value,
          key: Date.now(),
          originLabel: value,
        });
      }

      setObjectOptions(options);
    } catch (error) {
      console.error("搜索客体失败:", error);
    }
  }, 300);

  // 选择主体或客体
  const handleSelect = (type, option) => {
    if (type === "subject") {
      setFormData((prev) => ({
        ...prev,
        subjectId: option.value,
        subjectName: option.originLabel,
      }));
    } else if (type === "object") {
      setFormData((prev) => ({
        ...prev,
        objectId: option.value,
        objectName: option.originLabel,
      }));
    }
  };

  // 根据选择的主体id获取主体类型
  const handleSubjectIdChange = (value) => {
    const subject = subjectList.find((x) => x.tagId === value);
    setFormData((prev) => ({
      ...prev,
      subjectTagId: value,
      subjectTagName: subject ? subject.tagName : "",
      subjectName: "",
      subjectId: null,
    }));
    form.setFieldsValue({ subjectName: "" });
  };

  // 根据选择的客体id获取客体类型
  const handleObjectIdChange = (value) => {
    const object = objectList.find((x) => x.tagId === value);
    setFormData((prev) => ({
      ...prev,
      objectTagId: value,
      objectTagName: object ? object.tagName : "",
      objectName: "",
      objectId: null,
    }));
    form.setFieldsValue({ objectName: "" });
  };

  // 关系变更处理
  const handleEdgeIdChange = async (value) => {
    setFormData((prev) => ({
      ...prev,
      edgeId: value,
      propertiesList: [],
    }));

    if (value) {
      await getEdgePropertiesListEvent(value);
    }
  };

  // 获取选择关系下的属性值
  const getEdgePropertiesListEvent = async (edgeId) => {
    setSpinning(true);
    try {
      const { data } = await getEdgePropertiesList(edgeId);

      const properties = data.map((v) => ({
        ...v,
        isValidatorError: false,
        loading: false,
        propertyValue:
          v.defaultValueAsString && v.defaultValueAsString !== "null"
            ? v.defaultValueAsString
            : "",
        propertyValueList: v.defaultValueAsString
          ? [
              {
                name: getURLFileName(v.defaultValueAsString),
                extra: v.extra,
                response: { data: v.defaultValueAsString },
                status: "done",
              },
            ]
          : [],
      }));

      setFormData((prev) => ({
        ...prev,
        propertiesList: properties,
      }));

      setTimeout(() => {
        getTableHeight();
      }, 0);
    } catch (error) {
      console.error("获取关系属性失败:", error);
      message.error("获取关系属性失败");
    } finally {
      setSpinning(false);
    }
  };

  // 获取关系列表
  const getEdgesListEvent = async (id) => {
    try {
      const { data } = await getEdgesList(id);
      setEdgeList(data);
    } catch (error) {
      console.error("获取关系列表失败:", error);
    }
  };

  // 获取主体客体列表
  const getEntityListEvent = async (id) => {
    try {
      const { data } = await getEntityList(id);
      setSubjectList(data);
      setObjectList(data);
    } catch (error) {
      console.error("获取实体列表失败:", error);
    }
  };

  // 编辑时获取关系详情
  const getEdgesInfoEvent = async (obj) => {
    const { spaceId, edgeId } = formData;
    const params = {
      spaceId,
      edgeId,
      edgeName: obj.edgeName,
      subjectId: obj.subjectId,
      objectId: obj.objectId,
      rank: obj.rank,
    };

    setSpinning(true);
    try {
      const { data } = await getRelationInfo(params);

      // 更新表单数据
      setFormData((prev) => ({
        ...prev,
        entityProperties: data.entityProperties,
        // 循环匹配属性名相同的赋值属性值
        propertiesList: prev.propertiesList.map((prop) => {
          const matchedProp = data.entityProperties.find(
            (e) => e.propertyName === prop.propertyName
          );
          if (matchedProp) {
            let validValue =
              matchedProp.propertyValue ||
              matchedProp.defaultValueAsString ||
              "";
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
              propertyValueList: matchedProp.propertyValue
                ? [
                    {
                      name: getURLFileName(matchedProp.propertyValue),
                      extra: prop.extra,
                      response: { data: matchedProp.propertyValue },
                      status: "done",
                    },
                  ]
                : [],
            };
          }
          return prop;
        }),
      }));
    } catch (error) {
      console.error("获取关系详情失败:", error);
      message.error("获取关系详情失败");
    } finally {
      setSpinning(false);
    }
  };

  // 获取当前表格的高度
  const getTableHeight = () => {
    const container = document.querySelector(
      `.${styles["attribute_container"]}`
    );
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const clientHeight = document.body.clientHeight;

    cardHeight.current = clientHeight - 80 - 24 - 290;
    setCardHeight(clientHeight - 80 - 24 - 290);

    const contentHeightVal = clientHeight - containerRect.top - 80 - 24 - 80;
    setContentHeight(Math.max(contentHeightVal, 200));
  };

  // 初始化数据
  const initData = async (type, list, id, currentSub, obj) => {
    setDrawerBtnType(type);
    setIsEdit(type === "edit");
    setTitle(
      type === "edit"
        ? isDisable
          ? "查看关系数据"
          : "编辑关系数据"
        : "新增关系数据"
    );

    setFormData({
      spaceId: id,
      edgeId: currentSub.edgeId || null,
      subjectTagId: obj?.subjectTagId || null,
      subjectTagName: obj?.subjectTagName || "",
      subjectName: obj?.subjectName || "",
      subjectId: obj?.subjectId || null,
      objectTagId: obj?.objectTagId || null,
      objectTagName: obj?.objectTagName || "",
      objectName: obj?.objectName || "",
      objectId: obj?.objectId || null,
      propertiesList: [],
      entityProperties: [],
      file: [],
      rank: obj?.rank || undefined,
    });

    setOpen(true);
    setSubmitLoading(false);
    setRandomKey(Date.now());

    // 获取关系列表和实体列表
    await Promise.all([getEdgesListEvent(id), getEntityListEvent(id)]);

    // 如果是编辑模式或有指定关系ID，获取属性列表
    if ((type === "edit" && obj) || currentSub) {
      const edgeIdToLoad = currentSub.edgeId;

      if (edgeIdToLoad) {
        await getEdgePropertiesListEvent(edgeIdToLoad);

        // 如果是编辑模式，获取关系详情
        if (type === "edit" && obj) {
          await getEdgesInfoEvent(obj);
        }
      }
    }

    setTimeout(() => {
      getTableHeight();
    }, 0);
  };

  useEffect(() => {
    if (open && formData) {
      const fieldsValue = {
        edgeId: formData.edgeId,
        subjectTagId: formData.subjectTagId,
        subjectName: formData.subjectName,
        objectTagId: formData.objectTagId,
        objectName: formData.objectName,
      };
      formData.propertiesList?.forEach((item, index) => {
        // 对时间类型进行特殊处理
        let propertyValue = item.propertyValue || "";
        let formattedValue = propertyValue;

        const timeTypes = ["DATE", "TIME", "DATETIME", "TIMESTAMP"];
        if (timeTypes.includes(item.propertyType) && propertyValue) {
          const format = getFormatByType(item.propertyType);
          const dayjsValue = dayjs(propertyValue, format);
          if (dayjsValue.isValid()) {
            formattedValue = dayjsValue;
          } else {
            formattedValue = null;
          }
        }
        fieldsValue[`propertiesList.${index}.propertyValue`] = formattedValue;
      });
      form.setFieldsValue(fieldsValue);
    }
  }, [open, formData]);

  const uploadButton = (loading) => {
    return (
      <button style={{ border: 0, background: "none" }} type="button">
        {loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div style={{ marginTop: 8 }}>上传</div>
      </button>
    );
  };

  // 渲染属性控件
  const renderPropertyControl = (item, index) => {
    const { propertyType, extra, propertyValue, propertyValueList, loading } =
      item;

    const isDisabled = isDisable;
    // 处理文件类型属性
    if (
      propertyType === "STRING" &&
      extra &&
      ["image", "audio", "video", "otherFile"].includes(extra)
    ) {
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
                      onClick={() =>
                        updatePropertyValue(index, {
                          propertyValue: "",
                          propertyValueList: [],
                          loading: false,
                        })
                      }
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
                    const fileDir = "knowledge/relation";
                    uploadFileApi(fileDir, formData)
                      .then((res) => {
                        message.success(`${file.name} 上传成功`);
                        const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
                        const fileUrl = baseUrl + res.data;

                        updatePropertyValue(index, {
                          propertyValue: fileUrl,
                          propertyValueList: [
                            {
                              name: file.name,
                              extra: extra,
                              response: { data: fileUrl },
                              status: "done",
                            },
                          ],
                          loading: false,
                        });

                        onSuccess(res.data);
                      })
                      .catch((err) => {
                        console.error(err);
                        message.error(`${file.name} 上传失败`);
                        updatePropertyValue(index, { loading: false });
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
                    onClick={() =>
                      updatePropertyValue(index, {
                        propertyValue: "",
                        propertyValueList: [],
                        loading: false,
                      })
                    }
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
                    const fileDir = "knowledge/relation";
                    uploadFileApi(fileDir, formData)
                      .then((res) => {
                        message.success(`${file.name} 上传成功`);
                        const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
                        const fileUrl = baseUrl + res.data;

                        updatePropertyValue(index, {
                          propertyValue: fileUrl,
                          propertyValueList: [
                            {
                              name: file.name,
                              extra: extra,
                              response: { data: fileUrl },
                              status: "done",
                            },
                          ],
                          loading: false,
                        });

                        onSuccess(res.data);
                      })
                      .catch((err) => {
                        console.error(err);
                        message.error(`${file.name} 上传失败`);
                        updatePropertyValue(index, {
                          propertyValue: "",
                          propertyValueList: [],
                          loading: false,
                        });
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

    // 处理数字类型
    if (["INT64", "INT32", "INT16", "INT8"].includes(propertyType)) {
      return (
        <InputNumber
          disabled={isDisabled}
          value={propertyValue || ""}
          onChange={(value) =>
            updatePropertyValue(index, {
              propertyValue: value?.toString() || "",
            })
          }
          controls={false}
          style={{ width: "100%" }}
          placeholder="请输入属性值"
          precision={0}
        />
      );
    }

    // 处理浮点类型
    if (["FLOAT", "DOUBLE"].includes(propertyType)) {
      return (
        <Input
          disabled={isDisabled}
          value={propertyValue || ""}
          onChange={(e) =>
            updatePropertyValue(index, { propertyValue: e.target.value })
          }
          placeholder="请输入属性值"
        />
      );
    }

    // 处理时间类型
    if (propertyType === "TIME") {
      return (
        <TimePicker
          disabled={isDisabled}
          placeholder="请选择"
          value={propertyValue ? dayjs(propertyValue, "HH:mm:ss") : null}
          onChange={(time) => {
            const newValue = time?.format("HH:mm:ss") || "";
            updatePropertyValue(index, { propertyValue: newValue });
          }}
          format="HH:mm:ss"
          style={{ width: "100%" }}
        />
      );
    }

    // 处理日期类型
    if (propertyType === "DATE") {
      return (
        <DatePicker
          disabled={isDisabled}
          placeholder="请选择"
          value={propertyValue ? dayjs(propertyValue, "YYYY-MM-DD") : null}
          onChange={(date) => {
            const newValue = date?.format("YYYY-MM-DD") || "";
            updatePropertyValue(index, { propertyValue: newValue });
          }}
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
        />
      );
    }

    // 处理日期时间类型
    if (propertyType === "DATETIME" || propertyType === "TIMESTAMP") {
      return (
        <DatePicker
          disabled={isDisabled}
          placeholder="请选择"
          value={
            propertyValue ? dayjs(propertyValue, "YYYY-MM-DD HH:mm:ss") : null
          }
          onChange={(date) => {
            const newValue = date?.format("YYYY-MM-DD HH:mm:ss") || "";
            updatePropertyValue(index, { propertyValue: newValue });
          }}
          showTime={{ defaultValue: dayjs("00:00:00", "HH:mm:ss") }}
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
        />
      );
    }

    // 处理布尔类型
    if (propertyType === "BOOL") {
      return (
        <Select
          disabled={isDisabled}
          placeholder="请选择"
          value={propertyValue || undefined}
          onChange={(value) =>
            updatePropertyValue(index, { propertyValue: value })
          }
          style={{ width: "100%" }}
        >
          {BOOLEAN_OPTIONS.map((opt) => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    // 处理固定长度字符串
    if (propertyType === "FIXED_STRING") {
      return (
        <TextArea
          disabled={isDisabled}
          value={propertyValue || ""}
          onChange={(e) =>
            updatePropertyValue(index, { propertyValue: e.target.value })
          }
          placeholder="请输入属性值"
          autoSize
          maxLength={Number(item.extra)}
        />
      );
    }

    // 默认文本输入
    return (
      <TextArea
        disabled={isDisabled}
        value={propertyValue || ""}
        onChange={(e) =>
          updatePropertyValue(index, { propertyValue: e.target.value })
        }
        placeholder="请输入属性值"
        autoSize
      />
    );
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 表单验证
      await form.validateFields();
      setSubmitLoading(true);

      // 准备提交数据
      const params = {
        ...formData,
        edgeName:
          edgeList.find((v) => v.edgeId === formData.edgeId)?.edgeName || "",
      };

      // 处理属性数据
      params.entityProperties = params.propertiesList.filter((e) => {
        const isFile = ["image", "video", "audio", "otherFile"].includes(
          e.extra
        );
        return isFile
          ? e.propertyValue && e.propertyValueList?.length
          : !(
              e.propertyValue == undefined ||
              e.propertyValue == "" ||
              e.propertyValue == null
            );
      });

      // 删除不需要提交的字段
      delete params.propertiesList;
      delete params.file;

      // 提交请求
      if (drawerBtnType === "edit") {
        // 编辑模式
        delete params.objectTagId;
        delete params.subjectTagId;
        await updateRelation(params);
        message.success("编辑成功");
      } else {
        // 新增模式
        await saveRelation([params]);
        message.success("新建成功");
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

  // 关闭弹窗
  const handleCancel = () => {
    setOpen(false);
    setFormData({
      spaceId: currentNamespaceId,
      edgeId: undefined,
      subjectTagId: undefined,
      subjectTagName: "",
      subjectName: "",
      subjectId: undefined,
      objectTagId: undefined,
      objectTagName: "",
      objectName: "",
      objectId: undefined,
      propertiesList: [],
      entityProperties: [],
      file: [],
      rank: undefined,
    });
    form.resetFields();
    setPreview({ isVisible: false, name: "", src: "", type: "" });
  };

  // 属性值验证
  const validateValue = (rule, value, callback) => {
    const { field } = rule;
    const index = field.split(".")[1];
    const property = formData.propertiesList[index];

    if (!property) {
      return callback();
    }

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

  const createEntityNameValidator = (customMessage = "名称") => {
    return async (rule, value) => {
      if ([undefined, null, ""].includes(value)) {
        return Promise.reject(`请输入${customMessage}`);
      }
      // if (/^\d/g.test(value)) {
      //   return Promise.reject("不能以数字开头");
      // }
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
    };
  };

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
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
            form={form}
            name="basic"
            layout={"horizontal"}
            layout="vertical"
            autoComplete="off"
          >
            <Row justify={"space-between"} gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="关系名称"
                  name="edgeId"
                  rules={[{ required: true, message: "请选择关系" }]}
                >
                  <Select
                    disabled={isDisable || drawerBtnType === "edit"}
                    placeholder="请选择"
                    onChange={handleEdgeIdChange}
                    value={formData.edgeId}
                    allowClear
                    maxTagCount={3}
                  >
                    {edgeList.map((item) => (
                      <Option key={item.edgeId} value={item.edgeId}>
                        {item.edgeName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row justify={"space-between"} gutter={24}>
              <Col span={10}>
                <Form.Item
                  label="主体类型"
                  name="subjectTagId"
                  rules={[{ required: true, message: "请选择主体类型" }]}
                >
                  <Select
                    disabled={isDisable || !graphType}
                    placeholder="请选择"
                    value={formData.subjectTagId}
                    onChange={handleSubjectIdChange}
                    disabled={drawerBtnType === "edit"}
                  >
                    {subjectList.map((item) => (
                      <Option key={item.tagId} value={item.tagId}>
                        {item.tagName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item
                  label="主体名称"
                  name="subjectName"
                  rules={[
                    {
                      required: true,
                      validator: createEntityNameValidator("主体名称"),
                      trigger: ["blur", "change"],
                    },
                  ]}
                >
                  <AutoComplete
                    value={formData.subjectName}
                    options={subjectOptions}
                    placeholder="请输入主体名称"
                    disabled={
                      drawerBtnType === "edit" || !formData.subjectTagId
                    }
                    onSearch={handleSubjectSearch}
                    onFocus={() => handleSubjectSearch(formData.subjectName)}
                    onSelect={(value, option) =>
                      handleSelect("subject", option)
                    }
                    filterOption={false}
                  >
                    <Input
                      value={formData.subjectName}
                      onChange={(e) => {
                        const value = e.target.value.substr(0, 50);
                        setFormData((prev) => ({
                          ...prev,
                          subjectName: value,
                        }));
                      }}
                    />
                  </AutoComplete>
                </Form.Item>
              </Col>
            </Row>
            <Row justify={"space-between"} gutter={24}>
              <Col span={10}>
                <Form.Item
                  label="客体类型"
                  name="objectTagId"
                  rules={[{ required: true, message: "请选择客体类型" }]}
                >
                  <Select
                    disabled={isDisable || !graphType}
                    placeholder="请选择"
                    value={formData.objectTagId}
                    onChange={handleObjectIdChange}
                    disabled={drawerBtnType === "edit"}
                  >
                    {subjectList.map((item) => (
                      <Option key={item.tagId} value={item.tagId}>
                        {item.tagName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item
                  label="客体名称"
                  name="objectName"
                  rules={[
                    {
                      required: true,
                      validator: createEntityNameValidator("客体名称"),
                      trigger: ["blur", "change"],
                    },
                  ]}
                >
                  <AutoComplete
                    value={formData.objectName}
                    options={objectOptions}
                    placeholder="请输入客体名称"
                    disabled={drawerBtnType === "edit" || !formData.objectTagId}
                    onSearch={handleObjectSearch}
                    onFocus={() => handleObjectSearch(formData.objectName)}
                    onSelect={(value, option) => handleSelect("object", option)}
                    filterOption={false}
                  >
                    <Input
                      value={formData.objectName}
                      onChange={(e) => {
                        const value = e.target.value.substr(0, 50);
                        setFormData((prev) => ({ ...prev, objectName: value }));
                      }}
                    />
                  </AutoComplete>
                </Form.Item>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              gutter={24}
              wrap={false}
              style={{
                maxHeight: "calc(100vh - 480px)",
                minHeight: "calc(100vh - 480px)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  margin: "0 12px 0 14px",
                  border: "1px solid #ccc",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className={styles["container_tab"]}>
                  <div
                    className={styles["container_tabs_slot"]}
                    style={{ paddingLeft: "16px" }}
                  >
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
                </div>
                {formData.propertiesList &&
                formData.propertiesList.length > 0 ? (
                  <div className={styles["prop-content"]}>
                    {formData.propertiesList.map((item, index) => {
                      return (
                        <Col key={`${item.propertyName}-${index}`} span={24}>
                          <Form.Item
                            label={`${item.propertyName}（
                          ${
                            item.propertyType === "STRING"
                              ? item.extra
                                ? TYPE_LABEL_LIST[item.extra]
                                : item.propertyType
                              : item.propertyType
                          }
                        ）`}
                            name={`propertiesList.${index}.propertyValue`}
                            rules={[
                              {
                                required: item.tagRequired === 0,
                                validator: validateValue,
                                trigger: ["blur", "change"],
                              },
                            ]}
                            className={styles["property_item"]}
                          >
                            {renderPropertyControl(item, index)}
                          </Form.Item>
                        </Col>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles["empty-placeholder"]}>
                    <img src="/knowledge/graph/empty_img_1.png" alt="empty" />
                    <div>暂无数据</div>
                  </div>
                )}
              </div>
            </Row>
          </Form>
        </div>
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
            disabled={isDisable}
          >
            确定
          </Button>
        </div>
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
export default AddEditRelation;
