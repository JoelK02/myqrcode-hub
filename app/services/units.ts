import { createClient } from '@supabase/supabase-js';
import { Unit, CreateUnitInput, UpdateUnitInput } from '../types/units';
import { generateAndUploadQRCode } from './qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUnits(buildingId?: string): Promise<Unit[]> {
  try {
    let query = supabase
      .from('units')
      .select('*')
      .order('unit_number');
    
    if (buildingId) {
      query = query.eq('building_id', buildingId);
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

export async function getUnit(id: string): Promise<Unit> {
  try {
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
  } catch (error) {
    console.error('Error in getUnit:', error);
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