// src/services/productService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  increment,
  limit,
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";
import {
  CreateProductInput,
  ProductType,
  CreateBatchInput,
  BatchType,
  CreateHarvestRecordInput,
  HarvestRecordType,
  CreateReviewInput,
  ReviewType,
  SaleContribution,
  WEEK_MS,
} from "../types/product";
import { normalizeProductName } from "../../constants/productCatalog";

const productCollection = collection(db, "products");
const batchCollection = collection(db, "productBatches");
const harvestCollection = collection(db, "harvestRecords");
const reviewCollection = collection(db, "reviews");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Aktibo pa ba ang batch para sa PAGDARAGDAG ng bagong harvest (ibig
// sabihin, nasa loob pa tayo ng weekStart–weekEnd window nito)?
const isWithinHarvestWeek = (batch: Pick<CreateBatchInput, "weekEnd">) =>
  Date.now() <= batch.weekEnd;

// Freshness label na kino-compute batay sa harvest week ng batch -
// hindi na ito farmer-editable, awtomatiko na ito.
const getFreshnessLabel = (batch: Pick<CreateBatchInput, "weekEnd">) => {
  if (isWithinHarvestWeek(batch)) return "Harvested this week";
  const daysAgo = Math.floor((Date.now() - batch.weekEnd) / MS_PER_DAY);
  return daysAgo <= 0 ? "Harvested this week" : `Harvested ${daysAgo}d ago`;
};

// ================= GET BY ID (master product) =================
export const getProductById = async (id: string): Promise<ProductType | null> => {
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return null;
    return { docId: snap.id, ...(snap.data() as CreateProductInput) };
  } catch (error) {
    console.log("GET PRODUCT ERROR:", error);
    return null;
  }
};

// ================= GET FARMER'S EXISTING PRODUCTS (for dropdown) =================
// Default: hindi kasama ang mga archived na product (soft-deleted).
export const getFarmerProductNames = async (
  farmerId: string,
  includeArchived: boolean = false
): Promise<ProductType[]> => {
  try {
    const q = query(productCollection, where("farmerId", "==", farmerId));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((d) => ({
      docId: d.id,
      ...(d.data() as CreateProductInput),
    }));
    return includeArchived ? products : products.filter((p) => !p.archived);
  } catch (error) {
    console.log("GET FARMER PRODUCTS ERROR:", error);
    return [];
  }
};

export const getFarmerProducts = getFarmerProductNames;

// ================= GET ARCHIVED PRODUCTS (para sa "Archived" tab) =================
export const getArchivedProducts = async (farmerId: string): Promise<ProductType[]> => {
  const all = await getFarmerProductNames(farmerId, true);
  return all.filter((p) => p.archived);
};

// ================= FIND EXISTING MASTER PRODUCT (ACTIVE lang) =================
// Hindi kasama ang mga archived na product sa pagtugma - ginagamit ito
// para sa "add to existing batch" logic. Ang pag-detect ng ARCHIVED na
// duplicate (para bawalan ang farmer na gumawa ng bagong listing habang
// may naka-archive pa siyang kapareho) ay hiwalay na function sa ibaba
// (findArchivedProduct).
const findExistingProduct = async (
  farmerId: string,
  name: string,
  category: string
): Promise<ProductType | null> => {
  const q = query(
    productCollection,
    where("farmerId", "==", farmerId),
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);
  const target = normalizeProductName(name);

  const match = snapshot.docs.find((d) => {
    const data = d.data() as CreateProductInput;
    return !data.archived && normalizeProductName(data.name) === target;
  });

  if (!match) return null;
  return { docId: match.id, ...(match.data() as CreateProductInput) };
};

// ================= FIND ARCHIVED DUPLICATE =================
// Ginagamit para tignan kung may NAKA-ARCHIVE nang product na
// kaparehong pangalan+category (ex. "Egg" sa "Egg & Poultry"). Kung meron,
// dapat pigilan ang farmer na gumawa ng BAGONG duplicate na listing -
// kailangan muna nilang i-unarchive ang luma bago sila makapag-harvest
// ulit dito, para hindi magkaroon ng dalawang magkahiwalay na "Egg"
// products sa likod (isa active, isa archived) na parehong-pareho.
export const findArchivedProduct = async (
  farmerId: string,
  name: string,
  category: string
): Promise<ProductType | null> => {
  const q = query(
    productCollection,
    where("farmerId", "==", farmerId),
    where("category", "==", category)
  );
  const snapshot = await getDocs(q);
  const target = normalizeProductName(name);

  const match = snapshot.docs.find((d) => {
    const data = d.data() as CreateProductInput;
    return !!data.archived && normalizeProductName(data.name) === target;
  });

  if (!match) return null;
  return { docId: match.id, ...(match.data() as CreateProductInput) };
};

