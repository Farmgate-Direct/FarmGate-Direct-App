import { Ionicons }
  from "@expo/vector-icons";

import AsyncStorage
  from "@react-native-async-storage/async-storage";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
} from "../../../src/services/addressService";

const AddressScreen = () => {

  const router =
    useRouter();

  const [addresses, setAddresses] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<any>(null);

  // ================= LOAD =================
  const loadAddresses =
    async () => {

      try {

        setLoading(true);

        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        const parsedUser =
          userStr
            ? JSON.parse(userStr)
            : null;

        if (!parsedUser) return;

        setUser(parsedUser);

        const data =
          await getUserAddresses(
            parsedUser.uid ||
            parsedUser.userId ||
            parsedUser.id
          );

        setAddresses(data);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }
    };

  useFocusEffect(
    useCallback(() => {

      loadAddresses();

    }, [])
  );

  // ================= SET DEFAULT =================
  const handleSetDefault =
    async (
      addressId: string
    ) => {

      try {

        if (!user) return;

        await setDefaultAddress(
          user.uid ||
          user.userId ||
          user.id,

          addressId
        );

        await loadAddresses();

        Alert.alert(
          "Success",
          "Default address updated"
        );

      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Failed to update default address"
        );
      }
    };

  // ================= DELETE =================
  const handleDelete =
    async (
      addressId: string
    ) => {

      try {

        Alert.alert(
          "Delete Address",
          "Are you sure you want to delete this address?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },

            {
              text: "Delete",

              style: "destructive",

              onPress:
                async () => {

                  await deleteAddress(
                    addressId
                  );

                  await loadAddresses();
                },
            },
          ]
        );

      } catch (error) {

        console.log(error);

      }
    };

  // ================= LOADING =================
  if (loading) {

    return (

      <View className="flex-1 justify-center items-center bg-white">

        <ActivityIndicator
          size="large"
          color="#15803D"
        />

      </View>
    );
  }

  return (

    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="px-6 pt-16 pb-5 flex-row items-center">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold ml-5">
          My Address
        </Text>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[40px] px-5 pt-6">

        {addresses.length === 0 ? (

          <View className="flex-1 justify-center items-center -mt-20">

            <Ionicons
              name="location-outline"
              size={80}
              color="#D1D5DB"
            />

            <Text className="text-gray-500 text-base mt-4">
              No address added yet
            </Text>

            <Text className="text-gray-400 text-sm mt-1 text-center px-10">
              Add your delivery address
              to continue ordering
            </Text>

          </View>

        ) : (

          <FlatList
            data={addresses}
            keyExtractor={(item, index) =>
              item.id ??
              index.toString()
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingTop: 5,
            }}
            renderItem={({ item }) => (

              <TouchableOpacity
                activeOpacity={0.85}
                className={`rounded-3xl p-5 mb-4 border ${
                  item.isDefault
                    ? "bg-green-50 border-green-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >

                {/* TOP */}
                <View className="flex-row justify-between items-start">

                  <View className="flex-1 pr-3">

                    <Text className="text-gray-800 text-lg font-bold">
                      {item.fullName}
                    </Text>

                    <Text className="text-gray-500 mt-1">
                      {item.phone}
                    </Text>

                  </View>

                  {item.isDefault && (

                    <View className="bg-green-700 px-3 py-1 rounded-full">

                      <Text className="text-white text-xs font-bold">
                        DEFAULT
                      </Text>

                    </View>

                  )}

                </View>

                {/* ADDRESS */}
                <View className="mt-4">

                  <Text className="text-gray-700 leading-6">

                    {item.street}

                    {", "}

                    {item.barangay}

                    {", "}

                    {item.city}

                    {", "}

                    {item.province}

                    {", "}

                    {item.region}

                    {" "}

                    {item.postalCode}

                  </Text>

                </View>

                {/* ACTIONS */}
                <View className="flex-row mt-5">

                  {!item.isDefault && (

                    <TouchableOpacity
                      onPress={() =>
                        handleSetDefault(
                          item.id
                        )
                      }
                      className="bg-green-700 px-4 py-2 rounded-xl mr-2"
                    >

                      <Text className="text-white text-xs font-bold">
                        Set Default
                      </Text>

                    </TouchableOpacity>

                  )}

                  <TouchableOpacity
                    onPress={() =>
                      handleDelete(
                        item.id
                      )
                    }
                    className="bg-red-100 px-4 py-2 rounded-xl"
                  >

                    <Text className="text-red-600 text-xs font-bold">
                      Delete
                    </Text>

                  </TouchableOpacity>

                </View>

              </TouchableOpacity>
            )}
          />
        )}

        {/* BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          className="absolute bottom-6 left-5 right-5 bg-green-700 py-4 rounded-2xl items-center shadow-lg"
          onPress={() =>
            router.push(
              "/buyer/profile/new-address"
            )
          }
        >

          <Text className="text-white font-bold text-base">
            + Add New Address
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
};

export default AddressScreen;