import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  AntDesign,
  Ionicons,
} from "@expo/vector-icons";

import { useRouter } from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";
import {
  useFocusEffect,
} from "expo-router";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../FirebaseConfig";

import { UserType } from "../../../src/types/user";

const Profile = () => {

  const router = useRouter();

  const [user, setUser] =
    useState<UserType | null>(null);

  const [productsCount, setProductsCount] =
    useState(0);

  const [ordersCount, setOrdersCount] =
    useState(0);

  const [farmerRating, setFarmerRating] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useFocusEffect(
    React.useCallback(() => {

      loadProfile();

    }, [])
  );

  const loadProfile = async () => {

    try {

      setLoading(true);

      const storedUser =
        await AsyncStorage.getItem(
          "user"
        );

      if (!storedUser) return;

      const parsedUser =
        JSON.parse(storedUser);

      // ================= USER =================
      const userRef = doc(
        db,
        "users",
        parsedUser.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (userSnap.exists()) {

        const userData =
          userSnap.data() as UserType;

        setUser(userData);
      }

      // ================= PRODUCTS =================
      const productsQuery = query(
        collection(db, "products"),
        where(
          "farmerId",
          "==",
          parsedUser.uid
        )
      );

      const productSnap =
        await getDocs(productsQuery);

      setProductsCount(
        productSnap.size
      );

      // ================= ORDERS =================
      const ordersQuery = query(
        collection(db, "orders"),
        where(
          "farmerId",
          "==",
          parsedUser.uid
        )
      );

      const ordersSnap =
        await getDocs(ordersQuery);

      setOrdersCount(
        ordersSnap.size
      );

      // ================= FARMER RATINGS =================
      const ratingsQuery = query(
        collection(
          db,
          "farmerRatings"
        ),
        where(
          "farmerId",
          "==",
          parsedUser.uid
        )
      );

      const ratingsSnap =
        await getDocs(ratingsQuery);

      if (!ratingsSnap.empty) {

        let total = 0;

        ratingsSnap.forEach((doc) => {

          total +=
            doc.data().rating || 0;

        });

        const average =
          total / ratingsSnap.size;

        setFarmerRating(
          Number(
            average.toFixed(1)
          )
        );
      }

    } catch (error) {

      console.log(
        "PROFILE ERROR:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  // ================= LOADING =================
  if (loading) {

    return (

      <View className="flex-1 justify-center items-center bg-green-700">

        <ActivityIndicator
          size="large"
          color="#fff"
        />

      </View>
    );
  }

  return (

    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="px-6 pt-16 pb-20">

        {/* QR */}
        <TouchableOpacity
          className="absolute right-8 top-16"
          onPress={() =>
            router.push({
              pathname:
                "/farmer/profile/qr",
              params: {
                uid: user?.uid,
              },
            })
          }
        >

          <Ionicons
            name="qr-code"
            size={35}
            color="white"
          />

        </TouchableOpacity>

        {/* PROFILE */}
        <View className="items-center">

          <View className="relative">

            {/* PROFILE IMAGE */}
            {user?.profileImage ? (

              <Image
                source={{
                  uri:
                    user.profileImage,
                }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 999,
                  borderWidth: 4,
                  borderColor: "white",
                }}
                resizeMode="cover"
              />

            ) : (

              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 999,
                  backgroundColor:
                    "white",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  borderWidth: 4,
                  borderColor:
                    "white",
                }}
              >

                <Ionicons
                  name="person"
                  size={55}
                  color="#9ca3af"
                />

              </View>

            )}

            {/* CHANGE IMAGE BUTTON */}
            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/farmer/profile/account-setting"
                )
              }
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor:
                  "#15803d",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                borderWidth: 2,
                borderColor:
                  "white",
              }}
            >

              <Ionicons
                name="camera"
                size={18}
                color="white"
              />

            </TouchableOpacity>

          </View>

          {/* NAME */}
          <Text className="text-white text-3xl font-bold mt-4">

            {String(
              user?.fullName || ""
            )}

          </Text>

          {/* VERIFIED */}
          <View className="flex-row items-center mt-2">

            <Text className="text-white text-sm font-medium">
              Registered Farmer
            </Text>

            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4ade80"
              style={{
                marginLeft: 4,
              }}
            />

          </View>

        </View>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6 -mt-10">

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
        >

          {/* STATS */}
          <View className="flex-row bg-white rounded-3xl p-5 justify-between shadow-sm">

            {/* PRODUCTS */}
            <View className="items-center flex-1">

              <Text className="font-bold text-2xl text-gray-900">
                {productsCount}
              </Text>

              <Text className="text-gray-500 text-xs mt-1">
                PRODUCTS
              </Text>

            </View>

            {/* ORDERS */}
            <View className="items-center flex-1">

              <Text className="font-bold text-2xl text-gray-900">
                {ordersCount}
              </Text>

              <Text className="text-gray-500 text-xs mt-1">
                ORDERS
              </Text>

            </View>

            {/* RATING */}
            <View className="items-center flex-1">

              <Text className="font-bold text-2xl text-gray-900">

                {farmerRating || "0.0"}

              </Text>

              <Text className="text-gray-500 text-xs mt-1">
                RATING
              </Text>

            </View>

          </View>

          {/* FARM PROFILE */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/farmer/profile/edit-profile-farm"
              )
            }
          >

            <View className="bg-white mt-6 rounded-3xl p-5 flex-row items-center justify-between">

              <View className="flex-row items-center">

                <Ionicons
                  name="leaf-outline"
                  size={22}
                  color="#15803d"
                />

                <Text className="font-semibold text-base ml-3">
                  Farm Profile
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />

            </View>

          </TouchableOpacity>

          {/* ACCOUNT SETTINGS */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/farmer/profile/account-setting"
              )
            }
          >

            <View className="bg-white mt-4 rounded-3xl p-5 flex-row items-center justify-between">

              <View className="flex-row items-center">

                <Ionicons
                  name="settings-outline"
                  size={22}
                  color="#15803d"
                />

                <Text className="font-semibold text-base ml-3">
                  Account Settings
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />

            </View>

          </TouchableOpacity>

          {/* LOGOUT */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {

              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Logout",
                    style:
                      "destructive",

                    onPress:
                      async () => {

                        await AsyncStorage.removeItem(
                          "user"
                        );

                        router.replace(
                          "/auth/login"
                        );
                      },
                  },
                ]
              );
            }}
          >

            <View className="bg-red-50 mt-4 rounded-3xl p-5 flex-row items-center justify-between mb-10">

              <View className="flex-row items-center">

                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#dc2626"
                />

                <Text className="font-semibold text-base ml-3 text-red-600">
                  Logout
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#dc2626"
              />

            </View>

          </TouchableOpacity>

        </ScrollView>

      </View>

    </View>
  );
};

export default Profile;