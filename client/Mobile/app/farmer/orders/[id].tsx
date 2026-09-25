import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  declineOrder,
  getOrderById,
  updateOrderStatus,
  acceptOrder,
  cancelAcceptedOrderByFarmer,
} from "@/src/services/orderService";

import {
  calculateCommission,
  recordCODCommission,
} from "@/src/services/walletService";

export default function OrderDetails() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams();

  const [order, setOrder] =
    useState<any>(null);

  const [farmerId, setFarmerId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  // ================= CANCEL MODAL =================
  const [showCancelModal, setShowCancelModal] =
    useState(false);

  const [selectedReason, setSelectedReason] =
    useState("");

  const [customReason, setCustomReason] =
    useState("");

  // ================= CANCEL REASONS =================
  const cancelReasons = [
    "Out of stock",
    "Unable to fulfill",
    "Farmer unavailable",
    "Other",
  ];

  // ================= FORMAT DATE =================
  const formatDateTime = (
    timestamp: any
  ) => {
    if (!timestamp) {
      return "Date unavailable";
    }

    try {
      let date: Date;

      if (
        typeof timestamp?.toDate ===
        "function"
      ) {
        date =
          timestamp.toDate();
      } else if (
        typeof timestamp?.seconds ===
        "number"
      ) {
        date = new Date(
          timestamp.seconds * 1000
        );
      } else {
        date =
          new Date(timestamp);
      }

      if (
        isNaN(
          date.getTime()
        )
      ) {
        return "Date unavailable";
      }

      return date.toLocaleString(
        "en-PH",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );
    } catch {
      return "Date unavailable";
    }
  };

  // ================= STATUS LABEL =================
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "accepted": return "Accepted";
      case "processing": return "Processing";
      case "to_receive": return "To Receive";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  // ================= LOAD ORDER =================
  const loadOrder =
    async () => {
      try {
        if (!id) {
          return;
        }

        const data =
          await getOrderById(
            String(id)
          );

        setOrder(data);
      } catch (error) {
        console.log(
          "LOAD ORDER ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to load order."
        );
      } finally {
        setLoading(false);
      }
    };

  // ================= LOAD FARMER =================
  const loadFarmer =
    async () => {
      try {
        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        if (!userStr) {
          return;
        }

        const user =
          JSON.parse(userStr);

        setFarmerId(
          user.uid ||
            user.userId ||
            user.id ||
            ""
        );
      } catch (error) {
        console.log(
          "LOAD FARMER ERROR:",
          error
        );
      }
    };

  useEffect(() => {
    loadOrder();
    loadFarmer();
  }, [id]);

  // ================= ACCEPT ORDER =================
  const handleAccept = async () => {
    try {
      if (!order?.id) return;

      if (!farmerId) {
        Alert.alert("Error", "Farmer not found.");
        return;
      }

      setActionLoading(true);

      await acceptOrder(order.id, farmerId);
      await loadOrder();

      Alert.alert(
        "Order Accepted",
        order.payment === "gcash"
          ? "The order is accepted. The buyer can now pay with GCash."
          : "The order is accepted. Stock will be deducted when you start processing the order."
      );
    } catch (error: any) {
      console.log("ACCEPT ORDER ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to accept order.");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= MARK PROCESSING =================
  const handleProcessing = async () => {
    try {
      if (!order?.id) return;

      if (!farmerId) {
        Alert.alert("Error", "Farmer not found.");
        return;
      }

      setActionLoading(true);
      await updateOrderStatus(order.id, farmerId, "processing");
      await loadOrder();

      Alert.alert("Order Processing", "The order is now being prepared.");
    } catch (error: any) {
      console.log("PROCESS ORDER ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to mark the order as processing.");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= MARK TO RECEIVE =================
  const handleToReceive = async () => {
    try {
      if (!order?.id) return;

      if (!farmerId) {
        Alert.alert("Error", "Farmer not found.");
        return;
      }

      setActionLoading(true);
      await updateOrderStatus(order.id, farmerId, "to_receive");
      await loadOrder();

      Alert.alert("Order Ready", "The order is now marked as To Receive.");
    } catch (error: any) {
      console.log("TO RECEIVE ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to mark the order as To Receive.");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= MARK DELIVERED =================
  const handleDelivered = async () => {
    try {
      if (!order?.id) return;

      if (!farmerId) {
        Alert.alert("Error", "Farmer not found.");
        return;
      }

      setActionLoading(true);
      await updateOrderStatus(order.id, farmerId, "delivered");

      if (order.payment === "cod" && order.commissionStatus !== "charged") {
        const commission = calculateCommission(Number(order.total));

        if (commission > 0) {
          await recordCODCommission(
            farmerId,
            commission,
            order.id,
            order.orderNumber
          );
        }
      }

      await loadOrder();

      Alert.alert(
        "Order Delivered",
        order.payment === "cod"
          ? "Order delivered and COD commission was recorded."
          : "The order has been marked as delivered."
      );
    } catch (error: any) {
      console.log("DELIVERED ORDER ERROR:", error);
      Alert.alert("Error", error?.message || "Failed to complete the order.");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= OPEN CANCEL MODAL =================
  const openCancelModal =
    () => {
      setSelectedReason("");
      setCustomReason("");
      setShowCancelModal(true);
    };

  // ================= CONTINUE CANCEL =================
  const continueCancel =
    () => {
      if (!selectedReason) {
        Alert.alert(
          "Reason Required",
          "Please select a reason."
        );
        return;
      }

      if (
        selectedReason ===
          "Other" &&
        !customReason.trim()
      ) {
        Alert.alert(
          "Reason Required",
          "Please enter your cancellation reason."
        );
        return;
      }

      const finalReason =
        selectedReason === "Other"
          ? customReason.trim()
          : selectedReason;

      Alert.alert(
        "Confirm Cancellation",
        `Are you sure you want to ${order?.status === "accepted" ? "cancel" : "decline"} this order?\n\nReason:\n${finalReason}`,
        [
          {
            text: "Keep Order",
            style: "cancel",
          },
          {
            text: order?.status === "accepted" ? "Yes, Cancel" : "Yes, Decline",
            style: "destructive",
            onPress: () =>
              confirmCancellation(
                finalReason
              ),
          },
        ]
      );
    };

  // ================= CONFIRM CANCELLATION =================
  const confirmCancellation =
    async (
      reason: string
    ) => {
      try {
        if (!order?.id) {
          return;
        }

        if (!farmerId) {
          Alert.alert(
            "Error",
            "Farmer not found."
          );
          return;
        }

        setShowCancelModal(false);
        setActionLoading(true);

        if (order.status === "accepted") {
          await cancelAcceptedOrderByFarmer(
            order.id,
            farmerId,
            reason
          );
        } else {
          await declineOrder(
            order.id,
            farmerId,
            reason
          );
        }

        await loadOrder();

        Alert.alert(
          "Order Cancelled",
          "The order has been cancelled successfully."
        );
      } catch (error: any) {
        console.log(
          "CANCEL ORDER ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "Failed to cancel the order."
        );
      } finally {
        setActionLoading(false);
      }
    };

  // ================= LOADING =================
  if (
    loading ||
    !order
  ) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator
          size="large"
          color="#15803D"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">

      {/* ================= HEADER ================= */}
      <View className="flex-row items-center pt-16 px-5 pb-5">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <View className="ml-4 flex-1">

          <Text className="text-white text-2xl font-bold">
            Order Details
          </Text>

          <Text className="text-green-100 text-sm">
            {order.orderNumber ||
              `Order #${order.id}`}
          </Text>

        </View>

      </View>

      {/* ================= BODY ================= */}
      <View className="flex-1 bg-white rounded-t-[35px] p-5">

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingBottom: 30,
          }}
        >

          {/* ================= ORDER NUMBER ================= */}
          <View className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4">

            <Text className="text-gray-500 text-xs">
              FarmGate Order ID
            </Text>

            <Text className="text-green-700 font-black text-lg mt-1">
              {order.orderNumber ||
                `FG-${order.id}`}
            </Text>

          </View>

          {/* ================= BUYER INFORMATION ================= */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-3">
              Buyer Information
            </Text>

            <View className="flex-row items-center mb-3">

              <Ionicons
                name="person-outline"
                size={19}
                color="#15803D"
              />

              <Text className="ml-2 text-gray-700 font-semibold">
                {order.buyerName ||
                  "Buyer"}
              </Text>

            </View>

            {order.address?.phone && (
              <View className="flex-row items-center">

                <Ionicons
                  name="call-outline"
                  size={19}
                  color="#15803D"
                />

                <Text className="ml-2 text-gray-700">
                  {order.address.phone}
                </Text>

              </View>
            )}

          </View>

          {/* ================= ORDER TIMELINE ================= */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <Text className="font-bold text-lg mb-4">Order Timeline</Text>

            <TimelineRow
              icon="cart-outline"
              title="Order Placed"
              date={order.createdAt}
              color="#15803D"
              showLine={!!order.farmerDecisionAt || !!order.cancelledAt}
            />

            {order.farmerDecision === "accepted" && order.farmerDecisionAt && (
              <TimelineRow
                icon="checkmark-circle-outline"
                title="Accepted"
                date={order.farmerDecisionAt}
                color="#2563EB"
                showLine={!!order.processingAt || !!order.toReceiveAt || !!order.deliveredAt}
              />
            )}

            {order.processingAt && (
              <TimelineRow
                icon="cube-outline"
                title="Processing"
                date={order.processingAt}
                color="#15803D"
                showLine={!!order.toReceiveAt || !!order.deliveredAt}
              />
            )}

            {order.toReceiveAt && (
              <TimelineRow
                icon="bag-check-outline"
                title="To Receive"
                date={order.toReceiveAt}
                color="#7C3AED"
                showLine={!!order.deliveredAt}
              />
            )}

            {order.deliveredAt && (
              <TimelineRow
                icon="checkmark-circle-outline"
                title="Delivered"
                date={order.deliveredAt}
                color="#2563EB"
                showLine={false}
              />
            )}

            {order.cancelledAt && (
              <TimelineRow
                icon="close-circle-outline"
                title="Cancelled"
                date={order.cancelledAt}
                color="#DC2626"
                showLine={false}
              />
            )}
          </View>

          {/* ================= STATUS ================= */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <Text className="text-gray-500 mb-2">Order Status</Text>
            <Text
              className={`font-bold text-lg ${
                order.status === "pending"
                  ? "text-amber-600"
                  : order.status === "accepted"
                  ? "text-blue-600"
                  : order.status === "processing"
                  ? "text-green-700"
                  : order.status === "to_receive"
                  ? "text-purple-700"
                  : order.status === "delivered"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {getStatusLabel(order.status)}
            </Text>
          </View>

          {/* ================= CANCELLATION DETAILS ================= */}
          {order.status ===
            "cancelled" && (

            <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">

              <View className="flex-row items-center mb-3">

                <Ionicons
                  name="close-circle"
                  size={22}
                  color="#DC2626"
                />

                <Text className="text-red-700 font-bold text-lg ml-2">
                  Cancellation Details
                </Text>

              </View>

              <Text className="text-gray-500 text-sm">
                Cancelled By
              </Text>

              <Text className="font-bold capitalize mb-3">
                {order.cancelledBy ||
                  "Unknown"}
              </Text>

              <Text className="text-gray-500 text-sm">
                Reason
              </Text>

              <Text className="font-semibold mb-3">
                {order.cancelReason ||
                  "No reason provided"}
              </Text>

              <Text className="text-gray-500 text-sm">
                Cancelled Date
              </Text>

              <Text className="font-semibold">
                {formatDateTime(
                  order.cancelledAt
                )}
              </Text>

            </View>
          )}

          {/* ================= PRODUCTS ================= */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-4">
              Products
            </Text>

            {order.products?.map(
              (
                product: any,
                index: number
              ) => (

                <View
                  key={
                    product.productId ||
                    `product-${index}`
                  }
                  className="flex-row justify-between mb-4"
                >

                  <View className="flex-1">

                    <Text className="font-semibold">
                      {product.name}
                    </Text>

                    <Text className="text-gray-500 mt-1">
                      Qty:{" "}
                      {product.quantity}
                    </Text>

                    <Text className="text-gray-400 text-xs mt-1">
                      ₱
                      {Number(
                        product.price
                      ).toFixed(2)}
                      {" / unit"}
                    </Text>

                  </View>

                  <Text className="font-semibold text-green-700">
                    ₱
                    {(
                      Number(
                        product.price
                      ) *
                      Number(
                        product.quantity
                      )
                    ).toFixed(2)}
                  </Text>

                </View>
              )
            )}

          </View>

          {/* ================= DELIVERY ================= */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-3">
              Delivery Information
            </Text>

            <Text className="text-gray-500 text-sm">
              Type
            </Text>

            <Text className="font-semibold capitalize mb-4">
              {order.delivery ||
                "N/A"}
            </Text>

            {order.delivery ===
            "pickup" ? (

              <>
                <Text className="text-gray-500 text-sm">
                  Pickup Date
                </Text>

                <Text className="font-semibold mb-3">
                  {order.pickupDate ||
                    "Not set"}
                </Text>

                <Text className="text-gray-500 text-sm">
                  Pickup Time
                </Text>

                <Text className="font-semibold">
                  {order.pickupTime ||
                    "Not set"}
                </Text>
              </>

            ) : (

              <>
                <Text className="text-gray-500 text-sm">
                  Delivery Address
                </Text>

                <Text className="font-semibold mt-1">
                  {order.address?.street ||
                    ""}
                </Text>

                <Text>
                  {order.address?.barangay ||
                    ""}
                  {order.address?.barangay
                    ? ", "
                    : ""}
                  {order.address?.city ||
                    ""}
                </Text>

                <Text>
                  {order.address?.province ||
                    ""}
                </Text>

                {order.address?.phone && (
                  <View className="flex-row items-center mt-3">

                    <Ionicons
                      name="call-outline"
                      size={16}
                      color="#15803D"
                    />

                    <Text className="ml-2">
                      {
                        order
                          .address
                          .phone
                      }
                    </Text>

                  </View>
                )}

              </>
            )}

          </View>

          {/* ================= PAYMENT ================= */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">

            <Text className="font-bold text-lg mb-3">
              Payment
            </Text>

            <View className="flex-row items-center">

              <Ionicons
                name={
                  order.payment ===
                  "gcash"
                    ? "qr-code-outline"
                    : "cash-outline"
                }
                size={20}
                color="#15803D"
              />

              <Text className="ml-2 font-semibold">
                {order.payment ===
                "gcash"
                  ? "GCash"
                  : "Cash on Delivery"}
              </Text>

            </View>

          </View>

          {/* ================= TOTAL ================= */}
          <View className="bg-green-50 rounded-2xl p-5">

            <View className="flex-row justify-between">

              <Text className="font-bold text-lg">
                Total
              </Text>

              <Text className="font-bold text-2xl text-green-700">
                ₱
                {Number(
                  order.total
                ).toFixed(2)}
              </Text>

            </View>

          </View>

        </ScrollView>

        {/* ================= ACTIONS ================= */}
        {!actionLoading && order.status === "pending" && (
          <View className="flex-row mt-4">
            <TouchableOpacity
              onPress={openCancelModal}
              className="flex-1 border border-red-500 py-4 rounded-xl mr-2"
            >
              <Text className="text-red-500 text-center font-bold">Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              className="flex-1 bg-green-700 py-4 rounded-xl ml-2"
            >
              <Text className="text-white text-center font-bold">Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {!actionLoading && order.status === "accepted" && (
          <>
            {order.payment === "gcash" && order.paymentStatus !== "paid" && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
                <Text className="text-yellow-800 text-sm font-semibold">
                  Waiting for the buyer to complete the GCash payment.
                </Text>
              </View>
            )}

            <View className="flex-row mt-4">
              {!(order.payment === "gcash" && order.paymentStatus === "paid") && (
                <TouchableOpacity
                  onPress={openCancelModal}
                  className="flex-1 border border-red-500 py-4 rounded-xl mr-2"
                >
                  <Text className="text-red-500 text-center font-bold">Cancel Order</Text>
                </TouchableOpacity>
              )}

              {(order.payment === "cod" || order.paymentStatus === "paid") && (
                <TouchableOpacity
                  onPress={handleProcessing}
                  className={`flex-1 bg-green-700 py-4 rounded-xl ${
                    order.payment === "gcash" && order.paymentStatus === "paid" ? "" : "ml-2"
                  }`}
                >
                  <Text className="text-white text-center font-bold">Mark as Processing</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {!actionLoading && order.status === "processing" && (
          <TouchableOpacity
            onPress={handleToReceive}
            className="bg-purple-700 py-4 rounded-xl mt-4"
          >
            <Text className="text-white text-center font-bold">Mark as To Receive</Text>
          </TouchableOpacity>
        )}

        {!actionLoading && order.status === "to_receive" && (
          <TouchableOpacity
            onPress={handleDelivered}
            className="bg-blue-600 py-4 rounded-xl mt-4"
          >
            <Text className="text-white text-center font-bold">Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        {actionLoading && (

          <View className="mt-4 bg-gray-100 rounded-xl py-4 items-center">

            <ActivityIndicator
              color="#15803D"
            />

            <Text className="text-gray-600 mt-2">
              Updating order...
            </Text>

          </View>
        )}

      </View>

      {/* ================= CANCEL MODAL ================= */}
      <Modal
        visible={
          showCancelModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowCancelModal(
            false
          )
        }
      >

        <View className="flex-1 bg-black/50 justify-end">

          <View className="bg-white rounded-t-[30px] p-6">

            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            <Text className="text-xl font-bold text-gray-800">
              {order.status === "accepted" ? "Cancel Order" : "Decline Order"}
            </Text>

            <Text className="text-gray-500 mt-1 mb-5">
              {order.status === "accepted"
                ? "Please select the reason for cancelling this order."
                : "Please select the reason for declining this order."}
            </Text>

            {/* REASONS */}
            {cancelReasons.map(
              (reason) => {

                const selected =
                  selectedReason ===
                  reason;

                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() =>
                      setSelectedReason(
                        reason
                      )
                    }
                    className={`border rounded-2xl px-4 py-3 mb-3 flex-row items-center ${
                      selected
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >

                    <Ionicons
                      name={
                        selected
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={
                        selected
                          ? "#DC2626"
                          : "#9CA3AF"
                      }
                    />

                    <Text className="ml-3 text-gray-700 font-semibold">
                      {reason}
                    </Text>

                  </TouchableOpacity>
                );
              }
            )}

            {/* OTHER INPUT */}
            {selectedReason ===
              "Other" && (

              <TextInput
                value={
                  customReason
                }
                onChangeText={
                  setCustomReason
                }
                placeholder="Enter your reason..."
                multiline
                textAlignVertical="top"
                className="border border-gray-300 rounded-2xl px-4 py-3 min-h-[100px] mb-4 text-gray-800"
              />
            )}

            {/* CONTINUE */}
            <TouchableOpacity
              onPress={
                continueCancel
              }
              disabled={
                actionLoading
              }
              className="bg-red-600 py-4 rounded-2xl"
            >

              <Text className="text-white text-center font-bold">
                Continue
              </Text>

            </TouchableOpacity>

            {/* KEEP */}
            <TouchableOpacity
              onPress={() =>
                setShowCancelModal(
                  false
                )
              }
              disabled={
                actionLoading
              }
              className="bg-gray-100 py-4 rounded-2xl mt-3"
            >

              <Text className="text-gray-700 text-center font-bold">
                Keep Order
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
}

// ================= TIMELINE =================
function TimelineRow({
  icon,
  title,
  date,
  color,
  showLine = true,
}: {
  icon: any;
  title: string;
  date: any;
  color: string;
  showLine?: boolean;
}) {
  const formatDate =
    (timestamp: any) => {

      if (!timestamp) {
        return "";
      }

      try {

        let date: Date;

        if (
          typeof timestamp?.toDate ===
          "function"
        ) {

          date =
            timestamp.toDate();

        } else if (
          typeof timestamp?.seconds ===
          "number"
        ) {

          date = new Date(
            timestamp.seconds *
              1000
          );

        } else {

          date =
            new Date(
              timestamp
            );
        }

        if (
          isNaN(
            date.getTime()
          )
        ) {

          return "";
        }

        return date.toLocaleString(
          "en-PH",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        );

      } catch {

        return "";
      }
    };

  return (
    <View className="flex-row">

      {/* ICON + LINE */}
      <View className="items-center mr-3">

        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{
            backgroundColor:
              `${color}15`,
          }}
        >

          <Ionicons
            name={icon}
            size={19}
            color={color}
          />

        </View>

        {showLine && (
          <View
            className="w-[2px] h-8 mt-1"
            style={{
              backgroundColor:
                "#D1D5DB",
            }}
          />
        )}

      </View>

      {/* TEXT */}
      <View className="flex-1 pb-3">

        <Text className="font-bold text-gray-800">
          {title}
        </Text>

        <Text className="text-gray-500 text-xs mt-1">
          {formatDate(date)}
        </Text>

      </View>

    </View>
  );
}