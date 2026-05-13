export interface Customer {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  billing_day: number;
  created_at: string;
}

export interface DeliveryNote {
  id: number;
  customer_id: number;
  delivery_number: string;
  delivery_date: string;
  receiver: string | null;
  created_at: string;
  customer?: Customer;
  items?: DeliveryItem[];
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  seq: number;
  order_number: string | null;
  material_code: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  notes: string | null;
}

export interface BillingSummary {
  customer_id: number;
  customer_name: string;
  period_start: string;
  period_end: string;
  items: (DeliveryItem & {
    delivery_number: string;
    delivery_date: string;
  })[];
  total: number;
}
