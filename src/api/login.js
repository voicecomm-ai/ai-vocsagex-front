import request from "@/utils/request";

//获取登陆验证码
export function getCheckCode() {
  return request({
    url: "/voicesagex-console/authorization-web/auth/getImageCaptcha?type=math",
    method: "get",
  });
}
//登录接口
export function login(data) {
  return request({
    url: "/voicesagex-console/authorization-web/oauth2/token",
    method: "post",
    data,
    contentType: "application/x-www-form-urlencoded",
  });
}
export function logout(data) {
  return request({
    url: "/voicesagex-console/authorization-web/logout",
    method: "post",
    data,
    // contentType: "application/x-www-form-urlencoded",
  });
}

//获取当前用户信息
export function getCurUserInfo() {
  return request({
    url: `/voicesagex-console/user-web/user/getCurrentUser`,
    method: "get",
  });
}

//获取全部菜单列表
export function getAllMenuList() {
  return request({
    url: "/voicesagex-console/user-web/menu/getAllList",
    method: "get",
  });
}
//获取当前菜单列表
export function getMenuListWithUri() {
  return request({
    url: "/voicesagex-console/user-web/menu/getMenuList",
    method: "get",
  });
}