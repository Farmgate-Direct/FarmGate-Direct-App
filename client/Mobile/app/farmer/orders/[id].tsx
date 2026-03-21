// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

// const API_URL = "http://192.168.8.11:5000";

// export default function OrderDetails() {
//   const router = useRouter();
//   const { order: orderParam } = useLocalSearchParams();
//   const initialOrder = orderParam ? JSON.parse(orderParam) : null;

//   const [order, setOrder] = useState(initialOrder);
//   const [loading, setLoading] = useState(false);

//   // Fetch latest order from backend
//   useEffect(() => {
//     const fetchOrder = async () => {
//       if (!order) return;
//       try {
//         setLoading(true);
//         const res = await fetch(`${API_URL}/orders/farmer/orders/${order.id}`);
//         const data = await res.json();
//         setOrder(data);
//       } catch (err) {
//         console.error("Error fetching order:", err);
//         Alert.alert("Failed to fetch order");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrder();
//   }, []);

//   const handleStatusChange = async (newStatus) => {
//     try {
//       setLoading(true);
//       const res = await fetch(`${API_URL}/orders/farmer/orders/${order.id}/status`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: newStatus }),
//       });
//       const data = await res.json();
//       setOrder(data.order); // update local order state
//       Alert.alert(`Order ${newStatus}`);
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Failed to update order");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!order || loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#4B8B3B" />
//       </View>
//     );
//   }

//   const subtotal = order.price * order.quantity;
//   const total = subtotal + order.shipping;

//   const getStatusStyle = () => {
//     switch (order.status) {
//       case "Pending": return { bg: "#FEF3C7", text: "#B45309" };
//       case "Accepted": return { bg: "#DCFCE7", text: "#166534" };
//       case "Delivered": return { bg: "#DBEAFE", text: "#1E40AF" };
//       case "Declined": return { bg: "#FECACA", text: "#B91C1C" };
//       case "Cancelled": return { bg: "#E5E7EB", text: "#374151" };
//       default: return { bg: "#E5E7EB", text: "#374151" };
//     }
//   };

//   const statusStyle = getStatusStyle();

//   return (
//     <View style={{ flex: 1, backgroundColor: "#4B8B3B" }}>
//       {/* HEADER */}
//       <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 }}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="white" />
//         </TouchableOpacity>

//         <View style={{ flex: 1, marginLeft: 12 }}>
//           <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>{order.buyerName}</Text>
//           <Text style={{ color: "#D1FAE5", fontSize: 14 }}>Order #{order.id}</Text>
//         </View>

//         <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
//           <Text style={{ color: statusStyle.text, fontWeight: "600" }}>{order.status}</Text>
//         </View>
//       </View>

//       {/* BODY */}
//       <View style={{ flex: 1, backgroundColor: "white", borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 20 }}>
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* ADDRESS */}
//           <View style={{ backgroundColor: "#F3F4F6", borderRadius: 15, padding: 15, marginBottom: 15 }}>
//             <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
//               <Ionicons name="location-outline" size={18} color="#16a34a" />
//               <Text style={{ marginLeft: 5, fontWeight: "600", fontSize: 16 }}>Delivery Address</Text>
//             </View>
//             <Text style={{ fontSize: 14, color: "#4B5563" }}>{order.address}</Text>
//           </View>

//           {/* ORDER DETAILS */}
//           <View style={{ backgroundColor: "#F3F4F6", borderRadius: 15, padding: 15, marginBottom: 15 }}>
//             <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 10 }}>Order Details</Text>
//             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
//               <Text style={{ color: "#4B5563" }}>Product</Text>
//               <Text style={{ fontWeight: "600" }}>{order.productName}</Text>
//             </View>
//             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
//               <Text style={{ color: "#4B5563" }}>Quantity</Text>
//               <Text style={{ fontWeight: "600" }}>{order.quantity}</Text>
//             </View>
//             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
//               <Text style={{ color: "#4B5563" }}>Unit Price</Text>
//               <Text style={{ fontWeight: "600" }}>₱{order.price}</Text>
//             </View>
//             {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
//               <Text style={{ color: "#4B5563" }}>Shipping</Text>
//               <Text style={{ fontWeight: "600" }}>₱{order.shipping}</Text>
//             </View> */}
//             <View style={{ borderTopWidth: 1, borderTopColor: "#D1D5DB", marginTop: 10, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" }}>
//               <Text style={{ fontWeight: "bold" }}>Total</Text>
//               <Text style={{ fontWeight: "bold", color: "#15803D" }}>₱{order.price * order.quantity}</Text>
//             </View>
//           </View>
//         </ScrollView>

