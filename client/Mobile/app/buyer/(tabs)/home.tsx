import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

import Categories from "@/components/Categories";
import QuantityModal from "@/components/QuantityModal";
import SearchBar from "@/components/SearchBar";

import { images } from "@/constants/image";
import { useCart } from "@/context/CartContext";
import { Ionicons } from "@expo/vector-icons";

/* ---------- PRODUCTS ---------- */
const products = [
  {
    id: "1",
    name: "Fresh Farm Tomatoes",
    farm: "Green Valley Farm",
    category: "Vegetables",
    image: require("@/assets/images/tomato.jpg"),
    price: "₱120 / kg",
    stock: "45 kg Available",
    rate: "5",
  },
  {
    id: "2",
    name: "Fresh Eggplant",
    farm: "Green Valley Farm",
    category: "Vegetables",
    image: require("@/assets/images/eggplant.jpg"),
    price: "₱80 / kg",
    stock: "32 kg Available",
    rate: "5",
  },
  {
    id: "3",
    name: "Fresh Mango",
    farm: "Golden Orchard Farm",
    category: "Fruits",
    image: require("@/assets/images/mango.jpg"),
    price: "₱60 / kg",
    stock: "50 kg Available",
    rate: "5",
  },
  {
    id: "4",
    name: "Native Green Grapes",
    farm: "Golden Orchard Farm",
    category: "Fruits",
    image: require("@/assets/images/greengrape.jpg"),
    price: "₱200 / kg",
    stock: "22 kg Available",
    rate: "5",
  },
  {
    id: "5",
    name: "Fresh Rice",
    farm: "Bulacan Organic Farm",
    category: "Rice",
    image: require("@/assets/images/rice.jpg"),
    price: "₱60 / kg",
    stock: "50 kg Available",
    rate: "5",
  },
  {
    id: "6",
    name: "Native Egg",
    farm: "Golden Poultry Farm",
    category: "Eggs & Poultry",
    image: require("@/assets/images/egg.jpg"),
    price: "₱200 / kg",
    stock: "22 kg Available",
    rate: "5",
  },
  {
    id: "7",
    name: "Fresh Pumpkin",
    farm: "Green Valley Farm",
    category: "Vegetables",
    image: require("@/assets/images/pumpkin.jpg"),
    price: "₱60 / kg",
    stock: "50 kg Available",
    rate: "5",
  },
  {
    id: "8",
    name: "Fresh Banana",
    farm: "Golden Orchard Farm",
    category: "Fruits",
    image: require("@/assets/images/banana.jpg"),
    price: "₱200 / kg",
    stock: "22 kg Available",
    rate: "5",
  },
  {
    id: "9",
    name: "Fresh Orange",
    farm: "Golden Orchard Farm",
    category: "Fruits",
    image: require("@/assets/images/orange.jpg"),
    price: "₱60 / kg",
    stock: "50 kg Available",
    rate: "5",
  },
  {
    id: "10",
    name: "Native Okra",
    farm: "Green Valley Farm",
    category: "Vegetables",
    image: require("@/assets/images/okra.jpg"),
    price: "₱200 / kg",
    stock: "22 kg Available",
    rate: "5",
  },
];

type Product = (typeof products)[0];

export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <View className="flex-1 bg-gray-100">
      <Image source={images.bg} className="absolute w-full h-full z-0" />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View className="bg-green-600 rounded-b-3xl pb-10">
              <TouchableOpacity className="absolute right-6 top-12">
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              <Image
                source={require("../../../assets/Farmgate-logos/farmgate-logo.png")}
                className="w-14 h-14 mt-20 mb-5 mx-auto"
              />

              <Text className="text-white text-center font-bold text-3xl">
                FARMGATE DIRECT
              </Text>

              <Text className="text-green-100 text-center font-semibold text-md">
                A Hyperlocal Farm-to-Table Platform
              </Text>
            </View>

            <View className="mx-6 mt-6 bg-green-600 rounded-2xl p-4 flex-row items-center">
              <View style={{ flex: 1 }}>
                <Text className="text-white font-bold text-xl mb-1">
                  This Week’s Fresh Picks
                </Text>
                <Text className="text-green-100 text-md mb-3">
                  100% organic & freshly picked
                </Text>

                <TouchableOpacity className="bg-white mt-3 px-4 py-2 rounded-full self-start">
                  <Text className="text-green-700 font-bold">Shop Now</Text>
                </TouchableOpacity>
              </View>

              <View className="w-24 h-24 relative">
                <Image
                  source={require("@/assets/images/egg.jpg")}
                  className="absolute bottom-0 right-0 w-24 h-24"
                  resizeMode="contain"
                />
              </View>
            </View>
            <Categories />
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/products/[id]",
                params: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  stock: item.stock,
                  rate: item.rate,
                  farm: item.farm,
                  category: item.category,
                },
              })
            }
            style={{
              width: "48%",
              backgroundColor: "#fff",
              borderRadius: 16,
              marginBottom: 16,
              elevation: 3,
            }}
          >
            <View style={{ padding: 10 }}>
              <Image
                source={item.image}
                style={{ width: "100%", height: 120, borderRadius: 10 }}
                resizeMode="cover"
              />

              {/* BADGES + NAME */}
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row">
                  <View className="bg-green-700 py-0.5 px-2 rounded-2xl mr-1">
                    <Text className="text-white font-semibold text-xs">
                      Fresh
                    </Text>
                  </View>

                  <View className="bg-gray-200 py-0.5 px-2 rounded-2xl">
                    <Text className="text-gray-700 font-semibold text-xs">
                      {item.category}
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                className="font-semibold text-gray-800 text-sm mt-2"
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Text className="text-xs text-gray-500 mt-1">
                {item.farm}, Bulacan
              </Text>

              <Text className="font-bold text-green-700 mt-1">
                {item.price}
              </Text>

              <Text className="text-xs text-gray-500 mt-1">
                {item.stock} • ⭐ {item.rate}
              </Text>
            {/*
              <TouchableOpacity
                onPress={() => {
                  setSelectedProduct(item);
                  setShowQtyModal(true);
                }}
                className="bg-green-700 mt-3 py-2 rounded-xl"
              >
                <Text className="text-white font-bold text-center">
                  Buy now
                </Text>
              </TouchableOpacity>*/}
            </View>
          </TouchableOpacity>
        )}
      />

      <QuantityModal
        visible={showQtyModal}
        onClose={() => {
          setShowQtyModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={(qty) => {
          if (!selectedProduct) return;

          addToCart({
            id: selectedProduct.id,
            name: selectedProduct.name,
            image: selectedProduct.image,
            price: Number(selectedProduct.price.replace(/[^0-9]/g, "")),
            quantity: qty,
          });

          setShowQtyModal(false);
          setSelectedProduct(null);
        }}
      />
    </View>
  );
}
