export type OrderProduct = {
  productId: string;

  name: string;

  image: string;

  price: number;

  quantity: number;

  unit: string,
};

export type OrderType = {
  id?: string;

  buyerId: string;

  buyerName: string;

  farmerId: string;

  farmName: string;

  products: OrderProduct[];

  delivery: "pickup" | "delivery";

  payment: "qr" | "cod";

  pickupDate?: string | null;

  pickupTime?: string | null;

  address: string;

  subTotal: number;

  deliveryFee: number;

  total: number;

  status: string;

  createdAt?: any;
};