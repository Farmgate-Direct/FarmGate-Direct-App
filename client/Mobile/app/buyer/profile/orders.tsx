import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const MyOrdersScreen = () => {
  const router = useRouter(); // para makapag back
  const [activeTab, setActiveTab] = useState("All"); // current selected tab

  // sample orders data
  const orders = [
    {
      id: 1,
      name: "Organic Fresh Tomatoes",
      weight: "20 g",
      price: "₱60.00",
      status: "Delivered",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 2,
      name: "Organic Fresh Eggplant",
      weight: "20 g",
      price: "₱70.00",
      status: "Delivered",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 3,
      name: "Organic Fresh Okra",
      weight: "20 g",
      price: "₱70.00",
      status: "Delivered",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 4,
      name: "Organic Fresh Tomatoes",
      weight: "20 g",
      price: "₱60.00",
      status: "Pending",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 5,
      name: "Organic Fresh Eggplant",
      weight: "20 g",
      price: "₱70.00",
      status: "Pending",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 6,
      name: "Organic Fresh Okra",
      weight: "20 g",
      price: "₱70.00",
      status: "Pending",
      image: "https://via.placeholder.com/80",
    },
    {
      id: 7,
      name: "Organic Fresh Tomatoes",
      weight: "20 g",
      price: "₱60.00",
      status: "Processing",
      image: "https://via.placeholder.com/80",
    },
  ];

  // filter depende sa active tab
  const filteredOrders =
    activeTab === "All"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  // style ng status badge
  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return { bg: "bg-green-700", text: "text-white" };
      case "Pending":
        return { bg: "bg-yellow-300", text: "text-yellow-900" };
      case "Processing":
        return { bg: "bg-green-200", text: "text-green-900" };
      default:
        return { bg: "bg-gray-200", text: "text-gray-800" };
    }
  };

  return (
    // Removed SafeAreaView (no design changes)
    <View className="flex-1 bg-green-700">
      {/* Header section */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-2xl font-bold ml-5">My Orders</Text>
      </View>

      {/* White container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6">
        {/* Tabs */}
        <View className="flex-row justify-between mb-5">
          {["All", "Delivered", "Pending"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab ? "bg-green-700" : "border border-green-700"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab ? "text-white" : "text-green-700"
                }`}
              >
                {tab === "All" ? "All orders" : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order list */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusStyle(order.status);

            return (
              <View
                key={order.id}
                className="bg-gray-100 rounded-2xl p-4 mb-4 flex-row"
              >
                {/* Product image */}
                <Image
                  source={{ uri: order.image }}
                  className="w-16 h-16 rounded-xl"
                />

                <View className="flex-1 ml-4">
                  <View className="flex-row justify-between items-start">
                    {/* Order details */}
                    <View>
                      <Text className="font-semibold text-gray-800">
                        {order.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Net Weight: {order.weight}
                      </Text>
                      <Text className="font-bold mt-1">{order.price}</Text>
                    </View>

                    {/* Status badge */}
                    <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                      <Text className={`text-xs font-semibold ${statusStyle.text}`}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default MyOrdersScreen;