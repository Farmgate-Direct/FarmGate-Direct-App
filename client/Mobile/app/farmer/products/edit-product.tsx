// farmer/products/edit-product.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { ProductType } from "../../../src/types/product";
import { ProductCategoryKey } from "../../../constants/productCatalog";

type Props = {
  visible: boolean;
  onClose: () => void;
  product: ProductType;
  onSave: (product: ProductType) => Promise<void>;
  loading: boolean;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
};

const UNITS = ["per kg", "per pcs"];

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
              className={`px-4 py-3 ${opt === value ? "bg-green-700" : "bg-white"}`}
            >
              <Text className={opt === value ? "text-white" : "text-black"}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ================= EDIT PRODUCT (MASTER INFO ONLY) =================
// Ang name/category/unit/description/image ay shared sa LAHAT ng batch ng
// produktong ito, kaya dito lang sila puwedeng baguhin. Ang price, stock,
// status, at freshness ay per-batch na - i-edit sa "Batches" ng produkto
// (tingnan ang edit-batch.tsx).
const EditProductModal = ({ visible, onClose, product, onSave, loading }: Props) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategoryKey>("Vegetables");
  const [unit, setUnit] = useState("per kg");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory((product.category as ProductCategoryKey) || "Vegetables");
      setUnit(product.unit || "per kg");
      setDescription(product.description || "");
      setImage(product.image || "");
      setError("");
    }
  }, [product]);

  const isFormValid =
    name.trim() !== "" &&
    category.trim() !== "" &&
    unit.trim() !== "" &&
    description.trim() !== "" &&
    image.trim() !== "";

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri || "");
    }
  };

  const handleSave = async () => {
    if (!isFormValid) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");

    await onSave({
      ...product,
      name,
      category,
      unit,
      description,
      image,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6 max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold mb-1">Edit Product</Text>
            <Text className="text-xs text-gray-400 mb-4">
              Naka-lock ang Product Name at Category (identity ng listing na
              ito). Ang unit/description/image ay shared sa lahat ng batch.
              Para sa presyo, stock, status, o freshness ng bawat batch,
              buksan ang "Batches" ng produkto sa listing.
            </Text>

            {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

            {/* CATEGORY - HINDI na na-eedit: ang name+category ang
                identity ng listing na ito, kaya kung babaguhin ito
                puwedeng masira ang pagtugma sa mga existing na batch. */}
            <View className="mb-4">
              <Text className="text-xs text-gray-500 mb-1">CATEGORY</Text>
              <View className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-200 flex-row items-center justify-between">
                <Text className="text-gray-500">{category}</Text>
                <Ionicons name="lock-closed" size={14} color="#9ca3af" />
              </View>
            </View>

            {/* PRODUCT NAME - HINDI rin na-eedit, parehong dahilan */}
            <View className="mb-4">
              <Text className="text-xs text-gray-500 mb-1">PRODUCT NAME</Text>
              <View className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-200 flex-row items-center justify-between">
                <Text className="text-gray-500">{name}</Text>
                <Ionicons name="lock-closed" size={14} color="#9ca3af" />
              </View>
            </View>

            {/* UNIT */}
            <Dropdown label="UNIT" value={unit} options={UNITS} onSelect={setUnit} />

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
                <Image source={{ uri: image }} className="w-24 h-24 rounded-lg" />
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
                className={`w-[48%] py-3 rounded-xl items-center ${
                  isFormValid && !loading ? "bg-green-700" : "bg-gray-400"
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

export default EditProductModal;