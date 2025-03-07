import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  notifications: boolean;
}

/**
 * Get the user's profile with notification preferences
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    // Fetch the user's profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      
      // If no profile exists, create one with default settings
      if (error.code === 'PGRST116') { // No rows returned
        return createUserProfile(user.id);
      }
      
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    return null;
  }
}

/**
 * Create a user profile with default settings
 */
async function createUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const newProfile = {
      id: userId,
      notifications: true,
    };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error in createUserProfile:', error);
    return null;
  }
}

/**
 * Update the user's notification preferences
 */
export async function updateNotificationPreference(enabled: boolean): Promise<boolean> {
  try {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    // Update the user's profile
    const { error } = await supabase
      .from('user_profiles')
      .update({ notifications: enabled })
      .eq('id', user.id);
    
    if (error) {
      console.error('Error updating notification preference:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in updateNotificationPreference:', error);
    return false;
  }
} 