// ================= GET LATEST BATCH (by batchNumber, kahit hindi aktibo, hindi archived) =================
export const getLatestBatch = async (productId: string): Promise<BatchType | null> => {
  const batches = await getBatchesByProduct(productId);
  return batches[0] || null;
};

// ================= GET ACTIVE BATCH (para sa bagong harvest) =================
// "Aktibo" = ito ang pinakabagong batch AT hindi pa lumalagpas ang
// weekEnd nito. Kung wala (walang batch pa, o naubusan na ng linggo ang
// pinakabagong batch), ibig sabihin kailangan na ng BAGONG WeeklyBatch.
export const getActiveBatchForHarvest = async (
  productId: string
): Promise<BatchType | null> => {
  const latest = await getLatestBatch(productId);
  if (!latest) return null;
  return isWithinHarvestWeek(latest) ? latest : null;
};

// ================= GET ALL BATCHES OF A PRODUCT (newest first) =================
// Default: hindi kasama ang mga archived na batch. Client-side na rin
// ang pag-sort (hindi Firestore orderBy) para hindi na kailangan pa ng
// composite index.
export const getBatchesByProduct = async (
  productId: string,
  includeArchived: boolean = false
): Promise<BatchType[]> => {
  try {
    const q = query(batchCollection, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    const batches = snapshot.docs
      .map((d) => ({ docId: d.id, ...(d.data() as CreateBatchInput) }))
      .sort((a, b) => b.batchNumber - a.batchNumber);
    return includeArchived ? batches : batches.filter((b) => !b.archived);
  } catch (error) {
    console.log("GET BATCHES ERROR:", error);
    return [];
  }
};

// ================= GET HARVEST RECORDS OF A BATCH (oldest first) =================
// NOTE: walang `orderBy` sa Firestore query mismo - client-side na lang
// ang pag-sort, para hindi na kailangan pa ng composite index (kung wala
// pa itong index, TAHIMIK na nabibigo ang where+orderBy combo at
// nagbabalik ng blangkong array - ito ang dating sanhi kung bakit
// palaging "walang harvest record" kahit may laman naman).
export const getHarvestRecordsByBatch = async (
  batchId: string
): Promise<HarvestRecordType[]> => {
  try {
    const q = query(harvestCollection, where("batchId", "==", batchId));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((d) => ({
      docId: d.id,
      ...(d.data() as CreateHarvestRecordInput),
    }));
    return records.sort((a, b) => a.harvestDate - b.harvestDate);
  } catch (error) {
    console.log("GET HARVEST RECORDS ERROR:", error);
    return [];
  }
};

// ================= RECALCULATE PRODUCT DISPLAY FIELDS =================
// Tuwing may harvest/batch/sale na nagbago, ito ang nagre-recompute ng
// price/stock/status/freshness sa MASTER product doc, batay sa FIFO:
// ang pinakamatandang batch na "Available" pa at may stock ang siyang
// "kasalukuyang" batch na makikita/mabibili ng buyer.
const recalculateProductAggregates = async (productId: string) => {
  const batches = await getBatchesByProduct(productId);
  const totalStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);

  const currentBatch = batches
    .filter((b) => b.stock > 0 && b.status === "Available")
    .sort((a, b) => a.batchNumber - b.batchNumber)[0];

  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    price: currentBatch ? currentBatch.price : 0,
    stock: totalStock,
    status: currentBatch ? "Available" : "Out of Stock",
    freshness: currentBatch ? getFreshnessLabel(currentBatch) : "",
  });
};

