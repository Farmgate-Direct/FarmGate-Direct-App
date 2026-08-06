import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import EditBatchModal from "../../farmer/products/edit-batch";
import DeleteProductModal from "../../farmer/products/delete-product";
import RecordSaleModal from "../../farmer/products/record-sale";
import { deleteCartItemsByProductId } from "../../../src/services/cartService";

import {
  ProductType,
  CreateProductInput,
  BatchType,
  HarvestRecordType,
} from "../../../src/types/product";

import { deleteCloudinaryImage } from "../../../src/services/deleteImageService";

import {
  addHarvest,
  archiveProduct,
  unarchiveProduct,
  archiveBatch,
  unarchiveBatch,
  deleteHarvestRecord,
  getFarmerProducts,
  getArchivedProducts,
  getBatchesByProduct,
  getHarvestRecordsByBatch,
  updateProductInfo,
  updateBatch,
  recordSale,
} from "../../../src/services/productService";

import { uploadImageAsync } from "../../../src/services/cloudinaryService";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

type ViewMode = "active" | "archived";

const Product = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const [products, setProducts] = useState<ProductType[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<ProductType[]>([]);
  // Kasama na ang archived batches dito (includeArchived=true) - hinihiwalay
  // lang sa UI level, para makita ng farmer at ma-unarchive kung kailangan.
  const [batchesByProduct, setBatchesByProduct] = useState<Record<string, BatchType[]>>({});
  const [harvestsByBatch, setHarvestsByBatch] = useState<Record<string, HarvestRecordType[]>>({});
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchType | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);
  const [recordingSale, setRecordingSale] = useState(false);

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
      const [active, archived] = await Promise.all([
        getFarmerProducts(user.uid),
        getArchivedProducts(user.uid),
      ]);
      setProducts(active);
      setArchivedProducts(archived);

      // includeArchived = true, para makita rin ang archived batches ng
      // isang active product (hinihiwalay na lang sa render level).
      const allProducts = [...active, ...archived];
      const batchEntries = await Promise.all(
        allProducts.map(
          async (p) => [p.docId, await getBatchesByProduct(p.docId, true)] as const
        )
      );
      setBatchesByProduct(Object.fromEntries(batchEntries));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Palaging kinukuha ang pinakabagong datos mula sa Firestore - walang
  // "skip kung may laman na" na check, dahil dati ay nagiging stale ang
  // cache pagkatapos mag-add ng bagong harvest record sa parehong batch.
  const loadHarvestsForBatch = async (batchId: string) => {
    const records = await getHarvestRecordsByBatch(batchId);
    setHarvestsByBatch((prev) => ({ ...prev, [batchId]: records }));
  };

  // ================= HELPERS =================
  const getActiveBatches = (docId: string) =>
    (batchesByProduct[docId] || []).filter((b) => !b.archived);

  const getArchivedBatches = (docId: string) =>
    (batchesByProduct[docId] || []).filter((b) => b.archived);

  const getTotalStock = (docId: string) =>
    getActiveBatches(docId).reduce((sum, b) => sum + (b.stock || 0), 0);

  // Ang "current" batch ay ang pinakamatandang batch na may stock at
  // "Available" pa - ito ang FIFO batch na aktwal na ibinebenta sa buyer.
  const getCurrentSellingBatch = (docId: string) => {
    const batches = getActiveBatches(docId);
    return (
      batches
        .filter((b) => b.stock > 0 && b.status === "Available")
        .sort((a, b) => a.batchNumber - b.batchNumber)[0] || null
    );
  };

  const isThisWeek = (batch: BatchType) => Date.now() <= batch.weekEnd;

  // ================= ADD HARVEST =================
  const handleAddProduct = async (
    product: CreateProductInput,
    quantity: number,
    price: number
  ) => {
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
      };

      const { batch } = await addHarvest(newProduct, quantity, price);
      await fetchProducts();
      // I-refresh agad ang harvest list ng na-apektuhang batch, kung
      // sakaling bukas na ito (para hindi na kailangan pang mag-collapse
      // at mag-expand ulit para makita ang bagong harvest record).
      await loadHarvestsForBatch(batch.docId);
      setShowAddModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  // ================= EDIT PRODUCT INFO =================
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

      await updateProductInfo({ ...product, image: imageUrl, imagePublicId });

      await fetchProducts();
      setShowEditModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setEditing(false);
    }
  };

  // ================= EDIT BATCH (price / status lang) =================
  const handleSaveBatch = async (
    batchDocId: string,
    updates: { price: number; status: string }
  ) => {
    setSavingBatch(true);
    try {
      await updateBatch(batchDocId, updates);
      await fetchProducts();
      setShowEditBatchModal(false);
    } finally {
      setSavingBatch(false);
    }
  };

  // ================= RECORD WALK-IN SALE (offline, hindi galing sa app) =================
  // Ginagamit ang parehong FIFO logic (recordSale) na ginagamit ng online
  // checkout - kaya tumpak pa rin ang pagbawas ng stock kahit off-app ang
  // benta. Hindi na kailangang pumili ng batch ang farmer; awtomatiko
  // itong kukuha mula sa pinakamatandang available na batch.
  const handleRecordSale = async (quantity: number) => {
    if (!selectedProduct?.docId) return;
    setRecordingSale(true);
    try {
      await recordSale(selectedProduct.docId, quantity);
      await fetchProducts();
      setShowRecordSaleModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setRecordingSale(false);
    }
  };

  // ================= ARCHIVE PRODUCT (hindi tunay na delete) =================
  const handleDeleteProduct = async () => {
    if (!selectedProduct?.docId) return;

    try {
      setDeleting(true);

      await archiveProduct(selectedProduct.docId);
      await deleteCartItemsByProductId(selectedProduct.docId);

      await fetchProducts();
      setShowDeleteModal(false);
    } catch (err) {
      console.log(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUnarchiveProduct = (product: ProductType) => {
    Alert.alert(
      "Unarchive Product",
      `Ibalik sa listing si "${product.name}"? Makikita na itong muli ng mga buyer.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unarchive",
          onPress: async () => {
            try {
              await unarchiveProduct(product.docId);
              await fetchProducts();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  // ================= ARCHIVE SINGLE BATCH (may confirmation na) =================
  // Dati, direktang na-a-archive ang batch pagkatapos ng isang pindot,
  // walang babala. Ngayon, may Alert confirmation muna bago tuluyang
  // mag-archive.
  const handleArchiveBatchPress = (batch: BatchType) => {
    Alert.alert(
      "Archive Batch",
      `I-a-archive ang Batch ${String(batch.batchNumber).padStart(3, "0")}? Hindi na ito ibebenta o makikita ng buyer, pero puwede mo pa itong ma-unarchive.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveBatch(batch.docId);
              await fetchProducts();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  const handleUnarchiveBatch = (batch: BatchType) => {
    Alert.alert(
      "Unarchive Batch",
      `Ibalik sa aktibong benta si Batch ${String(batch.batchNumber).padStart(3, "0")}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unarchive",
          onPress: async () => {
            try {
              await unarchiveBatch(batch.docId);
              await fetchProducts();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  // ================= DELETE SINGLE HARVEST RECORD =================
  // Data-entry correction lang ito (ex. maling quantity/date), kaya
  // tunay itong bina-delete - hindi kasama sa "archive" policy na para
  // sa Product/Batch bilang business entities. May confirmation pa rin.
  const handleDeleteHarvest = (batchId: string, harvest: HarvestRecordType) => {
    Alert.alert(
      "Delete Harvest Record",
      `Tanggalin ang harvest record na ito (${formatDate(harvest.harvestDate)}, ${harvest.quantity})? Hindi na ito mababawi.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHarvestRecord(harvest.docId);
              await loadHarvestsForBatch(batchId);
              await fetchProducts();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  const toggleBatchHarvests = (batchId: string) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      return;
    }
    setExpandedBatchId(batchId);
    // Laging kinukuha ang pinakabagong listahan sa bawat pagbukas, hindi
    // na "kung wala pang laman" lang ang condition - dati ito ang
    // sanhi kung bakit hindi lumalabas ang bagong idinagdag na harvest.
    loadHarvestsForBatch(batchId);
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-green-800">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  const displayedProducts = viewMode === "active" ? products : archivedProducts;

  return (
    <View className="flex-1 bg-green-700">
      {/* HEADER */}
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-[25px] font-bold">Product Listing</Text>
            <Text className="text-white text-[15px]">
              {displayedProducts.length} {viewMode === "active" ? "Products listed" : "Archived"}
            </Text>
          </View>

          {user?.role === "farmer" && viewMode === "active" && (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Ionicons name="add-circle" size={35} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* ACTIVE / ARCHIVED TABS */}
        {user?.role === "farmer" && (
          <View className="flex-row bg-white/15 rounded-2xl p-1 mt-4 self-start">
            {(["active", "archived"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                className={`px-5 py-2 rounded-xl ${viewMode === mode ? "bg-white" : ""}`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${
                    viewMode === mode ? "text-green-800" : "text-white"
                  }`}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* LIST */}
      <View className="flex-1 bg-gray-100 rounded-t-[35px] px-6 pt-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          {displayedProducts.length === 0 && (
            <Text className="text-center text-gray-500 mt-10">
              {viewMode === "active" ? "No products available" : "No archived products"}
            </Text>
          )}

          {displayedProducts.map((product) => {
            const activeBatches = getActiveBatches(product.docId);
            const archivedBatches = getArchivedBatches(product.docId);
            const currentBatch = getCurrentSellingBatch(product.docId);
            const totalStock = getTotalStock(product.docId);
            const isExpanded = expandedProductId === product.docId;

            return (
              <View
                key={product.docId}
                className={`bg-white rounded-2xl p-4 mb-4 ${
                  viewMode === "archived" ? "opacity-70" : ""
                }`}
              >
                <View className="flex-row items-center">
                  {product.image ? (
                    <Image
                      source={{ uri: product.image }}
                      className="w-20 h-20 rounded-xl"
                    />
                  ) : (
                    <View className="w-20 h-20 bg-gray-200 rounded-xl" />
                  )}

                  <View className="flex-1 ml-4">
                    <Text className="text-xs text-gray-400">{product.farmName}</Text>
                    <Text className="font-semibold text-gray-800">{product.name}</Text>
                    <Text className="text-gray-600">
                      {totalStock} {product.unit} total ({activeBatches.length}{" "}
                      {activeBatches.length === 1 ? "batch" : "batches"})
                    </Text>
                    {currentBatch && (
                      <Text className="font-bold text-gray-800">
                        ₱{currentBatch.price.toFixed(2)}
                      </Text>
                    )}
                    {product.totalReviews > 0 && (
                      <Text className="text-xs text-yellow-600">
                        ★ {product.rating.toFixed(1)} ({product.totalReviews} reviews)
                      </Text>
                    )}
                  </View>

                  {user?.role === "farmer" && viewMode === "active" && (
                    <View className="items-center gap-2">
                      <TouchableOpacity
                        className="bg-purple-100 p-2 rounded-lg"
                        onPress={() => {
                          setSelectedProduct(product);
                          setShowRecordSaleModal(true);
                        }}
                      >
                        <Ionicons name="storefront-outline" size={18} color="#7e22ce" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-blue-100 p-2 rounded-lg"
                        onPress={() => {
                          setSelectedProduct(product);
                          setShowEditModal(true);
                        }}
                      >
                        <MaterialIcons name="edit" size={18} color="#2563eb" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="bg-orange-100 p-2 rounded-lg"
                        onPress={() => {
                          setSelectedProduct(product);
                          setShowDeleteModal(true);
                        }}
                      >
                        <MaterialIcons name="archive" size={18} color="#c2410c" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {user?.role === "farmer" && viewMode === "archived" && (
                    <TouchableOpacity
                      className="bg-green-100 px-3 py-2 rounded-lg"
                      onPress={() => handleUnarchiveProduct(product)}
                    >
                      <Text className="text-green-700 text-xs font-semibold">Unarchive</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* BATCHES TOGGLE */}
                <TouchableOpacity
                  onPress={() => setExpandedProductId(isExpanded ? null : product.docId)}
                  className="flex-row items-center justify-center mt-3 py-2 border-t border-gray-100"
                >
                  <Text className="text-green-700 text-xs font-semibold mr-1">
                    {isExpanded ? "Hide weekly batches" : "View weekly batches"}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#15803d"
                  />
                </TouchableOpacity>

                {/* BATCH LIST */}
                {isExpanded && (
                  <View className="mt-2">
                    {activeBatches.length === 0 && archivedBatches.length === 0 && (
                      <Text className="text-gray-400 text-xs text-center py-2">
                        No batches yet
                      </Text>
                    )}

                    {activeBatches.map((batch) => {
                      const thisWeek = isThisWeek(batch);
                      const isCurrent = currentBatch?.docId === batch.docId;
                      const harvests = harvestsByBatch[batch.docId] || [];
                      const harvestsExpanded = expandedBatchId === batch.docId;

                      return (
                        <View key={batch.docId} className="bg-gray-50 rounded-xl p-3 mb-2">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <View className="flex-row items-center flex-wrap">
                                <Text className="font-semibold text-gray-700 text-xs">
                                  Batch {String(batch.batchNumber).padStart(3, "0")}
                                </Text>
                                {isCurrent && (
                                  <View className="bg-green-100 rounded-full px-2 py-0.5 ml-2">
                                    <Text className="text-green-700 text-[10px]">
                                      selling now
                                    </Text>
                                  </View>
                                )}
                                {thisWeek && (
                                  <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                                    <Text className="text-blue-700 text-[10px]">
                                      this week
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-gray-600 text-xs mt-0.5">
                                {formatDate(batch.weekStart)} – {formatDate(batch.weekEnd)}
                              </Text>
                              <Text className="text-gray-600 text-xs">
                                {batch.stock} {product.unit} left · ₱{batch.price.toFixed(2)} ·{" "}
                                {batch.status}
                              </Text>
                              <Text className="text-gray-400 text-[10px]">
                                Total harvested: {batch.totalHarvested} {product.unit}
                              </Text>
                            </View>

                            {user?.role === "farmer" && (
                              <View className="flex-row">
                                <TouchableOpacity
                                  className="bg-blue-100 p-2 rounded-lg mr-2"
                                  onPress={() => {
                                    setSelectedBatch(batch);
                                    setShowEditBatchModal(true);
                                  }}
                                >
                                  <MaterialIcons name="edit" size={16} color="#2563eb" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  className="bg-orange-100 p-2 rounded-lg"
                                  onPress={() => handleArchiveBatchPress(batch)}
                                >
                                  <MaterialIcons name="archive" size={16} color="#c2410c" />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>

                          {/* HARVEST RECORDS TOGGLE */}
                          <TouchableOpacity
                            onPress={() => toggleBatchHarvests(batch.docId)}
                            className="flex-row items-center mt-2"
                          >
                            <Text className="text-green-700 text-[10px] font-semibold mr-1">
                              {harvestsExpanded ? "Hide harvests" : "View harvests"}
                            </Text>
                            <Ionicons
                              name={harvestsExpanded ? "chevron-up" : "chevron-down"}
                              size={12}
                              color="#15803d"
                            />
                          </TouchableOpacity>

                          {harvestsExpanded && (
                            <View className="mt-2 pl-2 border-l-2 border-gray-200">
                              {harvests.length === 0 && (
                                <Text className="text-gray-400 text-[10px] py-1">
                                  No harvest records yet
                                </Text>
                              )}
                              {harvests.map((h) => (
                                <View
                                  key={h.docId}
                                  className="flex-row items-center justify-between py-1"
                                >
                                  <Text className="text-gray-600 text-[10px]">
                                    {formatDate(h.harvestDate)} · {h.quantity} {product.unit}{" "}
                                    ({h.remainingQuantity} left)
                                  </Text>
                                  {user?.role === "farmer" && (
                                    <TouchableOpacity
                                      onPress={() => handleDeleteHarvest(batch.docId, h)}
                                    >
                                      <MaterialIcons name="delete-outline" size={14} color="#dc2626" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* ARCHIVED BATCHES */}
                    {archivedBatches.length > 0 && (
                      <View className="mt-1">
                        <Text className="text-gray-400 text-[10px] font-semibold uppercase mb-1">
                          Archived Batches
                        </Text>
                        {viewMode === "archived" && (
                          <Text className="text-gray-400 text-[10px] mb-2 italic">
                            Naka-archive ang buong produktong ito, kaya naka-lock din ang mga
                            batch nito. I-unarchive muna ang produkto (button sa itaas) bago
                            maka-unarchive ng kahit anong batch.
                          </Text>
                        )}
                        {archivedBatches.map((batch) => (
                          <View
                            key={batch.docId}
                            className="bg-gray-50 rounded-xl p-3 mb-2 opacity-60"
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="font-semibold text-gray-500 text-xs">
                                  Batch {String(batch.batchNumber).padStart(3, "0")} (archived)
                                </Text>
                                <Text className="text-gray-400 text-xs mt-0.5">
                                  {formatDate(batch.weekStart)} – {formatDate(batch.weekEnd)}
                                </Text>
                              </View>

                              {/* MAHALAGA: "viewMode === active" ang tanging
                                  basehan dito - HINDI ang archivedViaProduct
                                  flag. Kung naka-archive pa rin ang BUONG
                                  PRODUCT (viewMode === "archived"), hinding-
                                  hindi dapat lumabas ang per-batch Unarchive,
                                  kahit anong klaseng batch archive iyon
                                  (cascade man o manual) - dahil kung hindi,
                                  puwedeng maka-unarchive ng isang batch
                                  habang naka-hide/archived pa rin ang
                                  product na kinabibilangan nito, na siyang
                                  dating bug. Kapag viewMode === "active",
                                  ibig sabihin normal-operation, ang mga
                                  archived batch na makikita dito ay laging
                                  yung sadyang in-archive nang hiwalay ng
                                  farmer (dahil ang cascade-archived batches
                                  ay laging sumasabay sa product - bumabalik
                                  sila kapag in-unarchive ang product). */}
                              {user?.role === "farmer" && viewMode === "active" && (
                                <TouchableOpacity
                                  className="bg-green-100 px-3 py-1.5 rounded-lg"
                                  onPress={() => handleUnarchiveBatch(batch)}
                                >
                                  <Text className="text-green-700 text-[10px] font-semibold">
                                    Unarchive
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* MODALS */}
      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
        loading={uploading}
        farmerId={user?.uid}
        farmerName={user?.fullName}
        farmName={user?.farmName}
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

      <EditBatchModal
        visible={showEditBatchModal}
        batch={selectedBatch}
        onClose={() => setShowEditBatchModal(false)}
        onSave={handleSaveBatch}
        loading={savingBatch}
      />

      <DeleteProductModal
        visible={showDeleteModal}
        product={selectedProduct}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        loading={deleting}
      />

      <RecordSaleModal
        visible={showRecordSaleModal}
        product={selectedProduct}
        onClose={() => setShowRecordSaleModal(false)}
        onConfirm={handleRecordSale}
        loading={recordingSale}
      />
    </View>
  );
};

export default Product;