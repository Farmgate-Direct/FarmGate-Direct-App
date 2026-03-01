import { Ionicons, AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EditProfleFarm = () => {
  return (
    <View className="flex-1 bg-green-800">
      {/* GREEN HEADER / COVER PHOTO */}
      <View className="bg-green-800 pt-16 pb-24 items-center justify-center">
        {/* Back Button */}
        <TouchableOpacity
          className="absolute left-6 top-6"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Upload Cover Photo */}
        <TouchableOpacity className="items-center">
          <AntDesign name="edit" size={30} color="white" />
          <Text className="text-white mt-2 text-base">Upload cover photo</Text>
        </TouchableOpacity>
      </View>

      {/* WHITE CONTAINER */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-8 -mt-12">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* FARM PROFILE TITLE */}
          <Text className="text-lg font-semibold mb-6">Farm Profile</Text>

          {/* FARM NAME */}
          <Text className="text-gray-500 text-xs mb-1">FARM NAME</Text>
          <TextInput
            placeholder=""
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* LOCATION */}
          <Text className="text-gray-500 text-xs mb-1">LOCATION</Text>
          <TextInput
            placeholder=""
            className="bg-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* ABOUT FARM */}
          <Text className="text-gray-500 text-xs mb-1">ABOUT FARM</Text>
          <TextInput
            placeholder=""
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-gray-200 rounded-lg px-4 py-3 h-28"
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default EditProfleFarm;