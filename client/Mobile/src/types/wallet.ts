export type WalletTransactionType =
  | "gcash_earning"
  | "gcash_commission"
  | "cod_commission_reserved"
  | "cod_commission_reservation_released"
  | "cod_commission_debit"
  | "cod_commission_due"
  | "cod_commission_collected"
  | "cod_delivery_fee_due"
  | "cod_delivery_fee_collected"
  | "commission_deposit"
  | "withdrawal"
  | "withdrawal_reversal"
  | "adjustment";

export type WalletTransactionDirection =
  | "credit"
  | "debit"
  | "memo";

export type WalletTransactionStatus =
  | "pending"
  | "completed"
  | "reversed"
  | "failed";

export type FarmerWalletType = {
  farmerId: string;

  availableBalance: number;

  /*
    GCash only.
    Does not include COD.
  */
  pendingBalance: number;

  reservedBalance: number;

  commissionReserveBalance: number;

  commissionReserveHeld: number;

  totalCommissionDeposited: number;

  totalCodCommissionPaid: number;

  /*
    Legacy fields kept so old documents
    do not cause TypeScript problems.
  */
  codCommissionDue: number;

  codDeliveryFeeDue: number;

  totalEarned: number;

  totalWithdrawn: number;

  totalGcashEarnings: number;

  minimumReserve: number;

  currency: "PHP";

  createdAt?: any;

  updatedAt?: any;
};

export type WalletTransaction = {
  id: string;

  farmerId: string;

  type: WalletTransactionType;

  direction: WalletTransactionDirection;

  amount: number;

  balanceAfter: number;

  commissionReserveAfter?: number;

  commissionReserveHeldAfter?: number;

  codCommissionDueAfter?: number;

  codDeliveryFeeDueAfter?: number;

  orderId?: string;

  orderNumber?: string;

  withdrawalId?: string;

  depositId?: string;

  status: WalletTransactionStatus;

  description: string;

  createdAt?: any;

  completedAt?: any;
};

export type PayoutAccountStatus =
  | "active"
  | "inactive";

export type FarmerPayoutAccountType = {
  farmerId: string;

  method: "gcash";

  channel: "PH_GCASH";

  accountName: string;

  postalCode?: string;

  accountNumberMasked: string;

  status: PayoutAccountStatus;

  createdAt?: any;

  updatedAt?: any;
};

export type FarmerWithdrawalStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "reversed"
  | "rejected"
  | "pending_compliance";

export type FarmerWithdrawalType = {
  id: string;

  farmerId: string;

  amount: number;

  minimumReserve: number;

  codCommissionDue?: number;

  codDeliveryFeeDue?: number;

  payoutFee: number;

  netAmount: number;

  payoutMethod: "gcash";

  accountName: string;

  postalCode?: string;

  accountNumberMasked: string;

  status: FarmerWithdrawalStatus;

  xenditPayoutId?: string;

  xenditReferenceId?: string;

  failureCode?: string;

  failureReason?: string;

  idempotencyKey: string;

  requestedAt?: any;

  processingAt?: any;

  completedAt?: any;

  failedAt?: any;
};

export type WalletSummary = {
  wallet: FarmerWalletType;

  payoutAccount:
    | FarmerPayoutAccountType
    | null;

  withdrawableAmount: number;
};