export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: 'housekeeping' | 'spa' | 'concierge' | 'maintenance';
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'housekeeping' | 'spa' | 'concierge' | 'maintenance';
  is_available: boolean;
}

export interface UpdateServiceInput extends CreateServiceInput {
  id: string;
} 