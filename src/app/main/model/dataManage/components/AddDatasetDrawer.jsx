import { forwardRef, useState, useImperativeHandle, useRef } from "react";
import {
  Drawer,
  ConfigProvider,
  Form,
  Input,
  Radio,
  message,
  Upload,
  Spin,
  Button,
  Progress,
} from "antd";
import styles from "../page.module.css";
import { ModelTypeMap } from "@/utils/constants";
import { modelDatasetSave, checkUploadedChunks, uploadChunk, mergeChunks } from "@/api/model";
import SparkMD5 from "spark-md5";

const { Dragger } = Upload;

// 数据集类型选项参数
const datasetTypeOptions = [
  { label: "训练数据", desc: "用于算法模型的预训练", key: "train", id: 0 },
  { label: "微调数据", desc: "支持对预训练模型进行微调", key: "adjust", id: 1 },
  {
    label: "评测数据",
    desc: "用于模型评测，验证模型效果",
    key: "review",
    id: 2,
  },
];

// 初始化表单数据
const initFormValues = {
  name: "",
  type: 0,
  path: "",
  fileNum: null,
  zipNodeList: null,
};

// =========================================================
// 辅助函数放在组件外部，避免每次渲染都重新创建
// =========================================================

// 定义分片大小，例如 10MB
const CHUNK_SIZE = 10 * 1024 * 1024;
const createFileChunks = (file, chunkSize) => {
  const chunks = [];
  let current = 0;
  while (current < file.size) {
    chunks.push(file.slice(current, current + chunkSize));
    current += chunkSize;
  }
  return chunks;
};

