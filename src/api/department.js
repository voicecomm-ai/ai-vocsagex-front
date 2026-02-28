import request from "@/utils/request";

//获取用户分页
export function getDepartmentTree(data) {
  return request({
    url: "/voicesagex-console/user-web/department/getDepartmentTree",
    data: data,
    method: "POST",
  });
}

//根据部门ID获取所有父部门ID
export function getParentDeptIdsById(data) {
  return request({
    url:
      "/voicesagex-console/user-web/department/getParentDeptIdsById?deptId=" +
      data,
    method: "get",
  });
}

export function addDept(data) {
  return request({
    url: "/voicesagex-console/user-web/department/add",
    method: "post",
    data: data,
  });
}

export function deleteDept(id) {
  return request({
    url: "/voicesagex-console/user-web/department/delete?id=" + id,
    method: "delete",
  });
}

export function updateDept(data) {
  return request({
    url: "/voicesagex-console/user-web/department/update",
    method: "post",
    data: data,
  });
}
