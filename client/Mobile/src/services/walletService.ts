import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";

import {
  FarmerWalletType,
  WalletTransaction,
} from "../types/wallet";

// =====================================================
// GET OR CREATE FARMER WALLET
// =====================================================
export const getOrCreateFarmerWallet = async (
  farmerId: string
): Promise<FarmerWalletType> => {
  try {
    if (!farmerId) {
      throw new Error(
        "Farmer ID is required."
      );
    }

    const walletRef = doc(
      db,
      "farmerWallets",
      farmerId
    );

    const walletSnap =
      await getDoc(walletRef);

    if (walletSnap.exists()) {
      return {
        farmerId:
          walletSnap.id,
        ...walletSnap.data(),
      } as FarmerWalletType;
    }

    const newWallet = {
      farmerId,

      balance: 0,

      totalDeposits: 0,

      totalCommission: 0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };

    await runTransaction(
      db,
      async (transaction) => {

        const existing =
          await transaction.get(
            walletRef
          );

        if (!existing.exists()) {
          transaction.set(
            walletRef,
            newWallet
          );
        }
      }
    );

    return {
      farmerId,

      balance: 0,

      totalDeposits: 0,

      totalCommission: 0,
    };
  } catch (error) {
    console.log(
      "GET OR CREATE WALLET ERROR:",
      error
    );

    throw error;
  }
};

// =====================================================
// GET FARMER WALLET
// =====================================================
export const getFarmerWallet = async (
  farmerId: string
): Promise<FarmerWalletType> => {
  if (!farmerId) {
    throw new Error(
      "Farmer ID is required."
    );
  }

  const walletRef = doc(
    db,
    "farmerWallets",
    farmerId
  );

  const walletSnap =
    await getDoc(walletRef);

  if (!walletSnap.exists()) {
    return getOrCreateFarmerWallet(
      farmerId
    );
  }

  return {
    farmerId:
      walletSnap.id,
    ...walletSnap.data(),
  } as FarmerWalletType;
};

// =====================================================
// DEPOSIT TO WALLET
// =====================================================
export const depositToWallet = async (
  farmerId: string,
  amount: number,
  description = "Farmer wallet deposit"
) => {
  if (!farmerId) {
    throw new Error(
      "Farmer ID is required."
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Deposit amount must be greater than zero."
    );
  }

  const walletRef = doc(
    db,
    "farmerWallets",
    farmerId
  );

  const transactionRef = doc(
    collection(
      walletRef,
      "transactions"
    )
  );

  await runTransaction(
    db,
    async (transaction) => {

      const walletSnap =
        await transaction.get(
          walletRef
        );

      let balanceBefore = 0;

      let totalDeposits = 0;

      let totalCommission = 0;

      if (
        walletSnap.exists()
      ) {

        const data =
          walletSnap.data();

        balanceBefore =
          Number(
            data.balance || 0
          );

        totalDeposits =
          Number(
            data.totalDeposits || 0
          );

        totalCommission =
          Number(
            data.totalCommission ||
              0
          );
      }

      const balanceAfter =
        Number(
          (
            balanceBefore +
            amount
          ).toFixed(2)
        );

      transaction.set(
        walletRef,
        {
          farmerId,

          balance:
            balanceAfter,

          totalDeposits:
            Number(
              (
                totalDeposits +
                amount
              ).toFixed(2)
            ),

          totalCommission,

          updatedAt:
            serverTimestamp(),

          ...(walletSnap.exists()
            ? {}
            : {
                createdAt:
                  serverTimestamp(),
              }),
        },
        {
          merge: true,
        }
      );

      transaction.set(
        transactionRef,
        {
          farmerId,

          type:
            "deposit",

          amount:
            Number(
              amount.toFixed(2)
            ),

          balanceBefore,

          balanceAfter,

          description,

          createdAt:
            serverTimestamp(),
        }
      );
    }
  );

  return true;
};

// =====================================================
// CALCULATE 3% COMMISSION
// =====================================================
export const calculateCommission = (
  amount: number
) => {
  return Number(
    (
      Number(amount) *
      0.03
    ).toFixed(2)
  );
};

