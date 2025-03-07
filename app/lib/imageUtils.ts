import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Bucket name for image storage
export const IMAGE_BUCKET = 'food_images';

/**
 * Validates an image file
 * @param file The file to validate
 * @param maxSizeInMB Maximum size in MB (default 2MB)
 * @returns A validation result object
 */
export function validateImage(file: File, maxSizeInMB = 2): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'The selected file is not an image' };
  }
  
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { valid: false, error: `Image must be less than ${maxSizeInMB}MB` };
  }
  
  return { valid: true };
}

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param folder The folder to upload to (defaults to 'general')
 * @returns The public URL if successful, null otherwise
 */
export async function uploadImage(
  file: File, 
  folder = 'general'
): Promise<string | null> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      if (error.message.includes('security') || error.message.includes('permission')) {
        console.error('Permission error uploading image. Make sure you have storage permissions:', error);
        throw new Error('You do not have permission to upload images. Please contact an administrator.');
      } else {
        console.error('Error uploading image:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(filePath);
    
    console.log('Image uploaded successfully to:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    if (error instanceof Error) {
      throw error; // Re-throw the error with our custom message
    }
    return null;
  }
}

/**
 * Deletes an image from Supabase storage
 * @param url The public URL of the image to delete
 * @returns true if successful, false otherwise
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Remove the bucket name and leading slash from the path
    const bucketPrefix = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    if (!path.startsWith(bucketPrefix)) {
      return false;
    }
    
    const filePath = path.substring(bucketPrefix.length);
    
    // Delete the file
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
} 