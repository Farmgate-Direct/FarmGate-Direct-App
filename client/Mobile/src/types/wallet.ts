export type WalletTransactionType =
  | "deposit"
  | "commission"
  | "adjustment";

export type FarmerWalletType = {
  farmerId: string;

  balance: number;

  totalDeposits: number;

  totalCommission: number;

  createdAt?: any;

  updatedAt?: any;
};

export type WalletTransaction = {
  id?: string;

  farmerId: string;

  type: WalletTransactionType;

  amount: number;

  balanceBefore: number;

  balanceAfter: number;

  description: string;

  orderId?: string;

  orderNumber?: string;

  createdAt?: any;
};