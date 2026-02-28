import { message } from "antd";

/**
 * 文件验证函数
 * @param {Object} file - 文件对象，包含 name 和 size 属性
 * @param {string} accept - 允许的文件类型字符串，如 ".txt,.pdf"
 * @param {Array} fileList - 当前文件列表
 * @param {number} maxLength - 最大文件数量
 * @param {string} itemType - 文件类型，"file" 或 "file-list"
 * @returns {Object} 验证结果对象
 */
export const validateFile = (file, accept, fileList, maxLength, itemType) => {
  // 检查文件数量限制
  if (itemType === "file-list") {
    if (fileList.length >= maxLength) {
      message.warning("最多上传" + maxLength + "个文件");
      return { isValid: false, error: "max_count" };
    }
  }

  // 检查文件类型
  let acceptArr = accept.split(",");
  const isAllowedType = acceptArr.some((type) => file.name.endsWith(type));
  if (!isAllowedType) {
    message.warning("不支持的文件类型");
    return { isValid: false, error: "file_type" };
  }

  // 检查文件大小
  const fileExtension = file.name
    .slice(file.name.lastIndexOf(".") + 1)
    .toLowerCase();

  let maxSizeMB;
  let maxText = "文件";

  if (
    [
      "txt",
      "md",
      "mdx",
      "markdown",
      "pdf",
      "html",
      "xlsx",
      "xls",
      "doc",
      "docx",
      "csv",
      "eml",
      "msg",
      "pptx",
      "ppt",
      "xml",
      "epub",
    ].includes(fileExtension)
  ) {
    maxText = "文档";
    maxSizeMB = 15;
  } else if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension)
  ) {
    maxText = "图片";
    maxSizeMB = 10;
  } else if (["mp3", "m4a", "wav", "amr", "mpga"].includes(fileExtension)) {
    maxText = "音频";
    maxSizeMB = 50;
  } else if (["mp4", "mov", "mpeg", "webm"].includes(fileExtension)) {
    maxSizeMB = 100;
    maxText = "视频";
  } else {
    maxSizeMB = 100;
  }

  const isLtMaxSize = file.size / 1024 / 1024 <= maxSizeMB;
  if (!isLtMaxSize) {
    message.warning("上传" + maxText + "大小不能超过" + maxSizeMB + "MB!");
    return { isValid: false, error: "file_size" };
  }

  return { isValid: true, maxSizeMB, maxText };
};

/**
 * @param {string} value
 */
export const isUrl = (value) => /^https?:\/\//.test(value);

export const getFileName = (value) => {
  // const reg = /\/\d+-(.*?)?$/;
  // if (reg.test(value)) {
  //   return RegExp.$1;
  // }
  // return value;
  if (!value) return value;

  const lastSlashIndex = value.lastIndexOf("/");
  if (lastSlashIndex !== -1 && lastSlashIndex < value.length - 1) {
    return value.substring(lastSlashIndex + 1);
  }
  return value;
};

export const getURLFileName = (value) => {
  if (isUrl(value)) {
    return getFileName(value);
  }
  return value;
};

// 定义固定文件类型的扩展名
export const images = [".png", ".jpg", ".jpeg"];
export const audios = [".mp3", ".mp3", ".ogg"];
export const videos = [".mp4", ".ogv", ".webm"];

// 定义各种文件类型的扩展名
export const FILE_TYPES = {
  // 图片文件
  image: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".ico",
    ".tiff",
    ".tif",
  ],

  // 音频文件
  audio: [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac",
    ".wma",
    ".mid",
    ".midi",
    ".opus",
    ".aiff",
    ".aif",
  ],

  // 视频文件
  video: [
    ".mp4",
    ".webm",
    ".mov",
    ".avi",
    ".mkv",
    ".wmv",
    ".flv",
    ".m4v",
    ".3gp",
    ".3g2",
    ".mpg",
    ".mpeg",
    ".ts",
    ".mts",
    ".m2ts",
    ".vob",
    ".rm",
    ".rmvb",
    ".asf",
    ".swf",
  ],

  // 文档文件
  document: [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".rtf",
    ".odt",
    ".ods",
    ".odp",
    ".csv",
    ".md",
    ".epub",
    ".mobi",
    ".azw",
    ".azw3",
    ".chm",
    ".tex",
    ".bib",
  ],

  // 代码/开发文件
  code: [
    ".html",
    ".htm",
    ".css",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".json",
    ".xml",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".cs",
    ".php",
    ".rb",
    ".go",
    ".swift",
    ".kt",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
    ".pl",
    ".lua",
    ".r",
    ".mat",
  ],

  // 压缩文件
  archive: [
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".tgz",
    ".tbz2",
    ".z",
    ".lz",
    ".lzma",
  ],

  // 可执行文件/安装包
  executable: [
    ".exe",
    ".msi",
    ".dmg",
    ".deb",
    ".rpm",
    ".apk",
    ".ipa",
    ".app",
    ".jar",
    ".war",
    ".ear",
  ],

  // 数据库文件
  database: [
    ".db",
    ".sqlite",
    ".sqlitedb",
    ".mdb",
    ".accdb",
    ".dbf",
    ".frm",
    ".myd",
    ".myi",
  ],

  // 系统文件
  system: [
    ".dll",
    ".so",
    ".dylib",
    ".sys",
    ".drv",
    ".vxd",
    ".ocx",
    ".tlb",
    ".lib",
    ".a",
  ],

  // 配置文件
  config: [
    ".ini",
    ".cfg",
    ".conf",
    ".config",
    ".json",
    ".xml",
    ".yml",
    ".yaml",
    ".toml",
    ".properties",
    ".env",
  ],

  // 日志文件
  log: [".log", ".out", ".err"],

  // 字体文件
  font: [".ttf", ".otf", ".woff", ".woff2", ".eot", ".fon", ".fnt"],

  // 其他常见文件
  other: [".iso", ".bin", ".dat", ".bak", ".tmp", ".cache"],
};

export const getFileType = (url) => {
  const ext = url.split(".").pop()?.toLowerCase();
  if (!ext) return "other";

  const dotExt = ext.startsWith(".") ? ext : `.${ext}`;

  if (FILE_TYPES.image.includes(dotExt)) {
    return "image";
  }

  if (FILE_TYPES.document.includes(dotExt)) {
    return "document";
  }

  if (FILE_TYPES.video.includes(dotExt)) {
    return "video";
  }

  if (FILE_TYPES.audio.includes(dotExt)) {
    return "audio";
  }

  return "other";
};

export function sliceId(value, start = 22) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (start >= value.length) {
    return "";
  }

  return value.slice(start);
}
