import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/services/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  function showError(title: string, error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error ?? "Unknown error");

    Alert.alert(title, msg);
    setStatus(`${title}: ${msg}`);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Please enter both email and password.");
      return;
    }

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
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing information", "Please enter first and last name.");
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information", 
        "Please enter email and password."
      );
      return;
    }

    setStatus("Creating account...");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) return showError("Sign Up Error", error);

    const userId = data?.user?.id;

    if (userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        .eq("user_id", userId);

      if (profileError) {
        return showError("Profile Save Error", profileError);
      }
    }

    setStatus("Account created! You can sign in now.");
    Alert.alert(
      "Success",
      "Account created. Your access level and team assignment will be set by the app administrator."
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 28, marginBottom: 10 }}>Login</Text>

      {!!status && (
        <Text style={{ marginBottom: 10, opacity: 0.8 }}>{status}</Text>
      )}

      {isCreatingAccount && (
        <>
          <Text>First Name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={{
              borderWidth: 1,
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          />

          <Text>Last Name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={{
              borderWidth: 1,
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          />
        </>
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

      {!isCreatingAccount ? (
        <>
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
            onPress={() => {
              setIsCreatingAccount(true);
              setStatus("");
            }}
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
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={handleSignUp}
            style={{
              backgroundColor: "#6b46c1",
              padding: 15,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsCreatingAccount(false);
              setFirstName("");
              setLastName("");
              setStatus("");
            }}
            style={{
              borderWidth: 1,
              padding: 15,
              borderRadius: 8,
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16 }}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
