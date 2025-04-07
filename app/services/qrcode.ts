import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { Unit, UpdateUnitInput } from '../types/units';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Base URL for the guest ordering page
const getBaseOrderUrl = () => {
  try {
    // First prioritize environment variable
    if (process.env.NEXT_PUBLIC_APP_URL) {
      // Remove any trailing slash to ensure consistent URL formatting
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL.endsWith('/')
        ? process.env.NEXT_PUBLIC_APP_URL.slice(0, -1)
        : process.env.NEXT_PUBLIC_APP_URL;
      
      console.log(`[URL Debug] Using NEXT_PUBLIC_APP_URL: ${baseUrl}/order`);
      return `${baseUrl}/order`;
    }
    
    // Fall back to client-side origin detection only if env var isn't available
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      console.log(`[URL Debug] Using window.location.origin: ${origin}/order`);
      return `${origin}/order`;
    }
    
    // Last resort fallback
    console.log('[URL Debug] Using hardcoded fallback URL');
    return 'https://myqrcode-hub.vercel.app/order';
  } catch (error) {
    // In case of any errors, return the fallback URL
    console.error('[URL Debug] Error in getBaseOrderUrl:', error);
    return 'https://myqrcode-hub.vercel.app/order';
  }
};

// Generate a QR code data URL 
export async function generateQRCodeDataUrl(unitId: string, sessionId?: string): Promise<string> {
  try {
    let orderUrl = `${getBaseOrderUrl()}?unit=${unitId}`;
    
    // Add session ID to the URL if provided
    if (sessionId) {
      orderUrl += `&session=${sessionId}`;
    }
    
    console.log(`[QR Debug] Generated order URL for data URL: ${orderUrl}`);
    
    // Generate QR code data URL
    const dataUrl = await QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate a QR code and upload to Supabase storage
export async function generateAndUploadQRCode(
  unitId: string, 
  unitNumber: string, 
  buildingId: string,
  sessionId?: string
): Promise<string> {
  try {
    console.log(`[QR Debug] Starting QR code generation for unit: ${unitId}, building: ${buildingId}`);
    
    // Create the order URL, including session ID if provided
    let orderUrl = `${getBaseOrderUrl()}?unit=${unitId}`;
    if (sessionId) {
      orderUrl += `&session=${sessionId}`;
      console.log(`[QR Debug] Including session ID in URL: ${sessionId}`);
    }
    
    console.log(`[QR Debug] Generated order URL: ${orderUrl}`);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    console.log(`[QR Debug] QR code data URL generated successfully`);
    
    // WORKAROUND: Due to RLS issues with storage, we'll just return the data URL directly
    // This skips the storage upload step but provides a working QR code
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[QR Debug] Error generating or uploading QR code:', error);
    throw new Error('Failed to generate or upload QR code');
  }
}

// Assign a QR code to a unit
export async function assignQRCodeToUnit(unitId: string): Promise<Unit> {
  try {
    // Get unit details
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single();
    
    if (unitError) {
      console.error('Error getting unit:', unitError);
      throw new Error(`Failed to get unit: ${unitError.message}`);
    }
    
    // Generate and upload QR code
    const qrCodeUrl = await generateAndUploadQRCode(unit.id, unit.unit_number, unit.building_id);
    
    // Update unit with QR code URL
    const updateData: UpdateUnitInput = {
      id: unitId,
      qr_code_url: qrCodeUrl
    };
    
    const { data: updatedUnit, error: updateError } = await supabase
      .from('units')
      .update({ qr_code_url: qrCodeUrl })
      .eq('id', unitId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating unit:', updateError);
      throw new Error(`Failed to update unit: ${updateError.message}`);
    }
    
    return updatedUnit;
  } catch (error) {
    console.error('Error assigning QR code to unit:', error);
    throw error;
  }
} 