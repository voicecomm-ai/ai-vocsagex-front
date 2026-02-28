import request from "@/utils/request";

// 任务抽取列表
export function extractionJobListApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/extractionJobList",
    method: "post",
    data: data,
  });
}

// 新增抽取任务
export function insertExtractionJobApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/insertExtractionJob",
    method: "post",
    data: data,
  });
}

// 编辑抽取任务
export function updateExtractionJobApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/updateExtractionJob",
    method: "post",
    data: data,
  });
}

// 删除抽取任务
export function deleteExtractionJobApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/deleteExtractionJob",
    method: "post",
    data: data,
  });
}

// 抽取文档上传
export function uploadApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/upload",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
  });
}

// 多文件上传
export function uploadMultiApi(data, onProgress) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/uploadMulti",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
    onUploadProgress: function (progressEvent) {
      if (onProgress && typeof onProgress === "function") {
        onProgress({
          progress: progressEvent.loaded / progressEvent.total,
          loaded: progressEvent.loaded,
          total: progressEvent.total,
        });
      }
    },
  });
}

// 文档抽取
export function extractDocumentApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/extractDocument",
    method: "post",
    data: data,
  });
}

// 文档列表
export function documentListApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/documentList",
    method: "post",
    data: data,
  });
}

// 文档删除
export function deleteDocumentApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/deleteDocument",
    method: "post",
    data: data,
  });
}

// 获取文档类型有效片段数
export function documentChunkCountApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/documentChunkCount",
    method: "post",
    data: data,
  });
}

// 校验统计值
export function verificationTotalApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/verificationTotal",
    method: "post",
    data: data,
  });
}

// 知识校验列表
export function verificationListApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/knowledgeVerificationList",
    method: "post",
    data: data,
  });
}

export function dropStatusApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/dropStatus",
    method: "post",
    data: data,
  });
}

// 文档校验
export function docJustApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/verificationKnowledge",
    method: "post",
    data: data,
  });
}

// 知识删除
export function batchDeleteJustApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/deleteVerification",
    method: "post",
    data: data,
  });
}

// 知识入图
export function knowledgeEntryMapApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/knowledgeEntryMap",
    method: "post",
    data: data,
  });
}

// 获取原文信息
export function GetOriginalInformation(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/originalInformation",
    method: "post",
    data: data,
  });
}

// 知识校验主客体类型选择
export function getTagInfoApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/getTagInfo",
    method: "post",
    data: data,
  });
}

export function getEdgeTypePropertyApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/getEdgeTypeProperty",
    method: "post",
    data: data,
  });
}

// 获取文档抽取配置
export function getExtractConfigApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/getExtractConfig",
    method: "post",
    data: data,
  });
}

// 测试预览
export function extractPreviewApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/extractPreview",
    method: "post",
    data: data,
  });
}

// 抽取配置
export function extractConfigApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/extractConfig",
    method: "post",
    data: data,
  });
}

// 编辑知识
export function updateVerificationApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/updateVerification",
    method: "post",
    data: data,
  });
}

// 新增知识
export function insertVerificationApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/extractionManage/insertVerification",
    method: "post",
    data: data,
  });
}