// ================= ADD HARVEST (main entry point ng farmer) =================
// 1. Hanapin o gawin ang master product (name+category, per farmer).
// 2. Tingnan kung may ACTIVE batch para sa kasalukuyang linggo:
//    a. Kung MERON -> gumawa lang ng bagong HarvestRecord, idagdag ang
//       quantity sa stock/totalHarvested ng batch na yun.
//    b. Kung WALA (naubusan na ng linggo, o unang beses) -> gumawa ng
//       BAGONG WeeklyBatch (batchNumber + 1), tapos ilagay ang unang
//       HarvestRecord dito.
// 3. I-recalculate ang display fields ng master product (FIFO-based).
export const addHarvest = async (
  input: CreateProductInput,
  quantity: number,
  price: number,
  harvestDate?: number
): Promise<{ product: ProductType; batch: BatchType; harvestRecord: HarvestRecordType; createdNewBatch: boolean }> => {
  try {
    const existing = await findExistingProduct(input.farmerId, input.name, input.category);

    let product: ProductType;
    if (existing) {
      product = existing;
    } else {
      // BAGO gumawa ng bagong product doc, tignan muna kung may
      // NAKA-ARCHIVE nang kaparehong pangalan+category - kung meron,
      // pigilan ito (dapat i-unarchive muna ng farmer ang luma, para
      // hindi magkaroon ng duplicate na "Egg" halimbawa - isa active,
      // isa archived).
      const archivedDuplicate = await findArchivedProduct(
        input.farmerId,
        input.name,
        input.category
      );
      if (archivedDuplicate) {
        throw new Error(
          `May naka-archive ka nang "${archivedDuplicate.name}". I-unarchive muna ito sa Archived tab bago ka makapag-dagdag ng bagong harvest.`
        );
      }

      const docRef = await addDoc(productCollection, input);
      product = { docId: docRef.id, ...input };
    }

    const effectiveHarvestDate = harvestDate ?? Date.now();
    const activeBatch = await getActiveBatchForHarvest(product.docId);

    let batch: BatchType;
    let createdNewBatch = false;

    if (activeBatch) {
      // May aktibong batch pa para ngayong linggo - dagdag na lang ng
      // harvest record, walang bagong batch.
      const batchRef = doc(db, "productBatches", activeBatch.docId);
      await updateDoc(batchRef, {
        stock: increment(quantity),
        totalHarvested: increment(quantity),
        price, // pwedeng i-update ang presyo kada bagong ani
      });

      const updatedSnap = await getDoc(batchRef);
      batch = { docId: activeBatch.docId, ...(updatedSnap.data() as CreateBatchInput) };
    } else {
      // Bagong linggo (o unang batch) - gumawa ng bagong WeeklyBatch.
      const latest = await getLatestBatch(product.docId);
      const weekStart = startOfDay(effectiveHarvestDate);
      const weekEnd = weekStart + WEEK_MS - 1;

      const newBatchInput: CreateBatchInput = {
        productId: product.docId,
        farmerId: input.farmerId,
        batchNumber: latest ? latest.batchNumber + 1 : 1,
        weekStart,
        weekEnd,
        price,
        stock: quantity,
        totalHarvested: quantity,
        status: "Available",
        freshness: "Harvested this week",
        createdAt: Date.now(),
        archived: false,
        archivedViaProduct: false,
      };

      const batchRef = await addDoc(batchCollection, newBatchInput);
      batch = { docId: batchRef.id, ...newBatchInput };
      createdNewBatch = true;
    }

    const harvestRecordInput: CreateHarvestRecordInput = {
      batchId: batch.docId,
      productId: product.docId,
      farmerId: input.farmerId,
      quantity,
      remainingQuantity: quantity,
      harvestDate: effectiveHarvestDate,
      createdAt: Date.now(),
    };
    const harvestRef = await addDoc(harvestCollection, harvestRecordInput);
    const harvestRecord: HarvestRecordType = { docId: harvestRef.id, ...harvestRecordInput };

    await recalculateProductAggregates(product.docId);

    return { product, batch, harvestRecord, createdNewBatch };
  } catch (error) {
    console.log("ADD HARVEST ERROR:", error);
    throw error;
  }
};

// ================= UPDATE MASTER PRODUCT INFO =================
// Shared info lang ito (name, category, unit, description, image) - dapat
// magkapareho ito sa lahat ng batch ng parehong produkto.
export const updateProductInfo = async (product: ProductType) => {
  try {
    if (!product.docId) return;
    const ref = doc(db, "products", product.docId);
    await updateDoc(ref, {
      name: product.name,
      category: product.category,
      unit: product.unit,
      description: product.description,
      image: product.image,
      imagePublicId: product.imagePublicId,
    });
  } catch (error) {
    console.log("UPDATE PRODUCT INFO ERROR:", error);
    throw error;
  }
};

