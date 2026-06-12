import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { useRouter } from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../FirebaseConfig";

const Profile = () => {

  const router = useRouter();

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  // ================= LOAD USER =================
  useEffect(() => {

    const loadUser = async () => {

      try {

        const storedUser =
          await AsyncStorage.getItem(
            "user"
          );

        if (!storedUser) return;

        const parsedUser =
          JSON.parse(storedUser);

        const userId =
          parsedUser.uid ||
          parsedUser.userId ||
          parsedUser.id;

        const userDoc =
          await getDoc(
            doc(
              db,
              "users",
              userId
            )
          );

        if (!userDoc.exists()) {
          return;
        }

        setUser({
          id: userDoc.id,
          ...userDoc.data(),
        });

      } catch (error) {

        console.log(
          "LOAD USER ERROR:",
          error
        );

      } finally {

        setLoading(false);
      }
    };

    loadUser();

  }, []);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      setModalVisible(false);

      await AsyncStorage.removeItem("user");

      router.replace("/auth/login");

    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {

    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator
          size="large"
          color="#15803D"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="h-44 justify-center px-6">

        <Text className="text-white text-2xl font-bold text-center">
          Profile
        </Text>

        <TouchableOpacity
          className="absolute right-8 top-16"
          onPress={() =>
            router.push(
              "/buyer/profile/message"
            )
          }
        >

          <AntDesign
            name="message"
            size={28}
            color="white"
          />

        </TouchableOpacity>

      </View>

      {/* WHITE CARD */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-24">

        <View className="items-center mb-8">

          <Text className="text-xl font-bold text-gray-800">
            {user?.fullName || "User"}
          </Text>

          <Text className="text-gray-400 text-sm mt-1">
            {user?.email || ""}
          </Text>

        </View>

        {/* OPTIONS */}
        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          onPress={() =>
            router.push(
              "/buyer/profile/account-setting"
            )
          }
        >

          <Text className="text-green-700 font-semibold">
            My Account
          </Text>

          <Ionicons
            name="person-outline"
            size={20}
            color="#15803d"
          />

        </TouchableOpacity>

        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          onPress={() =>
            router.push(
              "/buyer/profile/address"
            )
          }
        >

          <Text className="text-green-700 font-semibold">
            Address
          </Text>

          <Ionicons
            name="location-outline"
            size={20}
            color="#15803d"
          />

        </TouchableOpacity>

        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          onPress={() =>
            router.push(
              "/buyer/profile/orders"
            )
          }
        >

          <Text className="text-green-700 font-semibold">
            My Orders
          </Text>

          <Ionicons
            name="time-outline"
            size={20}
            color="#15803d"
          />

        </TouchableOpacity>

        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          onPress={() =>
            router.push(
              "/buyer/profile/saved-farms"
            )
          }
        >

          <Text className="text-green-700 font-semibold">
            Saved Farms
          </Text>

          <Ionicons
            name="heart-outline"
            size={20}
            color="#15803d"
          />

        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-red-50 p-4 rounded-xl mt-2"
          onPress={() =>
            setModalVisible(true)
          }
        >

          <Text className="text-red-600 font-semibold">
            Log out
          </Text>

          <Ionicons
            name="log-out-outline"
            size={20}
            color="#dc2626"
          />

        </TouchableOpacity>

      </View>

      {/* PROFILE IMAGE */}
      {/* PROFILE IMAGE */}
      <View className="absolute top-28 self-center items-center">

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (user?.profileImage) {
              router.push({
                pathname: "/buyer/profile/view-profile",
                params: {
                  image: user.profileImage,
                },
              });
            }
          }}
        >

          <View className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-green-100 justify-center items-center">

            {user?.profileImage ? (

              <Image
                source={{
                  uri: user.profileImage,
                }}
                className="w-full h-full"
              />

            ) : (

              <Ionicons
                name="person"
                size={60}
                color="#15803D"
              />

            )}

          </View>

        </TouchableOpacity>

      </View>

      {/* MODAL */}
      {modalVisible && (

        <View className="absolute inset-0 justify-center items-center bg-black/40">

          <View className="bg-white rounded-2xl p-6 w-80">

            <Text className="text-gray-800 text-lg font-semibold mb-4">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row justify-between mt-4">

              <TouchableOpacity
                className="bg-gray-200 px-4 py-2 rounded-2xl flex-1 mr-2 items-center"
                onPress={() =>
                  setModalVisible(false)
                }
              >

                <Text className="text-gray-700 font-semibold">
                  Cancel
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-600 px-4 py-2 rounded-2xl flex-1 ml-2 items-center"
                onPress={handleLogout}
              >
                <Text className="text-white font-semibold">
                  Logout
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>
      )}

    </View>
  );
};

export default Profile;