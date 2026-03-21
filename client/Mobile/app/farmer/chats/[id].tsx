import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.8.11:5000";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  const reviews = [
    {
      id: "1",
      user: "Buyer12345",
      date: "2 months ago",
      rating: 5,
      comment: "Fresh and organic, highly recommend!",
    },
    {
      id: "2",
      user: "Buyer67890",
      date: "1 month ago",
      rating: 4,
      comment: "Good quality but a bit pricey.",
    },
  ];

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      const prod = data.find((p: any) => String(p.id) === String(id));
      setProduct(prod);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,       // product ID
          name: product.name,   // product name
          price: product.price, // product price
          image: product.image, // product image
          quantity: 1,          // default 1
          farmName: product.farmName, // used to group by farmer on backend
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        Alert.alert("Error", errData.message || "Failed to add to cart");
        return;
      }

      Alert.alert("Success", "Added to cart");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to add to cart. Check your connection.");
    }
  };

  const goToCheckout = () => {
    if (!product) return;
    router.push({
      pathname: "/buyer/checkout",
      params: { productId: product.id, quantity: 1 },
    });
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color="#16a34a"
        className="flex-1 justify-center items-center"
      />
    );

  if (!product) return <Text className="text-center mt-10">Product not found</Text>;

  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="bg-green-500 px-6 py-4 pt-16 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: product.image }}
        className="w-full h-80"
        resizeMode="cover"
      />

      {/* TAB SWITCH */}
      <View className="flex-row self-center bg-gray-100 rounded-full p-1 mt-2">
        <TouchableOpacity
          onPress={() => setActiveTab("details")}
          className={`px-6 py-2 rounded-full ${activeTab === "details" ? "bg-green-700" : ""}`}
        >
          <Text className={`font-semibold text-sm ${activeTab === "details" ? "text-white" : "text-gray-500"}`}>
            Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("reviews")}
          className={`px-6 py-2 rounded-full ${activeTab === "reviews" ? "bg-green-700" : ""}`}
        >
          <Text className={`font-semibold text-sm ${activeTab === "reviews" ? "text-white" : "text-gray-500"}`}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "details" && (
        <View className="p-4">
          <Text className="text-2xl font-bold">{product.name}</Text>
          <Text className="text-gray-500 mt-1">{product.farmName}</Text>
          <Text className="text-green-700 font-bold text-xl mt-2">{product.price}</Text>
          <Text className="text-gray-400 mt-1">{product.stock} available</Text>
          <Text className="mt-3 text-gray-600">{product.description}</Text>
        </View>
      )}

      {activeTab === "reviews" && (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
          renderItem={({ item }) => (
            <View className="bg-gray-100 rounded-xl p-4 mb-4">
              <Text className="font-bold">{item.user}</Text>
              <Text className="text-gray-400 text-sm">{item.date}</Text>
              <Text className="text-yellow-500 mt-1">{"⭐".repeat(item.rating)}</Text>
              <Text className="mt-2">{item.comment}</Text>
            </View>
          )}
        />
      )}

      {/* Bottom action bar */}
      <View className="absolute bottom-0 left-0 right-0 flex-row bg-white border-t border-gray-100 p-4 items-center">
        {/* Cart & Buy Now */}
        <View className="flex-row flex-1 ml-4 items-center">
          <TouchableOpacity
            onPress={addToCart}
            className="px-4 py-4 rounded-xl items-center justify-center bg-green-100"
          >
            <FontAwesome5 name="cart-plus" size={20} color="#16a34a" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToCheckout}
            className="flex-1 bg-green-800 py-4 rounded-xl items-center justify-center ml-3"
          >
            <Text className="text-white font-bold text-center">Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}