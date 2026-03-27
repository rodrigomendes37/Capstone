import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/services/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // "athlete" | "coach"
  const [role, setRole] = useState("athlete");

  const [status, setStatus] = useState("");

  function showError(title: string, error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as any).message)
        : String(error ?? "Unknown error");

    console.log(title, msg, error);
    Alert.alert(title, msg);
    setStatus(`${title}: ${msg}`);
  }

  async function handleLogin() {
    setStatus("Signing in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return showError("Login Error", error);

    if (!data?.session) {
      return showError("Login Error", new Error("No session returned"));
    }

    setStatus("Success! Redirecting...");
    router.replace("/");
  }

  async function handleSignUp() {
    setStatus("Creating account...");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) return showError("Sign Up Error", error);

    setStatus("Account created! You can sign in now.");
    Alert.alert("Success", `Created ${role} account. Now sign in.`);
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 28, marginBottom: 10 }}>Login</Text>

      {!!status && (
        <Text style={{ marginBottom: 10, opacity: 0.8 }}>{status}</Text>
      )}

      <Text>Email</Text>
      <TextInput
        value={email}
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text>Password</Text>
      <TextInput
        value={password}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
        onChangeText={setPassword}
      />

      {/* Role toggle */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setRole("athlete")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            backgroundColor: role === "athlete" ? "#6b46c1" : "transparent",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: role === "athlete" ? "white" : "black",
            }}
          >
            Athlete
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRole("coach")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            backgroundColor: role === "coach" ? "#6b46c1" : "transparent",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: role === "coach" ? "white" : "black",
            }}
          >
            Coach
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: "#6b46c1",
          padding: 15,
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          Sign In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignUp}
        style={{
          borderWidth: 1,
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 16 }}>
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}
