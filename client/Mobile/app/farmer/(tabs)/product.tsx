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
import { deleteCartItemsByProductId } from "../../../src/services/cartService";

import { ProductType, CreateProductInput } from "../../../src/types/product";

import { deleteCloudinaryImage } from "../../../src/services/deleteImageService";

import {
  addProduct,
  deleteProduct,
  getProductsByFarmer,
  updateProduct,
} from "../../../src/services/productService";

import { uploadImageAsync } from "../../../src/services/cloudinaryService";

const Product = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ================= USER =================
  useEffect(() => {
    AsyncStorage.getItem("user").then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  // ================= FETCH =================
  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const data = await getProductsByFarmer(user.uid);
      setProducts(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= ADD =================
  const handleAddProduct = async (product: CreateProductInput) => {
    try {
      setUploading(true);

      const upload = await uploadImageAsync(product.image);

      const newProduct: CreateProductInput = {
        ...product,
        image: upload.imageUrl,
        imagePublicId: upload.publicId,
        farmerId: user.uid,
        farmerName: user.fullName,
        farmName: user.farmName,
        rating: 0,
        totalSales: 0,
        weeklySales: 0,
        monthlySales: 0,
        createdAt: Date.now(),
      };

      await addProduct(newProduct);
      fetchProducts();
      setShowAddModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  // ================= EDIT =================
  const handleEditProduct = async (product: ProductType) => {
    try {
      setEditing(true);

      let imageUrl = product.image;
      let imagePublicId = product.imagePublicId;

      if (!imageUrl.startsWith("https://")) {
        await deleteCloudinaryImage(product.imagePublicId);

        const upload = await uploadImageAsync(imageUrl);

        imageUrl = upload.imageUrl;
        imagePublicId = upload.publicId;
      }

      await updateProduct({
        ...product,
        image: imageUrl,
        imagePublicId,
      });

      fetchProducts();
      setShowEditModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setEditing(false);
    }
  };

  // ================= DELETE =================
  const handleDeleteProduct = async () => {
    if (!selectedProduct?.docId) return;

    try {
      setDeleting(true);

      if (selectedProduct.imagePublicId) {
        await deleteCloudinaryImage(selectedProduct.imagePublicId);
      }


      // 2. DELETE PRODUCT SA FIRESTORE
      await deleteProduct(selectedProduct.docId);

      // 3. DELETE ALL CART ITEMS RELATED TO PRODUCT
      await deleteCartItemsByProductId(selectedProduct.docId);


      fetchProducts();
      setShowDeleteModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setDeleting(false);
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-green-800">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-700">

      {/* HEADER (UNCHANGED UI) */}
      <View className="px-6 pt-16 pb-6">
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

      {/* LIST (UNCHANGED UI STRUCTURE) */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6">
        <ScrollView showsVerticalScrollIndicator={false}>

          {products.length === 0 && (
            <Text className="text-center text-gray-500 mt-10">
              No products available
            </Text>
          )}

          {products.map((product) => (
            <View
              key={product.docId}
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

                <Text className="text-gray-600">
                  {product.stock} {product.unit} In Stock
                </Text>

                <Text className="text-gray-600">
                  {product.status}
                </Text>

                <Text className="font-bold text-gray-800">
                  ₱{product.price.toFixed(2)}
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

      {/* MODALS (UNCHANGED) */}
      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
        loading={uploading}
      />

      {selectedProduct && (
        <EditProductModal
          visible={showEditModal}
          product={selectedProduct}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditProduct}
          loading={editing}
        />
      )}

      <DeleteProductModal
        visible={showDeleteModal}
        product={selectedProduct}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        loading={deleting}
      />

    </View>
  );
};

export default Product;