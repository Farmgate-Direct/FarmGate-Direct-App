import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { isGmail, isValidPhone, } from "../../utils/validators";
import { registerUser } from "../../src/services/authService";
import { saveUserToFirestore } from "../../src/services/firestoreService";
import { uploadValidIDAsync } from "../../src/services/cloudinaryValidIDService";

const RegisterBuyer = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validID, setValidID] = useState< string | null>(null);

  const pickImage = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });
    if (!result.canceled) {
      setValidID(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword ||
      !validID
    ) {
      Alert.alert( "Please complete all required fields." );
      return;
    }

    if (!isGmail(email)) {
      Alert.alert("Email must be a valid Gmail address.");
      return;
    }

    if (!isValidPhone(phone)) {
      Alert.alert( "Phone number must start with 09.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

    try {
      // AUTH
      setLoading(true);
      const user = await registerUser(
        fullName,
        email,
        password
      );

      // STORAGE
      const validIDUrl =
        await uploadValidIDAsync(validID);

      // FIRESTORE
      await saveUserToFirestore(user.uid, {
        uid: user.uid,
        fullName,
        email,
        phone,
        role: "buyer",
        status: "approved",
        validID: validIDUrl,
        createdAt: new Date(),
      });
      
      setLoading(false);
      Alert.alert("Buyer account created successfully!");
      router.push("/auth/login");

    } catch (error: any) {
      setLoading(false);
      Alert.alert(error.message);

    }
  };

  return (
    <View className="flex-1 bg-green-700">
      <View className="items-center pt-16 pb-8">
        <Image
          source={require("../../assets/Farmgate-logos/farmgate-logo.png")}
          className="w-16 h-16 mb-3"
          resizeMode="contain"
        />

        <Text className="text-white text-[26px] font-bold">
          FARMGATE DIRECT
        </Text>
      </View>

      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-6 justify-between">
        <View>
          <Text className="text-green-700 mb-2">
            Full Name
          </Text>

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            className="border border-green-700 rounded-lg px-4 py-3 mb-3"
          />

          <Text className="text-green-700 mb-2">
            Email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            className="border border-green-700 rounded-lg px-4 py-3 mb-3"
          />

          <Text className="text-green-700 mb-2">
            Phone No.
          </Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            className="border border-green-700 rounded-lg px-4 py-3 mb-3"
          />

          <Text className="text-green-700 mb-2">
            Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="border border-green-700 rounded-lg px-4 py-3 mb-3"
          />

          <Text className="text-green-700 mb-2">
            Confirm Password
          </Text>

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className="border border-green-700 rounded-lg px-4 py-3 mb-3"
          />

          <Text className="text-green-700 mb-2">
            Upload Valid ID
          </Text>

          <TouchableOpacity
            onPress={pickImage}
            className="bg-gray-200 border border-green-700 rounded-lg py-4 px-4 mb-6 flex-row items-center justify-center"
          >
            {validID ? (
              <View className="flex-row items-center">
                <Text className="text-green-700 font-semibold mr-2">
                  Image Uploaded
                </Text>

                <AntDesign
                  name="check"
                  size={24}
                  color="green"
                />
              </View>
            ) : (
              <Text className="text-gray-500">
                Upload Image
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center mt-2">
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            className="bg-green-700 py-3 rounded-xl w-40 mb-4"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Sign up
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-500">
            Already have an account?{" "}
            <Text
              className="text-green-700 font-semibold"
              onPress={() =>
                router.push("/auth/login")
              }
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default RegisterBuyer;