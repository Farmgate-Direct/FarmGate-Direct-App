import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const AddProductModal = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per kg");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("Available");
  const [freshness, setFreshness] = useState("1 day");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const categories = ["Fruits", "Egg & Poultry", "Vegetables", "Rice"];
  const units = ["per kg", "per pcs"];
  const statuses = ["Available", "Out of Stock"];
  const freshnessOptions = [
    "1 day",
    "2 days",
    "3 days",
    "4 days",
    "5 days",
    "6 day",
    "7 days",
    "8 days",
    "9 days",
    "10 days",
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = () => {
    onSave({
      name: name,
      category: category,
      price: price.toString(), // always string
      stock: `${stock} ${unit} In Stock`, // use entered stock and unit
      freshness: freshness,
      unit: unit,
      status: status,
      description: description,
      image: image,
    });

    // Reset modal fields
    setName("");
    setCategory("Vegetables");
    setPrice("");
    setUnit("per kg");
    setStock("");
    setStatus("Available");
    setFreshness("1 day");
    setDescription("");
    setImage(null);

    onClose();
  };

  const Dropdown = ({ label, value, options, onSelect }) => {
    const [open, setOpen] = useState(false);

    return (
      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1">{label}</Text>
        <TouchableOpacity
          className="bg-gray-100 rounded-xl px-4 py-3 flex-row justify-between items-center border border-gray-300"
          onPress={() => setOpen(!open)}
        >
          <Text className="text-gray-800">{value}</Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color="#4B5563"
          />
        </TouchableOpacity>
        {open && (
          <View className="bg-white rounded-xl mt-1 border border-gray-300 shadow-md overflow-hidden">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={`px-4 py-3 rounded ${opt === value ? "bg-green-700" : "bg-white"}`}
              >
                <Text
                  className={`${opt === value ? "text-white" : "text-gray-800"}`}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6 max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Add Product
            </Text>

            <Text className="text-xs text-gray-500 mb-1">PRODUCT NAME</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4 border border-gray-300"
              placeholder="Enter product name"
              value={name}
              onChangeText={setName}
            />

            <Dropdown
              label="CATEGORY"
              value={category}
              options={categories}
              onSelect={setCategory}
            />
            <Dropdown
              label="UNIT"
              value={unit}
              options={units}
              onSelect={setUnit}
            />

            <Text className="text-xs text-gray-500 mb-1">PRICE (₱)</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4 border border-gray-300"
              placeholder="Enter price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text className="text-xs text-gray-500 mb-1">STOCK QTY</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4 border border-gray-300"
              placeholder="Enter stock quantity"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />

            <Dropdown
              label="STATUS"
              value={status}
              options={statuses}
              onSelect={setStatus}
            />
            <Dropdown
              label="FRESHNESS"
              value={freshness}
              options={freshnessOptions}
              onSelect={setFreshness}
            />

            <Text className="text-xs text-gray-500 mb-1">DESCRIPTION</Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 mb-4 h-24 border border-gray-300"
              placeholder="Describe your product..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text className="text-xs text-gray-500 mb-1">IMAGE</Text>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl px-4 py-3 mb-6 items-center border border-gray-300"
              onPress={pickImage}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  className="w-24 h-24 rounded-lg"
                />
              ) : (
                <Text className="text-gray-500">Select Image</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={onClose}
                className="w-[48%] border border-green-700 py-3 rounded-xl items-center"
              >
                <Text className="text-green-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                className="w-[48%] bg-green-700 py-3 rounded-xl items-center"
              >
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
