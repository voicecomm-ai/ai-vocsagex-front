import request from "@/utils/request";
//根据UrlKEY 获取应用信息

export function getApplicationInfoByUrlKey(urlKey) {
  return request({
    url: '/voicesagex-console/application-web/api/getByUrlKey?urlKey=' + urlKey,
    method: 'get',
  });
}

//根据url key 获取应用参数
export function getApplicationParamsByUrlKey(data) {
  return request({
    url: '/voicesagex-console/application-web/api/getAgentUrlParameters',
    method: 'post',
    data: data
  });
}

//根据url key 获取对话列表
export function getConversationListByUrlKey(data) {
  return request({
    url: '/voicesagex-console/application-web/api/urlChatList',
    method: 'post',
    data: data
  });
}

//根据url key 获取对话详情
export function getConversationInfoByUrlKey(data) {
  return request({
    url: '/voicesagex-console/application-web/api/urlChatInfo',
    method: 'post',
    data: data
  });
}
//智能体对话标题修改
export function updateConversationTitleByUrlKey(data) {
  return request({
    url: '/voicesagex-console/application-web/api/agentUrlChatTitleUpdate',
    method: 'post',
    data: data
  });
}

//智能体对话token 生成
export function generateConversationTokenByUrlKey(urlKey) {
  return request({
    url: '/voicesagex-console/application-web/api/agentUrlChatTokenGenerate?urlKey=' + urlKey,
    method: 'get',
  });
}

//智能体url 对话删除
export function deleteConversationByUrlKey(data){
  return request({
    url:"/voicesagex-console/application-web/api/deleteChat",
    method:"delete",
    data:data
  })
}


//获取智能体长记忆列表
export function getAgentLongMemoryUrlList(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemoryUrl/getList",
    method: "post",
    data:data
  })
}
//获取智能体长记忆详情
export function getAgentLongMemoryDetail(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemoryUrl/getInfo",
    method: "post",
    data:data
  })
}
//更新智能体长记忆
export function updateAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemoryUrl/update",
    method: "post",
    data:data
  })
}
//删除智能体长记忆
export function deleteAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemoryUrl/delete",
    method: "delete",
    data:data
  })
}
//清空长期记忆
export function clearAgentLongMemory(data) {
  return request({
    url: "/voicesagex-console/application-web/agentLongTermMemoryUrl/clear",
    method: "delete",
    data:data
  })
}

//获取多智能体对话变量
export function getMultipleAgentUrlParameters(data) {
  return request({
    url: "/voicesagex-console/application-web/api/getMultipleAgentUrlParameters",
    method: "post",
    data:data
  })
}