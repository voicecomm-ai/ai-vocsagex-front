export const createMenuSlice = (set) => ({
  menuList: [],
  menuChangeId:0,
  setMenuList: (status) => {
    try {
      set(prev => ({ ...prev, menuList: status }));
    } catch (e) {
      // 这里可以写错误日志
    }
  },

  setMenuChangeId: (uuid) => {
    try {
      set(prev => ({ ...prev, menuChangeId: uuid }));
    } catch (e) {
      // 错误处理
    }
  },
});
