import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProductType } from "@/src/types/product";

type Props = {
  item: ProductType;
};

const isFreshProduct = (createdAt: number, freshness: string) => {
  const days = parseInt(freshness);
  return Date.now() - createdAt < days * 86400000;
};

const getStockColor = (stock: number) => {
  if (stock <= 0) return { bg: "bg-red-50", text: "text-red-500", label: "Out of stock" };
  if (stock <= 5) return { bg: "bg-orange-50", text: "text-orange-500", label: "Low stock" };
  return { bg: "bg-green-50", text: "text-green-600", label: "In stock" };
};

export default function ProductCard({ item }: Props) {
  const router = useRouter();
  const isFresh =
    item.createdAt && item.freshness
      ? isFreshProduct(item.createdAt, item.freshness)
      : false;

  const stockInfo = getStockColor(Number(item.stock) || 0);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() =>
        router.push({
          pathname: "/buyer/products/[id]",
          params: { id: item.docId },
        })
      }
      className="w-[48%] bg-white rounded-3xl mb-4 overflow-hidden"
      style={{
        elevation: 3,
        shadowColor: "#14532d",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* IMAGE */}
      <View className="relative">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-full"
            style={{ height: 130 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full bg-green-50 items-center justify-center"
            style={{ height: 130 }}
          >
            <Ionicons name="leaf-outline" size={36} color="#86efac" />
          </View>
        )}

        {/* Badges row */}
        <View className="absolute top-2 left-2 flex-col gap-1">
          {isFresh && (
            <View className="bg-green-500 px-2 py-0.5 rounded-full flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-white" />
              <Text className="text-white text-[10px] font-bold">Fresh</Text>
            </View>
          )}
          {Number(item.stock) <= 5 && Number(item.stock) > 0 && (
            <View className="bg-orange-400 px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-bold">Low Stock</Text>
            </View>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <View className="p-3">
        {/* Name */}
        <Text
          className="font-bold text-gray-900 text-sm leading-snug"
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Farm */}
        {item.farmName ? (
          <View className="flex-row items-center mt-1 gap-1">
            <Ionicons name="location-outline" size={10} color="#9ca3af" />
            <Text className="text-[10px] text-gray-400 flex-1" numberOfLines={1}>
              {item.farmName}
            </Text>
          </View>
        ) : null}

        {/* Divider */}
        <View className="h-px bg-gray-100 my-2" />

        {/* Price + Stock */}
        <View className="flex-row items-center justify-between">
          <Text className="font-black text-green-700 text-base">
            ₱{Number(item.price).toFixed(2)}
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${stockInfo.bg}`}>
            <Text className={`text-[9px] font-bold ${stockInfo.text}`}>
              {item.stock}{" Stock /"} {item.unit}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}