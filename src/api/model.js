import request from "@/utils/request";

//模型分类列表
export function modelCategoryList(data) {
  return request({
    url: "/voicesagex-console/application-web/modelCategory/list",
    method: "POST",
    data,
  });
}
//新增模型分类
export function modelCategorySave(data) {
  return request({
    url: "/voicesagex-console/application-web/modelCategory/save",
    method: "POST",
    data,
  });
}

//删除模型分类
export function modelCategoryDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/modelCategory/delete?id=${id}`,
    method: "DELETE",
  });
}

//更新模型分类
export function modelCategoryUpdate(data) {
  return request({
    url: "/voicesagex-console/application-web/modelCategory/update",
    method: "POST",
    data,
  });
}

//模型分类详情==根据id获取当前模型下的标签
export function modelCategoryInfo(id) {
  return request({
    url: `/voicesagex-console/application-web/modelCategory/info?id=${id}`,
    method: "GET",
  });
}

//新增模型标签
export function modelTagSave(data) {
  return request({
    url: "/voicesagex-console/application-web/modelTag/save",
    method: "POST",
    data,
  });
}

//更新模型标签
export function modelTagUpdate(data) {
  return request({
    url: "/voicesagex-console/application-web/modelTag/update",
    method: "POST",
    data,
  });
}

//删除模型标签
export function modelTagDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/modelTag/delete?id=${id}`,
    method: "DELETE",
  });
}

//模型分页列表
export function modelPage(data) {
  return request({
    url: "/voicesagex-console/application-web/model/page",
    method: "POST",
    data,
  });
}

//新增模型
export function modelSave(data) {
  return request({
    url: "/voicesagex-console/application-web/model/save",
    method: "POST",
    data,
  });
}

//上传压缩包
export function uploadZip(fileDir, formData) {
  return request({
    url: "/voicesagex-console/application-web/file/upload-zip",
    method: "POST",
    contentType: "multipart/form-data",
    params: { fileDir },
    data: formData,
  });
}

//统一上传
export function fileUpload(fileDir, formData, config = {}) {
  return request({
    url: "/voicesagex-console/application-web/file/upload",
    method: "POST",
    contentType: "multipart/form-data",
    params: { fileDir },
    data: formData,
    onUploadProgress: config.onUploadProgress,
  });
}

//批量上下架模型
export function modelShelfBatch(data) {
  return request({
    url: "/voicesagex-console/application-web/model/shelf-batch",
    method: "POST",
    data,
  });
}

//批量删除模型
export function modelDeleteBatch(data) {
  return request({
    url: "/voicesagex-console/application-web/model/delete-batch",
    method: "DELETE",
    data,
  });
}

//批量加载卸载
export function loadingBatch(data) {
  return request({
    url: "/voicesagex-console/application-web/model/loading-batch",
    method: "POST",
    data,
  });
}

//批量更新分类
export function updatBatchCategory(data) {
  return request({
    url: "/voicesagex-console/application-web/model/updatBatch/category",
    method: "POST",
    data,
  });
}

//模型详情/voicesagex-console/application-web/model/info
export function modelInfo(id) {
  return request({
    url: `/voicesagex-console/application-web/model/info?id=${id}`,
    method: "GET",
  });
}

//更新模型
export function modelUpdate(data) {
  return request({
    url: "/voicesagex-console/application-web/model/update",
    method: "POST",
    data,
  });
}

//下载子文件
export function modelDownload(params, filename) {
  return request.download(
    "/voicesagex-console/application-web/file/download-entry",
    params,
    filename
  );
}

//模型密钥详情
// export function modelKeyDetail(id) {
//   return request({
//     url: `/voicesagex-console/application-web/modelApiKey/info?id=${id}`,
//     method: "GET",
//   });
// }

//模型密钥列表
export function modelKeyList(data) {
  return request({
    url: "/voicesagex-console/application-web/modelApiKey/list",
    method: "POST",
    data,
  });
}

//新增模型密钥
export function modelKeyAdd(data) {
  return request({
    url: `/voicesagex-console/application-web/modelApiKey/save`,
    method: "POST",
    data,
  });
}

//删除模型密钥
export function modelKeyDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/modelApiKey/delete?id=${id}`,
    method: "DELETE",
  });
}

//预训练模型下载
export function preTrainedDownload(id, data) {
  return request({
    url: `/voicesagex-console/application-web/model/pre-trained/download?id=${id}`,
    method: "POST",
    data,
  });
}

//获取文件目录结构
export function getFileTree(id) {
  return request({
    url: `/voicesagex-console/application-web/model/file/build-tree?id=${id}`,
    method: "GET",
  });
}

//通过path获取文件目录
export function getPathFileTree(path) {
  return request({
    url: `/voicesagex-console/application-web/file/build-tree?filePath=${path}`,
    method: "GET",
  });
}

//我的模型
//分类列表
export function trainModelCategoryList(data) {
  return request({
    url: `/voicesagex-console/application-web/trainModelCategory/list`,
    method: "POST",
    data,
  });
}

//训练模型分页列表
export function trainModelPage(data) {
  return request({
    url: `/voicesagex-console/application-web/trainModel/page`,
    method: "POST",
    data,
  });
}

//训练模型删除
export function trainModelDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/trainModel/delete?id=${id}`,
    method: "DELETE",
  });
}

