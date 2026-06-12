import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ProductType } from "@/src/types/product";
import { subscribeToProducts } from "@/src/services/productService";
import { addToCart } from "@/src/services/cartService";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Egg & Poultry", "Rice & Grains"];
const SORT_OPTIONS = [
  { label: "Default", icon: "apps-outline" },
  { label: "Highest Rated", icon: "star-outline" },
  { label: "Freshness", icon: "leaf-outline" },
  { label: "Best Selling", icon: "flame-outline" },
];

export default function Shop() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Default");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const [buyerId, setBuyerId] = useState("");
  const [buyerName, setBuyerName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setBuyerId(user.uid || user.userId || user.id);
        setBuyerName(user.fullName || user.name || "");
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        (item.category || "").trim().toLowerCase() === activeCategory.trim().toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Highest Rated": return (b.rating || 0) - (a.rating || 0);
        case "Freshness": return (b.createdAt || 0) - (a.createdAt || 0);
        case "Best Selling": return (b.totalSales || 0) - (a.totalSales || 0);
        default: return 0;
      }
    });

  const openModal = (product: ProductType) => {
    setSelectedProduct(product);
    setQuantity(1);
    setModalVisible(true);
  };

  const handleAddToCart = async () => {
    if (!buyerId) {
      Alert.alert("Sign in required", "Please log in to add items to your cart.");
      return;
    }
    if (!selectedProduct) return;
    setAddingToCart(true);
    try {
      await addToCart({
        buyerId,
        buyerName,
        productId: selectedProduct.docId!,
        farmerId: selectedProduct.farmerId,
        farmName: selectedProduct.farmName,
        name: selectedProduct.name,
        image: selectedProduct.image,
        price: selectedProduct.price,
        quantity,
        unit: selectedProduct.unit,
        createdAt: Date.now(),
      });
      setModalVisible(false);
      Alert.alert("Added to cart!", `${selectedProduct.name} is ready for checkout.`);
    } catch {
      Alert.alert("Error", "Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#15803d" />
        <Text className="mt-3 text-green-700 font-semibold text-sm">
          Loading products…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0fdf4]">
      <StatusBar barStyle="light-content" backgroundColor="#14532d" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#14532d", "#166534", "#15803d"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-b-[32px] pt-14 pb-6 px-5"
      >
        {/* Decorative accent */}
        <View className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />

        <Text className="text-white text-2xl font-black tracking-wide mb-4">
          Shop
        </Text>

        {/* Search bar */}
        <View
          className="flex-row items-center bg-white rounded-2xl px-4 py-3"
          style={{ elevation: 2 }}
        >
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search products or farms…"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2.5 text-gray-800 text-sm"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── CATEGORY PILLS ── */}
      <View className="mt-4 px-4">
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = activeCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                className={`px-4 py-2 rounded-full ${active ? "bg-green-700" : "bg-white"}`}
                style={{
                  elevation: active ? 4 : 1,
                  shadowColor: active ? "#15803d" : "#000",
                  shadowOpacity: active ? 0.2 : 0.05,
                  shadowRadius: 4,
                  borderWidth: active ? 0 : 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── SORT OPTIONS ── */}
      <View className="mt-2.5 px-4">
        <FlatList
          horizontal
          data={SORT_OPTIONS}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = sortBy === item.label;
            return (
              <TouchableOpacity
                onPress={() => setSortBy(item.label)}
                className={`flex-row items-center px-3 py-1.5 rounded-full gap-1.5 ${
                  active ? "bg-amber-500" : "bg-white"
                }`}
                style={{
                  elevation: active ? 3 : 1,
                  borderWidth: active ? 0 : 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={12}
                  color={active ? "white" : "#6b7280"}
                />
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-500"}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── RESULTS COUNT ── */}
      <View className="flex-row justify-between items-center px-4 mt-3 mb-1">
        <Text className="text-gray-500 text-xs">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
        </Text>
        {searchQuery.length > 0 && (
          <Text className="text-green-700 text-xs font-semibold">
            Results for "{searchQuery}"
          </Text>
        )}
      </View>

      {/* ── PRODUCT GRID ── */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => item.docId ?? index.toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 120 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-5xl mb-3">🌿</Text>
            <Text className="text-gray-600 font-bold text-base">No products found</Text>
            <Text className="text-gray-400 text-sm mt-1">Try a different search or category</Text>
          </View>
        }
        renderItem={({ item }) => <ShopProductCard item={item} onAddToCart={openModal} router={router} />}
      />

      {/* ── ADD TO CART MODAL ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />

        <View className="bg-white rounded-t-[32px] px-6 pt-3 pb-10">
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

          {/* Product row */}
          <View className="flex-row gap-4 mb-5">
            <View
              style={{ width: 88, height: 88, borderRadius: 16, overflow: "hidden", backgroundColor: "#f3f4f6" }}
            >
              {selectedProduct?.image ? (
                <Image
                  source={selectedProduct.image}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 bg-gray-100 items-center justify-center">
                  <Ionicons name="leaf-outline" size={28} color="#86efac" />
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text className="font-black text-gray-900 text-base" numberOfLines={2}>
                {selectedProduct?.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="location-outline" size={11} color="#15803d" />
                <Text className="text-green-700 text-xs font-semibold">
                  {selectedProduct?.farmName}
                </Text>
              </View>
              <Text className="text-green-700 font-black text-lg mt-1.5">
                ₱{Number(selectedProduct?.price).toFixed(2)}{" "}
                <Text className="text-gray-400 text-xs font-normal">
                  / {selectedProduct?.unit}
                </Text>
              </Text>
              <View className="flex-row items-center gap-3 mt-1">
                <Text className="text-xs text-gray-400">
                  {selectedProduct?.stock} {selectedProduct?.unit} available
                </Text>
                {(selectedProduct?.rating || 0) > 0 && (
                  <Text className="text-xs text-amber-500 font-bold">
                    ⭐ {selectedProduct?.rating?.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-100 mb-4" />

          {/* Quantity */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-700 font-semibold">Quantity</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                className="bg-gray-100 w-10 h-10 rounded-2xl items-center justify-center"
              >
                <Ionicons name="remove" size={18} color="#374151" />
              </TouchableOpacity>
              <Text className="font-black text-lg w-7 text-center text-gray-900">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setQuantity((q) => Math.min(selectedProduct?.stock ?? 99, q + 1))
                }
                className="bg-green-700 w-10 h-10 rounded-2xl items-center justify-center"
              >
                <Ionicons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtotal */}
          <View className="flex-row justify-between items-center bg-green-50 rounded-2xl px-4 py-3 mb-5">
            <Text className="text-gray-500 font-medium">Subtotal</Text>
            <Text className="font-black text-green-700 text-xl">
              ₱{(Number(selectedProduct?.price) * quantity).toFixed(2)}
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={addingToCart}
            className="bg-green-700 rounded-2xl py-4 items-center"
            style={{ elevation: 4, shadowColor: "#15803d", shadowOpacity: 0.3, shadowRadius: 8 }}
            activeOpacity={0.85}
          >
            {addingToCart ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="cart-outline" size={20} color="white" />
                <Text className="text-white font-black text-base">Add to Cart</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ── PRODUCT CARD (inline) ──
function ShopProductCard({
  item,
  onAddToCart,
  router,
}: {
  item: ProductType;
  onAddToCart: (item: ProductType) => void;
  router: any;
}) {
  const isNew = Date.now() - item.createdAt < 1000 * 60 * 60 * 24 * 7;
  const isBestSeller = (item.totalSales || 0) >= 10;
  const hasRating = (item.rating || 0) > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() =>
        router.push({ pathname: "/buyer/products/[id]", params: { id: item.docId ?? "" } })
      }
      className="bg-white rounded-3xl mb-4 overflow-hidden"
      style={{
        width: "48%",
        elevation: 3,
        shadowColor: "#14532d",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* Image */}
      <View style={{ height: 140, backgroundColor: "#f0fdf4" }}>
        {item.image ? (
          <Image
            source={item.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={40} color="#86efac" />
          </View>
        )}

        {/* Top badges */}
        <View className="absolute top-2 left-2 gap-1">
          {isNew && (
            <View className="bg-green-500 px-2 py-0.5 rounded-full flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-white" />
              <Text className="text-white text-[10px] font-bold">Fresh</Text>
            </View>
          )}
          {isBestSeller && (
            <View className="bg-red-500 px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-bold">🔥 Top Pick</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View className="p-3">
        <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
          {item.name}
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/buyer/farm/[farmerId]", params: { farmerId: item.farmerId } })
          }
          className="flex-row items-center mt-0.5 gap-1"
        >
          <Ionicons name="location-outline" size={10} color="#15803d" />
          <Text className="text-[11px] text-green-700 font-semibold" numberOfLines={1}>
            {item.farmName}
          </Text>
        </TouchableOpacity>

        {hasRating && (
          <View className="flex-row items-center mt-1 gap-1">
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text className="text-[11px] text-amber-600 font-bold">
              {item.rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-gray-400">
              · {item.totalSales || 0} sold
            </Text>
          </View>
        )}

        <View className="h-px bg-gray-100 my-2" />

        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="font-black text-green-700 text-base">
            ₱{Number(item.price).toFixed(2)}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {item.stock} {item.unit}
          </Text>
        </View>

        {/* Add to cart */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation();
            onAddToCart(item);
          }}
          className="bg-green-700 rounded-xl py-2 items-center flex-row justify-center gap-1.5"
        >
          <Ionicons name="cart-outline" size={14} color="white" />
          <Text className="text-white font-bold text-xs">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}