// src/types/product.ts

export type ProductCategory =
  | "Fruits"
  | "Egg & Poultry"
  | "Vegetables"
  | "Rice & Grains";
export type ProductUnit = "per kg" | "per pcs";
export type ProductStatus = "Available" | "Out of Stock";

// Isang harvest week = 7 araw. Ginagamit ito para malaman kung "aktibo"
// pa ang isang WeeklyBatch (puwede pang dagdagan ng harvest) o kailangan
// na ng bagong batch para sa susunod na linggo.
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ================= MASTER PRODUCT =================
// Isang "product" doc lang per farmer per (category + name), habambuhay.
// Ex: Farmer A -> Talong (Vegetables) = 1 lang listing, kahit ilang
// linggo na siyang ina-ani - dito lang nagbabago ang mga WeeklyBatch sa
// ilalim niya.
export type CreateProductInput = {
  name: string;
  category: string;
  unit: string;
  description: string;
  image: string;
  imagePublicId: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  rating: number; // average ng lahat ng reviews (lahat ng batch)
  totalReviews: number;
  totalSales: number;
  weeklySales: number;
  monthlySales: number;
  createdAt: number;
  // ================= DENORMALIZED DISPLAY FIELDS =================
  // Hindi ito ang source of truth (nasa WeeklyBatch talaga yun) - ito ay
  // awtomatikong kino-compute ng productService (recalculateProductAggregates)
  // tuwing may pagbabago sa harvest/batch, batay sa FIFO: ang
  // pinakamatandang batch na "Available" pa at may stock ang siyang
  // "kasalukuyang" (current) batch na ipinapakita/ibinebenta sa buyer.
  price: number;
  stock: number; // kabuuan ng stock sa LAHAT ng batch
  status: string;
  freshness: string; // ex. "Harvested this week"
  // Soft-delete flag - "Archive" imbes na tunay na burahin. Hindi na
  // makikita ang mga archived na product sa listing/feed/dropdown, pero
  // nananatili ang datos (para sa order history, traceability, atbp).
  archived: boolean;
};

export type ProductType = CreateProductInput & {
  docId: string;
};

// ================= WEEKLY BATCH =================
// Isang batch = isang HARVEST WEEK ng isang produkto (hindi bawat ani,
// hindi bawat 30 araw). Habang nasa loob pa ng weekStart–weekEnd window,
// "aktibo" ang batch na ito - anumang bagong ani sa parehong linggo ay
// idadagdag bilang HarvestRecord dito (hindi gagawa ng bagong batch).
// Kapag lumagpas na ang weekEnd, kahit may bagong ani, awtomatikong
// bagong WeeklyBatch (batchNumber + 1) na ang gagawin.
export type CreateBatchInput = {
  productId: string;
  farmerId: string;
  batchNumber: number;
  weekStart: number; // simula ng harvest week (timestamp, start of day)
  weekEnd: number; // katapusan ng harvest week (weekStart + 7 days - 1ms)
  price: number;
  stock: number; // kasalukuyang natitirang BENTA-BENTA na stock
  totalHarvested: number; // kabuuan ng LAHAT ng harvest record sa batch na ito
  freshness: string; // computed label, hindi farmer-editable
  status: string; // "Available" | "Out of Stock" (farmer-editable)
  createdAt: number;
  // Soft-delete flag - "Archive" ang batch imbes na burahin. Hindi na ito
  // isasali sa FIFO selling / stock aggregation, pero mananatili ang
  // harvest records at history nito.
  archived: boolean;
  // Totoo ito KUNG ang pag-archive ng batch na ito ay resulta ng
  // pag-archive sa BUONG PRODUCT (cascade), hindi sadyang pag-archive
  // ng farmer sa batch na ito mismo. Ginagamit ito para malaman ng
  // unarchiveProduct() kung alin sa mga archived batch ang dapat
  // isabay na i-unarchive - HINDI dapat maapektuhan ang mga batch na
  // sadyang in-archive ng farmer nang mag-isa (independiyente sa
  // product), kahit pa i-unarchive ang buong product.
  archivedViaProduct: boolean;
};

export type BatchType = CreateBatchInput & {
  docId: string;
};

// ================= HARVEST RECORD =================
// Isang harvest record = isang beses na pag-aani sa loob ng isang
// WeeklyBatch. Maraming harvest record ang puwedeng mapunta sa iisang
// batch (ex. July 10, July 13, July 16 - lahat sa Batch 001).
export type CreateHarvestRecordInput = {
  batchId: string;
  productId: string;
  farmerId: string;
  quantity: number; // dami ng inaning sa pagkakataong ito
  remainingQuantity: number; // natitira pa (pagkatapos ng FIFO sales) -
  // ginagamit para sa harvest traceability ng bawat order
  harvestDate: number; // aktwal na petsa ng pag-aani
  createdAt: number;
};

export type HarvestRecordType = CreateHarvestRecordInput & {
  docId: string;
};

// ================= REVIEW =================
// Naka-link ang review sa Order, WeeklyBatch, AT (optional) sa specific
// HarvestRecord kung saan talaga nanggaling ang naipadalang produkto -
// para may traceability kapag may reklamo o quality issue.
export type CreateReviewInput = {
  productId: string;
  batchId: string;
  batchNumber: number;
  harvestRecordId?: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: number;
};

export type ReviewType = CreateReviewInput & {
  docId: string;
};

// ================= SALE CONTRIBUTION (para sa Orders) =================
// Ibinabalik ito ng recordSale() sa productService - dito galing ang
// dapat i-store ng Order/Checkout mo bilang batchId/harvestRecordId
// reference (item 8 ng spec: Product ID, Batch ID, Harvest Record ID,
// Quantity, Price, Order Date).
export type SaleContribution = {
  batchId: string;
  batchNumber: number;
  harvestRecordId: string | null;
  quantity: number;
};