// ================= UPDATE BATCH (price / status lang) =================
// Ang stock ay hindi na direktang ina-edit dito - laging galing ito sa
// harvest records (dagdag) o sa sales/FIFO (bawas), para consistent
// palagi ang totalHarvested/stock sa totoong datos.
export const updateBatch = async (
  batchDocId: string,
  updates: Partial<Pick<CreateBatchInput, "price" | "status">>
) => {
  try {
    const batchRef = doc(db, "productBatches", batchDocId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) throw new Error("Batch not found");

    await updateDoc(batchRef, updates);

    const batch = snap.data() as CreateBatchInput;
    await recalculateProductAggregates(batch.productId);
  } catch (error) {
    console.log("UPDATE BATCH ERROR:", error);
    throw error;
  }
};

// ================= ARCHIVE / UNARCHIVE BATCH (MANUAL, ISANG BATCH LANG) =================
// Ginagamit ito imbes na tunay na "delete" - "Archive" na lang ang isang
// batch, para hindi na ito isasali sa FIFO selling/stock aggregation,
// pero mananatili ang harvest records at history nito (para sa
// traceability ng mga naunang order/review).
//
// archivedViaProduct = false dito dahil SADYANG pinili ng farmer na
// i-archive ANG BATCH NA ITO MISMO (hindi resulta ng pag-archive sa
// buong product). Kaya kahit i-unarchive pa ng farmer ang buong
// product sa hinaharap, MANANATILING naka-archive ang batch na ito
// hangga't hindi ito hiwalay na in-unarchive.
export const archiveBatch = async (batchDocId: string) => {
  try {
    const batchRef = doc(db, "productBatches", batchDocId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) return;

    await updateDoc(batchRef, { archived: true, archivedViaProduct: false });

    const productId = (snap.data() as CreateBatchInput).productId;
    await recalculateProductAggregates(productId);
  } catch (error) {
    console.log("ARCHIVE BATCH ERROR:", error);
    throw error;
  }
};

export const unarchiveBatch = async (batchDocId: string) => {
  try {
    const batchRef = doc(db, "productBatches", batchDocId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) return;

    await updateDoc(batchRef, { archived: false, archivedViaProduct: false });

    const productId = (snap.data() as CreateBatchInput).productId;
    await recalculateProductAggregates(productId);
  } catch (error) {
    console.log("UNARCHIVE BATCH ERROR:", error);
    throw error;
  }
};

