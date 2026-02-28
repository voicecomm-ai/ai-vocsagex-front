"use client";
import styles from "./page.module.css";
import {
  Breadcrumb,
  Button,
  Tag,
  Divider,
  Radio,
  Switch,
  Select,
  Popover,
  Form,
  Input,
  Space,
  message,
  ConfigProvider,
  Tabs,
  Tooltip,
  Spin
} from "antd";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  modelInfo,
  modelCategoryList,
  modelDownload,
  preTrainedDownload,
  getFileTree,
  getPathFileTree,
} from "@/api/model";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FileTree from "./components/FileTree";
import ApiKeyDrawer from "./components/ApiKeyDrawer";
import EllipsisTooltip from "../../../components/EllipsisTooltip";
import screenfull from "screenfull";
import { checkPermission } from "@/utils/utils";
import TrainModal from "./components/TrainModal.jsx";
import dayjs from "dayjs";
import { extractFileName, ModelTypeMap } from "@/utils/constants";

const supportData = [
  { title: "支持视觉", show: false, key: "isSupportVisual" },
  { title: "支持文档", show: false, key: "isSupportDocument" },
  { title: "支持函数调用", show: false, key: "isSupportFunction" },
  { title: "支持微调", show: false, key: "isSupportAdjust" },
  { title: "支持分布式训练", show: false, key: "isSupportDistributedTrain" },
];

