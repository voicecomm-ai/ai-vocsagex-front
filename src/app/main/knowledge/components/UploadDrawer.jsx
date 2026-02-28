import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useEffect,
} from "react";
import { Drawer, Form, Upload, message, Button, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "../page.module.css";
import { uploadMultiApi } from "@/api/knowledgeExtraction";
import ExtractProgress from "./ExtractProgress";

const { Dragger } = Upload;
const UPLOAD_KEY = "updatable";

const FILE_SIZE = 50;
const FILE_NAME_LENGTH = 100;

const getFileIcon = (fileName) => {
  if (fileName.endsWith(".pdf")) return "/knowledge/extract/pdf.svg";
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
    return "/knowledge/extract/word.svg";
  return "/knowledge/extract/pdf.svg";
};

const UploadDrawer = forwardRef((props, ref) => {
  const [notificationApi, notificationHolder] = notification.useNotification();

  const { searchEvent } = props;
  const [open, setOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({});
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [confirmBtnLoading, setConfirmBtnLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isUploadFinish = useMemo(() => uploadProgress >= 100, [uploadProgress]);

  useImperativeHandle(ref, () => ({
    open: (task) => {
      setOpen(true);
      setCurrentTask(task || {});
      setFileList([]);
      setUploadProgress(0);
      form.resetFields();
    },
  }));

  const fileProps = {
    name: "file",
    multiple: true,
    fileList,
    showUploadList: false,
    accept: ".pdf,.doc,.docx",
    disabled: fileList.length >= 10,
    beforeUpload(file) {
      // 数量校验
      if (fileList.length >= 10) {
        message.error("最多上传10个文件");
        return Upload.LIST_IGNORE;
      }
      // 文件名校验
      const nameParts = file.name.split(".");
      const nameWithoutSuffix =
        nameParts.length > 1 ? nameParts.slice(0, -1).join(".") : file.name;
      if (nameWithoutSuffix.length > FILE_NAME_LENGTH) {
        message.error(`文件名长度不能大于${FILE_NAME_LENGTH}个字符`);
        return Upload.LIST_IGNORE;
      }
      // 文件大小校验
      if (file.size > 1024 * 1024 * FILE_SIZE) {
        message.error(`文件大小不能超过${FILE_SIZE}M`);
        return Upload.LIST_IGNORE;
      }

      // 文件类型校验
      const allowMime = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowMime.includes(file.type)) {
        message.error("请上传pdf、doc、docx格式文件");
        return Upload.LIST_IGNORE;
      }
      console.log(file, "file");

      // 判断是否有重复文件
      const existFile = fileList.find((item) => item.name === file.name);
      if (existFile) {
        message.error("文件已存在");
        return Upload.LIST_IGNORE;
      }

      setFileList((prev) => [...prev, file]);

      return false;
    },
  };

  const handleClose = () => {
    setOpen(false);
    searchEvent?.();
    notificationApi.destroy(UPLOAD_KEY);
  };

  const openNotification = useCallback(() => {
    notificationApi.open({
      key: UPLOAD_KEY,
      message: "",
      description: (
        <ExtractProgress
          uploadProgress={uploadProgress}
          isUploadFinish={isUploadFinish}
        />
      ),
      duration: null,
      top: "64px",
      closeIcon: false,
      className: styles["notification-upload__message"],
    });
  }, [notificationApi, uploadProgress, isUploadFinish]);

  useEffect(() => {
    if (uploadProgress > 0 || uploadProgress === 100) {
      openNotification();
    }
  }, [uploadProgress]);

  const submitHandle = async () => {
    if (fileList.length === 0) {
      message.warning("请至少上传一个文件");
      return;
    }
    if (!currentTask?.jobId) {
      message.error("任务ID为空，无法提交");
      return;
    }

    try {
      setConfirmBtnLoading(true);
      setUploadProgress(0);
      openNotification();
      setOpen(false);

      const formData = new FormData();
      formData.append("jobId", currentTask.jobId);
      fileList.forEach((file) => {
        formData.append("files", file.originFileObj || file);
      });
      await uploadMultiApi(formData, (e) => {
        const progress = Math.floor(e.progress * 100);
        setUploadProgress(progress);
        // openNotification();
      });
      setUploadProgress(100);
      //   openNotification();
      // message.success("文件上传成功");

      setTimeout(() => {
        notificationApi.destroy(UPLOAD_KEY);
      }, 1000);
    } catch (error) {
      console.error("文件上传失败:", error);
      notificationApi.destroy(UPLOAD_KEY);
    } finally {
      setConfirmBtnLoading(false);
      handleClose();
    }
  };

  const deleteFileEvent = (uid) => {
    setFileList(fileList.filter((file) => file.uid !== uid));
  };

  return (
    <>
      {notificationHolder}
      <Drawer
        open={open}
        onClose={handleClose}
        closable={false}
        width={600}
        styles={{
          content: {
            borderRadius: "24px 0px 0px 24px",
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            backgroundImage: 'url("/model/dataset_bg.png")',
            backgroundRepeat: "no-repeat",
            backgroundColor: "#fff",
            backgroundPosition: "top center",
            backgroundSize: "100% auto",
          },
          body: {
            padding: 0,
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
          footer: {
            padding: "22px 0 0",
          },
        }}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              style={{ marginRight: 24, width: 112, height: 40 }}
              onClick={handleClose}
            >
              取消
            </Button>
            <Button
              style={{ width: 112, height: 40 }}
              type="primary"
              onClick={submitHandle}
              loading={confirmBtnLoading}
              disabled={fileList.length === 0}
            >
              确定
            </Button>
          </div>
        }
      >
        <div className={styles["drawer-header"]} style={{}}>
          <span className={styles["drawer-title"]}>文档上传</span>
          <img
            src="/model/close_icon.svg"
            onClick={handleClose}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className={styles["drawer-content"]}>
          <Form
            form={form}
            name="basic"
            layout={"horizontal"}
            autoComplete="off"
          >
            <Form.Item label={null} name="importData">
              <div>
                <Upload
                  {...fileProps}
                  style={{
                    width: "100%",
                    cursor: fileList.length >= 10 ? "not-allowed" : "pointer",
                    border: "#d9d9eb 1px dashed",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9fd",
                  }}
                >
                  <div className={styles["upload_container"]}>
                    <img
                      src={
                        fileList.length < 10
                          ? "/knowledge/graph/ic_shangchuan.svg"
                          : "/knowledge/graph/upload_disable.svg"
                      }
                      alt="上传图标"
                    />
                    <p
                      className={`${styles["select-file__tip"]} ${
                        fileList.length >= 10 ? styles["upload-disabled"] : ""
                      }`}
                    >
                      <span
                        className={`${styles["select-file__text"]} ${
                          fileList.length >= 10 ? styles["upload-disabled"] : ""
                        }`}
                      >
                        选择文件
                      </span>
                      或者拖拽文件至此
                    </p>
                    <div className={styles["upload_text"]}>
                      <span>
                        1.支持上传doc、docx、pdf格式文件,单文件大小不超过
                        {FILE_SIZE}M
                      </span>
                      <br />
                      <span>2.各类文件仅识别文字</span>
                      <br />
                      <span>3.一次最多上传10个文件</span>
                    </div>
                  </div>
                </Upload>
                {fileList.length > 0 &&
                  fileList.map((file) => {
                    return (
                      <div key={file.uid} className={styles["upload_list"]}>
                        <div
                          className={styles["upload_list_item"]}
                          // onClick={() => previewEvent()}
                        >
                          <img
                            style={{ width: "18px" }}
                            src={getFileIcon(file.name)}
                            alt={file.name}
                          />
                          <span title={file.name}>{file.name}</span>
                        </div>
                        <img
                          className={styles["upload_list_delete"]}
                          src="/knowledge/graph/delete1.svg"
                          onClick={() => deleteFileEvent(file.uid)}
                        />
                      </div>
                    );
                  })}
              </div>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
});

export default UploadDrawer;
