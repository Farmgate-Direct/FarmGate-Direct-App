import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const AccountSetting = () => {
  const router = useRouter();

  return (
    // Removed SafeAreaView (no design changes)
    <View className="flex-1 bg-green-700">
      {/* Header style na gusto mo */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-2xl font-bold ml-5">
          Account Settings
        </Text>
      </View>

      {/* White container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6">
        {/* Section label */}
        <Text className="text-gray-400 mb-6">Account</Text>

        {/* My Profile */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4"
          //onPress={() => router.push("/edit-profile1")}
        >
          <View className="flex-row items-center">
            <Ionicons name="person-circle-outline" size={20} color="#15803d" />
            <Text className="ml-3 text-green-700 font-semibold">
              My Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#15803d" />
        </TouchableOpacity>

        {/* Username */}
        <TouchableOpacity className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={20} color="#15803d" />
            <Text className="ml-3 text-green-700 font-semibold">Username</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-400 mr-2">Soya</Text>
            <Ionicons name="chevron-forward" size={20} color="#15803d" />
          </View>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={20} color="#15803d" />
            <Text className="ml-3 text-green-700 font-semibold">
              Email Address
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-400 mr-2">soyamy@gmail.com</Text>
            <Ionicons name="chevron-forward" size={20} color="#15803d" />
          </View>
        </TouchableOpacity>

        {/* Change Password */}
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl"
          //onPress={() => router.push("/change-password1")}
        >
          <View className="flex-row items-center">
            <Ionicons name="lock-closed-outline" size={20} color="#15803d" />
            <Text className="ml-3 text-green-700 font-semibold">
              Change Password
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#15803d" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountSetting;