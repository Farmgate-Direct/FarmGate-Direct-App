import { CartProvider } from "@/context/CartContext";
import { Stack } from "expo-router";
import "./global.css";
import { ToastProvider } from "@/context/ToastContext";

export default function RootLayout() {
  return (
    <ToastProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register"/>
          <Stack.Screen name="buyer/(tabs)" />
          <Stack.Screen name="farmer/(tabs)" />
          <Stack.Screen name="products/[id]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="buyer/cart/myCart" />
        </Stack>
      </CartProvider>
    </ToastProvider>
  );
}
