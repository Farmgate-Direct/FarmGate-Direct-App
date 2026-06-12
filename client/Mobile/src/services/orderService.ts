import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";

import { OrderType } from "../types/order";

export const createOrder = async (
  order: OrderType
) => {
  try {
    const docRef = await addDoc(
      collection(db, "orders"),
      {
        ...order,
        createdAt: serverTimestamp(),
      }
    );

    return docRef.id;

  } catch (error) {
    console.log(error);
    throw error;
  }
};

// ================= GET BUYER ORDERS =================
export const getBuyerOrders =
  async (buyerId: string) => {

    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", buyerId),
      //orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      } as OrderType)
    );
  };


// ================= FARMER ORDERS =================
export const getFarmerOrders =
  async (farmerId: string) => {

    const q = query(
      collection(db, "orders"),
      where("farmerId", "==", farmerId),
      //orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      }as OrderType)
    );
  };

// ================= GET SINGLE ORDER =================
export const getOrderById =
  async (id: string) => {

    const ref = doc(
      db,
      "orders",
      id
    );

    const snap =
      await getDoc(ref);

    if (!snap.exists()) {
      throw new Error(
        "Order not found"
      );
    }

    return {
      id: snap.id,
      ...snap.data(),
    };
  };

// ================= UPDATE STATUS =================
export const updateOrderStatus =
  async (
    id: string,
    status: string
  ) => {

    const ref = doc(
      db,
      "orders",
      id
    );

    await updateDoc(ref, {
      status,
    });
  };