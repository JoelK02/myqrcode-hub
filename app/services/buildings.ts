import { createClient } from '@supabase/supabase-js';
import { Building, CreateBuildingInput, UpdateBuildingInput } from '../types/buildings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getBuildings(): Promise<Building[]> {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
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

export async function getBuilding(id: string): Promise<Building> {
  try {
    console.log(`Fetching building with ID: ${id}`);
    
    // Use direct fetch API with proper headers to avoid 406 errors
    const response = await fetch(`${supabaseUrl}/rest/v1/buildings?id=eq.${id}&limit=1`, {
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
      console.error(`Error fetching building: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch building: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Building data received:', data);
    
    if (!data || data.length === 0) {
      throw new Error(`Building with ID ${id} not found`);
    }

    return data[0];
  } catch (error) {
    console.error('Error in getBuilding:', error);
    throw error;
  }
}

export async function createBuilding(building: CreateBuildingInput): Promise<Building> {
  const { data, error } = await supabase
    .from('buildings')
    .insert([building])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBuilding(building: UpdateBuildingInput): Promise<Building> {
  const { data, error } = await supabase
    .from('buildings')
    .update(building)
    .eq('id', building.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBuilding(id: string): Promise<void> {
  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
} 