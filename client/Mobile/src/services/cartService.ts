import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";

import { CartItem } from "../types/cart";

const cartCollection =
  collection(db, "cart");


export const addToCart = async (
  item: CartItem
) => {
  try {

    // ================= CHECK EXISTING =================
    const q = query(
      collection(db, "cart"),
      where("buyerId", "==", item.buyerId),
      where("productId", "==", item.productId)
    );

    const snap = await getDocs(q);

    // ================= IF EXISTS =================
    if (!snap.empty) {

      const existingDoc = snap.docs[0];

      const existingQty =
        existingDoc.data().quantity || 1;

      await updateDoc(
        doc(db, "cart", existingDoc.id),
        {
          quantity:
            existingQty + item.quantity,
        }
      );

      return;
    }

    // ================= CREATE NEW =================
    await addDoc(
      collection(db, "cart"),
      item
    );

  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getCartByBuyer =
  async (buyerId: string) => {

    try {

      const q = query(
        cartCollection,

        where(
          "buyerId",
          "==",
          buyerId
        )
      );

      const snapshot =
        await getDocs(q);

      const items: any[] = [];

      snapshot.forEach(docSnap => {

        items.push({
          docId: docSnap.id,
          ...docSnap.data(),
        });
      });

      return items;

    } catch (error) {

      console.log(
        "GET CART ERROR:",
        error
      );

      throw error;
    }
  };

export const updateCartQuantity =
  async (
    docId: string,
    quantity: number
  ) => {

    try {

      const ref =
        doc(
          db,
          "cart",
          docId
        );

      await updateDoc(ref, {
        quantity,
      });

    } catch (error) {

      console.log(
        "UPDATE CART ERROR:",
        error
      );

      throw error;
    }
  };

export const removeCartItem =
  async (docId: string) => {

    try {

      const ref =
        doc(
          db,
          "cart",
          docId
        );

      await deleteDoc(ref);

    } catch (error) {

      console.log(
        "REMOVE CART ERROR:",
        error
      );

      throw error;
    }
  };

  // ================= 🔥 NEW: DELETE BY PRODUCT ID =================
export const deleteCartItemsByProductId = async (productId: string) => {
  try {
    const q = query(
      cartCollection,
      where("productId", "==", productId)
    );

    const snapshot = await getDocs(q);

    const deletes = snapshot.docs.map((d) =>
      deleteDoc(doc(db, "cart", d.id))
    );

    await Promise.all(deletes);
  } catch (error) {
    console.log("DELETE CART BY PRODUCT ERROR:", error);
    throw error;
  }
};