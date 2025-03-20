import { createClient } from '@supabase/supabase-js';
import { Building, CreateBuildingInput, UpdateBuildingInput } from '../types/buildings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getBuildings(): Promise<Building[]> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Failed to get current user: ${userError.message}`);
    }
    
    if (!user) {
      console.warn('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch buildings: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    return data;
  } catch (error) {
    console.error('Error in getBuildings:', error);
    throw error;
  }
}

export async function getBuilding(id: string, guestMode: boolean = false): Promise<Building> {
  try {
    // Guest mode - skip authentication for order page (QR code access)
    if (guestMode) {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    }
    
    // Admin mode - require authentication and verify ownership
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBuilding:', error);
    throw error;
  }
}

export async function createBuilding(building: CreateBuildingInput): Promise<Building> {
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a building');
  }
  
  // Add the user_id to the building data
  const buildingWithUserId = {
    ...building,
    user_id: user.id
  };
  
  const { data, error } = await supabase
    .from('buildings')
    .insert([buildingWithUserId])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBuilding(building: UpdateBuildingInput): Promise<Building> {
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('buildings')
    .update(building)
    .eq('id', building.id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBuilding(id: string): Promise<void> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete a building');
    }
    
    // First, check if there are any menu items associated with this building
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('building_id', id);
      
    if (menuError) {
      console.error('Error checking menu items:', menuError);
      throw new Error(`Failed to check menu items: ${menuError.message}`);
    }
    
    // If there are menu items, update them to remove the building association
    if (menuItems && menuItems.length > 0) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ building_id: null })
        .eq('building_id', id);
        
      if (updateError) {
        console.error('Error updating menu items:', updateError);
        throw new Error(`Failed to update menu items: ${updateError.message}`);
      }
    }
    
    // Also check for services associated with this building
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('building_id', id);
      
    if (servicesError) {
      console.error('Error checking services:', servicesError);
      throw new Error(`Failed to check services: ${servicesError.message}`);
    }
    
    // If there are services, update them to remove the building association
    if (services && services.length > 0) {
      const { error: updateServicesError } = await supabase
        .from('services')
        .update({ building_id: null })
        .eq('building_id', id);
        
      if (updateServicesError) {
        console.error('Error updating services:', updateServicesError);
        throw new Error(`Failed to update services: ${updateServicesError.message}`);
      }
    }
    
    // Now delete the building
    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBuilding:', error);
    throw error;
  }
} 