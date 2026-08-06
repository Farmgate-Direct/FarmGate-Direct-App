import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

import { createOrder } from "@/src/services/orderService";
import { removeCartItem } from "@/src/services/cartService";
import { recordSale } from "@/src/services/productService";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/FirebaseConfig";

export default function Checkout() {
  const { buyerId, items } = useLocalSearchParams();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [buyerName, setBuyerName] = useState<string | null>(null);

  // ================= ADDRESS =================
  const [address, setAddress] = useState<any>(null);

  // ================= DELIVERY / PAYMENT =================
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [payment, setPayment] = useState<"qr" | "cod">("qr");

  // ================= PICKUP =================
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [dateObj, setDateObj] = useState(new Date());
  const [timeObj, setTimeObj] = useState(new Date());

  // ================= CART LOAD =================
  useEffect(() => {
    if (items) {
      setCart(JSON.parse(items as string));
    }
  }, []);

  // ================= USER + ADDRESS (FIXED AUTO REFRESH) =================
  useFocusEffect(
    useCallback(() => {
      const loadUserAndAddress = async () => {
        try {
          const userString = await AsyncStorage.getItem("user");
          if (!userString) return;

          const user = JSON.parse(userString);
          const uid = user.uid || user.userId || user.id;

          setBuyerName(user.fullName);

          const q = query(
            collection(db, "addresses"),
            where("userId", "==", uid),
            where("isDefault", "==", true)
          );

          const snap = await getDocs(q);

          if (!snap.empty) {
            setAddress({
              id: snap.docs[0].id,
              ...snap.docs[0].data(),
            });
          } else {
            setAddress(null);
          }
        } catch (error) {
          console.log(error);
        }
      };

      loadUserAndAddress();
    }, [])
  );

  // ================= DATE =================
  const onDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      setPickupDate(selectedDate.toLocaleDateString());
    }
  };

  // ================= TIME =================
  const onTimeChange = (event: any, selectedTime: any) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTimeObj(selectedTime);
      setPickupTime(
        selectedTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  // ================= TOTAL =================
  const subTotal = cart.reduce((sum, farm) => {
    return (
      sum +
      farm.products.reduce(
        (pSum: number, p: any) =>
          pSum + Number(p.price) * p.quantity,
        0
      )
    );
  }, 0);

  const deliveryFee = delivery === "delivery" ? 35 : 0;
  const total = subTotal + deliveryFee;

  // ================= PLACE ORDER =================
  // Bago i-create ang order, tinatawag muna ang recordSale() para sa
  // BAWAT product - ito ang nagbabawas ng stock gamit ang FIFO (pinaka-
  // matandang batch/harvest record muna), at nagbabalik ng
  // "contributions" (batchId + harvestRecordId + quantity) na dapat
  // maka-store sa order para may traceability (item 7-8 ng spec).
  // NOTE: hindi na dapat ginagamit ang batchId na naka-store sa cart
  // item, dahil pwedeng nagbago na ang "current" FIFO batch (naubos na,
  // nasa bagong linggo na, atbp) - laging kukunin ng recordSale() ang
  // pinaka-totoong FIFO batch sa oras mismo ng pag-order.
  const placeOrder = async () => {
    if (!buyerId) return Alert.alert("Error", "Buyer not found");
    if (!address) return Alert.alert("Error", "No address selected");

    if (delivery === "pickup" && (!pickupDate || !pickupTime)) {
      return Alert.alert("Error", "Select pickup date/time");
    }

    setLoading(true);

    try {
      for (const farm of cart) {
        const farmTotal = farm.products.reduce(
          (sum: number, p: any) =>
            sum + Number(p.price) * p.quantity,
          0
        );

        // I-bawas ang stock (FIFO) para sa bawat product BAGO i-save ang
        // order, at kunin ang batch/harvest traceability info.
        const productsWithTrace = await Promise.all(
          farm.products.map(async (p: any) => {
            const { contributions } = await recordSale(
              p.productId,
              Number(p.quantity)
            );
            const primary = contributions[0] || null;

            return {
              productId: p.productId,
              batchId: primary?.batchId ?? null,
              batchNumber: primary?.batchNumber ?? null,
              harvestRecordId: primary?.harvestRecordId ?? null,
              // Buong breakdown kung sakaling mula sa higit sa isang
              // batch/harvest record ang quantity na na-order (ex.
              // naubos ang isang batch sa gitna ng pag-order).
              contributions,
              name: p.name,
              image: p.image,
              price: Number(p.price),
              quantity: Number(p.quantity),
              unit: p.unit,
            };
          })
        );

        await createOrder({
          buyerId: buyerId as string,
          buyerName: buyerName || "",
          farmerId: farm.farmerId,
          farmName: farm.farmName,

          products: productsWithTrace,

          delivery,
          payment,
          address,

          pickupDate: delivery === "pickup" ? pickupDate : null,
          pickupTime: delivery === "pickup" ? pickupTime : null,

          subTotal: farmTotal,
          deliveryFee,
          total: farmTotal + deliveryFee,

          status: "pending",
        });

        for (const product of farm.products) {
          if (product.docId) {
            await removeCartItem(product.docId);
          }
        }
      }

      Alert.alert("Success", "Order placed successfully");

      router.replace({
        pathname: "/buyer/checkout/thankyou",
        params: {
          delivery,
          payment,
          subTotal,
          deliveryFee,
          total,

          fullName: address.fullName,
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          phone: address.phone,

          pickupDate,
          pickupTime,
        },
      });
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  if (cart.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No items</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">

      {/* HEADER */}
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>

        <Text className="ml-3 text-lg font-semibold">
          Checkout
        </Text>
      </View>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>

        {/* ADDRESS */}
        <View className="bg-white p-4 rounded-xl mt-4">
          <Text className="font-bold mb-2">Delivery Address</Text>

          {address ? (
            <>
              <Text className="font-semibold">{address.fullName}</Text>
              <Text>{address.street}, {address.barangay}</Text>
              <Text>{address.city}, {address.province}</Text>
              <Text>{address.phone}</Text>
            </>
          ) : (
            <Text className="text-red-500">No default address</Text>
          )}

          <TouchableOpacity
            onPress={() => router.push("/buyer/profile/address")}
            className="mt-3 bg-green-700 p-2 rounded-lg"
          >
            <Text className="text-white text-center">Change Address</Text>
          </TouchableOpacity>
        </View>

        {/* ITEMS */}
        <Text className="font-bold mt-4">Items</Text>

        {cart.map((farm: any) =>
          farm.products.map((p: any) => (
            <View key={p.docId} className="flex-row bg-white p-3 rounded-xl mt-2">
              <Image source={{ uri: p.image }} className="w-16 h-16 rounded-lg" />

              <View className="flex-1 ml-3">
                <Text className="font-semibold">{p.name}</Text>
                <Text>₱{p.price}</Text>
                <Text>Qty: {p.quantity}</Text>
              </View>

              <Text>₱{(p.price * p.quantity).toFixed(2)}</Text>
            </View>
          ))
        )}

        {/* DELIVERY */}
        <Text className="font-bold mt-4">Delivery</Text>

        <TouchableOpacity
          onPress={() => setDelivery("pickup")}
          className={`bg-white p-4 mt-2 rounded-xl border ${delivery === "pickup" ? "border-green-700" : "border-gray-200"
            }`}
        >
          <Text>Farm Pickup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setDelivery("delivery")}
          className={`bg-white p-4 mt-2 rounded-xl border ${delivery === "delivery" ? "border-green-700" : "border-gray-200"
            }`}
        >
          <Text>Delivery (+₱35)</Text>
        </TouchableOpacity>

        {/* PICKUP UI */}
        {delivery === "pickup" && (
          <View className="bg-white p-4 rounded-xl mt-2">

            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="p-3 bg-gray-100 rounded-lg mb-2">
              <Text>{pickupDate || "Select Date"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowTimePicker(true)} className="p-3 bg-gray-100 rounded-lg">
              <Text>{pickupTime || "Select Time"}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker value={dateObj} mode="date" onChange={onDateChange} />
            )}

            {showTimePicker && (
              <DateTimePicker value={timeObj} mode="time" onChange={onTimeChange} />
            )}

          </View>
        )}

        {/* PAYMENT */}
        <Text className="font-bold mt-4">Payment</Text>

        <TouchableOpacity
          onPress={() => setPayment("qr")}
          className={`bg-white p-4 mt-2 rounded-xl border ${payment === "qr" ? "border-green-700" : "border-gray-200"
            }`}
        >
          <Text>GCash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPayment("cod")}
          className={`bg-white p-4 mt-2 rounded-xl border ${payment === "cod" ? "border-green-700" : "border-gray-200"
            }`}
        >
          <Text>Cash on Delivery</Text>
        </TouchableOpacity>

        {/* SUMMARY */}
        <View className="bg-white p-4 rounded-xl mt-4">
          <Text>Subtotal: ₱{subTotal.toFixed(2)}</Text>
          <Text>Delivery: ₱{deliveryFee.toFixed(2)}</Text>
          <Text className="font-bold mt-2">Total: ₱{total.toFixed(2)}</Text>
        </View>

      </ScrollView>

      {/* PLACE ORDER */}
      <View className="bg-white p-4">
        <TouchableOpacity
          onPress={placeOrder}
          disabled={loading}
          className="bg-green-700 p-4 rounded-xl"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold">
              Place Order
            </Text>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}