import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
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
  depositToWallet,
  getFarmerWallet,
  getWalletTransactions,
} from "@/src/services/walletService";

import {
  FarmerWalletType,
  WalletTransaction,
} from "@/src/types/wallet";

export default function FarmerBalance() {

  const router =
    useRouter();

  const [wallet, setWallet] =
    useState<FarmerWalletType | null>(
      null
    );

  const [transactions, setTransactions] =
    useState<
      WalletTransaction[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [depositLoading, setDepositLoading] =
    useState(false);

  const [showDepositModal, setShowDepositModal] =
    useState(false);

  const [depositAmount, setDepositAmount] =
    useState("");

  // ================= FORMAT MONEY =================
  const formatMoney = (
    amount: number
  ) => {

    return `₱${Number(
      amount || 0
    ).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ================= FORMAT DATE =================
  const formatDate =
    (timestamp: any) => {

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

          date =
            new Date(
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

  // ================= LOAD WALLET =================
  const loadWallet =
    async () => {

      try {

        setLoading(true);

        const userStr =
          await AsyncStorage.getItem(
            "user"
          );

        if (!userStr) {

          router.replace(
            "/auth/login"
          );

          return;
        }

        const user =
          JSON.parse(
            userStr
          );

        const farmerId =
          user.uid ||
          user.userId ||
          user.id;

        if (!farmerId) {

          Alert.alert(
            "Error",
            "Farmer account not found."
          );

          return;
        }

        const [
          walletData,
          transactionData,
        ] =
          await Promise.all([
            getFarmerWallet(
              farmerId
            ),
            getWalletTransactions(
              farmerId
            ),
          ]);

        setWallet(
          walletData
        );

        setTransactions(
          transactionData
        );

      } catch (error) {

        console.log(
          "LOAD WALLET ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to load wallet."
        );

      } finally {

        setLoading(false);

      }
    };

  useFocusEffect(
    useCallback(() => {

      loadWallet();

    }, [])
  );

  // ================= DEPOSIT =================
  const handleDeposit =
    async () => {

      const amount =
        Number(
          depositAmount.replace(
            /,/g,
            ""
          )
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {

        Alert.alert(
          "Invalid Amount",
          "Please enter a valid deposit amount."
        );

        return;
      }

      Alert.alert(
        "Confirm Deposit",
        `Are you sure you want to add ${formatMoney(
          amount
        )} to your wallet?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Confirm",
            onPress:
              async () => {

                try {

                  setDepositLoading(
                    true
                  );

                  const userStr =
                    await AsyncStorage.getItem(
                      "user"
                    );

                  if (!userStr) {
                    throw new Error(
                      "Farmer account not found."
                    );
                  }

                  const user =
                    JSON.parse(
                      userStr
                    );

                  const farmerId =
                    user.uid ||
                    user.userId ||
                    user.id;

                  if (!farmerId) {
                    throw new Error(
                      "Farmer account not found."
                    );
                  }

                  await depositToWallet(
                    farmerId,
                    amount
                  );

                  setDepositAmount(
                    ""
                  );

                  setShowDepositModal(
                    false
                  );

                  await loadWallet();

                  Alert.alert(
                    "Deposit Recorded",
                    `${formatMoney(
                      amount
                    )} has been added to your wallet.`
                  );

                } catch (
                  error: any
                ) {

                  console.log(
                    "DEPOSIT ERROR:",
                    error
                  );

                  Alert.alert(
                    "Deposit Failed",
                    error?.message ||
                      "Failed to record deposit."
                  );

                } finally {

                  setDepositLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  // ================= TRANSACTION COLOR =================
  const getTransactionColor =
    (type: string) => {

      switch (type) {

        case "deposit":
          return "#15803D";

        case "commission":
          return "#DC2626";

        default:
          return "#2563EB";
      }
    };

  // ================= TRANSACTION ICON =================
  const getTransactionIcon =
    (type: string) => {

      switch (type) {

        case "deposit":
          return "arrow-down-circle";

        case "commission":
          return "remove-circle";

        default:
          return "swap-horizontal";
      }
    };

  // ================= LOADING =================
  if (loading) {

    return (
      <View className="flex-1 justify-center items-center bg-gray-50">

        <ActivityIndicator
          size="large"
          color="#15803D"
        />

        <Text className="text-green-700 font-semibold mt-3">
          Loading wallet...
        </Text>

      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">

      {/* ================= HEADER ================= */}
      <View className="bg-green-900 pt-14 pb-5 px-5 flex-row items-center">

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          className="mr-4"
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
          />

        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold">
          Wallet Balance
        </Text>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
      >

        {/* ================= BALANCE ================= */}
        <View
          className="bg-green-800 rounded-3xl p-6 mb-4"
          style={{
            elevation: 5,
          }}
        >

          <View className="flex-row items-center">

            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">

              <Ionicons
                name="wallet-outline"
                size={27}
                color="white"
              />

            </View>

            <Text className="text-green-100 font-medium ml-3">
              Available Balance
            </Text>

          </View>

          <Text className="text-white text-4xl font-black mt-5">
            {formatMoney(
              wallet?.balance || 0
            )}
          </Text>

          <Text className="text-green-100 text-xs mt-2">
            Wallet balance for FarmGate COD commissions
          </Text>

        </View>

        {/* ================= DEPOSIT ================= */}
        <TouchableOpacity
          onPress={() => setShowDepositModal(true)}
          activeOpacity={0.8}
          className="bg-white border border-green-200 rounded-2xl p-4 flex-row items-center mb-5">

          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#15803D"
            />
          </View>

          <View className="flex-1 ml-3">
            <Text className="font-bold text-gray-800">
              Deposit
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              Add funds to your wallet
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#15803D"
          />
        </TouchableOpacity>

          {/* ================= WITHDRAW ================= */}
        <TouchableOpacity
          onPress={() => setShowDepositModal(false)}
          activeOpacity={0.8}
          className="bg-white border border-green-200 rounded-2xl p-4 flex-row items-center mb-5">

          <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#15803D"
            />
          </View>

          <View className="flex-1 ml-3">
            <Text className="font-bold text-gray-800">
              Withdraw
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              Withdraw your balance
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#15803D"
          />
        </TouchableOpacity>


        

        {/* ================= SUMMARY ================= */}
        <View className="flex-row mb-5">

          <View className="flex-1 bg-white rounded-2xl p-4 mr-2">

            <Text className="text-gray-500 text-xs">
              Total Deposits
            </Text>

            <Text className="text-green-700 font-bold text-lg mt-2">
              {formatMoney(
                wallet?.totalDeposits ||
                  0
              )}
            </Text>

          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 ml-2">

            <Text className="text-gray-500 text-xs">
              Total Commission
            </Text>

            <Text className="text-red-600 font-bold text-lg mt-2">
              {formatMoney(
                wallet?.totalCommission ||
                  0
              )}
            </Text>

          </View>

        </View>

        {/* ================= HISTORY ================= */}
        <View className="bg-white rounded-2xl p-4">

          <View className="flex-row justify-between items-center mb-3">

            <Text className="text-lg font-bold text-gray-800">
              Transaction History
            </Text>

            <Text className="text-gray-400 text-xs">
              {transactions.length} record(s)
            </Text>

          </View>

          {transactions.length ===
          0 ? (

            <View className="items-center py-10">

              <Ionicons
                name="receipt-outline"
                size={50}
                color="#D1D5DB"
              />

              <Text className="text-gray-400 mt-3">
                No transactions yet.
              </Text>

            </View>

          ) : (

            transactions.map(
              (
                transaction,
                index
              ) => {

                const isDeposit =
                  transaction.type ===
                  "deposit";

                return (

                  <View
                    key={
                      transaction.id ||
                      `transaction-${index}`
                    }
                    className={`flex-row py-4 ${
                      index <
                      transactions.length -
                        1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >

                    {/* ICON */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{
                        backgroundColor:
                          `${getTransactionColor(
                            transaction.type
                          )}15`,
                      }}
                    >

                      <Ionicons
                        name={
                          getTransactionIcon(
                            transaction.type
                          ) as any
                        }
                        size={20}
                        color={
                          getTransactionColor(
                            transaction.type
                          )
                        }
                      />

                    </View>

                    {/* INFO */}
                    <View className="flex-1 ml-3">

                      <Text className="font-bold text-gray-800">

                        {isDeposit
                          ? "Wallet Deposit"
                          : transaction.type ===
                            "commission"
                          ? "COD Commission"
                          : "Wallet Adjustment"}

                      </Text>

                      <Text className="text-gray-500 text-xs mt-1">
                        {
                          transaction.description
                        }
                      </Text>

                      {transaction.orderNumber && (

                        <Text className="text-green-700 text-xs font-semibold mt-1">
                          {
                            transaction.orderNumber
                          }
                        </Text>

                      )}

                      <Text className="text-gray-400 text-[11px] mt-1">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </Text>

                    </View>

                    {/* AMOUNT */}
                    <View className="items-end">

                      <Text
                        className="font-bold"
                        style={{
                          color:
                            isDeposit
                              ? "#15803D"
                              : "#DC2626",
                        }}
                      >

                        {isDeposit
                          ? "+"
                          : "-"}

                        {formatMoney(
                          Math.abs(
                            transaction.amount
                          )
                        )}

                      </Text>

                      <Text className="text-gray-400 text-[10px] mt-1">
                        Balance:{" "}
                        {formatMoney(
                          transaction.balanceAfter
                        )}
                      </Text>

                    </View>

                  </View>
                );
              }
            )

          )}

        </View>

      </ScrollView>

      {/* ================= DEPOSIT MODAL ================= */}
      <Modal
        visible={
          showDepositModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowDepositModal(
            false
          )
        }
      >

        <View className="flex-1 bg-black/50 justify-end">

          <View className="bg-white rounded-t-[30px] p-6">

            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            <Text className="text-xl font-bold text-gray-800">
              Deposit Funds
            </Text>

            <Text className="text-gray-500 text-sm mt-1 mb-5">
              Enter the amount to add to your wallet.
            </Text>

            <Text className="text-gray-500 text-sm mb-2">
              Amount
            </Text>

            <View className="flex-row items-center border border-gray-300 rounded-2xl px-4">

              <Text className="text-green-700 text-xl font-bold">
                ₱
              </Text>

              <TextInput
                value={
                  depositAmount
                }
                onChangeText={
                  setDepositAmount
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-4 px-3 text-lg text-gray-800"
              />

            </View>

            <TouchableOpacity
              onPress={
                handleDeposit
              }
              disabled={
                depositLoading
              }
              className="bg-green-700 py-4 rounded-2xl mt-5"
            >

              {depositLoading ? (

                <ActivityIndicator
                  color="white"
                />

              ) : (

                <Text className="text-white text-center font-bold">
                  Confirm Deposit
                </Text>

              )}

            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setShowDepositModal(
                  false
                )
              }
              disabled={
                depositLoading
              }
              className="bg-gray-100 py-4 rounded-2xl mt-3"
            >

              <Text className="text-gray-700 text-center font-bold">
                Cancel
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
}