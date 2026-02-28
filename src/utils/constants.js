// 模型类型
export const ModelTypeMap = {
  1: "文本生成",
  2: "多模态",
  4: "视频生成",
  5: "图片生成",
  6: "向量模型",
  7: "语音合成",
  8: "语音识别",
  9: "排序模型",
};

export const COLOR = [
  "#5B8FF9",
  "#61DDAA",
  "#65789B",
  "#F6BD16",
  "#7262FD",
  "#78D3F8",
  "#9661BC",
  "#F6903D",
  "#F6903D",
  "#F08BB4",
];

// 默认模型图标列表（导出可复用）
export const defaultAppIcons = [
  "/file/voicesagex-console/defaultModelIcon/默认1.png",
  "/file/voicesagex-console/defaultModelIcon/默认2.png",
  "/file/voicesagex-console/defaultModelIcon/默认3.png",
  "/file/voicesagex-console/defaultModelIcon/智谱chatglm.png",
  "/file/voicesagex-console/defaultModelIcon/LLaMA.png",
  "/file/voicesagex-console/defaultModelIcon/Gemini.png",
  "/file/voicesagex-console/defaultModelIcon/文心一言.png",
  "/file/voicesagex-console/defaultModelIcon/deepseek.png",
  "/file/voicesagex-console/defaultModelIcon/阶跃星辰.png",
  "/file/voicesagex-console/defaultModelIcon/PaddlePaddle.png",
  "/file/voicesagex-console/defaultModelIcon/腾讯混元.png",
  "/file/voicesagex-console/defaultModelIcon/火山方舟.png",
  "/file/voicesagex-console/defaultModelIcon/豆包.png",
  "/file/voicesagex-console/defaultModelIcon/通义千问.png",
  "/file/voicesagex-console/defaultModelIcon/硅基流动.png",
  "/file/voicesagex-console/defaultModelIcon/Amazon Bedrock.png",
  "/file/voicesagex-console/defaultModelIcon/openai.png",
  "/file/voicesagex-console/defaultModelIcon/jina.png",
  "/file/voicesagex-console/defaultModelIcon/abab.png",
  "/file/voicesagex-console/defaultModelIcon/网易.png",
  "/file/voicesagex-console/defaultModelIcon/百川.png",
  "/file/voicesagex-console/defaultModelIcon/vllm.png",
  "/file/voicesagex-console/defaultModelIcon/ollama.png",
  "/file/voicesagex-console/defaultModelIcon/kimi.png",
];

//处理文件名
export const extractFileName = (path) => {
  // const lastSegment = path.split("/").pop(); // 获取文件名部分
  // const parts = lastSegment.split("_");

  // // 如果有多个下划线，则取第一个下划线后的部分
  // if (parts.length > 1) {
  //   return parts.slice(1).join("_"); // 组合后返回
  // }

  // // 否则直接返回原文件名
  // return lastSegment;
  if (!path) return "";
  return path.split("/").pop();
};
