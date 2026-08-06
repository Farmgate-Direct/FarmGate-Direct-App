import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";

import { OrderType } from "../types/order";

export const createOrder = async (order: OrderType) => {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Firestore Timestamp (galing sa serverTimestamp()) -> millis, para
// ma-sort. Client-side muna ang pag-sort (hindi orderBy sa query) para
// hindi na kailangan pa ng bagong composite Firestore index.
const toMillis = (ts: any) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts === "number") return ts;
  return 0;
};

// ================= GET BUYER ORDERS =================
export const getBuyerOrders = async (buyerId: string) => {
  const q = query(collection(db, "orders"), where("buyerId", "==", buyerId));

  const snapshot = await getDocs(q);

  const orders = snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as OrderType)
  );

  return orders.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
};

// ================= FARMER ORDERS =================
export const getFarmerOrders = async (farmerId: string) => {
  const q = query(collection(db, "orders"), where("farmerId", "==", farmerId));

  const snapshot = await getDocs(q);

  const orders = snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as OrderType)
  );

  return orders.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
};

// ================= GET SINGLE ORDER =================
export const getOrderById = async (id: string) => {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Order not found");
  }

  return { id: snap.id, ...snap.data() } as OrderType;
};

// ================= MARK PRODUCT AS REVIEWED =================
// Ginagamit pagkatapos mag-submit ng review ang buyer - tinatanggal ang
// "Rate" button para dun sa specific na product line ng order (hindi sa
// buong order, dahil puwedeng maraming produkto ang isang order at bawat
// isa ay hiwalay na dapat i-rate).
export const markProductReviewed = async (orderId: string, productId: string) => {
  const ref = doc(db, "orders", orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
 
  const order = snap.data() as OrderType;
  const updatedProducts = order.products.map((p) =>
    p.productId === productId ? { ...p, reviewed: true } : p
  );
 
  await updateDoc(ref, { products: updatedProducts });
};

// ================= UPDATE STATUS =================
export const updateOrderStatus = async (id: string, status: string) => {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, { status });
};