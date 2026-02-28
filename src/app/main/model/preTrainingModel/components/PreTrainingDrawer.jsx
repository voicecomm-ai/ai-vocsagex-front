"use client";
import { useState, useEffect, useRef, memo } from "react";
import {
  Drawer,
  Avatar,
  Form,
  Input,
  Select,
  Row,
  Col,
  Tabs,
  Button,
  Switch,
  Popover,
  InputNumber,
  ConfigProvider,
  message,
  Spin,
  Upload,
  Tooltip,
  Radio,
  Segmented,
  Progress,
} from "antd";
import IconSelectorPopover from "../../components/IconSelectorPopover";
import EllipsisTooltip from "../../components/EllipsisTooltip";
import styles from "../page.module.css";
import ConfigForm from "./ConfigForm";
import {
  modelSave,
  modelInfo,
  modelUpdate,
  fileUpload,
  checkUploadedChunks,
  uploadChunk,
  mergeChunks,
} from "@/api/model";
import FileTipPopover from "../../components/FileTipPopover";
import OllamaFileTip from "../../components/OllamaFileTip";
import SparkMD5 from "spark-md5"; // 需安装：npm install spark-md5 --save
import { defaultAppIcons } from "@/utils/constants";

// 所有支持功能项
const initialSupportOptions = [
  {
    label: "支持视觉",
    key: "isSupportVisual",
    checked: false,
    iconUrl: "/model/see.svg",
  },
  {
    label: "支持文档",
    key: "isSupportDocument",
    checked: false,
    iconUrl: "/model/doc.svg",
  },
  {
    label: "支持函数调用",
    key: "isSupportFunction",
    checked: false,
    iconUrl: "/model/func.svg",
  },
  {
    label: "支持微调",
    key: "isSupportAdjust",
    checked: false,
    iconUrl: "/model/adjust.svg",
  },
];
// 分布式训练框架列表
const trainingFrameworkList = [
  { label: "PyTorch", value: "PyTorch" },
  { label: "TensorFlow", value: "TensorFlow" },
  { label: "JAX", value: "JAX" },
  { label: "MPI", value: "MPI" },
  { label: "PaddlePaddle", value: "PaddlePaddle" },
  { label: "XGBoost", value: "XGBoost" },
];
//上传模型初始化
const initUploadOptions = [
  {
    label: "已量化导出的模型文件位置：",
    key: "quantifiedStorage",
    type: 0,
    url: "",
    file: null, // 上传的文件对象
    fileName: "", // 上传的文件名（用于展示）
  },
  {
    label: "权重文件位置：",
    key: "weightStorage",
    type: 0,
    url: "",
    file: null,
    fileName: "",
  },
  {
    label: "模型代码文件：",
    key: "code",
    type: 1,
    url: "",
    file: null,
    fileName: "",
  },
];
// 构建「图标名称 - 图标路径」映射表（核心：从defaultAppIcons中提取名称）
const iconNameToPathMap = defaultAppIcons.reduce((map, iconPath) => {
  // 提取文件名（如"文心一言.png" → "文心一言"）
  const iconName = iconPath.split("/").pop()?.split(".")[0] || "";
  map[iconName] = iconPath;
  return map;
}, {});

