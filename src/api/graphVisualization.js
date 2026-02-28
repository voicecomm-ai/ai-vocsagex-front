import request from "@/utils/request";

// 统计状态
export function statisticalStateApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/statisticalState",
    method: "post",
    data: data,
  });
}

// 获取图谱可视化界面数据
export function getGraphVisualApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/getGraphVisual",
    method: "post",
    data: data,
  });
}

// 统计节点数量
export function getNodeNumberApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/getNodeNumber",
    method: "post",
    data: data,
  });
}

// 模糊搜索节点名称
export function selectVertexInfoApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/selectVertexInfo",
    method: "post",
    data: data,
  });
}

// 全图查询
export function queryFullGraphApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/queryFullGraph",
    method: "post",
    data: data,
  });
}

// 设置中心节点
export function setCenterNodeApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/setCenterNode",
    method: "post",
    data: data,
  });
}

// 获取中心节点
export function getCenterNodeApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/getCenterNode",
    method: "post",
    data: data,
  });
}

// 获取节点属性信息
export function singleVertexInfoApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/singleVertexInfo",
    method: "post",
    data: data,
  });
}

// 获取边属性信息
export function singleEdgeInfoApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/singleEdgeInfo",
    method: "post",
    data: data,
  });
}

// 获取图空间下所有边信息
export function getEdgeListApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/getEdgeList",
    method: "post",
    data: data,
  });
}

// 节点扩展
export function expansionNodeApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/expansionNode",
    method: "post",
    data: data,
  });
}

// 路径查询
export function queryPathApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/queryPath",
    method: "post",
    data: data,
  });
}

// 节点是否可扩展
export function extendOrNotApi(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/VisualManage/extendOrNot",
    method: "post",
    data: data,
  });
}

// 模型可视化
export function getGraphPatternApi(params) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getGraphPattern",
    method: "get",
    params: params,
  });
}

// 更新模型可视化
export function updateGraphPatternApi(params) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/updateGraphPattern",
    method: "get",
    params: params,
  });
}

// 模型可视化获取本体
export function getGraphPatternTagApi(params) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getGraphPatternTag",
    method: "get",
    params: params,
  });
}

// 模型可视化获取关系
export function getGraphPatternEdgeApi(params) {
  return request({
    url: "/voicesagex-console/knowledge-web/tagEdgeManage/getGraphPatternEdge",
    method: "get",
    params: params,
  });
}
