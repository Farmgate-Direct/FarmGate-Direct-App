import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getCartByBuyer,
  removeCartItem,
  updateCartQuantity,
} from "@/src/services/cartService";

import {
  groupCartByFarmer,
  FarmerCart,
} from "../../../utils/groupCartByFarmer";

import { CartItem } from "@/src/types/cart";

export default function Cart() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<FarmerCart[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set()
  );

  const [buyerId, setBuyerId] = useState("");

  // ================= LOAD CART =================
  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    try {
      setLoading(true);

      const userString = await AsyncStorage.getItem("user");

      if (!userString) {
        router.replace("../login");
        return;
      }

      const user = JSON.parse(userString);

      const uid = user.uid || user.userId || user.id;

      setBuyerId(uid);

      const items: CartItem[] = await getCartByBuyer(uid);

      const grouped = groupCartByFarmer(items);

      setCartItems(grouped);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  // ================= SELECT ITEM =================
  const toggleItemSelection = (docId: string) => {
    setSelectedItems((prev) => {
      const copy = new Set(prev);

      copy.has(docId)
        ? copy.delete(docId)
        : copy.add(docId);

      return copy;
    });
  };

  // ================= SELECT FARM =================
  const toggleFarmSelection = (farmerId: string) => {
    const farmProducts =
      cartItems
        .find((f) => f.farmerId === farmerId)
        ?.products.map((p) => p.docId!) || [];

    setSelectedItems((prev) => {
      const copy = new Set(prev);

      const allSelected = farmProducts.every((id) =>
        copy.has(id)
      );

      if (allSelected) {
        farmProducts.forEach((id) => copy.delete(id));
      } else {
        farmProducts.forEach((id) => copy.add(id));
      }

      return copy;
    });
  };

  // ================= UPDATE LOCAL QTY =================
  const updateLocalQty = (
    farmerId: string,
    docId: string,
    qty: number
  ) => {
    setCartItems((prev) =>
      prev.map((f) =>
        f.farmerId === farmerId
          ? {
              ...f,
              products: f.products.map((p) =>
                p.docId === docId
                  ? { ...p, quantity: qty }
                  : p
              ),
            }
          : f
      )
    );
  };

  // ================= INCREMENT =================
  const incrementQty = async (
    farmerId: string,
    docId: string
  ) => {
    const product = cartItems
      .find((f) => f.farmerId === farmerId)
      ?.products.find((p) => p.docId === docId);

    if (!product?.docId) return;

    const newQty = product.quantity + 1;

    updateLocalQty(farmerId, docId, newQty);

    try {
      await updateCartQuantity(product.docId, newQty);
    } catch {
      updateLocalQty(
        farmerId,
        docId,
        product.quantity
      );

      Alert.alert("Error updating quantity");
    }
  };

  // ================= DECREMENT =================
  const decrementQty = async (
    farmerId: string,
    docId: string
  ) => {
    const product = cartItems
      .find((f) => f.farmerId === farmerId)
      ?.products.find((p) => p.docId === docId);

    if (!product?.docId) return;

    if (product.quantity <= 1) {
      removeItem(farmerId, docId);
      return;
    }

    const newQty = product.quantity - 1;

    updateLocalQty(farmerId, docId, newQty);

    try {
      await updateCartQuantity(product.docId, newQty);
    } catch {
      updateLocalQty(
        farmerId,
        docId,
        product.quantity
      );

      Alert.alert("Error updating quantity");
    }
  };

  // ================= REMOVE ITEM =================
  const removeItem = async (
    farmerId: string,
    docId: string
  ) => {
    const product = cartItems
      .find((f) => f.farmerId === farmerId)
      ?.products.find((p) => p.docId === docId);

    if (!product?.docId) return;

    const backup = [...cartItems];

    setCartItems((prev) =>
      prev
        .map((f) =>
          f.farmerId === farmerId
            ? {
                ...f,
                products: f.products.filter(
                  (p) => p.docId !== docId
                ),
              }
            : f
        )
        .filter((f) => f.products.length > 0)
    );

    setSelectedItems((prev) => {
      const copy = new Set(prev);

      copy.delete(docId);

      return copy;
    });

    try {
      await removeCartItem(product.docId);
    } catch {
      setCartItems(backup);

      Alert.alert("Error removing item");
    }
  };

  // ================= TOTAL PRICE =================
  const totalPrice = cartItems.reduce((acc, farm) => {
    const farmTotal = farm.products.reduce((sum, p) => {
      if (selectedItems.has(p.docId!)) {
        return sum + p.price * p.quantity;
      }

      return sum;
    }, 0);

    return acc + farmTotal;
  }, 0);

  // ================= LOADING UI =================
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#16a34a"
        />
      </View>
    );
  }

  // ================= EMPTY =================
  if (cartItems.length === 0) {
    return (
      <Text className="text-center mt-10 text-gray-500">
        Your cart is empty
      </Text>
    );
  }

  // ================= UI =================
  return (
    <View className="flex-1 bg-white">

      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text className="text-white font-bold text-lg ml-4">
          My Cart
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={cartItems}
        keyExtractor={(f) => f.farmerId}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 110,
        }}
        renderItem={({ item: farm }) => (
          <View className="mb-6">

            {/* FARM HEADER */}
            <View className="flex-row items-center mb-2">

              <TouchableOpacity
                onPress={() =>
                  toggleFarmSelection(farm.farmerId)
                }
                className="w-6 h-6 border-2 border-gray-400 rounded-full justify-center items-center mr-3"
              >
                {farm.products.every((p) =>
                  selectedItems.has(p.docId!)
                ) && (
                  <View className="w-4 h-4 bg-green-500 rounded-full" />
                )}
              </TouchableOpacity>

              <Text className="font-bold text-lg">
                {farm.farmName}
              </Text>
            </View>

            {/* PRODUCTS */}
            {farm.products.map((p) => (
              <View
                key={p.docId}
                className="flex-row bg-gray-100 rounded-xl p-4 mb-4 items-center h-32"
              >

                {/* SELECT */}
                <TouchableOpacity
                  onPress={() =>
                    toggleItemSelection(p.docId!)
                  }
                  className="w-6 h-6 border-2 border-gray-400 rounded-full justify-center items-center mr-3"
                >
                  {selectedItems.has(p.docId!) && (
                    <View className="w-4 h-4 bg-green-500 rounded-full" />
                  )}
                </TouchableOpacity>

                {/* IMAGE */}
                <View className="bg-gray-200 rounded-lg w-24 h-full justify-center items-center">
                  <Image
                    source={{ uri: p.image }}
                    className="w-full h-full rounded-lg"
                    resizeMode="contain"
                  />
                </View>

                {/* INFO */}
                <View className="flex-1 ml-4 justify-center">

                  <Text className="font-bold text-lg">
                    {p.name}
                  </Text>

                  <Text className="text-green-700 font-semibold mt-1">
                    ₱{p.price.toFixed(2)}
                  </Text>

                  {/* QUANTITY */}
                  <View className="flex-row mt-2 items-center">

                    <TouchableOpacity
                      onPress={() =>
                        decrementQty(
                          farm.farmerId,
                          p.docId!
                        )
                      }
                      className="bg-gray-300 px-2 py-1 rounded"
                    >
                      <Text>-</Text>
                    </TouchableOpacity>

                    <Text className="mx-3">
                      {p.quantity}{p.unit}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        incrementQty(
                          farm.farmerId,
                          p.docId!
                        )
                      }
                      className="bg-gray-300 px-2 py-1 rounded"
                    >
                      <Text>+</Text>
                    </TouchableOpacity>

                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      {/* TOTAL */}
      <View className="absolute bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-4 flex-row items-center">

        <View className="flex-1">
          <Text className="text-lg font-bold">
            Total: ₱{totalPrice.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (!buyerId) {
              Alert.alert(
                "Error",
                "Buyer not logged in"
              );
              return;
            }

            if (selectedItems.size === 0) {
              Alert.alert(
                "Select items",
                "Please select at least one item to checkout"
              );

              return;
            }

            const itemsToCheckout = cartItems
              .map((farm) => ({
                farmerId: farm.farmerId,
                farmName: farm.farmName,
                products: farm.products.filter((p) =>
                  selectedItems.has(p.docId!)
                ),
              }))
              .filter((f) => f.products.length > 0);

            router.push({
              pathname: "/buyer/checkout",
              params: {
                items: JSON.stringify(
                  itemsToCheckout
                ),
                buyerId,
              },
            });
          }}
          className="bg-green-700 px-6 py-3 rounded-xl ml-4"
        >
          <Text className="text-white font-bold">
            Checkout
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}