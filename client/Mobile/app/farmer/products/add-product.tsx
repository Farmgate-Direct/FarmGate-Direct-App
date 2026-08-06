// farmer/products/add-product.tsx
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
import { CreateProductInput, ProductType, BatchType } from "../../../src/types/product";
import {
  getFarmerProductNames,
  getActiveBatchForHarvest,
  getLatestBatch,
} from "../../../src/services/productService";
import {
  CATEGORIES,
  PRODUCT_CATALOG,
  ProductCategoryKey,
  normalizeProductName,
} from "../../../constants/productCatalog";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreateProductInput, quantity: number, price: number) => Promise<void>;
  loading: boolean;
  farmerId: string;
  farmerName: string;
  farmName: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

const UNITS = ["per kg", "per pcs"];

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// ================= DROPDOWN =================
const Dropdown = ({ label, value, options, onSelect, placeholder }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        disabled={options.length === 0}
        className={`px-4 py-3 rounded-xl border border-gray-300 flex-row justify-between items-center ${
          options.length === 0 ? "bg-gray-200" : "bg-gray-100"
        }`}
      >
        <Text className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} />
      </TouchableOpacity>

      {open && (
        <View className="border border-gray-300 rounded-xl mt-1 max-h-56 overflow-hidden bg-white">
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ================= ADD HARVEST =================
// Bawat "Save" dito ay isang HARVEST EVENT, hindi bagong product listing.
// Kapag EXISTING na ang product (matched sa dropdown), ang
// unit/description/image ay MASTER-LEVEL na datos - hindi na sila
// puwedeng baguhin dito (kahit magmukhang editable dati, hindi naman
// na-a-apply ang bago dahil ginagamit lang talaga ang existing master
// doc). Kaya read-only na lang sila ipinapakita rito; kung gusto ng
// farmer na baguhin talaga ang mga yun, gamitin ang "Edit Product".
// Ang PRICE ay per-batch, kaya laging editable, at pre-fill na ngayon
// batay sa presyo ng aktibo (o pinakabagong) batch, para makita agad ng
// farmer ang kasalukuyang presyo bago mag-update.
const AddProductModal = ({
  visible,
  onClose,
  onSave,
  loading,
  farmerId,
  farmerName,
  farmName,
}: Props) => {
  const [existingProducts, setExistingProducts] = useState<ProductType[]>([]);
  const [category, setCategory] = useState<ProductCategoryKey>("Vegetables");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per kg");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeBatch, setActiveBatch] = useState<BatchType | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<ProductType | null>(null);
  // May value LANG ito kapag ang napiling pangalan+category ay tumutugma
  // sa isang NAKA-ARCHIVE nang product ng farmer na ito. Kapag meron,
  // dapat hindi makapag-save ang farmer - kailangan muna nilang
  // i-unarchive ang lumang listing (sa Archived tab) bago sila
  // makapag-dagdag ng bagong harvest, para hindi magkaroon ng duplicate
  // na listing (ex. dalawang "Egg" - isa active, isa archived).
  const [archivedDuplicate, setArchivedDuplicate] = useState<ProductType | null>(null);

  useEffect(() => {
    if (visible) {
      // includeArchived = true, para ma-detect natin kung may
      // naka-archive nang kaparehong product bago payagang mag-save.
      getFarmerProductNames(farmerId, true).then(setExistingProducts);
    }
  }, [visible, farmerId]);

  useEffect(() => {
    if (!PRODUCT_CATALOG[category]?.includes(name)) {
      setName("");
    }
  }, [category]);

  // Kapag napili ang isang existing na product, i-lock ang
  // unit/description/image (galing sa master doc), at i-prefill ang
  // price mula sa aktibo (o pinakabagong) batch nito. Tinitignan din
  // kung may aktibong batch pa para sa notice (idagdag vs bagong batch).
  //
  // Kung ang natugma ay isang NAKA-ARCHIVE na product, ihinto agad dito
  // - huwag nang autofill, at ipakita ang blocking notice sa halip.
  useEffect(() => {
    const check = async () => {
      if (!name) {
        setNotice("");
        setActiveBatch(null);
        setMatchedProduct(null);
        setArchivedDuplicate(null);
        return;
      }
      const target = normalizeProductName(name);
      const match = existingProducts.find(
        (p) => normalizeProductName(p.name) === target && p.category === category
      );

      if (match?.archived) {
        setArchivedDuplicate(match);
        setMatchedProduct(null);
        setActiveBatch(null);
        setNotice("");
        return;
      }

      setArchivedDuplicate(null);

      if (match) {
        setMatchedProduct(match);
        setUnit(match.unit);
        setDescription(match.description);
        setImage(match.image);

        const batch = await getActiveBatchForHarvest(match.docId);
        setActiveBatch(batch);

        // Pre-fill ang price galing sa aktibong batch, o kung wala,
        // sa pinakabagong batch (bilang magandang starting point) -
        // pwede pa ring baguhin ito ng farmer bago i-save.
        const referenceBatch = batch ?? (await getLatestBatch(match.docId));
        if (referenceBatch) {
          setPrice(referenceBatch.price.toString());
        }

        if (batch) {
          const weekLabel = `${formatDate(batch.weekStart)}–${formatDate(batch.weekEnd)}`;
          setNotice(
            `Idadagdag bilang bagong harvest record sa Batch ${String(batch.batchNumber).padStart(3, "0")} (${weekLabel}). Kasalukuyang stock: ${batch.stock} ${match.unit}.`
          );
        } else {
          setNotice(`Bagong harvest week na - gagawa ng bagong Weekly Batch para dito.`);
        }
      } else {
        setMatchedProduct(null);
        setNotice("");
        setActiveBatch(null);
        // Bagong product - i-reset ang mga field para malinis magsimula
        setUnit("per kg");
        setDescription("");
        setImage("");
        setPrice("");
      }
    };
    check();
  }, [name, category, existingProducts]);

  const productNameOptions = PRODUCT_CATALOG[category] || [];
  const isExistingProduct = matchedProduct !== null;

  const isFormValid =
    !archivedDuplicate &&
    name.trim() !== "" &&
    category.trim() !== "" &&
    price !== "" &&
    quantity !== "" &&
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

  const handlePriceChange = (text: string) => {
    if (/^\d*$/.test(text)) setPrice(text);
  };

  const handleQuantityChange = (text: string) => {
    if (/^\d*$/.test(text)) setQuantity(text);
  };

  const resetForm = () => {
    setCategory("Vegetables");
    setName("");
    setPrice("");
    setUnit("per kg");
    setQuantity("");
    setDescription("");
    setImage("");
    setNotice("");
    setActiveBatch(null);
    setMatchedProduct(null);
    setArchivedDuplicate(null);
  };

  const handleSave = async () => {
    if (archivedDuplicate) {
      setError(
        `May naka-archive ka nang "${archivedDuplicate.name}". I-unarchive muna ito bago magdagdag ng bagong harvest.`
      );
      return;
    }
    if (!isFormValid) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");

    const input: CreateProductInput = {
      name,
      category,
      unit,
      description,
      image,
      imagePublicId: "",
      farmerId,
      farmerName,
      farmName,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      weeklySales: 0,
      monthlySales: 0,
      createdAt: Date.now(),
      price: 0,
      stock: 0,
      status: "Available",
      freshness: "Harvested this week",
      archived: false,
    };

    try {
      await onSave(input, Number(quantity), Number(price));
      resetForm();
      onClose();
    } catch (err: any) {
      // Halimbawa: nasagip pa rin ng backend (addHarvest) ang archived
      // duplicate check kahit paano - ipakita ang tunay na mensahe
      // imbes na tahimik lang itong mabigo.
      setError(err?.message || "May error na naganap. Subukan muli.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6 max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold mb-4">Add Harvest</Text>

            {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

            {/* ARCHIVED DUPLICATE - blocking warning, hindi kasabay ng
                normal na (green) notice sa ibaba */}
            {archivedDuplicate ? (
              <View className="bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 mb-4">
                <Text className="text-orange-700 text-xs font-semibold mb-1">
                  May naka-archive ka nang produktong ito
                </Text>
                <Text className="text-orange-700 text-xs">
                  Naka-archive na si "{archivedDuplicate.name}" ({archivedDuplicate.category}).
                  Pumunta sa "Archived" tab sa listing at i-unarchive muna ito bago ka
                  makapag-dagdag ng bagong harvest - para hindi magkaroon ng duplicate na
                  listing.
                </Text>
              </View>
            ) : notice ? (
              <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-green-700 text-xs">{notice}</Text>
              </View>
            ) : null}

            {/* CATEGORY */}
            <Dropdown
              label="CATEGORY"
              value={category}
              options={[...CATEGORIES]}
              onSelect={(v) => setCategory(v as ProductCategoryKey)}
            />

            {/* PRODUCT NAME */}
            <Dropdown
              label="PRODUCT NAME"
              value={name}
              options={productNameOptions}
              onSelect={setName}
              placeholder="Select product"
            />

            {/* UNIT - editable lang kapag bagong product */}
            {isExistingProduct ? (
              <View className="mb-4">
                <Text className="text-xs text-gray-500 mb-1">UNIT</Text>
                <View className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                  <Text className="text-gray-500">{unit}</Text>
                </View>
              </View>
            ) : (
              <Dropdown label="UNIT" value={unit} options={UNITS} onSelect={setUnit} />
            )}

            {/* PRICE - laging editable, naka-prefill na kung may batch */}
            <Text className="text-xs text-gray-500 mb-1">PRICE (₱)</Text>
            <TextInput
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              placeholder="Enter price"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            {/* QUANTITY (harvest) */}
            <Text className="text-xs text-gray-500 mb-1">
              HARVEST QUANTITY (dami ng inani ngayon)
            </Text>
            <TextInput
              value={quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
              placeholder="Enter quantity"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            {/* DESCRIPTION - editable lang kapag bagong product */}
            <Text className="text-xs text-gray-500 mb-1">DESCRIPTION</Text>
            {isExistingProduct ? (
              <View className="bg-gray-100 px-4 py-3 rounded-xl mb-1 border border-gray-200">
                <Text className="text-gray-500 text-sm">{description || "—"}</Text>
              </View>
            ) : (
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Describe product..."
                className="bg-gray-100 px-4 py-3 rounded-xl mb-1 h-24 border border-gray-300"
              />
            )}
            {isExistingProduct && (
              <Text className="text-gray-400 text-[10px] mb-4">
                Shared info ito ng produkto - gamitin ang "Edit Product" para baguhin.
              </Text>
            )}
            {!isExistingProduct && <View className="mb-3" />}

            {/* IMAGE - editable lang kapag bagong product */}
            <Text className="text-xs text-gray-500 mb-1">IMAGE</Text>
            {isExistingProduct ? (
              <View className="bg-gray-100 p-4 rounded-xl items-center mb-1 border border-gray-200">
                {image ? (
                  <Image source={{ uri: image }} className="w-24 h-24 rounded-lg" />
                ) : (
                  <Text className="text-gray-500">No image</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="bg-gray-100 p-4 rounded-xl items-center mb-1 border border-gray-300"
              >
                {image ? (
                  <Image source={{ uri: image }} className="w-24 h-24 rounded-lg" />
                ) : (
                  <Text className="text-gray-500">Select Image</Text>
                )}
              </TouchableOpacity>
            )}
            {isExistingProduct && (
              <Text className="text-gray-400 text-[10px] mb-6">
                Shared info ito ng produkto - gamitin ang "Edit Product" para baguhin.
              </Text>
            )}
            {!isExistingProduct && <View className="mb-5" />}

            {/* BUTTONS */}
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

export default AddProductModal;