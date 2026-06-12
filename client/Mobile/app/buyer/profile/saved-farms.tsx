import React, { useCallback, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSavedFarms, unsaveFarm } from "@/src/services/savedFarmService";

const SavedFarmsScreen = () => {
  const router = useRouter();
  const [farms, setFarms] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFarms();
    }, [])
  );

  const loadFarms = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      const data = await getSavedFarms(
        user.uid || user.userId || user.id
      );

      setFarms(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (farmerId: string) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);

      await unsaveFarm(
        user.uid || user.userId || user.id,
        farmerId
      );

      loadFarms();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 bg-green-700">

      <View className="px-6 pt-16 pb-5">
        <Text className="text-white text-2xl font-bold">
          Saved Farms
        </Text>
      </View>

      <View className="flex-1 bg-white rounded-t-[40px] p-5">

        {farms.map((farm) => (
          <TouchableOpacity
            key={farm.id}
            onPress={() =>
              router.push({
                pathname: "/buyer/farm/[farmerId]",
                params: { farmerId: farm.farmerId },
          
              })
            }
            className="bg-gray-100 rounded-2xl mb-4 overflow-hidden"
          >

            <Image
              source={{ uri: farm.coverPhoto }}
              className="h-40 w-full"
            />

            <View className="p-4">

              <Text className="font-bold text-lg">
                {farm.farmName}
              </Text>

              <Text className="text-gray-500">
                {farm.municipality}, {farm.province}
              </Text>

              <TouchableOpacity
                onPress={() => handleDelete(farm.farmerId)}
                className="mt-3 bg-red-500 p-2 rounded-lg"
              >
                <Text className="text-white text-center">
                  Remove
                </Text>
              </TouchableOpacity>

            </View>

          </TouchableOpacity>
        ))}

      </View>
    </View>
  );
};

export default SavedFarmsScreen;