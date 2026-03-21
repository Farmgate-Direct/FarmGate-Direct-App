
import { ReviewItem } from "@/components/Reviews";
import { useCart } from "@/context/CartContext";
import QuantityModal from "@/components/QuantityModal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

/* ---------- IMAGE MAP ---------- */
const productImages: Record<string, any> = {
  "1": require("@/assets/images/tomato.jpg"),
  "2": require("@/assets/images/eggplant.jpg"),
  "3": require("@/assets/images/egg.jpg"),
  "4": require("@/assets/images/rice.jpg"),
  "5": require("@/assets/images/rice.jpg"),
  "6": require("@/assets/images/egg.jpg"),
  "7": require("@/assets/images/pumpkin.jpg"),
  "8": require("@/assets/images/banana.jpg"),
  "9": require("@/assets/images/orange.jpg"),
  "10": require("@/assets/images/okra.jpg"),
  "11": require("@/assets/images/tomato.jpg"),
  "12": require("@/assets/images/eggplant.jpg"),
  "13": require("@/assets/images/mango.jpg"),
  "14": require("@/assets/images/greengrape.jpg"),
};

export default function ProductDetails() {
  const router = useRouter();
  const { addToCart } = useCart();

  const { id, name, price, stock, rate, farm, category } =
    useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  const [showQtyModal, setShowQtyModal] = useState(false);

  const reviews = [
    {
      id: "1",
      user: "Buyer12345",
      date: "2 months ago",
      rating: 5,
      comment:
        "Prices are fair compared to the market, and the quality is even better.",
    },
    {
      id: "2",
      user: "Buyer12345",
      date: "2 months ago",
      rating: 5,
      comment: "Fresh and organic. Definitely worth the price. Will buy again.",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="bg-green-500 px-6 py-4 pt-16 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "reviews" ? reviews : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewItem item={item} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <>
            <View className="self-start bg-green-100 px-3 py-1 rounded-full mt-4">
              <Text className="text-green-700 text-xs font-semibold">
                {category}
              </Text>
            </View>

            <View className="-mx-4 mt-3 bg-white py-4">
              <Image
                source={productImages[String(id)]}
                style={{ width: "100%", height: 300, borderRadius: 10 }}
                resizeMode="cover"
              />
            </View>

            {/* TAB SWITCH */}
            <View className="flex-row self-center bg-gray-100 rounded-full p-1 mt-2">
              <TouchableOpacity
                onPress={() => setActiveTab("details")}
                className={`px-6 py-2 rounded-full ${
                  activeTab === "details" ? "bg-green-700" : ""
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    activeTab === "details" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("reviews")}
                className={`px-6 py-2 rounded-full ${
                  activeTab === "reviews" ? "bg-green-700" : ""
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    activeTab === "reviews" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "details" && (
              <>
                <Text className="text-2xl font-bold text-gray-900 mt-6">
                  {name}
                </Text>

                <Text className="text-gray-500 mt-1">
                  {farm}, Bulacan
                </Text>

                <View className="flex-row items-center mt-1">
                  <Text className="text-yellow-500 text-base">⭐⭐⭐⭐⭐</Text>
                  <Text className="text-gray-400 text-sm ml-2">
                    {rate} Rating
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mt-4">
                  <View className="bg-green-100 px-4 py-2 rounded-xl">
                    <Text className="text-green-700 font-bold text-lg">
                      {price}
                    </Text>
                  </View>

                  <View className="bg-green-600 px-4 py-2 rounded-xl">
                    <Text className="text-white font-semibold text-sm">
                      {stock}
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 mt-4 leading-6">
                  Grown naturally by local farmers. Our organic produce is
                  harvested fresh to ensure vibrant color, juicy texture, and
                  rich flavor.
                </Text>
              </>
            )}
          </>
        }
      />

      {/* ADD TO CART BUTTON */}
      <View className="absolute bottom-6 left-4 right-4">
        <TouchableOpacity
          onPress={() => setShowQtyModal(true)}
          className="bg-green-700 py-4 rounded-2xl"
        >
          <Text className="text-white text-center font-bold text-lg">
            Add to Cart
          </Text>
        </TouchableOpacity>
      </View>

      {/* QUANTITY MODAL */}
      <QuantityModal
        visible={showQtyModal}
        onClose={() => setShowQtyModal(false)}
        onConfirm={(qty) => {
          addToCart({
            id: String(id),
            name: String(name),
            image: productImages[String(id)],
            price: Number(String(price).replace(/[^0-9]/g, "")),
            quantity: qty,
          });

          setShowQtyModal(false);
        }}
      />
    </View>
  );
}