

export const createLanguageSlice = (set) => ({
  lgn: 'zhCN', //默认中文
setLgn: (data) => {
  set({ lgn: data });
},  
});
