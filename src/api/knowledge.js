import request from "@/utils/request";

//创建空白知识库
export function createKnowledgeBase(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/create-empty-base",
    method: "post",
    data: data,
  });
}

//编辑知识库
export function editKnowledgeBase(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/edit-name-and-desc",
    method: "post",
    data: data,
  });
}
//删除知识库
export function deleteKnowledgeBase(id) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/delete/" + id,
    method: "delete",
  });
}
//获取知识库列表
export function getKnowledgeBaseList(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/list",
    method: "post",
    data: data,
  });
}

//获取知识库标签列表
export function getKnowledgeBaseTagList(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/list",
    method: "post",
    data: data,
  });
}

//上传文档接口
export function uploadDocument(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/upload-documents",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
  });
}
//新增知识库标签
export function addKnowledgeBaseTag(name) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/create/" + name,
    method: "post",
  });
}
//删除知识库标签
export function deleteKnowledgeBaseTag(id) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/delete/" + id,
    method: "delete",
  });
}
//编辑知识库标签
export function editKnowledgeBaseTag(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/edit",
    method: "post",
    data: data,
  });
}

//绑定标签到知识库
export function bindKnowledgeBaseTag(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/bind",
    method: "post",
    data: data,
  });
}

// 检查是否可以删除应用标签 （true代表未被使用，可以删除）==
export function deleteCheckTag(id) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-tag/deletable/" + id,
    method: "GET",
  });
}

//普通分段预览
export function previewCommon(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/preview-common-chunks",
    method: "post",
    data: data,
  });
}
//普通分段预览
export function previewParent(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/preview-parent-child-chunks",
    method: "post",
    data: data,
  });
}

//创建知识库
export function createKnowledge(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/create",
    method: "post",
    data: data,
  });
}

//获取知识库详情
export function getKnowledgeDetail(id) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/detail/" + id,
    method: "post",
  });
}
//更新知识库配置
export function updateKnowledge(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/update-setting",
    method: "post",
    data: data,
  });
}

//保存并处理知识库
export function saveAndProcessKnowledge(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/save-and-process",
    method: "post",
    data: data,
  });
}
//保存并处理知识库
export function saveAndProcessExistKnowledge(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/save-and-process-exist",
    method: "post",
    data: data,
  });
}
//获取文档列表
export function getDocumentList(id, data) {
  return request({
    url:
      "/voicesagex-console/knowledge-web/knowledge-base/" + id + "/documents",
    method: "post",
    data: data,
  });
}
//根据文档id 获取文档详情
export function getDocumentDetail(id) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/document/" + id,
    method: "post",
  });
}

// 获取知识库文档数量
export function getKnowledgeBaseDocumentCount(id) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base/${id}/documents/count`,
    method: "get",
  });
}
//批量删除文档
export function batchDeleteDocument(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/delete/documents",
    method: "post",
    data: data,
  });
}
//批量改变文档状态
export function batchChangeDocumentStatus(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/update-document-status",
    method: "post",
    data: data,
  });
}

//新增元数据
export function addDocumentProperty(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-metadata",
    method: "post",
    data: data,
  });
}

//编辑元数据
export function editDocumentProperty(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-metadata/edit",
    method: "post",
    data: data,
  });
}

//删除元数据
export function deleteDocumentProperty(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-metadata/delete`,
    method: "post",
    data,
  });
}

// 获取知识库元数据列表
export function getKnowledgePropertyList(id) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-metadata/${id}`,
    method: "get",
  });
}

// 根据文档id获取元数据
export function getDocumentPropertyById(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-metadata/by-document-ids",
    method: "post",
    data,
  });
}

// 编辑元数据值
export function editDocumentPropertyValue(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base-metadata/edit-value",
    method: "post",
    data: data,
  });
}

//启用内置元数据
export function enableBuiltIn(id) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-metadata/${id}/built-in/enable`,
    method: "PUT",
  });
}

//禁用内置元数据
export function disableBuiltIn(id) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-metadata/${id}/built-in/disable`,
    method: "PUT",
  });
}

//删除普通分段
// {
//     "documentId": 0,
//     "chunkId": 0
// }
export function deleteNormalChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/normal/chunk`,
    method: "delete",
    data,
  });
}

//删除父分段
// {
//     "documentId": 0,
//     "parentIdx": 0
// }
export function deleteParentChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/parent-chunk`,
    method: "delete",
    data,
  });
}

//删除子分段
// {
//     "documentId": 0,
//     "parentIdx": 0,
//     "childChunkIdx": 0
// }
export function deleteChildChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/child-chunk`,
    method: "delete",
    data,
  });
}

//修改普通分段
// {
//     "documentId": 0,
//     "chunkId": 0,
//     "chunkContent": "string"
// }
export function updateNormalChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/normal/chunk`,
    method: "put",
    data,
  });
}

//修改普通分段qa
// {
//     "documentId": 0,
//     "chunkId": 0,
//     "chunkQuestion": "string",
//     "chunkAnswer": "string"
// }
export function updateNormalQAChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/normal/qa-chunk`,
    method: "put",
    data,
  });
}

//修改父分段
// {
//     "documentId": 0,
//     "parentIdx": 0,
//     "chunkContent": "string"
// }
export function updateParentChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/parent-chunk`,
    method: "put",
    data,
  });
}

//修改子分段
// {
//     "documentId": 0,
//     "parentIdx": 0,
//     "childChunkIdx": 0,
//     "chunkContent": "string"
// }
export function updateChildChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/child-chunk`,
    method: "put",
    data,
  });
}

//添加普通分段
// {
//     "documentId": 0,
//     "chunkContent": "string"
// }
export function addNormalChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/normal/chunk`,
    method: "post",
    data,
  });
}

//添加普通分段qa
// {
//     "documentId": 0,
//     "chunkQuestion": "string",
//     "chunkAnswer": "string"
// }
export function addNormalQAChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/normal/qa-chunk`,
    method: "post",
    data,
  });
}

//添加父分段
// {
//     "documentId": 0,
//     "chunkContent": "string"
// }
export function addParentChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/parent-chunk`,
    method: "post",
    data,
  });
}

//添加子分段
// {
//     "documentId": 0,
//     "parentIdx": 0,
//     "chunkContent": "string"
// }
export function addChildChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/advanced/child-chunk`,
    method: "post",
    data,
  });
}

//批量删除分段
export function batchDeleteChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/${data.id}/chunks/delete`,
    method: "put",
    data: data.ids,
  });
}

// //批量启用分段
export function batchEnableChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/${data.id}/chunks/enable`,
    method: "put",
    data: data.ids,
  });
}

// //批量用分段
export function batchDisableChunk(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/${data.id}/chunks/disable`,
    method: "put",
    data: data.ids,
  });
}

//保存并处理
export function saveAndHandleSearch(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base-document/save-and-process`,
    method: "post",
    data,
  });
}

//检索测试
export function retrievalTest(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base/retrieval-test`,
    method: "post",
    data,
  });
}

//根据文档Id获取检索记录
export function testRecordsApi(id) {
  return request({
    url: `/voicesagex-console/knowledge-web/knowledge-base/${id}/retrieval-test-records`,
    method: "get",
  });
}

// 知识融合
export function affirmFusionApi(data) {
  return request({
    url: `/voicesagex-console/knowledge-web/fusion/affirmFusion`,
    method: "post",
    data,
  });
}
