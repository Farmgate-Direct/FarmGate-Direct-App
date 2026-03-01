import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const SavedFarmsScreen = () => {
  const router = useRouter(); // para makapag back

  // sample saved farms
  const [farms, setFarms] = useState([
    {
      id: 1,
      name: "Green Valley Farm",
      location: "Bulacan, Philippines",
      size: "12 ha",
      products: "25+",
      rating: "4.5",
      image: "https://via.placeholder.com/300",
      verified: true,
    },
    {
      id: 2,
      name: "Hagonoy Small Farm",
      location: "Bulacan, Philippines",
      size: "13 ha",
      products: "30+",
      rating: "4.8",
      image: "https://via.placeholder.com/300",
      verified: true,
    },
  ]);

  // delete farm function
  const handleDelete = (id) => {
    setFarms(farms.filter((farm) => farm.id !== id));
  };

  return (
    // Removed SafeAreaView (no design changes)
    <View className="flex-1 bg-green-700">
      {/* Header section */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-white text-2xl font-bold ml-5">Saved Farms</Text>
      </View>

      {/* White container */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-6">
        {farms.map((farm) => (
          <View
            key={farm.id}
            className="bg-gray-100 rounded-2xl mb-4 overflow-hidden"
          >
            {/* Farm image */}
            <View className="relative">
              <Image
                source={{ uri: farm.image }}
                className="h-40 w-full"
                resizeMode="cover"
              />

              {/* Delete button sa top right */}
              <TouchableOpacity
                onPress={() => handleDelete(farm.id)}
                className="absolute top-3 right-3 bg-white p-2 rounded-full"
              >
                <Ionicons name="trash-outline" size={18} color="red" />
              </TouchableOpacity>
            </View>

            {/* Farm details */}
            <View className="p-4">
              {/* Name + verified badge */}
              <View className="flex-row items-center mb-1">
                <Text className="text-lg font-bold mr-2">{farm.name}</Text>

                {farm.verified && (
                  <View className="bg-green-600 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      Verified
                    </Text>
                  </View>
                )}
              </View>

              {/* Location */}
              <Text className="text-gray-500 text-sm mb-3">{farm.location}</Text>

              {/* Info row */}
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Size: {farm.size}</Text>
                <Text className="text-gray-600 text-sm">
                  Products: {farm.products}
                </Text>
                <Text className="text-gray-600 text-sm">⭐ {farm.rating}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SavedFarmsScreen;