// ================= DELETE SINGLE HARVEST RECORD =================
// Kapag na-delete ang isang harvest record (ex. maling entry), ibawas
// lang ang NATITIRANG (remainingQuantity) bahagi nito sa stock ng batch -
// para hindi masira ang bilang kung may naibenta na mula rito.
export const deleteHarvestRecord = async (harvestDocId: string) => {
  try {
    const ref = doc(db, "harvestRecords", harvestDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const record = snap.data() as CreateHarvestRecordInput;

    await deleteDoc(ref);

    const batchRef = doc(db, "productBatches", record.batchId);
    await updateDoc(batchRef, {
      stock: increment(-record.remainingQuantity),
      totalHarvested: increment(-record.quantity),
    });

    const batchSnap = await getDoc(batchRef);
    if (batchSnap.exists()) {
      await recalculateProductAggregates((batchSnap.data() as CreateBatchInput).productId);
    }
  } catch (error) {
    console.log("DELETE HARVEST RECORD ERROR:", error);
    throw error;
  }
};

// ================= (INTERNAL/EMERGENCY ONLY) HARD DELETE BATCH =================
// Hindi na ito ginagamit ng UI - "archiveBatch" ang default flow ngayon.
// Nananatili lang ito kung sakaling kailangan ng totoong pagbura
// (ex. maintenance script), kasama ang lahat ng harvest records nito.
export const deleteBatch = async (batchDocId: string) => {
  try {
    const batchRef = doc(db, "productBatches", batchDocId);
    const snap = await getDoc(batchRef);
    const productId = snap.exists() ? (snap.data() as CreateBatchInput).productId : null;

    const records = await getHarvestRecordsByBatch(batchDocId);
    await Promise.all(records.map((r) => deleteDoc(doc(db, "harvestRecords", r.docId))));

    await deleteDoc(batchRef);

    if (productId) await recalculateProductAggregates(productId);
  } catch (error) {
    console.log("DELETE BATCH ERROR:", error);
    throw error;
  }
};

// ================= FIFO SALE (main entry point ng checkout/order flow) =================
// Ginagamit ito kapag may buyer na umorder ng "quantity" mula sa isang
// product. Awtomatikong:
//   1. Kinukuha ang mga batch na may stock, pinaka-MATANDA muna (FIFO
//      ACROSS batches - item 6 ng spec).
//   2. Sa loob ng bawat nagamit na batch, pinaka-MATANDANG harvest record
//      muna ang binabawasan (FIFO WITHIN batch - para sa traceability,
//      item 7 ng spec).
//   3. Ibinabalik ang listahan ng "contributions" (batchId, batchNumber,
//      harvestRecordId, quantity) - ITO ang dapat i-store ng
//      order/checkout mo bilang reference (item 8 ng spec). Kung sapat
//      ang isang batch/harvest record, iisa lang ang laman ng array;
//      kung kailangan kumuha mula sa dalawa o higit pang batch/harvest
//      (ex. naubos ang isa), makikita rin dito ang breakdown.
export const recordSale = async (
  productId: string,
  quantity: number
): Promise<{ contributions: SaleContribution[] }> => {
  try {
    const batches = (await getBatchesByProduct(productId))
      .filter((b) => b.stock > 0 && b.status === "Available")
      .sort((a, b) => a.batchNumber - b.batchNumber); // FIFO - pinakamatanda muna

    let remaining = quantity;
    const contributions: SaleContribution[] = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const takeFromBatch = Math.min(batch.stock, remaining);
      let takeLeftInBatch = takeFromBatch;

      const harvestRecords = (await getHarvestRecordsByBatch(batch.docId)).filter(
        (r) => r.remainingQuantity > 0
      );

      for (const record of harvestRecords) {
        if (takeLeftInBatch <= 0) break;

        const takeFromRecord = Math.min(record.remainingQuantity, takeLeftInBatch);

        await updateDoc(doc(db, "harvestRecords", record.docId), {
          remainingQuantity: increment(-takeFromRecord),
        });

        contributions.push({
          batchId: batch.docId,
          batchNumber: batch.batchNumber,
          harvestRecordId: record.docId,
          quantity: takeFromRecord,
        });

        takeLeftInBatch -= takeFromRecord;
      }

      // Kung walang harvest record na natagpuan (legacy data) pero may
      // stock pa rin ang batch, i-record pa rin ang contribution nang
      // walang harvestRecordId (optional na field naman ito).
      if (takeLeftInBatch > 0) {
        contributions.push({
          batchId: batch.docId,
          batchNumber: batch.batchNumber,
          harvestRecordId: null,
          quantity: takeLeftInBatch,
        });
      }

      const newBatchStock = batch.stock - takeFromBatch;
      await updateDoc(doc(db, "productBatches", batch.docId), {
        stock: increment(-takeFromBatch),
        status: newBatchStock <= 0 ? "Out of Stock" : batch.status,
      });

      remaining -= takeFromBatch;
    }

    const soldQuantity = quantity - remaining;
    if (soldQuantity > 0) {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        totalSales: increment(soldQuantity),
        weeklySales: increment(soldQuantity),
        monthlySales: increment(soldQuantity),
      });
    }

    await recalculateProductAggregates(productId);

    return { contributions };
  } catch (error) {
    console.log("RECORD SALE ERROR:", error);
    throw error;
  }
};

// ================= REVIEWS =================
export const addReview = async (review: CreateReviewInput) => {
  try {
    await addDoc(reviewCollection, review);

    const productRef = doc(db, "products", review.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const data = productSnap.data() as CreateProductInput;
      const newTotalReviews = (data.totalReviews || 0) + 1;
      const newRating =
        ((data.rating || 0) * (data.totalReviews || 0) + review.rating) / newTotalReviews;

      await updateDoc(productRef, {
        totalReviews: newTotalReviews,
        rating: newRating,
      });
    }
  } catch (error) {
    console.log("ADD REVIEW ERROR:", error);
    throw error;
  }
};

