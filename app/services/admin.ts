import { createClient } from '@supabase/supabase-js';
import { Order } from '../types/order';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Admin {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface OrderCompletion {
  id: string;
  order_id: string;
  admin_id: string;
  completed_at: string;
  notes?: string;
  created_at: string;
  admin?: Admin;
  order?: Order;
}

export interface CompleteOrderInput {
  order_id: string;
  admin_id: string;
  completed_at?: string;
  notes?: string;
}

/**
 * Get all admins for the current user
 */
export async function getAdmins(): Promise<Admin[]> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return [];
    }
    
    // Get admins that belong to this user
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('Error fetching admins:', error);
      throw new Error('Failed to fetch admins');
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getAdmins:', err);
    return [];
  }
}

/**
 * Get an admin by ID (only if it belongs to the current user)
 */
export async function getAdmin(id: string): Promise<Admin | null> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Only get admin if it belongs to this user
      .single();
    
    if (error) {
      console.error('Error fetching admin:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in getAdmin:', err);
    return null;
  }
}

/**
 * Complete an order with admin information
 */
export async function completeOrder(input: CompleteOrderInput): Promise<OrderCompletion> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication required');
    }
    
    // Verify that the admin belongs to this user
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', input.admin_id)
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminData) {
      console.error('Error verifying admin:', adminError);
      throw new Error('Admin not found or not authorized');
    }
    
    // First update the order status to completed
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', input.order_id);
    
    if (orderError) {
      console.error('Error updating order status:', orderError);
      throw new Error('Failed to update order status');
    }
    
    // Then create the order completion record
    const { data, error } = await supabase
      .from('order_completions')
      .insert({
        order_id: input.order_id,
        admin_id: input.admin_id,
        completed_at: input.completed_at || new Date().toISOString(),
        notes: input.notes
      })
      .select('*, admin:admins(*)')
      .single();
    
    if (error) {
      console.error('Error creating order completion:', error);
      throw new Error('Failed to create order completion');
    }
    
    return data;
  } catch (err) {
    console.error('Error in completeOrder:', err);
    throw err;
  }
}

/**
 * Get order completion details (only for admins belonging to the current user)
 */
export async function getOrderCompletion(orderId: string): Promise<OrderCompletion | null> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    // First get all admins belonging to the current user
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id);
    
    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      return null;
    }
    
    if (!admins || admins.length === 0) {
      return null;
    }
    
    // Get admin IDs
    const adminIds = admins.map(admin => admin.id);
    
    // Now get the order completion for this order, but only if completed by one of the user's admins
    const { data, error } = await supabase
      .from('order_completions')
      .select('*, admin:admins(*)')
      .eq('order_id', orderId)
      .in('admin_id', adminIds)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching order completion:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in getOrderCompletion:', err);
    return null;
  }
}

/**
 * Create a new admin
 */
export async function createAdmin(admin: Omit<Admin, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Admin | null> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('admins')
      .insert([{ ...admin, user_id: user.id }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating admin:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createAdmin:', error);
    return null;
  }
}

/**
 * Update an admin
 */
export async function updateAdmin(admin: Partial<Admin> & { id: string }): Promise<Admin | null> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    // First check if the admin belongs to this user
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('id', admin.id)
      .eq('user_id', user.id)
      .single();
      
    if (checkError || !existingAdmin) {
      console.error('Admin not found or not owned by this user');
      return null;
    }
    
    // Remove user_id from the update payload if it exists
    const { user_id, ...updateData } = admin;
    
    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', admin.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating admin:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateAdmin:', error);
    return null;
  }
}

/**
 * Delete an admin
 */
export async function deleteAdmin(id: string): Promise<boolean> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error deleting admin:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteAdmin:', error);
    return false;
  }
}

/**
 * Get all completed orders with admin details for the current user
 */
export async function getCompletedOrdersByUser(): Promise<OrderCompletion[]> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return [];
    }
    
    // Get buildings that belong to the current user
    const { data: userBuildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id')
      .eq('user_id', user.id);
    
    if (buildingsError) {
      console.error('Error fetching user buildings:', buildingsError);
      return [];
    }
    
    // Extract building IDs
    const buildingIds = userBuildings.map(building => building.id);
    
    if (buildingIds.length === 0) {
      console.log('User has no buildings');
      return [];
    }
    
    // First get all admins belonging to the current user
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id);
    
    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      return [];
    }
    
    if (!admins || admins.length === 0) {
      return [];
    }
    
    // Get admin IDs
    const adminIds = admins.map(admin => admin.id);
    
    // Fetch completed orders for these admins and for orders in the user's buildings
    const { data, error } = await supabase
      .from('order_completions')
      .select(`
        *,
        admin:admins(*),
        order:orders(*)
      `)
      .in('admin_id', adminIds)
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching completed orders:', error);
      return [];
    }
    
    // Filter out orders that don't belong to the user's buildings
    const filteredData = data?.filter(completion => 
      completion.order && buildingIds.includes(completion.order.building_id)
    ) || [];
    
    return filteredData;
  } catch (err) {
    console.error('Error in getCompletedOrdersByUser:', err);
    return [];
  }
}