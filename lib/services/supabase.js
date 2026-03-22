import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ENV VARIABLES (Expo automatically exposes EXPO_PUBLIC_*)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", SUPABASE_URL);

// Platform-safe storage adapter for Supabase Auth
const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch {
        // fail silently on web if localStorage unavailable
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch {
        // fail silently
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
  },
});
