"use client";
import { message } from "antd";

/**
 * 生成指定长度的随机字符串，可用于模拟UUID部分功能
 * @param {number} [length=36] - 生成字符串的长度，默认为36
 * @returns {string} 生成的随机字符串
 */
export const getUuid = function (length = 36) {
  // 生成指定长度的随机字符串
  let s = [];
  let hexDigits = "0123456789abcdef";
  for (let i = 0; i < length; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }

  // 如果长度足够，保留UUID版本和变体的特征
  if (length >= 36) {
    s[14] = "6";
    s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
  }

  let uuid = s.join("");
  return uuid;
};

//按钮权限验证
export const checkPermission = (data) => {
  let list = [];
  //鉴权函数
  if (typeof window !== "undefined") {
    list = JSON.parse(sessionStorage.getItem("permission")) || [];
  }

  return list.includes(data);
};

/**
 * 复制文本到剪贴板
 * @param {Object|string} source - 可以是ref对象 或 字符串
 */
export const copyToClipboard = (source) => {
  let textToCopy = "";

  // 如果传入的是 ref
  if (typeof source === "object" && source?.current) {
    textToCopy = source.current.textContent || source.current.value || "";
  }

  // 如果传入的是 string
  if (typeof source === "string") {
    textToCopy = source;
  }

  if (!textToCopy) {
    message.warning("没有可复制的内容");
    return;
  }

  // 优先使用 Clipboard API
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      message.success("已复制到剪贴板");
    })
    .catch((err) => {
      console.error("Clipboard API 复制失败:", err);
      // 回退到 document.execCommand
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.style.position = "fixed"; // 防止页面滚动
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        message.success("已复制到剪贴板");
      } catch (err) {
        console.error("回退复制失败:", err);
        message.error("复制失败，请手动复制");
      }
      document.body.removeChild(textarea);
    });
};

//大写首字母函数 file => File  array[file] => Array[File]
// 将 "file" => "File"，"array[file]" => "Array[File]" 的首字母大写函数
export const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  // 处理 array[file] => Array[File]
  const arrayTypeMatch = str.match(/^array\[(.+)\]$/i);
  if (arrayTypeMatch) {
    // 递归处理内部类型
    const innerType = capitalizeFirstLetter(arrayTypeMatch[1]);
    return `Array[${innerType}]`;
  }
  // 普通类型首字母大写，其余小写
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

//模型详情pre文件渲染通用方法封装
// 解析JSON文本，给key添加颜色样式
export const highlightConfigKeys = (configText) => {
  if (!configText) return "";

  // 直接给整个文本包裹颜色样式的span，所有文字统一设为#666e82
  return `<span style="color: #666e82;">${configText}</span>`;
};

//根据前缀分组
export const groupByPrefix = (data, separator = '.') => {
  // 若 data 不存在，直接返回空对象
  if (!data) return {};
  return Object.keys(data).reduce((result, key) => {
    const [prefix, field] = key.split(separator);

    if (!result[prefix]) {
      result[prefix] = {};
    }

    result[prefix][field] = data[key];

    return result;
  }, {});
}