//         {/* ACTION BUTTONS */}
//         {order.status === "Pending" && (
//           <View style={{ flexDirection: "row", marginTop: 10 }}>
//             <TouchableOpacity
//               style={{ flex: 1, marginRight: 5, padding: 12, borderWidth: 1, borderColor: "#F87171", borderRadius: 10, alignItems: "center" }}
//               onPress={() => handleStatusChange("Declined")}
//             >
//               <Text style={{ color: "#F87171", fontWeight: "600" }}>Decline</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={{ flex: 1, marginLeft: 5, padding: 12, borderRadius: 10, backgroundColor: "#15803D", alignItems: "center" }}
//               onPress={() => handleStatusChange("Accepted")}
//             >
//               <Text style={{ color: "white", fontWeight: "600" }}>Accept</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// }

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

const API_URL = "http://192.168.8.23:5000";

export default function OrderDetails() {
  const router = useRouter();
  const { order: orderParam } = useLocalSearchParams();
  const initialOrder = orderParam ? JSON.parse(orderParam) : null;

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!order) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/orders/farmer/orders/${order.id}`);
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        Alert.alert("Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, []);

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/orders/farmer/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      setOrder(data.order); // update local order state
      Alert.alert(`Order ${newStatus}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (!order || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4B8B3B" />
      </View>
    );
  }

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  const getStatusStyle = () => {
    switch (order.status) {
      case "Pending": return { bg: "#FEF3C7", text: "#B45309" };
      case "Accepted": return { bg: "#DCFCE7", text: "#166534" };
      case "Delivered": return { bg: "#DBEAFE", text: "#1E40AF" };
      case "Declined": return { bg: "#FECACA", text: "#B91C1C" };
      case "Cancelled": return { bg: "#E5E7EB", text: "#374151" };
      default: return { bg: "#E5E7EB", text: "#374151" };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={{ flex: 1, backgroundColor: "#4B8B3B" }}>
      {/* HEADER */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>{order.buyerName}</Text>
          <Text style={{ color: "#D1FAE5", fontSize: 14 }}>Order #{order.id}</Text>
        </View>

        <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ color: statusStyle.text, fontWeight: "600" }}>{order.status}</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={{ flex: 1, backgroundColor: "white", borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 20 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ADDRESS */}
          <View style={{ backgroundColor: "#F3F4F6", borderRadius: 15, padding: 15, marginBottom: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Ionicons name="location-outline" size={18} color="#16a34a" />
              <Text style={{ marginLeft: 5, fontWeight: "600", fontSize: 16 }}>Delivery Address</Text>
            </View>
            <Text style={{ fontSize: 14, color: "#4B5563" }}>{order.delivery === "pickup" ? "Pickup at farm" : order.address}</Text>
          </View>

          {/* ORDER DETAILS */}
          <View style={{ backgroundColor: "#F3F4F6", borderRadius: 15, padding: 15, marginBottom: 15 }}>
            <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 10 }}>Order Details</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ color: "#4B5563" }}>Product</Text>
              <Text style={{ fontWeight: "600" }}>{order.productName}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ color: "#4B5563" }}>Quantity</Text>
              <Text style={{ fontWeight: "600" }}>{order.quantity}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ color: "#4B5563" }}>Unit Price</Text>
              <Text style={{ fontWeight: "600" }}>{formatCurrency(order.price)}</Text>
            </View>

            {/* TOTAL */}
            <View style={{ borderTopWidth: 1, borderTopColor: "#D1D5DB", marginTop: 10, paddingTop: 5, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "bold" }}>Total</Text>
              <Text style={{ fontWeight: "bold", color: "#15803D" }}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* ACTION BUTTONS */}
        {order.status === "Pending" && (
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, marginRight: 5, padding: 12, borderWidth: 1, borderColor: "#F87171", borderRadius: 10, alignItems: "center" }}
              onPress={() => handleStatusChange("Declined")}
            >
              <Text style={{ color: "#F87171", fontWeight: "600" }}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, marginLeft: 5, padding: 12, borderRadius: 10, backgroundColor: "#15803D", alignItems: "center" }}
              onPress={() => handleStatusChange("Accepted")}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}