import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const AddProductModal = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per kg");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("Available");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    onSave({ name, category, price, unit, stock, status, description });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold text-gray-800 mb-4">Add Product</Text>

            <Text className="text-xs text-gray-500 mb-1">PRODUCT NAME</Text>
            <TextInput className="bg-gray-100 rounded-lg px-3 py-3 mb-4" placeholder="Enter product name" value={name} onChangeText={setName} />

            <Text className="text-xs text-gray-500 mb-1">CATEGORY</Text>
            <View className="bg-gray-100 rounded-lg px-3 py-3 mb-4 flex-row justify-between items-center">
              <Text>{category}</Text>
              <Ionicons name="chevron-down" size={16} />
            </View>

            <Text className="text-xs text-gray-500 mb-1">PRICE (₱)</Text>
            <TextInput className="bg-gray-100 rounded-lg px-3 py-3 mb-4" placeholder="Enter price" keyboardType="numeric" value={price} onChangeText={setPrice} />

            <Text className="text-xs text-gray-500 mb-1">UNIT</Text>
            <View className="bg-gray-100 rounded-lg px-3 py-3 mb-4 flex-row justify-between items-center">
              <Text>{unit}</Text>
              <Ionicons name="chevron-down" size={16} />
            </View>

            <Text className="text-xs text-gray-500 mb-1">STOCK QTY</Text>
            <TextInput className="bg-gray-100 rounded-lg px-3 py-3 mb-4" placeholder="Enter stock quantity" keyboardType="numeric" value={stock} onChangeText={setStock} />

            <Text className="text-xs text-gray-500 mb-1">STATUS</Text>
            <View className="bg-gray-100 rounded-lg px-3 py-3 mb-4 flex-row justify-between items-center">
              <Text>{status}</Text>
              <Ionicons name="chevron-down" size={16} />
            </View>

            <Text className="text-xs text-gray-500 mb-1">DESCRIPTION</Text>
            <TextInput className="bg-gray-100 rounded-lg px-3 py-3 mb-6 h-24" placeholder="Describe your product..." multiline value={description} onChangeText={setDescription} />

            <View className="flex-row justify-between">
              <TouchableOpacity onPress={onClose} className="w-[48%] border border-green-700 py-3 rounded-xl items-center">
                <Text className="text-green-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} className="w-[48%] bg-green-700 py-3 rounded-xl items-center">
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddProductModal;