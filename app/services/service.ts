import { createClient } from '@supabase/supabase-js';
import { Service, CreateServiceInput, UpdateServiceInput } from '../types/service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const getServices = async (category?: string, building_id?: string): Promise<Service[]> => {
  try {
    // Guest mode - if building_id is provided, we don't need to check user auth
    // This allows guests viewing the services to see items without logging in
    if (building_id) {
      let query = supabase
        .from('services')
        .select('*')
        .eq('building_id', building_id)
        .order('name');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching services:', error);
        throw new Error(error.message);
      }

      return data || [];
    }
    
    // Admin mode - get user's buildings and filter services
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Failed to get current user: ${userError.message}`);
    }
    
    if (!user) {
      console.warn('No authenticated user found');
      return [];
    }
    
    // Get the buildings owned by this user
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
      .from('services')
      .select('*')
      .in('building_id', userBuildingIds)
      .order('name');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching services:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getServices:', error);
    throw error;
  }
};

export const getService = async (id: string): Promise<Service> => {
  try {
    // First get the service
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching service:', error);
      throw new Error(error.message);
    }
    
    // For admin operations, check if this belongs to user's building
    if (id && typeof window !== 'undefined') {
      // Check if we're in admin mode (not the order page)
      const isAdminMode = !window.location.pathname.startsWith('/order');
      
      if (isAdminMode) {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Verify this service belongs to a building owned by the user
          const { data: buildingCheck } = await supabase
            .from('buildings')
            .select('id')
            .eq('id', data.building_id)
            .eq('user_id', user.id)
            .single();
            
          if (!buildingCheck) {
            throw new Error('You do not have permission to access this service');
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in getService:', error);
    throw error;
  }
};

export const createService = async (service: CreateServiceInput): Promise<Service> => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to create a service');
    }
    
    // Check if the building belongs to the user
    if (service.building_id) {
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', service.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to add services to this building');
      }
    }
    
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error in createService:', error);
    throw error;
  }
};

export const updateService = async (service: UpdateServiceInput): Promise<Service> => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to update a service');
    }
    
    // Get the service's building_id first
    const { data: existingService } = await supabase
      .from('services')
      .select('building_id')
      .eq('id', service.id)
      .single();
      
    if (existingService && existingService.building_id) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingService.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to update this service');
      }
    }
    
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', service.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateService:', error);
    throw error;
  }
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to delete a service');
    }
    
    // Get the service's building_id first
    const { data: existingService } = await supabase
      .from('services')
      .select('building_id')
      .eq('id', id)
      .single();
      
    if (existingService && existingService.building_id) {
      // Check if the building belongs to the user
      const { data: buildingCheck } = await supabase
        .from('buildings')
        .select('id')
        .eq('id', existingService.building_id)
        .eq('user_id', user.id)
        .single();
        
      if (!buildingCheck) {
        throw new Error('You do not have permission to delete this service');
      }
    }
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteService:', error);
    throw error;
  }
}; 