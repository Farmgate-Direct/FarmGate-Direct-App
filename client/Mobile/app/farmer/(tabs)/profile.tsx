import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Profile = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-green-800">
      {/* Green header section */}
      <View className="px-6 pt-16 pb-20">
        {/* QR code button sa upper right */}
        <TouchableOpacity
          className="absolute right-8 top-16"
          onPress={() => router.push("/farmer/profile/qr")}
        >
          <Ionicons name="qr-code" size={35} color="white" />
        </TouchableOpacity>

        {/* Profile info center */}
        <View className="items-center">
          {/* Profile picture */}
          <Image
            //source={require("../../assets/images/profile-pic.png")}
            className="w-24 h-24 rounded-full border-4 border-white"
          />

          {/* Name */}
          <Text className="text-white text-3xl font-bold mt-3">
            Mario Santos
          </Text>

          {/* Location */}
          <Text className="text-white text-m mt-1">
            Hagonoy, Bulacan, Philippines
          </Text>

          {/* Farmer verification */}
          <View className="flex-row items-center mt-1">
            <Text className="text-white text-sm font-medium">
              Registered Farmer
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4ade80"
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
      </View>

      {/* White container na may curve sa taas */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6 -mt-10">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats section */}
          <View className="flex-row bg-white rounded-2xl shadow p-4 justify-between">
            {/* Products */}
            <View className="items-center flex-1">
              <Text className="font-bold text-lg">12</Text>
              <Text className="text-gray-500 text-xs">PRODUCTS</Text>
            </View>

            {/* Orders */}
            <View className="items-center flex-1">
              <Text className="font-bold text-lg">112</Text>
              <Text className="text-gray-500 text-xs">ORDERS</Text>
            </View>

            {/* Rating */}
            <View className="items-center flex-1">
              <Text className="font-bold text-lg">4.9 ⭐</Text>
              <Text className="text-gray-500 text-xs">RATING</Text>
            </View>
          </View>

          {/* Personal info section */}
          <View className="bg-white mt-6 rounded-2xl p-5 shadow">
            {/* HEADER ROW */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-semibold text-base">
                Personal Information
              </Text>

              <TouchableOpacity>
                <AntDesign name="edit" size={22} color="black" />
              </TouchableOpacity>
            </View>

            {/* First name input */}
            <TextInput
              editable={false}
              placeholder="First Name"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            {/* Last name input */}
            <TextInput
              placeholder="Last Name"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            {/* Email input */}
            <TextInput
              placeholder="Email"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            {/* Phone input */}
            <TextInput
              placeholder="Phone no."
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />
          </View>

          {/* Farm profile section */}
          <TouchableOpacity
            onPress={() => router.push("/farmer/profile/edit-profile-farm")}
          >
            <View className="bg-white mt-6 rounded-2xl p-5 shadow">
              <Text className="font-semibold text-base">Farm Profile</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default Profile;