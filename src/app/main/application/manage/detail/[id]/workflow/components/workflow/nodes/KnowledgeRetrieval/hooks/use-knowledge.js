
import { message } from "antd";


export const useKnowledge = () => {
    

  //验证知识节点必填项
  const validateKnowledgeNode = (data) => {
    console.log(data,'data');
    if(!data.dataSet_list || data.dataSet_list.length === 0){
      message.warning('请添加知识库');
      return false;
    }
    if(!data.query_variable_selector || data.query_variable_selector.length === 0){ 
      message.warning('请添加用户输入');
      return false;
    }
    if(data.multiple_retrieval_config){
      let configData = data.multiple_retrieval_config;
      if(configData.reranking_mode=='reranking_model'&&!configData.reranking_model.id){
        message.warning('请选择Rerank模型');
        return false;
      }
      if(configData.reranking_mode=='weighted_score'&&!configData.weights.model.id){
        message.warning('请选择Embedding模型');
        return false;
      }
    }
    if(!data.metadata_filtering_mode=='automatic'&&!data.metadata_model.id){
      message.warning('请选择文档属性过滤模型');
      return false;
    }
    return true;
  }

  
  const sortByOriginalOrder = (originalArray, modifiedArray) => {
    // 创建原始数组元素id到索引的映射，统一id为字符串类型以避免类型问题
    const idOrderMap = new Map();
    originalArray.forEach((item, index) => {
        const unifiedId = String(item.id);
        idOrderMap.set(unifiedId, index);
    });
    
    // 为修改后的数组元素添加原始索引，用于稳定排序新增元素
    const arrayWithIndices = modifiedArray.map((item, index) => ({
        ...item,
        _originalIndex: index
    }));
    
    // 排序逻辑
    arrayWithIndices.sort((a, b) => {
        const aId = String(a.id);
        const bId = String(b.id);
        
        // 两个元素都在原始数组中，按原始顺序排序
        if (idOrderMap.has(aId) && idOrderMap.has(bId)) {
            return idOrderMap.get(aId) - idOrderMap.get(bId);
        }
        
        // 只有a在原始数组中，a排在前面
        if (idOrderMap.has(aId)) {
            return -1;
        }
        
        // 只有b在原始数组中，b排在前面
        if (idOrderMap.has(bId)) {
            return 1;
        }
        
        // 两个元素都不在原始数组中，按它们在modifiedArray中的原始顺序排序
        return a._originalIndex - b._originalIndex;
    });
    
    // 移除临时添加的索引属性
    return arrayWithIndices.map(({ _originalIndex, ...item }) => item);
}

  return {
    validateKnowledgeNode,
    sortByOriginalOrder,
  }
}