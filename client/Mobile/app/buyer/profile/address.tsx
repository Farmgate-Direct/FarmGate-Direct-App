import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const AddressScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-green-700">
      {/* Header */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-2xl font-bold ml-5">Address</Text>
      </View>

      {/* White container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6 justify-between">
        <View>
          {/* Default address card */}
          <TouchableOpacity className="border border-green-700 bg-green-50 p-4 rounded-2xl mb-4">
            <Text className="text-green-700 font-semibold mb-1">
              Default Address
            </Text>
            <Text className="text-gray-600 text-sm">
              Binasal Street, Purok 1, North Luzon, B
            </Text>
          </TouchableOpacity>

          {/* Second address card */}
          <TouchableOpacity className="bg-gray-100 p-4 rounded-2xl">
            <Text className="text-gray-500 font-semibold mb-1">Address 2</Text>
            <Text className="text-gray-500 text-sm">
              Binasal Street, Purok 1, North Luzon, B
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add new button sa baba */}
        <TouchableOpacity
          className="bg-green-700 py-4 rounded-2xl items-center mb-6"
          onPress={() => router.push("/buyer/profile/new-address")}
        >
          <Text className="text-white font-semibold">+ Add New</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressScreen;