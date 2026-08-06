import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../../FirebaseConfig";

import RateOrderModal from "./RateOrderModal";
import { OrderType, OrderProduct } from "@/src/types/order";

export default function OrderDetails() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);

  const [buyerId, setBuyerId] = useState("");
  const [buyerName, setBuyerName] = useState("");

  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);

  // ================= FETCH ORDER =================
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId as string));

        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() } as OrderType);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, []);

  // ================= LOAD BUYER (para sa Rate modal) =================
  useEffect(() => {
    const loadBuyer = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);
        setBuyerId(user.uid || user.userId || user.id || "");
        setBuyerName(user.fullName || user.name || "");
      } catch (error) {
        console.log(error);
      }
    };
    loadBuyer();
  }, []);

  // ================= STATUS COLOR =================
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#D97706";
      case "processing":
        return "#15803D";
      case "delivered":
        return "#2563EB";
      case "cancelled":
        return "#6B7280";
      default:
        return "#374151";
    }
  };

  // ================= RATE FLOW =================
  const openRateModal = (product: OrderProduct) => {
    setSelectedProduct(product);
    setShowRateModal(true);
  };

  // Pagkatapos ma-submit ang review, i-update ang LOCAL na order state
  // (markahan ang product na "reviewed") - para agad mawala ang "Rate"
  // button nang hindi na kailangang mag-refetch ng buong order.
  const handleReviewSubmitted = (productId: string) => {
    setOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.productId === productId ? { ...p, reviewed: true } : p
        ),
      };
    });
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#15803D" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">
      {/* HEADER */}
      <View className="pt-16 px-5 pb-5 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold ml-4">Order Details</Text>
      </View>

      {/* BODY */}
      <ScrollView className="flex-1 bg-white rounded-t-[40px] p-5">
        {/* FARM */}
        <View className="bg-green-50 p-5 rounded-2xl mb-4">
          <Text className="text-gray-500 mb-1">Farm</Text>
          <Text className="text-xl font-bold text-green-700">{order.farmName}</Text>
        </View>

        {/* STATUS */}
        <View className="bg-gray-50 p-5 rounded-2xl mb-4">
          <Text className="text-gray-500 mb-2">Status</Text>
          <Text
            style={{ color: getStatusColor(order.status) }}
            className="font-bold text-lg uppercase"
          >
            {order.status}
          </Text>
        </View>

        {/* PRODUCTS */}
        <View className="bg-gray-50 p-5 rounded-2xl mb-4">
          <Text className="text-lg font-bold mb-4">Products</Text>

          <FlatList
            data={order.products || []}
            scrollEnabled={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => {
              // "Rate" ay lumalabas LANG kapag "delivered" na ang buong
              // order AT hindi pa na-review ang product line na ito -
              // isang order kasi ay puwedeng maraming produkto, bawat
              // isa'y hiwalay na dapat i-rate.
              const canRate = order.status === "delivered" && !item.reviewed;

              return (
                <View className="mb-4">
                  <View className="flex-row items-center">
                    {/* IMAGE */}
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        className="w-16 h-16 rounded-xl mr-3"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-xl bg-green-100 justify-center items-center mr-3">
                        <Ionicons name="leaf" size={24} color="#15803D" />
                      </View>
                    )}

                    {/* INFO */}
                    <View className="flex-1">
                      <Text className="font-bold text-base">{item.name}</Text>
                      <Text className="text-gray-500">Qty: {item.quantity}</Text>
                    </View>

                    {/* PRICE */}
                    <Text className="font-bold text-green-700">₱{item.price}</Text>
                  </View>

                  {/* RATE BUTTON / REVIEWED BADGE */}
                  {canRate && (
                    <TouchableOpacity
                      onPress={() => openRateModal(item)}
                      className="mt-2 self-start bg-amber-100 px-4 py-2 rounded-xl flex-row items-center"
                    >
                      <Ionicons name="star-outline" size={14} color="#b45309" />
                      <Text className="text-amber-700 font-semibold text-xs ml-1">
                        Rate this product
                      </Text>
                    </TouchableOpacity>
                  )}

                  {order.status === "delivered" && item.reviewed && (
                    <View className="mt-2 self-start bg-green-100 px-4 py-2 rounded-xl flex-row items-center">
                      <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                      <Text className="text-green-700 font-semibold text-xs ml-1">
                        Reviewed
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>

        {/* TOTAL */}
        <View className="bg-green-50 p-5 rounded-2xl mb-10">
          <Text className="text-gray-500 mb-1">Total Amount</Text>
          <Text className="text-3xl font-bold text-green-700">₱{order.total}</Text>
        </View>
      </ScrollView>

      <RateOrderModal
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        orderId={order.id || (orderId as string)}
        product={selectedProduct}
        buyerId={buyerId}
        buyerName={buyerName}
        onSubmitted={handleReviewSubmitted}
      />
    </View>
  );
}