const breadcrumbItems = [
  {
    title: "模型管理",
  },
  {
    title: "预训练模型",
  },
  {
    title: "模型详情",
  },
];
export default function ModelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [modelDetail, setModelDetail] = useState({}); //模型详情
  const [modelSupport, setModelSupport] = useState(supportData); //支持项
  const [showFramework, setShowFramework] = useState(false); //显示训练框架说明
  const [mdContent, setMdContent] = useState(""); //调用文档
  const [parameters, setParameters] = useState([]); //调用参数
  const [voiceList, setVoiceList] = useState([]); //模型音色
  const [showAll, setShowAll] = useState(false); //本地文字展开
  const [modelType, setModelType] = useState(""); //模型类型
  const [modelTag, setModelTag] = useState([]); //模型标签
  const [urlParams, setUrlParams] = useState({
    id: null,
    isSquare: null,
  });
  const [mdIsCollapsed, setMdIsCollapsed] = useState(false); //是否折叠md文件
  const [modelFile, setModelFile] = useState([]); //模型文件tree
  const [fileLoading, setFileLoading] = useState(true);
  const [quantiFile, setQuantiFile] = useState([]); //量化文件
  const [quantiFileLoading, setQuantiFileLoading] = useState(true);
  const [weightFile, setWeightFile] = useState([]); //权重文件
  const [weightFileLoading, setWeightFileLoading] = useState(true);
  const [codeFile, setCodeFile] = useState([]); //模型代码文件
  const [codeFileLoading, setCodeFileLoading] = useState(true);
  const backHandle = () => {
    router.push("/main/model/preTrainingModel ");
  };
  const modelStatus = router.state?.modelStatus;

  useEffect(() => {
    // const searchParams = new URLSearchParams(window.location.search);
    setUrlParams({
      id: id,
      isSquare: false,
    });
  }, []);

  useEffect(() => {
    if (urlParams.id) {
      getDetail(urlParams.id);
      getModelFile(urlParams.id);
    }
  }, [urlParams.id]);

  const getDetail = async (id) => {
    // 标签获取
    const tagRes = await modelCategoryList({ isSquare: 0 });

    const built = tagRes.data?.[0]?.modelTagList || [];

    const noBuilt = tagRes.data?.[1]?.modelTagList || [];

    const res = await modelInfo(id);
    const detailRes = res.data;
    console.log(detailRes, "modelDetail.detailRes");

    setModelDetail(detailRes);

    // 支持项数据处理
    const processSupport = supportData.map((item) => {
      return {
        ...item,
        show: detailRes[item.key],
      };
    });
    setModelSupport(processSupport);
    setShowFramework(processSupport.find((item) => item.key === "isSupportDistributedTrain").show);

    //api调用文档
    if (detailRes.apiDocument) {
      try {
        const mdRes = await fetch(process.env.NEXT_PUBLIC_API_BASE + detailRes.apiDocument);
        const mdText = await mdRes.text();
        setMdContent(mdText);
      } catch (e) {
        console.log(e);
      }
    }
    //调用参数
    if (
      detailRes.options &&
      detailRes.options !== "[null]" &&
      detailRes.options !== "null" &&
      detailRes.options !== "[]" &&
      detailRes.options.trim() !== ""
    ) {
      setParameters(JSON.parse(detailRes.options));
    }

    //模型音色
    if (detailRes.timbreName) {
      setVoiceList(JSON.parse(detailRes.timbreName));
    }
    //预设标签
    if (detailRes.classification) {
      const type = built.find((item) => item.id === detailRes.classification);
      setModelType(type?.name || "");
    }
    //自定义标签
    if (detailRes.tagIdList) {
      const matchTag = noBuilt
        .filter((item) => detailRes.tagIdList.includes(item.id))
        .map((item) => item.name);
      setModelTag(matchTag);
    }
    //量化模型文件
    if (detailRes.quantifiedStorageType && detailRes.quantifiedStorageUrl.length > 0) {
      const quantiRes = await getPathFileTree(detailRes.quantifiedStorageUrl);
      setQuantiFile(quantiRes.data);
      setQuantiFileLoading(false);
    }
    //权重文件
    if (detailRes.weightStorageType && detailRes.weightStorageUrl.length > 0) {
      const weightRes = await getPathFileTree(detailRes.weightStorageUrl);
      setWeightFile(weightRes.data);
      setWeightFileLoading(false);
    }
    //模型代码文件
    if (detailRes.codeUrl.length > 0) {
      const codeRes = await getPathFileTree(detailRes.codeUrl);
      setCodeFile(codeRes.data);
      setCodeFileLoading(false);
    }
  };

  //获取模型文件
  const getModelFile = async (id) => {
    const res = await getFileTree(id);
    setModelFile(res.data);
    setFileLoading(false);
  };

  //全文展开操作
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) {
      const el = contentRef.current;
      const lineHeight = 20.5; // 与样式中保持一致
      const maxHeight = lineHeight * 7; // 7 行高度

      // 判断实际高度是否超过限制
      setCanExpand(el.scrollHeight > maxHeight);
    }
  }, [modelDetail.localDeploy]); // 当内容加载或变化时重新判断
  const toggleShow = () => {
    setShowAll(!showAll);
  };

  //顶部下载按钮-算法
  const downloadHandle = async () => {
    if (modelDetail.type === 0) {
      try {
        await modelDownload(
          {
            zipPath: modelDetail.path.replace("/file", "/data1"),
          },
          modelDetail.name + ".zip"
        ); // 传递文件名);
      } catch (error) {
        // 错误已由拦截器统一处理
        console.debug("下载流程结束", error);
      }
    }
  };

  const [form] = Form.useForm();
  const currentManufacturer = Form.useWatch("gpu_arch", form); //监听显卡厂商
  const gpuDisabled = Form.useWatch("use_gpu", form); //监听gpu开关
  const cpuArch = Form.useWatch("cpu_arch", form); //监听cpu
  const downloadParams = {
    cpu_arch: "x86_64",
    use_gpu: false,
    gpu_arch: "nvidia",
  };
  const [versionName, setVersionName] = useState("CUDA");

  //控制version可选项
  useEffect(() => {
    const versionMap = {
      amd: "ROCM",
      ascend: "CANN",
      nvidia: "CUDA",
    };

    if (currentManufacturer) {
      setVersionName(versionMap[currentManufacturer]);
      form.setFieldValue("versionNumber", "");
      // form.setFieldValue("cuda_version", "");
      form.setFieldValue("cudnn_version", "");
    }
  }, [currentManufacturer]);

  //厂商禁选
  const disabledManufacturers = useMemo(() => {
    const cpuValue = form.getFieldValue("cpu_arch");
    form.setFieldValue("gpu_arch", "nvidia");
    if (cpuValue === "x86_64") {
      return ["ascend"]; //x86不支持huawei
    } else {
      return ["amd", "ascend"]; // arm 不支持 AMD、华为
    }
  }, [cpuArch]);

  // 预训练下载
  const onSubmit = async (values) => {
    const { cpu_arch, use_gpu, gpu_arch, versionNumber, cudnn_version } = values;
    const result = {
      cpu_arch,
      use_gpu,
    };

    if (use_gpu) {
      result.gpu_arch = gpu_arch;

      if (gpu_arch === "nvidia") {
        result.cudnn_version = cudnn_version; // 由 Form.Item name="cuda_version"
        result.cuda_version = versionNumber;
      } else if (gpu_arch === "amd") {
        result.rocm_version = versionNumber;
      } else if (gpu_arch === "ascend") {
        result.cann_version = versionNumber;
      }
    }
    try {
      const res = await preTrainedDownload(urlParams.id, result);
      message.loading(res.msg);
    } catch (err) {
      // code为4001时下载该文件
      if (err.code === 4001) {
        const link = document.createElement("a");
        link.href = process.env.NEXT_PUBLIC_API_BASE + err.msg;
        link.download = ""; // 可选：不写也能下载，浏览器按 URL 推断文件名
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    closePopover();
  };

  const [openPopover, setOpenPopover] = useState(false);
  const handleOpenChange = (newOpen) => {
    setOpenPopover(newOpen);
    if (!newOpen) {
      form.resetFields();
    }
  };
  const closePopover = () => {
    setOpenPopover(false);
    form.resetFields();
  };
  //预训练下载内容显示
  const popoverContent = (
    <div className={`${styles["popover-content"]} download-form`}>
      <Form form={form} onFinish={onSubmit} initialValues={downloadParams}>
        <div className={styles["popover-form-item"]}>
          <span className={`${styles["popover-form-label"]} ${styles["cpu-red"]}`}>CPU：</span>
          <Form.Item name='cpu_arch' noStyle>
            <Radio.Group className={styles["custom-radio-group"]}>
              <Radio value='x86_64'>x86_64</Radio>
              <Radio value='arm64'>arm64</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
        {modelDetail.loadingMode === "ollama" && (
          <div className={styles["popover-form-item"]}>
            <span className={styles["popover-form-label"]}>GPU：</span>
            <Form.Item name='use_gpu' noStyle valuePropName='checked'>
              <Switch className={styles["custom-switch"]} size='small' />
            </Form.Item>
          </div>
        )}

        {/* {gpuDisabled && (
          <>
            <Form.Item
              name='gpu_arch'
              label={<span style={{ color: "#666e82", fontWeight: 500 }}>显卡厂商：</span>}
              colon={false}
              labelCol={{
                span: 24,
                style: {
                  margin: "0 0 -4px",
                },
              }}
            >
              <div className={styles["manufacturer-list"]}>
                {manufacturerList.map((item) => {
                  const isDisabled = disabledManufacturers.includes(item.value);
                  return (
                    <div
                      key={item.title}
                      className={`${styles["manufacturer"]} ${
                        currentManufacturer === item.value ? styles["active"] : ""
                      } ${isDisabled ? styles["disabled"] : ""}`}
                      style={isDisabled ? { filter: "grayscale(100%)", opacity: 0.8 } : {}}
                      onClick={() => {
                        if (isDisabled) return;
                        form.setFieldsValue({ gpu_arch: item.value });
                      }}
                    >
                      <img
                        width={24}
                        src={`/model/${item.value}_${
                          currentManufacturer === item.value ? "selected" : "unselected"
                        }.png`}
                      />
                      <span>{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </Form.Item>

            <Space.Compact style={{ width: "100%" }}>
              <div className={styles["version-name"]}>{versionName}</div>
              <Form.Item
                style={{ flex: 1 }}
                name='versionNumber'
                rules={[
                  { required: true, message: "请输入版本号" },
                  {
                    pattern: /^[A-Za-z0-9_\-:./]+$/,
                    message: "只能包含英文、数字、下划线、-、:、.、/",
                  },
                ]}
              >
                <Input style={{ height: 36 }} placeholder='请输入版本号' maxLength={20} />
              </Form.Item>
            </Space.Compact>
            {currentManufacturer === "nvidia" && (
              <Space.Compact style={{ width: "100%" }}>
                <div className={styles["version-name"]}>CUDNN</div>
                <Form.Item
                  style={{ flex: 1 }}
                  name='cudnn_version'
                  rules={[
                    { required: true, message: "请输入版本号" },
                    {
                      pattern: /^[A-Za-z0-9_\-:./]+$/,
                      message: "只能包含英文、数字、下划线、-、:、.、/",
                    },
                  ]}
                >
                  <Input style={{ height: 36 }} placeholder='请输入版本号' maxLength={20} />
                </Form.Item>
              </Space.Compact>
            )}
          </>
        )} */}

        <div style={{ marginTop: 40, textAlign: "right" }}>
          <Button style={{ marginRight: 8, borderRadius: 8 }} onClick={closePopover}>
            取消
          </Button>
          <Button style={{ borderRadius: 8 }} type='primary' htmlType='submit'>
            下载
          </Button>
        </div>
      </Form>
    </div>
  );

  //打开训练模型modal
  const trainModalRef = useRef(null);

  //api秘钥
  const apidrawerRef = useRef(null);

  // 全屏
  const elementRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled && elementRef.current) {
      screenfull.toggle(elementRef.current);
    }
  };

  useEffect(() => {
    if (screenfull.isEnabled) {
      screenfull.on("change", () => {
        setIsFullscreen(screenfull.isFullscreen);
      });
    }
    return () => {
      if (screenfull.isEnabled) {
        screenfull.off("change");
      }
    };
  }, []);

  const apiUrlRef = useRef(null);

  //复制api服务器地址
  const copyToClipboard = () => {
    const textToCopy = apiUrlRef.current.textContent;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        message.success("已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          message.success("已复制到剪贴板");
        } catch (err) {
          console.error("回退复制方法失败:", err);
          message.error("复制失败，请手动复制");
        }
        document.body.removeChild(textarea);
      });
  };

  const [activeKey, setActiveKey] = useState(1);
  const tabOptions = [
    {
      key: 1,
      label: (
        <div className={`${styles.tab_label} ${activeKey === 1 ? styles.active : ""}`}>
          <span>模型介绍</span>
        </div>
      ),
      children: (
        <>
          <div className={styles["model-option"]}>
            <span className={styles["model-option-title"]}>模型概述：</span>
            <p className={styles["model-option-content-wrap"]}>{modelDetail.overview}</p>
          </div>
          <div className={styles["model-option"]}>
            <span className={styles["model-option-title"]}>应用场景：</span>
            <p className={styles["model-option-content-wrap"]}>{modelDetail.usageScene}</p>
          </div>
        </>
      ),
    },
    // 语音合成展示
    ...(modelDetail.classification === 7
      ? [
          {
            key: 6,
            label: (
              <div className={`${styles.tab_label} ${activeKey === 6 ? styles.active : ""}`}>
                <span>模型音色</span>
              </div>
            ),
            children: (
              <div className={styles["model-option-content"]}>
                {voiceList.length !== 0 && voiceList[0] !== "" && (
                  <div className={styles["model-option"]}>
                    <span
                      className={`${styles["model-file-title"]} ${styles["model-option-title"]}`}
                    >
                      模型音色
                    </span>
                    <div className={styles["model-option-content"]}>
                      <div
                        className={`${styles["directory-structure"]} ${styles["params-content"]}`}
                      >
                        <div className={styles["voice-list"]}>
                          {voiceList.map((voice) => (
                            <div key={voice} className={styles["voice-item"]}>
                              <img src='/model/voice.png' className={styles["voice-icon"]}></img>
                              <EllipsisTooltip maxWidth={130}>
                                <span>{voice}</span>
                              </EllipsisTooltip>
                            </div>
                          ))}
                        </div>
                        <div className={styles["default-text"]}>
                          <div className={styles["default-text-title"]}>默认文本</div>
                          {modelDetail.timbreText}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    // 文本生成、多模态展示调用参数
    ...(modelDetail.classification === 1 || modelDetail.classification === 2
      ? [
          {
            key: 2,
            label: (
              <div className={`${styles.tab_label} ${activeKey === 2 ? styles.active : ""}`}>
                <span>调用参数</span>
              </div>
            ),
            children: (
              <div className={styles["model-option-content"]}>
                {parameters.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles["directory-structure"]} ${styles["params-content"]}`}
                  >
                    <div className={styles["params-name"]}>
                      {item.title_name}
                      <span className={styles["params-name-tips"]}>（{item.varible_name}）</span>
                    </div>
                    <div className={styles["params-des-text"]}>{item.desc}</div>
                    <Divider className={styles["custom-divider"]} size='small' />
                    {item.type === 1 && (
                      <div className={styles["params-options"]}>
                        <div className={styles["params-options-item"]}>
                          类型：
                          <span className={styles["option-data"]}>
                            范围({`${item.minValue}~${item.maxValue}`})
                          </span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          默认值：
                          <span className={styles["option-data"]}>{item.defaultValue}</span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          默认状态：
                          <span className={styles["option-data"]}>
                            {item.isEnable ? "开启" : "关闭"}
                          </span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          小数点：
                          <span className={styles["option-data"]}>
                            {item.supportDecimal ? `支持${item.decimal_places}位小数` : "不支持"}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.type === 2 && (
                      <div className={styles["params-options"]}>
                        <div className={styles["params-options-item"]}>
                          类型：
                          <span className={styles["option-data"]}>
                            文本框(
                            <EllipsisTooltip maxWidth={130}>
                              {item.input_type.join(",")}
                            </EllipsisTooltip>
                            )
                          </span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          最大字符数：
                          <span className={styles["option-data"]}>{item.maxChar}</span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          默认值：
                          <span className={styles["option-data"]}>{item.defaultChar}</span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          默认状态：
                          <span className={styles["option-data"]}>
                            {item.isEnable ? "开启" : "关闭"}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.type === 3 && (
                      <div className={styles["params-options"]}>
                        <div className={styles["params-options-item"]}>
                          类型：
                          <span className={styles["option-data"]}>下拉({item.select_type})</span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          <span className={styles["option-data"]}>
                            下拉项：(
                            <EllipsisTooltip maxWidth={130}>{item.options}</EllipsisTooltip>)
                          </span>
                        </div>
                        <div className={styles["params-options-item"]}>
                          默认状态：
                          <span className={styles["option-data"]}>
                            {item.isEnable ? "开启" : "关闭"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {parameters.length === 0 && (
                  <div className={styles["params_empty"]}>
                    <img src='/common/content_empty.png' alt='' className={styles["empty_img"]} />
                    <span className={styles["params_empty_text"]}>暂无内容</span>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: 3,
      label: (
        <div className={`${styles.tab_label} ${activeKey === 3 ? styles.active : ""}`}>
          <span>本地部署</span>
        </div>
      ),
      children: (
        <div className={styles["model-option-content"]}>
          <div
            ref={contentRef}
            className={`${styles["local_deployment"]} ${styles["overflow-style"]} `}
          >
            {modelDetail.localDeploy}
          </div>
        </div>
      ),
    },
    {
      key: 4,
      label: (
        <div className={`${styles.tab_label} ${activeKey === 4 ? styles.active : ""}`}>
          <span>API调用</span>
        </div>
      ),
      children: (
        <>
          {modelDetail.type === 1 && (
            <div className={styles["model-option"]}>
              <div className={styles["api-container"]}>
                <div className={styles["api-content"]}>
                  <div>
                    <span className={styles["api-server-title"]}>API服务器</span>
                    <span ref={apiUrlRef}>
                      {process.env.NEXT_PUBLIC_API_BASE + modelDetail.invokeUrl}
                    </span>
                  </div>
                  {urlParams.isSquare === "true" && (
                    <span className={styles["img-wrapper"]} onClick={copyToClipboard}>
                      <img src='/model/copy.png' className={styles["copy-icon"]} alt='复制'></img>
                    </span>
                  )}
                </div>
                {urlParams.isSquare === "true" && (
                  <div
                    className={styles["api-button"]}
                    onClick={() => apidrawerRef.current?.open(modelDetail.id)}
                  >
                    <img src='/model/key.png' className={styles["key-icon"]}></img>
                    API密钥
                  </div>
                )}
              </div>
              {mdContent && (
                <div className={styles["markdown-container"]} ref={elementRef}>
                  <div className={styles["md-header"]}>
                    <div className={styles["md-title"]}>
                      <div
                        className={styles["md-title-left"]}
                        onClick={() => setMdIsCollapsed(!mdIsCollapsed)}
                      >
                        <img src='/model/file_md.png' className={styles["md-icon"]}></img>
                        {extractFileName(modelDetail.apiDocument)}
                        <img
                          src='/model/top.png'
                          className={styles["arrow-icon"]}
                          style={{
                            transform: mdIsCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        ></img>
                      </div>
                      <img
                        src={`/model/${isFullscreen ? "cancel_full" : "full"}.png`}
                        className={styles["full-icon"]}
                        onClick={toggleFullscreen}
                      ></img>
                    </div>
                    {!mdIsCollapsed && (
                      <Divider className={styles["custom-divider"]} size='small' />
                    )}
                  </div>
                  {!mdIsCollapsed && (
                    <div className={styles["md-content"]}>
                      {/* 新增 content 容器 */}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ),
      // 123
    },
    {
      key: 5,
      label: (
        <div className={`${styles.tab_label} ${activeKey === 5 ? styles.active : ""}`}>
          <span>模型文件</span>
        </div>
      ),
      children: (
        <div className={styles["model_file_option"]}>
          {quantiFile && modelDetail.quantifiedStorageUrl !== "" && (
            <div className={styles["model-option"]}>
              <span className={`${styles["model-file-title"]}`}>
                已量化导出模型的文件位置
              </span>
              <div className={styles["directory-structure"]} style={{ paddingLeft: 12 }}>
                {modelDetail.quantifiedStorageType ? (
                  <Spin spinning={quantiFileLoading}>
                    <FileTree
                      data={quantiFile}
                      path={modelDetail.quantifiedStorageUrl}
                      showUpload={urlParams.isSquare}
                    />
                  </Spin>
                ) : (
                  modelDetail.quantifiedStorageUrl
                )}
              </div>
            </div>
          )}
          {weightFile && modelDetail.weightStorageUrl !== "" && (
            <div className={styles["model-option"]}>
              <span className={`${styles["model-file-title"]} `}>
                权重文件位置
              </span>
              <div className={styles["directory-structure"]} style={{ paddingLeft: 12 }}>
                {modelDetail.weightStorageType ? (
                  <Spin spinning={weightFileLoading}>
                    <FileTree
                      data={weightFile}
                      path={modelDetail.weightStorageUrl}
                      showUpload={urlParams.isSquare}
                    />
                  </Spin>
                ) : (
                  modelDetail.weightStorageUrl
                )}
              </div>
            </div>
          )}
           {codeFile && modelDetail.codeUrl !== "" && (
                <div className={styles["model-option"]}>
                  <span className={`${styles["model-file-title"]}`}>
                    模型代码文件
                  </span>
                  <div className={styles["directory-structure"]} style={{ paddingLeft: 12 }}>
                      <Spin spinning={codeFileLoading}>
                        <FileTree
                          data={codeFile}
                          path={modelDetail.codeUrl}
                          showUpload="false"
                        />
                      </Spin>
                    </div>
                </div>
              )}
          <div className={styles["model-option"]}>
            <span className={`${styles["model-file-title"]} `}>
              资源配置
            </span>
            <div className={styles["resources_container"]}>
              <p className={styles["resources_option"]}>
                CPU核数 ：<span className={styles["text-bold"]}>{modelDetail.cpuCoresNum}</span>
              </p>
              <p className={styles["resources_option"]}>
                内存 ：<span className={styles["text-bold"]}>{modelDetail.memorySize}MB</span>
              </p>
              <p className={styles["resources_option"]}>
                是否选择GPU ：
                <span className={styles["text-bold"]}>
                  {modelDetail.isSelectedGpu ? "是" : "否"}
                </span>
              </p>
              <p className={styles["resources_option"]}>
                GPU块数 ：<span className={styles["text-bold"]}>{modelDetail.gpuNum}</span>
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={styles["detail-page"]}>
      <div className={styles["head-container"]}>
        <img src={"/back.png"} className={styles["back-icon"]} onClick={backHandle}></img>
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className={styles["detail_center"]}>
        <div className={styles["detail_top"]}>
          <div className={styles["model_title"]}>
            <div className={styles["model_info"]}>
              <img
                className={styles["model-avatar"]}
                src={process.env.NEXT_PUBLIC_API_BASE + modelDetail.iconUrl}
              ></img>
              <div className={styles["model_info_container"]}>
                <div className={styles["model-name"]}>{modelDetail.name}</div>
                <div className={styles["model_tag"]}>
                  {modelDetail.type ? (
                    <div className={styles["model_type_pre"]}>
                      <img src='/model/color_pre.png' className={styles["model_icon"]} />
                      <span>预训练模型</span>
                    </div>
                  ) : (
                    <div className={styles["model_type_algo"]}>
                      <img src='/model/color_algo.png' className={styles["model_icon"]} />
                      <span>算法模型</span>
                    </div>
                  )}
                  <div className={styles["model_type"]}>
                    {ModelTypeMap[modelDetail?.classification]}
                  </div>
                  {modelTag.length !== 0 && (
                    <div className={styles["tag-content"]}>
                      <img src='/application/tag_icon.svg'></img>
                      <span style={{ color: "#666E82" }}>
                        {modelTag.map((item) => `#${item}`).join(",")}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles["model-support"]}>
                  {modelSupport
                    .filter((item) => item.show)
                    .map((item) => (
                      <div className={styles["support-item"]} key={item.key}>
                        <img src='/model/done_icon.png' className={styles["done_icon"]}></img>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  {showFramework && (
                    <span className={styles["train-frame"]}>
                      {" "}
                      <Tooltip title='代码内部以此框架编写'>
                        <img src='/workflow/tip.png' alt='' width={16} />
                      </Tooltip>
                      <span>{`(分布式训练框架:${modelDetail.trainFrame})`}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {urlParams.isSquare === "true" && (
              <>
                {modelDetail.type === 1 ? (
                  <Popover
                    open={openPopover}
                    onOpenChange={handleOpenChange}
                    content={popoverContent}
                    trigger='click'
                    placement='bottomRight'
                    arrow={false}
                  >
                    <Button
                      type='primary'
                      className={styles["upload-btn"]}
                      disabled={!checkPermission("/main/model/square/operation")}
                    >
                      <img
                        src='/model/upload_icon.png'
                        alt='icon'
                        className={styles["upload-btn-icon"]}
                      />
                      下载
                    </Button>
                  </Popover>
                ) : (
                  <div className={styles["algorithm-btn-container"]}>
                    <Button
                      className={styles["upload-btn-algorithm"]}
                      onClick={downloadHandle}
                      disabled={!checkPermission("/main/model/square/operation")}
                    >
                      <img
                        src='/model/algorithm_upload.png'
                        alt='icon'
                        className={styles["algorithm-upload-icon"]}
                      />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          {modelDetail.introduction ? (
            <div className={styles["model-desc"]}>{modelDetail.introduction}</div>
          ) : (
            <span className={styles["model-desc"]}>无描述...</span>
          )}
          <div className={styles["model_basic_data"]}>
            <div className={styles["model_basic_item"]}>
              <span className={styles["model_basic_item_num"]}>
                {modelDetail.contextLength || "无"}
              </span>
              <span className={styles["model_basic_item_text"]}>模型上下文长度</span>
            </div>

            <div className={styles["model_basic_item"]}>
              <span className={styles["model_basic_item_num"]}>{modelDetail.tokenMax || "无"}</span>
              <span className={styles["model_basic_item_text"]}>最大tokens上限</span>
            </div>

            {modelDetail.loadingMode && (
              <div className={styles["model_basic_item"]}>
                <span className={styles["model_basic_item_num"]}>
                  {modelDetail.loadingMode === "other" ? "其他" : modelDetail.loadingMode}
                </span>
                <span className={styles["model_basic_item_text"]}>加载方式</span>
              </div>
            )}
            <div
              className={styles["model_basic_item"]}
              style={{ width: "auto", paddingRight: 24, borderRight: 0 }}
            >
              <span className={styles["model_basic_item_num"]}>
                {modelDetail.updateTime || "无"}
              </span>
              <span className={styles["model_basic_item_text"]}>更新日期</span>
            </div>
          </div>
          <div className={styles["model_info_container_bottom"]}>
            <img
              src='/model/voice_logo.png'
              alt=''
              width={16}
              height={16}
              style={{ marginRight: 2 }}
            />
            <span>通晓官方@wakwabil.gy</span>
            {modelDetail.internalName && (
              <div className={styles["model-internal"]}>内部名称:{modelDetail.internalName}</div>
            )}
          </div>
        </div>
        <div className={styles["detail_content"]}>
          <Tabs
            className={styles.custom_tabs}
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key)}
            items={tabOptions}
            tabBarStyle={{ position: "sticky", top: 0, zIndex: 10, background: "#fff" }}
          />
        </div>
      </div>
      <ApiKeyDrawer ref={apidrawerRef} />
      <TrainModal ref={trainModalRef} />
    </div>
  );
}
