import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Index = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-green-700">
      {/* background */}
      <ImageBackground
        className="flex-1 justify-end"
        resizeMode="cover"
         source={require("../assets/Farmgate-logos/starting-page.png")}
      >
        {/* Container */}
        <View className="bg-white rounded-t-[50%] px-6 pt-10 pb-12 items-center">
          {/* App logo */}
          <Image
            className="w-14 h-14 mb-4"
            resizeMode="contain"
             source={require("../assets/Farmgate-logos/farmgate-logo.png")}
          />

          {/* Title*/}
          <Text className="text-green-700 text-[30px] font-bold mb-2">
            FARMGATE DIRECT
          </Text>

          {/* Short description */}
          <Text className="text-center text-[#234a00] text-[15px] mb-8 px-4">
            From the hands of farmers to the homes of buyers.
          </Text>

          {/* Started button */}
          <TouchableOpacity
            className="bg-green-700 px-10 py-4 rounded-xl"
            onPress={() => router.push("/auth/login")}
          >
            <Text className="text-white font-bold text-lg">Get Started</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Index;