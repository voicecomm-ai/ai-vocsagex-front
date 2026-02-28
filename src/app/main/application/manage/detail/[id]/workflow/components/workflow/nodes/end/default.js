
const nodeDefault = {
  defaultValue: {
    outputs: [],
  },

  getAvailableNextNodes() {
    return []
  },
  checkValid() {
    return {
      isValid: true,
      errorMessage: '',
    }
  },
}

export default nodeDefault
