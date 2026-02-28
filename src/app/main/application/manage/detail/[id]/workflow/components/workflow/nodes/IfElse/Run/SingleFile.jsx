"use client";

import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";

import {
  Button,
  Drawer,
  Form,
  Cascader,
  Radio,
  Input,
  Tree,
  ConfigProvider,
  Upload,
  Typography,
  Spin,
} from "antd";
import { message } from "antd";
import styles from "../../../../test/test.module.css";
import { useStore } from "@/store/index";
import { uploadFile, uploadRemoteFile } from "@/api/workflow";
import { validateFile } from "@/utils/fileValidation";

// URL地址验证正则表达式
export const FILE_URL_REGEX = /^(https?|ftp):\/\//;

const { TextArea } = Input;

const SingleFile = forwardRef((props, ref) => {
  const { Paragraph, Text } = Typography;
  const { Dragger } = Upload;
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [fileType, setFileType] = useState(""); //文件上传类型
  const uploadTypes = {
    local_file: "从本地上传",
    remote_url: "粘贴URL链接",
  };
  const [remote_url, setRemoteUrl] = useState("");
  useImperativeHandle(ref, () => ({}));
  const [accept, setAccept] = useState("");
  const fileTypeList = [
    {
      label: "文档",
      value: "document",
      desc: [
        ".txt",
        ".md",
        ".mdx",
        ".markdown",
        ".pdf",
        ".html",
        ".xlsx",
        ".xls",
        ".doc",
        ".docx",
        ".csv",
        ".eml",
        ".msg",
        ".pptx",
        ".ppt",
        ".xml",
        ".epub",
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
  ];
  const [fileList, setFileList] = useState([]);
  const [uploadConfig, setUploadConfig] = useState({});
  //处理文件上传事件
  const beforeUploadEvent = (info) => {
    const file = info;

    // 使用独立的验证函数
    const validation = validateFile(file, accept, fileList, props.item.max_length, props.item.type);
    if (!validation.isValid) {
      return Upload.LIST_IGNORE;
    }
    let newFileList = [...fileList];
    let addFile = new FormData();
    addFile.append("file", file);
    setLoading(true);
    props.fileLoadingChange(true);
    uploadFile(addFile)
      .then((res) => {
        setLoading(false);
        props.fileLoadingChange(false);
console.log(res.data,'res.data');

        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size: res.data.size,
          fileType: file.name.slice(file.name.lastIndexOf(".")),
        };
        newFileList.push(fileData);
        setFileList(newFileList);
        handleUploadChange(newFileList);
      })
      .catch((err) => {
        props.fileLoadingChange(true);
        setLoading(false);
      });

    return false;
  };
  //根据文件后缀名从fileTypeList 获取文件value
  const getFileType = (type) => {
    // console.log(fileTypeList,'fileTypeList');
    
    const matchedItem = fileTypeList.find((item) => item.desc.includes(`.${type}`));
    // if (fileType === "custom") {
    //   //处理自定义文件展示
    //   return "custom";
    // }
    return matchedItem ? matchedItem.value : "";
  };

  //删除文件
  const deleteFileEvent = (index) => {
    let newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
    handleUploadChange(newFileList);
  };
  useEffect(() => {
    let acceptObj = "";
    let allowed_file_types = "custom"; //允许上传所有文件类型
    // console.log(allowed_file_types, "allowed_file_types");

    if (allowed_file_types.includes("custom")) {
      // acceptObj = props.item.allowed_file_extensions.join(",");
      setFileType("custom");
    } else {
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
    let allowFileTypes = acceptObj.split(",");
    allowFileTypes.forEach((item) => {
      item = item.startsWith(".") ? item : "." + item;
    });
    let acceptData = allowFileTypes.join(",");
    // console.log(props.item.allowed_file_upload_methods, "props.item.allowed_file_upload_methods");

    setUploadType("local_file");

    setAccept(acceptData);
    setUploadConfig({
      ...uploadConfig,
      accept: acceptObj,
    });
  }, []);

  //处理上传文件change 事件
  const handleUploadChange = (newFileList) => {
    props.fileChange(newFileList);
  };

  //远程文件上传点击确定事件
  const uploadRemoteUrlEvent = () => {
    let url = remote_url;
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
        // console.log(res.data.extension,'res.data.extension');
        

        let fileData = {
          type: getFileType(res.data.extension),
          transfer_method: uploadType,
          name: res.data.name,
          upload_file_id: res.data.id,
          url: res.data.url,
          size: res.data.size,
          fileType: res.data.name.slice(res.data.name.lastIndexOf(".")),
        };
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
        <div className={styles["single_input_header"]}>
          <div className={styles["single_input_header_left"]}>
            <Text style={{ maxWidth: 120 }} ellipsis={{ tooltip: props.item.label }}>
              <span style={{ color: "red" }}>*</span> {props.item.label}
            </Text>
          </div>
          <div className={styles["single_input_header_right"]}>
            <Radio.Group
              disabled={
                loading ||
                (props.item.type === "file" && fileList.length === 1) ||
                (props.item.type === "file-list" && fileList.length >= 5)
              }
              value={uploadType}
              onChange={(e) => {
                setUploadType(e.target.value);
              }}
              className={styles["custom-radio-group"]}
            >
              {["local_file", "remote_url"].map((method) => (
                <Radio key={method} value={method}>
                  {uploadTypes[method]}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>
        {uploadType === "local_file" &&
          ((props.item.type === "file" && fileList.length === 0) ||
            (props.item.type === "file-list" && fileList.length < props.item.max_length)) && (
            <div className={styles["single_input_upload"]}>
              <Dragger
                disabled={loading || (props.item.type == "file" && fileList.length == 1)}
                accept={accept} // 使用配置中的文件类型
                multiple={props.item.type == "file" ? false : true}
                onChange={(info) => {}}
                beforeUpload={(info) => {
                  console.log(info, "ces1");
                  beforeUploadEvent(info);
                  return false;
                }}
                showUploadList={false}
                fileList={fileList}
                className={styles["create_upload_main"]}
              >
                <div className={styles["create_upload_content"]}>
                  <img
                    className={styles["create_upload_content_img"]}
                    src='/knowledge/upload.png'
                  />
                  <div className={styles["create_upload_content_text"]}>点击上传文件</div>
                </div>
              </Dragger>
            </div>
          )}

        {uploadType === "remote_url" &&
          ((props.item.type === "file" && fileList.length === 0) ||
            (props.item.type == "file-list" && fileList.length < props.item.max_length)) && (
            <div className={styles["single_input_upload_remote"]}>
              <Input
                value={remote_url}
                onChange={(e) => {
                  setRemoteUrl(e.target.value);
                }}
                placeholder='请输入文件URL'
                disabled={
                  loading ||
                  (props.item.type === "file" && fileList.length === 1) ||
                  (props.item.type === "file-list" && fileList.length >= props.item.max_length)
                }
              />
              <Button
                onClick={uploadRemoteUrlEvent}
                type='primary'
                disabled={
                  loading ||
                  !remote_url ||
                  (props.item.type === "file" && fileList.length === 1) ||
                  (props.item.type === "file-list" && fileList.length >= props.item.max_length)
                }
              >
                {" "}
                确定{" "}
              </Button>
            </div>
          )}
        <div className={styles["create_upload_container_fileList"]}>
          {fileList.map((file, index) => (
            <div key={index} className={styles["fileList_item"]}>
              <div className={styles["fileList_item_left"]}>
                <div className={styles["fileList_item_left_img"]}>
                  <img src={"/workflow/" + file.type + ".png"}></img>
                </div>
                <div className={styles["fileList_item_left_title"]}>
                  <div className={styles["fileList_item_left_name"]}>
                    <Text style={{ maxWidth: 200 }} ellipsis={{ tooltip: file.name }}>
                      {file.name}
                    </Text>
                  </div>
                  <div className={styles["fileList_item_left_desc"]}>
                    {file.fileType.toUpperCase().slice(1)}·{formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <div className={styles["fileList_item_right"]}>
                <img src='/knowledge/delete.png' onClick={() => deleteFileEvent(index)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Spin>
  );
});

export default SingleFile;
