import { createClient } from '@supabase/supabase-js';
import { Service, CreateServiceInput, UpdateServiceInput } from '../types/service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const getServices = async (category?: string): Promise<Service[]> => {
  try {
    let query = supabase
      .from('services')
      .select('*')
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
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching service:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getService:', error);
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