//数据集
//数据集列表
// 据集类型type 0：训练数据；1：微调数据；2：评测数据
export function modelDatasetPage(data) {
  return request({
    url: `/voicesagex-console/application-web/modelDataset/page`,
    method: "POST",
    data,
  });
}
//新增数据集
export function modelDatasetSave(data) {
  return request({
    url: `/voicesagex-console/application-web/modelDataset/save`,
    method: "POST",
    data,
  });
}

//数据集上传文件，获取目录
export function extractEntityFiles(fileDir, formData) {
  return request({
    url: `/voicesagex-console/application-web/file/upload/extract-entity-files`,
    method: "POST",
    contentType: "multipart/form-data",
    params: { fileDir },
    data: formData,
  });
}

// 1. 检查已上传分片（断点续传）
export function checkUploadedChunks(fileMd5) {
  return request({
    url: `/voicesagex-console/application-web/file/check`,
    method: "GET",
    params: { fileMd5 },
  });
}

// 2. 上传单个分片
export function uploadChunk(params, data, signal) {
  return request({
    url: `/voicesagex-console/application-web/file/uploadChunk`,
    method: "POST",
    contentType: "multipart/form-data",
    params,
    data,
    signal,
  });
}

// 3. 合并所有分片
export function mergeChunks(params, { signal } = {}) {
  return request({
    url: `/voicesagex-console/application-web/file/merge`,
    method: "GET",
    params,
    timeout: 300000,
    signal, // 传入 signal 支持中止
  });
}

//删除数据集
export function modelDatasetDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/modelDataset/delete?id=${id}`,
    method: "DELETE",
  });
}

//更新数据集
export function modelDatasetUpdate(data) {
  return request({
    url: `/voicesagex-console/application-web/modelDataset/update`,
    method: "POST",
    data,
  });
}

//数据集文件列表
export function modelDatasetFilePage(data) {
  return request({
    url: `/voicesagex-console/application-web/modelDatasetFile/page`,
    method: "POST",
    data,
  });
}

//获取算法模型配置文件
export function algorithmConfig(params) {
  return request({
    url: `/voicesagex-console/application-web/model/algorithm/config`,
    method: "GET",
    params,
  });
}

//算法模型训练
export function algorithmTrain(data) {
  return request({
    url: `/voicesagex-console/application-web/model/algorithm/train`,
    method: "POST",
    data,
  });
}

//预训练模型重新生成
export function preTrainModelRegenerate(id) {
  return request({
    url: `/voicesagex-console/application-web/model/preTrainModel/regenerate?id=${id}`,
    method: "GET",
  });
}

//训练模型详情
export function trainModelInfo(id) {
  return request({
    url: `/voicesagex-console/application-web/trainModel/info?id=${id}`,
    method: "GET",
  });
}

//训练模型部署
export function trainModelDeploy(data) {
  return request({
    url: `/voicesagex-console/application-web/trainModel/deploy`,
    method: "POST",
    data,
  });
}

//微调模型分页列表
export function finetuneModelPage(data) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/page`,
    method: "POST",
    data,
  });
}

//微调模型分类列表
export function finetuneModelCategoryList(data) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModelCategory/list`,
    method: "POST",
    data,
  });
}
//模型微调
export function finetuneModelFinetune(data) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/finetune`,
    method: "POST",
    data,
  });
}
//删除微调模型
export function finetuneModelDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/delete?id=${id}`,
    method: "DELETE",
  });
}
//微调模型详情
export function finetuneModelInfo(id) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/info?id=${id}`,
    method: "GET",
  });
}

//微调模型部署/voicesagex-console/application-web/finetuneModel/deploy
export function finetuneModelDeploy(data) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/deploy`,
    method: "POST",
    data,
  });
}

//评测模型分页列表
export function evalModelPage(data) {
  return request({
    url: `/voicesagex-console/application-web/evalModel/page`,
    method: "POST",
    data,
  });
}

//新增评测模型
export function evalModelEval(data) {
  return request({
    url: `/voicesagex-console/application-web/evalModel/eval`,
    method: "POST",
    data,
  });
}

//训练模型列表
export function trainModelList(data) {
  return request({
    url: `/voicesagex-console/application-web/trainModel/list`,
    method: "POST",
    data,
  });
}

//删除评测模型
export function evalModelDelete(id) {
  return request({
    url: `/voicesagex-console/application-web/evalModel/delete?id=${id}`,
    method: "DELETE",
  });
}
//微调模型监控ollama方式train   fine_tuning   eval
export function monitoring(params) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/monitoring`,
    method: "GET",
    params,
  });
}

//评测模型详情
export function evalModelInfo(id) {
  return request({
    url: `/voicesagex-console/application-web/evalModel/info?id=${id}`,
    method: "GET",
  });
}

// 预训练评测选择预训练模型列表
export function finetuneModelList(data) {
  return request({
    url: `/voicesagex-console/application-web/finetuneModel/list`,
    method: "POST",
    data,
  });
}