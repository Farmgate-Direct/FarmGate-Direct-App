import { useCart } from "@/context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Checkout() {
  const { cart } = useCart();
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [payment, setPayment] = useState<"qr" | "cod">("qr");

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = delivery === "delivery" ? 35 : 0;
  const total = subTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-gray-400 text-lg">Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-10 pb-4 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-semibold">Checkout</Text>
      </View>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Cart Items */}
        <Text className="font-semibold text-base mt-4 mb-2">Items in your cart</Text>
        {cart.map(item => (
          <View key={item.id} className="flex-row bg-white p-3 rounded-xl mb-3">
            <Image source={item.image} className="w-16 h-16 rounded-lg" />
            <View className="flex-1 ml-3">
              <Text className="font-semibold">{item.name}</Text>
              <Text className="text-xs text-gray-500">₱{item.price.toFixed(2)} / kg</Text>
              <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</Text>
            </View>
            <Text className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        {/* Delivery Options */}
        <Text className="font-semibold text-base mt-4 mb-2">Delivery Options</Text>
        <TouchableOpacity
          onPress={() => setDelivery("pickup")}
          className={`flex-row items-center bg-white p-4 rounded-xl mb-3 ${delivery === "pickup" ? "border border-green-700" : ""}`}
        >
          <Ionicons name="leaf-outline" size={22} color="#15803d" />
          <View className="flex-1 ml-3">
            <Text className="font-semibold">Farm Pickup</Text>
            <Text className="text-xs text-gray-500">Green Valley Farm • Tublacan</Text>
          </View>
          <Text className="text-green-700 font-semibold">Free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setDelivery("delivery")}
          className={`flex-row items-center bg-white p-4 rounded-xl mb-4 ${delivery === "delivery" ? "border border-green-700" : ""}`}
        >
          <Ionicons name="car-outline" size={22} color="#15803d" />
          <View className="flex-1 ml-3">
            <Text className="font-semibold">Schedule Delivery</Text>
            <Text className="text-xs text-gray-500">Today</Text>
          </View>
          <Text className="font-semibold">₱35.00</Text>
        </TouchableOpacity>

        {/* Payment */}
        <Text className="font-semibold text-base mb-2">Payment Method</Text>
        <TouchableOpacity
          onPress={() => setPayment("qr")}
          className={`flex-row items-center bg-white p-4 rounded-xl mb-3 ${payment === "qr" ? "border border-green-700" : ""}`}
        >
          <Ionicons name="qr-code-outline" size={22} />
          <Text className="ml-3 font-semibold">Gcash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPayment("cod")}
          className={`flex-row items-center bg-white p-4 rounded-xl mb-4 ${payment === "cod" ? "border border-green-700" : ""}`}
        >
          <Ionicons name="cash-outline" size={22} />
          <Text className="ml-3 font-semibold">Cash on Delivery</Text>
        </TouchableOpacity>

        {/* Order Summary */}
        <Text className="font-semibold text-base mb-2">Order Summary</Text>
        <View className="bg-white rounded-xl p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Sub Total</Text>
            <Text>₱{subTotal.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text>₱{deliveryFee.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="font-bold text-base">Total Amount</Text>
            <Text className="font-bold text-base">₱{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Place Order */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-4">
        <TouchableOpacity
          disabled={cart.length === 0}
          onPress={() =>
            router.push({
              pathname: "/buyer/thankyou",
              params: {
                delivery,
                payment,
                subTotal: subTotal.toString(),
                deliveryFee: deliveryFee.toString(),
                total: total.toString(),
                cart: JSON.stringify(cart),
              },
            })
          }
          className={`py-4 rounded-xl ${cart.length === 0 ? "bg-gray-300" : "bg-green-700"}`}
        >
          <Text className="text-white text-center font-bold text-lg">Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}