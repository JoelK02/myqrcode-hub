import { createClient } from '@supabase/supabase-js';
import { MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from '../types/menu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  try {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('name');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch menu items: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    return data;
  } catch (error) {
    console.error('Error in getMenuItems:', error);
    throw error;
  }
}

export async function getMenuItem(id: string): Promise<MenuItem> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getMenuItem:', error);
    throw error;
  }
}

export async function createMenuItem(menuItem: CreateMenuItemInput): Promise<MenuItem> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([menuItem])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createMenuItem:', error);
    throw error;
  }
}

export async function updateMenuItem(menuItem: UpdateMenuItemInput): Promise<MenuItem> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(menuItem)
      .eq('id', menuItem.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateMenuItem:', error);
    throw error;
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteMenuItem:', error);
    throw error;
  }
} 