// 分片读取逻辑
// 将文件分成小块。
// 用一个循环，每次只读取一小块（file.slice(...)）。
// 在 onload 回调中，将这一小块数据添加到 SparkMD5 实例中。
// 读取下一小块，直到所有分块都读完。
// 最后，调用 spark.end() 得到最终的 MD5 值。
const calculateFileMD5 = (file) => {
  return new Promise((resolve, reject) => {
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = function (e) {
      console.log(`Reading chunk ${currentChunk + 1}/${chunks}`);
      spark.append(e.target.result);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        console.log("Finished reading all chunks.");
        resolve(spark.end());
      }
    };

    fileReader.onerror = function (e) {
      console.error("FileReader error during chunk reading:", e);
      reject(e);
    };

    function loadNext() {
      const start = currentChunk * CHUNK_SIZE;
      const end = start + CHUNK_SIZE >= file.size ? file.size : start + CHUNK_SIZE;
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
};

const addDatasetDrawer = forwardRef((props, ref) => {
  const { onDrawerClose } = props;
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [datasetType, setDatasetType] = useState(0);
  const fileInputRef = useRef(null);
  const [classificationValue, setClassificationValue] = useState(1);
  const [fileList, setFileList] = useState([]);
  const [confirmBtnLoading, setConfirmBtnLoading] = useState(false);
  // 1️⃣ 文件预处理阶段（MD5 / 分片）
  const [preparing, setPreparing] = useState(false);

  // 2️⃣ 真正上传阶段
  const [uploading, setUploading] = useState(false);

  // 3️⃣ 上传进度
  const [uploadPercent, setUploadPercent] = useState(0);

  // 4️⃣ 中断控制器（核心）
  const abortRef = useRef(null);

  // 文件目录变量，方便全局使用
  const fileDir = "model/dataset";

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
    },
  }));

  const handleClose = () => {
    // ⭐ 中止上传
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setPreparing(false);
    setUploading(false);
    setUploadPercent(0);
    setFileList([]);
    form.resetFields();
    setDatasetType(0);
    setClassificationValue(1);
    setOpen(false);
    if (onDrawerClose) {
      onDrawerClose();
    }
  };

  const handleRadioChange = (e) => {
    e.stopPropagation();
    setClassificationValue(e.target.value);
  };

  // 上传方法封装复用，分片上传核心逻辑
  const CONCURRENCY = 3; // 每次并发数
  const handleFileUpload = async (file) => {
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    try {
      // ======================
      // 1️⃣ 预处理
      // ======================
      setPreparing(true);
      setUploadPercent(0);

      const fileMd5 = await calculateFileMD5(file, signal);
      const chunks = createFileChunks(file, CHUNK_SIZE);

      setPreparing(false);

      // ======================
      // 2️⃣ 查询断点（API 不动）
      // ======================
      const res = await checkUploadedChunks(fileMd5);

      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      // ======================
      // 3️⃣ 上传
      // ======================
      setUploading(true);
      const uploadedChunkIndexes = res.data?.uploadedChunkIndexes || [];

      const tasks = chunks
        .map((chunk, i) => ({ index: i, chunk }))
        .filter(({ index }) => !uploadedChunkIndexes.includes(index));

      const totalChunks = chunks.length;
      let finished = uploadedChunkIndexes.length;

      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        const batch = tasks.slice(i, i + CONCURRENCY);

        await Promise.all(
          batch.map(async ({ index, chunk }) => {
            if (signal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }

            const formData = new FormData();
            formData.append("file", chunk);

            await uploadChunk(
              {
                fileMd5,
                chunkIndex: index,
                totalChunks,
                fileDir,
              },
              formData,
              signal
            );

            finished++;
            setUploadPercent(Math.floor((finished / totalChunks) * 100));
          })
        );
      }

      setUploadPercent(100);

      // ======================
      // 4️⃣ 合并
      // ======================
      const mergeRes = await mergeChunks(
        {
          fileMd5,
          fileName: file.name,
          fileDir,
        },
        signal
      );
      setFileList([file]);
      form.setFieldsValue({
        path: mergeRes.data.filePath,
        fileNum: mergeRes.data.zipNodeList.length,
        zipNodeList: mergeRes.data.zipNodeList,
      });
      const shortFileName = truncateString(file.name, 30);
      message.success(`${shortFileName} 上传成功`);
    } catch (err) {
      if (err.name === "AbortError") {
        message.info("上传已中止");
      } else {
        message.error("上传失败");
        console.error(err);
      }
      throw err;
    } finally {
      setPreparing(false);
      setUploading(false);
      abortRef.current = null;
    }
  };

  // 通用字符串截取函数：超过maxLength时截取前maxLength个字符+省略号
  const truncateString = (str, maxLength = 10) => {
    // 空值处理
    if (!str) return "";
    // 长度未超过，返回原字符串
    if (str.length <= maxLength) return str;
    // 超过长度，截取前maxLength个字符 + 省略号
    return str.substring(0, maxLength) + "...";
  };

  // Upload 的配置，使用 customRequest 调用核心函数
  const fileProps = {
    name: "file",
    multiple: false,
    accept: ".zip",
    fileList: [],
    showUploadList: false,

    beforeUpload(file) {
      const isZip = file.name.endsWith(".zip");
      const isLt5GB = file.size / 1024 / 1024 / 1024 <= 5;

      if (!isZip) {
        message.error("只能上传 zip 格式的文件！");
        return Upload.LIST_IGNORE;
      }
      if (!isLt5GB) {
        message.error("文件必须小于等于 5GB！");
        return Upload.LIST_IGNORE;
      }

      return true;
    },

    async customRequest({ file, onSuccess, onError }) {
      try {
        setFileList([file]);
        const res = await handleFileUpload(file);
        onSuccess(res);
      } catch (err) {
        onError(err);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const submitHandle = async () => {
    console.log(fileList, "fileList");

    try {
      const values = await form.validateFields();
      setConfirmBtnLoading(true);
      // 评测数据不提交模型类型
      const payload = { ...values, classification: classificationValue };
      await modelDatasetSave(payload);
      message.info("文件解析中，结果稍后通知");
      handleClose();
    } catch (error) {
      console.error("表单验证失败或请求出错:", error);
    } finally {
      setConfirmBtnLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      closable={false}
      width={660}
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
          <Button style={{ marginRight: 24, width: 112, height: 40 }} onClick={handleClose}>
            取消
          </Button>
          <Button
            style={{ width: 112, height: 40 }}
            type='primary'
            onClick={submitHandle}
            loading={confirmBtnLoading}
          >
            确定
          </Button>
        </div>
      }
    >
      <div className={styles["drawer-header"]} style={{}}>
        <span className={styles["drawer-title"]}>新增数据集</span>
        <img src='/model/close_icon.svg' onClick={handleClose} style={{ cursor: "pointer" }} />
      </div>
      <div className={styles["drawer-content"]}>
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
          <Form form={form} className='model-form' layout='vertical' initialValues={initFormValues}>
            <Form.Item
              label='数据集名称'
              name='name'
              rules={[{ required: true, message: "请输入数据集名称" }]}
            >
              <Input
                placeholder='请输入数据集名称，不超过50个字'
                maxLength={50}
                style={{
                  backgroundColor: "#FAFCFD",
                  height: 36,
                  border: "none",
                }}
              />
            </Form.Item>
            <Form.Item
              label='数据集类型'
              name='type'
              rules={[{ required: true, message: "请选择数据集类型" }]}
            >
              <div className={styles["dataset-type-select"]}>
                {datasetTypeOptions.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles["dataset-type-item"]} ${
                      datasetType === item.id ? styles["selected"] : ""
                    }`}
                    onClick={() => {
                      // if (item.key === "review")
                      //   return message.warning("暂未开发");
                      form.setFieldValue("type", item.id);
                      setDatasetType(item.id);
                    }}
                  >
                    <div className={styles["header"]}>
                      <img
                        src={`/model/${item.key}_${
                          datasetType === item.id ? "selected" : "unselected"
                        }.png`}
                        className={styles["dataset-type-icon"]}
                      />
                      <div className={styles["dataset-type-info"]}>
                        <span>{item.label}</span>
                        <span className={styles["dataset-type-desc"]}>{item.desc}</span>
                      </div>
                    </div>
                    {
                      // item.key !== "review" &&
                      datasetType === item.id && (
                        <div className={styles["dataset-type-radio"]}>
                          <Form.Item noStyle>
                            <Radio.Group
                              onChange={(e) => {
                                handleRadioChange(e);
                              }}
                              value={classificationValue}
                            >
                              {Object.entries(ModelTypeMap).map(([key, label]) => (
                                <Radio
                                  key={key}
                                  value={Number(key)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {label}
                                </Radio>
                              ))}
                            </Radio.Group>
                          </Form.Item>
                        </div>
                      )
                    }
                  </div>
                ))}
              </div>
            </Form.Item>
            <Form.Item
              label='上传文件'
              name='path'
              rules={[{ required: true, message: "请上传数据集" }]}
            >
              <Spin spinning={preparing}>
                {fileList.length > 0 ? (
                  <div className={styles["api-upload-container"]}>
                    <img src='/model/data_zip.png' style={{ width: 48 }} />
                    <p className={styles["api-upload-title"]}>{fileList[0].name}</p>
                    {uploading && (
                      <div style={{ width: "320px", margin: "-10px auto 0" }}>
                        <Progress
                          percent={uploadPercent}
                          size='small'
                          status={uploadPercent === 100 ? "success" : "active"}
                          strokeWidth={6}
                          size={{ height: 4 }}
                          trailColor='#ffffff'
                          strokeColor='rgba(55, 114, 254, 0.60)'
                          className={styles["progress-bar"]}
                        />
                      </div>
                    )}
                    {!uploading && (
                      <Button
                        className={styles["reupload-btn"]}
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        重新上传
                      </Button>
                    )}
                    <input
                      type='file'
                      accept='.zip'
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // 🔴 核心修改1：选择文件后立即更新fileList，替换显示的文件名
                        setFileList([file]);
                        // 重置上传进度，避免显示旧进度
                        setUploadPercent(0);
                        try {
                          await handleFileUpload(file);
                        } catch (err) {
                          // 错误处理
                        } finally {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Dragger {...fileProps} className={styles["upload-dragger"]}>
                    <img src='/model/upload_pic.png' style={{ width: 80 }} />
                    <p
                      style={{
                        marginBottom: 20,
                        color: "#8D96A7",
                        fontSize: 14,
                      }}
                    >
                      点击
                      <span
                        style={{
                          color: "#3772FE",
                          padding: "0 4px",
                          fontWeight: 500,
                        }}
                      >
                        上传文件
                      </span>
                      or
                      <span
                        style={{
                          color: "#364052",
                          padding: "0 4px",
                          fontWeight: 500,
                        }}
                      >
                        拖拽
                      </span>
                      至此上传模型文件
                    </p>
                  </Dragger>
                )}
              </Spin>
              <div className={styles["upload-tips"]}>1、文件格式: 压缩文件夹zip；文件大小≤5G</div>
              <div className={styles["upload-tips-bottom"]}>
                2、文件说明：ollama加载方式的模型，需要llama-factory支持的数据集，或者类似格式的自定义数据集，需文件后缀为".json"。
              </div>
            </Form.Item>
            <Form.Item name='fileNum' noStyle></Form.Item>
            <Form.Item name='zipNodeList' noStyle></Form.Item>
          </Form>
        </ConfigProvider>
      </div>
    </Drawer>
  );
});

export default addDatasetDrawer;
