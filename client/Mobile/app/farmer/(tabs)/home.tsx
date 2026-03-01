import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

const Homepage = () => {
  return (
    <View className="flex-1 bg-green-800">
      {/* Header */}
      <View className="bg-green-800 px-6 pt-16 pb-8">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-[25px] font-bold">
              Welcome, Farmer
            </Text>
            <Text className="text-white text-[15px]">
              Tuesday, February 17, 2026
            </Text>
          </View>

          <Ionicons
            name="notifications"
            size={35}
            color="white"
            //onPress={() => router.push("/saved-farms")}
          />
        </View>

        {/* Sales Card */}
        <View className="bg-white rounded-2xl mt-6 p-5 flex-row justify-between items-center">
          <View>
            <Text className="text-green-800 font-semibold text-xs">
              TOTAL SALES THIS MONTH
            </Text>
            <Text className="text-2xl font-bold mt-2">₱18,450.00</Text>
          </View>

          <FontAwesome5 name="coins" size={40} color="#f59e0b" />
        </View>
      </View>

      {/* White Container */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6 -mt-2">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Cards */}
          <View className="flex-row justify-between">
            <View className="bg-white w-[30%] rounded-2xl p-4 items-center shadow-sm">
              <MaterialIcons name="storefront" size={24} color="#15803d" />
              <Text className="text-lg font-bold mt-2">21</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">
                Product Listing
              </Text>
            </View>

            <View className="bg-white w-[30%] rounded-2xl p-4 items-center shadow-sm">
              <Ionicons name="cube-outline" size={24} color="#15803d" />
              <Text className="text-lg font-bold mt-2">121</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">Orders</Text>
            </View>

            <View className="bg-white w-[30%] rounded-2xl p-4 items-center shadow-sm">
              <Ionicons name="warning-outline" size={24} color="#facc15" />
              <Text className="text-lg font-bold mt-2">3</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">Low Stock</Text>
            </View>
          </View>

          {/* Notifications */}
          <Text className="font-semibold text-gray-800 mt-4 mb-3">
            Notifications
          </Text>

          <View className="bg-white rounded-2xl p-4">
            <Text className="text-sm text-gray-700 mb-2">
              • New order for Organic Tomatoes (5kg) by Maria Santos
            </Text>

            <Text className="text-sm text-gray-700 mb-2">
              • New message from buyer Maria Santos
            </Text>

            <Text className="text-sm text-gray-700">
              • Payment received for Order #11243 +100.00
            </Text>
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};

export default Homepage;