// app/buyer/(tabs)/qr.tsx

import { Ionicons } from "@expo/vector-icons";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import {
  router,
} from "expo-router";

import {
  useRef,
} from "react";

import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QRScanner() {

  // ================= CAMERA PERMISSION =================
  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  // ================= ANTI MULTIPLE SCAN =================
  const scanningRef =
    useRef(false);

  // ================= LOADING =================
  if (!permission) {

    return (
      <View className="flex-1 bg-white" />
    );
  }

  // ================= PERMISSION UI =================
  if (!permission.granted) {

    return (

      <View className="flex-1 items-center justify-center bg-white px-6">

        <Ionicons
          name="camera-outline"
          size={60}
          color="gray"
        />

        <Text className="text-center mt-4 text-gray-600">

          We need camera permission
          to scan QR codes.

        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="mt-6 bg-green-700 px-6 py-3 rounded-xl"
        >

          <Text className="text-white font-semibold">

            Allow Camera

          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  // ================= HANDLE QR SCAN =================
  const handleScan = ({
    data,
  }: any) => {

    // BLOCK MULTIPLE FAST SCANS
    if (scanningRef.current)
      return;

    scanningRef.current = true;

    console.log(
      "SCANNED:",
      data
    );

    // ================= VALID FARM QR =================
    // EXAMPLE:
    // client://farm/abc123

    if (
      data.startsWith(
        "client://farm/"
      )
    ) {

      const farmerId =
        data.replace(
          "client://farm/",
          ""
        );

      console.log(
        "FARMER ID:",
        farmerId
      );

      // REDIRECT
      router.push({
        pathname:
          "/buyer/farm/[farmerId]",

        params: {
          farmerId,
        },
      });

      // RESET SCANNER
      setTimeout(() => {

        scanningRef.current =
          false;

      }, 2000);

      return;
    }

    // ================= INVALID QR =================
    Alert.alert(
      "Invalid QR Code",
      "This QR code is not supported.",
      [
        {
          text: "OK",

          onPress: () => {

            scanningRef.current =
              false;
          },
        },
      ]
    );
  };

  return (

    <View className="flex-1 bg-black">

      {/* CAMERA */}
      <CameraView
        style={{ flex: 1 }}

        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}

        onBarcodeScanned={
          handleScan
        }
      />

      {/* OVERLAY */}
      <View className="absolute inset-0 items-center justify-center">

        <View className="w-64 h-64 border-4 border-green-500 rounded-2xl" />

        <Text className="text-white mt-4 text-base font-semibold">

          Align QR code inside
          the frame

        </Text>

      </View>

    </View>
  );
}