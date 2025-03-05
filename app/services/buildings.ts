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
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) {
    throw error;
  }
} 