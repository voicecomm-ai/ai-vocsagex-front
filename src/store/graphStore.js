// 从sessionStorage加载状态的工具函数
const loadFromSessionStorage = () => {
  try {
    const serializedState = sessionStorage.getItem("graphState");
    if (serializedState === null) {
      return undefined; // 没有存储的状态，使用初始状态
    }
    return JSON.parse(serializedState);
  } catch (err) {
    // console.error("Failed to load graph state from sessionStorage:", err);
    return undefined;
  }
};

// 保存状态到sessionStorage的工具函数
const saveToSessionStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem("graphState", serializedState);
  } catch (err) {
    // console.error("Failed to save graph state to sessionStorage:", err);
  }
};

// 初始状态 - 优先从sessionStorage加载，否则使用默认值
const initialState = loadFromSessionStorage() || {
  currentNamespace: "",
  currentNamespaceId: "",
  graphType: 1,
  currentNamespaceObj: {},
  graphNamespaceList: [{ name: "graph1", params: "" }],
  currentSpaceType: "commonSpace",
  isCommonSpace: true,
  colorTags: [], // 颜色标签列表
};

export const createGraphSlice = (set) => ({
  // 使用从sessionStorage加载的初始状态或默认值
  ...initialState,

  // 动作定义
  addGraphNamespace: (value) => {
    set((prev) => {
      const newState = {
        ...prev,
        graphNamespaceList: [...prev.graphNamespaceList, value],
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  setCurrentNamespaceObj: (value) => {
    set((prev) => {
      // 复制原数组并更新第一个元素（如果存在）
      const updatedList = prev.graphNamespaceList.length
        ? prev.graphNamespaceList.map((item, index) =>
            index === 0 ? { ...item, name: value.name } : item
          )
        : prev.graphNamespaceList;

      const newState = {
        ...prev,
        currentNamespaceObj: value,
        currentNamespace: value.name,
        currentNamespaceId: value.id,
        graphNamespaceList: updatedList,
        graphType: value.type === "GRAPH" ? 1 : 0,
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  setGraphNamespaceListInit: (arr) => {
    set((prev) => {
      const newState = {
        ...prev,
        graphNamespaceList: arr,
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  removeGraphNamespace: (value) => {
    set((prev) => {
      // 找到要删除的索引
      let lastIndex = 0;
      prev.graphNamespaceList.forEach((graph, i) => {
        if (graph.name === value) {
          lastIndex = i - 1;
        }
      });

      // 过滤掉要删除的元素
      const updatedList = prev.graphNamespaceList.filter(
        (graph) => graph.name !== value
      );

      // 处理当前命名空间更新
      let newCurrentNamespace = prev.currentNamespace;
      if (prev.currentNamespace === value && updatedList.length) {
        newCurrentNamespace =
          lastIndex >= 0 ? updatedList[lastIndex].name : updatedList[0].name;
      }

      const newState = {
        ...prev,
        graphNamespaceList: updatedList,
        currentNamespace: newCurrentNamespace,
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  cleanup: () => {
    set((prev) => {
      const newState = {
        ...prev,
        currentNamespace: "",
        currentSpaceType: "commonSpace",
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  // 在 setCurrentSpaceType 动作中同时更新 isCommonSpace
  setCurrentSpaceType: (value) => {
    set((prev) => {
      const newState = {
        ...prev,
        currentSpaceType: value,
        isCommonSpace: value === "commonSpace",
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  setColorTags: (value) => {
    set((prev) => {
      const newState = {
        ...prev,
        colorTags: value,
      };
      saveToSessionStorage(newState);
      return newState;
    });
  },

  // 删除 sessionStorage 中的状态
  deleteSessionStorage: () => {
    sessionStorage.removeItem("graphState");
  },
});
