export type CreateProductInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  freshness: string;
  unit: string;
  status: string;
  description: string;
  image: string;
  imagePublicId: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  rating: number;
  
  totalSales: number;
  weeklySales: number;
  monthlySales: number;

  createdAt: number;
};
export type ProductType = CreateProductInput & {
  docId: string;
};