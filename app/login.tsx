import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../supabase";

export default function Login() {
  const router = useRouter();  // ✅ Hook now inside component

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login Error", error.message);
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 20 }}>Login</Text>

      <Text>Email</Text>
      <TextInput
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text>Password</Text>
      <TextInput
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 6,
          marginBottom: 20,
        }}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: "#6b46c1",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

