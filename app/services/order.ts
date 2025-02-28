import { createClient } from '@supabase/supabase-js';
import { Order, CreateOrderInput, UpdateOrderStatusInput, OrderItem } from '../types/order';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getOrders(filters?: {
  unit_id?: string;
  building_id?: string;
  status?: string;
}): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (filters) {
      if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id);
      }
      if (filters.building_id) {
        query = query.eq('building_id', filters.building_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data as Order[];
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "No rows found"
        return null;
      }
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data as Order;
  } catch (error) {
    console.error('Error in getOrder:', error);
    throw error;
  }
}

export async function createOrder(orderInput: CreateOrderInput): Promise<Order> {
  try {
    // Start a Supabase transaction (not a real transaction, but a sequence of operations)
    
    // 1. Calculate total amount
    const totalAmount = orderInput.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // 2. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        unit_id: orderInput.unit_id,
        unit_number: orderInput.unit_number,
        building_id: orderInput.building_id,
        building_name: orderInput.building_name,
        total_amount: totalAmount,
        notes: orderInput.notes,
        status: 'pending'
      })
      .select('*')
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }
    
    // 3. Create order items
    const orderItems = orderInput.items.map(item => ({
      order_id: order.id,
      item_type: item.item_type,
      item_id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes
    }));
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select('*');
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Attempt to clean up the order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
    
    // 4. Return the full order with items
    return {
      ...order,
      order_items: items as OrderItem[]
    };
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

export async function updateOrderStatus(updateInput: UpdateOrderStatusInput): Promise<Order> {
  try {
    const { id, status } = updateInput;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        order_items:order_items(*)
      `)
      .single();
    
    if (error) {
      console.error('Error updating order status:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
    
    return data as Order;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    // No need to delete order items explicitly due to CASCADE constraint
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting order:', error);
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    throw error;
  }
} 