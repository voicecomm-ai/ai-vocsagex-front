import { getCurUserInfo } from "@/api/login";

export const createUserSlice = (set) => ({
  user: null,
  showSecondSide:true,
  // 添加调试日志，方便查看设置用户信息时的参数
  setUser: (info) => {
    try {
      set((prev) => ({ ...prev, user: info }));
    } catch (error) {}
  },
  clearUser: () => set({ user: null }),

  //获取用户信息
  getUserData: () => {
    getCurUserInfo().then((res) => {
      set({ user: res.data });
    });
  },
  setShowSecondSide: (show) => set({ showSecondSide: show }),
 
});
