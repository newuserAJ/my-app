import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

let AsyncStorageImpl: any;

if (Platform.OS === 'web') {
  // Web implementation using localStorage
  AsyncStorageImpl = {
    getItem: async (key: string) => localStorage.getItem(key) || null,
    setItem: async (key: string, value: string) => {
      localStorage.setItem(key, value);
      return null;
    },
    removeItem: async (key: string) => {
      localStorage.removeItem(key);
      return null;
    },
    multiRemove: async (keys: string[]) => {
      keys.forEach(key => localStorage.removeItem(key));
      return null;
    },
    multiGet: async (keys: string[]) => {
      return keys.map(key => [key, localStorage.getItem(key)]);
    },
    multiSet: async (keyValuePairs: [string, string][]) => {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      return null;
    },
    getAllKeys: async () => Object.keys(localStorage),
    clear: async () => {
      localStorage.clear();
      return null;
    },
  };
} else {
  // React Native implementation
  AsyncStorageImpl = ReactNativeAsyncStorage;
}

export default AsyncStorageImpl;
