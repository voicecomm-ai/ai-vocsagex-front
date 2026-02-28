import request from '@/utils/request'

//获取工作流详情
export const getWorkflowDetail = id => {
  return request({
    url: '/voicesagex-console/application-web/workflow/getById?appId=' + id,
  })
}

//更新工作流
export const updateWorkflow = data => {
  return request({
    url: '/voicesagex-console/application-web/workflow/update',
    method: 'post',
    data,
  })
}

//上传文件
export const uploadFile = data => {
  return request({
    url: '/voicesagex-console/application-web/uploadFile/upload',
    method: 'post',
    data,
    contentType: 'multipart/form-data',
  })
}

//上传远程文件
export const uploadRemoteFile = data => {
  return request({
    url: '/voicesagex-console/application-web/uploadFile/remoteFileUpload',
    method: 'post',
    data: { url: data },
  })
}

//节点运行
export const runNode = data => {
  return request({
    url: '/voicesagex-console/application-web/workflow/singleNodeRun',
    method: 'post',
    data,
  })
}
//获取最后一次运行结果
export const getLastRunResult = data => {
  return request({
    url: '/voicesagex-console/application-web/workflow/lastRun',
    method: 'post',
    data,
  })
}

//获取系统变量
export const getSystemVariables = () => {
  return request({
    url: '/voicesagex-console/application-web/workflow/getSystemVariables',
    mehtod: 'get',
  })
}

//根据知识库id 获取元数据列表

export const getMetadataList = data => {
  return request({
    url: '/voicesagex-console/knowledge-web/knowledge-base-metadata/same',
    method: 'post',
    data,
  })
}

//code生成
export const codeGenerate = data => {
  return request({
    url: '/voicesagex-console/application-web/prompt/codeGenerate',
    method: 'post',
    data,
  })
}


//工作流运行
export const runWorkflow = (data) => {
  return request({
    url: "/voicesagex-console/application-web/workflow/draftWorkflowRun",
    method: "post",
    data,
  });
};

//根据工作流id 获取工作流运行详情
export const getWorkflowRunDetail = (data) => {
  return request({
    url: "/voicesagex-console/application-web/workflow/workflowRunDetail?workflowRunId=" + data.workflowRunId,
    method: "get",
  });
};

//根据工作流运行ID获取节点执行记录列表
export const getWorkflowRunNodeList = (data) => {
  return request({
    url: "/voicesagex-console/application-web/workflow/nodeExecutions?workflowRunId=" + data.workflowRunId,
    method: "get",
  });
};

//获取mcp列表
export const getMcpList = (data) => {
  return request({
    url: "/voicesagex-console/application-web/mcp/listMcpGroupedByTags?name="+data.name,
    method: "get",
  });
};

//根据mcpId获取mcp 工具列表
export const getMcpToolList = (data) => {
  return request({
    url: "/voicesagex-console/application-web/mcp/getTools?id="+data.id,
    method: "get",

  });
};

//获取模板列表
export const getDraftTemplateList = (data) => {
  return request({
    url: "/voicesagex-console/application-web/application/templateList?name="+data.name+"&appId="+data.appId,
    method: "get",
  });
};

//检测应用状态
export const checkApplicationStatus = (appId) => {
  return request({
    url: "/voicesagex-console/application-web/application/checkOnShelf?appId="+appId,
    method: "get",
  });
};
//获取工作流参数
export const getWorkflowParams = (data) => {
  return request({
    url: "/voicesagex-console/application-web/applicationExperience/workflow/getWorkflowParamsByAppId?appId="+data.appId,
    method: "get",
  });
};

//获取上架工作流的参数
export const getPublishedWorkflowParams = (data) => {
  return request({
    url: "/voicesagex-console/application-web/applicationExperience/workflow/getExperienceWorkflowParamsByAppId?appId="+data.appId,
    method: "get",
  });
};