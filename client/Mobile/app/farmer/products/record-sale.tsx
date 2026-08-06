// farmer/products/record-sale.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ProductType } from "../../../src/types/product";

type Props = {
  visible: boolean;
  onClose: () => void;
  product: ProductType | null;
  onConfirm: (quantity: number) => Promise<void>;
  loading: boolean;
};

// ================= RECORD WALK-IN SALE =================
// Ginagamit ito kapag may bumili nang direkta sa farm (walk-in customer,
// hindi dumaan sa app). Kailangan itong i-record dito para tumpak pa
// rin ang stock sa system - kung hindi, mag-iiba ang totoong dami ng
// stock sa Firestore kumpara sa aktwal na natitira sa bukid.
//
// Parehong FIFO logic ang ginagamit (recordSale sa productService) na
// ginagamit ng online checkout - kaya ang pagbawas ay awtomatikong
// mula sa pinakamatandang available na batch (at ang harvest record
// traceability nito) - hindi kailangang piliin ng farmer kung saang
// batch babawasan.
const RecordSaleModal = ({ visible, onClose, product, onConfirm, loading }: Props) => {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const handleQuantityChange = (text: string) => {
    if (/^\d*$/.test(text)) setQuantity(text);
  };

  const resetForm = () => {
    setQuantity("");
    setError("");
  };

  const handleConfirm = async () => {
    const qty = Number(quantity);

    if (!quantity || qty <= 0) {
      setError("Ilagay ang tamang quantity.");
      return;
    }

    if (product && qty > product.stock) {
      setError(
        `Lampas ito sa kasalukuyang available na stock (${product.stock} ${product.unit}).`
      );
      return;
    }

    setError("");
    await onConfirm(qty);
    resetForm();
  };

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6">
          <View className="flex-row items-center mb-1">
            <Ionicons name="storefront-outline" size={20} color="#15803d" />
            <Text className="text-lg font-bold ml-2">Record Walk-in Sale</Text>
          </View>
          <Text className="text-xs text-gray-400 mb-4">
            Para sa mga binili nang direkta sa farm (hindi dumaan sa app).
            Awtomatikong babawasan ang stock gamit ang FIFO (pinakamatandang
            batch muna) - kagaya rin ng ginagamit sa online orders.
          </Text>

          <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
            <Text className="text-gray-500 text-xs">{product.name}</Text>
            <Text className="text-gray-800 font-bold text-base">
              {product.stock} {product.unit} available
            </Text>
          </View>

          {error ? <Text className="text-red-500 text-xs mb-3">{error}</Text> : null}

          <Text className="text-xs text-gray-500 mb-1">QUANTITY NA NABENTA</Text>
          <TextInput
            value={quantity}
            onChangeText={handleQuantityChange}
            keyboardType="numeric"
            placeholder={`Enter quantity (${product.unit})`}
            className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
          />

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              className="w-[48%] border border-green-700 py-3 rounded-xl items-center"
            >
              <Text className="text-green-700 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              className={`w-[48%] py-3 rounded-xl items-center ${
                loading ? "bg-gray-400" : "bg-green-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Record Sale</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RecordSaleModal;