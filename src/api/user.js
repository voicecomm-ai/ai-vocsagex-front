import request from "@/utils/request";

//获取用户分页
export function getUserList(data) {
  return request({
    url: "/voicesagex-console/user-web/user/getPage",
    method: "post",
    data: data,
  });
}

//获取用户信息
export function getUserInfo(id) {
  return request({
    url: `/voicesagex-console/user-web/user/getInfo/${id}`,
    method: "get",
  });
}

//启用账号
export function enableUser(id) {
  return request({
    url: `/voicesagex-console/user-web/user/enable/${id}`,
    method: "patch",
  });
}

//禁用账号
export function disableUser(id) {
  return request({
    url: `/voicesagex-console/user-web/user/disable/${id}`,
    method: "patch",
  });
}

//修改用户
export function updateUser(data) {
  return request({
    url: "/voicesagex-console/user-web/user/updateUser",
    method: "post",
    data: data,
  });
}

//新增用户
export function createUser(data) {
  return request({
    url: "/voicesagex-console/user-web/user/add",
    method: "post",
    data: data,
  });
}

//删除用户
export function deleteUser(id) {
  return request({
    url: `/voicesagex-console/user-web/user/delete/${id}`,
    method: "delete",
  });
}

//重置密码
export function resetPassword(data) {
  return request({
    url: "/voicesagex-console/user-web/user/updatePassword",
    method: "post",
    data: data,
  });
}

//获取角色信息
export function getRoleInfo(id) {
  return request({
    url: `/voicesagex-console/user-web/role/getInfo/${id}`,
    method: "get",
  });
}

//获取角色分页
export function getRoleList(data) {
  return request({
    url: "/voicesagex-console/user-web/role/getPage",
    method: "post",
    data: data,
  });
}

//获取全部角色
export function getAllRoles() {
  return request({
    url: "/voicesagex-console/user-web/role/getAllRoles",
    method: "get",
  });
}

//新增角色
export function createRole(data) {
  return request({
    url: "/voicesagex-console/user-web/role/add",
    method: "post",
    data: data,
  });
}

//编辑角色
export function updateRole(data) {
  return request({
    url: "/voicesagex-console/user-web/role/updateRole",
    method: "post",
    data: data,
  });
}

//删除角色
export function deleteRole(id) {
  return request({
    url: `/voicesagex-console/user-web/role/delete/${id}`,
    method: "delete",
  });
}

//下载导入模板
export function downloadTemplate(id) {
  return request({
    url: `/voicesagex-console/user-web/user/downloadBatchImportUserTemplate`,
    method: "get",
  });
}

//批量导入用户
export function importUsers(data) {
  return request({
    url: "/voicesagex-console/user-web/user/batchImportUser",
    method: "post",
    data: data,
    contentType: "multipart/form-data",
  });
}

//获取用户列表
export function getUsers(data) {
  if (data == null) {
    return request({
      url: "/voicesagex-console/user-web/user/getUserListByUserId",
      method: "get",
    });
  }
  return request({
    url: "/voicesagex-console/user-web/user/getUserListByUserId?type=" + data,
    method: "get",
  });
}

//根据部门id获取角色列表
export function getRolesByDeptId(data) {
  return request({
    url: "/voicesagex-console/user-web/role/getRolesByDeptId?deptId=" + data,
    method: "get",
  });
}
//根据部门id获取角色列表(包含自己)
export function getRolesByDeptIdWithSelf(data) {
  return request({
    url: "/voicesagex-console/user-web/role/getRolesByDeptIdWithSelf?deptId=" + data,
    method: "get",
  });
}

//根据父级菜单获取子菜单列表
export function getSubMenuListByParentId(data) {
  return request({
    url: "/voicesagex-console/user-web/menu/getMenusAndNumByParentId?parentId=" + data,
    method: "get",
  });
}