import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { Unit, UpdateUnitInput } from '../types/units';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Base URL for the guest ordering page
const getBaseOrderUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side execution
    const origin = window.location.origin;
    return `${origin}/order`;
  }
  // Server-side execution (Next.js SSR)
  // Use environment variable or default for production, or use localhost for development
  return process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.0.104:3000/order';
};

// Generate a QR code data URL 
export async function generateQRCodeDataUrl(unitId: string): Promise<string> {
  try {
    const orderUrl = `${getBaseOrderUrl()}?unit=${unitId}`;
    
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
export async function generateAndUploadQRCode(unitId: string, unitNumber: string, buildingId: string): Promise<string> {
  try {
    console.log(`[QR Debug] Starting QR code generation for unit: ${unitId}, building: ${buildingId}`);
    const orderUrl = `${getBaseOrderUrl()}?unit=${unitId}`;
    console.log(`[QR Debug] Generated order URL: ${orderUrl}`);
    
    // Generate QR code as data URL instead of buffer
    const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    console.log(`[QR Debug] QR code data URL generated successfully (truncated): ${qrCodeDataUrl.substring(0, 50)}...`);
    
    // Convert data URL to File object for upload
    const blob = await (await fetch(qrCodeDataUrl)).blob();
    const file = new File([blob], `unit-${unitId}.png`, { type: 'image/png' });
    console.log(`[QR Debug] Created File object for upload: ${file.name}, size: ${file.size} bytes`);
    
    // Check if bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('[QR Debug] Error listing buckets:', bucketsError);
      } else {
        console.log('[QR Debug] Available buckets:', buckets.map(b => b.name).join(', '));
        const bucketExists = buckets.some(bucket => bucket.name === 'qrcodes');
        console.log(`[QR Debug] Bucket 'qrcodes' exists: ${bucketExists}`);
        
        if (!bucketExists) {
          console.error('[QR Debug] The qrcodes bucket does not exist in your Supabase storage!');
          // Try to create the bucket
          try {
            const { data, error } = await supabase.storage.createBucket('qrcodes', { public: true });
            console.log('[QR Debug] Attempted to create qrcodes bucket:', data, error);
          } catch (createError) {
            console.error('[QR Debug] Failed to create bucket:', createError);
          }
        }
      }
    } catch (bucketCheckError) {
      console.error('[QR Debug] Error checking buckets:', bucketCheckError);
    }
    
    // Upload the QR code to Supabase Storage
    console.log(`[QR Debug] Attempting to upload to path: units/${buildingId}/${unitId}.png`);
    
    // Make sure the path exists
    try {
      // Create folders structure if needed
      const folderPath = `units/${buildingId}`;
      console.log(`[QR Debug] Creating folder path: ${folderPath}`);
    } catch (folderError) {
      console.error('[QR Debug] Error with folder:', folderError);
    }
    
    const { data, error } = await supabase.storage
      .from('qrcodes')
      .upload(`units/${buildingId}/${unitId}.png`, file, {
        upsert: true,
        contentType: 'image/png',
      });
    
    if (error) {
      console.error('[QR Debug] Error uploading QR code:', error);
      throw new Error(`Failed to upload QR code: ${error.message}`);
    }
    
    console.log('[QR Debug] Upload successful:', data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('qrcodes')
      .getPublicUrl(`units/${buildingId}/${unitId}.png`);
    
    console.log('[QR Debug] Generated public URL:', urlData.publicUrl);
    
    // Verify the URL by checking if it returns a valid response
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log(`[QR Debug] URL verification status: ${response.status}`);
    } catch (verifyError) {
      console.warn('[QR Debug] Could not verify URL:', verifyError);
    }
    
    return urlData.publicUrl;
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