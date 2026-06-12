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
} from "firebase/firestore";

import { db } from "../../FirebaseConfig";
import { CreateProductInput, ProductType } from "../types/product";

const productCollection = collection(db, "products");

// ================= ADD PRODUCT =================
export const addProduct = async (product: CreateProductInput) => {
  try {
    const docRef = await addDoc(productCollection, product);

    return {
      docId: docRef.id,
      ...product,
    };
  } catch (error) {
    console.log("ADD PRODUCT ERROR:", error);
    throw error;
  }
};

// ================= GET BY FARMER =================
export const getProductsByFarmer = async (
  farmerId: string
): Promise<ProductType[]> => {
  try {
    const q = query(
      productCollection,
      where("farmerId", "==", farmerId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docItem) => {
      const data = docItem.data() as CreateProductInput;

      return {
        docId: docItem.id,
        ...(data as CreateProductInput),
      };
    });
  } catch (error) {
    console.log("GET PRODUCTS ERROR:", error);
    return [];
  }
};

// ================= GET BY ID =================
export const getProductById = async (
  id: string
): Promise<ProductType | null> => {
  try {
    const snap = await getDoc(doc(db, "products", id));

    if (!snap.exists()) return null;

    return {
      docId: snap.id,
      ...(snap.data() as CreateProductInput),
    };
  } catch (error) {
    console.log("GET PRODUCT ERROR:", error);
    return null;
  }
};

// ================= REALTIME =================
export const subscribeToProducts = (
  callback: (products: ProductType[]) => void
) => {
  const q = query(productCollection, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((docItem) => ({
        docId: docItem.id,
        ...(docItem.data() as CreateProductInput),
      }));

      callback(products);
    },
    (error) => {
      console.log("REALTIME ERROR:", error);
    }
  );
};

// ================= UPDATE =================
export const updateProduct = async (product: ProductType) => {
  try {
    if (!product.docId) return;

    const ref = doc(db, "products", product.docId);

    await updateDoc(ref, {
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      freshness: product.freshness,
      unit: product.unit,
      status: product.status,
      description: product.description,
      image: product.image,
      imagePublicId: product.imagePublicId,
    });
  } catch (error) {
    console.log("UPDATE ERROR:", error);
    throw error;
  }
};

// ================= DELETE =================
export const deleteProduct = async (docId: string) => {
  try {
    await deleteDoc(doc(db, "products", docId));
  } catch (error) {
    console.log("DELETE ERROR:", error);
    throw error;
  }
};

export const addProductSales = async (
  productId: string,
  quantity: number
) => {
  try {
    console.log(
      "Updating Product:",
      productId
    );

    if (!productId) {
      console.log(
        "ERROR: Product ID is missing"
      );
      return;
    }

    const productRef = doc(
      db,
      "products",
      productId
    );

    const snapshot =
      await getDoc(productRef);

    if (!snapshot.exists()) {
      console.log(
        "ERROR: Product document not found:",
        productId
      );
      return;
    }

    console.log(
      "Before Update:",
      snapshot.data()
    );

    await updateDoc(productRef, {
      totalSales: increment(quantity),
      weeklySales: increment(quantity),
      monthlySales: increment(quantity),
    });

    const updatedSnapshot =
      await getDoc(productRef);

    console.log(
      "After Update:",
      updatedSnapshot.data()
    );

    console.log(
      "SUCCESS: Sales updated"
    );
  } catch (error) {
    console.log(
      "ADD SALES ERROR:",
      error
    );
  }
};