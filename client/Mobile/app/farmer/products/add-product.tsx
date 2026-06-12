// farmer/products/add-product.tsx
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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CreateProductInput } from "../../../src/types/product";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (product: CreateProductInput) => Promise<void>;
  loading: boolean;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
};

const AddProductModal = ({ visible, onClose, onSave, loading }: Props) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per kg");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("Available");
  const [freshness, setFreshness] = useState("1 day");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string>("");

  const [error, setError] = useState("");

  const categories = ["Fruits", "Egg & Poultry", "Vegetables", "Rice & Grains"];
  const units = ["per kg", "per pcs"];
  const statuses = ["Available", "Out of Stock"];
  const freshnessOptions = [
    "1 day", "2 days", "3 days", "4 days", "5 days",
    "6 days", "7 days", "8 days", "9 days", "10 days",
  ];

  const isFormValid =
    name.trim() !== "" &&
    category.trim() !== "" &&
    price !== "" &&
    stock !== "" &&
    unit.trim() !== "" &&
    status.trim() !== "" &&
    description.trim() !== "" &&
    image.trim() !== "";

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri || "");
    }
  };

  const handlePriceChange = (text: string) => {
    if (/^\d*$/.test(text)) setPrice(text);
  };

  const handleStockChange = (text: string) => {
    if (/^\d*$/.test(text)) setStock(text);
  };

  const handleSave = async () => {
    if (!isFormValid) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");

    await onSave({
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      freshness,
      unit,
      status,
      description,
      image,
      imagePublicId: "",
      farmerId: "",
      farmerName: "",
      farmName: "",
      rating: 0,
      totalSales: 0,
      weeklySales: 0,
      monthlySales: 0,
      createdAt: Date.now(),
    });
    setName("");
    setCategory("Vegetables");
    setPrice("");
    setUnit("per kg");
    setStock("");
    setStatus("Available");
    setFreshness("1 day");
    setDescription(""); setName("");
    setCategory("Vegetables");
    setPrice("");
    setUnit("per kg");
    setStock("");
    setStatus("Available");
    setFreshness("1 day");
    setDescription("");
    setImage("");

    onClose();
  };

  const Dropdown = ({ label, value, options, onSelect }: DropdownProps) => {
    const [open, setOpen] = useState(false);

    return (
      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1">{label}</Text>

        <TouchableOpacity
          onPress={() => setOpen(!open)}
          className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-300 flex-row justify-between items-center"
        >
          <Text>{value}</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} />
        </TouchableOpacity>

        {open && (
          <View className="border border-gray-300 rounded-xl mt-1 overflow-hidden bg-white">
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={`px-4 py-3 ${opt === value ? "bg-green-700" : "bg-white"
                  }`}
              >
                <Text className={opt === value ? "text-white" : "text-black"}>
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

            <Text className="text-lg font-bold mb-4">Add Product</Text>

            {error ? (
              <Text className="text-red-500 mb-3">{error}</Text>
            ) : null}

            {/* NAME */}
            <Text className="text-xs text-gray-500 mb-1">PRODUCT NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter product name"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            {/* CATEGORY */}
            <Dropdown
              label="CATEGORY"
              value={category}
              options={categories}
              onSelect={setCategory}
            />

            {/* UNIT */}
            <Dropdown
              label="UNIT"
              value={unit}
              options={units}
              onSelect={setUnit}
            />

            {/* PRICE */}
            <Text className="text-xs text-gray-500 mb-1">PRICE (₱)</Text>
            <TextInput
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              placeholder="Enter price"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            {/* STOCK */}
            <Text className="text-xs text-gray-500 mb-1">STOCK</Text>
            <TextInput
              value={stock}
              onChangeText={handleStockChange}
              keyboardType="numeric"
              placeholder="Enter stock"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            {/* STATUS */}
            <Dropdown
              label="STATUS"
              value={status}
              options={statuses}
              onSelect={setStatus}
            />

            {/* FRESHNESS */}
            <Dropdown
              label="FRESHNESS"
              value={freshness}
              options={freshnessOptions}
              onSelect={setFreshness}
            />

            {/* DESCRIPTION */}
            <Text className="text-xs text-gray-500 mb-1">DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Describe product..."
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 h-24 border border-gray-300"
            />

            {/* IMAGE */}
            <Text className="text-xs text-gray-500 mb-1">IMAGE</Text>
            <TouchableOpacity
              onPress={pickImage}
              className="bg-gray-100 p-4 rounded-xl items-center mb-6 border border-gray-300"
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

            {/* BUTTONS */}
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={onClose}
                className="w-[48%] border border-green-700 py-3 rounded-xl items-center"
              >
                <Text className="text-green-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={!isFormValid || loading}
                className={`w-[48%] py-3 rounded-xl items-center ${isFormValid && !loading ? "bg-green-700" : "bg-gray-400"
                  }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold">Save</Text>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddProductModal;