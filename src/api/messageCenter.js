import request from '@/utils/request'

//创建空白知识库
export function getAllMessageList() {
  const data = {
    current: 1,
    size: 1000,
  }
  return request({
    url: '/voicesagex-console/user-web/message/all',
    method: 'post',
    data,
  })
}

export function getAllUnReadMessageList() {
  const data = {
    current: 1,
    size: 1000,
  }
  return request({
    url: '/voicesagex-console/user-web/message/unread/all',
    method: 'post',
    data,
  })
}
export function clearOneMessage(messageId) {
  return request({
    url: `/voicesagex-console/user-web/message/unread/${messageId}/clear`,
    method: 'patch',
  })
}

export function clearAllMessage(data) {
  return request({
    url: '/voicesagex-console/user-web/message/unread/clear',
    method: 'patch',
  })
}

