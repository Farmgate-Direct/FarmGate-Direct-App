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
    "Sitaw (String Beans)",
    "Kalabasa (Squash)",
    "Repolyo (Cabbage)",
    "Pechay",
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
    "Banana (Saging)",
    "Mango (Mangga)",
    "Papaya",
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
    "Chicken Egg (Itlog ng Manok)",
    "Duck Egg (Itlog ng Pato)",
    "Quail Egg (Itlog ng Pugo)",
    "Native Chicken (Manok)",
    "Broiler Chicken",
    "Duck (Itik)",
  ],
  "Rice & Grains": [
    "White Rice (Bigas)",
    "Brown Rice",
    "Red Rice",
    "Glutinous Rice (Malagkit)",
    "Corn (Mais)",
    "Corn Grits",
  ],
};

// Ginagamit para siguraduhing pareho ang product kahit magkaiba ng
// spacing/letter case ang naka-store na "name" (safety net lang,
// dahil galing na sa fixed dropdown ang value).
export const normalizeProductName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");