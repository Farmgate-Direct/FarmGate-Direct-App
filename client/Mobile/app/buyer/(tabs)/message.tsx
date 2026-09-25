import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../FirebaseConfig";
import { listenChats } from "../../../src/services/chatService";

const BuyerMessages = () => {
  const router = useRouter();

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any;

    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return;

        const user = JSON.parse(userStr);

        unsubscribe = listenChats(
          user.uid,
          async (data) => {
            const formatted = await Promise.all(
              data.map(async (chat: any) => {
                const otherUid = chat.users.find(
                  (u: string) => u !== user.uid
                );

                const userDoc = await getDoc(
                  doc(db, "users", otherUid)
                );

                return {
                  ...chat,
                  otherUserData: userDoc.data(),
                };
              })
            );

            setChats(formatted);
            setLoading(false);
          }
        );
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-5">
          Chats
        </Text>
      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6">
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={60}
                color="#d1d5db"
              />
              <Text className="text-gray-400 mt-4">
                No messages yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/buyer/messages/ChatScreen",
                  params: {
                    farmerId: item.otherUserData?.uid,
                    farmerName:
                      item.otherUserData?.farmName ||
                      item.otherUserData?.fullName,
                  },
                })
              }
              className="bg-green-50 p-4 rounded-2xl mb-4 flex-row items-center"
            >
              {/* AVATAR */}
              <View className="w-12 h-12 rounded-full bg-green-200 items-center justify-center mr-4">
                <Ionicons name="person" size={22} color="#15803d" />
              </View>

              {/* CONTENT */}
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-gray-800">
                    {item.otherUserData?.farmName ||
                      item.otherUserData?.fullName}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {item.lastMessageTime?.toDate
                      ? item.lastMessageTime
                          .toDate()
                          .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : ""}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  className="text-gray-600 mt-1"
                >
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

export default BuyerMessages;