export default function AlgorithmDrawer({ open, onClose, categoryList, onRefresh, editId }) {
  const [title, setTitle] = useState("添加");

  const [supportOptions, setSupportOptions] = useState(initialSupportOptions); //支持功能

  const [selectedModelLabel, setSelectedModelLabel] = useState(null); //tab项

  // 音色名称
  const [timbreInputs, setTimbreInputs] = useState([{ id: 1, value: "" }]);
  const [trainFrame, setTrainFrame] = useState("PyTorch"); //分布式训练框架

  const [form] = Form.useForm();
  const isSelectedGpu = Form.useWatch("isSelectedGpu", form); //监听GPU选择状态
  // 模型图片
  const [selectedIcon, setSelectedIcon] = useState(
    "/file/voicesagex-console/defaultModelIcon/默认1.png"
  );

  //上传模型
  const [uploadOptions, setUploadOptions] = useState(initUploadOptions);
  const [currentUploadKey, setCurrentUploadKey] = useState("");

  // api调用文档上传
  const [fileList, setFileList] = useState([]); //上传列表
  const [fileUrl, setFileUrl] = useState(""); //文件url
  const [uploading, setUploading] = useState(false); // 上传状态
  const fileInputRef = useRef(null); //重新上传调取隐藏的input
  const modelFileInputRef = useRef(null); //模型文件上传
  const { Dragger } = Upload;
  // 新增常量和状态
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB每片（与原有代码一致）
  const CONCURRENCY = 3; // 并发数（复用原有配置）
  const [uploadProgress, setUploadProgress] = useState({}); // 存储各文件进度
  const [currentFileMd5, setCurrentFileMd5] = useState(""); // 当前上传文件MD5
  // 修改模型文件上传相关的state定义
  const [uploadingKey, setUploadingKey] = useState(""); // 新增：跟踪当前正在上传的key
  const [abortController, setAbortController] = useState(null); //定义中止控制器
  const [uploadingModel, setUploadingModel] = useState(false); // 是否正在上传模型文件/切片
  const [isEdit, setIsEdit] = useState(false); // 是否为部署编辑模式
  const [modelData, setModelData] = useState({});

  const handleRadioChange = (e) => {
    e.stopPropagation();
    setTrainFrame(e.target.value);
  };

  useEffect(() => {
    if (open && editId) {
      setTitle("编辑");
      getModelInfo(editId);
    } else {
      setTitle("添加");
      setUploadOptions(initUploadOptions);
      form.setFieldsValue({
        cpuCoresNum: 1,
        memorySize: 4096,
        isSelectedGpu: false,
        gpuNum: 0,
      });
      setIsEdit(false);
    }
  }, [open, editId]);
  
    // 监听表单name字段变化，自动匹配图标
    const nameValue = Form.useWatch("name", form);
    useEffect(() => {
      if (!nameValue) {
        setSelectedIcon("/file/voicesagex-console/defaultModelIcon/默认1.png");
        return;
      }
      const pureName = nameValue.trim();
      const matchedIconPath = iconNameToPathMap[pureName];
      if (matchedIconPath) {
        setSelectedIcon(matchedIconPath);
      }
    }, [nameValue]);

  const chooseGpu = (value) => {
    form.setFieldsValue({
      gpuNum: value ? 1 : 0,
    });
  };

  //获取模型详情
  const getModelInfo = async (id) => {
    const res = await modelInfo(id);
    const data = res.data;
    setModelData(data);
    const modelType = data.classification;
    setIsEdit(data.isSpecial);
    setSelectedModelLabel(modelType);

    setTrainFrame(data.trainFrame || "PyTorch");
    // 设置支持项
    setSupportOptions(() => {
      const distributedItem = {
        label: "支持分布式训练",
        key: "isSupportDistributedTrain",
        checked: false,
        iconUrl: "/model/distributed.svg",
      };
      let filteredOptions;
      if (modelType === 1 || modelType === 2) {
        filteredOptions = initialSupportOptions;
      } else if (modelType === 6) {
        filteredOptions = initialSupportOptions.filter(
          (item) => item.key === "isSupportVisual" || item.key === "isSupportAdjust"
        );
      } else {
        filteredOptions = initialSupportOptions.filter((item) => item.key === "isSupportAdjust");
      }

      // 先检查是否已存在分布式训练选项，不存在再添加
      if (data.loadingMode === "other") {
        const exists = filteredOptions.some((item) => item.key === distributedItem.key);
        if (!exists) {
          filteredOptions.push(distributedItem);
        }
      } else {
        // 可选：如果loadingMode不是other，移除可能存在的分布式选项
        filteredOptions = filteredOptions.filter((item) => item.key !== distributedItem.key);
      }

      return filteredOptions.map((item) => ({
        ...item,
        checked: data[item.key],
      }));
    });
    // 处理调用参数回显
    if (data.options) {
      try {
        const parsedOptions = JSON.parse(data.options);
        setConfigList(
          parsedOptions.map((option, index) => ({
            id: Date.now() + index,
            data: {
              isEnable: option.isEnable !== false,
              decimal_places: option.decimal_places || 0,
              maxChar: option.maxChar || 0,
              select_type: option.select_type || "单选",
              configType: option.configType || null,
              // 其他需要回显的字段...
              ...option,
            },
          }))
        );
      } catch (e) {
        console.error("解析参数失败:", e);
      }
    }
    //音色名称回显
    if (data.timbreName) {
      const timbreNameList = JSON.parse(data.timbreName);
      setTimbreInputs(
        timbreNameList.map((item, index) => ({
          id: index,
          value: item,
        }))
      );
    }
    //基础表单
    form.setFieldsValue({
      classification: data.classification,
      contextLength: data.contextLength || null,
      // tokenMax: data.tokenMax || null,
      overview: data.overview,
      usageScene: data.usageScene,
      tagIdList: data.tagIdList,
      name: data.name,
      introduction: data.introduction,
      localDeploy: data.localDeploy,
      apiDocument: data.apiDocument,
      loadingMode: data.loadingMode,
      timbreText: data.timbreText,
      internalName: data.internalName,
      gpuNum: data.gpuNum || 0,
      cpuCoresNum: data.cpuCoresNum || 1,
      isSelectedGpu: data.isSelectedGpu || false,
      memorySize: data.memorySize || 4096,
      url: data.url,
      apiKey: data.apiKey,
    });

    if (data.apiDocument) {
      const fileName = extractFileName(data.apiDocument);
      setFileUrl(data.apiDocument);
      setFileList([
        {
          uid: "-1",
          name: fileName,
          status: "done",
        },
      ]);
    }
    // 设置图标
    if (data.iconUrl) {
      setSelectedIcon(data.iconUrl);
    }
    // 基于初始配置初始化上传选项
    let newUploadOptions = [...initUploadOptions];

    // 处理量化模型文件
    if (data.quantifiedStorageUrl) {
      newUploadOptions = newUploadOptions.map((option) => {
        if (option.key === "quantifiedStorage") {
          return {
            ...option,
            url: data.quantifiedStorageUrl, // 绑定路径
            type: data.quantifiedStorageType, // 路径模式（如果是已上传文件，可改为1并解析文件名）
            // 从URL中提取文件名（复用已有的extractFileName方法）
            fileName: extractFileName(data.quantifiedStorageUrl),
          };
        }
        return option;
      });
    }

    // 处理权重文件
    if (data.weightStorageUrl) {
      newUploadOptions = newUploadOptions.map((option) => {
        if (option.key === "weightStorage") {
          return {
            ...option,
            url: data.weightStorageUrl,
            type: data.weightStorageType, // 路径模式
            fileName: extractFileName(data.weightStorageUrl),
          };
        }
        return option;
      });
    }

    // 处理模型代码文件
    if (data.codeUrl) {
      newUploadOptions = newUploadOptions.map((option) => {
        if (option.key === "code") {
          return {
            ...option,
            url: data.codeUrl,
            type: 1, // 代码文件默认是上传模式
            fileName: extractFileName(data.codeUrl),
          };
        }
        return option;
      });
    }
    console.log(newUploadOptions, "newUploadOptions");

    // 更新上传选项状态
    setUploadOptions(newUploadOptions);
  };
  function extractFileName(path) {
    const lastSegment = path.split("/").pop(); // 获取文件名部分
    const parts = lastSegment.split("_");

    // 如果有多个下划线，则取第一个下划线后的部分
    if (parts.length > 1) {
      return parts.slice(1).join("_"); // 组合后返回
    }

    // 否则直接返回原文件名
    return lastSegment;
  }

  //预设模型分类
  const isBuiltCategoryList = categoryList.filter((item) => item.isBuilt === true);
  const noBuiltCategoryList = categoryList.filter((item) => item.isBuilt === false);
  // 避免访问 undefined
  const builtTagOptions =
    isBuiltCategoryList?.[0]?.modelTagList?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const noBuiltTagOptions =
    noBuiltCategoryList?.[0]?.modelTagList?.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  //切换模型类型控制显示
  const changeModelType = (value) => {
    setSelectedModelLabel(value);
    supportFunc(value);
  };
  const props = {
    name: "file",
    multiple: false,
    accept: ".md",
    fileList,
    showUploadList: false,
    beforeUpload(file) {
      const isMd = file.type === "text/markdown" || file.name.endsWith(".md"); // 补充：某些浏览器上传时 file.type 可能为空或错误

      const isLt10M = file.size / 1024 / 1024 <= 10;

      if (!isMd) {
        message.error("只能上传 md 格式的文件！");
        return Upload.LIST_IGNORE;
      }
      if (!isLt10M) {
        message.error("文件大小不能超过10MB！");
        return Upload.LIST_IGNORE;
      }

      return true; // 允许传递给 customRequest 处理上传
    },
    customRequest({ file, onSuccess, onError }) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const fileDir = "model/document";

      fileUpload(fileDir, formData)
        .then((res) => {
          message.success(`${file.name} 上传成功`);
          setFileUrl(res.data);
          setFileList([file]);
          form.setFieldsValue({
            apiDocument: res.data, // ✅ 这里同步表单字段
          });
          onSuccess(res.data);
          // setUploading(false);
        })
        .catch((err) => {
          console.error(err);
          message.error(`${file.name} 上传失败`);
          onError(err);
        })
        .finally(() => {
          setUploading(false); // 上传完成，关闭 loading
        });
    },

    onRemove() {
      // 清空
      setFileList([]);
      setFileUrl("");
    },

    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  // 复用文件MD5计算函数
  // 分片计算MD5（解决大文件读取失败问题）
  const calculateFileMD5 = (file, signal) => {
    return new Promise((resolve, reject) => {
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();

      setUploadingModel(true);

      // ✅ 若中止，则取消读取
      if (signal) {
        signal.addEventListener("abort", () => {
          fileReader.abort();
          reject(new Error("MD5计算被中止"));
        });
      }

      const loadNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        fileReader.readAsArrayBuffer(chunk);
      };

      fileReader.onload = (e) => {
        try {
          spark.append(e.target.result); // 累加分片数据
          currentChunk++;

          if (currentChunk < totalChunks) {
            // console.log(`已完成 ${currentChunk}/${totalChunks} 分片`);
            loadNextChunk(); // 继续读取下一分片
          } else {
            // 所有分片处理完成
            const md5 = spark.end();
            console.log(`MD5计算完成: ${md5}`);

            setUploadingModel(false);
            resolve(md5);
          }
        } catch (err) {
          console.error("分片处理失败:", err);
          reject(err);
        }
      };

      fileReader.onerror = (err) => {
        console.error("FileReader错误:", {
          code: err.target.error.code,
          message: err.target.error.message,
          chunk: currentChunk, // 记录失败的分片位置
        });
        reject(new Error(`读取分片 ${currentChunk} 失败: ${err.target.error.message}`));
      };

      fileReader.onabort = () => {
        console.error("文件读取被中止");
        reject(new Error("文件读取被中止"));
      };

      loadNextChunk();
    });
  };

  // 复用分片创建函数
  const createFileChunks = (file, chunkSize) => {
    const chunks = [];
    let current = 0;
    while (current < file.size) {
      chunks.push(file.slice(current, current + chunkSize));
      current += chunkSize;
    }
    return chunks;
  };
  const [merging, setMerging] = useState(false);

  // 改造分片上传核心逻辑（加入进度计算）
  const handleFileUpload = async (file, onSuccess, onError) => {
    // 保持原有：创建中断控制器
    const controller = new AbortController();
    setAbortController(controller);
    console.log(controller, "controller");

    const { signal } = controller;

    let fileDir = "model/document";
    // let directory = title === "添加" ? "temp" : editId;
    let directory = "temp";

    if (currentUploadKey === "quantifiedStorage")
      fileDir = `model/preTrain/${directory}/quantified`;
    if (currentUploadKey === "weightStorage") fileDir = `model/preTrain/${directory}/weight`;
    if (currentUploadKey === "code") fileDir = `model/preTrain/${directory}/code`;
    let totalChunks = 0;
    let uploadedChunksCount = 0;
    // 新增：仅用于合并前判断（不影响其他逻辑）
    let isUploadAborted = false;

    try {
      // 保持原有：MD5计算（如果你的calculateFileMD5原本不支持signal，先注释signal参数）
      // 👉 重点：如果之前没给calculateFileMD5加signal支持，先恢复成你原来的调用方式：
      const fileMd5 = await calculateFileMD5(file);
      // const fileMd5 = await calculateFileMD5(file, signal); // 仅当你已修改calculateFileMD5支持signal时使用

      setCurrentFileMd5(fileMd5);
      const chunks = createFileChunks(file, CHUNK_SIZE);
      totalChunks = chunks.length;
      setUploadProgress({ [fileMd5]: 0 });

      // 保持原有：检查已上传分片（同样，没改checkUploadedChunks支持signal就去掉signal）
      const res = await checkUploadedChunks(fileMd5);
      // const res = await checkUploadedChunks(fileMd5, { signal });
      const uploadedChunkIndexes = res.data?.uploadedChunkIndexes || [];
      uploadedChunksCount = uploadedChunkIndexes.length;

      const initialProgress = Math.floor((uploadedChunksCount / totalChunks) * 100);
      setUploadProgress({ [fileMd5]: initialProgress });

      // 保持原有：过滤未上传分片
      const tasks = chunks
        .map((chunk, i) => ({ index: i, chunk }))
        .filter(({ index }) => !uploadedChunkIndexes.includes(index));

      // 保持原有：并发上传分片（仅在Promise.all内部给uploadChunk加signal）
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        // 👉 关键：每批上传前检查是否已中止（不修改原有上传逻辑）
        if (signal.aborted) {
          isUploadAborted = true;
          throw new Error("AbortError");
        }

        const batch = tasks.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(({ index, chunk }) => {
            const formData = new FormData();
            formData.append("file", chunk);
            const queryParams = {
              fileMd5,
              chunkIndex: index,
              totalChunks,
              fileDir,
            };
            // 👉 仅给uploadChunk加signal（不影响其他参数和逻辑）
            return uploadChunk(queryParams, formData, signal);
          })
        );

        uploadedChunksCount += batch.length;
        const progress = Math.floor((uploadedChunksCount / totalChunks) * 100);
        setUploadProgress({ [fileMd5]: progress });
      }

      // 👉 核心：合并前检查是否已中止（仅加这一行判断，不改动其他合并逻辑）
      if (isUploadAborted || signal.aborted) {
        console.log("上传已中止，跳过合并");
        return;
      }

      // 保持原有：合并分片逻辑（完全不改动）
      const mergeParams = {
        fileMd5,
        fileName: file.name,
        fileDir,
      };
      setMerging(true);

      try {
        // 👉 给合并请求加signal（不影响其他参数）
        const mergeRes = await mergeChunks(mergeParams, { signal });

        // 保持原有：合并成功后的状态更新
        message.success(`${file.name} 上传成功`);
        setUploadOptions((prev) =>
          prev.map((item) =>
            item.key === currentUploadKey
              ? { ...item, url: mergeRes.data.filePath, file, fileName: file.name }
              : item
          )
        );
        onSuccess(mergeRes.data);
      } catch (err) {
        // 保持原有：合并错误处理（新增中止错误判断）
        if (err.name === "AbortError") {
          console.log("合并已中止");
          return;
        }
        if (err.response?.status === 500) {
          message.error("文件合并超时，请重试（大文件可能需要更长时间）");
        } else {
          message.error("上传失败，请重试");
        }
      } finally {
        setMerging(false);
      }
    } catch (err) {
      // 保持原有：全局错误处理（仅优化中止错误判断）
      if (err.name === "AbortError" || err.name === "CanceledError") {
        isUploadAborted = true;
        message.warning(`${file.name} 上传已中止`);
      } else {
        console.error("上传异常：", err);
        onError(err);
      }
    } finally {
      // 保持原有：最终状态清理
      setUploadingModel(false);
      setCurrentFileMd5("");
      setAbortController(null);

      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[currentFileMd5];
        return newProgress;
      });
    }
  };

  const currentLoadingMode = Form.useWatch("loadingMode", form);
  // useEffect(() => {
  //   console.log(currentLoadingMode, "currentLoadingMode");
  // }, [currentLoadingMode]);

  // 上传模型相关数据
  // 修改modelProps配置
  const modelProps = {
    name: "file",
    multiple: false,
    accept: ".zip",
    fileList: uploadOptions.find((item) => item.key === currentUploadKey)?.file
      ? [uploadOptions.find((item) => item.key === currentUploadKey).file]
      : [],
    showUploadList: false,
    beforeUpload(file) {
      // 1. 文件格式校验（优先通过文件名后缀判断，更可靠）
      const isZip = file.name.toLowerCase().endsWith(".zip");

      // 2. 获取当前模式和上传项key
      let isLtSize = true;
      let sizeLimit = ""; // 存储当前限制的文本描述

      // 3. 根据条件设置大小限制
      if (currentUploadKey === "code") {
        // code类型：区分ollama和other模式
        if (currentLoadingMode === "ollama") {
          // ollama模式：限制100M
          isLtSize = file.size / 1024 / 1024 <= 100; // 100M = 100 * 1024 * 1024 Byte
          sizeLimit = "100M";
        } else if (currentLoadingMode === "other") {
          // other模式：限制200M
          isLtSize = file.size / 1024 / 1024 <= 200; // 200M = 200 * 1024 * 1024 Byte
          sizeLimit = "200M";
        } else {
          // 异常情况：未匹配到已知模式（可选提示）
          message.error("请选择加载方式");
          return Upload.LIST_IGNORE;
        }
      } else {
        // 非code类型：限制10G
        isLtSize = file.size / 1024 / 1024 / 1024 <= 10; // 10G = 10 * 1024 * 1024 * 1024 Byte
        sizeLimit = "10G";
      }

      // 5. 格式校验失败提示
      if (!isZip) {
        message.error("只能上传 zip 格式的压缩文件夹！");
        return Upload.LIST_IGNORE;
      }

      // 6. 大小校验失败提示
      if (!isLtSize) {
        message.error(`文件大小不能超过${sizeLimit}！`);
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    customRequest({ file, onSuccess, onError }) {
      setUploadingKey(currentUploadKey);
      handleFileUpload(file, onSuccess, onError);
    },
    onRemove() {
      setUploadOptions((prev) =>
        prev.map((item) =>
          item.key === currentUploadKey ? { ...item, file: null, fileName: "", url: "" } : item
        )
      );
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  //获取上传模型数据
  const getUploadModelData = () => {
    // 从 uploadOptions 中提取各字段值
    const quantifiedItem = uploadOptions.find((item) => item.key === "quantifiedStorage");
    const weightItem = uploadOptions.find((item) => item.key === "weightStorage");
    const codeItem = uploadOptions.find((item) => item.key === "code");

    // 组装目标数据结构
    const result = {
      quantifiedStorageType: quantifiedItem?.type ?? 0, // 0：输入路径；1：上传文件
      quantifiedStorageUrl: quantifiedItem?.url ?? "", // 量化模型地址
      weightStorageType: weightItem?.type ?? 0, // 权重文件存储方式
      weightStorageUrl: weightItem?.url ?? "", // 权重文件地址
      codeUrl: codeItem?.url ?? "", // 模型代码文件地址
    };

    // console.log("目标数据：", result);
    return result; // 可返回供后续使用（如提交表单）
  };
  const handleUploadTypeChange = (key, value) => {
    setUploadOptions((prevOptions) =>
      prevOptions.map((option) =>
        option.key === key ? { ...option, type: value, url: "" } : option
      )
    );
  };
  const handleUploadUrlChange = (key, value) => {
    setUploadOptions((prevOptions) =>
      prevOptions.map((option) => (option.key === key ? { ...option, url: value } : option))
    );
  };
  // 动态生成 tabs 的 items
  const getTabItems = () => {
    const baseItems = [
      {
        key: "info",
        label: "基本信息",
        children: (
          <div className={styles["tabpane-container"]}>
            <ConfigProvider
              theme={{
                components: {
                  Form: {
                    labelColor: " #666E82",
                  },
                },
              }}
            >
              <Form form={form} layout='horizontal' labelCol={{ span: 4 }}>
              <Form.Item name='url'   label='模型url:'>
                  <Input placeholder='请输入模型url' />
                </Form.Item>
                <Form.Item name='apiKey'   label='apiKey:'>
                  <Input placeholder='请输入apiKey' />
                </Form.Item>
                <Form.Item
                  label='模型上下文长度:'
                  name='contextLength'
                  rules={[
                    {
                      type: "number",
                      min: 1,
                      max: 128000,
                      message: "请输入 1 到 128000 之间的数字",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder='请输入长度'
                    min={1}
                    max={128000}
                    style={{ width: "100%", border: "1px solid #DDDFE4" }}
                  ></InputNumber>
                </Form.Item>
                <Form.Item
                  label='模型概述:'
                  name='overview'
                  rules={[{ required: true, message: "请输入模型概述，不超过200个字" }]}
                >
                  <Input.TextArea
                    rows={3}
                    maxLength={200}
                    placeholder='请输入,不超过200个字'
                    style={{ resize: "none", border: "1px solid #DDDFE4" }}
                  ></Input.TextArea>
                </Form.Item>
                <Form.Item
                  label='应用场景:'
                  name='usageScene'
                  rules={[{ required: true, message: "请输入应用场景，不超过200个字" }]}
                >
                  <Input.TextArea
                    rows={3}
                    maxLength={200}
                    placeholder='请输入,不超过200个字'
                    style={{ resize: "none" }}
                  ></Input.TextArea>
                </Form.Item>

                <Form.Item name='apiDocument' noStyle>
                  <Input type='hidden' />
                </Form.Item>
     
              </Form>
            </ConfigProvider>
          </div>
        ),
      },
    ];

    // 根据 selectedModelLabel 动态添加其他 tab
    if ([1, 2].includes(selectedModelLabel)) {
      baseItems.push({
        key: "params",
        label: "调用参数",
        forceRender: true,
        children: (
          <div className={styles["tabpane-container"]}>
            <div className={styles["params-add-config"]} onClick={handleAddConfig}>
              <img src='/model/config_add_icon.svg' className={styles["params-add-icon"]} />
              添加配置
            </div>
            <div className={styles["config-list"]}>
              {configList.map(({ id, data }) => (
                <ConfigForm
                  key={id}
                  id={id}
                  data={title === "添加" ? data : undefined} // 新增时使用data
                  initialValues={title === "编辑" ? data : undefined} // 编辑时使用initialValues
                  registerForm={(id, form) => {
                    if (form) formRefs.current[id] = form;
                    else delete formRefs.current[id];
                  }}
                  onDelete={handleDeleteConfig}
                />
              ))}
            </div>
          </div>
        ),
      });
    }

    if (selectedModelLabel === 7) {
      baseItems.push({
        key: "voice",
        label: "模型音色",
        children: (
          <div className={styles["tabpane-container"]}>
            <ConfigProvider
              theme={{
                components: {
                  Form: {
                    labelColor: " #666E82",
                  },
                },
              }}
            >
              <Form form={form}>
                <Form.Item
                  label='音色名称'
                  name='timbreName'
                  required
                  validateTrigger={["onBlur", "onChange"]} // 触发验证的时机
                  rules={[
                    {
                      validator: (_, value) => {
                        // 检查所有输入项是否为空
                        const isEmpty = timbreInputs.some((input) => !input.value.trim());
                        if (isEmpty) {
                          return Promise.reject("请输入音色名称");
                        }
                        // 检查是否有重复名称
                        const values = timbreInputs.map((input) => input.value.trim());
                        const hasDuplicate = values.some(
                          (val, index) => val && values.indexOf(val) !== index
                        );
                        if (hasDuplicate) {
                          return Promise.reject("音色名称不能重复");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  {/* 输入列表渲染 */}
                  {timbreInputs.map((input) => (
                    <div key={input.id} style={{ display: "flex", marginBottom: 8 }}>
                      <Input
                        placeholder='请输入，不超过50个字'
                        maxLength={50}
                        style={{ flex: 1, height: 36 }}
                        value={input.value}
                        onChange={(e) => handleTimbreChange(input.id, e)}
                        onBlur={() => form.validateFields(["timbreName"])} // 失焦时触发验证
                        suffix={
                          timbreInputs.length > 1 && (
                            <span
                              className={styles["params-delete-icon"]}
                              onClick={() => handleRemoveTimbre(input.id)}
                              title='删除音色'
                            />
                          )
                        }
                      />
                    </div>
                  ))}
                  {/* 添加按钮 */}
                  <div className={styles["params-add-config"]} onClick={handleAddTimbre}>
                    <img src='/model/config_add_icon.svg' className={styles["params-add-icon"]} />
                    添加音色
                  </div>
                </Form.Item>
                <Form.Item
                  label='默认文本'
                  name='timbreText'
                  rules={[{ required: true, message: "请输入默认文本" }]}
                >
                  <Input.TextArea
                    maxLength={100}
                    rows={3}
                    placeholder='请输入,不超过100个字'
                  ></Input.TextArea>
                </Form.Item>
              </Form>
            </ConfigProvider>
          </div>
        ),
      });
    }

    // 始终显示支持功能 上传模型
    baseItems.push({
      key: "function",
      label: "支持功能",
      children: (
        <>
          {supportOptions.map((item) => (
            <div
              key={item.label}
              className='support-switch'
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px 24px 16px 12px",
                background: "rgba(250, 252, 253, 1)",
                borderRadius: 12,
                border: "1px solid #DDDFE4",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src={item.iconUrl} alt='' style={{ marginRight: 8 }} />
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  {item.key === "isSupportDistributedTrain" && (
                    <Tooltip title='决定训练时GPU的数量。是,GPU可多个;否,GPU只能是一个。'>
                      <img src='/workflow/tip.png' alt='' width={16} />
                    </Tooltip>
                  )}
                </div>
                <Switch
                  size='small'
                  style={{ borderRadius: 6 }}
                  checked={item.checked}
                  disabled={isEdit}
                  onChange={(checked) => {
                    const newSupportOptions = supportOptions.map((opt) =>
                      opt.key === item.key ? { ...opt, checked } : opt
                    );
                    setSupportOptions(newSupportOptions);
                  }}
                />
              </div>
            </div>
          ))}
          {currentLoadingMode === "other" && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14,
                  color: "#364052",
                }}
              >
                <span>训练框架</span>
                <Tooltip title='代码内部以此框架编写'>
                  <img src='/workflow/tip.png' alt='' width={16} />
                </Tooltip>
              </div>
              <div className={styles["dataset-type-radio"]}>
                <Radio.Group
                  onChange={(e) => {
                    handleRadioChange(e);
                  }}
                  value={trainFrame}
                  disabled={isEdit}
                >
                  {trainingFrameworkList.map((frameItem) => (
                    <Radio
                      key={frameItem.value}
                      value={frameItem.value}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {frameItem.label}
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            </div>
          )}
        </>
      ),
    });

    return baseItems;
  };

  //支持功能项
  const supportFunc = (value) => {
    // 1. 从Form中获取当前加载方式（无需额外状态）
    // const currentLoadingMode = form.getFieldValue("loadingMode");

    // 2. 根据模型类型计算基础支持项
    let baseOptions;
    if (value === 1 || value === 2) {
      baseOptions = initialSupportOptions;
    } else if (value === 6) {
      baseOptions = initialSupportOptions.filter(
        (item) => item.key === "isSupportVisual" || item.key === "isSupportAdjust"
      );
    } else {
      baseOptions = initialSupportOptions.filter((item) => item.key === "isSupportAdjust");
    }

    // 3. 如果当前加载方式是other，追加分布式训练项（避免重复）
    if (currentLoadingMode === "other") {
      const distributedItem = {
        label: "支持分布式训练",
        key: "isSupportDistributedTrain",
        checked: false,
        iconUrl: "/model/distributed.svg",
      };
      // 检查baseOptions中是否已有分布式训练项，没有则添加
      const hasDistributed = baseOptions.some((item) => item.key === "isSupportDistributedTrain");
      setSupportOptions(hasDistributed ? baseOptions : [...baseOptions, distributedItem]);
    } else {
      // 非other模式，确保不含分布式训练
      setSupportOptions(baseOptions.filter((item) => item.key !== "isSupportDistributedTrain"));
    }

    setConfigList([]);
    setActiveKey("info");
  };
  //切换加载方式
  const changeLoadingMode = (value) => {
    const item = {
      label: "支持分布式训练",
      key: "isSupportDistributedTrain",
      checked: false,
      iconUrl: "/model/distributed.svg",
    };
    setUploadOptions((prev) =>
      prev.map((item) =>
        item.key === "code" ? { ...item, url: "", file: null, fileName: "" } : item
      )
    );
    if (value === "other") {
      setSupportOptions((prevOptions) => [...prevOptions, item]);
      // setUploadOptions(initUploadOptions);
    } else {
      // 支持项
      setSupportOptions((prevOptions) =>
        prevOptions.filter((item) => item.key !== "isSupportDistributedTrain")
      );
    }
  };

  const [activeKey, setActiveKey] = useState("info");
  const [configList, setConfigList] = useState([]);
  const formRefs = useRef({});

  const handleAddConfig = async () => {
    // 先收集旧值
    const updatedConfigs = await Promise.all(
      configList.map(async ({ id }) => {
        const form = formRefs.current[id];
        const values = form ? await form.validateFields().catch(() => form.getFieldsValue()) : {};
        return { id, data: values };
      })
    );

    // 添加新项，旧项数据带回传
    const newId = Date.now();
    setConfigList([
      { id: newId, data: { isEnable: true, decimal_digit: true } }, // 新增项默认开启
      ...updatedConfigs.map((item) => ({
        id: item.id,
        data: item.data,
      })),
    ]);
  };

  //删除参数表单
  const handleDeleteConfig = (id) => {
    setConfigList((prev) => prev.filter((item) => item.id !== id));
    delete formRefs.current[id];
  };

  // 添加音色输入框
  const handleAddTimbre = () => {
    setTimbreInputs([...timbreInputs, { id: Date.now(), value: "" }]);
  };

  // 删除音色输入框
  const handleRemoveTimbre = (id) => {
    if (timbreInputs.length <= 1) return; // 至少保留一个
    setTimbreInputs(timbreInputs.filter((input) => input.id !== id));
  };

  // 处理输入变化
  const handleTimbreChange = (id, e) => {
    setTimbreInputs(
      timbreInputs.map((input) => (input.id === id ? { ...input, value: e.target.value } : input))
    );
  };

  //处理调用参数所有验证
  const validateConfigForms = async () => {
    // 验证所有配置表单
    const options = await Promise.all(
      configList.map(async ({ id }) => {
        const formInstance = formRefs.current[id];
        return await formInstance?.validateFields();
      })
    );

    // 检查重复项
    const variableNameMap = new Map();
    const titleNameMap = new Map();
    const errors = [];

    options.forEach((option, index) => {
      if (!option) return;

      // 检查变量名
      if (option.varible_name) {
        if (variableNameMap.has(option.varible_name)) {
          errors.push({
            id: configList[index].id,
            field: "varible_name",
            message: `变量名 "${option.varible_name}" 已存在于第 ${
              variableNameMap.get(option.varible_name) + 1
            } 个配置`,
          });
        } else {
          variableNameMap.set(option.varible_name, index);
        }
      }

      // 检查标题名
      if (option.title_name) {
        if (titleNameMap.has(option.title_name)) {
          errors.push({
            id: configList[index].id,
            field: "title_name",
            message: `标题名 "${option.title_name}" 已存在于第 ${
              titleNameMap.get(option.title_name) + 1
            } 个配置`,
          });
        } else {
          titleNameMap.set(option.title_name, index);
        }
      }
    });

    if (errors.length > 0) {
      // 高亮显示有问题的表单
      errors.forEach((error) => {
        const formInstance = formRefs.current[error.id];
        formInstance?.setFields([
          {
            name: error.field,
            errors: [error.message],
          },
        ]);
      });
      throw new Error("存在重复的配置项，请检查");
    }

    return options;
  };

  //提交表单
  const submitHandle = async () => {
    if (uploading) {
      message.warning("文件正在上传中，请稍候再提交");
      return;
    }
    try {
      // 1. 基础表单校验
      const basicValues = await form.validateFields();

      // 2. 验证参数配置表单（如果存在）
      const options = await validateConfigForms();

      // 3. 特殊验证：如果是语音模型(7)，必须验证音色
      if (selectedModelLabel === 7) {
        // 验证音色名称
        if (timbreInputs.length === 0) {
          setActiveKey("voice"); // 自动跳转到音色Tab
          throw new Error("至少需要添加一个音色");
        }

        const timbreNames = timbreInputs.map((input) => input.value.trim());
        if (timbreNames.some((name) => !name)) {
          setActiveKey("voice");
          throw new Error("请填写所有音色名称");
        }

        if (new Set(timbreNames).size !== timbreNames.length) {
          setActiveKey("voice");
          throw new Error("音色名称不能重复");
        }
      }

      // 4. 支持开关拼装
      const supportPayload = supportOptions.reduce((acc, item) => {
        acc[item.key] = item.checked;
        return acc;
      }, {});
      const uploadModelData = getUploadModelData();
      // 其他加载方式需上传模型代码文件
      // if (uploadModelData.codeUrl === "" && !isEdit) {
      //   return message.error("请上传模型代码文件");
      // }
      // if (currentLoadingMode === "ollama") {
      //   if (
      //     uploadModelData.quantifiedStorageUrl === "" &&
      //     uploadModelData.weightStorageUrl === "" &&
      //     !isEdit
      //   ) {
      //     return message.error("请至少上传已量化导出模型文件或权重文件其一");
      //   }
      // }

      // 5. 参数拼装
      const params = {
        ...basicValues,
        ...supportPayload,
        contextLength: basicValues.contextLength || 0,
        // tokenMax: basicValues.tokenMax || 0,
        type: 1,
        classification: basicValues.classification,
        iconUrl: selectedIcon,
        options: JSON.stringify(options),
        // 只有语音模型才添加音色参数
        timbreName:
          basicValues.classification === 7
            ? JSON.stringify(timbreInputs.map((input) => input.value.trim()))
            : "",
        trainFrame: trainFrame, //训练框架
        ...uploadModelData, // 上传模型数据
        gpuNum: basicValues.gpuNum ?? modelData.gpuNum,
        cpuCoresNum: basicValues.cpuCoresNum ?? modelData.cpuCoresNum,
        memorySize: basicValues.memorySize ?? modelData.memorySize,
        isSelectedGpu: basicValues.isSelectedGpu ?? modelData.isSelectedGpu,
      };
      console.log(params, "params");
      // console.log(basicValues.cpuCoresNum,'basicValues.cpuCoresNum');

      // return
      // 6. 提交
      if (title === "添加") {
        await modelSave(params);
      } else {
        await modelUpdate({ ...params, id: editId });
      }

      // 7. 重置状态
      setTimbreInputs([{ id: 1, value: "" }]);
      setSelectedModelLabel(null);
      onRefresh();
      handleClose();
    } catch (err) {
      if (err.message) {
        // 来自我们的自定义验证错误
        message.error(err.message);
      } else if (err.errorFields) {
        // AntD表单验证错误
        const fields = err.errorFields.map((field) => {
          const label = field.name.join(".");
          return label === "timbreName" ? "音色名称" : label; // 友好提示
        });
        // message.error(`请完善以下信息: ${fields.join(", ")}`);
      } else {
        console.error("提交失败:", err);
        // message.error("提交失败，请检查表单");
      }
    }
  };

  const handleClose = () => {
    // 如果当前存在未完成的上传任务，则中断上传
    if (abortController) {
      abortController.abort();
      setAbortController(null); // 清除 controller 引用
    }

    setCurrentFileMd5("");
    form.resetFields();
    setConfigList([]);
    setSelectedIcon("/file/voicesagex-console/defaultModelIcon/默认1.png");
    setSupportOptions(initialSupportOptions);
    setActiveKey("info");
    setSelectedModelLabel("");
    setTimbreInputs([{ id: 1, value: "" }]);

    setFileList([]);
    setFileUrl("");
    //重置上传模型
    setUploadOptions(initUploadOptions);
    setCurrentUploadKey("");
    setUploading(false);
    setUploadingModel(false);
    onClose?.();
  };
  const [iconLoading, setIconLoading] = useState(false);

  return (
    <Drawer
      closable={false}
      onClose={handleClose}
      open={open}
      styles={{
        content: {
          borderRadius: "24px 0px 0px 24px",
          padding: "24px 32px",
          backgroundImage: 'url("/model/drawer_bg.png")',
          backgroundColor: "#fff",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% auto",
        },
        body: {
          padding: 0,
          flex: 1,
          overflow: "hidden",
          display: "flex", // 新增
          flexDirection: "column", // 新增
        },
        footer: {
          padding: "22px 0",
        },
      }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button style={{ marginRight: 24, width: 112 }} onClick={handleClose}>
            取消
          </Button>
          <Button style={{ width: 112 }} type='primary' onClick={submitHandle}>
            确定
          </Button>
        </div>
      }
      width={720}
    >
      <div className={styles["drawer-header"]}>
        <span className={styles["drawer-title"]}>{title}预训练模型</span>
        <img
          src='/model/close_icon.svg'
          alt=''
          onClick={handleClose}
          className={styles["close-icon"]}
        />
      </div>
      <div className={styles["drawer-content"]}>
        <div style={{ display: "flex" }}>
          <Popover
            placement='leftTop'
            overlayInnerStyle={{
              transform: "translateX(-30px)",
              borderRadius: "16px",
              backgroundColor: "rgba(250, 252, 253, 1)",
            }}
            content={
              <IconSelectorPopover
                value={selectedIcon}
                onChange={setSelectedIcon}
                onLoadingChange={setIconLoading}
              />
            }
            arrow={false}
          >
            {iconLoading ? (
              <div className={styles["loading-avatar"]}>
                <Spin spinning={iconLoading} />
              </div>
            ) : (
              <Avatar
                shape='square'
                size={96}
                src={process.env.NEXT_PUBLIC_API_BASE + selectedIcon}
                style={{ borderRadius: 14 }}
              />
            )}
          </Popover>
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
              className='model-form'
              style={{ flex: 1, marginLeft: 32 }}
              layout='vertical'
            >
              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item
                    label='模型类型'
                    name='classification'
                    rules={[{ required: true, message: "请选择模型类型" }]}
                  >
                    <Select
                      placeholder='请选择模型类型'
                      options={builtTagOptions}
                      onChange={changeModelType}
                      className={styles["custom-select"]}
                      disabled={isEdit}
                    ></Select>
                  </Form.Item>
                </Col>
                {noBuiltCategoryList && noBuiltCategoryList.length > 0 && (
                  <Col span={8}>
                    <Form.Item
                      label={
                        <div
                          style={{
                            maxWidth: 160, // 根据需要调整
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            height: 22,
                          }}
                        >
                          <EllipsisTooltip maxWidth='100%'>
                            {noBuiltCategoryList?.[0]?.name}
                          </EllipsisTooltip>
                        </div>
                      }
                      name='tagIdList'
                    >
                      <Select
                        placeholder='请选择标签'
                        mode='multiple'
                        optionFilterProp='label'
                        options={noBuiltTagOptions}
                        maxTagCount='responsive'
                        maxTagTextLength={10}
                        className={styles["custom-select"]}
                      ></Select>
                    </Form.Item>
                  </Col>
                )}
                <Col span={8}>
                  <Form.Item
                    label='加载方式'
                    name='loadingMode'
                    rules={[{ required: true, message: "请选择加载方式" }]}
                  >
                    <Select
                      placeholder='请选择加载方式'
                      disabled={isEdit}
                      options={[
                        { label: "ollama", value: "ollama" },
                        { label: "AzureOpenAI", value: "azure" },
                        { label: "DeepSeek", value: "deepseek" },
                        { label: "OpenAI", value: "openai" },
                        { label: "硅基流动", value: "siliconflow" },
                        { label: "其他", value: "other" },
                      ]}
                      className={styles["custom-select"]}
                      onChange={changeLoadingMode}
                    ></Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label='模型名称'
                name='name'
                rules={[{ required: true, message: "请输入模型名称" }]}
              >
                <Input
                  placeholder='输入不超过50个字'
                  maxLength={50}
                  style={{
                    backgroundColor: "rgba(245, 249, 252, 1)",
                    height: 36,
                    border: "none",
                  }}
                />
              </Form.Item>
              <Form.Item
                label='模型内部名称'
                name='internalName'
                rules={[
                  { required: true, message: "请输入模型内部名称" },
                  {
                    pattern: /^[A-Za-z0-9_\-:./]+$/,
                    message: "只能包含英文、数字、下划线、-、:、.、/",
                  },
                ]}
              >
                <Input
                  placeholder='输入不超过50个字'
                  maxLength={50}
                  disabled={isEdit}
                  style={{
                    backgroundColor: "rgba(245, 249, 252, 1)",
                    height: 36,
                    border: "none",
                  }}
                />
              </Form.Item>
              <Form.Item
                label='模型简介'
                name='introduction'
                rules={[{ required: true, message: "请输入模型简介" }]}
              >
                <Input.TextArea
                  placeholder='输入不超过100个字'
                  maxLength={100}
                  style={{
                    backgroundColor: "rgba(245, 249, 252, 1)",
                    border: "none",
                    resize: "none",
                  }}
                />
              </Form.Item>
            </Form>
          </ConfigProvider>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Tabs
            className={styles["pre-training-drawer-tabs"]}
            activeKey={activeKey}
            onChange={(key) => setActiveKey(key)}
            items={getTabItems()}
          ></Tabs>
        </div>
      </div>
    </Drawer>
  );
}
