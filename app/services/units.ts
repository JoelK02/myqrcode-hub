import { createClient } from '@supabase/supabase-js';
import { Unit, CreateUnitInput, UpdateUnitInput } from '../types/units';
import { generateAndUploadQRCode } from './qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUnits(buildingId?: string): Promise<Unit[]> {
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
    
    // First, get the list of buildings owned by this user
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
      .from('units')
      .select('*')
      .in('building_id', userBuildingIds)
      .order('unit_number');
    
    if (buildingId) {
      // If a specific building is requested, verify it belongs to the user
      if (userBuildingIds.includes(buildingId)) {
        query = query.eq('building_id', buildingId);
      } else {
        console.warn(`Building ${buildingId} does not belong to user ${user.id}`);
        return [];
      }
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch units: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    return data;
  } catch (error) {
    console.error('Error in getUnits:', error);
    throw error;
  }
}

export async function getUnit(id: string, guestMode: boolean = false): Promise<Unit> {
  try {
    // Guest mode - skip authentication checks for order page (QR code access)
    if (guestMode) {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    }
    
    // Admin mode - require authentication and verify ownership
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to view unit details');
    }
    
    // Get the user's buildings
    const { data: userBuildings } = await supabase
      .from('buildings')
      .select('id')
      .eq('user_id', user.id);
      
    const userBuildingIds = userBuildings?.map(b => b.id) || [];
    
    // Get the unit and verify it belongs to one of the user's buildings
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Check if this unit belongs to one of the user's buildings
    if (!userBuildingIds.includes(data.building_id)) {
      throw new Error('You do not have permission to access this unit');
    }

    return data;
  } catch (error) {
    console.error('Error in getUnit:', error);
    throw error;
  }
}

export async function createUnit(unit: CreateUnitInput): Promise<Unit> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to create a unit');
    }
    
    // Check if the building belongs to the user
    const { data: buildingData, error: buildingError } = await supabase
      .from('buildings')
      .select('id')
      .eq('id', unit.building_id)
      .eq('user_id', user.id)
      .single();
      
    if (buildingError || !buildingData) {
      throw new Error('You do not have permission to add units to this building');
    }
    
    console.log('[Unit Debug] Creating new unit:', unit);
    // First create the unit without QR code
    const { data, error } = await supabase
      .from('units')
      .insert([unit])
      .select()
      .single();

    if (error) {
      console.error('[Unit Debug] Supabase error creating unit:', error);
      throw error;
    }

    console.log('[Unit Debug] Unit created successfully:', data);

    // Now generate and assign QR code
    try {
      console.log('[Unit Debug] Starting QR code generation for unit:', data.id);
      const qrCodeUrl = await generateAndUploadQRCode(
        data.id,
        data.unit_number,
        data.building_id
      );
      
      console.log('[Unit Debug] QR code generated, URL:', qrCodeUrl);
      
      // Update the unit with the QR code URL
      console.log('[Unit Debug] Updating unit with QR code URL');
      const { data: updatedData, error: updateError } = await supabase
        .from('units')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', data.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[Unit Debug] Error updating unit with QR code:', updateError);
        // Still return the unit even if QR code assignment fails
        return data;
      }
      
      console.log('[Unit Debug] Unit updated with QR code URL successfully:', updatedData);
      return updatedData;
    } catch (qrError) {
      console.error('[Unit Debug] Error generating QR code:', qrError);
      // Return the unit without QR code if generation fails
      return data;
    }
  } catch (error) {
    console.error('[Unit Debug] Error in createUnit:', error);
    throw error;
  }
}

export async function updateUnit(unit: UpdateUnitInput): Promise<Unit> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to update a unit');
    }
    
    // Get the unit's building_id first
    const { data: existingUnit } = await supabase
      .from('units')
      .select('building_id')
      .eq('id', unit.id)
      .single();
      
    if (existingUnit) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingUnit.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to update this unit');
      }
    }
    
    const { data, error } = await supabase
      .from('units')
      .update(unit)
      .eq('id', unit.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUnit:', error);
    throw error;
  }
}

export async function deleteUnit(id: string): Promise<void> {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete a unit');
    }
    
    // Get the unit's building_id first
    const { data: existingUnit } = await supabase
      .from('units')
      .select('building_id')
      .eq('id', id)
      .single();
      
    if (existingUnit) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingUnit.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to delete this unit');
      }
    }
    
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteUnit:', error);
    throw error;
  }
} 