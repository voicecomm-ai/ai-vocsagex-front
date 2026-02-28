

const nodeDefault = {
  defaultValue: {
    variables: [],
  },
  getAvailablePrevNodes() {
    return []
  },
  checkValid() {
    return {
      isValid: true,
    }
  },
}

export default nodeDefault
