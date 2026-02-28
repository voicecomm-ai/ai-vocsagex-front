import request from "@/utils/request";

//添加新应用    ==
export function addApplication(data) {
    return request({
        url: "/voicesagex-console/application-web/application/add",
        data: data,
        method: "POST",
    });
}

//获取应用列表 ==
export function getApplicationList(data) {
    return request({
        url: "/voicesagex-console/application-web/application/getPageList",
        data: data,
        method: "POST",
    });
}

//根据ID获取应用信息 ==
export function applicationGetById(id) {
    return request({
        url: `/voicesagex-console/application-web/application/getById?id=${id}`,
        method: "GET",
    });
}

//更新应用信息 ==
export function updateApplication(data) {
    return request({
        url: "/voicesagex-console/application-web/application/update",
        data: data,
        method: "POST",
    });
}

//更新应用标签 ==
export function updateApplicationAppTag(data) {
    return request({
        url: "/voicesagex-console/application-web/application/updateAppTag",
        data: data,
        method: "POST",
    });
}

//删除应用 ==
export function deleteApplication(id) {
    return request({
        url: `/voicesagex-console/application-web/application/delete?id=${id}`,
        method: "DELETE",
    });
}

//上传应用图标 ==
export function uploadApplicationIcon(data) {
    return request({
        url: '/voicesagex-console/application-web/application/uploadIcon',
        method: "POST",
        data: data,
        contentType: "multipart/form-data",
    });
}

//获取应用标签列表 ==
export function getApplicationTagList(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationTag/getList',
        data: data,
        method: "POST",
    });
}

//添加应用标签 ==
export function addApplicationTag(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationTag/add',
        data: data,
        method: "POST",
    });
}

// 检查是否可以删除应用标签 （true代表未被使用，可以删除）==
export function deleteCheckApplicationTag(id) {
    return request({
        url: `/voicesagex-console/application-web/applicationTag/deleteCheck?id=${id}`,
        method: "GET",
    });
}
//删除应用标签 ==
export function deleteApplicationTag(id) {
    return request({
        url: `/voicesagex-console/application-web/applicationTag/delete?id=${id}`,
        method: "DELETE",
    });
}

//更新应用标签信息 ==
export function updateApplicationTag(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationTag/update',
        data: data,
        method: "POST",
    });
}

//智能体发布
export function publishAgent(id) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/agent/publish?appId='+id,
        method: "POST",
    });
}
//智能体上架
export function agentUp(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/agent/onShelf',
        data:data,
        method: "POST",
    });
}

//智能体下架
export function agentDown(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/agent/offShelf?appId='+data.id,
        method: "get",
    });
}

//获取应用发布时间描述
export function getApplicationPublishTimeDesc(id) {
    return request({
        url: '/voicesagex-console/application-web/application/publishAndOnShelfTimeDescription?appId='+id,
        method: "GET",
    });
}

//工作流上架
export function workflowUp(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/workflow/onShelf',
        data:data,
        method: "POST",
    });
}
//工作流下架
export function workflowDown(data) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/workflow/offShelf?appId='+data.id,
        method: "get",
    });
}

//工作流发布
export function workflowPublish(id) {
    return request({
        url: '/voicesagex-console/application-web/applicationExperience/workflow/publish?appId='+id,
        method: "POST",
    });
}

//获取智能体api接口列表
export function getAgentApiList(data) {
    return request({
        url: '/voicesagex-console/application-web/agentInfo/apiAccess?applicationId='+data.id,
        method: "get",
    });
}
//获取工作流api接口列表
export function getWorkflowApiList(data) {
    return request({
        url: '/voicesagex-console/application-web/workflow/apiAccess?applicationId='+data.id,
        method: "get",
    });
}


//重新生成访问url
export function regenerateAccessUrl(id) {
    return request({
        url: '/voicesagex-console/application-web/application/regenerateUrl/'+id,
        method: "PATCH",
    });
}

//获取密钥列表
export function getApiKeyList(appId) {
    return request({
        url: '/voicesagex-console/application-web/api/getApiKeyList?appId='+appId,
        method: "GET",
    });
}

//创建api密钥
export function createApiKey(data) {
    return request({
        url: '/voicesagex-console/application-web/application/createApiKey',
        data: data,
        method: "POST",
    });
}
//删除api密钥
export function deleteApiKey(id) {
    return request({
        url: '/voicesagex-console/application-web/application/deleteApiKey/'+id,
        method: "DELETE",
    });
}



//发布成内置应用
export function publishAgentToIntegrated(id) {
  return request({
    url: "/voicesagex-console/application-web/application/integrated/"+id,
    method: "PATCH",
  })
}