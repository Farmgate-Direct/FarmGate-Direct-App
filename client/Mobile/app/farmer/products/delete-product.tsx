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

// ================= ARCHIVE PRODUCT CONFIRMATION =================
// Dating "Delete Product" - "Archive" na ito ngayon: hindi na tunay na
// binubura ang produkto, image, o harvest/order history nito. Naka-hide
// lang ito sa listing/homepage/FIFO selling, at puwede pa itong
// ma-unarchive sa hinaharap kung kinakailangan.
const DeleteProductModal = ({ visible, onCancel, onConfirm, loading, product }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">

          {/* TITLE */}
          <Text className="text-center text-lg font-bold mb-2 text-orange-600">
            Archive Product
          </Text>

          {/* PRODUCT NAME */}
          <Text className="text-center text-gray-800 font-semibold mb-3">
            {product?.name || "This product"}
          </Text>

          {/* CONFIRM MESSAGE */}
          <Text className="text-center text-gray-500 mb-6">
            I-a-archive ang{" "}
            <Text className="font-bold text-gray-700">
              {product?.name}
            </Text>
            . Hindi ito makikita sa iyong listing at sa mga buyer, pero
            mananatili ang lahat ng datos nito (harvest history, orders,
            reviews). Puwede mo pa itong ma-unarchive sa hinaharap.
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
              className="w-[48%] bg-orange-600 py-3 rounded-xl items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">
                  Archive
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