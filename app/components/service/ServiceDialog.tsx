import React, { useEffect, useState } from 'react';
import { Service, CreateServiceInput, UpdateServiceInput } from '../../types/service';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client for building data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple interface for building options
interface BuildingOption {
  id: string;
  name: string;
}

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  service?: Service;
  title: string;
  defaultBuildingId?: string | null;
}

export function ServiceDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  service, 
  title,
  defaultBuildingId
}: ServiceDialogProps) {
  const [formData, setFormData] = useState<CreateServiceInput>({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    category: 'housekeeping',
    is_available: true,
    building_id: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);

  // Fetch buildings list
  useEffect(() => {
    async function fetchBuildings() {
      if (!isOpen) return;
      
      try {
        setBuildingsLoading(true);
        const { data, error } = await supabase
          .from('buildings')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setBuildings(data || []);
      } catch (err) {
        console.error('Error fetching buildings:', err);
      } finally {
        setBuildingsLoading(false);
      }
    }
    
    fetchBuildings();
  }, [isOpen]);

  useEffect(() => {
    if (service) {
      // If editing an existing service
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        is_available: service.is_available,
        building_id: service.building_id
      });
    } else {
      // If creating a new service, use default values and defaultBuildingId if provided
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 60,
        category: 'housekeeping',
        is_available: true,
        building_id: defaultBuildingId || undefined
      });
    }
  }, [service, isOpen, defaultBuildingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: isChecked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      building_id: value ? value : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const submitData = service 
        ? { ...formData, id: service.id } 
        : formData;
      
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      console.error('Error submitting service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Service Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter service name"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="housekeeping">Housekeeping</option>
                  <option value="spa">Spa</option>
                  <option value="concierge">Concierge</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              {/* Building selector */}
              <div>
                <label htmlFor="building_id" className="block text-sm font-medium mb-1">
                  Building
                </label>
                <select
                  id="building_id"
                  name="building_id"
                  value={formData.building_id || ''}
                  onChange={handleBuildingChange}
                  className="w-full p-2 border rounded-md"
                  disabled={buildingsLoading}
                >
                  <option value="">-- Not associated with any building --</option>
                  {buildings.map(building => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which building this service is available in
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-1">
                    Price ($) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter service description"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="is_available"
                  name="is_available"
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_available" className="ml-2 block text-sm">
                  Available for booking
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}