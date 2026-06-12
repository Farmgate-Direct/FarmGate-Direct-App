import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

import { db } from "../../../FirebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  checkSavedFarm,
  saveFarm,
  unsaveFarm,
} from "@/src/services/savedFarmService";

const FarmScreen = () => {
  const router = useRouter();
  const { farmerId } = useLocalSearchParams();

  const [farm, setFarm] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [buyerId, setBuyerId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFarm();
    loadUser();
  }, []);

  // ================= FARM DATA =================
  const loadFarm = async () => {
    try {
      const userQuery = query(
        collection(db, "users"),
        where("uid", "==", farmerId)
      );

      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        setFarm({
          id: userSnap.docs[0].id,
          ...userSnap.docs[0].data(),
        });
      }

      const productQuery = query(
        collection(db, "products"),
        where("farmerId", "==", farmerId)
      );

      const productSnap = await getDocs(productQuery);

      const data = productSnap.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }));

      setProducts(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= USER =================
  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const uid = user.uid || user.userId || user.id;

      setBuyerId(uid);

      const exists = await checkSavedFarm(uid, String(farmerId));
      setSaved(!!exists);
    } catch (error) {
      console.log(error);
    }
  };

  // ================= SAVE / UNSAVE =================
  const toggleSave = async () => {
    try {
      if (!buyerId || !farm) return;

      if (saved) {
        await unsaveFarm(buyerId, String(farmerId));
        setSaved(false);
        Alert.alert("Removed", "Farm unsaved");
      } else {
        await saveFarm({
          buyerId,
          farmerId,
          farmName: farm.farmName,
          coverPhoto: farm.coverPhoto,
          municipality: farm.municipality,
          province: farm.province,
        });

        setSaved(true);
        Alert.alert("Saved", "Farm saved successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">

      {/* COVER (UNCHANGED UI) */}
      <View className="w-full h-64 bg-gray-200">
        {farm?.coverPhoto && (
          <Image
            source={{ uri: farm.coverPhoto }}
            className="w-full h-full"
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-16 left-4 bg-white p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView>

        {/* FARM INFO SECTION (UI RESTORED) */}
        <View className="p-5">

          <View className="flex-row justify-between items-start">

            <Text className="text-3xl font-bold flex-1 pr-3">
              {farm?.farmName}
            </Text>

            {/* SAVE BUTTON (small like Shopee style) */}
            <TouchableOpacity
              onPress={toggleSave}
              className={`px-4 py-2 rounded-full ${
                saved ? "bg-red-100" : "bg-green-700"
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  saved ? "text-red-600" : "text-white"
                }`}
              >
                {saved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>

          </View>

          <Text className="text-gray-500 mt-2">
            {farm?.municipality}, {farm?.province}
          </Text>

          <Text className="text-gray-700 mt-4 leading-6">
            {farm?.about || "No description"}
          </Text>
        </View>

        {/* PRODUCTS SECTION (UNCHANGED DESIGN) */}
        <View className="px-5 pb-10">

          <Text className="text-xl font-bold mb-4">
            Farm Products
          </Text>

          <FlatList
            data={products}
            scrollEnabled={false}
            numColumns={2}
            keyExtractor={(item, index) =>
              item.docId ?? index.toString()
            }
            columnWrapperStyle={{
              justifyContent: "space-between",
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/buyer/products/[id]",
                    params: { id: item.docId },
                  })
                }
                className="w-[48%] bg-white rounded-2xl mb-4 shadow-sm"
              >
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-36 rounded-t-2xl"
                  resizeMode="cover"
                />

                <View className="p-3">
                  <Text numberOfLines={1} className="font-bold">
                    {item.name}
                  </Text>

                  <Text className="text-green-700 font-bold mt-1">
                    ₱{Number(item.price).toFixed(2)}
                  </Text>

                  <Text className="text-gray-400 text-xs mt-1">
                    {item.stock} {item.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />

        </View>

      </ScrollView>

    </View>
  );
};

export default FarmScreen;