export const createTuneStore = (set) => ({
  multiModalEnabled: false,
  advancedEnabled: false,
  showFilter:false,
  setMultiModalEnabled: (status) => set({ multiModalEnabled: status }),
  setAdvancedEnabled: (status) => set({ advancedEnabled: status }),
  setShowFilter: (status) => set({ showFilter: status }),
});
