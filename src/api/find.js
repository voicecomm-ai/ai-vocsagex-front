
import request from '@/utils/request'

//获取体验标签
export function getExperienceTag(data) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/listExperienceTags?all='+data.all,
    method: 'get',
  })
}

//添加标签
export function addExperienceTag(data) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/addExperienceTag',
    method: 'post',
    data: data,
  })
}

//更新标签
export function updateExperienceTag(data) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/updateExperienceTag',
    method: 'post',
    data: data,
  })
}

//删除标签
export function deleteExperienceTag(id) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/deleteExperienceTag?tagId='+id,
    method: 'get',
  })
}

//获取发现页应用列表
export function getFindApplicationList(data) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/list',
    method: 'post',
    data: data,
  })
}

//获取发现页智能体详情
export function getFindAgentDetail(id) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/agent/getExperienceInfo?appId='+id,
    method: 'get',
  })
}
//获取发现页工作流详情
export function getFindWorkflowDetail(id) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/workflow/getExperienceById?appId='+id,
    method: 'get',
  })
}

//发现应用复用
export function findApplicationReuse(data) {
  return request({
    url: '/voicesagex-console/application-web/applicationExperience/reuse',
    method: 'post',
    data: data,
  })
}

//发布工作流运行
export function publishWorkflowRun(data) {
  return request({
    url: '/voicesagex-console/application-web/workflow/experienceRun',
    method: 'post',
    data: data,
  })
}
//获取多智能体变量列表
export function getFindAgentVariableList(id) {
  return request({
    url: '/voicesagex-console/application-web/agentVariable/getSubAgentVariableListByAppId?applicationId='+id,
    method: 'get',
  })
}
