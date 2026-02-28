import request from "@/utils/request";

//获取mcp 管理列表
export function getMcpList(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/getPageList",
    method: "post",
    data:data
});
}
//获取mcp 标签列表
export function getMcpTagList(data) {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/getList",
    method: "post",
    data:data
});
}
//获取mcp 详情
export function getMcpDetail(id) {
  return request({
    url: "/voicesagex-console/application-web/mcp/getInfo",
    method: "get",
    params:{
      id:id
    }
});
}
//添加mcp
export function addMcp(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/save",
    method: "post",
    data:data
});
}
//更新mcp 信息
export function updateMcp(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/update",
    method: "post",
    data:data
});
}
//删除mcp 
export function deleteMcp(id) {
  return request({
    url: "/voicesagex-console/application-web/mcp/delete",
    method: "Delete",
    params:{
      id:id
    }
});
}
//批量删除mcp
export function batchDeleteMcp(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/delete-batch",
    method: "DELETE",
    data:data
  });
}
//批量上架mcp
export function batchUpMcp(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/shelf-batch",
    method: "POST",
    data:data
  });
}
//添加标签
export function addMcpTag(data) {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/add",
    method: "POST",
    data:data
  });
}
//编辑标签
export function editMcpTag(data) {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/update",
    method: "POST",
    data:data
  });
}
//删除标签
export function deleteMcpTag(id) {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/delete?id="+id,
    method: "DELETE",
  });
} 

//获取标签详情
export function getMcpTagDetail(id) {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/getById",
    method: "GET",
    params:{
      id:id
    }
  });
}
//批量绑定标签
export function batchBindMcpTag(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/updateTagBatch",
    method: "POST",
    data:data
  });
}
//获取mcp 不分页列表
export function getMcpListNoPage(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/getList",
    method: "POST",
    data:data
  });
}
//删除mcp 应用绑定关系
export function deleteMcpBind(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/removeMcpAppRelation",
    method: "post",
   data
  });
}

//获取已经上架的mcp 标签列表
export function getMcpTagListUp() {
  return request({
    url: "/voicesagex-console/application-web/mcpTag/getListByShelfMcp",
    method: "get",
  });
}

//判断当前mcp 是否可用
export function isMcpAvailable(id) {
  return request({
    url: "/voicesagex-console/application-web/mcp/isAvailable?id="+id,
    method: "get",
  });
}