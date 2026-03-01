import { useCart } from "@/context/CartContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Cart() {
  const { cart, updateQty, removeItem, clearCart } = useCart();
  const tabBarHeight = useBottomTabBarHeight();

  const subTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee = cart.length > 0 ? 35 : 0;
  const total = subTotal + deliveryFee;

  return (
    <View className="flex-1 bg-gray-100">
      {/* HEADER */}
      <View className="bg-green-700 px-4 py-4 pt-10">
        <Text className="text-white text-2xl font-semibold">
          My Cart
        </Text>
      </View>

      {/* EMPTY STATE */}
      {cart.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">
            Cart is Empty
          </Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 260,
          }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-4 flex-row">
              {/* IMAGE */}
              <Image
                source={item.image}
                className="w-20 h-20 rounded-xl"
              />

              {/* DETAILS */}
              <View className="flex-1 ml-4">
                <Text className="font-bold">
                  {item.name}
                </Text>

                <Text className="text-green-700 mt-1 font-semibold">
                  ₱{item.price} x {item.quantity}
                </Text>

                <Text className="text-black font-bold mt-1">
                  ₱
                  {(item.price * item.quantity).toFixed(2)}
                </Text>

                {/* QUANTITY CONTROLS */}
                <View className="flex-row items-center mt-3">
                  <TouchableOpacity
                    onPress={() =>
                      updateQty(
                        item.id,
                        item.quantity - 1
                      )
                    }
                    className="bg-green-100 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Text className="text-green-700 font-bold">
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text className="mx-4 font-bold">
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      updateQty(
                        item.id,
                        item.quantity + 1
                      )
                    }
                    className="bg-green-700 w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Text className="text-white font-bold">
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* REMOVE BUTTON */}
              <TouchableOpacity
                onPress={() =>
                  removeItem(item.id)
                }
              >
                <Text className="text-red-500 text-xs">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ORDER SUMMARY */}
      {cart.length > 0 && (
        <View
          style={{ bottom: tabBarHeight }}
          className="absolute left-0 right-0 bg-white px-5 py-5 rounded-t-3xl shadow-lg"
        >
          <Text className="font-bold text-lg mb-3">
            Order Summary
          </Text>

          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-500">
              Sub Total
            </Text>
            <Text>
              ₱{subTotal.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">
              Delivery Fee
            </Text>
            <Text>
              ₱{deliveryFee.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-4">
            <Text className="font-bold">
              Total Amount
            </Text>
            <Text className="font-bold text-lg">
              ₱{total.toFixed(2)}
            </Text>
          </View>

          {/* CLEAR CART */}
          <TouchableOpacity
            onPress={clearCart}
            className="mb-3"
          >
            <Text className="text-red-500 text-center">
              Clear Cart
            </Text>
          </TouchableOpacity>

          {/* CHECKOUT BUTTON */}
          <TouchableOpacity
            onPress={() =>
              router.push("/buyer/checkout")
            }
            className="bg-green-700 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-lg">
              Check Out
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}