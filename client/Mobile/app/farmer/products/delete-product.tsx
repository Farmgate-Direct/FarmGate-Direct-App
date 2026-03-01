import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const DeleteProductModal = ({ visible, onCancel, onConfirm, message }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            {message || "Are you sure you want to delete this product?"}
          </Text>

          <View className="flex-row justify-between">
            <TouchableOpacity onPress={onCancel} className="w-[48%] border border-gray-400 py-3 rounded-xl items-center">
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm} className="w-[48%] bg-red-600 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteProductModal;