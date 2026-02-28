// ... existing code ...
export const createFlowSlice = set => ({
  // ... existing state ...
  workflowData: null,
  mousePosition: {
    pageX: 0,
    pageY: 0,
  },
  panelVisible: false,
  pannerNode: null,
  // 测试运行知识检索
  panelVisibleZsjs: false,
  // 测试运行意图分类
  panelVisibleYtfl: false,
  // 测试运行LLM
  panelVisibleLlm: false,
  runVisible: false,
  updateTime: 0,
  viewportZoom: 1,
  readOnly: false, //是否只可读
  changeId: 0,
  changeNodeType: null,//改变的节点类型
  applicationData : {},
  mcpIsDrag: false,//mcp是否拖拽中
  mcpRefresh: false,//mcp是否刷新
  vectorModelData:[],//向量模型数据
  rerankModelData:[],//排序模型数据
  textModelData:[],//文本模型数据 
  templateRefresh: false,//模板是否刷新
  setTemplateRefresh: bool => set({ templateRefresh: bool }),
  setVectorModelData: data => set({ vectorModelData: data }),
  setRerankModelData: data => set({ rerankModelData: data }),
  setTextModelData: data => set({ textModelData: data }),
  setApplicationData: data => set({ applicationData: data }),
  setChangeId: id => set({ changeId: id }),
  setChangeNodeType: type => set({ changeNodeType: type }),
  setReadOnly: bool => set({ readOnly: bool }), //设置是否只读
  setViewportZoom: zoom => set({ viewportZoom: zoom }), //设置缩放比例
  setUpdateTime: time => set({ updateTime: time }),
  setPanelVisible: visible => set({ panelVisible: visible }),
  setRunVisible: visible => set({ runVisible: visible }),
  setPannerNode: node => set({ pannerNode: node }),
  setCodeInputsData: node => set({ codeInputsData: node }),
  setCodeOutputsData: node => set({ codeOutputsData: node }),
  setDocInputData: node => set({ docInputData: node }),
  setWorkflowData: data => set({ workflowData: data }),
  setMousePosition: position => set({ mousePosition: position }),
  // 测试运行知识检索 Action
  setPanelVisibleZsjs: objpar => set({ panelVisibleZsjs: objpar }),
  // 测试运行意图分类 Action
  setPanelVisibleYtfl: objpar => set({ panelVisibleYtfl: objpar }),
  // 测试运行LLM Action
  setPanelVisibleLlm: objpar => set({ panelVisibleLlm: objpar }),
  setMcpIsDrag: bool => set({ mcpIsDrag: bool }),
  setMcpRefresh: bool => set({ mcpRefresh: bool }),
})

