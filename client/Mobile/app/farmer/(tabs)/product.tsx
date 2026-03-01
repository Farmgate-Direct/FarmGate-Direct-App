import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

// Import the modals
import AddProductModal from "../../farmer/products/add-product";
import EditProductModal from "../../farmer/products/edit-product";
import DeleteProductModal from "../../farmer/products/delete-product";

interface ProductType {
  id: number;
  name: string;
  category?: string;
  price?: string;
  unit?: string;
  stock?: string;
  status?: string;
  description?: string;
}

const Product = () => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  const [products, setProducts] = useState<ProductType[]>([
    { id: 1, name: "Organic Fresh Tomatoes", price: "₱60.00", stock: "20 kg In Stock" },
    { id: 2, name: "Organic Fresh Eggplant", price: "₱70.00", stock: "20 kg In Stock" },
    { id: 3, name: "Organic Fresh Okra", price: "₱70.00", stock: "20 kg In Stock" },
  ]);

  // Add new product
  const handleAddProduct = (product: ProductType) => {
    setProducts([...products, { ...product, id: Date.now() }]);
  };

  // Edit existing product
  const handleEditProduct = (updatedProduct: ProductType) => {
    setProducts(products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  // Delete product
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setSelectedProduct(null);
      setShowDeleteModal(false);
    }
  };

  const filters = ["All", "Fruits", "Egg & Poultry", "Vegetables", "Rice"];

  return (
    <View className="flex-1 bg-green-800">
      {/* Header */}
      <View className="bg-green-800 px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-[25px] font-bold">Product Listing</Text>
            <Text className="text-white text-[15px]">{products.length} Products listed</Text>
          </View>

          {/* Add Product Button */}
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={35} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* White container */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {filters.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveFilter(item)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  activeFilter === item ? "bg-green-700" : "bg-gray-200"
                }`}
              >
                <Text className={`text-xs ${activeFilter === item ? "text-white" : "text-gray-600"}`}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Bar */}
          <View className="bg-white rounded-full px-4 py-3 flex-row items-center mb-4 border border-green-700">
            <TextInput placeholder="Search produce..." className="flex-1 text-gray-700" />
            <Ionicons name="search" size={18} color="#15803d" />
          </View>

          {/* Product Cards */}
          {products.map(product => (
            <View key={product.id} className="bg-white rounded-2xl p-4 mb-4 flex-row items-center">
              <Image className="w-20 h-20 rounded-xl" resizeMode="cover" />

              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-400">{product.category || "VEGETABLES"}</Text>
                <Text className="font-semibold text-gray-800 mt-1">{product.name}</Text>
                <Text className="font-bold text-gray-800 mt-1">{product.price}</Text>
                <View className="bg-green-100 self-start px-2 py-1 rounded-full mt-1">
                  <Text className="text-green-700 text-xs">{product.stock}</Text>
                </View>
              </View>

              {/* Action Buttons */}
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
            </View>
          ))}

          <View className="h-24" />
        </ScrollView>
      </View>

      {/* Modals */}
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