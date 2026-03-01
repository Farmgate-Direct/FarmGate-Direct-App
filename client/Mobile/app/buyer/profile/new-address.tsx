import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

const NewAddress = () => {
  const router = useRouter();
  const [isDefault, setIsDefault] = useState(false);

  return (
    // Removed SafeAreaView (no design changes)
    <View className="flex-1 bg-green-700">
      {/* Header section */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Title ng page */}
        <Text className="text-white text-2xl font-bold ml-5">New Address</Text>
      </View>

      {/* White card container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-10 justify-between">
        {/* Form fields */}
        <View>
          <TextInput
            placeholder="Full Name"
            className="border-b border-gray-300 py-4 mb-6 text-gray-700"
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Phone Number"
            keyboardType="phone-pad"
            className="border-b border-gray-300 py-4 mb-6 text-gray-700"
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity className="flex-row justify-between items-center border-b border-gray-300 py-4 mb-6">
            <Text className="text-gray-400">
              Region, Province, City, Barangay
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TextInput
            placeholder="Postal Code"
            keyboardType="numeric"
            className="border-b border-gray-300 py-4 mb-6 text-gray-700"
            placeholderTextColor="#9ca3af"
          />

          <TextInput
            placeholder="Street Name, Building, House No."
            className="border-b border-gray-300 py-4 mb-6 text-gray-700"
            placeholderTextColor="#9ca3af"
          />

          {/* Default address switch */}
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 text-sm">
              Set as Default Address
            </Text>

            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: "#d1d5db", true: "#15803d" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity className="bg-green-700 py-4 rounded-xl items-center mb-6">
          <Text className="text-white font-semibold text-base">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NewAddress;