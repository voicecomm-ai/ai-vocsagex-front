export const createSocketSlice = (set) => ({
  isConnection: false,
  messageUuid: null,
  socketData: "",

  setSocketStatus: (status) => set({ isConnection: status }),
  setMessageUuid: (uuid) => set({ messageUuid: uuid }),
  setSocketData: (data) => set({ socketData: data }),
});