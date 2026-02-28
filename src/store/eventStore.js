// store/slices/createEventSlice.js
export const createEventSlice = (set, get) => ({
  eventListeners: new Set(),

  emitEvent: (type, payload) => {
    get().eventListeners.forEach((listener) => {
      listener(type, payload);
    });
  },

  subscribeEvent: (callback) => {
    get().eventListeners.add(callback);
    return () => get().eventListeners.delete(callback);
  },
});
