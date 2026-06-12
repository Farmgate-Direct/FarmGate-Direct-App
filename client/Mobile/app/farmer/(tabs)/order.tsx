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
  getFarmerOrders,
} from "@/src/services/orderService";
import { OrderType } from "@/src/types/order";

const filters = [
  "All",
  "pending",
  "processing",
  "delivered",
  "cancelled",
];

export default function Orders() {

  const router = useRouter();

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
            ? JSON.parse(
              userStr
            )
            : null;

        if (!user) return;

        const farmerId =
          user.uid ||
          user.userId ||
          user.id;

        const data =
          await getFarmerOrders(
            farmerId
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
          o.status ===
          activeFilter
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
        };

      case "processing":
        return {
          text: "#166534",
          border: "#15803D",
        };

      case "delivered":
        return {
          text: "#1D4ED8",
          border: "#2563EB",
        };

      case "cancelled":
        return {
          text: "#374151",
          border: "#6B7280",
        };

      default:
        return {
          text: "#374151",
          border: "#9CA3AF",
        };
    }
  };

  // ================= LOADING =================
  if (loading) {

    return (
      <View className="flex-1 justify-center items-center">
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
      <View className="pt-16 px-5 pb-5">

        <Text className="text-white text-3xl font-bold">
          Orders
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
                  className={`mr-3 px-5 py-2 rounded-full items-center justify-center ${isActive
                      ? "bg-green-700"
                      : "bg-gray-200"
                    }`}
                  style={{
                    minWidth: 90,
                  }}
                >

                  <Text
                    className={`font-semibold text-sm ${isActive
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
        

        {/* LIST */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: 20,
          }}
          renderItem={({ item }) => {

            const statusColors =
              getStatusColor(
                item.status
              );

            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname:
                      "/farmer/orders/[id]",

                    params: {
                      id: item.id || "",
                    },
                  })
                }
                className="bg-green-50 p-4 rounded-2xl mb-3"
              >

                <View className="flex-row items-center">

                  {/* ICON */}
                  <View className="w-12 h-12 rounded-full bg-green-400 justify-center items-center mr-3">

                    <Text className="text-white font-bold">
                      {item.buyerName
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </Text>

                  </View>

                  {/* INFO */}
                  <View className="flex-1">

                    <Text className="font-bold text-base">
                      {item.buyerName}
                    </Text>

                    <Text className="text-gray-500 text-sm">
                      {item.products
                        ?.length || 0}{" "}
                      item(s)
                    </Text>

                  </View>

                  {/* STATUS */}
                  <View
                    style={{
                      borderColor:
                        statusColors.border,
                    }}
                    className="border rounded-full px-4 py-1"
                  >

                    <Text
                      style={{
                        color:
                          statusColors.text,
                      }}
                      className="font-semibold text-xs"
                    >
                      {item.status.toUpperCase()}
                    </Text>

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