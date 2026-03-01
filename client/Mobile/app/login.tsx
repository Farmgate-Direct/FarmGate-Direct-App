import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("http://192.168.8.7:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      Alert.alert(data.message);
      return;
    }

    // 🔥 ROLE BASED REDIRECT
    if (data.role === "Farmer") {
      router.replace("/farmer/(tabs)/home");
    } else if (data.role === "Buyer") {
      router.replace("/buyer/(tabs)/home");
    }
  };

  return (
    <View className="flex-1 bg-green-700">
      {/* Header */}
      <View className="flex-1 items-center justify-center mb-10">
        <Image
          //source={require("../assets/images/farmgate-logo.png")}
          className="w-16 h-16 mb-3"
          resizeMode="contain"
        />
        <Text className="text-white text-[30px] font-bold">
          FARMGATE DIRECT
        </Text>
      </View>

      {/* Welcome Text */}
      <Text className="text-[20px] font-bold text-white ml-10">Hello!</Text>
      <Text className="text-[15px] text-white mb-6 ml-10">
        Welcome to FarmGate Direct
      </Text>

      {/* White Card */}
      <View className="bg-white rounded-t-[40px] px-6 pt-10 pb-10">
        {/* Username */}
        <Text className="text-[20px] text-green-700 mb-5">Email</Text>
        <TextInput
          className="border border-green-700 rounded-lg px-4 py-5 mb-4"
          placeholder="Enter username"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <Text className="text-[20px] text-green-700 mb-5">Password</Text>
        <TextInput
          className="border border-green-700 rounded-lg px-4 py-5 mb-7"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Login Button */}
        <View className="items-center justify-center">
          <TouchableOpacity
            className="bg-green-700 py-3 rounded-xl w-40"
            onPress={handleLogin}
          >
            <Text className="text-white text-center font-bold text-lg">
              Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="text-center text-gray-500 mt-7">
          Don’t have an account yet?{" "}
          <Text
            className="text-green-700 font-semibold"
            onPress={() => router.push("./register")}
          >
            Register
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default Login;
