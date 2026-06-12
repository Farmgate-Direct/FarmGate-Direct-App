import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Categories from "@/components/Categories";
import ProductCard from "@/components/ProductCard";
import { images } from "@/constants/image";
import { ProductType } from "@/src/types/product";
import { subscribeToProducts } from "@/src/services/productService";

export default function Home() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const topCategory = useMemo(() => {
    if (!products.length) return "Vegetables";
    const counts: Record<string, number> = {};
    products.forEach((item) => {
      if (!item.category) return;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }, [products]);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (item) =>
            (item.category || "").trim().toLowerCase() ===
            selectedCategory.trim().toLowerCase()
        );

  const bestSeller = useMemo(() => {
    if (!products.length) return null;
    return [...products].sort(
      (a, b) => (b.weeklySales || 0) - (a.weeklySales || 0)
    )[0];
  }, [products]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#15803d" />
        <Text className="mt-3 text-green-700 font-semibold text-sm">
          Loading fresh produce…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0fdf4]">
      <StatusBar barStyle="light-content" backgroundColor="#14532d" />
      <Image source={images.bg} className="absolute w-full h-full z-0" />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => item.docId || index.toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 14,
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            {/* ── HERO HEADER ── */}
            <LinearGradient
              colors={["#14532d", "#166534", "#15803d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-b-[36px] pb-10 overflow-hidden"
            >
              {/* Decorative circle accents */}
              <View
                className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white"
              />
              <View
                className="absolute top-16 -left-8 w-28 h-28 rounded-full opacity-10 bg-green-300"
              />

              {/* Notification */}
              <TouchableOpacity
                className="absolute right-5 top-14 bg-white/20 p-2 rounded-full"
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color="white" />
              </TouchableOpacity>

              {/* Logo + Brand */}
              <View className="items-center mt-16 mb-1">
                <View className="bg-white/15 rounded-2xl p-2 mb-3">
                  <Image
                    source={require("../../../assets/Farmgate-logos/farmgate-logo.png")}
                    className="w-12 h-12"
                  />
                </View>
                <Text className="text-white font-black text-2xl tracking-widest">
                  FARMGATE DIRECT
                </Text>
                <Text className="text-green-200 text-xs font-medium mt-1 tracking-wide">
                  Farm-to-Table · Hyperlocal
                </Text>
              </View>
            </LinearGradient>

            {/* ── TOP CATEGORY PILL ── */}
            <View className="mx-4 -mt-5 z-10">
              <View className="bg-white rounded-2xl px-5 py-3.5 flex-row items-center shadow-sm"
                style={{ elevation: 4, shadowColor: "#14532d", shadowOpacity: 0.12, shadowRadius: 8 }}>
                <View className="bg-green-100 rounded-xl p-2 mr-3">
                  <Ionicons name="trending-up" size={18} color="#15803d" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Trending Category
                  </Text>
                  <Text className="text-green-800 font-bold text-base">
                    {topCategory}
                  </Text>
                </View>
                <View className="bg-green-50 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-bold">
                    #1 Pick
                  </Text>
                </View>
              </View>
            </View>

            {/* ── BEST SELLER CARD ── */}
            {bestSeller && (
              <View className="mx-4 mt-3">
                <LinearGradient
                  colors={["#b45309", "#d97706", "#f59e0b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-3xl p-4 overflow-hidden"
                  style={{ elevation: 5, shadowColor: "#b45309", shadowOpacity: 0.3, shadowRadius: 10 }}
                >
                  {/* Decorative blob */}
                  <View className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />

                  <View className="flex-row items-center">
                    <View className="relative">
                      {bestSeller.image ? (
                        <Image
                          source={{ uri: bestSeller.image }}
                          className="w-[88px] h-[88px] rounded-2xl"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-[88px] h-[88px] rounded-2xl bg-yellow-300/40" />
                      )}
                      <View className="absolute -top-2 -right-2 bg-white rounded-full px-1.5 py-0.5">
                        <Text className="text-base">🏆</Text>
                      </View>
                    </View>

                    <View className="flex-1 ml-4">
                      <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                        Best Seller This Week
                      </Text>
                      <Text
                        className="text-white font-black text-lg leading-tight"
                        numberOfLines={1}
                      >
                        {bestSeller.name}
                      </Text>
                      <Text className="text-yellow-100 text-xs mt-0.5">
                        {bestSeller.category}
                      </Text>

                      <View className="flex-row items-center mt-2 gap-3">
                        <View className="bg-white/20 rounded-xl px-3 py-1">
                          <Text className="text-white font-black text-base">
                            ₱{bestSeller.price}
                          </Text>
                        </View>
                        <Text className="text-yellow-100 text-xs">
                          {bestSeller.weeklySales || 0} sold
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* ── CATEGORIES ── */}
            <Categories
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Section title */}
            <View className="flex-row justify-between items-center mx-4 mb-3 mt-1">
              <Text className="text-gray-800 font-bold text-lg">
                {selectedCategory === "All" ? "All Products" : selectedCategory}
              </Text>
              <Text className="text-green-700 text-xs font-semibold">
                {filteredProducts.length} items
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🌱</Text>
            <Text className="text-gray-500 font-semibold text-base">
              No products found
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Try a different category
            </Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard item={item} />}
      />
    </View>
  );
}