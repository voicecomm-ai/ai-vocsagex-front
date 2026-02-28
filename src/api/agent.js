
import request from "@/utils/request";
//获取智能体详情
export function getAgentDetail(id) {
  return request({
    url: "/voicesagex-console/application-web/agentInfo/getInfo?applicationId="+id,
    method: "get",
});
}

//创建智能体变量
export function createAgentVariable(data) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/add",
    method: "post",
    data:data,
});
}

//获取智能体变量列表
export function getAgentVariableList(id) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/getVariableListByAppId?applicationId="+id,
    method: "get",
  })
}

//删除智能体变量
export function deleteAgentVariable(id) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/delete?id="+id,
    method: "delete",
  })
}

//编辑智能体变量
export function editAgentVariable(data) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/update",
    method: "post",
    data:data,
  })
}
//获取智能体变量详情
export function getAgentVariableDetail(id) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/getInfo?id="+id,
    method: "get",
  })
}

//更新智能体信息
export function updateAgentInfo(data) {
  return request({
    url: "/voicesagex-console/application-web/agentInfo/update",
    method: "post",
    data:data,
  })
}
//添加智能体信息
export function addAgentInfo(data) {
  return request({
    url: "/voicesagex-console/application-web/agentInfo/add",
    method: "post",
    data:data,
  })
}

//批量创建智能体变量
export function batchCreateAgentVariable(data) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/batchAdd",
    method: "post",
    data:data,
  })
}
//获取智能体模型列表
export function getAgentModelList(data) {
  return request({
    url: "/voicesagex-console/application-web/model/list",
    method: "post",
    data:data
  })
}

//获取uuId
export function getUuidByAgent(data) {
  return request({
    url: "/voicesagex-console/application-web/prompt/generateSseConnectId",
    method: "post",
    data:data
  })
}
//添加知识到智能体
export function addKnowledgeToAgent(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/add-knowledge-base-to-application",
    method: "post",
    data:data
  })
}
//删除智能体知识库
export function deleteKnowledgeFromAgent(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/remove-knowledge-base-from-application",
    method: "post",
    data:data
  })
}
//获取智能体知识库列表
export function getAgentKnowledgeList(data) {
  return request({
    url: "/voicesagex-console/knowledge-web/knowledge-base/application/"+data.applicationId+"/knowledge-bases",
    method: "post",
  })
}
//批量添加mcp到应用
export function batchAddMcpToAgent(data) {
  return request({
    url: "/voicesagex-console/application-web/mcp/addMcpListToApplication",
    method: "post",
    data:data
  })
}


//获取智能体长记忆列表
export function getAgentLongMemoryList(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemory/getList?applicationId="+data.applicationId+'&type='+data.type,
    method: "get",
  })
}
//获取智能体长记忆详情
export function getAgentLongMemoryDetail(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemory/getInfo/"+data.id,
    method: "get",
  })
}
//更新智能体长记忆
export function updateAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemory/update",
    method: "post",
    data:data
  })
}
//删除智能体长记忆
export function deleteAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemory/delete/"+data.id,
    method: "delete",
  })
}
//清空长期记忆
export function clearAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemory/clear?applicationId="+data.applicationId+'&type='+data.type,
    method: "delete",
  })
}

//获取已经发布的子智能体列表
export function getSubPublishedAgentList(data) {
  return request({
    url: "/voicesagex-console/application-web/application/getSubPublishedAgentList",
    method: "post",
    data:data
  })
}

//删除子智能体
export function deleteSubAgent(data) {
  return request({
    url: "/voicesagex-console/application-web/agentInfo/deleteSubAgent",
    method: "DELETE",
    data:data
  })
}

//添加子智能体
export function addSubAgent(data) {
  return request({
    url: "/voicesagex-console/application-web/agentInfo/subAgentSelectedUpdate",
    method: "PATCH",
    data:data
  })
}

//根据应用Id获取多个子智能体的变量列表
export function getSubAgentVariableList(data) {
  return request({
    url: "/voicesagex-console/application-web/agentVariable/getSubAgentVariableListByAppId?applicationId="+data.applicationId,
    method: "get",
  })
}