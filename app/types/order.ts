export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'menu' | 'service';
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  unit_id: string;
  unit_number: string;
  building_id: string;
  building_name?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string;
  order_items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  unit_id: string;
  unit_number: string;
  building_id: string;
  building_name?: string;
  notes?: string;
  items: {
    item_type: 'menu' | 'service';
    item_id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
}

export interface UpdateOrderStatusInput {
  id: string;
  status: Order['status'];
} 