"use client";
import axios from "axios";
import { message } from "antd";
import Cookies from "js-cookie";
import { getUuid } from "@/utils/utils";

const getUrlKey = (config) => `${config.headers["uuId"]}${config.url}`; //获取请求唯一key
const cancelToken = {}; // 被取消的请求池
const CancelToken = axios.CancelToken;
// 创建一个axios实例
const service = axios.create({
  baseURL: "/", // 根据环境设置baseURL，生产环境使用NEXT_PUBLIC_API_BASE，其他环境使用"/"
  timeout: 30000000, // 请求超时时间
  withCredentials: false,
});

const cancelThis = (type, config) => {
  if (!config.url.includes("/authorization-web")) {
    const key = getUrlKey(config);
    config.cancelToken = new CancelToken((c) => {
      cancelToken[key] = c;
    });
    if (type === "remove") {
      //请求完成后删除缓存
      delete cancelToken[key];
    }
  }
};
const handleCancelRequest = () => {
  //请求取消事件
  for (let key in cancelToken) {
    cancelToken[key]();
    delete cancelToken[key];
  }
};
//处理登出事件
const handleLogoutRequest = () => {
  console.log("handleLogoutRequest");
  if (typeof window !== "undefined") {
    //处理登出事件
    Cookies.remove("userToken"); //删除普通的cooki
    window.location.href = "/login";
  }
};

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    config.headers["uuId"] = getUuid();
    let contentType = config["contentType"]; //请求类型
    const token = Cookies.get("userToken");
    if (token) {
      //根据contentType判断接口头部认证信息
      config.headers["Authorization"] = "Bearer " + token;
    } else {
      if (config.url.includes("/authorization-web")) {
      //登录 登出刷新token 鉴权
      config["auth"] = {
        username: "voicesagex-console",
        password: "123456",
      };
    }
    }
    config.headers["Content-Type"] = contentType
      ? contentType
      : "application/json";
    cancelThis("normal", config);
    return config;
  },
  (error) => {
    // debug
    // console.log(error)
    return Promise.reject(error);
  }
);

// 响应拦截器 2003
service.interceptors.response.use(
  (response) => {
    // 特殊处理 blob 响应
    if (response.config.responseType === "blob") {
      cancelThis("remove", response.config);
      return response; // 返回完整响应对象
    }
    // 原有 JSON 处理逻辑
    const res = response.data;
    let status = res.code || res.status;
    //登录失效
    if (status == 2011 || status == 2013) {
      handleCancelRequest();
      message.warning("登录失效，请重新登录" || "Error");
      //处理登出事件
      handleLogoutRequest();

      return Promise.reject(new Error(res.msg || "Error")); //异常要抛出
    } else if (status == 3001) {
      //特殊处理权益
      return Promise.reject(res);
    } else if (
      status === 4001 &&
      response.config.url?.includes("/model/pre-trained/download")
    ) {
      return Promise.reject(res);//针对下载返回4001时的特殊处理，需要去掉warning提示
    } else if (status !== 1000) {
      cancelThis("remove", response.config);
      message.warning(res.msg || "Error");
      return Promise.reject(res);
    } else {
      cancelThis("remove", response.config);
      return res;
    }
  },
  (error) => {
    if (error.response) {
      // 判断响应错误状态码
      switch (error.response.status) {
        case 401:
          handleCancelRequest();
          // 处理401错误，重定向到登录页面
          message.warning("登录失效，请重新登录" || "Error");
          //调用登出
          handleLogoutRequest();
          break;
        default: //默认兜底
          message.warning("网络错误，请稍后操作" || "Error");
          break;
      }
      return Promise.reject(error);
    } else if (error.request) {
      // 请求发送失败
      console.log(error.request);
    } else {
      // 其他错误
      console.log("Error", error.message);
    }
    const ErrStr = error.toString() || "";
    if (ErrStr.toString().indexOf("Cancel") !== -1) {
      // 请求被主动取消,忽略
      return;
    }
    if (error.message && error.message.includes("timeout")) {
      // 判断请求异常信息中是否含有超时timeout字符串
      message.warning("请求超时，请稍后操作" || "Error");
      return Promise.reject(error); // reject这个错误信息
    }
    // debug
    // console.log('err' + error)
    message.warning("网络错误，请稍后操作" || "Error");
    return Promise.reject(error);
  }
);

// 专用下载方法（兼容拦截器体系）
service.download = async (
  url,
  params,
  defaultFilename = "file",
  config = {}
) => {
  const fullConfig = {
    url,
    method: "GET",
    params,
    responseType: "blob",
    ...config,
  };

  try {
    const response = await service(fullConfig);

    // 从响应头提取文件名
    const filename = defaultFilename;

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;

    link.download = decodeURIComponent(filename); // 处理中文文件名
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    // 延迟清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 200);

    return response;
  } catch (error) {
    if (axios.isCancel(error)) return;

    // 避免与拦截器中的 message 重复
    if (!error.response || error.response.status !== 401) {
      message.error(`下载失败: ${error.message || "未知错误"}`);
    }
    throw error;
  }
};

export default service;
