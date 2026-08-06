import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { addToCart } from "@/src/services/cartService";
import {
  getProductById,
  getBatchesByProduct,
  getReviewsByProduct,
} from "@/src/services/productService";
import { ProductType, BatchType, ReviewType } from "@/src/types/product";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [batches, setBatches] = useState<BatchType[]>([]);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [buyerId, setBuyerId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"cart" | "buynow">("cart");

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProduct();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (!data) return;
      const user = JSON.parse(data);
      setBuyerId(user.uid || user.userId || user.id || "");
      setBuyerName(user.fullName || user.name || "");
    } catch (e) {
      console.log(e);
    }
  };

  const loadProduct = async () => {
    try {
      if (!id) return;
      const data = await getProductById(String(id));
      setProduct(data);

      if (data) {
        const [batchData, reviewData] = await Promise.all([
          getBatchesByProduct(data.docId),
          getReviewsByProduct(data.docId),
        ]);
        setBatches(batchData);
        setReviews(reviewData);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ================= SELLABLE BATCHES (FIFO order) =================
  // Lahat ng batch na may stock pa at "Available" ang status, pagkakasunod-
  // sunod mula sa pinakamatanda (unang ibebenta) - ito rin ang eksaktong
  // pagkakasunod na sinusunod ng recordSale() sa checkout.
  const sellableBatches = useMemo(
    () =>
      batches
        .filter((b) => b.stock > 0 && b.status === "Available")
        .sort((a, b) => a.batchNumber - b.batchNumber),
    [batches]
  );

  // "currentBatch" = ang unang ibebenta (FIFO) - dito galing ang presyo at
  // freshness label na ipinapakita, dahil ito talaga ang unang mauubos.
  const currentBatch = sellableBatches[0] || null;

  // ================= AGGREGATE STOCK (para sa quantity limit) =================
  // MAHALAGA: ang totoong pwedeng i-order ay ang KABUUAN ng stock sa LAHAT
  // ng sellable batch, HINDI lang ang stock ng currentBatch - dahil kaya
  // namang kumuha ng recordSale() sa susunod na batch kapag naubos na ang
  // una (FIFO spillover). Kung ang increment (+) button ay naka-limit lang
  // sa currentBatch.stock, hindi makakapag-order ang buyer ng mas malaki
  // kahit sapat naman ang TOTAL na stock kasama ang susunod na batch.
  const totalAvailableStock = useMemo(
    () => sellableBatches.reduce((sum, b) => sum + b.stock, 0),
    [sellableBatches]
  );

  // Totoo kapag may karagdagang stock pa mula sa ibang batch bukod sa
  // currentBatch - ginagamit para sa isang maliit na paalala sa UI
  // tungkol sa posibleng pagkakaiba-iba ng freshness kapag umabot doon
  // ang order.
  const hasAdditionalBatches = sellableBatches.length > 1;

  // ================= REVIEW FILTER (All / per-batch) =================
  // "all" = lahat ng review ng product. Kapag pinili ang isang specific
  // na batchNumber, puro reviews LANG ng batch na yun ang makikita -
  // ex. "Batch 002" ay ipapakita LANG ang mga reviews na naka-link sa
  // batchId ng Batch 002, hindi kasama ang sa ibang batch.
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");

  // Listahan ng mga batch number na may kahit isang review, pinaka-bago
  // muna (descending) - ginagamit para sa mga filter chip.
  const reviewedBatchNumbers = useMemo(() => {
    const unique = Array.from(new Set(reviews.map((r) => r.batchNumber)));
    return unique.sort((a, b) => b - a);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews;
    return reviews.filter((r) => r.batchNumber === reviewFilter);
  }, [reviews, reviewFilter]);

  const avgRating = product?.rating || 0;
  const totalReviews = product?.totalReviews || 0;

  // ── LOADING ──
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#15803d" />
        <Text className="mt-3 text-green-700 font-semibold text-sm">Loading product…</Text>
      </View>
    );
  }

  // ── NOT FOUND ──
  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-8">
        <Text className="text-5xl mb-4">🌿</Text>
        <Text className="text-gray-700 font-bold text-lg">Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-green-700 px-6 py-3 rounded-2xl">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openModal = (mode: "cart" | "buynow") => {
    if (!currentBatch) {
      Alert.alert("Out of Stock", "This product is currently unavailable.");
      return;
    }
    setModalMode(mode);
    setQuantity(1);
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const handleAddToCart = async () => {
    if (!product?.docId || !currentBatch) return;
    if (!buyerId) {
      Alert.alert("Sign in required", "Please log in to add items to your cart.");
      return;
    }
    try {
      await addToCart({
        productId: product.docId,
        // Ang batchId dito ay INFORMATIONAL/price-reference lang sa
        // add-to-cart time. Sa checkout, laging kukunin ng recordSale()
        // ang totoong FIFO batch(es) sa mismong oras ng pag-order - kaya
        // hindi problema kahit may pagitan ng oras.
        batchId: currentBatch.docId,
        batchNumber: currentBatch.batchNumber,
        buyerId,
        buyerName,
        farmerId: product.farmerId,
        farmName: product.farmName,
        name: product.name,
        image: product.image,
        price: currentBatch.price,
        quantity,
        unit: product.unit,
        createdAt: Date.now(),
      });
      Alert.alert("Added to cart!", `${product.name} is ready for checkout.`);
      closeModal();
    } catch {
      Alert.alert("Error", "Failed to add to cart. Please try again.");
    }
  };

  const handleBuyNow = () => {
    if (!product || !currentBatch) return;
    closeModal();
    router.push({
      pathname: "/buyer/checkout",
      params: {
        items: JSON.stringify([{
          farmName: product.farmName,
          farmerId: product.farmerId,
          products: [{
            docId: product.docId,
            batchId: currentBatch.docId,
            batchNumber: currentBatch.batchNumber,
            name: product.name,
            price: currentBatch.price,
            image: product.image,
            quantity,
          }],
        }]),
        buyerId,
      },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* ── HERO IMAGE ── */}
      <View className="w-full aspect-square bg-[#f0fdf4]">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="leaf-outline" size={64} color="#86efac" />
          </View>
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "transparent"]}
          className="absolute top-0 left-0 right-0 h-36"
        />

        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-14 left-4 bg-white/90 p-2.5 rounded-2xl"
          style={{ elevation: 3 }}
        >
          <Ionicons name="arrow-back" size={20} color="#14532d" />
        </TouchableOpacity>

        {/* Stock badge - AGGREGATE stock (kabuuan ng lahat ng sellable
            batch), hindi lang currentBatch, para tumpak ang ipinapakita
            sa buyer kahit malapit nang maubos ang kasalukuyang batch. */}
        <View
          className="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 rounded-full flex-row items-center gap-1"
          style={{ elevation: 2 }}
        >
          <View
            className={`w-2 h-2 rounded-full ${
              totalAvailableStock > 5 ? "bg-green-500" : "bg-orange-400"
            }`}
          />
          <Text className="text-xs font-bold text-gray-700">
            {currentBatch ? `${totalAvailableStock} ${product.unit} left` : "Out of stock"}
          </Text>
        </View>
      </View>

      {/* ── TAB BAR ── */}
      <View className="flex-row self-center bg-gray-100 rounded-2xl p-1 mt-3 mx-4">
        {(["details", "reviews"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-8 py-2 rounded-xl ${activeTab === tab ? "bg-green-700" : ""}`}
          >
            <Text className={`font-semibold text-sm capitalize ${activeTab === tab ? "text-white" : "text-gray-500"}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── DETAILS TAB ── */}
      {activeTab === "details" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-black text-gray-900 leading-tight">
            {product.name}
          </Text>

          <TouchableOpacity
            onPress={() => router.push({ pathname: "/buyer/farm/[farmerId]", params: { farmerId: product.farmerId } })}
            className="flex-row items-center mt-1.5 gap-1"
          >
            <Ionicons name="location-outline" size={13} color="#15803d" />
            <Text className="text-green-700 font-semibold text-sm">{product.farmName}</Text>
            <Ionicons name="chevron-forward" size={13} color="#15803d" />
          </TouchableOpacity>

          {/* Price + Rating row */}
          <View className="flex-row items-center justify-between mt-4">
            {currentBatch ? (
              <Text className="text-green-700 font-black text-3xl">
                ₱{Number(currentBatch.price).toFixed(2)}
                <Text className="text-gray-400 text-sm font-normal"> / {product.unit}</Text>
              </Text>
            ) : (
              <Text className="text-gray-400 font-bold text-lg">Currently unavailable</Text>
            )}
            {avgRating > 0 && (
              <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full gap-1">
                <Ionicons name="star" size={13} color="#f59e0b" />
                <Text className="text-amber-600 font-bold text-sm">{avgRating.toFixed(1)}</Text>
                <Text className="text-gray-400 text-xs">({totalReviews})</Text>
              </View>
            )}
          </View>

          {/* Current batch card */}
          {currentBatch && (
            <View className="bg-green-50 rounded-2xl p-4 mt-4">
              <Text className="text-green-800 font-bold text-sm mb-1">
                Current Batch: Batch {String(currentBatch.batchNumber).padStart(3, "0")}
              </Text>
              <Text className="text-green-700 text-xs">
                Harvest Week: {formatDate(currentBatch.weekStart)} – {formatDate(currentBatch.weekEnd)}
              </Text>
              <Text className="text-green-700 text-xs mt-0.5">
                Available Stock: {totalAvailableStock} {product.unit}
              </Text>
              {/* Paalala lang - freshness ng SUSUNOD na batch kung sakaling
                  umabot dito ang order (halimbawa, malapit nang maubos ang
                  current batch). Honest disclosure imbes na palihim na
                  ipagpalagay na parehong freshness lahat. */}
              {hasAdditionalBatches && currentBatch.stock < totalAvailableStock && (
                <Text className="text-green-600 text-[10px] mt-1.5 italic">
                  Note: kung lalampas ang order sa {currentBatch.stock} {product.unit}, ang
                  labis ay manggagaling sa susunod na batch (maaaring mas bago pa).
                </Text>
              )}
            </View>
          )}

          {/* Info chips */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {product.category && <InfoChip icon="pricetag-outline" label={product.category} />}
            {currentBatch?.freshness && (
              <InfoChip icon="leaf-outline" label={currentBatch.freshness} color="green" />
            )}
          </View>

          {/* Description */}
          {product.description ? (
            <View className="mt-5">
              <Text className="text-gray-800 font-bold text-base mb-2">About this product</Text>
              <Text className="text-gray-600 leading-6 text-sm">{product.description}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === "reviews" && (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.docId}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          ListHeaderComponent={
            <>
              <View className="flex-row items-center gap-2 mb-4 bg-green-50 rounded-2xl p-4">
                <Text className="text-green-700 font-black text-4xl">{avgRating.toFixed(1)}</Text>
                <View>
                  <View className="flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(avgRating) ? "star" : "star-outline"}
                        size={16}
                        color="#f59e0b"
                      />
                    ))}
                  </View>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Based on {totalReviews} reviews
                  </Text>
                </View>
              </View>

              {/* FILTER CHIPS - "All" + isang chip per batch na may review.
                  Kapag pinili ang isang specific na batch, puro reviews
                  LANG ng batch na yun ang lalabas sa listahan sa ibaba. */}
              {reviewedBatchNumbers.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                >
                  <TouchableOpacity
                    onPress={() => setReviewFilter("all")}
                    className={`px-4 py-2 rounded-full ${
                      reviewFilter === "all" ? "bg-green-700" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        reviewFilter === "all" ? "text-white" : "text-gray-600"
                      }`}
                    >
                      All
                    </Text>
                  </TouchableOpacity>

                  {reviewedBatchNumbers.map((num) => {
                    const isCurrent = currentBatch?.batchNumber === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        onPress={() => setReviewFilter(num)}
                        className={`px-4 py-2 rounded-full ${
                          reviewFilter === num ? "bg-green-700" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            reviewFilter === num ? "text-white" : "text-gray-600"
                          }`}
                        >
                          Batch {String(num).padStart(3, "0")}
                          {isCurrent ? " (current)" : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-400 mt-6">
              {reviewFilter === "all"
                ? "No reviews yet."
                : `No reviews yet for Batch ${String(reviewFilter).padStart(3, "0")}.`}
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-1">
              <Text className="text-gray-400 text-[10px] mb-1">
                Batch {String(item.batchNumber).padStart(3, "0")}
              </Text>
              <ReviewCard item={item} />
            </View>
          )}
        />
      )}

      {/* ── BOTTOM ACTION BAR ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4"
        style={{ elevation: 12 }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              if (!product.farmName || !product.farmerId) {
                Alert.alert("Unavailable", "Farmer info not available.");
                return;
              }
              router.push({
                pathname: "/buyer/profile/ChatScreen",
                params: { farmerName: product.farmName, farmerId: product.farmerId },
              });
            }}
            className="bg-gray-100 p-3.5 rounded-2xl items-center justify-center"
          >
            <AntDesign name="message" size={20} color="#15803d" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openModal("cart")}
            disabled={!currentBatch}
            className={`px-4 py-3.5 rounded-2xl items-center justify-center flex-row gap-2 ${
              currentBatch ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <Ionicons name="cart-outline" size={20} color={currentBatch ? "#15803d" : "#9ca3af"} />
            <Text className={`font-bold text-sm ${currentBatch ? "text-green-700" : "text-gray-400"}`}>
              Cart
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openModal("buynow")}
            disabled={!currentBatch}
            className={`flex-1 py-3.5 rounded-2xl items-center justify-center ${
              currentBatch ? "bg-green-700" : "bg-gray-300"
            }`}
            style={currentBatch ? { elevation: 4, shadowColor: "#14532d", shadowOpacity: 0.25, shadowRadius: 8 } : undefined}
          >
            <Text className="text-white font-black text-base">
              {currentBatch ? "Buy Now" : "Out of Stock"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MODAL ── */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View className="flex-1 bg-black/50 justify-end" style={{ opacity: fadeAnim }}>
          <TouchableOpacity className="flex-1" onPress={closeModal} />
        </Animated.View>

        {currentBatch && (
          <Animated.View
            className="bg-white rounded-t-[32px] px-6 pt-3 pb-10 absolute bottom-0 w-full"
            style={{ transform: [{ translateY: slideAnim }] }}
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

            <View className="flex-row gap-4 mb-5">
              <View style={{ width: 88, height: 88, borderRadius: 16, overflow: "hidden", backgroundColor: "#f0fdf4" }}>
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="leaf-outline" size={28} color="#86efac" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-black text-gray-900 text-base" numberOfLines={2}>{product.name}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Ionicons name="location-outline" size={11} color="#15803d" />
                  <Text className="text-green-700 text-xs font-semibold">{product.farmName}</Text>
                </View>
                <Text className="text-green-700 font-black text-xl mt-1.5">
                  ₱{Number(currentBatch.price).toFixed(2)}
                  <Text className="text-gray-400 text-xs font-normal"> / {product.unit}</Text>
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {totalAvailableStock} {product.unit} available
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100 mb-4" />

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-700 font-semibold">Quantity</Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-gray-100 w-10 h-10 rounded-2xl items-center justify-center"
                >
                  <Ionicons name="remove" size={18} color={quantity <= 1 ? "#d1d5db" : "#374151"} />
                </TouchableOpacity>
                <Text className="font-black text-lg w-7 text-center text-gray-900">{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity((q) => Math.min(totalAvailableStock, q + 1))}
                  className="bg-green-700 w-10 h-10 rounded-2xl items-center justify-center"
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={quantity >= totalAvailableStock ? "#86efac" : "white"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Paalala kung ang napiling quantity ay lalampas na sa
                currentBatch.stock - ibig sabihin may manggagaling na mula
                sa susunod na batch. */}
            {quantity > currentBatch.stock && (
              <Text className="text-orange-600 text-[11px] mb-2 -mt-2">
                {currentBatch.stock} {product.unit} mula sa Batch{" "}
                {String(currentBatch.batchNumber).padStart(3, "0")}, at{" "}
                {quantity - currentBatch.stock} {product.unit} mula sa susunod na batch.
              </Text>
            )}

            <View className="flex-row justify-between items-center bg-green-50 rounded-2xl px-4 py-3 mb-5">
              <Text className="text-gray-500 font-medium">Total</Text>
              <Text className="font-black text-green-700 text-xl">
                ₱{(Number(currentBatch.price) * quantity).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={modalMode === "cart" ? handleAddToCart : handleBuyNow}
              className="bg-green-700 py-4 rounded-2xl items-center justify-center flex-row gap-2"
              style={{ elevation: 4, shadowColor: "#15803d", shadowOpacity: 0.3, shadowRadius: 8 }}
              activeOpacity={0.85}
            >
              <Ionicons name={modalMode === "cart" ? "cart-outline" : "flash-outline"} size={20} color="white" />
              <Text className="text-white font-black text-base">
                {modalMode === "cart" ? "Add to Cart" : "Buy Now"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Modal>
    </View>
  );
}

// ── HELPER COMPONENTS ──
function InfoChip({
  icon,
  label,
  color = "gray",
}: {
  icon: string;
  label: string;
  color?: "gray" | "green";
}) {
  const isGreen = color === "green";
  return (
    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${isGreen ? "bg-green-50" : "bg-gray-100"}`}>
      <Ionicons name={icon as any} size={12} color={isGreen ? "#15803d" : "#6b7280"} />
      <Text className={`text-xs font-semibold ${isGreen ? "text-green-700" : "text-gray-600"}`}>{label}</Text>
    </View>
  );
}

function ReviewCard({ item }: { item: ReviewType }) {
  return (
    <View className="bg-gray-50 rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
            <Text className="text-green-700 font-bold text-xs">
              {item.buyerName?.charAt(0) || "?"}
            </Text>
          </View>
          <View>
            <Text className="font-bold text-gray-800 text-sm">{item.buyerName}</Text>
            <Text className="text-gray-400 text-xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= item.rating ? "star" : "star-outline"}
              size={12}
              color="#f59e0b"
            />
          ))}
        </View>
      </View>
      <Text className="text-gray-600 text-sm mt-2.5 leading-5">{item.comment}</Text>
    </View>
  );
}