import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

const API_URL = "http://192.168.8.12:5000";

const Profile = () => {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [productsCount, setProductsCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);

        /* ================= USER INFO ================= */
        const userRes = await fetch(`${API_URL}/users/${parsedUser.userId}`);
        const userData = await userRes.json();
        setUser(userData);

        /* ================= PRODUCTS (HINDI GINALAW) ================= */
        const productRes = await fetch(`${API_URL}/products`);
        const allProducts = await productRes.json();

     const myProducts = allProducts.filter(
  (p: any) =>
    p.farmerId?.toString() === parsedUser.userId?.toString()
);

setProductsCount(myProducts.length);
      } catch (error) {
        console.log("PROFILE ERROR:", error);
      }
    };

    loadProfile();
  }, []);

  /* ================= SAVE USERS.JSON ================= */
const handleEditToggle = async () => {
  if (isEditing && user) {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);

      const response = await fetch(`${API_URL}/users/${parsedUser.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          location: user.location,
        }),
      });

      const data = await response.json();
      setUser(data);

      Alert.alert("Success", "Profile updated successfully ✅");
    } catch (error) {
      console.log("UPDATE ERROR:", error);
      Alert.alert("Error", "Failed to save");
    }
  }

  setIsEditing(!isEditing);
};

  return (
    <View className="flex-1 bg-green-800">
      {/* Green header */}
      <View className="px-6 pt-16 pb-20">
        <TouchableOpacity
          className="absolute right-8 top-16"
          onPress={() => router.push("/farmer/profile/qr")}
        >
          <Ionicons name="qr-code" size={35} color="white" />
        </TouchableOpacity>

        <View className="items-center">
          <Image className="w-24 h-24 rounded-full border-4 border-white" />

          <Text className="text-white text-3xl font-bold mt-3">
            {user?.fullName || "Loading..."}
          </Text>

          <Text className="text-white text-m mt-1">{user?.location || ""}</Text>

          <View className="flex-row items-center mt-1">
            <Text className="text-white text-sm font-medium">
              Registered Farmer
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4ade80"
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
      </View>

      {/* White container */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6 -mt-10">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats (HINDI GINALAW) */}
          <View className="flex-row bg-white rounded-2xl shadow p-4 justify-between">
            <View className="items-center flex-1">
              <Text className="font-bold text-lg">{productsCount}</Text>
              <Text className="text-gray-500 text-xs">PRODUCTS</Text>
            </View>

            <View className="items-center flex-1">
              <Text className="font-bold text-lg">112</Text>
              <Text className="text-gray-500 text-xs">ORDERS</Text>
            </View>

            <View className="items-center flex-1">
              <Text className="font-bold text-lg">4.9 ⭐</Text>
              <Text className="text-gray-500 text-xs">RATING</Text>
            </View>
          </View>

          {/* Personal Information */}
          <View className="bg-white mt-6 rounded-2xl p-5 shadow">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-semibold text-base">
                Personal Information
              </Text>

              <TouchableOpacity onPress={handleEditToggle}>
                <AntDesign
                  name={isEditing ? "check" : "edit"}
                  size={22}
                  color="black"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              editable={isEditing}
              value={user?.fullName || ""}
              onChangeText={(text) => setUser({ ...user, fullName: text })}
              placeholder="Full Name"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            <TextInput
              editable={isEditing}
              value={user?.email || ""}
              onChangeText={(text) => setUser({ ...user, email: text })}
              placeholder="Email"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            <TextInput
              editable={isEditing}
              value={user?.phone || ""}
              onChangeText={(text) => setUser({ ...user, phone: text })}
              placeholder="Phone"
              className="bg-gray-100 p-3 rounded-lg mb-3"
            />

            <TextInput
              editable={isEditing}
              value={user?.location || ""}
              onChangeText={(text) => setUser({ ...user, location: text })}
              placeholder="Location"
              className="bg-gray-100 p-3 rounded-lg"
            />
          </View>

          {/* Farm Profile */}
          <TouchableOpacity
            onPress={() => router.push("/farmer/profile/edit-profile-farm")}
          >
            <View className="bg-white mt-6 rounded-2xl p-5 shadow">
              <Text className="font-semibold text-base">Farm Profile</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default Profile;
