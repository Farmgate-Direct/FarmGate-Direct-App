import { Ionicons } from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addProductSales,
} from "@/src/services/productService";

import {
  getOrderById,
  updateOrderStatus,
} from "@/src/services/orderService";

export default function OrderDetails() {

  const router = useRouter();

  const { id } =
    useLocalSearchParams();

  const [order, setOrder] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  // ================= LOAD =================
  const loadOrder =
    async () => {

      try {

        if (!id) return;

        const data =
          await getOrderById(
            String(id)
          );

        setOrder(data);

      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Failed to load order"
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    loadOrder();
  }, []);

  // ================= UPDATE =================
  const handleStatusChange = async (
    status: string
  ) => {
    try {
      setLoading(true);

      // Update sales only once
      if (
        status === "delivered" &&
        order.status !== "delivered"
      ) {
        console.log(
          "Products:",
          JSON.stringify(
            order.products,
            null,
            2
          )
        );

        for (const product of order.products) {
          console.log(
            "Updating product:",
            product.productId,
            "Quantity:",
            product.quantity
          );

          await addProductSales(
            product.productId,
            product.quantity
          );
        }
      }

      await updateOrderStatus(
        order.id,
        status
      );

      await loadOrder();

      Alert.alert(
        "Success",
        `Order ${status}`
      );
    } catch (error) {
      console.log(
        "STATUS CHANGE ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to update order"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {

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
      <View className="flex-row items-center pt-16 px-5 pb-5">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <View className="ml-4 flex-1">

          <Text className="text-white text-2xl font-bold">
            {order.buyerName}
          </Text>

          <Text className="text-green-100">
            Order #{order.id}
          </Text>

        </View>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[35px] p-5">

        <ScrollView>

          {/* PRODUCTS */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-4">
              Products
            </Text>

            {order.products?.map(
              (
                product: any,
                index: number
              ) => (

                <View
                  key={index}
                  className="flex-row justify-between mb-3"
                >

                  <View>

                    <Text className="font-semibold">
                      {product.name}
                    </Text>

                    <Text className="text-gray-500">
                      Qty:
                      {" "}
                      {product.quantity}
                    </Text>

                  </View>

                  <Text className="font-semibold text-green-700">
                    ₱
                    {(
                      product.price *
                      product.quantity
                    ).toFixed(2)}
                  </Text>

                </View>
              )
            )}

          </View>

          {/* DELIVERY */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-3">
              Delivery
            </Text>

            <Text>
              {order.delivery}
            </Text>

          </View>

          {/* PAYMENT */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-3">
              Payment
            </Text>

            <Text>
              {order.payment ===
                "qr"
                ? "GCash"
                : "Cash on Delivery"}
            </Text>

          </View>

          {/* TOTAL */}
          <View className="bg-gray-100 rounded-2xl p-4">

            <View className="flex-row justify-between">

              <Text className="font-bold text-lg">
                Total
              </Text>

              <Text className="font-bold text-lg text-green-700">
                ₱
                {Number(
                  order.total
                ).toFixed(2)}
              </Text>

            </View>

          </View>

        </ScrollView>

        {/* ACTIONS */}
        {order.status ===
          "pending" && (

            <View className="flex-row mt-4">

              <TouchableOpacity
                onPress={() =>
                  handleStatusChange(
                    "cancelled"
                  )
                }
                className="flex-1 border border-red-500 py-4 rounded-xl mr-2"
              >

                <Text className="text-red-500 text-center font-bold">
                  Decline
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  handleStatusChange(
                    "processing"
                  )
                }
                className="flex-1 bg-green-700 py-4 rounded-xl ml-2"
              >

                <Text className="text-white text-center font-bold">
                  Accept
                </Text>

              </TouchableOpacity>

            </View>
          )}
        {/* DELIVER BUTTON */}
        {order.status === "processing" && (

          <TouchableOpacity
            onPress={() =>
              handleStatusChange("delivered")
            }
            className="bg-blue-600 py-4 rounded-xl mt-4"
          >

            <Text className="text-white text-center font-bold">
              Mark as Delivered
            </Text>

          </TouchableOpacity>

        )}

      </View>
    </View>
  );
}