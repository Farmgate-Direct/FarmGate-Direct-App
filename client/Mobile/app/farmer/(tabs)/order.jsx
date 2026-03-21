import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.8.23:5000"; 
const filters = ["All", "Pending", "Accepted", "Delivered", "Declined", "Cancelled"];

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || user.role !== "farmer") {
          return router.replace("/login");
        }

        const res = await fetch(`${API_URL}/orders/farmer/${user.userId}/orders`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders =
    activeFilter === "All" ? orders : orders.filter((o) => o.status === activeFilter);

  const getStatusColor = (status) => {   // <-- remove TS type
    switch (status) {
      case "Pending": return { text: "#D97706", border: "#FACC15" };
      case "Accepted": return { text: "#166534", border: "#15803D" };
      case "Delivered": return { text: "#1D4ED8", border: "#2563EB" };
      case "Declined": return { text: "#B91C1C", border: "#DC2626" };
      case "Cancelled": return { text: "#374151", border: "#6B7280" };
      default: return { text: "#374151", border: "#9CA3AF" };
    }
  };

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" color="#4B8B3B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#4B8B3B" }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ color: "white", fontSize: 25, fontWeight: "bold" }}>Orders</Text>
      </View>

      <View style={{
        flex: 1,
        backgroundColor: "white",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 20,
      }}>
    {/* Filter Tabs */}
        <View
         style={{
          flex: 0   ,
        }}
        >
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingBottom: 10 }}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  marginRight: 10,
                  backgroundColor: isActive ? "#4B8B3B" : "#E5E5E5",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "white" : "#333",
                    fontWeight: "500",
                    fontSize: 13,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        /></View>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          renderItem={({ item }) => {
            const statusColors = getStatusColor(item.status);
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/farmer/orders/[id]",
                    params: { order: JSON.stringify(item) },
                  })
                }
                style={{
                  backgroundColor: "#ECFDF5",
                  padding: 16,
                  borderRadius: 20,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#34D399",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}>
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                      {item.buyerId?.charAt(0) || "U"}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold", color: "#111827", fontSize: 16 }}>
                      {item.buyerName}
                    </Text>
                    <Text style={{ color: "#6B7280", fontSize: 14 }}>
                      {item.productName} x{item.quantity}
                    </Text>
                  </View>

                  <View style={{
                    width: 100,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: statusColors.border,
                    alignItems: "center",
                  }}>
                    <Text style={{
                      color: statusColors.text,
                      fontWeight: "600",
                      fontSize: 12,
                    }}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
};

export default Orders;