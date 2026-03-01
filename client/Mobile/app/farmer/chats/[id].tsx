import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Chats = () => {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const buyer = {
    name: "Buyer Anna",
    avatar: null, // replace with image if needed
  };

  const messages = [
    { id: "1", text: "Hi po, available pa lettuce?", sender: "buyer" },
    { id: "2", text: "Hello! Yes, fresh lettuce today 🌿", sender: "farmer" },
    { id: "3", text: "Great! I’ll pick up 2kg tomorrow.", sender: "buyer" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-green-700">
      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-green-200 items-center justify-center ml-3">
          {buyer.avatar ? (
            <Image
              source={buyer.avatar}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={22} color="#15803d" />
          )}
        </View>

        {/* Name */}
        <Text className="text-white text-xl font-bold ml-3">{buyer.name}</Text>
      </View>

      {/* CHAT AREA */}
      <View className="flex-1 bg-white rounded-t-[40px] px-4 pt-6">
        <FlatList
          showsVerticalScrollIndicator={false}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className={`mb-3 ${
                item.sender === "farmer" ? "items-end" : "items-start"
              }`}
            >
              <View
                className={`px-4 py-2 rounded-2xl ${
                  item.sender === "farmer" ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`${
                    item.sender === "farmer" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* INPUT AREA */}
      <View className="bg-white border-t border-gray-200">
        <View className="px-4 py-3 flex-row items-center">
          <TouchableOpacity
            className="bg-gray-200 p-2 rounded-full mr-2 items-center justify-center"
            onPress={() => setShowOptions(!showOptions)}
          >
            <Ionicons
              name={showOptions ? "close" : "add"}
              size={22}
              color="#15803d"
            />
          </TouchableOpacity>

          <TextInput
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2"
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity className="bg-green-600 p-3 rounded-full">
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Extra Options (Gallery / Camera) */}
        {showOptions && (
          <View className="flex-row px-4 pb-3 justify-start">
            <View className="mr-4 items-center">
              <TouchableOpacity
                className="bg-gray-200 p-3 rounded-full items-center justify-center"
                onPress={() => console.log("Gallery clicked")}
              >
                <Ionicons name="images" size={22} color="#15803d" />
              </TouchableOpacity>
              <Text className="text-xs text-gray-700 mt-1">Gallery</Text>
            </View>

            <View className="items-center">
              <TouchableOpacity
                className="bg-gray-200 p-3 rounded-full items-center justify-center"
                onPress={() => console.log("Camera clicked")}
              >
                <Ionicons name="camera" size={22} color="#15803d" />
              </TouchableOpacity>
              <Text className="text-xs text-gray-700 mt-1">Camera</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Chats;
