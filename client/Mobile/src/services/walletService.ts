import { getAuth } from "firebase/auth";

import {
  FarmerPayoutAccountType,
  FarmerWalletType,
  FarmerWithdrawalType,
  WalletTransaction,
} from "../types/wallet";

const BACKEND_URL = String(
  process.env.EXPO_PUBLIC_BACKEND_URL || ""
).replace(/\/+$/, "");

const REQUEST_TIMEOUT = 15000;

/*
  Calls that talk to Xendit (deposit / withdraw) can take longer than a
  normal read. If the app aborts too early the server keeps working and the
  user sees a false error, so give them more time.
*/
const GATEWAY_REQUEST_TIMEOUT = 60000;

export type CommissionDepositResult = {
  depositId: string;
  amount: number;
  paymentRequestId: string;
  referenceId: string;
  paymentStatus: string;
  redirectUrl: string;
};

export type CommissionDepositStatus = {
  id: string;
  farmerId: string;
  amount: number;
  status: string;
  referenceId: string | null;
  xenditPaymentStatus: string | null;
  failureReason: string | null;
  createdAt: any;
  updatedAt: any;
};

const getFirebaseIdToken = async () => {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("Your login session has expired. Please login again.");
  }

  return await user.getIdToken();
};

const requestBackend = async <T = any>(
  path: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT
): Promise<T> => {
  if (!BACKEND_URL) {
    throw new Error("EXPO_PUBLIC_BACKEND_URL is not configured.");
  }

  const token = await getFirebaseIdToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Backend request failed with status ${response.status}.`
      );
    }

    return data as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const getFarmerWallet = async (
  farmerId?: string
): Promise<FarmerWalletType> => {
  const result = await requestBackend<{
    success: boolean;
    wallet: FarmerWalletType;
  }>("/wallet/me");

  if (farmerId && result.wallet.farmerId !== farmerId) {
    throw new Error("Wallet ownership verification failed.");
  }

  return result.wallet;
};

export const getPendingGcashEarnings = async (): Promise<number> => {
  const result = await requestBackend<{
    success: boolean;
    pendingBalance: number;
  }>("/wallet/pending-gcash");

  return Number(result.pendingBalance || 0);
};

export const getWalletTransactions = async (
  farmerId?: string
): Promise<WalletTransaction[]> => {
  const result = await requestBackend<{
    success: boolean;
    transactions: WalletTransaction[];
  }>("/wallet/transactions");

  if (!farmerId) {
    return result.transactions;
  }

  return result.transactions.filter(
    (transaction) => transaction.farmerId === farmerId
  );
};

export const getFarmerPayoutAccount =
  async (): Promise<FarmerPayoutAccountType | null> => {
    const result = await requestBackend<{
      success: boolean;
      payoutAccount: FarmerPayoutAccountType | null;
    }>("/wallet/payout-account");

    return result.payoutAccount;
  };

export const saveFarmerPayoutAccount = async (input: {
  accountName: string;
  accountNumber: string;
  postalCode?: string;
}): Promise<FarmerPayoutAccountType> => {
  const result = await requestBackend<{
    success: boolean;
    payoutAccount: FarmerPayoutAccountType;
  }>("/wallet/payout-account", {
    method: "PUT",
    body: JSON.stringify(input),
  });

  return result.payoutAccount;
};

/*
  Always pass the amount the farmer confirmed on screen. The server rejects
  it if it is more than the currently withdrawable balance.
*/
export const requestFarmerWithdrawal = async (
  amount?: number
): Promise<FarmerWithdrawalType> => {
  const result = await requestBackend<{
    success: boolean;
    withdrawal: FarmerWithdrawalType;
    withdrawableAmount?: number;
  }>(
    "/wallet/withdraw",
    {
      method: "POST",
      body: JSON.stringify(amount === undefined ? {} : { amount }),
    },
    GATEWAY_REQUEST_TIMEOUT
  );

  return result.withdrawal;
};

export const createCommissionDeposit =
  async (amount: number): Promise<CommissionDepositResult> => {
    const result = await requestBackend<{
      success: boolean;
      depositId: string;
      amount: number;
      paymentRequestId: string;
      referenceId: string;
      paymentStatus: string;
      redirectUrl: string;
    }>(
      "/wallet/deposit",
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      },
      GATEWAY_REQUEST_TIMEOUT
    );

    if (!result.redirectUrl) {
      throw new Error("Xendit did not return a payment URL.");
    }

    return result;
  };

export const getCommissionDepositStatus = async (
  depositId: string
): Promise<CommissionDepositStatus> => {
  if (!depositId) {
    throw new Error("Deposit ID is required.");
  }

  const result = await requestBackend<{
    success: boolean;
    deposit: CommissionDepositStatus;
  }>(`/wallet/deposits/${encodeURIComponent(depositId)}`);

  return result.deposit;
};

/*
  withdrawable = availableBalance - reservedBalance
  (reservedBalance is the part of availableBalance held for in-flight payouts)
*/
export const getWalletSummary = async (farmerId?: string) => {
  const [wallet, payoutAccount] = await Promise.all([
    getFarmerWallet(farmerId),
    getFarmerPayoutAccount(),
  ]);

  const withdrawableAmount = Math.max(
    0,
    Number(wallet.availableBalance || 0) - Number(wallet.reservedBalance || 0)
  );

  return {
    wallet,
    payoutAccount,
    withdrawableAmount,
  };
};
