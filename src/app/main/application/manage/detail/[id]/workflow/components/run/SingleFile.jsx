"use client";

import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useMemo,
} from "react";

import {
  Button,
  Radio,
  Input,
  Upload,
  Typography,
  Spin,
} from "antd";
import { message } from "antd";
import styles from "./test.module.css";
import { uploadFile, uploadRemoteFile } from "@/api/workflow";
import { validateFile } from "@/utils/fileValidation";

/**
 * URL地址验证正则表达式
 * 用于验证远程文件URL的格式是否正确
 */
export const FILE_URL_REGEX = /^(https?|ftp):\/\//;

/**
 * 文件上传组件
 * 支持本地文件上传和远程URL文件上传
 * @param {Object} props - 组件属性
 * @param {Object} props.item - 配置项，包含文件类型限制、最大数量等
 * @param {Function} props.fileChange - 文件列表变化回调
 * @param {Function} props.fileLoadingChange - 文件加载状态变化回调
 * @param {Object} ref - 组件引用
 */
const FileUpload = forwardRef((props, ref) => {
  const { Text } = Typography;
  const { Dragger } = Upload;
  
  // 组件状态管理
  const [loading, setLoading] = useState(false); // 上传加载状态
  const [uploadType, setUploadType] = useState(""); // 当前上传方式
  const [fileType, setFileType] = useState(""); // 文件类型（default/custom）
  const [allowed_file_upload_methods, setAllowedFileUploadMethods] = useState([]); // 允许的上传方式
  const [remote_url, setRemoteUrl] = useState(""); // 远程文件URL
  const [accept, setAccept] = useState(""); // 文件类型限制
  const [fileList, setFileList] = useState([]); // 已上传文件列表
  const [uploadConfig, setUploadConfig] = useState({}); // 上传配置

  // 上传方式映射
  const uploadTypes = {
    local_file: "从本地上传",
    remote_url: "粘贴URL链接",
  };

  // 文件类型配置列表 - 使用 useMemo 优化性能
  const fileTypeList = useMemo(() => [
    {
      label: "文档",
      value: "document",
      desc: [
        ".txt", ".md", ".mdx", ".markdown", ".pdf", ".html",
        ".xlsx", ".xls", ".doc", ".docx", ".csv", ".eml",
        ".msg", ".pptx", ".ppt", ".xml", ".epub",
      ],
    },
    {
      label: "图片",
      value: "image",
      desc: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    },
    {
      label: "音频",
      value: "audio",
      desc: [".mp3", ".m4a", ".wav", ".amr", ".mpga"],
    },
    {
      label: "视频",
      value: "video",
      desc: [".mp4", ".mov", ".mpeg", ".webm"],
    },
  ], []);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({}));

  /**
   * 处理文件上传前的事件
   * 验证文件并执行上传操作
   * @param {File} info - 要上传的文件对象
   * @returns {boolean} 是否阻止默认上传行为
   */
  const beforeUploadEvent = (info) => {
    const file = info;

    // 使用独立的验证函数验证文件
    const validation = validateFile(
      file,
      accept,
      fileList,
      props.item.max_length,
      props.item.type
    );
    
    if (!validation.isValid) {
      return Upload.LIST_IGNORE;
    }

    // 创建新的文件列表副本
    let newFileList = [...fileList];
    let addFile = new FormData();
    addFile.append("file", file);
    
    // 设置加载状态
    setLoading(true);
    props.fileLoadingChange(true);
    
    // 执行文件上传
    uploadFile(addFile)
      .then((res) => {
        setLoading(false);
        props.fileLoadingChange(false);

        // 构建文件数据对象
        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size: res.data.size,
          fileType: file.name.slice(file.name.lastIndexOf(".")),
        };
        
        // 更新文件列表
        newFileList.push(fileData);
        setFileList(newFileList);
        handleUploadChange(newFileList);
      })
      .catch((err) => {
        props.fileLoadingChange(false);
        setLoading(false);
      });

    return false; // 阻止默认上传行为
  };

  /**
   * 根据文件后缀名获取文件类型
   * @param {string} type - 文件扩展名
   * @returns {string} 文件类型值
   */
  const getFileType = (type) => {
    const matchedItem = fileTypeList.find((item) =>
      item.desc.includes(`.${type}`)
    );
    
    // 处理自定义文件类型
    if (fileType === "custom") {
      return "custom";
    }
    
    return matchedItem ? matchedItem.value : "";
  };

  /**
   * 删除文件事件处理
   * @param {number} index - 要删除的文件索引
   */
  const deleteFileEvent = (index) => {
    let newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
    handleUploadChange(newFileList);
  };
  /**
   * 组件初始化效果
   * 根据配置项设置文件类型限制和上传方式
   */
  useEffect(() => {
    let acceptObj = "";
    let allowed_file_types = props.item.allowed_file_types; // 允许上传的文件类型
    let allowed_file_upload_methods = props.item.allowed_file_upload_methods; // 允许的上传方式
  
    // 处理自定义文件类型
    if (allowed_file_types.includes("custom")) {
      acceptObj = props.item.allowed_file_extensions.join(",");
      setFileType("custom");
    } else {
      // 处理默认文件类型
      setFileType("default");
      const acceptParts = [];
      allowed_file_types.forEach((item) => {
        fileTypeList.forEach((type) => {
          if (type.value === item) {
            acceptParts.push(type.desc.join(","));
          }
        });
      });
      acceptObj = acceptParts.join(",");
    }
  
    // 设置允许的上传方式和默认上传方式
    setAllowedFileUploadMethods(allowed_file_upload_methods);
    setUploadType(allowed_file_upload_methods[0]);
    setAccept(acceptObj);
    setUploadConfig(prevConfig => ({
      ...prevConfig,
      accept: acceptObj,
    }));
  }, [props.item.allowed_file_types, props.item.allowed_file_extensions, props.item.allowed_file_upload_methods, fileTypeList]);

  /**
   * 处理文件列表变化事件
   * @param {Array} newFileList - 新的文件列表
   */
  const handleUploadChange = (newFileList) => {
    props.fileChange(newFileList);
  };

  /**
   * 远程文件上传事件处理
   * 验证URL格式并上传远程文件
   */
  const uploadRemoteUrlEvent = () => {
    let url = remote_url;
    
    // 验证URL是否为空
    if (!url) {
      message.warning("请输入远程文件地址");
      return;
    }

    // 验证URL地址格式
    if (!FILE_URL_REGEX.test(url)) {
      message.warning("文件地址无效");
      return;
    }
    
    setLoading(true);
    let newFileList = [...fileList];
    
    // 执行远程文件上传
    uploadRemoteFile(url)
      .then((res) => {
        setLoading(false);

        // 创建文件对象用于验证
        const file = {
          name: res.data.name,
          size: res.data.size,
        };

        // 使用独立的验证函数验证远程文件
        const validation = validateFile(
          file,
          accept,
          fileList,
          props.item.max_length,
          props.item.type
        );
        
        if (!validation.isValid) {
          setLoading(false);
          return;
        }

        // 构建文件数据对象
        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size: res.data.size,
          fileType: res.data.name.slice(res.data.name.lastIndexOf(".")),
        };
        
        // 更新文件列表和状态
        newFileList.push(fileData);
        setRemoteUrl("");
        setFileList(newFileList);
        handleUploadChange(newFileList);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  /**
   * 格式化文件大小显示
   * @param {number} bytes - 文件字节数
   * @returns {string} 格式化后的文件大小
   */
  const formatFileSize = (bytes) => {
    // 定义单位换算常量
    const KB = 1024;
    const MB = KB * 1024;

    // 处理特殊情况：字节数为0
    if (bytes === 0) {
      return "0 KB";
    }

    // 判断应该使用KB还是MB单位
    if (bytes < MB) {
      // 小于1MB，转换为KB
      return (bytes / KB).toFixed(2) + " KB";
    } else {
      // 大于等于1MB，转换为MB
      return (bytes / MB).toFixed(2) + " MB";
    }
  };
  return (
    <Spin spinning={loading}>
      <div className={styles["single_input"]}>
        {/* 文件上传头部区域 */}
        <div className={styles["single_input_header"]}>
          {/* 左侧：标签显示 */}
          <div className={styles["single_input_header_left"]}>
            <Text
              style={{ maxWidth: 120 }}
              ellipsis={{ tooltip: props.item.label }}
            >
              {props.item.required && <span style={{ color: "red" }}>*</span>}{" "}
              {props.item.label}
            </Text>
          </div>
          {/* 右侧：上传方式选择 */}
          <div className={styles["single_input_header_right"]}>
            <Radio.Group
              disabled={
                loading ||
                (props.item.type === "file" && fileList.length === 1) ||
                (props.item.type === "file-list" &&
                  fileList.length >= props.item.max_length)
              }
              value={uploadType}
              onChange={(e) => {
                setUploadType(e.target.value);
              }}
              className={styles["custom-radio-group"]}
            >
              {allowed_file_upload_methods.map((method) => (
                <Radio key={method} value={method}>
                  {uploadTypes[method]}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>
        {/* 本地文件上传区域 */}
        {uploadType === "local_file" &&
          ((props.item.type === "file" && fileList.length === 0) ||
            (props.item.type === "file-list" &&
              fileList.length < props.item.max_length)) && (
            <div className={styles["single_input_upload"]}>
              <Dragger
                disabled={
                  loading || (props.item.type === "file" && fileList.length === 1)
                }
                accept={accept} // 使用配置中的文件类型
                multiple={props.item.type === "file" ? false : true}
                onChange={(info) => {}}
                beforeUpload={(info) => {
                  beforeUploadEvent(info);
                  return false;
                }}
                style={{ backgroundColor: "#F5F9FC" }}
                showUploadList={false}
                fileList={fileList}
                className={styles["create_upload_main"]}
              >
                <div className={styles["create_upload_content"]}>
                  <img
                    className={styles["create_upload_content_img"]}
                    src="/knowledge/upload.png"
                    alt="上传图标"
                  />
                  <div className={styles["create_upload_content_text"]}>
                    点击上传文件
                  </div>
                </div>
              </Dragger>
            </div>
          )}

        {/* 远程URL文件上传区域 */}
        {uploadType === "remote_url" &&
          ((props.item.type === "file" && fileList.length === 0) ||
            (props.item.type === "file-list" &&
              fileList.length < props.item.max_length)) && (
            <div className={styles["single_input_upload_remote"]}>
              <Input
                value={remote_url}
                onChange={(e) => {
                  setRemoteUrl(e.target.value);
                }}
                className={styles['run_input_input']}
                variant='filled'
                placeholder="请输入文件URL"
                disabled={
                  loading ||
                  (props.item.type === "file" && fileList.length === 1) ||
                  (props.item.type === "file-list" &&
                    fileList.length >= props.item.max_length)
                }
              />
              <Button
                onClick={uploadRemoteUrlEvent}
                type="primary"
                disabled={
                  loading ||
                  !remote_url ||
                  (props.item.type === "file" && fileList.length === 1) ||
                  (props.item.type === "file-list" &&
                    fileList.length >= props.item.max_length)
                }
              >
                确定
              </Button>
            </div>
          )}
        {/* 已上传文件列表显示区域 */}
        {fileList.length > 0 && (
        <div className={styles["create_upload_container_fileList"]}>
          {fileList.map((file, index) => (
            <div key={index} className={styles["fileList_item"]}>
              {/* 文件信息左侧区域 */}
              <div className={styles["fileList_item_left"]}>
                <div className={styles["fileList_item_left_img"]}>
                  <img 
                    src={"/workflow/" + file.type + ".png"}
                    alt={`${file.type}文件图标`}
                  />
                </div>
                <div className={styles["fileList_item_left_title"]}>
                  <div className={styles["fileList_item_left_name"]}>
                    <Text
                      style={{ maxWidth: 200 }}
                      ellipsis={{ tooltip: file.name }}
                    >
                     <span className={styles["fileList_item_left_name_text"]}>{file.name}</span>
                    </Text>
                  </div>
                  <div className={styles["fileList_item_left_desc"]}>
                    {file.fileType.toUpperCase().slice(1)}·
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              {/* 文件操作右侧区域 */}
              <div className={styles["fileList_item_right"]}>
                <img
                  src="/knowledge/delete.png"
                  alt="删除文件"
                  onClick={() => deleteFileEvent(index)}
                />
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </Spin>
  );
});

export default FileUpload;
