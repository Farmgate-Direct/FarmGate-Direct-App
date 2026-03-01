import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const buyersMessages = [
  {
    id: "1",
    name: "Buyer Anna",
    message: "Can I get 2 kg of tomatoes tomorrow?",
    time: "10m ago",
  },
  {
    id: "2",
    name: "Buyer Carlos",
    message: "Please reserve 5 heads of lettuce for me.",
    time: "30m ago",
  },
  {
    id: "3",
    name: "Buyer Lina",
    message: "Thank you for the quick delivery last time!",
    time: "2h ago",
  },
];

const Messages = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-green-700">
      {/* Header */}
      <View className="bg-green-700 px-6 py-4 pt-16">
        <Text className="text-white text-[25px] font-bold">Chats</Text>
      </View>

      {/* White container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6">
        <FlatList
          showsVerticalScrollIndicator={false}
          data={buyersMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/farmer/chats/${item.id}`)}
              className="bg-green-50 p-4 rounded-2xl mb-4 flex-row items-center"
            >
              {/* Avatar */}
              <View className="w-12 h-12 rounded-full bg-green-200 items-center justify-center mr-4">
                <Ionicons name="person" size={22} color="#15803d" />
              </View>

              {/* Message content */}
              <View className="flex-1">
                {/* Name and time */}
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-gray-800">{item.name}</Text>

                  <Text className="text-xs text-gray-400">{item.time}</Text>
                </View>

                {/* Message preview */}
                <Text className="text-gray-600 mt-1" numberOfLines={1}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default Messages;