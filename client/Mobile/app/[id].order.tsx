

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";

export default function OrderDetails() {
  const router = useRouter();
  const { order: orderParam } = useLocalSearchParams();

  const order = orderParam ? JSON.parse(orderParam as string) : null;

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No order found</Text>
      </View>
    );
  }

  const subtotal = order.price * order.quantity;
  const total = subtotal + order.shipping;

  const statusStyle = () => {
    switch (order.status) {
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Accepted": return "bg-green-100 text-green-700";
      case "Delivered": return "bg-blue-100 text-blue-700";
      case "Declined": return "bg-red-100 text-red-700";
      case "Cancelled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="px-6 pt-16 pb-6 flex-row items-center">

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="ml-4 flex-1">
          <Text className="text-white text-xl font-bold">{order.name}</Text>
          <Text className="text-green-100 text-sm">Order #{order.id}</Text>
        </View>

        <View className={`px-3 py-1 rounded-full ${statusStyle()}`}>
          <Text className="text-xs font-semibold">{order.status}</Text>
        </View>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[35px] px-6 pt-6">

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ADDRESS */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location-outline" size={18} color="#16a34a" />
              <Text className="text-2xl ml-2 text-gray-800 font-semibold">
                Delivery Address
              </Text>
            </View>
            <Text className="text-gray-600 text-lg">{order.address}</Text>
          </View>

          {/* ORDER DETAILS */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">

            <Text className="text-gray-500 font-semibold mb-3 text-lg">
              ORDER DETAILS
            </Text>

            <View className="flex-row justify-between mb-2 ">
              <Text className="text-gray-600 text-xl">Product</Text>
              <Text className="text-gray-800 text-xl">{order.product}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-xl">Net Weight</Text>
              <Text className="text-gray-800 text-xl">{order.weight}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-xl">Quantity</Text>
              <Text className="text-gray-800 text-xl">{order.quantity}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-xl">Unit Price</Text>
              <Text className="text-gray-800 text-xl">₱{order.price}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-xl">Shipping</Text>
              <Text className="text-gray-800 text-xl">₱{order.shipping}</Text>
            </View>

            <View className="border-t border-gray-200 mt-3 pt-3 flex-row justify-between">
              <Text className="font-bold text-gray-800 text-xl">Total</Text>
              <Text className="font-bold text-green-700  text-xl">
                ₱{total}
              </Text>
            </View>

          </View>
        </ScrollView>
      </View>

      {/* ACTION BUTTONS */}
      {order.status === "Pending" && (
        <View className="bg-white px-6 py-4 flex-row">

          <TouchableOpacity className="flex-1 mr-2 py-3 rounded-xl border border-red-400 items-center">
            <Text className="text-red-500 font-semibold">Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 ml-2 py-3 rounded-xl bg-green-700 items-center">
            <Text className="text-white font-semibold">Accept</Text>
          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}