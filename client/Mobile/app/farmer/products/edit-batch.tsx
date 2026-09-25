import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  BatchType,
} from "../../../src/types/product";

// ================= PROPS =================
type Props = {
  visible: boolean;
  onClose: () => void;
  batch: BatchType | null;

  onSave: (
    batchDocId: string,
    updates: {
      price: number;
      status: string;
      restockQuantity: number;
    }
  ) => Promise<void>;

  loading: boolean;
};

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (
    value: string
  ) => void;
};

const STATUSES = [
  "Available",
  "Out of Stock",
];

const Dropdown = ({
  label,
  value,
  options,
  onSelect,
}: DropdownProps) => {

  const [open, setOpen] =
    useState(false);

  return (
    <View className="mb-4">

      <Text className="text-xs text-gray-500 mb-1">
        {label}
      </Text>

      <TouchableOpacity
        onPress={() =>
          setOpen(!open)
        }
        className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-300 flex-row justify-between items-center"
      >

        <Text className="text-gray-800">
          {value}
        </Text>

        <Ionicons
          name={
            open
              ? "chevron-up"
              : "chevron-down"
          }
          size={18}
          color="#374151"
        />

      </TouchableOpacity>

      {open && (
        <View className="border border-gray-300 rounded-xl mt-1 overflow-hidden bg-white">

          {options.map(
            (option) => (

              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(
                    option
                  );
                  setOpen(false);
                }}
                className={`px-4 py-3 ${
                  option === value
                    ? "bg-green-700"
                    : "bg-white"
                }`}
              >

                <Text
                  className={
                    option ===
                    value
                      ? "text-white"
                      : "text-black"
                  }
                >
                  {option}
                </Text>

              </TouchableOpacity>
            )
          )}

        </View>
      )}

    </View>
  );
};

const EditBatchModal = ({
  visible,
  onClose,
  batch,
  onSave,
  loading,
}: Props) => {

  const [price, setPrice] =
    useState("");

  const [restockQuantity, setRestockQuantity] =
    useState("0");

  const [status, setStatus] =
    useState("Available");

  const [error, setError] =
    useState("");

  useEffect(() => {

    if (batch) {

      setPrice(
        batch.price?.toString() ||
          ""
      );

      setRestockQuantity(
        "0"
      );

      setStatus(
        batch.status ||
          "Available"
      );

      setError("");
    }

  }, [batch]);

  // ================= PRICE =================
  const handlePriceChange = (
    text: string
  ) => {

    if (
      /^\d*\.?\d*$/.test(
        text
      )
    ) {

      setPrice(text);
    }
  };

  // ================= RESTOCK =================
  const handleRestockChange = (
    text: string
  ) => {

    if (
      /^\d*$/.test(text)
    ) {

      setRestockQuantity(
        text
      );
    }
  };

  const restockValue =
    Number(
      restockQuantity || 0
    );

  const isFormValid =
    price !== "" &&
    Number(price) >= 0 &&
    status.trim() !== "" &&
    restockValue >= 0;

  // ================= SAVE =================
  const handleSave = async () => {

    if (!batch) {
      return;
    }

    if (!isFormValid) {

      setError(
        "Please enter a valid price, restock quantity, and status."
      );

      return;
    }

    setError("");

    try {

      await onSave(
        batch.docId,
        {
          price:
            Number(price),

          status,

          restockQuantity:
            restockValue,
        }
      );

      onClose();

    } catch (err: any) {

      setError(
        err?.message ||
          "May error na naganap."
      );
    }
  };

  if (!batch) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
    >

      <View className="flex-1 bg-black/40 justify-center px-6">

        <View className="bg-white rounded-3xl p-6 max-h-[90%]">

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >

            {/* HEADER */}
            <View className="flex-row items-center justify-between mb-1">

              <Text className="text-lg font-bold text-gray-800">
                Edit Batch{" "}
                {String(
                  batch.batchNumber
                ).padStart(
                  3,
                  "0"
                )}
              </Text>

              <Ionicons
                name="layers-outline"
                size={22}
                color="#15803D"
              />

            </View>

            <Text className="text-xs text-gray-400 mb-4">
              Batch information and stock can be updated anytime.
              There is no weekly limit.
            </Text>

            {/* ERROR */}
            {error ? (

              <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">

                <Text className="text-red-600 text-sm">
                  {error}
                </Text>

              </View>

            ) : null}

            {/* CURRENT STOCK */}
            <View className="bg-gray-50 rounded-xl px-4 py-4 mb-4">

              <View className="flex-row justify-between">

                <View>

                  <Text className="text-gray-500 text-xs">
                    Current Stock
                  </Text>

                  <Text className="text-gray-800 font-bold text-xl mt-1">
                    {batch.stock}
                  </Text>

                </View>

                <View className="items-end">

                  <Text className="text-gray-500 text-xs">
                    Unit
                  </Text>

                  <Text className="text-gray-800 font-semibold mt-1">
                    {(batch as any).unit ||
                      "product units"}
                  </Text>

                </View>

              </View>

              <View className="border-t border-gray-200 mt-3 pt-3">

                <Text className="text-gray-500 text-xs">
                  Total Recorded Stock
                </Text>

                <Text className="text-gray-800 font-bold text-base mt-1">
                  {batch.totalHarvested}
                </Text>

              </View>

              <Text className="text-gray-400 text-[10px] mt-2">
                Restock quantity will be added to the current stock.
                Existing sales history will not be changed.
              </Text>

            </View>

            {/* PRICE */}
            <Text className="text-xs text-gray-500 mb-1">
              PRICE (₱)
            </Text>

            <TextInput
              value={price}
              onChangeText={
                handlePriceChange
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-300 text-gray-800"
            />

            {/* RESTOCK */}
            <Text className="text-xs text-gray-500 mb-1">
              RESTOCK QUANTITY
            </Text>

            <TextInput
              value={
                restockQuantity
              }
              onChangeText={
                handleRestockChange
              }
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 px-4 py-3 rounded-xl mb-2 border border-gray-300 text-gray-800"
            />

            <Text className="text-gray-400 text-[10px] mb-4">
              Enter 0 if you are not adding stock.
            </Text>

            {/* STOCK PREVIEW */}
            <View className="bg-green-50 rounded-xl p-4 mb-4">

              <Text className="text-green-700 text-xs">
                Stock after save
              </Text>

              <Text className="text-green-800 font-black text-2xl mt-1">
                {Number(
                  batch.stock || 0
                ) +
                  restockValue}
              </Text>

            </View>

            {/* STATUS */}
            <Dropdown
              label="STATUS"
              value={status}
              options={STATUSES}
              onSelect={
                setStatus
              }
            />

            {/* BUTTONS */}
            <View className="flex-row justify-between mt-2">

              <TouchableOpacity
                onPress={
                  onClose
                }
                disabled={
                  loading
                }
                className="w-[48%] border border-green-700 py-3 rounded-xl items-center"
              >

                <Text className="text-green-700 font-semibold">
                  Cancel
                </Text>

              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  handleSave
                }
                disabled={
                  !isFormValid ||
                  loading
                }
                className={`w-[48%] py-3 rounded-xl items-center ${
                  isFormValid &&
                  !loading
                    ? "bg-green-700"
                    : "bg-gray-400"
                }`}
              >

                {loading ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <Text className="text-white font-bold">
                    Save
                  </Text>

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