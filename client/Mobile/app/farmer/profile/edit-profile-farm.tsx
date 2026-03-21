import { Ionicons, AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://192.168.8.12:5000";

const EditProfleFarm = () => {
  const [user, setUser] = useState<any>({
    farmName: "",
    barangay: "",
    municipality: "",
    province: "",
    about: "",
    coverPhoto: null,
  });

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);

        const res = await fetch(`${API_URL}/users/${parsedUser.userId}`);
        const data = await res.json();

        if (data.role === "farmer") {
          setUser({
            farmName: data.farmName || "",
            barangay: data.barangay || "",
            municipality: data.municipality || "",
            province: data.province || "",
            about: data.about || "",
            coverPhoto: data.coverPhoto || null,
          });
        }
      } catch (error) {
        console.log("LOAD USER ERROR:", error);
      }
    };

    loadUser();
  }, []);

  /* ================= IMAGE PICKER ================= */
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Allow access to photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        setUser({
          ...user,
          coverPhoto: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.log("IMAGE PICK ERROR:", error);
    }
  };

  /* ================= SAVE USER ================= */
  const handleSave = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);

      const res = await fetch(`${API_URL}/users/${parsedUser.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmName: user.farmName,
          barangay: user.barangay,
          municipality: user.municipality,
          province: user.province,
          about: user.about,
          coverPhoto: user.coverPhoto,
        }),
      });

      const data = await res.json();
      setUser(data);

      Alert.alert("Success", "Farm updated successfully ✅");
      router.back();
    } catch (error) {
      console.log("SAVE USER ERROR:", error);
      Alert.alert("Error", "Failed to update farm");
    }
  };

  return (
    <View className="flex-1 bg-green-800">
      {/* HEADER */}
      <View className="bg-green-800 pt-16 pb-6 items-center justify-center">
        {/* BACK BUTTON */}
        <TouchableOpacity
          className="absolute left-6 top-16"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* COVER PHOTO */}
        <TouchableOpacity className="w-full h-40 px-6" onPress={pickImage}>
          {user.coverPhoto ? (
            <Image
              source={{ uri: user.coverPhoto }}
              className="w-full h-full rounded-xl"
              resizeMode="contain"
            />
          ) : (
            <View className="flex-1 items-center justify-center border border-dashed border-white rounded-xl">
              <AntDesign name="edit" size={30} color="white" />
              <Text className="text-white mt-2 text-base">
                Upload cover photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-8 -mt-12">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-semibold mb-6">Farm Profile</Text>

          {/* FARM NAME */}
          <Text className="text-gray-500 text-xs mb-1">FARM NAME</Text>
          <TextInput
            value={user.farmName}
            onChangeText={(text) => setUser({ ...user, farmName: text })}
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* BARANGAY */}
          <Text className="text-gray-500 text-xs mb-1">BARANGAY</Text>
          <TextInput
            value={user.barangay}
            onChangeText={(text) => setUser({ ...user, barangay: text })}
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* MUNICIPALITY */}
          <Text className="text-gray-500 text-xs mb-1">MUNICIPALITY</Text>
          <TextInput
            value={user.municipality}
            onChangeText={(text) =>
              setUser({ ...user, municipality: text })
            }
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* PROVINCE */}
          <Text className="text-gray-500 text-xs mb-1">PROVINCE</Text>
          <TextInput
            value={user.province}
            onChangeText={(text) => setUser({ ...user, province: text })}
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* ABOUT FARM */}
          <Text className="text-gray-500 text-xs mb-1">ABOUT FARM</Text>
          <TextInput
            value={user.about}
            onChangeText={(text) => setUser({ ...user, about: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-gray-200 rounded-lg px-4 py-3 h-28"
          />

          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-green-700 py-3 rounded-xl mt-6 items-center"
          >
            <Text className="text-white font-semibold">Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default EditProfleFarm;