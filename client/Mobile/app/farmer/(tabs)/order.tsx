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

import {
  getFarmerOrders,
} from "@/src/services/orderService";

import {
  OrderType,
} from "@/src/types/order";

const filters = [
  "All",
  "pending",
  "accepted",
  "processing",
  "to_receive",
  "delivered",
  "cancelled",
];

export default function Orders() {

  const router =
    useRouter();

  const [orders, setOrders] =
    useState<OrderType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [activeFilter, setActiveFilter] =
    useState("All");

  // ================= FORMAT DATE =================
  const formatOrderDate = (
    createdAt: any
  ) => {

    if (!createdAt) {
      return "Date unavailable";
    }

    try {

      let date: Date;

      if (
        typeof createdAt?.toDate ===
        "function"
      ) {

        date =
          createdAt.toDate();

      } else if (
        typeof createdAt?.seconds ===
        "number"
      ) {

        date = new Date(
          createdAt.seconds *
            1000
        );

      } else {

        date =
          new Date(createdAt);
      }

      if (
        isNaN(
          date.getTime()
        )
      ) {

        return "Date unavailable";
      }

      return date.toLocaleString(
        "en-PH",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );

    } catch {

      return "Date unavailable";
    }
  };

  // ================= PRODUCT NAMES =================
  const getProductSummary = (
    order: OrderType
  ) => {

    const products =
      order.products || [];

    if (
      products.length ===
      0
    ) {

      return {
        main: "No products",
        sub: "",
      };
    }

    const names =
      products
        .map(
          (product) =>
            product.name
        )
        .filter(
          Boolean
        );

    if (
      names.length ===
      1
    ) {

      return {
        main: names[0],
        sub: "1 item",
      };
    }

    if (
      names.length ===
      2
    ) {

      return {
        main: names.join(
          ", "
        ),
        sub: `${products.length} items`,
      };
    }

    return {
      main: `${names[0]}, ${names[1]} +${
        names.length - 2
      } more`,

      sub: `${products.length} items`,
    };
  };

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

        if (!user) {

          setOrders([]);

          return;
        }

        const farmerId =
          user.uid ||
          user.userId ||
          user.id;

        if (!farmerId) {

          setOrders([]);

          return;
        }

        const data =
          await getFarmerOrders(
            farmerId
          );

        setOrders(data);

      } catch (error) {

        console.log(
          "FETCH FARMER ORDERS ERROR:",
          error
        );

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
    activeFilter ===
      "All"
      ? orders
      : orders.filter(
          (o) =>
            o.status ===
            activeFilter
        );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "accepted": return "Accepted";
      case "processing": return "Processing";
      case "to_receive": return "To Receive";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      case "All": return "All";
      default: return status;
    }
  };

  // ================= STATUS COLOR =================
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

      case "accepted":
        return {
          text: "#1D4ED8",
          border: "#60A5FA",
          bg: "#DBEAFE",
        };

      case "processing":
        return {
          text: "#166534",
          border: "#15803D",
          bg: "#DCFCE7",
        };

      case "to_receive":
        return {
          text: "#7C3AED",
          border: "#8B5CF6",
          bg: "#EDE9FE",
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

        <Text className="text-green-700 mt-3 font-semibold">
          Loading orders...
        </Text>

      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">

      {/* ================= HEADER ================= */}
      <View className="pt-16 px-5 pb-5">

        <Text className="text-white text-3xl font-bold">
          Orders
        </Text>

      </View>

      {/* ================= BODY ================= */}
      <View className="flex-1 bg-white rounded-t-[40px] p-5">

        {/* ================= FILTERS ================= */}
        <View className="mb-4">

          <FlatList
            data={filters}
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            keyExtractor={(item) =>
              item
            }
            contentContainerStyle={{
              paddingRight: 20,
            }}
            renderItem={({
              item,
            }) => {

              const isActive =
                activeFilter ===
                item;

              return (
                <TouchableOpacity
                  onPress={() =>
                    setActiveFilter(
                      item
                    )
                  }
                  className={`mr-3 px-5 py-2 rounded-full items-center justify-center ${
                    isActive
                      ? "bg-green-700"
                      : "bg-gray-200"
                  }`}
                  style={{
                    minWidth: 90,
                  }}
                >

                  <Text
                    className={`font-semibold text-sm ${
                      isActive
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {getStatusLabel(item)}
                  </Text>

                </TouchableOpacity>
              );
            }}
          />

        </View>

        {/* ================= LIST ================= */}
        <FlatList
          data={
            filteredOrders
          }

          keyExtractor={(
            item,
            index
          ) =>
            item.id ||
            `order-${index}`
          }

          showsVerticalScrollIndicator={
            false
          }

          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: 20,
            flexGrow:
              filteredOrders.length ===
              0
                ? 1
                : 0,
          }}

          ListEmptyComponent={
            <View className="items-center mt-24">

              <Ionicons
                name="receipt-outline"
                size={65}
                color="#D1D5DB"
              />

              <Text className="text-gray-500 mt-4">
                No orders found
              </Text>

            </View>
          }

          renderItem={({
            item,
          }) => {

            const statusColors =
              getStatusColor(
                item.status
              );

            const productSummary =
              getProductSummary(
                item
              );

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname:
                      "/farmer/orders/[id]",
                    params: {
                      id:
                        item.id ||
                        "",
                    },
                  })
                }
                className="bg-green-50 p-4 rounded-2xl mb-3 border border-green-100"
              >

                <View className="flex-row">

                  {/* ================= BUYER ICON ================= */}
                  <View className="w-12 h-12 rounded-full bg-green-400 justify-center items-center mr-3">

                    <Text className="text-white font-bold">

                      {item.buyerName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "B"}

                    </Text>

                  </View>

                  {/* ================= INFO ================= */}
                  <View className="flex-1">

                    {/* BUYER */}
                    <Text className="font-bold text-base text-gray-800">
                      {item.buyerName ||
                        "Buyer"}
                    </Text>

                    {/* PRODUCT */}
                    <Text
                      className="text-gray-700 font-semibold text-sm mt-1"
                      numberOfLines={
                        1
                      }
                    >
                      {
                        productSummary.main
                      }
                    </Text>

                    {/* ITEM COUNT */}
                    <Text className="text-gray-500 text-sm mt-1">
                      {
                        productSummary.sub
                      }
                    </Text>

                    {/* ORDER NUMBER */}
                    <Text className="text-green-700 text-xs font-semibold mt-1">
                      {item.orderNumber ||
                        `FG-${item.id}`}
                    </Text>

                    {/* DATE */}
                    <View className="flex-row items-center mt-1">

                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color="#6B7280"
                      />

                      <Text className="text-gray-500 text-xs ml-1">
                        {formatOrderDate(
                          item.createdAt
                        )}
                      </Text>

                    </View>

                    {/* TOTAL */}
                    <Text className="text-green-700 font-semibold text-sm mt-1">
                      ₱
                      {Number(
                        item.total
                      ).toFixed(2)}
                    </Text>

                    {item.status === "accepted" &&
                      item.payment === "gcash" &&
                      item.paymentStatus !== "paid" && (
                      <Text className="text-amber-600 text-xs font-semibold mt-1">
                        Waiting for GCash payment
                      </Text>
                    )}

                    {/* CANCEL REASON */}
                    {item.status ===
                      "cancelled" &&
                      item.cancelReason && (

                        <Text
                          className="text-gray-500 text-xs mt-1"
                          numberOfLines={
                            1
                          }
                        >
                          Reason:{" "}
                          {
                            item.cancelReason
                          }
                        </Text>

                    )}

                  </View>

                  {/* ================= RIGHT ================= */}
                  <View className="items-end ml-2">

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
                        {getStatusLabel(item.status)}
                      </Text>

                    </View>

                    {/* CHEVRON */}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#15803D"
                      style={{
                        marginTop: 12,
                      }}
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