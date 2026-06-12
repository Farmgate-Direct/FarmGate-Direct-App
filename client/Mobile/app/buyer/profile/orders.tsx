import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import { getBuyerOrders }
  from "@/src/services/orderService";

import { OrderType }
  from "@/src/types/order";

const filters = [
  "All",
  "pending",
  "processing",
  "delivered",
  "cancelled",
];

export default function BuyerOrders() {

  const router =
    useRouter();

  const [orders, setOrders] =
    useState<OrderType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [activeFilter, setActiveFilter] =
    useState("All");

  // ================= FETCH =================
  const fetchOrders =
    async () => {

      try {

        setLoading(true);

        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        const user =
          userStr
            ? JSON.parse(userStr)
            : null;

        if (!user) return;

        const buyerId =
          user.uid ||
          user.userId ||
          user.id;

        const data =
          await getBuyerOrders(
            buyerId
          );

        setOrders(data);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {

    fetchOrders();

  }, []);

  useFocusEffect(
    useCallback(() => {

      fetchOrders();

    }, [])
  );

  // ================= FILTER =================
  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter(
          (o) =>
            o.status === activeFilter
        );

  // ================= STATUS =================
  const getStatusColor = (
    status: string
  ) => {

    switch (status) {

      case "pending":
        return {
          text: "#D97706",
          border: "#FACC15",
          bg: "#FEF3C7",
        };

      case "processing":
        return {
          text: "#166534",
          border: "#15803D",
          bg: "#DCFCE7",
        };

      case "delivered":
        return {
          text: "#1D4ED8",
          border: "#2563EB",
          bg: "#DBEAFE",
        };

      case "cancelled":
        return {
          text: "#374151",
          border: "#6B7280",
          bg: "#E5E7EB",
        };

      default:
        return {
          text: "#374151",
          border: "#9CA3AF",
          bg: "#F3F4F6",
        };
    }
  };

  // ================= LOADING =================
  if (loading) {

    return (

      <View className="flex-1 justify-center items-center bg-white">

        <ActivityIndicator
          size="large"
          color="#15803D"
        />

      </View>
    );
  }

  return (

    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="pt-16 px-5 pb-5 flex-row items-center">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          className="mr-4"
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <Text className="text-white text-3xl font-bold">
          My Orders
        </Text>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[40px] p-5">

        {/* FILTERS */}
        <View className="mb-4">

          <FlatList
            data={filters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{
              paddingRight: 20,
            }}
            renderItem={({ item }) => {

              const isActive =
                activeFilter === item;

              return (

                <TouchableOpacity
                  onPress={() =>
                    setActiveFilter(item)
                  }
                  className={`px-4 py-2 rounded-full mr-3 ${
                    isActive
                      ? "bg-green-700"
                      : "bg-gray-200"
                  }`}
                >

                  <Text
                    className={`font-medium ${
                      isActive
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>
              );
            }}
          />

        </View>

        {/* ORDER LIST */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) =>
            item.id ||
            Math.random().toString()
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: 20,
          }}
          ListEmptyComponent={

            <View className="mt-24 items-center">

              <Ionicons
                name="receipt-outline"
                size={70}
                color="#D1D5DB"
              />

              <Text className="text-gray-500 mt-4 text-base">
                No orders found
              </Text>

            </View>
          }
          renderItem={({ item }) => {

            const statusColors =
              getStatusColor(
                item.status
              );

            return (

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname:
                      "/buyer/profile/order-details",

                    params: {
                      orderId:
                        item.id,
                    },
                  })
                }
                className="bg-green-50 p-4 rounded-3xl mb-4 border border-green-100"
              >

                <View className="flex-row items-center">

                  {/* ICON */}
                  <View className="w-14 h-14 rounded-full bg-green-600 justify-center items-center mr-4">

                    <Text className="text-white font-bold text-lg">
                      {item.farmName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </Text>

                  </View>

                  {/* INFO */}
                  <View className="flex-1">

                    <Text className="font-bold text-base text-gray-800">
                      {item.farmName}
                    </Text>

                    <Text className="text-gray-500 text-sm mt-1">
                      {item.products?.length || 0}
                      {" "}
                      item(s)
                    </Text>

                    <Text className="text-green-700 font-semibold text-sm mt-1">
                      ₱
                      {item.total}
                    </Text>

                  </View>

                  {/* RIGHT */}
                  <View className="items-end">

                    {/* STATUS */}
                    <View
                      style={{
                        backgroundColor:
                          statusColors.bg,

                        borderColor:
                          statusColors.border,
                      }}
                      className="border rounded-full px-3 py-1"
                    >

                      <Text
                        style={{
                          color:
                            statusColors.text,
                        }}
                        className="font-bold text-[11px]"
                      >
                        {item.status.toUpperCase()}
                      </Text>

                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#15803D"
                      className="mt-3"
                    />

                  </View>

                </View>

              </TouchableOpacity>
            );
          }}
        />

      </View>

    </View>
  );
}