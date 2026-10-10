// src/constants/productCatalog.ts
//
// Fixed na listahan ng product names per category. Ginagamit ito sa
// "Add Product" dropdown para hindi na mag-type ang farmer ng pangalan
// (para maiwasan ang duplicate na product dahil lang sa magkaibang
// spelling, letter case, o extra spaces - ex. "Eggplant" vs "eggplant "
// vs "EGGPLANT").
//
// Kung may kulang na product dito, dagdagan na lang ang array ng
// kaukulang category - hindi na kailangang galawin ang ibang parte
// ng app.

export const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Egg & Poultry",
  "Rice & Grains",
] as const;

export type ProductCategoryKey = (typeof CATEGORIES)[number];

export const PRODUCT_CATALOG: Record<ProductCategoryKey, string[]> = {
  Vegetables: [
    "Eggplant (Talong)",
    "Tomato (Kamatis)",
    "Okra",
    "Ampalaya (Bitter Gourd)",
    "Pole Sitaw (String Beans)",
    "Bush Sitaw",
    "Baguio Beans (Habichuelas)",
    "Kalabasa (Squash)",
    "Repolyo (Cabbage)",
    "Pechay Baguio",
    "Native Pechay (Tagalog)",
    "Sibuyas (Onion)",
    "Bawang (Garlic)",
    "Luya (Ginger)",
    "Patatas (Potato)",
    "Carrots",
    "Labanos (Radish)",
    "Kangkong",
    "Malunggay",
    "Sayote",
    "Upo (Bottle Gourd)",
    "Patola (Sponge Gourd)",
    "Sili (Chili Pepper)",
  ],
  Fruits: [
    "Banana Lakatan",
    "Banana Latundan",
    "Banana Saba",
    "Mango Carabao",
    "Mango Pico",
    "Mango Indian",
    "Mango Apple",
    "Mango Paho",
    "Papaya",
    "Pomelo",
    "Melon",
    "Pineapple (Pinya)",
    "Watermelon (Pakwan)",
    "Calamansi",
    "Guava (Bayabas)",
    "Rambutan",
    "Lanzones",
    "Durian",
    "Avocado",
    "Dalandan",
    "Jackfruit (Langka)",
    "Star Apple (Kaimito)",
    "Santol",
  ],
  "Egg & Poultry": [
    "Chicken Egg White Pewee (Itlog ng Manok)",
    "Chicken Egg White Extra Small (Itlog ng Manok)",
    "Chicken Egg White Small (Itlog ng Manok)",
    "Chicken Egg White Medium (Itlog ng Manok)",
    "Chicken Egg White Large (Itlog ng Manok)",
    "Chicken Egg White Extra Large (Itlog ng Manok)",
    "Chicken Egg White Jumbo (Itlog ng Manok)",
    "Chicken Egg Brown Medium (Itlog ng Manok)",
    "Chicken Egg Brown Large (Itlog ng Manok)",
    "Chicken Egg Brown Extra Large (Itlog ng Manok)",
    "Duck Egg Small (Itlog ng Pato)",
    "Duck Egg Medium (Itlog ng Pato)",
    "Duck Egg Large (Itlog ng Pato)",
    "Duck Egg Extra Large (Itlog ng Pato)",
    "Duck Egg Jumbo (Itlog ng Pato)",
    "Itik Egg Small (Itlog ng Itik)",
    "Itik Egg Medium (Itlog ng Itik)",
    "Itik Egg Large (Itlog ng Itik)",
    "Itik Egg Extra Large (Itlog ng Itik)",
    "Itik Egg Jumbo (Itlog ng Itik)",
    "Quail Egg (Itlog ng Pugo)",
    "Native Chicken (Manok)",
    "Broiler Chicken",
  ],
  "Rice & Grains": [
    "White Rice (Bigas)",
    "Brown Rice",
    "Red Rice",
    "Glutinous Rice (Malagkit)",
    "White Corn",
    "Yellow Corn (Sweet Corn)",
    "White Corn Grits",
    "Yellow Corn Grits",
  ],
};

// Ginagamit para siguraduhing pareho ang product kahit magkaiba ng
// spacing/letter case ang naka-store na "name" (safety net lang,
// dahil galing na sa fixed dropdown ang value).
export const normalizeProductName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

// ============================================================
// CANONICAL KEY (para sa DA price lookup)
// ============================================================
//
// "Eggplant (Talong)" -> "eggplant"
// "Chicken Egg (Itlog ng Manok)" -> "chicken egg"
// "White Rice (Bigas)" -> "white rice"
//
// Tinatanggal ang parenthetical (Tagalog name) para mag-match
// sa DA reference table keys.

export const toCanonicalKey = (name: string): string | null => {
  if (!name) return null;

  const base = name.split("(")[0].trim().toLowerCase().replace(/\s+/g, " ");

  return base || null;
};

// ============================================================
// UNITS
// ============================================================
//
// - Default: "per kg" lang (tinanggal na ang "per pcs").
// - Egg & Poultry category: "half tray" at "per tray" lang
//   (tinanggal na ang "per kg" sa egg at poultry).

const EGG_PRODUCT_PREFIXES = ["chicken egg", "duck egg", "quail egg", "itik egg"];

export const isEggProduct = (productName: string): boolean => {
  const key = toCanonicalKey(productName);
  if (key === null) return false;
  // Prefix-match para kasama ang per-size entries
  // (ex. "chicken egg white large"). Hindi nito nadadamay ang
  // "duck" (Itik) dahil buong "duck egg " ang hinahanap.
  return EGG_PRODUCT_PREFIXES.some(
    (prefix) => key === prefix || key.startsWith(prefix + " ")
  );
};

export const getUnitsForProduct = (
  category: ProductCategoryKey,
  _productName?: string
): string[] => {
  // Egg & Poultry — walang "per kg", tray units lang para sa
  // egg at poultry (half tray / per tray).
  if (category === "Egg & Poultry") {
    return ["half tray", "per tray"];
  }

  return ["per kg"];
};