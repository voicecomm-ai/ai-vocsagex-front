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
  Row,
  Col,
  Tabs,
  Popover,
} from "antd";
import {
  UploadOutlined,
  QuestionCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import styles from "./component.module.css";
import dayjs from "dayjs";
import { useStore } from "@/store/index";
import Tips from "./Tips";
import {
  getURLFileName,
  getFileType,
  FILE_TYPES,
} from "@/utils/fileValidation";
import { importEntityApi, uploadFileApi, importRelationApi } from "@/api/graph";

const ImportModel = forwardRef((props, componentRef) => {
  const { currentNamespaceId } = useStore((state) => state);

  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mainType, setMainType] = useState("");
  const [title, setTitle] = useState("批量导入");
  const [tagList, setTagList] = useState([]); // 列表
  const [selectedTags, setSelectedTags] = useState([]); // 存储选中的标签
  const [originFile, setOriginFile] = useState([]); // 原始文件
  const [fileList, setFileList] = useState([]);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState(""); //文件url
  // 当前预览的文件信息
  const [currentFile, setCurrentFile] = useState({
    url: "",
    name: "",
  });
  const fileType = getFileType(currentFile.url);

  const fileProps = {
    name: "file",
    multiple: true,
    fileList,
    showUploadList: false,
    beforeUpload(file) {
      let suffix = file.name.split(".")[1];
      if (!(suffix === "xlsx" || suffix === "xls")) {
        message.error("支持xlsx/xls格式文件");
        return false;
      }

      return true;
    },
    customRequest({ file, onSuccess, onError }) {
      const formData = new FormData();
      const fileObj = file.originFileObj || file;
      formData.append("file", fileObj, file.name);

      const fileDir = "knowledge/entity";

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
          setOriginFile([file]);

          form.setFieldsValue({
            importData: [file],
          });

          onSuccess(res.data);
        })
        .catch((err) => {
          console.error(err);
          message.error(`${file.name} 上传失败`);
          onError(err);
        });
    },
  };

  //显示弹窗
  const showModal = (mainType, list) => {
    setMainType(mainType);
    const listOption = list.map((item) => {
      return {
        value: item.tagId ? item.tagId : item.edgeId,
        label: item.tagName ? item.tagName : item.edgeName,
      };
    });
    setTagList(listOption);
    setOpen(true);
    resetForm();
    form.setFieldsValue({
      tagIds: [],
      importData: null,
    });
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setOriginFile([]);
    setFileUrl("");
    setCurrentFile({ url: "", name: "" });
    setSelectedTags([]);
  };

  // 选择
  // const onTagIdsChange = (value) => {
  //   setSelectedTags(value);
  //   form.setFieldsValue({ tagIds: value });
  // };

  // 下载模版
  const downloadTemplateEvent = async () => {
    const tagIds = form.getFieldValue("tagIds") || [];
    if (tagIds.length > 0) {
      props.downloadTemplateEvent(tagIds);
    } else {
      message.warning(
        `请选择${mainType === "entity" ? "所属本体" : "关系名称"}后下载模板`
      );
    }
  };

  // 删除文件
  const deleteFileEvent = () => {
    setFileList([]);
    setOriginFile([]);
    setFileUrl("");
    form.setFieldsValue({
      importData: null,
    });
    setTimeout(() => {
      form.validateFields(["importData"]).catch((error) => {
        console.log("验证失败（这是预期的）:", error);
      });
    }, 0);
  };

  // 预览
  const previewEvent = () => {
    if (!fileUrl) {
      message.warning("没有可预览的文件");
      return;
    }
    window.open(fileUrl, "_blank");
  };

  //   提交事件
  const submitEvent = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let fileData = new FormData();

      if (!values.importData || values.importData.length === 0) {
        message.error("请先上传文件");
        setLoading(false);
        return;
      }

      const file = originFile[0].originFileObj || originFile[0];

      fileData.append("file", file, file.name);
      fileData.append("spaceId", currentNamespaceId);

      // console.log(mainType, "fileData内容：");
      // for (let [key, value] of fileData.entries()) {
      //   console.log(key, value); // 文件应显示为 [object File]
      // }

      if (mainType === "entity") {
        await importEntityApi(fileData);
      } else {
        await importRelationApi(fileData);
      }
      modelCancelEvent();
      message.success("文件导入完成，结果稍后通知...");
      props.searchEvent();
    } catch (error) {
      console.error("表单校验失败：", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(componentRef, () => ({
    showModal,
  }));

  const classNames = {
    content: "my-modal-content",
  };

  //关闭事件
  const modelCancelEvent = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Modal
      open={open}
      title=""
      footer={null}
      width="720px"
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
            margin: "16px 16px 0 ",
            width: "90%",
          }}
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              name="basic"
              layout={"horizontal"}
              autoComplete="off"
              labelCol={{ span: 3 }}
            >
              <Form.Item
                label={mainType === "entity" ? "所属本体" : "所属关系"}
                name="tagIds"
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Select
                    mode="multiple"
                    placeholder={`请选择${
                      mainType === "entity" ? "所属本体" : "关系"
                    }`}
                    value={form.getFieldValue("tagIds") || []}
                    onChange={(value) => {
                      form.setFieldsValue({ tagIds: value });
                      setSelectedTags(value);
                    }}
                    options={tagList}
                    maxCount={5}
                    maxTagTextLength={5}
                  />
                  <Button type="link" onClick={() => downloadTemplateEvent()}>
                    <DownloadOutlined />
                    下载模板
                  </Button>
                </div>
              </Form.Item>
              <Form.Item
                label="导入数据"
                name="importData"
                rules={[
                  {
                    required: true,
                    message: "请选择导入数据",
                    type: "array",
                    trigger: ["blur", "change"],
                  },
                ]}
              >
                <div>
                  <div className={styles["upload_container"]}>
                    <img src="/knowledge/graph/ic_shangchuan.svg" alt="" />
                    <Upload
                      {...fileProps}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        disabled={!!fileList.length}
                        icon={<UploadOutlined />}
                      >
                        上传文件
                      </Button>
                    </Upload>
                    <div className={styles["upload_text"]}>
                      <span>1.根据模版要求填写;</span>
                      <br />
                      <span>
                        2.支持xlsx/xls格式文件导入，且单个sheet页导入不超过5000条
                      </span>
                      <br />
                      <span>
                        3.特殊属性（图片、视频、音频、其他文件）不支持批量上传
                      </span>
                    </div>
                  </div>
                  {fileList.length > 0 &&
                    fileList.map((file) => {
                      return (
                        <div key={file.uid} className={styles["upload_list"]}>
                          <div
                            className={styles["upload_list_item"]}
                            onClick={() => previewEvent()}
                          >
                            <img src="/knowledge/graph/excel.svg" alt="" />
                            <span>{file.name}</span>
                          </div>
                          <img
                            className={styles["upload_list_delete"]}
                            src="/knowledge/graph/delete1.svg"
                            onClick={() => deleteFileEvent()}
                          />
                        </div>
                      );
                    })}
                </div>
              </Form.Item>
            </Form>
          </Spin>
        </div>
        <div className="model_footer" style={{ marginTop: 0 }}>
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
    </Modal>
  );
});

export default ImportModel;
