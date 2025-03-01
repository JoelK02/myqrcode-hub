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