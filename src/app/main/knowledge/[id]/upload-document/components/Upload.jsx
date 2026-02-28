"use client";
import React, { useState, forwardRef,useEffect,useImperativeHandle } from "react";
import styles from "../create.module.css";
import { Upload, Button,message,Typography } from "antd";
import {uploadDocument} from  '@/api/knowledge'
const CreateUpload = forwardRef((props, ref) => {
  const { Dragger } = Upload;
  const [fileList, setFileList] = useState([]);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  //返回上一页
  const { Paragraph, Text } = Typography;
  useImperativeHandle(ref, () => ({
    showFileListByNext
  }));
  //上传文件配置
  const config = {
    accept: ".txt,.markdown,.mdx,.pdf,.html,.xlsx,.xls,.vtt,.properties,.doc,.docx,.csv,.eml,.msg,.pptx,.xml,.epub,.ppt,.md,.htm",
    multiple: true,
    onChange(info) {},

    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
    beforeUpload(info) {
      beforeUploadEvent(info)
    return false;
  },
    fileList,
  };

//回显上一步的文件列表
const showFileListByNext=(data,uploadList)=>{
let oldFileList =[];
data.forEach((item) => {
// 根据 item 的 name 从 uploadList 中获取对应的 id
let uploadId = uploadList.find(exit => exit.name == item.name)?.id || null;
  oldFileList.push({
    ...item,
    status: "done",
    id:uploadId
  })
  setFileList(oldFileList);
  setUploadFileList(uploadList);
});
}

const beforeUploadEvent = (info) => {
 console.log(fileList.length);
 if(fileList.length>=5){
  message.warning('最多上传5个文件');
  return Upload.LIST_IGNORE;
 }
  //在fileList 中查找 info.name 是否存在
  let isExitInfo = fileList.filter((item) => {
    return item.name === info.name;
  });
  if(isExitInfo.length>0){
    message.warning('文件名称重复');
    return Upload.LIST_IGNORE;
  }
  const file = info;
// 定义允许的文件类型数组，方便后续维护和修改
// 生成对应图标列表
let imgUrls = {
  txt: "/knowledge/txt.png",
  markdown: "/knowledge/other.png",
  mdx: "/knowledge/other.png",
  pdf: "/knowledge/pdf.png",
  html: "/knowledge/other.png",
  xlsx: "/knowledge/xlsx.png",
  docx: "/knowledge/docx.png",
  csv: "/knowledge/csv.png",
  md: "/knowledge/other.png",
  htm: "/knowledge/other.png"
};
const ALLOWED_TYPES = ['.txt', '.markdown', '.mdx', '.pdf', '.html', '.xlsx', '.docx', '.csv', '.md', '.htm'];
const isAllowedType = ALLOWED_TYPES.some(type => file.name.endsWith(type));
  const isLt15M = file.size / 1024 / 1024  <= 15;
  if (!isAllowedType) {
    message.warning('不支持的文件类型');
    return Upload.LIST_IGNORE;
  }
  if (!isLt15M) {
    message.warning('单文件大小不能超过15MB!');  
  return Upload.LIST_IGNORE;
  }
 let newFileList = [...fileList];
let fileObj={
  name: file.name,
  // 将文件大小转换为 MB 并保留两位小数
  size: (file.size / 1024 / 1024).toFixed(2), 
  // 只取文件名的最后后缀作为类型
  type: file.name.slice(file.name.lastIndexOf('.')), 
  file: file,
// 从 imgUrls 中获取对应的图标路径，如果没有则使用默认图标路径
url: imgUrls[file.name.slice(file.name.lastIndexOf('.') + 1)] || "/knowledge/other.png"
};
newFileList.push(fileObj);
setFileList(newFileList);
  return false;
};
  useEffect(() => {
    console.log(fileList);
  }, [fileList]);
  //下一步
  const nextStepEvent = () => {
    setUploading(true);
    const formData = new FormData();
    let exitArr =[];//已经存在的文件
    let newArr =[];//需要上传的文件列表
     fileList.forEach(async (file, index) => {   
      if (file.status != "done") {
        formData.append('files', file.file);
        newArr.push(file)
       }
      else{//查找已经存在的文件的id
       let findObj= uploadFileList.find(item => item.name == file.name)
        if(findObj){
          exitArr.push(findObj);
        }
      }
    
     })
    //当不存在新上传文件时
    if(newArr.length==0){
      handleUploadEvent(exitArr,[]);
      return false;
    } 
    uploadDocument(formData).then(res=>{
      handleUploadEvent(exitArr,res.data)
   
    }).catch(err=>{
      setUploading(false);
    })

  };
  //处理上传成功事件
  const handleUploadEvent=(exitArr,returnArr)=>{
    setUploading(false);
    let resArr = returnArr;
    let nextData = [...exitArr, ...resArr];
   props?.uploadNextEvent(nextData,fileList);
  }

  //删除文件
  const deleteFileEvent = (index) => {
    if(uploading){
      return false;
    }
    let newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
  }
  return (
    <div className={`${styles["create_upload_container"]} upload_create`}>
      <Dragger {...config} className={styles["create_upload_main"]}>
        <div className={styles["create_upload_content"]}>
          <img
            className={styles["create_upload_content_img"]}
            src="/knowledge/upload.png"
          />
          <div className={styles["create_upload_content_text"]}>
            <div >
              点击<span style={{ fontWeight: 500, fontSize: 14, color: '#3772FE',paddingLeft:3, paddingRight:3 }}>上传</span>or<span style={{fontSize: 14, color: '#364052', paddingLeft:3, paddingRight:3 }}>拖拽</span>文件到此处
            </div>
          </div>
        </div>
      </Dragger>
      <div className={styles["create_upload_container_tip"]}>
        <div className={styles["create_upload_container_tip_item"]}>
          1. 文件格式:
          TXT、MARKDOWN、MDX、PDF、HTML、XLSX、DOCX、CSV、MD、HTM
        </div>
        <div className={styles["create_upload_container_tip_item"]}>
          2. 文件大小: 单个文件不超过 15MB。
        </div>
      </div>
      <div className={styles["create_upload_container_fileList"]}>
{fileList.map((file, index) => (
  <div key={index} className={styles["fileList_item"]}>
    <div className={styles["fileList_item_left"]}>
      <div className={styles["fileList_item_left_img"]}>
         <img src={file.url} />
      </div>
      <div className={styles["fileList_item_left_title"]}>
        <div className={styles["fileList_item_left_name"]}>
                <Text
                    style={{ maxWidth: 995 }}
                    ellipsis={{ tooltip: file.name }}
                  >
                    {file.name}
                  </Text>
        </div>
        <div className={styles["fileList_item_left_desc"]}>
          {file.type.toUpperCase().slice(1)}·{file.size}MB
        </div>
      </div>
    </div>
    <div className={styles["fileList_item_right"]}>
      <img 
        src="/knowledge/delete.png" 
        onClick={() => deleteFileEvent(index)} 
      />
    </div>
  </div>
))}
      </div>
      {/*    */}
      <div className={styles["create_upload_container_footer"]}>
        <Button
      disabled={fileList.length===0}
          type="primary"
          loading={uploading}
          className={styles["create_upload_container_footer_btn"]}
          onClick={nextStepEvent}
        >
          下一步
        </Button>
      </div>
    </div>
  );
})
export default CreateUpload;
