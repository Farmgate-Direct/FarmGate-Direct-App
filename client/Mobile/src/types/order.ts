// src/types/order.ts
import { SaleContribution } from "./product";

// ================= ORDER PRODUCT LINE =================
// Bawat product sa loob ng order ay may batchId/harvestRecordId
// (traceability - item 7-8 ng Weekly Batch spec) - ito ang UNANG
// contribution mula sa FIFO sale. Ang "contributions" ay ang BUONG
// breakdown kung sakaling kailangan kumuha mula sa higit sa isang
// batch/harvest record ang quantity na na-order (ex. naubos ang isang
// batch sa gitna ng pag-order).
export type OrderProduct = {
  productId: string;
  batchId: string | null;
  batchNumber: number | null;
  harvestRecordId: string | null;
  contributions: SaleContribution[];
  name: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
  reviewed?: boolean;
};

export type OrderAddress = {
  id?: string;
  fullName: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  phone: string;
};

export type OrderType = {
  id?: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmName: string;
  products: OrderProduct[];
  delivery: "pickup" | "delivery";
  payment: "qr" | "cod";
  address: OrderAddress;
  pickupDate?: string | null;
  pickupTime?: string | null;
  subTotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt?: any; // Firestore serverTimestamp() sa pag-create
};