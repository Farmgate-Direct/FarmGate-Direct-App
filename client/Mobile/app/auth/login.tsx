import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../../src/services/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {

    if (!email || !password) {
      Alert.alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // AUTH LOGIN
      const user = await loginUser(
        email,
        password
      );

      // FIRESTORE DATA
      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!userDoc.exists()) {
        Alert.alert("User data not found.");
        return;
      }

      // APPROVAL CHECK
      const userData = userDoc.data();

      if (userData.status !== "approved") {
        Alert.alert("Your account is not approved yet.");
        return;
      }
      if (userData.status === "pending") {
        Alert.alert("Your account is waiting for admin approval.");
        return;
      }
      if (userData.status === "rejected") {
        Alert.alert("Your account was rejected.");
        return;
      }

      // SAVE LOCAL
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      

      // ROLE ROUTE
      if (userData.role === "farmer") {
        router.replace(
          "/farmer/(tabs)/home"
        );
      } else {
        router.replace(
          "/buyer/(tabs)/home"
        );
      }
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-green-700">
      <View className="flex-1 items-center justify-center mb-10">
        <Image
          className="w-16 h-16 mb-3"
          resizeMode="contain"
          source={require("../../assets/Farmgate-logos/farmgate-logo.png")}
        />

        <Text className="text-white text-[30px] font-bold">
          FARMGATE DIRECT
        </Text>
      </View>

      <Text className="text-[20px] font-bold text-white ml-10">
        Hello!
      </Text>

      <Text className="text-[15px] text-white mb-6 ml-10">
        Welcome to FarmGate Direct
      </Text>

      <View className="bg-white rounded-t-[40px] px-6 pt-10 pb-10">
        <Text className="text-[20px] text-green-700 mb-5">
          Email
        </Text>

        <TextInput
          className="border border-green-700 rounded-lg px-4 py-5 mb-4"
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
        />

        <Text className="text-[20px] text-green-700 mb-5">
          Password
        </Text>

        <TextInput
          className="border border-green-700 rounded-lg px-4 py-5 mb-7"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View className="items-center justify-center">
          <TouchableOpacity
            className="bg-green-700 py-3 rounded-xl w-40 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Login
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-center text-gray-500 mt-7">
          Don’t have an account yet?{" "}
          <Text
            className="text-green-700 font-semibold"
            onPress={() =>
              router.push("./register")
            }
          >
            Register
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default Login;