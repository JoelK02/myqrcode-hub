import { createClient } from '@supabase/supabase-js';
import { MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from '../types/menu';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getMenuItems(category?: string, building_id?: string): Promise<MenuItem[]> {
  try {
    // Guest mode - if building_id is provided, we don't need to check user auth
    // This allows guests viewing the menu to see items without logging in
    if (building_id) {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('building_id', building_id)
        .order('name');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch menu items: ${error.message}`);
      }

      return data || [];
    }
    
    // Admin mode - get user's buildings and filter items
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Failed to get current user: ${userError.message}`);
    }
    
    if (!user) {
      console.warn('No authenticated user found');
      return [];
    }
    
    // Get the buildings owned by this user
    const { data: userBuildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id')
      .eq('user_id', user.id);
      
    if (buildingsError) {
      console.error('Supabase error fetching buildings:', buildingsError);
      throw new Error(`Failed to fetch user buildings: ${buildingsError.message}`);
    }
    
    const userBuildingIds = userBuildings?.map(b => b.id) || [];
    
    if (userBuildingIds.length === 0) {
      return [];
    }
    
    let query = supabase
      .from('menu_items')
      .select('*')
      .in('building_id', userBuildingIds)
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
    // First get the menu item
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // For admin operations, check if this belongs to user's building
    if (id && typeof window !== 'undefined') {
      // Check if we're in admin mode (not the order page)
      const isAdminMode = !window.location.pathname.startsWith('/order');
      
      if (isAdminMode) {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Verify this menu item belongs to a building owned by the user
          const { data: buildingCheck } = await supabase
            .from('buildings')
            .select('id')
            .eq('id', data.building_id)
            .eq('user_id', user.id)
            .single();
            
          if (!buildingCheck) {
            throw new Error('You do not have permission to access this menu item');
          }
        }
      }
    }

    return data;
  } catch (error) {
    console.error('Error in getMenuItem:', error);
    throw error;
  }
}

export async function createMenuItem(menuItem: CreateMenuItemInput): Promise<MenuItem> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to create a menu item');
    }
    
    // Check if the building belongs to the user
    if (menuItem.building_id) {
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', menuItem.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to add menu items to this building');
      }
    }
    
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
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to update a menu item');
    }
    
    // Get the menu item's building_id first
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('building_id')
      .eq('id', menuItem.id)
      .single();
      
    if (existingItem && existingItem.building_id) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingItem.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to update this menu item');
      }
    }
    
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
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete a menu item');
    }
    
    // Get the menu item's building_id first
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('building_id')
      .eq('id', id)
      .single();
      
    if (existingItem && existingItem.building_id) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingItem.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to delete this menu item');
      }
    }
    
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