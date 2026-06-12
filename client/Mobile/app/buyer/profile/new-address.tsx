import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Dropdown }
  from "react-native-element-dropdown";

import {
  addAddress,
} from "@/src/services/addressService";

const PSGC_BASE =
  "https://psgc.gitlab.io/api";

const NewAddress = () => {

  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

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

  // ================= DROPDOWNS =================
  const [regions, setRegions] =
    useState<any[]>([]);

  const [provinces, setProvinces] =
    useState<any[]>([]);

  const [cities, setCities] =
    useState<any[]>([]);

  const [barangays, setBarangays] =
    useState<any[]>([]);

  const [selectedRegion, setSelectedRegion] =
    useState<any>(null);

  const [selectedProvince, setSelectedProvince] =
    useState<any>(null);

  const [selectedCity, setSelectedCity] =
    useState<any>(null);

  const [selectedBarangay, setSelectedBarangay] =
    useState<any>(null);

  // ================= LOAD REGIONS =================
  useEffect(() => {

    loadRegions();

  }, []);

  const loadRegions =
    async () => {

      try {

        const response =
          await fetch(
            `${PSGC_BASE}/regions`
          );

        const data =
          await response.json();

        setRegions(data);

      } catch (error) {

        console.log(error);

      }
    };

  // ================= LOAD PROVINCES =================
  const loadProvinces =
    async (
      regionCode: string
    ) => {

      try {

        const response =
          await fetch(
            `${PSGC_BASE}/regions/${regionCode}/provinces`
          );

        const data =
          await response.json();

        setProvinces(data);

      } catch (error) {

        console.log(error);

      }
    };

  // ================= LOAD CITIES =================
  const loadCities =
    async (
      provinceCode: string
    ) => {

      try {

        const response =
          await fetch(
            `${PSGC_BASE}/provinces/${provinceCode}/cities-municipalities`
          );

        const data =
          await response.json();

        setCities(data);

      } catch (error) {

        console.log(error);

      }
    };

  // ================= LOAD BARANGAYS =================
  const loadBarangays =
    async (
      cityCode: string
    ) => {

      try {

        const response =
          await fetch(
            `${PSGC_BASE}/cities-municipalities/${cityCode}/barangays`
          );

        const data =
          await response.json();

        setBarangays(data);

      } catch (error) {

        console.log(error);

      }
    };

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

        if (
          !fullName ||
          !phone ||
          !selectedRegion ||
          !selectedProvince ||
          !selectedCity ||
          !selectedBarangay ||
          !street
        ) {

          Alert.alert(
            "Error",
            "Please fill all fields"
          );

          return;
        }

        if (
          !validatePhone(phone)
        ) {

          Alert.alert(
            "Invalid Phone",
            "Enter valid PH number"
          );

          return;
        }

        setLoading(true);

        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        const user =
          userStr
            ? JSON.parse(userStr)
            : null;

        if (!user) return;

        await addAddress({

          userId:
            user.uid ||
            user.userId ||
            user.id,

          fullName,

          phone,

          region:
            selectedRegion.name,

          province:
            selectedProvince.name,

          city:
            selectedCity.name,

          barangay:
            selectedBarangay.name,

          postalCode,

          street,

          isDefault,
        });

        Alert.alert(
          "Success",
          "Address added"
        );

        router.back();

      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Failed to save address"
        );

      } finally {

        setLoading(false);

      }
    };

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
          New Address
        </Text>

      </View>

      {/* BODY */}
      <ScrollView
        className="flex-1 bg-white rounded-t-[40px] px-6 pt-8"
        showsVerticalScrollIndicator={false}
      >

        {/* FULL NAME */}
        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
        />

        {/* PHONE */}
        <TextInput
          placeholder="09XXXXXXXXX"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
        />

        {/* REGION */}
        <Dropdown
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 58,
            marginBottom: 16,
          }}
          data={regions}
          labelField="name"
          valueField="code"
          placeholder="Select Region"
          search
          value={selectedRegion?.code}
          onChange={(item) => {

            setSelectedRegion(item);

            setSelectedProvince(null);
            setSelectedCity(null);
            setSelectedBarangay(null);

            setProvinces([]);
            setCities([]);
            setBarangays([]);

            loadProvinces(item.code);
          }}
        />

        {/* PROVINCE */}
        <Dropdown
          disable={!selectedRegion}
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 58,
            marginBottom: 16,
            opacity:
              selectedRegion
                ? 1
                : 0.5,
          }}
          data={provinces}
          labelField="name"
          valueField="code"
          placeholder="Select Province"
          search
          value={selectedProvince?.code}
          onChange={(item) => {

            setSelectedProvince(item);

            setSelectedCity(null);
            setSelectedBarangay(null);

            setCities([]);
            setBarangays([]);

            loadCities(item.code);
          }}
        />

        {/* CITY */}
        <Dropdown
          disable={!selectedProvince}
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 58,
            marginBottom: 16,
            opacity:
              selectedProvince
                ? 1
                : 0.5,
          }}
          data={cities}
          labelField="name"
          valueField="code"
          placeholder="Select City"
          search
          value={selectedCity?.code}
          onChange={(item) => {

            setSelectedCity(item);

            setSelectedBarangay(null);

            setPostalCode(
              item.zipCode || ""
            );

            loadBarangays(item.code);
          }}
        />

        {/* BARANGAY */}
        <Dropdown
          disable={!selectedCity}
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 58,
            marginBottom: 16,
            opacity:
              selectedCity
                ? 1
                : 0.5,
          }}
          data={barangays}
          labelField="name"
          valueField="code"
          placeholder="Select Barangay"
          search
          value={selectedBarangay?.code}
          onChange={(item) => {

            setSelectedBarangay(item);
          }}
        />

        {/* POSTAL */}
        <TextInput
          placeholder="Postal Code"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
          className="bg-gray-100 rounded-xl px-4 py-4 mb-4"
        />

        {/* STREET */}
        <TextInput
          placeholder="House No. / Street"
          value={street}
          onChangeText={setStreet}
          className="bg-gray-100 rounded-xl px-4 py-4 mb-6"
        />

        {/* DEFAULT */}
        <View className="flex-row justify-between items-center mb-8">

          <Text className="text-gray-700 font-medium">
            Set as Default
          </Text>

          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{
              false: "#d1d5db",
              true: "#15803D",
            }}
          />

        </View>

        {/* BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading}
          onPress={handleSubmit}
          className="bg-green-700 rounded-xl py-4 items-center mb-10"
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