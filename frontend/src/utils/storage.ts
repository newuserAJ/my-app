// Mock storage for session management
export const storage = {
  getItem: async (key: string) => {
    // In a real app, use AsyncStorage
    return null;
  },
  setItem: async (key: string, value: string) => {
    // In a real app, use AsyncStorage
  },
  removeItem: async (key: string) => {
    // In a real app, use AsyncStorage
  },
};
