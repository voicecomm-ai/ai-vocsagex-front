import request from "@/utils/request";

//获取Tag/Edge列表
export function getAllTagEdgesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getAllTagEdges",
    method: "post",
    data: data,
  });
}

// 新增Tag/Edge
export function createTagEdgeApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/createTagEdge",
    method: "post",
    data: data,
  });
}

// 删除Tag/Edge
export function dropTagEdgeApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/dropTagEdge",
    method: "post",
    data: data,
  });
}

// 获取属性列表

export function getTagEdgeInfosApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getTagEdgeInfos",
    method: "post",
    data: data,
  });
}

// 新增属性

export function createTagEdgePropertiesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/createTagEdgeProperties",
    method: "post",
    data: data,
  });
}

// 更新属性

export function updatePropertyApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/updateProperty",
    method: "post",
    data: data,
  });
}

// 获取Tag/Edge过期时间
export function getTagEdgeTtlApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getTagEdgeTtl",
    method: "post",
    data: data,
  });
}

// 获取Tag/Edge下Ttl属性字段列表
export function getAllTtlFieldApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getAllTtlField",
    method: "post",
    data: data,
  });
}

// 新增Tag/Edge过期时间
export function createTagEdgeTtlApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/createTagEdgeTtl",
    method: "post",
    data: data,
  });
}

// 清空Tag/EdgeTtl时间
export function dropTagEdgeTtlApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/dropTagEdgeTtl",
    method: "post",
    data: data,
  });
}

// 清空属性
export function dropTagEdgePropertyApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/dropTagEdgeProperty",
    method: "post",
    data: data,
  });
}

// 清空所有属性
export function dropAllTagEdgePropertyApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/dropAllTagEdgeProperty",
    method: "post",
    data: data,
  });
}

// 上传文件
export function uploadFileApi(fileDir, formData) {
  return request({
    url: "/voicesagex-console/knowledge-web/commentManage/file/upload",
    method: "post",
    contentType: "multipart/form-data",
    params: { fileDir },
    data: formData,
  });
}

// 检查数据总量上限
export function checkDataUpApi(params) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/checkDataUp",
    method: "get",
    params: params,
  });
}

// 获取图空间下本体列表
export function getAllTagsApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/getAllTags",
    method: "post",
    data: data,
  });
}

// 获取实体列表详细信息
export function getEntitiesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/getEntities",
    method: "post",
    data: data,
  });
}

// 获取图空间下本体属性列表
export function getTagPropertiesApi(tagIds) {
  return request({
    url: `/voicesagex-console/knowledge-web/entityManage/getTagProperties?tagIds=${tagIds}`,
    method: "get",
  });
}

// 新增实体
export function saveEntityApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/saveEntity",
    method: "post",
    data: data,
  });
}

// 获取实体信息
export function getEntityApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/getEntity",
    method: "post",
    data: data,
  });
}

// 编辑实体信息
export function updateEntityApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/updateEntity",
    method: "post",
    data: data,
  });
}

// 删除实体记录
export function deleteEntitiesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/deleteEntities",
    method: "post",
    data: data,
  });
}

// 删除实体记录(全部勾选)
export function deleteAllEntiesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/deleteAllEnties",
    method: "post",
    data: data,
  });
}

// 导出实体关系数据
export function excelDataApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/excelManage/excelData",
    method: "post",
    data: data,
  });
}

// 勾选导出实体关系数据
export function excelDataPartApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/excelManage/excelDataPart",
    method: "post",
    data: data,
  });
}

// 实体模版下载
export function entityTemplateApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/excelManage/entityTemplate",
    method: "post",
    data: data,
  });
}

// 导入实体数据
export function importEntityApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/excelManage/importEntity",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
    transformRequest: [(data) => data],
  });
}

// 导入关系数据
export function importRelationApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/excelManage/importRelation",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
    transformRequest: [(data) => data],
  });
}

// 获取图空间下关系列表
export function getAllEdgesApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/getAllTags",
    method: "post",
    data: data,
  });
}

// 获取关系详细列表
export function getRelationsApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/getRelations",
    method: "post",
    data: data,
  });
}

// 删除关系记录
export function deleteRelationsApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/deleteRelations",
    method: "post",
    data: data,
  });
}

// 删除关系记录(全部勾选)
export function deleteAllRelationsApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/deleteAllRelations",
    method: "post",
    data: data,
  });
}

// 关系筛选tag类型
export function screenTagApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/screenTag",
    method: "post",
    data: data,
  });
}

// 新增关系下拉获取关系列表
export function getEdgesList(spaceId) {
  return request({
    url: `/voicesagex-console/knowledge-web/relationDataManage/getEdges?spaceId=${spaceId}`,
    method: "get",
  });
}

// 新增关系下拉获取主体客体列表
export function getEntityList(spaceId) {
  return request({
    url: `/voicesagex-console/knowledge-web/relationDataManage/getEntity?spaceId=${spaceId}`,
    method: "get",
  });
}

// 下拉获取关系属性
export function getEdgePropertiesList(edgeId) {
  return request({
    url: `/voicesagex-console/knowledge-web/relationDataManage/getEdgeProperties?edgeId=${edgeId}`,
    method: "get",
  });
}

// 模糊搜索实体
export function selectLikeEntity(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/entityManage/selectLikeEntity",
    method: "post",
    data: data,
  });
}

// 新增关系

export function saveRelation(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/saveRelation",
    method: "post",
    data: data,
  });
}

// 编辑关系信息
export function updateRelation(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/updateRelation",
    method: "post",
    data: data,
  });
}

// 获取关系信息
export function getRelationInfo(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/relationDataManage/getRelation",
    method: "post",
    data: data,
  });
}
