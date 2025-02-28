import { createClient } from '@supabase/supabase-js';
import { Service, CreateServiceInput, UpdateServiceInput } from '../types/service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const getServices = async (category?: string): Promise<Service[]> => {
  try {
    console.log(`Fetching services${category ? ` for category: ${category}` : ''}`);
    
    // Build the URL with query parameters
    let url = `${supabaseUrl}/rest/v1/services?select=*&order=name`;
    if (category) {
      url += `&category=eq.${encodeURIComponent(category)}`;
    }
    
    // Use direct fetch with proper headers to avoid 406 errors
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching services: ${response.status} ${response.statusText}`);
      
      // If we get a 406 error, try an alternative approach
      if (response.status === 406) {
        console.log('Attempting alternative fetch method for services due to 406 error');
        return await fetchServicesAlternative(category);
      }
      
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} services`);
    
    return data;
  } catch (error) {
    console.error('Error in getServices:', error);
    throw error;
  }
};

// Alternative fetch method if the main one fails with 406
const fetchServicesAlternative = async (category?: string): Promise<Service[]> => {
  try {
    console.log(`Using alternative fetch method for services${category ? ` for category: ${category}` : ''}`);
    
    // Build the URL with query parameters
    let url = `${supabaseUrl}/rest/v1/services?select=*&order=name`;
    if (category) {
      url += `&category=eq.${encodeURIComponent(category)}`;
    }
    
    // Try a simpler fetch with minimal headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Alternative fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetchServicesAlternative:', error);
    throw error;
  }
};

export const getService = async (id: string): Promise<Service> => {
  try {
    console.log(`Fetching service with ID: ${id}`);
    
    // Use direct fetch with proper headers to avoid 406 errors
    const response = await fetch(`${supabaseUrl}/rest/v1/services?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching service: ${response.status} ${response.statusText}`);
      
      // If we get a 406 error, try an alternative approach
      if (response.status === 406) {
        console.log('Attempting alternative fetch method for service due to 406 error');
        return await fetchServiceAlternative(id);
      }
      
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error(`Service not found with ID: ${id}`);
    }

    console.log(`Successfully fetched service: ${data[0].name}`);
    return data[0];
  } catch (error) {
    console.error('Error in getService:', error);
    throw error;
  }
};

// Alternative fetch method if the main one fails with 406
const fetchServiceAlternative = async (id: string): Promise<Service> => {
  try {
    console.log(`Using alternative fetch method for service with ID: ${id}`);
    
    // Try a simpler fetch with minimal headers
    const response = await fetch(`${supabaseUrl}/rest/v1/services?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Alternative fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error(`Service not found with ID: ${id} (alternative method)`);
    }
    
    return data[0];
  } catch (error) {
    console.error(`Failed with alternative fetch for service (${id}):`, error);
    throw error;
  }
};

export const createService = async (service: CreateServiceInput): Promise<Service> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
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
    const { id, ...serviceData } = service;
    
    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', id)
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