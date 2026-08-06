// farmer/products/edit-batch.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { BatchType } from "../../../src/types/product";

// ================= PROPS =================
// Ang EditBatchModal ay tumatanggap ng "batch" (hindi "product"), at ang
// onSave nito ay (batchDocId, updates) => Promise<void>. Price at status
// na lang ang na-eedit dito - ang stock ay AWTOMATIKO na ngayon, galing
// sa harvest records (dagdag) at sales/FIFO (bawas), kaya hindi na ito
// direktang binabago dito.
type Props = {
  visible: boolean;
  onClose: () => void;
  batch: BatchType | null;
  onSave: (
    batchDocId: string,
    updates: { price: number; status: string }
  ) => Promise<void>;
  loading: boolean;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
};

const STATUSES = ["Available", "Out of Stock"];

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

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

const EditBatchModal = ({ visible, onClose, batch, onSave, loading }: Props) => {
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Available");
  const [error, setError] = useState("");

  useEffect(() => {
    if (batch) {
      setPrice(batch.price?.toString() || "");
      setStatus(batch.status || "Available");
      setError("");
    }
  }, [batch]);

  const handlePriceChange = (text: string) => {
    if (/^\d*$/.test(text)) setPrice(text);
  };

  const isFormValid = price !== "" && status.trim() !== "";

  const handleSave = async () => {
    if (!batch) return;
    if (!isFormValid) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      await onSave(batch.docId, { price: Number(price), status });
      onClose();
    } catch (err: any) {
      setError(err?.message || "May error na naganap.");
    }
  };

  if (!batch) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center px-6">
        <View className="bg-white rounded-3xl p-6 max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-bold mb-1">
              Edit Batch {String(batch.batchNumber).padStart(3, "0")}
            </Text>
            <Text className="text-xs text-gray-400 mb-4">
              Harvest Week: {formatDate(batch.weekStart)} – {formatDate(batch.weekEnd)}
            </Text>

            {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <Text className="text-gray-500 text-xs">Total Harvested</Text>
              <Text className="text-gray-800 font-bold text-base">
                {batch.totalHarvested}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">Current Stock (auto)</Text>
              <Text className="text-gray-800 font-bold text-base">{batch.stock}</Text>
              <Text className="text-gray-400 text-[10px] mt-1">
                Awtomatiko itong na-uupdate galing sa harvest records at sa naibentang
                stock - hindi na direktang ina-edit dito.
              </Text>
            </View>

            <Text className="text-xs text-gray-500 mb-1">PRICE (₱)</Text>
            <TextInput
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300"
            />

            <Dropdown label="STATUS" value={status} options={STATUSES} onSelect={setStatus} />

            <View className="flex-row justify-between mt-2">
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

export default EditBatchModal;