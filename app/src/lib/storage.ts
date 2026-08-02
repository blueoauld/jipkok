import { createMMKV } from "react-native-mmkv";
import { createJSONStorage } from "zustand/middleware";

const mmkv = createMMKV();

export const storage = createJSONStorage(() => ({
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => {
    mmkv.remove(key);
  },
}));
