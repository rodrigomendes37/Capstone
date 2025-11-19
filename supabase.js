import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.expoConfig.extra;
console.log(SUPABASE_URL, SUPABASE_ANON_KEY);

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
export const supabase = createClient(
    SUPABASE_URL, SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
    },
  }
);
/*  "https://iuxcbbyscfciomgxartw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGNiYnlzY2ZjaW9tZ3hhcnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTMxMzQsImV4cCI6MjA3ODk4OTEzNH0.eS4NJxB5ke4khjMGk1aLaHavC1qKEaWrd56TrWcPD_Y",
  */