// =====================================================
// RECORD COD COMMISSION
// =====================================================
// IMPORTANT:
// This should only be called once after the
// COD order becomes DELIVERED.
//
// The caller should first make sure:
// commissionStatus === "pending"
// =====================================================
export const recordCODCommission =
  async (
    farmerId: string,
    commissionAmount: number,
    orderId: string,
    orderNumber?: string
  ) => {

    if (!farmerId) {
      throw new Error(
        "Farmer ID is required."
      );
    }

    if (
      !Number.isFinite(
        commissionAmount
      ) ||
      commissionAmount <= 0
    ) {
      throw new Error(
        "Commission amount must be greater than zero."
      );
    }

    if (!orderId) {
      throw new Error(
        "Order ID is required."
      );
    }

    const walletRef = doc(
      db,
      "farmerWallets",
      farmerId
    );

    const transactionRef = doc(
      collection(
        walletRef,
        "transactions"
      )
    );

    const orderRef = doc(
      db,
      "orders",
      orderId
    );

    await runTransaction(
      db,
      async (transaction) => {

        const walletSnap =
          await transaction.get(
            walletRef
          );

        const orderSnap =
          await transaction.get(
            orderRef
          );

        if (!orderSnap.exists()) {
          throw new Error(
            "Order not found."
          );
        }

        const order =
          orderSnap.data() as any;

        // =================================================
        // DUPLICATE PROTECTION
        // =================================================
        if (
          order.commissionStatus ===
          "charged"
        ) {
          throw new Error(
            "Commission has already been charged for this order."
          );
        }

        if (
          order.payment !==
          "cod"
        ) {
          throw new Error(
            "Commission wallet deduction only applies to COD orders."
          );
        }

        if (
          order.status !==
          "delivered"
        ) {
          throw new Error(
            "COD commission can only be charged after delivery."
          );
        }

        // =================================================
        // WALLET VALUES
        // =================================================
        let balanceBefore = 0;

        let totalDeposits = 0;

        let totalCommission = 0;

        if (
          walletSnap.exists()
        ) {

          const data =
            walletSnap.data();

          balanceBefore =
            Number(
              data.balance || 0
            );

          totalDeposits =
            Number(
              data.totalDeposits ||
                0
            );

          totalCommission =
            Number(
              data.totalCommission ||
                0
            );
        }

        const balanceAfter =
          Number(
            (
              balanceBefore -
              commissionAmount
            ).toFixed(2)
          );

        const newTotalCommission =
          Number(
            (
              totalCommission +
              commissionAmount
            ).toFixed(2)
          );

        // =================================================
        // UPDATE WALLET
        // =================================================
        transaction.set(
          walletRef,
          {
            farmerId,

            balance:
              balanceAfter,

            totalDeposits,

            totalCommission:
              newTotalCommission,

            updatedAt:
              serverTimestamp(),

            ...(walletSnap.exists()
              ? {}
              : {
                  createdAt:
                    serverTimestamp(),
                }),
          },
          {
            merge: true,
          }
        );

        // =================================================
        // SAVE WALLET TRANSACTION
        // =================================================
        transaction.set(
          transactionRef,
          {
            farmerId,

            type:
              "commission",

            amount:
              Number(
                commissionAmount.toFixed(
                  2
                )
              ),

            balanceBefore,

            balanceAfter,

            description:
              `3% COD commission for order ${
                orderNumber ||
                orderId
              }`,

            orderId,

            ...(orderNumber
              ? {
                  orderNumber,
                }
              : {}),

            createdAt:
              serverTimestamp(),
          }
        );

        // =================================================
        // MARK COMMISSION AS CHARGED
        // =================================================
        transaction.update(
          orderRef,
          {
            commissionStatus:
              "charged",

            commissionAmount:
              Number(
                commissionAmount.toFixed(
                  2
                )
              ),

            commissionRate:
              0.03,

            commissionChargedAt:
              serverTimestamp(),
          }
        );
      }
    );

    return true;
  };

// =====================================================
// GET WALLET TRANSACTIONS
// =====================================================
export const getWalletTransactions =
  async (
    farmerId: string
  ): Promise<
    WalletTransaction[]
  > => {

    if (!farmerId) {
      throw new Error(
        "Farmer ID is required."
      );
    }

    const walletRef = doc(
      db,
      "farmerWallets",
      farmerId
    );

    const transactionsRef =
      collection(
        walletRef,
        "transactions"
      );

    const snapshot =
      await getDocs(
        query(
          transactionsRef
        )
      );

    const transactions =
      snapshot.docs.map(
        (d) =>
          ({
            id:
              d.id,
            ...d.data(),
          } as WalletTransaction)
      );

    return transactions.sort(
      (a, b) => {

        const aTime =
          typeof a.createdAt?.toMillis ===
          "function"
            ? a.createdAt.toMillis()
            : 0;

        const bTime =
          typeof b.createdAt?.toMillis ===
          "function"
            ? b.createdAt.toMillis()
            : 0;

        return bTime - aTime;
      }
    );
  };