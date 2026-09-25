import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ProductCard from "@/components/ProductCard";
import Header_Buyer from "@/components/Header_Buyer";
import Category_Buyer from "@/components/Category_Filter";
import { ProductType } from "@/src/types/product";
import { OrderType } from "@/src/types/order";

import { subscribeToProducts } from "@/src/services/productService";
import { getBuyerOrders } from "@/src/services/orderService";
import { getSavedFarms } from "@/src/services/savedFarmService";
import { getCartByBuyer } from "@/src/services/cartService";

const TOP_SELLING_LIMIT = 10;

type SavedFarm = {
  id: string;
  farmerId: string;
  farmName: string;
  coverPhoto?: string;
  municipality?: string;
  province?: string;
};

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderType | null>(null);
  const [savedFarms, setSavedFarms] = useState<SavedFarm[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [bannerIdx, setBannerIdx] = useState(0);
  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  const BANNERS = [
    { id: "1", image: require("../../../assets/banners/banner1.jpg") },
    { id: "2", image: require("../../../assets/banners/banner2.jpg") },
    { id: "3", image: require("../../../assets/banners/banner3.jpg") },
  ];

  const loadHome = useCallback(async () => {
    try {
      setLoading(true);

      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      const uid = user.uid || user.userId || user.id;

      const [orders, farms, cartItems] = await Promise.all([
        getBuyerOrders(uid),
        getSavedFarms(uid) as Promise<SavedFarm[]>,
        getCartByBuyer(uid),
      ]);

      const active =
        orders.find((o) => o.status === "pending" || o.status === "processing") ||
        null;
      setActiveOrder(active);
      setSavedFarms(farms);

      const count = cartItems.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );
      setCartCount(count);
    } catch (error) {
      console.log("HOME LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = subscribeToProducts((data) => setProducts(data));
      return () => unsubscribe();
    }, [])
  );

  const categoryFiltered =
    activeCategory === "All"
      ? products
      : products.filter(
          (p) =>
            (p.category || "").trim().toLowerCase() ===
            activeCategory.trim().toLowerCase()
        );

  const resaleProducts: ProductType[] = [];

  const topSelling = [...categoryFiltered]
    .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
    .slice(0, TOP_SELLING_LIMIT);

  const searchResults =
    searchQuery.trim().length === 0
      ? []
      : products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.farmName || "").toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 6);

  const closeSearch = () => {
    setSearchQuery("");
    Keyboard.dismiss();
  };

  const goToProduct = (id: string) => {
    closeSearch();
    router.push({ pathname: "/buyer/products/[id]", params: { id } });
  };

  const hasAnyContent =
    !!activeOrder ||
    resaleProducts.length > 0 ||
    topSelling.length > 0 ||
    savedFarms.length > 0;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#14532d" />
        <Text className="mt-3 text-green-900 font-semibold text-sm">
          Loading your home…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Header_Buyer
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* ── BANNER CAROUSEL ── */}
        <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32)))
            }
          >
            {BANNERS.map((b) => (
              <Image
                key={b.id}
                source={b.image}
                style={{
                  width: SCREEN_WIDTH - 32,
                  height: 160,
                  borderRadius: 10,
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 8 }}>
            {BANNERS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: bannerIdx === i ? 18 : 5,
                  height: 5,
                  borderRadius: 10,
                  backgroundColor: bannerIdx === i ? "#14532d" : "#d1d5db",
                }}
              />
            ))}
          </View>
        </View>

        <Category_Buyer activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

        <View className="px-4">
          {/* ── ACTIVE ORDER ── */}
          {activeOrder && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/buyer/profile/order-details",
                  params: { orderId: activeOrder.id },
                })
              }
              className="bg-amber-50 border border-amber-200 rounded-[10px] p-4 flex-row items-center mb-5"
              style={{ elevation: 2 }}
            >
              <View className="bg-white w-10 h-10 rounded-[5px] items-center justify-center mr-3">
                <MaterialCommunityIcons name="bike" size={20} color="#b45309" />
              </View>
              <View className="flex-1">
                <Text className="text-amber-700 text-[11px] font-bold">
                  Order in progress
                </Text>
                <Text
                  className="text-gray-800 font-semibold text-sm mt-0.5"
                  numberOfLines={1}
                >
                  {activeOrder.farmName} ·{" "}
                  {activeOrder.status === "pending" ? "Waiting for farmer" : "Preparing"}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}

          {/* ── RESALE (conditional - hidden until defined) ── */}
          {resaleProducts.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-800 font-bold text-base mb-3">
                Resale products
              </Text>
              <FlatList
                data={resaleProducts}
                scrollEnabled={false}
                numColumns={2}
                keyExtractor={(item, index) => item.docId ?? index.toString()}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                renderItem={({ item }) => <ProductCard item={item} />}
              />
            </View>
          )}

          {/* ── TOP SELLING PRODUCTS ── */}
          {topSelling.length > 0 && (
            <View className="mb-6">
              <FlatList
                data={topSelling}
                scrollEnabled={false}
                numColumns={2}
                keyExtractor={(item, index) => item.docId ?? index.toString()}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                renderItem={({ item }) => <ProductCard item={item} />}
              />
            </View>
          )}

          {/* ── SAVED FARMS ── */}
          {savedFarms.length > 0 && (
            <View className="mb-4">
              <Text className="text-gray-800 font-bold text-base mb-3">
                Your saved farms
              </Text>
              <FlatList
                data={savedFarms}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.id ?? index.toString()}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() =>
                      router.push({
                        pathname: "/buyer/farm/[farmerId]",
                        params: { farmerId: item.farmerId },
                      })
                    }
                    className="bg-white rounded-[10px] overflow-hidden border border-gray-100"
                    style={{ width: 150 }}
                  >
                    <View
                      className="bg-green-50 items-center justify-center overflow-hidden"
                      style={{ height: 64 }}
                    >
                      {item.coverPhoto ? (
                        <Image
                          source={{ uri: item.coverPhoto }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons name="home-outline" size={24} color="#86efac" />
                      )}
                    </View>
                    <View className="p-2.5">
                      <Text
                        className="font-bold text-gray-900 text-[13px]"
                        numberOfLines={1}
                      >
                        {item.farmName}
                      </Text>
                      <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>
                        {item.municipality}, {item.province}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ── FIRST-TIME / EMPTY STATE ── */}
          {!hasAnyContent && (
            <View className="items-center py-10">
              <Text className="text-4xl mb-3">🌱</Text>
              <Text className="text-gray-600 font-semibold text-base text-center">
                Welcome to FarmGate Direct
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center px-8">
                Head to Shop to find fresh produce from local farms.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/buyer/shop")}
                className="bg-green-900 px-6 py-3 rounded-xl mt-5"
              >
                <Text className="text-white font-bold text-sm">Browse Shop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── QUICK SEARCH DROPDOWN ── */}
      {searchQuery.trim().length > 0 && (
        <>
          <TouchableOpacity
            onPress={closeSearch}
            activeOpacity={1}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          />
          <View
            className="absolute left-4 right-4 bg-white rounded-2xl overflow-hidden"
            style={{
              top: 118,
              maxHeight: 280,
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 10,
            }}
          >
            {searchResults.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-400 text-xs">
                  No results for "{searchQuery}"
                </Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={item.docId}
                    onPress={() => goToProduct(item.docId!)}
                    activeOpacity={0.7}
                    className={`px-4 py-3 ${
                      idx < searchResults.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <Text className="text-gray-900 text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-400 text-[11px] mt-0.5" numberOfLines={1}>
                      {item.farmName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}