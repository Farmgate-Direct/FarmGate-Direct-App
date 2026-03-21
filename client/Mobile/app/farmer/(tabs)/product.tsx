import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AddProductModal from "../../farmer/products/add-product";
import EditProductModal from "../../farmer/products/edit-product";
import DeleteProductModal from "../../farmer/products/delete-product";

const API_URL = "http://10.150.47.135:5000";

interface ProductType {
  id: string;
  name: string;
  category?: string;
  price?: string;
  unit?: string;
  stock?: string;
  status?: string;
  freshness?: string;
  description?: string;
  image?: string;
  farmerId?: string;
  farmerName?: string;
  farmName?: string;
  rating?: string;
}

const Product = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("LOGGED USER:", parsedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.log("USER LOAD ERROR:", error);
    }
  };

  /* ================= FETCH PRODUCTS ================= */
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      let url = `${API_URL}/products?farmerId=${user.userId}`;

      const res = await fetch(url);
      const data = await res.json();

      setProducts(data);
    } catch (error) {
      console.log("FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddProduct = async (product: ProductType) => {

  const newProduct = {

    ...product,

    farmerId: user.userId,
    farmerName: user.fullName,
    farmName: user.farmName,

    rating: 0,
    createdAt: Date.now()

  };

  await fetch(`${API_URL}/products`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(newProduct)

  });

  fetchProducts();
};

  /* ================= EDIT PRODUCT ================= */
  const handleEditProduct = async (updatedProduct: ProductType) => {
    try {
      await fetch(`${API_URL}/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      fetchProducts();
      setShowEditModal(false);
    } catch (error) {
      console.log("EDIT ERROR:", error);
    }
  };

  /* ================= DELETE PRODUCT ================= */
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await fetch(`${API_URL}/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      fetchProducts();
      setShowDeleteModal(false);
    } catch (error) {
      console.log("DELETE ERROR:", error);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-green-800">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-800">
      {/* HEADER */}
      <View className="bg-green-800 px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-[25px] font-bold">
              Product Listing
            </Text>
            <Text className="text-white text-[15px]">
              {products.length} Products listed
            </Text>
          </View>

          {user?.role === "farmer" && (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={35} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PRODUCTS */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          {products.length === 0 && (
            <Text className="text-center text-gray-500 mt-10">
              No products available
            </Text>
          )}

          {products.map((product) => (
            <View
              key={product.id}
              className="bg-white rounded-2xl p-4 mb-4 flex-row items-center"
            >
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  className="w-20 h-20 rounded-xl"
                />
              ) : (
                <View className="w-20 h-20 bg-gray-200 rounded-xl" />
              )}

              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-400">
                  {product.farmName}
                </Text>
                <Text className="font-semibold text-gray-800">
                  {product.name}
                </Text>
                <Text className="text-gray-600">{product.stock}</Text>
                <Text className="text-gray-600">{product.status}</Text>
                <Text className="font-bold text-gray-800">
                  ₱{product.price}.00
                </Text>
              </View>

              {user?.role === "farmer" && (
                <View className="justify-between items-center h-20">
                  <TouchableOpacity
                    className="bg-blue-100 p-2 rounded-lg mb-2"
                    onPress={() => {
                      setSelectedProduct(product);
                      setShowEditModal(true);
                    }}
                  >
                    <MaterialIcons name="edit" size={18} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-red-100 p-2 rounded-lg"
                    onPress={() => {
                      setSelectedProduct(product);
                      setShowDeleteModal(true);
                    }}
                  >
                    <MaterialIcons name="delete" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />

      {selectedProduct && (
        <EditProductModal
          visible={showEditModal}
          product={selectedProduct}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditProduct}
        />
      )}

      {selectedProduct && (
        <DeleteProductModal
          visible={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProduct}
        />
      )}
    </View>
  );
};

export default Product;
