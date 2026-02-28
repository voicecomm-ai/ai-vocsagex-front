import { saveAs } from "file-saver";
import axios from "axios";
import Cookies from "js-cookie";

const axiosRequest = axios.create({
  baseURL: "/",
  timeout: 3 * 60 * 60 * 1000,
});

// 批量导入
export function importFile(url, params, config = {}) {
  const formData = new FormData();
  const token = Cookies.get("userToken");

  // 如果 params 是 FormData，直接使用
  if (params instanceof FormData) {
    for (let [key, value] of params.entries()) {
      formData.append(key, value);
    }
  } else {
    // 如果是普通对象，转换为 FormData
    Object.keys(params).forEach((key) => {
      formData.append(key, params[key]);
    });
  }

  return axiosRequest
    .post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: "Bearer " + token,
        ...config.headers,
      },
      ...config,
    })
    .then((res) => {
      if (res.data.code === 200 || res.status === 200) {
        return Promise.resolve(res.data);
      } else {
        return Promise.reject(res.data);
      }
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// 通用下载方法
export function downloadFileRequest(url, params = {}, filename, config = {}) {
  const token = Cookies.get("userToken");

  return axiosRequest
    .post(url, params, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...config.headers,
      },
      responseType: "blob",
      ...config,
    })
    .then(async (response) => {
      // 检查响应是否为 blob
      const contentType = response.headers["content-type"];
      const isBlob =
        contentType &&
        (contentType.includes("application/octet-stream") ||
          contentType.includes("application/vnd") ||
          contentType.includes("application/vnd.openxmlformats") ||
          contentType.includes("application/ms-excel") ||
          contentType.includes("application/pdf") ||
          contentType.includes("text/") ||
          response.data instanceof Blob);

      if (isBlob) {
        // 获取文件名
        let finalFilename = filename;
        if (!finalFilename) {
          const contentDisposition = response.headers["content-disposition"];
          if (contentDisposition) {
            const filenameMatch =
              contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              finalFilename = decodeURIComponent(filenameMatch[1]);
            }
          }
        }

        // 如果仍然没有文件名，使用默认名称
        if (!finalFilename) {
          const extensionMap = {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              ".xlsx",
            "application/vnd.ms-excel": ".xls",
            "text/csv": ".csv",
            "application/pdf": ".pdf",
            "application/msword": ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              ".docx",
          };
          const ext = extensionMap[contentType] || ".file";
          finalFilename = `download_${new Date().getTime()}${ext}`;
        }

        const blob = new Blob([response.data]);
        saveAs(blob, finalFilename);
        return Promise.resolve({ success: true, filename: finalFilename });
      } else {
        // 处理错误响应
        const resText = await response.data.text();
        let rspObj;
        try {
          rspObj = JSON.parse(resText);
        } catch (e) {
          rspObj = { code: 500, msg: "未知错误" };
        }

        let errMsg = rspObj.msg || "系统未知错误，请联系管理员";
        switch (rspObj.code) {
          case 401:
            errMsg = "认证失败，无法访问系统资源";
            break;
          case 403:
            errMsg = "当前操作没有权限";
            break;
          case 404:
            errMsg = "访问资源不存在";
            break;
          case 500:
            errMsg = rspObj.msg || "服务器内部错误";
            break;
          default:
            errMsg = rspObj.msg || "系统未知错误，请联系管理员";
            break;
        }
        return Promise.reject({ code: rspObj.code, msg: errMsg });
      }
    })
    .catch((error) => {
      console.error("下载文件出现错误:", error);
      return Promise.reject(error);
    });
}

// 通用 GET 下载方法
export function downloadFileGet(url, params = {}, filename, config = {}) {
  // 构造查询参数
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return axiosRequest
    .get(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...config.headers,
      },
      responseType: "blob",
      ...config,
    })
    .then(async (response) => {
      const contentType = response.headers["content-type"];
      const isBlob =
        contentType &&
        (contentType.includes("application/octet-stream") ||
          contentType.includes("application/vnd") ||
          contentType.includes("text/") ||
          response.data instanceof Blob);

      if (isBlob) {
        let finalFilename = filename;
        if (!finalFilename) {
          const contentDisposition = response.headers["content-disposition"];
          if (contentDisposition) {
            const filenameMatch =
              contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              finalFilename = decodeURIComponent(filenameMatch[1]);
            }
          }
        }

        if (!finalFilename) {
          const extensionMap = {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              ".xlsx",
            "application/vnd.ms-excel": ".xls",
            "text/csv": ".csv",
            "application/pdf": ".pdf",
          };
          const ext = extensionMap[contentType] || ".file";
          finalFilename = `download_${new Date().getTime()}${ext}`;
        }

        const blob = new Blob([response.data]);
        saveAs(blob, finalFilename);
        return Promise.resolve({ success: true, filename: finalFilename });
      } else {
        const resText = await response.data.text();
        let rspObj;
        try {
          rspObj = JSON.parse(resText);
        } catch (e) {
          rspObj = { code: 500, msg: "未知错误" };
        }

        let errMsg = rspObj.msg || "系统未知错误，请联系管理员";
        switch (rspObj.code) {
          case 401:
            errMsg = "认证失败，无法访问系统资源";
            break;
          case 403:
            errMsg = "当前操作没有权限";
            break;
          case 404:
            errMsg = "访问资源不存在";
            break;
          case 500:
            errMsg = rspObj.msg || "服务器内部错误";
            break;
          default:
            errMsg = rspObj.msg || "系统未知错误，请联系管理员";
            break;
        }
        return Promise.reject({ code: rspObj.code, msg: errMsg });
      }
    })
    .catch((error) => {
      console.error("下载文件出现错误:", error);
      return Promise.reject(error);
    });
}

// 检查 blob 是否有效
export function blobValidate(blob) {
  return blob && blob.size > 0;
}

export default {
  importFile,
  downloadFileRequest,
  downloadFileGet,
  blobValidate,
};
