import { MaterialCommunityIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Dropdown } from "react-native-element-dropdown";

import {
  addAddress,
} from "@/src/services/addressService";

import { useToast } from "../../../context/ToastContext";

import {
  BULACAN_PROVINCE,
  BULACAN_CITIES,
  barangaysForCity,
} from "@/constants/bulacanBarangays";

// Province is locked to Bulacan. City then Barangay dropdowns come from the
// local dataset so names match the backend exactly (exact match only, no fuzzy).
const LOCKED_REGION = "Central Luzon (Region III)";

const NewAddress = () => {

  const router =
    useRouter();

  const { showToast } = useToast();

  const [loading, setLoading] =
    useState(false);

  // Local dataset loads synchronously; no network wait.
  const locationLoading = false;

  // ================= USER INPUT =================

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [street, setStreet] =
    useState("");

  const [postalCode, setPostalCode] =
    useState("");

  const [isDefault, setIsDefault] =
    useState(false);

  // ================= FIXED LOCATION (Bulacan locked) =================

  const selectedRegion = { name: LOCKED_REGION };
  const selectedProvince = { name: BULACAN_PROVINCE };

  // ================= DROPDOWNS (local dataset) =================

  const cities = BULACAN_CITIES.map((name) => ({ name, code: name }));

  const [selectedCity, setSelectedCity] =
    useState<any>(null);

  const [selectedBarangay, setSelectedBarangay] =
    useState<any>(null);

  const barangays = selectedCity
    ? barangaysForCity(selectedCity.name).map((name) => ({ name, code: name }))
    : [];

  // ================= PHONE VALIDATION =================

  const validatePhone =
    (number: string) => {

      const regex =
        /^(09\d{9}|\+639\d{9})$/;

      return regex.test(number);
    };

  // ================= SUBMIT =================

  const handleSubmit =
    async () => {

      try {

        // ==========================================
        // VALIDATE LOCATION
        // ==========================================

        if (
          !selectedRegion ||
          !selectedProvince
        ) {

          showToast("Location is still loading. Please wait.");

          return;
        }

        // ==========================================
        // VALIDATE INPUT
        // ==========================================

        if (
          !fullName.trim() ||
          !phone.trim() ||
          !selectedCity ||
          !selectedBarangay ||
          !street.trim()
        ) {

          showToast("Please fill all fields");

          return;
        }

        // ==========================================
        // VALIDATE PHONE
        // ==========================================

        if (
          !validatePhone(
            phone.trim()
          )
        ) {

          showToast("Enter a valid Philippine mobile number.");

          return;
        }

        setLoading(true);

        // ==========================================
        // GET USER
        // ==========================================

        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        const user =
          userStr
            ? JSON.parse(userStr)
            : null;

        if (!user) {

          showToast("User session not found.");

          return;
        }

        // ==========================================
        // SAVE ADDRESS
        // ==========================================

        await addAddress({

          userId:
            user.uid ||
            user.userId ||
            user.id,

          fullName:
            fullName.trim(),

          phone:
            phone.trim(),

          // ========================================
          // LOCKED TO BULACAN (local dataset)
          // ========================================

          region:
            selectedRegion.name,

          province:
            selectedProvince.name,

          // ========================================
          // USER SELECTED
          // ========================================

          city:
            selectedCity.name,

          barangay:
            selectedBarangay.name,

          postalCode:
            postalCode.trim(),

          street:
            street.trim(),

          isDefault,

        });

        router.back();
        showToast("Address added successfully.");

      } catch (error) {

        console.log(
          "Save address error:",
          error
        );

        showToast("Failed to save address.");

      } finally {

        setLoading(false);

      }
    };

  // ================= LOADING LOCATION =================

  if (locationLoading) {

    return (

      <View className="flex-1 bg-white">

        <View className="bg-green-900 pt-14 pb-4 px-5 rounded-b-2xl flex-row items-center">

          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >

            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="white"
            />

          </TouchableOpacity>

          <Text className="text-white font-bold text-lg ml-4">
            New Address
          </Text>

        </View>

        <View className="flex-1 justify-center items-center">

          <ActivityIndicator
            size="large"
            color="#14532d"
          />

          <Text className="text-gray-500 mt-4">
            Loading Bulacan locations...
          </Text>

        </View>

      </View>
    );
  }

  // ================= MAIN UI =================

  return (

    <View className="flex-1 bg-white">

      {/* ================= HEADER ================= */}

      <View className="bg-green-900 pt-14 pb-4 px-5 rounded-b-2xl flex-row items-center">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >

          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <Text className="text-white font-bold text-lg ml-4">
          New Address
        </Text>

      </View>

      {/* ================= BODY ================= */}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

      {/* ================= FULL NAME ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Full Name</Text>
      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        className="bg-gray-100 rounded-[5px] px-4 py-4 mb-4"
      />

      {/* ================= PHONE ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Phone Number</Text>
      <TextInput
        placeholder="09XXXXXXXXX"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={13}
        className="bg-gray-100 rounded-[5px] px-4 py-4 mb-4"
      />

      {/* ================= REGION ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Region</Text>
      <View className="bg-gray-100 rounded-[5px] px-4 py-4 mb-4">
        <Text className="text-gray-800 text-base font-medium">
          {selectedRegion?.name}
        </Text>
      </View>

      {/* ================= PROVINCE ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Province</Text>
      <View className="bg-gray-100 rounded-[5px] px-4 py-4 mb-4">
        <Text className="text-gray-800 text-base font-medium">
          {selectedProvince?.name}
        </Text>
      </View>

      {/* ================= CITY / MUNICIPALITY ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">City / Municipality</Text>
      <Dropdown
        style={{
          backgroundColor: "#F3F4F6",
          borderRadius: 5,
          paddingHorizontal: 16,
          height: 50,
          marginBottom: 16,
        }}
        data={cities}
        labelField="name"
        valueField="code"
        placeholder="Select City / Municipality"
        search
        searchPlaceholder="Search city or municipality..."
        value={selectedCity?.code}
        activeColor="#f0fdf4"
        onChange={(item) => {
          setSelectedCity(item);
          setSelectedBarangay(null);
        }}
      />

      {/* ================= BARANGAY ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Barangay</Text>
      <Dropdown
        disable={!selectedCity}
        style={{
          backgroundColor: "#F3F4F6",
          borderRadius: 5,
          paddingHorizontal: 16,
          height: 50,
          marginBottom: 16,
          opacity: selectedCity ? 1 : 0.5,
        }}
        data={barangays}
        labelField="name"
        valueField="code"
        placeholder="Select Barangay"
        search
        searchPlaceholder="Search barangay..."
        value={selectedBarangay?.code}
        activeColor="#f0fdf4"
        onChange={(item) => {
          setSelectedBarangay(item);
        }}
      />

      {/* ================= POSTAL CODE ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">Postal Code</Text>
      <TextInput
        placeholder="Postal Code"
        value={postalCode}
        onChangeText={setPostalCode}
        keyboardType="numeric"
        maxLength={4}
        className="bg-gray-100 rounded-[5px] px-4 py-4 mb-4"
      />

      {/* ================= STREET ================= */}
      <Text className="text-gray-500 text-xs mb-1 ml-1">House No. / Street</Text>
      <TextInput
        placeholder="House No. / Street"
        value={street}
        onChangeText={setStreet}
        className="bg-gray-100 rounded-[5px] px-4 py-4 mb-6"
      />

        {/* ================= DEFAULT ================= */}

        <View className="flex-row justify-between items-center mb-8 py-2 border-t border-gray-100 pt-6">

          <Text className="text-gray-700 font-medium text-sm">
            Set as Default
          </Text>

          <Switch
            value={isDefault}
            onValueChange={
              setIsDefault
            }
            trackColor={{
              false: "#d1d5db",
              true: "#14532d",
            }}
            thumbColor={
              isDefault
                ? "#ffffff"
                : "#f4f4f5"
            }
          />

        </View>

        {/* ================= SAVE ================= */}

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading}
          onPress={handleSubmit}
          className="rounded-[5px] py-4 items-center"
          style={{
            backgroundColor: loading ? "#9ca3af" : "#14532d",
            elevation: loading ? 0 : 4,
            shadowColor: "#14532d",
            shadowOpacity: 0.25,
            shadowRadius: 8,
          }}
        >

          {loading ? (

            <ActivityIndicator
              color="white"
            />

          ) : (

            <Text className="text-white font-bold text-base">
              Save Address
            </Text>

          )}

        </TouchableOpacity>

      </ScrollView>

    </View>
  );
};

export default NewAddress;