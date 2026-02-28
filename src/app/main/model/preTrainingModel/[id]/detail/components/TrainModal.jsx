"use client";
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Modal,
  Segmented,
  ConfigProvider,
  Form,
  Select,
  Radio,
  Input,
  Checkbox,
  Spin,
  Upload,
  message,
  Row,
  Col,
  InputNumber,
  Slider,
  Button,
  Tooltip,
} from "antd";
import styles from "../page.module.css";
import {
  extractEntityFiles,
  modelDatasetPage,
  algorithmConfig,
  algorithmTrain,
  checkUploadedChunks,
  uploadChunk,
  mergeChunks,
} from "@/api/model";
import AceEditor from "react-ace"; //yaml编辑插件
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-github";
import { useRouter } from "next/navigation";
import SparkMD5 from "spark-md5";

const { Dragger } = Upload;

const labelSegments = [
  { label: "选择训练数据", key: "choose", value: 0 },
  { label: "上传训练数据", key: "upload", value: 1 },
];

const initFormValues = {
  selectDataSource: 0, //选择训练的数据来源
  datasetId: null, //数据集id
  modelDataset: {
    name: "",
  }, //需要新增的数据集
  type: 0, //验证
  segmentSize: 1, //切分的大小
  verifyDatasetId: null, //验证的数据集id
  modelId: null, //模型id
  modelName: "", //训练后的模型名称
  isSupportAdjust: false, //是否支持微调
  configText: "", //配置文件脚本
};

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
      const end =
        start + CHUNK_SIZE >= file.size ? file.size : start + CHUNK_SIZE;
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
};

const TrainModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [uploading, setUploading] = useState(false); // 上传状态
  // 上传zip文件
  const [fileList, setFileList] = useState([]); //上传列表
  const fileInputRef = useRef(null); //重新上传调取隐藏的input
  const [trainOptions, setTrainOptions] = useState([]); //训练数据选项
  const [yamlContent, setYamlContent] = useState(``);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [modelId, setModelId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form] = Form.useForm();
  // 文件目录变量，方便全局使用
  const fileDir = "model/dataset";

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const getTrainDataList = async (classification) => {
    const res = await modelDatasetPage({
      current: 1,
      size: 100000,
      classificationIdList: [classification],
      type: 0,
    });
    const formatOptions = res.data.records.map((record) => ({
      label: record.name,
      value: record.id,
    }));
    setTrainOptions(formatOptions);
  };

  useImperativeHandle(ref, () => ({
    showModal: (id, originalName, classification) => {
      getScript(id);
      setModelId(id);
      setVisible(true);
      form.setFieldValue("modelName", originalName.slice(0, 50));
      getTrainDataList(classification);
    },
  }));

  //获取yaml配置文件
  const getScript = async (id) => {
    if (!id) return;
    const res = await algorithmConfig(id);
    setYamlContent(res.data);
  };

  // 上传方法封装复用，分片上传核心逻辑
  const fileProps = {
    name: "file",
    multiple: false,
    accept: ".zip",
    fileList,
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

      // setFileList([file]);
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
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);

    try {
      // message.info("正在计算文件MD5值...");
      const fileMd5 = await calculateFileMD5(file);

      const chunks = createFileChunks(file, CHUNK_SIZE);
      const totalChunks = chunks.length;

      // message.info("正在检查已上传分片...");
      const res = await checkUploadedChunks(fileMd5);
      const uploadedChunkIndexes = res.data?.uploadedChunkIndexes || [];
      console.log(`已找到 ${uploadedChunkIndexes.length} 个已上传分片`);

      for (let i = 0; i < totalChunks; i++) {
        if (uploadedChunkIndexes.includes(i)) {
          console.log(`分片 ${i} 已上传，跳过`);
          continue;
        }

        const chunk = chunks[i];
        const formData = new FormData();
        formData.append("file", chunk);

        const queryParams = {
          fileMd5,
          chunkIndex: i,
          totalChunks,
          fileDir,
        };
        // message.info(`正在上传分片 ${i + 1}/${totalChunks}...`);
        console.log(`正在上传分片 ${i + 1}/${totalChunks}...`);
        await uploadChunk(queryParams, formData);
      }
      console.log("所有分片上传完毕，正在合并...");
      // message.info("所有分片上传完毕，正在合并...");
      const mergeParams = {
        fileMd5,
        fileName: file.name,
        fileDir,
      };
      const mergeRes = await mergeChunks(mergeParams);

      message.success(`${file.name} 上传成功`);
      setFileList([file]);
      form.setFieldsValue({
        modelDataset: {
          fileNum: mergeRes.data.zipNodeList.length,
          path: mergeRes.data.filePath,
          name: form.getFieldValue(["modelDataset", "name"]),
          // zipNodeList: mergeRes.data.zipNodeList,
        },
      });

      return mergeRes;
    } catch (err) {
      console.error(err);
      message.error(`${file.name} 上传失败`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setVisible(false);
    setFileList([]);
    form.resetFields();
    setSubmitLoading(false);
  };

  const router = useRouter();

  //提交训练模型表单
  const submitHandle = async () => {
    if (uploading) return message.warning("数据集正在上传中");
    if (yamlContent.length === 0)
      return message.warning("配置文件不存在，无法训练");

    const values = await form.validateFields();

    if (selectDataSource === 1 && fileList.length === 0)
      return message.warning("请上传数据集");
    values.configText = yamlContent;
    values.modelId = modelId;

    setSubmitLoading(true);
    try {
      const res = await algorithmTrain(values);
      if (res.code === 1000) {
        message.success(res.msg);
        router.push("/main/model/myModel");
      }
    } catch (err) {
      setSubmitLoading(false);
    }
  };

  //表单监听控制
  const selectDataSource = Form.useWatch("selectDataSource", form);
  const verificationType = Form.useWatch("type", form);

  //自动切分进度条数字控件
  const CombinedInput = ({ value, onChange }) => {
    return (
      <Row style={{ marginTop: 4 }}>
        <div style={{ position: "relative", width: 188 }}>
          <InputNumber
            min={1}
            max={30}
            style={{ width: "100%", paddingRight: 24 }}
            value={value}
            onChange={onChange}
          />
          <span
            style={{
              position: "absolute",
              right: 28,
              fontSize: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8D96A7",
            }}
          >
            %
          </span>
        </div>
        <Slider
          min={1}
          max={30}
          onChange={onChange}
          style={{ width: 120, marginLeft: 14 }}
          value={typeof value === "number" ? value : 0}
          styles={{
            track: {
              backgroundColor: "#3267E8",
              height: 2,
            },
            rail: {
              backgroundColor: "#E8EAEF",
              height: 2,
            },
          }}
        />
      </Row>
    );
  };

  return (
    <>
      {!isFullScreen && (
        <Modal
          open={visible}
          centered={true}
          width={1280}
          closable={false}
          title={
            <div className={styles["train-modal-header"]}>
              <span>训练模型</span>
              <img
                src="/model/close_icon.svg"
                className={styles["close-icon"]}
                onClick={closeModal}
              ></img>
            </div>
          }
          styles={{
            content: {
              height: 800,
              backgroundImage: 'url("/model/train_bg.png")',
              borderRadius: 24,
              padding: "24px 24px 32px",
              backgroundColor: "#fff",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% auto",
            },
            header: {
              background: "transparent",
              marginBottom: 0,
            },
            footer: {
              marginTop: 22,
            },
          }}
          footer={
            <div style={{ textAlign: "right" }}>
              <Button
                style={{ marginRight: 24, width: 112, height: 40 }}
                onClick={closeModal}
              >
                取消
              </Button>
              <Button
                style={{ width: 112, height: 40 }}
                type="primary"
                onClick={submitHandle}
                loading={submitLoading}
              >
                确定
              </Button>
            </div>
          }
        >
          <div className={styles["train-content"]}>
            <div className={styles["train-data"]}>
              <ConfigProvider
                theme={{
                  components: {
                    Form: {
                      labelColor: " #364052",
                    },
                  },
                }}
              >
                <Form
                  layout="vertical"
                  form={form}
                  initialValues={initFormValues}
                  className={styles["train-form"]}
                >
                  <div className={styles["train-data-segment-center"]}>
                    <ConfigProvider
                      theme={{
                        components: {
                          Segmented: {
                            itemColor: "#666E82",
                            borderRadius: 8,
                            fontSize: 14,
                            trackBg: "#E3E5ED",
                          },
                        },
                      }}
                    >
                      <Form.Item name="selectDataSource" noStyle>
                        <Segmented
                          className="custom-segmented"
                          style={{
                            padding: 3,
                            height: 36,
                          }}
                          options={labelSegments.map((status) => ({
                            value: status.value,
                            label: (
                              <div
                                style={{
                                  padding: "0 14px",
                                  height: 30,
                                  lineHeight: "30px",
                                }}
                              >
                                {status.label}
                              </div>
                            ),
                          }))}
                        />
                      </Form.Item>
                    </ConfigProvider>
                  </div>
                  {selectDataSource === 0 ? (
                    <Form.Item
                      label="训练数据"
                      name="datasetId"
                      rules={[{ required: true, message: "请选择训练数据" }]}
                    >
                      <Select
                        placeholder="请选择训练数据"
                        className={`${styles["custom-select"]} model_type_select`}
                        options={trainOptions}
                      ></Select>
                    </Form.Item>
                  ) : (
                    <Form.Item label="上传数据集" name="modelDataset">
                      <Form.Item
                        name={["modelDataset", "name"]}
                        noStyle
                        rules={[
                          { required: true, message: "请输入数据集名称" },
                        ]}
                      >
                        <Input
                          placeholder="请输入数据集名称，不超过50个字"
                          className={styles["custom-input"]}
                          maxLength={50}
                        />
                      </Form.Item>

                      <Spin spinning={uploading}>
                        <Form.Item
                          // name={["modelDataset", "zipNodeList"]}
                          noStyle
                          // rules={[{ required: true, message: "请上传数据集" }]}
                        >
                          {fileList.length > 0 ? (
                            <div className={styles["api-upload-container"]}>
                              <img
                                src="/model/data_zip.png"
                                style={{ width: 48 }}
                              />
                              <p className={styles["api-upload-title"]}>
                                {fileList[0].name}
                              </p>
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

                              {/* 隐藏的 input 标签，手动触发上传 */}
                              <input
                                type="file"
                                accept=".zip"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  handleFileUpload(file).finally(() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  });
                                }}
                              />
                            </div>
                          ) : (
                            <Dragger
                              {...fileProps}
                              className={styles["upload-dragger"]}
                            >
                              <img
                                src="/model/upload_pic.png"
                                style={{ width: 80 }}
                              />
                              <div
                                style={{
                                  marginTop: 10,
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
                              </div>
                            </Dragger>
                          )}
                        </Form.Item>
                      </Spin>
                      <span className={styles["upload-tips"]}>
                        文件格式: 压缩文件夹zip；文件大小≤5G
                      </span>
                    </Form.Item>
                  )}

                  <Form.Item
                    label="验证"
                    name="type"
                    className={styles["verification-radio"]}
                  >
                    <Radio.Group
                      className={styles["custom-radio-group"]}
                      options={[
                        {
                          value: 0,
                          label: (
                            <span>
                              自动切分
                              <Tooltip
                                color="rgba(54, 64, 82, 0.90)"
                                title="系统按照一定的比例自动选择训练数据的部分数据作为验证数据"
                              >
                                <img
                                  src="/model/question_icon.png"
                                  alt="说明"
                                  width={16}
                                  style={{
                                    marginLeft: 2,
                                    verticalAlign: "middle",
                                  }}
                                />
                              </Tooltip>
                            </span>
                          ),
                          style: { marginRight: 22 },
                        },
                        { value: 1, label: "选择验证数据" },
                      ]}
                    />
                  </Form.Item>
                  {verificationType === 0 ? (
                    <Form.Item name="segmentSize">
                      <CombinedInput />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="verifyDatasetId"
                      rules={[{ required: true, message: "请选择验证数据" }]}
                    >
                      <Select
                        placeholder="请选择验证数据"
                        className={`${styles["custom-select"]} model_type_select`}
                        style={{ marginTop: 10, width: "80%" }}
                        options={trainOptions}
                      ></Select>
                    </Form.Item>
                  )}
                  <Form.Item
                    className={styles["custom-margin-bottom"]}
                    label="训练后模型名称"
                    name="modelName"
                    rules={[
                      { required: true, message: "请输入训练后模型名称" },
                      {
                        pattern: /^[A-Za-z0-9_\-:./]+$/,
                        message: "只能包含英文、数字、下划线、-、:、.、/",
                      },
                    ]}
                  >
                    <Input
                      placeholder="请输入训练后模型名称"
                      className={styles["custom-input"]}
                      maxLength={50}
                    />
                  </Form.Item>
                  <Form.Item
                    name="isSupportAdjust"
                    noStyle
                    valuePropName="checked"
                  >
                    <Checkbox className={styles["checkbox-label"]}>
                      支持微调
                    </Checkbox>
                  </Form.Item>
                </Form>
              </ConfigProvider>
            </div>
            <div className={styles["train-json"]}>
              <div className={styles["train-json-header"]}>
                <p>读取训练脚本文件：</p>
                <div className={styles["json-header-img"]}>
                  <img
                    src="/model/full.png"
                    alt="full"
                    className={styles["json-header-icon"]}
                    onClick={toggleFullScreen}
                  />
                </div>
              </div>
              <div className={styles["train-json-content"]}>
                <AceEditor
                  mode="yaml" // 关键：指定编辑器模式为 YAML
                  theme="github" // 指定编辑器主题
                  onChange={(newValue) => {
                    setYamlContent(newValue);
                  }}
                  name="yaml_editor_component" // 必填项，用于唯一标识编辑器
                  value={yamlContent} // 绑定状态
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    showLineNumbers: true, // 显示行号
                    tabSize: 2,
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {isFullScreen && (
        <div className={styles["train-json-full"]}>
          <div className={styles["train-json-header"]}>
            <p>读取训练脚本文件：</p>
            <div className={styles["json-header-img"]}>
              <img
                src="/model/cancel_full.png"
                alt="full"
                className={styles["json-header-icon"]}
                onClick={toggleFullScreen}
              />
            </div>
          </div>
          <div className={styles["train-json-content"]}>
            <AceEditor
              mode="yaml" // 关键：指定编辑器模式为 YAML
              theme="github" // 指定编辑器主题
              onChange={(newValue) => {
                setYamlContent(newValue);
              }}
              name="yaml_editor_component" // 必填项，用于唯一标识编辑器
              value={yamlContent} // 绑定状态
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                showLineNumbers: true, // 显示行号
                tabSize: 2,
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      )}
    </>
  );
});

export default TrainModal;