// Lahat ng review ng isang product (para sa "All Reviews")
export const getReviewsByProduct = async (productId: string): Promise<ReviewType[]> => {
  const q = query(reviewCollection, where("productId", "==", productId));
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map((d) => ({
    docId: d.id,
    ...(d.data() as CreateReviewInput),
  }));
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
};

// Reviews lang ng specific batch (para sa "Current Batch" vs
// "Previous Batch" grouping sa product page). batchId lang ang query
// (hindi na dinodoble sa productId) - sapat na ito para tumpak, at
// iniiwasan ang anumang panganib ng missing-composite-index.
export const getReviewsByBatch = async (
  productId: string,
  batchId: string
): Promise<ReviewType[]> => {
  const q = query(reviewCollection, where("batchId", "==", batchId));
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map((d) => ({
    docId: d.id,
    ...(d.data() as CreateReviewInput),
  }));
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
};

// ================= REALTIME PRODUCTS (homepage feed) =================
// Hindi kasama ang mga archived na product sa buyer-facing feed.
export const subscribeToProducts = (callback: (products: ProductType[]) => void) => {
  const q = query(productCollection, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs
        .map((d) => ({ docId: d.id, ...(d.data() as CreateProductInput) }))
        .filter((p) => !p.archived);
      callback(products);
    },
    (error) => console.log("REALTIME ERROR:", error)
  );
};

// ================= ARCHIVE / UNARCHIVE PRODUCT =================
// Ginagamit ito imbes na tunay na "delete" ng buong product listing.
// Na-a-archive ang master product AT lahat ng batch nito (kaya hindi na
// sila lalabas sa homepage/dropdown/FIFO), pero mananatili ang lahat ng
// datos (harvest records, reviews, order history).
//
// Ang mga batch na naka-archive na BAGO pa man mag-archive ng product
// (ibig sabihin, sadyang in-archive na ng farmer nang hiwalay) ay hindi
// na babaguhin - archivedViaProduct lang ang minamarkahan sa mga batch
// na SA PAGKAKATAONG ITO lang na-archive dahil sa buong product.
export const archiveProduct = async (productId: string) => {
  try {
    await updateDoc(doc(db, "products", productId), { archived: true });

    const batches = await getBatchesByProduct(productId, true);
    await Promise.all(
      batches
        .filter((b) => !b.archived) // huwag nang galawin ang dati nang archived
        .map((b) =>
          updateDoc(doc(db, "productBatches", b.docId), {
            archived: true,
            archivedViaProduct: true,
          })
        )
    );
  } catch (error) {
    console.log("ARCHIVE PRODUCT ERROR:", error);
    throw error;
  }
};

// Kapag in-unarchive ang PRODUCT, i-uunarchive lang ang mga batch na
// archivedViaProduct === true (ibig sabihin, cascade-archived kasama ng
// buong product). Ang mga batch na SADYANG in-archive ng farmer nang
// mag-isa (archivedViaProduct === false) ay MANANATILING naka-archive -
// dapat hiwalay silang i-unarchive kung gusto ng farmer na ibalik din.
export const unarchiveProduct = async (productId: string) => {
  try {
    await updateDoc(doc(db, "products", productId), { archived: false });

    const batches = await getBatchesByProduct(productId, true);
    await Promise.all(
      batches
        .filter((b) => b.archived && b.archivedViaProduct)
        .map((b) =>
          updateDoc(doc(db, "productBatches", b.docId), {
            archived: false,
            archivedViaProduct: false,
          })
        )
    );

    await recalculateProductAggregates(productId);
  } catch (error) {
    console.log("UNARCHIVE PRODUCT ERROR:", error);
    throw error;
  }
};

// ================= (INTERNAL/EMERGENCY ONLY) HARD DELETE PRODUCT =================
// Hindi na ito ginagamit ng UI - "archiveProduct" ang default flow ngayon.
export const deleteProduct = async (docId: string) => {
  try {
    await deleteDoc(doc(db, "products", docId));
    const batches = await getBatchesByProduct(docId, true);
    await Promise.all(batches.map((b) => deleteBatch(b.docId)));
  } catch (error) {
    console.log("DELETE ERROR:", error);
    throw error;
  }
};