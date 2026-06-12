import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useRouter,
} from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker
  from "expo-image-picker";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
} from "firebase/auth";

import { db }
  from "../../../FirebaseConfig";

import {
  uploadProfileImageAsync,
} from "@/src/services/cloudinaryProfileService";

import {
  deleteCloudinaryImage,
} from "../../../src/services/deleteImageService";

const AccountSetting = () => {

  const router = useRouter();

  const auth = getAuth();

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  // ================= LOAD USER =================
  useEffect(() => {

    const loadUser = async () => {

      const userStr =
        await AsyncStorage.getItem(
          "user"
        );

      if (!userStr) return;

      setUser(
        JSON.parse(userStr)
      );
    };

    loadUser();

  }, []);

  // ================= PICK IMAGE =================
  const pickImage =
    async () => {

      try {

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          permission.status !==
          "granted"
        ) {

          Alert.alert(
            "Permission needed",
            "Please allow gallery access"
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes:
              ImagePicker.MediaTypeOptions.Images,

            allowsEditing: true,

            aspect: [1, 1],

            quality: 0.7,
          });

        if (
          result.canceled
        ) return;

        setLoading(true);

        // ================= UPLOAD NEW IMAGE =================
        const uploaded =
          await uploadProfileImageAsync(
            result.assets[0].uri
          );

        const userId =
          user.uid ||
          user.userId ||
          user.id;

        // ================= DELETE OLD IMAGE =================
        if (
          user?.profileImagePublicId
        ) {

          await deleteCloudinaryImage(
            user.profileImagePublicId
          );

        }

        // ================= UPDATE FIRESTORE =================
        await updateDoc(
          doc(
            db,
            "users",
            userId
          ),
          {
            profileImage:
              uploaded.imageUrl,

            profileImagePublicId:
              uploaded.publicId,
          }
        );

        // ================= UPDATE LOCAL USER =================
        const updatedUser = {

          ...user,

          profileImage:
            uploaded.imageUrl,

          profileImagePublicId:
            uploaded.publicId,
        };

        // ================= UPDATE STORAGE =================
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            updatedUser
          )
        );

        setUser(updatedUser);

        Alert.alert(
          "Success",
          "Profile updated"
        );

      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Failed to upload image"
        );

      } finally {

        setLoading(false);

      }
    };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword =
    async () => {

      try {

        if (
          !currentPassword ||
          !newPassword
        ) {

          Alert.alert(
            "Error",
            "Fill all fields"
          );

          return;
        }
        if (
          currentPassword ===
          newPassword
        ) {

          Alert.alert(
            "Same Password",
            "New password must be different from current password."
          );

          return;
        }

        if (
          newPassword.length < 6
        ) {

          Alert.alert(
            "Error",
            "Password must be at least 6 characters"
          );

          return;
        }

        const firebaseUser =
          auth.currentUser;

        if (!firebaseUser) {

          Alert.alert(
            "Error",
            "User not found"
          );

          return;
        }

        const credential =
          EmailAuthProvider.credential(
            firebaseUser.email || "",
            currentPassword
          );

        // ================= REAUTH =================
        await reauthenticateWithCredential(
          firebaseUser,
          credential
        );

        // ================= UPDATE PASSWORD =================
        await updatePassword(
          firebaseUser,
          newPassword
        );

        Alert.alert(
          "Success",
          "Password changed successfully"
        );

        setModalVisible(false);

        setCurrentPassword("");

        setNewPassword("");

      } catch (error: any) {

        console.log(error);

        Alert.alert(
          "Error",
          error.message
        );
      }
    };

  return (
    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold ml-5">
          Account Settings
        </Text>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-8">

        {/* PROFILE IMAGE */}
        <View className="items-center mb-8">

          <TouchableOpacity
            onPress={pickImage}
            disabled={loading}
            className="relative"
          >

            {user?.profileImage ? (

              <Image
                source={{
                  uri:
                    user.profileImage,
                }}
                className="w-32 h-32 rounded-full"
              />

            ) : (

              <View className="w-32 h-32 rounded-full bg-green-100 justify-center items-center">

                <Ionicons
                  name="person"
                  size={60}
                  color="#15803D"
                />

              </View>

            )}

            {/* CAMERA ICON */}
            <View className="absolute bottom-0 right-0 bg-green-700 p-2 rounded-full">

              <Ionicons
                name="camera"
                size={18}
                color="white"
              />

            </View>

          </TouchableOpacity>

          <Text className="text-gray-500 mt-3">
            Tap to change profile
          </Text>

          {loading && (

            <ActivityIndicator
              size="large"
              color="#15803D"
              className="mt-4"
            />

          )}

        </View>

        <Text className="text-gray-400 mb-6">
          Account
        </Text>

        {/* FULL NAME */}
        <View className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4">

          <View className="flex-row items-center">

            <Ionicons
              name="person-circle-outline"
              size={20}
              color="#15803d"
            />

            <Text className="ml-3 text-green-700 font-semibold">
              Full Name
            </Text>

          </View>

          <Text className="text-gray-400">
            {user?.fullName || ""}
          </Text>

        </View>

        {/* EMAIL */}
        <View className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4">

          <View className="flex-row items-center">

            <Ionicons
              name="mail-outline"
              size={20}
              color="#15803d"
            />

            <Text className="ml-3 text-green-700 font-semibold">
              Email
            </Text>

          </View>

          <Text className="text-gray-400">
            {user?.email || ""}
          </Text>

        </View>

        {/* CHANGE PASSWORD */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          onPress={() =>
            setModalVisible(true)
          }
        >

          <View className="flex-row items-center">

            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#15803d"
            />

            <Text className="ml-3 text-green-700 font-semibold">
              Change Password
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#15803d"
          />

        </TouchableOpacity>

      </View>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >

        <View className="flex-1 justify-center items-center bg-black/40 px-6">

          <View className="bg-white w-full rounded-3xl p-6">

            <Text className="text-xl font-bold text-gray-800 mb-5">
              Change Password
            </Text>

            {/* CURRENT PASSWORD */}
            <TextInput
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={
                setCurrentPassword
              }
              className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
            />

            {/* NEW PASSWORD */}
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={
                setNewPassword
              }
              className="bg-gray-100 rounded-xl px-4 py-4 mb-6"
            />

            <View className="flex-row">

              {/* CANCEL */}
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-4 rounded-xl mr-2 items-center"
                onPress={() =>
                  setModalVisible(false)
                }
              >

                <Text className="font-semibold text-gray-700">
                  Cancel
                </Text>

              </TouchableOpacity>

              {/* SAVE */}
              <TouchableOpacity
                className="flex-1 bg-green-700 py-4 rounded-xl ml-2 items-center"
                onPress={
                  handleChangePassword
                }
              >

                <Text className="font-semibold text-white">
                  Save
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
};

export default AccountSetting;