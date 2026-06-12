import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker
  from "expo-image-picker";

import { useRouter }
  from "expo-router";

import AntDesign
  from "@expo/vector-icons/AntDesign";

import { Dropdown }
  from "react-native-element-dropdown";

import {
  registerUser,
} from "../../src/services/authService";

import {
  saveUserToFirestore,
} from "../../src/services/firestoreService";

import {
  uploadValidIDAsync,
} from "../../src/services/cloudinaryValidIDService";

import {
  isGmail,
  isValidPhone,
} from "../../utils/validators";

const PSGC_BASE =
  "https://psgc.gitlab.io/api";

type InputProps = {
  label: string;
  value: string;
  setter: React.Dispatch<
    React.SetStateAction<string>
  >;
  secure?: boolean;
};

type UploadBoxProps = {
  label: string;
  value: string | null;
  setter: () => void;
};

const RegisterFarmer = () => {

  const router =
    useRouter();

  const [step, setStep] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  // ================= STEP 1 =================
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  // ================= STEP 2 =================
  const [farmName, setFarmName] =
    useState("");

  const [barangay, setBarangay] =
    useState("");

  const [
    municipality,
    setMunicipality,
  ] = useState("");

  const [province, setProvince] =
    useState("");

  const [validID, setValidID] =
    useState<string | null>(null);

  // ================= LOCATION =================
  const [regions, setRegions] =
    useState<any[]>([]);

  const [provinces, setProvinces] =
    useState<any[]>([]);

  const [cities, setCities] =
    useState<any[]>([]);

  const [barangays, setBarangays] =
    useState<any[]>([]);

  const [
    selectedRegion,
    setSelectedRegion,
  ] = useState<any>(null);

  const [
    selectedProvince,
    setSelectedProvince,
  ] = useState<any>(null);

  const [
    selectedCity,
    setSelectedCity,
  ] = useState<any>(null);

  const [
    selectedBarangay,
    setSelectedBarangay,
  ] = useState<any>(null);

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

  // ================= PICK IMAGE =================
  const pickImage = async (
    setter: React.Dispatch<
      React.SetStateAction<
        string | null
      >
    >
  ) => {

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });

    if (!result.canceled) {

      setter(
        result.assets[0].uri
      );

    }
  };

  // ================= NEXT STEP =================
  const nextStep = () => {

    if (step < 2) {

      setStep(step + 1);

    }
  };

  // ================= PREVIOUS STEP =================
  const prevStep = () => {

    if (step > 1) {

      setStep(step - 1);

    }
  };

  // ================= REGISTER =================
  const handleRegister =
    async () => {

      if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword ||
        !farmName ||
        !barangay ||
        !municipality ||
        !province ||
        !validID
      ) {

        Alert.alert(
          "Please complete all required fields."
        );

        return;
      }

      if (
        !isGmail(email)
      ) {

        Alert.alert(
          "Email must be a valid Gmail."
        );

        return;
      }

      if (
        !isValidPhone(phone)
      ) {

        Alert.alert(
          "Invalid phone number."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {

        Alert.alert(
          "Passwords do not match."
        );

        return;
      }

      try {

        setLoading(true);

        // FIREBASE AUTH
        const user =
          await registerUser(
            fullName,
            email,
            password
          );

        // CLOUDINARY
        const validIDUrl =
          await uploadValidIDAsync(
            validID
          );

        // FIRESTORE
        await saveUserToFirestore(
          user.uid,
          {
            uid: user.uid,
            fullName,
            email,
            phone,
            role: "farmer",
            status: "approved",
            farmName,
            barangay,
            municipality,
            province,
            validID:
              validIDUrl,
            createdAt:
              new Date(),
          }
        );

        setLoading(false);

        Alert.alert(
          "Farmer account created successfully!"
        );

        router.push(
          "/auth/login"
        );

      } catch (error: any) {

        setLoading(false);

        Alert.alert(
          error.message
        );
      }
    };

  // ================= STEP INDICATOR =================
  const StepIndicator =
    () => (

      <View className="flex-row justify-center mt-4 mb-6">

        {[1, 2].map(
          (item) => (

            <View
              key={item}
              className={`w-8 h-8 rounded-full mx-5 items-center justify-center ${
                step >= item
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >

              <Text className="text-white font-bold">
                {item}
              </Text>

            </View>
          )
        )}

      </View>
    );

  return (

    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="items-center pt-16 pb-6">

        <Image
          source={require("../../assets/Farmgate-logos/farmgate-logo.png")}
          className="w-16 h-16 mb-3"
          resizeMode="contain"
        />

        <Text className="text-white text-[26px] font-bold">
          FARMER REGISTRATION
        </Text>

        <StepIndicator />

      </View>

      {/* WHITE CARD */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-6 justify-between">

        {step === 1 ? (

          <ScrollView
            showsVerticalScrollIndicator={false}
          >

            <Input
              label="Full Name"
              value={fullName}
              setter={setFullName}
            />

            <Input
              label="Email"
              value={email}
              setter={setEmail}
            />

            <Input
              label="Phone No."
              value={phone}
              setter={setPhone}
            />

            <Input
              label="Password"
              value={password}
              setter={setPassword}
              secure
            />

            <Input
              label="Confirm Password"
              value={
                confirmPassword
              }
              setter={
                setConfirmPassword
              }
              secure
            />

          </ScrollView>

        ) : (

          <ScrollView
            showsVerticalScrollIndicator={false}
          >

            <Input
              label="Farm Name"
              value={farmName}
              setter={setFarmName}
            />

            {/* REGION */}
            <Text className="text-green-700 mb-2">
              Region
            </Text>

            <Dropdown
              style={{
                borderWidth: 1,
                borderColor:
                  "#15803D",
                borderRadius: 10,
                paddingHorizontal: 16,
                height: 55,
                marginBottom: 14,
              }}
              data={regions}
              labelField="name"
              valueField="code"
              placeholder="Select Region"
              search
              value={
                selectedRegion?.code
              }
              onChange={(item) => {

                setSelectedRegion(
                  item
                );

                setSelectedProvince(
                  null
                );

                setSelectedCity(
                  null
                );

                setSelectedBarangay(
                  null
                );

                setProvince("");

                setMunicipality("");

                setBarangay("");

                setProvinces([]);

                setCities([]);

                setBarangays([]);

                loadProvinces(
                  item.code
                );
              }}
            />

            {/* PROVINCE */}
            <Text className="text-green-700 mb-2">
              Province
            </Text>

            <Dropdown
              disable={
                !selectedRegion
              }
              style={{
                borderWidth: 1,
                borderColor:
                  "#15803D",
                borderRadius: 10,
                paddingHorizontal: 16,
                height: 55,
                marginBottom: 14,
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
              value={
                selectedProvince?.code
              }
              onChange={(item) => {

                setSelectedProvince(
                  item
                );

                setProvince(
                  item.name
                );

                setSelectedCity(
                  null
                );

                setSelectedBarangay(
                  null
                );

                setMunicipality(
                  ""
                );

                setBarangay("");

                setCities([]);

                setBarangays([]);

                loadCities(
                  item.code
                );
              }}
            />

            {/* MUNICIPALITY */}
            <Text className="text-green-700 mb-2">
              Municipality
            </Text>

            <Dropdown
              disable={
                !selectedProvince
              }
              style={{
                borderWidth: 1,
                borderColor:
                  "#15803D",
                borderRadius: 10,
                paddingHorizontal: 16,
                height: 55,
                marginBottom: 14,
                opacity:
                  selectedProvince
                    ? 1
                    : 0.5,
              }}
              data={cities}
              labelField="name"
              valueField="code"
              placeholder="Select Municipality"
              search
              value={
                selectedCity?.code
              }
              onChange={(item) => {

                setSelectedCity(
                  item
                );

                setMunicipality(
                  item.name
                );

                setSelectedBarangay(
                  null
                );

                setBarangay("");

                loadBarangays(
                  item.code
                );
              }}
            />

            {/* BARANGAY */}
            <Text className="text-green-700 mb-2">
              Barangay
            </Text>

            <Dropdown
              disable={
                !selectedCity
              }
              style={{
                borderWidth: 1,
                borderColor:
                  "#15803D",
                borderRadius: 10,
                paddingHorizontal: 16,
                height: 55,
                marginBottom: 18,
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
              value={
                selectedBarangay?.code
              }
              onChange={(item) => {

                setSelectedBarangay(
                  item
                );

                setBarangay(
                  item.name
                );
              }}
            />

            <UploadBox
              label="Valid ID"
              value={validID}
              setter={() =>
                pickImage(
                  setValidID
                )
              }
            />

          </ScrollView>

        )}

        {/* BUTTONS */}
        <View className="items-center mt-4 w-full">

          {step === 1 ? (

            <TouchableOpacity
              onPress={nextStep}
              className="bg-green-700 py-3 rounded-xl w-40"
            >

              <Text className="text-white text-center font-bold text-lg">
                Next
              </Text>

            </TouchableOpacity>

          ) : (

            <View className="flex-row justify-center items-center">

              <TouchableOpacity
                onPress={prevStep}
                className="border border-green-700 py-3 rounded-xl w-40 mr-4"
              >

                <Text className="text-center text-green-700 font-bold text-lg">
                  Back
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={
                  handleRegister
                }
                className="bg-green-700 py-3 rounded-xl w-40"
              >

                {loading ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <Text className="text-white text-center font-bold text-lg">
                    Register
                  </Text>

                )}

              </TouchableOpacity>

            </View>

          )}

        </View>

      </View>

    </View>
  );
};

// ================= INPUT =================
const Input = ({
  label,
  value,
  setter,
  secure,
}: InputProps) => (

  <>

    <Text className="text-green-700 mb-2">
      {label}
    </Text>

    <TextInput
      value={value}
      onChangeText={setter}
      secureTextEntry={
        secure ?? false
      }
      className="border border-green-700 rounded-lg px-4 py-3 mb-3"
    />

  </>
);

// ================= IMAGE UPLOAD =================
const UploadBox = ({
  label,
  value,
  setter,
}: UploadBoxProps) => (

  <>

    <Text className="text-green-700 mb-2">
      {label}
    </Text>

    <TouchableOpacity
      onPress={setter}
      className="bg-gray-200 border border-green-700 rounded-lg py-4 px-4 mb-4 flex-row items-center justify-center"
    >

      {value ? (

        <View className="flex-row items-center">

          <Text className="text-green-700 font-semibold mr-2">
            Uploaded
          </Text>

          <AntDesign
            name="check"
            size={22}
            color="green"
          />

        </View>

      ) : (

        <Text className="text-gray-500">
          Upload {label}
        </Text>

      )}

    </TouchableOpacity>

  </>
);

export default RegisterFarmer;