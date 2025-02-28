import { createClient } from '@supabase/supabase-js';
import { MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from '../types/menu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  try {
    console.log(`Fetching menu items${category ? ` for category: ${category}` : ''}`);
    
    // Build the URL with query parameters
    let url = `${supabaseUrl}/rest/v1/menu_items?select=*&order=name`;
    if (category) {
      url += `&category=eq.${encodeURIComponent(category)}`;
    }
    
    // Use direct fetch with proper headers to avoid 406 errors
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching menu items: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch menu items: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} menu items`);
    
    return data;
  } catch (error) {
    console.error('Error in getMenuItems:', error);
    throw error;
  }
}

export async function getMenuItem(id: string): Promise<MenuItem> {
  try {
    console.log(`Fetching menu item with ID: ${id}`);
    
    // Use direct fetch with proper headers to avoid 406 errors
    const response = await fetch(`${supabaseUrl}/rest/v1/menu_items?id=eq.${id}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching menu item: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch menu item: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    console.log(`Successfully fetched menu item: ${data[0].name}`);
    return data[0];
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