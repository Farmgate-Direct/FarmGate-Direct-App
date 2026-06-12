// app/farmer/profile/qr.tsx

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import React, {
  useRef,
  useState,
} from "react";

import {
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import QRCode from "react-native-qrcode-svg";

import ViewShot from "react-native-view-shot";

import * as MediaLibrary from "expo-media-library";

const QR = () => {

  const { uid } =
    useLocalSearchParams();

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const qrRef =
    useRef<any>(null);

  // ================= DOWNLOAD QR =================
  const handleDownload =
    async () => {

      try {

        // PERMISSION
        const permission =
         await MediaLibrary.requestPermissionsAsync(true);

        if (
          !permission.granted
        ) {

          Alert.alert(
            "Permission Denied",
            "Allow gallery access first."
          );

          return;
        }

        // CAPTURE QR
        const uri =
          await qrRef.current.capture();

        // SAVE IMAGE
        await MediaLibrary.saveToLibraryAsync(
          uri
        );

        Alert.alert(
          "Success",
          "QR Code saved to gallery."
        );

      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Failed to save QR Code."
        );
      }
    };

  return (

    <View className="flex-1 bg-green-700">

      {/* HEADER */}
      <View className="bg-green-700 px-6 py-4 pt-16 flex-row items-center justify-between">

        {/* LEFT */}
        <View className="flex-row items-center">

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

          <Text className="text-white text-[25px] font-bold ml-3">

            QR Code

          </Text>

        </View>

        {/* HELP */}
        <TouchableOpacity
          onPress={() =>
            setModalVisible(true)
          }
        >

          <Ionicons
            name="help-circle-outline"
            size={35}
            color="white"
          />

        </TouchableOpacity>

      </View>

      {/* BODY */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 justify-center items-center">

        {/* QR */}
        <ViewShot
          ref={qrRef}
          options={{
            format: "png",
            quality: 1,
          }}
        >

          <View className="border-4 border-green-600 p-5 rounded-2xl bg-white">

            <QRCode
              value={`client://farm/${uid}`}
              size={220}
            />

          </View>

        </ViewShot>

        {/* DOWNLOAD */}
        <TouchableOpacity
          onPress={handleDownload}
          className="bg-green-700 px-10 py-3 rounded-xl mt-8"
        >

          <Text className="text-white font-semibold">

            Download

          </Text>

        </TouchableOpacity>

        {/* INFO */}
        <Text className="text-center text-gray-600 mt-6 px-4">

          Download your QR code and
          place it at your farm gate
          or stall so buyers can scan
          and view your farm profile.

        </Text>

      </View>

      {/* MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
      >

        <View className="flex-1 bg-black/40 justify-center items-center px-6">

          <View className="bg-white rounded-2xl p-6 w-full">

            <Text className="text-lg font-bold text-green-700 mb-4">

              How to Use QR Code

            </Text>

            <Text className="text-gray-600 mb-2">

              1. Tap Download button.

            </Text>

            <Text className="text-gray-600 mb-2">

              2. Save QR code to your device.

            </Text>

            <Text className="text-gray-600 mb-2">

              3. Print the QR code.

            </Text>

            <Text className="text-gray-600 mb-4">

              4. Place it at your farm
              gate or selling area so
              buyers can scan it.

            </Text>

            <TouchableOpacity
              onPress={() =>
                setModalVisible(false)
              }
              className="bg-green-700 py-3 rounded-xl"
            >

              <Text className="text-white text-center font-semibold">

                Close

              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
};

export default QR;