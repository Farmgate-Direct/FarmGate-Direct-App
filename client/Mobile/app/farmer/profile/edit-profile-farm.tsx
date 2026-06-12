import {
  AntDesign,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../FirebaseConfig";

import { UserType } from "../../../src/types/user";

import { uploadFarmImageAsync } from "../../../src/services/cloudinaryFarmService";

import { deleteCloudinaryImage } from "../../../src/services/deleteImageService";

const EditProfileFarm = () => {
  const [loading, setLoading] =
    useState(false);

  const [user, setUser] =
    useState<UserType>({
      uid: "",
      fullName: "",
      email: "",
      phone: "",
      role: "",
      status: "",

      farmName: "",
      barangay: "",
      municipality: "",
      province: "",
      about: "",

      coverPhoto: "",
      coverPhotoPublicId: "",
    });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser =
        await AsyncStorage.getItem("user");

      if (!storedUser) return;

      const parsedUser =
        JSON.parse(storedUser);

      const userRef = doc(
        db,
        "users",
        parsedUser.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (userSnap.exists()) {
        const data =
          userSnap.data() as UserType;

        // IMPORTANT FIX
        setUser((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.log(
        "LOAD USER ERROR:",
        error
      );
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Allow access to photos"
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          aspect: [16, 9],

          quality: 0.7,
        });

      if (!result.canceled) {
        setUser((prev) => ({
          ...prev,
          coverPhoto:
            result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.log(
        "IMAGE PICK ERROR:",
        error
      );
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let coverPhoto =
        user.coverPhoto;

      let coverPhotoPublicId =
        user.coverPhotoPublicId;

      // NEW IMAGE
      if (
        coverPhoto &&
        !coverPhoto.startsWith(
          "https://"
        )
      ) {
        const oldPublicId =
          user.coverPhotoPublicId;

        const uploadResult =
          await uploadFarmImageAsync(
            coverPhoto
          );

        coverPhoto =
          uploadResult.imageUrl;

        coverPhotoPublicId =
          uploadResult.publicId;

        // DELETE OLD IMAGE
        if (oldPublicId) {
          await deleteCloudinaryImage(
            oldPublicId
          );
        }
      }

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await updateDoc(userRef, {
        farmName:
          user.farmName || "",

        barangay:
          user.barangay || "",

        municipality:
          user.municipality || "",

        province:
          user.province || "",

        about:
          user.about || "",

        coverPhoto:
          coverPhoto || "",

        coverPhotoPublicId:
          coverPhotoPublicId || "",
      });

      const updatedUser = {
        ...user,
        coverPhoto,
        coverPhotoPublicId,
      };

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      Alert.alert(
        "Success",
        "Farm updated successfully"
      );

      router.back();
    } catch (error) {
      console.log(
        "SAVE USER ERROR:",
        JSON.stringify(error)
      );

      Alert.alert(
        "Error",
        String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-green-900">
      <StatusBar
        barStyle="light-content"
      />

      {/* HEADER */}
      <View className="flex-row items-center bg-green-900 pt-14 px-5 pb-3">
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-white text-xl font-bold mr-10">
          Edit Farm Profile
        </Text>
      </View>

      {/* COVER PHOTO */}
      {/* COVER PHOTO */}
      <View className="bg-green-900 px-5 pb-5">
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.85}
          className="w-full h-52 rounded-3xl overflow-hidden border border-white/20 bg-gray-200"
        >
          {user.coverPhoto ? (
            <>
              <Image
                source={{
                  uri: user.coverPhoto,
                }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />

              {/* OVERLAY */}
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <AntDesign
                  name="camera"
                  size={14}
                  color="white"
                />

                <Text className="text-white text-sm font-semibold ml-1">
                  Change Photo
                </Text>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AntDesign
                  name="camera"
                  size={26}
                  color="white"
                />
              </View>

              <Text className="text-white text-base font-semibold mt-3">
                Upload Cover Photo
              </Text>

              <Text className="text-white/70 text-sm mt-1">
                16:9 recommended
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View className="flex-1 bg-gray-100 rounded-t-[30px] -mt-3.5">
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
          }}
        >
          {/* HEADER */}
          <View className="flex-row items-center mb-5">
            <MaterialIcons
              name="agriculture"
              size={22}
              color="#15803d"
            />

            <Text className="text-lg font-bold text-gray-900 ml-2">
              Farm Details
            </Text>
          </View>

          {/* FARM NAME */}
          <FieldLabel label="Farm Name" />

          <TextInput
            value={user.farmName}
            onChangeText={(text) =>
              setUser((prev) => ({
                ...prev,
                farmName: text,
              }))
            }
            placeholder="e.g. Dela Cruz Farm"
            placeholderTextColor="#aaa"
            className="bg-white rounded-xl px-4 py-4 mb-4 text-base text-gray-900 border border-gray-200"
          />

          {/* LOCATION */}
          <View className="flex-row items-center mt-1 mb-4">
            <Ionicons
              name="location-outline"
              size={18}
              color="#15803d"
            />

            <Text className="text-base font-semibold text-gray-700 ml-2">
              Location
            </Text>
          </View>

          {/* BARANGAY */}
          <FieldLabel label="Barangay" />

          <TextInput
            value={user.barangay}
            onChangeText={(text) =>
              setUser((prev) => ({
                ...prev,
                barangay: text,
              }))
            }
            placeholder="e.g. Brgy. San Isidro"
            placeholderTextColor="#aaa"
            className="bg-white rounded-xl px-4 py-4 mb-4 text-base text-gray-900 border border-gray-200"
          />

          {/* MUNICIPALITY */}
          <FieldLabel label="Municipality / City" />

          <TextInput
            value={user.municipality}
            onChangeText={(text) =>
              setUser((prev) => ({
                ...prev,
                municipality: text,
              }))
            }
            placeholder="e.g. Hagonoy"
            placeholderTextColor="#aaa"
            className="bg-white rounded-xl px-4 py-4 mb-4 text-base text-gray-900 border border-gray-200"
          />

          {/* PROVINCE */}
          <FieldLabel label="Province" />

          <TextInput
            value={user.province}
            onChangeText={(text) =>
              setUser((prev) => ({
                ...prev,
                province: text,
              }))
            }
            placeholder="e.g. Bulacan"
            placeholderTextColor="#aaa"
            className="bg-white rounded-xl px-4 py-4 mb-4 text-base text-gray-900 border border-gray-200"
          />

          {/* ABOUT */}
          <View className="flex-row items-center mt-1 mb-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#15803d"
            />

            <Text className="text-base font-semibold text-gray-700 ml-2">
              About
            </Text>
          </View>

          <TextInput
            value={user.about}
            onChangeText={(text) =>
              setUser((prev) => ({
                ...prev,
                about: text,
              }))
            }
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Tell buyers about your farm..."
            placeholderTextColor="#aaa"
            className="bg-white rounded-xl px-4 pt-3 pb-3 mb-4 text-base text-gray-900 border border-gray-200 h-28"
          />

          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            className={`flex-row items-center justify-center py-4 rounded-2xl mt-6 ${loading
                ? "bg-green-300"
                : "bg-green-700"
              }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="white"
                />

                <Text className="text-white font-bold text-lg ml-2">
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const FieldLabel = ({
  label,
}: {
  label: string;
}) => (
  <Text className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1.5">
    {label}
  </Text>
);

export default EditProfileFarm;