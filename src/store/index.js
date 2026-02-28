import { create } from "zustand";
import { createUserSlice } from "./userStore";
import { createCountSlice } from "./countStore";
import { createSocketSlice } from "./socketStore"; // 新增
import { createFlowSlice } from "./flowStore"; // 新增
import { createGraphSlice } from "./graphStore"; // 新增图谱
import { createEventSlice } from "./eventStore"; // 新增事件
import { createMenuSlice } from "./menuStore"; // 新增菜单
import { createTuneStore } from "./tuneStore";
const combineSlices =
  (...slices) =>
  (set, get) =>
    Object.assign({}, ...slices.map((slice) => slice(set, get)));

export const useStore = create((set, get) => ({
  ...combineSlices(
    createUserSlice,
    createCountSlice,
    createSocketSlice,
    createFlowSlice,
    createGraphSlice,
    createEventSlice,
    createMenuSlice,
    createTuneStore
  )(set, get),
}));
