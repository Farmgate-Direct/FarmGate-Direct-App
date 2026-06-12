import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createChatId,
  listenMessages,
  sendMessage,
} from "../../../src/services/chatService";

const FarmerChat = () => {
  const router = useRouter();
  const { buyerId, buyerName } = useLocalSearchParams();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [chatId, setChatId] = useState("");

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let unsubscribe: any;

    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return;

        const user = JSON.parse(userStr);
        setFarmerId(user.uid);

        const id = createChatId(user.uid, String(buyerId));
        setChatId(id);

        // ✅ store unsubscribe
        unsubscribe = listenMessages(id, setMessages);
      } catch (error) {
        console.log(error);
      }
    };

    loadUser();

    return () => {
      if (unsubscribe) unsubscribe(); // ✅ cleanup
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim() || !chatId || !farmerId) return;

    await sendMessage({
      chatId,
      senderId: farmerId,
      receiverId: String(buyerId),
      text,
    });

    setText("");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-green-700"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="w-10 h-10 rounded-full bg-green-200 items-center justify-center ml-3">
          <Ionicons name="person" size={20} color="#15803d" />
        </View>

        <Text className="text-white text-xl font-bold ml-3">
          {buyerName}
        </Text>
      </View>

      {/* CHAT */}
      <View className="flex-1 bg-white rounded-t-[40px] px-4 pt-6">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons
                name="chatbubble-outline"
                size={50}
                color="#d1d5db"
              />
              <Text className="text-gray-400 mt-3">
                No messages yet. Say hi!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === farmerId;

            return (
              <View
                className={`mb-3 ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <View
                  className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                    isMe
                      ? "bg-green-600 rounded-br-none"
                      : "bg-gray-200 rounded-bl-none"
                  }`}
                >
                  <Text
                    className={
                      isMe ? "text-white" : "text-gray-800"
                    }
                  >
                    {item.text}
                  </Text>
                  <Text
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-green-200" : "text-gray-400"
                    }`}
                  >
                    {item.createdAt?.toDate
                      ? item.createdAt
                          .toDate()
                          .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* INPUT */}
      <View className="bg-white border-t border-gray-200">
        <View className="px-4 py-3 flex-row items-center">
          <TextInput
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2"
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            className="bg-green-600 p-3 rounded-full"
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FarmerChat;