// farmer/products/delete-product.tsx
import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ProductType } from "../../../src/types/product";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  product?: ProductType | null;
};

const DeleteProductModal = ({ visible, onCancel, onConfirm, loading, product }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">

          {/* TITLE */}
          <Text className="text-center text-lg font-bold mb-2 text-red-600">
            Delete Product
          </Text>

          {/* PRODUCT NAME */}
          <Text className="text-center text-gray-800 font-semibold mb-3">
            {product?.name || "This product"}
          </Text>

          {/* CONFIRM MESSAGE */}
          <Text className="text-center text-gray-500 mb-6">
            Are you sure you want to delete{" "}
            <Text className="font-bold text-gray-700">
              {product?.name}
            </Text>
            ? This action cannot be undone.
          </Text>

          {/* BUTTONS */}
          <View className="flex-row justify-between">

            <TouchableOpacity
              onPress={onCancel}
              className="w-[48%] border border-gray-400 py-3 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="w-[48%] bg-red-600 py-3 rounded-xl items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">
                  Delete
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteProductModal;