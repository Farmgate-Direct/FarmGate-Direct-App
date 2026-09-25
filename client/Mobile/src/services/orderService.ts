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

import { getAuth } from "firebase/auth";
import { db } from "../../FirebaseConfig";
import { getBatchesByProduct, recordSale } from "./productService";

import {
  OrderType,
  OrderProduct,
} from "../types/order";

// ================= ORDER NUMBER =================

const generateOrderNumber =
  () => {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    const hours =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );

    const seconds =
      String(
        now.getSeconds()
      ).padStart(
        2,
        "0"
      );

    const random =
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    return `FG-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  };

// ================= CREATE ORDER =================

export const createOrder =
  async (
    order: OrderType
  ) => {
    try {
      const orderNumber =
        order.orderNumber ||
        generateOrderNumber();

      const isCOD =
        order.payment === "cod";

      const commissionRate =
        0.03;

      const commissionAmount =
        isCOD
          ? Number(
              (
                Number(order.total) *
                commissionRate
              ).toFixed(2)
            )
          : 0;

      const commissionStatus =
        isCOD
          ? "pending"
          : "not_applicable";

      /*
       * New order lifecycle:
       *
       * pending
       *   -> farmer accepts
       * accepted
       *   -> GCash: buyer pays
       *   -> COD: stock is rechecked when processing starts
       * processing
       * to_receive
       * delivered
       *
       * No stock is deducted at checkout.
       */
      const docRef =
        await addDoc(
          collection(db, "orders"),
          {
            ...order,

            orderNumber,

            status: "pending",

            paymentStatus:
              order.paymentStatus ||
              "pending",

            inventoryFulfilled:
              false,

            fulfillmentStatus:
              "pending",

            commissionRate,

            commissionAmount,

            commissionStatus,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

      return {
        id: docRef.id,
        orderNumber,
      };
    } catch (error) {
      console.log(
        "ERROR CREATING ORDER:",
        error
      );

      throw error;
    }
  };

// ================= UPDATE ORDER PRODUCTS =================
// Kept for compatibility with other app code.
// GCash fulfillment itself is now handled by Render.

export const updateOrderProducts =
  async (
    orderId: string,
    buyerId: string,
    products: OrderProduct[]
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(
          ref
        );

      if (
        !snap.exists()
      ) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.buyerId !==
        buyerId
      ) {
        throw new Error(
          "You are not authorized to update this order."
        );
      }

      await updateDoc(
        ref,
        {
          products,

          updatedAt:
            serverTimestamp(),
        }
      );

      return true;
    } catch (error) {
      console.log(
        "ERROR UPDATING ORDER PRODUCTS:",
        error
      );

      throw error;
    }
  };

// ================= CREATE GCASH PAYMENT =================

export const createGcashPayment =
  async (
    orderId: string,
    buyerId: string
  ) => {
    try {
      const backendUrl = String(
        process.env.EXPO_PUBLIC_BACKEND_URL ||
          ""
      )
        .trim()
        .replace(/\/+$/, "");

      if (!backendUrl) {
        throw new Error(
          "EXPO_PUBLIC_BACKEND_URL is not configured."
        );
      }

      if (!orderId) {
        throw new Error(
          "Order ID is missing."
        );
      }

      if (!buyerId) {
        throw new Error(
          "Buyer ID is missing."
        );
      }

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      const orderRef = doc(
        db,
        "orders",
        orderId
      );

      const orderSnap = await getDoc(
        orderRef
      );

      if (!orderSnap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        orderSnap.data() as OrderType;

      if (order.buyerId !== buyerId) {
        throw new Error(
          "You are not authorized to pay for this order."
        );
      }

      if (order.payment !== "gcash") {
        throw new Error(
          "This order is not a GCash order."
        );
      }

      if (order.status !== "accepted") {
        throw new Error(
          "The farmer must accept the order before GCash payment."
        );
      }

      if (order.paymentStatus === "paid") {
        return {
          success: true,
          alreadyPaid: true,
          orderId,
          paymentStatus: "paid",
        };
      }

      const token = await user.getIdToken();

      const response = await fetch(
        `${backendUrl}/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
          }),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create GCash payment."
        );
      }

      if (
        !data?.alreadyPaid &&
        !data?.redirectUrl
      ) {
        throw new Error(
          "Xendit did not return a payment URL."
        );
      }

      return data;
    } catch (error) {
      console.log(
        "ERROR CREATING GCASH PAYMENT:",
        error
      );
      throw error;
    }
  };

// ================= GET ORDER PAYMENT STATUS =================

export const getOrderPaymentStatus =
  async (
    orderId: string,
    buyerId: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(
          ref
        );

      if (
        !snap.exists()
      ) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.buyerId !==
        buyerId
      ) {
        throw new Error(
          "You are not authorized to view this payment status."
        );
      }

      return (
        order.paymentStatus ||
        "pending"
      );
    } catch (error) {
      console.log(
        "ERROR GETTING PAYMENT STATUS:",
        error
      );

      throw error;
    }
  };

// ================= GET ORDER =================

export const getOrderById =
  async (
    id: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          id
        );

      const snap =
        await getDoc(
          ref
        );

      if (
        !snap.exists()
      ) {
        throw new Error(
          "Order not found."
        );
      }

      return {
        id:
          snap.id,

        ...snap.data(),
      } as OrderType;
    } catch (error) {
      console.log(
        "ERROR GETTING ORDER:",
        error
      );

      throw error;
    }
  };

// ================= TIMESTAMP =================

const toMillis =
  (
    ts: any
  ) => {
    if (!ts) {
      return 0;
    }

    if (
      typeof ts.toMillis ===
      "function"
    ) {
      return ts.toMillis();
    }

    if (
      typeof ts.seconds ===
      "number"
    ) {
      return (
        ts.seconds *
        1000
      );
    }

    if (
      typeof ts ===
      "number"
    ) {
      return ts;
    }

    if (
      typeof ts ===
      "string"
    ) {
      const parsed =
        new Date(
          ts
        ).getTime();

      return Number.isFinite(
        parsed
      )
        ? parsed
        : 0;
    }

    return 0;
  };

// ================= GET BUYER ORDERS =================

export const getBuyerOrders =
  async (
    buyerId: string
  ) => {
    try {
      const q =
        query(
          collection(
            db,
            "orders"
          ),
          where(
            "buyerId",
            "==",
            buyerId
          )
        );

      const snapshot =
        await getDocs(
          q
        );

      const orders =
        snapshot.docs.map(
          (d) =>
            ({
              id:
                d.id,

              ...d.data(),
            } as OrderType)
        );

      return orders.sort(
        (
          a,
          b
        ) =>
          toMillis(
            b.createdAt
          ) -
          toMillis(
            a.createdAt
          )
      );
    } catch (error) {
      console.log(
        "ERROR GETTING BUYER ORDERS:",
        error
      );

      throw error;
    }
  };

// ================= GET FARMER ORDERS =================

export const getFarmerOrders =
  async (
    farmerId: string
  ) => {
    try {
      const q =
        query(
          collection(
            db,
            "orders"
          ),
          where(
            "farmerId",
            "==",
            farmerId
          )
        );

      const snapshot =
        await getDocs(
          q
        );

      const orders =
        snapshot.docs.map(
          (d) =>
            ({
              id:
                d.id,

              ...d.data(),
            } as OrderType)
        );

      return orders.sort(
        (
          a,
          b
        ) =>
          toMillis(
            b.createdAt
          ) -
          toMillis(
            a.createdAt
          )
      );
    } catch (error) {
      console.log(
        "ERROR GETTING FARMER ORDERS:",
        error
      );

      throw error;
    }
  };

// ================= MARK PRODUCT REVIEWED =================

export const markProductReviewed =
  async (
    orderId: string,
    productId: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(
          ref
        );

      if (
        !snap.exists()
      ) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      const updatedProducts =
        (
          order.products ||
          []
        ).map(
          (product) =>
            product.productId ===
            productId
              ? {
                  ...product,

                  reviewed:
                    true,
                }
              : product
        );

      await updateDoc(
        ref,
        {
          products:
            updatedProducts,

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.log(
        "ERROR MARKING REVIEW:",
        error
      );

      throw error;
    }
  };

// ================= BUYER CANCEL =================

export const cancelOrder =
  async (
    orderId: string,
    buyerId: string,
    reason: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.buyerId !==
        buyerId
      ) {
        throw new Error(
          "You are not authorized to cancel this order."
        );
      }

      const canCancelStatus =
        order.status === "pending" ||
        order.status === "accepted";

      if (!canCancelStatus) {
        throw new Error(
          "This order can no longer be cancelled because it is already processing."
        );
      }

      /*
       * A paid GCash order needs a refund flow and cannot be
       * cancelled from the normal buyer cancellation action.
       */
      if (
        order.payment === "gcash" &&
        order.paymentStatus === "paid"
      ) {
        throw new Error(
          "This GCash order has already been paid and cannot be cancelled here."
        );
      }

      /*
       * Inventory must not already be fulfilled when cancelling.
       * New COD orders are fulfilled only when they move to processing,
       * so accepted COD orders are still safely cancellable.
       */
      if (order.inventoryFulfilled === true) {
        throw new Error(
          "This order can no longer be cancelled because inventory has already been fulfilled."
        );
      }

      await updateDoc(
        ref,
        {
          status: "cancelled",

          paymentStatus:
            order.payment === "gcash"
              ? "cancelled"
              : order.paymentStatus || "pending",

          cancelledBy: "buyer",

          cancelReason: reason,

          cancelledAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      return true;
    } catch (error) {
      console.log(
        "ERROR CANCELLING ORDER:",
        error
      );

      throw error;
    }
  };

// ================= STOCK VALIDATION =================

const getAvailableStock =
  async (
    productId: string
  ) => {
    if (!productId) {
      throw new Error(
        "Product ID is missing."
      );
    }

    const batches =
      await getBatchesByProduct(
        productId
      );

    return batches
      .filter(
        (batch: any) =>
          Number(batch.stock) > 0 &&
          batch.archived !== true &&
        batch.status === "Available"
      )
      .reduce(
        (
          total: number,
          batch: any
        ) =>
          total +
          Number(batch.stock || 0),
        0
      );
  };

const validateOrderStock =
  async (
    products: OrderProduct[]
  ) => {
    const requestedMap =
      new Map<
        string,
        {
          quantity: number;
          name: string;
          unit: string;
        }
      >();

    for (const product of products || []) {
      const productId =
        String(
          product.productId || ""
        ).trim();

      if (!productId) {
        throw new Error(
          `Product ID is missing for ${product.name || "an order item"}.`
        );
      }

      const current =
        requestedMap.get(
          productId
        );

      requestedMap.set(
        productId,
        {
          quantity:
            (current?.quantity || 0) +
            Number(product.quantity || 0),
          name:
            current?.name ||
            product.name ||
            "Product",
          unit:
            current?.unit ||
            product.unit ||
            "unit",
        }
      );
    }

    const checks =
      await Promise.all(
        Array.from(
          requestedMap.entries()
        ).map(
          async ([
            productId,
            requested,
          ]) => {
            const available =
              await getAvailableStock(
                productId
              );

            return {
              productId,
              ...requested,
              available,
            };
          }
        )
      );

    const shortages =
      checks.filter(
        (item) =>
          item.quantity >
          item.available
      );

    if (shortages.length > 0) {
      const details =
        shortages
          .map(
            (item) =>
              `${item.name}: requested ${item.quantity}, available ${item.available} ${String(item.unit).replace(/^per\s+/i, "")}`
          )
          .join("\n");

      throw new Error(
        `Insufficient stock.\n\n${details}`
      );
    }

    return checks;
  };

// ================= FARMER ACCEPT =================

export const acceptOrder =
  async (
    orderId: string,
    farmerId: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.farmerId !==
        farmerId
      ) {
        throw new Error(
          "You are not authorized to accept this order."
        );
      }

      if (
        order.status !==
        "pending"
      ) {
        throw new Error(
          "Only pending orders can be accepted."
        );
      }

      /*
       * COD: verify stock before acceptance.
       * GCash: acceptance is allowed even when current stock is low.
       * Stock is validated again before GCash payment is created, and
       * final fulfillment happens from the Xendit payment webhook.
       *
       * No stock is deducted at acceptance.
       */
      if (order.payment === "cod") {
        await validateOrderStock(
          order.products || []
        );
      }

      await updateDoc(
        ref,
        {
          status: "accepted",

          farmerDecision: "accepted",

          farmerDecisionAt:
            serverTimestamp(),

          paymentStatus:
            order.paymentStatus ||
            "pending",

          inventoryFulfilled:
            false,

          fulfillmentStatus:
            "pending",

          updatedAt:
            serverTimestamp(),
        }
      );

      return true;
    } catch (error) {
      console.log(
        "ERROR ACCEPTING ORDER:",
        error
      );

      throw error;
    }
  };

// ================= FARMER CANCEL ACCEPTED ORDER =================

export const cancelAcceptedOrderByFarmer =
  async (
    orderId: string,
    farmerId: string,
    reason: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.farmerId !==
        farmerId
      ) {
        throw new Error(
          "You are not authorized to cancel this order."
        );
      }

      if (
        order.status !==
        "accepted"
      ) {
        throw new Error(
          "Only accepted orders can be cancelled here."
        );
      }

      if (
        order.payment === "gcash" &&
        order.paymentStatus === "paid"
      ) {
        throw new Error(
          "This GCash order has already been paid and cannot be cancelled here because a refund is required."
        );
      }

      if (
        order.inventoryFulfilled === true
      ) {
        throw new Error(
          "This order can no longer be cancelled because inventory has already been fulfilled."
        );
      }

      await updateDoc(
        ref,
        {
          status: "cancelled",

          cancelledBy: "farmer",

          cancelReason: reason,

          cancelledAt:
            serverTimestamp(),

          paymentStatus:
            order.payment === "gcash"
              ? "cancelled"
              : order.paymentStatus || "pending",

          inventoryFulfilled:
            false,

          fulfillmentStatus:
            "pending",

          updatedAt:
            serverTimestamp(),
        }
      );

      return true;
    } catch (error) {
      console.log(
        "ERROR CANCELLING ACCEPTED ORDER BY FARMER:",
        error
      );

      throw error;
    }
  };

// ================= FARMER DECLINE =================

export const declineOrder =
  async (
    orderId: string,
    farmerId: string,
    reason: string
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.farmerId !==
        farmerId
      ) {
        throw new Error(
          "You are not authorized to decline this order."
        );
      }

      if (
        order.status !==
        "pending"
      ) {
        throw new Error(
          "Only pending orders can be declined."
        );
      }

      await updateDoc(
        ref,
        {
          status:
            "cancelled",

          farmerDecision:
            "rejected",

          farmerDecisionAt:
            serverTimestamp(),

          cancelledBy:
            "farmer",

          cancelReason:
            reason,

          rejectionReason:
            reason,

          cancelledAt:
            serverTimestamp(),

          paymentStatus:
            order.payment ===
            "gcash"
              ? "cancelled"
              : order.paymentStatus ||
                "pending",

          inventoryFulfilled:
            false,

          fulfillmentStatus:
            "pending",

          updatedAt:
            serverTimestamp(),
        }
      );

      return true;
    } catch (error) {
      console.log(
        "ERROR DECLINING ORDER:",
        error
      );

      throw error;
    }
  };

// ================= UPDATE ORDER STATUS =================

export const updateOrderStatus =
  async (
    orderId: string,
    farmerId: string,
    status:
      | "accepted"
      | "processing"
      | "to_receive"
      | "delivered"
  ) => {
    try {
      const ref =
        doc(
          db,
          "orders",
          orderId
        );

      const snap =
        await getDoc(ref);

      if (!snap.exists()) {
        throw new Error(
          "Order not found."
        );
      }

      const order =
        snap.data() as OrderType;

      if (
        order.farmerId !==
        farmerId
      ) {
        throw new Error(
          "You are not authorized to update this order."
        );
      }

      if (
        status ===
        "accepted"
      ) {
        return await acceptOrder(
          orderId,
          farmerId
        );
      }

      // ================= PROCESSING =================
      if (
        status ===
        "processing"
      ) {
        if (
          order.status !==
          "accepted"
        ) {
          throw new Error(
            "Only accepted orders can be processed."
          );
        }

        /*
         * GCash:
         * payment.capture must already have fulfilled inventory.
         */
        if (
          order.payment ===
          "gcash"
        ) {
          if (
            order.paymentStatus !==
            "paid"
          ) {
            throw new Error(
              "This GCash order has not been paid yet."
            );
          }

          if (
            order.inventoryFulfilled !==
            true
          ) {
            throw new Error(
              "This GCash order has not been fulfilled from inventory yet."
            );
          }
        }

        /*
         * COD:
         * Stock is checked again immediately before processing and
         * deducted only when the farmer starts processing the order.
         */
        if (
          order.payment ===
          "cod"
        ) {
          if (
            order.inventoryFulfilled !==
            true
          ) {
            await validateOrderStock(
              order.products || []
            );

            const fulfilledProducts:
              OrderProduct[] = [
                ...(order.products || []),
              ];

            for (
              let index = 0;
              index <
                fulfilledProducts.length;
              index++
            ) {
              const product =
                fulfilledProducts[index];

              /*
               * A contribution trace means this product was already
               * deducted in an earlier attempt. Skip it so retrying
               * processing cannot deduct the same product twice.
               */
              if (
                Array.isArray(
                  product.contributions
                ) &&
                product.contributions.length >
                  0
              ) {
                continue;
              }

              const {
                contributions,
              } = await recordSale(
                product.productId,
                Number(
                  product.quantity
                )
              );

              const primary =
                contributions[0] ||
                null;

              fulfilledProducts[index] = {
                ...product,
                batchId:
                  primary?.batchId ??
                  null,
                batchNumber:
                  primary?.batchNumber ??
                  null,
                harvestRecordId:
                  primary?.harvestRecordId ??
                  null,
                contributions,
              };

              // Persist each successful product immediately so a later
              // failure can be retried without deducting this product again.
              await updateDoc(
                ref,
                {
                  products:
                    fulfilledProducts,

                  updatedAt:
                    serverTimestamp(),
                }
              );
            }

            await updateDoc(
              ref,
              {
                products:
                  fulfilledProducts,

                inventoryFulfilled:
                  true,

                fulfillmentStatus:
                  "fulfilled",

                inventoryFulfilledAt:
                  serverTimestamp(),
              }
            );
          }
        }

        await updateDoc(
          ref,
          {
            status:
              "processing",

            processingAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        return true;
      }

      // ================= TO RECEIVE =================
      if (
        status ===
        "to_receive"
      ) {
        if (
          order.status !==
          "processing"
        ) {
          throw new Error(
            "Only processing orders can be marked as To Receive."
          );
        }

        await updateDoc(
          ref,
          {
            status:
              "to_receive",

            toReceiveAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        return true;
      }

      // ================= DELIVERED =================
      if (
        status ===
        "delivered"
      ) {
        if (
          order.status !==
          "to_receive"
        ) {
          throw new Error(
            "Only To Receive orders can be marked as delivered."
          );
        }

        await updateDoc(
          ref,
          {
            status:
              "delivered",

            deliveredAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        return true;
      }

      throw new Error(
        "Invalid order status."
      );
    } catch (error) {
      console.log(
        "ERROR UPDATING ORDER STATUS:",
        error
      );

      throw error;
    }
  };
