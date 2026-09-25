import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

interface Props {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

export default function Header_Buyer({
  searchQuery,
  onSearchChange,
  placeholder = "Search vegetables, fruits…",
}: Props) {
  const router = useRouter();

  return (
    <View className="bg-green-900 pt-14 pb-4 px-5 rounded-b-2xl mb-1">
      <View className="flex-row items-center gap-2.5">
        <View className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-1.5 gap-2">
          <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            className="flex-1 text-gray-900 text-sm"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange("")}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/buyer/cart")}
          activeOpacity={0.85}
          className="p-1.5"
        >
          <MaterialCommunityIcons name="cart-outline" size={25} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}