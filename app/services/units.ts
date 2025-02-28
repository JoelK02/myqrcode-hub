import { createClient } from '@supabase/supabase-js';
import { Unit, CreateUnitInput, UpdateUnitInput } from '../types/units';
import { generateAndUploadQRCode } from './qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUnits(buildingId?: string): Promise<Unit[]> {
  try {
    console.log(`Fetching units${buildingId ? ` for building: ${buildingId}` : ''}`);
    
    // Build the URL with query parameters
    let url = `${supabaseUrl}/rest/v1/units?select=*&order=unit_number`;
    if (buildingId) {
      url += `&building_id=eq.${encodeURIComponent(buildingId)}`;
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

    // Log the response status for debugging
    console.log(`Units fetch response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Error fetching units: ${response.status} ${response.statusText}`);
      
      // If we get a 406 error, try an alternative approach
      if (response.status === 406) {
        console.log('Attempting alternative fetch method for units due to 406 error');
        return await fetchUnitsAlternative(buildingId);
      }
      
      throw new Error(`Failed to fetch units: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} units`);
    
    return data;
  } catch (error) {
    console.error('Error in getUnits:', error);
    throw error;
  }
}

// Alternative fetch method if the main one fails with 406
async function fetchUnitsAlternative(buildingId?: string): Promise<Unit[]> {
  try {
    console.log(`Using alternative fetch method for units${buildingId ? ` for building: ${buildingId}` : ''}`);
    
    // Build the URL with query parameters
    let url = `${supabaseUrl}/rest/v1/units?select=*&order=unit_number`;
    if (buildingId) {
      url += `&building_id=eq.${encodeURIComponent(buildingId)}`;
    }
    
    // Try a simpler fetch with minimal headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Alternative fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetchUnitsAlternative:', error);
    throw error;
  }
}

export async function getUnit(id: string): Promise<Unit> {
  try {
    console.log(`Fetching unit with ID: ${id}`);
    
    // Use direct fetch API with proper headers and limit parameter
    const response = await fetch(`${supabaseUrl}/rest/v1/units?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        // Explicitly set Accept header to avoid 406 errors
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    // Log the full response for debugging
    console.log(`Unit fetch response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`Error fetching unit: ${response.status} ${response.statusText}`);
      
      // If we get a 406 error, try an alternative approach
      if (response.status === 406) {
        console.log('Attempting alternative fetch method for unit due to 406 error');
        return await fetchUnitAlternative(id);
      }
      
      throw new Error(`Failed to fetch unit: ${response.status} ${response.statusText}`);
    }
    
    const units = await response.json();
    console.log(`Received data for unit query:`, units);
    
    if (!units || units.length === 0) {
      console.error(`Unit not found with ID: ${id}`);
      throw new Error(`Unit not found with ID: ${id}`);
    }
    
    return units[0];
  } catch (error) {
    console.error(`Failed to fetch unit (${id}):`, error);
    throw error;
  }
}

// Alternative fetch method if the main one fails with 406
async function fetchUnitAlternative(id: string): Promise<Unit> {
  try {
    console.log(`Using alternative fetch method for unit with ID: ${id}`);
    
    // Try a simpler fetch with minimal headers
    const response = await fetch(`${supabaseUrl}/rest/v1/units?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Alternative fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const units = await response.json();
    
    if (!units || units.length === 0) {
      throw new Error(`Unit not found with ID: ${id} (alternative method)`);
    }
    
    return units[0];
  } catch (error) {
    console.error(`Failed with alternative fetch for unit (${id}):`, error);
    throw error;
  }
}

export async function createUnit(unit: CreateUnitInput): Promise<Unit> {
  try {
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